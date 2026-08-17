// In-memory stand-in for the Cloudflare R2 binding, mirroring
// tests/d1-shim.mjs: real endpoint logic, real assertions, no
// Cloudflare account required.
//
// It implements exactly the surface functions/_lib/lms/recording-storage.js
// uses — put/get/head/delete/list plus the multipart trio — and it
// enforces the two R2 rules that actually bite in production, rather
// than accepting anything and letting the real bucket be the first
// thing to say no:
//
//   1. complete() rejects a part list with a gap or a bad etag.
//   2. every part except the last must be at least MIN_PART_SIZE.
//
// A shim that is more permissive than the real service tests nothing
// where it matters — that is precisely how the missing Authorization
// header survived a green browser suite (see tests/browser/lab-auth.mjs).
//
// What it is NOT: evidence that real R2 works. Conditional writes,
// storage classes, lifecycle rules and genuine durability are untested
// from here and disclosed as such in tests/README.md.

const MIN_PART_SIZE = 5 * 1024 * 1024;

export function makeR2() {
  const objects = new Map();   // key -> { body: Uint8Array, contentType, uploaded }
  const uploads = new Map();   // uploadId -> { key, contentType, parts: Map<number, Uint8Array> }
  let uploadSeq = 0;

  const toBytes = async (body) => {
    if (body == null) return new Uint8Array(0);
    if (body instanceof Uint8Array) return body;
    if (body instanceof ArrayBuffer) return new Uint8Array(body);
    if (typeof body === 'string') return new TextEncoder().encode(body);
    // A ReadableStream, which is what the real endpoint passes through
    // from request.body — drained here the way R2 would.
    if (typeof body.getReader === 'function') {
      const reader = body.getReader();
      const chunks = [];
      let total = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value); total += value.length;
      }
      const out = new Uint8Array(total);
      let at = 0;
      for (const c of chunks) { out.set(c, at); at += c.length; }
      return out;
    }
    throw new Error('r2-shim: unsupported body type ' + typeof body);
  };

  const wrap = (key, rec, range) => {
    let bytes = rec.body;
    let outRange = null;
    if (range && Number.isInteger(range.offset)) {
      const start = range.offset;
      const length = range.length ?? (bytes.length - start);
      bytes = bytes.slice(start, start + length);
      outRange = { offset: start, length: bytes.length };
    }
    return {
      key,
      size: rec.body.length,          // the OBJECT's size, not the slice's — same as R2
      httpMetadata: { contentType: rec.contentType },
      range: outRange,
      body: bytes,
      arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
      text: async () => new TextDecoder().decode(bytes),
    };
  };

  function multipart(key, uploadId) {
    return {
      uploadId,
      async uploadPart(partNumber, body) {
        const up = uploads.get(uploadId);
        if (!up) throw new Error('r2-shim: no such multipart upload ' + uploadId);
        const bytes = await toBytes(body);
        up.parts.set(partNumber, bytes);
        return { partNumber, etag: `etag-${uploadId}-${partNumber}-${bytes.length}` };
      },
      async complete(parts) {
        const up = uploads.get(uploadId);
        if (!up) throw new Error('r2-shim: no such multipart upload ' + uploadId);
        const ordered = [...parts].sort((a, b) => a.partNumber - b.partNumber);
        for (let i = 0; i < ordered.length; i++) {
          if (ordered[i].partNumber !== i + 1) throw new Error('r2-shim: part list has a gap at ' + (i + 1));
          const held = up.parts.get(ordered[i].partNumber);
          if (!held) throw new Error('r2-shim: part ' + ordered[i].partNumber + ' was never uploaded');
          const expected = `etag-${uploadId}-${ordered[i].partNumber}-${held.length}`;
          if (ordered[i].etag !== expected) throw new Error('r2-shim: etag mismatch on part ' + ordered[i].partNumber);
          if (i < ordered.length - 1 && held.length < MIN_PART_SIZE) {
            throw new Error('r2-shim: part ' + ordered[i].partNumber + ' is below the 5 MiB minimum for a non-final part');
          }
        }
        const total = ordered.reduce((n, p) => n + up.parts.get(p.partNumber).length, 0);
        const merged = new Uint8Array(total);
        let at = 0;
        for (const p of ordered) { const b = up.parts.get(p.partNumber); merged.set(b, at); at += b.length; }
        objects.set(key, { body: merged, contentType: up.contentType, uploaded: new Date() });
        uploads.delete(uploadId);
        return { key, size: merged.length, etag: `etag-${uploadId}-complete` };
      },
      async abort() { uploads.delete(uploadId); },
    };
  }

  return {
    async put(key, body, opts = {}) {
      const bytes = await toBytes(body);
      objects.set(key, { body: bytes, contentType: opts.httpMetadata?.contentType || null, uploaded: new Date() });
      return { key, size: bytes.length };
    },
    async get(key, opts = {}) {
      const rec = objects.get(key);
      return rec ? wrap(key, rec, opts.range) : null;
    },
    async head(key) {
      const rec = objects.get(key);
      return rec ? { key, size: rec.body.length, httpMetadata: { contentType: rec.contentType } } : null;
    },
    async delete(key) { objects.delete(key); },
    async list({ prefix = '' } = {}) {
      return { objects: [...objects.keys()].filter((k) => k.startsWith(prefix)).map((k) => ({ key: k, size: objects.get(k).body.length })) };
    },
    async createMultipartUpload(key, opts = {}) {
      const uploadId = `mpu-${++uploadSeq}`;
      uploads.set(uploadId, { key, contentType: opts.httpMetadata?.contentType || null, parts: new Map() });
      return multipart(key, uploadId);
    },
    resumeMultipartUpload(key, uploadId) { return multipart(key, uploadId); },

    // Test-only introspection.
    __objectCount: () => objects.size,
    __openUploads: () => uploads.size,
    __raw: (key) => objects.get(key)?.body ?? null,
  };
}

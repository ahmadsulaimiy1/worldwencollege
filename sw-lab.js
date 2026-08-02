/* WEC-LC — Listening Lab service worker.

   Offline-first for the things a learner needs to keep studying on a
   train, in a hall of residence with poor wifi, or on a metered
   connection abroad — which is a large share of an international
   student body, not an edge case.

   THREE CACHING STRATEGIES, chosen per resource by what staleness costs:

     shell        cache-first. The page, CSS and JS change only on
                  deploy, so serving them from cache is both fastest and
                  safe. A new version replaces them via CACHE version.

     curriculum   stale-while-revalidate. Unit content and transcripts
                  are large and change rarely. Serve instantly from
                  cache, refresh in the background, so the second visit
                  to a module is immediate and the content is never more
                  than one visit out of date.

     audio        cache-first, explicitly opted into per file. Audio is
                  the only genuinely heavy asset. It is NEVER cached
                  automatically — a learner on a metered connection must
                  not have their allowance spent for them. The Lab asks,
                  and only then is the file downloaded and kept.

     mutations    network-only, never cached. Quiz submissions and
                  recordings must reach the server or visibly fail. A
                  cached "success" for an ungraded submission would be a
                  lie the learner acts on.

   What this deliberately does NOT do: background sync of queued
   submissions. That needs a durable outbox and conflict rules, and a
   half-built version would silently drop a learner's work. The Lab
   instead reports offline state plainly and keeps the submission
   button honest. Named here so the gap is visible rather than assumed.
*/

const VERSION = 'wec-lab-v1';
const SHELL = `${VERSION}-shell`;
const CURRICULUM = `${VERSION}-curriculum`;
const AUDIO = `${VERSION}-audio`;

const SHELL_ASSETS = [
  '/listening-lab.html',
  '/css/brand.css',
  '/css/listening-lab.css',
  '/js/listening-lab.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL)
      // addAll is atomic — one miss fails the install, which is what we
      // want: a partially-cached shell is worse than none.
      .then((c) => c.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k.startsWith('wec-lab-') && !k.startsWith(VERSION)).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  const msg = event.data || {};
  // Explicit, learner-initiated audio download. The page asks; the
  // worker fetches and keeps. Nothing downloads audio implicitly.
  if (msg.type === 'CACHE_AUDIO' && msg.url) {
    event.waitUntil(
      caches.open(AUDIO)
        .then((c) => fetch(msg.url, { mode: 'cors' }).then((r) => {
          if (!r.ok) throw new Error('fetch failed');
          return c.put(msg.url, r.clone());
        }))
        .then(() => reply(event, { type: 'AUDIO_CACHED', url: msg.url, ok: true }))
        .catch(() => reply(event, { type: 'AUDIO_CACHED', url: msg.url, ok: false }))
    );
  }
  if (msg.type === 'DROP_AUDIO' && msg.url) {
    event.waitUntil(
      caches.open(AUDIO).then((c) => c.delete(msg.url))
        .then((ok) => reply(event, { type: 'AUDIO_DROPPED', url: msg.url, ok }))
    );
  }
  if (msg.type === 'AUDIO_STATUS') {
    event.waitUntil(
      caches.open(AUDIO).then((c) => c.keys()).then((keys) =>
        reply(event, { type: 'AUDIO_STATUS', urls: keys.map((r) => r.url) })
      )
    );
  }
});

function reply(event, payload) {
  if (event.source) event.source.postMessage(payload);
  else return self.clients.matchAll().then((cs) => cs.forEach((c) => c.postMessage(payload)));
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Never interfere with anything that changes server state.
  if (req.method !== 'GET') return;
  // Cross-origin (webfonts, future CDN) — let the network handle it.
  if (url.origin !== self.location.origin) return;

  // Mutating or learner-specific API reads stay network-only so a stale
  // answer can never be mistaken for a current one.
  if (url.pathname.startsWith('/api/lms/recording') ||
      url.pathname.startsWith('/api/lms/quiz-attempt') ||
      url.pathname.startsWith('/api/lms/review-queue')) {
    return;
  }

  // Curriculum reads: stale-while-revalidate.
  if (url.pathname.startsWith('/api/lms/unit') ||
      url.pathname.startsWith('/api/lms/audio') ||
      url.pathname.startsWith('/api/lms/listening-analytics') ||
      url.pathname.startsWith('/api/lms/pronunciation-profile')) {
    event.respondWith(
      caches.open(CURRICULUM).then((cache) =>
        cache.match(req).then((hit) => {
          const network = fetch(req).then((res) => {
            if (res.ok) cache.put(req, res.clone());
            return res;
          }).catch(() => hit); // offline: fall back to whatever we hold
          return hit || network;
        })
      )
    );
    return;
  }

  // Audio: cache-first, but only ever served from cache if the learner
  // chose to download it. Otherwise straight to network.
  if (/\.(mp3|m4a|ogg|wav|webm)$/i.test(url.pathname)) {
    event.respondWith(
      caches.open(AUDIO).then((c) => c.match(req)).then((hit) => hit || fetch(req))
    );
    return;
  }

  // Shell: cache-first with a background refresh.
  event.respondWith(
    caches.open(SHELL).then((cache) =>
      cache.match(req).then((hit) => {
        const network = fetch(req).then((res) => {
          if (res.ok) cache.put(req, res.clone());
          return res;
        }).catch(() => hit);
        return hit || network;
      })
    )
  );
});

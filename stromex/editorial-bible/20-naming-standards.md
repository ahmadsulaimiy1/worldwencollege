# Volume 20 — Naming Standards

*Names are the cheapest thing to get right and the most expensive thing to
change. The estate has already paid for one naming failure that silently
removed an institutional control (`SEB §8.3`).*

---

## §20.1 The naming veto gate applies to everything named `[OBSERVED]`

`SEB §8.2` governs institutions, products, sub-brands **and** technical
names: repositories, services, databases, buckets, queues and environments
all carry the institution's name into places third parties can see.

## §20.2 One transliteration, one spelling, forever `[OBSERVED]`

`SEB §8.3`. Chosen once, invariant across every surface, language, file
name, database row, certificate, domain and email address. **A second
spelling is a second entity.**

## §20.3 Resource naming `[RULED — confidence High]`

Every provider resource created by or for the estate is named so that its
owner, project and environment are recoverable **from the provider console
alone**, without a lookup:

```
<org>-<project>-<component>-<environment>
```

- `shrs-portal-db-production` · `shrs-portal-db-preview`
- `wec-lc-recordings` · `wec-lc-kyc-documents`
- `stromex-mcp-audit`

Rules:

- Lower-case, hyphen-separated, ASCII only. No spaces, no underscores in
  externally-visible names, no capital letters.
- **The environment is in the name, always.** The estate's most dangerous
  possible mistake — running a destructive operation against production
  while believing it is staging — is made much harder by a name that
  cannot be misread.
- **Never a name that only says what it is** (`db`, `bucket`, `worker`).
  A provider account holds many projects; a generic name is an invitation
  to act on the wrong one.
- A resource holding institutional records carries a token that the
  protected-resource patterns match (`SEB §26.1`): `student`,
  `certificate`, `transcript`, `registrar`, `audit`, or the project prefix
  of an institution.

## §20.4 Code naming `[RULED — confidence High]`

- **Say the domain, not the mechanism.** `approveCertificateIssue`, not
  `handlePost2`. `protectedResources`, not `blacklist`.
- **Booleans read as assertions**: `isEnforced`, `hasApproval`,
  `requiresBackup`.
- **Functions with side effects are verbs**; pure derivations are nouns or
  `xFromY`.
- **No abbreviations that a new reader must look up**, except the
  institution's own established codes (`REG`, `PRIN`, `MUH`, `QC-OFF`,
  `IQ-02`), which are the vocabulary of the domain and should be used.
- **Never `data`, `info`, `manager`, `helper`, `util`** as the whole name
  of anything.

## §20.5 Identity is an id, never a rendered name `[OBSERVED]`

The estate's most expensive naming lesson (`SHRS role-permission-matrix
§3`): two offices recorded under two spellings of one person's name were
read as two people, and a documented two-person control ceased to exist
for an entire institution without anyone noticing.

**Binding.**

- Every person, institution, class, subject and role is referenced by an
  **id**. Names are display values.
- Separation-of-duties checks compare **ids**, never names or hand-typed
  reference numbers (`SEB §9.4`).
- A name change is a display change and never affects a relationship.

## §20.6 Tool and API naming `[RULED — confidence High]`

For the MCP and any API the estate publishes:

```
<provider|domain>.<resource>.<verb>
```

`cloudflare.worker.deploy` · `neon.branch.create` ·
`stromex.audit.verify` · `registrar.certificate.request`

- Verbs are drawn from a **closed set**: `list get create update delete
  deploy rollback run verify send approve revoke archive export`.
- **The verb tells the authority class.** `delete` is always `protected`;
  `archive` and `revoke` are always `write`. A reader should be able to
  guess the class from the name and be right.
- Names are stable. A renamed tool is a new tool and the old one is
  deprecated with a date, never silently replaced.

## §20.7 Reference numbers `[OBSERVED]`

`<ORG>-<TYPE>-<YEAR>-<sequence>` — `SHR-HFZ-2026-000001`
(`SEB §12.3`). Generated server-side, at approval time, zero-padded to a
width that will not be exhausted, and **never reused**, including after a
revocation.

Archive accessions use the same shape: `SHRS-A-YYYY-NNN`, "permanent,
never reused" (`SHRS archive-governance §2`).

## §20.8 Branch, environment and file naming `[RULED — confidence High]`

- Branches: `<kind>/<short-description>` — `feat/`, `fix/`, `docs/`,
  `chore/`, or the host's own convention where one is imposed.
- Environments: exactly `local`, `preview`, `production`. No synonyms —
  "staging" and "preview" naming the same thing in different documents is
  how a deployment goes to the wrong place.
- Documentation files: `NN-kebab-case-title.md`, numbered where order
  carries meaning, as the estate's own `docs/` directories already do.
- Migrations: `NNNN-verb-object.sql`, sequential, never renumbered.

## §20.9 Names that must never appear `[OBSERVED]`

- A person's name as a database key, a bucket name, or a branch name.
- A credential, a token fragment, or a fingerprint of one, anywhere in a
  name.
- A model or vendor identifier in a commit message, a pull request, a code
  comment or any artefact pushed to a repository.
- `test`, `tmp`, `new`, `old`, `final`, `v2` as a permanent name for
  anything.

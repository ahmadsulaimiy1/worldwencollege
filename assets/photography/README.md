# Photography

The photographs are **consented**. The Founder has confirmed that the people
in them are his friends, that they are aware, and that they wish to appear.
That settles the question that mattered — nothing here is published about
anyone who did not agree to it.

Two things still hold, and they are about accuracy rather than permission:

1. **A caption never makes a claim the College cannot support.** A photograph
   of a majlis is captioned as a majlis. It is not captioned as *the College's
   Academic Council*, or as a class, or as a graduation, unless it is one.
   `EB §3.1` — a recorded fact, a published rule, or a stated estimate, and
   nothing published as a class it does not belong to.
2. **Every file is entered in `licence-register.tsv` before it ships** —
   filename, who took it, who is in it, and the date consent was given. That
   register is the College's own record; it is what makes "they agreed"
   answerable a year from now when nobody remembers the conversation.

---

## How a photograph gets onto the site

Photographs cannot be added from a chat message: an image in a conversation is
pixels, not a file, and this machine's network policy blocks fetching one from
a link. It has to arrive **in the repository**. Two ways:

**From a browser, no tools needed —**
`github.com/ahmadsulaimiy1/worldwencollege` → `assets/photography/` →
**Add file → Upload files** → drop the images in → make sure the branch is
`claude/abisulaimiycollege-data-extraction-6b66sm` → Commit.

Vercel redeploys on that commit, and they are live in about a minute.

**From a machine with the repository —** `git add`, commit, push.

Either way, **the filename is the only instruction**. Rename each photograph to
the slot it belongs in, from the table below, and it appears — art-directed,
tinted into the palette, lazy-loaded, in both the English and the Arabic tree,
with the caption already written. No page is edited. No code is touched.

`.jpg`, `.jpeg`, `.png`, `.webp` and `.avif` are all recognised.

---

## The slots, and which of your photographs each is for

| Filename | Ratio | Appears on | Which one |
|---|---|---|---|
| `majlis-01` | 3:2 | About → Method of instruction | The formal majlis, the seated circle |
| `gathering-01` | 3:2 | About → Governance | The large reception |
| `study-01` | 4:5 | Home → The College | At the library shelves |
| `study-02` | 3:2 | Faculties | Between the stacks |
| `dress-01` | 4:5 | About → The Name | The kandura, the cuff and the trim |
| `things-01` | 4:5 | Admission → Applying | The flat-lay: thobe, ghutrah, misbaḥah, ʿūd |

A slot with no file **renders nothing at all** — no broken image, no grey box,
no reserved gap, no 404 in the console. `scripts/build-madinah.js` checks the
filesystem before it writes the tag, and reports at the end of every build
which photographs it is still waiting for. That is why the slots could be
written into the pages before a single photograph existed.

## Adding a slot that is not in the table

Write a token where you want it, in both trees:

```
{{PHOTO:name|3x2|The caption, which is also the alt text.}}
```

Ratios: `4x5`, `3x2`, `sq`.

## The treatment

Every photograph is gradient-mapped toward the palette — navy into the
shadows, champagne into the highlights, saturation eased back — with a gold
rim and the house radius. Under the pointer it recovers its own colour: the
reader gets the photograph, the page keeps the palette. That treatment is why
pictures taken by six different people on six different phones will read as
one commission rather than as a collection.

# Book asset pack

Hardcoded content for the 7 Primer books. One folder per book, slug-named. The blueprint reads these JSON files directly; the PDFs stand in for what object storage will serve in Phase 2+ (gated). Formal spec: `grounds/premise/specs/books-and-versions.md`.

## Books

| slug | author | editor | total pp | editions |
|---|---|---|---|---|
| `bion-attention` | Уилфред Р. Бион | — | 212 | free + v1–v4 |
| `bion-learning` | Уилфред Р. Бион | — | 324 | free + v1–v5 |
| `ferro-cabinet` | Антонино Ферро | — | 367 | free + v1–v5 |
| `ferro-emotions` | Антонино Ферро | — | 323 | free + v1–v5 |
| `nicoli-anger` | Лука Николи | — | 208 | free + v1–v4 |
| `nicoli-burning` | (сборник) | Лука Николи | 260 | free + v1–v4 |
| `nicoli-patients` | Лука Николи | — | 40 | free + v1–v2 |

## Per-book layout

```
<slug>/
├── meta.json        index: slug, titles, author, source_file, total_pages,
│                    covers{small,medium,large}, free_edition{pages,pdf}, editions[], toc_entry_count
├── book-card.json   book-card UI payload: title/subtitle/author/editor/year/publisher/
│                    language/pages/genre/tags/description/short_description/isbn
├── chapters.json    TOC: [{level, number, title, page, description}] — rich per-chapter blurb
├── citations.json   pull-quotes: [{id, text, page, theme[], use_for}]
├── covers/          cover-small.jpg · cover-medium.jpg · cover-large.jpg
├── editions/        free/ + v1/ … vN/  — each holds <slug>-<ver>.pdf
└── raw/             source text: citation-source.txt, excerpt.txt, toc.json (provenance, not shipped to UI)
```

## How pages consume it

- **Catalogue / Library cards, Book card** — `book-card.json` + `covers/` (size by context: small=grid, medium=card, large=book page hero).
- **Book page** — `book-card.json` (metadata, description, tags, ISBN) + `chapters.json` (TOC with descriptions) + `meta.editions` (version picker; `is_complete` marks the full edition) + `citations.json` (themed quotes).
- **Reader** — `editions/<ver>/<slug>-<ver>.pdf`. The **free** edition (≈17 pp preview) is the ungated sample; `v1…vN` are the synthetic progressive version corpus (each a larger page range; last is `is_complete: true`) that exercises the version UI and citations bound to a version.
- **Citations across the site** — `citations.json[].use_for` routes a quote to a surface: `homepage` (landing hero), `news` (blog/news), `social` (community/discussion), `announcement` (banners/posters). `theme[]` enables topical selection.

`raw/` is source/provenance only — pages never read it.

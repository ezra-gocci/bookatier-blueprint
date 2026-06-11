# Stitch raw export — staging inbox

Unreviewed Stitch output lands here. Nothing in `_inbox/` is approved.
Review happens against `grounds/briefs/ui-ux-workflow.md` Part A §3 + the
`stitch-prompt-pack.md` review checklist. Approved screens are **promoted**
out of here:

- approved HTML/CSS → `code/blueprint/<slug>/`  (the blueprint seed)
- approved frame PNG → `code/blueprint/frames/<slug>.png`  (review trail)

Once a screen is promoted (or rejected), delete its `_inbox/` folder.
`_inbox/` is temporary scaffolding — empty by design lock.

## Convention

Each screen is a single flat file: `_inbox/<slug>.html` — downloaded from Stitch.

---

## Screen catalogue

Fetched from Stitch project **"Russian Literary UI System"** (`projects/12653497052605436046`),
Pass 1 + extended screens. All unreviewed as of import.

### Core screens (Pass 1 — from `stitch-prompt-pack.md`)

| slug | Stitch title | Route | Description |
|---|---|---|---|
| `home-anon` | Главная — Bookatier (Гость) | `/` | Anonymous landing page. Hero with positioning line and «Запросить доступ» CTA, 3 book cards, topic tiles, community teaser, value props, about section, inline access-request form. |
| `home-auth` | Главная — Bookatier (Кабинет) | `/` | Logged-in personal home. Greeting, resume-reading cards with progress, bookmarks, community activity feed, reading stats. ⚠ Note: rendering may show user-card layout — needs review. |
| `catalog-v1` | Каталог — Bookatier | `/catalog` | Catalogue grid (v1). Search + sort toolbar, book cards with covers, topic chips, ratings, a «Продолжить» in-progress marker, filter drawer open on the right. |
| `catalog-v2` | Каталог — Bookatier | `/catalog` | Catalogue (v2). Alternative layout or iteration — compare against v1 and keep one. |
| `book-ferro` | Избегание эмоций — Антонино Ферро | `/book/izbeganie-emotsiy` | Book detail page for Ferro. Cover + metadata left, tab bar (Обзор · Оценка · Комментарии · Отзывы · Реквизиты), annotation, TOC, excerpt, review preview, requisites hint. |
| `reader` | Ридер: Невидимая архитектура | `/book/nevid-arkhitektura/read` | Reader in light theme. Top bar with book title + version label, rendered page, text selection toolbar with citation/note/bookmark actions, left sidebar (TOC · Закладки · Заметки), Aa settings popover, citation popover, progress bar. |
| `user-profile` | Профиль: Александр Воронов | `/u/<slug>` | Public user profile. Header with avatar, name, specialisation, role, reputation pill. Sections: read books, favourites, activity feed. Empty-state example included. |

### Pass 2 screens (overlays, extra surfaces)

| slug | Stitch title | Route | Description |
|---|---|---|---|
| `login` | Вход в кабинет | `/login` | Login page. Email + password form, access-request link. Debug-managed accounts context. |
| `account` | Личный кабинет | `/account` | Personal account / dashboard. User's own view of their profile, reading history, settings entry points. |
| `notifications` | Уведомления | `/notifications` | Notifications page or dropdown. Activity feed: replies, votes, new editions. |
| `book-arkhitektura` | Невидимая архитектура | `/book/nevid-arkhitektura` | Book detail page for «Невидимая архитектура». Same structure as `book-ferro` — second book reference. |
| `book-etika` | Этика молчания | `/book/etika-molchaniya` | Book detail page for «Этика молчания». Third book reference. |
| `reader-variants` | Варианты ридера | — | Reader theme variants: light / sepia / dark displayed side-by-side. Design reference, not a routable page. |
| `community` | Сообщество | `/community` | Community feed. Threaded discussions, weighted votes visible on comments, reputation pills on avatars. |
| `community-members` | Участники сообщества | `/community/members` | Community members list. Avatars, names, roles, reputation pills, filter/sort controls. |
| `notes` | Мои заметки | `/notes` | User's private margin notes list. Linked to book + page, excerpt preview, edit/delete actions. |
| `notes-citations` | Мои заметки и цитаты | `/notes` | Combined notes + saved citations view. Tabs or sections separating the two. |
| `citations` | Невидимая архитектура — Цитаты | `/book/nevid-arkhitektura/citations` | Per-book citations page. All saved/shared citations for a book, with deep-link anchors and academic format strings. |
| `citation-ui` | Интерфейс цитирования | — | Citation popover/modal. Academic citation string, short link with copy button. Triggered from reader text selection. |
| `citation-in-discussion` | Вставка цитаты в обсуждение | — | Citation embed within a discussion thread. Mini-reader block with fragment highlight, citation string, author/page metadata. |
| `quick-preview` | Быстрый просмотр | — | Quick-preview panel. Slide-in overlay with cover, annotation, TOC snapshot, «Читать» CTA. Triggered from catalogue card hover/click. |
| `debug-console` | Консоль отладки | — | Debug console dock (Primer-only). Shows active session, current user role/tags, event log, activity simulation controls. |
| `empty-states` | Состояния пустых списков | — | Empty-state templates across the app: notes, bookmarks, community, search results. Includes «Здесь пока тихо.» pattern. |
| `about` | О проекте | `/about` | About page. Editorial paragraph about β→α publishing house, mission, revenue model overview, contact links. |
| `home-v2` | Главная — Bookatier | `/` | Alternative home page iteration. Compare against `home-anon` — keep the stronger variant. |

---

## Review checklist (per frame)

- Terracotta appears once-ish per screen (primary action); jewel tones only in chips.
- Serif carries titles/quotes; sans carries controls; no font soup.
- Hairline rules + paper warmth present; no hard/grey shadows, no gradients.
- Reputation pills dignified; no point-scoring look.
- RU copy intact, no lorem ipsum.
- Layout breathes — if it feels like a dashboard, reject.

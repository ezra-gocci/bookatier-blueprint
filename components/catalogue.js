/* components/catalogue.js — the Catalogue grid (Library §A · Catalogue tab)
   ────────────────────────────────────────────────────────────────────────────
   Renders books from BA.bookData (the SAME entity the Book card and Book page
   show). Click a tile → BA.bookCard.open(slug) (Browse glance); the
   "Страница книги ↗" link → book.html (the full page); "Читать" → reader.html.

   scope-of-work §1: three VIEW MODES (§1.2, small tiles · big tiles · list of
   blocks; persisted), combining FILTERS (§1.4, topic + author + year +
   availability) over the live SEARCH, spec-aligned SORT (§1.3, newest · rating ·
   activity · title · author — rating/activity degrade gracefully while social
   data is empty), availability BADGES (§1.14) and an empty/no-results state
   (§1.20). Guests: whole catalogue, free editions, no reactions (CON-01, §4.5).

   Feature area: Catalogue. Spec refs: system-model §4.2/§4.8; specs.md §1.6.
   Tokens-only. */
(function () {
  'use strict';
  window.BA = window.BA || {};

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function injectCSS() {
    if (document.getElementById('ba-cat-css')) return;
    var css = [
      /* toolbar */
      '.cat-toolbar{display:flex;align-items:center;gap:var(--space-3,12px);flex-wrap:wrap;',
      'padding:var(--space-4,16px) 0;border-bottom:var(--hairline,1px) solid var(--line);}',
      '.cat-search{flex:1 1 220px;min-width:160px;max-width:320px;position:relative;}',
      '.cat-search input{width:100%;font-family:var(--font-sans);font-size:var(--fs-small,14px);',
      'padding:8px 12px 8px 32px;border:var(--hairline,1px) solid var(--line);border-radius:var(--radius-pill,999px);',
      'background:var(--surface-sunk);color:var(--ink);}',
      '.cat-search input:focus{outline:none;border-color:var(--accent);background:var(--surface);}',
      '.cat-search svg{position:absolute;left:11px;top:50%;transform:translateY(-50%);color:var(--ink-faint);}',
      '.cat-chips{display:flex;gap:var(--space-2,8px);flex-wrap:wrap;}',
      '.cat-chip{font-family:var(--font-sans);font-size:var(--fs-small,14px);padding:6px 14px;cursor:pointer;',
      'border:var(--hairline,1px) solid var(--line);border-radius:var(--radius-pill,999px);',
      'background:transparent;color:var(--ink-soft);transition:all 140ms;}',
      '.cat-chip:hover{border-color:var(--accent);color:var(--accent);}',
      '.cat-chip.is-active{background:var(--ink);color:var(--paper);border-color:var(--ink);}',
      '.cat-tools-right{margin-left:auto;display:flex;align-items:center;gap:var(--space-3,12px);flex-wrap:wrap;}',
      /* filter + sort selects */
      '.cat-filters{display:flex;align-items:center;gap:var(--space-2,8px);flex-wrap:wrap;padding:var(--space-3,12px) 0 0;}',
      '.cat-fl{display:flex;align-items:center;gap:6px;}',
      '.cat-fl-lbl{font-family:var(--font-sans);font-size:var(--fs-caption,12px);color:var(--ink-faint);}',
      '.cat-select{font-family:var(--font-sans);font-size:var(--fs-small,14px);padding:7px 10px;',
      'border:var(--hairline,1px) solid var(--line);border-radius:var(--radius-sm,6px);',
      'background:var(--surface);color:var(--ink);cursor:pointer;}',
      '.cat-select:focus{outline:none;border-color:var(--accent);}',
      '.cat-count{font-family:var(--font-sans);font-size:var(--fs-caption,12px);color:var(--ink-faint);white-space:nowrap;}',
      '.cat-reset{font-family:var(--font-sans);font-size:var(--fs-caption,12px);background:none;border:none;',
      'color:var(--accent);cursor:pointer;padding:4px 6px;}',
      '.cat-reset:hover{text-decoration:underline;}',
      /* view toggle */
      '.cat-view-toggle{display:inline-flex;border:var(--hairline,1px) solid var(--line);border-radius:var(--radius-sm,6px);overflow:hidden;}',
      '.cat-view-btn{display:inline-flex;align-items:center;justify-content:center;width:34px;height:32px;background:var(--surface);',
      'border:none;border-right:var(--hairline,1px) solid var(--line);color:var(--ink-faint);cursor:pointer;transition:background 120ms,color 120ms;}',
      '.cat-view-btn:last-child{border-right:none;}',
      '.cat-view-btn:hover{color:var(--ink);background:var(--surface-sunk);}',
      '.cat-view-btn.is-active{background:var(--ink);color:var(--paper);}',
      /* grids */
      '.cat-grid{display:grid;gap:var(--space-5,20px);padding:var(--space-6,24px) 0 var(--space-12,48px);}',
      '.cat-grid--big{grid-template-columns:repeat(4,1fr);}',
      '.cat-grid--small{grid-template-columns:repeat(6,1fr);gap:var(--space-4,16px);}',
      '@media (max-width:1100px){.cat-grid--big{grid-template-columns:repeat(3,1fr);}.cat-grid--small{grid-template-columns:repeat(4,1fr);}}',
      '@media (max-width:760px){.cat-grid--big{grid-template-columns:repeat(2,1fr);}.cat-grid--small{grid-template-columns:repeat(3,1fr);}}',
      '@media (max-width:460px){.cat-grid--big{grid-template-columns:1fr;}.cat-grid--small{grid-template-columns:repeat(2,1fr);}}',
      '.cat-tile{display:flex;flex-direction:column;background:var(--surface);',
      'border:var(--hairline,1px) solid var(--line);border-radius:var(--radius-md,10px);overflow:hidden;',
      'transition:border-color 140ms,box-shadow 140ms,transform 140ms;}',
      '.cat-tile:hover{border-color:var(--accent);box-shadow:var(--shadow-raise);transform:translateY(-2px);}',
      '.cat-cover-wrap{position:relative;aspect-ratio:2/3;overflow:hidden;background:var(--surface-sunk);',
      'border:none;padding:0;cursor:pointer;display:block;width:100%;}',
      '.cat-cover-wrap img{width:100%;height:100%;object-fit:cover;display:block;transition:transform 400ms;}',
      '.cat-tile:hover .cat-cover-wrap img{transform:scale(1.03);}',
      '.cat-ver{position:absolute;right:8px;bottom:8px;font-family:var(--font-sans);font-size:11px;',
      'font-weight:600;padding:2px 8px;border-radius:var(--radius-pill,999px);',
      'background:color-mix(in srgb,var(--ink) 78%,transparent);color:var(--paper);}',
      '.cat-cover-page{position:absolute;left:8px;bottom:8px;font-family:var(--font-sans);font-size:11px;',
      'font-weight:600;padding:3px 9px;border-radius:var(--radius-pill,999px);text-decoration:none;',
      'background:var(--accent);color:var(--on-accent,#fff);opacity:0;transition:opacity 140ms;}',
      '.cat-tile:hover .cat-cover-page{opacity:1;}',
      '.cat-body{display:flex;flex-direction:column;gap:var(--space-1,4px);padding:var(--space-4,16px);flex:1;}',
      '.cat-tchips{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:var(--space-1,4px);}',
      '.cat-topic{font-family:var(--font-sans);font-size:11px;font-weight:600;padding:2px 8px;',
      'border-radius:var(--radius-pill,999px);}',
      '.cat-topic--psycho{background:color-mix(in srgb,var(--slate) 14%,transparent);color:var(--slate);}',
      '.cat-topic--theory{background:color-mix(in srgb,var(--amber) 16%,transparent);color:var(--amber);}',
      '.cat-topic--clinical{background:color-mix(in srgb,var(--sage) 16%,transparent);color:var(--sage);}',
      '.cat-topic--therapy{background:color-mix(in srgb,var(--accent) 12%,transparent);color:var(--accent);}',
      '.cat-title{font-family:var(--font-serif);font-size:var(--fs-h3,18px);font-weight:600;line-height:1.3;',
      'color:var(--ink);text-decoration:none;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}',
      '.cat-title:hover{color:var(--accent);}',
      '.cat-author{font-family:var(--font-sans);font-size:var(--fs-small,14px);color:var(--ink-soft);text-decoration:none;}',
      '.cat-author:hover{color:var(--accent);}',
      /* availability badges (§1.14) */
      '.cat-avails{display:flex;flex-wrap:wrap;gap:6px;margin-top:var(--space-2,8px);}',
      '.cat-avail{font-family:var(--font-sans);font-size:10px;font-weight:600;padding:2px 8px;border-radius:var(--radius-pill,999px);',
      'display:inline-flex;align-items:center;gap:4px;text-transform:uppercase;letter-spacing:0.02em;}',
      '.cat-avail--free{background:color-mix(in srgb,var(--accent) 14%,transparent);color:var(--accent);}',
      '.cat-avail--gated{background:color-mix(in srgb,var(--ink) 8%,transparent);color:var(--ink-faint);}',
      '.cat-meta{font-family:var(--font-sans);font-size:var(--fs-caption,12px);color:var(--ink-faint);',
      'margin-top:auto;padding-top:var(--space-2,8px);}',
      '.cat-actions{display:flex;gap:var(--space-2,8px);margin-top:var(--space-3,12px);}',
      '.cat-read{flex:1;text-align:center;font-family:var(--font-sans);font-size:var(--fs-small,14px);',
      'font-weight:600;padding:8px 10px;border-radius:var(--radius-sm,6px);text-decoration:none;',
      'background:var(--accent);color:var(--on-accent,#fff);transition:background 140ms;}',
      '.cat-read:hover{background:var(--accent-hover);}',
      '.cat-page-btn{font-family:var(--font-sans);font-size:var(--fs-small,14px);padding:8px 12px;',
      'border-radius:var(--radius-sm,6px);text-decoration:none;border:var(--hairline,1px) solid var(--line);',
      'color:var(--ink-soft);transition:border-color 140ms,color 140ms;white-space:nowrap;}',
      '.cat-page-btn:hover{border-color:var(--accent);color:var(--accent);}',
      /* small tiles — compact: hide meta + actions, smaller type */
      '.cat-grid--small .cat-body{padding:var(--space-3,12px);gap:2px;}',
      '.cat-grid--small .cat-tchips,.cat-grid--small .cat-meta,.cat-grid--small .cat-actions,.cat-grid--small .cat-avails{display:none;}',
      '.cat-grid--small .cat-title{font-size:var(--fs-small,14px);-webkit-line-clamp:2;}',
      '.cat-grid--small .cat-author{font-size:var(--fs-caption,12px);}',
      /* list of blocks (§1.2) */
      '.cat-list{display:flex;flex-direction:column;gap:var(--space-3,12px);padding:var(--space-6,24px) 0 var(--space-12,48px);}',
      '.cat-row{display:grid;grid-template-columns:64px 1fr auto;gap:var(--space-4,16px);align-items:center;',
      'background:var(--surface);border:var(--hairline,1px) solid var(--line);border-radius:var(--radius-md,10px);',
      'padding:var(--space-4,16px);transition:border-color 140ms,box-shadow 140ms;}',
      '.cat-row:hover{border-color:var(--accent);box-shadow:var(--shadow-soft);}',
      '.cat-row-cover{width:64px;height:90px;object-fit:cover;border-radius:var(--radius-sm,6px);cursor:pointer;',
      'border:var(--hairline,1px) solid var(--line);background:var(--surface-sunk);}',
      '.cat-row-main{min-width:0;}',
      '.cat-row-title{font-family:var(--font-serif);font-size:var(--fs-h3,18px);font-weight:600;color:var(--ink);text-decoration:none;}',
      '.cat-row-title:hover{color:var(--accent);}',
      '.cat-row-author{font-family:var(--font-sans);font-size:var(--fs-small,14px);color:var(--ink-soft);text-decoration:none;display:inline-block;margin-top:2px;}',
      '.cat-row-author:hover{color:var(--accent);}',
      '.cat-row-desc{font-family:var(--font-sans);font-size:var(--fs-small,14px);color:var(--ink-faint);line-height:1.5;',
      'margin:var(--space-2,8px) 0 0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;max-width:70ch;}',
      '.cat-row-tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:var(--space-2,8px);align-items:center;}',
      '.cat-row-actions{display:flex;flex-direction:column;gap:var(--space-2,8px);align-items:stretch;min-width:150px;}',
      '@media (max-width:700px){.cat-row{grid-template-columns:56px 1fr;}.cat-row-actions{grid-column:1 / -1;flex-direction:row;}.cat-row-desc{display:none;}}',
      /* empty state (§1.20) */
      '.cat-empty{padding:var(--space-12,48px);text-align:center;color:var(--ink-faint);font-family:var(--font-sans);}',
      '.cat-empty-ic{font-size:30px;opacity:0.5;}',
      '.cat-empty h3{font-family:var(--font-serif);font-size:var(--fs-h3,18px);color:var(--ink-soft);margin:var(--space-3,12px) 0 var(--space-1);}',
      '.cat-empty p{margin:0 0 var(--space-4,16px);font-size:var(--fs-small,14px);}'
    ].join('');
    var st = document.createElement('style'); st.id = 'ba-cat-css'; st.textContent = css;
    document.head.appendChild(st);
  }

  /* persisted view (small | big | list); filters reset per visit */
  function loadView() { try { return BA.store.get('cat-view') || 'big'; } catch (e) { return 'big'; } }
  var state = { q: '', topic: '', author: '', year: '', avail: '', sort: 'newest', view: loadView() };

  /* ---- predicates ---- */
  function authorName(b) { return b.editor ? b.editor + ' (ред.)' : b.author; }
  function topicMatch(b) { return !state.topic || (b.genre || []).indexOf(state.topic) !== -1; }
  function queryMatch(b) {
    if (!state.q) return true;
    var q = state.q.toLowerCase();
    return (b.title + ' ' + (b.subtitle || '') + ' ' + b.author + ' ' + b.tags.join(' ')).toLowerCase().indexOf(q) !== -1;
  }
  function authorMatch(b) { return !state.author || b.authorId === state.author; }
  function yearMatch(b) { return !state.year || String(b.year) === String(state.year); }
  function availOf(b) {
    return { hasFree: b.editions.some(function (e) { return e.access === 'free'; }),
      hasFull: b.editions.some(function (e) { return e.isComplete; }) };
  }
  function availMatch(b) {
    if (!state.avail) return true;
    var a = availOf(b);
    return state.avail === 'free' ? a.hasFree : a.hasFull;
  }
  function passes(b) { return queryMatch(b) && topicMatch(b) && authorMatch(b) && yearMatch(b) && availMatch(b); }

  /* ---- sort (§1.3) — rating/activity degrade to title while social data empty ---- */
  function cmp(a, b) {
    var t = a.title.localeCompare(b.title, 'ru');
    switch (state.sort) {
      case 'newest': return (b.year - a.year) || t;
      case 'author': return authorName(a).localeCompare(authorName(b), 'ru') || t;
      case 'rating': return ((b.rating ? b.rating.score : 0) - (a.rating ? a.rating.score : 0)) || t;
      case 'activity': return ((b.community ? b.community.length : 0) - (a.community ? a.community.length : 0)) || t;
      default: return t; /* title */
    }
  }

  function availBadges(b) {
    var a = availOf(b), out = '';
    if (a.hasFree) out += '<span class="cat-avail cat-avail--free">🔓 Фрагмент</span>';
    if (a.hasFull) out += '<span class="cat-avail cat-avail--gated">🔒 Полное издание</span>';
    return out;
  }

  function tileHTML(b) {
    var ed = BA.bookData.fullEdition(b);
    var topics = b.chips.slice(0, 2).map(function (c) {
      return '<span class="cat-topic cat-topic--' + c.kind + '">' + esc(c.label) + '</span>';
    }).join('');
    return '<article class="cat-tile" data-slug="' + esc(b.slug) + '">' +
      '<button class="cat-cover-wrap" type="button" data-act="card" aria-label="Открыть карточку: ' + esc(b.title) + '">' +
        '<img src="' + esc(b.covers.medium) + '" alt="Обложка: ' + esc(b.title) + '" loading="lazy">' +
        '<span class="cat-ver">' + esc(ed ? ed.v : '') + '</span>' +
        '<a class="cat-cover-page" href="book.html?book=' + esc(b.slug) + '" data-act="page">Страница книги ↗</a>' +
      '</button>' +
      '<div class="cat-body">' +
        '<div class="cat-tchips">' + topics + '</div>' +
        '<a class="cat-title" href="book.html?book=' + esc(b.slug) + '">' + esc(b.title) + '</a>' +
        '<a class="cat-author" href="author.html?author=' + esc(b.authorId) + '">' + esc(authorName(b)) + '</a>' +
        '<div class="cat-avails">' + availBadges(b) + '</div>' +
        '<div class="cat-meta">' + b.year + ' · ' + b.pages + ' с. · ' + esc(b.publisher) + '</div>' +
        '<div class="cat-actions">' +
          '<a class="cat-read" href="reader.html?book=' + esc(b.slug) + '&v=free">Читать фрагмент</a>' +
          '<a class="cat-page-btn" href="book.html?book=' + esc(b.slug) + '">Подробнее</a>' +
        '</div>' +
      '</div>' +
    '</article>';
  }

  function rowHTML(b) {
    var topics = b.chips.slice(0, 3).map(function (c) {
      return '<span class="cat-topic cat-topic--' + c.kind + '">' + esc(c.label) + '</span>';
    }).join('');
    return '<article class="cat-row" data-slug="' + esc(b.slug) + '">' +
      '<img class="cat-row-cover" data-act="card" src="' + esc(b.covers.small) + '" alt="Обложка: ' + esc(b.title) + '" loading="lazy">' +
      '<div class="cat-row-main">' +
        '<a class="cat-row-title" href="book.html?book=' + esc(b.slug) + '">' + esc(b.title) + '</a>' +
        (b.subtitle ? ' ' : '') +
        '<br><a class="cat-row-author" href="author.html?author=' + esc(b.authorId) + '">' + esc(authorName(b)) + '</a>' +
        '<span class="cat-meta"> · ' + b.year + ' · ' + b.pages + ' с.</span>' +
        '<p class="cat-row-desc">' + esc(b.shortDescription || b.description || '') + '</p>' +
        '<div class="cat-row-tags">' + topics + availBadges(b) + '</div>' +
      '</div>' +
      '<div class="cat-row-actions">' +
        '<a class="cat-read" href="reader.html?book=' + esc(b.slug) + '&v=free">Читать фрагмент</a>' +
        '<a class="cat-page-btn" style="text-align:center" href="book.html?book=' + esc(b.slug) + '">Страница книги</a>' +
      '</div>' +
    '</article>';
  }

  function plural(n, one, few, many) {
    var m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
    return many;
  }

  function years(books) {
    var set = {};
    books.forEach(function (b) { set[b.year] = true; });
    return Object.keys(set).map(Number).sort(function (a, b) { return b - a; });
  }

  function render(container) {
    injectCSS();
    var books = BA.bookData.all().slice();
    var authors = (window.BA && BA.authorData) ? BA.authorData.all() : [];

    var topicOpts = ['', 'psychoanalysis', 'psychotherapy', 'theory', 'clinical'];
    var topicLbl = { '': 'Все', psychoanalysis: 'Психоанализ', psychotherapy: 'Психотерапия', theory: 'Теория', clinical: 'Клиника' };

    container.innerHTML =
      '<div class="cat-toolbar">' +
        '<div class="cat-search">' +
          '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.5-4.5"/></svg>' +
          '<input type="search" id="cat-q" placeholder="Поиск по каталогу…" value="' + esc(state.q) + '">' +
        '</div>' +
        '<div class="cat-chips" id="cat-chips">' +
          topicOpts.map(function (t) {
            return '<button class="cat-chip' + (state.topic === t ? ' is-active' : '') + '" data-topic="' + t + '">' + topicLbl[t] + '</button>';
          }).join('') +
        '</div>' +
        '<div class="cat-tools-right">' +
          '<span class="cat-count" id="cat-count"></span>' +
          '<div class="cat-view-toggle" id="cat-view" role="group" aria-label="Вид каталога">' +
            viewBtn('small', 'Мелкие плитки', '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="3" width="6" height="6" rx="1"/><rect x="3" y="15" width="6" height="6" rx="1"/><rect x="15" y="15" width="6" height="6" rx="1"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/></svg>') +
            viewBtn('big', 'Крупные плитки', '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/></svg>') +
            viewBtn('list', 'Список', '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>') +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="cat-filters">' +
        flSelect('cat-author', 'Автор', '<option value="">Все авторы</option>' +
          authors.map(function (a) { return '<option value="' + esc(a.id) + '"' + (state.author === a.id ? ' selected' : '') + '>' + esc(a.name) + '</option>'; }).join('')) +
        flSelect('cat-year', 'Год', '<option value="">Все годы</option>' +
          years(books).map(function (y) { return '<option value="' + y + '"' + (String(state.year) === String(y) ? ' selected' : '') + '>' + y + '</option>'; }).join('')) +
        flSelect('cat-avail', 'Доступ', ['', 'free', 'full'].map(function (v) {
          var l = { '': 'Любой', free: 'Бесплатный фрагмент', full: 'Полное издание' }[v];
          return '<option value="' + v + '"' + (state.avail === v ? ' selected' : '') + '>' + l + '</option>';
        }).join('')) +
        flSelect('cat-sort', 'Сортировка', [
          ['newest', 'Сначала новые'], ['rating', 'По рейтингу'], ['activity', 'По активности'],
          ['title', 'По названию (А–Я)'], ['author', 'По автору']
        ].map(function (o) { return '<option value="' + o[0] + '"' + (state.sort === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('')) +
        '<button class="cat-reset" id="cat-reset" type="button" hidden>Сбросить фильтры</button>' +
      '</div>' +
      '<div id="cat-results"></div>';

    function viewBtn(v, label, ic) {
      return '<button class="cat-view-btn' + (state.view === v ? ' is-active' : '') + '" type="button" data-view="' + v + '" title="' + label + '" aria-label="' + label + '" aria-pressed="' + (state.view === v) + '">' + ic + '</button>';
    }
    function flSelect(id, label, opts) {
      return '<label class="cat-fl"><span class="cat-fl-lbl">' + label + '</span>' +
        '<select class="cat-select" id="' + id + '">' + opts + '</select></label>';
    }

    function activeFilterCount() {
      return [state.q, state.topic, state.author, state.year, state.avail].filter(Boolean).length;
    }

    function paint() {
      var list = books.filter(passes).sort(cmp);
      var host = container.querySelector('#cat-results');
      if (!list.length) {
        host.innerHTML =
          '<div class="cat-empty"><div class="cat-empty-ic">📚</div>' +
          '<h3>Ничего не найдено</h3>' +
          '<p>Под эти фильтры не подошла ни одна книга. Попробуйте смягчить запрос.</p>' +
          '<button class="cat-read" id="cat-empty-reset" type="button" style="display:inline-block;border:none">Сбросить фильтры</button></div>';
      } else if (state.view === 'list') {
        host.innerHTML = '<div class="cat-list">' + list.map(rowHTML).join('') + '</div>';
      } else {
        host.innerHTML = '<div class="cat-grid cat-grid--' + state.view + '">' + list.map(tileHTML).join('') + '</div>';
      }
      container.querySelector('#cat-count').textContent = list.length + ' ' + plural(list.length, 'издание', 'издания', 'изданий');
      var reset = container.querySelector('#cat-reset');
      if (reset) reset.hidden = activeFilterCount() === 0;
    }

    function resetFilters() {
      state.q = ''; state.topic = ''; state.author = ''; state.year = ''; state.avail = '';
      var q = container.querySelector('#cat-q'); if (q) q.value = '';
      ['cat-author', 'cat-year', 'cat-avail'].forEach(function (id) { var s = container.querySelector('#' + id); if (s) s.value = ''; });
      container.querySelectorAll('.cat-chip').forEach(function (c) { c.classList.toggle('is-active', c.getAttribute('data-topic') === ''); });
      paint();
    }

    /* ---- wiring ---- */
    container.querySelector('#cat-q').addEventListener('input', function (e) { state.q = e.target.value; paint(); });
    container.querySelector('#cat-author').addEventListener('change', function (e) { state.author = e.target.value; paint(); });
    container.querySelector('#cat-year').addEventListener('change', function (e) { state.year = e.target.value; paint(); });
    container.querySelector('#cat-avail').addEventListener('change', function (e) { state.avail = e.target.value; paint(); });
    container.querySelector('#cat-sort').addEventListener('change', function (e) { state.sort = e.target.value; paint(); });
    container.querySelector('#cat-chips').addEventListener('click', function (e) {
      var chip = e.target.closest('.cat-chip'); if (!chip) return;
      state.topic = chip.getAttribute('data-topic');
      container.querySelectorAll('.cat-chip').forEach(function (c) { c.classList.toggle('is-active', c === chip); });
      paint();
    });
    container.querySelector('#cat-view').addEventListener('click', function (e) {
      var btn = e.target.closest('.cat-view-btn'); if (!btn) return;
      state.view = btn.getAttribute('data-view');
      try { BA.store.set('cat-view', state.view); } catch (err) {}
      container.querySelectorAll('.cat-view-btn').forEach(function (b) {
        var on = b === btn; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', on);
      });
      paint();
    });
    container.querySelector('#cat-reset').addEventListener('click', resetFilters);
    /* tile/row cover → open the Book card (Browse); the page link bubbles out */
    container.querySelector('#cat-results').addEventListener('click', function (e) {
      if (e.target.id === 'cat-empty-reset') { resetFilters(); return; }
      if (e.target.closest('[data-act="page"]')) return; /* let the link navigate */
      var cardEl = e.target.closest('[data-act="card"]');
      if (cardEl) {
        e.preventDefault();
        var slug = cardEl.closest('[data-slug]').getAttribute('data-slug');
        if (window.BA && BA.bookCard) BA.bookCard.open(slug);
      }
    });
    paint();
  }

  window.BA.catalogue = { render: render, state: state };
})();

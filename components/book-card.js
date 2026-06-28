/* components/book-card.js — Book Card overlay (F, «Карта книги»)
   BA.bookCard.open(bookId) / BA.bookCard.close()

   An alternate, compact view of the Book page: same data, one vertical
   scroll. A centred modal CARD (info column + cover pinned right) with a
   collapsible MiniReader FLYOUT to its left, over the dimmed page.

   Private (authorized) = maximum availability. Public = delta:
     – no My-status · reader free-fragment + «Войти и читать» prompt
     – ratings/reviews/discussion read-only (no compose / vote / star)
     – edition dropdown = free fragment only · «Читать» → «Войти и читать»

   Styling lives in styles/book-card.css (injected as a <link>).
   Spec: site-map.md §10.6/§10.8 · briefs/blueprint-book-card.md §3–5.
   No backend (Phase 1): state is local/session; book.opened → console+localStorage. */
(function () {
  'use strict';
  window.BA = window.BA || {};

  /* =====================================================================
     CARD STACK — shared navigation between the overlay cards
     (book / author / member). When a card opens another card "from" itself
     (e.g. author from a book), the first card is hidden and a reopen-thunk is
     pushed; closing the second card pops the thunk and restores the first.
     A guarded singleton so whichever card module loads first defines it.
     ===================================================================== */
  window.BA.cardStack = window.BA.cardStack || (function () {
    var stack = [];     /* reopen-thunks for the hidden parent cards */
    var managed = false; /* true while a push/back is driving an open() */
    return {
      /* Open `child()` as a sub-card of the current one; `reopenParent()`
         restores the current card when the child later closes. */
      open: function (reopenParent, child) {
        stack.push(reopenParent);
        managed = true;
        try { child(); } finally { managed = false; }
      },
      /* Called from a card's close(): reopen the parent if one is stacked. */
      back: function () {
        if (!stack.length) return false;
        var fn = stack.pop();
        managed = true;
        try { fn(); } finally { managed = false; }
        return true;
      },
      /* Each card's open() calls this first: a fresh (unmanaged) open is a new
         root and clears any stale stack; a managed open keeps the stack. */
      enter: function () { if (!managed) stack.length = 0; },
      reset: function () { stack.length = 0; }, /* drop all parents (e.g. navigating away) */
      depth: function () { return stack.length; }
    };
  })();

  /* =====================================================================
     DATA — hardcoded, curated. Real copy sourced from code/origin/book.html
     (Bion = full). Do not trust PDF metadata. Phase 1 has one fragment PDF
     per book; per-version PDF corpus is deferred (books-and-versions.md), so
     the edition dropdown rebinds citation/labels but not the rendered PDF.
     ===================================================================== */
  /* Book data now lives in components/book-data.js (BA.bookData) — the single
     source consumed by both the card (Browse) and the Book page / Catalogue.
     This module keeps only the modal UI + the mini-reader (Browse) chrome. */

  /* =====================================================================
     STATE
     ===================================================================== */
  var _backdrop = null, _root = null, _card = null, _reader = null;
  var _activeBook = null, _activeBookId = null, _activeEdition = null;
  var _priv = false;
  var _esc = null;
  var _scrollSpyTimer = null; /* debounce handle for removing is-scrolled after scroll stops */
  var _readerLoaded = false; /* the MiniReader loads its PDF on first expand */

  /* MiniReader engine (BA.readerEngine) — the ONE shared PDF renderer (W-6.1).
     The card hosts a single engine instance per open(), rendering into
     .bcd-reader-body with the card's own bcd-* classes so book-card.css applies
     unchanged. _twoPage mirrors the engine's mode (drives shell glyphs). */
  var _eng = null;
  var _twoPage = true; /* MiniReader view: two-page spread (default) vs one page */
  var _page = 1;       /* current page (fallback before the engine is ready) */
  var _readerOver = false; /* MiniReader layout: false = flyout left of card; true = over the card, full width */
  var _constrainDrawerW = null;  /* set in _addResizeHandle(); called from _toggleReader on expand */
  var _checkTabsCompact = null;  /* set in _addResizeHandle(); called from _buildViewerShell + _toggleReader */

  /* the card's class skin for the shared engine (keeps book-card.css selectors). */
  var BCD_CLS = { spread: 'bcd-spread', single: 'is-single', slot: 'bcd-slot',
    left: 'bcd-slot--left', right: 'bcd-slot--right', slotSingle: 'bcd-slot--single',
    ghost: 'bcd-page-ghost', msg: 'bcd-reader-msg' };

  /* =====================================================================
     HELPERS
     ===================================================================== */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function starRow(score, cls) {
    var full = Math.round(score);
    var out = '<span class="bcd-stars' + (cls ? ' ' + cls : '') + '" aria-label="Рейтинг ' + score + ' из 5">';
    for (var i = 1; i <= 5; i++) out += '<span class="bcd-star ' + (i <= full ? 'f' : 'e') + '">★</span>';
    return out + '</span>';
  }

  function repBadge(rep) {
    if (!rep) return '';
    return '<span class="bcd-rep bcd-rep--' + rep.kind + '">' + esc(rep.label) +
      (rep.score != null ? ' ' + rep.score : '') + '</span>';
  }

  function avatar(initials, color, sm) {
    return '<span class="bcd-av' + (sm ? ' bcd-av--sm' : '') + '" style="background:' + (color || 'var(--accent)') + '">' + esc(initials) + '</span>';
  }

  function _emitBookOpened(book, edition) {
    var evt = {
      type: 'book.opened',
      book_id: _activeBookId,
      book_version_id: edition ? edition.v : null,
      publisher_id: 'beta-alpha', /* internal constant (principle 7) */
      timestamp: new Date().toISOString()
    };
    try {
      var log = JSON.parse(BA.store.get('ba_events') || '[]');
      log.push(evt);
      BA.store.set('ba_events', JSON.stringify(log.slice(-200)));
    } catch (e) {}
    try { console.info('[event] book.opened', evt); } catch (e) {}
  }

  /* =====================================================================
     STYLESHEET — inject <link> to styles/book-card.css (path relative to
     this component's own <script src>), so any page gets it for free.
     ===================================================================== */
  function _injectCSS() {
    if (document.getElementById('ba-bcd-link')) return;
    var base = '../styles/';
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].getAttribute('src') || '';
      var m = src.match(/^(.*\/)components\/book-card\.js(?:\?.*)?$/);
      if (m) { base = m[1] + 'styles/'; break; }
    }
    var link = document.createElement('link');
    link.id = 'ba-bcd-link';
    link.rel = 'stylesheet';
    link.href = base + 'book-card.css';
    document.head.appendChild(link);
  }

  /* =====================================================================
     SHELL — backdrop + root (built once)
     ===================================================================== */
  function _buildShell() {
    if (_backdrop) return;
    _injectCSS();

    _backdrop = document.createElement('div');
    _backdrop.className = 'bcd-backdrop';
    _backdrop.addEventListener('click', function () { BA.bookCard.close(); });
    document.body.appendChild(_backdrop);

    _root = document.createElement('div');
    _root.className = 'bcd-root';
    _root.setAttribute('role', 'dialog');
    _root.setAttribute('aria-modal', 'true');
    _root.setAttribute('aria-label', 'Карта книги');
    /* clicks on the empty root area (outside card/reader) also close */
    _root.addEventListener('click', function (e) { if (e.target === _root) BA.bookCard.close(); });
    document.body.appendChild(_root);

    _esc = function (e) {
      if (e.key !== 'Escape' || !_root.classList.contains('is-open')) return;
      /* Esc exits fullscreen first, then closes the card */
      if (_reader && _reader.classList.contains('is-fullscreen')) { _toggleFullscreen(false); return; }
      BA.bookCard.close();
    };
    document.addEventListener('keydown', _esc);
  }

  /* =====================================================================
     RENDER
     ===================================================================== */
  function _render() {
    var b = _activeBook, ed = _activeEdition;
    _priv = !!(window.BA && BA.session && BA.session.isPrivate());

    _root.innerHTML =
      _renderReader() +
      '<div class="bcd-drawer">' +
        /* Chapters + Excerpts — near the top */
        '<div class="bcd-tab-stack bcd-tab-stack--top">' +
          '<button class="bcd-side-tab" type="button" data-act="chapters" aria-label="Оглавление" title="Оглавление">' +
            '<span class="bcd-side-tab-label">Главы</span>' + _chaptersIcon() +
          '</button>' +
          '<button class="bcd-side-tab" type="button" data-act="memory" aria-label="Выдержки: заметки, цитаты, фрагменты" title="Выдержки: заметки, цитаты, фрагменты">' +
            '<span class="bcd-side-tab-label">Выдержки</span>' + _memoryIcon() +
          '</button>' +
        '</div>' +
        /* browse (collapse) — vertically centred. («Читалка» moved to the cover's
           right edge, below «Страница книги».) */
        '<div class="bcd-tab-stack bcd-tab-stack--mid">' +
          '<button class="bcd-reader-tab" type="button" data-act="reader-toggle" aria-label="Листать / свернуть миничиталку" aria-expanded="true">' +
            '<span class="bcd-reader-tab-ic" data-bind="tab-icon">' + _collapseIcon() + '</span>' +
          '</button>' +
        '</div>' +
        /* Compact sidebar — shown when the collapse bar would overlap the regular tab stacks
           (sideview) or when there is not enough vertical space for the full stacks.
           Same accent-rectangle style as the collapse bar; all controls are small circles. */
        '<div class="bcd-tabs-compact-bar">' +
          '<button class="bcd-ctab bcd-ctab--side" type="button" data-act="chapters" ' +
            'aria-label="Оглавление" title="Главы">' + _chaptersIcon() + '</button>' +
          '<button class="bcd-ctab bcd-ctab--side" type="button" data-act="memory" ' +
            'aria-label="Выдержки: заметки, цитаты, фрагменты" title="Выдержки">' + _memoryIcon() + '</button>' +
          '<button class="bcd-ctab" type="button" data-act="reader-toggle" ' +
            'aria-label="Страница книги" title="Страница">' +
            '<span data-bind="tab-icon">' + _collapseIcon() + '</span>' +
          '</button>' +
          '<button class="bcd-ctab" type="button" data-act="card-w-max" ' +
            'aria-label="Развернуть карточку" title="Развернуть">' + _cardWMaxIcon() + '</button>' +
          '<button class="bcd-ctab" type="button" data-act="card-w-min" ' +
            'aria-label="Свернуть карточку" title="Свернуть">' + _cardWMinIcon() + '</button>' +
        '</div>' +
        '<div class="bcd-scroll">' + _scrollContentHTML() + '</div>' +
        _coverCol() +
      '</div>' +
      /* Close control — pinned to the card's bottom-centre, above the over-card
         reader so it stays reachable in every layout. */
      '<button class="bcd-close-btm" type="button" data-act="close" aria-label="Закрыть карточку книги">' +
        '<span aria-hidden="true">✕</span> Закрыть' +
      '</button>';

    _reader = _root.querySelector('.bcd-reader');
    _wire();
    _addResizeHandle();
  }

  function _addResizeHandle() {
    var drawer = _root && _root.querySelector('.bcd-drawer');
    if (!drawer) return;

    /* Apply saved/default width before reading BCR so initW is correct */
    _applyDrawerW();

    /* Cover strip: three modes based on logical card width
       > 600 px → normal (94 px)   ≤ 600 px → half (47 px)   ≤ 300 px → hidden */
    function _updateCoverW() {
      var w = drawer.getBoundingClientRect().width / _readerZoom();
      _root.setAttribute('data-cover-mode', w > 600 ? 'normal' : w > 300 ? 'half' : 'hidden');
    }
    /* Cached measurements — populated while elements are visible so the check
       remains accurate after is-tabs-compact hides the bar and tab stacks. */
    var _cachedTopH = 0, _cachedBarH = 0;
    function doCheckCompact() {
      var topEl = _root.querySelector('.bcd-tab-stack--top');
      var midEl = _root.querySelector('.bcd-tab-stack--mid');
      var topH  = topEl ? topEl.getBoundingClientRect().height : 0;
      var midH  = midEl ? midEl.getBoundingClientRect().height : 0;
      if (topH > 0) _cachedTopH = topH;
      var effectiveTopH = topH || _cachedTopH;
      /* 1 — vertical-space shortage: stacks + gaps must fit the viewport height. */
      var vertShortage = (effectiveTopH + midH + 16 * 4) > window.innerHeight;
      /* 2 — collapse bar's top edge approaching the bottom of the --top stack
             (ГЛАВЫ + ВЫДЕРЖКИ, CSS: top: 3.5rem = 56 px from viewport top).
             As the viewport shrinks the bar (CSS: top:50%; transform:translateY(-50%))
             rises toward the stack. Trigger 3 px before contact.
             When is-tabs-compact hides the bar (display:none → BCR = 0), derive
             the bar's expected top from its cached height and the viewport center. */
      var collapseOverlap = false;
      if (!_readerOver && !_root.classList.contains('is-reader-collapsed')) {
        var colBar = _root.querySelector('.bcd-reader-collapse');
        if (colBar) {
          var colR = colBar.getBoundingClientRect();
          var barH = colR.height;
          if (barH > 0) _cachedBarH = barH;
          /* Use live BCR when visible; fall back to computed position when hidden. */
          var effectiveBarTop = (barH > 0)
            ? colR.top
            : (window.innerHeight / 2 - _cachedBarH / 2); /* CSS: top:50% translateY(-50%) */
          var topStackBottom = 56 + effectiveTopH; /* CSS: top: 3.5rem */
          collapseOverlap = effectiveBarTop <= topStackBottom + 3;
        }
      }
      _root.classList.toggle('is-tabs-compact', vertShortage || collapseOverlap);
    }
    _checkTabsCompact = doCheckCompact; /* expose to module scope */
    /* Enforce card ≥ 300 viewport-px + content ≥ 300 viewport-px.
       --bcd-drawer-w is CSS px; BCR = CSS × zoom, so limits ÷ zoom → CSS px.
       Exposed as the module-level _constrainDrawerW so _toggleReader can call it. */
    function doConstrainW() {
      var iw = window.innerWidth; /* viewport px (same coordinate space as BCR) */
      var z  = _readerZoom();
      /* hide when even the minimum (300 card + 300 content = 600 viewport px) can't fit */
      /* No content-area constraint when the reader is collapsed — card is always shown */
      var readerCollapsed = _root.classList.contains('is-reader-collapsed');
      var tooNarrow = !readerCollapsed && iw < 600;
      var wasTooNarrow = _root.classList.contains('is-too-narrow');
      _root.classList.toggle('is-too-narrow', tooNarrow);
      /* Re-render pages when reader width changes (card shown/hidden transitions) */
      if (tooNarrow !== wasTooNarrow) _renderView();
      if (tooNarrow) return;
      var maxCSS = Math.floor((iw - 300) / z); /* largest CSS px that keeps content BCR ≥ 300 */
      var minCSS = Math.ceil(300 / z);          /* smallest CSS px that keeps card BCR ≥ 300  */
      var cur = parseFloat(_root.style.getPropertyValue('--bcd-drawer-w')) || minCSS;
      var clamped = Math.max(minCSS, Math.min(cur, Math.max(minCSS, maxCSS)));
      if (clamped !== cur) {
        var dr2 = _root.querySelector('.bcd-drawer');
        if (dr2) dr2.style.transition = 'none';
        _root.style.setProperty('--bcd-drawer-w', clamped + 'px');
        if (dr2) { void dr2.offsetWidth; dr2.style.transition = ''; }
        _saveDrawerW(clamped);
      }
    }
    _constrainDrawerW = doConstrainW; /* expose to module scope for _toggleReader */
    _updateCoverW();
    _checkTabsCompact();
    doConstrainW();
    /* Refresh badge from current BCR (called whenever viewport or card size changes). */
    function _refreshBadge() {
      if (!badge || titleHidden) return;
      var bcrW = drawer.getBoundingClientRect().width;
      if (bcrW > 0) _setBadgeWidth(Math.round(bcrW));
    }
    if ('ResizeObserver' in window) {
      /* Drawer observer: fires on card width (drag) + viewport height changes. */
      new ResizeObserver(function () { _updateCoverW(); _checkTabsCompact(); doConstrainW(); _refreshBadge(); }).observe(drawer);
      /* Root observer: mirrors viewport, fires on width changes even when drawer is hidden.
         Keeps card visible/hidden state and badge content-area width in sync. */
      new ResizeObserver(function () { doConstrainW(); _refreshBadge(); }).observe(_root);
    }

    /* Width badge — sticky header inside the scroll column */
    var scroll = drawer.querySelector('.bcd-scroll');
    var badge = document.createElement('div');
    badge.className = 'bcd-card-width-badge';
    var initW = Math.round(drawer.getBoundingClientRect().width);
    function _setBadgeWidth(w) {
      badge.dataset.w = w;
      var contentW = Math.max(0, Math.round(window.innerWidth - w));
      badge.innerHTML =
        '<span class="bcd-badge-width" title="ширина карточки">' + w + ' px</span>' +
        '<span class="bcd-badge-hint-sep">·</span>' +
        '<span class="bcd-badge-content-w" title="ширина области контента">' + contentW + ' px</span>' +
        '<span class="bcd-badge-hint-sep">·</span>' +
        '<span class="bcd-badge-hint">Перетяните левый край для изменения ширины</span>';
    }
    _setBadgeWidth(initW);
    if (scroll) scroll.insertBefore(badge, scroll.firstChild);

    /* Swap badge content to title+author when the book title scrolls out of view */
    var titleEl = scroll && scroll.querySelector('.bcd-title');
    var titleHidden = false;
    if (titleEl && 'IntersectionObserver' in window) {
      var b = _activeBook;
      new IntersectionObserver(function (entries) {
        titleHidden = !entries[0].isIntersecting;
        if (titleHidden) {
          badge.innerHTML =
            '<span class="bcd-badge-title">' + esc(b.title) + '</span>' +
            '<span class="bcd-badge-sep">·</span>' +
            '<span class="bcd-badge-author">' + esc(b.author) + '</span>';
        } else {
          _setBadgeWidth(badge.dataset.w || initW);
        }
      }, { root: scroll, threshold: 0 }).observe(titleEl);
    }

    /* Resize handle — left edge of drawer */
    var handle = document.createElement('div');
    handle.className = 'bcd-resize-handle';
    handle.title = 'Перетяните для изменения ширины';
    drawer.appendChild(handle);
    handle.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      handle.setPointerCapture(e.pointerId);
      handle.classList.add('is-dragging');
      var startX = e.clientX;
      var startW = Math.round(drawer.getBoundingClientRect().width / _readerZoom()); /* CSS logical px */
      drawer.style.transition = 'transform 280ms var(--ease-out-quart)';
      function onMove(ev) {
        /* startW and clientX are both in CSS logical px — arithmetic is consistent */
        var z2 = _readerZoom();
        var maxDrag = Math.floor((window.innerWidth - 300) / z2); /* CSS px: content BCR ≥ 300 */
        var minDrag = Math.ceil(300 / z2);                        /* CSS px: card BCR ≥ 300    */
        var newW = Math.round(Math.min(Math.max(startW + startX - ev.clientX, minDrag), maxDrag));
        _root.style.setProperty('--bcd-drawer-w', newW + 'px');
        if (!titleHidden) _setBadgeWidth(Math.round(newW * _readerZoom())); /* badge shows BCR px */
        else badge.dataset.w = Math.round(newW * _readerZoom());
      }
      function onDone() {
        drawer.style.transition = '';
        handle.classList.remove('is-dragging');
        /* save in CSS logical px, not BCR */
        _saveDrawerW(Math.round(drawer.getBoundingClientRect().width / _readerZoom()));
        handle.removeEventListener('pointermove', onMove);
        handle.removeEventListener('pointerup', onDone);
        handle.removeEventListener('pointercancel', onDone);
      }
      handle.addEventListener('pointermove', onMove);
      handle.addEventListener('pointerup', onDone);
      handle.addEventListener('pointercancel', onDone);
    });
  }

  function _scrollContentHTML() {
    return _secIdentity() +
      (_priv ? _secMyStatus() : '') +
      _secAnnotation() +
      _secReviews() +
      _secDiscussion() +
      _secCommunity() +
      _secVersions() +
      _secRequisites();
  }

  /* swap the scroll column between the normal content and the editions list */
  function _showEditions() {
    var scroll = _root.querySelector('.bcd-scroll');
    if (scroll) { scroll.scrollTop = 0; scroll.innerHTML = _editionsHTML(); _updateScrollSpy(); }
  }
  function _showContent() {
    var scroll = _root.querySelector('.bcd-scroll');
    if (scroll) { scroll.innerHTML = _scrollContentHTML(); scroll.scrollTop = 0; _updateScrollSpy(); }
    _setActiveSideTab(null);
    _setSelectMode(false);
  }

  /* =====================================================================
     READER SIDE-TABS — Chapters · Memory · Selection
     ===================================================================== */
  function _setActiveSideTab(name) {
    if (!_root) return;
    _root.querySelectorAll('.bcd-side-tab, .bcd-ctab--side').forEach(function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-act') === name);
    });
  }
  function _subviewHead(title) {
    return '<div class="bcd-subview-head">' +
      '<button class="bcd-editions-back" type="button" data-act="subview-back"><span aria-hidden="true">←</span> Назад</button>' +
      '<span class="bcd-editions-title">' + esc(title) + '</span>' +
    '</div>';
  }

  /* current reader page (rendered fragment page, from the engine) */
  function _currentPage() {
    return _eng ? _eng.currentPage() : (_page || 1);
  }
  function _goToReaderPage(p) {
    if (!_eng) return;
    if (_reader && _reader.classList.contains('is-collapsed')) _toggleReader(true);
    _eng.goToPage(p | 0); /* engine clamps to the rendered fragment */
  }

  /* The Browse mini-reader always renders the free fragment. */
  function _freeEdition() {
    return (window.BA && BA.bookData)
      ? (BA.bookData.editionByVersion(_activeBook, 'free') || _activeBook.editions[_activeBook.editions.length - 1])
      : null;
  }

  /* Open a chapter: map its BOOK page into the free fragment and jump there.
     Chapters outside the fragment are disabled in the list (W-6.2), so this
     only runs for in-range chapters; a stray call is a safe no-op. */
  function _goToChapter(chapterStart) {
    var rp = BA.bookData.bookPageToEdition(_activeBook, _freeEdition(), chapterStart);
    if (rp == null) return;
    _goToReaderPage(rp);
  }

  /* ---- Chapters (table of contents) ---------------------------------- */
  function _bookChapters() {
    if (_activeBook.chapters) return _activeBook.chapters;
    var n = 6, pages = _activeBook.pages || 100, out = [];
    for (var i = 0; i < n; i++) out.push({ n: String(i + 1), title: 'Глава ' + (i + 1), page: Math.max(1, Math.round(1 + i * (pages - 1) / n)) });
    return out;
  }
  function _chapterAt(page) {
    var chs = _bookChapters(), cur = chs.length ? chs[0].title : '';
    for (var i = 0; i < chs.length; i++) if (chs[i].page <= page) cur = chs[i].title;
    return cur;
  }
  /* Index of the chapter the current spread sits in. If the spread straddles a
     chapter boundary, the chapter with the LARGER order number wins (we take the
     largest page on the spread → the later chapter). */
  function _currentChapterIndex() {
    var chs = _bookChapters();
    if (!chs.length || !_eng) return -1;
    var fp = _activeBook.fragmentPages;
    var bookPage = fp ? (_currentPage() + fp.from - 1) : _currentPage();
    var idx = 0;
    for (var i = 0; i < chs.length; i++) if (chs[i].page <= bookPage) idx = i;
    return idx;
  }
  var _chaptersShowAllDesc = false; /* false → show only the current chapter's description */
  function _chaptersHTML() {
    var chs = _bookChapters(), cur = _currentChapterIndex(), freeEd = _freeEdition();
    var rows = chs.map(function (c, i) {
      var desc = c.desc
        ? '<p class="bcd-chapter-desc">' + esc(c.desc) + '</p>' +
          '<div class="bcd-chapter-desc-full" role="tooltip">' + esc(c.desc) + '</div>'
        : '';
      /* the mini-reader shows only the free fragment — chapters outside it are
         shown for structure but disabled (W-6.2). */
      var inFrag = c.page != null && BA.bookData.bookPageToEdition(_activeBook, freeEd, c.page) != null;
      return '<button class="bcd-chapter' + (i === cur ? ' is-current' : '') + (inFrag ? '' : ' is-out') + '" type="button" ' +
        (inFrag ? 'data-act="goto-chapter" data-page="' + c.page + '"' : 'disabled title="Доступно в полном издании"') + '>' +
        '<span class="bcd-chapter-head">' +
          '<span class="bcd-chapter-n">' + esc(c.n) + '</span>' +
          '<span class="bcd-chapter-title">' + esc(c.title) + '</span>' +
          '<span class="bcd-chapter-page">с. ' + c.page + '</span>' +
        '</span>' +
        desc +
      '</button>';
    }).join('');
    return '<div class="bcd-subview">' +
      '<div class="bcd-subview-head">' +
        '<button class="bcd-editions-back" type="button" data-act="subview-back"><span aria-hidden="true">←</span> Назад</button>' +
        '<span class="bcd-editions-title">Оглавление</span>' +
        '<button class="bcd-chapters-toggle" type="button" data-act="chapters-toggle-desc">' +
          (_chaptersShowAllDesc ? 'Скрыть описания' : 'Показать описания') + '</button>' +
      '</div>' +
      '<div class="bcd-chapters' + (_chaptersShowAllDesc ? ' is-show-all' : '') + '">' + rows + '</div>' +
    '</div>';
  }
  /* Enable the full-text hover popup only where the 3-line clamp actually cuts. */
  function _detectChapterClamp() {
    if (!_root) return;
    _root.querySelectorAll('.bcd-chapter').forEach(function (ch) {
      var d = ch.querySelector('.bcd-chapter-desc');
      ch.classList.toggle('has-clamp', !!d && d.scrollHeight - d.clientHeight > 2);
    });
  }
  function _showChapters() {
    var s = _root.querySelector('.bcd-scroll');
    if (s) { s.scrollTop = 0; s.innerHTML = _chaptersHTML(); }
    _setActiveSideTab('chapters');
    _setSelectMode(false);
    _detectChapterClamp();
  }

  /* ---- Memory (user items: marks / remarks / citations) -------------- */
  var _memory = {};   // bookId -> array of items
  var _memSeq = 1;
  function _mem() { return _memory[_activeBookId] || (_memory[_activeBookId] = []); }
  function _memAdd(it) { it.id = 'mem' + (_memSeq++); if (!it.ts) it.ts = 'только что'; _mem().unshift(it); return it; }
  function _memById(id) { return _mem().filter(function (it) { return it.id === id; })[0]; }
  function _seedMemory() {
    if (_memory[_activeBookId]) return;
    _memory[_activeBookId] = [];
    _memAdd({ type: 'citation', page: 12, endPage: 13, label: 'с. 12–13', text: '«…дать пациенту возможность мыслить мысли, которые иначе остались бы немыслимыми.»', comment: 'Эпиграф к статье', ts: '2 дня назад' });
    _memAdd({ type: 'remark', page: 27, label: 'с. 27', comment: 'Здесь Бион расходится с Кляйн — проверить контекст.', ts: 'вчера' });
    _memAdd({ type: 'mark', page: 38, chapter: _chapterAt(38), label: 'с. 38', comment: '', ts: 'вчера' });
  }
  var MEM_GROUPS = [
    { type: 'mark', title: 'Закладки', icon: '🔖' },
    { type: 'remark', title: 'Заметки', icon: '📝' },
    { type: 'citation', title: 'Цитаты и фрагменты', icon: '❝' }
  ];
  function _memItemHTML(it) {
    var meta = it.label || ('с. ' + (it.page || '?'));
    if (it.chapter && it.type !== 'mark') meta += ' · ' + esc(it.chapter);
    return '<div class="bcd-mem-item" data-mem-id="' + it.id + '">' +
      '<div class="bcd-mem-item-head">' +
        '<button class="bcd-mem-loc" type="button" data-act="goto-page" data-page="' + (it.page || 1) + '">' + esc(meta) + '</button>' +
        '<span class="bcd-mem-ts">' + esc(it.ts || '') + '</span>' +
        '<button class="bcd-mem-del" type="button" data-act="mem-del" aria-label="Удалить из памяти">✕</button>' +
      '</div>' +
      (it.text ? '<p class="bcd-mem-text">' + esc(it.text) + '</p>' : '') +
      (it.comment ? '<p class="bcd-mem-comment">' + esc(it.comment) + '</p>' : '') +
      '<button class="bcd-mem-cbtn" type="button" data-act="mem-comment">' + (it.comment ? '✎ комментарий' : '+ комментарий') + '</button>' +
    '</div>';
  }
  function _memoryHTML() {
    _seedMemory();
    var items = _mem();
    var groups = MEM_GROUPS.map(function (g) {
      var gi = items.filter(function (it) { return it.type === g.type; });
      var rows = gi.length ? gi.map(_memItemHTML).join('') : '<p class="bcd-mem-empty">Пока пусто</p>';
      return '<div class="bcd-mem-group"><p class="bcd-mem-gtitle">' + g.icon + ' ' + esc(g.title) + ' · ' + gi.length + '</p>' + rows + '</div>';
    }).join('');
    return '<div class="bcd-subview">' + _subviewHead('Выдержки') +
      '<p class="bcd-mem-hint">Добавляйте текущую страницу, главу или выделение. Клик по странице в читалке работает как инструмент выделения.</p>' +
      '<div class="bcd-mem-add">' +
        '<button class="bcd-btn bcd-btn--ghost bcd-btn--sm" type="button" data-act="mem-add-page">＋ Страница</button>' +
        '<button class="bcd-btn bcd-btn--ghost bcd-btn--sm" type="button" data-act="mem-add-chapter">＋ Глава</button>' +
        '<button class="bcd-btn bcd-btn--ghost bcd-btn--sm" type="button" data-act="mem-add-note">＋ Заметка</button>' +
        '<button class="bcd-btn bcd-btn--primary bcd-btn--sm" type="button" data-act="mem-add-selection">＋ Выделение</button>' +
      '</div>' +
      '<div class="bcd-mem-list">' + groups + '</div>' +
    '</div>';
  }
  function _showMemory() {
    var s = _root.querySelector('.bcd-scroll');
    if (s) { s.scrollTop = 0; s.innerHTML = _memoryHTML(); }
    _setActiveSideTab('memory');
    _setSelectMode(true); /* in the memory view the reader becomes a selection tool */
  }
  function _refreshMemory() {
    var s = _root.querySelector('.bcd-scroll');
    if (s && s.querySelector('.bcd-mem-list')) s.innerHTML = _memoryHTML();
  }

  /* ---- Selection (visible-text / cross-page) ------------------------- */
  var _selectMode = false;          // reader is a selection tool
  var _selKind = 'text';            // 'text' (visible) | 'cross' (between pages)
  var _selStart = null, _selEnd = null; // { page, snippet }

  function _setSelectMode(on) {
    _selectMode = !!on;
    if (!on) { _selStart = _selEnd = null; _selKind = 'text'; }
    if (_reader) {
      _reader.classList.toggle('bcd-selecting', _selectMode);
      _reader.classList.toggle('bcd-sel-cross', _selectMode && _selKind === 'cross');
    }
    _renderSelBar();
  }
  /* extract a page's text (selection / citation) via the shared engine */
  function _pageText(p, cb) {
    if (!_eng) { cb(''); return; }
    _eng.getPageText(p).then(cb).catch(function () { cb(''); });
  }
  function _snippet(t, fromEnd, n) {
    n = n || 12;
    if (!t) return '…';
    return fromEnd ? ('…' + t.slice(Math.max(0, t.length - n))) : (t.slice(0, n) + '…');
  }
  function _selPlace(which) {
    var p = _currentPage();
    _pageText(p, function (t) {
      var snip = _snippet(t, which === 'end', 12);
      if (which === 'start') _selStart = { page: p, snippet: snip };
      else _selEnd = { page: p, snippet: snip };
      _renderSelBar();
    });
  }
  function _selFinish() {
    if (!_selStart || !_selEnd) return;
    var lo = Math.min(_selStart.page, _selEnd.page), hi = Math.max(_selStart.page, _selEnd.page);
    var a = _selStart.page <= _selEnd.page ? _selStart : _selEnd;
    var b = _selStart.page <= _selEnd.page ? _selEnd : _selStart;
    _memAdd({ type: 'citation', page: lo, endPage: hi,
      label: lo === hi ? ('с. ' + lo) : ('с. ' + lo + '–' + hi),
      text: '«' + a.snippet.replace(/^…|…$/g, '') + ' … ' + b.snippet.replace(/^…|…$/g, '') + '»', comment: '' });
    _showMemory();
  }
  function _selSaveText() {
    var sel = '';
    try { sel = String(window.getSelection ? window.getSelection().toString() : '').replace(/\s+/g, ' ').trim(); } catch (e) {}
    var p = _currentPage();
    if (sel) {
      _memAdd({ type: 'citation', page: p, label: 'с. ' + p, text: '«' + sel + '»', comment: '' });
      _showMemory();
    } else {
      /* blueprint fallback when no text layer is selected: grab a page snippet */
      _pageText(p, function (t) {
        _memAdd({ type: 'citation', page: p, label: 'с. ' + p, text: '«' + _snippet(t, false, 90).replace(/…$/, '') + '…»', comment: '' });
        _showMemory();
      });
    }
  }
  function _renderSelBar() {
    if (!_reader) return;
    var bar = _reader.querySelector('.bcd-sel-bar');
    if (!_selectMode) { if (bar) bar.remove(); return; }
    if (!bar) { bar = document.createElement('div'); bar.className = 'bcd-sel-bar'; _reader.appendChild(bar); }
    _reader.classList.toggle('bcd-sel-cross', _selKind === 'cross');
    var html =
      '<div class="bcd-sel-modes">' +
        '<button class="bcd-sel-mode' + (_selKind === 'text' ? ' is-on' : '') + '" type="button" data-act="sel-mode" data-mode="text">На странице</button>' +
        '<button class="bcd-sel-mode' + (_selKind === 'cross' ? ' is-on' : '') + '" type="button" data-act="sel-mode" data-mode="cross">Между страницами</button>' +
      '</div>';
    if (_selKind === 'text') {
      html += '<p class="bcd-sel-hint">Выделите видимый текст и нажмите «Сохранить цитату».</p>' +
        '<div class="bcd-sel-actions"><button class="bcd-btn bcd-btn--primary bcd-btn--sm" type="button" data-act="sel-save-text">Сохранить цитату</button></div>';
    } else {
      if (_selStart) html += '<p class="bcd-sel-line"><b>Начало:</b> с. ' + _selStart.page + ' «' + esc(_selStart.snippet) + '»</p>';
      if (_selEnd)   html += '<p class="bcd-sel-line"><b>Конец:</b> с. ' + _selEnd.page + ' «' + esc(_selEnd.snippet) + '»</p>';
      html += '<p class="bcd-sel-hint">Листайте страницы кликом и ставьте метки начала и конца.</p>';
      html += '<div class="bcd-sel-actions">';
      html += '<button class="bcd-btn ' + (_selStart ? 'bcd-btn--ghost' : 'bcd-btn--primary') + ' bcd-btn--sm" type="button" data-act="sel-start">' +
        (_selStart ? ('Сдвинуть начало → с. ' + _currentPage()) : 'Поставить начало выделения') + '</button>';
      if (_selStart) html += '<button class="bcd-btn ' + (_selEnd ? 'bcd-btn--ghost' : 'bcd-btn--primary') + ' bcd-btn--sm" type="button" data-act="sel-end">' +
        (_selEnd ? ('Сдвинуть конец → с. ' + _currentPage()) : 'Поставить конец выделения') + '</button>';
      if (_selStart && _selEnd) html += '<button class="bcd-btn bcd-btn--primary bcd-btn--sm" type="button" data-act="sel-finish">Готово</button>';
      html += '<button class="bcd-btn bcd-btn--quiet bcd-btn--sm" type="button" data-act="sel-cancel">Отмена</button>';
      html += '</div>';
    }
    bar.innerHTML = html;
  }

  /* §2 Identity ---------------------------------------------------------- */
  function _secIdentity() {
    var b = _activeBook;
    var chips = b.chips.map(function (c) {
      return '<span class="bcd-chip bcd-chip--' + c.kind + '">' + esc(c.label) + '</span>';
    }).join('');

    return '<div class="bcd-identity" data-sec="identity">' +
      '<div class="bcd-chips">' + chips + '</div>' +
      '<h2 class="bcd-title">' + esc(b.title) + '</h2>' +
      (b.subtitle ? '<p class="bcd-subtitle">' + esc(b.subtitle) + '</p>' : '') +
      '<p class="bcd-author">' +
        '<span class="bcd-author-link" data-act="author" tabindex="0" role="link">' + esc(b.author) + '</span>' +
      '</p>' +
      '<div class="bcd-meta-row">' +
        '<div class="bcd-meta-item"><span class="bcd-meta-label">Год</span><span class="bcd-meta-val">' + b.year + '</span></div>' +
        '<div class="bcd-meta-sep" aria-hidden="true"></div>' +
        '<div class="bcd-meta-item"><span class="bcd-meta-label">Страниц</span><span class="bcd-meta-val">' + b.pages + '</span></div>' +
        '<div class="bcd-meta-sep" aria-hidden="true"></div>' +
        '<div class="bcd-meta-item">' +
          '<span class="bcd-meta-label">Издание</span>' +
          '<span class="bcd-meta-val" data-bind="ed-label">' + esc(_activeEdition.badgeLabel) + '</span>' +
          /* edition indicator → opens the editions list (replaces the content) */
          '<button class="bcd-edition-switch" type="button" data-act="editions-open">Сменить <span aria-hidden="true">→</span></button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  /* Editions list — replaces the scroll content (cover/reader stay) ------ */
  function _editionsHTML() {
    var b = _activeBook;
    var editions = _priv ? b.editions : b.editions.filter(function (e) { return e.access === 'free'; });
    var list = editions.map(function (e) {
      var current = e.id === _activeEdition.id;
      return '<button class="bcd-edition-opt' + (current ? ' is-current' : '') + '" type="button" ' +
          'data-act="edition-pick" data-ed="' + esc(e.id) + '">' +
        '<div class="bcd-edition-opt-head">' +
          '<span class="bcd-edition-opt-label">' + esc(e.badgeLabel) + ' ' + esc(e.id) + '</span>' +
          '<span class="bcd-edition-opt-pages">' + (e.pages ? e.pages + ' с.' : '') + '</span>' +
        '</div>' +
        '<div class="bcd-vbadges">' +
          '<span class="bcd-vbadge bcd-vbadge--' + e.badge + '">' + esc(e.badgeLabel) + '</span>' +
          (current ? '<span class="bcd-vbadge bcd-vbadge--current">Текущее</span>' : '') +
        '</div>' +
        '<p class="bcd-edition-opt-note">' + esc(e.note) + '</p>' +
      '</button>';
    }).join('');
    return '<div class="bcd-editions">' +
      '<div class="bcd-editions-head">' +
        '<button class="bcd-editions-back" type="button" data-act="editions-back" aria-label="Назад к карточке">' +
          '<span aria-hidden="true">←</span> Назад</button>' +
        '<span class="bcd-editions-title">Издания</span>' +
      '</div>' +
      list +
    '</div>';
  }

  /* §3 My status — only when a relation exists (private only) ------------- */
  function _secMyStatus() {
    var ms = _activeBook.myStatus;
    if (!ms) return '';
    var hasShelf = !!ms.shelf;
    var hasProgress = ms.page > 0 && ms.total > 0;
    if (!hasShelf && !hasProgress) return '';

    var pct = hasProgress ? Math.round((ms.page / ms.total) * 100) : 0;
    var rows = '';
    if (hasShelf) {
      rows += '<div class="bcd-ms-row">' +
        '<button class="bcd-shelf" type="button" data-act="shelf">🔖 На полке: ' + esc(ms.shelf) + '</button>' +
      '</div>';
    }
    if (hasProgress) {
      rows += '<div class="bcd-progress-row">' +
        '<div class="bcd-progress-bar" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100"><div class="bcd-progress-fill" style="width:' + pct + '%"></div></div>' +
        '<span class="bcd-progress-label">с. ' + ms.page + '/' + ms.total + '</span>' +
        '<a class="bcd-btn bcd-btn--quiet bcd-btn--sm" href="../pages/reader.html?book=' + esc(_activeBookId) + '&v=' + esc(_activeEdition.v) + '&p=' + ms.page + '">Продолжить →</a>' +
      '</div>';
    }
    return '<div class="bcd-mystatus" data-sec="mystatus">' + rows + '</div>';
  }

  /* §4 Annotation + pull-quote ------------------------------------------- */
  function _secAnnotation() {
    var b = _activeBook;
    return '<div class="bcd-sec" data-sec="annotation">' +
      '<p class="bcd-sec-title">Аннотация</p>' +
      '<p class="bcd-annotation">' + esc(b.annotation) + '</p>' +
      (b.quote ?
        '<blockquote class="bcd-quote">' +
          '<p class="bcd-quote-text">' + esc(b.quote.text) + '</p>' +
          '<p class="bcd-quote-src">' + esc(b.quote.src) + '</p>' +
        '</blockquote>' : '') +
    '</div>';
  }

  /* §6 Ratings & reviews ------------------------------------------------- */
  function _secReviews() {
    var b = _activeBook;
    var agg = b.rating
      ? '<div class="bcd-agg">' +
          '<span class="bcd-agg-score">' + b.rating.score.toFixed(1) + '</span>' +
          starRow(b.rating.score) +
          '<span class="bcd-agg-note">Взвешенный рейтинг: <b>α·проф</b> + голоса участников. Голос Мэтра весит ×5.</span>' +
        '</div>'
      : '<div class="bcd-agg"><span class="bcd-agg-note">Пока нет оценок. Рецензии могут оставлять профессионалы.</span></div>';

    var list = (b.reviews || []).map(function (r) {
      return '<div class="bcd-review">' +
        '<div class="bcd-review-head">' +
          '<div class="bcd-person">' + avatar(r.initials, r.color) +
            '<div class="bcd-person-info">' +
              '<div class="bcd-person-name is-link" data-member="' + esc(r.userId) + '">' + esc(r.name) + '</div>' +
              '<div class="bcd-badges">' + repBadge(r.rep) + (r.pro ? '<span class="bcd-pro">✓ Профессионал</span>' : '') + '</div>' +
            '</div>' +
          '</div>' +
          '<span class="bcd-date">' + esc(r.date) + '</span>' +
        '</div>' +
        starRow(r.stars) +
        '<p class="bcd-review-text">' + esc(r.text) + '</p>' +
        '<div class="bcd-review-foot">' +
          _voteCtrl(r.votes) +
          '<span class="bcd-weight-note">Голос весом <b>' + esc(r.weight) + '</b></span>' +
        '</div>' +
      '</div>';
    }).join('');

    /* Private compose: cast/change rating + write review */
    var compose = '';
    if (_priv) {
      var mine = _activeBook.myStatus && _activeBook.myStatus.myRating;
      var picker = '';
      for (var i = 1; i <= 5; i++) picker += '<span data-val="' + i + '"' + (mine && i <= mine ? ' class="is-on"' : '') + '>★</span>';
      compose = '<div class="bcd-compose">' +
        '<span class="bcd-compose-label">' + (mine ? 'Изменить мою оценку' : 'Оценить книгу') + '</span>' +
        '<div class="bcd-starpick" data-act="starpick" role="group" aria-label="Выбрать оценку">' + picker + '</div>' +
        '<div class="bcd-compose-actions">' +
          '<button class="bcd-btn bcd-btn--ghost bcd-btn--sm" type="button" data-act="write-review">✍ Написать рецензию</button>' +
        '</div>' +
      '</div>';
    }

    return '<div class="bcd-sec" data-sec="reviews">' +
      '<div class="bcd-sec-head"><span class="bcd-sec-title">Оценки и рецензии</span>' +
        '<span class="bcd-sec-link" data-act="all-reviews">Все рецензии →</span></div>' +
      agg + list + compose +
    '</div>';
  }

  function _voteCtrl(base) {
    return '<div class="bcd-vote" data-base="' + base + '"' + (_priv ? '' : ' data-readonly="1"') + '>' +
      '<button class="bcd-vote-btn is-up" type="button" aria-label="Поддержать"' + (_priv ? '' : ' disabled') + '>▲</button>' +
      '<span class="bcd-vote-total">★ ' + base + '</span>' +
      '<button class="bcd-vote-btn is-down" type="button" aria-label="Не согласен"' + (_priv ? '' : ' disabled') + '>▼</button>' +
    '</div>';
  }

  /* §7 Discussion -------------------------------------------------------- */
  function _secDiscussion() {
    var b = _activeBook;
    var list = (b.discussion || []).map(function (c) {
      var replies = (c.replies || []).map(function (rp) {
        return '<div class="bcd-reply">' +
          '<p class="bcd-reply-to">↳ в ответ ' + esc(c.name) + '</p>' +
          '<p class="bcd-reply-text">' + esc(rp.text) + '</p>' +
          '<p class="bcd-reply-meta"><span class="bcd-person-name is-link" data-member="' + esc(rp.userId) + '">' + esc(rp.name) + '</span> ' + repBadge(rp.rep) + '</p>' +
        '</div>';
      }).join('');
      return '<div class="bcd-comment">' +
        '<div class="bcd-review-head">' +
          '<div class="bcd-person">' + avatar(c.initials, c.color) +
            '<div class="bcd-person-info">' +
              '<div class="bcd-person-name is-link" data-member="' + esc(c.userId) + '">' + esc(c.name) +
                (c.you ? '<span class="bcd-you-tag">Вы</span>' : '') + '</div>' +
              '<div class="bcd-badges">' + repBadge(c.rep) + '</div>' +
            '</div>' +
          '</div>' +
          '<span class="bcd-date">' + esc(c.date) + '</span>' +
        '</div>' +
        '<p class="bcd-comment-text">' + esc(c.text) + '</p>' +
        '<div class="bcd-comment-foot">' + _voteCtrl(c.votes) +
          (_priv ? '<button class="bcd-reply-btn" type="button" data-act="reply">Ответить</button>' : '') + '</div>' +
        (replies ? '<div class="bcd-replies">' + replies + '</div>' : '') +
      '</div>';
    }).join('');

    var addbox = '';
    if (_priv) {
      addbox = '<div class="bcd-addbox">' +
        '<textarea class="bcd-textarea" placeholder="Ваша мысль о книге или конкретном месте в тексте…"></textarea>' +
        '<div class="bcd-addbox-foot">' +
          '<button class="bcd-btn bcd-btn--quiet bcd-btn--sm" type="button" data-act="new-thread">Начать обсуждение</button>' +
          '<button class="bcd-btn bcd-btn--primary bcd-btn--sm" type="button" data-act="add-comment">Опубликовать</button>' +
        '</div>' +
      '</div>';
    }

    return '<div class="bcd-sec" data-sec="discussion">' +
      '<div class="bcd-sec-head"><span class="bcd-sec-title">Обсуждение</span>' +
        '<span class="bcd-sec-link" data-act="all-discussions">Все обсуждения →</span></div>' +
      (list || '<p class="bcd-empty-note">Обсуждение ещё не началось. Будьте первым.</p>') + addbox +
    '</div>';
  }

  /* §8 Community activity ------------------------------------------------ */
  function _secCommunity() {
    var b = _activeBook;
    var list = (b.community || []).map(function (m) {
      return '<div class="bcd-pulse-item">' + avatar(m.initials, m.color, true) +
        '<div class="bcd-pulse-info">' +
          '<div class="bcd-pulse-name" data-member="' + esc(m.userId) + '">' + esc(m.name) + '</div>' +
          '<div class="bcd-pulse-action">' + esc(m.action) + '</div>' +
        '</div>' +
      '</div>';
    }).join('');
    return '<div class="bcd-sec" data-sec="community">' +
      '<div class="bcd-sec-head"><span class="bcd-sec-title">Сейчас читают</span></div>' +
      (list || '<p class="bcd-empty-note">Пока никто не отметился на этой книге.</p>') +
    '</div>';
  }

  /* §9 Versions & access ------------------------------------------------- */
  function _secVersions() {
    var b = _activeBook;
    var cards = b.editions.map(function (e) {
      return '<div class="bcd-vcard' + (e.current ? ' is-current' : '') + '">' +
        '<div class="bcd-vcard-head"><span class="bcd-vcard-label">' + esc(e.badgeLabel) + ' ' + esc(e.id) + '</span>' +
          '<span class="bcd-vcard-pages">' + (e.pages ? e.pages + ' с.' : '') + '</span></div>' +
        '<div class="bcd-vbadges"><span class="bcd-vbadge bcd-vbadge--' + e.badge + '">' + esc(e.badgeLabel) + '</span>' +
          (e.current ? '<span class="bcd-vbadge bcd-vbadge--current">Текущая</span>' : '') + '</div>' +
        '<p class="bcd-vcard-note">' + esc(e.note) + '</p>' +
      '</div>';
    }).join('');
    return '<div class="bcd-sec" data-sec="versions">' +
      '<div class="bcd-sec-head"><span class="bcd-sec-title">Версии и доступ</span></div>' +
      '<div class="bcd-versions">' + cards + '</div>' +
      '<p class="bcd-access-note">Полное издание — по подписке (Участники+); Ранний доступ — Профессионалы+; Бесплатный фрагмент — все зарегистрированные.</p>' +
    '</div>';
  }

  /* §10 Requisites & citation ------------------------------------------- */
  function _secRequisites() {
    var b = _activeBook, ed = _activeEdition;
    var rows = b.requisites.map(function (r) {
      return '<tr><th>' + esc(r[0]) + '</th><td>' + esc(r[1]) + '</td></tr>';
    }).join('');
    var citeStr = b.citationFor(ed.v, 1);
    var deeplink = 'beta2alpha.academy/book/' + b.slug + '/read?v=' + ed.v + '&p=1';
    return '<div class="bcd-sec" data-sec="requisites">' +
      '<div class="bcd-sec-head"><span class="bcd-sec-title">Реквизиты и цитирование</span></div>' +
      '<table class="bcd-req-table"><tbody>' + rows + '</tbody></table>' +
      '<div class="bcd-citation">' +
        '<p class="bcd-citation-string" data-bind="cite-str">' + esc(citeStr) + '</p>' +
        '<div class="bcd-deeplink">' +
          '<span class="bcd-deeplink-url" data-bind="cite-url">' + esc(deeplink) + '</span>' +
          '<button class="bcd-btn bcd-btn--ghost bcd-btn--sm" type="button" data-act="copy-cite">Скопировать</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  /* Section index — drives the hover nav on the cover and the data-sec anchors. */
  function _scrollSections() {
    var ms = _activeBook.myStatus;
    var items = [{ key: 'identity', label: 'Издание' }];
    if (_priv && ms && (ms.shelf || ms.page > 0)) items.push({ key: 'mystatus', label: 'Мой статус' });
    items.push(
      { key: 'annotation', label: 'Аннотация' },
      { key: 'reviews', label: 'Оценки и рецензии' },
      { key: 'discussion', label: 'Обсуждение' },
      { key: 'community', label: 'Сейчас читают' },
      { key: 'versions', label: 'Версии' },
      { key: 'requisites', label: 'Реквизиты' }
    );
    return items;
  }

  /* Cover — full-bleed on the drawer's right edge; hovering reveals a
     vertical section index that scrolls the card content. */
  function _coverCol() {
    var b = _activeBook;
    var nav = _scrollSections().map(function (s) {
      return '<button class="bcd-cover-nav-item" type="button" data-sec="' + s.key + '">' + esc(s.label) + '</button>';
    }).join('');
    return '<div class="bcd-cover-col">' +
      '<div class="bcd-cover-clip"><img class="bcd-cover" src="' + b.cover + '" alt="Обложка: ' + esc(b.title) + '" loading="lazy"></div>' +
      '<nav class="bcd-cover-nav" aria-label="Разделы карточки">' + nav + '</nav>' +
      /* Vertical action tabs on the cover's right edge: book page, then reader */
      '<div class="bcd-cover-actions">' +
        '<button class="bcd-cover-page-btn" type="button" data-act="book-page" ' +
          'aria-label="Открыть страницу книги" title="Открыть страницу книги">' +
          '<span class="bcd-cover-page-label">Страница книги ↗</span>' +
        '</button>' +
        '<button class="bcd-cover-page-btn bcd-cover-reader-btn" type="button" data-act="fullpage" ' +
          'aria-label="Открыть в читалке" title="Открыть книгу в читалке">' +
          '<span class="bcd-cover-page-label">Читалка ↗</span>' +
        '</button>' +
      '</div>' +
    '</div>';
  }

  /* Open a full-height lightbox showing the book cover centred over everything. */
  function _openCoverLightbox() {
    var b = _activeBook;
    if (!b || !b.cover) return;

    var overlay = document.createElement('div');
    overlay.className = 'bcd-cover-lightbox';

    var img = document.createElement('img');
    img.className = 'bcd-cover-lb-img';
    img.src = b.cover;
    img.alt = 'Обложка: ' + b.title;

    overlay.appendChild(img);

    function close() {
      if (!overlay.parentNode) return;
      overlay.parentNode.removeChild(overlay);
      document.removeEventListener('keydown', onKey);
    }

    function onKey(e) { if (e.key === 'Escape') close(); }

    overlay.addEventListener('click', function (e) {
      if (e.target !== img) close();
    });

    document.addEventListener('keydown', onKey);
    /* Append to <html>, not <body>, so the body's CSS zoom does not scale the overlay. */
    document.documentElement.appendChild(overlay);
    requestAnimationFrame(function () { overlay.classList.add('is-open'); });
  }

  /* =====================================================================
     MINIREADER FLYOUT
     ===================================================================== */
  function _renderReader() {
    /* No chrome — just the large book pages over the dimmed page. Page-turn
       is by clicking the page halves (cursor hints w-/e-resize). Open/close
       is driven by the left strip-tab and the cover. */
    if (_priv) {
      return '<div class="bcd-reader">' +
        '<div class="bcd-reader-inner">' +
          '<div class="bcd-reader-body"><div class="bcd-reader-msg">Загрузка фрагмента…</div></div>' +
        '</div>' +
      '</div>';
    }
    /* Public: free fragment renders (CON-01: the free fragment is not gated),
       plus a floating login pill — the only overlay in the chrome-less view. */
    return '<div class="bcd-reader">' +
      '<div class="bcd-reader-inner">' +
        '<div class="bcd-reader-body"><div class="bcd-reader-msg">Загрузка фрагмента…</div></div>' +
        '<div class="bcd-reader-cta">' +
          '<span class="bcd-reader-cta-text">Бесплатный фрагмент</span>' +
          '<button class="bcd-btn bcd-btn--primary bcd-btn--sm" type="button" data-act="login">Войти и читать целиком</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function _toggleReader(forceState) {
    if (!_reader) return;
    var collapsed = (forceState != null) ? !forceState : !_reader.classList.contains('is-collapsed');
    _reader.classList.toggle('is-collapsed', collapsed);

    /* First expand: mount the engine and emit book.opened
       (semantics: book.opened fires when the mini-reader actually opens). */
    if (!collapsed && !_readerLoaded) {
      _readerLoaded = true;
      if (!_eng) _mountEngine();
      _emitBookOpened(_activeBook, _activeEdition);
    }

    /* the card widens to 40% when the reader is hidden, and the strip-tab
       gains a full-reader button stacked above it (see CSS) */
    _root.classList.toggle('is-reader-collapsed', collapsed);
    if (collapsed) {
      _root.classList.remove('is-too-narrow'); /* reader gone → card always visible */
      _root.classList.remove('is-tabs-compact'); /* bar gone → tabs can show normally */
    } else if (_constrainDrawerW) {
      _constrainDrawerW(); /* reader opened → enforce card+content ≥ 300px, hide card if needed */
    }
    if (_checkTabsCompact) _checkTabsCompact();
    _applyDrawerW();

    /* sync the strip-tab (the open/close control) — icon swaps with state:
       collapsed → «browse» (open the reader); open → «collapse» */
    _root.querySelectorAll('.bcd-reader-tab, .bcd-ctab[data-act="reader-toggle"]').forEach(function (b) {
      b.setAttribute('aria-expanded', String(!collapsed));
    });
    _root.querySelectorAll('[data-bind="tab-icon"]').forEach(function (el) {
      el.innerHTML = collapsed ? _browseIcon() : _collapseIcon();
    });
  }

  function _toggleFullscreen(forceState) {
    if (!_reader) return;
    var fs = (forceState != null) ? forceState : !_reader.classList.contains('is-fullscreen');
    _reader.classList.toggle('is-fullscreen', fs);
    if (fs && _reader.classList.contains('is-collapsed')) _toggleReader(true);
    _renderView(); /* re-fit canvases */
  }

  /* =====================================================================
     MINIREADER — hosts the shared BA.readerEngine (Browse mode, W-6.1)
     ===================================================================== */
  function _readerMsg(msg) {
    var body = _reader && _reader.querySelector('.bcd-reader-body');
    if (body) body.innerHTML = '<div class="bcd-reader-msg">' + esc(msg) + '</div>';
  }

  /* The engine owns .bcd-reader-body's inner DOM (the spread + slots, in the
     card's bcd-* classes). After each shell rebuild it lets us re-attach the
     card-only page-mode toggle that straddles the page bottom edge. */
  function _onEngineShell(stageEl) {
    var spread = stageEl.querySelector('.bcd-spread');
    if (spread && !spread.querySelector('.bcd-pagemode-btn')) {
      var btn = document.createElement('button');
      btn.className = 'bcd-pagemode-btn';
      btn.type = 'button';
      btn.setAttribute('data-act', 'pagemode');
      btn.setAttribute('aria-label', 'Переключить одну / две страницы');
      btn.title = 'Одна / две страницы';
      btn.innerHTML = _pagemodeIcon();
      spread.appendChild(btn);
    }
    if (_root) _root.setAttribute('data-pages', (_eng ? _eng.isTwoPage() : _twoPage) ? '2' : '1');
  }

  /* (Re)mount the engine into .bcd-reader-body. Always the free fragment in
     Browse (per-version corpus deferred). Destroys any prior instance. */
  function _mountEngine() {
    if (_eng) { try { _eng.destroy(); } catch (e) {} _eng = null; }
    var stage = _reader && _reader.querySelector('.bcd-reader-body');
    if (!stage) return;
    _buildViewerShell(); /* collapse bar + viewer flags (chrome around the stage) */
    _eng = BA.readerEngine.create({
      stage: stage,
      url: _activeBook.fragment,
      book: _activeBook,
      twoPage: _twoPage,
      mode: 'browse',
      cls: BCD_CLS,
      stageClasses: [],     /* don't pollute .bcd-reader-body with engine classes */
      clickToTurn: false,   /* the card's _onClick drives page turns + selection */
      onShell: _onEngineShell,
      onRender: function () { _updatePageRenderH(); },
      onError: function () { _readerMsg('Фрагмент недоступен'); }
    });
    _eng.load();
  }

  function _pagemodeIcon() {
    /* the icon hints the OTHER mode — what a click switches TO */
    return _twoPage
      ? '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="7" y="4" width="10" height="16" rx="1"/></svg>'
      : '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="4" width="8" height="16" rx="1"/><rect x="13" y="4" width="8" height="16" rx="1"/></svg>';
  }

  function _fullpageIcon() {
    return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"/></svg>';
  }
  /* Browse (expand reader / flip pages) — book-open glyph */
  function _browseIcon() {
    return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></svg>';
  }
  /* Collapse the reader — double chevron toward the card (right) */
  function _collapseIcon() {
    return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 17l5-5-5-5"/><path d="M13 17l5-5-5-5"/></svg>';
  }
  /* Chapters / table of contents — list glyph */
  function _chaptersIcon() {
    return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>';
  }
  /* Memory / user items — bookmark glyph */
  function _memoryIcon() {
    return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>';
  }

  /* Layout-switch glyph: panels (dock-left) vs full-bleed (over) */
  function _layoutIcon() {
    return _readerOver
      ? '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="11" height="16" rx="1.5"/><line x1="18" y1="4" x2="18" y2="20"/></svg>'
      : '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="1.5"/></svg>';
  }

  /* Widen card to maximum (expand arrows facing outward) */
  /* Two panels: left = pages (small), right = card (big) */
  function _cardWMaxIcon() {
    return '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="8" width="9" height="8" rx="1.5"/><rect x="13" y="2" width="9" height="20" rx="1.5"/></svg>';
  }
  /* Two panels: left = pages (big), right = card (small) */
  function _cardWMinIcon() {
    return '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="9" height="20" rx="1.5"/><rect x="13" y="8" width="9" height="8" rx="1.5"/></svg>';
  }

  /* Toggle the MiniReader between the left-flyout and over-the-card layouts. */
  function _toggleReaderLayout(forceState) {
    var next = (forceState != null) ? forceState : !_readerOver;
    /* Archive twoPage for the departing mode and restore for the arriving mode. */
    var entry = _loadReaderState()[_mediaKey()] || {};
    if (_readerOver) entry.twoPageOver = _twoPage; else entry.twoPageSide = _twoPage;
    _readerOver = next;
    var restoredTP = _readerOver ? entry.twoPageOver : entry.twoPageSide;
    if (typeof restoredTP === 'boolean') _twoPage = restoredTP;
    if (_root) _root.classList.toggle('is-reader-over', _readerOver);
    _applyDrawerW();
    _buildViewerShell(); /* refresh the toggle's glyph + tooltip + moves the collapse bar */
    if (_checkTabsCompact) _checkTabsCompact(); /* bar position changed → re-evaluate overlap */
    _renderView();       /* re-fit the canvases to the new width */
    _saveReaderState();
  }

  /* Builds the chrome AROUND the engine stage: the collapse bar (on _root) plus
     the viewer flags. The spread DOM itself is owned by the engine. */
  function _buildViewerShell() {
    if (_reader) _reader.classList.add('bcd-has-viewer');
    if (_root) _root.setAttribute('data-pages', _twoPage ? '2' : '1');
    /* Collapse bar must live on _root, not inside .bcd-reader.
       .bcd-reader has transform:translateX which creates a new containing block,
       trapping position:fixed descendants inside the reader's own coordinate system.
       On _root (position:fixed; inset:0) position:absolute resolves to the viewport. */
    var oldBar = _root && _root.querySelector('.bcd-reader-collapse');
    if (oldBar) oldBar.parentNode.removeChild(oldBar);
    if (_root) {
      var colBar = document.createElement('div');
      colBar.className = 'bcd-reader-collapse';
      colBar.innerHTML =
        '<button class="bcd-collapse-layout-btn" type="button" data-act="reader-layout" ' +
          'aria-label="' + (_readerOver ? 'Сдвинуть читалку влево от карточки' : 'Развернуть читалку поверх карточки') + '" ' +
          'title="' + (_readerOver ? 'Влево' : 'Поверх карточки') + '">' +
          _layoutIcon() +
        '</button>' +
        '<button class="bcd-collapse-main-btn" type="button" data-act="reader-toggle" ' +
          'aria-label="Свернуть миничиталку" title="Свернуть">' +
          '<span class="bcd-reader-collapse-ic">' + _collapseIcon() + '</span>' +
        '</button>' +
        '<div class="bcd-collapse-size-btns">' +
          '<button class="bcd-collapse-layout-btn" type="button" data-act="card-w-max" ' +
            'aria-label="Максимальная ширина карточки" title="Шире">' +
            _cardWMaxIcon() +
          '</button>' +
          '<button class="bcd-collapse-layout-btn" type="button" data-act="card-w-min" ' +
            'aria-label="Минимальная ширина карточки" title="Уже">' +
            _cardWMinIcon() +
          '</button>' +
        '</div>';
      _root.appendChild(colBar);
      /* Re-check compact-tabs now that the collapse bar has been (re)placed. */
      if (_checkTabsCompact) _checkTabsCompact();
    }
  }

  /* All page motion now goes through the shared engine (W-6.1). */
  function _renderView() { if (_eng) _eng.rerender(); }
  function _navPrev() { if (_eng) _eng.prev(); }
  function _navNext() { if (_eng) _eng.next(); }

  function _togglePageMode() {
    _twoPage = !_twoPage;
    if (_eng) _eng.setTwoPage(_twoPage); /* engine rebuilds the spread + re-renders; onShell re-attaches the toggle */
    if (_root) _root.setAttribute('data-pages', _twoPage ? '2' : '1');
    _saveReaderState();
  }

  /* After each render: measure rendered canvas height and store it so the
     collapse bar can be capped at 80% of the page (see CSS --bcd-page-render-h). */
  function _updatePageRenderH() {
    if (!_reader) return;
    requestAnimationFrame(function () {
      var canvas = _reader.querySelector('.bcd-spread canvas, .bcd-slot--single canvas');
      if (canvas) _reader.style.setProperty('--bcd-page-render-h', canvas.clientHeight + 'px');
    });
  }

  /* =====================================================================
     EDITION CHANGE — rebind version-bound fields (citation, labels)
     ===================================================================== */
  function _selectEdition(id) {
    var ed = null;
    for (var i = 0; i < _activeBook.editions.length; i++) {
      if (_activeBook.editions[i].id === id) { ed = _activeBook.editions[i]; break; }
    }
    if (!ed) return;
    _activeEdition = ed;
    var setText = function (sel, val) { var el = _root.querySelector(sel); if (el) el.textContent = val; };
    setText('[data-bind="ed-label"]', ed.badgeLabel);
    setText('[data-bind="cover-ed"]', ed.badgeLabel);
    setText('[data-bind="cite-str"]', _activeBook.citationFor(ed.v, 1));
    setText('[data-bind="cite-url"]', 'beta2alpha.academy/book/' + _activeBook.slug + '/read?v=' + ed.v + '&p=1');
    /* Note: Phase 1 has one fragment PDF per book, so the rendered mini-reader
       source does not change per edition (per-version corpus deferred). */
  }

  /* =====================================================================
     WIRING (event delegation on the root)
     ===================================================================== */
  function _wire() {
    _root.addEventListener('click', _onClick);
    _root.addEventListener('change', _onChange);

    /* edition <select> keyboard support already via change; author link key */
    var authorLink = _root.querySelector('.bcd-author-link');
    if (authorLink) authorLink.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); _openAuthor(); }
    });

    /* scroll-spy on the content column → section menu reveal + active highlight */
    var scroll = _root.querySelector('.bcd-scroll');
    if (scroll) scroll.addEventListener('scroll', _updateScrollSpy, { passive: true });
    _updateScrollSpy();
  }

  function _openAuthor() {
    if (!(window.BA && BA.authorCard)) return;
    var bookId = _activeBookId, authorId = _activeBook.authorId;
    _hideCard(); /* hide this card; the stack restores it when the author card closes */
    BA.cardStack.open(function () { BA.bookCard.open(bookId); },
                      function () { BA.authorCard.open(authorId); });
  }

  function _openMember(userId) {
    if (!(window.BA && BA.memberCard)) return;
    var bookId = _activeBookId;
    _hideCard();
    BA.cardStack.open(function () { BA.bookCard.open(bookId); },
                      function () { BA.memberCard.open(userId); });
  }

  function _openFullReader() {
    window.location.href = '../pages/reader.html?book=' + esc(_activeBookId) +
      '&v=' + esc(_activeEdition ? _activeEdition.v : '');
  }

  function _scrollToSection(key) {
    var scroll = _root.querySelector('.bcd-scroll');
    var target = scroll && scroll.querySelector('[data-sec="' + key + '"]');
    if (!scroll || !target) return;
    var top = scroll.scrollTop + (target.getBoundingClientRect().top - scroll.getBoundingClientRect().top) - 8;
    scroll.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }

  /* Scroll-spy: reveal the section menu once the content is scrolled and
     highlight EVERY section currently visible in the scroll viewport (not just
     the top one) — each section spans from its anchor to the next anchor. */
  function _updateScrollSpy() {
    var scroll = _root.querySelector('.bcd-scroll');
    if (!scroll) return;
    var cover = _root.querySelector('.bcd-cover-col');
    if (cover) {
      if (scroll.scrollTop > 8) {
        cover.classList.add('is-scrolled');
        clearTimeout(_scrollSpyTimer);
        /* Remove is-scrolled shortly after scroll stops; CSS 1 s delay then fades the nav */
        _scrollSpyTimer = setTimeout(function () { cover.classList.remove('is-scrolled'); }, 200);
      } else {
        clearTimeout(_scrollSpyTimer);
        cover.classList.remove('is-scrolled');
      }
    }

    var box = scroll.getBoundingClientRect();
    var vTop = box.top, vBot = box.bottom;
    var secs = [].slice.call(scroll.querySelectorAll('[data-sec]'));
    var visible = {}, anyVisible = false, topKey = null;
    secs.forEach(function (s, i) {
      var start = s.getBoundingClientRect().top;
      var next = secs[i + 1];
      var end = next ? next.getBoundingClientRect().top : vBot + 1; /* runs to viewport bottom */
      if (start <= vTop) topKey = s.getAttribute('data-sec'); /* fallback: section under the top edge */
      if (start < vBot && end > vTop) { visible[s.getAttribute('data-sec')] = true; anyVisible = true; }
    });
    if (!anyVisible && topKey) visible[topKey] = true; /* always keep one lit */
    _root.querySelectorAll('.bcd-cover-nav-item').forEach(function (b) {
      b.classList.toggle('is-active', !!visible[b.getAttribute('data-sec')]);
    });
  }

  function _onClick(e) {
    var t = e.target;

    /* member name links */
    var memberEl = t.closest('[data-member]');
    if (memberEl) { _openMember(memberEl.getAttribute('data-member')); return; }

    /* cover image lightbox — click anywhere on the cover clip (not on nav/action buttons) */
    var coverClip = t.closest('.bcd-cover-clip');
    if (coverClip) { _openCoverLightbox(); return; }

    /* cover hover section index → scroll the card content to that section */
    var navItem = t.closest('.bcd-cover-nav-item');
    if (navItem) { _scrollToSection(navItem.getAttribute('data-sec')); return; }

    /* vote controls (private only) */
    var voteBtn = t.closest('.bcd-vote-btn');
    if (voteBtn && _priv) { _onVote(voteBtn); return; }

    /* star picker (private only) */
    var star = t.closest('[data-act="starpick"] span');
    if (star && _priv) { _onStarPick(star); return; }

    var actEl = t.closest('[data-act]');
    var act = actEl && actEl.getAttribute('data-act');

    /* page-mode toggle / layout switch / open-in-full-reader (before close logic) */
    if (act === 'pagemode') { _togglePageMode(); return; }
    if (act === 'reader-layout') { _toggleReaderLayout(); return; }
    if (act === 'fullpage') { _openFullReader(); return; }
    if (act === 'card-w-max') {
      var iw = window.innerWidth, zs = _readerZoom();
      _setDrawerW(Math.max(Math.ceil(300 / zs), Math.floor((iw - 300) / zs)));
      return;
    }
    if (act === 'card-w-min') { _setDrawerW(Math.ceil(300 / _readerZoom())); return; }
    /* on-page collapse tab lives inside the reader — toggle, don't close */
    if (act === 'reader-toggle') { _toggleReader(); return; }

    /* selection toolbar (lives inside the reader) */
    if (act === 'sel-mode') { _selKind = actEl.getAttribute('data-mode'); _renderSelBar(); return; }
    if (act === 'sel-start') { _selPlace('start'); return; }
    if (act === 'sel-end') { _selPlace('end'); return; }
    if (act === 'sel-finish') { _selFinish(); return; }
    if (act === 'sel-cancel') { _selStart = _selEnd = null; _selKind = 'text'; _renderSelBar(); return; }
    if (act === 'sel-save-text') { _selSaveText(); return; }

    /* MiniReader: clicking a PAGE turns it (left of centre = prev, right = next).
       A click on a page SLOT — including an absent (empty) facing page — counts
       as a page click. Clicking the reader's empty area (outside the pages, but
       still over the reader / card) COLLAPSES the reader — it does NOT close the
       card (the dimmed backdrop still closes it). In selection mode the page is a
       selection tool: 'text' keeps the page still; 'cross' browses + refreshes. */
    if (t.closest('.bcd-reader') && !t.closest('.bcd-reader-cta') && !t.closest('.bcd-sel-bar')) {
      var onPage = (t.tagName === 'CANVAS') || !!t.closest('.bcd-slot');
      if (onPage) {
        if (_selectMode && _selKind === 'text') return; /* selecting visible text — keep page still */
        var rect = _reader.getBoundingClientRect();
        if (e.clientX < rect.left + rect.width / 2) _navPrev(); else _navNext();
        if (_selectMode) _renderSelBar(); /* refresh the «current page» labels */
      } else {
        _toggleReader(false); /* collapse the reader, keep the book card open */
      }
      return;
    }

    if (!actEl) return;

    switch (act) {
      case 'close': BA.bookCard.close(); break;
      case 'author': _openAuthor(); break;
      case 'book-page': window.location.href = '../pages/book.html?book=' + esc(_activeBookId); break;
      case 'login':
        BA.bookCard.close();
        if (window.BA && BA.frame && BA.frame.openLogin) BA.frame.openLogin();
        break;
      case 'reader-toggle': _toggleReader(); break;
      case 'editions-open': _showEditions(); break;
      case 'editions-back': _showContent(); break;
      case 'chapters': _showChapters(); break;
      case 'chapters-toggle-desc': _chaptersShowAllDesc = !_chaptersShowAllDesc; _showChapters(); break;
      case 'memory': _showMemory(); break;
      case 'subview-back': _showContent(); break;
      case 'goto-page': _goToReaderPage(parseInt(actEl.getAttribute('data-page'), 10) || 1); break;
      case 'goto-chapter': _goToChapter(parseInt(actEl.getAttribute('data-page'), 10) || 1); break;
      case 'mem-add-page': { var pp = _currentPage(); _memAdd({ type: 'mark', page: pp, label: 'с. ' + pp, comment: '' }); _refreshMemory(); break; }
      case 'mem-add-chapter': { var cp = _currentPage(); _memAdd({ type: 'mark', page: cp, label: _chapterAt(cp), chapter: _chapterAt(cp), comment: '' }); _refreshMemory(); break; }
      case 'mem-add-note': { var np = _currentPage(); var nt = window.prompt('Заметка к с. ' + np + ':', ''); if (nt != null && nt.trim()) _memAdd({ type: 'remark', page: np, label: 'с. ' + np, comment: nt.trim() }); _refreshMemory(); break; }
      case 'mem-add-selection': _selKind = 'cross'; _selStart = _selEnd = null; if (_reader && _reader.classList.contains('is-collapsed')) _toggleReader(true); _renderSelBar(); break;
      case 'mem-del': { var dh = actEl.closest('[data-mem-id]'); if (dh) { var did = dh.getAttribute('data-mem-id'); _memory[_activeBookId] = _mem().filter(function (it) { return it.id !== did; }); _refreshMemory(); } break; }
      case 'mem-comment': { var mh = actEl.closest('[data-mem-id]'); if (mh) { var mit = _memById(mh.getAttribute('data-mem-id')); if (mit) { var cm = window.prompt('Комментарий:', mit.comment || ''); if (cm != null) { mit.comment = cm.trim(); _refreshMemory(); } } } break; }
      case 'edition-pick': _selectEdition(actEl.getAttribute('data-ed')); _showContent(); break;
      case 'fullscreen': _toggleFullscreen(); break;
      case 'prev': _navPrev(); break;
      case 'next': _navNext(); break;
      case 'shelf': _cycleShelf(actEl); break;
      case 'write-review':
      case 'new-thread':
        if (window.BA && BA.remarkCard) BA.remarkCard.open();
        break;
      case 'copy-cite': _copyCite(actEl); break;
      case 'reply':
      case 'add-comment':
        if (window.BA && BA.remarkCard) BA.remarkCard.open();
        break;
      /* «Все …» / community / book-page links are blueprint stubs in Phase 1 */
      case 'all-reviews':
      case 'all-discussions':
        window.location.href = '../pages/book.html?book=' + _activeBookId;
        break;
      default: break;
    }
  }

  function _onChange(e) {
    var sel = e.target.closest('[data-act="edition"]');
    if (sel) _selectEdition(sel.value);
  }

  function _onVote(btn) {
    var ctrl = btn.closest('.bcd-vote');
    if (!ctrl) return;
    var up = ctrl.querySelector('.is-up'), dn = ctrl.querySelector('.is-down');
    var tot = ctrl.querySelector('.bcd-vote-total');
    var base = parseInt(ctrl.getAttribute('data-base'), 10) || 0;
    var isUp = btn.classList.contains('is-up');
    var was = btn.classList.contains('is-active');
    btn.classList.toggle('is-active', !was);
    if (!was) { (isUp ? dn : up).classList.remove('is-active'); }
    var u = up.classList.contains('is-active'), d = dn.classList.contains('is-active');
    tot.textContent = '★ ' + (base + (u ? 2 : d ? -1 : 0));
  }

  function _onStarPick(star) {
    var group = star.parentElement;
    var val = parseInt(star.getAttribute('data-val'), 10);
    group.querySelectorAll('span').forEach(function (s) {
      s.classList.toggle('is-on', parseInt(s.getAttribute('data-val'), 10) <= val);
    });
  }

  function _cycleShelf(btn) {
    var states = ['Читаю 📖', 'К прочтению 📕', 'Любимое 📚', 'Прочитано ✅'];
    var cur = btn.getAttribute('data-shelf') || '0';
    var i = (parseInt(cur, 10) + 1) % states.length;
    btn.setAttribute('data-shelf', i);
    btn.textContent = '🔖 На полке: ' + states[i];
  }

  function _copyCite(btn) {
    var str = _root.querySelector('[data-bind="cite-str"]');
    var text = str ? str.textContent : '';
    if (navigator.clipboard) { try { navigator.clipboard.writeText(text); } catch (e) {} }
    var prev = btn.textContent;
    btn.textContent = 'Скопировано ✓';
    setTimeout(function () { btn.textContent = prev; }, 1800);
  }

  /* =====================================================================
     PUBLIC API
     ===================================================================== */
  /* Visual hide without touching the card stack (used both by close() and when
     a sub-card is opened over this one). */
  function _hideCard() {
    if (_reader && _reader.classList.contains('is-fullscreen')) _toggleFullscreen(false);
    if (_backdrop) _backdrop.classList.remove('is-open');
    if (_root) _root.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  /* Decide the MiniReader's default layout + page-mode from the current size:
     – ×1.5 (magnify): reader OVER the card by default (any width)
     – ×1 (compact): reader over the card only in narrow / matchbox media
     – matchbox: one-page mode by default */
  /* ---- Reader layout state: persisted, per media size --------------------
     The 2-page mode + side/overlay choice is saved in localStorage keyed by
     media size — common across all pages of the site, separate per breakpoint.
     (Side/overlay only applies above «narrow» — matchbox/narrow are overlay-only.) */
  /* current effective page zoom (1 | 1.2 | 1.4) */
  function _readerZoom() {
    if (window.BA && BA.debug && BA.debug.getScale) return BA.debug.getScale() || 1;
    return parseFloat(getComputedStyle(document.body).zoom) || 1;
  }
  function _mediaKey() {
    var layoutW = window.innerWidth / _readerZoom();
    if (layoutW <= 600) return 'matchbox';
    if (layoutW <= 900) return 'narrow';
    if (layoutW <= 1200) return 'modest';
    return 'wide';
  }
  function _loadReaderState() {
    try { return JSON.parse(BA.store.get('ba-bcd-reader') || '{}') || {}; } catch (e) { return {}; }
  }
  function _saveReaderState() {
    var all = _loadReaderState();
    var prev = all[_mediaKey()] || {};
    /* Persist twoPage separately per layout mode so switching overlay ↔ sideview
       restores the page-mode preference the user set for each. */
    all[_mediaKey()] = {
      over: _readerOver,
      twoPageSide: _readerOver ? (typeof prev.twoPageSide === 'boolean' ? prev.twoPageSide : _twoPage) : _twoPage,
      twoPageOver: _readerOver ? _twoPage : (typeof prev.twoPageOver === 'boolean' ? prev.twoPageOver : _twoPage)
    };
    try { BA.store.set('ba-bcd-reader', JSON.stringify(all)); } catch (e) {}
  }

  /* ---- Drawer width — two separate saved values:
       'side-open'  when the reader is docked to the left in side mode   default 20%
       'wide'       when the reader is collapsed or in overlay mode       default 40%  */
  function _cardWidthState() {
    var collapsed = _reader && _reader.classList.contains('is-collapsed');
    return (collapsed || _readerOver) ? 'wide' : 'side-open';
  }
  function _saveDrawerW(w) {
    try {
      var d = JSON.parse(BA.store.get('ba-bcd-drawer-w') || '{}') || {};
      d[_mediaKey() + '-' + _cardWidthState()] = w;
      BA.store.set('ba-bcd-drawer-w', JSON.stringify(d));
    } catch (e) {}
  }
  function _setDrawerW(w) {
    if (!_root) return;
    var dr = _root.querySelector('.bcd-drawer');
    if (dr) dr.style.transition = 'none';
    _root.style.setProperty('--bcd-drawer-w', w + 'px');
    if (dr) { void dr.offsetWidth; dr.style.transition = ''; }
    _saveDrawerW(w);
  }
  function _applyDrawerW() {
    if (!_root) return;
    try {
      var d = JSON.parse(BA.store.get('ba-bcd-drawer-w') || '{}') || {};
      var saved = d[_mediaKey() + '-' + _cardWidthState()];
      var pct = (_cardWidthState() === 'side-open') ? 0.20 : 0.40;
      var z   = _readerZoom();
      var maxW = Math.floor((window.innerWidth - 300) / z); /* CSS px: content BCR ≥ 300 */
      var minW = Math.ceil(300 / z);                        /* CSS px: card BCR ≥ 300    */
      var safeMax = Math.max(minW, maxW);
      var w = saved
        ? Math.max(minW, Math.min(parseInt(saved, 10), safeMax))
        : Math.max(minW, Math.min(Math.round(window.innerWidth * pct / z), safeMax));
      /* Suppress the CSS width transition so the snap is instant and initW reads correctly */
      var dr = _root.querySelector('.bcd-drawer');
      if (dr) dr.style.transition = 'none';
      _root.style.setProperty('--bcd-drawer-w', w + 'px');
      if (dr) { void dr.offsetWidth; dr.style.transition = ''; } /* force reflow → restore */
    } catch (e) {}
  }

  /* ---- Mode / page-mode availability — UI size × media × side/overlay.
     UI size:  compact (zoom ≤ 0.9×)  ·  normal (1×)  ·  fat (zoom ≥ 1.1×)
     Media:    wide > 1200  ·  modest 900–1200  ·  narrow 600–900  ·  matchbox ≤ 600
     Controls that drive an unavailable choice are hidden (_buildViewerShell). */

  function _uiSize() {
    var z = _readerZoom();
    if (z <= 0.9) return 'compact';
    if (z >= 1.1) return 'fat';
    return 'normal';
  }

  /* Compact content in the scroll column (smaller padding + type). */
  function _contentSize() {
    var m = _mediaKey(), ui = _uiSize();
    if (ui === 'compact') return 'compact';
    if (ui === 'fat') return (m === 'wide') ? 'normal' : 'compact';
    return (m === 'modest') ? 'compact' : 'normal'; /* normal UI */
  }

  /* Tight height (≤ 600 px) enables vertical bleed for the book pages. */
  function _areaHeight() {
    return (window.innerHeight / _readerZoom()) <= 600 ? 'tight' : 'normal';
  }

  function _sideDisabled() { return false; }    /* sideview always allowed; is-too-narrow handles truly-too-narrow */
  function _twoPageDisabled() { return false; } /* 2-page always allowed; user controls the mode */

  function _applyMediaClass() {
    if (!_root) return;
    _root.setAttribute('data-media', _mediaKey());
    _root.setAttribute('data-ui', _uiSize());
    _root.setAttribute('data-content', _contentSize());
    _root.setAttribute('data-height', _areaHeight());
  }

  /* Keep the centred browse tab clear of the top stack (Главы/Выдержки). Cap its
     height to the room that remains — symmetric top & bottom since it stays
     centred — so a short visible content area shrinks it instead of letting it
     cover the buttons above. clientHeight already nets out a docked console. */
  function _fitBrowseTab() {
    if (!_root) return;
    var drawer = _root.querySelector('.bcd-drawer');
    var topStack = _root.querySelector('.bcd-tab-stack--top');
    var browse = _root.querySelector('.bcd-reader-tab');
    if (!drawer || !topStack || !browse) return;
    var reserve = topStack.offsetTop + topStack.offsetHeight + 12; /* px above (incl. a gap) */
    var maxH = Math.max(36, drawer.clientHeight - 2 * reserve);
    browse.style.maxHeight = maxH + 'px';
    browse.style.minHeight = Math.min(120, maxH) + 'px';
  }

  /* Viewport crossed a breakpoint while a card is open → re-evaluate the media
     size and enforce the constraints (drop side mode / two-page if now unavailable). */
  function _reflowReader() {
    if (!_root || !_root.classList.contains('is-open')) return;
    _applyMediaClass();
    /* Fast compact-bar check against the existing collapse bar whose CSS position
       (top: 50%) has already resolved to the new viewport height. This fires before
       the full _buildViewerShell rebuild so compact mode switches without a frame delay. */
    if (_checkTabsCompact) _checkTabsCompact();
    var changed = false;
    _buildViewerShell(); /* refresh button glyphs */
    _renderView();
    _fitBrowseTab();
    if (changed) _saveReaderState();
  }
  /* Compact-bar check runs first on every resize so it switches within the same
     frame that the bar moves — no waiting for the full shell rebuild. */
  window.addEventListener('resize', function () { if (_checkTabsCompact) _checkTabsCompact(); });
  window.addEventListener('resize', _reflowReader);

  function _readerDefaults() {
    var overlayOnly = _sideDisabled();
    var key = _mediaKey();
    /* On narrow/matchbox screens default to overlay for better reading width;
       sideview is still switchable (user can save their preference below). */
    _readerOver = overlayOnly || key === 'narrow' || key === 'matchbox';
    _twoPage = key !== 'matchbox';                                    /* one page in matchbox, spread otherwise */
    /* restore the saved per-media choice over the computed defaults */
    var saved = _loadReaderState()[key];
    if (saved) {
      if (typeof saved.over === 'boolean' && !overlayOnly) _readerOver = saved.over;
      /* load twoPage for the resolved mode; fall back to the legacy flat field */
      var savedTP = _readerOver ? saved.twoPageOver : saved.twoPageSide;
      if (typeof savedTP === 'boolean') _twoPage = savedTP;
      else if (typeof saved.twoPage === 'boolean') _twoPage = saved.twoPage;
    }
  }

  /* Surgically update session-dependent elements when the user logs in/out
     while the card is already open. Avoids a full re-render that would destroy
     the in-flight PDF canvas and scroll state. */
  function _applySessionState() {
    if (!_root || !_root.classList.contains('is-open')) return;
    var wasPriv = _priv;
    _priv = !!(window.BA && BA.session && BA.session.isPrivate());
    if (_priv === wasPriv) return;

    /* 1. Reader CTA — add the login pill for public, remove it for members. */
    var inner = _reader && _reader.querySelector('.bcd-reader-inner');
    if (inner) {
      var existingCta = inner.querySelector('.bcd-reader-cta');
      if (_priv && existingCta) {
        existingCta.remove();
      } else if (!_priv && !existingCta) {
        var cta = document.createElement('div');
        cta.className = 'bcd-reader-cta';
        cta.innerHTML =
          '<span class="bcd-reader-cta-text">Бесплатный фрагмент</span>' +
          '<button class="bcd-btn bcd-btn--primary bcd-btn--sm" type="button" data-act="login">Войти и читать целиком</button>';
        inner.appendChild(cta);
      }
    }

    /* 2. Action bar — swap "Читать →" link and "Войти и читать →" button. */
    var actions = _root.querySelector('.bcd-actions');
    if (actions) {
      var old = actions.querySelector('a.bcd-btn--primary, button[data-act="login"].bcd-btn--primary');
      if (old) {
        var replacement;
        if (_priv) {
          replacement = document.createElement('a');
          replacement.className = 'bcd-btn bcd-btn--primary';
          replacement.href = '../pages/reader.html?book=' + esc(_activeBookId) + '&v=' + esc(_activeEdition.v);
          replacement.textContent = 'Читать →';
        } else {
          replacement = document.createElement('button');
          replacement.className = 'bcd-btn bcd-btn--primary';
          replacement.type = 'button';
          replacement.setAttribute('data-act', 'login');
          replacement.textContent = 'Войти и читать →';
        }
        old.replaceWith(replacement);
      }
    }
  }
  document.addEventListener('ba:session-change', _applySessionState);

  window.BA.bookCard = {
    open: function (bookId) {
      if (window.BA && BA.cardStack) BA.cardStack.enter();
      var bd = window.BA && BA.bookData;
      if (!bd) { try { console.error('[book-card] BA.bookData not loaded'); } catch (e) {} return; }
      /* back-compat aliases for the legacy 3-book keys */
      var ALIAS = { bion: 'bion-learning', goret: 'nicoli-burning', ferro: 'ferro-emotions' };
      var slug = ALIAS[bookId] || bookId;
      var book = bd.get(slug) || bd.get(bd.SLUGS[0]);
      _activeBookId = book.slug;
      /* compat fields the card UI still reads (data lives in book-data.js) */
      book.annotation = book.annotation || book.description;
      book.fragment = book.fragment || book.fragmentPdf;
      if (!book.citationFor) book.citationFor = function (v, p) { return bd.citation(book, v, p); };
      _activeBook = book;
      _priv = !!(window.BA && BA.session && BA.session.isPrivate());

      /* lazy-load the rich TOC (+ pull-quotes) from the pack; refresh the
         chapters subview if it is the one currently shown. */
      bd.load(book.slug).then(function (full) {
        if (_activeBook !== book) return; /* card moved on */
        book.chapters = full.chapters && full.chapters.length ? full.chapters : book.chapters;
        if (_root && _root.querySelector('.bcd-scroll .bcd-chapters')) _showChapters();
      }).catch(function () {});

      /* default edition: current for private; the free fragment for public */
      var defEd = bd.defaultEdition(book, _priv) || book.editions[0];
      _activeEdition = defEd;

      _buildShell();
      _page = 1;
      _applyMediaClass(); /* data-media drives the zoom-aware card widths in CSS */
      _readerDefaults(); /* sets _twoPage + _readerOver from the current size */
      _readerLoaded = true;       /* the MiniReader opens with the card */
      _render();

      _backdrop.classList.add('is-open');
      _root.classList.add('is-open');
      _root.classList.remove('is-reader-collapsed'); /* reader opens with the card */
      _root.classList.toggle('is-reader-over', _readerOver);
      _fitBrowseTab(); /* size the centred browse tab to the content area */
      document.body.style.overflow = 'hidden';

      /* MiniReader is open by default → mount the engine + emit book.opened now */
      _mountEngine();
      _emitBookOpened(book, _activeEdition);
    },
    close: function () {
      if (!_root) return;
      _hideCard();
      if (window.BA && BA.cardStack) BA.cardStack.back(); /* reopen parent card if stacked */
    }
  };
})();

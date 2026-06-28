/* components/reader-engine.js — the ONE PDF renderer, two modes
   ────────────────────────────────────────────────────────────────────────────
   Factored out of book-card.js's mini-reader pipeline (lazy PDF.js, the
   two-page spread model, the fixed scale:2.5 canvas render, recto/verso
   pairing, lone-page ghosts). Both reader modes run this same engine:

     • Browse  — the in-card overlay mini-reader (book-card.js) draws pages over
                 the content on a transparent background. Quick glance.
     • Delve   — pages/reader.html: the full content window + full-screen toggle.

   There is NO fit-rule redesign (operator, 2026-06-28; the ideal_reader lab is
   retired): pages render at a constant scale and CSS sizes the result, exactly
   as the book-card mini-reader always did. Spread math is shared with
   BA.bookData so card / page / engine never diverge.

   Spec refs: TD-7 (renderer, PDF.js); system-model §4.3 (two named modes);
   book-card-and-pages.md §2.5–2.6. Feature area: Web PDF Reader.

   USAGE
     var eng = BA.readerEngine.create({
       stage: el,            // engine owns the DOM it builds inside this element
       url: pdfUrl,
       book: bookDataEntry,  // for spread alignment (firstPageOdd) + math
       twoPage: true,
       onLoad: fn(numPages), onRender: fn(state), onError: fn(msg),
       clickToTurn: true     // bind click-halves page turn on the stage
     });
     eng.load();
     // eng.next() / prev() / goToPage(p) / setTwoPage(bool) / state() /
     //    rerender() / destroy()
   ──────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';
  window.BA = window.BA || {};

  /* ---- asset base (resolve pdf.min.js relative to this script) ---- */
  function _assetBase() {
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].getAttribute('src') || '';
      var m = src.match(/^(.*\/)components\/reader-engine\.js(?:\?.*)?$/);
      if (m) return m[1] + 'assets/';
    }
    return (/\/pages\//.test(location.pathname) ? '../' : './') + 'assets/';
  }
  var ASSETS = _assetBase();

  /* ---- shared lazy PDF.js loader (one network load per page) ---- */
  var _pdfjsPromise = null;
  function ensurePdfjs() {
    if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
    if (_pdfjsPromise) return _pdfjsPromise;
    _pdfjsPromise = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = ASSETS + 'pdf.min.js';
      s.onload = function () {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = ASSETS + 'pdf.worker.min.js';
          resolve(window.pdfjsLib);
        } else reject(new Error('pdfjsLib missing'));
      };
      s.onerror = function () { _pdfjsPromise = null; reject(new Error('pdf.min.js failed')); };
      document.head.appendChild(s);
    });
    return _pdfjsPromise;
  }

  /* ---- self-injected CSS (generic .re-* classes; tokens-only) ---- */
  function injectCSS() {
    if (document.getElementById('ba-re-css')) return;
    var css = [
      '.re-spread{display:flex;align-items:center;justify-content:center;gap:var(--space-3,12px);',
      'width:100%;height:100%;}',
      '.re-spread.is-single{gap:0;}',
      '.re-slot{display:flex;align-items:center;justify-content:center;min-width:0;}',
      '.re-slot canvas{display:block;max-width:100%;max-height:100%;width:auto;height:auto;',
      'box-shadow:0 2px 10px rgba(20,16,12,.18),0 12px 40px rgba(20,16,12,.14);',
      'border-radius:2px;background:#fff;}',
      '.re-page-ghost{border:1px dashed color-mix(in srgb,var(--ink,#1c2128) 22%,transparent);',
      'border-radius:2px;width:auto;height:100%;max-height:100%;opacity:.5;',
      'aspect-ratio:1/1.414;}',
      /* Delve mode: fit a spread into the available window height */
      '.re-stage{position:relative;width:100%;height:100%;display:flex;align-items:center;justify-content:center;}',
      '.re-stage.re-mode-delve .re-spread{height:100%;}',
      '.re-stage.re-mode-delve .re-slot canvas{max-height:100%;}',
      '.re-clickable{cursor:pointer;}',
      '.re-msg{font-family:var(--font-sans,system-ui);font-size:var(--fs-small,14px);',
      'color:var(--ink-faint,#9ca3af);padding:var(--space-6,24px);text-align:center;}'
    ].join('');
    var st = document.createElement('style');
    st.id = 'ba-re-css';
    st.textContent = css;
    document.head.appendChild(st);
  }

  function create(opts) {
    opts = opts || {};
    injectCSS();
    var stage = opts.stage;
    var book = opts.book || null;
    var scale = opts.scale || 2.5;
    var mode = opts.mode || 'browse';            /* 'browse' | 'delve' */
    var twoPage = opts.twoPage !== false;
    var url = opts.url;

    /* Class names are parameterised so a host can render with its OWN CSS:
       Delve / book.html use the default `re-*` set (styled by injectCSS above);
       the book CARD passes its `bcd-*` set so its bespoke book-card.css applies
       unchanged — one engine, two visual skins (W-6.1). */
    var _c = opts.cls || {};
    var C = {
      spread: _c.spread || 're-spread',
      single: _c.single || 'is-single',
      slot: _c.slot || 're-slot',
      left: _c.left || 're-slot--left',
      right: _c.right || 're-slot--right',
      slotSingle: _c.slotSingle || 're-slot--single',
      ghost: _c.ghost || 're-page-ghost',
      msg: _c.msg || 're-msg'
    };
    /* classes added to the host stage element (default = the engine's own layout
       classes; the card passes [] so the engine doesn't pollute .bcd-reader-body). */
    var STAGE_CLASSES = opts.stageClasses || ['re-stage', 're-mode-' + mode];

    var pdfDoc = null, numPages = 0, numSpreads = 0;
    /* intended position (updated immediately on nav) vs shown position (after
       the canvas render lands). A pump() serializes renders and always catches
       up to the latest intent, so rapid clicks land on the final page. */
    var spread = 0, page = 1, shownSpread = -1, shownPage = -1;
    var rendering = false, token = 0, destroyed = false;

    function startsRight() { return BA.bookData ? BA.bookData.startsRight(book) : !!(book && book.firstPageOdd); }
    function spreadPages(k) {
      if (BA.bookData) return BA.bookData.spreadPages(book, k, numPages);
      if (startsRight()) return { left: (k > 0 && 2 * k <= numPages) ? 2 * k : null, right: (2 * k + 1 <= numPages) ? 2 * k + 1 : null };
      return { left: (2 * k + 1 <= numPages) ? 2 * k + 1 : null, right: (2 * k + 2 <= numPages) ? 2 * k + 2 : null };
    }
    function spreadOf(p) { return BA.bookData ? BA.bookData.spreadOf(book, p) : (startsRight() ? Math.floor(p / 2) : Math.floor((p - 1) / 2)); }

    function msg(text) { if (stage) stage.innerHTML = '<div class="' + C.msg + '">' + String(text) + '</div>'; }
    function emitRender() { if (opts.onRender) opts.onRender(state()); }

    function buildShell() {
      var slots = twoPage
        ? '<div class="' + C.slot + ' ' + C.left + '"></div><div class="' + C.slot + ' ' + C.right + '"></div>'
        : '<div class="' + C.slot + ' ' + C.slotSingle + '"></div>';
      stage.innerHTML = '<div class="' + C.spread + (twoPage ? '' : ' ' + C.single) + '">' + slots + '</div>';
      STAGE_CLASSES.forEach(function (c) { stage.classList.add(c); });
      if (opts.clickToTurn) stage.classList.add('re-clickable');
      /* let the host inject overlay controls into the freshly-built spread
         (the card re-attaches its page-mode toggle here) */
      if (opts.onShell) opts.onShell(stage);
    }

    function renderSlot(slot, pageNum) {
      slot.innerHTML = '';
      if (pageNum == null || !pdfDoc) return null;
      return pdfDoc.getPage(pageNum).then(function (pg) {
        if (destroyed) return;
        var vp = pg.getViewport({ scale: scale });
        var canvas = document.createElement('canvas');
        canvas.width = Math.round(vp.width);
        canvas.height = Math.round(vp.height);
        slot.appendChild(canvas);
        return pg.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
      });
    }

    function decorateGhosts() {
      if (!twoPage) return;
      var sp = stage.querySelector('.' + C.spread); if (!sp) return;
      var canvas = sp.querySelector('canvas');
      ['.' + C.left, '.' + C.right].forEach(function (sel) {
        var slot = sp.querySelector(sel); if (!slot) return;
        var old = slot.querySelector('.' + C.ghost); if (old) old.remove();
        if (canvas && !slot.querySelector('canvas')) {
          var ghost = document.createElement('div');
          ghost.className = C.ghost;
          ghost.style.aspectRatio = canvas.width + ' / ' + canvas.height;
          slot.appendChild(ghost);
        }
      });
    }

    /* render whatever the intended position is; if a render is in flight, defer
       and re-pump when it finishes so the latest intent always wins. */
    function pump() {
      if (!pdfDoc || rendering || destroyed) return;
      if (twoPage) {
        if (spread === shownSpread) return;
        var idx = spread, pg = spreadPages(idx);
        var left = stage.querySelector('.' + C.left), right = stage.querySelector('.' + C.right);
        if (!left || !right) return;
        rendering = true;
        Promise.all([renderSlot(left, pg.left), renderSlot(right, pg.right)].filter(Boolean))
          .then(function () { rendering = false; shownSpread = idx; decorateGhosts(); emitRender(); pump(); })
          .catch(function () { rendering = false; });
      } else {
        if (page === shownPage) return;
        var p = page, slot = stage.querySelector('.' + C.slotSingle);
        if (!slot) return;
        rendering = true;
        Promise.all([renderSlot(slot, p)].filter(Boolean))
          .then(function () { rendering = false; shownPage = p; emitRender(); pump(); })
          .catch(function () { rendering = false; });
      }
    }
    function showSpread(idx) { if (!pdfDoc) return; spread = Math.max(0, Math.min(idx, numSpreads - 1)); pump(); }
    function showOne(p) { if (!pdfDoc) return; page = Math.max(1, Math.min(p, numPages)); pump(); }
    function renderView() { shownSpread = -1; shownPage = -1; pump(); }

    function currentPage() {
      if (twoPage) { var pg = spreadPages(spread); return pg.right || pg.left || 1; }
      return page;
    }

    function load() {
      var myTok = ++token;
      msg('Загрузка…');
      ensurePdfjs().then(function (pdfjsLib) {
        if (destroyed || myTok !== token) return;
        return pdfjsLib.getDocument(url).promise;
      }).then(function (doc) {
        if (!doc) return;
        if (destroyed || myTok !== token) { doc.destroy && doc.destroy(); return; }
        pdfDoc = doc; numPages = doc.numPages;
        numSpreads = BA.bookData ? BA.bookData.numSpreads(book, numPages)
          : (startsRight() ? Math.floor(numPages / 2) + 1 : Math.ceil(numPages / 2));
        spread = 0; page = 1;
        buildShell();
        if (opts.onLoad) opts.onLoad(numPages);
        renderView();
      }).catch(function (e) {
        if (destroyed) return;
        msg('Фрагмент недоступен');
        if (opts.onError) opts.onError(String(e && e.message || e));
      });
    }

    /* ---- public API ---- */
    var api = {
      load: load,
      showSpread: showSpread,
      showOne: showOne,
      next: function () { if (twoPage) showSpread(spread + 1); else showOne(page + 1); },
      prev: function () { if (twoPage) showSpread(spread - 1); else showOne(page - 1); },
      goToPage: function (p) {
        p = Math.max(1, Math.min(p, numPages || p));
        if (twoPage) showSpread(spreadOf(p)); else showOne(p);
      },
      setTwoPage: function (v) {
        v = !!v; if (v === twoPage) return;
        var cur = currentPage();
        twoPage = v;
        shownSpread = -1; shownPage = -1;
        buildShell();
        if (v) { spread = Math.max(0, Math.min(spreadOf(cur), numSpreads - 1)); } else { page = cur; }
        pump();
      },
      isTwoPage: function () { return twoPage; },
      currentPage: currentPage,
      numPages: function () { return numPages; },
      numSpreads: function () { return numSpreads; },
      /* extract a page's text (selection / citation snippets in the card) */
      getPageText: function (p) {
        if (!pdfDoc) return Promise.resolve('');
        var pp = Math.max(1, Math.min((p | 0) || 1, numPages || 1));
        return pdfDoc.getPage(pp).then(function (pg) { return pg.getTextContent(); })
          .then(function (tc) { return tc.items.map(function (i) { return i.str; }).join(' ').replace(/\s+/g, ' ').trim(); })
          .catch(function () { return ''; });
      },
      rerender: function () { if (pdfDoc) renderView(); },
      setUrl: function (u, newBook) { url = u; if (newBook !== undefined) book = newBook; },
      state: state,
      destroy: function () {
        destroyed = true; token++;
        if (pdfDoc && pdfDoc.destroy) { try { pdfDoc.destroy(); } catch (e) {} }
        pdfDoc = null;
      }
    };

    function state() {
      return { page: currentPage(), spread: spread, numPages: numPages,
        numSpreads: numSpreads, twoPage: twoPage, startsRight: startsRight(), mode: mode };
    }

    /* click-halves page turn (Browse default) */
    if (opts.clickToTurn && stage) {
      stage.addEventListener('click', function (e) {
        if (e.target.closest('[data-no-turn]')) return;
        var box = stage.getBoundingClientRect();
        if (e.clientX < box.left + box.width / 2) api.prev(); else api.next();
      });
    }

    return api;
  }

  window.BA.readerEngine = { create: create, ensurePdfjs: ensurePdfjs, ASSETS: ASSETS };
})();

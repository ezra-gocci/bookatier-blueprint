/* components/debug.js — Debug console sidebar (right-anchored, ~420px, 6 tabs)
   BA.debug.open() / .close()
   Always accessible — no auth gating in blueprint.
   Users tab is the auth control: click user → BA.session.set(), «Анонимный» → clear(). */
(function () {
  'use strict';
  window.BA = window.BA || {};

  var CSS = [
    /* Sidebar shell */
    '.dbg-sidebar{position:fixed;top:0;right:0;bottom:0;z-index:var(--z-overlay,780);',
    'width:var(--dbg-w,420px);max-width:100vw;',
    'background:#1F1B18;color:#ECE3D6;',
    'display:flex;flex-direction:column;',
    'transform:translateX(100%);transition:transform 280ms var(--ease-out-quart,cubic-bezier(.25,.46,.45,.94)),',
    'width 280ms var(--ease-out-quart,cubic-bezier(.25,.46,.45,.94));',
    'box-shadow:-12px 0 48px rgba(0,0,0,.45);}',
    '.dbg-sidebar.is-open{transform:translateX(0);}',
    /* Top bar */
    '.dbg-topbar{padding:0 16px;height:44px;border-bottom:1px solid rgba(236,227,214,.1);',
    'display:flex;align-items:center;gap:8px;flex-shrink:0;}',
    '.dbg-title{font-size:13px;font-weight:600;letter-spacing:.04em;color:rgba(236,227,214,.6);flex:1;}',
    '.dbg-close{background:none;border:none;color:rgba(236,227,214,.5);cursor:pointer;',
    'font-size:18px;line-height:1;padding:4px;}',
    '.dbg-close:hover{color:#ECE3D6;}',
    /* Tabs */
    '.dbg-tabs{display:flex;border-bottom:1px solid rgba(236,227,214,.1);flex-shrink:0;overflow-x:auto;}',
    '.dbg-tab{padding:10px 14px;background:none;border:none;color:rgba(236,227,214,.45);',
    'font-size:12px;cursor:pointer;white-space:nowrap;border-bottom:2px solid transparent;',
    'transition:all 140ms;flex-shrink:0;}',
    '.dbg-tab.is-active{color:#ECE3D6;border-bottom-color:#DB7B5D;}',
    '.dbg-tab:hover{color:rgba(236,227,214,.8);}',
    '.dbg-tab-text{margin-left:5px;}',
    /* Icon-only fallback when the 6 labelled tabs cannot fit the console width */
    '.dbg-tabs.is-compact .dbg-tab{flex:1;padding:10px 0;text-align:center;}',
    '.dbg-tabs.is-compact .dbg-tab-text{display:none;}',
    /* Panels */
    '.dbg-panel{flex:1;overflow-y:auto;display:none;padding:0;}',
    '.dbg-panel.is-active{display:flex;flex-direction:column;}',
    /* Section labels */
    '.dbg-label{font-size:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;',
    'color:rgba(236,227,214,.35);padding:14px 16px 6px;flex-shrink:0;}',
    /* User rows */
    '.dbg-user-row{display:flex;align-items:center;gap:10px;padding:10px 16px;cursor:pointer;',
    'border-bottom:1px solid rgba(236,227,214,.06);transition:background 120ms;}',
    '.dbg-user-row:hover{background:rgba(236,227,214,.05);}',
    '.dbg-user-row.is-active{background:rgba(219,123,93,.12);}',
    '.dbg-user-av{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;',
    'justify-content:center;font-size:13px;font-weight:600;flex-shrink:0;}',
    '.dbg-user-name{font-size:13px;font-weight:500;margin:0 0 2px;}',
    '.dbg-user-meta{font-size:11px;color:rgba(236,227,214,.45);margin:0;}',
    '.dbg-user-badge{margin-left:auto;font-size:10px;font-weight:600;',
    'padding:2px 8px;border-radius:10px;background:rgba(219,123,93,.25);color:#DB7B5D;}',
    /* Anon row */
    '.dbg-anon-row{display:flex;align-items:center;gap:10px;padding:10px 16px;cursor:pointer;',
    'border-bottom:1px solid rgba(236,227,214,.06);transition:background 120ms;',
    'color:rgba(236,227,214,.5);}',
    '.dbg-anon-row:hover{background:rgba(236,227,214,.05);color:#ECE3D6;}',
    /* Data rows */
    '.dbg-data-row{display:flex;justify-content:space-between;align-items:center;',
    'padding:8px 16px;border-bottom:1px solid rgba(236,227,214,.06);font-size:12px;}',
    '.dbg-data-key{color:rgba(236,227,214,.5);}',
    '.dbg-data-val{color:#DB7B5D;font-family:monospace;font-size:11px;}',
    /* Event log rows */
    '.dbg-ev-row{display:grid;grid-template-columns:70px 140px 36px 1fr;gap:0;',
    'padding:7px 16px;border-bottom:1px solid rgba(236,227,214,.05);font-family:monospace;font-size:11px;}',
    '.dbg-ev-time{color:rgba(236,227,214,.4);}',
    '.dbg-ev-type{color:#DB7B5D;}',
    '.dbg-ev-actor{color:rgba(236,227,214,.5);text-align:center;}',
    '.dbg-ev-body{color:rgba(236,227,214,.7);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
    /* Responsive panel */
    '.dbg-vp-row{display:flex;justify-content:space-between;align-items:center;',
    'padding:10px 16px;border-bottom:1px solid rgba(236,227,214,.06);}',
    '.dbg-vp-label{font-size:12px;color:rgba(236,227,214,.5);}',
    '.dbg-vp-val{font-size:13px;font-family:monospace;color:#ECE3D6;}',
    /* Sim buttons */
    '.dbg-sim-btn{margin:0 16px 8px;padding:8px 14px;background:rgba(236,227,214,.06);',
    'border:1px solid rgba(236,227,214,.12);border-radius:8px;color:#ECE3D6;font-size:13px;',
    'cursor:pointer;text-align:left;transition:background 140ms;display:block;width:calc(100% - 32px);}',
    '.dbg-sim-btn:hover{background:rgba(236,227,214,.1);}',
    /* Footer */
    '.dbg-foot{padding:10px 16px;border-top:1px solid rgba(236,227,214,.1);flex-shrink:0;',
    'display:flex;gap:8px;}',
    '.dbg-foot-btn{padding:5px 12px;background:rgba(236,227,214,.06);border:1px solid rgba(236,227,214,.1);',
    'border-radius:6px;color:rgba(236,227,214,.6);font-size:11px;cursor:pointer;transition:all 140ms;}',
    '.dbg-foot-btn:hover{background:rgba(236,227,214,.1);color:#ECE3D6;}',
    '.dbg-foot-btn.is-mode-active{background:rgba(219,123,93,.25);color:#DB7B5D;border-color:rgba(219,123,93,.4);}',
    /* Adaptive thresholds table */
    '.dbg-rtable{width:calc(100% - 32px);margin:0 16px 6px;border-collapse:collapse;font-size:12px;}',
    '.dbg-rtable th{text-align:left;font-weight:600;font-size:10px;letter-spacing:.06em;text-transform:uppercase;',
    'color:rgba(236,227,214,.35);padding:4px 8px;border-bottom:1px solid rgba(236,227,214,.1);}',
    '.dbg-rtable td{padding:7px 8px;border-bottom:1px solid rgba(236,227,214,.06);color:rgba(236,227,214,.7);}',
    '.dbg-rrow{cursor:pointer;transition:background 120ms;}',
    '.dbg-rrow:hover{background:rgba(236,227,214,.05);}',
    '.dbg-rrow.is-active{background:rgba(219,123,93,.16);}',
    '.dbg-rrow.is-active td{color:#ECE3D6;}',
    '.dbg-rrow-hint{color:rgba(236,227,214,.4);}',
    /* ---- Docked mode -------------------------------------------------- */
    /* The console reserves --dbg-w on the right. Page content reflows (body
       margin) and every viewport-anchored overlay/modal/sidebar respects the
       reduced viewport instead of sliding under the console panel. */
    /* --dbg-w  : real console width (px) — used by the counter-zoomed console.
       --dbg-pad: the same reservation in page coordinates. When the page is
       magnified (body zoom Z), elements in the zoomed body must reserve
       --dbg-w / Z so the on-screen gap still equals the real console width. */
    'html.ba-dbg-docked{--dbg-w:var(--dbg-w-user,420px);--dbg-pad:calc(var(--dbg-w) / var(--ba-zoom,1));}',
    'html.ba-dbg-anim body{transition:margin-right 280ms var(--ease-out-quart,cubic-bezier(.25,.46,.45,.94)),',
    'margin-bottom 280ms var(--ease-out-quart,cubic-bezier(.25,.46,.45,.94));}',
    'html.ba-dbg-docked body{margin-right:var(--dbg-pad);}',
    '.dbg-sidebar.is-docked:not(.is-bottom){box-shadow:none;border-left:1px solid rgba(236,227,214,.14);}',
    /* Floating chrome — keep clear of the console */
    'html.ba-dbg-docked .ba-fab,html.ba-dbg-docked .ba-toast,html.ba-dbg-docked .ba-notif-anchor{right:calc(var(--dbg-pad) + 24px / var(--ba-zoom,1));}',
    /* Full-bleed backdrops (inset:0) — pull the right edge in */
    'html.ba-dbg-docked .ba-login-backdrop,html.ba-dbg-docked .reg-backdrop,html.ba-dbg-docked .ac-backdrop,html.ba-dbg-docked .mc-backdrop,html.ba-dbg-docked .rc-backdrop,html.ba-dbg-docked .log-backdrop,html.ba-dbg-docked .demo-backdrop,html.ba-dbg-docked .bcd-backdrop,html.ba-dbg-docked .bcd-root{right:var(--dbg-pad);}',
    /* Right-anchored drawers / sidebars — dock to the reduced viewport edge */
    'html.ba-dbg-docked .ac-drawer,html.ba-dbg-docked .mc-drawer,html.ba-dbg-docked .pulse-sidebar,html.ba-dbg-docked .bcd-drawer{right:var(--dbg-pad);}',
    /* The pulse filter panel rides to the LEFT of the (shifted) pulse sidebar */
    'html.ba-dbg-docked .pulse-filter-panel{right:calc(var(--dbg-pad) + 320px);}',
    /* Closed drawers hide via translateX(100%); now that they rest at --dbg-pad,
       extend the hidden offset so they clear the console instead of covering it.
       :not(.is-open) keeps the open-state transform untouched. */
    'html.ba-dbg-docked .ac-drawer:not(.is-open),html.ba-dbg-docked .mc-drawer:not(.is-open),html.ba-dbg-docked .pulse-sidebar:not(.is-open),html.ba-dbg-docked .bcd-root:not(.is-open) .bcd-drawer{transform:translateX(calc(100% + var(--dbg-pad)));}',
    /* Top full-width panel */
    'html.ba-dbg-docked .search-panel{right:var(--dbg-pad);}',
    /* Centred overlay hint */
    'html.ba-dbg-docked .demo-close-hint{left:calc(50% - var(--dbg-pad) / 2);}',
    /* Book-card reader flyout + fullscreen — reduce width by the console */
    'html.ba-dbg-docked .bcd-reader{right:calc(var(--bcd-drawer-w) + var(--dbg-pad));width:calc(100vw - var(--bcd-drawer-w) - var(--dbg-pad));}',
    'html.ba-dbg-docked .bcd-reader.is-fullscreen{right:var(--dbg-pad);width:calc(100vw - var(--dbg-pad));}',
    /* Over-card reader: keep its right margin off the docked console (cover only content) */
    'html.ba-dbg-docked .bcd-root.is-reader-over .bcd-reader{right:calc(var(--bcd-reader-over-m, clamp(12px, 4vw, 72px)) + var(--dbg-pad));}',
    /* Card close button: stay centred on the card (shifted left), not over the console */
    'html.ba-dbg-docked .bcd-close-btm{right:calc((var(--bcd-drawer-w) + var(--bcd-cover-w, 94px)) / 2 + var(--dbg-pad));}',
    /* Narrow viewport: docking would crush content — fall back to overlay */
    '@media (max-width:760px){html.ba-dbg-docked{--dbg-w:0px;}}',

    /* ---- Bottom (horizontal) mode ------------------------------------- */
    /* Console docks to the BOTTOM edge as a full-width bar; --dbg-h is the
       real bar height, --dbg-padb the same reservation in page coordinates
       (÷ zoom), mirroring --dbg-w / --dbg-pad for the right-docked mode. */
    'html.ba-dbg-bottom{--dbg-h:min(320px,55vh);--dbg-padb:calc(var(--dbg-h) / var(--ba-zoom,1));}',
    'html.ba-dbg-bottom body{margin-bottom:var(--dbg-padb);}',
    '.dbg-sidebar.is-bottom{top:auto;left:0;right:0;bottom:0;width:100%;max-width:100%;',
    'height:var(--dbg-h,300px);transform:translateY(100%);',
    'border-left:none;border-top:1px solid rgba(236,227,214,.14);box-shadow:0 -12px 48px rgba(0,0,0,.45);}',
    '.dbg-sidebar.is-bottom.is-open{transform:translateY(0);}',
    /* Floating chrome — lift above the bottom bar */
    'html.ba-dbg-bottom .ba-fab,html.ba-dbg-bottom .ba-toast,html.ba-dbg-bottom .ba-notif-anchor{bottom:calc(var(--dbg-padb) + 24px / var(--ba-zoom,1));}',
    /* Full-bleed backdrops — pull the bottom edge up */
    'html.ba-dbg-bottom .ba-login-backdrop,html.ba-dbg-bottom .reg-backdrop,html.ba-dbg-bottom .ac-backdrop,html.ba-dbg-bottom .mc-backdrop,html.ba-dbg-bottom .rc-backdrop,html.ba-dbg-bottom .log-backdrop,html.ba-dbg-bottom .demo-backdrop,html.ba-dbg-bottom .bcd-backdrop,html.ba-dbg-bottom .bcd-root{bottom:var(--dbg-padb);}',
    /* Full-height drawers / sidebars / reader — stop at the bar top */
    'html.ba-dbg-bottom .ac-drawer,html.ba-dbg-bottom .mc-drawer,html.ba-dbg-bottom .pulse-sidebar,html.ba-dbg-bottom .pulse-filter-panel,html.ba-dbg-bottom .bcd-drawer,html.ba-dbg-bottom .bcd-reader{bottom:var(--dbg-padb);}',
    /* Card close button: lift above the bottom bar (stay over the card) */
    'html.ba-dbg-bottom .bcd-close-btm{bottom:calc(var(--space-5, 20px) + var(--dbg-padb));}',
    /* Centred overlay hint */
    'html.ba-dbg-bottom .demo-close-hint{bottom:calc(var(--dbg-padb) + 24px);}',
    /* Bar layout: flow the panel content across 2 balanced columns so the
       short, wide bar uses its width instead of one long scrolling column. */
    '.dbg-sidebar.is-bottom .dbg-panel.is-active{display:block;column-count:2;column-gap:36px;',
    'column-fill:balance;max-width:1100px;margin:0 auto;width:100%;padding:0 8px;}',
    '.dbg-sidebar.is-bottom .dbg-panel.is-active > *{break-inside:avoid;}',
    '.dbg-sidebar.is-bottom .dbg-rtable{width:calc(100% - 16px);}',
  ].join('');

  var USERS = [
    { init:'АИ', bg:'#C1654B', name:'Александра Иванова', email:'a.ivanova@example.com',
      session:{ id:'u1', name:'Александра Иванова', role:'Member', rep:142, avatar:null } },
    { init:'ДО', bg:'#7A4A3A', name:'Дмитрий Орлов',     email:'d.orlov@example.com',
      session:{ id:'u2', name:'Дмитрий Орлов', role:'Professional', rep:412, avatar:null } },
    { init:'МС', bg:'#5A6E7A', name:'Мария Соколова',     email:'m.sokolova@example.com',
      session:{ id:'u3', name:'Мария Соколова', role:'Professional', rep:287, avatar:null } },
    { init:'АП', bg:'#5A6E7A', name:'Алексей Петров',     email:'a.petrov@example.com',
      session:{ id:'u4', name:'Алексей Петров', role:'Member', rep:118, avatar:null } },
    { init:'НК', bg:'#4D7A66', name:'Наталья Кузнецова',  email:'n.kuznetsova@example.com',
      session:{ id:'u5', name:'Наталья Кузнецова', role:'Professional', rep:234, avatar:null } },
  ];

  var BOOKS = [
    { title:'Научение на опыте', slug:'bion', ver:'v1.0', pages:112, reads:7, disc:14 },
    { title:'Гореть вместе',     slug:'nikoli', ver:'v1.1', pages:228, reads:5, disc:8 },
    { title:'Избегание эмоций',  slug:'ferro',  ver:'v1.0', pages:184, reads:3, disc:4 },
  ];

  var EVENTS = [
    { time:'16:44:02', type:'page.viewed',    actor:'АИ', body:'book_id=bion, page=38' },
    { time:'16:43:51', type:'comment.created',actor:'МС', body:'book_id=bion, comment_id=c4' },
    { time:'16:41:30', type:'book.opened',    actor:'ДО', body:'book_id=nikoli, v=1.1' },
    { time:'16:38:07', type:'vote.cast',      actor:'АП', body:'target=comment_c3, weight=2, delta=+2' },
    { time:'16:35:22', type:'page.viewed',    actor:'НК', body:'book_id=bion, page=27' },
    { time:'16:32:11', type:'session.ended',  actor:'АИ', body:'book_id=bion, duration=840s' },
    { time:'16:28:44', type:'review.created', actor:'МС', body:'book_id=nikoli, rating=4' },
    { time:'16:15:03', type:'book.opened',    actor:'АИ', body:'book_id=bion, v=1.0' },
  ];

  /* Adaptive breakpoint bands — mirror the blueprint's responsive thresholds
     (container max-width 1200px; nav collapses below ~760px). Clicking a band
     resizes the docked console so the content viewport lands in that band. */
  var RESP_BANDS = [
    { max: 600,      name: 'matchbox' },
    { max: 900,      name: 'narrow' },
    { max: 1200,     name: 'modest' },
    { max: Infinity, name: 'wide' },
  ];
  function _bandIndex(w) {
    for (var i = 0; i < RESP_BANDS.length; i++) { if (w <= RESP_BANDS[i].max) return i; }
    return RESP_BANDS.length - 1;
  }
  function _bandRange(i) {
    var lo = i === 0 ? 0 : RESP_BANDS[i - 1].max + 1;
    return RESP_BANDS[i].max === Infinity ? ('> ' + RESP_BANDS[i - 1].max) : (lo + '–' + RESP_BANDS[i].max);
  }
  function _bandTarget(i) { return RESP_BANDS[i].max === Infinity ? 1440 : RESP_BANDS[i].max; }
  function _contentW() {
    if (!document.documentElement.classList.contains('ba-dbg-docked')) return window.innerWidth;
    var dw = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--dbg-w')) || 0;
    return Math.max(0, Math.round(window.innerWidth - dw));
  }
  /* Content height — mirrors _contentW for the bottom-docked (sidebar) console:
     subtract the reserved console height so the readout reflects the real
     content area, not the raw window. (--dbg-h is a min()/calc expression, so we
     measure the rendered bar instead of parsing the custom property.) */
  function _contentH() {
    if (!document.documentElement.classList.contains('ba-dbg-bottom')) return window.innerHeight;
    var h = _sidebar ? _sidebar.getBoundingClientRect().height : 0;
    return Math.max(0, Math.round(window.innerHeight - h));
  }

  var _sidebar = null;
  var _activeTab = 'users';
  /* Two independent switches: placement (overlay vs docked/sidebar) and edge
     (right vs bottom). Console always anchors to `_edge`; docking adds the
     content reservation (margin) only when `_docked`. */
  var _docked = false;       // false = overlay (floats), true = sidebar (reserves space)
  var _edge = 'right';       // 'right' | 'bottom'
  try {
    var _sd = localStorage.getItem('ba-dbg-docked');
    var _se = localStorage.getItem('ba-dbg-edge');
    if (_sd === null && _se === null) {
      // migrate the old single-mode key
      var _old = localStorage.getItem('ba-dbg-mode');
      if (_old === 'docked')      { _docked = true;  _edge = 'right'; }
      else if (_old === 'bottom') { _docked = true;  _edge = 'bottom'; }
    } else {
      _docked = _sd === '1';
      _edge = (_se === 'bottom') ? 'bottom' : 'right';
    }
  } catch (e) {}
  try { _activeTab = localStorage.getItem('ba-dbg-tab') || 'users'; } catch (e) {}
  // Restore a band-driven custom console width so docked layout matches last session.
  try {
    var _savedW = localStorage.getItem('ba-dbg-width');
    if (_savedW) document.documentElement.style.setProperty('--dbg-w-user', _savedW);
  } catch (e) {}
  var _scale = 1.2; // 1 | 1.2 | 1.4 — page size factor; ×1.2 is the default
  try { var _savedScale = parseFloat(BA.store.get('ba-dbg-scale')); if (_savedScale === 1 || _savedScale === 1.2 || _savedScale === 1.4) _scale = _savedScale; } catch (e) {}

  /* Page magnify — zoom the whole page ×1.5 (scales px AND rem, text + layout).
     The console + its gear are counter-zoomed so they stay real size and usable.
     Injected at load so it applies even before the console is built (state
     persists across reloads). */
  function _injectMagnifyCSS() {
    if (document.getElementById('ba-magnify-css')) return;
    var s = document.createElement('style');
    s.id = 'ba-magnify-css';
    s.textContent = [
      'body{zoom:var(--ba-zoom,1);}',
      /* --ba-zoom is set by _applyScale (1 | 1.2 | 1.4); .ba-magnify marks zoom>1 */
      'html.ba-magnify .dbg-sidebar,html.ba-magnify #ba-debug-fab{zoom:calc(1 / var(--ba-zoom,1));}',
    ].join('');
    (document.head || document.documentElement).appendChild(s);
  }
  /* Matchbox media (real content ≤600px) disables ×1.5 — it would over-zoom a
     tiny screen. `_scale` stays the user's PREFERENCE; the EFFECTIVE scale is
     forced to ×1 in matchbox and restored to the preference on a larger media.
     Keyed on the REAL content width (zoom-independent) so there is no feedback. */
  function _isMatchbox() { return _contentW() <= 600; }
  function _effectiveScale() { return _isMatchbox() ? 1 : _scale; }
  function _applyScale() {
    var z = _effectiveScale(); /* 1 | 1.2 | 1.4 (matchbox forces 1) */
    document.documentElement.style.setProperty('--ba-zoom', String(z));
    document.documentElement.classList.toggle('ba-magnify', z > 1);
    _scheduleFit();
  }
  function _setScale(s) {
    _scale = s;
    try { BA.store.set('ba-dbg-scale', String(s)); } catch (e) {}
    _applyScale();
  }

  /* Collapse the tab bar to icons-only when the full labels overflow the
     console width (e.g. a narrow docked/band width). Measured against the
     labelled layout, so it reverts to text when there is room again. */
  function _fitTabs() {
    if (!_sidebar) return;
    var tabs = _sidebar.querySelector('.dbg-tabs');
    if (!tabs) return;
    tabs.classList.remove('is-compact');
    if (tabs.scrollWidth > tabs.clientWidth + 1) tabs.classList.add('is-compact');
  }

  function _scheduleFit() {
    if (window.requestAnimationFrame) requestAnimationFrame(_fitTabs); else _fitTabs();
  }

  function _applyMode() {
    var open = _sidebar && _sidebar.classList.contains('is-open');
    var bottom = _edge === 'bottom';
    // Reservation (margin + overlay-respect) only when docked, on the active edge.
    document.documentElement.classList.toggle('ba-dbg-docked', _docked && !bottom && open);
    document.documentElement.classList.toggle('ba-dbg-bottom', _docked && bottom && open);
    if (_sidebar) {
      _sidebar.classList.toggle('is-bottom', bottom);   // edge positioning
      _sidebar.classList.toggle('is-docked', _docked);  // attached (no-shadow) look
    }
    _applyScale();  // dock/band may cross the matchbox boundary → re-evaluate ×1.5
    _scheduleFit();
  }

  function _resetBandWidth() {
    try { localStorage.removeItem('ba-dbg-width'); } catch (e) {}
    document.documentElement.style.removeProperty('--dbg-w-user');
  }

  function _setDocked(v) {
    _docked = v;
    try { localStorage.setItem('ba-dbg-docked', v ? '1' : '0'); } catch (e) {}
    _resetBandWidth(); // an explicit placement switch drops band-driven width
    _applyMode();
  }

  function _setEdge(v) {
    _edge = v;
    try { localStorage.setItem('ba-dbg-edge', v); } catch (e) {}
    _resetBandWidth();
    _applyMode();
  }

  /* Resize the docked console so the content viewport gets `targetContentW`.
     Bands are a right-sidebar concept — force docked + right edge. sidebar =
     window − target, clamped; a target at/above the window can't be reached by
     shrinking, so we drop the constraint (overlay) instead. */
  function _setBandWidth(targetContentW) {
    _edge = 'right';
    try { localStorage.setItem('ba-dbg-edge', 'right'); } catch (e) {}
    if (targetContentW >= window.innerWidth) { _setDocked(false); return; }
    _docked = true;
    try { localStorage.setItem('ba-dbg-docked', '1'); } catch (e) {}
    var MIN_SIDEBAR = 240, MIN_CONTENT = 320;
    var sidebar = window.innerWidth - targetContentW;
    sidebar = Math.max(MIN_SIDEBAR, Math.min(sidebar, window.innerWidth - MIN_CONTENT));
    var px = Math.round(sidebar) + 'px';
    document.documentElement.style.setProperty('--dbg-w-user', px);
    try { localStorage.setItem('ba-dbg-width', px); } catch (e) {}
    _applyMode();
  }

  function _inject() {
    if (document.getElementById('ba-dbg-css')) return;
    var s = document.createElement('style');
    s.id = 'ba-dbg-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function _avStyle(u) {
    var base = 'background:' + u.bg + ';';
    var url = (window.BA && BA.avatars && u.session && u.session.id) ? BA.avatars.pick(u.session.id) : null;
    return url ? base + "background-image:url('" + url + "');background-size:cover;background-position:center;color:transparent;" : base;
  }

  function _usersPanel() {
    var session = window.BA && BA.session ? BA.session.get() : null;
    var currentId = session && session.id;

    var rows = USERS.map(function (u) {
      var active = currentId === u.session.id;
      return [
        '<div class="dbg-user-row' + (active ? ' is-active' : '') + '" data-user-id="' + u.session.id + '">',
          '<div class="dbg-user-av" style="' + _avStyle(u) + '">' + u.init + '</div>',
          '<div style="min-width:0;flex:1">',
            '<p class="dbg-user-name">' + u.name + '</p>',
            '<p class="dbg-user-meta">' + u.email + ' · ' + u.session.role + ' · ★' + u.session.rep + '</p>',
          '</div>',
          active ? '<span class="dbg-user-badge">Active</span>' : '',
        '</div>'
      ].join('');
    }).join('');

    var anonActive = !currentId;
    return [
      '<p class="dbg-label">Пользователи</p>',
      rows,
      '<div class="dbg-anon-row' + (anonActive ? ' is-active" style="color:#ECE3D6' : '') + '" id="dbg-anon">',
        '<div class="dbg-user-av" style="background:rgba(236,227,214,.12)">?</div>',
        '<div><p class="dbg-user-name">Анонимный</p><p class="dbg-user-meta">Без сессии</p></div>',
        anonActive ? '<span class="dbg-user-badge">Active</span>' : '',
      '</div>',
    ].join('');
  }

  function _dataPanel() {
    var session = window.BA && BA.session ? BA.session.get() : null;
    var theme = document.documentElement.getAttribute('data-theme') || 'light-clear';
    var rows = [
      { k: 'session.id',   v: session ? session.id : '—' },
      { k: 'session.name', v: session ? session.name : '—' },
      { k: 'session.role', v: session ? session.role : '—' },
      { k: 'session.rep',  v: session ? String(session.rep) : '—' },
      { k: 'theme',        v: theme },
      { k: 'viewport',     v: window.innerWidth + ' × ' + window.innerHeight },
      { k: 'books',        v: String(BOOKS.length) },
      { k: 'events',       v: String(EVENTS.length) },
    ];
    var html = '<p class="dbg-label">Данные сессии и платформы</p>';
    rows.forEach(function (r) {
      html += '<div class="dbg-data-row"><span class="dbg-data-key">' + r.k + '</span><span class="dbg-data-val">' + r.v + '</span></div>';
    });

    html += '<p class="dbg-label" style="margin-top:8px">Книги</p>';
    BOOKS.forEach(function (b) {
      html += '<div class="dbg-data-row"><span class="dbg-data-key">' + b.title.slice(0, 20) + '…</span><span class="dbg-data-val">' + b.ver + ' · ' + b.reads + ' читателей</span></div>';
    });
    return html;
  }

  function _eventsPanel() {
    var html = '<p class="dbg-label">Лог событий (' + EVENTS.length + ' записей)</p>';
    EVENTS.forEach(function (ev) {
      html += [
        '<div class="dbg-ev-row">',
          '<span class="dbg-ev-time">' + ev.time + '</span>',
          '<span class="dbg-ev-type">' + ev.type + '</span>',
          '<span class="dbg-ev-actor">' + ev.actor + '</span>',
          '<span class="dbg-ev-body">' + ev.body + '</span>',
        '</div>'
      ].join('');
    });
    return html;
  }

  function _simPanel() {
    var actions = [
      '📖  Открыть книгу (bion, v1.0)',
      '📄  Просмотреть страницу 15',
      '💬  Создать комментарий',
      '⭐  Поставить оценку ★★★★☆',
      '✍️  Создать рецензию',
      '⏱  Завершить сессию (12 мин.)',
    ];
    return '<p class="dbg-label">Симуляция активности</p>' +
      '<p style="font-size:12px;color:rgba(236,227,214,.4);padding:0 16px 12px">Записывает событие в лог и обновляет счётчики.</p>' +
      actions.map(function (a) {
        return '<button class="dbg-sim-btn" type="button">' + a + '</button>';
      }).join('');
  }

  function _cohortsPanel() {
    return [
      '<p class="dbg-label">Когорты</p>',
      '<div class="dbg-data-row"><span class="dbg-data-key">Профессионалы</span><span class="dbg-data-val">3 пользователя · ★ avg 311</span></div>',
      '<div class="dbg-data-row"><span class="dbg-data-key">Участники</span><span class="dbg-data-val">2 пользователя · ★ avg 130</span></div>',
      '<div class="dbg-data-row"><span class="dbg-data-key">Студенты</span><span class="dbg-data-val">0 пользователей</span></div>',
      '<p class="dbg-label" style="margin-top:12px">Репутация</p>',
      USERS.map(function (u) {
        return '<div class="dbg-data-row"><span class="dbg-data-key">' + u.init + ' ' + u.name.split(' ')[0] + '</span><span class="dbg-data-val">★ ' + u.session.rep + '</span></div>';
      }).join(''),
    ].join('');
  }

  function _responsivityPanel() {
    var vw = window.innerWidth, vh = window.innerHeight, cw = _contentW(), ch = _contentH();
    var cur = _bandIndex(cw);

    var rows = RESP_BANDS.map(function (b, i) {
      var on = i === cur;
      return [
        '<tr class="dbg-rrow' + (on ? ' is-active' : '') + '" data-band="' + i + '" title="Контент → ' + _bandTarget(i) + 'px">',
          '<td>' + (on ? '▸ ' : '') + b.name + '</td>',
          '<td>' + _bandRange(i) + ' px</td>',
          '<td>' + (on
            ? '<span style="color:#6DAE8C">● активен</span>'
            : '<span class="dbg-rrow-hint">' + _bandTarget(i) + 'px →</span>') + '</td>',
        '</tr>'
      ].join('');
    }).join('');

    return [
      '<p class="dbg-label">Режим консоли</p>',
      '<p style="font-size:12px;color:rgba(236,227,214,.4);padding:0 16px 8px">Overlay — поверх контента. Sidebar — занимает место, сужая контент.</p>',
      '<div style="display:flex;gap:8px;padding:0 16px 6px">',
        '<button class="dbg-foot-btn' + (!_docked ? ' is-mode-active' : '') + '" data-set-docked="0">⊞ Overlay</button>',
        '<button class="dbg-foot-btn' + (_docked ? ' is-mode-active' : '') + '" data-set-docked="1">▥ Sidebar</button>',
      '</div>',
      '<div style="display:flex;gap:8px;padding:0 16px 14px">',
        '<button class="dbg-foot-btn' + (_edge === 'right' ? ' is-mode-active' : '') + '" data-set-edge="right">⇥ Справа</button>',
        '<button class="dbg-foot-btn' + (_edge === 'bottom' ? ' is-mode-active' : '') + '" data-set-edge="bottom">⤓ Снизу</button>',
      '</div>',
      '<p class="dbg-label">Масштаб страницы</p>',
      '<p style="font-size:12px;color:rgba(236,227,214,.4);padding:0 16px 8px">Увеличивает весь контент и текст. Консоль не масштабируется.' +
        (_isMatchbox() ? ' <span style="color:#DB7B5D">Увеличение недоступно в matchbox.</span>' : '') + '</p>',
      '<div style="display:flex;gap:8px;padding:0 16px 14px">',
        '<button class="dbg-foot-btn' + (_effectiveScale() === 1 ? ' is-mode-active' : '') + '" data-set-scale="1">×1.0</button>',
        '<button class="dbg-foot-btn' + (_effectiveScale() === 1.2 ? ' is-mode-active' : '') + (_isMatchbox() ? '" disabled style="opacity:.4;cursor:not-allowed' : '') + '" data-set-scale="1.2">×1.2</button>',
        '<button class="dbg-foot-btn' + (_effectiveScale() === 1.4 ? ' is-mode-active' : '') + (_isMatchbox() ? '" disabled style="opacity:.4;cursor:not-allowed' : '') + '" data-set-scale="1.4">×1.4</button>',
      '</div>',
      '<p class="dbg-label">Вьюпорт контента</p>',
      '<div class="dbg-vp-row"><span class="dbg-vp-label">Контент</span><span class="dbg-vp-val">' + cw + ' × ' + ch + ' px</span></div>',
      '<div class="dbg-vp-row"><span class="dbg-vp-label">Окно</span><span class="dbg-vp-val">' + vw + ' × ' + vh + ' px</span></div>',
      '<div class="dbg-vp-row"><span class="dbg-vp-label">Режим</span><span class="dbg-vp-val" style="color:#DB7B5D">' + RESP_BANDS[cur].name + '</span></div>',
      '<div class="dbg-vp-row"><span class="dbg-vp-label">devicePixelRatio</span><span class="dbg-vp-val">' + (window.devicePixelRatio || 1).toFixed(1) + '</span></div>',
      '<p class="dbg-label">Пороги адаптива</p>',
      '<table class="dbg-rtable"><thead><tr><th>Режим</th><th>Диапазон</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>',
      '<p style="font-size:10px;color:rgba(236,227,214,.4);padding:0 16px 12px">Кликните режим — консоль раздвинется так, чтобы контент получил эту ширину.</p>',
      '<p class="dbg-label">Переключить тему</p>',
      '<div style="display:flex;gap:8px;padding:0 16px 12px">',
        ['light-clear','sepia-contrast','night'].map(function (t) {
          return '<button class="dbg-foot-btn" data-set-theme="' + t + '">' + t + '</button>';
        }).join(''),
      '</div>',
    ].join('');
  }

  var TABS = [
    { id:'users',        icon:'👤', text:'Польз.' },
    { id:'cohorts',      icon:'👥', text:'Когорты' },
    { id:'simulation',   icon:'⚡', text:'Сим.' },
    { id:'data',         icon:'📋', text:'Данные' },
    { id:'events',       icon:'📡', text:'События' },
    { id:'responsivity', icon:'📐', text:'Адаптив' },
  ];

  function _panelHTML(id) {
    switch (id) {
      case 'users':       return _usersPanel();
      case 'cohorts':     return _cohortsPanel();
      case 'simulation':  return _simPanel();
      case 'data':        return _dataPanel();
      case 'events':      return _eventsPanel();
      case 'responsivity':return _responsivityPanel();
    }
    return '';
  }

  function _switchTab(id) {
    _activeTab = id;
    try { localStorage.setItem('ba-dbg-tab', id); } catch (e) {}
    _sidebar.querySelectorAll('.dbg-tab').forEach(function (t) {
      t.classList.toggle('is-active', t.getAttribute('data-tab') === id);
    });
    var panel = _sidebar.querySelector('.dbg-panel.is-active');
    if (panel) panel.classList.remove('is-active');
    var newPanel = _sidebar.querySelector('.dbg-panel[data-panel="' + id + '"]');
    if (newPanel) {
      newPanel.innerHTML = _panelHTML(id);
      newPanel.classList.add('is-active');
      _wirePanel(newPanel, id);
    }
  }

  function _wirePanel(panel, id) {
    if (id === 'users') {
      panel.querySelectorAll('.dbg-user-row').forEach(function (row) {
        row.addEventListener('click', function () {
          var uid = row.getAttribute('data-user-id');
          var user = USERS.filter(function (u) { return u.session.id === uid; })[0];
          if (user && window.BA && BA.session) BA.session.set(user.session);
          _switchTab('users'); // re-render to update badge
        });
      });
      var anonRow = panel.querySelector('#dbg-anon');
      if (anonRow) anonRow.addEventListener('click', function () {
        if (window.BA && BA.session) BA.session.clear();
        _switchTab('users');
      });
    }
    if (id === 'responsivity') {
      panel.querySelectorAll('.dbg-rrow').forEach(function (row) {
        row.addEventListener('click', function () {
          _setBandWidth(_bandTarget(parseInt(row.getAttribute('data-band'), 10)));
          _switchTab('responsivity');
        });
      });
      panel.querySelectorAll('[data-set-docked]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          _setDocked(btn.getAttribute('data-set-docked') === '1');
          _switchTab('responsivity');
        });
      });
      panel.querySelectorAll('[data-set-edge]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          _setEdge(btn.getAttribute('data-set-edge'));
          _switchTab('responsivity');
        });
      });
      panel.querySelectorAll('[data-set-scale]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          _setScale(parseFloat(btn.getAttribute('data-set-scale')));
          _switchTab('responsivity');
        });
      });
      panel.querySelectorAll('[data-set-theme]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var t = btn.getAttribute('data-set-theme');
          document.documentElement.setAttribute('data-theme', t);
          try { localStorage.setItem('ba-theme', t); } catch (e) {}
          _switchTab('responsivity');
        });
      });
    }
    if (id === 'simulation') {
      panel.querySelectorAll('.dbg-sim-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          btn.style.opacity = '.4';
          setTimeout(function () { btn.style.opacity = ''; }, 600);
        });
      });
    }
  }

  function _build() {
    if (_sidebar) return;
    _inject();
    document.documentElement.classList.add('ba-dbg-anim');

    _sidebar = document.createElement('div');
    _sidebar.className = 'dbg-sidebar';
    _sidebar.setAttribute('role', 'complementary');
    _sidebar.setAttribute('aria-label', 'Debug console');

    var tabHtml = TABS.map(function (t) {
      return '<button class="dbg-tab' + (t.id === _activeTab ? ' is-active' : '') + '" data-tab="' + t.id + '" type="button" title="' + t.text + '">' +
        '<span class="dbg-tab-icon">' + t.icon + '</span><span class="dbg-tab-text">' + t.text + '</span></button>';
    }).join('');

    var panelHtml = TABS.map(function (t) {
      return '<div class="dbg-panel' + (t.id === _activeTab ? ' is-active' : '') + '" data-panel="' + t.id + '"></div>';
    }).join('');

    _sidebar.innerHTML = [
      '<div class="dbg-topbar">',
        '<span class="dbg-title">⚙ Debug Console</span>',
        '<button class="dbg-close" id="dbg-close" type="button" aria-label="Закрыть консоль">✕</button>',
      '</div>',
      '<div class="dbg-tabs">' + tabHtml + '</div>',
      panelHtml,
      '<div class="dbg-foot">',
        '<button class="dbg-foot-btn" id="dbg-reload" type="button">↺ Перезагрузить</button>',
        '<button class="dbg-foot-btn" id="dbg-clear-session" type="button">Очистить сессию</button>',
      '</div>',
    ].join('');

    document.body.appendChild(_sidebar);

    // Render initial tab
    _switchTab(_activeTab);

    // Keep the tab bar fitted (icons-only when labels overflow) as the console
    // resizes — covers band/mode width changes and window resizes.
    _fitTabs();
    if (window.ResizeObserver) {
      new ResizeObserver(_fitTabs).observe(_sidebar);
    }

    // Tab switching
    _sidebar.querySelectorAll('.dbg-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        _switchTab(tab.getAttribute('data-tab'));
      });
    });

    _sidebar.querySelector('#dbg-close').addEventListener('click', BA.debug.close);
    _sidebar.querySelector('#dbg-reload').addEventListener('click', function () { location.reload(); });
    _sidebar.querySelector('#dbg-clear-session').addEventListener('click', function () {
      if (window.BA && BA.store) BA.store.clear();     // wipe the current user's saved data
      if (window.BA && BA.session) BA.session.clear(); // then end the session → anonym
      _switchTab('users');
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && _sidebar && _sidebar.classList.contains('is-open')) BA.debug.close();
    });

    // Re-render active tab on session change (page-size adoption is wired at init)
    document.addEventListener('ba:session-change', function () {
      if (_sidebar && _sidebar.classList.contains('is-open')) {
        _switchTab(_activeTab);
      }
    });

    // Keep the Adaptive tab's live readout in sync with window resizes.
    window.addEventListener('resize', function () {
      if (_activeTab === 'responsivity' && _sidebar && _sidebar.classList.contains('is-open')) {
        _switchTab('responsivity');
      }
    });
  }

  function _emitState() {
    document.documentElement.classList.toggle('ba-console-open', !!(_sidebar && _sidebar.classList.contains('is-open')));
    document.dispatchEvent(new CustomEvent('ba:debug-state', { bubbles: true }));
  }

  window.BA.debug = {
    open: function () {
      _build();
      _sidebar.classList.add('is-open');
      _applyMode();
      _switchTab(_activeTab); // refresh data
      try { localStorage.setItem('ba-dbg-open', '1'); } catch (e) {}
      _emitState();
    },
    close: function () {
      if (_sidebar) _sidebar.classList.remove('is-open');
      _applyMode();
      try { localStorage.setItem('ba-dbg-open', '0'); } catch (e) {}
      _emitState();
    },
    isOpen: function () { return !!(_sidebar && _sidebar.classList.contains('is-open')); },
    // Page magnify — shared with the avatar menu's size switch.
    setScale: function (s) {
      _setScale(s);
      if (_sidebar && _sidebar.classList.contains('is-open') && _activeTab === 'responsivity') _switchTab('responsivity');
    },
    // Effective scale (matchbox forces ×1); the preference lives in _scale.
    getScale: function () { return _effectiveScale(); }
  };

  // Apply persisted page magnify immediately (independent of the console build).
  _injectMagnifyCSS();
  _applyScale();
  // Re-evaluate the matchbox ×1.5 lock when the viewport crosses 600px.
  window.addEventListener('resize', _applyScale);

  // Adopt the now-current user's saved page size whenever the session changes.
  // Registered at init so it works even before the console is ever built.
  document.addEventListener('ba:session-change', function () {
    try {
      var s = parseFloat(BA.store.get('ba-dbg-scale'));
      _scale = (s === 1 || s === 1.2 || s === 1.4) ? s : 1.2;
    } catch (e) { _scale = 1.2; }
    _applyScale();
  });

  // Restore the console's open/close state across reloads (mode, width and tab
  // are already restored from localStorage above).
  function _restoreOpen() {
    var wasOpen = false;
    try { wasOpen = localStorage.getItem('ba-dbg-open') === '1'; } catch (e) {}
    if (wasOpen) BA.debug.open();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _restoreOpen);
  } else {
    _restoreOpen();
  }
})();

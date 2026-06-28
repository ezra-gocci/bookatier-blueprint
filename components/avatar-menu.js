/* components/avatar-menu.js — Avatar dropdown menu
   BA.avatarMenu.init(btn, menuEl, session) — called by frame.js for private header
   BA.avatarMenu.open() / .close() / .toggle() */
(function () {
  'use strict';
  window.BA = window.BA || {};

  /* Same SVG icons as the full header toolbar, for the folded-in actions */
  var SVG_SEARCH = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/></svg>';
  var SVG_BELL   = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>';
  var SVG_PULSE  = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>';

  var CSS = [
    /* Avatar hero row */
    '.avm-hero{display:flex;align-items:center;gap:12px;padding:16px 16px 12px;}',
    '.avm-face{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;',
    'justify-content:center;font-family:var(--font-sans);font-size:15px;font-weight:600;',
    'color:#ECE3D6;flex-shrink:0;}',
    '.avm-info{min-width:0;}',
    '.avm-name{font-family:var(--font-sans);font-size:14px;font-weight:600;',
    'color:var(--ink);margin:0 0 2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '.avm-rep{font-size:12px;color:var(--ink-faint);margin:0;}',

    /* Theme row — swatches + a single «compact» toggle to their right */
    '.avm-theme-row{display:flex;align-items:center;justify-content:space-between;',
    'padding:8px 16px 10px;gap:8px;}',
    '.avm-theme-label{font-size:12px;color:var(--ink-faint);white-space:nowrap;}',
    '.avm-theme-controls{display:flex;align-items:center;gap:10px;}',
    '.avm-swatches{display:flex;gap:6px;}',
    '.avm-swatch{width:24px;height:24px;border-radius:50%;border:2px solid var(--line,rgba(26,20,16,.15));',
    'cursor:pointer;transition:border-color 140ms,transform 120ms;flex-shrink:0;}',
    '.avm-swatch:hover{transform:scale(1.15);border-color:var(--ink-soft);}',
    '.avm-swatch.is-active{border-color:var(--accent);box-shadow:0 0 0 2px color-mix(in srgb,var(--accent) 25%,transparent);}',
    '.avm-swatch--light{background:#F8F9FA;}',  /* light-clear paper (cool near-white) */
    '.avm-swatch--sepia{background:#ECE0C8;}',  /* sepia-contrast paper (warm cream) */
    '.avm-swatch--night{background:#1F1B18;}',
    /* Size switch — three dots of increasing size (×1.0 / ×1.2 / ×1.4); the
       active size is filled with the accent. */
    '.avm-size-switch{display:inline-flex;align-items:center;gap:7px;margin:0 6px;}',
    '.avm-size-dot{border-radius:50%;border:1.5px solid var(--line,rgba(26,20,16,.2));background:none;',
    'cursor:pointer;padding:0;flex-shrink:0;transition:border-color 140ms,background 140ms,transform 120ms;}',
    '.avm-size-dot[data-set-scale="0.9"]{width:8px;height:8px;}',
    '.avm-size-dot[data-set-scale="1.1"]{width:11px;height:11px;}',
    '.avm-size-dot[data-set-scale="1.4"]{width:14px;height:14px;}',
    '.avm-size-dot:hover{border-color:var(--ink-soft);transform:scale(1.12);}',
    '.avm-size-dot.is-active{background:var(--accent);border-color:var(--accent);}',

    /* Separator */
    '.avm-sep{height:1px;background:var(--line,rgba(26,20,16,.1));margin:2px 0;}',

    /* Menu items */
    '.avm-item{display:flex;align-items:center;gap:10px;width:100%;',
    'padding:10px 16px;font-family:var(--font-sans);font-size:13px;font-weight:500;',
    'color:var(--ink-soft);text-decoration:none;background:none;border:none;',
    'cursor:pointer;text-align:left;transition:background 120ms,color 120ms;',
    'box-sizing:border-box;}',
    '.avm-item:hover{background:var(--surface-sunk,rgba(26,20,16,.05));color:var(--ink);}',
    '.avm-item--danger{color:color-mix(in srgb,var(--danger,#C0392B) 80%,var(--ink-soft));}',
    '.avm-item--danger:hover{background:color-mix(in srgb,var(--danger,#C0392B) 8%,transparent);',
    'color:var(--danger,#C0392B);}',
    '.avm-icon{font-size:15px;width:18px;flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;color:var(--ink-soft);}',
    '.avm-item:hover .avm-icon{color:inherit;}',
    /* Mobile-only section: at matchbox the header icon controls collapse into
       the avatar menu (search · notifications · pulse). */
    '.avm-mobile-section{display:none;}',
    'html.ba-header-narrow .avm-mobile-section{display:block;}',
  ].join('');

  var _btn = null;
  var _menu = null;

  function _inject() {
    if (document.getElementById('ba-avatar-menu-css')) return;
    var s = document.createElement('style');
    s.id = 'ba-avatar-menu-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function _esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function _initials(name) {
    if (!name) return '?';
    var parts = String(name).trim().split(/\s+/);
    return (parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0][0]).toUpperCase();
  }

  function _currentTheme() {
    return document.documentElement.getAttribute('data-theme') || 'light-clear';
  }

  function _faceStyle(session) {
    var base = 'background:var(--accent,#C1654B);';
    var u = (session && session.id && window.BA && BA.avatars) ? BA.avatars.pick(session.id) : null;
    return u ? base + "background-image:url('" + u + "');background-size:cover;background-position:center;color:transparent;" : base;
  }

  function _currentScale() {
    if (window.BA && BA.debug && BA.debug.getScale) return BA.debug.getScale();
    return parseFloat(getComputedStyle(document.body).zoom) || 1;
  }

  function _buildHTML(session) {
    var initials = _initials(session.name);
    var theme = _currentTheme();
    var scale = _currentScale();
    return [
      '<div class="avm-hero">',
        '<div class="avm-face" style="' + _faceStyle(session) + '" aria-hidden="true">' + _esc(initials) + '</div>',
        '<div class="avm-info">',
          '<p class="avm-name">' + _esc(session.name) + '</p>',
          '<p class="avm-rep">★ ' + _esc(String(session.rep)) + ' · ' + _esc(session.role) + '</p>',
        '</div>',
      '</div>',
      '<div class="avm-sep"></div>',
      '<div class="avm-theme-row">',
        '<span class="avm-theme-label">Тема</span>',
        '<div class="avm-theme-controls">',
          '<div class="avm-swatches">',
            '<button class="avm-swatch avm-swatch--sepia' + (theme === 'sepia-contrast' ? ' is-active' : '') + '" type="button" title="Сепия"    aria-label="Тема: сепия"></button>',
            '<button class="avm-swatch avm-swatch--light' + (theme === 'light-clear'    ? ' is-active' : '') + '" type="button" title="Светлая"  aria-label="Тема: светлая"></button>',
            '<button class="avm-swatch avm-swatch--night' + (theme === 'night'          ? ' is-active' : '') + '" type="button" title="Ночная"   aria-label="Тема: ночная"></button>',
          '</div>',
          '<div class="avm-size-switch" role="group" aria-label="Размер интерфейса">',
            '<button class="avm-size-dot' + (scale === 0.9 ? ' is-active' : '') + '" type="button" data-set-scale="0.9" title="×0.9" aria-label="Размер ×0.9"></button>',
            '<button class="avm-size-dot' + (scale === 1.1 ? ' is-active' : '') + '" type="button" data-set-scale="1.1" title="×1.1" aria-label="Размер ×1.1"></button>',
            '<button class="avm-size-dot' + (scale === 1.4 ? ' is-active' : '') + '" type="button" data-set-scale="1.4" title="×1.4" aria-label="Размер ×1.4"></button>',
          '</div>',
        '</div>',
      '</div>',
      '<div class="avm-mobile-section">',
        '<div class="avm-sep"></div>',
        '<button class="avm-item avm-act-search" type="button" role="menuitem"><span class="avm-icon">' + SVG_SEARCH + '</span>Поиск</button>',
        '<button class="avm-item avm-act-notif" type="button" role="menuitem"><span class="avm-icon">' + SVG_BELL + '</span>Уведомления</button>',
        '<button class="avm-item avm-act-pulse" type="button" role="menuitem"><span class="avm-icon">' + SVG_PULSE + '</span>Пульс</button>',
      '</div>',
      '<div class="avm-sep"></div>',
      '<a class="avm-item" href="cabinet.html?tab=overview" role="menuitem"><span class="avm-icon">🏠</span>Кабинет</a>',
      '<a class="avm-item" href="cabinet.html?tab=profile" role="menuitem"><span class="avm-icon">👤</span>Профиль</a>',
      '<a class="avm-item" href="cabinet.html?tab=shelf" role="menuitem"><span class="avm-icon">📚</span>Моя полка</a>',
      '<a class="avm-item" href="member.html?member=' + _esc((session && session.id) || '') + '" role="menuitem"><span class="avm-icon">🪪</span>Моя страница</a>',
      '<div class="avm-sep"></div>',
      '<button class="avm-item avm-demo" type="button" role="menuitem">',
        '<span class="avm-icon">▶</span>Демо-тур',
      '</button>',
      '<button class="avm-item avm-item--danger avm-logout" type="button" role="menuitem">',
        '<span class="avm-icon">↩</span>Выйти',
      '</button>',
    ].join('');
  }

  function _wire() {
    if (!_btn || !_menu) return;

    // Toggle on button click
    _btn.addEventListener('click', function (e) {
      e.stopPropagation();
      BA.avatarMenu.toggle();
    });

    // Theme swatches
    _menu.querySelectorAll('.avm-swatch').forEach(function (sw) {
      sw.addEventListener('click', function (e) {
        e.stopPropagation();
        var theme = sw.classList.contains('avm-swatch--light') ? 'light-clear'
                  : sw.classList.contains('avm-swatch--sepia') ? 'sepia-contrast'
                  : 'night';
        document.documentElement.setAttribute('data-theme', theme);
        try { BA.store.set('ba-theme', theme); } catch (err) {}
        _menu.querySelectorAll('.avm-swatch').forEach(function (s) { s.classList.remove('is-active'); });
        sw.classList.add('is-active');
      });
    });

    // Size switch — three dots (×1.0 / ×1.2 / ×1.4); click sets the page size
    var sizeSwitch = _menu.querySelector('.avm-size-switch');
    if (sizeSwitch) {
      sizeSwitch.addEventListener('click', function (e) {
        var dot = e.target.closest('.avm-size-dot');
        if (!dot) return;
        e.stopPropagation();
        if (window.BA && BA.debug && BA.debug.setScale) BA.debug.setScale(parseFloat(dot.getAttribute('data-set-scale')));
        var live = _currentScale();
        sizeSwitch.querySelectorAll('.avm-size-dot').forEach(function (d) {
          d.classList.toggle('is-active', parseFloat(d.getAttribute('data-set-scale')) === live);
        });
      });
    }

    // Demo tour — runs the guided demo (next to Logout)
    var demoBtn = _menu.querySelector('.avm-demo');
    if (demoBtn) {
      demoBtn.addEventListener('click', function () {
        BA.avatarMenu.close();
        if (window.BA && BA.demo) BA.demo.start();
      });
    }

    // Mobile-only actions — header icon controls folded into the menu at matchbox
    var searchAct = _menu.querySelector('.avm-act-search');
    if (searchAct) searchAct.addEventListener('click', function () {
      BA.avatarMenu.close();
      if (window.BA && BA.search) BA.search.toggle();
    });
    var notifAct = _menu.querySelector('.avm-act-notif');
    if (notifAct) notifAct.addEventListener('click', function () {
      BA.avatarMenu.close();
      if (window.BA && BA.notifications) BA.notifications.toggle();
    });
    var pulseAct = _menu.querySelector('.avm-act-pulse');
    if (pulseAct) pulseAct.addEventListener('click', function () {
      BA.avatarMenu.close();
      if (window.BA && BA.pulse) BA.pulse.toggle();
    });

    // Logout
    var logoutBtn = _menu.querySelector('.avm-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        BA.avatarMenu.close();
        if (window.BA && BA.frame && BA.frame.logout) BA.frame.logout(); else BA.session.clear();
        if (window.BA && BA.frame) BA.frame.showToast('Вы вышли из аккаунта');
        setTimeout(function () { location.href = 'beta2alpha.html'; }, 300);
      });
    }

    // Close on outside click
    document.addEventListener('click', function () { BA.avatarMenu.close(); });
    _menu.addEventListener('click', function (e) { e.stopPropagation(); });

    // Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') BA.avatarMenu.close();
    });
  }

  /* Always query live — _menu/_btn refs go stale when frame.js re-renders the header */
  function _liveMenu() { return document.querySelector('.ba-avatar-menu'); }
  function _liveBtn()  { return document.querySelector('.ba-avatar-btn');  }

  window.BA.avatarMenu = {
    init: function (btn, menuEl, session) {
      _inject();
      _btn = btn;
      _menu = menuEl;
      _menu.innerHTML = _buildHTML(session);
      _wire();
    },

    open: function () {
      /* Defer so any triggering click fully propagates before we open,
         otherwise the document outside-click handler fires and closes immediately. */
      setTimeout(function () {
        var m = _liveMenu(), b = _liveBtn();
        if (!m) return;
        /* Sync the size switch to the live scale (it may have been changed
           from the debug console while the menu was built). */
        var sw = m.querySelector('.avm-size-switch');
        if (sw) {
          var live = _currentScale();
          sw.querySelectorAll('.avm-size-dot').forEach(function (d) {
            d.classList.toggle('is-active', parseFloat(d.getAttribute('data-set-scale')) === live);
          });
        }
        m.classList.add('is-open');
        if (b) b.setAttribute('aria-expanded', 'true');
      }, 0);
    },

    close: function () {
      var m = _liveMenu(), b = _liveBtn();
      if (!m) return;
      m.classList.remove('is-open');
      if (b) b.setAttribute('aria-expanded', 'false');
    },

    toggle: function () {
      var m = _liveMenu();
      /* Read state synchronously before open()'s defer fires */
      if (m && m.classList.contains('is-open')) { BA.avatarMenu.close(); return; }
      BA.avatarMenu.open();
    },

    /* Called by frame.js on session change to refresh displayed user info */
    update: function (session) {
      var m = _liveMenu();
      if (!m || !session) return;
      m.innerHTML = _buildHTML(session);
      _btn = _liveBtn();
      _menu = m;
      _wire();
    }
  };
})();

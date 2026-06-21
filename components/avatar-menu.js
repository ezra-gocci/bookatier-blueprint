/* components/avatar-menu.js — Avatar dropdown menu
   BA.avatarMenu.init(btn, menuEl, session) — called by frame.js for private header
   BA.avatarMenu.open() / .close() / .toggle() */
(function () {
  'use strict';
  window.BA = window.BA || {};

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

    /* Theme row */
    '.avm-theme-row{display:flex;align-items:center;justify-content:space-between;',
    'padding:8px 16px 10px;gap:8px;}',
    '.avm-theme-label{font-size:12px;color:var(--ink-faint);white-space:nowrap;}',
    '.avm-swatches{display:flex;gap:6px;}',
    '.avm-swatch{width:24px;height:24px;border-radius:50%;border:2px solid var(--line,rgba(26,20,16,.15));',
    'cursor:pointer;transition:border-color 140ms,transform 120ms;flex-shrink:0;}',
    '.avm-swatch:hover{transform:scale(1.15);border-color:var(--ink-soft);}',
    '.avm-swatch.is-active{border-color:var(--accent);box-shadow:0 0 0 2px color-mix(in srgb,var(--accent) 25%,transparent);}',
    '.avm-swatch--light{background:#F7F1E6;}',
    '.avm-swatch--sepia{background:#EDE0C8;}',
    '.avm-swatch--night{background:#1F1B18;}',

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
    '.avm-icon{font-size:15px;width:18px;text-align:center;flex-shrink:0;}',
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

  function _buildHTML(session) {
    var initials = _initials(session.name);
    var theme = _currentTheme();
    return [
      '<div class="avm-hero">',
        '<div class="avm-face" style="background:var(--accent,#C1654B)" aria-hidden="true">' + _esc(initials) + '</div>',
        '<div class="avm-info">',
          '<p class="avm-name">' + _esc(session.name) + '</p>',
          '<p class="avm-rep">★ ' + _esc(String(session.rep)) + ' · ' + _esc(session.role) + '</p>',
        '</div>',
      '</div>',
      '<div class="avm-sep"></div>',
      '<div class="avm-theme-row">',
        '<span class="avm-theme-label">Тема</span>',
        '<div class="avm-swatches">',
          '<button class="avm-swatch avm-swatch--light' + (theme === 'light-clear'    ? ' is-active' : '') + '" type="button" title="Светлая"  aria-label="Тема: светлая"></button>',
          '<button class="avm-swatch avm-swatch--sepia' + (theme === 'sepia-contrast' ? ' is-active' : '') + '" type="button" title="Сепия"    aria-label="Тема: сепия"></button>',
          '<button class="avm-swatch avm-swatch--night' + (theme === 'night'          ? ' is-active' : '') + '" type="button" title="Ночная"   aria-label="Тема: ночная"></button>',
        '</div>',
      '</div>',
      '<div class="avm-sep"></div>',
      '<a class="avm-item" href="../pages/profile.html" role="menuitem">',
        '<span class="avm-icon">👤</span>Профиль',
      '</a>',
      '<div class="avm-sep"></div>',
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
        try { localStorage.setItem('ba-theme', theme); } catch (err) {}
        _menu.querySelectorAll('.avm-swatch').forEach(function (s) { s.classList.remove('is-active'); });
        sw.classList.add('is-active');
      });
    });

    // Logout
    var logoutBtn = _menu.querySelector('.avm-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        BA.avatarMenu.close();
        BA.session.clear();
        if (window.BA && BA.frame) BA.frame.showToast('Вы вышли из аккаунта');
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

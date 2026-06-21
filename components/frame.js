/* components/frame.js — Site header (public/private), footer, login modal, floating ⚙ FAB
   BA.frame.init({ page, mode }) — call once on DOMContentLoaded.
   Incorporates nav-indicator.js logic directly (flash strip, dot under active item).
   Calls BA.notifications.init(), BA.search.init(), BA.pulse.init() for private header.
   Listens to ba:session-change and re-renders header without page reload. */
(function () {
  'use strict';
  window.BA = window.BA || {};

  /* ============================================================
     CSS injected by this module
     ============================================================ */
  var CSS = [
    /* Container */
    '.container{max-width:var(--container-max,1200px);margin:0 auto;padding:0 var(--gutter,2.5rem);}',

    /* Skip link */
    '.skip-link{position:absolute;top:-100%;left:0;padding:8px 16px;background:var(--accent,#C1654B);',
    'color:var(--on-accent,#FFFDF8);font-size:14px;text-decoration:none;z-index:999;}',
    '.skip-link:focus{top:0;}',

    /* Site header */
    '.site-header{position:sticky;top:0;z-index:500;',
    'background:color-mix(in srgb,var(--paper,#F7F1E6) 88%,transparent);',
    'backdrop-filter:saturate(140%) blur(8px);-webkit-backdrop-filter:saturate(140%) blur(8px);',
    'border-bottom:1px solid var(--line,#E4D9C6);}',

    /* Header inner 3-col grid */
    '.header-inner{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;',
    'gap:var(--space-4,1rem);height:var(--header-height,64px);}',

    /* Wordmark */
    '.wordmark{display:flex;align-items:center;text-decoration:none;flex-shrink:0;}',
    '.wordmark-img{display:block;height:28px;width:auto;}',

    /* Primary nav */
    '.primary-nav{display:flex;align-items:center;gap:var(--space-6,1.5rem);',
    'justify-content:center;position:relative;}',

    /* Nav links */
    '.nav-link{font-family:var(--font-sans);font-size:var(--fs-small,0.875rem);',
    'font-weight:var(--fw-medium,500);color:var(--ink-soft,#5C5249);',
    'text-decoration:none;white-space:nowrap;transition:color 140ms;}',
    '.nav-link:hover{color:var(--ink,#241F1B);}',
    '.nav-link[aria-current="page"]{color:var(--ink);font-weight:600;}',

    /* Home badge */
    '.nav-link-home{font-family:var(--font-serif);background:#1F1B18;color:#ECE3D6;',
    'padding:var(--space-1,0.25rem) var(--space-3,0.75rem) calc(var(--space-1,0.25rem) + 3px);',
    'border-radius:var(--radius-md,10px);}',
    '.nav-link-home:hover{color:#ECE3D6;opacity:.85;}',
    '.nav-link-home .arrow{color:#D2674A;}',

    /* Header about link */
    '.header-about{white-space:nowrap;}',

    /* Header actions */
    '.header-actions{justify-self:end;display:flex;align-items:center;gap:var(--space-2,0.5rem);}',

    /* Buttons */
    '.btn{display:inline-flex;align-items:center;justify-content:center;gap:var(--space-2,0.5rem);',
    'padding:var(--space-2,0.5rem) var(--space-4,1rem);border-radius:var(--radius-md,10px);',
    'font-family:var(--font-sans);font-size:var(--fs-small,0.875rem);font-weight:500;',
    'cursor:pointer;border:1px solid transparent;text-decoration:none;white-space:nowrap;',
    'transition:background 140ms,border-color 140ms,color 140ms;}',
    '.btn-ghost{background:transparent;border-color:var(--line,#E4D9C6);color:var(--ink-soft,#5C5249);}',
    '.btn-ghost:hover{background:var(--surface-sunk,#F0E8D8);color:var(--ink);border-color:var(--ink-soft);}',
    '.btn-primary{background:var(--accent,#C1654B);color:var(--on-accent,#FFFDF8);border-color:var(--accent);}',
    '.btn-primary:hover{background:var(--accent-hover,#9E4B28);border-color:var(--accent-hover);}',
    '.btn-soft-fill{display:inline-flex;align-items:center;',
    'padding:var(--space-2,0.5rem) var(--space-4,1rem);border-radius:var(--radius-md,10px);',
    'font-family:var(--font-sans);font-size:var(--fs-small,0.875rem);font-weight:500;',
    'background:color-mix(in srgb,var(--accent,#C1654B) 12%,transparent);',
    'color:var(--accent,#C1654B);',
    'border:1px solid color-mix(in srgb,var(--accent,#C1654B) 22%,transparent);',
    'cursor:pointer;white-space:nowrap;transition:background 140ms;}',
    '.btn-soft-fill:hover{background:color-mix(in srgb,var(--accent,#C1654B) 18%,transparent);}',

    /* Footer layout */
    '.footer-inner{display:flex;align-items:center;justify-content:space-between;',
    'gap:var(--space-4,1rem);padding:var(--space-6,1.5rem) 0;}',
    '.footer-brand{display:flex;align-items:center;gap:var(--space-4,1rem);}',
    '.text-mark{font-family:var(--font-serif);font-size:var(--fs-h3,1.125rem);font-weight:600;}',
    '.footer-tagline,.build-tag{font-size:var(--fs-caption,0.75rem);}',
    '.arrow{/* inherited per context */}',

    /* FAB */
    '.ba-fab{position:fixed;bottom:24px;right:24px;z-index:780;width:44px;height:44px;border-radius:50%;',
    'background:#1F1B18;color:#ECE3D6;border:none;font-size:19px;cursor:pointer;',
    'display:flex;align-items:center;justify-content:center;line-height:1;',
    'box-shadow:0 4px 18px rgba(0,0,0,.35);',
    'transition:transform 150ms var(--ease-out-quart,cubic-bezier(.25,.46,.45,.94));',
    'z-index:760;}',
    '.ba-fab:hover{transform:scale(1.1);}',

    /* Toast */
    '.ba-toast{position:fixed;bottom:80px;right:24px;z-index:790;',
    'background:var(--ink,#1A1410);color:var(--paper,#F5EFE4);',
    'padding:10px 20px;border-radius:8px;font-size:14px;',
    'box-shadow:0 4px 16px rgba(0,0,0,.22);',
    'opacity:0;transform:translateY(8px);transition:opacity 200ms,transform 200ms;pointer-events:none;}',
    '.ba-toast.is-visible{opacity:1;transform:translateY(0);}',

    /* Login modal */
    '.ba-login-backdrop{position:fixed;inset:0;z-index:820;',
    'background:rgba(20,16,12,.55);backdrop-filter:blur(4px);',
    'display:flex;align-items:center;justify-content:center;',
    'opacity:0;pointer-events:none;transition:opacity 200ms;}',
    '.ba-login-backdrop.is-open{opacity:1;pointer-events:auto;}',
    '.ba-login-card{position:relative;background:var(--paper,#F5EFE4);border-radius:16px;',
    'width:380px;max-width:calc(100vw - 32px);padding:40px;',
    'box-shadow:0 24px 64px rgba(0,0,0,.2);',
    'transform:translateY(16px);transition:transform 250ms var(--ease-out-quart,cubic-bezier(.25,.46,.45,.94));}',
    '.ba-login-backdrop.is-open .ba-login-card{transform:translateY(0);}',
    '.ba-login-field{margin-bottom:18px;}',
    '.ba-login-field label{display:block;font-size:13px;font-weight:500;margin-bottom:6px;color:var(--ink);}',
    '.ba-login-field input{width:100%;box-sizing:border-box;padding:9px 13px;',
    'border:1px solid var(--line,rgba(26,20,16,.15));border-radius:8px;',
    'background:var(--paper);color:var(--ink);font-size:15px;font-family:inherit;}',
    '.ba-login-field input:focus{outline:2px solid var(--accent,#C1654B);outline-offset:2px;}',
    '.ba-modal-close{position:absolute;top:14px;right:16px;background:none;border:none;',
    'font-size:20px;color:var(--ink-faint,rgba(26,20,16,.4));cursor:pointer;line-height:1;padding:4px;}',

    /* Avatar menu */
    '.ba-avatar-menu{position:absolute;top:calc(100% + 8px);right:0;z-index:710;',
    'width:240px;background:var(--paper,#F5EFE4);',
    'border:1px solid var(--line,rgba(26,20,16,.12));border-radius:12px;',
    'box-shadow:0 8px 32px rgba(0,0,0,.14);overflow:hidden;',
    'opacity:0;transform:translateY(-8px);pointer-events:none;',
    'transition:opacity 180ms var(--ease-out-quart,cubic-bezier(.25,.46,.45,.94)),',
    'transform 180ms var(--ease-out-quart,cubic-bezier(.25,.46,.45,.94));}',
    '.ba-avatar-menu.is-open{opacity:1;transform:translateY(0);pointer-events:auto;}',

    /* Ensure nav positions correctly for indicator */
    '.primary-nav{position:relative;}',
    '.nav-dot{position:absolute;bottom:-2px;width:5px;height:5px;border-radius:50%;',
    'background:var(--accent,#C1654B);transform:translateX(-50%);pointer-events:none;opacity:0;',
    'transition:left 320ms cubic-bezier(.34,1.56,.64,1),opacity 160ms;}',
    '.nav-strip{position:absolute;bottom:0;height:2px;border-radius:2px;',
    'background:var(--accent,#C1654B);pointer-events:none;',
    'transition:left 240ms var(--ease-out-quart,cubic-bezier(.25,.46,.45,.94)),',
    'width 240ms var(--ease-out-quart,cubic-bezier(.25,.46,.45,.94));}',
  ].join('');

  /* ============================================================
     State
     ============================================================ */
  var _opts = {};
  /* 404.html sits at the blueprint root, same level as pages/ and assets/.
     All other pages live inside pages/ and use ../  to reach siblings. */
  function _pp() { return _opts.page === 'error' ? './' : '../'; }
  var _defaultUser = {
    id: 'u1', name: 'Александра Иванова',
    role: 'Member', rep: 142, avatar: null
  };

  /* ============================================================
     Helpers
     ============================================================ */
  function _initials(name) {
    if (!name) return '?';
    var parts = String(name).trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0][0].toUpperCase();
  }

  function _esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  var _SVG_SEARCH = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/></svg>';
  var _SVG_BELL   = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>';
  var _SVG_PULSE  = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>';

  /* ============================================================
     CSS injection
     ============================================================ */
  function _injectCSS() {
    if (document.getElementById('ba-frame-css')) return;
    var s = document.createElement('style');
    s.id = 'ba-frame-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* ============================================================
     Header builders
     ============================================================ */
  function _buildPublicHeader() {
    var el = document.createElement('header');
    el.className = 'site-header';
    el.setAttribute('data-ba-frame', '');
    el.innerHTML = [
      '<a class="skip-link" href="#main-content">Перейти к содержимому</a>',
      '<div class="header-inner container">',
        '<div class="header-left">',
          '<a class="wordmark" href="' + _pp() + 'pages/pub-landing.html" aria-label="β→α академия">',
            '<img class="wordmark-img" src="' + _pp() + 'assets/decor/b2a-academy.svg" alt="β→α" width="100" height="28">',
          '</a>',
          '<a class="nav-link header-about" href="' + _pp() + 'pages/pub-about.html">О проекте</a>',
        '</div>',
        '<nav class="primary-nav" aria-label="Основная навигация">',
          '<a class="nav-link" href="' + _pp() + 'pages/pub-library.html">Библиотека</a>',
          '<a class="nav-link nav-link-home" href="' + _pp() + 'pages/pub-landing.html">β<span class="arrow">→</span>α</a>',
          '<a class="nav-link" href="' + _pp() + 'pages/pub-news.html">Сообщество</a>',
          '<span class="nav-strip" aria-hidden="true"></span>',
          '<span class="nav-dot" aria-hidden="true"></span>',
        '</nav>',
        '<div class="header-actions">',
          '<button class="btn btn-ghost ba-login-trigger" type="button">Войти</button>',
          '<button class="btn-soft-fill ba-reg-trigger" type="button">Присоединиться</button>',
        '</div>',
      '</div>',
    ].join('');
    return el;
  }

  function _buildPrivateHeader(session) {
    var initials = _initials(session.name);
    var el = document.createElement('header');
    el.className = 'site-header';
    el.setAttribute('data-ba-frame', '');
    el.innerHTML = [
      '<a class="skip-link" href="#main-content">Перейти к содержимому</a>',
      '<div class="header-inner container">',
        '<div class="header-left">',
          '<a class="wordmark" href="' + _pp() + 'pages/home.html" aria-label="β→α академия">',
            '<img class="wordmark-img" src="' + _pp() + 'assets/decor/b2a-academy.svg" alt="β→α" width="100" height="28">',
          '</a>',
          '<a class="nav-link header-about" href="' + _pp() + 'pages/about.html">О проекте</a>',
        '</div>',
        '<nav class="primary-nav" aria-label="Основная навигация">',
          '<a class="nav-link" href="' + _pp() + 'pages/library.html">Библиотека</a>',
          '<a class="nav-link nav-link-home" href="' + _pp() + 'pages/home.html">β<span class="arrow">→</span>α</a>',
          '<a class="nav-link" href="' + _pp() + 'pages/community.html">Сообщество</a>',
          '<span class="nav-strip" aria-hidden="true"></span>',
          '<span class="nav-dot" aria-hidden="true"></span>',
        '</nav>',
        '<div class="header-actions">',
          '<button class="icon-btn ba-search-btn" type="button" aria-label="Поиск">' + _SVG_SEARCH + '</button>',
          '<span class="pulse-sep" aria-hidden="true"></span>',
          '<button class="icon-btn ba-notif-btn" type="button" aria-label="Уведомления" style="position:relative">',
            _SVG_BELL,
            '<span class="notif-count" aria-label="4 уведомления">4</span>',
          '</button>',
          '<div class="ba-avatar-wrap" style="position:relative">',
            '<button class="avatar-rep ba-avatar-btn" type="button" aria-label="Меню аккаунта" aria-haspopup="menu" aria-expanded="false">',
              '<span class="avatar-rep__face" aria-hidden="true">' + _esc(initials) + '</span>',
              '<span class="avatar-rep__score">',
                '<span aria-hidden="true">★</span>',
                '<span class="avatar-rep__num">' + _esc(String(session.rep)) + '</span>',
              '</span>',
            '</button>',
            '<div class="ba-avatar-menu" role="menu" aria-label="Меню аккаунта"></div>',
          '</div>',
          '<button class="icon-btn ba-pulse-btn" type="button" aria-label="Пульс платформы" title="Пульс">' + _SVG_PULSE + '</button>',
        '</div>',
      '</div>',
    ].join('');
    return el;
  }

  /* ============================================================
     Nav indicator
     ============================================================ */
  function _placeDot(dot, nav, linkEl) {
    var navRect = nav.getBoundingClientRect();
    var linkRect = linkEl.getBoundingClientRect();
    dot.style.left = (linkRect.left + linkRect.width / 2 - navRect.left) + 'px';
    dot.style.opacity = '1';
  }

  function _flashStrip(strip, nav, linkEl) {
    var navRect = nav.getBoundingClientRect();
    var linkRect = linkEl.getBoundingClientRect();
    strip.style.left = (linkRect.left - navRect.left) + 'px';
    strip.style.width = linkRect.width + 'px';
    strip.classList.add('nav-flash');
    setTimeout(function () { strip.classList.remove('nav-flash'); }, 1000);
  }

  function _initNavIndicator(header) {
    var nav = header.querySelector('.primary-nav');
    if (!nav) return;
    var dot = nav.querySelector('.nav-dot');
    var strip = nav.querySelector('.nav-strip');
    if (!dot) return;

    var links = [].slice.call(nav.querySelectorAll('.nav-link'));
    var page = _opts.page;

    // Find matching active link
    var active = null;
    links.forEach(function (link) {
      var href = (link.getAttribute('href') || '').replace(/^.*\//, '').replace(/\.html$/, '');
      if (page && href === page) {
        link.setAttribute('aria-current', 'page');
        active = link;
      }
    });
    if (!active) active = nav.querySelector('.nav-link-home');

    // Position dot after layout
    requestAnimationFrame(function () {
      if (active) _placeDot(dot, nav, active);
    });

    // Wire click flash
    links.forEach(function (link) {
      link.addEventListener('click', function () {
        links.forEach(function (l) { l.removeAttribute('aria-current'); });
        link.setAttribute('aria-current', 'page');
        _placeDot(dot, nav, link);
        if (strip) _flashStrip(strip, nav, link);
      });
    });
  }

  /* ============================================================
     Action wiring
     ============================================================ */
  function _wirePublicHeader(header) {
    var loginBtn = header.querySelector('.ba-login-trigger');
    if (loginBtn) loginBtn.addEventListener('click', _openLogin);

    var regBtn = header.querySelector('.ba-reg-trigger');
    if (regBtn) regBtn.addEventListener('click', function () {
      if (window.BA && BA.registration) BA.registration.open();
    });
  }

  function _wirePrivateHeader(header) {
    // Sub-components — defer to allow their scripts to load
    setTimeout(function () {
      var session = window.BA && BA.session ? BA.session.get() : null;

      var avatarBtn = header.querySelector('.ba-avatar-btn');
      var menuEl    = header.querySelector('.ba-avatar-menu');
      if (avatarBtn && menuEl && window.BA && BA.avatarMenu && session) {
        BA.avatarMenu.init(avatarBtn, menuEl, session);
      }

      var searchBtn = header.querySelector('.ba-search-btn');
      if (searchBtn && window.BA && BA.search) BA.search.init(searchBtn);

      var notifBtn = header.querySelector('.ba-notif-btn');
      if (notifBtn && window.BA && BA.notifications) BA.notifications.init(notifBtn);

      var pulseBtn = header.querySelector('.ba-pulse-btn');
      if (pulseBtn && window.BA && BA.pulse) BA.pulse.init(pulseBtn);
    }, 0);
  }

  /* ============================================================
     Render: header
     ============================================================ */
  function _renderHeader() {
    var existing = document.querySelector('.site-header[data-ba-frame]');
    if (existing) existing.remove();

    var session = window.BA && BA.session ? BA.session.get() : null;
    var header = session ? _buildPrivateHeader(session) : _buildPublicHeader();

    // Insert before <main> or first visible child
    var ref = document.body.querySelector('main,[data-page-body]');
    document.body.insertBefore(header, ref || document.body.firstElementChild);

    _initNavIndicator(header);

    if (session) _wirePrivateHeader(header);
    else _wirePublicHeader(header);
  }

  /* ============================================================
     Render: footer (once)
     ============================================================ */
  function _renderFooter() {
    if (document.querySelector('.site-footer[data-ba-frame]')) return;
    var el = document.createElement('footer');
    el.className = 'site-footer';
    el.setAttribute('data-band', 'noir');
    el.setAttribute('data-ba-frame', '');
    el.innerHTML = [
      '<div class="container">',
        '<div class="footer-inner">',
          '<div class="footer-brand">',
            '<span class="text-mark">β<span class="arrow">→</span>α</span>',
            '<span class="footer-tagline">© 2026 beta→alpha · Для профессионального сообщества</span>',
          '</div>',
          '<span class="build-tag">v0.5.0-primer · components</span>',
        '</div>',
      '</div>',
    ].join('');
    document.body.appendChild(el);
  }

  /* ============================================================
     Render: FAB (once)
     ============================================================ */
  function _renderFAB() {
    if (document.getElementById('ba-debug-fab')) return;
    var btn = document.createElement('button');
    btn.id = 'ba-debug-fab';
    btn.className = 'ba-fab';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Отладочная консоль');
    btn.setAttribute('title', 'Отладочная консоль (Debug)');
    btn.textContent = '⚙';
    btn.addEventListener('click', function () {
      if (window.BA && BA.debug) BA.debug.open();
    });
    document.body.appendChild(btn);
  }

  /* ============================================================
     Login modal (once)
     ============================================================ */
  function _renderLoginModal() {
    if (document.getElementById('ba-login-backdrop')) return;

    var m = document.createElement('div');
    m.id = 'ba-login-backdrop';
    m.className = 'ba-login-backdrop';
    m.setAttribute('role', 'dialog');
    m.setAttribute('aria-modal', 'true');
    m.setAttribute('aria-labelledby', 'ba-login-title');
    m.setAttribute('aria-hidden', 'true');

    m.innerHTML = [
      '<div class="ba-login-card">',
        '<button class="ba-modal-close" type="button" aria-label="Закрыть">×</button>',
        '<div style="text-align:center;margin-bottom:28px">',
          '<div style="font-family:var(--font-serif);font-size:30px;letter-spacing:-.02em;color:var(--ink)">',
            'β<span style="color:var(--accent)">→</span>α',
          '</div>',
          '<h2 id="ba-login-title" style="margin:8px 0 4px;font-size:20px;font-weight:600;color:var(--ink)">Войдите в аккаунт</h2>',
          '<p style="margin:0;font-size:13px;color:var(--ink-faint)">Демо-вход — данные уже заполнены</p>',
        '</div>',
        '<form id="ba-login-form" novalidate>',
          '<div class="ba-login-field">',
            '<label for="ba-login-email">Эл. почта</label>',
            '<input id="ba-login-email" type="email" value="a.ivanova@example.com" autocomplete="email">',
          '</div>',
          '<div class="ba-login-field" style="margin-bottom:24px">',
            '<label for="ba-login-pass">Пароль</label>',
            '<input id="ba-login-pass" type="password" value="demo1234" autocomplete="current-password">',
          '</div>',
          '<button type="submit" class="btn btn-primary" style="width:100%">Войти</button>',
        '</form>',
        '<p style="margin:16px 0 0;text-align:center;font-size:13px;color:var(--ink-faint)">',
          'Нет аккаунта? ',
          '<button class="ba-to-reg" type="button" style="background:none;border:none;',
          'color:var(--accent);cursor:pointer;font-size:inherit;padding:0;text-decoration:underline">',
            'Зарегистрироваться',
          '</button>',
        '</p>',
      '</div>',
    ].join('');

    document.body.appendChild(m);

    m.querySelector('#ba-login-form').addEventListener('submit', function (e) {
      e.preventDefault();
      _closeLogin();
      BA.session.set(_defaultUser);
      _showToast('Добро пожаловать, ' + _defaultUser.name.split(' ')[0] + '!');
    });

    m.querySelector('.ba-modal-close').addEventListener('click', _closeLogin);
    m.addEventListener('click', function (e) { if (e.target === m) _closeLogin(); });

    m.querySelector('.ba-to-reg').addEventListener('click', function () {
      _closeLogin();
      if (window.BA && BA.registration) BA.registration.open();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') _closeLogin();
    });
  }

  /* ============================================================
     Toast
     ============================================================ */
  var _toastTimer = null;

  function _renderToast() {
    if (document.getElementById('ba-toast')) return;
    var t = document.createElement('div');
    t.id = 'ba-toast';
    t.className = 'ba-toast';
    t.setAttribute('role', 'status');
    t.setAttribute('aria-live', 'polite');
    document.body.appendChild(t);
  }

  function _showToast(msg) {
    var t = document.getElementById('ba-toast');
    if (!t) return;
    clearTimeout(_toastTimer);
    t.textContent = msg;
    t.classList.add('is-visible');
    _toastTimer = setTimeout(function () { t.classList.remove('is-visible'); }, 3200);
  }

  /* ============================================================
     Login open / close
     ============================================================ */
  function _openLogin() {
    var m = document.getElementById('ba-login-backdrop');
    if (!m) return;
    m.classList.add('is-open');
    m.setAttribute('aria-hidden', 'false');
    var first = m.querySelector('input');
    if (first) setTimeout(function () { first.focus(); }, 50);
  }

  function _closeLogin() {
    var m = document.getElementById('ba-login-backdrop');
    if (!m) return;
    m.classList.remove('is-open');
    m.setAttribute('aria-hidden', 'true');
  }

  /* ============================================================
     Full render pass
     ============================================================ */
  function _render() {
    _renderHeader();
    _renderFooter();
    _renderFAB();
    _renderLoginModal();
    _renderToast();
  }

  /* ============================================================
     Public API
     ============================================================ */
  window.BA.frame = {
    init: function (opts) {
      _opts = opts || {};
      _injectCSS();
      _render();
      document.addEventListener('ba:session-change', function () {
        _renderHeader(); // only header needs re-render on session change
      });
    },
    openLogin: _openLogin,
    closeLogin: _closeLogin,
    showToast: _showToast
  };
})();

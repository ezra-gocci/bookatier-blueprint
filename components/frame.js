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

    /* Site header — transparent at top, frosted on scroll (.is-scrolled added by JS) */
    '.site-header{position:sticky;top:0;z-index:500;',
    'background:transparent;',
    'transition:background 200ms ease,box-shadow 200ms ease,',
    'backdrop-filter 200ms ease,-webkit-backdrop-filter 200ms ease;',
    'border-bottom:1px solid var(--line,#E4D9C6);}',
    '.site-header.is-scrolled{',
    'background:color-mix(in srgb,var(--paper,#F7F1E6) 95%,transparent);',
    'backdrop-filter:saturate(140%) blur(8px);-webkit-backdrop-filter:saturate(140%) blur(8px);',
    'box-shadow:0 4px 24px color-mix(in srgb,#1F1B18 18%,transparent);}',

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
    'padding:calc(var(--space-1,0.25rem) * 0.75) var(--space-3,0.75rem) calc((var(--space-1,0.25rem) + 3px) * 0.75);',
    'border-radius:var(--radius-md,10px);}',
    '.nav-link-home:hover{color:#ECE3D6;opacity:.85;}',
    '.nav-link-home .arrow{color:#D2674A;}',
    /* light-clear theme: the home badge is a cool gray, not warm near-black */
    'html[data-theme="light-clear"] .nav-link-home,html[data-theme="light-clear"] .ba-burger-btn{background:#5A6068;}',

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
    'gap:var(--space-4,1rem);padding:calc(var(--space-6,1.5rem) * 0.75) 0;}',
    '.footer-brand{display:flex;align-items:center;gap:var(--space-4,1rem);}',
    '.text-mark{font-family:var(--font-serif);font-size:var(--fs-h3,1.125rem);font-weight:600;}',
    '.footer-tagline,.build-tag{font-size:var(--fs-caption,0.75rem);}',
    '.arrow{/* inherited per context */}',

    /* FAB */
    /* z-index 9999: always above every overlay/modal — sidebar(780), toast(790),
       login(820), logging(830), demo(850-852), fullscreen reader(9000) */
    '.ba-fab{position:fixed;bottom:24px;right:24px;z-index:9999;width:44px;height:44px;border-radius:50%;',
    'background:#1F1B18;color:#ECE3D6;border:none;font-size:19px;cursor:pointer;',
    'display:flex;align-items:center;justify-content:center;line-height:1;',
    'box-shadow:0 4px 18px rgba(0,0,0,.35);',
    'transition:transform 150ms var(--ease-out-quart,cubic-bezier(.25,.46,.45,.94)),',
    'opacity 180ms var(--ease-out-quart,cubic-bezier(.25,.46,.45,.94)),',
    'right 280ms var(--ease-out-quart,cubic-bezier(.25,.46,.45,.94));}',
    '.ba-fab:hover{transform:scale(1.1);}',
    /* Hide the gear FAB while the debug console is open (close it via the console) */
    'html.ba-console-open .ba-fab{opacity:0;pointer-events:none;transform:scale(.85);}',

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
    'width:272px;background:var(--paper,#F5EFE4);',
    'border:1px solid var(--line,rgba(26,20,16,.12));border-radius:12px;',
    'box-shadow:0 8px 32px rgba(0,0,0,.14);overflow:hidden;',
    'opacity:0;transform:translateY(-8px);pointer-events:none;',
    'transition:opacity 180ms var(--ease-out-quart,cubic-bezier(.25,.46,.45,.94)),',
    'transform 180ms var(--ease-out-quart,cubic-bezier(.25,.46,.45,.94));}',
    '.ba-avatar-menu.is-open{opacity:1;transform:translateY(0);pointer-events:auto;}',

    /* Hamburger (matchbox nav) */
    '.ba-burger-wrap{position:relative;display:none;}',
    /* The menu button IS the home badge (β→α) */
    '.ba-burger-btn{font-family:var(--font-serif);background:#1F1B18;color:#ECE3D6;border:none;cursor:pointer;',
    'padding:calc(var(--space-1,0.25rem) * 0.75) var(--space-3,0.75rem) calc((var(--space-1,0.25rem) + 3px) * 0.75);',
    'border-radius:var(--radius-md,10px);font-size:var(--fs-small,0.875rem);line-height:1;',
    'display:inline-flex;align-items:center;transition:opacity 140ms;}',
    '.ba-burger-btn:hover{opacity:.85;}',
    '.ba-burger-btn .arrow{color:#D2674A;}',

    /* Notification counter over the avatar — shown only in narrow mode, where
       the bell icon (with its own count) is folded into the avatar menu. */
    '.ba-avatar-notif{position:absolute;top:-4px;right:-4px;min-width:16px;height:16px;padding:0 4px;',
    'display:none;align-items:center;justify-content:center;font-family:var(--font-sans);',
    'font-size:10px;font-weight:700;line-height:1;color:var(--on-accent,#FFFDF8);',
    'background:var(--accent,#C1654B);border-radius:var(--radius-pill,99px);pointer-events:none;z-index:3;}',
    'html.ba-header-narrow .ba-avatar-notif.has-notifs{display:inline-flex;}',
    '.ba-burger-menu{position:absolute;top:calc(100% + 8px);left:0;z-index:710;',
    'min-width:200px;background:var(--paper,#F5EFE4);',
    'border:1px solid var(--line,rgba(26,20,16,.12));border-radius:12px;',
    'box-shadow:0 8px 32px rgba(0,0,0,.14);overflow:hidden;padding:6px 0;',
    'opacity:0;transform:translateY(-8px);pointer-events:none;',
    'transition:opacity 180ms var(--ease-out-quart,cubic-bezier(.25,.46,.45,.94)),',
    'transform 180ms var(--ease-out-quart,cubic-bezier(.25,.46,.45,.94));}',
    '.ba-burger-menu.is-open{opacity:1;transform:translateY(0);pointer-events:auto;}',
    '.ba-burger-item{display:flex;align-items:center;gap:10px;width:100%;',
    'padding:10px 16px;font-family:var(--font-sans);font-size:14px;font-weight:500;',
    'color:var(--ink-soft);text-decoration:none;background:none;border:none;',
    'cursor:pointer;text-align:left;box-sizing:border-box;transition:background 120ms,color 120ms;}',
    '.ba-burger-item:hover{background:var(--surface-sunk,rgba(26,20,16,.05));color:var(--ink);}',
    '.ba-burger-item[aria-current="page"]{color:var(--ink);font-weight:600;}',

    /* Narrow header — collapse every top-nav item into the home-badge menu.
       Toggled by JS on the EFFECTIVE width (viewport ÷ page zoom), so it also
       fires at normal (×1.5) size, not only in compact mode. */
    'html.ba-header-narrow .primary-nav{display:none;}',
    'html.ba-header-narrow .header-about{display:none;}',
    'html.ba-header-narrow .header-actions .ba-search-btn,',
    'html.ba-header-narrow .header-actions .ba-notif-btn,',
    'html.ba-header-narrow .header-actions .ba-pulse-btn,',
    'html.ba-header-narrow .header-actions .pulse-sep{display:none;}',
    /* Compact narrow layout: logo + badge-menu on the left (badge partly over
       the logo), avatar pushed to the far right. */
    'html.ba-header-narrow .header-inner{display:flex;justify-content:space-between;align-items:center;}',
    'html.ba-header-narrow .ba-burger-wrap{display:block;position:relative;z-index:2;margin-left:-44px;}',
    /* Modest media (just above narrow): pull the nav items closer to the centre
       home badge (smaller gap), and drop the secondary «О проекте» link so the
       main nav has room and does not collide with it. */
    'html.ba-header-modest .primary-nav{gap:var(--space-3,0.75rem);}',
    'html.ba-header-modest .header-about{display:none;}',

    /* Library pill + books icon wrapper */
    '.nav-lib-wrap{position:relative;display:inline-flex;align-items:center;margin-top:calc(32.3px - 28.2px / var(--ba-zoom,1));}',
    '.nav-lib-icon{position:absolute;top:-27px;right:1px;z-index:2;pointer-events:none;line-height:0;}',
    '.nav-books-img{display:block;width:48px;height:48px;object-fit:contain;}',

    /* Ensure nav positions correctly for indicator */
    '.primary-nav{position:relative;}',
    '.nav-dot{position:absolute;bottom:-2px;width:5px;height:5px;border-radius:50%;',
    'background:var(--accent,#C1654B);transform:translateX(-50%);pointer-events:none;opacity:0;',
    'transition:left 320ms cubic-bezier(.34,1.56,.64,1),opacity 160ms;}',
    '.nav-strip{position:absolute;bottom:0;height:2px;border-radius:2px;',
    'background:var(--accent,#C1654B);pointer-events:none;',
    'transition:left 240ms var(--ease-out-quart,cubic-bezier(.25,.46,.45,.94)),',
    'width 240ms var(--ease-out-quart,cubic-bezier(.25,.46,.45,.94));}',

    /* Header: visual height stays fixed at 64px across all size modes;
       content (text, icons, buttons) still scales with body zoom */
    'html.ba-magnify .site-header{--header-height:calc(64px / var(--ba-zoom,1));}',
    /* Footer: counter-zoomed to S-size; sticks to bottom of flex parent when content is short */
    'html.ba-magnify .site-footer{zoom:calc(1 / var(--ba-zoom,1));}',
    /* Flex body baseline: ensures margin-top:auto on footer works on all pages */
    'body{display:flex;flex-direction:column;min-height:calc(100vh / var(--ba-zoom,1));}',
    '.site-footer{margin-top:auto;}',
  ].join('');

  /* ============================================================
     State
     ============================================================ */
  var _opts = {};
  var _scrollHeaderWired = false;
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

  function _avatarUrl(session) {
    return (session && session.id && window.BA && BA.avatars) ? BA.avatars.pick(session.id) : null;
  }
  function _avatarStyle(session) {
    var u = _avatarUrl(session);
    return u ? ' style="background-image:url(\'' + u + '\');background-size:cover;background-position:center;color:transparent"' : '';
  }

  function _esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  var _SVG_SEARCH = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/></svg>';
  var _SVG_BELL   = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>';
  var _SVG_PULSE  = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>';
  var _SVG_BURGER = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';

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
          '<a class="nav-link" href="' + _pp() + 'pages/pub-landing.html">Кабинет</a>',
          '<span class="nav-lib-wrap">',
            '<a class="nav-link nav-link-home" href="' + _pp() + 'pages/pub-library.html">β<span class="arrow">→</span>α</a>',
            '<span class="nav-lib-icon"><img class="nav-books-img" src="' + _pp() + 'assets/decor/books-pile.png" alt="" aria-hidden="true" width="24" height="24"></span>',
          '</span>',
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
          '<div class="ba-burger-wrap">',
            '<button class="ba-burger-btn" type="button" aria-label="Меню навигации" aria-haspopup="menu" aria-expanded="false">β<span class="arrow">→</span>α</button>',
            '<div class="ba-burger-menu" role="menu" aria-label="Навигация">',
              '<a class="ba-burger-item" href="' + _pp() + 'pages/about.html" role="menuitem">О проекте</a>',
              '<a class="ba-burger-item" href="' + _pp() + 'pages/home.html" role="menuitem">Кабинет</a>',
              '<a class="ba-burger-item" href="' + _pp() + 'pages/library.html" role="menuitem">Библиотека</a>',
              '<a class="ba-burger-item" href="' + _pp() + 'pages/community.html" role="menuitem">Сообщество</a>',
            '</div>',
          '</div>',
        '</div>',
        '<nav class="primary-nav" aria-label="Основная навигация">',
          '<a class="nav-link" href="' + _pp() + 'pages/home.html">Кабинет</a>',
          '<span class="nav-lib-wrap">',
            '<a class="nav-link nav-link-home" href="' + _pp() + 'pages/library.html">β<span class="arrow">→</span>α</a>',
            '<span class="nav-lib-icon"><img class="nav-books-img" src="' + _pp() + 'assets/decor/books-pile.png" alt="" aria-hidden="true" width="24" height="24"></span>',
          '</span>',
          '<a class="nav-link" href="' + _pp() + 'pages/community.html">Сообщество</a>',
          '<span class="nav-strip" aria-hidden="true"></span>',
          '<span class="nav-dot" aria-hidden="true"></span>',
        '</nav>',
        '<div class="header-actions">',
          '<button class="icon-btn ba-search-btn" type="button" aria-label="Поиск">' + _SVG_SEARCH + '</button>',
          '<button class="icon-btn ba-notif-btn" type="button" aria-label="Уведомления" style="position:relative">',
            _SVG_BELL,
            '<span class="notif-count" aria-label="4 уведомления">4</span>',
          '</button>',
          '<div class="ba-avatar-wrap" style="position:relative">',
            '<button class="avatar-rep ba-avatar-btn" type="button" aria-label="Меню аккаунта" aria-haspopup="menu" aria-expanded="false">',
              '<span class="avatar-rep__face' + (_avatarUrl(session) ? ' has-avatar' : '') + '"' + _avatarStyle(session) + ' aria-hidden="true">' + _esc(initials) + '</span>',
              '<span class="avatar-rep__score">',
                '<span aria-hidden="true">★</span>',
                '<span class="avatar-rep__num">' + _esc(String(session.rep)) + '</span>',
              '</span>',
            '</button>',
            '<span class="ba-avatar-notif has-notifs" aria-hidden="true">4</span>',
            '<div class="ba-avatar-menu" role="menu" aria-label="Меню аккаунта"></div>',
          '</div>',
          '<span class="pulse-sep" aria-hidden="true"></span>',
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
    // No fallback: off the four nav pages (about/library/home/community) there
    // is no active item, so the red dot marker stays hidden.

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

      _wireBurger(header);
    }, 0);
  }

  /* Hamburger nav menu (visible only at the matchbox breakpoint) */
  function _wireBurger(header) {
    var btn = header.querySelector('.ba-burger-btn');
    var menu = header.querySelector('.ba-burger-menu');
    if (!btn || !menu) return;
    function close() { menu.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); }
    function toggle(e) {
      e.stopPropagation();
      var open = menu.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(open));
    }
    btn.addEventListener('click', toggle);
    // In narrow mode the badge sits over the logo — clicking the logo opens the
    // same menu instead of navigating home.
    var logo = header.querySelector('.wordmark');
    if (logo) logo.addEventListener('click', function (e) {
      if (document.documentElement.classList.contains('ba-header-narrow')) { e.preventDefault(); toggle(e); }
    });
    menu.addEventListener('click', function (e) { e.stopPropagation(); });
    document.addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
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
     Narrow-header detection — keyed on the actual page LAYOUT width (the body
     content box ÷ page zoom). This reflects window resize, ×1.5 magnify AND the
     debug console's docked/band width simulation (which shrinks body, not the
     viewport). Collapses when the header has ≤600 CSS px to work with.
     ============================================================ */
  function _layoutWidth() {
    var zoom = parseFloat(getComputedStyle(document.body).zoom) || 1;
    return document.body.getBoundingClientRect().width / zoom;
  }
  function _updateHeaderNarrow() {
    var w = _layoutWidth(), html = document.documentElement;
    html.classList.toggle('ba-header-narrow', w <= 600);
    html.classList.toggle('ba-header-modest', w > 600 && w <= 820); // modest@×1.5 ≈ 600–800 layout
  }
  function _watchHeaderNarrow() {
    if (window.ResizeObserver) new ResizeObserver(_updateHeaderNarrow).observe(document.body);
    window.addEventListener('resize', _updateHeaderNarrow);
    // The console dock/band/magnify changes <html> class / inline --dbg-w-user;
    // the body margin then animates, so recompute now AND after it settles.
    if (window.MutationObserver) {
      new MutationObserver(function () { _updateHeaderNarrow(); setTimeout(_updateHeaderNarrow, 320); })
        .observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style'] });
    }
    document.body.addEventListener('transitionend', function (e) {
      if (e.propertyName === 'margin-right' || e.propertyName === 'margin-bottom') _updateHeaderNarrow();
    });
    _updateHeaderNarrow();
  }

  /* ============================================================
     Scroll-aware header transparency
     Exponential curve: fast initial rise, long asymptotic tail.
     τ = 50px → 63% opaque at 50px scroll, ~95% at 150px, ~98% at 200px.
     At 98% (≈195px) the .is-scrolled class takes over for backdrop-filter + shadow.
     Dark-modifier pages stay solid. Wired once; re-renders are safe.
     ============================================================ */
  function _initScrollHeader() {
    if (_scrollHeaderWired) return;
    _scrollHeaderWired = true;

    function update() {
      var header = document.querySelector('.site-header[data-ba-frame]');
      if (!header) return;
      if (header.classList.contains('site-header--dark')) {
        header.classList.remove('is-scrolled');
        header.style.background = '';
        return;
      }
      var scroll = window.scrollY;
      if (scroll <= 0) {
        header.classList.remove('is-scrolled');
        header.style.background = '';
        return;
      }
      /* 1 - e^(-scroll/τ): rises quickly at first, then slows into a long tail */
      var alpha = 1 - Math.exp(-scroll / 50);
      if (alpha >= 0.98) {
        /* Effectively opaque — hand off to CSS (.is-scrolled adds backdrop-filter + shadow) */
        header.classList.add('is-scrolled');
        header.style.background = '';
      } else {
        header.classList.remove('is-scrolled');
        header.style.background = 'color-mix(in srgb,var(--paper,#F7F1E6) ' + Math.round(alpha * 95) + '%,transparent)';
      }
    }

    window.addEventListener('scroll', update, { passive: true });
    update();
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
      _watchHeaderNarrow();
      _initScrollHeader();
      document.addEventListener('ba:session-change', function () {
        _renderHeader(); // only header needs re-render on session change
      });
    },
    openLogin: _openLogin,
    closeLogin: _closeLogin,
    showToast: _showToast
  };
})();

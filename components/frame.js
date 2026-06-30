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

    /* Header inner: 1fr / auto / 1fr grid — the center auto column is always
       at the horizontal mid-point of the page regardless of left/right widths */
    /* Reserve scrollbar gutter on every page so the viewport width (and therefore
       the header 1fr columns) stays identical whether the page scrolls or not. */
    'html{scrollbar-gutter:stable;}',

    '.header-inner{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;',
    'gap:var(--space-4,1rem);height:var(--header-height,64px);position:relative;}',

    /* Wordmark */
    '.wordmark{display:flex;align-items:center;text-decoration:none;flex-shrink:0;}',
    '.wordmark-img{display:block;height:28px;width:auto;}',

    /* Primary nav */
    '.primary-nav{display:flex;align-items:center;gap:var(--space-6,1.5rem);position:relative;}',

    /* Nav links */
    '.nav-link{font-family:var(--font-sans);font-size:var(--fs-small,0.875rem);',
    'font-weight:var(--fw-medium,500);color:var(--ink-soft,#5C5249);',
    'text-decoration:none;white-space:nowrap;transition:color 140ms;}',
    '.nav-link:hover{color:var(--ink,#241F1B);}',
    '.nav-link[aria-current="page"]{color:var(--ink);}',

    /* Wordmark active state: accent bottom + faded frame on other sides (box-shadow = no layout impact) */
    '.wordmark[aria-current="page"]{border-radius:3px;box-shadow:inset 0 0 0 1px rgba(193,101,75,0.25),0 2px 0 0 var(--accent,#C1654B);}',

    /* light-clear theme: the hamburger button matches header tone */
    'html[data-theme="light-clear"] .ba-burger-btn{background:#5A6068;}',

    /* Header about link */
    '.header-about{white-space:nowrap;}',
    /* Left group: logo + about */
    '.header-left{display:flex;align-items:center;gap:var(--space-4,1rem);}',

    /* Header actions — grid: push to far right of its 1fr column */
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

    /* Header CTAs (Войти / Присоединиться) — pill shape like the beta2alpha join
       button; the join gets a fuller (less transparent) accent fill. */
    '.header-actions .btn-ghost,.header-actions .btn-soft-fill{',
    'border-radius:var(--radius-pill,999px);padding:var(--space-2,0.5rem) var(--space-6,1.5rem);}',
    '.header-actions .btn-soft-fill{',
    'background:color-mix(in srgb,var(--accent,#C1654B) 88%,transparent);',
    'color:var(--on-accent,#FFFDF8);border-color:var(--accent,#C1654B);}',
    '.header-actions .btn-soft-fill:hover{background:var(--accent,#C1654B);}',

    /* Footer layout */
    '.footer-inner{display:flex;align-items:center;justify-content:space-between;',
    'gap:var(--space-4,1rem);padding:calc(var(--space-6,1.5rem) * 0.75) 0;}',
    '.footer-brand{display:flex;align-items:center;gap:var(--space-4,1rem);}',
    /* Footer brand = the same wordmark logo as the top-menu logo button */
    '.footer-wordmark{display:block;height:26px;width:auto;}',
    '.footer-end{display:flex;align-items:center;gap:var(--space-4,1rem);}',
    '.footer-link{font-family:var(--font-sans);font-size:var(--fs-small,0.875rem);',
    'color:var(--ink-soft,#5C5249);text-decoration:none;white-space:nowrap;transition:color 140ms;}',
    '.footer-link:hover{color:var(--accent,#B85138);}',
    '.text-mark{font-family:var(--font-serif);font-size:var(--fs-h3,1.125rem);font-weight:600;}',
    '.footer-tagline,.build-tag{font-size:var(--fs-caption,0.75rem);color:var(--ink-faint,#8B8073);}',
    '.arrow{/* inherited per context */}',
    /* Footer page-loc breadcrumb + info popup */
    '.footer-center{display:flex;align-items:center;}',
    '.footer-page-loc{font-family:var(--font-sans);font-size:var(--fs-caption,0.75rem);color:var(--ink-faint,#8B8073);',
    'background:none;border:none;cursor:pointer;padding:3px 8px;border-radius:4px;',
    'white-space:nowrap;transition:color 140ms,background 140ms;letter-spacing:.02em;}',
    '.footer-page-loc:hover{color:var(--ink-soft,#5C5249);background:rgba(0,0,0,.05);}',
    '.footer-page-code{opacity:.55;font-size:.9em;margin-left:.35em;}',
    '.ba-page-info-popup{position:fixed;z-index:900;',
    'background:var(--surface,#FFFDF8);border:var(--hairline,1px solid) var(--line,#E4D9C6);',
    'border-radius:var(--radius-md,10px);padding:var(--space-5,20px);',
    'box-shadow:0 8px 32px rgba(0,0,0,.14);width:320px;max-width:calc(100vw - 24px);}',
    '.ba-pip-code{font-family:var(--font-mono,monospace);font-size:11px;color:var(--ink-faint);',
    'background:var(--surface-sunk,#F0E8D8);border-radius:4px;padding:2px 6px;margin:0 0 8px;display:inline-block;}',
    '.ba-pip-crumb{font-family:var(--font-sans);font-size:10px;color:var(--ink-faint);',
    'display:flex;align-items:center;gap:3px;margin:0 0 4px;text-transform:uppercase;letter-spacing:.05em;}',
    '.ba-pip-sep{opacity:.5;}',
    '.ba-pip-label{font-family:var(--font-serif);font-size:var(--fs-h3,1.125rem);font-weight:600;',
    'color:var(--ink);margin:0 0 10px;}',
    '.ba-pip-section{margin:0 0 8px;}',
    '.ba-pip-section:last-child{margin-bottom:0;}',
    '.ba-pip-sh{font-family:var(--font-sans);font-size:10px;font-weight:600;text-transform:uppercase;',
    'letter-spacing:.06em;color:var(--accent);margin:0 0 3px;}',
    '.ba-pip-body{font-family:var(--font-sans);font-size:var(--fs-small,0.875rem);color:var(--ink-soft);',
    'margin:0;line-height:1.5;}',
    '.ba-pip-close{position:absolute;top:8px;right:10px;background:none;border:none;',
    'cursor:pointer;font-size:18px;color:var(--ink-faint);line-height:1;padding:2px 6px;}',
    '.ba-pip-close:hover{color:var(--ink);}',

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
    /* Orange side-dot for the current item in the collapsed burger menu */
    '.ba-burger-item::before{content:"";display:block;width:5px;height:5px;border-radius:50%;',
    'background:transparent;flex-shrink:0;}',
    '.ba-burger-item[aria-current="page"]::before{background:var(--accent,#C1654B);}',

    /* Narrow header — collapse every top-nav item into the home-badge menu.
       Toggled by JS when layout width drops below the natural content minimum. */
    'html.ba-header-narrow .primary-nav{display:none;}',
    'html.ba-header-narrow .header-about{display:none;}',
    /* The logo doubles as the dropdown button in narrow mode — hide the active
       nav-indicator dot, which would otherwise float beneath it. */
    'html.ba-header-narrow .nav-dot{display:none;}',
    'html.ba-header-narrow .header-actions .ba-search-btn,',
    'html.ba-header-narrow .header-actions .ba-notif-btn,',
    'html.ba-header-narrow .header-actions .ba-pulse-btn,',
    'html.ba-header-narrow .header-actions .pulse-sep{display:none;}',
    'html.ba-header-narrow .ba-burger-wrap{display:block;position:relative;z-index:2;margin-left:-44px;}',


    /* Ensure nav positions correctly for indicator */
    '.primary-nav{position:relative;}',
    '.nav-dot{position:absolute;bottom:-4px;height:2px;border-radius:2px;',
    'background:var(--accent,#C1654B);pointer-events:none;opacity:0;}',
    '.nav-strip{position:absolute;bottom:0;height:2px;border-radius:2px;',
    'background:var(--accent,#C1654B);pointer-events:none;}',

    /* Header: visual height stays fixed at 64px across all size modes;
       content (text, icons, buttons) still scales with body zoom.
       Set on the root (not just .site-header) so header-relative elements that
       are NOT header descendants — the sticky section/book tab bars
       (top:var(--header-height)), book aside, scroll anchors — track the
       magnified header height too and stay flush beneath it. */
    'html.ba-magnify{--header-height:calc(64px / var(--ba-zoom,1));}',
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

  /* ── Login (debug-managed STUB) — verify against seeded members ── */
  function _findMemberByEmail(email) {
    var list = (window.BA && BA.memberData) ? BA.memberData.all() : [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].email && String(list[i].email).toLowerCase() === email) return list[i];
    }
    return null;
  }
  function _isMockMember(m) { return (window.BA && BA.memberData) ? BA.memberData.isMock(m) : false; }
  function _establishSession(member) {
    var st = window.BA && BA.store;
    var privs = (member.privileges || []).map(function (g) { return g.privilege; });
    var role = (st && st.roleOf) ? st.roleOf(privs) : 'Member';
    var rep = (st && st.xpOf) ? st.xpOf(member.id) : (member.reputationScore || 0);
    BA.session.set({ id: member.id, name: member.displayName, role: role, rep: rep });
    if (st && st.emit) st.emit('session.login', { who: { entity: 'member', entity_id: member.id }, with_what: { entity: 'member', entity_id: member.id }, visibility: 'self' });
  }
  /* expose so the avatar menu / debug console can drive login programmatically */
  function _loginAs(memberId) {
    var m = (window.BA && BA.memberData) ? BA.memberData.get(memberId) : null;
    if (m && !_isMockMember(m)) _establishSession(m);
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
    /* Guest nav is narrow: О проекте + the Library badge (guests may browse the
       whole catalogue, free editions only — B-9 / CON-01) + Войти/Присоединиться.
       Кабинет/Сообщество are session-gated, so they are not offered to guests. */
    el.innerHTML = [
      '<a class="skip-link" href="#main-content">Перейти к содержимому</a>',
      '<div class="header-inner container">',
        '<div class="header-left">',
          '<a class="wordmark" href="' + _pp() + 'pages/beta2alpha.html" aria-label="β→α академия">',
            '<img class="wordmark-img" src="' + _pp() + 'assets/decor/b2a-academy.svg" alt="β→α" width="100" height="28">',
          '</a>',
          '<a class="nav-link header-about" href="' + _pp() + 'pages/about.html">О проекте</a>',
          '<div class="ba-burger-wrap">',
            '<button class="ba-burger-btn" type="button" aria-label="Меню навигации" aria-haspopup="menu" aria-expanded="false">β<span class="arrow">→</span>α</button>',
            '<div class="ba-burger-menu" role="menu" aria-label="Навигация">',
              '<a class="ba-burger-item" href="' + _pp() + 'pages/beta2alpha.html" role="menuitem">Витрина</a>',
              '<a class="ba-burger-item" href="' + _pp() + 'pages/about.html" role="menuitem">О проекте</a>',
              '<a class="ba-burger-item" href="' + _pp() + 'pages/cabinet.html?tab=overview" role="menuitem">Кабинет</a>',
              '<a class="ba-burger-item" href="' + _pp() + 'pages/library.html" role="menuitem">Библиотека</a>',
              '<a class="ba-burger-item" href="' + _pp() + 'pages/community.html" role="menuitem">Лобби</a>',
            '</div>',
          '</div>',
        '</div>',
        '<nav class="primary-nav" aria-label="Основная навигация">',
          '<span class="nav-side nav-side--l">',
            '<a class="nav-link" href="' + _pp() + 'pages/cabinet.html?tab=overview">Кабинет</a>',
          '</span>',
          '<a class="nav-link" href="' + _pp() + 'pages/library.html">Библиотека</a>',
          '<span class="nav-side nav-side--r">',
            '<a class="nav-link" href="' + _pp() + 'pages/community.html">Лобби</a>',
          '</span>',
          '<span class="nav-strip" aria-hidden="true"></span>',
        '</nav>',
        '<div class="header-actions">',
          '<button class="btn btn-ghost ba-login-trigger" type="button">Войти</button>',
          '<button class="btn-soft-fill ba-reg-trigger" type="button">Присоединиться</button>',
        '</div>',
        '<span class="nav-dot" aria-hidden="true"></span>',
      '</div>',
    ].join('');
    return el;
  }

  function _buildPrivateHeader(session) {
    var initials = _initials(session.name);
    /* derived from the store where present (rep XP + unread notification groups) */
    var st = window.BA && BA.store;
    var rep = (st && st.xpOf) ? st.xpOf(session.id) : (session.rep != null ? session.rep : 0);
    var unread = (st && st.unreadCount) ? st.unreadCount(session.id) : 0;
    var el = document.createElement('header');
    el.className = 'site-header';
    el.setAttribute('data-ba-frame', '');
    el.innerHTML = [
      '<a class="skip-link" href="#main-content">Перейти к содержимому</a>',
      '<div class="header-inner container">',
        '<div class="header-left">',
          '<a class="wordmark" href="' + _pp() + 'pages/beta2alpha.html" aria-label="β→α академия">',
            '<img class="wordmark-img" src="' + _pp() + 'assets/decor/b2a-academy.svg" alt="β→α" width="100" height="28">',
          '</a>',
          '<a class="nav-link header-about" href="' + _pp() + 'pages/about.html">О проекте</a>',
          '<div class="ba-burger-wrap">',
            '<button class="ba-burger-btn" type="button" aria-label="Меню навигации" aria-haspopup="menu" aria-expanded="false">β<span class="arrow">→</span>α</button>',
            '<div class="ba-burger-menu" role="menu" aria-label="Навигация">',
              '<a class="ba-burger-item" href="' + _pp() + 'pages/beta2alpha.html" role="menuitem">Витрина</a>',
              '<a class="ba-burger-item" href="' + _pp() + 'pages/about.html" role="menuitem">О проекте</a>',
              '<a class="ba-burger-item" href="' + _pp() + 'pages/cabinet.html?tab=overview" role="menuitem">Кабинет</a>',
              '<a class="ba-burger-item" href="' + _pp() + 'pages/library.html" role="menuitem">Библиотека</a>',
              '<a class="ba-burger-item" href="' + _pp() + 'pages/community.html" role="menuitem">Лобби</a>',
            '</div>',
          '</div>',
        '</div>',
        '<nav class="primary-nav" aria-label="Основная навигация">',
          '<span class="nav-side nav-side--l">',
            '<a class="nav-link" href="' + _pp() + 'pages/cabinet.html?tab=overview">Кабинет</a>',
          '</span>',
          '<a class="nav-link" href="' + _pp() + 'pages/library.html">Библиотека</a>',
          '<span class="nav-side nav-side--r">',
            '<a class="nav-link" href="' + _pp() + 'pages/community.html">Лобби</a>',
          '</span>',
          '<span class="nav-strip" aria-hidden="true"></span>',
        '</nav>',
        '<div class="header-actions">',
          '<button class="icon-btn ba-search-btn" type="button" aria-label="Поиск">' + _SVG_SEARCH + '</button>',
          '<button class="icon-btn ba-notif-btn" type="button" aria-label="Уведомления" style="position:relative">',
            _SVG_BELL,
            (unread > 0 ? '<span class="notif-count" aria-label="' + unread + ' уведомлений">' + unread + '</span>' : ''),
          '</button>',
          '<div class="ba-avatar-wrap" style="position:relative">',
            '<button class="avatar-rep ba-avatar-btn" type="button" aria-label="Меню аккаунта" aria-haspopup="menu" aria-expanded="false">',
              '<span class="avatar-rep__face' + (_avatarUrl(session) ? ' has-avatar' : '') + '"' + _avatarStyle(session) + ' aria-hidden="true">' + _esc(initials) + '</span>',
              '<span class="avatar-rep__score">',
                '<span aria-hidden="true">★</span>',
                '<span class="avatar-rep__num">' + _esc(String(rep)) + '</span>',
              '</span>',
            '</button>',
            (unread > 0 ? '<span class="ba-avatar-notif has-notifs" aria-hidden="true">' + unread + '</span>' : ''),
            '<div class="ba-avatar-menu" role="menu" aria-label="Меню аккаунта"></div>',
          '</div>',
          '<span class="pulse-sep" aria-hidden="true"></span>',
          '<button class="icon-btn ba-pulse-btn" type="button" aria-label="Пульс платформы" title="Пульс">' + _SVG_PULSE + '</button>',
        '</div>',
        '<span class="nav-dot" aria-hidden="true"></span>',
      '</div>',
    ].join('');
    return el;
  }

  /* ============================================================
     Nav indicator
     ============================================================ */
  function _placeDot(dot, ref, linkEl) {
    var refRect = ref.getBoundingClientRect();
    var linkRect = linkEl.getBoundingClientRect();
    var z = parseFloat(getComputedStyle(document.body).zoom) || 1;
    dot.style.left = ((linkRect.left - refRect.left) / z) + 'px';
    dot.style.width = (linkRect.width / z) + 'px';
    var navEl = ref.querySelector('.primary-nav');
    var anchorRect = navEl ? navEl.getBoundingClientRect() : linkRect;
    dot.style.top = ((anchorRect.bottom - refRect.top) / z + 2) + 'px';
    dot.style.bottom = 'auto';
    dot.style.opacity = '1';
  }

  function _initNavIndicator(header) {
    var nav = header.querySelector('.primary-nav');
    var headerInner = header.querySelector('.header-inner');
    if (!nav || !headerInner) return;
    /* dot is a child of header-inner so it can reach both left-group (about/logo)
       and right-group (nav) items without needing negative positioning */
    var dot = headerInner.querySelector('.nav-dot');
    var strip = nav.querySelector('.nav-strip');
    if (!dot) return;

    var links = [].slice.call(nav.querySelectorAll('.nav-link'));
    var page = _opts.page;
    function _pageOf(el) {
      return (el.getAttribute('href') || '')
        .replace(/^.*\//, '').replace(/[?#].*$/, '').replace(/\.html$/, '');
    }

    var wordmark = header.querySelector('.wordmark');
    var targets = links.concat(
      [header.querySelector('.header-about'), wordmark].filter(Boolean)
    );
    var active = null;
    targets.forEach(function (el) {
      if (active || !page || _pageOf(el) !== page) return;
      el.setAttribute('aria-current', 'page');
      active = el;
    });

    // Mark the matching burger item so its ::before dot lights up in collapsed mode
    [].slice.call(header.querySelectorAll('.ba-burger-item')).forEach(function (el) {
      if (!page || _pageOf(el) !== page) return;
      el.setAttribute('aria-current', 'page');
    });

    if (active && active !== wordmark) {
      _placeDot(dot, headerInner, active);
      requestAnimationFrame(function () { _placeDot(dot, headerInner, active); });
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () { _placeDot(dot, headerInner, active); });
      }
      /* Re-place on layout shifts. Nav items: the auto column's left edge moves when
         the 1fr column changes (viewport resize / console sidebar). ResizeObserver
         on nav catches sidebar dock (body margin-right → nav shifts in viewport).
         All items: debounced resize as a reliable fallback. */
      if (window.ResizeObserver && active.closest('.primary-nav') === nav) {
        new ResizeObserver(function () { _placeDot(dot, headerInner, active); }).observe(nav);
      }
      var _rTimer;
      window.addEventListener('resize', function () {
        clearTimeout(_rTimer);
        _rTimer = setTimeout(function () { _placeDot(dot, headerInner, active); }, 150);
      });
    }

    links.forEach(function (link) {
      link.addEventListener('click', function () {
        links.forEach(function (l) { l.removeAttribute('aria-current'); });
        link.setAttribute('aria-current', 'page');
        _placeDot(dot, headerInner, link);
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

    // Same unified nav as the authed header → needs the narrow-mode burger too
    _wireBurger(header);
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
     Page metadata (for footer breadcrumb popup)
     ============================================================ */
  var _PAGE_META = {
    'library':    { label: 'Библиотека',  code: 'library',
      crumb: ['β→α', 'Библиотека'],
      target:  'Главный раздел платформы — точка входа в весь контент.',
      content: 'Каталог книг с фильтрами и обложками; Пантеон авторов; вкладка Продюсеры (издатели); подборки и коллекции редакции.' },
    'cabinet':    { label: 'Кабинет',     code: 'cabinet',
      crumb: ['β→α', 'Кабинет'],
      target:  'Персональное пространство участника — всё личное в одном месте.',
      content: 'Постер (лента своей активности); Полка (прочитанное и в процессе); Выдержки (личные цитаты); Переписка; вкладка Репутации.' },
    'community':  { label: 'Сообщество',  code: 'community',
      crumb: ['β→α', 'Сообщество'],
      target:  'Лобби профессионального сообщества — общий разговор вокруг книг.',
      content: 'Пульс активности в реальном времени; Новости издательства; доска участников; клубы чтения; публикация постов.' },
    'beta2alpha': { label: 'beta→alpha',  code: 'beta2alpha',
      crumb: ['β→α'],
      target:  'Публичная витрина издательства — для новых и потенциальных читателей.',
      content: 'Миссия и описание издательства; избранные книги; лента новостей; отзывы читателей; форма вступления в платформу.' },
    'about':      { label: 'О проекте',   code: 'about',
      crumb: ['β→α', 'О проекте'],
      target:  'Объяснение проекта — что это, зачем и для кого.',
      content: 'Описание сообщества и принципов; раздел издательства; ценности платформы; условия сотрудничества с издателями.' },
    'search':     { label: 'Поиск',       code: 'search',
      crumb: ['β→α', 'Поиск'],
      target:  'Единая точка поиска по всему контенту платформы.',
      content: 'Поиск по книгам, авторам, издателям и материалам сообщества; фильтры по типу результата.' },
    'book':       { label: 'Книга',       code: 'library/book',
      crumb: ['β→α', 'Библиотека', 'Книга'],
      target:  'Карточка конкретной книги — центр всего, что связано с этим изданием.',
      content: 'Метаданные и обложка; оглавление; версии издания; бесплатный фрагмент; читать в ридере; обсуждения и рецензии; цитирование.' },
    'author':     { label: 'Автор',       code: 'library/author',
      crumb: ['β→α', 'Библиотека', 'Автор'],
      target:  'Страница автора — профиль и его работы на платформе.',
      content: 'Биография; список книг в каталоге; реакции профессионального сообщества.' },
    'publisher':  { label: 'Издатель',    code: 'library/publisher',
      crumb: ['β→α', 'Библиотека', 'Издатель'],
      target:  'Страница издательства — профиль и его присутствие на платформе.',
      content: 'Профиль и описание; полный каталог изданий; авторский состав; реакции сообщества; условия сотрудничества.' },
    'member':     { label: 'Участник',    code: 'community/member',
      crumb: ['β→α', 'Сообщество', 'Участник'],
      target:  'Публичный профиль участника — его профессиональное лицо в сообществе.',
      content: 'Активность и репутация; прочитанные книги; опубликованные рецензии; написать личное сообщение.' },
  };

  /* ============================================================
     Render: footer (once)
     ============================================================ */
  function _renderFooter() {
    if (document.querySelector('.site-footer[data-ba-frame]')) return;
    var el = document.createElement('footer');
    el.className = 'site-footer';
    el.setAttribute('data-band', 'noir');
    el.setAttribute('data-ba-frame', '');

    var pageKey = _opts.subpage || _opts.page;
    var meta = _PAGE_META[pageKey];
    var locHTML = meta
      ? '<div class="footer-center"><button class="footer-page-loc" type="button" data-ba-page-info>' +
          meta.label + '<span class="footer-page-code">· ' + meta.code + '</span>' +
        '</button></div>'
      : '';

    el.innerHTML = [
      '<div class="container">',
        '<div class="footer-inner">',
          '<div class="footer-brand">',
            '<img class="footer-wordmark" src="' + _pp() + 'assets/decor/b2a-academy.svg" alt="β→α академия">',
            '<span class="footer-tagline">© 2026 beta→alpha · Для профессионального сообщества</span>',
          '</div>',
          locHTML,
          '<div class="footer-end">',
            '<a class="footer-link" href="' + _pp() + 'pages/about.html">О проекте</a>',
            '<span class="build-tag">v0.5.0-primer</span>',
          '</div>',
        '</div>',
      '</div>',
    ].join('');
    document.body.appendChild(el);

    if (meta) {
      var btn = el.querySelector('[data-ba-page-info]');
      if (btn) btn.addEventListener('click', function (e) {
        e.stopPropagation();
        _togglePageInfoPopup(meta, btn);
      });
    }
  }

  function _togglePageInfoPopup(meta, anchor) {
    var existing = document.getElementById('ba-page-info-popup');
    if (existing) { existing.remove(); return; }
    var pop = document.createElement('div');
    pop.id = 'ba-page-info-popup';
    pop.className = 'ba-page-info-popup';
    var crumbHTML = meta.crumb.map(function (c) { return '<span>' + c + '</span>'; }).join('<span class="ba-pip-sep"> / </span>');
    pop.innerHTML =
      '<button class="ba-pip-close" type="button" aria-label="Закрыть">×</button>' +
      '<div class="ba-pip-crumb">' + crumbHTML + '</div>' +
      '<code class="ba-pip-code">' + meta.code + '</code>' +
      '<p class="ba-pip-label">' + meta.label + '</p>' +
      '<div class="ba-pip-section"><p class="ba-pip-sh">Назначение</p><p class="ba-pip-body">' + meta.target + '</p></div>' +
      '<div class="ba-pip-section"><p class="ba-pip-sh">Содержимое</p><p class="ba-pip-body">' + meta.content + '</p></div>';
    document.body.appendChild(pop);

    /* Position flyout above the anchor, clamped within viewport */
    var rect = anchor.getBoundingClientRect();
    var popW = 320;
    var left = Math.max(8, Math.min(window.innerWidth - popW - 8, rect.left + rect.width / 2 - popW / 2));
    pop.style.left = left + 'px';
    pop.style.bottom = (window.innerHeight - rect.top + 12) + 'px';

    pop.querySelector('.ba-pip-close').addEventListener('click', function () { pop.remove(); });
    setTimeout(function () {
      document.addEventListener('click', function _d() { pop.remove(); document.removeEventListener('click', _d); });
    }, 0);
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
            '<input id="ba-login-email" type="email" value="a.ivanova@beta2alpha.academy" autocomplete="email">',
          '</div>',
          '<div class="ba-login-field" style="margin-bottom:8px">',
            '<label for="ba-login-pass">Пароль</label>',
            '<input id="ba-login-pass" type="password" value="demo1234" autocomplete="current-password">',
          '</div>',
          '<p id="ba-login-err" role="alert" style="display:none;margin:0 0 16px;font-size:13px;color:var(--danger,#A8412E)"></p>',
          '<button type="submit" class="btn btn-primary" style="width:100%">Войти</button>',
        '</form>',
        '<p style="margin:14px 0 0;font-size:12px;color:var(--ink-faint);line-height:1.5">Демо-аккаунты: <b>a.ivanova@beta2alpha.academy</b> / demo1234 (участник) · <b>admin@beta2alpha.academy</b> / admin</p>',
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
      var email = (document.getElementById('ba-login-email').value || '').trim().toLowerCase();
      var pass = document.getElementById('ba-login-pass').value || '';
      var errEl = document.getElementById('ba-login-err');
      var member = _findMemberByEmail(email);
      /* Debug-managed login STUB (session decision; no AAA/WebCrypto in Phase 1).
         Verify email+password against the seeded members; Mock members cannot log
         in (specs §3.1 / §4.5 / CON-01). */
      if (!member || member.password !== pass || _isMockMember(member)) {
        if (errEl) { errEl.textContent = 'Неверная почта или пароль.'; errEl.style.display = 'block'; }
        return;
      }
      if (errEl) errEl.style.display = 'none';
      _closeLogin();
      _establishSession(member);
      _showToast('Добро пожаловать, ' + member.displayName.split(' ')[0] + '!');
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
  var _minContentW = 0;
  function _updateHeaderNarrow() {
    /* _layoutWidth() measures the body/viewport width — it is independent of
       whether ba-header-narrow is set, so this function is idempotent.
       classList.toggle with the same boolean is a no-op (no attribute mutation),
       which breaks any MutationObserver feedback loop. */
    document.documentElement.classList.toggle('ba-header-narrow', _layoutWidth() < _minContentW);
  }
  function _watchHeaderNarrow() {
    var header = document.querySelector('.site-header[data-ba-frame]');
    if (header) {
      var z    = parseFloat(getComputedStyle(document.body).zoom) || 1;
      var left = header.querySelector('.header-left');
      var nav  = header.querySelector('.primary-nav');
      var acts = header.querySelector('.header-actions');
      var innerEl = header.querySelector('.header-inner');
      if (left && nav && acts && innerEl) {
        /* With a 1fr/auto/1fr grid the two 1fr columns share remaining space equally.
           Collapse when either 1fr column can no longer fit its content:
             1fr = (container − nav − 2×col_gap) / 2 ≥ max(leftW, actsW)
           → _minContentW = nav + 2×max(left, acts) + 2×col_gap + container_padding */
        var cs     = getComputedStyle(innerEl);
        var leftW  = left.getBoundingClientRect().width / z;
        var navW   = nav.getBoundingClientRect().width  / z;
        var actsW  = acts.getBoundingClientRect().width  / z;
        var colGap = parseFloat(cs.columnGap) || 16;
        var pad    = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
        _minContentW = Math.ceil(navW + 2 * Math.max(leftW, actsW) + 2 * colGap + pad);
      } else {
        _minContentW = 720;
      }
    }
    if (window.ResizeObserver) new ResizeObserver(_updateHeaderNarrow).observe(document.body);
    window.addEventListener('resize', _updateHeaderNarrow);
    /* MutationObserver catches zoom class (ba-magnify) and console sidebar class
       changes that don't fire a resize event. Safe because _updateHeaderNarrow
       is idempotent — a no-op toggle triggers no further mutation. */
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
     Saved position — a GLOBAL localStorage marker the master-frame entry
     (index.html) reads to land an authed visitor back where they were
     (system-model §4.1: "injects by auth state + saved position"). Recorded
     only for authed sessions and never for the public/entry pages.
     ============================================================ */
  function _recordLast() {
    try {
      var s = window.BA && BA.session ? BA.session.get() : null;
      if (!s) return;
      if (/\/(index|beta2alpha)\.html?$/i.test(location.pathname)) return;
      localStorage.setItem('ba:last', location.pathname + location.search);
    } catch (e) {}
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
      _recordLast();
      document.addEventListener('ba:session-change', function () {
        _renderHeader(); // only header needs re-render on session change
        _recordLast();
      });
    },
    openLogin: _openLogin,
    closeLogin: _closeLogin,
    showToast: _showToast,
    loginAs: _loginAs,
    logout: function () { var st = window.BA && BA.store; var id = st && st.activeId && st.activeId(); if (st && st.emit && id) st.emit('session.logout', { who: { entity: 'member', entity_id: id }, with_what: { entity: 'member', entity_id: id }, visibility: 'self' }); BA.session.clear(); }
  };
})();

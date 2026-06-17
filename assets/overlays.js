/**
 * overlays.js — shared overlay system for all authorized blueprint pages
 * Provides: notifications dropdown (C), avatar menu (D),
 *           search panel (E), pulse panel (G), debug console dock (H)
 *
 * Works by aria-label matching so it doesn't require IDs on host pages.
 * Drop in with:  <script src="assets/overlays.js"></script>  at end of <body>
 */
(function () {
  'use strict';

  /* ================================================================
     CSS injected once
     ================================================================ */
  var CSS = `
  .ov-backdrop {
    position:fixed;inset:0;z-index:2000;background:transparent;
  }
  /* ---- Dropdown shell ---- */
  .ov-dropdown {
    position:fixed;z-index:2010;min-width:300px;
    background:var(--surface);border:var(--hairline,1px) solid var(--line);
    border-radius:var(--radius-md,8px);
    box-shadow:0 8px 40px rgba(30,20,10,.14),0 2px 8px rgba(30,20,10,.08);
    display:none;
  }
  .ov-dropdown.is-open { display:block; }
  .ov-dropdown-head {
    display:flex;align-items:center;justify-content:space-between;
    padding:var(--space-4,16px) var(--space-4,16px) var(--space-3,12px);
    border-bottom:var(--hairline,1px) solid var(--line);
  }
  .ov-dropdown-title {
    font-family:var(--font-serif,'Georgia',serif);font-size:var(--fs-body,15px);
    font-weight:600;color:var(--ink);
  }
  .ov-dropdown-action {
    font-family:var(--font-sans,'system-ui',sans-serif);font-size:var(--fs-caption,12px);
    color:var(--accent);background:none;border:none;cursor:pointer;padding:0;
    transition:color 120ms;
  }
  .ov-dropdown-action:hover { opacity:.8; }
  .ov-dropdown-body { overflow-y:auto; max-height:360px; }
  .ov-dropdown-foot {
    padding:var(--space-3,12px) var(--space-4,16px);
    border-top:var(--hairline,1px) solid var(--line);
    text-align:center;
  }
  .ov-foot-link {
    font-family:var(--font-sans,'system-ui',sans-serif);font-size:var(--fs-small,13px);
    color:var(--accent);text-decoration:none;
  }
  .ov-foot-link:hover { opacity:.8; }

  /* ---- Notification items ---- */
  .ov-notif-item {
    display:flex;align-items:flex-start;gap:12px;
    padding:12px 16px;border-bottom:var(--hairline,1px) solid var(--line);
    cursor:pointer;transition:background 120ms;position:relative;
  }
  .ov-notif-item:last-child { border-bottom:none; }
  .ov-notif-item:hover { background:var(--surface-sunk); }
  .ov-notif-item.is-unread { background:color-mix(in srgb,var(--accent) 4%,var(--surface)); }
  .ov-notif-udot {
    position:absolute;left:4px;top:50%;transform:translateY(-50%);
    width:5px;height:5px;border-radius:50%;background:var(--accent);
  }
  .ov-notif-icon {
    width:32px;height:32px;border-radius:50%;
    display:flex;align-items:center;justify-content:center;
    font-size:14px;border:1px solid var(--line);flex-shrink:0;
  }
  .ov-notif-icon--reply  { background:color-mix(in srgb,var(--slate,#5A6E7A) 12%,var(--surface)); }
  .ov-notif-icon--vote   { background:color-mix(in srgb,var(--amber,#C78C3A) 12%,var(--surface)); }
  .ov-notif-icon--edition{ background:color-mix(in srgb,var(--accent,#B85138) 10%,var(--surface)); }
  .ov-notif-text {
    flex:1;font-family:var(--font-sans,'system-ui',sans-serif);
    font-size:var(--fs-small,13px);color:var(--ink);line-height:1.45;
  }
  .ov-notif-excerpt {
    font-family:var(--font-serif,'Georgia',serif);font-size:var(--fs-caption,12px);
    color:var(--ink-soft);font-style:italic;margin-top:2px;line-height:1.4;
    overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;
  }
  .ov-notif-time {
    font-family:var(--font-sans,'system-ui',sans-serif);font-size:10px;
    color:var(--ink-faint);margin-top:3px;
  }

  /* ---- Avatar menu ---- */
  .ov-avatar-menu { min-width:220px; }
  .ov-avatar-hero {
    padding:16px;display:flex;align-items:center;gap:12px;
    border-bottom:1px solid var(--line);
  }
  .ov-avatar-face {
    width:40px;height:40px;border-radius:50%;background:var(--accent);
    color:var(--on-accent,#fff);display:flex;align-items:center;justify-content:center;
    font-family:var(--font-serif,'Georgia',serif);font-size:15px;font-weight:600;flex-shrink:0;
  }
  .ov-avatar-info { flex:1; }
  .ov-avatar-name {
    font-family:var(--font-sans,'system-ui',sans-serif);font-size:13px;
    font-weight:600;color:var(--ink);
  }
  .ov-avatar-rep {
    font-family:var(--font-sans,'system-ui',sans-serif);font-size:11px;
    color:var(--amber,#C78C3A);margin-top:2px;
  }
  .ov-menu-item {
    display:flex;align-items:center;gap:10px;padding:10px 16px;
    font-family:var(--font-sans,'system-ui',sans-serif);font-size:13px;
    color:var(--ink);text-decoration:none;transition:background 120ms;cursor:pointer;
  }
  .ov-menu-item:hover { background:var(--surface-sunk); }
  .ov-menu-item--danger { color:var(--accent); }
  .ov-menu-sep { height:1px;background:var(--line);margin:4px 0; }
  .ov-menu-icon { width:18px;text-align:center;font-size:14px;flex-shrink:0;opacity:.7; }

  /* ---- Search panel ---- */
  .ov-search-panel {
    position:fixed;top:0;left:0;right:0;z-index:2020;
    background:var(--paper);border-bottom:1px solid var(--line);
    box-shadow:0 8px 40px rgba(30,20,10,.14);
    padding:20px var(--gutter,24px) 16px;
    transform:translateY(-100%);transition:transform 220ms var(--ease-out-quart,ease);
  }
  .ov-search-panel.is-open { transform:translateY(0); }
  .ov-search-inner { max-width:640px;margin:0 auto; }
  .ov-search-bar {
    display:flex;align-items:center;gap:12px;
    padding:10px 16px;background:var(--surface);
    border:1px solid var(--accent);border-radius:8px;
    box-shadow:0 2px 12px rgba(184,81,56,.08);margin-bottom:12px;
  }
  .ov-search-input {
    flex:1;background:transparent;border:none;outline:none;
    font-family:var(--font-sans,'system-ui',sans-serif);font-size:15px;
    color:var(--ink);
  }
  .ov-search-input::placeholder { color:var(--ink-faint); }
  .ov-search-close {
    background:none;border:none;color:var(--ink-faint);cursor:pointer;
    font-size:20px;line-height:1;padding:0;transition:color 120ms;
  }
  .ov-search-close:hover { color:var(--accent); }
  .ov-scope-row { display:flex;align-items:center;gap:8px;flex-wrap:wrap; }
  .ov-scope-label {
    font-family:var(--font-sans,'system-ui',sans-serif);
    font-size:12px;color:var(--ink-faint);
  }
  .ov-scope-btn {
    display:inline-flex;align-items:center;gap:6px;
    padding:3px 12px;border-radius:99px;border:1px solid var(--line);
    font-family:var(--font-sans,'system-ui',sans-serif);
    font-size:12px;font-weight:500;color:var(--ink-soft);
    background:transparent;cursor:pointer;transition:all 120ms;
  }
  .ov-scope-btn.is-on {
    border-color:var(--accent);color:var(--accent);
    background:color-mix(in srgb,var(--accent) 8%,transparent);
  }
  .ov-search-hint {
    font-family:var(--font-sans,'system-ui',sans-serif);
    font-size:12px;color:var(--ink-faint);margin-top:8px;
  }
  .ov-search-hint a { color:var(--accent); }

  /* ---- Pulse panel ---- */
  .ov-pulse-panel {
    position:fixed;top:var(--header-height,60px);right:0;bottom:0;
    width:340px;z-index:2010;
    background:var(--surface);border-left:1px solid var(--line);
    box-shadow:-4px 0 32px rgba(30,20,10,.10);
    display:flex;flex-direction:column;
    transform:translateX(100%);transition:transform 240ms var(--ease-out-quart,ease);
  }
  .ov-pulse-panel.is-open { transform:translateX(0); }
  .ov-pulse-head {
    padding:16px;border-bottom:1px solid var(--line);
    display:flex;align-items:center;justify-content:space-between;flex-shrink:0;
  }
  .ov-pulse-title {
    font-family:var(--font-serif,'Georgia',serif);font-size:16px;
    font-weight:600;color:var(--ink);
  }
  .ov-pulse-sub {
    font-family:var(--font-sans,'system-ui',sans-serif);
    font-size:11px;color:var(--ink-faint);margin-top:2px;
  }
  .ov-pulse-close {
    background:none;border:none;color:var(--ink-faint);cursor:pointer;
    font-size:20px;line-height:1;padding:0;transition:color 120ms;
  }
  .ov-pulse-close:hover { color:var(--accent); }
  .ov-pulse-feed { flex:1;overflow-y:auto;padding:8px 0; }
  .ov-pulse-item {
    display:flex;align-items:flex-start;gap:10px;
    padding:10px 16px;border-bottom:1px solid var(--line);
  }
  .ov-pulse-item:last-child { border-bottom:none; }
  .ov-pulse-av {
    width:28px;height:28px;border-radius:50%;flex-shrink:0;
    display:flex;align-items:center;justify-content:center;
    font-family:var(--font-sans,'system-ui',sans-serif);font-size:10px;
    font-weight:600;color:#ECE3D6;
  }
  .ov-pulse-ev-text {
    flex:1;font-family:var(--font-sans,'system-ui',sans-serif);
    font-size:12px;color:var(--ink-soft);line-height:1.45;
  }
  .ov-pulse-ev-text a { color:var(--accent); }
  .ov-pulse-ev-time {
    font-size:10px;color:var(--ink-faint);margin-top:2px;white-space:nowrap;
  }

  /* ---- Debug console dock ---- */
  .ov-console-btn {
    position:fixed;bottom:80px;right:16px;
    width:40px;height:40px;border-radius:50%;
    background:#1F1B18;color:#ECE3D6;border:none;cursor:pointer;
    display:flex;align-items:center;justify-content:center;
    font-size:18px;z-index:1900;box-shadow:0 4px 16px rgba(0,0,0,.24);
    transition:background 120ms,transform 120ms;
  }
  .ov-console-btn:hover { background:#2E2924;transform:scale(1.08); }
  .ov-console-dock {
    position:fixed;left:0;right:0;bottom:0;z-index:2030;
    height:calc(var(--vh,1vh)*38);min-height:260px;max-height:480px;
    background:#1F1B18;border-top:1px solid rgba(255,255,255,.12);
    display:flex;flex-direction:column;
    transform:translateY(100%);transition:transform 240ms var(--ease-out-quart,ease);
  }
  .ov-console-dock.is-open { transform:translateY(0); }
  .ov-console-topbar {
    height:40px;flex-shrink:0;display:flex;align-items:stretch;
    border-bottom:1px solid rgba(255,255,255,.08);
  }
  .ov-console-tabs { display:flex;overflow-x:auto; }
  .ov-console-tab {
    padding:0 16px;font-family:var(--font-sans,'system-ui',sans-serif);
    font-size:12px;font-weight:500;color:rgba(236,227,214,.5);
    background:transparent;border:none;border-bottom:2px solid transparent;
    cursor:pointer;white-space:nowrap;transition:color 120ms,border-color 120ms;
    margin-bottom:-1px;
  }
  .ov-console-tab:hover { color:rgba(236,227,214,.8); }
  .ov-console-tab.is-active { color:#ECE3D6;border-bottom-color:#D2674A; }
  .ov-console-close {
    margin-left:auto;padding:0 16px;background:none;border:none;
    color:rgba(236,227,214,.4);cursor:pointer;font-size:16px;line-height:1;
    transition:color 120ms;flex-shrink:0;
  }
  .ov-console-close:hover { color:#ECE3D6; }
  .ov-console-body { flex:1;overflow:hidden;display:flex; }
  .ov-console-panel {
    display:none;flex:1;overflow-y:auto;padding:12px 16px;
    font-family:'Courier New',monospace;font-size:12px;color:rgba(236,227,214,.8);
    line-height:1.6;
  }
  .ov-console-panel.is-active { display:block; }
  .ov-c-label {
    font-family:var(--font-sans,'system-ui',sans-serif);font-size:11px;
    font-weight:600;letter-spacing:.06em;text-transform:uppercase;
    color:rgba(236,227,214,.35);margin-bottom:8px;margin-top:12px;
  }
  .ov-c-label:first-child { margin-top:0; }
  .ov-c-table { width:100%;border-collapse:collapse;margin-bottom:12px; }
  .ov-c-table th {
    font-family:var(--font-sans,'system-ui',sans-serif);font-size:11px;
    color:rgba(236,227,214,.4);font-weight:500;text-align:left;
    padding:4px 8px;border-bottom:1px solid rgba(255,255,255,.08);
  }
  .ov-c-table td {
    font-size:12px;color:rgba(236,227,214,.75);
    padding:5px 8px;border-bottom:1px solid rgba(255,255,255,.05);
  }
  .ov-c-badge {
    display:inline-flex;padding:1px 6px;border-radius:99px;font-size:10px;
    font-weight:600;border:1px solid;font-family:var(--font-sans,'system-ui',sans-serif);
  }
  .ov-c-badge--pro  { color:#6DAE8C;border-color:#6DAE8C; }
  .ov-c-badge--mem  { color:#C78C3A;border-color:#C78C3A; }
  .ov-c-badge--anon { color:rgba(236,227,214,.3);border-color:rgba(236,227,214,.15); }
  .ov-c-btn {
    display:inline-flex;align-items:center;gap:6px;padding:5px 12px;
    background:rgba(210,103,74,.18);color:#D2674A;border:1px solid rgba(210,103,74,.4);
    border-radius:6px;font-family:var(--font-sans,'system-ui',sans-serif);
    font-size:12px;font-weight:500;cursor:pointer;transition:all 120ms;margin:2px;
  }
  .ov-c-btn:hover { background:rgba(210,103,74,.28);border-color:#D2674A; }
  .ov-c-btn--green {
    background:rgba(109,174,140,.15);color:#6DAE8C;
    border-color:rgba(109,174,140,.35);
  }
  .ov-c-btn--green:hover { background:rgba(109,174,140,.25); }
  .ov-c-input {
    padding:5px 10px;background:rgba(255,255,255,.06);
    border:1px solid rgba(255,255,255,.12);border-radius:6px;
    font-family:'Courier New',monospace;font-size:12px;color:#ECE3D6;
    outline:none;transition:border-color 120ms;
  }
  .ov-c-input:focus { border-color:#D2674A; }
  .ov-c-event {
    display:flex;align-items:flex-start;gap:8px;padding:5px 0;
    border-bottom:1px solid rgba(255,255,255,.04);font-size:11px;
  }
  .ov-c-event:last-child { border-bottom:none; }
  .ov-c-ev-time { color:rgba(236,227,214,.3);white-space:nowrap;flex-shrink:0; }
  .ov-c-ev-type { color:#D2674A;flex-shrink:0; }
  .ov-c-ev-body { color:rgba(236,227,214,.65); }
  .ov-c-ev-actor { color:#C78C3A; }
  @media (max-width:640px) {
    .ov-pulse-panel { width:100%; }
    .ov-console-dock { height:55vh; }
  }
  `;

  function injectCSS() {
    if (document.getElementById('ov-styles')) return;
    var s = document.createElement('style');
    s.id = 'ov-styles';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* ================================================================
     Helpers
     ================================================================ */
  function findByLabel(patterns) {
    var all = document.querySelectorAll('button,[role="button"],a');
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      var label = (el.getAttribute('aria-label') || el.textContent || '').toLowerCase();
      for (var p = 0; p < patterns.length; p++) {
        if (label.indexOf(patterns[p]) !== -1) return el;
      }
    }
    return null;
  }

  function findFooterConsole() {
    var links = document.querySelectorAll('.footer-link,.footer-link-sm,a');
    for (var i = 0; i < links.length; i++) {
      if ((links[i].textContent || '').trim() === 'Консоль') return links[i];
    }
    return null;
  }

  function positionNear(el, dropdown) {
    var rect = el.getBoundingClientRect();
    var w = window.innerWidth;
    dropdown.style.top = (rect.bottom + 6) + 'px';
    var left = rect.right - parseInt(dropdown.style.minWidth || 300);
    if (left < 8) left = 8;
    if (left + 320 > w) left = w - 328;
    dropdown.style.left = Math.max(8, left) + 'px';
  }

  function closeAll(except) {
    var panels = document.querySelectorAll('.ov-dropdown.is-open,.ov-pulse-panel.is-open');
    for (var i = 0; i < panels.length; i++) {
      if (panels[i] !== except) panels[i].classList.remove('is-open');
    }
    if (except !== ovSearch) ovSearch.classList.remove('is-open');
  }

  /* ================================================================
     NOTIFICATIONS DROPDOWN
     ================================================================ */
  var NOTIF_DATA = [
    { type:'reply',  icon:'💬', cls:'reply',  unread:true,
      text:'<strong>Мария Соколова</strong> ответила на ваш комментарий в <a href="book.html">«Научение на опыте»</a>',
      excerpt:'«Согласна с этим. Именно неопределённость понятия даёт ему клиническую жизнь…»', time:'15 мин.' },
    { type:'vote',   icon:'⭐', cls:'vote',   unread:true,
      text:'<strong>Дмитрий Орлов</strong> и ещё 4 поддержали ваш комментарий',
      excerpt:'«Четвёртый семинар — самый живой. Бион отвечает…»', time:'2 ч.' },
    { type:'edition',icon:'📚', cls:'edition',unread:true,
      text:'Новая версия <a href="book.html">«Гореть вместе»</a> — v1.1',
      excerpt:'Исправлены опечатки в главах 3 и 7.', time:'4 ч.' },
    { type:'vote',   icon:'⭐', cls:'vote',   unread:false,
      text:'<strong>Наталья Кузнецова</strong> поддержала ваш комментарий',
      excerpt:'', time:'вчера' },
  ];

  function buildNotifDropdown() {
    var d = document.createElement('div');
    d.className = 'ov-dropdown';
    d.style.width = '340px';
    d.setAttribute('role','dialog');
    d.setAttribute('aria-label','Уведомления');

    var unread = NOTIF_DATA.filter(function(n){ return n.unread; }).length;
    d.innerHTML =
      '<div class="ov-dropdown-head">' +
        '<span class="ov-dropdown-title">Уведомления' + (unread ? ' <span style="display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;padding:0 4px;border-radius:99px;background:var(--accent);color:var(--on-accent,#fff);font-size:10px;font-weight:700;vertical-align:middle;margin-left:4px;">' + unread + '</span>' : '') + '</span>' +
        '<button class="ov-dropdown-action" id="ov-notif-read-all">Прочитать все</button>' +
      '</div>' +
      '<div class="ov-dropdown-body" id="ov-notif-body"></div>' +
      '<div class="ov-dropdown-foot"><a class="ov-foot-link" href="notifications.html">Все уведомления →</a></div>';

    var body = d.querySelector('#ov-notif-body');
    NOTIF_DATA.forEach(function(n) {
      var item = document.createElement('div');
      item.className = 'ov-notif-item' + (n.unread ? ' is-unread' : '');
      item.innerHTML =
        (n.unread ? '<span class="ov-notif-udot" aria-hidden="true"></span>' : '') +
        '<span class="ov-notif-icon ov-notif-icon--' + n.cls + '" aria-hidden="true">' + n.icon + '</span>' +
        '<div style="flex:1;min-width:0;">' +
          '<p class="ov-notif-text">' + n.text + '</p>' +
          (n.excerpt ? '<p class="ov-notif-excerpt">' + n.excerpt + '</p>' : '') +
          '<p class="ov-notif-time">' + n.time + ' назад</p>' +
        '</div>';
      item.addEventListener('click', function(e) {
        if (e.target.tagName === 'A') return;
        item.classList.remove('is-unread');
        var dot = item.querySelector('.ov-notif-udot');
        if (dot) dot.remove();
        window.location.href = 'notifications.html';
      });
      body.appendChild(item);
    });

    d.querySelector('#ov-notif-read-all').addEventListener('click', function() {
      d.querySelectorAll('.ov-notif-item.is-unread').forEach(function(el){
        el.classList.remove('is-unread');
        var dot = el.querySelector('.ov-notif-udot');
        if (dot) dot.remove();
      });
      this.textContent = 'Всё прочитано ✓';
      this.disabled = true;
      var badge = document.getElementById('ov-notif-badge');
      if (badge) badge.remove();
    });

    return d;
  }

  /* ================================================================
     AVATAR MENU DROPDOWN
     ================================================================ */
  function buildAvatarMenu() {
    var d = document.createElement('div');
    d.className = 'ov-dropdown ov-avatar-menu';
    d.setAttribute('role','menu');
    d.setAttribute('aria-label','Меню аккаунта');
    d.innerHTML =
      '<div class="ov-avatar-hero">' +
        '<div class="ov-avatar-face" aria-hidden="true">АИ</div>' +
        '<div class="ov-avatar-info">' +
          '<p class="ov-avatar-name">Александра Иванова</p>' +
          '<p class="ov-avatar-rep">★ 142 · Практик</p>' +
        '</div>' +
      '</div>' +
      '<a class="ov-menu-item" href="cabinet.html" role="menuitem"><span class="ov-menu-icon">⚙️</span>Кабинет</a>' +
      '<a class="ov-menu-item" href="profile.html" role="menuitem"><span class="ov-menu-icon">👤</span>Профиль</a>' +
      '<a class="ov-menu-item" href="shelf.html" role="menuitem"><span class="ov-menu-icon">📚</span>Моя полка</a>' +
      '<a class="ov-menu-item" href="messages.html" role="menuitem"><span class="ov-menu-icon">✉️</span>Сообщения</a>' +
      '<div class="ov-menu-sep"></div>' +
      '<a class="ov-menu-item ov-menu-item--danger" href="pub-landing.html" role="menuitem"><span class="ov-menu-icon">↩</span>Выйти</a>';
    return d;
  }

  /* ================================================================
     SEARCH PANEL
     ================================================================ */
  var ovSearch;
  function buildSearchPanel() {
    var d = document.createElement('div');
    d.className = 'ov-search-panel';
    d.setAttribute('role','search');
    d.setAttribute('aria-label','Поиск по платформе');
    d.innerHTML =
      '<div class="ov-search-inner">' +
        '<div class="ov-search-bar">' +
          '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--ink-faint)" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/></svg>' +
          '<input class="ov-search-input" id="ov-search-input" type="search" placeholder="Поиск книг и обсуждений…" autocomplete="off" spellcheck="false" />' +
          '<button class="ov-search-close" id="ov-search-close" aria-label="Закрыть поиск" type="button">×</button>' +
        '</div>' +
        '<div class="ov-scope-row">' +
          '<span class="ov-scope-label">Область:</span>' +
          '<button class="ov-scope-btn is-on" id="ov-sc-books" type="button">✓ Книги</button>' +
          '<button class="ov-scope-btn is-on" id="ov-sc-comm" type="button">✓ Сообщество</button>' +
        '</div>' +
        '<p class="ov-search-hint">Быстрые ссылки: <a href="library.html">Библиотека</a> · <a href="community.html">Обсуждения</a> · <a href="notifications.html">Уведомления</a></p>' +
      '</div>';
    return d;
  }

  /* ================================================================
     PULSE PANEL
     ================================================================ */
  var PULSE_EVENTS = [
    { av:'МС', bg:'var(--slate,#5A6E7A)',  text:'<strong>Мария Соколова</strong> прокомментировала <a href="book.html">«Научение на опыте»</a>', time:'2 мин.' },
    { av:'ДО', bg:'#7A4A3A',               text:'<strong>Дмитрий Орлов</strong> завершил чтение <a href="book.html">«Гореть вместе»</a>', time:'7 мин.' },
    { av:'АП', bg:'var(--slate,#5A6E7A)',  text:'<strong>Алексей Петров</strong> поставил ★★★★★ <a href="book.html">«Научение на опыте»</a>', time:'18 мин.' },
    { av:'НК', bg:'var(--sage,#4D7A66)',   text:'<strong>Наталья Кузнецова</strong> начала читать <a href="book.html">«Избегание эмоций»</a>', time:'34 мин.' },
    { av:'АИ', bg:'var(--accent,#B85138)', text:'Вы прочитали 5 страниц <a href="book.html">«Научение на опыте»</a>', time:'1 ч.' },
    { av:'МС', bg:'var(--slate,#5A6E7A)',  text:'<strong>Мария Соколова</strong> написала рецензию на <a href="book.html">«Гореть вместе»</a>', time:'2 ч.' },
    { av:'ДО', bg:'#7A4A3A',               text:'<strong>Дмитрий Орлов</strong> упомянул <a href="profile.html">вас</a> в обсуждении', time:'3 ч.' },
    { av:'📚', bg:'var(--surface-sunk)',   text:'Новая версия <a href="book.html">«Гореть вместе»</a> — v1.1 доступна', time:'4 ч.' },
  ];

  function buildPulsePanel() {
    var d = document.createElement('div');
    d.className = 'ov-pulse-panel';
    d.setAttribute('aria-label','Пульс платформы');

    var head = '<div class="ov-pulse-head">' +
      '<div><p class="ov-pulse-title">Пульс</p><p class="ov-pulse-sub">Активность прямо сейчас</p></div>' +
      '<button class="ov-pulse-close" id="ov-pulse-close" aria-label="Закрыть" type="button">×</button>' +
    '</div>';

    var feed = '<div class="ov-pulse-feed">';
    PULSE_EVENTS.forEach(function(ev) {
      feed +=
        '<div class="ov-pulse-item">' +
          '<span class="ov-pulse-av" style="background:' + ev.bg + '" aria-hidden="true">' + ev.av + '</span>' +
          '<div style="flex:1;min-width:0;">' +
            '<p class="ov-pulse-ev-text">' + ev.text + '</p>' +
            '<p class="ov-pulse-ev-time">' + ev.time + ' назад</p>' +
          '</div>' +
        '</div>';
    });
    feed += '</div>';

    d.innerHTML = head + feed;
    return d;
  }

  /* ================================================================
     DEBUG CONSOLE DOCK
     ================================================================ */
  var CONSOLE_USERS = [
    { init:'АИ', bg:'var(--accent)', name:'Александра Иванова', email:'a.ivanova@example.com', role:'Участник', rep:142, active:true },
    { init:'ДО', bg:'#7A4A3A',      name:'Дмитрий Орлов',     email:'d.orlov@example.com',   role:'Профессионал', rep:412, active:false },
    { init:'МС', bg:'var(--slate)', name:'Мария Соколова',     email:'m.sokolova@example.com',role:'Профессионал', rep:287, active:false },
    { init:'АП', bg:'#5A6E7A',      name:'Алексей Петров',     email:'a.petrov@example.com',  role:'Участник', rep:118, active:false },
    { init:'НК', bg:'var(--sage)',   name:'Наталья Кузнецова',  email:'n.kuznetsova@example.com', role:'Профессионал', rep:234, active:false },
  ];

  var CONSOLE_BOOKS = [
    { title:'Научение на опыте', slug:'bion-naucheniye', ver:'v1.0', pages:112, reads:7, disc:14 },
    { title:'Гореть вместе',     slug:'nikoli-goret',    ver:'v1.1', pages:228, reads:5, disc:8 },
    { title:'Избегание эмоций',  slug:'ferro-emotsii',  ver:'v1.0', pages:184, reads:3, disc:4 },
  ];

  var CONSOLE_EVENTS = [
    { time:'16:44:02', type:'page.viewed',    actor:'АИ', body:'book_id=bion, page=38' },
    { time:'16:43:51', type:'comment.created',actor:'МС', body:'book_id=bion, comment_id=c4' },
    { time:'16:41:30', type:'book.opened',    actor:'ДО', body:'book_id=nikoli, v=1.1' },
    { time:'16:38:07', type:'vote.cast',      actor:'АП', body:'target=comment c3, weight=2, delta=+2' },
    { time:'16:35:22', type:'page.viewed',    actor:'НК', body:'book_id=bion, page=27' },
    { time:'16:32:11', type:'session.ended',  actor:'АИ', body:'book_id=bion, duration=840s' },
    { time:'16:28:44', type:'review.created', actor:'МС', body:'book_id=nikoli, rating=4' },
    { time:'16:15:03', type:'book.opened',    actor:'АИ', body:'book_id=bion, v=1.0' },
  ];

  function buildConsoleDock() {
    var d = document.createElement('div');
    d.className = 'ov-console-dock';
    d.setAttribute('role','complementary');
    d.setAttribute('aria-label','Debug console');

    /* Tab bar */
    var tabs = ['users','cohorts','simulation','data','events'];
    var tabLabels = ['👤 Пользователи','👥 Когорты','⚡ Симуляция','📋 Данные','📡 События'];
    var tabBar = '<div class="ov-console-topbar"><div class="ov-console-tabs">';
    tabs.forEach(function(t,i){ tabBar += '<button class="ov-console-tab' + (i===0?' is-active':'') + '" data-ctab="' + t + '">' + tabLabels[i] + '</button>'; });
    tabBar += '</div><button class="ov-console-close" id="ov-console-close" aria-label="Закрыть консоль" type="button">✕</button></div>';

    /* USERS panel */
    var usersHTML = '<p class="ov-c-label">Активный пользователь</p>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;">';
    CONSOLE_USERS.forEach(function(u) {
      usersHTML += '<button class="ov-c-btn' + (u.active?' ov-c-btn--green':'') + '" data-login="' + u.email + '">' +
        '<span style="display:inline-flex;width:18px;height:18px;border-radius:50%;background:' + u.bg + ';align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#ECE3D6;">' + u.init + '</span>' +
        u.name.split(' ')[0] + (u.active ? ' ✓' : '') + '</button>';
    });
    usersHTML += '</div>';
    usersHTML += '<p class="ov-c-label">Все пользователи</p>' +
      '<table class="ov-c-table"><thead><tr><th>Имя</th><th>Роль</th><th>Репутация</th></tr></thead><tbody>';
    CONSOLE_USERS.forEach(function(u){
      var roleCls = u.role === 'Профессионал' ? 'pro' : 'mem';
      usersHTML += '<tr><td>' + u.name + '</td><td><span class="ov-c-badge ov-c-badge--' + roleCls + '">' + u.role + '</span></td><td>' + u.rep + '</td></tr>';
    });
    usersHTML += '</tbody></table>';

    /* COHORTS panel */
    var cohortsHTML = '<p class="ov-c-label">Когорты</p>' +
      '<table class="ov-c-table"><thead><tr><th>Название</th><th>Участники</th><th>Сценарий</th></tr></thead><tbody>' +
      '<tr><td>Профессионалы</td><td>ДО, МС, НК</td><td>active_pro</td></tr>' +
      '<tr><td>Участники</td><td>АИ, АП</td><td>active_member</td></tr>' +
      '<tr><td>Новички</td><td>—</td><td>onboarding</td></tr>' +
      '</tbody></table>' +
      '<p class="ov-c-label">Создать когорту</p>' +
      '<div style="display:flex;gap:6px;align-items:center;">' +
        '<input class="ov-c-input" style="flex:1;" placeholder="Название когорты" />' +
        '<button class="ov-c-btn ov-c-btn--green">+ Создать</button>' +
      '</div>';

    /* SIMULATION panel */
    var simHTML = '<p class="ov-c-label">Движок симуляции</p>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">' +
        '<button class="ov-c-btn ov-c-btn--green" id="ov-sim-tick">▶ Тик</button>' +
        '<button class="ov-c-btn ov-c-btn--green" id="ov-sim-5">▶▶ 5 тиков</button>' +
        '<button class="ov-c-btn" id="ov-sim-reset">↺ Сброс</button>' +
      '</div>' +
      '<p class="ov-c-label">Параметры тика</p>' +
      '<table class="ov-c-table"><tbody>' +
        '<tr><td>Пользователей / тик</td><td><input class="ov-c-input" style="width:48px;" value="2" /></td></tr>' +
        '<tr><td>Страниц / сессия</td><td><input class="ov-c-input" style="width:48px;" value="5" /></td></tr>' +
        '<tr><td>Вероятность комментария</td><td><input class="ov-c-input" style="width:48px;" value="0.3" /></td></tr>' +
      '</tbody></table>' +
      '<p class="ov-c-label" id="ov-sim-log-label">Лог симуляции</p>' +
      '<div id="ov-sim-log" style="font-size:11px;color:rgba(236,227,214,.5);"></div>';

    /* DATA panel */
    var dataHTML = '<p class="ov-c-label">Каталог книг</p>' +
      '<table class="ov-c-table"><thead><tr><th>Книга</th><th>Версия</th><th>Читают</th><th>Обсуждений</th></tr></thead><tbody>';
    CONSOLE_BOOKS.forEach(function(b){
      dataHTML += '<tr><td><a href="book.html" style="color:var(--accent)">' + b.title + '</a></td><td>' + b.ver + '</td><td>' + b.reads + '</td><td>' + b.disc + '</td></tr>';
    });
    dataHTML += '</tbody></table>';

    /* EVENTS panel */
    var evHTML = '<p class="ov-c-label" style="display:flex;align-items:center;justify-content:space-between;">Лог событий <span style="color:rgba(236,227,214,.3);font-weight:400;font-size:10px;text-transform:none;">' + CONSOLE_EVENTS.length + ' записей</span></p>';
    CONSOLE_EVENTS.forEach(function(ev){
      evHTML += '<div class="ov-c-event"><span class="ov-c-ev-time">' + ev.time + '</span><span class="ov-c-ev-type">' + ev.type + '</span><span class="ov-c-ev-actor">[' + ev.actor + ']</span><span class="ov-c-ev-body">' + ev.body + '</span></div>';
    });

    var panels =
      '<div class="ov-console-body">' +
        '<div class="ov-console-panel is-active" id="ov-cpanel-users">' + usersHTML + '</div>' +
        '<div class="ov-console-panel" id="ov-cpanel-cohorts">' + cohortsHTML + '</div>' +
        '<div class="ov-console-panel" id="ov-cpanel-simulation">' + simHTML + '</div>' +
        '<div class="ov-console-panel" id="ov-cpanel-data">' + dataHTML + '</div>' +
        '<div class="ov-console-panel" id="ov-cpanel-events">' + evHTML + '</div>' +
      '</div>';

    d.innerHTML = tabBar + panels;
    return d;
  }

  /* ================================================================
     FLOATING CONSOLE BUTTON
     ================================================================ */
  function buildConsoleBtn() {
    var b = document.createElement('button');
    b.className = 'ov-console-btn';
    b.id = 'ov-console-fab';
    b.type = 'button';
    b.title = 'Debug Console';
    b.setAttribute('aria-label', 'Debug Console');
    b.innerHTML = '⚙';
    return b;
  }

  /* ================================================================
     INIT
     ================================================================ */
  function init() {
    injectCSS();

    /* Build elements */
    var ovNotif  = buildNotifDropdown();
    var ovAvatar = buildAvatarMenu();
    ovSearch     = buildSearchPanel();
    var ovPulse  = buildPulsePanel();
    var ovConsole = buildConsoleDock();
    var ovConsoleFab = buildConsoleBtn();

    document.body.appendChild(ovNotif);
    document.body.appendChild(ovAvatar);
    document.body.appendChild(ovSearch);
    document.body.appendChild(ovPulse);
    document.body.appendChild(ovConsole);
    document.body.appendChild(ovConsoleFab);

    /* ---- Wire: notifications ---- */
    var btnNotif = findByLabel(['уведомлени']);
    if (btnNotif) {
      btnNotif.addEventListener('click', function(e) {
        e.preventDefault(); e.stopPropagation();
        var open = !ovNotif.classList.contains('is-open');
        closeAll();
        if (open) {
          ovNotif.classList.add('is-open');
          positionNear(btnNotif, ovNotif);
        }
      });
      /* badge */
      var badge = document.createElement('span');
      badge.id = 'ov-notif-badge';
      badge.style.cssText = 'position:absolute;top:4px;right:4px;min-width:16px;height:16px;padding:0 4px;display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;background:var(--accent);border-radius:99px;pointer-events:none;';
      badge.textContent = '3';
      if (!btnNotif.querySelector('[class*="notif-count"]')) {
        btnNotif.style.position = 'relative';
        btnNotif.appendChild(badge);
      }
    }

    /* ---- Wire: avatar ---- */
    var btnAvatar = findByLabel(['аккаунт']);
    if (btnAvatar) {
      btnAvatar.addEventListener('click', function(e) {
        e.preventDefault(); e.stopPropagation();
        var open = !ovAvatar.classList.contains('is-open');
        closeAll();
        if (open) {
          ovAvatar.classList.add('is-open');
          positionNear(btnAvatar, ovAvatar);
        }
      });
    }

    /* ---- Wire: search ---- */
    var btnSearch = findByLabel(['поиск']);
    if (btnSearch) {
      btnSearch.addEventListener('click', function(e) {
        e.preventDefault(); e.stopPropagation();
        var open = !ovSearch.classList.contains('is-open');
        closeAll();
        if (open) {
          ovSearch.classList.add('is-open');
          setTimeout(function(){ var inp = document.getElementById('ov-search-input'); if(inp) inp.focus(); }, 60);
        }
      });
    }
    var searchClose = document.getElementById('ov-search-close');
    if (searchClose) searchClose.addEventListener('click', function(e){ e.stopPropagation(); ovSearch.classList.remove('is-open'); });

    var searchInput = document.getElementById('ov-search-input');
    if (searchInput) {
      searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && searchInput.value.trim()) {
          ovSearch.classList.remove('is-open');
          window.location.href = 'search.html?q=' + encodeURIComponent(searchInput.value.trim());
        }
        if (e.key === 'Escape') ovSearch.classList.remove('is-open');
      });
    }

    /* Scope toggles */
    ['ov-sc-books','ov-sc-comm'].forEach(function(id){
      var b = document.getElementById(id);
      if (b) b.addEventListener('click', function(){ b.classList.toggle('is-on'); });
    });

    /* ---- Wire: pulse ---- */
    var btnPulse = findByLabel(['пульс']);
    if (btnPulse) {
      btnPulse.addEventListener('click', function(e) {
        e.preventDefault(); e.stopPropagation();
        var open = !ovPulse.classList.contains('is-open');
        closeAll();
        if (open) ovPulse.classList.add('is-open');
      });
    }
    var pulseClose = document.getElementById('ov-pulse-close');
    if (pulseClose) pulseClose.addEventListener('click', function(){ ovPulse.classList.remove('is-open'); });

    /* ---- Wire: console ---- */
    function toggleConsole(e) {
      e.preventDefault(); e.stopPropagation();
      ovConsole.classList.toggle('is-open');
    }
    ovConsoleFab.addEventListener('click', toggleConsole);
    var footerConsole = findFooterConsole();
    if (footerConsole) footerConsole.addEventListener('click', toggleConsole);

    var consoleClose = document.getElementById('ov-console-close');
    if (consoleClose) consoleClose.addEventListener('click', function(){ ovConsole.classList.remove('is-open'); });

    /* Console tabs */
    ovConsole.querySelectorAll('.ov-console-tab').forEach(function(tab) {
      tab.addEventListener('click', function() {
        ovConsole.querySelectorAll('.ov-console-tab').forEach(function(t){ t.classList.remove('is-active'); });
        ovConsole.querySelectorAll('.ov-console-panel').forEach(function(p){ p.classList.remove('is-active'); });
        tab.classList.add('is-active');
        var panel = document.getElementById('ov-cpanel-' + tab.dataset.ctab);
        if (panel) panel.classList.add('is-active');
      });
    });

    /* Console: login switch */
    ovConsole.querySelectorAll('[data-login]').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        ovConsole.querySelectorAll('[data-login]').forEach(function(b){ b.classList.remove('ov-c-btn--green'); b.textContent = b.textContent.replace(' ✓',''); });
        btn.classList.add('ov-c-btn--green');
        btn.textContent = btn.textContent + ' ✓';
        var log = document.getElementById('ov-sim-log');
        if (log) log.innerHTML = '<span style="color:#6DAE8C">// Активный пользователь: ' + btn.dataset.login + '</span>\n' + (log.innerHTML || '');
      });
    });

    /* Console: simulation */
    var simTick = 0;
    var simActions = ['book.opened','page.viewed','page.viewed','page.viewed','comment.created','vote.cast','session.ended'];
    var simActors  = ['АИ','МС','ДО','АП','НК'];
    function doTick(n) {
      var log = document.getElementById('ov-sim-log');
      if (!log) return;
      for (var i = 0; i < (n||1); i++) {
        simTick++;
        var now = new Date();
        var ts = ('0'+now.getHours()).slice(-2)+':'+('0'+now.getMinutes()).slice(-2)+':'+('0'+now.getSeconds()).slice(-2);
        var action = simActions[Math.floor(Math.random()*simActions.length)];
        var actor  = simActors[Math.floor(Math.random()*simActors.length)];
        log.innerHTML = '<div class="ov-c-event"><span class="ov-c-ev-time">'+ts+'</span><span class="ov-c-ev-type">'+action+'</span><span class="ov-c-ev-actor">['+actor+']</span><span class="ov-c-ev-body">tick='+simTick+'</span></div>' + log.innerHTML;
      }
    }
    var simTickBtn = document.getElementById('ov-sim-tick');
    if (simTickBtn) simTickBtn.addEventListener('click', function(e){ e.stopPropagation(); doTick(1); });
    var sim5Btn = document.getElementById('ov-sim-5');
    if (sim5Btn) sim5Btn.addEventListener('click', function(e){ e.stopPropagation(); doTick(5); });
    var simReset = document.getElementById('ov-sim-reset');
    if (simReset) simReset.addEventListener('click', function(e){ e.stopPropagation(); simTick=0; var log=document.getElementById('ov-sim-log'); if(log) log.innerHTML=''; });

    /* ---- Global close on outside click ---- */
    document.addEventListener('click', function(e) {
      if (!ovNotif.contains(e.target) && !ovAvatar.contains(e.target)) {
        ovNotif.classList.remove('is-open');
        ovAvatar.classList.remove('is-open');
      }
      if (!ovSearch.contains(e.target)) ovSearch.classList.remove('is-open');
      if (!ovPulse.contains(e.target)) ovPulse.classList.remove('is-open');
    });

    /* ---- ESC key ---- */
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        ovNotif.classList.remove('is-open');
        ovAvatar.classList.remove('is-open');
        ovSearch.classList.remove('is-open');
        ovPulse.classList.remove('is-open');
      }
    });

    /* Fix vh for console dock height */
    function setVH() { document.documentElement.style.setProperty('--vh', window.innerHeight * 0.01 + 'px'); }
    setVH(); window.addEventListener('resize', setVH);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

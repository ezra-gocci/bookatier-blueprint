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
  /* ---- Hamburger (sandwich) menu — narrow mode (<=900px) and below ---- */
  .ov-burger {
    display:none;position:relative;align-items:center;justify-content:center;
    width:38px;height:38px;background:transparent;color:var(--ink-soft);
    border:var(--hairline,1px) solid transparent;border-radius:var(--radius-md,8px);
    cursor:pointer;flex-shrink:0;
  }
  .ov-burger:hover { color:var(--ink);border-color:var(--line); }
  .ov-burger-menu { padding:6px;min-width:210px; }
  .ov-burger-item {
    display:block;padding:10px 14px;font-family:var(--font-sans,sans-serif);
    font-size:14px;color:var(--ink-soft);text-decoration:none;border-radius:var(--radius-md,8px);
  }
  .ov-burger-item:hover { background:var(--surface-sunk);color:var(--ink); }
  .ov-burger-item.is-current { color:var(--accent);font-weight:600; }
  @media (max-width: 900px) {
    .primary-nav { display:none !important; }
    .header-about { display:none !important; }
    .ov-burger { display:inline-flex; }
    /* Nav is removed from the grid flow → keep the action cluster (burger,
       avatar, icons) pinned to the right column instead of drifting to centre. */
    .header-actions { grid-column: 3 !important; justify-self: end !important; }
  }
  /* ---- Matchbox (<=600px): header action items fold into the avatar menu ---- */
  .ov-av-actions { display:none; }
  .ov-av-actions .ov-menu-item {
    width:100%;text-align:left;background:none;border:none;cursor:pointer;font:inherit;
  }
  /* Page tabs → dropdown at matchbox */
  .ov-tab-select {
    display:none;width:100%;font-family:var(--font-sans);font-size:var(--fs-small);
    font-weight:var(--fw-medium);color:var(--ink);background:var(--surface);
    border:var(--hairline,1px) solid var(--line);border-radius:var(--radius-md,8px);
    padding:10px 14px;margin:10px 0;cursor:pointer;
  }
  @media (max-width: 600px) {
    .header-actions .icon-btn { display:none !important; }
    .pulse-sep { display:none !important; }
    .ov-av-actions { display:block; }
    .view-tabs, .ctabs, .csubtabs { display:none !important; }
    .ov-tab-select { display:block; }
  }
  /* ---- Responsive-mode preview (click a mode row) ---- */
  .ov-rprev { position:fixed;inset:0;z-index:2060;display:none;align-items:center;justify-content:center;
    background:rgba(20,15,10,.6);padding:24px; }
  .ov-rprev.is-open { display:flex; }
  .ov-rprev-frame { display:flex;flex-direction:column;background:var(--paper);border-radius:10px;
    overflow:hidden;box-shadow:0 18px 70px rgba(0,0,0,.45);max-width:100%;max-height:100%; }
  .ov-rprev-bar { display:flex;align-items:center;justify-content:space-between;gap:12px;
    padding:8px 14px;background:#1F1B18;color:#ECE3D6;font-family:var(--font-sans);font-size:13px;flex-shrink:0; }
  .ov-rprev-bar b { color:#DB7B5D; }
  .ov-rprev-close { background:none;border:none;color:#ECE3D6;cursor:pointer;font-size:18px;line-height:1;padding:0 4px; }
  .ov-rprev iframe { border:0;display:block;background:var(--paper); }
  .ov-rrow { cursor:pointer; }
  .ov-rrow:hover td { color:var(--ink) !important;background:rgba(210,103,74,.10); }
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
  .ov-notif-item { overflow:hidden; }
  .ov-notif-del {
    position:absolute;top:0;right:0;bottom:0;width:25%;
    display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;
    background:linear-gradient(to right,transparent,color-mix(in srgb,var(--surface-sunk,#ede6df) 92%,transparent));
    border:none;padding:0;cursor:pointer;
    opacity:0;pointer-events:none;transition:opacity 150ms;
  }
  .ov-notif-item:hover .ov-notif-del { opacity:1;pointer-events:auto; }
  .ov-notif-del-icon { font-size:13px;color:var(--ink-soft); }
  .ov-notif-del-label { font-size:9px;color:var(--ink-faint);font-family:var(--font-sans,system-ui);letter-spacing:.04em;text-transform:uppercase; }
  /* Bell greys out when inbox is empty */
  .icon-btn.ov-notif-empty { opacity:0.35; pointer-events:none; }
  .ov-notif-clear {
    font-family:var(--font-sans,system-ui);font-size:12px;
    color:var(--ink-soft);background:none;border:none;cursor:pointer;padding:0;
    transition:color 120ms;
  }
  .ov-notif-clear:hover { color:var(--accent); }
  .ov-notif-icon {
    width:32px;height:32px;border-radius:50%;
    display:flex;align-items:center;justify-content:center;
    font-size:14px;border:1px solid var(--line);flex-shrink:0;
  }
  .ov-notif-icon--reply  { background:color-mix(in srgb,var(--slate,#5A6E7A) 12%,var(--surface)); }
  .ov-notif-icon--vote   { background:color-mix(in srgb,var(--amber,#C78C3A) 12%,var(--surface)); }
  .ov-notif-icon--edition{ background:color-mix(in srgb,var(--accent,#C1654B) 10%,var(--surface)); }
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
  .ov-avatar-menu { min-width:240px; }
  /* Theme switcher row */
  .ov-theme-row {
    display:flex;align-items:center;gap:10px;
    padding:10px 16px;border-bottom:1px solid var(--line);
  }
  .ov-theme-label {
    font-family:var(--font-sans,system-ui);font-size:11px;font-weight:500;
    color:var(--ink-faint);flex:1;letter-spacing:.04em;text-transform:uppercase;
  }
  .ov-theme-swatches { display:flex;gap:7px;align-items:center; }
  .ov-theme-swatch {
    width:22px;height:22px;border-radius:5px;cursor:pointer;
    border:2px solid transparent;padding:0;
    box-shadow:0 1px 3px rgba(0,0,0,.14),inset 0 0 0 1px rgba(0,0,0,.07);
    transition:box-shadow 140ms,border-color 140ms;outline:none;
    position:relative;
  }
  .ov-theme-swatch:hover { box-shadow:0 2px 7px rgba(0,0,0,.22),inset 0 0 0 1px rgba(0,0,0,.09); }
  .ov-theme-swatch.is-active {
    border-color:var(--accent);
    box-shadow:0 0 0 1px var(--accent),0 2px 6px rgba(0,0,0,.14);
  }
  .ov-theme-swatch--sepia { background:#ECE0C8; }
  .ov-theme-swatch--light { background:#F8F9FA; }
  .ov-theme-swatch--night { background:#1A1F28; }
  /* small check dot on active swatch */
  .ov-theme-swatch.is-active::after {
    content:'';position:absolute;bottom:2px;right:2px;
    width:5px;height:5px;border-radius:50%;
    background:var(--accent);
  }
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
  .ov-search-history { margin-top:12px; }
  .ov-search-history-label {
    font-family:var(--font-sans,'system-ui',sans-serif);
    font-size:11px;color:var(--ink-faint);text-transform:uppercase;letter-spacing:.06em;
    margin-bottom:4px;
  }
  .ov-search-history-list { display:flex;flex-direction:column;gap:0; }
  .ov-search-history-item {
    display:flex;align-items:center;gap:8px;
    padding:6px 0;border-bottom:1px solid var(--line,rgba(0,0,0,.07));
    cursor:pointer;
  }
  .ov-search-history-item:last-child { border-bottom:none; }
  .ov-search-history-item:hover .ov-sh-text { color:var(--accent); }
  .ov-sh-icon { flex-shrink:0;color:var(--ink-faint); }
  .ov-sh-text {
    flex:1;font-family:var(--font-sans,'system-ui',sans-serif);
    font-size:13px;color:var(--ink-soft);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
    transition:color .15s;
  }
  .ov-sh-del {
    flex-shrink:0;background:none;border:none;padding:2px 4px;cursor:pointer;
    font-size:14px;color:var(--ink-faint);line-height:1;
  }
  .ov-sh-del:hover { color:var(--accent); }
  .ov-search-history.is-empty { display:none; }

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
    font-size:18px;z-index:2015;box-shadow:0 4px 16px rgba(0,0,0,.24);
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
  .ov-console-tab.is-active { color:#ECE3D6;border-bottom-color:#DB7B5D; }
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
    background:rgba(219,123,93,.18);color:#DB7B5D;border:1px solid rgba(210,103,74,.4);
    border-radius:6px;font-family:var(--font-sans,'system-ui',sans-serif);
    font-size:12px;font-weight:500;cursor:pointer;transition:all 120ms;margin:2px;
  }
  .ov-c-btn:hover { background:rgba(219,123,93,.28);border-color:#DB7B5D; }
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
  .ov-c-input:focus { border-color:#DB7B5D; }
  .ov-c-event {
    display:flex;align-items:flex-start;gap:8px;padding:5px 0;
    border-bottom:1px solid rgba(255,255,255,.04);font-size:11px;
  }
  .ov-c-event:last-child { border-bottom:none; }
  .ov-c-ev-time { color:rgba(236,227,214,.3);white-space:nowrap;flex-shrink:0; }
  .ov-c-ev-type { color:#DB7B5D;flex-shrink:0; }
  .ov-c-ev-body { color:rgba(236,227,214,.65); }
  .ov-c-ev-actor { color:#C78C3A; }
  /* ---- Pulse filter button — round, positioned outside-left of the panel ---- */
  .ov-pulse-filter-btn {
    position:absolute;
    left:-18px;
    top:60px;
    width:36px;
    height:36px;
    border-radius:50%;
    background:var(--surface);
    border:1px solid var(--line);
    color:var(--ink-soft);
    cursor:pointer;
    display:flex;
    align-items:center;
    justify-content:center;
    box-shadow:-2px 2px 10px rgba(30,20,10,.12);
    transition:color 140ms,border-color 140ms,background 140ms,box-shadow 140ms,opacity 180ms;
    z-index:10;
    flex-shrink:0;
    opacity:0;
    pointer-events:none;
  }
  .ov-pulse-panel.is-open .ov-pulse-filter-btn {
    opacity:1;
    pointer-events:auto;
  }
  .ov-pulse-filter-btn:hover {
    color:var(--accent);
    border-color:var(--accent);
    background:color-mix(in srgb,var(--accent) 6%,var(--surface));
    box-shadow:-3px 3px 14px rgba(30,20,10,.18);
  }
  .ov-pulse-filter-btn.is-active {
    color:var(--accent);
    border-color:var(--accent);
    background:color-mix(in srgb,var(--accent) 10%,var(--surface));
  }
  /* ---- Sidebar push layout ---- */
  body.ov-pulse-open {
    padding-right:340px;
    transition:padding-right 240ms var(--ease-out-quart,ease);
  }
  body.bcd-pulse-hidden { padding-right:0 !important; }
  .ov-pulse-panel.bcd-hidden { transform:translateX(100%) !important; pointer-events:none; }
  /* ---- Pulse filter panel ---- */
  .ov-pulse-filter-panel {
    position:fixed;top:var(--header-height,60px);right:340px;bottom:0;width:300px;
    z-index:2008;background:var(--surface);
    border-left:1px solid var(--line);border-right:1px solid var(--line);
    box-shadow:-4px 0 24px rgba(30,20,10,.10);
    display:flex;flex-direction:column;
    transform:translateX(calc(100% + 340px));
    transition:transform 240ms var(--ease-out-quart,ease);
    pointer-events:none;
  }
  .ov-pulse-filter-panel.is-open { transform:translateX(0);pointer-events:auto; }
  .ov-pf-head {
    padding:16px;border-bottom:1px solid var(--line);
    display:flex;align-items:center;justify-content:space-between;flex-shrink:0;
  }
  .ov-pf-title {
    font-family:var(--font-serif,'Georgia',serif);font-size:16px;font-weight:600;color:var(--ink);
  }
  .ov-pf-close {
    background:none;border:none;color:var(--ink-faint);cursor:pointer;
    font-size:20px;line-height:1;padding:0;transition:color 120ms;
  }
  .ov-pf-close:hover { color:var(--accent); }
  .ov-pf-body { flex:1;overflow-y:auto;padding:0; }
  .ov-pf-row {
    display:flex;align-items:center;padding:11px 20px 11px 14px;
    border-bottom:1px solid var(--line);
    transition:background 120ms;cursor:pointer;user-select:none;
  }
  .ov-pf-row:last-child { border-bottom:none; }
  .ov-pf-row:hover { background:var(--surface-sunk); }
  .ov-pf-row.is-active {
    background:color-mix(in srgb,var(--accent) 8%,var(--surface));
  }
  .ov-pf-check {
    width:16px;flex-shrink:0;margin-right:6px;
    color:var(--accent);opacity:0;transition:opacity 120ms;
    display:flex;align-items:center;
  }
  .ov-pf-row.is-active .ov-pf-check { opacity:1; }
  .ov-pf-row-label {
    flex:1;display:flex;align-items:center;gap:8px;
    font-family:var(--font-sans,system-ui);font-size:13px;color:var(--ink);min-width:0;
  }
  .ov-pf-row.is-active .ov-pf-row-label { color:var(--accent); }
  .ov-pf-row-icon { font-size:15px;flex-shrink:0;line-height:1; }
  .ov-pf-row-name { overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
  .ov-pf-notif {
    flex-shrink:0;padding-left:16px;
    display:flex;flex-direction:column;align-items:center;gap:3px;
  }
  .ov-pf-notif-bell {
    color:var(--ink-faint);display:flex;align-items:center;line-height:1;
  }
  /* Toggle switch */
  .ov-toggle { position:relative;width:30px;height:17px;flex-shrink:0;display:inline-block; }
  .ov-toggle input { opacity:0;width:0;height:0;position:absolute; }
  .ov-toggle-track {
    position:absolute;inset:0;background:var(--line);border-radius:99px;cursor:pointer;
    transition:background 160ms;
  }
  .ov-toggle-track::before {
    content:'';position:absolute;left:3px;top:2.5px;width:12px;height:12px;
    border-radius:50%;background:#fff;
    box-shadow:0 1px 3px rgba(0,0,0,.18);
    transition:left 160ms;
  }
  .ov-toggle input:checked + .ov-toggle-track { background:var(--accent); }
  .ov-toggle input:checked + .ov-toggle-track::before { left:15px; }
  .ov-pf-foot { padding:12px 16px;border-top:1px solid var(--line); }
  .ov-pf-reset {
    width:100%;padding:7px 12px;
    font-family:var(--font-sans,system-ui);font-size:12px;color:var(--ink-soft);
    background:transparent;border:1px solid var(--line);border-radius:var(--radius-md,8px);
    cursor:pointer;transition:border-color 120ms,color 120ms;
  }
  .ov-pf-reset:hover { border-color:var(--ink-soft);color:var(--ink); }
  @media (max-width:640px) {
    .ov-pulse-panel { width:100%; }
    .ov-pulse-filter-btn { left:auto;right:-18px;top:60px; }
    .ov-pulse-filter-panel { display:none; }
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
    /* Only closes dropdowns — pulse sidebar and its filter are never affected by closeAll */
    var panels = document.querySelectorAll('.ov-dropdown.is-open');
    for (var i = 0; i < panels.length; i++) {
      if (panels[i] !== except) panels[i].classList.remove('is-open');
    }
    if (except !== ovSearch) ovSearch.classList.remove('is-open');
  }

  /* ================================================================
     NOTIFICATIONS DROPDOWN
     ================================================================ */
  var NOTIF_DATA = [
    { type:'reply',  group:'comment', icon:'💬', cls:'reply',
      text:'<strong>Мария Соколова</strong> ответила на ваш комментарий в <a href="book.html">«Научение на опыте»</a>',
      excerpt:'«Согласна с этим. Именно неопределённость понятия даёт ему клиническую жизнь…»', time:'15 мин.' },
    { type:'vote',   group:'rating',  icon:'⭐', cls:'vote',
      text:'<strong>Дмитрий Орлов</strong> и ещё 4 поддержали ваш комментарий',
      excerpt:'«Четвёртый семинар — самый живой. Бион отвечает…»', time:'2 ч.' },
    { type:'edition',group:'update',  icon:'📚', cls:'edition',
      text:'Новая версия <a href="book.html">«Гореть вместе»</a> — v1.1',
      excerpt:'Исправлены опечатки в главах 3 и 7.', time:'4 ч.' },
    { type:'vote',   group:'rating',  icon:'⭐', cls:'vote',
      text:'<strong>Наталья Кузнецова</strong> поддержала ваш комментарий',
      excerpt:'', time:'вчера' },
  ];

  function buildNotifDropdown() {
    var d = document.createElement('div');
    d.className = 'ov-dropdown';
    d.style.width = '340px';
    d.setAttribute('role','dialog');
    d.setAttribute('aria-label','Уведомления');

    d.innerHTML =
      '<div class="ov-dropdown-head">' +
        '<span class="ov-dropdown-title" id="ov-notif-title">Уведомления</span>' +
      '</div>' +
      '<div class="ov-dropdown-body" id="ov-notif-body"></div>' +
      '<div class="ov-dropdown-foot">' +
        '<button class="ov-notif-clear" id="ov-notif-clear" type="button">Очистить все</button>' +
      '</div>';

    var body = d.querySelector('#ov-notif-body');
    NOTIF_DATA.forEach(function(n) {
      var item = document.createElement('div');
      item.className = 'ov-notif-item';
      item.setAttribute('data-group', n.group);
      item.innerHTML =
        '<span class="ov-notif-icon ov-notif-icon--' + n.cls + '" aria-hidden="true">' + n.icon + '</span>' +
        '<div style="flex:1;min-width:0;">' +
          '<p class="ov-notif-text">' + n.text + '</p>' +
          (n.excerpt ? '<p class="ov-notif-excerpt">' + n.excerpt + '</p>' : '') +
          '<p class="ov-notif-time">' + n.time + '</p>' +
        '</div>' +
        '<button class="ov-notif-del" aria-label="Удалить уведомление" type="button">' +
        '<span class="ov-notif-del-icon">✕</span>' +
        '<span class="ov-notif-del-label">Удалить</span>' +
        '</button>';
      item.addEventListener('click', function(e) {
        if (e.target.tagName === 'A') return;
        window.location.href = 'notifications.html';
      });
      body.appendChild(item);
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
      /* Theme switcher */
      '<div class="ov-theme-row">' +
        '<span class="ov-theme-label">Тема</span>' +
        '<div class="ov-theme-swatches">' +
          '<button class="ov-theme-swatch ov-theme-swatch--light" id="ov-theme-light" type="button" title="Светлая" aria-label="Тема: светлая"></button>' +
          '<button class="ov-theme-swatch ov-theme-swatch--sepia" id="ov-theme-sepia" type="button" title="Сепия" aria-label="Тема: сепия"></button>' +
          '<button class="ov-theme-swatch ov-theme-swatch--night" id="ov-theme-night" type="button" title="Ночная" aria-label="Тема: ночная"></button>' +
        '</div>' +
      '</div>' +
      /* Header action items folded in at matchbox (<=600px) */
      '<div class="ov-av-actions">' +
        '<button class="ov-menu-item" type="button" data-av-action="search" role="menuitem"><span class="ov-menu-icon">🔍</span>Поиск</button>' +
        '<button class="ov-menu-item" type="button" data-av-action="notif" role="menuitem"><span class="ov-menu-icon">🔔</span>Уведомления</button>' +
        '<button class="ov-menu-item" type="button" data-av-action="pulse" role="menuitem"><span class="ov-menu-icon">📈</span>Пульс</button>' +
        '<div class="ov-menu-sep"></div>' +
      '</div>' +
      '<a class="ov-menu-item" href="profile.html" role="menuitem"><span class="ov-menu-icon">👤</span>Профиль</a>' +
      '<div class="ov-menu-sep"></div>' +
      '<a id="ov-logout" class="ov-menu-item ov-menu-item--danger" href="pub-landing.html" role="menuitem"><span class="ov-menu-icon">↩</span>Выйти</a>';
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
        '<div class="ov-search-history is-empty" id="ov-search-history">' +
          '<p class="ov-search-history-label">Недавние запросы</p>' +
          '<div class="ov-search-history-list" id="ov-search-history-list"></div>' +
        '</div>' +
      '</div>';
    return d;
  }

  /* ================================================================
     PULSE PANEL
     ================================================================ */
  var PULSE_GROUPS = [
    { id:'comment', icon:'💬', label:'Комментарии',    showPulse:true, notif:true  },
    { id:'reading', icon:'📖', label:'Чтение',          showPulse:true, notif:false },
    { id:'review',  icon:'✍️', label:'Рецензии',        showPulse:true, notif:true  },
    { id:'rating',  icon:'⭐', label:'Оценки',          showPulse:true, notif:false },
    { id:'mention', icon:'💌', label:'Упоминания',      showPulse:true, notif:true  },
    { id:'update',  icon:'📚', label:'Обновления книг', showPulse:true, notif:true  },
    { id:'mine',    icon:'👤', label:'Моя активность',  showPulse:true, notif:false },
  ];

  function savePulseState() {
    try {
      var s = {};
      PULSE_GROUPS.forEach(function(g) { s[g.id] = { p: g.showPulse, n: g.notif }; });
      sessionStorage.setItem('ba-pulse-groups', JSON.stringify(s));
    } catch(e) {}
  }

  function restorePulseState() {
    try {
      var raw = sessionStorage.getItem('ba-pulse-groups');
      if (!raw) return;
      var s = JSON.parse(raw);
      PULSE_GROUPS.forEach(function(g) {
        if (s[g.id] !== undefined) {
          g.showPulse = !!s[g.id].p;
          g.notif    = !!s[g.id].n;
        }
      });
    } catch(e) {}
  }

  var PULSE_EVENTS = [
    { av:'МС', bg:'var(--slate,#5A6E7A)',  group:'comment', text:'<strong>Мария Соколова</strong> прокомментировала <a href="book.html">«Научение на опыте»</a>', time:'2 мин.' },
    { av:'ДО', bg:'#7A4A3A',               group:'reading', text:'<strong>Дмитрий Орлов</strong> завершил чтение <a href="book.html">«Гореть вместе»</a>', time:'7 мин.' },
    { av:'АП', bg:'var(--slate,#5A6E7A)',  group:'rating',  text:'<strong>Алексей Петров</strong> поставил ★★★★★ <a href="book.html">«Научение на опыте»</a>', time:'18 мин.' },
    { av:'НК', bg:'var(--sage,#4D7A66)',   group:'reading', text:'<strong>Наталья Кузнецова</strong> начала читать <a href="book.html">«Избегание эмоций»</a>', time:'34 мин.' },
    { av:'АИ', bg:'var(--accent,#C1654B)', group:'mine',    text:'Вы прочитали 5 страниц <a href="book.html">«Научение на опыте»</a>', time:'1 ч.' },
    { av:'МС', bg:'var(--slate,#5A6E7A)',  group:'review',  text:'<strong>Мария Соколова</strong> написала рецензию на <a href="book.html">«Гореть вместе»</a>', time:'2 ч.' },
    { av:'ДО', bg:'#7A4A3A',               group:'mention', text:'<strong>Дмитрий Орлов</strong> упомянул <a href="profile.html">вас</a> в обсуждении', time:'3 ч.' },
    { av:'📚', bg:'var(--surface-sunk)',   group:'update',  text:'Новая версия <a href="book.html">«Гореть вместе»</a> — v1.1 доступна', time:'4 ч.' },
  ];

  function buildPulsePanel() {
    var d = document.createElement('div');
    d.className = 'ov-pulse-panel';
    d.setAttribute('aria-label','Пульс платформы');

    var filterBtn = '<button class="ov-pulse-filter-btn" id="ov-pulse-filter" type="button" title="Фильтр" aria-label="Фильтр пульса">' +
      '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>' +
    '</button>';

    var head = '<div class="ov-pulse-head">' +
      '<div><p class="ov-pulse-title">Пульс</p><p class="ov-pulse-sub">Активность прямо сейчас</p></div>' +
      '<button class="ov-pulse-close" id="ov-pulse-close" aria-label="Закрыть" type="button">×</button>' +
    '</div>';

    var feed = '<div class="ov-pulse-feed">';
    PULSE_EVENTS.forEach(function(ev) {
      feed +=
        '<div class="ov-pulse-item" data-group="' + ev.group + '">' +
          '<span class="ov-pulse-av" style="background:' + ev.bg + '" aria-hidden="true">' + ev.av + '</span>' +
          '<div style="flex:1;min-width:0;">' +
            '<p class="ov-pulse-ev-text">' + ev.text + '</p>' +
            '<p class="ov-pulse-ev-time">' + ev.time + ' назад</p>' +
          '</div>' +
        '</div>';
    });
    feed += '</div>';

    d.innerHTML = filterBtn + head + feed;
    return d;
  }

  /* ================================================================
     PULSE FILTER PANEL
     ================================================================ */
  function buildPulseFilterPanel() {
    var d = document.createElement('div');
    d.className = 'ov-pulse-filter-panel';
    d.setAttribute('aria-label','Фильтр пульса');

    var checkSvg = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    var bellSvg = '<svg width="13" height="14" viewBox="0 0 14 16" fill="none" aria-hidden="true"><path d="M7 1.5a1 1 0 0 1 1 1V3a5 5 0 0 1 4 4.9V11l1.5 1.5H.5L2 11V7.9A5 5 0 0 1 6 3V2.5a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.5 13a1.5 1.5 0 0 0 3 0" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"/></svg>';

    var head =
      '<div class="ov-pf-head">' +
        '<p class="ov-pf-title">Фильтр</p>' +
        '<button class="ov-pf-close" id="ov-pf-close" type="button" aria-label="Закрыть фильтр">×</button>' +
      '</div>';

    var rows = '';
    PULSE_GROUPS.forEach(function(g) {
      rows +=
        '<div class="ov-pf-row' + (g.showPulse ? ' is-active' : '') + '" data-group="' + g.id + '">' +
          '<span class="ov-pf-check">' + checkSvg + '</span>' +
          '<span class="ov-pf-row-label">' +
            '<span class="ov-pf-row-icon">' + g.icon + '</span>' +
            '<span class="ov-pf-row-name">' + g.label + '</span>' +
          '</span>' +
          '<span class="ov-pf-notif">' +
            '<span class="ov-pf-notif-bell" title="Управляет появлением этих событий в уведомлениях">' + bellSvg + '</span>' +
            '<label class="ov-toggle" title="Управляет появлением этих событий в уведомлениях" onclick="event.stopPropagation()">' +
              '<input type="checkbox" data-group="' + g.id + '" data-type="notif"' + (g.notif ? ' checked' : '') + '>' +
              '<span class="ov-toggle-track"></span>' +
            '</label>' +
          '</span>' +
        '</div>';
    });

    d.innerHTML =
      head +
      '<div class="ov-pf-body">' +
        rows +
        '<div class="ov-pf-foot">' +
          '<button class="ov-pf-reset" id="ov-pf-reset" type="button">Сбросить все фильтры</button>' +
        '</div>' +
      '</div>';
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
    var tabs = ['users','cohorts','simulation','data','events','responsivity'];
    var tabLabels = ['👤 Пользователи','👥 Когорты','⚡ Симуляция','📋 Данные','📡 События','📐 Адаптив'];
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
        '<div class="ov-console-panel" id="ov-cpanel-responsivity"><div id="ov-resp"></div></div>' +
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
     HAMBURGER (SANDWICH) MENU — collects all top-nav items at <=900px
     ================================================================ */
  function buildBurger() {
    var nav = document.querySelector('.primary-nav');
    var actions = document.querySelector('.header-actions');
    if (!nav || !actions) return;

    var aboutLink = document.querySelector('.header-about');
    var navLinks = Array.prototype.slice.call(nav.querySelectorAll('.nav-link'));
    var links = aboutLink ? [aboutLink].concat(navLinks) : navLinks;
    if (!links.length) return;

    var btn = document.createElement('button');
    btn.className = 'ov-burger';
    btn.id = 'ov-burger-btn';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Меню');
    btn.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>';

    var menu = document.createElement('div');
    menu.className = 'ov-dropdown ov-burger-menu';
    menu.style.minWidth = '210px';
    links.forEach(function (l) {
      var a = document.createElement('a');
      a.className = 'ov-burger-item';
      a.href = l.getAttribute('href') || '#';
      a.textContent = l.classList.contains('nav-link-home')
        ? (l.getAttribute('aria-label') || 'Главная')
        : l.textContent.trim();
      if (l.getAttribute('aria-current') === 'page') a.classList.add('is-current');
      if (l.hasAttribute('data-stub')) {
        a.addEventListener('click', function (e) { e.preventDefault(); });
      }
      menu.appendChild(a);
    });

    actions.insertBefore(btn, actions.firstChild);
    document.body.appendChild(menu);

    btn.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      var open = !menu.classList.contains('is-open');
      closeAll();
      if (open) { menu.classList.add('is-open'); positionNear(btn, menu); }
    });
    return menu;
  }

  /* ================================================================
     PAGE TABS → DROPDOWN (matchbox <=600px)
     Mirrors each tab bar (home view-tabs, community tabs + sub-tabs) into a
     native <select>; the CSS hides the bar and shows the select at <=600px.
     ================================================================ */
  function buildTabSelects() {
    var bars = document.querySelectorAll('.view-tabs, .ctabs, .csubtabs');
    Array.prototype.forEach.call(bars, function (bar) {
      var tabs = Array.prototype.slice.call(bar.querySelectorAll('button'));
      if (!tabs.length) return;

      var sel = document.createElement('select');
      sel.className = 'ov-tab-select';
      sel.setAttribute('aria-label', bar.getAttribute('aria-label') || 'Разделы');
      tabs.forEach(function (t, i) {
        var opt = document.createElement('option');
        opt.value = i;
        opt.textContent = t.textContent.trim();
        if (t.classList.contains('is-active')) opt.selected = true;
        sel.appendChild(opt);
      });

      sel.addEventListener('change', function () { tabs[+sel.value].click(); });
      /* Keep the select in sync if a tab is activated elsewhere. */
      tabs.forEach(function (t, i) {
        t.addEventListener('click', function () { sel.value = i; });
      });
      function sync() { tabs.forEach(function (t, i) { if (t.classList.contains('is-active')) sel.value = i; }); }
      sync(); setTimeout(sync, 60);

      bar.parentNode.insertBefore(sel, bar.nextSibling);
    });
  }

  /* ================================================================
     INIT
     ================================================================ */
  function init() {
    restorePulseState();
    injectCSS();

    /* Build elements */
    var ovNotif  = buildNotifDropdown();
    var ovAvatar = buildAvatarMenu();
    ovSearch     = buildSearchPanel();
    var ovPulse  = buildPulsePanel();
    var ovPulseFilter = buildPulseFilterPanel();
    var ovConsole = buildConsoleDock();
    var ovConsoleFab = buildConsoleBtn();

    document.body.appendChild(ovNotif);
    document.body.appendChild(ovAvatar);
    document.body.appendChild(ovSearch);
    document.body.appendChild(ovPulse);
    /* Suppress transition on filter panel for the first two frames so the
       browser never fires the "from translateX(0)" animation on page load */
    ovPulseFilter.style.transition = 'none';
    document.body.appendChild(ovPulseFilter);
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        ovPulseFilter.style.transition = '';
      });
    });
    document.body.appendChild(ovConsole);
    document.body.appendChild(ovConsoleFab);

    /* ---- Hamburger menu (narrow mode and below) ---- */
    var ovBurger = buildBurger();

    /* ---- Page tabs → dropdown (matchbox) ---- */
    buildTabSelects();

    /* ---- Notification filter — reflects pulse filter notif settings ---- */
    function updateNotifCount() {
      var count = 0;
      ovNotif.querySelectorAll('.ov-notif-item').forEach(function(el) {
        if (el.style.display !== 'none') count++;
      });
      /* injected badge (pages without a hardcoded one) */
      var badge = document.getElementById('ov-notif-badge');
      if (badge) {
        badge.textContent = count > 0 ? count : '';
        badge.style.display = count > 0 ? '' : 'none';
      }
      /* page-native badge (hardcoded .notif-count span) */
      var nBtn = findByLabel(['уведомлени']);
      if (nBtn) {
        var nBadge = nBtn.querySelector('.notif-count');
        if (nBadge) {
          nBadge.textContent = count;
          nBadge.style.display = count > 0 ? '' : 'none';
        }
      }
      /* dropdown title counter */
      var titleEl = document.getElementById('ov-notif-title');
      if (titleEl) {
        titleEl.innerHTML = 'Уведомления' + (count > 0
          ? ' <span style="display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;padding:0 4px;border-radius:99px;background:var(--accent);color:var(--on-accent,#fff);font-size:10px;font-weight:700;vertical-align:middle;margin-left:4px;">' + count + '</span>'
          : '');
      }
      /* auto-close when empty; grey out the bell */
      if (count === 0) ovNotif.classList.remove('is-open');
      var bellBtn = findByLabel(['уведомлени']);
      if (bellBtn) bellBtn.classList.toggle('ov-notif-empty', count === 0);
    }

    function applyNotifFilter() {
      ovNotif.querySelectorAll('.ov-notif-item[data-group]').forEach(function(item) {
        var gId = item.getAttribute('data-group');
        var visible = true;
        for (var i = 0; i < PULSE_GROUPS.length; i++) {
          if (PULSE_GROUPS[i].id === gId) { visible = PULSE_GROUPS[i].notif; break; }
        }
        item.style.display = visible ? '' : 'none';
      });
      updateNotifCount();
    }

    /* ---- Wire: notifications ---- */
    var btnNotif = findByLabel(['уведомлени']);
    if (btnNotif) {
      btnNotif.addEventListener('click', function(e) {
        e.preventDefault(); e.stopPropagation();
        var open = !ovNotif.classList.contains('is-open');
        closeAll();
        if (open) {
          applyNotifFilter();
          var vc = 0;
          ovNotif.querySelectorAll('.ov-notif-item').forEach(function(el){ if (el.style.display !== 'none') vc++; });
          if (vc > 0) { ovNotif.classList.add('is-open'); positionNear(btnNotif, ovNotif); }
        }
      });
      /* badge */
      var badge = document.createElement('span');
      badge.id = 'ov-notif-badge';
      badge.style.cssText = 'position:absolute;top:4px;right:4px;min-width:16px;height:16px;padding:0 4px;display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;background:var(--accent);border-radius:99px;pointer-events:none;';
      if (!btnNotif.querySelector('[class*="notif-count"]')) {
        btnNotif.style.position = 'relative';
        btnNotif.appendChild(badge);
      }
      /* apply default filter + set correct initial count */
      applyNotifFilter();

      /* delete individual notifications */
      ovNotif.querySelectorAll('.ov-notif-del').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
          e.stopPropagation();
          var item = btn.closest ? btn.closest('.ov-notif-item') : btn.parentNode;
          if (item) item.remove();
          updateNotifCount();
        });
      });

      /* clear all visible notifications */
      var ovNotifClear = document.getElementById('ov-notif-clear');
      if (ovNotifClear) {
        ovNotifClear.addEventListener('click', function(e) {
          e.stopPropagation();
          ovNotif.querySelectorAll('.ov-notif-item').forEach(function(item) {
            if (item.style.display !== 'none') item.remove();
          });
          updateNotifCount();
        });
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

    /* ---- Wire: avatar-menu action items (matchbox <=600px) ----
       Open the Search / Notifications / Pulse overlays from the avatar menu,
       anchored to the avatar (the header icons are hidden at this width). */
    ovAvatar.querySelectorAll('[data-av-action]').forEach(function (item) {
      item.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        var act = item.getAttribute('data-av-action');
        closeAll();
        ovAvatar.classList.remove('is-open');
        if (act === 'search') {
          ovSearch.classList.add('is-open');
          setTimeout(function(){ var i = document.getElementById('ov-search-input'); if (i) i.focus(); }, 60);
        } else if (act === 'notif') {
          ovNotif.classList.add('is-open');
          if (btnAvatar) positionNear(btnAvatar, ovNotif);
        } else if (act === 'pulse') {
          ovPulse.classList.add('is-open');
          document.body.classList.add('ov-pulse-open');
          try { sessionStorage.setItem('ba-pulse-open','1'); } catch(e2) {}
        }
      });
    });

    /* ---- Wire: theme switcher ---- */
    var THEMES = { light: 'light-clear', sepia: 'sepia-contrast', night: 'night' };
    var swatchLight = document.getElementById('ov-theme-light');
    var swatchSepia = document.getElementById('ov-theme-sepia');
    var swatchNight = document.getElementById('ov-theme-night');

    function applyTheme(key) {
      var val = THEMES[key];
      document.documentElement.setAttribute('data-theme', val);
      try { localStorage.setItem('ba-theme', val); } catch(e) {}
      if (swatchLight)  swatchLight.classList.toggle('is-active',  key === 'light');
      if (swatchSepia)  swatchSepia.classList.toggle('is-active',  key === 'sepia');
      if (swatchNight)  swatchNight.classList.toggle('is-active',  key === 'night');
    }

    function syncSwatches() {
      var cur = document.documentElement.getAttribute('data-theme');
      if (swatchLight)  swatchLight.classList.toggle('is-active',  cur === 'light-clear');
      if (swatchSepia)  swatchSepia.classList.toggle('is-active',  cur === 'sepia-contrast');
      if (swatchNight)  swatchNight.classList.toggle('is-active',  cur === 'night');
    }

    if (swatchLight) swatchLight.addEventListener('click', function(e) { e.stopPropagation(); applyTheme('light'); });
    if (swatchSepia) swatchSepia.addEventListener('click', function(e) { e.stopPropagation(); applyTheme('sepia'); });
    if (swatchNight) swatchNight.addEventListener('click', function(e) { e.stopPropagation(); applyTheme('night'); });

    /* Reflect whatever theme was set before overlays loaded (via theme-init.js) */
    syncSwatches();

    /* ---- Wire: logout ---- */
    var btnLogout = document.getElementById('ov-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', function (e) {
        e.preventDefault();
        try {
          localStorage.removeItem('ba-auth-token');
          sessionStorage.removeItem('ba-pulse-open');
          document.body.classList.remove('ov-pulse-open');
        } catch (err) {}
        window.location.href = 'pub-landing.html';
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

    /* ---- Search history helpers ---- */
    var HISTORY_KEY = 'ba-search-history';
    var HISTORY_MAX = 6;

    function getHistory() {
      try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch(e) { return []; }
    }
    function saveHistory(list) {
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(list)); } catch(e) {}
    }
    function addToHistory(q) {
      var list = getHistory().filter(function(x){ return x !== q; });
      list.unshift(q);
      if (list.length > HISTORY_MAX) list = list.slice(0, HISTORY_MAX);
      saveHistory(list);
    }
    function removeFromHistory(q) {
      saveHistory(getHistory().filter(function(x){ return x !== q; }));
    }
    function renderHistory() {
      var histBlock = document.getElementById('ov-search-history');
      var histList  = document.getElementById('ov-search-history-list');
      if (!histBlock || !histList) return;
      var list = getHistory();
      if (!list.length) { histBlock.classList.add('is-empty'); return; }
      histBlock.classList.remove('is-empty');
      histList.innerHTML = list.map(function(q) {
        var enc = q.replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
        return '<div class="ov-search-history-item" data-q="' + enc + '">' +
          '<svg class="ov-sh-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/></svg>' +
          '<span class="ov-sh-text">' + enc + '</span>' +
          '<button class="ov-sh-del" data-del="' + enc + '" type="button" aria-label="Удалить запрос">×</button>' +
        '</div>';
      }).join('');
      /* click on row → fill input */
      histList.querySelectorAll('.ov-search-history-item').forEach(function(row) {
        row.addEventListener('click', function(e) {
          if (e.target.classList.contains('ov-sh-del')) return;
          var q = row.getAttribute('data-q');
          var inp = document.getElementById('ov-search-input');
          if (inp) { inp.value = q; inp.focus(); }
        });
      });
      /* click × → remove */
      histList.querySelectorAll('.ov-sh-del').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
          e.stopPropagation();
          removeFromHistory(btn.getAttribute('data-del'));
          renderHistory();
        });
      });
    }

    var searchInput = document.getElementById('ov-search-input');
    if (searchInput) {
      searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && searchInput.value.trim()) {
          var q = searchInput.value.trim();
          addToHistory(q);
          ovSearch.classList.remove('is-open');
          window.location.href = 'search.html?q=' + encodeURIComponent(q);
        }
        if (e.key === 'Escape') ovSearch.classList.remove('is-open');
      });
    }

    /* Render history when panel opens */
    var _origSearchBtn = findByLabel(['поиск']);
    if (_origSearchBtn) {
      _origSearchBtn.addEventListener('click', function() {
        setTimeout(renderHistory, 80);
      });
    }
    /* Also render on panel open triggered from avatar menu */
    document.addEventListener('click', function(e) {
      var btn = e.target.closest('[data-av-action="search"]');
      if (btn) setTimeout(renderHistory, 80);
    });

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
        if (open) {
          ovPulse.classList.add('is-open');
          document.body.classList.add('ov-pulse-open');
          try { sessionStorage.setItem('ba-pulse-open','1'); } catch(e2) {}
        } else {
          ovPulse.classList.remove('is-open');
          ovPulseFilter.classList.remove('is-open');
          var _pfBtn = document.getElementById('ov-pulse-filter');
          if (_pfBtn) _pfBtn.classList.remove('is-active');
          document.body.classList.remove('ov-pulse-open');
          try { sessionStorage.removeItem('ba-pulse-open'); } catch(e2) {}
        }
      });
    }
    var pulseClose = document.getElementById('ov-pulse-close');
    if (pulseClose) pulseClose.addEventListener('click', function(){
      ovPulse.classList.remove('is-open');
      ovPulseFilter.classList.remove('is-open');
      var pfBtn = document.getElementById('ov-pulse-filter');
      if (pfBtn) pfBtn.classList.remove('is-active');
      document.body.classList.remove('ov-pulse-open');
      try { sessionStorage.removeItem('ba-pulse-open'); } catch(e) {}
    });

    /* ---- Wire: pulse filter button → opens/closes filter panel ---- */
    var pulseFilterBtn = document.getElementById('ov-pulse-filter');
    if (pulseFilterBtn) {
      pulseFilterBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        var open = !ovPulseFilter.classList.contains('is-open');
        ovPulseFilter.classList.toggle('is-open', open);
        pulseFilterBtn.classList.toggle('is-active', open);
        
      });
    }

    /* ---- Wire: filter panel close button ---- */
    var pfClose = document.getElementById('ov-pf-close');
    if (pfClose) pfClose.addEventListener('click', function(e) {
      e.stopPropagation();
      ovPulseFilter.classList.remove('is-open');
      if (pulseFilterBtn) pulseFilterBtn.classList.remove('is-active');
      
    });

    /* ---- Wire: filter rows — click row to toggle visibility in pulse ---- */
    function applyPulseFilters() {
      var items = document.querySelectorAll('.ov-pulse-item[data-group]');
      PULSE_GROUPS.forEach(function(g) {
        items.forEach(function(item) {
          if (item.getAttribute('data-group') === g.id) {
            item.style.display = g.showPulse ? '' : 'none';
          }
        });
      });
    }

    ovPulseFilter.querySelectorAll('.ov-pf-row[data-group]').forEach(function(row) {
      row.addEventListener('click', function(e) {
        var gId = row.getAttribute('data-group');
        var activeCount = PULSE_GROUPS.filter(function(g) { return g.showPulse; }).length;
        for (var i = 0; i < PULSE_GROUPS.length; i++) {
          if (PULSE_GROUPS[i].id === gId) {
            if (PULSE_GROUPS[i].showPulse && activeCount <= 1) break; /* keep at least one */
            PULSE_GROUPS[i].showPulse = !PULSE_GROUPS[i].showPulse;
            row.classList.toggle('is-active', PULSE_GROUPS[i].showPulse);
            break;
          }
        }
        applyPulseFilters();
        savePulseState();
      });
    });

    ovPulseFilter.querySelectorAll('input[data-type="notif"]').forEach(function(inp) {
      inp.addEventListener('change', function() {
        var gId = inp.getAttribute('data-group');
        for (var i = 0; i < PULSE_GROUPS.length; i++) {
          if (PULSE_GROUPS[i].id === gId) { PULSE_GROUPS[i].notif = inp.checked; break; }
        }
        applyNotifFilter();
        savePulseState();
      });
    });

    /* ---- Wire: reset all filters ---- */
    var NOTIF_DEFAULTS = { comment:true, reading:false, review:true, rating:false, mention:true, update:true, mine:false };
    var pfReset = document.getElementById('ov-pf-reset');
    if (pfReset) pfReset.addEventListener('click', function() {
      PULSE_GROUPS.forEach(function(g) { g.showPulse = true; });
      ovPulseFilter.querySelectorAll('.ov-pf-row[data-group]').forEach(function(row) {
        row.classList.add('is-active');
      });
      applyPulseFilters();
      savePulseState();
    });

    /* Restore pulse open state across page navigations (skip when embedded in an iframe) */
    try {
      if (window === window.top && sessionStorage.getItem('ba-pulse-open')) {
        ovPulse.classList.add('is-open');
        document.body.classList.add('ov-pulse-open');
      }
    } catch(e) {}

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
        if (tab.dataset.ctab === 'responsivity') updateResp();
      });
    });

    /* Console: Responsivity tab — live viewport width/height, mode, thresholds.
       Bands and thresholds mirror the breakpoints used across the blueprint
       (container max-width is 1200px; the nav collapses below 760px). */
    var RESP_BANDS = [
      { max: 600,      name: 'matchbox' },
      { max: 900,      name: 'narrow' },
      { max: 1200,     name: 'modest' },
      { max: Infinity, name: 'wide' }
    ];
    function respBandIndex(w) {
      for (var i = 0; i < RESP_BANDS.length; i++) { if (w <= RESP_BANDS[i].max) return i; }
      return RESP_BANDS.length - 1;
    }
    function respRange(i) {
      var lo = i === 0 ? 0 : RESP_BANDS[i - 1].max + 1;
      return RESP_BANDS[i].max === Infinity ? ('> ' + RESP_BANDS[i - 1].max) : (lo + '–' + RESP_BANDS[i].max);
    }
    function updateResp() {
      var host = document.getElementById('ov-resp');
      if (!host) return;
      var w = window.innerWidth, h = window.innerHeight;
      var cur = respBandIndex(w);
      var rows = RESP_BANDS.map(function(b, i) {
        var on = i === cur;
        var pw = b.max === Infinity ? 1440 : b.max;
        return '<tr class="ov-rrow" data-w="' + pw + '" data-name="' + b.name + '" title="Превью при ' + pw + 'px" style="' + (on ? 'background:rgba(210,103,74,.16);' : '') + '">' +
          '<td style="' + (on ? 'color:#ECE3D6;font-weight:600;' : '') + '">' + (on ? '▸ ' : '') + b.name + '</td>' +
          '<td>' + respRange(i) + ' px</td>' +
          '<td>' + (on ? '<span style="color:#6DAE8C">● активен</span>' : '<span style="color:rgba(236,227,214,.4)">превью →</span>') + '</td></tr>';
      }).join('');
      host.innerHTML =
        '<div style="display:flex;gap:18px;align-items:flex-start;flex-wrap:wrap;">' +
          /* LEFT — size + current mode */
          '<div style="flex:0 0 auto;min-width:140px;">' +
            '<p class="ov-c-label">Вьюпорт</p>' +
            '<div style="font-size:22px;font-weight:700;color:#ECE3D6;line-height:1.05;">' + w +
              '<span style="color:rgba(236,227,214,.35);"> × </span>' + h +
              '<span style="font-size:11px;font-weight:400;color:rgba(236,227,214,.5);"> px</span></div>' +
            '<p class="ov-c-label" style="margin-top:14px;">Режим</p>' +
            '<div style="font-size:14px;font-weight:600;color:#DB7B5D;">' + RESP_BANDS[cur].name + '</div>' +
            '<div style="font-size:11px;color:rgba(236,227,214,.45);margin-top:2px;">' + respRange(cur) + ' px</div>' +
          '</div>' +
          /* RIGHT — table of all modes */
          '<div style="flex:1 1 240px;min-width:220px;">' +
            '<p class="ov-c-label">Режимы</p>' +
            '<table class="ov-c-table"><thead><tr><th>Режим</th><th>Диапазон</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>' +
            '<p style="font-size:10px;color:rgba(236,227,214,.4);margin-top:8px;">Кликните режим, чтобы открыть превью страницы при этой ширине.</p>' +
          '</div>' +
        '</div>';
    }
    window.addEventListener('resize', updateResp);
    updateResp();

    /* ---- Responsive-mode preview: open the current page in an iframe sized to
       the chosen threshold, so its own media queries reflect that mode. ---- */
    var rprev = document.createElement('div');
    rprev.className = 'ov-rprev';
    rprev.innerHTML =
      '<div class="ov-rprev-frame">' +
        '<div class="ov-rprev-bar"><span>Превью режима <b id="ov-rprev-name"></b> · <span id="ov-rprev-w"></span>px</span>' +
        '<button class="ov-rprev-close" type="button" aria-label="Закрыть превью">✕</button></div>' +
        '<iframe id="ov-rprev-frame" title="Превью"></iframe>' +
      '</div>';
    document.body.appendChild(rprev);
    var rprevFrame = rprev.querySelector('#ov-rprev-frame');
    function closeRPrev() { rprev.classList.remove('is-open'); rprevFrame.src = 'about:blank'; }
    function openRPrev(width, name) {
      var w = Math.min(width, window.innerWidth - 40);
      var h = Math.round(window.innerHeight * 0.84);
      rprevFrame.style.width = w + 'px';
      rprevFrame.style.height = h + 'px';
      rprev.querySelector('#ov-rprev-name').textContent = name;
      rprev.querySelector('#ov-rprev-w').textContent = width;
      rprevFrame.src = location.pathname + location.search;
      rprev.classList.add('is-open');
    }
    rprev.querySelector('.ov-rprev-close').addEventListener('click', closeRPrev);
    rprev.addEventListener('click', function (e) { if (e.target === rprev) closeRPrev(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeRPrev(); });

    /* Delegate clicks on the (re-rendered) mode rows. */
    var respHost = document.getElementById('ov-resp');
    if (respHost) {
      respHost.addEventListener('click', function (e) {
        var row = e.target.closest ? e.target.closest('.ov-rrow') : null;
        if (row) openRPrev(parseInt(row.getAttribute('data-w'), 10), row.getAttribute('data-name'));
      });
    }

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
      /* Filter panel: close on any click outside it (pulse sidebar stays open) */
      if (ovPulseFilter.classList.contains('is-open') && !ovPulseFilter.contains(e.target)) {
        var _pfBtn = document.getElementById('ov-pulse-filter');
        if (!_pfBtn || !_pfBtn.contains(e.target)) {
          ovPulseFilter.classList.remove('is-open');
          if (_pfBtn) _pfBtn.classList.remove('is-active');
        }
      }
      var burgerBtn = document.getElementById('ov-burger-btn');
      if (ovBurger && !ovBurger.contains(e.target) && !(burgerBtn && burgerBtn.contains(e.target))) {
        ovBurger.classList.remove('is-open');
      }
    });

    /* ---- ESC key ---- */
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        ovNotif.classList.remove('is-open');
        ovAvatar.classList.remove('is-open');
        ovSearch.classList.remove('is-open');
        /* Filter panel closes on ESC; pulse sidebar stays open */
        ovPulseFilter.classList.remove('is-open');
        var _pfBtn2 = document.getElementById('ov-pulse-filter');
        if (_pfBtn2) _pfBtn2.classList.remove('is-active');
        if (ovBurger) ovBurger.classList.remove('is-open');
      }
    });

    /* (Nav indicator + strip flash live in assets/nav-indicator.js.) */

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

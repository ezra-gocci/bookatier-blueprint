/* components/pulse.js — Pulse activity sidebar (right-anchored) + separate
   filter overlay (origin parity: round filter button protrudes outside-left of
   the panel and opens a sliding filter panel to its left).
   BA.pulse.init(pulseBtn) / .open() / .close() / .toggle() / .groups() */
(function () {
  'use strict';
  window.BA = window.BA || {};

  var PW = 320; /* pulse sidebar width */

  var CSS = [
    /* Pulse sidebar — sits below the header (origin parity) */
    '.pulse-sidebar{position:fixed;top:var(--header-height,64px);right:0;bottom:0;z-index:var(--z-drawer,750);',
    'width:' + PW + 'px;max-width:100vw;background:var(--paper,#F5EFE4);',
    'border-left:1px solid var(--line,rgba(26,20,16,.1));display:flex;flex-direction:column;',
    'transform:translateX(100%);transition:transform 260ms var(--ease-out-quart,cubic-bezier(.25,.46,.45,.94));',
    'box-shadow:-8px 0 32px rgba(0,0,0,.08);}',
    '.pulse-sidebar.is-open{transform:translateX(0);}',
    /* Sidebar reserves content width (pushes the page) rather than overlaying.
       Pushes the page CONTENT (main/footer) rather than <body> — body margin is
       unreliable here (it destabilises the fixed sidebar), and content sits
       inside body so this stacks naturally with a right-docked console. */
    'body.ba-pulse-open main,body.ba-pulse-open footer,body.ba-pulse-open [data-page-body]{',
    'margin-right:' + PW + 'px;}',
    /* Round filter button — protrudes outside-left of the panel, shown when open */
    '.pulse-filter-btn{position:absolute;left:-18px;top:60px;width:36px;height:36px;border-radius:50%;',
    'background:var(--paper,#F5EFE4);border:1px solid var(--line,rgba(26,20,16,.15));color:var(--ink-faint);',
    'cursor:pointer;display:flex;align-items:center;justify-content:center;',
    'box-shadow:-2px 2px 10px rgba(30,20,10,.12);z-index:2;opacity:0;pointer-events:none;',
    'transition:color 140ms,border-color 140ms,background 140ms,opacity 180ms;}',
    '.pulse-sidebar.is-open .pulse-filter-btn{opacity:1;pointer-events:auto;}',
    '.pulse-filter-btn:hover{color:var(--accent);border-color:var(--accent);}',
    '.pulse-filter-btn.is-active{color:var(--accent);border-color:var(--accent);',
    'background:color-mix(in srgb,var(--accent) 10%,var(--paper,#F5EFE4));}',
    /* Head */
    '.pulse-head{padding:16px;border-bottom:1px solid var(--line,rgba(26,20,16,.08));',
    'display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}',
    '.pulse-title{font-family:var(--font-serif);font-weight:600;font-size:16px;margin:0;color:var(--ink);}',
    '.pulse-sub{font-size:11px;color:var(--ink-faint);margin:2px 0 0;}',
    '.pulse-close{background:none;border:none;font-size:20px;color:var(--ink-faint);cursor:pointer;',
    'padding:0;line-height:1;flex-shrink:0;}',
    '.pulse-close:hover{color:var(--accent);}',
    /* Feed */
    '.pulse-feed{flex:1;overflow-y:auto;padding:8px 0;}',
    '.pulse-item{display:flex;align-items:flex-start;gap:10px;padding:10px 16px;',
    'border-bottom:1px solid var(--line,rgba(26,20,16,.06));}',
    '.pulse-item:last-child{border-bottom:none;}',
    '.pulse-av{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;',
    'font-size:10px;font-weight:600;color:#ECE3D6;flex-shrink:0;}',
    '.pulse-ev-text{flex:1;font-size:12px;color:var(--ink-soft);line-height:1.45;margin:0;}',
    '.pulse-ev-text a{color:var(--accent);}',
    '.pulse-ev-time{font-size:10px;color:var(--ink-faint);margin-top:2px;}',
    '.pulse-item[data-hidden]{display:none;}',

    /* Separate filter panel — slides in to the LEFT of the pulse sidebar */
    '.pulse-filter-panel{position:fixed;top:var(--header-height,64px);right:' + PW + 'px;bottom:0;width:300px;',
    'max-width:calc(100vw - 40px);z-index:calc(var(--z-drawer,750) - 1);background:var(--paper,#F5EFE4);',
    'border-left:1px solid var(--line,rgba(26,20,16,.12));border-right:1px solid var(--line,rgba(26,20,16,.12));',
    'box-shadow:-4px 0 24px rgba(30,20,10,.10);display:flex;flex-direction:column;',
    'transform:translateX(calc(100% + ' + PW + 'px));pointer-events:none;',
    'transition:transform 240ms var(--ease-out-quart,cubic-bezier(.25,.46,.45,.94));}',
    '.pulse-filter-panel.is-open{transform:translateX(0);pointer-events:auto;}',
    '.pf-head{padding:16px;border-bottom:1px solid var(--line,rgba(26,20,16,.1));',
    'display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}',
    '.pf-title{font-family:var(--font-serif);font-size:16px;font-weight:600;color:var(--ink);margin:0;}',
    '.pf-close{background:none;border:none;color:var(--ink-faint);cursor:pointer;font-size:20px;line-height:1;padding:0;}',
    '.pf-close:hover{color:var(--accent);}',
    '.pf-body{flex:1;overflow-y:auto;}',
    '.pf-row{display:flex;align-items:center;padding:11px 16px 11px 14px;',
    'border-bottom:1px solid var(--line,rgba(26,20,16,.06));cursor:pointer;user-select:none;transition:background 120ms;}',
    '.pf-row:last-child{border-bottom:none;}',
    '.pf-row:hover{background:var(--surface-sunk,rgba(26,20,16,.04));}',
    '.pf-row.is-active{background:color-mix(in srgb,var(--accent) 8%,var(--paper,#F5EFE4));}',
    '.pf-check{width:16px;flex-shrink:0;margin-right:6px;color:var(--accent);opacity:0;',
    'display:flex;align-items:center;transition:opacity 120ms;}',
    '.pf-row.is-active .pf-check{opacity:1;}',
    '.pf-label{flex:1;display:flex;align-items:center;gap:8px;font-size:13px;color:var(--ink);min-width:0;}',
    '.pf-row.is-active .pf-label{color:var(--accent);}',
    '.pf-icon{font-size:15px;flex-shrink:0;line-height:1;}',
    '.pf-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
    '.pf-notif{flex-shrink:0;padding-left:16px;display:flex;flex-direction:column;align-items:center;gap:3px;}',
    '.pf-bell{color:var(--ink-faint);display:flex;align-items:center;line-height:1;}',
    /* Toggle switch */
    '.pf-toggle{position:relative;width:30px;height:17px;flex-shrink:0;display:inline-block;cursor:pointer;}',
    '.pf-toggle input{opacity:0;width:0;height:0;position:absolute;}',
    '.pf-track{position:absolute;inset:0;background:var(--line,rgba(26,20,16,.2));border-radius:99px;transition:background 160ms;}',
    '.pf-track::before{content:"";position:absolute;left:3px;top:2.5px;width:12px;height:12px;border-radius:50%;',
    'background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.18);transition:left 160ms;}',
    '.pf-toggle input:checked + .pf-track{background:var(--accent,#C1654B);}',
    '.pf-toggle input:checked + .pf-track::before{left:15px;}',
    '.pf-foot{padding:12px 16px;border-top:1px solid var(--line,rgba(26,20,16,.1));flex-shrink:0;}',
    '.pf-reset{width:100%;padding:7px 12px;font-size:12px;color:var(--ink-soft);background:transparent;',
    'border:1px solid var(--line,rgba(26,20,16,.15));border-radius:var(--radius-md,8px);cursor:pointer;',
    'transition:border-color 120ms,color 120ms;}',
    '.pf-reset:hover{border-color:var(--ink-soft);color:var(--ink);}',
    '@media (max-width:640px){.pulse-filter-panel{display:none;}}',
  ].join('');

  /* Each group carries two flags: `show` (appears in the Pulse feed) and
     `notif` (appears in the Notifications dropdown). The filter panel toggles
     both — this is the interconnection between Pulse and Notifications. */
  var PULSE_GROUPS = [
    { id:'comment', icon:'💬', label:'Комментарии',    show:true, notif:true  },
    { id:'reading', icon:'📖', label:'Чтение',          show:true, notif:false },
    { id:'review',  icon:'✍️', label:'Рецензии',        show:true, notif:true  },
    { id:'rating',  icon:'⭐', label:'Оценки',          show:true, notif:false },
    { id:'mention', icon:'💌', label:'Упоминания',      show:true, notif:true  },
    { id:'update',  icon:'📚', label:'Обновления книг', show:true, notif:true  },
    { id:'mine',    icon:'👤', label:'Моя активность',  show:true, notif:false },
  ];

  function _saveGroups() {
    try {
      var s = {};
      PULSE_GROUPS.forEach(function (g) { s[g.id] = { p: g.show, n: g.notif }; });
      sessionStorage.setItem('ba-pulse-groups', JSON.stringify(s));
    } catch (e) {}
  }
  function _restoreGroups() {
    try {
      var raw = sessionStorage.getItem('ba-pulse-groups');
      if (!raw) return;
      var s = JSON.parse(raw);
      PULSE_GROUPS.forEach(function (g) {
        if (s[g.id]) { g.show = !!s[g.id].p; g.notif = !!s[g.id].n; }
      });
    } catch (e) {}
  }
  function _emitFilterChange() {
    document.dispatchEvent(new CustomEvent('ba:pulse-filter-change', { bubbles: true }));
  }
  _restoreGroups();

  var PULSE_EVENTS = [
    { av:'МС', bg:'var(--slate,#5A6E7A)',  group:'comment', text:'<strong>Мария Соколова</strong> прокомментировала «Научение на опыте»', time:'2 мин.' },
    { av:'ДО', bg:'#7A4A3A',               group:'reading', text:'<strong>Дмитрий Орлов</strong> завершил чтение «Гореть вместе»', time:'7 мин.' },
    { av:'АП', bg:'var(--slate,#5A6E7A)',  group:'rating',  text:'<strong>Алексей Петров</strong> поставил ★★★★★ «Научение на опыте»', time:'18 мин.' },
    { av:'НК', bg:'var(--sage,#4D7A66)',   group:'reading', text:'<strong>Наталья Кузнецова</strong> начала читать «Избегание эмоций»', time:'34 мин.' },
    { av:'АИ', bg:'var(--accent,#C1654B)', group:'mine',    text:'Вы прочитали 5 страниц «Научение на опыте»', time:'1 ч.' },
    { av:'МС', bg:'var(--slate,#5A6E7A)',  group:'review',  text:'<strong>Мария Соколова</strong> написала рецензию на «Гореть вместе»', time:'2 ч.' },
    { av:'ДО', bg:'#7A4A3A',               group:'mention', text:'<strong>Дмитрий Орлов</strong> упомянул вас в обсуждении', time:'3 ч.' },
    { av:'📚', bg:'var(--surface-sunk)',   group:'update',  text:'Новая версия «Гореть вместе» — v1.1 доступна', time:'4 ч.' },
  ];

  var FILTER_SVG = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>';
  var CHECK_SVG  = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var BELL_SVG   = '<svg width="13" height="14" viewBox="0 0 14 16" fill="none" aria-hidden="true"><path d="M7 1.5a1 1 0 0 1 1 1V3a5 5 0 0 1 4 4.9V11l1.5 1.5H.5L2 11V7.9A5 5 0 0 1 6 3V2.5a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.5 13a1.5 1.5 0 0 0 3 0" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"/></svg>';

  var _sidebar = null;
  var _filterPanel = null;
  var _filterBtn = null;

  function _inject() {
    if (document.getElementById('ba-pulse-css')) return;
    var s = document.createElement('style');
    s.id = 'ba-pulse-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function _closeFilter() {
    if (_filterPanel) _filterPanel.classList.remove('is-open');
    if (_filterBtn) _filterBtn.classList.remove('is-active');
  }

  function _build() {
    if (_sidebar) return;
    _inject();

    /* ---- Pulse sidebar ---- */
    _sidebar = document.createElement('div');
    _sidebar.className = 'pulse-sidebar';
    _sidebar.setAttribute('role', 'complementary');
    _sidebar.setAttribute('aria-label', 'Пульс платформы');

    var feedItems = PULSE_EVENTS.map(function (ev) {
      return [
        '<div class="pulse-item" data-group="' + ev.group + '">',
          '<span class="pulse-av" style="background:' + ev.bg + '" aria-hidden="true">' + ev.av + '</span>',
          '<div style="flex:1;min-width:0;">',
            '<p class="pulse-ev-text">' + ev.text + '</p>',
            '<p class="pulse-ev-time">' + ev.time + ' назад</p>',
          '</div>',
        '</div>'
      ].join('');
    }).join('');

    _sidebar.innerHTML = [
      '<button class="pulse-filter-btn" id="pulse-filter-toggle" type="button" title="Фильтр" aria-label="Фильтр пульса">' + FILTER_SVG + '</button>',
      '<div class="pulse-head">',
        '<div><p class="pulse-title">Пульс</p><p class="pulse-sub">Активность прямо сейчас</p></div>',
        '<button class="pulse-close" id="pulse-close" type="button" aria-label="Закрыть пульс">×</button>',
      '</div>',
      '<div class="pulse-feed" id="pulse-feed">' + feedItems + '</div>',
    ].join('');
    document.body.appendChild(_sidebar);

    /* ---- Separate filter panel ---- */
    _filterPanel = document.createElement('div');
    _filterPanel.className = 'pulse-filter-panel';
    _filterPanel.setAttribute('aria-label', 'Фильтр пульса');

    var rows = PULSE_GROUPS.map(function (g) {
      return [
        '<div class="pf-row' + (g.show ? ' is-active' : '') + '" data-group="' + g.id + '">',
          '<span class="pf-check">' + CHECK_SVG + '</span>',
          '<span class="pf-label"><span class="pf-icon">' + g.icon + '</span><span class="pf-name">' + g.label + '</span></span>',
          '<span class="pf-notif">',
            '<span class="pf-bell" title="Показывать события этой группы в уведомлениях">' + BELL_SVG + '</span>',
            '<label class="pf-toggle" title="Показывать в уведомлениях" onclick="event.stopPropagation()">',
              '<input type="checkbox" data-group="' + g.id + '"' + (g.notif ? ' checked' : '') + '>',
              '<span class="pf-track"></span>',
            '</label>',
          '</span>',
        '</div>'
      ].join('');
    }).join('');

    _filterPanel.innerHTML = [
      '<div class="pf-head"><p class="pf-title">Фильтр</p>',
        '<button class="pf-close" id="pf-close" type="button" aria-label="Закрыть фильтр">×</button></div>',
      '<div class="pf-body">' + rows + '</div>',
      '<div class="pf-foot"><button class="pf-reset" id="pf-reset" type="button">Сбросить все фильтры</button></div>',
    ].join('');
    document.body.appendChild(_filterPanel);

    _filterBtn = _sidebar.querySelector('#pulse-filter-toggle');

    /* ---- Wiring ---- */
    _sidebar.querySelector('#pulse-close').addEventListener('click', BA.pulse.close);

    _filterBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = !_filterPanel.classList.contains('is-open');
      _filterPanel.classList.toggle('is-open', open);
      _filterBtn.classList.toggle('is-active', open);
    });
    _filterPanel.querySelector('#pf-close').addEventListener('click', _closeFilter);

    /* Row click toggles Pulse-feed visibility (keep at least one) */
    _filterPanel.querySelectorAll('.pf-row[data-group]').forEach(function (row) {
      row.addEventListener('click', function (e) {
        if (e.target.closest('.pf-toggle')) return;
        var gid = row.getAttribute('data-group');
        var g = PULSE_GROUPS.filter(function (x) { return x.id === gid; })[0];
        if (!g) return;
        var active = PULSE_GROUPS.filter(function (x) { return x.show; }).length;
        if (g.show && active <= 1) return;
        g.show = !g.show;
        row.classList.toggle('is-active', g.show);
        _applyFilters();
        _saveGroups();
      });
    });

    /* Bell switch toggles whether the group also shows in Notifications */
    _filterPanel.querySelectorAll('.pf-toggle input[type="checkbox"]').forEach(function (inp) {
      inp.addEventListener('change', function () {
        var gid = inp.getAttribute('data-group');
        var g = PULSE_GROUPS.filter(function (x) { return x.id === gid; })[0];
        if (g) { g.notif = inp.checked; _saveGroups(); _emitFilterChange(); }
      });
    });

    _filterPanel.querySelector('#pf-reset').addEventListener('click', function () {
      PULSE_GROUPS.forEach(function (g) { g.show = true; });
      _filterPanel.querySelectorAll('.pf-row').forEach(function (r) { r.classList.add('is-active'); });
      _applyFilters();
      _saveGroups();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (_filterPanel.classList.contains('is-open')) _closeFilter();
        else if (_sidebar && _sidebar.classList.contains('is-open')) BA.pulse.close();
      }
    });

    // Filter is an overlay — close it on any click outside the panel / its button.
    document.addEventListener('click', function (e) {
      if (!_filterPanel.classList.contains('is-open')) return;
      if (e.target.closest('.pulse-filter-panel') || e.target.closest('.pulse-filter-btn')) return;
      _closeFilter();
    });

    _applyFilters(); // reflect restored filter state in the feed
  }

  function _applyFilters() {
    if (!_sidebar) return;
    var visible = PULSE_GROUPS.filter(function (g) { return g.show; }).map(function (g) { return g.id; });
    _sidebar.querySelectorAll('.pulse-item').forEach(function (item) {
      if (visible.indexOf(item.getAttribute('data-group')) !== -1) item.removeAttribute('data-hidden');
      else item.setAttribute('data-hidden', '1');
    });
  }

  window.BA.pulse = {
    /* Shared with notifications.js — read the per-group notif flags. */
    groups: function () { return PULSE_GROUPS; },
    init: function (pulseBtn) {
      _build();
      pulseBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        BA.pulse.toggle();
      });
    },
    open: function () {
      _build();
      // Reserve content width FIRST and flush layout, then start the slide — so
      // the content reflow doesn't stall the sidebar's transform transition.
      document.body.classList.add('ba-pulse-open');
      void _sidebar.offsetWidth;
      _sidebar.classList.add('is-open');
      try { sessionStorage.setItem('ba-pulse-open', '1'); } catch (e) {}
    },
    close: function () {
      if (_sidebar) _sidebar.classList.remove('is-open');
      document.body.classList.remove('ba-pulse-open');
      _closeFilter();
      try { sessionStorage.removeItem('ba-pulse-open'); } catch (e) {}
    },
    toggle: function () {
      if (_sidebar && _sidebar.classList.contains('is-open')) BA.pulse.close();
      else BA.pulse.open();
    }
  };

  // Keep the Pulse open across page navigations.
  function _restorePulseOpen() {
    try { if (sessionStorage.getItem('ba-pulse-open') === '1') BA.pulse.open(); } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _restorePulseOpen);
  else _restorePulseOpen();
})();

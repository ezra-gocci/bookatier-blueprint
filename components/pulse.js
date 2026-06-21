/* components/pulse.js — Pulse activity sidebar (right-anchored)
   BA.pulse.init(pulseBtn) — called by frame.js for private header
   BA.pulse.open() / .close() / .toggle() */
(function () {
  'use strict';
  window.BA = window.BA || {};

  var CSS = [
    '.pulse-sidebar{position:fixed;top:0;right:0;bottom:0;z-index:var(--z-drawer,750);',
    'width:320px;background:var(--paper,#F5EFE4);border-left:1px solid var(--line,rgba(26,20,16,.1));',
    'display:flex;flex-direction:column;',
    'transform:translateX(100%);transition:transform 260ms var(--ease-out-quart,cubic-bezier(.25,.46,.45,.94));',
    'box-shadow:-8px 0 32px rgba(0,0,0,.08);}',
    '.pulse-sidebar.is-open{transform:translateX(0);}',
    '.pulse-head{padding:16px 16px 12px;border-bottom:1px solid var(--line,rgba(26,20,16,.08));',
    'display:flex;align-items:flex-start;gap:8px;flex-shrink:0;}',
    '.pulse-head-text{flex:1;}',
    '.pulse-title{font-weight:600;font-size:15px;margin:0 0 2px;color:var(--ink);}',
    '.pulse-sub{font-size:12px;color:var(--ink-faint);margin:0;}',
    '.pulse-close{background:none;border:none;font-size:20px;color:var(--ink-faint);cursor:pointer;',
    'padding:0;line-height:1;flex-shrink:0;}',
    '.pulse-filter-btn{background:none;border:1px solid var(--line,rgba(26,20,16,.15));border-radius:6px;',
    'padding:4px 8px;font-size:12px;color:var(--ink-faint);cursor:pointer;display:flex;align-items:center;gap:4px;}',
    '.pulse-filter-btn:hover{border-color:var(--ink-faint);}',
    '.pulse-filter-panel{padding:12px 16px;border-bottom:1px solid var(--line,rgba(26,20,16,.08));',
    'display:none;}',
    '.pulse-filter-panel.is-open{display:block;}',
    '.pulse-filter-row{display:flex;align-items:center;gap:8px;padding:6px 0;',
    'border-bottom:1px solid var(--line,rgba(26,20,16,.05));font-size:13px;cursor:pointer;}',
    '.pulse-filter-row:last-child{border-bottom:none;}',
    '.pulse-filter-check{width:16px;height:16px;border-radius:4px;border:1.5px solid var(--line);',
    'display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all 140ms;}',
    '.pulse-filter-row.is-active .pulse-filter-check{background:var(--ink);border-color:var(--ink);color:var(--paper);}',
    '.pulse-filter-label{flex:1;}',
    '.pulse-feed{flex:1;overflow-y:auto;padding:4px 0;}',
    '.pulse-item{display:flex;gap:10px;padding:12px 16px;border-bottom:1px solid var(--line,rgba(26,20,16,.06));',
    'transition:background 140ms;}',
    '.pulse-item:hover{background:var(--surface-sunk,rgba(26,20,16,.04));}',
    '.pulse-item:last-child{border-bottom:none;}',
    '.pulse-av{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;',
    'font-size:12px;font-weight:600;color:#ECE3D6;flex-shrink:0;margin-top:1px;}',
    '.pulse-ev-text{font-size:13px;line-height:1.45;color:var(--ink);margin:0 0 3px;}',
    '.pulse-ev-time{font-size:11px;color:var(--ink-faint);}',
    '.pulse-item[data-hidden]{display:none;}',
  ].join('');

  var PULSE_GROUPS = [
    { id:'comment', icon:'💬', label:'Комментарии',    show:true },
    { id:'reading', icon:'📖', label:'Чтение',          show:true },
    { id:'review',  icon:'✍️', label:'Рецензии',        show:true },
    { id:'rating',  icon:'⭐', label:'Оценки',          show:true },
    { id:'mention', icon:'💌', label:'Упоминания',      show:true },
    { id:'update',  icon:'📚', label:'Обновления книг', show:true },
    { id:'mine',    icon:'👤', label:'Моя активность',  show:true },
  ];

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

  var _sidebar = null;
  var _filterPanel = null;

  function _inject() {
    if (document.getElementById('ba-pulse-css')) return;
    var s = document.createElement('style');
    s.id = 'ba-pulse-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function _build() {
    if (_sidebar) return;
    _inject();

    _sidebar = document.createElement('div');
    _sidebar.className = 'pulse-sidebar';
    _sidebar.setAttribute('role', 'complementary');
    _sidebar.setAttribute('aria-label', 'Пульс платформы');

    var filterRows = PULSE_GROUPS.map(function (g) {
      return [
        '<div class="pulse-filter-row is-active" data-group="' + g.id + '">',
          '<span class="pulse-filter-check">✓</span>',
          '<span class="pulse-filter-icon" style="font-size:14px">' + g.icon + '</span>',
          '<span class="pulse-filter-label">' + g.label + '</span>',
        '</div>'
      ].join('');
    }).join('');

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

    var filterSvg = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>';

    _sidebar.innerHTML = [
      '<div class="pulse-head">',
        '<div class="pulse-head-text">',
          '<p class="pulse-title">Пульс</p>',
          '<p class="pulse-sub">Активность прямо сейчас</p>',
        '</div>',
        '<button class="pulse-filter-btn" id="pulse-filter-toggle" type="button">' + filterSvg + ' Фильтр</button>',
        '<button class="pulse-close" id="pulse-close" type="button" aria-label="Закрыть пульс">×</button>',
      '</div>',
      '<div class="pulse-filter-panel" id="pulse-filter-panel">',
        filterRows,
        '<button type="button" style="margin-top:8px;background:none;border:none;font-size:12px;color:var(--accent);cursor:pointer;" id="pulse-filter-reset">Сбросить фильтры</button>',
      '</div>',
      '<div class="pulse-feed" id="pulse-feed">' + feedItems + '</div>',
    ].join('');

    document.body.appendChild(_sidebar);

    _filterPanel = _sidebar.querySelector('#pulse-filter-panel');

    _sidebar.querySelector('#pulse-close').addEventListener('click', BA.pulse.close);
    _sidebar.querySelector('#pulse-filter-toggle').addEventListener('click', function () {
      _filterPanel.classList.toggle('is-open');
    });

    // Filter rows
    _sidebar.querySelector('#pulse-filter-panel').addEventListener('click', function (e) {
      var row = e.target.closest('.pulse-filter-row');
      if (!row) return;
      var groupId = row.getAttribute('data-group');
      var group = PULSE_GROUPS.filter(function (g) { return g.id === groupId; })[0];
      if (!group) return;
      group.show = !group.show;
      row.classList.toggle('is-active', group.show);
      row.querySelector('.pulse-filter-check').textContent = group.show ? '✓' : '';
      _applyFilters();
    });

    _sidebar.querySelector('#pulse-filter-reset').addEventListener('click', function () {
      PULSE_GROUPS.forEach(function (g) { g.show = true; });
      _sidebar.querySelectorAll('.pulse-filter-row').forEach(function (r) {
        r.classList.add('is-active');
        r.querySelector('.pulse-filter-check').textContent = '✓';
      });
      _applyFilters();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && _sidebar && _sidebar.classList.contains('is-open')) BA.pulse.close();
    });
  }

  function _applyFilters() {
    var visibleIds = PULSE_GROUPS.filter(function (g) { return g.show; }).map(function (g) { return g.id; });
    _sidebar.querySelectorAll('.pulse-item').forEach(function (item) {
      var g = item.getAttribute('data-group');
      if (visibleIds.indexOf(g) !== -1) item.removeAttribute('data-hidden');
      else item.setAttribute('data-hidden', '1');
    });
  }

  window.BA.pulse = {
    init: function (pulseBtn) {
      _build();
      pulseBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        BA.pulse.toggle();
      });
    },
    open: function () { _build(); _sidebar.classList.add('is-open'); },
    close: function () { if (_sidebar) _sidebar.classList.remove('is-open'); },
    toggle: function () {
      if (_sidebar && _sidebar.classList.contains('is-open')) BA.pulse.close();
      else BA.pulse.open();
    }
  };
})();

/* components/logging.js — Event log modal (~70% viewport)
   BA.logging.open() / .close()
   Accessible in public and private modes. */
(function () {
  'use strict';
  window.BA = window.BA || {};

  var CSS = [
    '.log-backdrop{position:fixed;inset:0;z-index:830;background:rgba(20,16,12,.6);',
    'backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;',
    'opacity:0;pointer-events:none;transition:opacity 200ms;}',
    '.log-backdrop.is-open{opacity:1;pointer-events:auto;}',
    '.log-modal{position:relative;background:var(--paper,#F5EFE4);border-radius:16px;',
    'width:72vw;max-width:900px;height:70vh;display:flex;flex-direction:column;',
    'box-shadow:0 24px 64px rgba(0,0,0,.2);',
    'transform:translateY(16px);transition:transform 250ms var(--ease-out-quart,cubic-bezier(.25,.46,.45,.94));}',
    '.log-backdrop.is-open .log-modal{transform:translateY(0);}',
    '.log-head{padding:20px 24px 16px;border-bottom:1px solid var(--line,rgba(26,20,16,.1));',
    'display:flex;align-items:center;gap:12px;flex-shrink:0;}',
    '.log-title{font-weight:600;font-size:16px;margin:0;flex:1;}',
    '.log-filter-row{display:flex;gap:8px;flex-wrap:wrap;padding:12px 24px;',
    'border-bottom:1px solid var(--line,rgba(26,20,16,.08));flex-shrink:0;}',
    '.log-filter-btn{padding:4px 12px;border-radius:20px;border:1px solid var(--line,rgba(26,20,16,.15));',
    'background:none;font-size:12px;cursor:pointer;color:var(--ink-faint);}',
    '.log-filter-btn.is-active{background:var(--ink,#1A1410);color:var(--paper,#F5EFE4);border-color:var(--ink);}',
    '.log-body{flex:1;overflow-y:auto;padding:8px 0;}',
    '.log-row{display:grid;grid-template-columns:80px 160px 40px 1fr;gap:0;',
    'padding:9px 24px;font-size:12px;border-bottom:1px solid var(--line,rgba(26,20,16,.05));',
    'font-family:var(--font-mono,monospace);}',
    '.log-row:hover{background:var(--surface-sunk,rgba(26,20,16,.04));}',
    '.log-time{color:var(--ink-faint);}',
    '.log-type{color:var(--accent,#C1654B);font-weight:500;}',
    '.log-actor{color:var(--ink-faint);text-align:center;}',
    '.log-body-text{color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
    '.log-foot{padding:12px 24px;border-top:1px solid var(--line,rgba(26,20,16,.1));',
    'display:flex;align-items:center;gap:12px;flex-shrink:0;}',
    '.log-count{font-size:12px;color:var(--ink-faint);flex:1;}',
    '.log-close{position:absolute;top:16px;right:16px;background:none;border:none;',
    'font-size:20px;color:var(--ink-faint);cursor:pointer;line-height:1;padding:4px;}',
  ].join('');

  var EVENTS = [
    { time:'16:44:02', type:'page.viewed',     actor:'АИ', body:'book_id=bion, page=38' },
    { time:'16:43:51', type:'comment.created', actor:'МС', body:'book_id=bion, comment_id=c4' },
    { time:'16:41:30', type:'book.opened',     actor:'ДО', body:'book_id=nikoli, v=1.1' },
    { time:'16:38:07', type:'vote.cast',       actor:'АП', body:'target=comment_c3, weight=2, delta=+2' },
    { time:'16:35:22', type:'page.viewed',     actor:'НК', body:'book_id=bion, page=27' },
    { time:'16:32:11', type:'session.ended',   actor:'АИ', body:'book_id=bion, duration=840s' },
    { time:'16:28:44', type:'review.created',  actor:'МС', body:'book_id=nikoli, rating=4' },
    { time:'16:15:03', type:'book.opened',     actor:'АИ', body:'book_id=bion, v=1.0' },
    { time:'16:10:49', type:'page.viewed',     actor:'ДО', body:'book_id=nikoli, page=14' },
    { time:'16:07:22', type:'comment.created', actor:'НК', body:'book_id=ferro, comment_id=c3' },
    { time:'15:58:31', type:'vote.cast',       actor:'МС', body:'target=comment_c1, weight=3, delta=+3' },
    { time:'15:44:18', type:'page.viewed',     actor:'АИ', body:'book_id=bion, page=22' },
  ];

  var EVENT_TYPES = ['page.viewed','book.opened','session.ended','comment.created','vote.cast','review.created'];

  var _el = null;
  var _activeFilters = {};

  function _inject() {
    if (document.getElementById('ba-log-css')) return;
    var s = document.createElement('style');
    s.id = 'ba-log-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function _build() {
    if (_el) return;
    _inject();

    _el = document.createElement('div');
    _el.className = 'log-backdrop';
    _el.setAttribute('role', 'dialog');
    _el.setAttribute('aria-modal', 'true');
    _el.setAttribute('aria-label', 'Журнал событий');
    _el.setAttribute('aria-hidden', 'true');

    var filterBtns = EVENT_TYPES.map(function (t) {
      return '<button class="log-filter-btn is-active" data-log-type="' + t + '" type="button">' + t + '</button>';
    }).join('');

    _el.innerHTML = [
      '<div class="log-modal">',
        '<button class="log-close" type="button" aria-label="Закрыть">×</button>',
        '<div class="log-head">',
          '<h2 class="log-title">Журнал событий</h2>',
        '</div>',
        '<div class="log-filter-row" id="log-filters">' + filterBtns + '</div>',
        '<div class="log-body" id="log-body" role="log" aria-live="polite"></div>',
        '<div class="log-foot">',
          '<span class="log-count" id="log-count"></span>',
          '<button class="btn btn-ghost" type="button" id="log-export" style="font-size:13px">Экспорт JSON</button>',
        '</div>',
      '</div>'
    ].join('');

    document.body.appendChild(_el);

    // Filter buttons
    _el.querySelector('#log-filters').addEventListener('click', function (e) {
      var btn = e.target.closest('.log-filter-btn');
      if (!btn) return;
      btn.classList.toggle('is-active');
      _renderRows();
    });

    // Export
    _el.querySelector('#log-export').addEventListener('click', function () {
      var data = _filtered();
      var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = 'ba-events.json'; a.click();
      URL.revokeObjectURL(url);
    });

    _el.querySelector('.log-close').addEventListener('click', BA.logging.close);
    _el.addEventListener('click', function (e) { if (e.target === _el) BA.logging.close(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && _el && _el.classList.contains('is-open')) BA.logging.close();
    });
  }

  function _filtered() {
    var active = [];
    _el.querySelectorAll('.log-filter-btn.is-active').forEach(function (b) {
      active.push(b.getAttribute('data-log-type'));
    });
    return EVENTS.filter(function (ev) { return active.indexOf(ev.type) !== -1; });
  }

  function _renderRows() {
    var evs = _filtered();
    var body = _el.querySelector('#log-body');
    body.innerHTML = evs.map(function (ev) {
      return [
        '<div class="log-row">',
          '<span class="log-time">' + ev.time + '</span>',
          '<span class="log-type">' + ev.type + '</span>',
          '<span class="log-actor">' + ev.actor + '</span>',
          '<span class="log-body-text">' + ev.body + '</span>',
        '</div>'
      ].join('');
    }).join('') || '<p style="padding:24px;color:var(--ink-faint);font-size:13px">Нет событий для выбранных фильтров</p>';
    _el.querySelector('#log-count').textContent = evs.length + ' / ' + EVENTS.length + ' записей';
  }

  window.BA.logging = {
    open: function () {
      _build();
      _renderRows();
      _el.classList.add('is-open');
      _el.setAttribute('aria-hidden', 'false');
    },
    close: function () {
      if (!_el) return;
      _el.classList.remove('is-open');
      _el.setAttribute('aria-hidden', 'true');
    }
  };
})();

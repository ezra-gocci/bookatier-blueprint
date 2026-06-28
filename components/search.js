/* components/search.js — Search panel overlay (full-width, slides from header)
   BA.search.init(searchBtn) — called by frame.js for private header
   BA.search.open() / .close() */
(function () {
  'use strict';
  window.BA = window.BA || {};

  var CSS = [
    '.search-panel{position:fixed;top:0;left:0;right:0;z-index:var(--z-dropdown,700);',
    'background:color-mix(in srgb,var(--paper,#F5EFE4) 97%,transparent);',
    'backdrop-filter:saturate(140%) blur(12px);',
    'border-bottom:1px solid var(--line,rgba(26,20,16,.12));',
    'transform:translateY(-100%);opacity:0;',
    'transition:transform 250ms var(--ease-out-quart,cubic-bezier(.25,.46,.45,.94)),opacity 200ms;',
    'pointer-events:none;}',
    '.search-panel.is-open{transform:translateY(0);opacity:1;pointer-events:auto;}',
    '.search-inner{max-width:760px;margin:0 auto;padding:20px 24px 24px;}',
    '.search-bar{display:flex;align-items:center;gap:12px;margin-bottom:16px;}',
    '.search-icon-wrap{color:var(--ink-faint);flex-shrink:0;}',
    '.search-input{flex:1;border:none;background:none;font-size:20px;color:var(--ink);',
    'font-family:var(--font-sans,inherit);outline:none;}',
    '.search-input::placeholder{color:var(--ink-faint);}',
    '.search-close-btn{background:none;border:none;font-size:20px;color:var(--ink-faint);cursor:pointer;',
    'padding:4px;line-height:1;}',
    '.search-scope-row{display:flex;gap:8px;margin-bottom:20px;}',
    '.search-scope-btn{padding:4px 14px;border-radius:20px;border:1px solid var(--line,rgba(26,20,16,.15));',
    'background:none;font-size:13px;cursor:pointer;color:var(--ink-faint);transition:all 140ms;}',
    '.search-scope-btn.is-on{background:var(--ink,#1A1410);color:var(--paper,#F5EFE4);border-color:var(--ink);}',
    '.search-history-label{font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;',
    'color:var(--ink-faint);margin:0 0 10px;}',
    '.search-history-list{display:flex;flex-wrap:wrap;gap:8px;}',
    '.search-history-tag{padding:5px 14px;border-radius:20px;',
    'background:var(--surface-sunk,rgba(26,20,16,.06));',
    'font-size:13px;color:var(--ink);cursor:pointer;border:none;transition:background 140ms;}',
    '.search-history-tag:hover{background:var(--line,rgba(26,20,16,.15));}',
    '.search-results{display:none;}',
    '.search-results.has-results{display:block;}',
    '.search-results-group{margin-bottom:20px;}',
    '.search-results-group-title{font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;',
    'color:var(--ink-faint);margin:0 0 10px;}',
    '.search-result-item{padding:10px 0;border-bottom:1px solid var(--line,rgba(26,20,16,.07));',
    'cursor:pointer;display:flex;gap:10px;align-items:flex-start;}',
    '.search-result-item:last-child{border-bottom:none;}',
    '.search-result-icon{width:32px;height:32px;border-radius:6px;background:var(--surface-sunk);',
    'display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;}',
    '.search-result-title{font-size:14px;font-weight:500;color:var(--ink);margin:0 0 2px;}',
    '.search-result-sub{font-size:12px;color:var(--ink-faint);margin:0;}',
  ].join('');

  var RECENT = ['Бион', 'контрперенос', 'выгорание', 'Ферро', 'альфа-функция'];

  var QUICK_RESULTS = {
    books: [
      { icon: '📖', title: 'Научение на опыте', sub: 'Уилфред Р. Бион · 2023' },
      { icon: '📖', title: 'Гореть вместе', sub: 'Ред. Лука Николи · 2023' },
    ],
    members: [
      { icon: '👤', title: 'Мария Соколова', sub: 'Профессионал · ★ 287' },
      { icon: '👤', title: 'Дмитрий Орлов', sub: 'Профессионал · ★ 412' },
    ]
  };

  var _panel = null;
  var _input = null;
  var _searchTimer = null;

  function _inject() {
    if (document.getElementById('ba-search-css')) return;
    var s = document.createElement('style');
    s.id = 'ba-search-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function _build() {
    if (_panel) return;
    _inject();

    _panel = document.createElement('div');
    _panel.className = 'search-panel';
    _panel.setAttribute('role', 'search');
    _panel.setAttribute('aria-label', 'Поиск по платформе');

    var recentTags = RECENT.map(function (r) {
      return '<button class="search-history-tag" type="button">' + r + '</button>';
    }).join('');

    var booksHtml = QUICK_RESULTS.books.map(function (b) {
      return '<div class="search-result-item"><span class="search-result-icon">' + b.icon + '</span><div><p class="search-result-title">' + b.title + '</p><p class="search-result-sub">' + b.sub + '</p></div></div>';
    }).join('');
    var membersHtml = QUICK_RESULTS.members.map(function (m) {
      return '<div class="search-result-item"><span class="search-result-icon">' + m.icon + '</span><div><p class="search-result-title">' + m.title + '</p><p class="search-result-sub">' + m.sub + '</p></div></div>';
    }).join('');

    _panel.innerHTML = [
      '<div class="search-inner">',
        '<div class="search-bar">',
          '<span class="search-icon-wrap" aria-hidden="true">',
            '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/></svg>',
          '</span>',
          '<input class="search-input" id="ba-search-input" type="search" placeholder="Поиск книг, авторов, обсуждений…" autocomplete="off" spellcheck="false">',
          '<button class="search-close-btn" id="ba-search-close" type="button" aria-label="Закрыть поиск">×</button>',
        '</div>',
        '<div class="search-scope-row">',
          '<span style="font-size:13px;color:var(--ink-faint);align-self:center;">Область:</span>',
          '<button class="search-scope-btn is-on" data-scope="books" type="button">✓ Книги</button>',
          '<button class="search-scope-btn is-on" data-scope="members" type="button">✓ Участники</button>',
          '<button class="search-scope-btn is-on" data-scope="discussions" type="button">✓ Обсуждения</button>',
        '</div>',
        '<div id="ba-search-history">',
          '<p class="search-history-label">Недавние запросы</p>',
          '<div class="search-history-list">' + recentTags + '</div>',
        '</div>',
        '<div class="search-results" id="ba-search-results">',
          '<div class="search-results-group"><p class="search-results-group-title">Книги</p>' + booksHtml + '</div>',
          '<div class="search-results-group"><p class="search-results-group-title">Участники</p>' + membersHtml + '</div>',
        '</div>',
      '</div>'
    ].join('');

    document.body.insertBefore(_panel, document.body.firstChild);

    _input = _panel.querySelector('#ba-search-input');
    _panel.querySelector('#ba-search-close').addEventListener('click', BA.search.close);

    /* The panel is a launcher; the results surface is search.html (overlay E →
       results page, system-model §6.1 area 20). Enter (or a recent tag) navigates. */
    function _go(){ var q=_input.value.trim(); if(q) location.href='search.html?q='+encodeURIComponent(q); }
    _input.addEventListener('keydown', function(e){ if(e.key==='Enter'){ e.preventDefault(); _go(); } });

    // Scope toggles
    _panel.querySelectorAll('.search-scope-btn').forEach(function (btn) {
      btn.addEventListener('click', function () { btn.classList.toggle('is-on'); });
    });

    // Recent tags fill input
    _panel.querySelectorAll('.search-history-tag').forEach(function (tag) {
      tag.addEventListener('click', function () { location.href = 'search.html?q=' + encodeURIComponent(tag.textContent); });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && _panel && _panel.classList.contains('is-open')) BA.search.close();
    });
  }

  window.BA.search = {
    init: function (searchBtn) {
      _build();
      searchBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        BA.search.toggle();
      });
    },
    open: function () {
      _build();
      _panel.classList.add('is-open');
      if (_input) setTimeout(function () { _input.focus(); }, 60);
    },
    close: function () {
      if (!_panel) return;
      _panel.classList.remove('is-open');
    },
    toggle: function () {
      if (_panel && _panel.classList.contains('is-open')) BA.search.close();
      else BA.search.open();
    }
  };
})();

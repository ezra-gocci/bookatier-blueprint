/* components/debug.js — Debug console sidebar (right-anchored, ~420px, 6 tabs)
   BA.debug.open() / .close()
   Always accessible — no auth gating in blueprint.
   Users tab is the auth control: click user → BA.session.set(), «Анонимный» → clear(). */
(function () {
  'use strict';
  window.BA = window.BA || {};

  var CSS = [
    /* Sidebar shell */
    '.dbg-sidebar{position:fixed;top:0;right:0;bottom:0;z-index:var(--z-overlay,780);',
    'width:420px;max-width:100vw;',
    'background:#1F1B18;color:#ECE3D6;',
    'display:flex;flex-direction:column;',
    'transform:translateX(100%);transition:transform 280ms var(--ease-out-quart,cubic-bezier(.25,.46,.45,.94));',
    'box-shadow:-12px 0 48px rgba(0,0,0,.45);}',
    '.dbg-sidebar.is-open{transform:translateX(0);}',
    /* Top bar */
    '.dbg-topbar{padding:0 16px;height:44px;border-bottom:1px solid rgba(236,227,214,.1);',
    'display:flex;align-items:center;gap:8px;flex-shrink:0;}',
    '.dbg-title{font-size:13px;font-weight:600;letter-spacing:.04em;color:rgba(236,227,214,.6);flex:1;}',
    '.dbg-close{background:none;border:none;color:rgba(236,227,214,.5);cursor:pointer;',
    'font-size:18px;line-height:1;padding:4px;}',
    '.dbg-close:hover{color:#ECE3D6;}',
    /* Tabs */
    '.dbg-tabs{display:flex;border-bottom:1px solid rgba(236,227,214,.1);flex-shrink:0;overflow-x:auto;}',
    '.dbg-tab{padding:10px 14px;background:none;border:none;color:rgba(236,227,214,.45);',
    'font-size:12px;cursor:pointer;white-space:nowrap;border-bottom:2px solid transparent;',
    'transition:all 140ms;flex-shrink:0;}',
    '.dbg-tab.is-active{color:#ECE3D6;border-bottom-color:#DB7B5D;}',
    '.dbg-tab:hover{color:rgba(236,227,214,.8);}',
    /* Panels */
    '.dbg-panel{flex:1;overflow-y:auto;display:none;padding:0;}',
    '.dbg-panel.is-active{display:flex;flex-direction:column;}',
    /* Section labels */
    '.dbg-label{font-size:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;',
    'color:rgba(236,227,214,.35);padding:14px 16px 6px;flex-shrink:0;}',
    /* User rows */
    '.dbg-user-row{display:flex;align-items:center;gap:10px;padding:10px 16px;cursor:pointer;',
    'border-bottom:1px solid rgba(236,227,214,.06);transition:background 120ms;}',
    '.dbg-user-row:hover{background:rgba(236,227,214,.05);}',
    '.dbg-user-row.is-active{background:rgba(219,123,93,.12);}',
    '.dbg-user-av{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;',
    'justify-content:center;font-size:13px;font-weight:600;flex-shrink:0;}',
    '.dbg-user-name{font-size:13px;font-weight:500;margin:0 0 2px;}',
    '.dbg-user-meta{font-size:11px;color:rgba(236,227,214,.45);margin:0;}',
    '.dbg-user-badge{margin-left:auto;font-size:10px;font-weight:600;',
    'padding:2px 8px;border-radius:10px;background:rgba(219,123,93,.25);color:#DB7B5D;}',
    /* Anon row */
    '.dbg-anon-row{display:flex;align-items:center;gap:10px;padding:10px 16px;cursor:pointer;',
    'border-bottom:1px solid rgba(236,227,214,.06);transition:background 120ms;',
    'color:rgba(236,227,214,.5);}',
    '.dbg-anon-row:hover{background:rgba(236,227,214,.05);color:#ECE3D6;}',
    /* Data rows */
    '.dbg-data-row{display:flex;justify-content:space-between;align-items:center;',
    'padding:8px 16px;border-bottom:1px solid rgba(236,227,214,.06);font-size:12px;}',
    '.dbg-data-key{color:rgba(236,227,214,.5);}',
    '.dbg-data-val{color:#DB7B5D;font-family:monospace;font-size:11px;}',
    /* Event log rows */
    '.dbg-ev-row{display:grid;grid-template-columns:70px 140px 36px 1fr;gap:0;',
    'padding:7px 16px;border-bottom:1px solid rgba(236,227,214,.05);font-family:monospace;font-size:11px;}',
    '.dbg-ev-time{color:rgba(236,227,214,.4);}',
    '.dbg-ev-type{color:#DB7B5D;}',
    '.dbg-ev-actor{color:rgba(236,227,214,.5);text-align:center;}',
    '.dbg-ev-body{color:rgba(236,227,214,.7);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
    /* Responsive panel */
    '.dbg-vp-row{display:flex;justify-content:space-between;align-items:center;',
    'padding:10px 16px;border-bottom:1px solid rgba(236,227,214,.06);}',
    '.dbg-vp-label{font-size:12px;color:rgba(236,227,214,.5);}',
    '.dbg-vp-val{font-size:13px;font-family:monospace;color:#ECE3D6;}',
    /* Sim buttons */
    '.dbg-sim-btn{margin:0 16px 8px;padding:8px 14px;background:rgba(236,227,214,.06);',
    'border:1px solid rgba(236,227,214,.12);border-radius:8px;color:#ECE3D6;font-size:13px;',
    'cursor:pointer;text-align:left;transition:background 140ms;display:block;width:calc(100% - 32px);}',
    '.dbg-sim-btn:hover{background:rgba(236,227,214,.1);}',
    /* Footer */
    '.dbg-foot{padding:10px 16px;border-top:1px solid rgba(236,227,214,.1);flex-shrink:0;',
    'display:flex;gap:8px;}',
    '.dbg-foot-btn{padding:5px 12px;background:rgba(236,227,214,.06);border:1px solid rgba(236,227,214,.1);',
    'border-radius:6px;color:rgba(236,227,214,.6);font-size:11px;cursor:pointer;transition:all 140ms;}',
    '.dbg-foot-btn:hover{background:rgba(236,227,214,.1);color:#ECE3D6;}',
  ].join('');

  var USERS = [
    { init:'АИ', bg:'#C1654B', name:'Александра Иванова', email:'a.ivanova@example.com',
      session:{ id:'u1', name:'Александра Иванова', role:'Member', rep:142, avatar:null } },
    { init:'ДО', bg:'#7A4A3A', name:'Дмитрий Орлов',     email:'d.orlov@example.com',
      session:{ id:'u2', name:'Дмитрий Орлов', role:'Professional', rep:412, avatar:null } },
    { init:'МС', bg:'#5A6E7A', name:'Мария Соколова',     email:'m.sokolova@example.com',
      session:{ id:'u3', name:'Мария Соколова', role:'Professional', rep:287, avatar:null } },
    { init:'АП', bg:'#5A6E7A', name:'Алексей Петров',     email:'a.petrov@example.com',
      session:{ id:'u4', name:'Алексей Петров', role:'Member', rep:118, avatar:null } },
    { init:'НК', bg:'#4D7A66', name:'Наталья Кузнецова',  email:'n.kuznetsova@example.com',
      session:{ id:'u5', name:'Наталья Кузнецова', role:'Professional', rep:234, avatar:null } },
  ];

  var BOOKS = [
    { title:'Научение на опыте', slug:'bion', ver:'v1.0', pages:112, reads:7, disc:14 },
    { title:'Гореть вместе',     slug:'nikoli', ver:'v1.1', pages:228, reads:5, disc:8 },
    { title:'Избегание эмоций',  slug:'ferro',  ver:'v1.0', pages:184, reads:3, disc:4 },
  ];

  var EVENTS = [
    { time:'16:44:02', type:'page.viewed',    actor:'АИ', body:'book_id=bion, page=38' },
    { time:'16:43:51', type:'comment.created',actor:'МС', body:'book_id=bion, comment_id=c4' },
    { time:'16:41:30', type:'book.opened',    actor:'ДО', body:'book_id=nikoli, v=1.1' },
    { time:'16:38:07', type:'vote.cast',      actor:'АП', body:'target=comment_c3, weight=2, delta=+2' },
    { time:'16:35:22', type:'page.viewed',    actor:'НК', body:'book_id=bion, page=27' },
    { time:'16:32:11', type:'session.ended',  actor:'АИ', body:'book_id=bion, duration=840s' },
    { time:'16:28:44', type:'review.created', actor:'МС', body:'book_id=nikoli, rating=4' },
    { time:'16:15:03', type:'book.opened',    actor:'АИ', body:'book_id=bion, v=1.0' },
  ];

  var _sidebar = null;
  var _activeTab = 'users';

  function _inject() {
    if (document.getElementById('ba-dbg-css')) return;
    var s = document.createElement('style');
    s.id = 'ba-dbg-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function _usersPanel() {
    var session = window.BA && BA.session ? BA.session.get() : null;
    var currentId = session && session.id;

    var rows = USERS.map(function (u) {
      var active = currentId === u.session.id;
      return [
        '<div class="dbg-user-row' + (active ? ' is-active' : '') + '" data-user-id="' + u.session.id + '">',
          '<div class="dbg-user-av" style="background:' + u.bg + '">' + u.init + '</div>',
          '<div style="min-width:0;flex:1">',
            '<p class="dbg-user-name">' + u.name + '</p>',
            '<p class="dbg-user-meta">' + u.email + ' · ' + u.session.role + ' · ★' + u.session.rep + '</p>',
          '</div>',
          active ? '<span class="dbg-user-badge">Active</span>' : '',
        '</div>'
      ].join('');
    }).join('');

    var anonActive = !currentId;
    return [
      '<p class="dbg-label">Пользователи</p>',
      rows,
      '<div class="dbg-anon-row' + (anonActive ? ' is-active" style="color:#ECE3D6' : '') + '" id="dbg-anon">',
        '<div class="dbg-user-av" style="background:rgba(236,227,214,.12)">?</div>',
        '<div><p class="dbg-user-name">Анонимный</p><p class="dbg-user-meta">Без сессии</p></div>',
        anonActive ? '<span class="dbg-user-badge">Active</span>' : '',
      '</div>',
    ].join('');
  }

  function _dataPanel() {
    var session = window.BA && BA.session ? BA.session.get() : null;
    var theme = document.documentElement.getAttribute('data-theme') || 'light-clear';
    var rows = [
      { k: 'session.id',   v: session ? session.id : '—' },
      { k: 'session.name', v: session ? session.name : '—' },
      { k: 'session.role', v: session ? session.role : '—' },
      { k: 'session.rep',  v: session ? String(session.rep) : '—' },
      { k: 'theme',        v: theme },
      { k: 'viewport',     v: window.innerWidth + ' × ' + window.innerHeight },
      { k: 'books',        v: String(BOOKS.length) },
      { k: 'events',       v: String(EVENTS.length) },
    ];
    var html = '<p class="dbg-label">Данные сессии и платформы</p>';
    rows.forEach(function (r) {
      html += '<div class="dbg-data-row"><span class="dbg-data-key">' + r.k + '</span><span class="dbg-data-val">' + r.v + '</span></div>';
    });

    html += '<p class="dbg-label" style="margin-top:8px">Книги</p>';
    BOOKS.forEach(function (b) {
      html += '<div class="dbg-data-row"><span class="dbg-data-key">' + b.title.slice(0, 20) + '…</span><span class="dbg-data-val">' + b.ver + ' · ' + b.reads + ' читателей</span></div>';
    });
    return html;
  }

  function _eventsPanel() {
    var html = '<p class="dbg-label">Лог событий (' + EVENTS.length + ' записей) · <button id="dbg-open-log" type="button" style="background:none;border:none;color:#DB7B5D;cursor:pointer;font-size:10px;padding:0">Открыть журнал</button></p>';
    EVENTS.forEach(function (ev) {
      html += [
        '<div class="dbg-ev-row">',
          '<span class="dbg-ev-time">' + ev.time + '</span>',
          '<span class="dbg-ev-type">' + ev.type + '</span>',
          '<span class="dbg-ev-actor">' + ev.actor + '</span>',
          '<span class="dbg-ev-body">' + ev.body + '</span>',
        '</div>'
      ].join('');
    });
    return html;
  }

  function _simPanel() {
    var actions = [
      '📖  Открыть книгу (bion, v1.0)',
      '📄  Просмотреть страницу 15',
      '💬  Создать комментарий',
      '⭐  Поставить оценку ★★★★☆',
      '✍️  Создать рецензию',
      '⏱  Завершить сессию (12 мин.)',
    ];
    return '<p class="dbg-label">Симуляция активности</p>' +
      '<p style="font-size:12px;color:rgba(236,227,214,.4);padding:0 16px 12px">Записывает событие в лог и обновляет счётчики.</p>' +
      actions.map(function (a) {
        return '<button class="dbg-sim-btn" type="button">' + a + '</button>';
      }).join('');
  }

  function _cohortsPanel() {
    return [
      '<p class="dbg-label">Когорты</p>',
      '<div class="dbg-data-row"><span class="dbg-data-key">Профессионалы</span><span class="dbg-data-val">3 пользователя · ★ avg 311</span></div>',
      '<div class="dbg-data-row"><span class="dbg-data-key">Участники</span><span class="dbg-data-val">2 пользователя · ★ avg 130</span></div>',
      '<div class="dbg-data-row"><span class="dbg-data-key">Студенты</span><span class="dbg-data-val">0 пользователей</span></div>',
      '<p class="dbg-label" style="margin-top:12px">Репутация</p>',
      USERS.map(function (u) {
        return '<div class="dbg-data-row"><span class="dbg-data-key">' + u.init + ' ' + u.name.split(' ')[0] + '</span><span class="dbg-data-val">★ ' + u.session.rep + '</span></div>';
      }).join(''),
    ].join('');
  }

  function _responsivityPanel() {
    var vw = window.innerWidth, vh = window.innerHeight;
    var bp = vw < 480 ? 'xs (<480)' : vw < 768 ? 'sm (480–767)' : vw < 1024 ? 'md (768–1023)' : 'lg (1024+)';
    return [
      '<p class="dbg-label">Вьюпорт</p>',
      '<div class="dbg-vp-row"><span class="dbg-vp-label">Ширина</span><span class="dbg-vp-val">' + vw + 'px</span></div>',
      '<div class="dbg-vp-row"><span class="dbg-vp-label">Высота</span><span class="dbg-vp-val">' + vh + 'px</span></div>',
      '<div class="dbg-vp-row"><span class="dbg-vp-label">Breakpoint</span><span class="dbg-vp-val">' + bp + '</span></div>',
      '<div class="dbg-vp-row"><span class="dbg-vp-label">devicePixelRatio</span><span class="dbg-vp-val">' + (window.devicePixelRatio || 1).toFixed(1) + '</span></div>',
      '<div class="dbg-vp-row"><span class="dbg-vp-label">Тема</span><span class="dbg-vp-val">' + (document.documentElement.getAttribute('data-theme') || 'light-clear') + '</span></div>',
      '<p class="dbg-label" style="margin-top:8px">Переключить тему</p>',
      '<div style="display:flex;gap:8px;padding:0 16px 12px">',
        ['light-clear','sepia-contrast','night'].map(function (t) {
          return '<button class="dbg-foot-btn" data-set-theme="' + t + '">' + t + '</button>';
        }).join(''),
      '</div>',
    ].join('');
  }

  var TABS = [
    { id:'users', label:'👤 Польз.' },
    { id:'cohorts', label:'👥 Когорты' },
    { id:'simulation', label:'⚡ Сим.' },
    { id:'data', label:'📋 Данные' },
    { id:'events', label:'📡 События' },
    { id:'responsivity', label:'📐 Адаптив' },
  ];

  function _panelHTML(id) {
    switch (id) {
      case 'users':       return _usersPanel();
      case 'cohorts':     return _cohortsPanel();
      case 'simulation':  return _simPanel();
      case 'data':        return _dataPanel();
      case 'events':      return _eventsPanel();
      case 'responsivity':return _responsivityPanel();
    }
    return '';
  }

  function _switchTab(id) {
    _activeTab = id;
    _sidebar.querySelectorAll('.dbg-tab').forEach(function (t) {
      t.classList.toggle('is-active', t.getAttribute('data-tab') === id);
    });
    var panel = _sidebar.querySelector('.dbg-panel.is-active');
    if (panel) panel.classList.remove('is-active');
    var newPanel = _sidebar.querySelector('.dbg-panel[data-panel="' + id + '"]');
    if (newPanel) {
      newPanel.innerHTML = _panelHTML(id);
      newPanel.classList.add('is-active');
      _wirePanel(newPanel, id);
    }
  }

  function _wirePanel(panel, id) {
    if (id === 'users') {
      panel.querySelectorAll('.dbg-user-row').forEach(function (row) {
        row.addEventListener('click', function () {
          var uid = row.getAttribute('data-user-id');
          var user = USERS.filter(function (u) { return u.session.id === uid; })[0];
          if (user && window.BA && BA.session) BA.session.set(user.session);
          _switchTab('users'); // re-render to update badge
        });
      });
      var anonRow = panel.querySelector('#dbg-anon');
      if (anonRow) anonRow.addEventListener('click', function () {
        if (window.BA && BA.session) BA.session.clear();
        _switchTab('users');
      });
    }
    if (id === 'events') {
      var logBtn = panel.querySelector('#dbg-open-log');
      if (logBtn) logBtn.addEventListener('click', function () {
        if (window.BA && BA.logging) BA.logging.open();
      });
    }
    if (id === 'responsivity') {
      panel.querySelectorAll('[data-set-theme]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var t = btn.getAttribute('data-set-theme');
          document.documentElement.setAttribute('data-theme', t);
          try { localStorage.setItem('ba-theme', t); } catch (e) {}
          _switchTab('responsivity');
        });
      });
    }
    if (id === 'simulation') {
      panel.querySelectorAll('.dbg-sim-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          btn.style.opacity = '.4';
          setTimeout(function () { btn.style.opacity = ''; }, 600);
        });
      });
    }
  }

  function _build() {
    if (_sidebar) return;
    _inject();

    _sidebar = document.createElement('div');
    _sidebar.className = 'dbg-sidebar';
    _sidebar.setAttribute('role', 'complementary');
    _sidebar.setAttribute('aria-label', 'Debug console');

    var tabHtml = TABS.map(function (t) {
      return '<button class="dbg-tab' + (t.id === _activeTab ? ' is-active' : '') + '" data-tab="' + t.id + '" type="button">' + t.label + '</button>';
    }).join('');

    var panelHtml = TABS.map(function (t) {
      return '<div class="dbg-panel' + (t.id === _activeTab ? ' is-active' : '') + '" data-panel="' + t.id + '"></div>';
    }).join('');

    _sidebar.innerHTML = [
      '<div class="dbg-topbar">',
        '<span class="dbg-title">⚙ Debug Console</span>',
        '<button class="dbg-close" id="dbg-close" type="button" aria-label="Закрыть консоль">✕</button>',
      '</div>',
      '<div class="dbg-tabs">' + tabHtml + '</div>',
      panelHtml,
      '<div class="dbg-foot">',
        '<button class="dbg-foot-btn" id="dbg-reload" type="button">↺ Перезагрузить</button>',
        '<button class="dbg-foot-btn" id="dbg-clear-session" type="button">Очистить сессию</button>',
        '<button class="dbg-foot-btn" id="dbg-show-log" type="button">📡 Журнал</button>',
      '</div>',
    ].join('');

    document.body.appendChild(_sidebar);

    // Render initial tab
    _switchTab(_activeTab);

    // Tab switching
    _sidebar.querySelectorAll('.dbg-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        _switchTab(tab.getAttribute('data-tab'));
      });
    });

    _sidebar.querySelector('#dbg-close').addEventListener('click', BA.debug.close);
    _sidebar.querySelector('#dbg-reload').addEventListener('click', function () { location.reload(); });
    _sidebar.querySelector('#dbg-clear-session').addEventListener('click', function () {
      if (window.BA && BA.session) BA.session.clear();
      _switchTab('users');
    });
    _sidebar.querySelector('#dbg-show-log').addEventListener('click', function () {
      if (window.BA && BA.logging) BA.logging.open();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && _sidebar && _sidebar.classList.contains('is-open')) BA.debug.close();
    });

    // Re-render active tab on session change
    document.addEventListener('ba:session-change', function () {
      if (_sidebar && _sidebar.classList.contains('is-open')) {
        _switchTab(_activeTab);
      }
    });
  }

  window.BA.debug = {
    open: function () {
      _build();
      _sidebar.classList.add('is-open');
      _switchTab(_activeTab); // refresh data
    },
    close: function () {
      if (_sidebar) _sidebar.classList.remove('is-open');
    }
  };
})();

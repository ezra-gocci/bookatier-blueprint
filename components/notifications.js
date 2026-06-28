/* components/notifications.js — Notifications dropdown
   BA.notifications.init(bellEl) — called by frame.js for private header
   BA.notifications.open() / .close() / .toggle() */
(function () {
  'use strict';
  window.BA = window.BA || {};

  var NOTIF_DATA = [
    { icon: '💬', cls: 'reply', group: 'comment',
      text: '<strong>Мария Соколова</strong> ответила на ваш комментарий в «Научение на опыте»',
      excerpt: '«Согласна с этим. Именно неопределённость понятия даёт ему клиническую жизнь…»',
      time: '15 мин.', read: false },
    { icon: '⭐', cls: 'vote', group: 'rating',
      text: '<strong>Дмитрий Орлов</strong> и ещё 4 поддержали ваш комментарий',
      excerpt: '«Четвёртый семинар — самый живой. Бион отвечает…»',
      time: '2 ч.', read: false },
    { icon: '📚', cls: 'edition', group: 'update',
      text: 'Новая версия «Гореть вместе» — v1.1',
      excerpt: 'Исправлены опечатки в главах 3 и 7.',
      time: '4 ч.', read: true },
    { icon: '⭐', cls: 'vote', group: 'rating',
      text: '<strong>Наталья Кузнецова</strong> поддержала ваш комментарий',
      excerpt: '',
      time: 'вчера', read: true },
  ];

  var CSS = [
    '.ba-notif-anchor{right:24px;}',
    '.notif-panel{position:absolute;top:calc(100% + 8px);right:0;z-index:var(--z-dropdown,700);',
    'width:340px;background:var(--paper,#F5EFE4);',
    'border:1px solid var(--line,rgba(26,20,16,.12));border-radius:12px;',
    'box-shadow:0 8px 32px rgba(0,0,0,.14);overflow:hidden;',
    'opacity:0;transform:translateY(-6px);pointer-events:none;',
    'transition:opacity 180ms var(--ease-out-quart,cubic-bezier(.25,.46,.45,.94)),',
    'transform 180ms var(--ease-out-quart,cubic-bezier(.25,.46,.45,.94));}',
    '.notif-panel.is-open{opacity:1;transform:translateY(0);pointer-events:auto;}',
    '.notif-head{padding:14px 16px;border-bottom:1px solid var(--line,rgba(26,20,16,.1));',
    'display:flex;align-items:center;}',
    '.notif-head-title{font-weight:600;font-size:14px;flex:1;}',
    '.notif-clear{background:none;border:none;font-size:12px;color:var(--accent,#C1654B);cursor:pointer;padding:0;}',
    '.notif-body{max-height:320px;overflow-y:auto;}',
    '.notif-item{display:flex;gap:10px;padding:12px 16px;cursor:pointer;',
    'border-bottom:1px solid var(--line,rgba(26,20,16,.06));transition:background 140ms;}',
    '.notif-item:hover{background:var(--surface-sunk,rgba(26,20,16,.04));}',
    '.notif-item:last-child{border-bottom:none;}',
    '.notif-item.is-unread{background:color-mix(in srgb,var(--accent,#C1654B) 5%,transparent);}',
    '.notif-icon{width:32px;height:32px;border-radius:50%;background:var(--surface-sunk,rgba(26,20,16,.06));',
    'display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;margin-top:1px;}',
    '.notif-text{font-size:13px;line-height:1.45;color:var(--ink);margin:0 0 3px;}',
    '.notif-excerpt{font-size:12px;color:var(--ink-faint);margin:0 0 3px;',
    'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
    '.notif-time{font-size:11px;color:var(--ink-faint);}',
    '.notif-foot{padding:10px 16px;border-top:1px solid var(--line,rgba(26,20,16,.1));text-align:center;}',
    '.notif-foot a{font-size:13px;color:var(--accent,#C1654B);text-decoration:none;}',
    '.notif-foot a:hover{text-decoration:underline;}',
  ].join('');

  var _panel = null;
  var _anchor = null;
  var _items = NOTIF_DATA.slice(); // mutable copy

  function _inject() {
    if (document.getElementById('ba-notif-css')) return;
    var s = document.createElement('style');
    s.id = 'ba-notif-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function _build(anchorEl) {
    _inject();
    if (_panel) { _panel.remove(); }

    _panel = document.createElement('div');
    _panel.className = 'notif-panel';
    _panel.setAttribute('role', 'dialog');
    _panel.setAttribute('aria-label', 'Уведомления');

    var itemsHtml = _items.map(function (n, i) {
      return [
        '<div class="notif-item' + (n.read ? '' : ' is-unread') + '" data-notif-idx="' + i + '" data-group="' + (n.group || '') + '">',
          '<div class="notif-icon">' + n.icon + '</div>',
          '<div style="flex:1;min-width:0;">',
            '<p class="notif-text">' + n.text + '</p>',
            n.excerpt ? '<p class="notif-excerpt">' + n.excerpt + '</p>' : '',
            '<p class="notif-time">' + n.time + ' назад</p>',
          '</div>',
        '</div>'
      ].join('');
    }).join('');

    _panel.innerHTML = [
      '<div class="notif-head">',
        '<span class="notif-head-title">Уведомления</span>',
        '<button class="notif-clear" type="button" id="notif-clear-btn">Отметить все прочитанными</button>',
      '</div>',
      '<div class="notif-body" id="notif-body">' + itemsHtml + '</div>',
      '<div class="notif-foot"><a href="../pages/notifications.html">Все уведомления</a></div>',
    ].join('');

    anchorEl.style.position = 'relative';
    anchorEl.appendChild(_panel);

    _panel.querySelector('#notif-clear-btn').addEventListener('click', function (e) {
      e.stopPropagation();
      _items.forEach(function (n) { n.read = true; });
      _panel.querySelectorAll('.notif-item').forEach(function (el) { el.classList.remove('is-unread'); });
      // Hide badge
      var badge = anchorEl.querySelector('.notif-count');
      if (badge) badge.style.display = 'none';
    });

    // Click item to mark read
    _panel.querySelector('#notif-body').addEventListener('click', function (e) {
      var item = e.target.closest('.notif-item');
      if (!item) return;
      var idx = parseInt(item.getAttribute('data-notif-idx'), 10);
      if (!isNaN(idx)) { _items[idx].read = true; item.classList.remove('is-unread'); }
    });

    document.addEventListener('click', function (e) {
      if (_panel && _panel.classList.contains('is-open')) {
        if (!anchorEl.contains(e.target)) {
          _panel.classList.remove('is-open');
          anchorEl.setAttribute('aria-expanded', 'false');
        }
      }
    });

    _applyFilter(); // honour the Pulse filter's per-group notif flags
  }

  /* Interconnection with Pulse: a group is shown in notifications only when its
     bell toggle (in the Pulse filter) is on. */
  function _notifAllowed(group) {
    var groups = (window.BA && BA.pulse && BA.pulse.groups) ? BA.pulse.groups() : null;
    if (!groups || !group) return true;
    for (var i = 0; i < groups.length; i++) {
      if (groups[i].id === group) return !!groups[i].notif;
    }
    return true;
  }

  function _applyFilter() {
    if (!_panel) return;
    _panel.querySelectorAll('.notif-item[data-group]').forEach(function (el) {
      el.style.display = _notifAllowed(el.getAttribute('data-group')) ? '' : 'none';
    });
    _updateCount();
  }

  function _updateCount() {
    if (!_panel) return;
    var count = 0;
    _panel.querySelectorAll('.notif-item').forEach(function (el) {
      if (el.style.display !== 'none') count++;
    });
    if (_anchor) {
      var badge = _anchor.querySelector('.notif-count');
      if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? '' : 'none';
      }
    }
    // Avatar badge — visible only in narrow mode (CSS gates on .has-notifs).
    var avBadge = document.querySelector('.ba-avatar-notif');
    if (avBadge) {
      avBadge.textContent = count;
      avBadge.classList.toggle('has-notifs', count > 0);
    }
    var title = _panel.querySelector('.notif-head-title');
    if (title) title.textContent = count > 0 ? 'Уведомления · ' + count : 'Уведомления';
  }

  // Re-filter live when the Pulse filter's bell toggles change
  document.addEventListener('ba:pulse-filter-change', function () { _applyFilter(); });

  window.BA.notifications = {
    init: function (bellEl) {
      _anchor = bellEl;
      _build(bellEl);

      bellEl.addEventListener('click', function (e) {
        e.stopPropagation();
        BA.notifications.toggle();
      });
    },
    open: function () {
      if (!_panel) {
        // Standalone open without bell anchor (demo page usage)
        var anchor = document.createElement('div');
        anchor.className = 'ba-notif-anchor';
        anchor.style.cssText = 'position:fixed;top:60px;z-index:800;';
        document.body.appendChild(anchor);
        _build(anchor);
        _anchor = anchor;
      }
      _applyFilter();
      _panel.classList.add('is-open');
      if (_anchor) _anchor.setAttribute('aria-expanded', 'true');
    },
    close: function () {
      if (!_panel) return;
      _panel.classList.remove('is-open');
      if (_anchor) _anchor.setAttribute('aria-expanded', 'false');
    },
    toggle: function () {
      if (_panel && _panel.classList.contains('is-open')) {
        BA.notifications.close();
      } else {
        BA.notifications.open();
      }
    }
  };
})();

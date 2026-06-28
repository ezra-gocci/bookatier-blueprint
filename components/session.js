/* components/session.js — Auth state helper
   window.BA.session — pure utility, no DOM.
   Fires ba:session-change on document after every set/clear. */
(function () {
  'use strict';
  window.BA = window.BA || {};
  var KEY = 'ba_session';

  window.BA.session = {
    get: function () {
      try {
        var raw = sessionStorage.getItem(KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (e) { return null; }
    },
    set: function (userObj) {
      try { sessionStorage.setItem(KEY, JSON.stringify(userObj)); } catch (e) {}
      document.dispatchEvent(new CustomEvent('ba:session-change', { bubbles: true }));
    },
    clear: function () {
      try { sessionStorage.removeItem(KEY); } catch (e) {}
      document.dispatchEvent(new CustomEvent('ba:session-change', { bubbles: true }));
    },
    isPrivate: function () { return !!this.get(); }
  };

  /* Per-user localStorage. Every saved preference / piece of user data is
     namespaced under the CURRENT user's id, so each user keeps their own theme,
     page size, reader state, events, etc. The logged-out visitor is a first-class
     user too — "anonym". Debug-console chrome keys (ba-dbg-docked / -edge / -mode /
     -open / -tab / -width) stay GLOBAL on purpose: that is the operator's tool
     layout, not user data, and should survive user switches and «Очистить сессию». */
  function _uid() {
    var s = window.BA.session.get();
    return (s && s.id) ? String(s.id) : 'anonym';
  }
  window.BA.store = {
    uid: _uid,
    key: function (k) { return 'ba:u:' + _uid() + ':' + k; },
    get: function (k) { try { return localStorage.getItem(this.key(k)); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(this.key(k), v); } catch (e) {} },
    remove: function (k) { try { localStorage.removeItem(this.key(k)); } catch (e) {} },
    /* Wipe every key belonging to the current user (used by «Очистить сессию»). */
    clear: function () {
      try {
        var pre = 'ba:u:' + _uid() + ':', doomed = [];
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k && k.indexOf(pre) === 0) doomed.push(k);
        }
        doomed.forEach(function (k) { localStorage.removeItem(k); });
      } catch (e) {}
    }
  };

  /* Default UI theme: "bright" (light-clear) unless this user picked another.
     Re-applied on every session change so each user gets their own theme. */
  function _applyTheme() {
    try {
      document.documentElement.setAttribute('data-theme', window.BA.store.get('ba-theme') || 'light-clear');
    } catch (e) {}
  }
  _applyTheme();
  document.addEventListener('ba:session-change', _applyTheme);

  /* Avatar picture set (extracted to assets/avatars/) — humans + animals.
     Each user/author gets a RANDOM avatar from the full pool, re-rolled on every
     page load (the assignment lives only in memory, never persisted), but kept
     stable within a single page so the same seed shows the same face everywhere. */
  var AV_THEMES = { human: 20, cat: 20, owl: 10 };
  var _allAvatars = (function () {
    var list = [];
    Object.keys(AV_THEMES).forEach(function (t) {
      for (var i = 1; i <= AV_THEMES[t]; i++) list.push(t + '-' + (i < 10 ? '0' : '') + i + '.webp');
    });
    return list;
  })();
  /* Asset root for avatar URLs. When a <base href> is present (e.g. the 404
     page, or GitHub Pages), it IS the site root where assets/ lives — use it,
     since relative `../` would otherwise resolve against the base and break.
     Without a base href, fall back to a path relative to the current page. */
  function _base() {
    var b = document.querySelector('base');
    if (b && b.getAttribute('href')) return b.getAttribute('href');
    return /\/pages\//.test(location.pathname) ? '../' : './';
  }
  var _assign = {};   // seed -> filename (this page load only)
  var _used = {};     // filename -> true, to spread picks before repeating
  function _randomAvatar() {
    var pool = _allAvatars.filter(function (f) { return !_used[f]; });
    if (!pool.length) pool = _allAvatars; // all used → allow repeats
    var f = pool[Math.floor(Math.random() * pool.length)];
    _used[f] = true;
    return f;
  }
  window.BA.avatars = {
    url: function (filename) { return _base() + 'assets/avatars/' + filename; },
    pick: function (seed) {
      var key = String(seed == null ? '' : seed);
      if (!(key in _assign)) _assign[key] = _randomAvatar();
      return this.url(_assign[key]);
    }
  };
})();

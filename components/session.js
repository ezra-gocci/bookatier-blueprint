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
})();

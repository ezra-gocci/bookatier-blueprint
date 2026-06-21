/* theme-init.js — runs synchronously in <head> to prevent FOUC on theme switch */
(function () {
  try {
    var t = localStorage.getItem('ba-theme');
    var theme = (t === 'light-clear' || t === 'sepia-contrast' || t === 'night') ? t : 'light-clear';
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {}
})();

/* components/registration.js — Registration overlay modal
   BA.registration.open() / .close()
   Intent-capture only — no real account created in Primer. */
(function () {
  'use strict';
  window.BA = window.BA || {};

  var CSS = [
    '.reg-backdrop{position:fixed;inset:0;z-index:820;background:rgba(20,16,12,.55);',
    'backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;',
    'opacity:0;pointer-events:none;transition:opacity 200ms;}',
    '.reg-backdrop.is-open{opacity:1;pointer-events:auto;}',
    '.reg-card{position:relative;background:var(--paper,#F5EFE4);border-radius:16px;',
    'width:440px;max-width:calc(100vw - 32px);max-height:90vh;overflow-y:auto;',
    'padding:40px;box-shadow:0 24px 64px rgba(0,0,0,.2);',
    'transform:translateY(16px);transition:transform 250ms var(--ease-out-quart,cubic-bezier(.25,.46,.45,.94));}',
    '.reg-backdrop.is-open .reg-card{transform:translateY(0);}',
    '.reg-field{margin-bottom:20px;}',
    '.reg-field label{display:block;font-size:13px;font-weight:500;margin-bottom:6px;color:var(--ink,#1A1410);}',
    '.reg-field input,.reg-field select{width:100%;box-sizing:border-box;padding:9px 13px;',
    'border:1px solid var(--line,rgba(26,20,16,.15));border-radius:8px;',
    'background:var(--paper,#F5EFE4);color:var(--ink,#1A1410);font-size:15px;font-family:inherit;}',
    '.reg-field input:focus,.reg-field select:focus{outline:2px solid var(--accent,#C1654B);outline-offset:2px;}',
    '.reg-success{text-align:center;padding:20px 0;}',
    '.reg-success-seal{font-size:48px;margin-bottom:16px;}',
    '.reg-close{position:absolute;top:16px;right:16px;background:none;border:none;',
    'font-size:20px;color:var(--ink-faint,rgba(26,20,16,.4));cursor:pointer;line-height:1;padding:4px;}',
  ].join('');

  var ROLES = ['Психоаналитик','Психотерапевт','Супервизор','Аналитик','Студент','Интересующийся'];

  var _el = null;

  function _inject() {
    if (document.getElementById('ba-reg-css')) return;
    var s = document.createElement('style');
    s.id = 'ba-reg-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function _build() {
    if (_el) return;
    _inject();

    _el = document.createElement('div');
    _el.className = 'reg-backdrop';
    _el.setAttribute('role', 'dialog');
    _el.setAttribute('aria-modal', 'true');
    _el.setAttribute('aria-labelledby', 'reg-title');
    _el.setAttribute('aria-hidden', 'true');

    var roleOptions = ROLES.map(function (r) {
      return '<option value="' + r + '">' + r + '</option>';
    }).join('');

    _el.innerHTML = [
      '<div class="reg-card">',
        '<button class="reg-close" type="button" aria-label="Закрыть">×</button>',
        '<div style="text-align:center;margin-bottom:28px">',
          '<div style="font-family:var(--font-serif);font-size:28px;color:var(--ink)">β<span style="color:var(--accent)">→</span>α</div>',
          '<h2 id="reg-title" style="margin:8px 0 4px;font-size:20px;font-weight:600">Присоединиться</h2>',
          '<p style="margin:0;font-size:13px;color:var(--ink-faint)">Заявка на участие в сообществе</p>',
        '</div>',
        '<form id="reg-form" novalidate>',
          '<div class="reg-field">',
            '<label for="reg-name">Полное имя</label>',
            '<input id="reg-name" type="text" placeholder="Имя Фамилия" autocomplete="name" required>',
          '</div>',
          '<div class="reg-field">',
            '<label for="reg-email">Эл. почта</label>',
            '<input id="reg-email" type="email" placeholder="вы@пример.ru" autocomplete="email" required>',
          '</div>',
          '<div class="reg-field">',
            '<label for="reg-role">Роль</label>',
            '<select id="reg-role"><option value="">— выберите —</option>' + roleOptions + '</select>',
          '</div>',
          '<div class="reg-field">',
            '<label for="reg-spec">Специализация <span style="font-weight:400;color:var(--ink-faint)">(необязательно)</span></label>',
            '<input id="reg-spec" type="text" placeholder="Направление, подход, учреждение…">',
          '</div>',
          '<button type="submit" class="btn btn-primary" style="width:100%;margin-top:8px">Отправить заявку</button>',
        '</form>',
        '<div class="reg-success" id="reg-success" style="display:none">',
          '<div class="reg-success-seal">✓</div>',
          '<h3 style="margin:0 0 8px;font-size:18px">Заявка принята</h3>',
          '<p style="margin:0;font-size:14px;color:var(--ink-faint)">Мы свяжемся с вами по электронной почте в течение 1–2 рабочих дней.</p>',
          '<button class="btn btn-ghost" type="button" id="reg-done" style="margin-top:24px">Закрыть</button>',
        '</div>',
      '</div>'
    ].join('');

    document.body.appendChild(_el);

    _el.querySelector('.reg-close').addEventListener('click', BA.registration.close);
    _el.addEventListener('click', function (e) { if (e.target === _el) BA.registration.close(); });

    /* B-4: intent capture only — no account is created; on submit, record the
       RegistrationSubmission (specs §1.2) and open Login (not success+autoclose),
       since accounts remain debug-managed in the Primer (§3.1). */
    _el.querySelector('#reg-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var st = window.BA && BA.store;
      if (st && st.insert) st.insert('registrationSubmissions', {
        id: st.uuid(), name: (_el.querySelector('#reg-name').value || ''),
        email: (_el.querySelector('#reg-email').value || ''),
        message: (_el.querySelector('#reg-role').value || '') + ' · ' + (_el.querySelector('#reg-spec').value || ''),
        createdAt: st.nowISO()
      });
      BA.registration.close();
      if (BA.frame && BA.frame.showToast) BA.frame.showToast('Заявка принята — войдите, чтобы продолжить');
      if (BA.frame && BA.frame.openLogin) setTimeout(BA.frame.openLogin, 280);
    });

    _el.querySelector('#reg-done').addEventListener('click', BA.registration.close);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && _el && _el.classList.contains('is-open')) BA.registration.close();
    });
  }

  window.BA.registration = {
    open: function () {
      _build();
      // Reset form if previously submitted
      var form = _el.querySelector('#reg-form');
      var success = _el.querySelector('#reg-success');
      if (form && success) { form.style.display = ''; success.style.display = 'none'; form.reset(); }
      _el.classList.add('is-open');
      _el.setAttribute('aria-hidden', 'false');
      var first = _el.querySelector('input');
      if (first) setTimeout(function () { first.focus(); }, 50);
    },
    close: function () {
      if (!_el) return;
      _el.classList.remove('is-open');
      _el.setAttribute('aria-hidden', 'true');
    }
  };
})();

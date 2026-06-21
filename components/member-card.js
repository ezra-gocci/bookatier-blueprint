/* components/member-card.js — Member profile card overlay
   BA.memberCard.open(userId) / .close()
   Public: card opens but «Написать» is disabled. */
(function () {
  'use strict';
  window.BA = window.BA || {};

  var CSS = [
    '.mc-backdrop{position:fixed;inset:0;z-index:810;background:rgba(20,16,12,.55);',
    'backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;',
    'opacity:0;pointer-events:none;transition:opacity 200ms;}',
    '.mc-backdrop.is-open{opacity:1;pointer-events:auto;}',
    '.mc-card{position:relative;background:var(--paper,#F5EFE4);border-radius:16px;',
    'width:480px;max-width:calc(100vw - 32px);max-height:88vh;overflow-y:auto;',
    'box-shadow:0 24px 64px rgba(0,0,0,.2);',
    'transform:translateY(16px);transition:transform 250ms var(--ease-out-quart,cubic-bezier(.25,.46,.45,.94));}',
    '.mc-backdrop.is-open .mc-card{transform:translateY(0);}',
    '.mc-hero{padding:32px;border-bottom:1px solid var(--line,rgba(26,20,16,.1));display:flex;gap:20px;align-items:flex-start;}',
    '.mc-face{width:64px;height:64px;border-radius:50%;display:flex;align-items:center;justify-content:center;',
    'font-family:var(--font-serif);font-size:22px;color:#ECE3D6;flex-shrink:0;}',
    '.mc-info{flex:1;min-width:0;}',
    '.mc-name{font-family:var(--font-serif);font-size:20px;font-weight:600;color:var(--ink);margin:0 0 4px;}',
    '.mc-role-badge{display:inline-block;font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;',
    'padding:2px 8px;border-radius:20px;background:var(--surface-sunk,rgba(26,20,16,.06));color:var(--ink-faint);}',
    '.mc-rep{font-size:13px;color:var(--amber,#C49A3E);margin:6px 0 0;font-weight:500;}',
    '.mc-body{padding:24px 32px;}',
    '.mc-section-title{font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;',
    'color:var(--ink-faint);margin:0 0 10px;}',
    '.mc-bio{font-size:14px;line-height:1.7;color:var(--ink);margin:0 0 24px;}',
    '.mc-activity{list-style:none;padding:0;margin:0 0 24px;}',
    '.mc-activity-item{display:flex;gap:10px;padding:10px 0;border-bottom:1px solid var(--line,rgba(26,20,16,.08));',
    'font-size:13px;color:var(--ink);}',
    '.mc-activity-item:last-child{border-bottom:none;}',
    '.mc-activity-icon{width:28px;height:28px;border-radius:50%;background:var(--surface-sunk);',
    'display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;}',
    '.mc-activity-time{font-size:11px;color:var(--ink-faint);margin-top:2px;}',
    '.mc-footer{padding:0 32px 28px;}',
    '.mc-close{position:absolute;top:16px;right:16px;background:none;border:none;',
    'font-size:20px;color:var(--ink-faint);cursor:pointer;line-height:1;padding:4px;}',
  ].join('');

  var MEMBERS = {
    u1: {
      init: 'АИ', bg: 'var(--accent,#C1654B)',
      name: 'Александра Иванова', role: 'Участник', rep: 142,
      bio: 'Психолог-консультант, работаю в краткосрочных подходах. Интересуюсь пограничными состояниями и теорией привязанности. Читаю Биона и Вингхэма.',
      activity: [
        { icon: '💬', text: 'Прокомментировала «Научение на опыте»', time: '15 мин. назад' },
        { icon: '⭐', text: 'Оценила «Гореть вместе» — ★★★★★', time: '2 ч. назад' },
        { icon: '📖', text: 'Читает «Научение на опыте», стр. 38', time: '3 ч. назад' },
      ]
    },
    u2: {
      init: 'БК', bg: '#7A4A3A',
      name: 'Борис Краснов', role: 'Участник', rep: 67,
      bio: 'Начинающий практик, прохожу личную терапию. Читаю Кляйн и Биона. Ищу супервизора.',
      activity: [
        { icon: '📖', text: 'Начал читать «Итальянские семинары»', time: '1 ч. назад' },
        { icon: '💬', text: 'Задал вопрос в обсуждении «Гореть вместе»', time: '1 д. назад' },
        { icon: '⭐', text: 'Оценил «Научение на опыте» — ★★★★☆', time: '3 д. назад' },
      ]
    },
    u3: {
      init: 'МС', bg: 'var(--slate,#5A6E7A)',
      name: 'Мария Соколова', role: 'Профессионал', rep: 287,
      bio: 'Психоаналитик, 12 лет практики. Работаю с взрослыми в классической технике. Супервизирую аналитиков первого года.',
      activity: [
        { icon: '✍️', text: 'Написала рецензию на «Гореть вместе»', time: '2 ч. назад' },
        { icon: '💬', text: 'Ответила на комментарий Александры', time: '15 мин. назад' },
        { icon: '📖', text: 'Читает «Избегание эмоций»', time: '4 ч. назад' },
      ]
    }
  };

  var _el = null;

  function _inject() {
    if (document.getElementById('ba-mc-css')) return;
    var s = document.createElement('style');
    s.id = 'ba-mc-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function _build() {
    if (_el) return;
    _inject();
    _el = document.createElement('div');
    _el.className = 'mc-backdrop';
    _el.setAttribute('role', 'dialog');
    _el.setAttribute('aria-modal', 'true');
    _el.setAttribute('aria-hidden', 'true');
    _el.innerHTML = '<div class="mc-card"><button class="mc-close" type="button" aria-label="Закрыть">×</button><div id="mc-content"></div></div>';
    document.body.appendChild(_el);
    _el.querySelector('.mc-close').addEventListener('click', BA.memberCard.close);
    _el.addEventListener('click', function (e) { if (e.target === _el) BA.memberCard.close(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && _el && _el.classList.contains('is-open')) BA.memberCard.close();
    });
  }

  function _render(member) {
    var priv = window.BA && BA.session && BA.session.isPrivate();
    var actItems = member.activity.map(function (a) {
      return [
        '<li class="mc-activity-item">',
          '<span class="mc-activity-icon">' + a.icon + '</span>',
          '<div><div>' + a.text + '</div><div class="mc-activity-time">' + a.time + '</div></div>',
        '</li>'
      ].join('');
    }).join('');

    var msgDisabled = !priv ? ' disabled title="Войдите, чтобы написать"' : '';
    var msgStyle = !priv ? 'opacity:.45;cursor:not-allowed;' : '';

    return [
      '<div class="mc-hero">',
        '<div class="mc-face" style="background:' + member.bg + '" aria-hidden="true">' + member.init + '</div>',
        '<div class="mc-info">',
          '<h2 class="mc-name">' + member.name + '</h2>',
          '<span class="mc-role-badge">' + member.role + '</span>',
          '<p class="mc-rep">★ ' + member.rep + ' · репутация</p>',
        '</div>',
      '</div>',
      '<div class="mc-body">',
        '<p class="mc-section-title">О себе</p>',
        '<p class="mc-bio">' + member.bio + '</p>',
        '<p class="mc-section-title">Недавняя активность</p>',
        '<ul class="mc-activity">' + actItems + '</ul>',
      '</div>',
      '<div class="mc-footer">',
        '<button class="btn btn-primary" type="button"' + msgDisabled + ' style="width:100%;' + msgStyle + '">',
          priv ? '✉ Написать сообщение' : '✉ Написать (требуется вход)',
        '</button>',
      '</div>'
    ].join('');
  }

  window.BA.memberCard = {
    open: function (userId) {
      var member = MEMBERS[userId] || MEMBERS['u2'];
      _build();
      _el.querySelector('#mc-content').innerHTML = _render(member);
      _el.setAttribute('aria-label', 'Профиль: ' + member.name);
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

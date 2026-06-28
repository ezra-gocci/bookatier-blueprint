/* components/member-card.js — Member profile card overlay
   BA.memberCard.open(userId) / .close()

   Mirrors the Author card: a RIGHT-EDGE-DOCKED drawer (slides in from the
   right, dims the page, closes on backdrop-click / Esc), single-scroll info
   column on the left, and a full-height avatar "portrait" panel on the right
   edge (the member's colour + initials). Public: «Написать» is disabled. */
(function () {
  'use strict';
  window.BA = window.BA || {};

  var CSS = [
    /* Backdrop */
    '.mc-backdrop{position:fixed;inset:0;z-index:810;background:rgba(20,16,12,.42);',
    'opacity:0;pointer-events:none;transition:opacity 200ms var(--ease-out-quart,cubic-bezier(.25,1,.5,1));}',
    '.mc-backdrop.is-open{opacity:1;pointer-events:auto;}',
    /* Drawer — docked right */
    '.mc-drawer{position:fixed;top:0;right:0;bottom:0;z-index:811;',
    'width:min(620px,40vw);display:flex;flex-direction:row;background:var(--surface);',
    'border-left:var(--hairline,1px) solid var(--line);box-shadow:-12px 0 48px rgba(20,16,12,.18);',
    'overflow:hidden;transform:translateX(100%);',
    'transition:transform 280ms var(--ease-out-quart,cubic-bezier(.25,1,.5,1));}',
    '.mc-drawer.is-open{transform:translateX(0);}',
    /* Scroll column */
    '.mc-scroll{flex:1;min-width:0;overflow-y:auto;overflow-x:hidden;}',
    /* Avatar portrait panel — full-height, full-bleed on the right edge */
    '.mc-photo-col{flex-shrink:0;width:118px;position:relative;overflow:hidden;',
    'border-left:var(--hairline,1px) solid var(--line);',
    'display:flex;align-items:center;justify-content:center;}',
    '.mc-monogram{font-family:var(--font-serif);font-size:48px;font-weight:600;',
    'letter-spacing:.02em;color:#F3ECE0;}',
    '.mc-photo{width:100%;height:100%;object-fit:cover;object-position:center;display:block;}',
    /* Hero */
    '.mc-hero{padding:var(--space-8,32px) var(--space-6,24px) var(--space-4,16px);',
    'display:flex;align-items:center;gap:var(--space-4,16px);}',
    '.mc-hero-av{width:80px;height:80px;border-radius:50%;object-fit:cover;object-position:center;',
    'flex-shrink:0;border:2px solid var(--line,rgba(26,20,16,.12));background:var(--surface-sunk);}',
    '.mc-hero-text{min-width:0;}',
    '.mc-eyebrow{font-family:var(--font-sans);font-size:var(--fs-caption,12px);font-weight:600;',
    'letter-spacing:.06em;text-transform:uppercase;color:var(--ink-faint);margin:0 0 var(--space-2,8px);}',
    '.mc-name{font-family:var(--font-serif);font-size:var(--fs-h2,22px);font-weight:600;',
    'line-height:1.2;color:var(--ink);margin:0 0 var(--space-3,12px);}',
    '.mc-meta{display:flex;align-items:center;gap:var(--space-3,12px);flex-wrap:wrap;}',
    '.mc-role{display:inline-flex;align-items:center;font-family:var(--font-sans);font-size:11px;',
    'font-weight:600;letter-spacing:.04em;text-transform:uppercase;padding:2px 9px;border-radius:var(--radius-pill,9999px);',
    'border:var(--hairline,1px) solid var(--line);color:var(--ink-soft);}',
    '.mc-role--pro{color:var(--sage,#4C6B5E);border-color:var(--sage,#4C6B5E);}',
    '.mc-rep{display:inline-flex;align-items:center;gap:4px;font-family:var(--font-sans);font-size:var(--fs-small,14px);',
    'font-weight:500;color:var(--amber,#795220);font-variant-numeric:tabular-nums;}',
    /* Sections */
    '.mc-sec{padding:var(--space-8,32px) var(--space-6,24px);border-top:var(--hairline,1px) solid var(--line);}',
    '.mc-sec-title{font-family:var(--font-sans);font-size:var(--fs-caption,12px);font-weight:600;',
    'letter-spacing:.04em;text-transform:uppercase;color:var(--ink-faint);margin:0 0 var(--space-3,12px);}',
    '.mc-bio{font-family:var(--font-serif);font-size:var(--fs-body,16px);line-height:1.7;',
    'color:var(--ink-soft);margin:0;}',
    /* Activity */
    '.mc-activity{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:var(--space-1,4px);}',
    '.mc-activity-item{display:flex;gap:var(--space-3,12px);padding:var(--space-3,12px) 0;',
    'border-bottom:var(--hairline,1px) solid var(--line);}',
    '.mc-activity-item:last-child{border-bottom:none;}',
    '.mc-activity-icon{width:30px;height:30px;border-radius:var(--radius-pill,9999px);background:var(--surface-sunk);',
    'display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;}',
    '.mc-activity-text{font-family:var(--font-sans);font-size:var(--fs-small,14px);color:var(--ink);line-height:1.4;}',
    '.mc-activity-time{font-family:var(--font-sans);font-size:var(--fs-caption,12px);color:var(--ink-faint);margin-top:2px;}',
    /* Message button */
    '.mc-msg{width:100%;display:inline-flex;align-items:center;justify-content:center;gap:var(--space-2,8px);',
    'padding:var(--space-3,12px) var(--space-4,16px);border:none;border-radius:var(--radius-md,10px);',
    'background:var(--accent);color:var(--on-accent);font-family:var(--font-sans);font-size:var(--fs-small,14px);',
    'font-weight:600;cursor:pointer;transition:background 140ms;}',
    '.mc-msg:hover:not(:disabled){background:var(--accent-hover);}',
    '.mc-msg:disabled{opacity:.5;cursor:not-allowed;}',
    /* Bottom-centre close control */
    '.mc-close-btm{position:absolute;bottom:var(--space-5,20px);left:50%;transform:translateX(-50%);z-index:5;',
    'display:inline-flex;align-items:center;gap:var(--space-2,8px);padding:var(--space-2,8px) var(--space-5,20px);',
    'background:var(--surface);color:var(--ink-soft);border:var(--hairline,1px) solid var(--line);',
    'border-radius:var(--radius-pill,999px);box-shadow:var(--shadow-soft,0 6px 22px rgba(20,16,12,.12));',
    'font-family:var(--font-sans);font-size:var(--fs-small,14px);font-weight:500;cursor:pointer;',
    'transition:color 140ms,border-color 140ms,background 140ms;}',
    '.mc-close-btm:hover{color:var(--ink);border-color:var(--ink-faint);background:var(--surface-sunk);}',
    /* Vertical "open member page" tab — pinned to the drawer right edge */
    '.mc-cover-page-btn{position:absolute;right:0;top:50%;transform:translateY(-50%);z-index:6;',
    'display:flex;align-items:center;justify-content:center;padding:var(--space-4,16px) 4px;',
    'background:var(--accent);color:var(--on-accent);border:none;',
    'border-radius:var(--radius-md,10px) 0 0 var(--radius-md,10px);box-shadow:-4px 0 18px rgba(20,16,12,.28);',
    'cursor:pointer;transition:background 140ms;}',
    '.mc-cover-page-btn:hover{background:var(--accent-hover);}',
    '.mc-cover-page-btn:focus-visible{outline:2px solid var(--accent);outline-offset:2px;}',
    '.mc-cover-page-label{writing-mode:vertical-rl;transform:rotate(180deg);font-family:var(--font-sans);',
    'font-size:var(--fs-caption,12px);font-weight:600;letter-spacing:.04em;text-transform:uppercase;white-space:nowrap;}',
    '@media (max-width:720px){.mc-drawer{width:100vw;border-left:none;}.mc-photo-col{width:96px;}}',
    '@media (prefers-reduced-motion:reduce){.mc-backdrop,.mc-drawer{transition:opacity .01ms;}}',
  ].join('');

  var MEMBERS = {
    u1: {
      init: 'АИ', bg: 'var(--accent,#C1654B)',
      name: 'Александра Иванова', role: 'Участник', pro: false, rep: 142,
      bio: 'Психолог-консультант, работаю в краткосрочных подходах. Интересуюсь пограничными состояниями и теорией привязанности. Читаю Биона и Вингхэма.',
      activity: [
        { icon: '💬', text: 'Прокомментировала «Научение на опыте»', time: '15 мин. назад' },
        { icon: '⭐', text: 'Оценила «Гореть вместе» — ★★★★★', time: '2 ч. назад' },
        { icon: '📖', text: 'Читает «Научение на опыте», стр. 38', time: '3 ч. назад' }
      ]
    },
    u2: {
      init: 'БК', bg: '#7A4A3A',
      name: 'Борис Краснов', role: 'Участник', pro: false, rep: 67,
      bio: 'Начинающий практик, прохожу личную терапию. Читаю Кляйн и Биона. Ищу супервизора.',
      activity: [
        { icon: '📖', text: 'Начал читать «Итальянские семинары»', time: '1 ч. назад' },
        { icon: '💬', text: 'Задал вопрос в обсуждении «Гореть вместе»', time: '1 д. назад' },
        { icon: '⭐', text: 'Оценил «Научение на опыте» — ★★★★☆', time: '3 д. назад' }
      ]
    },
    u3: {
      init: 'МС', bg: 'var(--slate,#3E5C73)',
      name: 'Мария Соколова', role: 'Профессионал', pro: true, rep: 287,
      bio: 'Психоаналитик, 12 лет практики. Работаю с взрослыми в классической технике. Супервизирую аналитиков первого года.',
      activity: [
        { icon: '✍️', text: 'Написала рецензию на «Гореть вместе»', time: '2 ч. назад' },
        { icon: '💬', text: 'Ответила на комментарий Александры', time: '15 мин. назад' },
        { icon: '📖', text: 'Читает «Избегание эмоций»', time: '4 ч. назад' }
      ]
    },
    'u-do': {
      init: 'ДО', bg: 'var(--amber,#795220)',
      name: 'Дмитрий Орлов', role: 'Профессионал', pro: true, rep: 412,
      bio: 'Тренинг-аналитик, председатель секции психоанализа. Тридцать лет практики и преподавания. Переводил классические работы бионианской традиции.',
      activity: [
        { icon: '✍️', text: 'Написал рецензию на «Гореть вместе» — ★★★★★', time: '4 ч. назад' },
        { icon: '✍️', text: 'Написал рецензию на «Научение на опыте»', time: 'вчера' },
        { icon: '📖', text: 'Завершил «Научение на опыте»', time: '2 дня назад' }
      ]
    },
    'u-nk': {
      init: 'НК', bg: 'var(--sage,#3D5A4E)',
      name: 'Наталья Кузнецова', role: 'Профессионал', pro: true, rep: 234,
      bio: 'Клинический психолог, работаю с теорией поля и постбионианским подходом. Веду семинар по технике интерпретации для практиков.',
      activity: [
        { icon: '💬', text: 'Ответила в обсуждении «Научение на опыте»', time: '1 ч. назад' },
        { icon: '⭐', text: 'Оценила «Избегание эмоций» — ★★★★★', time: 'вчера' },
        { icon: '📖', text: 'Читает «Избегание эмоций», стр. 88', time: '2 дня назад' }
      ]
    }
  };

  var _backdrop = null, _drawer = null, _esc = null, _userId = null;

  /* «Написать» → Home · Messages, to the correspondence thread with this user
     (existing or a new one). The page isn't built yet, so for now this resolves
     to the error page. All open cards are closed on the way out. */
  function _openCorrespondence() {
    var uid = _userId;
    if (window.BA && BA.cardStack) BA.cardStack.reset(); /* leaving the card flow entirely */
    BA.memberCard.close();
    if (BA.bookCard) BA.bookCard.close();
    if (BA.authorCard) BA.authorCard.close();
    window.location.href = '../pages/home.html?tab=messages&thread=' + encodeURIComponent(uid || '');
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function _inject() {
    if (document.getElementById('ba-mc-css')) return;
    var s = document.createElement('style');
    s.id = 'ba-mc-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function _build() {
    if (_backdrop) return;
    _inject();

    _backdrop = document.createElement('div');
    _backdrop.className = 'mc-backdrop';
    _backdrop.addEventListener('click', function () { BA.memberCard.close(); });
    document.body.appendChild(_backdrop);

    _drawer = document.createElement('div');
    _drawer.className = 'mc-drawer';
    _drawer.setAttribute('role', 'dialog');
    _drawer.setAttribute('aria-modal', 'true');
    _drawer.innerHTML = '<div class="mc-scroll" id="mc-scroll"></div><div class="mc-photo-col" id="mc-photo"></div>' +
      '<button class="mc-cover-page-btn" type="button" aria-label="Открыть страницу участника" title="Открыть страницу участника"><span class="mc-cover-page-label">Страница участника ↗</span></button>' +
      '<button class="mc-close-btm" type="button" aria-label="Закрыть карточку участника"><span aria-hidden="true">✕</span> Закрыть</button>';
    document.body.appendChild(_drawer);

    /* «Написать» → Home · correspondence with this user (not a modal editor) */
    _drawer.addEventListener('click', function (e) {
      if (e.target.closest('.mc-close-btm')) { BA.memberCard.close(); return; }
      if (e.target.closest('.mc-cover-page-btn')) { window.location.href = '../pages/member.html?user=' + encodeURIComponent(_userId || ''); return; }
      var btn = e.target.closest('.mc-msg');
      if (btn && !btn.disabled) _openCorrespondence();
    });

    _esc = function (e) {
      if (e.key === 'Escape' && _drawer && _drawer.classList.contains('is-open')) BA.memberCard.close();
    };
    document.addEventListener('keydown', _esc);
  }

  function _renderScroll(member) {
    var priv = window.BA && BA.session && BA.session.isPrivate();
    var activity = member.activity.map(function (a) {
      return '<li class="mc-activity-item">' +
        '<span class="mc-activity-icon" aria-hidden="true">' + a.icon + '</span>' +
        '<span class="mc-activity-text">' + esc(a.text) +
          '<span class="mc-activity-time">' + esc(a.time) + '</span>' +
        '</span>' +
      '</li>';
    }).join('');

    return '<div class="mc-hero">' +
        (window.BA && BA.avatars ? '<img class="mc-hero-av" src="' + BA.avatars.pick(_userId || member.name) + '" alt="" loading="lazy">' : '') +
        '<div class="mc-hero-text">' +
          '<p class="mc-eyebrow">Профиль участника</p>' +
          '<h2 class="mc-name">' + esc(member.name) + '</h2>' +
          '<div class="mc-meta">' +
            '<span class="mc-role' + (member.pro ? ' mc-role--pro' : '') + '">' + esc(member.role) + '</span>' +
            '<span class="mc-rep">★ ' + member.rep + ' · репутация</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="mc-sec">' +
        '<p class="mc-sec-title">О себе</p>' +
        '<p class="mc-bio">' + esc(member.bio) + '</p>' +
      '</div>' +
      '<div class="mc-sec">' +
        '<p class="mc-sec-title">Недавняя активность</p>' +
        '<ul class="mc-activity">' + activity + '</ul>' +
      '</div>' +
      '<div class="mc-sec">' +
        '<button class="mc-msg" type="button"' + (priv ? '' : ' disabled') + '>' +
          (priv ? '✉ Написать сообщение' : '✉ Написать — требуется вход') +
        '</button>' +
      '</div>';
  }

  function _renderPhoto(member) {
    if (window.BA && BA.avatars) {
      var seed = _userId || member.name;
      return '<img class="mc-photo" src="' + BA.avatars.pick(seed) + '" alt="" loading="lazy">';
    }
    return '<span class="mc-monogram" aria-hidden="true">' + esc(member.init) + '</span>';
  }

  window.BA.memberCard = {
    open: function (userId) {
      if (window.BA && BA.cardStack) BA.cardStack.enter();
      var member = MEMBERS[userId] || MEMBERS['u3'];
      _userId = userId;
      _build();
      _drawer.querySelector('#mc-scroll').innerHTML = _renderScroll(member);
      var photo = _drawer.querySelector('#mc-photo');
      photo.innerHTML = _renderPhoto(member);
      photo.style.background = member.bg; /* the member's colour as the portrait ground */
      _drawer.querySelector('#mc-scroll').scrollTop = 0;
      _drawer.setAttribute('aria-label', 'Профиль: ' + member.name);
      _backdrop.classList.add('is-open');
      _drawer.classList.add('is-open');
    },
    close: function () {
      if (!_drawer) return;
      _backdrop.classList.remove('is-open');
      _drawer.classList.remove('is-open');
      if (window.BA && BA.cardStack) BA.cardStack.back(); /* reopen parent card if stacked */
    }
  };
})();

/* components/author-card.js — Author card overlay
   BA.authorCard.open(authorId) / .close()
   No auth gating — always visible. */
(function () {
  'use strict';
  window.BA = window.BA || {};

  var CSS = [
    '.ac-backdrop{position:fixed;inset:0;z-index:810;background:rgba(20,16,12,.55);',
    'backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;',
    'opacity:0;pointer-events:none;transition:opacity 200ms;}',
    '.ac-backdrop.is-open{opacity:1;pointer-events:auto;}',
    '.ac-card{position:relative;background:var(--paper,#F5EFE4);border-radius:16px;',
    'width:540px;max-width:calc(100vw - 32px);max-height:88vh;overflow-y:auto;',
    'box-shadow:0 24px 64px rgba(0,0,0,.2);',
    'transform:translateY(16px);transition:transform 250ms var(--ease-out-quart,cubic-bezier(.25,.46,.45,.94));}',
    '.ac-backdrop.is-open .ac-card{transform:translateY(0);}',
    '.ac-hero{padding:32px 32px 24px;border-bottom:1px solid var(--line,rgba(26,20,16,.1));}',
    '.ac-portrait{width:72px;height:72px;border-radius:50%;background:var(--surface-sunk,rgba(26,20,16,.06));',
    'display:flex;align-items:center;justify-content:center;font-family:var(--font-serif);font-size:28px;',
    'color:var(--ink-faint);margin-bottom:16px;}',
    '.ac-name{font-family:var(--font-serif);font-size:22px;font-weight:600;color:var(--ink);margin:0 0 4px;}',
    '.ac-meta{font-size:13px;color:var(--ink-faint);margin:0;}',
    '.ac-body{padding:24px 32px;}',
    '.ac-section-title{font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;',
    'color:var(--ink-faint);margin:0 0 12px;}',
    '.ac-bio{font-size:14px;line-height:1.7;color:var(--ink);margin:0 0 24px;}',
    '.ac-books{list-style:none;padding:0;margin:0;}',
    '.ac-book-item{display:flex;gap:12px;padding:12px 0;border-bottom:1px solid var(--line,rgba(26,20,16,.08));}',
    '.ac-book-item:last-child{border-bottom:none;}',
    '.ac-book-thumb{width:36px;height:52px;border-radius:4px;object-fit:cover;flex-shrink:0;',
    'background:var(--surface-sunk);display:block;}',
    '.ac-book-info{flex:1;min-width:0;}',
    '.ac-book-title{font-size:14px;font-weight:500;color:var(--ink);margin:0 0 2px;',
    'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '.ac-book-sub{font-size:12px;color:var(--ink-faint);margin:0;}',
    '.ac-close{position:absolute;top:16px;right:16px;background:none;border:none;',
    'font-size:20px;color:var(--ink-faint);cursor:pointer;line-height:1;padding:4px;}',
  ].join('');

  var AUTHORS = {
    'author-bion': {
      initials: 'УБ',
      name: 'Уилфред Р. Бион',
      meta: '1897–1979 · Британский психоаналитик',
      bio: 'Уилфред Рупрехт Бион — один из наиболее влиятельных теоретиков психоанализа XX века. Работал с тяжёлыми психическими расстройствами, разработал теорию мышления, контейнирования (♀♂), трансформаций и концепцию O — непознаваемой абсолютной реальности. Ученик Мелани Кляйн, позднее развил собственную оригинальную систему. «Итальянские семинары» (1977) — одна из его последних публичных работ, живой диалог с аналитиками Рима и Турина.',
      books: [
        { id: 'bion', title: 'Научение на опыте', sub: 'Итальянские семинары · 2023', cover: '../assets/covers/bion-nauchenie-na-opyte-cover.png' }
      ]
    },
    'author-nicoli': {
      initials: 'ЛН',
      name: 'Лука Николи',
      meta: 'Ред. · Итальянский психоаналитик',
      bio: 'Лука Николи — итальянский психоаналитик, работающий в Милане. Специализируется на групповом анализе и супервизии, исследует феномены выгорания и эмоциональной вовлечённости в терапевтическом процессе. Редактор и один из авторов коллективной монографии «Гореть вместе», объединившей двенадцать ведущих клиницистов Италии.',
      books: [
        { id: 'goret', title: 'Гореть вместе', sub: 'Ред. · Психотерапия · 2023', cover: '../assets/covers/nikoli-goret-vmeste-cover.png' }
      ]
    },
    'author-ferro': {
      initials: 'АФ',
      name: 'Антонино Ферро',
      meta: 'Итальянский психоаналитик · Пьяченца',
      bio: 'Антонино Ферро — один из ведущих продолжателей теории Биона, работает в Пьяченце. Разработал биономерную модель психики и модель «аналитика как мечтателя»: аналитик принимает непереносимые бета-элементы пациента и преобразует их в альфа-элементы, доступные для мышления. Автор многочисленных монографий, переведённых на двенадцать языков.',
      books: [
        { id: 'ferro', title: 'Избегание эмоций, проживание эмоций', sub: 'Психоанализ · 2023', cover: '../assets/covers/ferro-emotsiy-izbeganie-prozhivaniye-cover.png' }
      ]
    }
  };

  var _el = null;

  function _inject() {
    if (document.getElementById('ba-ac-css')) return;
    var s = document.createElement('style');
    s.id = 'ba-ac-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function _build() {
    if (_el) return;
    _inject();
    _el = document.createElement('div');
    _el.className = 'ac-backdrop';
    _el.setAttribute('role', 'dialog');
    _el.setAttribute('aria-modal', 'true');
    _el.setAttribute('aria-hidden', 'true');
    _el.innerHTML = '<div class="ac-card"><button class="ac-close" type="button" aria-label="Закрыть">×</button><div id="ac-content"></div></div>';
    document.body.appendChild(_el);
    _el.querySelector('.ac-close').addEventListener('click', BA.authorCard.close);
    _el.addEventListener('click', function (e) { if (e.target === _el) BA.authorCard.close(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && _el && _el.classList.contains('is-open')) BA.authorCard.close();
    });
  }

  function _render(author) {
    var bookItems = author.books.map(function (b) {
      return [
        '<li class="ac-book-item">',
          '<img class="ac-book-thumb" src="' + b.cover + '" alt="' + b.title + '" loading="lazy">',
          '<div class="ac-book-info">',
            '<p class="ac-book-title">' + b.title + '</p>',
            '<p class="ac-book-sub">' + b.sub + '</p>',
          '</div>',
        '</li>'
      ].join('');
    }).join('');

    return [
      '<div class="ac-hero">',
        '<div class="ac-portrait" aria-hidden="true">' + author.initials + '</div>',
        '<h2 class="ac-name">' + author.name + '</h2>',
        '<p class="ac-meta">' + author.meta + '</p>',
      '</div>',
      '<div class="ac-body">',
        '<p class="ac-section-title">О авторе</p>',
        '<p class="ac-bio">' + author.bio + '</p>',
        '<p class="ac-section-title">Книги в библиотеке</p>',
        '<ul class="ac-books">' + bookItems + '</ul>',
      '</div>'
    ].join('');
  }

  window.BA.authorCard = {
    open: function (authorId) {
      var author = AUTHORS[authorId] || AUTHORS['author-bion'];
      _build();
      _el.querySelector('#ac-content').innerHTML = _render(author);
      _el.setAttribute('aria-label', 'Об авторе: ' + author.name);
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

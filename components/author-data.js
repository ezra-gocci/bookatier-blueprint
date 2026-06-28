/* components/author-data.js — Shared author model (the Pantheon)
   ────────────────────────────────────────────────────────────────────────────
   Single source of author truth. Consumed by the author CARD
   (components/author-card.js) and the author PAGE (pages/author.html) — card
   and page are two views of one entity. Works link by slug into book-data.js.

   Feature areas: Pantheon · Author card · Author page.
   Spec refs: specs.md §1.5 (Author entity); system-model §2.4 / §4.3.

   Bios are enriched from the books' own content (descriptions, themes). Social
   data (community reactions / Track counts) is left EMPTY this round and shown
   as an empty state. `works` are slugs resolved against BA.bookData. */
(function () {
  'use strict';
  window.BA = window.BA || {};

  var AUTHORS = {
    'author-bion': {
      id: 'author-bion',
      initials: 'УБ',
      name: 'Уилфред Р. Бион',
      meta: '1897–1979 · Британский психоаналитик',
      lifespan: '1897–1979',
      role: 'Психоаналитик · теоретик мышления',
      photo: '',
      bio: 'Уилфред Рупрехт Бион — один из наиболее влиятельных теоретиков психоанализа XX века. Родился в Индии, прошёл через опыт танкового командира Первой мировой войны, позднее работал с тяжёлыми психическими расстройствами и групповой динамикой в Тавистокской клинике. Ученик Мелани Кляйн, он развил собственную оригинальную систему: теорию мышления и альфа-функции, модель контейнера и контейнируемого (♀♂), связи L, H, K, аппарат Сетки и концепцию O — непознаваемой абсолютной реальности, к которой аналитик приближается лишь через отказ от памяти, желания и понимания. Его поздние «Итальянские семинары» (1977) — живой диалог с аналитиками Рима и Турина, мышление в действии.',
      focus: ['Альфа-функция и научение на опыте', 'Контейнер и контейнируемое', 'Психотическое мышление',
        'Трансформации и непознаваемое O', 'Группы и Сетка'],
      works: ['bion-learning', 'bion-attention']
    },

    'author-ferro': {
      id: 'author-ferro',
      initials: 'АФ',
      name: 'Антонино Ферро',
      meta: 'р. 1947 · Итальянский психоаналитик · Павия',
      lifespan: 'р. 1947',
      role: 'Психоаналитик · теория поля',
      photo: '',
      bio: 'Антонино Ферро — один из ведущих современных психоаналитиков, обучающий аналитик и многолетний президент Итальянского психоаналитического общества, работает в Павии. Продолжая мышление Биона и постбионианскую традицию, он разработал модель аналитического поля и образ «аналитика как мечтателя»: аналитик принимает непереносимые бета-элементы пациента и преобразует их в альфа-элементы, доступные для мышления, а сессия становится местом совместного рождения историй и образов. Через богатый клинический материал Ферро смещает фокус анализа с раскрытия бессознательных фантазий на со-творение живого нарратива. Его книги переведены более чем на десять языков.',
      focus: ['Аналитическое поле', 'Аналитик как мечтатель', 'Трансформации в нарратив',
        'Онейрическое мышление', 'Эмоции в сеттинге'],
      works: ['ferro-emotions', 'ferro-cabinet']
    },

    'author-nicoli': {
      id: 'author-nicoli',
      initials: 'ЛН',
      name: 'Лука Николи',
      meta: 'Итальянский психоаналитик · Болонья',
      lifespan: 'р. XX в.',
      role: 'Психоаналитик · редактор · супервизор',
      photo: '',
      bio: 'Лука Николи — итальянский психоаналитик и член Итальянского психоаналитического общества, работает в Болонье. Его интересы лежат на пересечении клинической техники и человеческого измерения анализа: гибкость сеттинга, «очеловечивание» психоанализа, дистанционный анализ как полноценное терапевтическое пространство, а также повседневные эмоции — гнев, любовь, зависимость — как материал для роста. Он выступает за психоанализ, который «изобретается заново» с каждым пациентом, и как редактор объединяет ведущих итальянских клиницистов вокруг идеи близости и эмоциональной истины в аналитических отношениях.',
      focus: ['Гибкость сеттинга и человечность анализа', 'Дистанционный анализ', 'Гнев и эмоциональные зависимости',
        'Близость и уязвимость аналитика', 'Современная клиническая техника'],
      works: ['nicoli-burning', 'nicoli-anger', 'nicoli-patients']
    }
  };

  /* Resolve a work slug → a light {id,title,sub,cover} for card/page lists.
     Falls back gracefully if book-data isn't present. */
  function workRef(slug) {
    var bd = window.BA && BA.bookData;
    var b = bd && bd.get(slug);
    if (!b) return { id: slug, slug: slug, title: slug, sub: '', cover: '' };
    return {
      id: slug, slug: slug, title: b.title,
      sub: (b.subtitle ? b.subtitle + ' · ' : '') + (b.editor ? 'Редактор · ' : '') + b.year,
      cover: b.cover
    };
  }

  function get(id) { return AUTHORS[id] || null; }
  function all() { return Object.keys(AUTHORS).map(function (k) { return AUTHORS[k]; }); }
  function worksOf(author) { return (author.works || []).map(workRef); }

  window.BA.authorData = {
    AUTHORS: AUTHORS,
    get: get, all: all, worksOf: worksOf, workRef: workRef,
    ids: function () { return Object.keys(AUTHORS); }
  };
})();

/* components/book-data.js — Shared book model + pure helpers (the 7-book pack)
   ────────────────────────────────────────────────────────────────────────────
   The SINGLE source of book truth for the blueprint. Both the Book CARD
   (components/book-card.js — Browse) and the Book PAGE / Reader / Catalogue
   (pages/book.html · reader.html · catalogue.html) import this module so the
   card and the page are two views of ONE entity, never a data fork.

   Feature areas: Catalogue · Book card · Book page · Reader · Citation.
   Spec refs: forge/grounds/premise/specs.md §1.6 (Publication/Edition/Book),
   §1.11 (citation), §1.8/§4.4 (accessRequirement, CON-01); system-model §4.3.

   DATA SOURCING
   • Static INDEX (below) — hand-authored, synchronous. Enough for the
     Catalogue grid, the card/page hero & identity, the version picker, and
     the citation/deep-link. Wired to the real 7-book asset pack
     (assets/books/<slug>/) for covers + edition PDFs.
   • load(slug) — async; fetches the pack's chapters.json + citations.json and
     merges them onto the static entry (the rich TOC + pull-quotes). Cached.

   SOCIAL DATA IS INTENTIONALLY EMPTY this round (operator, 2026-06-28):
   reviews / discussion / community / quote / requisites table / myStatus are
   NOT part of this task. Components render those sections in an empty state.
   What IS enriched here: book descriptions, author bios (author-data.js),
   chapter blurbs (from the pack), and per-version notes — so the site shows
   its data in full.
   ──────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';
  window.BA = window.BA || {};

  /* Asset-pack root, resolved relative to the hosting document (pages live in
     /pages/, the showroom too). Mirrors session.js _base(). */
  function _packBase() {
    var b = document.querySelector('base');
    if (b && b.getAttribute('href')) return b.getAttribute('href') + 'assets/books/';
    return (/\/pages\//.test(location.pathname) ? '../' : './') + 'assets/books/';
  }
  var PACK = _packBase();

  /* Chip kind ← genre/topic (drives the topic-chip colour: psycho/theory/clinical/therapy). */
  var GENRE_CHIP = {
    psychoanalysis: { label: 'Психоанализ',  kind: 'psycho' },
    theory:         { label: 'Теория',       kind: 'theory' },
    clinical:       { label: 'Клиника',      kind: 'clinical' },
    psychotherapy:  { label: 'Психотерапия', kind: 'therapy' }
  };
  function chipsFor(genre) {
    return (genre || []).map(function (g) { return GENRE_CHIP[g] || { label: g, kind: 'theory' }; });
  }

  /* Build the edition list from the pack's meta-shaped editions + free fragment.
     access: free → 'free'; the complete edition → 'full'; intermediate → 'early'.
     `note` = a book-specific editorial line + the structural (page-range) fact. */
  function buildEditions(slug, free, eds, editorialByVer) {
    var out = [];
    var newest = eds[eds.length - 1];
    eds.slice().reverse().forEach(function (e, i) {
      var complete = !!e.is_complete;
      out.push({
        id: e.version, v: e.version,
        access: complete ? 'full' : 'early',
        badge: complete ? 'full' : 'early',
        badgeLabel: complete ? 'Полное издание' : 'Ранний доступ ' + e.version,
        label: complete
          ? 'Полное издание · ' + e.version + (e === newest ? ' (текущее)' : '')
          : 'Ранний доступ ' + e.version,
        pages: e.page_count, startPage: e.start_page, endPage: e.end_page,
        isComplete: complete,
        current: e === newest,
        pdf: PACK + slug + '/editions/' + e.version + '/' + slug + '-' + e.version + '.pdf',
        note: (editorialByVer && editorialByVer[e.version] ? editorialByVer[e.version] + ' ' : '') +
          (complete
            ? 'Полный текст книги — ' + e.page_count + ' с.'
            : 'Часть растущего корпуса издания: с. 1–' + e.end_page + ' (' + e.page_count + ' с.), расширяется в следующих версиях.')
      });
    });
    /* free fragment as the trailing, always-public edition */
    out.push({
      id: 'free', v: 'free', access: 'free', badge: 'free', badgeLabel: 'Бесплатно',
      label: 'Фрагмент — бесплатно',
      pages: free.page_count, startPage: free.start_page, endPage: free.end_page,
      isComplete: false, current: false,
      pdf: PACK + slug + '/editions/free/' + slug + '-free.pdf',
      note: 'Свободный фрагмент (с. ' + free.start_page + '–' + free.end_page + ', ' +
        free.page_count + ' с.) — доступен всем без подписки (CON-01).'
    });
    return out;
  }

  function covers(slug) {
    var c = PACK + slug + '/covers/';
    return { small: c + 'cover-small.jpg', medium: c + 'cover-medium.jpg', large: c + 'cover-large.jpg' };
  }

  /* Authoritative author identity (kept in sync with author-data.js IDs). */
  var AUTHOR_ID = {
    'Уилфред Р. Бион': 'author-bion',
    'Антонино Ферро': 'author-ferro',
    'Лука Николи': 'author-nicoli',
    'Ред. Лука Николи': 'author-nicoli'
  };

  /* =====================================================================
     THE 7-BOOK INDEX (static, synchronous)
     ===================================================================== */
  var BOOKS = {

    'bion-attention': {
      slug: 'bion-attention',
      title: 'Внимание и интерпретация',
      subtitle: 'Научный подход к инсайту в психоанализе и групповой работе',
      author: 'Уилфред Р. Бион', editor: null, authorId: 'author-bion',
      year: 2023, pages: 212, isbn: '978-5-6049000-9-3', language: 'ru', publisher: 'beta→alpha',
      genre: ['psychoanalysis', 'theory'],
      tags: ['психоанализ', 'внимание', 'интерпретация', 'психическая реальность',
        'контейнер и контейнируемое', 'мистик и группа', 'трансформации', 'акт веры'],
      shortDescription: 'Вершинный труд Биона о природе психоаналитического внимания, трансформациях психической реальности и пути к инсайту через отказ от памяти и желаний.',
      description: '«Внимание и интерпретация» — вершина психоаналитической мысли Уилфреда Р. Биона, предлагающая радикально новый подход к пониманию психической реальности и природы аналитического инсайта. Бион переосмысливает введённые им ранее понятия — контейнер и контейнируемое, альфа- и бета-элементы, Сетку — и разворачивает их в единую теорию трансформаций, где аналитик достигает истины лишь через отказ от памяти, желаний и понимания ради акта слепой веры. Книга остаётся незаменимым ресурсом для практикующих психоаналитиков, психотерапевтов и всех, кто работает с природой психотического мышления, отношениями мистика и группы и вопросом о пределах познаваемого.',
      firstPageOdd: false,
      free: { start_page: 21, end_page: 37, page_count: 17 },
      _eds: [{ version: 'v1', start_page: 1, end_page: 106, page_count: 106, is_complete: false },
        { version: 'v2', start_page: 1, end_page: 141, page_count: 141, is_complete: false },
        { version: 'v3', start_page: 1, end_page: 176, page_count: 176, is_complete: false },
        { version: 'v4', start_page: 1, end_page: 212, page_count: 212, is_complete: true }],
      _edTheme: {
        v1: 'Первая редакция: разделы об О, познаваемом и непознаваемом.',
        v2: 'Добавлены главы о трансформациях в О и об отказе от памяти и желания.',
        v3: 'Дополнено разбором отношений мистика и группы и аппаратом Сетки.',
        v4: 'Сверенный полный текст с предисловием В. Мазина и указателем терминов.'
      }
    },

    'bion-learning': {
      slug: 'bion-learning',
      title: 'Научение на опыте', subtitle: 'Итальянские семинары',
      author: 'Уилфред Р. Бион', editor: null, authorId: 'author-bion',
      year: 2026, pages: 324, isbn: '978-5-908131-04-9', language: 'ru', publisher: 'beta→alpha',
      genre: ['psychoanalysis', 'theory'],
      tags: ['Бион', 'альфа-функция', 'научение на опыте', 'мышление',
        'контейнер и контейнируемое', 'психотическое мышление', 'эмоциональный опыт', 'итальянские семинары'],
      shortDescription: 'Классический теоретический труд Биона об альфа-функции и природе мышления — вместе с живыми римскими семинарами 1977 года, впервые в русском переводе.',
      description: 'В этом томе впервые на русском языке публикуются два ключевых текста Уилфреда Биона: «Научение на опыте» — фундаментальный теоретический труд об эпистемологии в психоанализе, в котором Бион вводит понятия альфа-функции, контактного барьера и связей L, H, K, — и «Итальянские семинары» — живые записи дискуссий с аналитиками в Риме 1977 года. Вместе они образуют мост между абстрактной теорией Биона и её клиническим воплощением, открывая читателю мысль одного из наиболее значимых психоаналитиков XX века сразу в двух измерениях.',
      firstPageOdd: false,
      free: { start_page: 21, end_page: 37, page_count: 17 },
      _eds: [{ version: 'v1', start_page: 1, end_page: 162, page_count: 162, is_complete: false },
        { version: 'v2', start_page: 1, end_page: 202, page_count: 202, is_complete: false },
        { version: 'v3', start_page: 1, end_page: 242, page_count: 242, is_complete: false },
        { version: 'v4', start_page: 1, end_page: 282, page_count: 282, is_complete: false },
        { version: 'v5', start_page: 1, end_page: 324, page_count: 324, is_complete: true }],
      _edTheme: {
        v1: 'Теоретическая часть «Научения на опыте»: альфа-функция и контактный барьер.',
        v2: 'Добавлены связи L, H, K и развитие способности мыслить мысли.',
        v3: 'Включена работа о психотическом и непсихотическом мышлении.',
        v4: 'Добавлены первые римские семинары 1977 года.',
        v5: 'Полный том: оба текста, предисловие переводчика и сверенная терминология.'
      }
    },

    'ferro-cabinet': {
      slug: 'ferro-cabinet',
      title: 'В кабинете психоаналитика', subtitle: 'Эмоции, истории, трансформации',
      author: 'Антонино Ферро', editor: null, authorId: 'author-ferro',
      year: 2022, pages: 367, isbn: '978-5-6049000-1-7', language: 'ru', publisher: 'beta→alpha',
      genre: ['psychoanalysis', 'clinical'],
      tags: ['аналитическое поле', 'трансформации', 'контрперенос', 'нарратив',
        'Бион', 'клинический психоанализ', 'альфа-функция', 'сеттинг'],
      shortDescription: 'Антонино Ферро — о том, как эмоции в кабинете психоаналитика превращаются в истории, а истории — в трансформации.',
      description: 'Книга самого известного итальянского психоаналитика Антонино Ферро разворачивает концепцию аналитического поля — пространства, в котором эмоции пациента и аналитика совместно трансформируются в истории и образы. Опираясь на мышление Биона и Баранже, Ферро пересматривает ключевые темы: анализируемость, завершение анализа, тупиковые реакции, сексуальность и сеттинг. Через серию клинических виньеток автор показывает, как аналитик эволюционирует от поиска бессознательных фантазий к со-творению живого нарратива вместе с пациентом.',
      firstPageOdd: false,
      free: { start_page: 21, end_page: 37, page_count: 17 },
      _eds: [{ version: 'v1', start_page: 1, end_page: 183, page_count: 183, is_complete: false },
        { version: 'v2', start_page: 1, end_page: 229, page_count: 229, is_complete: false },
        { version: 'v3', start_page: 1, end_page: 275, page_count: 275, is_complete: false },
        { version: 'v4', start_page: 1, end_page: 321, page_count: 321, is_complete: false },
        { version: 'v5', start_page: 1, end_page: 367, page_count: 367, is_complete: true }],
      _edTheme: {
        v1: 'Понятие аналитического поля и его клинические основания.',
        v2: 'Главы об анализируемости и тупиковых реакциях.',
        v3: 'Добавлены разделы о сексуальности и сеттинге.',
        v4: 'Расширенный корпус клинических виньеток.',
        v5: 'Полный текст с предисловием и глоссарием постбионианских терминов.'
      }
    },

    'ferro-emotions': {
      slug: 'ferro-emotions',
      title: 'Избегание эмоций, проживание эмоций', subtitle: null,
      author: 'Антонино Ферро', editor: null, authorId: 'author-ferro',
      year: 2023, pages: 323, isbn: '978-5-6049000-3-1', language: 'ru', publisher: 'beta→alpha',
      genre: ['psychoanalysis', 'clinical'],
      tags: ['эмоции', 'психоаналитическая техника', 'теория поля', 'контейнирование',
        'перенос и контрперенос', 'онейрическое мышление', 'клинические случаи', 'мышление Биона'],
      shortDescription: 'Классическая работа Антонино Ферро о том, как психика избегает эмоций и что нужно аналитику, чтобы помочь пациенту их по-настоящему пережить.',
      description: 'Антонино Ферро, известный итальянский психоаналитик и многолетний президент Итальянского психоаналитического общества, исследует психоаналитическую встречу через призму того, как эмоции формируются, избегаются и проживаются — пациентом и аналитиком вместе. Опираясь на теорию мышления Биона, понятие аналитического поля и богатый клинический материал, автор показывает, как расширить способность психики усваивать и трансформировать эмоции. Книга завершается разделом клинических упражнений, позволяющих читателю самостоятельно проверить свои интерпретативные возможности.',
      firstPageOdd: true,
      free: { start_page: 21, end_page: 37, page_count: 17 },
      _eds: [{ version: 'v1', start_page: 1, end_page: 161, page_count: 161, is_complete: false },
        { version: 'v2', start_page: 1, end_page: 201, page_count: 201, is_complete: false },
        { version: 'v3', start_page: 1, end_page: 241, page_count: 241, is_complete: false },
        { version: 'v4', start_page: 1, end_page: 281, page_count: 281, is_complete: false },
        { version: 'v5', start_page: 1, end_page: 323, page_count: 323, is_complete: true }],
      _edTheme: {
        v1: 'Как эмоции формируются и избегаются: исходная модель.',
        v2: 'Онейрическое мышление и работа контейнирования в сессии.',
        v3: 'Перенос, контрперенос и трансформации поля.',
        v4: 'Расширенная подборка клинических случаев.',
        v5: 'Полный текст с разделом клинических упражнений.'
      }
    },

    'nicoli-anger': {
      slug: 'nicoli-anger',
      title: 'Искусство злиться и любить, не теряя себя', subtitle: null,
      author: 'Лука Николи', editor: null, authorId: 'author-nicoli',
      year: 2024, pages: 208, isbn: '978-5-6052417-1-3', language: 'ru', publisher: 'beta→alpha',
      genre: ['psychotherapy', 'clinical'],
      tags: ['агрессия', 'гнев', 'эмоциональные зависимости', 'любовные отношения',
        'бессознательное', 'психосоматика', 'идентичность', 'созависимость'],
      shortDescription: 'Два психоаналитических эссе об искусстве злиться конструктивно и любить, не растворяясь в другом.',
      description: 'Под одной обложкой — две работы итальянского психоаналитика Луки Николи: «Искусство злиться» и «Любить, не теряя себя». В первой автор исследует злость как физиологическую реакцию на фрустрацию и мощный инструмент личностного роста, разбирая, как подавленный гнев трансформируется в депрессию, панику и психосоматические симптомы. Во второй — показывает, как строить прочные отношения, не жертвуя собственной идентичностью, и разбирает ловушки созависимости и эмоциональной зависимости.',
      firstPageOdd: false,
      free: { start_page: 21, end_page: 37, page_count: 17 },
      _eds: [{ version: 'v1', start_page: 1, end_page: 104, page_count: 104, is_complete: false },
        { version: 'v2', start_page: 1, end_page: 138, page_count: 138, is_complete: false },
        { version: 'v3', start_page: 1, end_page: 172, page_count: 172, is_complete: false },
        { version: 'v4', start_page: 1, end_page: 208, page_count: 208, is_complete: true }],
      _edTheme: {
        v1: 'Эссе «Искусство злиться»: гнев как реакция на фрустрацию.',
        v2: 'Как подавленный гнев оборачивается депрессией и психосоматикой.',
        v3: 'Начало второго эссе — «Любить, не теряя себя».',
        v4: 'Полный текст обоих эссе с разбором созависимости.'
      }
    },

    'nicoli-burning': {
      slug: 'nicoli-burning',
      title: 'Гореть вместе', subtitle: 'Близость, истина и уязвимость в современном итальянском психоанализе',
      author: 'Ред. Лука Николи', editor: 'Лука Николи', authorId: 'author-nicoli',
      year: 2026, pages: 256, isbn: '978-5-908131-02-5', language: 'ru', publisher: 'beta→alpha',
      genre: ['psychoanalysis', 'clinical'],
      tags: ['близость', 'аналитическое поле', 'итальянский психоанализ', 'уязвимость аналитика',
        'интерсубъективность', 'контрперенос', 'эмоциональная истина', 'клинические случаи'],
      shortDescription: 'Ведущие итальянские психоаналитики — о близости, истине и уязвимости как условиях подлинной трансформации в аналитических отношениях.',
      description: 'Сборник работ ведущих итальянских психоаналитиков, объединённых ключевой метафорой «гореть вместе» — готовностью аналитика к подлинной близости, взаимной уязвимости и поиску эмоциональной истины в каждом контакте с пациентом. Авторы рассматривают аналитическую работу как совместное проживание рождающегося в сессии опыта, смещая фокус с интерпретации на живое, вовлечённое присутствие. Книга служит практическим ориентиром и теоретическим мостом между итальянской и российской психоаналитическими традициями.',
      firstPageOdd: false,
      free: { start_page: 21, end_page: 37, page_count: 17 },
      _eds: [{ version: 'v1', start_page: 1, end_page: 130, page_count: 130, is_complete: false },
        { version: 'v2', start_page: 1, end_page: 173, page_count: 173, is_complete: false },
        { version: 'v3', start_page: 1, end_page: 216, page_count: 216, is_complete: false },
        { version: 'v4', start_page: 1, end_page: 260, page_count: 260, is_complete: true }],
      _edTheme: {
        v1: 'Вводные эссе о близости и уязвимости аналитика.',
        v2: 'Главы об интерсубъективности и аналитическом поле.',
        v3: 'Клинические случаи совместного проживания опыта.',
        v4: 'Полный сборник с предисловием редактора и указателем авторов.'
      }
    },

    'nicoli-patients': {
      slug: 'nicoli-patients',
      title: 'Будьте с пациентами там, где они есть', subtitle: null,
      author: 'Лука Николи', editor: null, authorId: 'author-nicoli',
      year: 2024, pages: 40, isbn: '978-5-6049000-7-9', language: 'ru', publisher: 'beta→alpha',
      genre: ['psychoanalysis', 'clinical'],
      tags: ['клинический психоанализ', 'сеттинг', 'терапевтические отношения', 'дистанционный анализ',
        'телеанализ', 'субъективация', 'аналитическое поле', 'современная техника'],
      shortDescription: 'Книга о том, как аналитик может и должен идти навстречу пациенту — не отступая от психоанализа, а заново открывая его.',
      description: 'Лука Николи, психоаналитик и член Итальянского психоаналитического общества, на богатом клиническом материале доказывает необходимость «очеловечивания» психоанализа — от гибкости в отношении жёстких рамок традиционного сеттинга до осмысления дистанционного анализа как полноценного терапевтического пространства. Автор показывает, что сопротивления пациента и его особое функционирование — зачастую единственный доступный ему способ существования, а значит, принять пациента там, где он есть, — условие самого психоанализа. Это психоанализ, который «изобретается заново» с каждым пациентом, не утрачивая при этом своей человеческой и терапевтической ценности.',
      firstPageOdd: false,
      free: { start_page: 21, end_page: 37, page_count: 17 },
      _eds: [{ version: 'v1', start_page: 1, end_page: 20, page_count: 20, is_complete: false },
        { version: 'v2', start_page: 1, end_page: 40, page_count: 40, is_complete: true }],
      _edTheme: {
        v1: 'О гибкости сеттинга и движении навстречу пациенту.',
        v2: 'Полный текст, включая разбор дистанционного анализа.'
      }
    }
  };

  var SLUGS = ['bion-learning', 'bion-attention', 'ferro-emotions', 'ferro-cabinet',
    'nicoli-burning', 'nicoli-anger', 'nicoli-patients'];

  /* Finish each static entry: covers, editions, chips, requisites scaffold. */
  Object.keys(BOOKS).forEach(function (slug) {
    var b = BOOKS[slug];
    b.covers = covers(slug);
    b.cover = b.covers.medium;                 /* default cover (card/identity) */
    b.chips = chipsFor(b.genre);
    b.editions = buildEditions(slug, b.free, b._eds, b._edTheme);
    b.fragmentPages = { from: b.free.start_page, to: b.free.end_page };
    b.fragmentPdf = PACK + slug + '/editions/free/' + slug + '-free.pdf';
    /* Requisites table (objective bibliographic facts — NOT social data). */
    b.requisites = [
      ['Название', b.title + (b.subtitle ? '. ' + b.subtitle : '')],
      [b.editor ? 'Редактор' : 'Автор', b.editor || b.author],
      ['Год издания', String(b.year)],
      ['Издатель', 'beta→alpha'],
      ['ISBN', b.isbn],
      ['Язык', b.language === 'ru' ? 'Русский' : b.language],
      ['Объём', b.pages + ' с.']
    ];
    /* Social — intentionally empty this round (rendered as empty states). */
    b.rating = null; b.reviews = []; b.discussion = []; b.community = [];
    b.quote = null; b.myStatus = null;
  });

  /* =====================================================================
     PURE HELPERS
     ===================================================================== */
  function get(slug) { return BOOKS[slug] || null; }
  function all() { return SLUGS.map(function (s) { return BOOKS[s]; }); }

  function editionByVersion(book, v) {
    if (!book) return null;
    for (var i = 0; i < book.editions.length; i++) if (book.editions[i].v === v) return book.editions[i];
    return null;
  }
  function defaultEdition(book, isPrivate) {
    if (!book) return null;
    if (!isPrivate) return editionByVersion(book, 'free') || book.editions[book.editions.length - 1];
    /* private: the current full edition, else the first */
    for (var i = 0; i < book.editions.length; i++) if (book.editions[i].current) return book.editions[i];
    return book.editions[0];
  }
  function fullEdition(book) {
    for (var i = 0; i < book.editions.length; i++) if (book.editions[i].isComplete) return book.editions[i];
    return book.editions[0];
  }

  /* Academic citation — specs §1.18 citationOf:
       {author}, {year}. {title}. {version}. β→α. P. {page}. */
  function citation(book, version, page) {
    if (!book) return '';
    var who = book.editor ? book.editor + ' (ред.)' : book.author;
    var ver = (version && version !== 'free') ? 'Изд. ' + version : 'Фрагмент';
    var pg = (page != null) ? ' С. ' + page + '.' : '';
    return who + ', ' + book.year + '. ' + book.title + '. ' + ver + '. β→α.' + pg;
  }

  /* Deep-link — specs §1.11 / reader format ?v=&p=&f= */
  function deepLink(book, version, page, fragment) {
    if (!book) return '';
    return 'beta2alpha.academy/book/' + book.slug + '/read?v=' + (version || 'free') +
      '&p=' + (page || 1) + (fragment ? '&f=' + fragment : '');
  }

  /* Map a book page → the page index inside the free fragment (clamped). */
  function bookPageToFragment(book, bookPage) {
    var fp = book && book.fragmentPages;
    if (!fp) return 1;
    if (bookPage < fp.from) return 1;
    if (bookPage > fp.to) return fp.to - fp.from + 1;
    return bookPage - fp.from + 1;
  }

  /* The BOOK-page range a rendered edition actually covers.
       free  → {from: fragment start, to: fragment end}   (e.g. 21–37)
       vN    → {from: 1, to: end_page}                     (a growing prefix)
     Editions carry startPage/endPage (book-data.buildEditions); fall back to
     the fragment range / page count. */
  function editionBookRange(book, edition) {
    if (!edition) return (book && book.fragmentPages) ? { from: book.fragmentPages.from, to: book.fragmentPages.to } : { from: 1, to: (book && book.pages) || 1 };
    var from = edition.startPage || 1;
    var to = edition.endPage || edition.pages || from;
    return { from: from, to: to };
  }

  /* Map a BOOK page → the 1-based page INDEX inside a rendered edition, or null
     when the book page lies OUTSIDE the edition's range (caller hides/disables
     the navigation). Works for the free fragment AND the prefix editions — the
     fix for the TOC/deep-link clamp bug (W-6.2). */
  function bookPageToEdition(book, edition, bookPage) {
    var r = editionBookRange(book, edition);
    bookPage = bookPage | 0;
    if (!bookPage || bookPage < r.from || bookPage > r.to) return null;
    return bookPage - r.from + 1;
  }

  /* Inverse: a rendered edition page index → the real BOOK page (for citations
     and "current chapter" detection, which reason in book pages). */
  function editionToBookPage(book, edition, edPage) {
    var r = editionBookRange(book, edition);
    return r.from + Math.max(1, edPage | 0) - 1;
  }

  /* ---- two-page spread math (shared with the reader engine) ---- */
  function startsRight(book) { return !!(book && book.firstPageOdd); }
  function numSpreads(book, numPages) {
    return startsRight(book) ? Math.floor(numPages / 2) + 1 : Math.ceil(numPages / 2);
  }
  function spreadPages(book, k, numPages) {
    if (startsRight(book)) {
      return { left: (k > 0 && 2 * k <= numPages) ? 2 * k : null,
        right: (2 * k + 1 <= numPages) ? 2 * k + 1 : null };
    }
    return { left: (2 * k + 1 <= numPages) ? 2 * k + 1 : null,
      right: (2 * k + 2 <= numPages) ? 2 * k + 2 : null };
  }
  function spreadOf(book, p) {
    return startsRight(book) ? Math.floor(p / 2) : Math.floor((p - 1) / 2);
  }

  /* =====================================================================
     ASYNC ENRICHMENT — pack chapters.json + citations.json (cached)
     ===================================================================== */
  var _cache = {};
  function load(slug) {
    var b = get(slug);
    if (!b) return Promise.reject(new Error('unknown book: ' + slug));
    if (_cache[slug]) return Promise.resolve(_cache[slug]);
    var dir = PACK + slug + '/';
    function fetchJSON(url, fallback) {
      return fetch(url).then(function (r) { return r.ok ? r.json() : fallback; }).catch(function () { return fallback; });
    }
    return Promise.all([
      fetchJSON(dir + 'chapters.json', { chapters: [] }),
      fetchJSON(dir + 'citations.json', { citations: [] })
    ]).then(function (res) {
      var chapters = (res[0] && res[0].chapters) || [];
      var citations = (res[1] && res[1].citations) || [];
      /* normalise chapters to the card's {n,title,page,desc,level} shape */
      var norm = chapters.map(function (c, i) {
        return { n: (c.number != null ? c.number : '—'), title: c.title || '',
          page: c.page || null, desc: c.description || '', level: c.level || 1 };
      });
      var full = Object.assign(Object.create(Object.getPrototypeOf(b)), b, { chapters: norm, citations: citations });
      _cache[slug] = full;
      return full;
    });
  }
  function chaptersLoaded(slug) { return _cache[slug] ? _cache[slug].chapters : null; }

  window.BA.bookData = {
    SLUGS: SLUGS, BOOKS: BOOKS, PACK: PACK,
    get: get, all: all, load: load, chaptersLoaded: chaptersLoaded,
    editionByVersion: editionByVersion, defaultEdition: defaultEdition, fullEdition: fullEdition,
    citation: citation, deepLink: deepLink, bookPageToFragment: bookPageToFragment,
    editionBookRange: editionBookRange, bookPageToEdition: bookPageToEdition, editionToBookPage: editionToBookPage,
    startsRight: startsRight, numSpreads: numSpreads, spreadPages: spreadPages, spreadOf: spreadOf,
    chipsFor: chipsFor, authorIdFor: function (name) { return AUTHOR_ID[name] || null; }
  };
})();

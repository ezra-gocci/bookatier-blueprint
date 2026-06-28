/* components/sim.js — Activity simulation (Mock members → source:'sim' events)
   ════════════════════════════════════════════════════════════════════════════
   The synthetic-activity engine (feature area 23). Mock members emit the same
   actions through the SAME store helpers as real users (specs §2.4 / TD-8), so
   every derived surface — feeds, ratings, reputation, community tallies,
   notifications, the Console Events tab — populates live. "Clear simulation data"
   filters source:'sim' (BA.store.clearSim).

   Two modes:
     • backfill() — once (guarded by db.seededContent): a batch of BACKDATED
       historical content so surfaces are populated on first load (votes, comments,
       reviews, replies, reading sessions, News). Also seeds the active member's
       personal traces (shelf/progress/excerpts) as source:'real' so the Cabinet
       demos immediately.
     • start()/stop() — a setInterval tick loop adding fresh live activity
       (driven by the debug console in M7).

   Spec refs: specs §2.2 (action→events catalogue), §3.2/§3.3 (reputation from
   votes, weighting), §1.16a (Cohort/SimulationConfig), O-9 (sim tuning), design
   voice (warm, professional, Russian — design-axioms §3). */
(function () {
  'use strict';
  window.BA = window.BA || {};

  function S() { return window.BA.store; }
  function rand(n) { return Math.floor(Math.random() * n); }
  function pick(arr) { return arr[rand(arr.length)]; }
  function chance(p) { return Math.random() < p; }

  /* ── warm, professional Russian templates ── */
  var COMMENTS = [
    'Очень точное наблюдение о контейнировании — перечитываю второй раз.',
    'Здесь автор будто описывает мой вчерашний сеанс. Спасибо за перевод.',
    'Сильное место про альфа-функцию; хотелось бы больше клинических виньеток.',
    'Не соглашусь с трактовкой переноса в третьей главе — слишком прямолинейно.',
    'Прекрасный язык. Редкий случай, когда теория читается как проза.',
    'Эта книга изменила то, как я слушаю пациента в первые минуты.',
    'Местами тяжело, но именно эта плотность и держит мысль.',
    'Поделюсь на ближайшей супервизии — очень созвучно нашей группе.',
    'Глава о близости в кабинете — лучшее, что я читал на эту тему.',
    'Хорошая опора для начинающих: видно, как работает аналитическое поле.'
  ];
  var REVIEWS = [
    'Зрелая, выверенная работа. Перевод бережный, терминология точная — рекомендую коллегам и супервизантам.',
    'Книга, к которой возвращаешься. Теория мышления подана живо, без потери строгости. Высокая оценка заслуженно.',
    'Важный текст современной итальянской школы. Немного неровный к финалу, но это не умаляет ценности.',
    'Клинически насыщенно и честно. Отдельная благодарность за внимание к контрпереносу.'
  ];
  var REPLIES = [
    'Согласен, особенно про первые минуты сессии.',
    'А мне как раз третья глава показалась самой убедительной.',
    'Спасибо, возьму на заметку для группы.',
    'Да, перевод действительно бережный.',
    'Интересная мысль — раскроете подробнее?'
  ];
  var NEWS = [
    { title: 'Вышло новое издание «Научение на опыте»', text: 'Обновлённый перевод У. Р. Биона с уточнённой терминологией уже доступен в библиотеке.' },
    { title: 'β→α на конференции ЕКПП', text: 'Издательство представит современную итальянскую школу психоанализа — Ферро, Николи и их собеседники.' },
    { title: 'Открыт читательский клуб «Бионианское поле»', text: 'Совместное чтение «Внимание и интерпретация» начнётся в следующем месяце.' },
    { title: 'Гореть вместе: сборник под редакцией Л. Николи', text: 'Сборник о группах и общем аффекте — впервые на русском языке.' }
  ];

  function slugs() { return (window.BA.bookData && BA.bookData.SLUGS) || []; }
  function mocks() { return (window.BA.memberData && BA.memberData.mocks()) || []; }
  /* the sim author pool: mock members + the seeded real members (so prominent
     professional pages also have content), minus the active user & admin. All
     authored content is source:'sim' (cleared by "clear simulation data"). */
  function authors() {
    return ((window.BA.memberData && BA.memberData.people()) || [])
      .filter(function (m) { return m.id !== 'u1' && m.id !== 'admin'; });
  }
  function verifiedAuthors() {
    return authors().filter(function (m) { return BA.memberData.privNamesOf(m).indexOf('Verified') >= 0; });
  }
  function pubOf(slug) { return slug; } // publicationId == slug in the blueprint pack
  function editionOf(slug) {
    var b = window.BA.bookData && BA.bookData.get(slug);
    if (!b || !b.editions || !b.editions.length) return null;
    var last = b.editions[b.editions.length - 1];      // newest = the complete/full edition
    return last.v || last.id || null;
  }

  /* ── one-time historical backfill ── */
  function backfill() {
    var st = S(); if (!st) return;
    var d = st.db();
    if (d.seededContent) return;
    var ms = authors(), vms = verifiedAuthors(), sl = slugs();
    if (!ms.length || !sl.length) return;

    sl.forEach(function (slug, si) {
      var pub = pubOf(slug), ver = editionOf(slug);
      /* 2–4 comments per book */
      var nC = 2 + rand(3);
      var madeComments = [];
      for (var c = 0; c < nC; c++) {
        var author = pick(ms);
        var rec = st.addComment({ actorId: author.id, publicationId: pub, editionId: ver, text: pick(COMMENTS), source: 'sim', timestamp: st.isoMinusMin(60 * (24 * (7 - si % 7)) + rand(4000)) });
        if (rec) madeComments.push(rec);
      }
      /* 1–2 reviews per book (Verified mocks) */
      if (vms.length) {
        var nR = 1 + rand(2);
        for (var r = 0; r < nR; r++) {
          var rv = pick(vms);
          st.addReview({ actorId: rv.id, publicationId: pub, editionId: ver, rating: 4 + rand(2), text: pick(REVIEWS), source: 'sim', timestamp: st.isoMinusMin(60 * 24 * (5 + rand(20)) + rand(2000)) });
        }
      }
      /* book votes (rating signal) */
      ms.forEach(function (m) { if (chance(0.55)) st.castVote({ actorId: m.id, target: { type: 'publication', id: pub }, direction: chance(0.85) ? 'up' : 'down', coeffKey: 'publication', source: 'sim' }); });
      /* votes on comments → reputation to their authors */
      madeComments.forEach(function (cm) {
        ms.forEach(function (m) {
          if (m.id !== cm.authorId && chance(0.35))
            st.castVote({ actorId: m.id, target: { type: 'reaction', id: cm.id }, direction: chance(0.9) ? 'up' : 'down', recipientId: cm.authorId, source: 'sim' });
        });
        /* a reply or two */
        if (chance(0.5)) {
          var rp = pick(ms);
          if (rp.id !== cm.authorId) st.addReply({ actorId: rp.id, parentReactionId: cm.id, text: pick(REPLIES), source: 'sim', timestamp: st.isoMinusMin(rand(3000)) });
        }
      });
      /* reading by a couple of mock members (engagement events) */
      ms.forEach(function (m) {
        if (chance(0.5)) st.readingSession({ actorId: m.id, publicationId: pub, bookVersionId: ver, pages: [1, 2, 3, 4], endPage: 4, percent: 12, durationSeconds: 300 + rand(900), crossThreshold: chance(0.5), thresholdMethod: 'auto', source: 'sim', timestamp: st.isoMinusMin(rand(8000)) });
      });
    });

    /* News (Resource voice via Bot — real platform content) */
    NEWS.forEach(function (n, i) { st.publishNews({ id: 'news-' + i, title: n.title, text: n.text, timestamp: st.isoMinusMin(60 * 24 * (i + 1)) }); });

    seedPersonal('u1');

    d.seededContent = true;
    st.persist();
    if (st.subscribe) try { document.dispatchEvent(new CustomEvent('ba:store-change', { detail: { kind: 'backfill' } })); } catch (e) {}
  }

  /* ── active member's personal traces (source:'real') so the Cabinet demos ── */
  function seedPersonal(memberId) {
    var st = S(); var sl = slugs(); if (!sl.length) return;
    /* follow a few colleagues (so the Activity Feed / Poster populates) + an author */
    ['m2', 'm3', 'u3'].forEach(function (id) { st.addTrack({ actorId: memberId, target: { type: 'member', id: id }, strength: 'strong', origin: 'explicit', source: 'real', silent: true }); });
    if (window.BA.authorData && BA.authorData.ids().length) st.addTrack({ actorId: memberId, target: { type: 'author', id: BA.authorData.ids()[0] }, strength: 'strong', origin: 'explicit', source: 'real', silent: true });
    /* shelf: a couple of statuses */
    st.setShelf({ actorId: memberId, publicationId: sl[0], status: 'reading', source: 'real', silent: true });
    if (sl[1]) st.setShelf({ actorId: memberId, publicationId: sl[1], status: 'to_read', source: 'real', silent: true });
    if (sl[2]) st.setShelf({ actorId: memberId, publicationId: sl[2], status: 'read', source: 'real', silent: true });
    if (sl[3]) st.setShelf({ actorId: memberId, publicationId: sl[3], status: 'favourite', source: 'real', silent: true });
    /* a reading session in progress on the first book */
    st.readingSession({ actorId: memberId, publicationId: sl[0], bookVersionId: editionOf(sl[0]), pages: [1, 2, 3, 4, 5, 6], endPage: 6, percent: 22, durationSeconds: 720, source: 'real' });
    /* two excerpts (saved fragments) — the citation chain */
    [sl[0], sl[2] || sl[1]].forEach(function (slug, i) {
      if (!slug) return;
      var ver = editionOf(slug);
      var mark = st.insert('marks', { id: st.uuid(), memberId: memberId, editionId: ver, publicationId: slug, page: 12 + i * 7, createdAt: st.nowISO() });
      var frag = st.insert('fragments', { id: st.uuid(), markId: mark.id, editionId: ver, publicationId: slug,
        range: { startPage: mark.page, startOffset: 0, endPage: mark.page, endOffset: 180 },
        text: i === 0 ? 'Способность выдерживать неопределённость — условие подлинной встречи с пациентом.' : 'Контейнирование начинается не со слов, а с присутствия.',
        createdAt: st.nowISO() });
      st.insert('excerpts', { id: st.uuid(), memberId: memberId, fragmentId: frag.id, note: '', createdAt: st.nowISO() });
    });
    /* the active member authors a couple of comments, then mock members reply +
       upvote them — so the member has inbound notifications + earned reputation
       (otherwise feeds/notifications would only target mock authors). */
    var ms = mocks();
    [sl[0], sl[1] || sl[0]].forEach(function (slug, i) {
      if (!slug || !ms.length) return;
      var cm = st.addComment({ actorId: memberId, publicationId: slug, editionId: editionOf(slug),
        text: i === 0 ? 'Перечитываю с карандашом — здесь столько опоры для практики.' : 'Сильный текст; буду рекомендовать супервизантам.',
        source: 'real', timestamp: st.isoMinusMin(60 * (12 + i * 8)) });
      if (!cm) return;
      ms.slice(0, 3 + i).forEach(function (m, j) {
        st.castVote({ actorId: m.id, target: { type: 'reaction', id: cm.id }, direction: 'up', recipientId: memberId, source: 'sim', timestamp: st.isoMinusMin(rand(600)) });
        if (j === 0) st.addReply({ actorId: m.id, parentReactionId: cm.id, text: pick(REPLIES), source: 'sim', timestamp: st.isoMinusMin(rand(400)) });
      });
    });
    /* a sample correspondence (the active member ↔ a colleague) */
    var peer = (window.BA.memberData.get('m2')) ? 'm2' : (ms[0] && ms[0].id);
    if (peer) {
      st.sendMessage({ actorId: peer, recipientId: memberId, text: 'Коллега, спасибо за рекомендацию «Гореть вместе» — взяла в работу с группой.', source: 'real', timestamp: st.isoMinusMin(180) });
      var chat = st.all('chats')[st.all('chats').length - 1];
      if (chat) {
        st.sendMessage({ actorId: memberId, recipientId: peer, chatId: chat.id, text: 'Рада, что пригодилось! Там сильная глава про общий аффект.', source: 'real', timestamp: st.isoMinusMin(150) });
        st.sendMessage({ actorId: peer, recipientId: memberId, chatId: chat.id, text: 'Да, как раз её и разбирали. Ещё посоветуете что-то по группам?', source: 'real', timestamp: st.isoMinusMin(90) });
      }
    }
    st.persist();
  }

  /* ── live tick loop ── */
  var _timer = null;
  function oneTick() {
    var st = S(); var ms = authors(), sl = slugs(); if (!ms.length || !sl.length) return;
    var m = pick(ms), slug = pick(sl), pub = pubOf(slug), ver = editionOf(slug);
    var roll = rand(100);
    if (roll < 35) st.addComment({ actorId: m.id, publicationId: pub, editionId: ver, text: pick(COMMENTS), source: 'sim' });
    else if (roll < 55) st.castVote({ actorId: m.id, target: { type: 'publication', id: pub }, direction: chance(0.85) ? 'up' : 'down', coeffKey: 'publication', source: 'sim' });
    else if (roll < 70 && verifiedAuthors().length) { var v = pick(verifiedAuthors()); st.addReview({ actorId: v.id, publicationId: pub, editionId: ver, rating: 4 + rand(2), text: pick(REVIEWS), source: 'sim' }); }
    else if (roll < 85) {
      var comments = st.find('reactions', function (r) { return r.form === 'comment' && r.targetId === pub; });
      if (comments.length) { var cm = pick(comments); if (cm.authorId !== m.id) st.castVote({ actorId: m.id, target: { type: 'reaction', id: cm.id }, direction: 'up', recipientId: cm.authorId, source: 'sim' }); }
    } else st.readingSession({ actorId: m.id, publicationId: pub, bookVersionId: ver, pages: [1, 2], endPage: 2, percent: 6, durationSeconds: 200 + rand(400), source: 'sim' });
  }
  function start(rateMs) {
    var st = S(); if (!st) return;
    stop();
    var d = st.db(); d.simulation.running = true; d.simulation.tickRateMs = rateMs || d.simulation.tickRateMs || 2500; st.persist();
    _timer = setInterval(oneTick, d.simulation.tickRateMs);
  }
  function stop() {
    if (_timer) { clearInterval(_timer); _timer = null; }
    var st = S(); if (st) { var d = st.db(); d.simulation.running = false; st.persist(); }
  }
  function isRunning() { return !!_timer; }

  /* ensure content exists on first load of any engine page */
  function ensure() {
    var st = S(); if (!st) return;
    if (!st.db().seededContent) backfill();
  }

  window.BA.sim = { backfill: backfill, seedPersonal: seedPersonal, ensure: ensure, oneTick: oneTick, start: start, stop: stop, isRunning: isRunning };

  /* auto-backfill once everything is loaded */
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ensure);
  else ensure();
})();

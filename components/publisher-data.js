/* components/publisher-data.js — Shared publisher model (the Producers tab)
   ────────────────────────────────────────────────────────────────────────────
   Single source of publisher truth. Consumed by the Producers tab (library.html)
   and the Publisher PAGE (pages/publisher.html). β→α is the sole publisher in
   the Primer — the `publisher_id:'beta-alpha'` constant (principle 7) surfaced
   as a main entity (system-model §4.8, specs §1.5 Publisher).

   Feature areas: Producers · Publisher page. Spec refs: specs.md §1.5 (Publisher
   entity: id/slug/name/description/logo), principle 7 (publisher surfaced; id
   stays internal). Publications resolve against BA.bookData; the author roster is
   DERIVED from those publications against BA.authorData. Social data (Track /
   community reactions) is left EMPTY this round (empty state, CON-01). */
(function () {
  'use strict';
  window.BA = window.BA || {};

  var PUBLISHERS = {
    'beta-alpha': {
      id: 'beta-alpha',          /* INTERNAL constant; never shown as an id in the UI (principle 7) */
      slug: 'beta-alpha',        /* /publisher/{slug} */
      name: 'beta→alpha',
      mark: 'β→α',
      fullName: 'Издательство «beta→alpha» (β→α)',
      tagline: 'Профессиональная литература по психоанализу и психотерапии',
      blurb: 'Издательство, специализирующееся на психоанализе и психотерапии: классики постбионианской традиции и ведущие голоса современной итальянской школы — впервые на русском языке.',
      about: 'beta→alpha — независимое издательство, выпускающее ~30–35 профессиональных книг в год в области психоанализа и психотерапии. Мы переводим и издаём ключевые тексты постбионианской традиции и современной итальянской школы — Биона, Ферро, Николи и их собеседников, — стремясь к выверенному переводу, бережной редактуре и точной терминологии. На платформе beta→alpha.academy издательство выступает «голосом Ресурса»: оно владеет правами на публикации, ведёт каталог и редакционные подборки и честно разделяет доход с правообладателями пропорционально реальной вовлечённости читателей.',
      focus: ['Психоанализ', 'Психотерапия', 'Постбионианская традиция', 'Итальянская школа', 'Клиническая теория'],
      logo: '',
      /* null → all of BA.bookData.SLUGS (the whole Primer pack belongs to β→α) */
      publications: null
    }
  };

  function _slugs(pub) {
    if (pub && pub.publications && pub.publications.length) return pub.publications;
    return (window.BA && BA.bookData) ? BA.bookData.SLUGS.slice() : [];
  }

  /* Resolve a publication slug → a light {id,slug,title,author,authorId,sub,cover}
     for grids/lists (mirrors author-data.workRef). */
  function pubRef(slug) {
    var bd = window.BA && BA.bookData;
    var b = bd && bd.get(slug);
    if (!b) return { id: slug, slug: slug, title: slug, author: '', authorId: '', sub: '', cover: '', year: '' };
    return {
      id: slug, slug: slug, title: b.title, author: b.editor ? b.editor + ' (ред.)' : b.author,
      authorId: b.authorId, sub: (b.subtitle ? b.subtitle + ' · ' : '') + b.year, cover: b.cover, year: b.year
    };
  }

  function publicationsOf(pub) { return _slugs(pub).map(pubRef); }

  /* Derived author roster: distinct authors across the publisher's publications. */
  function authorsOf(pub) {
    var ad = window.BA && BA.authorData;
    var seen = {}, out = [];
    _slugs(pub).forEach(function (slug) {
      var b = window.BA && BA.bookData && BA.bookData.get(slug);
      if (!b || !b.authorId || seen[b.authorId]) return;
      seen[b.authorId] = true;
      out.push((ad && ad.get(b.authorId)) || { id: b.authorId, name: b.author, meta: '', works: [] });
    });
    return out;
  }

  function stats(pub) { return { titles: _slugs(pub).length, authors: authorsOf(pub).length }; }

  function get(id) { return PUBLISHERS[id] || null; }
  function all() { return Object.keys(PUBLISHERS).map(function (k) { return PUBLISHERS[k]; }); }

  /* every Primer book is published by β→α (the internal constant). */
  function publisherOfBook() { return 'beta-alpha'; }

  window.BA.publisherData = {
    PUBLISHERS: PUBLISHERS,
    get: get, all: all, ids: function () { return Object.keys(PUBLISHERS); },
    publicationsOf: publicationsOf, authorsOf: authorsOf, stats: stats, pubRef: pubRef,
    publisherOfBook: publisherOfBook
  };
})();

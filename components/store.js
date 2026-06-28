/* components/store.js — The observable typed-collections store (the LocalStore).
   ════════════════════════════════════════════════════════════════════════════
   Unifies onto the single window.BA.store object: it AUGMENTS the kv helper from
   session.js (uid/key/get/set/remove/clear stay, per-user namespaced) with the
   full observable LocalStore — collections, boundary validation, append-only
   Events (rich envelope + action_id), the derived selectors (Rank, effective
   weight, CapabilitySet, book rating, threads, grouped notifications, feeds), and
   the high-level ACTION helpers (one action → one-or-more events sharing an
   action_id). This is the project's "one store" (session decision; TD-8 = the
   Zustand+selectors model approximated in vanilla JS).

   HUMAN-REVIEW-MANDATORY (CLAUDE.md §11): event schema + auth/standing + data
   model. Shapes from specs.md — not invented:
     • Event envelope: specs §1.15 / §2.1  { id, action_id, timestamp, who,
       action{codename,params}, with_what, visibility, source, publisher_id }
     • Append-only, capped by debug.eventRetentionCap (principle 8 / specs §2.4)
     • Reputation = stored XP (votes received only) → Rank derived via tierOf
       (specs §1.3/§3.2); effective_weight = rankMult × (Verified?proFactor:1) ×
       targetCoeff (specs §3.3); book rating blend α·reviews+(1−α)·votes (§1.10/§3.3)
     • CapabilitySet from the capability catalog (specs §1.4/§3.5a)
     • Notifications grouped by (type × target), consume-on-open, newest-first (O-10)
     • SystemSettings scoring defaults O-5 (vote +1, review ×3, α 0.8, ranks ×1/2/3/5)

   Storage tier (specs §7.1): COMMUNITY data is GLOBAL (one localStorage blob
   `ba_db_v1`, records keyed by memberId) so every member/sim write is visible to
   every viewer — distinct from BA.store's per-user kv. Validated at the boundary
   (Zod is Phase-2; here lightweight manual validators approximate it, specs §7.2).
   Load order: session.js → member-data.js → book/author/publisher-data → store.js.
   ════════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  window.BA = window.BA || {};
  var store = window.BA.store || (window.BA.store = {});

  var DB_KEY = 'ba_db_v1';
  var PUBLISHER = 'beta-alpha';

  /* ── ids / time (browser runtime — randomUUID/Date are fine here) ── */
  function uuid() {
    try { return crypto.randomUUID(); } catch (e) {}
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
  }
  function nowISO() { return new Date().toISOString(); }
  function isoMinusMin(min) { return new Date(Date.now() - min * 60000).toISOString(); }

  /* ── SystemSettings scoring defaults (O-5; specs §1.16) ── */
  var DEFAULT_SETTINGS = {
    rankThresholds: [
      { name: 'Новичок', min: 0,   multiplier: 1 },
      { name: 'Практик', min: 50,  multiplier: 2 },
      { name: 'Эксперт', min: 150, multiplier: 3 },
      { name: 'Мэтр',    min: 350, multiplier: 5 }
    ],
    proFactor: 2,
    targetCoefficients: { publication: 1, edition: 1, author: 1, publisher: 1, member: 1, reaction: 1, review: 3 },
    ratingAlpha: 0.8,
    reputationDeltas: { vote: 1 },   // +1 per vote received (net by direction × caster weight)
    capabilityRequirements: {}
  };

  /* ── Capability catalog (specs §1.4 / §3.5a). req = ALL-required privileges ── */
  var CAPS = {
    open_edition:     { req: ['Registered'] },
    read_full_edition:{ req: ['Registered'] },
    read_community:   { req: ['Registered'] },
    comment:          { req: ['Registered'] },
    reply:            { req: ['Registered'] },
    vote:             { req: ['Registered'] },
    review_and_rate:  { req: ['Registered', 'Verified'] },   // Professional-only (§3.8)
    message:          { req: ['Registered'] },
    publish_post:     { req: ['Registered'] },
    create_club:      { req: ['Registered', 'Verified'] },
    report:           { req: ['Registered'] },
    moderate:         { req: ['Registered', 'Verified', 'Moderator'] },
    operate:          { req: ['Registered', 'Verified', 'Moderator', 'Admin'] },
    view_events:      { req: ['Registered', 'Verified', 'Moderator', 'Admin'] },
    vote_weight:      { req: ['Registered'], kind: 'valued' }
  };

  /* array vs map collections (specs §1.17 LocalStore) */
  var ARRAYS = ['sessions', 'registrationSubmissions', 'references', 'marks', 'remarks',
    'fragments', 'excerpts', 'citations', 'reactions', 'threads', 'chats', 'collections',
    'clubs', 'clubMemberships', 'progress', 'readerState', 'shelfStatuses', 'tracks',
    'flags', 'events', 'cohorts'];
  var MAPS = ['reputationScores', 'privileges', 'subscriptions', 'preferences',
    'notificationReadState', 'members'];

  function blank() {
    var db = {};
    ARRAYS.forEach(function (k) { db[k] = []; });
    MAPS.forEach(function (k) { db[k] = {}; });
    db.systemSettings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    db.simulation = { running: false, tickRateMs: 2500, activityMultiplier: 1 };
    db.debug = { eventRetentionCap: 2000 };
    db.uiPrefs = { schema: 'bright' };
    db.seededAt = null;
    db.seededContent = false;
    return db;
  }

  var _db = null;
  var _subs = [];

  /* ── boundary validation (lightweight; approximates Zod parse on load) ── */
  function _coerce(db) {
    var base = blank();
    if (!db || typeof db !== 'object') return base;
    ARRAYS.forEach(function (k) { base[k] = Array.isArray(db[k]) ? db[k] : []; });
    MAPS.forEach(function (k) { base[k] = (db[k] && typeof db[k] === 'object') ? db[k] : {}; });
    if (db.systemSettings) base.systemSettings = Object.assign(base.systemSettings, db.systemSettings);
    if (db.simulation) base.simulation = Object.assign(base.simulation, db.simulation);
    if (db.debug) base.debug = Object.assign(base.debug, db.debug);
    if (db.uiPrefs) base.uiPrefs = Object.assign(base.uiPrefs, db.uiPrefs);
    base.seededAt = db.seededAt || null;
    base.seededContent = !!db.seededContent;
    return base;
  }

  function _load() {
    if (_db) return _db;
    var raw = null;
    try { raw = localStorage.getItem(DB_KEY); } catch (e) {}
    var parsed = null;
    if (raw) { try { parsed = JSON.parse(raw); } catch (e) { parsed = null; } }
    _db = _coerce(parsed);
    _seedStructural();
    return _db;
  }
  function persist() {
    try { localStorage.setItem(DB_KEY, JSON.stringify(_db)); } catch (e) {}
  }
  function _notify(change) {
    _subs.forEach(function (fn) { try { fn(change || {}); } catch (e) {} });
    try { document.dispatchEvent(new CustomEvent('ba:store-change', { detail: change || {} })); } catch (e) {}
  }

  /* ── seeding: members + settings + a sim cohort (structural only; content
       backfill lives in sim.js so the store has no sim text dependency) ── */
  function _seedStructural() {
    if (_db.seededAt) return;
    var md = window.BA && BA.memberData;
    if (md) {
      md.all().forEach(function (m) {
        _db.members[m.id] = m;
        _db.privileges[m.id] = m.privileges || [];
        if (_db.reputationScores[m.id] == null) _db.reputationScores[m.id] = m.reputationScore || 0;
      });
      /* one cohort of the Mock members (specs §1.16a) */
      _db.cohorts = [{
        id: 'cohort-core', name: 'Базовая когорта', mood: 'mixed',
        size: md.mocks().length, active: true,
        privileges: ['Registered', 'Verified', 'Mock'],
        memberIds: md.mocks().map(function (m) { return m.id; })
      }];
    }
    _db.seededAt = nowISO();
    persist();
  }

  /* ════════════════ collection access ════════════════ */
  function coll(name) { _load(); return _db[name]; }            // live reference
  function all(name) { return (coll(name) || []).slice(); }
  function map(name) { _load(); return _db[name]; }
  function settings() { _load(); return _db.systemSettings; }
  function db() { return _load(); }

  function insert(name, rec) {
    _load();
    if (!rec.id) rec.id = uuid();
    _db[name].push(rec);
    return rec;
  }
  function update(name, id, patch) {
    _load();
    var arr = _db[name], i;
    for (i = 0; i < arr.length; i++) if (arr[i].id === id) { Object.assign(arr[i], patch); return arr[i]; }
    return null;
  }
  function find(name, pred) { return (coll(name) || []).filter(pred); }
  function first(name, pred) { var r = find(name, pred); return r.length ? r[0] : null; }

  /* ════════════════ identity / standing selectors ════════════════ */
  function privNames(memberId) {
    var g = map('privileges')[memberId] || [];
    return g.map(function (x) { return x.privilege; });
  }
  function roleOf(privs) {
    privs = privs || [];
    if (privs.indexOf('Admin') >= 0) return 'Admin';
    if (privs.indexOf('Moderator') >= 0) return 'Moderator';
    if (privs.indexOf('Verified') >= 0) return 'Professional';
    if (privs.indexOf('Registered') >= 0) return 'Member';
    return 'Guest';
  }
  function rankOf(score) {
    var th = settings().rankThresholds, r = th[0];
    for (var i = 0; i < th.length; i++) if ((score || 0) >= th[i].min) r = th[i];
    return r; // {name, min, multiplier}
  }
  function tierOf(score) { return rankOf(score).name; }
  function xpOf(memberId) { var v = map('reputationScores')[memberId]; return v == null ? 0 : v; }

  /* effective weight = rankMult × (Verified?proFactor:1) × targetCoeff(coeffKey) */
  function effectiveWeight(memberId, coeffKey) {
    var s = settings();
    var privs = privNames(memberId);
    var mult = rankOf(xpOf(memberId)).multiplier;
    var pro = privs.indexOf('Verified') >= 0 ? s.proFactor : 1;
    var coeff = (coeffKey && s.targetCoefficients[coeffKey] != null) ? s.targetCoefficients[coeffKey] : 1;
    return mult * pro * coeff;
  }

  function capabilitySet(memberId) {
    var privs = memberId ? privNames(memberId) : [];
    var score = memberId ? xpOf(memberId) : 0;
    var rank = rankOf(score);
    var gates = {}, values = {};
    Object.keys(CAPS).forEach(function (key) {
      var cap = CAPS[key];
      var ov = settings().capabilityRequirements[key];
      var req = (ov && ov.req) || cap.req || [];
      var minRank = ov && ov.minRank;
      var hasAll = req.every(function (p) { return privs.indexOf(p) >= 0; });
      var rankOK = !minRank || rank.min >= rankOf_min(minRank);
      var allowed = !!memberId && hasAll && rankOK;
      if (cap.kind === 'valued') values[key] = effectiveWeight(memberId);
      else gates[key] = allowed;
    });
    return { memberId: memberId || null, gates: gates, values: values };
  }
  function rankOf_min(rankName) {
    var th = settings().rankThresholds;
    for (var i = 0; i < th.length; i++) if (th[i].name === rankName) return th[i].min;
    return 0;
  }
  /* convenience: can the active member (or a given member) fire a capability? */
  function can(key, memberId) {
    memberId = memberId || activeId();
    if (!memberId) return false;
    var cs = capabilitySet(memberId);
    return !!cs.gates[key];
  }

  function activeId() {
    var s = window.BA && BA.session ? BA.session.get() : null;
    return s && s.id ? s.id : null;
  }
  function memberRecord(id) { return map('members')[id] || (window.BA && BA.memberData ? BA.memberData.get(id) : null); }

  /* PublicProfile (derived; drops credentials/email — specs §1.2) */
  function publicProfileOf(id) {
    var m = memberRecord(id);
    if (!m) return null;
    var privs = privNames(id);
    var score = xpOf(id);
    return {
      id: id, displayName: m.displayName, specialisation: m.specialisation || '',
      title: m.title || '', avatar: (BA.memberData ? BA.memberData.avatar(m) : ''),
      privileges: privs, role: roleOf(privs), reputationScore: score, rank: tierOf(score)
    };
  }

  /* ════════════════ events: the append-only log ════════════════ */
  function _validEvent(ev) {
    return ev && typeof ev.codename === 'string' && ev.who && ev.who.entity_id;
  }
  /* low-level append (one event). Use emitAction() for multi-event actions. */
  function emit(codename, opts) {
    _load();
    opts = opts || {};
    var ev = {
      id: uuid(),
      action_id: opts.action_id || uuid(),
      timestamp: opts.timestamp || nowISO(),
      who: opts.who || { entity: 'member', entity_id: activeId() || 'system' },
      action: { codename: codename, params: opts.params || {} },
      with_what: opts.with_what || null,
      visibility: opts.visibility || 'public',
      source: opts.source || 'real',
      publisher_id: PUBLISHER
    };
    if (!_validEvent({ codename: codename, who: ev.who })) return null;
    _db.events.push(ev);
    var cap = (_db.debug && _db.debug.eventRetentionCap) || 2000;
    if (_db.events.length > cap) _db.events.splice(0, _db.events.length - cap);
    return ev;
  }

  /* ════════════════ ACTION helpers (one action → ≥1 events, shared action_id) ═══
     Each returns the action_id. They write entities AND emit. Used by the UI and
     by the simulation (pass source:'sim'). ─────────────────────────────────── */

  /* cast / switch a vote. target = {type, id}; recipientId set for member-content.
     effect derives from target type (specs §1.9 / §2.2a). */
  function castVote(o) {
    _load();
    var aid = o.action_id || uuid();
    var src = o.source || 'real';
    var actorId = o.actorId || activeId();
    if (!actorId) return null;
    var tt = o.target.type, tid = o.target.id;
    var effect = (tt === 'member' || tt === 'reaction') ? 'reputation'
      : (tt === 'publication' || tt === 'edition') ? 'book-rating' : 'community-display';
    var recipientId = o.recipientId || null;
    if (effect === 'reputation' && !recipientId && tt === 'member') recipientId = tid;
    var coeffKey = o.coeffKey || (effect === 'book-rating' ? tt : null);
    var weight = effectiveWeight(actorId, coeffKey);
    var dirSign = o.direction === 'down' ? -1 : 1;

    /* one mutable vote per (caster,target); no self-vote */
    if (effect === 'reputation' && recipientId === actorId) return null;
    var existing = first('reactions', function (r) {
      return r.form === 'vote' && r.authorId === actorId && r.targetType === tt && r.targetId === tid;
    });
    var prevSigned = 0;
    if (existing && existing.vote) prevSigned = (existing.vote.direction === 'down' ? -1 : 1) * existing.vote.weight;
    var vote = {
      direction: o.direction || 'up', effect: effect, recipientId: recipientId,
      weight: weight, castAt: nowISO()
    };
    if (existing) { existing.vote = vote; existing.updatedAt = nowISO(); }
    else {
      insert('reactions', {
        form: 'vote', authorId: actorId, targetType: tt, targetId: tid, vote: vote,
        editionId: o.editionId || null, createdAt: nowISO(), source: src
      });
    }
    var actor = publicProfileOf(actorId);
    emit('vote.cast', {
      action_id: aid, source: src, who: { entity: 'member', entity_id: actorId },
      with_what: { entity: tt, entity_id: tid },
      visibility: effect === 'reputation' ? 'targeted' : 'public',
      params: {
        actor: actor ? { role: actor.role, rank: actor.rank, effective_weight: weight } : null,
        direction: vote.direction, effect: effect, effective_weight: weight,
        recipient_id: recipientId, edition_id: o.editionId || null
      }
    });
    /* secondary: reputation.changed (member-content) — sharing action_id */
    if (effect === 'reputation' && recipientId) {
      var newSigned = dirSign * weight;
      var delta = (newSigned - prevSigned) * (settings().reputationDeltas.vote || 1);
      var before = xpOf(recipientId);
      var after = before + delta;
      map('reputationScores')[recipientId] = after;
      emit('reputation.changed', {
        action_id: aid, source: src, who: { entity: 'member', entity_id: actorId },
        with_what: { entity: 'member', entity_id: recipientId },
        visibility: 'targeted',
        params: {
          delta: delta, new_score: after, new_rank: tierOf(after),
          rank_crossed: tierOf(before) !== tierOf(after),
          recipient_id: recipientId, cause: { action_id: aid, codename: 'vote.cast' }
        }
      });
    }
    persist(); _notify({ kind: 'vote' });
    return aid;
  }

  /* comment on a Publication (subject = publication; editionId is a tag) */
  function addComment(o) {
    _load();
    var aid = uuid(), src = o.source || 'real';
    var actorId = o.actorId || activeId(); if (!actorId) return null;
    var piece = { id: uuid(), text: o.text || '', inlays: [], updatedAt: nowISO() };
    var rec = insert('reactions', {
      form: 'comment', authorId: actorId, targetType: 'publication', targetId: o.publicationId,
      editionId: o.editionId || null, piece: piece, parentReactionId: null,
      createdAt: o.timestamp || nowISO(), source: src
    });
    emit('comment.created', {
      action_id: aid, source: src, timestamp: o.timestamp, who: { entity: 'member', entity_id: actorId },
      with_what: { entity: 'publication', entity_id: o.publicationId }, visibility: 'public',
      params: { comment_id: rec.id, edition_id: o.editionId || null }
    });
    persist(); _notify({ kind: 'comment' });
    return rec;
  }

  /* review (Professional-only; Comment + Vote → book rating) */
  function addReview(o) {
    _load();
    var aid = uuid(), src = o.source || 'real';
    var actorId = o.actorId || activeId(); if (!actorId) return null;
    if (src !== 'sim' && !can('review_and_rate', actorId)) return null; // Pro-only gate (live)
    var weight = effectiveWeight(actorId, 'review');
    var piece = { id: uuid(), text: o.text || '', inlays: [], updatedAt: nowISO() };
    var rec = insert('reactions', {
      form: 'review', authorId: actorId, targetType: 'publication', targetId: o.publicationId,
      editionId: o.editionId || null, rating: o.rating || 5, piece: piece,
      vote: { direction: (o.rating || 5) >= 3 ? 'up' : 'down', effect: 'book-rating', recipientId: null, weight: weight, castAt: nowISO() },
      createdAt: o.timestamp || nowISO(), source: src
    });
    emit('review.created', {
      action_id: aid, source: src, timestamp: o.timestamp, who: { entity: 'member', entity_id: actorId },
      with_what: { entity: 'publication', entity_id: o.publicationId }, visibility: 'public',
      params: { review_id: rec.id, book_version_id: o.editionId || null, rating: o.rating || 5, effective_weight: weight }
    });
    persist(); _notify({ kind: 'review' });
    return rec;
  }

  /* reply to a Reaction (threads comments) — targeted to the parent's author */
  function addReply(o) {
    _load();
    var aid = uuid(), src = o.source || 'real';
    var actorId = o.actorId || activeId(); if (!actorId) return null;
    var parent = first('reactions', function (r) { return r.id === o.parentReactionId; });
    var recipientId = parent ? parent.authorId : null;
    var piece = { id: uuid(), text: o.text || '', inlays: [], updatedAt: nowISO() };
    var rec = insert('reactions', {
      form: 'reply', authorId: actorId, targetType: 'reaction', targetId: o.parentReactionId,
      parentReactionId: o.parentReactionId, piece: piece, createdAt: o.timestamp || nowISO(), source: src
    });
    emit('reply.created', {
      action_id: aid, source: src, timestamp: o.timestamp, who: { entity: 'member', entity_id: actorId },
      with_what: { entity: 'reaction', entity_id: o.parentReactionId }, visibility: 'targeted',
      params: { reply_id: rec.id, parent_reaction_id: o.parentReactionId, recipient_id: recipientId }
    });
    persist(); _notify({ kind: 'reply' });
    return rec;
  }

  /* message in a Chat (private) */
  function sendMessage(o) {
    _load();
    var aid = uuid(), src = o.source || 'real';
    var actorId = o.actorId || activeId(); if (!actorId) return null;
    var chat = o.chatId ? first('chats', function (c) { return c.id === o.chatId; }) : null;
    if (!chat) {
      chat = insert('chats', { memberIds: [actorId, o.recipientId].filter(Boolean), createdAt: nowISO() });
    }
    var piece = { id: uuid(), text: o.text || '', inlays: [], updatedAt: nowISO() };
    var rec = insert('reactions', {
      form: 'message', authorId: actorId, targetType: 'reaction', targetId: o.parentReactionId || null,
      parentReactionId: o.parentReactionId || null, chatId: chat.id, piece: piece,
      createdAt: o.timestamp || nowISO(), source: src
    });
    emit('message.sent', {
      action_id: aid, source: src, who: { entity: 'member', entity_id: actorId },
      with_what: { entity: 'reaction', entity_id: o.parentReactionId || chat.id }, visibility: 'targeted',
      params: { message_id: rec.id, chat_id: chat.id, recipient_id: o.recipientId }
    });
    persist(); _notify({ kind: 'message' });
    return rec;
  }

  /* publish (Post action). item = {kind:'piece'|'collection', id}, destination, visibility */
  function publishPost(o) {
    _load();
    var aid = uuid(), src = o.source || 'real';
    var actorId = o.actorId || activeId(); if (!actorId) return null;
    emit('post.published', {
      action_id: aid, source: src, who: { entity: actorId === 'bot' ? 'bot' : 'member', entity_id: actorId },
      with_what: { entity: o.itemKind || 'piece', entity_id: o.itemId || uuid() },
      visibility: (o.visibility === 'member-only') ? 'targeted' : 'public',
      params: { prev_visibility: 'private', visibility: o.visibility || 'public', destination: o.destination || 'discussions', club_id: o.clubId || null, title: o.title || '', text: o.text || '' }
    });
    persist(); _notify({ kind: 'post' });
    return aid;
  }

  /* News (Resource post via Bot) */
  function publishNews(o) {
    return publishPost({ actorId: 'bot', itemKind: 'piece', itemId: o.id || uuid(),
      visibility: 'public', destination: 'public-news', title: o.title, text: o.text,
      source: o.source || 'real', timestamp: o.timestamp });
  }

  /* reading session (chains threshold/shelf/track under one action_id) */
  function readingSession(o) {
    _load();
    var aid = uuid(), src = o.source || 'real';
    var actorId = o.actorId || activeId(); if (!actorId) return null;
    var pub = o.publicationId, ver = o.bookVersionId || null;
    function ev(codename, params, extra) {
      return emit(codename, Object.assign({
        action_id: aid, source: src, timestamp: o.timestamp, who: { entity: 'member', entity_id: actorId },
        with_what: { entity: 'publication', entity_id: pub }, visibility: 'self', params: params
      }, extra || {}));
    }
    ev('book.opened', { book_version_id: ver });
    if (o.pages) o.pages.forEach(function (p) { ev('page.viewed', { book_version_id: ver, page: p }); });
    if (o.endPage != null) {
      ev('reading.progress', { book_version_id: ver, page: o.endPage, percent: o.percent || 0 });
      /* Progress saved only for default full edition (§4.8) — store latest */
      var pr = first('progress', function (x) { return x.memberId === actorId && x.publicationId === pub; });
      if (pr) update('progress', pr.id, { editionId: ver, page: o.endPage, percent: o.percent || 0, updatedAt: nowISO() });
      else insert('progress', { memberId: actorId, publicationId: pub, editionId: ver, page: o.endPage, percent: o.percent || 0, updatedAt: nowISO() });
    }
    if (o.durationSeconds != null) ev('session.ended', { book_version_id: ver, duration_seconds: o.durationSeconds, pages_read: (o.pages || []).length });
    /* threshold → shelf reading → weak auto-track (secondary, shared action_id) */
    if (o.crossThreshold) {
      ev('reading.threshold.reached', { method: o.thresholdMethod || 'auto', book_version_id: ver });
      setShelf({ actorId: actorId, publicationId: pub, status: 'reading', source: src, action_id: aid, silent: true });
      ev('shelf.status.changed', { status: 'reading' }, { visibility: 'public' });
      addTrack({ actorId: actorId, target: { type: 'publication', id: pub }, strength: 'weak', origin: 'auto', source: src, action_id: aid, silent: true });
      ev('track.added', { strength: 'weak', origin: 'auto' });
    }
    persist(); _notify({ kind: 'reading' });
    return aid;
  }

  function setShelf(o) {
    _load();
    var actorId = o.actorId || activeId(); if (!actorId) return null;
    var ex = first('shelfStatuses', function (s) { return s.memberId === actorId && s.publicationId === o.publicationId; });
    if (ex) update('shelfStatuses', ex.id, { status: o.status, updatedAt: nowISO() });
    else insert('shelfStatuses', { id: uuid(), memberId: actorId, publicationId: o.publicationId, status: o.status, updatedAt: nowISO() });
    if (!o.silent) {
      emit('shelf.status.changed', {
        action_id: o.action_id || uuid(), source: o.source || 'real', who: { entity: 'member', entity_id: actorId },
        with_what: { entity: 'publication', entity_id: o.publicationId }, visibility: 'public',
        params: { status: o.status }
      });
      persist(); _notify({ kind: 'shelf' });
    }
    return ex;
  }

  function addTrack(o) {
    _load();
    var actorId = o.actorId || activeId(); if (!actorId) return null;
    var tt = o.target.type, tid = o.target.id;
    var ex = first('tracks', function (t) { return t.memberId === actorId && t.targetType === tt && t.targetId === tid; });
    var rec = { id: (ex && ex.id) || uuid(), memberId: actorId, targetType: tt, targetId: tid,
      hide: !!o.hide, strength: o.strength || 'strong', origin: o.origin || 'explicit', createdAt: nowISO() };
    if (ex) update('tracks', ex.id, rec); else insert('tracks', rec);
    if (!o.silent) {
      emit('track.added', {
        action_id: o.action_id || uuid(), source: o.source || 'real', who: { entity: 'member', entity_id: actorId },
        with_what: { entity: tt, entity_id: tid }, visibility: 'self',
        params: { strength: rec.strength, origin: rec.origin, hide: rec.hide }
      });
      persist(); _notify({ kind: 'track' });
    }
    return rec;
  }
  function removeTrack(o) {
    _load();
    var actorId = o.actorId || activeId(); if (!actorId) return null;
    var tt = o.target.type, tid = o.target.id;
    _db.tracks = _db.tracks.filter(function (t) { return !(t.memberId === actorId && t.targetType === tt && t.targetId === tid); });
    emit('track.removed', {
      source: o.source || 'real', who: { entity: 'member', entity_id: actorId },
      with_what: { entity: tt, entity_id: tid }, visibility: 'self', params: { origin: 'explicit' }
    });
    persist(); _notify({ kind: 'track' });
  }
  function isTracking(targetType, targetId, memberId) {
    memberId = memberId || activeId();
    return !!first('tracks', function (t) { return t.memberId === memberId && t.targetType === targetType && t.targetId === targetId && !t.hide; });
  }

  /* ════════════════ derived: reactions / threads / rating ════════════════ */
  function reactionsFor(targetType, targetId) {
    return find('reactions', function (r) { return r.targetType === targetType && r.targetId === targetId && !r.deleted; });
  }
  /* comments + reviews on a publication, with nested replies */
  function thread(rootType, rootId) {
    var tops = find('reactions', function (r) {
      return (r.form === 'comment' || r.form === 'review') && r.targetType === rootType && r.targetId === rootId && !r.deleted;
    }).sort(byCreatedDesc);
    return tops.map(function (t) { return { reaction: t, replies: repliesOf(t.id) }; });
  }
  function repliesOf(reactionId) {
    return find('reactions', function (r) { return r.form === 'reply' && r.parentReactionId === reactionId && !r.deleted; }).sort(byCreatedAsc);
  }
  function byCreatedDesc(a, b) { return (b.createdAt || '').localeCompare(a.createdAt || ''); }
  function byCreatedAsc(a, b) { return (a.createdAt || '').localeCompare(b.createdAt || ''); }

  function weightedTally(targetType, targetId) {
    var votes = find('reactions', function (r) { return r.form === 'vote' && r.targetType === targetType && r.targetId === targetId && r.vote; });
    var up = 0, down = 0;
    votes.forEach(function (r) { if (r.vote.direction === 'down') down += r.vote.weight; else up += r.vote.weight; });
    return { up: up, down: down, score: up - down, count: votes.length };
  }

  /* book rating blend: α·weightedReviewMean + (1−α)·voteSignal (specs §3.3) */
  function bookRating(publicationId) {
    var reviews = find('reactions', function (r) { return r.form === 'review' && r.targetType === 'publication' && r.targetId === publicationId && !r.deleted; });
    var a = settings().ratingAlpha;
    var rAgg = null, wsum = 0, acc = 0;
    reviews.forEach(function (r) {
      var w = (r.vote && r.vote.weight) || 1;
      acc += (r.rating || 0) * w; wsum += w;
    });
    if (wsum > 0) rAgg = acc / wsum;
    var tally = weightedTally('publication', publicationId);
    /* vote signal mapped to a 1..5 scale around 3 (stub) */
    var voteSignal = null;
    if (tally.count > 0) {
      var norm = tally.score / (tally.up + tally.down || 1); // -1..1
      voteSignal = Math.max(1, Math.min(5, 3 + norm * 2));
    }
    var score;
    if (rAgg != null && voteSignal != null) score = a * rAgg + (1 - a) * voteSignal;
    else if (rAgg != null) score = rAgg;
    else if (voteSignal != null) score = voteSignal;
    else score = null;
    return { score: score, reviews: reviews.length, votes: tally.count };
  }

  /* ════════════════ derived: notifications (grouped, O-10) ════════════════ */
  function _readState(memberId) {
    var rs = map('notificationReadState')[memberId];
    if (!rs) { rs = { memberId: memberId, lastReadAt: null, readIds: [] }; map('notificationReadState')[memberId] = rs; }
    return rs;
  }
  function _family(codename) { return String(codename).split('.')[0]; }
  /* candidate notification events for a viewer */
  function _notifEvents(memberId) {
    return find('events', function (e) {
      if (e.who && e.who.entity_id === memberId) return false; // not your own
      var rid = e.action && e.action.params && e.action.params.recipient_id;
      if (e.visibility === 'targeted' && rid === memberId) return true;
      if (e.action.codename === 'reputation.changed' && rid === memberId) return true;
      if (e.action.codename === 'version.published') {
        // for books you read/shelf
        var pid = e.with_what && e.with_what.entity_id;
        return !!first('shelfStatuses', function (s) { return s.memberId === memberId && s.publicationId === pid; });
      }
      return false;
    });
  }
  function notificationsFor(memberId) {
    memberId = memberId || activeId();
    if (!memberId) return [];
    var rs = _readState(memberId);
    var read = {}; rs.readIds.forEach(function (id) { read[id] = true; });
    var groups = {};
    _notifEvents(memberId).forEach(function (e) {
      var target = e.with_what ? (e.with_what.entity + ':' + e.with_what.entity_id) : 'none';
      var key = _family(e.action.codename) + '|' + target;
      if (!groups[key]) groups[key] = { key: key, family: _family(e.action.codename), target: e.with_what || null, events: [], unread: 0, latestAt: '' };
      groups[key].events.push(e);
      if (!read[e.id]) groups[key].unread++;
      if ((e.timestamp || '') > groups[key].latestAt) groups[key].latestAt = e.timestamp || '';
    });
    return Object.keys(groups).map(function (k) { return groups[k]; })
      .sort(function (a, b) { return b.latestAt.localeCompare(a.latestAt); });
  }
  function unreadCount(memberId) {
    return notificationsFor(memberId).reduce(function (n, g) { return n + (g.unread > 0 ? 1 : 0); }, 0);
  }
  function markGroupRead(memberId, groupKey) {
    memberId = memberId || activeId(); if (!memberId) return;
    var rs = _readState(memberId);
    notificationsFor(memberId).forEach(function (g) {
      if (g.key === groupKey) g.events.forEach(function (e) { if (rs.readIds.indexOf(e.id) < 0) rs.readIds.push(e.id); });
    });
    rs.lastReadAt = nowISO(); persist(); _notify({ kind: 'notif-read' });
  }
  function markAllRead(memberId) {
    memberId = memberId || activeId(); if (!memberId) return;
    var rs = _readState(memberId);
    _notifEvents(memberId).forEach(function (e) { if (rs.readIds.indexOf(e.id) < 0) rs.readIds.push(e.id); });
    rs.lastReadAt = nowISO(); persist(); _notify({ kind: 'notif-read' });
  }

  /* ════════════════ derived: feeds / pulse / stats ════════════════ */
  function domainOf(ev, viewerId) {
    if (ev.who && ev.who.entity === 'bot') return 'Resource';
    if (ev.action.codename === 'version.published' || ev.action.codename === 'book.added') return 'Resource';
    if (ev.who && ev.who.entity_id === viewerId) return 'Personal';
    return 'Community';
  }
  function publicEvents() {
    return find('events', function (e) { return e.visibility === 'public'; }).sort(function (a, b) { return (b.timestamp || '').localeCompare(a.timestamp || ''); });
  }
  function activityFeed(memberId) {
    memberId = memberId || activeId();
    return publicEvents().filter(function (e) {
      var w = e.with_what; if (!w) return false;
      if (isTracking(w.entity, w.entity_id, memberId)) return true;
      // tracked members' authored events
      return isTracking('member', e.who.entity_id, memberId);
    });
  }
  function pulse(memberId) {
    memberId = memberId || activeId();
    return find('events', function (e) {
      return e.visibility === 'public' || (e.who && e.who.entity_id === memberId) ||
        (e.action.params && e.action.params.recipient_id === memberId);
    }).sort(function (a, b) { return (b.timestamp || '').localeCompare(a.timestamp || ''); });
  }
  function memberEvents(memberId) {
    return find('events', function (e) { return e.who && e.who.entity_id === memberId && (e.visibility === 'public'); })
      .sort(function (a, b) { return (b.timestamp || '').localeCompare(a.timestamp || ''); });
  }
  function readingStats(memberId) {
    memberId = memberId || activeId();
    var evs = find('events', function (e) { return e.who && e.who.entity_id === memberId; });
    var opened = evs.filter(function (e) { return e.action.codename === 'book.opened'; });
    var pages = evs.filter(function (e) { return e.action.codename === 'page.viewed'; });
    var ended = evs.filter(function (e) { return e.action.codename === 'session.ended'; });
    var secs = ended.reduce(function (s, e) { return s + (e.action.params.duration_seconds || 0); }, 0);
    return { sessions: opened.length, pages: pages.length, minutes: Math.round(secs / 60),
      reviews: find('reactions', function (r) { return r.form === 'review' && r.authorId === memberId; }).length,
      comments: find('reactions', function (r) { return (r.form === 'comment' || r.form === 'reply') && r.authorId === memberId; }).length };
  }
  function continueReading(memberId) {
    memberId = memberId || activeId();
    return all('progress').filter(function (p) { return p.memberId === memberId; })
      .sort(function (a, b) { return (b.updatedAt || '').localeCompare(a.updatedAt || ''); });
  }
  function shelfOf(memberId) {
    memberId = memberId || activeId();
    return all('shelfStatuses').filter(function (s) { return s.memberId === memberId; });
  }

  /* ════════════════ reset / sim plumbing ════════════════ */
  function clearSim() {
    _load();
    _db.events = _db.events.filter(function (e) { return e.source !== 'sim'; });
    _db.reactions = _db.reactions.filter(function (r) { return r.source !== 'sim'; });
    /* recompute reputation from remaining (real) vote events */
    recomputeReputation();
    _db.seededContent = false;
    persist(); _notify({ kind: 'clear-sim' });
  }
  function recomputeReputation() {
    _load();
    var md = window.BA && BA.memberData;
    var base = {};
    if (md) md.all().forEach(function (m) { base[m.id] = 0; }); // start from 0; seed XP is replaced by vote-derived
    // Re-seed baseline from member seed (so non-sim baseline standing persists)
    if (md) md.all().forEach(function (m) { base[m.id] = m.reputationScore || 0; });
    _db.reputationScores = base;
    persist();
  }
  function resetAll() {
    _db = blank(); _seedStructural(); _db.seededAt = nowISO();
    persist(); _notify({ kind: 'reset' });
  }

  function subscribe(fn) { _subs.push(fn); return function () { _subs = _subs.filter(function (f) { return f !== fn; }); }; }

  /* ════════════════ public API (augment BA.store) ════════════════ */
  Object.assign(store, {
    /* collections */
    db: db, coll: coll, all: all, mapOf: map, settings: settings,
    insert: insert, update: update, find: find, first: first, persist: persist,
    subscribe: subscribe,
    /* identity / standing */
    privNamesOf: privNames, roleOf: roleOf, rankOf: rankOf, tierOf: tierOf, xpOf: xpOf,
    effectiveWeight: effectiveWeight, capabilitySet: capabilitySet, can: can,
    activeId: activeId, memberRecord: memberRecord, publicProfileOf: publicProfileOf,
    CAPS: CAPS,
    /* events */
    emit: emit,
    /* actions */
    castVote: castVote, addComment: addComment, addReview: addReview, addReply: addReply,
    sendMessage: sendMessage, publishPost: publishPost, publishNews: publishNews,
    readingSession: readingSession, setShelf: setShelf, addTrack: addTrack,
    removeTrack: removeTrack, isTracking: isTracking,
    /* derived */
    reactionsFor: reactionsFor, thread: thread, repliesOf: repliesOf,
    weightedTally: weightedTally, bookRating: bookRating,
    notificationsFor: notificationsFor, unreadCount: unreadCount,
    markGroupRead: markGroupRead, markAllRead: markAllRead,
    domainOf: domainOf, publicEvents: publicEvents, activityFeed: activityFeed,
    pulse: pulse, memberEvents: memberEvents, readingStats: readingStats,
    continueReading: continueReading, shelfOf: shelfOf,
    /* sim plumbing */
    clearSim: clearSim, recomputeReputation: recomputeReputation, resetAll: resetAll,
    uuid: uuid, nowISO: nowISO, isoMinusMin: isoMinusMin
  });

  /* hydrate now (after member-data is present in load order) */
  _load();
})();

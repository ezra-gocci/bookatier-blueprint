/* components/member-data.js — Shared Member model (the Community entity)
   ────────────────────────────────────────────────────────────────────────────
   The fourth main entity: Member (the durable registered human; world = Community).
   Single source of member truth. Consumed by the store (seed), MemberBoard, the
   Member page, member cards, comments/reviews, the avatar/reputation pill, the
   debug console (impersonation), and the simulation (Mock members).

   Feature areas: 12 (Members & Community) · 21 (Accounts & Access) · 9 (Reputation).
   Spec refs: specs.md §1.2 (MemberRecord / User / Profile / PublicProfile;
   kind human|bot|system; PrivilegeGrant[]; reputationScore stored XP), §3.1
   (Privileges & Roles; Mock privilege), §1.3/§3.2 (Rank derived from XP via tierOf).

   Phase-1 NOTE (login = debug-managed STUB per session decision): records carry a
   debug `password` (plaintext, prototype-only) instead of the TD-1 PBKDF2 hash +
   wrapped access key. The wrapped-key WebCrypto mechanic is modeled in the shapes
   (specs §4.5) but NOT run — PDFs are bundled locally; the Yandex users.json
   upload is deferred (Q-2). HUMAN-REVIEW-MANDATORY surface (auth/identity).
   Mock members never log in (Mock privilege) — they author reactions with
   source:sim only. Bot = platform automation (News); System = ghost management. */
(function () {
  'use strict';
  window.BA = window.BA || {};

  /* A held privilege grant (specs §1.2). source: admin|rank|direct|club. */
  function grant(priv, source) { return { privilege: priv, source: source || 'admin', grantedAt: '2026-01-15T09:00:00Z' }; }
  function grants(privs, source) { return privs.map(function (p) { return grant(p, source); }); }

  /* The seed members. reputationScore is stored XP (Rank is derived via tierOf):
     Новичок 0–49 · Практик 50–149 · Эксперт 150–349 · Мэтр 350+. */
  var SEED = [
    { id:'u1', email:'a.ivanova@beta2alpha.academy', password:'demo1234',
      displayName:'Александра Иванова', officialName:'Александра Иванова',
      specialisation:'Психотерапевт', title:'Клинический психолог', affiliation:'Частная практика, Москва',
      bio:'Практикующий психотерапевт, читаю и собираю заметки на полях. Здесь — чтобы быть ближе к первоисточникам.',
      kind:'human', privileges:grants(['Registered'],'direct'), reputationScore:142, joinedAt:'2026-02-03T10:00:00Z' },

    { id:'u2', email:'d.sokolov@beta2alpha.academy', password:'demo1234',
      displayName:'Дмитрий Соколов', specialisation:'Психоаналитик', title:'Кандидат ОПП', affiliation:'ИПиКП',
      bio:'Работаю в бионианской традиции; интересует теория мышления и аналитическое поле.',
      kind:'human', privileges:grants(['Registered','Verified'],'direct'), reputationScore:228, joinedAt:'2026-02-05T10:00:00Z' },

    { id:'u3', email:'e.morozova@beta2alpha.academy', password:'demo1234',
      displayName:'Елена Морозова', specialisation:'Супервизор', title:'Тренинг-аналитик', affiliation:'МПО',
      bio:'Супервизор и преподаватель. Перевожу и комментирую современную итальянскую школу.',
      kind:'human', privileges:grants(['Registered','Verified'],'direct'), reputationScore:418, joinedAt:'2026-02-04T10:00:00Z' },

    { id:'u4', email:'m.petrov@beta2alpha.academy', password:'demo1234',
      displayName:'Михаил Петров', specialisation:'Студент', affiliation:'МГУ, клиническая психология',
      bio:'Учусь на клинического психолога, начинаю погружение в психоанализ.',
      kind:'human', privileges:grants(['Registered'],'direct'), reputationScore:21, joinedAt:'2026-03-12T10:00:00Z' },

    { id:'u5', email:'o.kuznetsova@beta2alpha.academy', password:'demo1234',
      displayName:'Ольга Кузнецова', specialisation:'Детский аналитик', title:'Психоаналитик',
      bio:'Детский и подростковый анализ; контейнирование и ранние объектные отношения.',
      kind:'human', privileges:grants(['Registered','Verified'],'direct'), reputationScore:96, joinedAt:'2026-02-20T10:00:00Z' },

    { id:'u6', email:'a.volkov@beta2alpha.academy', password:'demo1234',
      displayName:'Андрей Волков', specialisation:'Психотерапевт', title:'Модератор сообщества',
      bio:'Слежу за качеством дискуссии. По образованию — гештальт и психоанализ.',
      kind:'human', privileges:grants(['Registered','Verified','Moderator'],'admin'), reputationScore:312, joinedAt:'2026-02-02T10:00:00Z' },

    { id:'u7', email:'n.lebedeva@beta2alpha.academy', password:'demo1234',
      displayName:'Наталья Лебедева', specialisation:'Психоаналитик', title:'Член ЕКПП',
      bio:'Перенос и контрперенос, близость в кабинете. Люблю клинические виньетки.',
      kind:'human', privileges:grants(['Registered','Verified'],'direct'), reputationScore:186, joinedAt:'2026-02-08T10:00:00Z' },

    { id:'u8', email:'s.novikov@beta2alpha.academy', password:'demo1234',
      displayName:'Сергей Новиков', specialisation:'Психолог-консультант',
      bio:'Консультирую и читаю — пока больше слушатель, чем автор.',
      kind:'human', privileges:grants(['Registered'],'direct'), reputationScore:38, joinedAt:'2026-03-01T10:00:00Z' },

    { id:'admin', email:'admin@beta2alpha.academy', password:'admin',
      displayName:'Виктор Адмиров', specialisation:'Администратор платформы', title:'Администратор',
      bio:'Управление платформой.',
      kind:'human', privileges:grants(['Registered','Verified','Moderator','Admin'],'admin'), reputationScore:0, joinedAt:'2026-01-10T10:00:00Z' },

    /* ── Mock members (Mock privilege): never log in, populate Community via sim ── */
    { id:'m1', email:null, displayName:'Игорь Белов', specialisation:'Психоаналитик',
      kind:'human', privileges:grants(['Registered','Verified','Mock'],'rank'), reputationScore:154, joinedAt:'2026-02-11T10:00:00Z', mock:true },
    { id:'m2', email:null, displayName:'Вера Соловьёва', specialisation:'Психотерапевт',
      kind:'human', privileges:grants(['Registered','Verified','Mock'],'rank'), reputationScore:262, joinedAt:'2026-02-13T10:00:00Z', mock:true },
    { id:'m3', email:null, displayName:'Павел Орлов', specialisation:'Супервизор',
      kind:'human', privileges:grants(['Registered','Verified','Mock'],'rank'), reputationScore:360, joinedAt:'2026-02-09T10:00:00Z', mock:true },
    { id:'m4', email:null, displayName:'Юлия Зайцева', specialisation:'Студент-психолог',
      kind:'human', privileges:grants(['Registered','Mock'],'rank'), reputationScore:27, joinedAt:'2026-03-05T10:00:00Z', mock:true },
    { id:'m5', email:null, displayName:'Роман Киселёв', specialisation:'Клинический психолог',
      kind:'human', privileges:grants(['Registered','Verified','Mock'],'rank'), reputationScore:118, joinedAt:'2026-02-24T10:00:00Z', mock:true },
    { id:'m6', email:null, displayName:'Анна Тихонова', specialisation:'Психоаналитик',
      kind:'human', privileges:grants(['Registered','Verified','Mock'],'rank'), reputationScore:203, joinedAt:'2026-02-16T10:00:00Z', mock:true },

    /* ── Non-human actors ── */
    { id:'bot', email:null, displayName:'β→α · Бот', specialisation:'Голос Ресурса',
      bio:'Публикует новости и системные события издательства β→α.',
      kind:'bot', privileges:grants(['Registered','Verified','Moderator'],'admin'), reputationScore:0, joinedAt:'2026-01-01T00:00:00Z' },
    { id:'system', email:null, displayName:'Система', specialisation:'Управление',
      kind:'system', privileges:grants(['Registered','Verified','Moderator','Admin'],'admin'), reputationScore:0, joinedAt:'2026-01-01T00:00:00Z' }
  ];

  var _byId = {};
  SEED.forEach(function (m) { _byId[m.id] = m; });

  function get(id) { return _byId[id] || null; }
  function all() { return SEED.slice(); }
  function ids() { return SEED.map(function (m) { return m.id; }); }
  /* members that author Community content (humans, incl. mock; excludes bot/system) */
  function people() { return SEED.filter(function (m) { return m.kind === 'human'; }); }
  function mocks() { return SEED.filter(function (m) { return m.mock; }); }
  function privNamesOf(m) { return (m.privileges || []).map(function (g) { return g.privilege; }); }
  function isMock(m) { return privNamesOf(m).indexOf('Mock') >= 0; }
  function avatar(m) {
    if (m && m.avatar) return m.avatar;
    return (window.BA && BA.avatars) ? BA.avatars.pick((m && (m.id || m.displayName)) || '?') : '';
  }

  window.BA.memberData = {
    SEED: SEED, ACTIVE_DEFAULT: 'u1',
    get: get, all: all, ids: ids, people: people, mocks: mocks,
    privNamesOf: privNamesOf, isMock: isMock, avatar: avatar
  };
})();

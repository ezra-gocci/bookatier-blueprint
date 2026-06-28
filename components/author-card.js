/* components/author-card.js — Author card overlay
   BA.authorCard.open(authorId) / .close()

   Repeats the Book card design: a RIGHT-EDGE-DOCKED drawer (slides in from the
   right, dims the page, closes on backdrop-click / Esc), single-scroll info
   column on the left, and a full-height portrait panel on the right edge in
   place of the book cover. No MiniReader. Books cross-link to the Book card.
   No auth gating — always visible. */
(function () {
  'use strict';
  window.BA = window.BA || {};

  var CSS = [
    /* Backdrop */
    '.ac-backdrop{position:fixed;inset:0;z-index:810;background:rgba(20,16,12,.42);',
    'opacity:0;pointer-events:none;transition:opacity 200ms var(--ease-out-quart,cubic-bezier(.25,1,.5,1));}',
    '.ac-backdrop.is-open{opacity:1;pointer-events:auto;}',
    /* Drawer — docked right */
    '.ac-drawer{position:fixed;top:0;right:0;bottom:0;z-index:811;',
    'width:min(620px,40vw);display:flex;flex-direction:row;background:var(--surface);',
    'border-left:var(--hairline,1px) solid var(--line);box-shadow:-12px 0 48px rgba(20,16,12,.18);',
    'overflow:hidden;transform:translateX(100%);',
    'transition:transform 280ms var(--ease-out-quart,cubic-bezier(.25,1,.5,1));}',
    '.ac-drawer.is-open{transform:translateX(0);}',
    /* Scroll column */
    '.ac-scroll{flex:1;min-width:0;overflow-y:auto;overflow-x:hidden;}',
    /* Portrait panel — full-height, full-bleed on the right edge */
    '.ac-photo-col{flex-shrink:0;width:118px;position:relative;overflow:hidden;',
    'border-left:var(--hairline,1px) solid var(--line);',
    'background:linear-gradient(160deg,color-mix(in srgb,var(--accent) 16%,var(--surface-sunk)),var(--surface-sunk));',
    'display:flex;align-items:center;justify-content:center;}',
    '.ac-photo{width:100%;height:100%;object-fit:cover;display:block;}',
    '.ac-monogram{font-family:var(--font-serif);font-size:52px;font-weight:600;',
    'letter-spacing:.02em;color:color-mix(in srgb,var(--accent) 70%,var(--ink));}',
    /* Hero */
    '.ac-hero{padding:var(--space-8,32px) var(--space-6,24px) var(--space-4,16px);',
    'display:flex;align-items:center;gap:var(--space-4,16px);}',
    '.ac-hero-av{width:80px;height:80px;border-radius:50%;object-fit:cover;object-position:center;',
    'flex-shrink:0;border:2px solid var(--line,rgba(26,20,16,.12));background:var(--surface-sunk);}',
    '.ac-hero-text{min-width:0;}',
    '.ac-eyebrow{font-family:var(--font-sans);font-size:var(--fs-caption,12px);font-weight:600;',
    'letter-spacing:.06em;text-transform:uppercase;color:var(--ink-faint);margin:0 0 var(--space-2,8px);}',
    '.ac-name{font-family:var(--font-serif);font-size:var(--fs-h2,22px);font-weight:600;',
    'line-height:1.2;color:var(--ink);margin:0 0 var(--space-2,8px);}',
    '.ac-meta{font-family:var(--font-sans);font-size:var(--fs-small,14px);color:var(--ink-soft);margin:0;}',
    /* Sections */
    '.ac-sec{padding:var(--space-8,32px) var(--space-6,24px);border-top:var(--hairline,1px) solid var(--line);}',
    '.ac-sec-title{font-family:var(--font-sans);font-size:var(--fs-caption,12px);font-weight:600;',
    'letter-spacing:.04em;text-transform:uppercase;color:var(--ink-faint);margin:0 0 var(--space-3,12px);}',
    '.ac-bio{font-family:var(--font-serif);font-size:var(--fs-body,16px);line-height:1.7;',
    'color:var(--ink-soft);margin:0;}',
    /* Books */
    '.ac-books{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:var(--space-2,8px);}',
    '.ac-book-item{display:flex;align-items:center;gap:var(--space-4,16px);width:100%;text-align:left;',
    'padding:var(--space-4,16px);background:var(--surface);border:var(--hairline,1px) solid var(--line);',
    'border-radius:var(--radius-md,10px);cursor:pointer;transition:border-color 140ms,background 140ms;}',
    '.ac-book-item:hover{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 4%,var(--surface));}',
    '.ac-book-thumb{width:42px;height:60px;border-radius:var(--radius-sm,6px);object-fit:cover;flex-shrink:0;',
    'background:var(--surface-sunk);display:block;border:var(--hairline,1px) solid var(--line);}',
    '.ac-book-info{flex:1;min-width:0;display:flex;flex-direction:column;gap:var(--space-1,4px);}',
    '.ac-book-title{font-family:var(--font-sans);font-size:var(--fs-small,14px);font-weight:600;color:var(--ink);',
    'line-height:1.35;margin:0;}',
    '.ac-book-sub{font-family:var(--font-sans);font-size:var(--fs-caption,12px);color:var(--ink-faint);',
    'line-height:1.4;margin:0;}',
    '.ac-book-arrow{color:var(--accent);font-size:14px;flex-shrink:0;align-self:center;}',
    /* Bottom-centre close control */
    '.ac-close-btm{position:absolute;bottom:var(--space-5,20px);left:50%;transform:translateX(-50%);z-index:5;',
    'display:inline-flex;align-items:center;gap:var(--space-2,8px);padding:var(--space-2,8px) var(--space-5,20px);',
    'background:var(--surface);color:var(--ink-soft);border:var(--hairline,1px) solid var(--line);',
    'border-radius:var(--radius-pill,999px);box-shadow:var(--shadow-soft,0 6px 22px rgba(20,16,12,.12));',
    'font-family:var(--font-sans);font-size:var(--fs-small,14px);font-weight:500;cursor:pointer;',
    'transition:color 140ms,border-color 140ms,background 140ms;}',
    '.ac-close-btm:hover{color:var(--ink);border-color:var(--ink-faint);background:var(--surface-sunk);}',
    /* Vertical "open author page" tab — pinned to the drawer right edge */
    '.ac-cover-page-btn{position:absolute;right:0;top:50%;transform:translateY(-50%);z-index:6;',
    'display:flex;align-items:center;justify-content:center;padding:var(--space-4,16px) 4px;',
    'background:var(--accent);color:var(--on-accent);border:none;',
    'border-radius:var(--radius-md,10px) 0 0 var(--radius-md,10px);box-shadow:-4px 0 18px rgba(20,16,12,.28);',
    'cursor:pointer;transition:background 140ms;}',
    '.ac-cover-page-btn:hover{background:var(--accent-hover);}',
    '.ac-cover-page-btn:focus-visible{outline:2px solid var(--accent);outline-offset:2px;}',
    '.ac-cover-page-label{writing-mode:vertical-rl;transform:rotate(180deg);font-family:var(--font-sans);',
    'font-size:var(--fs-caption,12px);font-weight:600;letter-spacing:.04em;text-transform:uppercase;white-space:nowrap;}',
    '@media (max-width:720px){.ac-drawer{width:100vw;border-left:none;}.ac-photo-col{width:96px;}}',
    '@media (prefers-reduced-motion:reduce){.ac-backdrop,.ac-drawer{transition:opacity .01ms;}}',
  ].join('');

  /* Author data now lives in components/author-data.js (BA.authorData) — the
     single source consumed by both this card and pages/author.html. */
  function _author(id) {
    return (window.BA && BA.authorData) ? BA.authorData.get(id) : null;
  }
  function _worksOf(author) {
    return (window.BA && BA.authorData) ? BA.authorData.worksOf(author) : (author.books || []);
  }

  var _backdrop = null, _drawer = null, _esc = null, _curAuthorId = null;

  function _hide() {
    if (_backdrop) _backdrop.classList.remove('is-open');
    if (_drawer) _drawer.classList.remove('is-open');
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function _inject() {
    if (document.getElementById('ba-ac-css')) return;
    var s = document.createElement('style');
    s.id = 'ba-ac-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function _build() {
    if (_backdrop) return;
    _inject();

    _backdrop = document.createElement('div');
    _backdrop.className = 'ac-backdrop';
    _backdrop.addEventListener('click', function () { BA.authorCard.close(); });
    document.body.appendChild(_backdrop);

    _drawer = document.createElement('div');
    _drawer.className = 'ac-drawer';
    _drawer.setAttribute('role', 'dialog');
    _drawer.setAttribute('aria-modal', 'true');
    _drawer.innerHTML = '<div class="ac-scroll" id="ac-scroll"></div><div class="ac-photo-col" id="ac-photo"></div>' +
      '<button class="ac-cover-page-btn" type="button" aria-label="Открыть страницу автора" title="Открыть страницу автора"><span class="ac-cover-page-label">Страница автора ↗</span></button>' +
      '<button class="ac-close-btm" type="button" aria-label="Закрыть карточку автора"><span aria-hidden="true">✕</span> Закрыть</button>';
    document.body.appendChild(_drawer);

    /* delegate book clicks → hide this card, open the Book card for that book;
       the card stack restores the author card when the book card closes. */
    _drawer.addEventListener('click', function (e) {
      if (e.target.closest('.ac-close-btm')) { BA.authorCard.close(); return; }
      if (e.target.closest('.ac-cover-page-btn')) { window.location.href = '../pages/author.html?author=' + encodeURIComponent(_curAuthorId || ''); return; }
      var item = e.target.closest('.ac-book-item');
      if (item && window.BA && BA.bookCard) {
        var bookId = item.getAttribute('data-book');
        var authorId = _curAuthorId;
        _hide();
        if (BA.cardStack) {
          BA.cardStack.open(function () { BA.authorCard.open(authorId); },
                            function () { BA.bookCard.open(bookId); });
        } else { BA.bookCard.open(bookId); }
      }
    });

    _esc = function (e) {
      if (e.key === 'Escape' && _drawer && _drawer.classList.contains('is-open')) BA.authorCard.close();
    };
    document.addEventListener('keydown', _esc);
  }

  function _renderScroll(author) {
    var books = _worksOf(author).map(function (b) {
      return '<button class="ac-book-item" type="button" data-book="' + esc(b.id) + '">' +
        '<img class="ac-book-thumb" src="' + b.cover + '" alt="Обложка: ' + esc(b.title) + '" loading="lazy">' +
        '<span class="ac-book-info">' +
          '<span class="ac-book-title">' + esc(b.title) + '</span>' +
          '<span class="ac-book-sub">' + esc(b.sub) + '</span>' +
        '</span>' +
        '<span class="ac-book-arrow" aria-hidden="true">→</span>' +
      '</button>';
    }).join('');

    return '<div class="ac-hero">' +
        (window.BA && BA.avatars ? '<img class="ac-hero-av" src="' + BA.avatars.pick(author.name) + '" alt="" loading="lazy">' : '') +
        '<div class="ac-hero-text">' +
          '<p class="ac-eyebrow">Автор</p>' +
          '<h2 class="ac-name">' + esc(author.name) + '</h2>' +
          '<p class="ac-meta">' + esc(author.meta) + '</p>' +
        '</div>' +
      '</div>' +
      '<div class="ac-sec">' +
        '<p class="ac-sec-title">Об авторе</p>' +
        '<p class="ac-bio">' + esc(author.bio) + '</p>' +
      '</div>' +
      '<div class="ac-sec">' +
        '<p class="ac-sec-title">Книги в библиотеке</p>' +
        '<ul class="ac-books">' + books + '</ul>' +
      '</div>';
  }

  function _renderPhoto(author) {
    if (author.photo) {
      return '<img class="ac-photo" src="' + author.photo + '" alt="Портрет: ' + esc(author.name) + '" loading="lazy">';
    }
    if (window.BA && BA.avatars) {
      return '<img class="ac-photo" src="' + BA.avatars.pick(author.name) + '" alt="Портрет: ' + esc(author.name) + '" loading="lazy">';
    }
    return '<span class="ac-monogram" aria-hidden="true">' + esc(author.initials) + '</span>';
  }

  window.BA.authorCard = {
    open: function (authorId) {
      if (window.BA && BA.cardStack) BA.cardStack.enter();
      _curAuthorId = authorId;
      var author = _author(authorId) || _author('author-bion');
      if (!author) { try { console.error('[author-card] BA.authorData not loaded'); } catch (e) {} return; }
      _build();
      _drawer.querySelector('#ac-scroll').innerHTML = _renderScroll(author);
      _drawer.querySelector('#ac-photo').innerHTML = _renderPhoto(author);
      _drawer.querySelector('#ac-scroll').scrollTop = 0;
      _drawer.setAttribute('aria-label', 'Об авторе: ' + author.name);
      _backdrop.classList.add('is-open');
      _drawer.classList.add('is-open');
    },
    close: function () {
      if (!_drawer) return;
      _hide();
      if (window.BA && BA.cardStack) BA.cardStack.back(); /* reopen parent card if stacked */
    }
  };
})();

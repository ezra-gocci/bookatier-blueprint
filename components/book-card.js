/* components/book-card.js — Book card overlay (right-slide drawer + mini PDF reader)
   BA.bookCard.open(bookId) / .close()
   Public: drawer opens, mini-reader locked; Private: full access + mini-reader. */
(function () {
  'use strict';
  window.BA = window.BA || {};

  var CSS = [
    /* Backdrop */
    '.bcd-backdrop{position:fixed;inset:0;z-index:770;background:rgba(20,16,12,.35);',
    'opacity:0;pointer-events:none;transition:opacity 200ms;}',
    '.bcd-backdrop.is-open{opacity:1;pointer-events:auto;}',
    /* Drawer */
    '.bcd-drawer{position:fixed;top:0;right:0;bottom:0;z-index:771;',
    'width:600px;max-width:100vw;background:var(--paper,#F5EFE4);',
    'display:flex;flex-direction:column;',
    'box-shadow:-12px 0 48px rgba(0,0,0,.16);',
    'transform:translateX(100%);transition:transform 280ms var(--ease-out-quart,cubic-bezier(.25,.46,.45,.94));}',
    '.bcd-drawer.is-open{transform:translateX(0);}',
    /* Two-panel layout */
    '.bcd-panels{display:flex;flex:1;overflow:hidden;}',
    '.bcd-info{width:280px;flex-shrink:0;overflow-y:auto;',
    'border-right:1px solid var(--line,rgba(26,20,16,.1));}',
    '.bcd-reader-panel{flex:1;display:flex;flex-direction:column;background:var(--surface-sunk,rgba(26,20,16,.04));}',
    /* Info panel */
    '.bcd-cover-wrap{padding:24px 20px 0;display:flex;justify-content:center;}',
    '.bcd-cover{width:120px;border-radius:6px;box-shadow:0 4px 20px rgba(0,0,0,.2);display:block;}',
    '.bcd-meta{padding:16px 20px 0;}',
    '.bcd-topic-badge{display:inline-block;font-size:11px;font-weight:600;letter-spacing:.06em;',
    'text-transform:uppercase;padding:2px 9px;border-radius:20px;margin-bottom:10px;',
    'background:color-mix(in srgb,var(--accent,#C1654B) 10%,transparent);color:var(--accent,#C1654B);}',
    '.bcd-title{font-family:var(--font-serif);font-size:18px;font-weight:600;line-height:1.3;',
    'color:var(--ink);margin:0 0 4px;}',
    '.bcd-subtitle{font-size:13px;color:var(--ink-faint);margin:0 0 6px;}',
    '.bcd-author{font-size:13px;color:var(--ink);font-weight:500;margin:0 0 4px;}',
    '.bcd-year{font-size:12px;color:var(--ink-faint);margin:0 0 14px;}',
    '.bcd-divider{height:1px;background:var(--line,rgba(26,20,16,.1));margin:14px 20px;}',
    '.bcd-section-title{font-size:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;',
    'color:var(--ink-faint);padding:0 20px;margin:0 0 8px;}',
    '.bcd-annotation{font-size:13px;line-height:1.65;color:var(--ink);padding:0 20px 0;margin:0;}',
    '.bcd-citation-block{margin:14px 20px 0;padding:12px 14px;',
    'border-left:3px solid var(--accent,#C1654B);',
    'background:color-mix(in srgb,var(--accent,#C1654B) 4%,transparent);',
    'border-radius:0 6px 6px 0;}',
    '.bcd-citation-text{font-size:13px;font-style:italic;line-height:1.55;color:var(--ink);margin:0 0 4px;}',
    '.bcd-citation-src{font-size:11px;color:var(--ink-faint);margin:0;}',
    '.bcd-details{padding:0 20px;margin-top:14px;}',
    '.bcd-detail-row{display:flex;justify-content:space-between;padding:6px 0;',
    'border-bottom:1px solid var(--line,rgba(26,20,16,.07));font-size:12px;}',
    '.bcd-detail-row:last-child{border-bottom:none;}',
    '.bcd-detail-key{color:var(--ink-faint);}',
    '.bcd-detail-val{color:var(--ink);text-align:right;max-width:60%;}',
    '.bcd-cta{margin:20px;display:flex;gap:8px;}',
    /* Reader panel */
    '.bcd-reader-head{padding:10px 14px;border-bottom:1px solid var(--line,rgba(26,20,16,.1));',
    'display:flex;align-items:center;gap:8px;flex-shrink:0;}',
    '.bcd-reader-title{font-size:12px;font-weight:600;color:var(--ink-faint);flex:1;}',
    '.bcd-reader-body{flex:1;display:flex;align-items:center;justify-content:center;overflow:hidden;}',
    '.bcd-canvas-wrap{width:100%;height:100%;display:flex;align-items:center;justify-content:center;}',
    '.bcd-reader-lock{text-align:center;padding:32px 24px;}',
    '.bcd-reader-lock-icon{font-size:40px;margin-bottom:12px;}',
    '.bcd-reader-lock-title{font-size:15px;font-weight:600;color:var(--ink);margin:0 0 6px;}',
    '.bcd-reader-lock-sub{font-size:13px;color:var(--ink-faint);margin:0 0 18px;line-height:1.5;}',
    '.bcd-reader-nav{padding:10px 14px;border-top:1px solid var(--line,rgba(26,20,16,.1));',
    'display:flex;align-items:center;gap:10px;flex-shrink:0;}',
    '.bcd-page-btn{background:none;border:1px solid var(--line);border-radius:6px;',
    'padding:5px 12px;font-size:13px;color:var(--ink-faint);cursor:pointer;transition:all 140ms;}',
    '.bcd-page-btn:hover:not(:disabled){border-color:var(--ink-faint);color:var(--ink);}',
    '.bcd-page-btn:disabled{opacity:.35;cursor:default;}',
    '.bcd-page-info{flex:1;text-align:center;font-size:12px;color:var(--ink-faint);}',
    /* Close button */
    '.bcd-close{position:absolute;top:12px;right:12px;background:none;border:none;',
    'font-size:20px;color:var(--ink-faint);cursor:pointer;line-height:1;padding:4px;z-index:1;}',
  ].join('');

  var BOOKS = {
    bion: {
      title: 'Научение на опыте',
      subtitle: 'Итальянские семинары',
      authors: ['Уилфред Р. Бион'],
      year: 2023,
      version: 'Издание 1.0, 2023',
      topic: 'Психоанализ',
      cover: '../assets/covers/bion-nauchenie-na-opyte-cover.png',
      fragment: '../assets/bion-fragment.pdf',
      annotation: 'В 1977 году Уилфред Р. Бион провёл пять семинаров в Риме и Турине — одну из своих последних публичных работ. «Итальянские семинары» не лекции: это живой диалог, где Бион отвечает на клинический материал прямо в аудитории, формулируя свои поздние идеи на ходу.',
      citation: '«Я полагаю, что фундаментальная задача аналитика — дать пациенту возможность мыслить мысли, которые иначе остались бы немыслимыми.»',
      citationSource: '— У. Р. Бион, Итальянские семинары, семинар II, Рим, 1977',
      details: [
        ['Объём', '148 страниц'],
        ['Семинары', 'Рим, 1977 (I–III) · Турин, 1977 (IV–V)'],
        ['Оригинал', 'Karnac Books, 2005'],
        ['Перевод', 'бета→альфа, 2023'],
      ]
    },
    goret: {
      title: 'Гореть вместе',
      subtitle: 'Близость, истина и уязвимость',
      authors: ['Лука Николи (ред.)'],
      year: 2023,
      version: 'Издание 1.1, 2023',
      topic: 'Психотерапия',
      cover: '../assets/covers/nikoli-goret-vmeste-cover.png',
      fragment: '../assets/nicoli-fragment.pdf',
      annotation: 'Эта коллективная монография переосмысляет выгорание в терапии не как управленческую или организационную проблему, а как клинический феномен, укоренённый в самой природе терапевтической встречи.',
      citation: '«Близость в терапии — не методологическая ошибка. Это единственная среда, в которой возможна настоящая трансформация.»',
      citationSource: '— Лука Николи, предисловие',
      details: [
        ['Авторы', '12 клиницистов — Милан, Болонья, Рим'],
        ['Структура', 'Коллективная монография, 12 глав'],
        ['Оригинал', 'Milano, 2022'],
        ['Перевод', 'бета→альфа, 2023'],
      ]
    },
    ferro: {
      title: 'Избегание эмоций, проживание эмоций',
      subtitle: '',
      authors: ['Антонино Ферро'],
      year: 2023,
      version: 'Издание 1.0, 2023',
      topic: 'Теория',
      cover: '../assets/covers/ferro-emotsiy-izbeganie-prozhivaniye-cover.png',
      fragment: '../assets/ferro-fragment.pdf',
      annotation: 'Антонино Ферро разворачивает биономерную модель психики, различая два фундаментальных способа обращения с эмоциональным опытом: эвакуацию и трансформацию. Аналитик функционирует как «мечтатель» — он принимает бета-элементы пациента и преобразует их в альфа-элементы.',
      citation: '«Эмоции, которые нельзя пережить, не исчезают — они становятся тем, что нельзя помыслить.»',
      citationSource: '— Антонино Ферро',
      details: [
        ['Объём', '224 страницы'],
        ['Клинический материал', '14 виньеток'],
        ['Оригинал', 'Routledge, 2011'],
        ['Перевод', 'бета→альфа, 2023'],
      ]
    }
  };

  var _backdrop = null;
  var _drawer = null;
  var _pdfjsLoaded = false;
  var _pdfjsLoading = false;
  var _pdfDoc = null;
  var _pdfPage = 1;
  var _canvas = null;
  var _activeBookId = null;

  function _inject() {
    if (document.getElementById('ba-bcd-css')) return;
    var s = document.createElement('style');
    s.id = 'ba-bcd-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function _build() {
    if (_backdrop) return;
    _inject();

    _backdrop = document.createElement('div');
    _backdrop.className = 'bcd-backdrop';
    _backdrop.addEventListener('click', BA.bookCard.close);
    document.body.appendChild(_backdrop);

    _drawer = document.createElement('div');
    _drawer.className = 'bcd-drawer';
    _drawer.innerHTML = '<div id="bcd-content" style="display:flex;flex-direction:column;flex:1;overflow:hidden;position:relative"></div>';
    document.body.appendChild(_drawer);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && _drawer && _drawer.classList.contains('is-open')) BA.bookCard.close();
    });
  }

  function _render(book, bookId) {
    var priv = window.BA && BA.session && BA.session.isPrivate();
    var content = _drawer.querySelector('#bcd-content');

    var detailRows = book.details.map(function (d) {
      return '<div class="bcd-detail-row"><span class="bcd-detail-key">' + d[0] + '</span><span class="bcd-detail-val">' + d[1] + '</span></div>';
    }).join('');

    var ctaHtml = priv
      ? '<a class="btn btn-primary" href="../pages/reader.html?book=' + bookId + '" style="flex:1;text-align:center">Читать →</a>'
        + '<button class="btn btn-ghost ba-bcd-remark" type="button" title="Новая заметка">✍</button>'
      : '<button class="btn btn-primary ba-bcd-login" type="button" style="flex:1">Войти и читать</button>';

    var readerPanel = priv ? _buildReaderPanel(book) : _buildLockedPanel();

    content.innerHTML = [
      '<button class="bcd-close" type="button" aria-label="Закрыть карточку книги">×</button>',
      '<div class="bcd-panels">',
        '<div class="bcd-info">',
          '<div class="bcd-cover-wrap">',
            '<img class="bcd-cover" src="' + book.cover + '" alt="Обложка: ' + book.title + '" loading="lazy">',
          '</div>',
          '<div class="bcd-meta">',
            '<span class="bcd-topic-badge">' + book.topic + '</span>',
            '<h2 class="bcd-title">' + book.title + '</h2>',
            (book.subtitle ? '<p class="bcd-subtitle">' + book.subtitle + '</p>' : ''),
            '<p class="bcd-author">' + book.authors.join(', ') + '</p>',
            '<p class="bcd-year">' + book.year + ' · ' + book.version + '</p>',
          '</div>',
          '<div class="bcd-divider"></div>',
          '<p class="bcd-section-title">Аннотация</p>',
          '<p class="bcd-annotation">' + book.annotation + '</p>',
          '<div class="bcd-citation-block">',
            '<p class="bcd-citation-text">' + book.citation + '</p>',
            '<p class="bcd-citation-src">' + book.citationSource + '</p>',
          '</div>',
          '<div class="bcd-divider"></div>',
          '<p class="bcd-section-title">Сведения</p>',
          '<div class="bcd-details">' + detailRows + '</div>',
          '<div class="bcd-cta">' + ctaHtml + '</div>',
        '</div>',
        readerPanel,
      '</div>',
    ].join('');

    // Wire close
    content.querySelector('.bcd-close').addEventListener('click', BA.bookCard.close);

    // Wire login CTA
    var loginBtn = content.querySelector('.ba-bcd-login');
    if (loginBtn) loginBtn.addEventListener('click', function () {
      BA.bookCard.close();
      if (window.BA && BA.frame) BA.frame.openLogin();
    });

    // Wire remark button
    var remarkBtn = content.querySelector('.ba-bcd-remark');
    if (remarkBtn) remarkBtn.addEventListener('click', function () {
      if (window.BA && BA.remarkCard) BA.remarkCard.open();
    });

    // Load PDF if private
    if (priv && book.fragment) {
      _loadPDF(book.fragment);
    }
  }

  function _buildReaderPanel(book) {
    return [
      '<div class="bcd-reader-panel">',
        '<div class="bcd-reader-head">',
          '<span class="bcd-reader-title">Фрагмент</span>',
          '<span style="font-size:11px;color:var(--ink-faint)">' + book.version + '</span>',
        '</div>',
        '<div class="bcd-reader-body" id="bcd-reader-body">',
          '<div class="bcd-canvas-wrap" id="bcd-canvas-wrap">',
            '<p style="font-size:12px;color:var(--ink-faint)">Загрузка…</p>',
          '</div>',
        '</div>',
        '<div class="bcd-reader-nav">',
          '<button class="bcd-page-btn" id="bcd-prev" type="button" disabled>← Назад</button>',
          '<span class="bcd-page-info" id="bcd-page-info">стр. — / —</span>',
          '<button class="bcd-page-btn" id="bcd-next" type="button">Далее →</button>',
        '</div>',
      '</div>',
    ].join('');
  }

  function _buildLockedPanel() {
    return [
      '<div class="bcd-reader-panel">',
        '<div class="bcd-reader-head">',
          '<span class="bcd-reader-title">Фрагмент</span>',
        '</div>',
        '<div class="bcd-reader-body">',
          '<div class="bcd-reader-lock">',
            '<div class="bcd-reader-lock-icon">🔒</div>',
            '<p class="bcd-reader-lock-title">Только для участников</p>',
            '<p class="bcd-reader-lock-sub">Войдите, чтобы читать фрагмент<br>и получить полный доступ к библиотеке.</p>',
            '<button class="btn btn-primary ba-bcd-login" type="button">Войти</button>',
          '</div>',
        '</div>',
      '</div>',
    ].join('');
  }

  function _loadPDF(url) {
    if (!window.pdfjsLib) {
      if (_pdfjsLoading) return;
      _pdfjsLoading = true;
      _loadScript('../assets/pdf.min.js', function () {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = '../assets/pdf.worker.min.js';
        }
        _pdfjsLoaded = true;
        _pdfjsLoading = false;
        _doLoadPDF(url);
      });
      return;
    }
    _doLoadPDF(url);
  }

  function _loadScript(src, cb) {
    var s = document.createElement('script');
    s.src = src;
    s.onload = cb;
    s.onerror = function () {
      var wrap = document.getElementById('bcd-canvas-wrap');
      if (wrap) wrap.innerHTML = '<p style="font-size:12px;color:var(--ink-faint);padding:16px">Не удалось загрузить PDF</p>';
    };
    document.head.appendChild(s);
  }

  function _doLoadPDF(url) {
    if (!window.pdfjsLib) return;
    _pdfPage = 1;
    window.pdfjsLib.getDocument(url).promise.then(function (doc) {
      _pdfDoc = doc;
      _renderPDFPage(_pdfPage);
    }).catch(function () {
      var wrap = document.getElementById('bcd-canvas-wrap');
      if (wrap) wrap.innerHTML = '<p style="font-size:12px;color:var(--ink-faint);padding:16px">PDF недоступен</p>';
    });
  }

  function _renderPDFPage(pageNum) {
    if (!_pdfDoc) return;
    _pdfDoc.getPage(pageNum).then(function (page) {
      var wrap = document.getElementById('bcd-canvas-wrap');
      if (!wrap) return;

      var viewport = page.getViewport({ scale: 1 });
      var panel = wrap.parentElement;
      var scale = Math.min(
        (panel.clientWidth - 32) / viewport.width,
        (panel.clientHeight - 32) / viewport.height
      );
      var scaledViewport = page.getViewport({ scale: scale });

      if (!_canvas) {
        _canvas = document.createElement('canvas');
        _canvas.style.cssText = 'border-radius:4px;box-shadow:0 4px 20px rgba(0,0,0,.15);display:block;';
      }
      wrap.innerHTML = '';
      wrap.appendChild(_canvas);

      _canvas.width = scaledViewport.width;
      _canvas.height = scaledViewport.height;
      var ctx = _canvas.getContext('2d');
      page.render({ canvasContext: ctx, viewport: scaledViewport });

      var info = document.getElementById('bcd-page-info');
      if (info) info.textContent = 'стр. ' + pageNum + ' / ' + _pdfDoc.numPages;
      var prevBtn = document.getElementById('bcd-prev');
      var nextBtn = document.getElementById('bcd-next');
      if (prevBtn) prevBtn.disabled = pageNum <= 1;
      if (nextBtn) nextBtn.disabled = pageNum >= _pdfDoc.numPages;
    });
  }

  function _wirePDFNav() {
    var prevBtn = document.getElementById('bcd-prev');
    var nextBtn = document.getElementById('bcd-next');
    if (prevBtn) prevBtn.addEventListener('click', function () {
      if (_pdfPage > 1) { _pdfPage--; _renderPDFPage(_pdfPage); }
    });
    if (nextBtn) nextBtn.addEventListener('click', function () {
      if (_pdfDoc && _pdfPage < _pdfDoc.numPages) { _pdfPage++; _renderPDFPage(_pdfPage); }
    });
  }

  window.BA.bookCard = {
    open: function (bookId) {
      var book = BOOKS[bookId] || BOOKS['bion'];
      _activeBookId = bookId;
      _build();
      _pdfDoc = null;
      _canvas = null;
      _render(book, bookId);
      _backdrop.classList.add('is-open');
      _drawer.classList.add('is-open');
      setTimeout(_wirePDFNav, 50);
    },
    close: function () {
      if (!_drawer) return;
      _backdrop.classList.remove('is-open');
      _drawer.classList.remove('is-open');
    }
  };
})();

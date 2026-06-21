/* =====================================================================
   book-card.js — Unified Book Card drawer (shared component)
   blueprint-rebuild-v2 §5. Single source for the book card used on
   Library (public + private), Home Shelf, and Community discussions.
   Right-slide drawer shell (.bcd) + rich content + embedded mini-reader
   (spread viewer) + fullscreen frameview. Mode-aware: "public" | "private".

   Public API:
     BookCardDrawer.open(bookId, mode)  // mode optional (auto-detected)
     BookCardDrawer.close()
     BookCardDrawer.init()              // wires [data-book-card] triggers
   Markup: any element with data-book-card="<id>" opens the drawer;
   add data-card-mode="public|private" to override page auto-detection.
   ===================================================================== */
(function () {
  'use strict';
  if (window.BookCardDrawer) return;

  /* Mode: explicit arg > <body data-card-mode> > pub-* pages = public */
  function detectMode(explicit) {
    if (explicit) return explicit;
    var b = document.body && document.body.getAttribute('data-card-mode');
    if (b) return b;
    var page = (location.pathname.split('/').pop() || '');
    return /^pub-/.test(page) ? 'public' : 'private';
  }

  /* ---- drawer + render state ---- */
  var drawerEl = null, backdropEl = null, bodyHostEl = null;
  var _pulseOpenBeforeBCD = false;
  var panelEl = null, activeBookId = null, currentMode = 'public';

      var BOOKS = {
        bion: {
          title: 'Научение на опыте',
          subtitle: 'Итальянские семинары',
          authors: ['Уилфред Р. Бион'],
          year: 2023,
          version: 'Издание 1.0, 2023',
          topic: 'Психоанализ',
          topicVariant: '',
          cover: 'assets/covers/bion-nauchenie-na-opyte-cover.png',
          fragment: 'assets/bion-fragment.pdf',
          startsRecto: false,
          annotation: 'В 1977 году Уилфред Р. Бион провёл пять семинаров в Риме и Турине — одну из своих последних публичных работ. «Итальянские семинары» не лекции: это живой диалог, где Бион отвечает на клинический материал прямо в аудитории, формулируя свои поздние идеи на ходу.\n\nКнига раскрывает зрелую мысль Биона: о контейнировании и контейнируемом (♀♂), о различии бета- и альфа-элементов, о роли аналитика как аппарата мышления для пациента, чьи мысли ещё не имеют «мыслителя». Семинары касаются трансформации аффекта, работы «без памяти и желания», а также концепции О — непознаваемой абсолютной реальности, к которой психоаналитический процесс только приближается.\n\nЭто редкая возможность услышать Биона в разговоре, а не в монографии — импровизированного, конкретного и неожиданно доступного.',
          citation: '«Я полагаю, что фундаментальная задача аналитика — дать пациенту возможность мыслить мысли, которые иначе остались бы немыслимыми.»',
          citationSource: '— У. Р. Бион, Итальянские семинары, семинар II, Рим, 1977',
          details: [
            ['Объём', '148 страниц'],
            ['Семинары', 'Рим, 1977 (I–III) · Турин, 1977 (IV–V)'],
            ['Оригинал', 'Bion W.R. The Italian Seminars. Karnac Books, 2005'],
            ['Перевод', 'бета→альфа, 2023'],
          ],
          catalogHref: 'pub-library.html',
        },
        goret: {
          title: 'Гореть вместе',
          subtitle: 'Близость, истина и уязвимость',
          authors: ['Лука Николи (ред.)'],
          year: 2023,
          version: 'Издание 1.0, 2023',
          topic: 'Психотерапия',
          topicVariant: '--therapy',
          cover: 'assets/covers/nikoli-goret-vmeste-cover.png',
          fragment: 'assets/nicoli-fragment.pdf',
          annotation: 'Эта коллективная монография переосмысляет выгорание в терапии не как управленческую или организационную проблему, а как клинический феномен, укоренённый в самой природе терапевтической встречи. Когда терапевт приходит в реальный эмоциональный контакт с болью пациента, он рискует «сгореть» — но именно этот риск и есть условие возможности трансформации.\n\nАвторы — ведущие итальянские клиницисты из Милана, Болоньи и Рима — исследуют, как близость, истина и уязвимость оказываются не угрозой профессиональной позиции, а её сутью. Каждая глава — отдельный голос, отдельный клинический опыт. Вместе они описывают, когда эмоциональная вовлечённость терапевта становится ресурсом, а когда — источником разрушения.\n\nКнига ставит вопрос, который редко задаётся открыто: что значит оставаться живым в этой работе на протяжении десятилетий — и как институт, группа, личная терапия и супервизия могут в этом помочь.',
          citation: '«Близость в терапии — не методологическая ошибка и не нарушение профессиональных границ. Это единственная среда, в которой возможна настоящая трансформация.»',
          citationSource: '— Лука Николи, предисловие',
          details: [
            ['Авторы', '12 клиницистов — Милан, Болонья, Рим'],
            ['Структура', 'Коллективная монография, 12 глав'],
            ['Оригинал', 'Nicoli L. (ред.). Bruciare insieme. Milano, 2022'],
            ['Перевод', 'бета→альфа, 2023'],
          ],
          catalogHref: 'pub-library.html',
        },
        ferro: {
          title: 'Избегание эмоций, проживание эмоций',
          subtitle: '',
          authors: ['Антонино Ферро'],
          year: 2023,
          version: 'Издание 1.0, 2023',
          topic: 'Теория',
          topicVariant: '--theory',
          cover: 'assets/covers/ferro-emotsiy-izbeganie-prozhivaniye-cover.png',
          fragment: 'assets/ferro-fragment.pdf',
          annotation: 'Антонино Ферро — один из ведущих продолжателей Биона — разворачивает биономерную модель психики, различая два фундаментальных способа обращения с эмоциональным опытом: эвакуацию (проективная идентификация, отыгрывание, соматизация) и трансформацию (альфа-функция, сновидение, ревери).\n\nЦентральная идея: аналитик функционирует как «мечтатель» — он принимает бета-элементы пациента (непереработанные, непереносимые остатки опыта) и преобразует их в альфа-элементы, доступные для мышления и нарратива. Ферро показывает, как эта трансформирующая функция может быть развита, нарушена или утрачена — как у пациента, так и у самого аналитика.\n\nКнига включает обширный клинический материал и теоретические главы, в которых Ферро последовательно разграничивает свой подход и классический бионовский. Особое место занимает вопрос о том, что происходит, когда терапевт теряет способность мечтать вместе с пациентом.',
          citation: '«Эмоции, которые нельзя пережить, не исчезают — они становятся тем, что нельзя помыслить.»',
          citationSource: '— Антонино Ферро',
          details: [
            ['Объём', '224 страницы'],
            ['Клинический материал', '14 виньеток'],
            ['Оригинал', 'Ferro A. Avoiding Emotions, Living Emotions. Routledge, 2011'],
            ['Перевод', 'бета→альфа, 2023'],
          ],
          catalogHref: 'pub-library.html',
        },
      };


      function expandIcon() {
        return '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"/></svg>';
      }
      function collapseIcon() {
        return '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3v4a1 1 0 0 1-1 1H4M15 3v4a1 1 0 0 0 1 1h4M9 21v-4a1 1 0 0 0-1-1H4M15 21v-4a1 1 0 0 1 1-1h4"/></svg>';
      }

      function renderSpreadViewer(book) {
        var viewer = document.createElement('div');
        viewer.className = 'book-card-spread-viewer';

        /* Left slot = even pages (or empty); right slot = odd pages (or empty).
           Clicking left navigates back, clicking right navigates forward. */
        var leftSlot  = document.createElement('div');
        leftSlot.className  = 'spread-slot spread-slot--left';
        var rightSlot = document.createElement('div');
        rightSlot.className = 'spread-slot spread-slot--right';
        viewer.appendChild(leftSlot);
        viewer.appendChild(rightSlot);

        var pdfDoc        = null;
        var numSpreads    = 0;
        var currentSpread = 0;
        var rendering     = false;
        /* True when PDF page 1 is a recto (odd book page → right side).
           Seeded from book data; overridden by PDF page labels if present. */
        var startsOnRight = (book.startsRecto !== false);

        /* Two layout modes depending on whether page 1 is recto or verso:
           startsOnRight  → spread 0: (null, 1),  spread k≥1: (2k, 2k+1)
           startsOnLeft   → spread k:  (2k+1, 2k+2) for k=0,1,2… */
        function getSpread(k) {
          if (startsOnRight) {
            return {
              left:  (k > 0 && 2 * k     <= pdfDoc.numPages) ? 2 * k     : null,
              right: (      2 * k + 1 <= pdfDoc.numPages)    ? 2 * k + 1 : null,
            };
          } else {
            return {
              left:  (2 * k + 1 <= pdfDoc.numPages) ? 2 * k + 1 : null,
              right: (2 * k + 2 <= pdfDoc.numPages) ? 2 * k + 2 : null,
            };
          }
        }

        function renderSlot(slot, pageNum) {
          slot.innerHTML = '';
          if (pageNum === null) return null; /* empty → background shows through */
          return pdfDoc.getPage(pageNum).then(function (page) {
            var vp = page.getViewport({ scale: 2 });
            var canvas = document.createElement('canvas');
            canvas.width  = Math.round(vp.width);
            canvas.height = Math.round(vp.height);
            slot.appendChild(canvas);
            return page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
          });
        }

        function showSpread(idx) {
          if (rendering || idx < 0 || idx >= numSpreads) return;
          rendering = true;
          currentSpread = idx;
          var spread = getSpread(idx);
          var jobs = [
            renderSlot(leftSlot,  spread.left),
            renderSlot(rightSlot, spread.right),
          ].filter(Boolean);
          Promise.all(jobs).then(function () {
            rendering = false;
            viewer._state = { current: currentSpread, total: numSpreads };
            if (viewer._onSpreadChange) viewer._onSpreadChange(currentSpread, numSpreads);
          });
        }

        leftSlot.addEventListener('click', function () {
          if (currentSpread > 0) showSpread(currentSpread - 1);
        });
        rightSlot.addEventListener('click', function () {
          if (currentSpread < numSpreads - 1) showSpread(currentSpread + 1);
        });

        function startViewer(pdf) {
          pdfDoc = pdf;
          /* Detect recto/verso from page labels embedded in the PDF.
             Odd label → recto → right. Even label → verso → left. */
          pdf.getPageLabels().then(function (labels) {
            var firstLabel = labels && labels[0];
            var n = parseInt(firstLabel, 10);
            if (!isNaN(n)) startsOnRight = (n % 2 === 1); /* labels win if present */
            numSpreads = startsOnRight
              ? Math.floor(pdf.numPages / 2) + 1
              : Math.ceil(pdf.numPages / 2);
            showSpread(0);
          }).catch(function () {
            /* No labels — keep default (startsOnRight = true) */
            numSpreads = Math.floor(pdf.numPages / 2) + 1;
            showSpread(0);
          });
        }

        function doLoad() {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'assets/pdf.worker.min.js';
          pdfjsLib.getDocument(book.fragment).promise
            .then(startViewer)
            .catch(function () { /* silent — empty slots show background */ });
        }

        if (typeof window.pdfjsLib !== 'undefined') {
          doLoad();
        } else {
          var s = document.createElement('script');
          s.src = 'assets/pdf.min.js';
          s.onload = function () { doLoad(); };
          document.head.appendChild(s);
        }

        viewer._prev = function () { if (currentSpread > 0) showSpread(currentSpread - 1); };
        viewer._next = function () { if (currentSpread < numSpreads - 1) showSpread(currentSpread + 1); };
        viewer._onSpreadChange = null;
        viewer._state = { current: 0, total: 0 };

        return viewer;
      }

      function renderReader(book) {
        var wrap = document.createElement('div');
        wrap.className = 'mini-reader';

        /* Spread viewport — canvases are created fresh per render, not persistent */
        var viewport = document.createElement('div');
        viewport.className = 'mini-reader-viewport';

        var loader = document.createElement('div');
        loader.className = 'mini-reader-loading';
        loader.textContent = 'Загружаем фрагмент…';

        viewport.appendChild(loader);

        /* Controls */
        var controls = document.createElement('div');
        controls.className = 'mini-reader-controls';

        var prevBtn = document.createElement('button');
        prevBtn.type = 'button';
        prevBtn.className = 'mini-reader-btn';
        prevBtn.setAttribute('aria-label', 'Предыдущий разворот');
        prevBtn.innerHTML = '<svg viewBox="0 0 16 16" width="14" height="14" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

        var counter = document.createElement('span');
        counter.className = 'mini-reader-counter';

        var nextBtn = document.createElement('button');
        nextBtn.type = 'button';
        nextBtn.className = 'mini-reader-btn';
        nextBtn.setAttribute('aria-label', 'Следующий разворот');
        nextBtn.innerHTML = '<svg viewBox="0 0 16 16" width="14" height="14" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

        var modeLabel = document.createElement('span');
        modeLabel.className = 'mini-reader-counter';
        modeLabel.title = 'Нажмите на страницу для смены режима';

        var expandBtn = document.createElement('button');
        expandBtn.type = 'button';
        expandBtn.className = 'mini-reader-expand';
        expandBtn.setAttribute('aria-label', 'Развернуть читалку');
        expandBtn.innerHTML = expandIcon();

        controls.appendChild(prevBtn);
        controls.appendChild(counter);
        controls.appendChild(nextBtn);
        controls.appendChild(modeLabel);
        controls.appendChild(expandBtn);

        wrap.appendChild(viewport);
        wrap.appendChild(controls);

        /* State */
        var pdfDoc      = null;
        var spread      = 0;
        var zoomMode    = 'fit-height';
        var rendering   = false;
        var needsRender = false;

        function totalSpreads() {
          return pdfDoc ? Math.ceil(pdfDoc.numPages / 2) : 0;
        }

        function updateUI() {
          var ts = totalSpreads();
          counter.textContent   = '« ' + (spread + 1) + ' / ' + ts + ' »';
          modeLabel.textContent = zoomMode === 'fit-height' ? '↕' : '↔';
          prevBtn.disabled = spread <= 0;
          nextBtn.disabled = spread >= ts - 1;
        }

        function renderSpread() {
          if (!pdfDoc) return;
          var vH = viewport.clientHeight;
          var vW = viewport.clientWidth;
          if (vH < 10 || vW < 10) return;

          /* Sequential lock */
          if (rendering) { needsRender = true; return; }
          rendering   = true;
          needsRender = false;

          updateUI();
          loader.style.display = 'flex';

          var leftN  = spread * 2 + 1;
          var rightN = leftN + 1;
          var hasR   = rightN <= pdfDoc.numPages;

          function done() {
            rendering = false;
            if (needsRender) { needsRender = false; renderSpread(); }
          }

          var pageNums = [leftN];
          if (hasR) pageNums.push(rightN);

          Promise.all(pageNums.map(function (n) { return pdfDoc.getPage(n); })).then(function (pages) {
            var pv = pages[0].getViewport({ scale: 1 });
            var sc = zoomMode === 'fit-height'
              ? vH / pv.height
              : vW / (pageNums.length * pv.width);

            /* Render to fresh off-DOM canvases — no shared-canvas conflict */
            var items = pages.map(function (page) {
              var c  = document.createElement('canvas');
              c.className = 'spread-canvas';
              var rv = page.getViewport({ scale: sc });
              c.width  = rv.width;
              c.height = rv.height;
              return { canvas: c, task: page.render({ canvasContext: c.getContext('2d'), viewport: rv }) };
            });

            Promise.all(items.map(function (it) { return it.task.promise; })).then(function () {
              /* Swap rendered canvases into the viewport */
              var old = viewport.querySelectorAll('.spread-canvas');
              old.forEach(function (el) { el.parentNode && el.parentNode.removeChild(el); });
              items.forEach(function (it) { viewport.appendChild(it.canvas); });
              loader.style.display = 'none';
              /* Reset page proxies to INITIAL so they can be re-rendered (zoom/nav/resize) */
              pages.forEach(function (pg) { try { pg.cleanup(); } catch (_) {} });
              done();
            }).catch(function () {
              items.forEach(function (it) { try { it.task.cancel(); } catch (_) {} });
              /* Also cleanup on failure so subsequent renders can retry */
              pages.forEach(function (pg) { try { pg.cleanup(); } catch (_) {} });
              done();
            });
          }).catch(done);
        }

        /* Shared debounced render trigger — used by both ResizeObserver and initPdf
           so that only ONE renderSpread ever fires, preventing concurrent renders. */
        var rTimer = null;
        function scheduleRender() {
          clearTimeout(rTimer);
          rTimer = setTimeout(renderSpread, 80);
        }

        if (window.ResizeObserver) {
          new ResizeObserver(scheduleRender).observe(viewport);
        }

        /* Click viewport → toggle fit-height / fit-width */
        viewport.addEventListener('click', function () {
          if (!pdfDoc) return;
          zoomMode = zoomMode === 'fit-height' ? 'fit-width' : 'fit-height';
          renderSpread();
        });

        prevBtn.addEventListener('click', function () {
          if (spread > 0) { spread--; renderSpread(); }
        });
        nextBtn.addEventListener('click', function () {
          if (spread < totalSpreads() - 1) { spread++; renderSpread(); }
        });

        expandBtn.addEventListener('click', function () {
          var panel = wrap.closest('.book-card-panel');
          if (!panel) return;
          var expanded = panel.classList.toggle('is-expanded');
          expandBtn.innerHTML = expanded ? collapseIcon() : expandIcon();
          expandBtn.setAttribute('aria-label', expanded ? 'Свернуть читалку' : 'Развернуть читалку');
        });

        /* Load PDF.js lazily, then load the PDF */
        function initPdf(lib) {
          lib.GlobalWorkerOptions.workerSrc = 'assets/pdf.worker.min.js';
          lib.getDocument(book.fragment).promise.then(function (pdf) {
            pdfDoc = pdf;
            scheduleRender(); /* debounced — merges with any pending ResizeObserver fire */
          }).catch(function (e) {
            console.error('PDF load error:', e);
            loader.textContent = 'Ошибка загрузки PDF';
          });
        }

        if (window.pdfjsLib) {
          initPdf(window.pdfjsLib);
        } else {
          var scriptEl = document.createElement('script');
          scriptEl.src = 'assets/pdf.min.js';
          scriptEl.onload  = function () { initPdf(window.pdfjsLib); };
          scriptEl.onerror = function () { loader.textContent = 'Не удалось загрузить просмотрщик'; };
          document.head.appendChild(scriptEl);
        }

        return wrap;
      }

      function renderPanel(book, mode) {
        var isPublic = (mode !== 'private');
        /* Reader deep-link: public reader is restricted (nav/pan/zoom only) */
        var readerHref = 'reader.html' + (isPublic ? '?mode=public' : '');
        /* Full book page (private only) vs catalogue link (public) */
        var catalogHref = isPublic ? (book.catalogHref || 'pub-library.html') : 'library.html';

        var panel = document.createElement('div');
        panel.className = 'book-card-panel';

        var header = document.createElement('div');
        header.className = 'book-card-header';
        header.innerHTML =
          '<div class="book-card-header-left">' +
            '<button class="book-card-close" type="button">Свернуть</button>' +
            '<button class="book-card-read" type="button">Читать</button>' +
            '<a class="btn-landing-ghost book-card-catalog-link" href="' + catalogHref + '">' +
              (isPublic ? 'В каталог →' : 'В библиотеку →') +
            '</a>' +
          '</div>';

        var body = document.createElement('div');
        body.className = 'book-card-body';

        /* Main row: info (left) + cover column (right) */
        var main = document.createElement('div');
        main.className = 'book-card-main';

        var info = document.createElement('div');
        info.className = 'book-card-info';

        var topicClass = 'topic-chip' + (book.topicVariant ? ' topic-chip' + book.topicVariant : '');
        var subtitleHtml = book.subtitle
          ? '<p class="book-card-subtitle">' + book.subtitle + '</p>'
          : '';

        var citationHtml = book.citation
          ? '<blockquote class="book-card-citation">' +
              '<p class="book-card-citation-text">' + book.citation + '</p>' +
              '<p class="book-card-citation-source">' + (book.citationSource || '') + '</p>' +
            '</blockquote>'
          : '';

        var detailsHtml = '';
        if (book.details && book.details.length) {
          detailsHtml = '<div class="book-card-details">' +
            book.details.map(function (row) {
              return '<div class="book-card-detail-row">' +
                '<span class="book-card-detail-label">' + row[0] + '</span>' +
                '<span class="book-card-detail-value">' + row[1] + '</span>' +
              '</div>';
            }).join('') +
          '</div>';
        }

        /* Replace \n\n in annotation with paragraph breaks. Catalogue books
           without rich data fall back to a neutral placeholder line. */
        var annotationSrc = book.annotation || 'Аннотация готовится к публикации.';
        var annotationHtml = '<div class="book-card-annotation">' +
          annotationSrc
            .split('\n\n')
            .map(function (p) { return '<p class="book-card-annotation-p">' + p + '</p>'; })
            .join('') +
          '</div>';

        /* Meta line: public shows version as static text; private adds a
           "сменить" entry point → full book page (version management lives there). */
        var versionHtml = isPublic
          ? '<span class="book-card-year-version">' + book.year + ' · ' + book.version + '</span>'
          : '<span class="book-card-version-row">' +
              '<span class="book-card-year-version">' + book.year + ' · ' + book.version + '</span>' +
              '<a class="book-card-version-change" href="book.html" data-stub>сменить версию</a>' +
            '</span>';

        /* Bottom: public = registration notice; private = action entry points. */
        var bottomHtml = isPublic
          ? '<hr class="book-card-separator">' +
            '<p class="book-card-notice">Полный текст доступен после регистрации</p>' +
            '<div class="book-card-actions">' +
              '<a class="btn-landing-primary bcd-action" href="' + readerHref + '">Открыть читалку →</a>' +
            '</div>'
          : '<hr class="book-card-separator">' +
            '<div class="book-card-actions">' +
              '<a class="btn-landing-primary bcd-action" href="' + readerHref + '">Открыть читалку →</a>' +
              '<a class="btn-landing-ghost bcd-action" href="book.html">Открыть страницу →</a>' +
              '<button class="btn-landing-ghost bcd-action" type="button" data-stub>★ Оценить</button>' +
              '<button class="btn-landing-ghost bcd-action" type="button" data-stub>Отзыв</button>' +
              '<button class="btn-landing-ghost bcd-action" type="button" data-stub>+ На полку</button>' +
            '</div>';

        info.innerHTML =
          '<div class="book-card-meta-line">' +
            '<span class="' + topicClass + '">' + book.topic + '</span>' +
            versionHtml +
          '</div>' +
          '<h2 class="book-card-title">' + book.title + '</h2>' +
          subtitleHtml +
          '<p class="book-card-authors">' + book.authors.join(', ') + '</p>' +
          annotationHtml +
          citationHtml +
          detailsHtml +
          bottomHtml;

        /* Cover column — right edge: book cover. Embedded mini-reader available
           only for books that ship a fragment PDF; otherwise the cover is static. */
        var hasMiniReader = !!book.fragment;
        var coverCol = document.createElement('div');
        coverCol.className = 'book-card-cover-col';
        if (!hasMiniReader) coverCol.style.cursor = 'default';
        var coverImg = document.createElement('img');
        coverImg.src = book.cover;
        coverImg.alt = book.title;
        coverCol.appendChild(coverImg);
        if (hasMiniReader) {
          var coverHint = document.createElement('div');
          coverHint.className = 'book-card-cover-col-hint';
          coverHint.setAttribute('aria-hidden', 'true');
          coverHint.textContent = 'Читать';
          coverCol.appendChild(coverHint);
        }

        /* Spread viewer — lazy-created on first open */
        var spreadViewer     = null;
        var viewerBar        = null;
        var fsBtnEl          = null;
        var readerOpen       = false;
        var readerFullscreen = false;

        /* Frameview overlay — lazy-created on first enter */
        var frameviewOverlay = null;
        var fvCounter        = null;
        var fvPrevBtn        = null;
        var fvNextBtn        = null;
        var fvZoomLabel      = null;
        var fvZoomInBtn      = null;
        var fvZoomOutBtn     = null;
        var fvStage          = null;
        var fvCanvasWrap     = null;
        /* Zoom/pan state */
        var fvZoom      = 1.0;
        var fvPanX      = 0;
        var fvPanY      = 0;
        var fvDragging  = false;
        var fvDragMoved = false;
        var fvDragStartX = 0;
        var fvDragStartY = 0;
        var fvPanStartX  = 0;
        var fvPanStartY  = 0;

        function applyTransform() {
          fvCanvasWrap.style.transform =
            'translate(' + fvPanX + 'px,' + fvPanY + 'px) scale(' + fvZoom + ')';
        }

        function setZoom(z, pivot) {
          var zOld = fvZoom;
          fvZoom = Math.max(0.5, Math.min(3.0, z));
          if (pivot && zOld !== fvZoom) {
            fvPanX = pivot.x - (pivot.x - fvPanX) * (fvZoom / zOld);
            fvPanY = pivot.y - (pivot.y - fvPanY) * (fvZoom / zOld);
          }
          if (fvZoom <= 1.0) { fvPanX = 0; fvPanY = 0; }
          applyTransform();
          fvZoomLabel.textContent  = Math.round(fvZoom * 100) + '%';
          fvZoomOutBtn.disabled    = fvZoom <= 0.5;
          fvZoomInBtn.disabled     = fvZoom >= 3.0;
          fvStage.classList.toggle('is-zoomed', fvZoom > 1.0);
        }

        function buildFrameview() {
          var ov = document.createElement('div');
          ov.className = 'frameview-overlay';

          /* ---- Header ---- */
          var hdr = document.createElement('div');
          hdr.className = 'frameview-header';

          var logo = document.createElement('span');
          logo.className = 'frameview-logo';
          logo.textContent = 'β→α';

          var ttl = document.createElement('span');
          ttl.className = 'frameview-title';
          ttl.textContent = book.title;

          /* Page navigation */
          var nav = document.createElement('div');
          nav.className = 'frameview-nav';

          fvPrevBtn = document.createElement('button');
          fvPrevBtn.type = 'button';
          fvPrevBtn.className = 'frameview-nav-btn';
          fvPrevBtn.setAttribute('aria-label', 'Предыдущий разворот');
          fvPrevBtn.innerHTML = '<svg viewBox="0 0 16 16" width="14" height="14" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
          fvPrevBtn.addEventListener('click', function () { if (spreadViewer) spreadViewer._prev(); });

          fvCounter = document.createElement('span');
          fvCounter.className = 'frameview-counter';

          fvNextBtn = document.createElement('button');
          fvNextBtn.type = 'button';
          fvNextBtn.className = 'frameview-nav-btn';
          fvNextBtn.setAttribute('aria-label', 'Следующий разворот');
          fvNextBtn.innerHTML = '<svg viewBox="0 0 16 16" width="14" height="14" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
          fvNextBtn.addEventListener('click', function () { if (spreadViewer) spreadViewer._next(); });

          nav.appendChild(fvPrevBtn);
          nav.appendChild(fvCounter);
          nav.appendChild(fvNextBtn);

          /* Zoom controls */
          var zoomGroup = document.createElement('div');
          zoomGroup.className = 'frameview-zoom';

          fvZoomOutBtn = document.createElement('button');
          fvZoomOutBtn.type = 'button';
          fvZoomOutBtn.className = 'frameview-zoom-btn';
          fvZoomOutBtn.setAttribute('aria-label', 'Уменьшить');
          fvZoomOutBtn.textContent = '−';
          fvZoomOutBtn.addEventListener('click', function () { setZoom(fvZoom - 0.25); });

          fvZoomLabel = document.createElement('button');
          fvZoomLabel.type = 'button';
          fvZoomLabel.className = 'frameview-zoom-label';
          fvZoomLabel.setAttribute('aria-label', 'Сбросить масштаб');
          fvZoomLabel.textContent = '100%';
          fvZoomLabel.addEventListener('click', function () { setZoom(1.0); });

          fvZoomInBtn = document.createElement('button');
          fvZoomInBtn.type = 'button';
          fvZoomInBtn.className = 'frameview-zoom-btn';
          fvZoomInBtn.setAttribute('aria-label', 'Увеличить');
          fvZoomInBtn.textContent = '+';
          fvZoomInBtn.addEventListener('click', function () { setZoom(fvZoom + 0.25); });

          zoomGroup.appendChild(fvZoomOutBtn);
          zoomGroup.appendChild(fvZoomLabel);
          zoomGroup.appendChild(fvZoomInBtn);

          var closeBtn = document.createElement('button');
          closeBtn.type = 'button';
          closeBtn.className = 'frameview-close';
          closeBtn.setAttribute('aria-label', 'Вернуться');
          closeBtn.innerHTML = '<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 10H3M8 5l-5 5 5 5"/></svg>';
          closeBtn.addEventListener('click', exitFullscreen);

          hdr.appendChild(closeBtn);
          hdr.appendChild(logo);
          hdr.appendChild(ttl);
          hdr.appendChild(nav);
          hdr.appendChild(zoomGroup);

          /* ---- Body: stage → canvas-wrap → spread viewer ---- */
          var bdyEl = document.createElement('div');
          bdyEl.className = 'frameview-body';

          fvStage = document.createElement('div');
          fvStage.className = 'frameview-stage';

          fvCanvasWrap = document.createElement('div');
          fvCanvasWrap.className = 'frameview-canvas-wrap';
          fvStage.appendChild(fvCanvasWrap);

          /* Wheel: zoom toward cursor */
          fvStage.addEventListener('wheel', function (e) {
            e.preventDefault();
            var rect = fvStage.getBoundingClientRect();
            setZoom(fvZoom - e.deltaY * 0.001, {
              x: e.clientX - rect.left - rect.width  / 2,
              y: e.clientY - rect.top  - rect.height / 2,
            });
          }, { passive: false });

          /* Drag pan (only when zoomed) */
          fvStage.addEventListener('mousedown', function (e) {
            if (e.button !== 0 || fvZoom <= 1.0) return;
            fvDragging   = true;
            fvDragMoved  = false;
            fvDragStartX = e.clientX;
            fvDragStartY = e.clientY;
            fvPanStartX  = fvPanX;
            fvPanStartY  = fvPanY;
            fvStage.classList.add('is-dragging');
            e.preventDefault();
          });
          window.addEventListener('mousemove', function (e) {
            if (!fvDragging) return;
            var dx = e.clientX - fvDragStartX;
            var dy = e.clientY - fvDragStartY;
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) fvDragMoved = true;
            fvPanX = fvPanStartX + dx;
            fvPanY = fvPanStartY + dy;
            applyTransform();
          });
          window.addEventListener('mouseup', function () {
            if (!fvDragging) return;
            fvDragging = false;
            fvStage.classList.remove('is-dragging');
          });

          /* Double-click: toggle 2× zoom toward click / reset */
          fvStage.addEventListener('dblclick', function (e) {
            var rect = fvStage.getBoundingClientRect();
            var pivot = {
              x: e.clientX - rect.left - rect.width  / 2,
              y: e.clientY - rect.top  - rect.height / 2,
            };
            setZoom(fvZoom > 1.0 ? 1.0 : 2.0, fvZoom <= 1.0 ? pivot : null);
          });

          /* Capture phase: cancel drag-followed-by-click; slot navigation
             is via header buttons / keyboard only inside frameview */
          fvStage.addEventListener('click', function (e) {
            if (fvDragMoved) { fvDragMoved = false; e.stopPropagation(); }
          }, true);

          bdyEl.appendChild(fvStage);
          ov.appendChild(hdr);
          ov.appendChild(bdyEl);
          document.body.appendChild(ov);
          return ov;
        }

        function enterFullscreen() {
          readerFullscreen = true;
          if (!frameviewOverlay) frameviewOverlay = buildFrameview();

          /* Wire change callback to update header counter + buttons */
          spreadViewer._onSpreadChange = function (cur, tot) {
            fvCounter.textContent = (cur + 1) + ' / ' + tot;
            fvPrevBtn.disabled    = cur <= 0;
            fvNextBtn.disabled    = cur >= tot - 1;
          };
          /* Initialise immediately with whatever the viewer already has rendered */
          var st = spreadViewer._state;
          if (st && st.total > 0) spreadViewer._onSpreadChange(st.current, st.total);

          /* Reset zoom/pan to fit on every open */
          fvZoom = 1.0; fvPanX = 0; fvPanY = 0;
          applyTransform();
          fvZoomLabel.textContent = '100%';
          fvZoomOutBtn.disabled   = false;
          fvZoomInBtn.disabled    = false;
          fvStage.classList.remove('is-zoomed', 'is-dragging');

          fvCanvasWrap.appendChild(spreadViewer);
          viewerBar.style.display        = 'none';
          frameviewOverlay.style.display = 'flex';
          document.body.style.overflow   = 'hidden';
        }

        function exitFullscreen() {
          if (!readerFullscreen) return;
          readerFullscreen = false;
          frameviewOverlay.style.display = 'none';
          document.body.style.overflow   = '';
          spreadViewer._onSpreadChange   = null;
          coverCol.appendChild(spreadViewer);
          if (readerOpen) viewerBar.style.display = '';
        }

        function onEscKey(e) {
          if (!readerFullscreen) return;
          if (e.key === 'Escape')              exitFullscreen();
          if (e.key === 'ArrowLeft')           spreadViewer._prev();
          if (e.key === 'ArrowRight')          spreadViewer._next();
          if (e.key === '+' || e.key === '=')  setZoom(fvZoom + 0.25);
          if (e.key === '-')                   setZoom(fvZoom - 0.25);
          if (e.key === '0')                   setZoom(1.0);
        }

        function openReader() {
          if (!hasMiniReader) return;
          readerOpen = true;
          panel.classList.add('is-reading');
          coverImg.style.display  = 'none';
          if (coverHint) coverHint.style.display = 'none';
          if (!spreadViewer) {
            /* Toolbar with fullscreen toggle, sits above the viewer */
            viewerBar = document.createElement('div');
            viewerBar.className = 'spread-viewer-bar';
            fsBtnEl = document.createElement('button');
            fsBtnEl.type = 'button';
            fsBtnEl.className = 'spread-fullscreen-btn';
            fsBtnEl.setAttribute('aria-label', 'На весь экран');
            fsBtnEl.innerHTML = expandIcon();
            viewerBar.appendChild(fsBtnEl);
            coverCol.appendChild(viewerBar);

            spreadViewer = renderSpreadViewer(book);
            coverCol.appendChild(spreadViewer);

            fsBtnEl.addEventListener('click', function () {
              if (readerFullscreen) exitFullscreen(); else enterFullscreen();
            });

            document.addEventListener('keydown', onEscKey);
          } else {
            spreadViewer.style.display = '';
            viewerBar.style.display    = '';
          }
        }

        function closeReader() {
          if (readerFullscreen) exitFullscreen();
          readerOpen = false;
          panel.classList.remove('is-reading');
          coverImg.style.display  = '';
          if (coverHint) coverHint.style.display = '';
          if (spreadViewer) spreadViewer.style.display = 'none';
          if (viewerBar)    viewerBar.style.display    = 'none';
        }

        function toggleReader() {
          if (readerOpen) closeReader(); else openReader();
        }

        coverCol.addEventListener('click', function () {
          if (!readerOpen) openReader();
        });

        main.appendChild(info);
        main.appendChild(coverCol);

        body.appendChild(main);
        panel.appendChild(header);
        panel.appendChild(body);

        header.querySelector('.book-card-close').addEventListener('click', close);
        var readBtn = header.querySelector('.book-card-read');
        if (hasMiniReader) {
          readBtn.addEventListener('click', toggleReader);
        } else {
          readBtn.style.display = 'none';
        }

        panel._openFrameview = function () {
          if (!readerOpen) openReader();
          if (!readerFullscreen) enterFullscreen();
        };

        return panel;
      }

  /* ===================================================================
     DRAWER SHELL + MOUNT
     =================================================================== */
  function buildShell() {
    backdropEl = document.createElement('div');
    backdropEl.className = 'bcd-backdrop';

    drawerEl = document.createElement('aside');
    drawerEl.className = 'bcd';
    drawerEl.setAttribute('role', 'dialog');
    drawerEl.setAttribute('aria-modal', 'true');
    drawerEl.setAttribute('aria-label', 'Карточка книги');
    drawerEl.setAttribute('aria-hidden', 'true');

    bodyHostEl = document.createElement('div');
    bodyHostEl.className = 'bcd-host';
    drawerEl.appendChild(bodyHostEl);

    document.body.appendChild(backdropEl);
    document.body.appendChild(drawerEl);

    backdropEl.addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawerEl.classList.contains('is-open')) close();
    });
  }

  /* Accepts a BOOKS key (string) or a full book-data object. Catalogue books
     without rich data degrade gracefully (no annotation block, no mini-reader). */
  function open(bookOrId, mode) {
    var book = (typeof bookOrId === 'string') ? BOOKS[bookOrId] : bookOrId;
    if (!book) return;
    if (!drawerEl) buildShell();
    currentMode = detectMode(mode);
    activeBookId = (typeof bookOrId === 'string') ? bookOrId : (book.id || null);
    panelEl = renderPanel(book, currentMode);
    bodyHostEl.innerHTML = '';
    bodyHostEl.appendChild(panelEl);
    backdropEl.classList.add('is-open');
    drawerEl.classList.add('is-open');
    drawerEl.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    /* hide pulse sidebar while book card is open (only if it was open) */
    var pulsePanel = document.querySelector('.ov-pulse-panel');
    _pulseOpenBeforeBCD = !!(pulsePanel && pulsePanel.classList.contains('is-open'));
    if (_pulseOpenBeforeBCD) {
      pulsePanel.classList.add('bcd-hidden');
      document.body.classList.add('bcd-pulse-hidden');
    }
    var closeBtn = panelEl.querySelector('.book-card-close');
    if (closeBtn) setTimeout(function () { closeBtn.focus(); }, 60);
  }

  function close() {
    if (!drawerEl) return;
    drawerEl.classList.remove('is-open');
    backdropEl.classList.remove('is-open');
    drawerEl.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    activeBookId = null;
    /* restore pulse sidebar to its state before the book card opened */
    if (_pulseOpenBeforeBCD) {
      var pulsePanel = document.querySelector('.ov-pulse-panel');
      if (pulsePanel) pulsePanel.classList.remove('bcd-hidden');
      document.body.classList.remove('bcd-pulse-hidden');
      _pulseOpenBeforeBCD = false;
    }
  }

  function init() {
    var triggers = document.querySelectorAll('[data-book-card]');
    Array.prototype.forEach.call(triggers, function (el) {
      if (el._bcdWired) return;
      el._bcdWired = true;
      if (!el.hasAttribute('tabindex') && el.tagName !== 'A' && el.tagName !== 'BUTTON') {
        el.setAttribute('tabindex', '0');
      }
      el.style.cursor = 'pointer';
      el.addEventListener('click', function (e) {
        e.preventDefault();
        open(el.getAttribute('data-book-card'), el.getAttribute('data-card-mode'));
      });
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open(el.getAttribute('data-book-card'), el.getAttribute('data-card-mode'));
        }
      });
    });
  }

  window.BookCardDrawer = { open: open, close: close, init: init, BOOKS: BOOKS };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

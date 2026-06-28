/* components/demo.js — Guided tour overlay
   BA.demo.start() / .stop() / .next() / .prev()
   Shows tooltip bubbles pointing at interface elements in sequence. */
(function () {
  'use strict';
  window.BA = window.BA || {};

  var CSS = [
    '.demo-backdrop{position:fixed;inset:0;z-index:850;pointer-events:none;}',
    '.demo-backdrop.is-active{pointer-events:auto;}',
    '.demo-spotlight{position:fixed;z-index:851;border-radius:8px;',
    'box-shadow:0 0 0 9999px rgba(20,16,12,.62);pointer-events:none;transition:all 280ms var(--ease-out-quart,cubic-bezier(.25,.46,.45,.94));}',
    '.demo-tip{position:fixed;z-index:852;background:var(--paper,#F5EFE4);border-radius:14px;',
    'width:300px;padding:20px;box-shadow:0 8px 40px rgba(0,0,0,.22);',
    'transition:all 240ms var(--ease-out-quart,cubic-bezier(.25,.46,.45,.94));}',
    '.demo-tip-arrow{position:absolute;width:12px;height:12px;background:var(--paper,#F5EFE4);',
    'transform:rotate(45deg);}',
    /* Orange quarter-circle corner brackets — arc (r=14, matches the tip) + 15px arms */
    '.demo-tip-corner{position:absolute;width:29px;height:29px;box-sizing:border-box;',
    'pointer-events:none;border:0 solid var(--accent,#C1654B);}',
    '.demo-tip-corner--tl{top:0;left:0;border-top-width:3px;border-left-width:3px;border-top-left-radius:14px;}',
    '.demo-tip-corner--tr{top:0;right:0;border-top-width:3px;border-right-width:3px;border-top-right-radius:14px;}',
    '.demo-tip-corner--bl{bottom:0;left:0;border-bottom-width:3px;border-left-width:3px;border-bottom-left-radius:14px;}',
    '.demo-tip-corner--br{bottom:0;right:0;border-bottom-width:3px;border-right-width:3px;border-bottom-right-radius:14px;}',
    '.demo-tip-step{font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;',
    'color:var(--accent,#C1654B);margin:0 0 6px;}',
    '.demo-tip-title{font-family:var(--font-serif);font-size:17px;font-weight:600;margin:0 0 8px;color:var(--ink);}',
    '.demo-tip-body{font-size:13px;line-height:1.6;color:var(--ink);margin:0 0 16px;}',
    '.demo-tip-nav{display:flex;align-items:center;gap:8px;}',
    '.demo-tip-dots{flex:1;display:flex;gap:5px;justify-content:center;}',
    '.demo-tip-dot{width:6px;height:6px;border-radius:50%;background:var(--line,rgba(26,20,16,.2));}',
    '.demo-tip-dot.is-active{background:var(--accent,#C1654B);}',
    '.demo-close-hint{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:852;',
    'background:rgba(20,16,12,.72);color:#ECE3D6;font-size:13px;padding:8px 20px;border-radius:20px;',
    'pointer-events:auto;}',
  ].join('');

  var STEPS = [
    {
      selector: '.site-header',
      placement: 'bottom',
      title: 'Шапка сайта',
      body: 'Переключается между публичным и приватным режимом автоматически. В публичном режиме — кнопки входа и регистрации. В приватном — поиск, уведомления и аватар.'
    },
    {
      selector: '.primary-nav',
      placement: 'bottom',
      title: 'Навигация',
      body: 'Центральная навигация с индикатором активного раздела. Точка под активным пунктом — всегда на месте; полоса подсвечивает при клике.'
    },
    {
      selector: '#ba-debug-fab',
      placement: 'left',
      title: 'Отладочная консоль',
      body: 'Кнопка ⚙ открывает консоль разработчика. В ней — переключение пользователей, симуляция активности, данные платформы и лог событий.'
    },
    {
      selector: '#demo-mode-section',
      placement: 'bottom',
      title: 'Режим доступа',
      body: 'Переключайтесь между публичным и приватным режимом через консоль (⚙). В публичном режиме часть компонентов заблокирована.'
    },
    {
      selector: '#demo-components-section',
      placement: 'top',
      title: 'Компоненты платформы',
      body: 'Каждая кнопка открывает отдельный компонент. Серые кнопки недоступны в публичном режиме — войдите в аккаунт, чтобы разблокировать их.'
    },
    {
      selector: '#demo-session-section',
      placement: 'top',
      title: 'Данные сессии',
      body: 'Живой дамп текущей сессии из sessionStorage. Обновляется мгновенно при смене пользователя или выходе.'
    }
  ];

  var _el = null;
  var _spotlight = null;
  var _tip = null;
  var _hint = null;
  var _step = 0;

  function _inject() {
    if (document.getElementById('ba-demo-css')) return;
    var s = document.createElement('style');
    s.id = 'ba-demo-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function _build() {
    if (_el) return;
    _inject();

    _el = document.createElement('div');
    _el.className = 'demo-backdrop';
    document.body.appendChild(_el);

    _spotlight = document.createElement('div');
    _spotlight.className = 'demo-spotlight';
    document.body.appendChild(_spotlight);

    _tip = document.createElement('div');
    _tip.className = 'demo-tip';
    document.body.appendChild(_tip);

    _hint = document.createElement('div');
    _hint.className = 'demo-close-hint';
    _hint.innerHTML = '<button type="button" style="background:none;border:none;color:inherit;cursor:pointer;font-size:13px;" id="demo-stop-btn">Завершить тур ✕</button>';
    document.body.appendChild(_hint);

    _hint.querySelector('#demo-stop-btn').addEventListener('click', BA.demo.stop);

    document.addEventListener('keydown', function (e) {
      if (!_el || !_el.classList.contains('is-active')) return;
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); BA.demo.next(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); BA.demo.prev(); }
      if (e.key === 'Escape') BA.demo.stop();
    });
  }

  function _renderStep() {
    var s = STEPS[_step];
    var target = document.querySelector(s.selector);

    if (target) {
      var rect = target.getBoundingClientRect();
      var pad = 6;
      _spotlight.style.cssText = [
        'left:' + (rect.left - pad) + 'px;',
        'top:' + (rect.top - pad) + 'px;',
        'width:' + (rect.width + pad * 2) + 'px;',
        'height:' + (rect.height + pad * 2) + 'px;',
      ].join('');
      _spotlight.style.display = 'block';
    } else {
      _spotlight.style.display = 'none';
    }

    var dots = STEPS.map(function (_, i) {
      return '<span class="demo-tip-dot' + (i === _step ? ' is-active' : '') + '"></span>';
    }).join('');

    _tip.innerHTML = [
      '<span class="demo-tip-corner demo-tip-corner--tl"></span>',
      '<span class="demo-tip-corner demo-tip-corner--tr"></span>',
      '<span class="demo-tip-corner demo-tip-corner--bl"></span>',
      '<span class="demo-tip-corner demo-tip-corner--br"></span>',
      '<p class="demo-tip-step">Шаг ' + (_step + 1) + ' из ' + STEPS.length + '</p>',
      '<h3 class="demo-tip-title">' + s.title + '</h3>',
      '<p class="demo-tip-body">' + s.body + '</p>',
      '<div class="demo-tip-nav">',
        '<button type="button" class="btn btn-ghost" id="demo-prev" style="font-size:13px;padding:6px 14px"' + (_step === 0 ? ' disabled' : '') + '>← Назад</button>',
        '<div class="demo-tip-dots">' + dots + '</div>',
        '<button type="button" class="btn btn-primary" id="demo-next" style="font-size:13px;padding:6px 14px">',
          _step === STEPS.length - 1 ? 'Завершить' : 'Далее →',
        '</button>',
      '</div>',
    ].join('');

    _tip.querySelector('#demo-prev').addEventListener('click', BA.demo.prev);
    _tip.querySelector('#demo-next').addEventListener('click', function () {
      if (_step === STEPS.length - 1) { BA.demo.stop(); } else { BA.demo.next(); }
    });

    // Position tip
    if (target) {
      var rect2 = target.getBoundingClientRect();
      var vw = window.innerWidth, vh = window.innerHeight;
      var tw = 300, th = 200;
      var tipLeft = rect2.left + rect2.width / 2 - tw / 2;
      var tipTop;
      if (s.placement === 'bottom') {
        tipTop = rect2.bottom + 16;
      } else {
        tipTop = rect2.top - th - 16;
      }
      tipLeft = Math.max(12, Math.min(tipLeft, vw - tw - 12));
      tipTop = Math.max(12, Math.min(tipTop, vh - th - 12));
      _tip.style.left = tipLeft + 'px';
      _tip.style.top = tipTop + 'px';
    } else {
      _tip.style.left = '50%';
      _tip.style.top = '50%';
      _tip.style.transform = 'translate(-50%,-50%)';
    }
  }

  window.BA.demo = {
    start: function () {
      _build();
      _step = 0;
      _el.classList.add('is-active');
      _spotlight.style.display = 'block';
      _tip.style.display = 'block';
      _hint.style.display = 'block';
      _renderStep();
    },
    stop: function () {
      if (!_el) return;
      _el.classList.remove('is-active');
      if (_spotlight) _spotlight.style.display = 'none';
      if (_tip) _tip.style.display = 'none';
      if (_hint) _hint.style.display = 'none';
    },
    next: function () {
      if (_step < STEPS.length - 1) { _step++; _renderStep(); }
    },
    prev: function () {
      if (_step > 0) { _step--; _renderStep(); }
    }
  };
})();

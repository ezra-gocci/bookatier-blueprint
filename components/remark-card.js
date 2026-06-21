/* components/remark-card.js — Remark/annotation editor modal (80% viewport)
   BA.remarkCard.open() / .close()
   Private only — public mode shows login prompt. */
(function () {
  'use strict';
  window.BA = window.BA || {};

  var CSS = [
    '.rc-backdrop{position:fixed;inset:0;z-index:815;background:rgba(20,16,12,.55);',
    'backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;',
    'opacity:0;pointer-events:none;transition:opacity 200ms;}',
    '.rc-backdrop.is-open{opacity:1;pointer-events:auto;}',
    '.rc-modal{position:relative;background:var(--paper,#F5EFE4);border-radius:16px;',
    'width:80vw;height:80vh;max-width:960px;display:flex;flex-direction:column;',
    'box-shadow:0 24px 64px rgba(0,0,0,.22);',
    'transform:translateY(20px);transition:transform 280ms var(--ease-out-quart,cubic-bezier(.25,.46,.45,.94));}',
    '.rc-backdrop.is-open .rc-modal{transform:translateY(0);}',
    '.rc-head{padding:16px 20px;border-bottom:1px solid var(--line,rgba(26,20,16,.1));',
    'display:flex;align-items:center;gap:12px;flex-shrink:0;}',
    '.rc-head-title{font-weight:600;font-size:15px;flex:1;color:var(--ink);}',
    '.rc-mode-toggle{display:flex;border:1px solid var(--line,rgba(26,20,16,.15));border-radius:8px;overflow:hidden;}',
    '.rc-mode-btn{padding:5px 14px;background:none;border:none;font-size:13px;cursor:pointer;',
    'color:var(--ink-faint);transition:all 140ms;}',
    '.rc-mode-btn.is-active{background:var(--ink,#1A1410);color:var(--paper,#F5EFE4);}',
    '.rc-toolbar{padding:8px 20px;border-bottom:1px solid var(--line,rgba(26,20,16,.08));',
    'display:flex;gap:4px;flex-wrap:wrap;flex-shrink:0;}',
    '.rc-tb-btn{padding:5px 10px;background:none;border:1px solid transparent;border-radius:6px;',
    'font-size:13px;cursor:pointer;color:var(--ink-faint);font-family:inherit;transition:all 140ms;}',
    '.rc-tb-btn:hover{border-color:var(--line);color:var(--ink);}',
    '.rc-tb-sep{width:1px;background:var(--line,rgba(26,20,16,.12));margin:0 4px;align-self:stretch;}',
    '.rc-body{flex:1;display:flex;overflow:hidden;}',
    '.rc-editor-wrap{flex:1;display:flex;flex-direction:column;overflow:hidden;}',
    '.rc-editor{flex:1;padding:20px;font-size:15px;line-height:1.75;color:var(--ink);',
    'border:none;background:none;resize:none;font-family:var(--font-sans,inherit);outline:none;',
    'overflow-y:auto;}',
    '.rc-editor::placeholder{color:var(--ink-faint);}',
    '.rc-preview{flex:1;padding:20px;overflow-y:auto;font-size:15px;line-height:1.75;color:var(--ink);}',
    '.rc-preview h3{font-family:var(--font-serif);font-size:20px;margin:0 0 12px;}',
    '.rc-preview blockquote{border-left:3px solid var(--accent,#C1654B);margin:12px 0;padding-left:16px;',
    'color:var(--ink-faint);font-style:italic;}',
    '.rc-inlay-chip{display:inline-flex;align-items:center;gap:4px;padding:1px 8px 1px 6px;',
    'border-radius:12px;background:color-mix(in srgb,var(--accent,#C1654B) 12%,transparent);',
    'color:var(--accent,#C1654B);font-size:13px;font-weight:500;cursor:pointer;}',
    '.rc-foot{padding:12px 20px;border-top:1px solid var(--line,rgba(26,20,16,.1));',
    'display:flex;align-items:center;gap:10px;flex-shrink:0;}',
    '.rc-char-count{font-size:12px;color:var(--ink-faint);flex:1;}',
    '.rc-close{position:absolute;top:14px;right:16px;background:none;border:none;',
    'font-size:20px;color:var(--ink-faint);cursor:pointer;line-height:1;padding:4px;}',
  ].join('');

  var TB_ACTIONS = [
    { label: '<strong>Ж</strong>', title: 'Жирный', md: '**', wrap: true },
    { label: '<em>К</em>', title: 'Курсив', md: '*', wrap: true },
    { label: 'H', title: 'Заголовок', md: '### ', wrap: false },
    { sep: true },
    { label: '❝', title: 'Цитата', md: '> ', wrap: false },
    { label: '•', title: 'Список', md: '- ', wrap: false },
    { sep: true },
    { label: '@', title: 'Участник', md: '@', wrap: false, insert: '@имя_участника' },
    { label: '#', title: 'Книга', md: '#', wrap: false, insert: '#книга' },
    { label: '🔗', title: 'Ссылка', md: '[url]', wrap: false, insert: '[https://]' },
  ];

  var _el = null;
  var _textarea = null;
  var _preview = null;
  var _mode = 'edit'; // 'edit' | 'preview'

  function _inject() {
    if (document.getElementById('ba-rc-css')) return;
    var s = document.createElement('style');
    s.id = 'ba-rc-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function _insertAtCursor(text) {
    if (!_textarea) return;
    var start = _textarea.selectionStart;
    var end = _textarea.selectionEnd;
    var val = _textarea.value;
    _textarea.value = val.slice(0, start) + text + val.slice(end);
    _textarea.selectionStart = _textarea.selectionEnd = start + text.length;
    _textarea.focus();
    _updateCount();
  }

  function _wrapSelection(md) {
    if (!_textarea) return;
    var start = _textarea.selectionStart;
    var end = _textarea.selectionEnd;
    var selected = _textarea.value.slice(start, end) || 'текст';
    _insertAtCursor(md + selected + md);
  }

  function _updateCount() {
    var count = _el ? (_textarea ? _textarea.value.length : 0) : 0;
    var el = _el && _el.querySelector('#rc-char-count');
    if (el) el.textContent = count + ' симв.';
  }

  function _renderPreview(text) {
    // Simple Markdown-ish render
    var html = text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(@\S+)/g, '<span class="rc-inlay-chip">👤 $1</span>')
      .replace(/(#\S+)/g, '<span class="rc-inlay-chip">📖 $1</span>')
      .replace(/\n/g, '<br>');
    return html || '<p style="color:var(--ink-faint)">Предпросмотр появится здесь…</p>';
  }

  function _build() {
    if (_el) return;
    _inject();

    _el = document.createElement('div');
    _el.className = 'rc-backdrop';
    _el.setAttribute('role', 'dialog');
    _el.setAttribute('aria-modal', 'true');
    _el.setAttribute('aria-label', 'Редактор заметки');
    _el.setAttribute('aria-hidden', 'true');

    var tbHtml = TB_ACTIONS.map(function (a) {
      if (a.sep) return '<span class="rc-tb-sep" aria-hidden="true"></span>';
      return '<button class="rc-tb-btn" type="button" title="' + a.title + '">' + a.label + '</button>';
    }).join('');

    _el.innerHTML = [
      '<div class="rc-modal">',
        '<button class="rc-close" type="button" aria-label="Закрыть">×</button>',
        '<div class="rc-head">',
          '<span class="rc-head-title">Новая заметка</span>',
          '<div class="rc-mode-toggle" role="group" aria-label="Режим редактора">',
            '<button class="rc-mode-btn is-active" id="rc-edit-btn" type="button">Редактор</button>',
            '<button class="rc-mode-btn" id="rc-preview-btn" type="button">Предпросмотр</button>',
          '</div>',
        '</div>',
        '<div class="rc-toolbar" id="rc-toolbar">' + tbHtml + '</div>',
        '<div class="rc-body">',
          '<div class="rc-editor-wrap" id="rc-editor-wrap">',
            '<textarea class="rc-editor" id="rc-textarea" placeholder="Напишите заметку, цитату или комментарий…\n\nПоддерживается Markdown: **жирный**, *курсив*, ### заголовок, > цитата\n@участник   #книга   [ссылка]"></textarea>',
          '</div>',
          '<div class="rc-preview" id="rc-preview" style="display:none"></div>',
        '</div>',
        '<div class="rc-foot">',
          '<span class="rc-char-count" id="rc-char-count">0 симв.</span>',
          '<button class="btn btn-ghost" type="button" id="rc-cancel-btn">Отмена</button>',
          '<button class="btn btn-primary" type="button" id="rc-save-btn">Сохранить</button>',
        '</div>',
      '</div>'
    ].join('');

    document.body.appendChild(_el);

    _textarea = _el.querySelector('#rc-textarea');
    _preview = _el.querySelector('#rc-preview');

    // Mode toggle
    _el.querySelector('#rc-edit-btn').addEventListener('click', function () {
      _mode = 'edit';
      _el.querySelector('#rc-editor-wrap').style.display = '';
      _el.querySelector('#rc-toolbar').style.display = '';
      _preview.style.display = 'none';
      _el.querySelector('#rc-edit-btn').classList.add('is-active');
      _el.querySelector('#rc-preview-btn').classList.remove('is-active');
      _textarea.focus();
    });
    _el.querySelector('#rc-preview-btn').addEventListener('click', function () {
      _mode = 'preview';
      _el.querySelector('#rc-editor-wrap').style.display = 'none';
      _el.querySelector('#rc-toolbar').style.display = 'none';
      _preview.style.display = '';
      _preview.innerHTML = _renderPreview(_textarea.value);
      _el.querySelector('#rc-preview-btn').classList.add('is-active');
      _el.querySelector('#rc-edit-btn').classList.remove('is-active');
    });

    // Toolbar actions
    var tbBtns = _el.querySelectorAll('.rc-tb-btn');
    TB_ACTIONS.filter(function (a) { return !a.sep; }).forEach(function (a, i) {
      if (!tbBtns[i]) return;
      tbBtns[i].addEventListener('click', function () {
        if (a.wrap) { _wrapSelection(a.md); }
        else if (a.insert) { _insertAtCursor(a.insert); }
        else { _insertAtCursor(a.md); }
      });
    });

    _textarea.addEventListener('input', _updateCount);

    _el.querySelector('#rc-cancel-btn').addEventListener('click', BA.remarkCard.close);
    _el.querySelector('#rc-save-btn').addEventListener('click', function () {
      if (_textarea && _textarea.value.trim()) {
        BA.remarkCard.close();
      }
    });
    _el.querySelector('.rc-close').addEventListener('click', BA.remarkCard.close);
    _el.addEventListener('click', function (e) { if (e.target === _el) BA.remarkCard.close(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && _el && _el.classList.contains('is-open')) BA.remarkCard.close();
    });
  }

  window.BA.remarkCard = {
    open: function () {
      // Private only
      if (!window.BA || !BA.session || !BA.session.isPrivate()) {
        if (window.BA && BA.frame && BA.frame.openLogin) BA.frame.openLogin();
        return;
      }
      _build();
      // Reset editor
      if (_textarea) _textarea.value = '';
      _updateCount();
      _el.classList.add('is-open');
      _el.setAttribute('aria-hidden', 'false');
      if (_textarea) setTimeout(function () { _textarea.focus(); }, 60);
    },
    close: function () {
      if (!_el) return;
      _el.classList.remove('is-open');
      _el.setAttribute('aria-hidden', 'true');
    }
  };
})();

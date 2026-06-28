/* components/notifications.js — Notifications dropdown (overlay C)
   ────────────────────────────────────────────────────────────────────────────
   BA.notifications.init(bellEl) — called by frame.js for the private header.
   Renders the DERIVED, GROUPED notifications from BA.store (O-10): grouped by
   (type × target), per-group unread badge, consume-on-open marks the group read,
   newest-first. Dropdown overlay only — no dedicated notifications page (§4).
   Feature area: 16 (Notifications). Spec refs: specs §1.15 (Notification grouping),
   §2.3 (what feeds notifications), system-model §4.6. */
(function () {
  'use strict';
  window.BA = window.BA || {};

  var CSS = [
    '.ba-notif-anchor{right:24px;}',
    '.notif-panel{position:absolute;top:calc(100% + 8px);right:0;z-index:var(--z-dropdown,700);',
    'width:360px;max-width:calc(100vw - 32px);background:var(--paper,#F5EFE4);',
    'border:1px solid var(--line,rgba(26,20,16,.12));border-radius:12px;',
    'box-shadow:0 8px 32px rgba(0,0,0,.14);overflow:hidden;',
    'opacity:0;transform:translateY(-6px);pointer-events:none;',
    'transition:opacity 180ms var(--ease-out-quart,cubic-bezier(.25,.46,.45,.94)),',
    'transform 180ms var(--ease-out-quart,cubic-bezier(.25,.46,.45,.94));}',
    '.notif-panel.is-open{opacity:1;transform:translateY(0);pointer-events:auto;}',
    '.notif-head{padding:14px 16px;border-bottom:1px solid var(--line,rgba(26,20,16,.1));display:flex;align-items:center;}',
    '.notif-head-title{font-family:var(--font-sans);font-weight:600;font-size:14px;flex:1;color:var(--ink);}',
    '.notif-clear{background:none;border:none;font-family:var(--font-sans);font-size:12px;color:var(--accent,#C1654B);cursor:pointer;padding:0;}',
    '.notif-body{max-height:380px;overflow-y:auto;}',
    '.notif-item{display:flex;gap:10px;padding:12px 16px;cursor:pointer;border-bottom:1px solid var(--line,rgba(26,20,16,.06));transition:background 140ms;}',
    '.notif-item:hover{background:var(--surface-sunk,rgba(26,20,16,.04));}',
    '.notif-item:last-child{border-bottom:none;}',
    '.notif-item.is-unread{background:color-mix(in srgb,var(--accent,#C1654B) 6%,transparent);}',
    '.notif-icon{width:32px;height:32px;border-radius:50%;background:var(--surface-sunk,rgba(26,20,16,.06));display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;margin-top:1px;}',
    '.notif-text{font-family:var(--font-sans);font-size:13px;line-height:1.45;color:var(--ink);margin:0 0 3px;}',
    '.notif-text b{font-weight:600;}',
    '.notif-badge{display:inline-block;min-width:16px;height:16px;padding:0 5px;margin-left:4px;font-size:10px;font-weight:700;line-height:16px;text-align:center;color:var(--on-accent,#fff);background:var(--accent);border-radius:999px;}',
    '.notif-time{font-family:var(--font-sans);font-size:11px;color:var(--ink-faint);}',
    '.notif-empty{padding:40px 16px;text-align:center;font-family:var(--font-sans);font-size:13px;color:var(--ink-faint);font-style:italic;}',
    '.notif-foot{padding:10px 16px;border-top:1px solid var(--line,rgba(26,20,16,.1));text-align:center;}',
    '.notif-foot a{font-family:var(--font-sans);font-size:13px;color:var(--accent,#C1654B);text-decoration:none;}',
    '.notif-foot a:hover{text-decoration:underline;}'
  ].join('');

  var _panel = null, _anchor = null;

  function _pp(){ return /\/pages\//.test(location.pathname) ? '' : 'pages/'; }
  function timeAgo(iso){ if(!iso) return ''; var s=Math.floor((Date.now()-new Date(iso).getTime())/1000); if(s<60)return 'только что'; var m=Math.floor(s/60); if(m<60)return m+' мин. назад'; var h=Math.floor(m/60); if(h<24)return h+' ч. назад'; var d=Math.floor(h/24); return d+' дн. назад'; }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function mName(id){ var st=BA.store; var m=st&&st.memberRecord?st.memberRecord(id):null; return m?m.displayName:id; }
  function bTitle(id){ var b=window.BA.bookData&&BA.bookData.get(id); return b?b.title:id; }

  var ICON = { reply:'💬', comment:'💬', vote:'⭐', reputation:'🏅', review:'✍️', message:'✉', version:'📚', post:'📰', track:'👁', shelf:'📖' };
  function groupText(g){
    var n = g.events.length;
    var t = g.target;
    var tgt = t ? (t.entity==='publication' ? '«'+esc(bTitle(t.entity_id))+'»' : t.entity==='member' ? esc(mName(t.entity_id)) : t.entity==='reaction' ? 'ваш комментарий' : esc(t.entity)) : '';
    switch (g.family){
      case 'reply': return '<b>'+n+'</b> '+plural(n,'новый ответ','новых ответа','новых ответов')+' · '+tgt;
      case 'vote': return '<b>'+n+'</b> '+plural(n,'голос','голоса','голосов')+' за '+tgt;
      case 'reputation': return 'Ваша репутация изменилась';
      case 'message': return '<b>'+n+'</b> '+plural(n,'сообщение','сообщения','сообщений');
      case 'version': return 'Новое издание · '+tgt;
      case 'comment': return '<b>'+n+'</b> '+plural(n,'комментарий','комментария','комментариев')+' · '+tgt;
      default: return '<b>'+n+'</b> '+esc(g.family);
    }
  }
  function plural(n, one, few, many){ var m10=n%10,m100=n%100; if(m10===1&&m100!==11)return one; if(m10>=2&&m10<=4&&(m100<10||m100>=20))return few; return many; }

  function _groups(){ var st=window.BA&&BA.store; var id=st&&st.activeId&&st.activeId(); return (st&&id&&st.notificationsFor)?st.notificationsFor(id):[]; }

  function _build(anchorEl) {
    if (!document.getElementById('ba-notif-css')) { var s=document.createElement('style'); s.id='ba-notif-css'; s.textContent=CSS; document.head.appendChild(s); }
    if (_panel) _panel.remove();
    _panel = document.createElement('div');
    _panel.className = 'notif-panel';
    _panel.setAttribute('role','dialog'); _panel.setAttribute('aria-label','Уведомления');

    var groups = _groups();
    var unreadTotal = groups.filter(function(g){return g.unread>0;}).length;
    var body = groups.length ? groups.map(function(g){
      return '<div class="notif-item'+(g.unread>0?' is-unread':'')+'" data-key="'+esc(g.key)+'">' +
        '<div class="notif-icon">'+(ICON[g.family]||'•')+'</div>' +
        '<div style="flex:1;min-width:0;"><p class="notif-text">'+groupText(g)+(g.unread>0?'<span class="notif-badge">'+g.unread+'</span>':'')+'</p>' +
        '<p class="notif-time">'+esc(timeAgo(g.latestAt))+'</p></div></div>';
    }).join('') : '<p class="notif-empty">Здесь пока тихо — новых уведомлений нет.</p>';

    _panel.innerHTML =
      '<div class="notif-head"><span class="notif-head-title">Уведомления'+(unreadTotal?' · '+unreadTotal:'')+'</span>' +
        '<button class="notif-clear" type="button" id="notif-clear-btn">Прочитать все</button></div>' +
      '<div class="notif-body" id="notif-body">'+body+'</div>' +
      '<div class="notif-foot"><a href="'+_pp()+'community.html?tab=pulse">Открыть Пульс →</a></div>';

    anchorEl.style.position = 'relative';
    anchorEl.appendChild(_panel);

    _panel.querySelector('#notif-clear-btn').addEventListener('click', function (e) {
      e.stopPropagation(); var st=BA.store; if(st&&st.markAllRead) st.markAllRead(st.activeId());
      _refresh(); _bumpHeader();
    });
    _panel.querySelector('#notif-body').addEventListener('click', function (e) {
      var item = e.target.closest('.notif-item'); if (!item) return;
      var key = item.getAttribute('data-key'); var st=BA.store;
      if (st&&st.markGroupRead) st.markGroupRead(st.activeId(), key);   // consume-on-open
      item.classList.remove('is-unread');
      var badge = item.querySelector('.notif-badge'); if (badge) badge.remove();
      _bumpHeader();
    });
    document.addEventListener('click', function (e) {
      if (_panel && _panel.classList.contains('is-open') && !anchorEl.contains(e.target)) {
        _panel.classList.remove('is-open'); anchorEl.setAttribute('aria-expanded','false');
      }
    });
  }
  function _refresh(){ if (_anchor) _build(_anchor); if (_panel) _panel.classList.add('is-open'); }
  /* nudge the header bell count after consume (frame re-renders header on session-change;
     here we just update the visible badge text). */
  function _bumpHeader(){
    var st=BA.store; if(!st||!st.unreadCount) return; var n=st.unreadCount(st.activeId());
    var badge=document.querySelector('.notif-count'); if(badge){ badge.textContent=n; badge.style.display=n>0?'':'none'; }
    var av=document.querySelector('.ba-avatar-notif'); if(av){ av.textContent=n; av.classList.toggle('has-notifs', n>0); }
  }

  window.BA.notifications = {
    init: function (bellEl) {
      _anchor = bellEl;
      bellEl.addEventListener('click', function (e) { e.stopPropagation(); BA.notifications.toggle(); });
    },
    open: function () {
      if (!_anchor) { var a=document.createElement('div'); a.className='ba-notif-anchor'; a.style.cssText='position:fixed;top:60px;right:24px;z-index:800;'; document.body.appendChild(a); _anchor=a; }
      _build(_anchor); _panel.classList.add('is-open'); _anchor.setAttribute('aria-expanded','true');
    },
    close: function () { if (_panel) _panel.classList.remove('is-open'); if (_anchor) _anchor.setAttribute('aria-expanded','false'); },
    toggle: function () { if (_panel && _panel.classList.contains('is-open')) BA.notifications.close(); else BA.notifications.open(); }
  };
})();

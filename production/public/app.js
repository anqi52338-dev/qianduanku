(() => {
const EMOJIS = ['😊','🥰','😘','🥹','🥺','😌','😏','😴','🐰','🌸','💕','✨','🌙','☕','🍓','🎀','💗','🫧'];
const BGS = [['damask', '花纹', 'var(--blush) var(--damask)'], ['ivory', '象牙', 'var(--ivory)'], ['rose', '蔷薇', 'linear-gradient(170deg,#fdf3f1,#f7e2e3)'], ['sky', '雾蓝', 'linear-gradient(170deg,#f6f6fb,#e9eef7)']];
const MODELS = [['default', '跟随订阅默认'], ['opus', 'Opus'], ['sonnet', 'Sonnet'], ['haiku', 'Haiku']];
const ROSE = `<svg viewBox="0 0 120 120" role="img" aria-label="小花"><circle cx="60" cy="60" r="60" fill="#f1e3bf"/><circle cx="60" cy="60" r="55.500" fill="#fdeeee"/><g fill="#f6c3cd" stroke="#e3a9b5" stroke-width="1.500"><circle cx="60" cy="40" r="15"/><circle cx="79" cy="54" r="15"/><circle cx="72" cy="76" r="15"/><circle cx="48" cy="76" r="15"/><circle cx="41" cy="54" r="15"/></g><circle cx="60" cy="60" r="10" fill="#fff6e6" stroke="#b3935a" stroke-width="1.500"/></svg>`;
const ICON = {
  home: 'M4 11l8-7 8 7M6 10v9h12v-9', star: 'M12 4l2.500 5.200 5.700.800-4.100 4 1 5.600L12 17l-5.100 2.600 1-5.600-4.100-4 5.700-.800z',
  heart: 'M12 20s-7-4.400-7-10a4 4 0 0 1 7-2.600A4 4 0 0 1 19 10c0 5.600-7 10-7 10z', cam: 'M4 8h3l1.500-2h7L17 8h3v11H4zM12 10.500a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  set: 'M4 7h9M17 7h3M4 17h3M11 17h9M15 5a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM9 15a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
  send: 'M12 19V5M6 11l6-6 6 6', stop: 'M8 8h8v8H8z', img: 'M5 5h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM4 16l4.500-4.500 3.500 3.500 3-3 5 5M8.500 9h.01',
  smile: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM8.500 14.500c1 1.200 2.200 1.800 3.500 1.800s2.500-.600 3.500-1.800M9 10h.01M15 10h.01',
};
const icon = (n, size = 20, fill = false) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICON[n]}"/></svg>`;

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rich = (s) => esc(s).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
const pad = (n) => String(n).padStart(2, '0');
const hm = (ts) => { const d = new Date(ts); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
const dayOf = (ts) => { const d = new Date(ts); return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`; };
const fileUrl = (name) => '/api/file/' + encodeURIComponent(name);

let toastTimer;
const toast = (msg) => { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2600); };

async function api(path, method = 'GET', body) {
  const init = { method, headers: {} };
  if (method !== 'GET') { init.headers['content-type'] = 'application/json'; init.body = JSON.stringify(body ?? {}); }
  const res = await fetch(path, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || '网络开小差了，再试一次'), { status: res.status, code: data.code });
  return data;
}

const S = { quote: null, lifePrefs: {}, voice: {}, profile: { hisName: '哥哥', bg: 'damask', model: 'default' }, memory: '', backup: {}, counts: { messages: 0, diary: 0, pending: 0 }, since: Date.now(), claude: {}, msgs: [], hasMore: false, busy: false, status: '', pending: null, momentImg: null, stkImg: null, pendingSticker: null, stkEditing: null, page: 'chat', diary: null, moments: null, stickers: [] };
const hisName = () => S.profile.hisName || '哥哥';
const avatar = (who) => { const name = who === 'me' ? S.profile.myAv : S.profile.hisAv; return name ? `<img src="${fileUrl(name)}" alt="">` : (who === 'me' ? ROSE : Bunny.avatar()); };

// ===== 图片 =====
function shrink(file, max, cap) {
  return new Promise((res, rej) => {
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => {
      let scale = Math.min(1, max / Math.max(img.width, img.height)), q = 0.84, out = '';
      for (let k = 0; k < 6; k++) {
        const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(img.width * scale)); c.height = Math.max(1, Math.round(img.height * scale));
        const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
        out = c.toDataURL('image/jpeg', q); if (out.length <= cap) break; scale *= 0.75; q -= 0.07;
      }
      URL.revokeObjectURL(url); res(out);
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('bad image')); };
    img.src = url;
  });
}
const pick = (input, max, cap, cb) => input.addEventListener('change', async () => {
  const f = input.files[0]; input.value = ''; if (!f) return;
  try { cb(await shrink(f, max, cap)); } catch { toast('这张图打不开，换一张试试'); }
});

function setQuote(message) {
  S.quote = message || null; $('#quotePending').hidden = !S.quote;
  $('#quotePendingText').textContent = S.quote ? (S.quote.text || '[图片或表情]').slice(0, 160) : '';
  if (S.quote) { go('chat'); $('#input').focus(); }
}

// ===== 聊天渲染 =====
function renderChat(keepScroll) {
  const box = $('#msgs'); const before = box.scrollHeight - box.scrollTop;
  if (!S.msgs.length) {
    box.innerHTML = `<div class="empty-chat"><span class="av" style="display:block">${avatar('him')}</span><b>${esc(hisName())}</b><span>说点什么吧，他在等你</span></div>`;
  } else {
    let html = S.hasMore ? '<button class="older" id="older">翻看更早的消息</button>' : '<div class="begin">我们的故事从这里开始</div>';
    let lastDay = '';
    for (const m of S.msgs) {
      const day = dayOf(m.ts);
      if (day !== lastDay) { html += `<div class="day">${day}</div>`; lastDay = day; }
      const who = m.role === 'me' ? 'me' : 'him';
      const parts = m.type === 'sticker' ? [] : who === 'him' ? m.text.split(/\n{2,}/).filter((p) => p.trim()) : (m.text ? [m.text] : []);
      const src = m.localImage || (m.image ? fileUrl(m.image) : '');
      html += `<div class="msg ${who}" data-message="${esc(m.id)}"><span class="av">${avatar(who)}</span><div class="col">${src ? `<img class="${m.type==='sticker'?'sticker-img':'pic'}" src="${esc(src)}" alt="${m.type==='sticker'?'表情':'图片'}" loading="lazy">` : ''}${m.quote_text ? `<div class="msg-quote">${esc(m.quote_role === 'me' ? '我' : hisName())}：${esc(m.quote_text)}</div>` : ''}${parts.map((p) => `<div class="bubble">${rich(p.trim())}</div>`).join('')}${who === 'him' && m.type !== 'sticker' && m.text?.trim() && typeof m.id === 'number' ? `<button type="button" class="voice-play" data-voice="${m.id}" aria-label="朗读这条回复">▷ 听这句</button>` : ''}${typeof m.id === 'number' ? `<div class="message-actions"><button data-quote="${m.id}">引用</button><button data-collect="${m.id}">收藏</button><button data-more="${m.id}" aria-label="消息操作">···</button></div>` : ''}<time>${hm(m.ts)}${m.src === 'backup' ? ' · 备用线路' : ''}</time></div></div>`;
    }
    if (!S.busy && S.msgs[S.msgs.length - 1].role === 'me') html += '<button class="retry" id="retry">再叫他一声</button>';
    box.innerHTML = html;
  }
  if (S.busy) box.insertAdjacentHTML('beforeend', `<div class="msg him" id="live"><span class="av">${avatar('him')}</span><div class="col"><div class="bubble typing" id="liveBubble"><i></i><i></i><i></i></div></div></div>`);
  box.scrollTop = keepScroll ? box.scrollHeight - before : box.scrollHeight;
}
function setComposer() {
  $('#send').disabled = !S.busy && !($('#input').value.trim() || S.pending || S.pendingSticker);
  $('#send').innerHTML = icon(S.busy ? 'stop' : 'send', 18, S.busy);
  $('#send').setAttribute('aria-label', S.busy ? '停止' : '发送');
  $('#topSub').textContent = S.busy ? (S.status || '正在输入…') : '在线';
}
async function loadMessages() {
  const d = await api('/api/messages?limit=60');
  const firstNew = d.messages[0]?.id ?? Infinity;
  S.msgs = [...S.msgs.filter((m) => typeof m.id === 'number' && m.id < firstNew), ...d.messages];
  if (!S.msgs.some((m) => m.id < firstNew)) S.hasMore = d.hasMore;
  return d.busy;
}
// 连接断了但他还在回：隔一会儿看一眼，回完就刷新
async function watchBusy() {
  S.busy = true; setComposer(); renderChat();
  for (;;) {
    await new Promise((r) => setTimeout(r, 2500));
    let still = true;
    try { still = await loadMessages(); } catch {}
    if (!still) break;
  }
  S.busy = false; S.status = ''; setComposer(); renderChat();
}

async function talk(body) {
  if (S.busy) return;
  S.busy = true; S.status = ''; setComposer();
  if (!body.retry) {
    if (body.text || body.image) S.msgs.push({ id: 'tmp-text', role: 'me', type: 'text', text: body.text || '', localImage: body.image || '', quote_text: body.quotePreview?.text || '', quote_role: body.quotePreview?.role || '', ts: Date.now() });
    if (body.sticker_id) S.msgs.push({ id: 'tmp-sticker', role: 'me', type: 'sticker', text: '', localImage: body.preview, ts: Date.now() });
  }
  renderChat();
  let lost = false;
  try {
    const { preview, quotePreview, ...payload } = body;
    const res = await fetch('/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) { const d = await res.json().catch(() => ({})); S.msgs = S.msgs.filter((m) => !String(m.id).startsWith('tmp-')); $('#input').value = body.text || ''; setQuote(body.quotePreview || null); S.pending = body.image || null; S.pendingSticker = S.stickers.find(s => s.id === body.sticker_id && s.owner === 'user' && s.status === 'active') || null; if (S.pending) { $('#pendingImg').src = S.pending; $('#pending').hidden = false; } renderPendingSticker(); throw new Error(d.error || '没发出去，再试一次'); }
    const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = ''; let ended = false;
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i); buf = buf.slice(i + 1);
        if (!line.trim()) continue;
        const ev = JSON.parse(line);
        if (ev.type === 'user') { S.msgs = S.msgs.filter(m => !String(m.id).startsWith('tmp-')); S.msgs.push(...(ev.messages || (ev.message ? [ev.message] : []))); }
        else if (ev.type === 'status') { S.status = ev.text; setComposer(); }
        else if (ev.type === 'delta') { const b = $('#liveBubble'); if (b) { b.classList.remove('typing'); b.textContent = ev.text; const box = $('#msgs'); box.scrollTop = box.scrollHeight; } }
        else if (ev.type === 'done') { ended = true; S.msgs.push(...(ev.messages || (ev.message ? [ev.message] : []))); }
        else if (ev.type === 'error') { ended = true; if (ev.message) S.msgs.push(ev.message); toast(ev.code === 'needs_login' ? '服务器上的 Claude 还没登录，登录后再叫他' : (ev.error || '他这次没回上来')); }
      }
    }
    lost = !ended;
  } catch (e) {
    if (e instanceof TypeError) lost = true; else toast(e.message);
  }
  S.busy = false; S.status = ''; setComposer(); renderChat();
  if (lost) { try { if (await loadMessages()) return watchBusy(); renderChat(); } catch {} }
}

// ===== 主页与日记 =====
async function renderHome() {
  if (!S.diary) { $('#homeBody').innerHTML = '<div class="empty">正在翻开…</div>'; S.diary = (await api('/api/diary')).diary; }
  const days = Math.max(1, Math.ceil((Date.now() - S.since) / 864e5));
  $('#homeBody').innerHTML = `
    <div class="card hero"><div class="corners"><i class="tl"></i><i class="tr"></i><i class="bl"></i><i class="br"></i></div>
      <span class="av" style="display:block">${avatar('him')}</span><b>Welcome back, Honey</b><span>今天也想你了</span>
      <div class="stats"><div><b>${days}</b><span>在一起的天数</span></div><div><b>${S.msgs.length ? Math.max(S.counts.messages, S.msgs.length) : S.counts.messages}</b><span>说过的话</span></div><div><b>${S.diary.length}</b><span>他的日记</span></div></div>
    </div>
    <button class="card cr-home-entry" id="homeReading"><span style="color:var(--gold)"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M12 5v15M12 5C8 2 4 3 2 4v15c4-2 7-1 10 1 3-2 6-3 10-1V4c-2-1-6-2-10 1Z"/></svg></span><span style="flex:1"><strong>我们的共读室</strong><small>翻开一本书，陪你读一段故事</small></span><span style="color:var(--gold)">›</span></button>
    <button class="card cr-home-entry" id="homeLife"><span style="color:var(--gold);font-size:28px">✉</span><span style="flex:1"><strong>我们的生活手账</strong><small>信件、书影、约定，收藏每个小日子</small></span><span style="color:var(--gold)">›</span></button>
    <div class="card"><h4>他的日记</h4>
      <button class="btn block" id="diaryWrite">让${esc(hisName())}写一篇今天的日记</button>
      <div style="margin-top:6px">${S.diary.length ? S.diary.map((d) => `<div class="entry"><b>${esc(d.title)}</b><p>${esc(d.content)}</p><time>${dayOf(d.ts)} ${hm(d.ts)}</time></div>`).join('') : '<div class="empty">还没有日记。聊几句之后，让他写下今天吧。</div>'}</div>
    </div>`;
}
async function writeDiary(btn) {
  btn.disabled = true; btn.textContent = '他正在写，要等一小会儿…';
  try { const { entry } = await api('/api/diary/write', 'POST'); S.diary.unshift(entry); toast('他写好了'); } catch (e) { toast(e.message); }
  renderHome();
}

// ===== 朋友圈 =====
async function renderMoments() {
  if (!S.moments) { $('#momentList').innerHTML = '<div class="empty">正在翻开…</div>'; S.moments = (await api('/api/moments')).moments; }
  $('#momentList').innerHTML = S.moments.length ? S.moments.map((m) => `<div class="card moment">
      <div class="moment-head"><span class="av">${avatar(m.who)}</span><div><b>${m.who === 'me' ? '我' : esc(hisName())}</b><time>${dayOf(m.ts)} ${hm(m.ts)}</time></div></div>
      ${m.text ? `<div class="moment-text">${rich(m.text)}</div>` : ''}${m.image ? `<img class="pic" src="${fileUrl(m.image)}" alt="图片" loading="lazy">` : ''}
      <div class="moment-foot"><button class="like ${m.liked ? 'on' : ''}" data-like="${m.id}">${icon('heart', 16, !!m.liked)}${m.liked ? '已喜欢' : '喜欢'}</button></div>
      ${m.comment ? `<div class="cmt"><b>${esc(hisName())}</b>：${esc(m.comment)}</div>` : (m.waiting ? `<div class="cmt">${esc(hisName())}正在看…</div>` : '')}</div>`).join('') : '<div class="empty">这里只有你们两个人。发第一条吧。</div>';
}
const putMoment = (m) => { const k = S.moments.findIndex((x) => x.id === m.id); if (k >= 0) S.moments[k] = m; else S.moments.unshift(m); };
async function postMoment() {
  const text = $('#momentText').value.trim(); const image = S.momentImg;
  if (!text && !image) return toast('写点什么，或者选张图');
  const btn = $('#momentPost'); btn.disabled = true;
  try {
    const { moment } = await api('/api/moments', 'POST', { text, image });
    $('#momentText').value = ''; S.momentImg = null; $('#momentPending').hidden = true;
    putMoment({ ...moment, waiting: true }); renderMoments();
    btn.disabled = false;
    try { putMoment((await api(`/api/moments/${moment.id}/comment`, 'POST')).moment); } catch { putMoment(moment); }
    renderMoments();
  } catch (e) { toast(e.message); btn.disabled = false; }
}
async function hisMoment(btn) {
  btn.disabled = true; btn.textContent = '他在想…';
  try { putMoment((await api('/api/moments/his', 'POST')).moment); renderMoments(); } catch (e) { toast(e.message); }
  btn.disabled = false; btn.textContent = '让他发一条';
}

// ===== 表情包 =====
let stickerTab = 'user', stickerSearch = '';
function renderPendingSticker() {
  const s = S.pendingSticker; $('#pendingSticker').hidden = !s;
  if (s) { $('#pendingStickerImg').src = fileUrl(s.image); $('#pendingStickerName').textContent = s.name; }
  setComposer();
}
function renderStickers() {
  const active = S.stickers.filter(s => s.status === 'active' && s.owner === 'user').sort((a,b)=>(b.favorite||0)-(a.favorite||0)||b.id-a.id);
  $('#emojiSt').innerHTML = active.map(s => `<button class="quick-sticker" data-stk="${s.id}" aria-label="选择 ${esc(s.name)}"><img width="58" height="58" loading="lazy" src="${fileUrl(s.image)}" alt="${esc(s.name)}"></button>`).join('') + '<button id="stkManage">打开<br>表情包盒子</button>';
  const rows = S.stickers.filter(s => (stickerTab === 'archived' ? s.status === 'archived' : s.status === 'active' && s.owner === stickerTab) && `${s.name} ${s.description} ${(s.emotion_tags || []).join(' ')}`.includes(stickerSearch)).sort((a,b)=>(b.favorite||0)-(a.favorite||0)||b.id-a.id);
  $('#stkCount').textContent = `${rows.length} 张`;
  $('#stkList').innerHTML = rows.length ? rows.map(s => `<div class="st-library-item"><button class="st-pick" data-stk="${s.id}" aria-label="${s.owner==='user'?'选择':'查看'} ${esc(s.name)}"><img width="76" height="76" loading="lazy" src="${fileUrl(s.image)}" alt="${esc(s.name)}"></button><div class="st-title">${esc(s.name)}</div><div class="st-actions">${s.status==='archived'?`<button data-st-restore="${s.id}">放回来</button>`:`<button data-st-favorite="${s.id}" class="${s.favorite?'on':''}" aria-label="${s.favorite?'取消常用':'设为常用'}">${s.favorite?'♥':'♡'}</button><button data-st-edit="${s.id}">编辑</button><button data-st-archive="${s.id}">收起</button>`}</div></div>`).join('') : '<div class="st-empty">这里还没有表情。<br>放几张动图进来，让心情也会动。</div>';
  document.querySelectorAll('[data-st-tab]').forEach(b=>b.classList.toggle('on',b.dataset.stTab===stickerTab));
}
function sendSticker(id) {
  const s = S.stickers.find(s => String(s.id) === String(id) && s.status === 'active');
  if (!s) return;
  if (s.owner !== 'user') return editSticker(s);
  if (S.busy) return toast('等他回完这句再选');
  S.pendingSticker = s; S.pending = null; $('#pending').hidden = true; $('#emoji').hidden = true; go('chat'); renderPendingSticker();
  toast('已放进待发送区，可以再写一句话');
}
function openStickerEditor(s) {
  S.stkEditing = s?.id || null; S.stkImg = null;
  $('#stkEditor').hidden = false; $('#stkName').value=s?.name||''; $('#stkDescription').value=s?.description||'';
  $('#stkTags').value=(s?.emotion_tags||[]).join('、'); $('#stkOwner').value=s?.owner||(stickerTab==='assistant'?'assistant':'user');
  $('#stkDrop').innerHTML=s?`<img width="92" height="92" src="${fileUrl(s.image)}" alt="预览">`:'<span>＋ 选择 GIF / WebP 动图</span>';
  $('#stkDrop').disabled=!!s; $('#stkEditorTitle').textContent=s?'给这张表情补上心情':'放一张心情进来';
  $('#stkFormError').textContent=''; updateStickerSave(); $('#stkEditor').scrollIntoView({block:'start'});
}
const editSticker = s => openStickerEditor(s);
function updateStickerSave() {
  const tags=$('#stkTags').value.split(/[、,，\s]+/).filter(Boolean);
  $('#stkAdd').disabled=!(($('#stkName').value.trim()) && $('#stkDescription').value.trim() && tags.length>=1 && tags.length<=5 && (S.stkImg || S.stkEditing));
}
async function saveSticker() {
  const btn=$('#stkAdd');btn.disabled=true;btn.textContent='正在收好…';
  try {
    const body={name:$('#stkName').value,description:$('#stkDescription').value,emotion_tags:$('#stkTags').value.split(/[、,，\s]+/).filter(Boolean),owner:$('#stkOwner').value};
    if(!S.stkEditing)body.image=S.stkImg;
    const result=await api(S.stkEditing?`/api/stickers/${S.stkEditing}`:'/api/stickers',S.stkEditing?'PUT':'POST',body);
    const idx=S.stickers.findIndex(s=>s.id===result.sticker.id);if(idx>=0)S.stickers[idx]=result.sticker;else S.stickers.unshift(result.sticker);
    stickerTab=result.sticker.owner;S.stkImg=null;S.stkEditing=null;$('#stkEditor').hidden=true;renderStickers();toast('表情已收好');
  } catch(e){$('#stkFormError').textContent=e.message;updateStickerSave();}finally{btn.textContent='收进表情盒';}
}
function wireStickers() {
  $('#openStickers').onclick=()=>go('stickers');
  $('#pendingStickerX').onclick=()=>{S.pendingSticker=null;renderPendingSticker();};
  $('#stickerNew').onclick=()=>openStickerEditor();
  $('#stkCancel').onclick=()=>{$('#stkEditor').hidden=true;S.stkImg=null;S.stkEditing=null;};
  $('#stkDrop').onclick=()=>$('#fileStk').click();
  $('#fileStk').addEventListener('change',async()=>{
    const file=$('#fileStk').files[0];$('#fileStk').value='';if(!file)return;
    if(!['image/gif','image/webp'].includes(file.type)||file.size>6*1024*1024)return toast('请选择 6 MB 以内的 GIF / WebP');
    const reader=new FileReader();reader.onload=()=>{S.stkImg=reader.result;$('#stkDrop').innerHTML=`<img width="92" height="92" src="${S.stkImg}" alt="动图预览">`;updateStickerSave();};reader.onerror=()=>toast('文件读取失败');reader.readAsDataURL(file);
  });
  for(const id of ['stkName','stkDescription','stkTags'])$('#'+id).addEventListener('input',updateStickerSave);
  $('#stkAdd').onclick=saveSticker;
  $('#stickerSearch').oninput=e=>{stickerSearch=e.target.value;renderStickers();};
  document.querySelectorAll('[data-st-tab]').forEach(b=>b.onclick=()=>{stickerTab=b.dataset.stTab;renderStickers();});
  $('#stkList').onclick=async e=>{
    const b=e.target.closest('button');if(!b)return;const id=Number(b.dataset.stEdit||b.dataset.stArchive||b.dataset.stFavorite||b.dataset.stRestore||b.dataset.stk);const s=S.stickers.find(s=>s.id===id);if(!s)return;
    if(b.dataset.stk)return sendSticker(id);if(b.dataset.stEdit)return editSticker(s);
    b.disabled=true;
    try {const body=b.dataset.stFavorite?{favorite:!s.favorite}:{status:b.dataset.stRestore?'active':'archived'};const result=await api(`/api/stickers/${id}`,'PUT',body);S.stickers[S.stickers.findIndex(s=>s.id===id)]=result.sticker;if(S.pendingSticker?.id===id&&result.sticker.status==='archived'){S.pendingSticker=null;renderPendingSticker();}renderStickers();}catch(err){toast(err.message);b.disabled=false;}
  };
}


// ===== 设置 =====
function applyState() {
  $('#topAv').innerHTML = avatar('him'); $('#topName').textContent = hisName(); $('#coverSub').textContent = hisName() + '在等你';
  $('#msgs').className = 'msgs bg-' + (S.profile.bg || 'damask');
  $('#setMeAv').innerHTML = avatar('me'); $('#setHimAv').innerHTML = avatar('him'); $('#setBunny').innerHTML = Bunny.avatar();
  $('#swatches').innerHTML = BGS.map(([k, label, css]) => `<button class="swatch ${S.profile.bg === k ? 'on' : ''}" data-bg="${k}"><i style="background:${css}"></i>${label}</button>`).join('');
  $('#models').innerHTML = MODELS.map(([k, label]) => `<button class="chip ${(S.profile.model || 'default') === k ? 'on' : ''}" data-model="${k}">${label}</button>`).join('');
  $('#claudeNote').textContent = S.claude.lastError === 'needs_login' ? '服务器上的 Claude 还没有登录订阅账号，登录后他才能回你。' : (S.claude.running ? '他醒着，用的是你的 Claude 订阅。' : '他会在你发下一句话时醒来，用的是你的 Claude 订阅。');
  $('#claudeNote').className = 'note' + (S.claude.lastError === 'needs_login' ? ' err' : '');
  $('#bkMemory').classList.toggle('on', !!S.backup.memory); $('#bkChat').classList.toggle('on', !!S.backup.chat);
  $('#storeInfo').textContent = `聊天记录、记忆、日记和朋友圈都保存在你自己的服务器上，每天自动备份一份。目前共 ${S.counts.messages} 条消息。`;
  $('#memNote').textContent = S.counts.pending > 2 ? `还有 ${S.counts.pending} 条新对话没整理进记忆，满 60 条会自动整理。` : '最近的事他都还记着。';
}
function fillForms() {
  fillVoice();
  $('#emotionEnabled').checked = !!S.profile.emotionEnabled; $('#emotionRules').value = S.profile.emotionRules || '';
  $('#hisName').value = hisName(); $('#persona').value = S.profile.persona || ''; $('#memText').value = S.memory || '';
  $('#bkUrl').value = S.backup.baseUrl || ''; $('#bkModel').value = S.backup.model || ''; $('#bkKey').value = '';
  $('#bkKey').placeholder = S.backup.hasKey ? '已保存，留空则不改' : 'sk-...';
}
async function refreshState() { const st = await api('/api/state'); Object.assign(S, { lifePrefs: st.lifePrefs || {}, voice: st.voice || {}, profile: st.profile, memory: st.memory, backup: st.backup, counts: st.counts, since: st.since, claude: st.claude }); applyState(); return st; }
async function saveProfile(patch, quiet) { try { S.profile = (await api('/api/profile', 'PUT', patch)).profile; applyState(); renderChat(); if (!quiet) toast('保存好了'); } catch (e) { toast(e.message); } }

function go(page) {
  if (S.page === 'candy' && page !== 'candy') window.CandyJar?.leave();
  if (page === 'candy') window.CandyJar?.open();
  if (S.page === 'reading' && page !== 'reading') window.Coread?.leave();
  if (page === 'reading') window.Coread?.open();
  if (page === 'stickers') renderStickers();
  if (page === 'life' || page === 'history') window.Life?.open(page);
  S.page = page;
  document.querySelectorAll('.page').forEach((p) => p.classList.toggle('show', p.dataset.page === page));
  document.querySelectorAll('#nav button').forEach((b) => b.classList.toggle('on', b.dataset.go === page));
  if (page === 'home') renderHome().catch((e) => toast(e.message));
  if (page === 'moments') renderMoments().catch((e) => toast(e.message));
  if (page === 'settings' || page === 'memory') refreshState().then(fillForms).catch(() => fillForms());
  if (page === 'chat') { const box = $('#msgs'); box.scrollTop = box.scrollHeight; }
}

// ===== 事件 =====
function wire() {
  window.CandyJar?.init({ api, toast, go, draft: text => { go('chat'); $('#input').value = text; setComposer(); $('#input').focus(); } });
  $('#openCandy').onclick = () => go('candy');
  window.Life?.init({ api, toast, go, quote: setQuote, draft: text => { go('chat'); $('#input').value = text; setComposer(); $('#input').focus(); }, prefs: p => { S.lifePrefs = p; }, messagesChanged: async retry => { S.msgs = []; await loadMessages(); renderChat(); if (retry) talk({ retry: true }); }, smallNote: text => { go('chat'); talk({ text, smallNote: true }); } });
  $('#quoteCancel').onclick = () => setQuote(null);
  $('#openHistory').onclick = () => go('history'); $('#openLife').onclick = () => go('life');
  $('#openReading').onclick = () => go('reading');
  $('#homeBody').addEventListener('click', (e) => { if (e.target.closest('#homeReading')) go('reading'); if (e.target.closest('#homeLife')) go('life'); });
  const navLabels = { home: ['home', '主页'], memory: ['star', '记忆'], moments: ['cam', '朋友圈'], settings: ['set', '设置'] };
  document.querySelectorAll('#nav button').forEach((b) => { const k = b.dataset.go; b.innerHTML = k === 'chat' ? icon('heart', 24, true) : icon(navLabels[k][0], 22) + navLabels[k][1]; b.onclick = () => go(k); });
  $('#toolImg').innerHTML = icon('img'); $('#toolEmoji').innerHTML = icon('smile');
  $('#emojiGrid').innerHTML = EMOJIS.map((e) => `<button>${e}</button>`).join('');

  const input = $('#input');
  input.addEventListener('input', setComposer);
  const grow = () => { input.style.height = '34px'; input.style.height = Math.min(110, input.scrollHeight) + 'px'; };
  const submit = () => {
    if (S.busy) { api('/api/chat/stop', 'POST').catch(() => {}); return; }
    const text = input.value.trim(); const image = S.pending;
    if (S.lifePrefs.blocked) { go('life'); window.Life?.section('rooms'); toast('模拟拉黑中，可以写小纸条或解除拉黑'); return; }
    const quote = S.quote;
    const sticker = S.pendingSticker;
    if (!text && !image && !sticker) return;
    input.value = ''; grow(); S.pending = null; $('#pending').hidden = true; $('#emoji').hidden = true;
    S.pendingSticker = null; renderPendingSticker(); setQuote(null);
    talk({ quoteId: quote?.id, quotePreview: quote, text: text || (image ? '看看这张图' : ''), image, sticker_id: sticker?.id, preview: sticker ? fileUrl(sticker.image) : '' });
  };
  input.addEventListener('input', grow);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); if (!S.busy) submit(); } });
  $('#send').onclick = submit;
  $('#toolImg').onclick = () => $('#fileChat').click();
  $('#toolEmoji').onclick = () => { const e = $('#emoji'); e.hidden = !e.hidden; $('#toolEmoji').classList.toggle('on', !e.hidden); };
  $('#emojiGrid').onclick = (e) => { if (e.target.tagName === 'BUTTON') { input.value += e.target.textContent; input.focus(); } };
  $('#emojiSt').onclick = (e) => { if (e.target.closest('[data-stk]')) sendSticker(e.target.closest('[data-stk]').dataset.stk); else if (e.target.closest('#stkManage')) { $('#emoji').hidden = true; go('stickers'); } };
  $('#pendingX').onclick = () => { S.pending = null; $('#pending').hidden = true; setComposer(); };
  pick($('#fileChat'), 1400, 600000, (d) => { S.pendingSticker = null; renderPendingSticker(); S.pending = d; setComposer(); $('#pendingImg').src = d; $('#pending').hidden = false; });

  $('#msgs').onclick = async (e) => {
    const quoteBtn = e.target.closest('[data-quote]'), collectBtn = e.target.closest('[data-collect]'), moreBtn = e.target.closest('[data-more]');
    if (quoteBtn) return setQuote(S.msgs.find(m => m.id === Number(quoteBtn.dataset.quote)));
    if (collectBtn) return window.Life?.collect([Number(collectBtn.dataset.collect)]);
    if (moreBtn) return window.Life?.messageMenu(S.msgs.find(m => m.id === Number(moreBtn.dataset.more)));
    const voiceBtn = e.target.closest('[data-voice]');
    if (voiceBtn) { if (!S.voice.ready) { go('settings'); $('#voiceSettings').scrollIntoView({ block: 'center' }); $('#voiceKey').focus(); toast('先保存 ElevenLabs 密钥，再听他的声音'); return; } return playVoice('/api/voice/messages/' + voiceBtn.dataset.voice, voiceBtn, '听听这句话'); }
    if (e.target.id === 'retry') talk({ retry: true });
    if (e.target.id === 'older') {
      e.target.disabled = true;
      try { const d = await api(`/api/messages?limit=60&before=${S.msgs.find((m) => typeof m.id === 'number').id}`); S.msgs = [...d.messages, ...S.msgs]; S.hasMore = d.hasMore; renderChat(true); } catch (err) { toast(err.message); }
    }
  };
  $('#homeBody').onclick = (e) => { if (e.target.id === 'diaryWrite') writeDiary(e.target); };

  $('#memSave').onclick = async () => { try { await api('/api/memory', 'PUT', { text: $('#memText').value }); S.memory = $('#memText').value.trim(); toast('记住了'); } catch (e) { toast(e.message); } };
  $('#memFold').onclick = async (e) => {
    const btn = e.currentTarget; btn.disabled = true; btn.textContent = '正在整理…';
    try { const r = await api('/api/memory/fold', 'POST'); if (r.memory) { S.memory = r.memory; $('#memText').value = r.memory; toast('记好了'); } else toast('最近的事他都还记着，暂时不用整理'); await refreshState(); } catch (err) { toast(err.message); }
    btn.disabled = false; btn.textContent = '现在整理一次';
  };

  $('#momentPick').onclick = () => $('#fileMoment').click();
  pick($('#fileMoment'), 1400, 600000, (d) => { S.momentImg = d; $('#momentImg').src = d; $('#momentPending').hidden = false; });
  $('#momentX').onclick = () => { S.momentImg = null; $('#momentPending').hidden = true; };
  $('#momentPost').onclick = postMoment;
  $('#momentHis').onclick = (e) => hisMoment(e.currentTarget);
  $('#momentList').onclick = async (e) => { const b = e.target.closest('[data-like]'); if (!b) return; try { putMoment((await api(`/api/moments/${b.dataset.like}/like`, 'POST')).moment); renderMoments(); } catch (err) { toast(err.message); } };

  $('#pickMe').onclick = () => $('#fileMe').click();
  $('#pickHim').onclick = () => $('#fileHim').click();
  pick($('#fileMe'), 240, 80000, (d) => saveProfile({ myAv: d }));
  pick($('#fileHim'), 240, 80000, (d) => saveProfile({ hisAv: d }));
  $('#resetHim').onclick = () => saveProfile({ hisAv: '' });
  $('#swatches').onclick = (e) => { const b = e.target.closest('[data-bg]'); if (b) saveProfile({ bg: b.dataset.bg }, true); };
  $('#models').onclick = (e) => { const b = e.target.closest('[data-model]'); if (b) saveProfile({ model: b.dataset.model }, true); };
  $('#saveSettings').onclick = async () => { await saveProfile({ hisName: $('#hisName').value, persona: $('#persona').value, emotionEnabled: $('#emotionEnabled').checked, emotionRules: $('#emotionRules').value }); go('chat'); };

  wireBackupModels();
  $('#bkMemory').onclick = (e) => e.currentTarget.classList.toggle('on');
  $('#bkChat').onclick = (e) => e.currentTarget.classList.toggle('on');
  const saveBackup = async () => { await api('/api/backup', 'PUT', { baseUrl: $('#bkUrl').value, model: $('#bkModel').value, key: $('#bkKey').value, memory: $('#bkMemory').classList.contains('on'), chat: $('#bkChat').classList.contains('on') }); await refreshState(); fillForms(); };
  $('#bkSave').onclick = async () => { try { await saveBackup(); $('#bkNote').textContent = ''; toast('线路保存好了'); } catch (e) { toast(e.message); } };
  $('#bkTest').onclick = async () => {
    const note = $('#bkNote'); note.className = 'note'; note.textContent = '测试中…';
    try { await saveBackup(); const r = await api('/api/backup/test', 'POST'); note.className = 'note ok'; note.textContent = '连上了，它回了：' + r.text; } catch (e) { note.className = 'note err'; note.textContent = '没连上：' + e.message; }
  };

  wireVoice();
  wireStickers();
}

// ===== 备用线路模型选择 =====
function wireBackupModels() {
  const url = $('#bkUrl'), key = $('#bkKey'), model = $('#bkModel');
  const button = $('#bkFetchModels'), picker = $('#bkModelPicker'), search = $('#bkModelSearch'), select = $('#bkSelect'), note = $('#bkModelsNote');
  let models = [], revision = 0, timer;
  const base = value => value.trim().replace(/\/+$/, '');
  const signature = () => url.value.trim() + '\n' + key.value.trim();
  const ready = () => base(url.value) && (key.value.trim() || (S.backup.hasKey && base(url.value) === base(S.backup.baseUrl || '')));
  const render = () => {
    const term = search.value.trim().toLowerCase();
    const filtered = models.filter(m => (m.id + ' ' + m.name).toLowerCase().includes(term));
    select.replaceChildren(new Option(filtered.length ? '请选择模型' : '没有匹配的模型，换个词试试', ''));
    // Keep long catalogs usable on mobile; search still covers the complete list.
    const shown = filtered.slice(0, 300);
    const current = models.find(m => m.id === model.value.trim());
    if (current && !shown.some(m => m.id === current.id)) shown.unshift(current);
    for (const m of shown) select.add(new Option(m.name === m.id ? m.id : m.name + ' · ' + m.id, m.id));
    select.value = current ? current.id : '';
    note.className = 'note ok';
    note.textContent = '已获取 ' + models.length + ' 个模型' + (filtered.length > 300 ? '，先显示 300 个，可以搜索缩小范围。' : '，请选择后保存线路。');
  };
  const load = async () => {
    clearTimeout(timer);
    if (!ready()) { note.className = 'note err'; note.textContent = '先填好 API 地址和对应的 Key，再获取模型。'; return; }
    const ticket = ++revision, original = signature();
    button.disabled = true; button.textContent = '获取中…'; note.className = 'note'; note.textContent = '正在获取可用模型…';
    try {
      const result = await api('/api/backup/models', 'POST', { baseUrl: url.value.trim(), key: key.value.trim() });
      if (ticket !== revision || original !== signature()) return;
      models = result.models; search.value = ''; picker.hidden = false; render();
    } catch (e) {
      if (ticket !== revision || original !== signature()) return;
      models = []; picker.hidden = true; note.className = 'note err'; note.textContent = e.message + '。仍可手动填写模型名称。';
    } finally {
      if (ticket === revision) { button.disabled = false; button.textContent = '获取模型'; }
    }
  };
  const invalidate = () => { clearTimeout(timer); ++revision; models = []; picker.hidden = true; search.value = ''; button.disabled = false; button.textContent = '获取模型'; note.className = 'note'; note.textContent = '填好地址和 Key 后会自动获取，也可以点按钮重试。'; };
  for (const input of [url, key]) {
    input.addEventListener('input', invalidate);
    input.addEventListener('change', () => { clearTimeout(timer); if (ready()) timer = setTimeout(load, 300); });
  }
  button.onclick = load;
  search.oninput = render;
  select.onchange = () => { if (select.value) model.value = select.value; };
  model.addEventListener('input', () => { select.value = models.some(m => m.id === model.value.trim()) ? model.value.trim() : ''; });
}

// ===== 他的声音 =====
let voiceBusy = false, voiceToken = 0;
function fillVoice() {
  $('#voiceId').value = S.voice.voiceId || 'e5WNhrdI30aXpS2RSGm1';
  $('#voiceLimit').value = S.voice.dailyLimit || 3000;
  $('#voiceKey').value = '';
  $('#voiceKey').placeholder = S.voice.hasKey ? '已保存，留空保留' : '在这里粘贴密钥';
  $('#voiceUsage').textContent = `今天已预留 ${S.voice.usedToday || 0} / ${S.voice.dailyLimit || 3000} 字（按 UTC 每日重置，服务商额度另计）。超时或失败也保留字数，避免重复请求消耗额度。`;
}
async function saveVoice() {
  const keyInput = $('#voiceKey');
  const r = await api('/api/voice', 'PUT', { key: keyInput.value, voiceId: $('#voiceId').value.trim(), dailyLimit: Number($('#voiceLimit').value) });
  S.voice = r.voice; fillVoice();
}
async function playVoice(endpoint, btn, title) {
  if (voiceBusy) { toast('正在准备语音，请等一会儿'); return; }
  voiceBusy = true; const token = ++voiceToken;
  const old = btn.textContent; btn.disabled = true; btn.textContent = '准备声音…';
  const player = $('#voicePlayer'); player.pause();
  try {
    const result = await api(endpoint, 'POST'); S.voice = result.voice; fillVoice();
    if (token !== voiceToken) return;
    $('#voiceTitle').textContent = title; $('#voicePanel').hidden = false;
    player.src = fileUrl(result.file);
    try { await player.play(); } catch { toast('音频准备好了，点击播放器的播放键'); }
  } catch (e) { toast(e.message); $('#voiceNote').textContent = e.message; $('#voiceNote').className = 'note err'; }
  finally { voiceBusy = false; btn.disabled = false; btn.textContent = old; }
}
function wireVoice() {
  $('#voiceClose').onclick = () => { ++voiceToken; $('#voicePlayer').pause(); $('#voicePlayer').removeAttribute('src'); $('#voicePlayer').load(); $('#voicePanel').hidden = true; };
  $('#voicePlayer').onerror = () => toast('音频没能播放，请检查网络后再试');
  $('#voiceSave').onclick = async (e) => { const b = e.currentTarget; b.disabled = true; try { await saveVoice(); $('#voiceNote').className = 'note ok'; $('#voiceNote').textContent = '声音设置保存好了'; } catch (err) { $('#voiceNote').className = 'note err'; $('#voiceNote').textContent = err.message; } finally { b.disabled = false; } };
  $('#voiceTest').onclick = async (e) => { const b = e.currentTarget, n = $('#voiceNote'); b.disabled = true; n.className = 'note'; n.textContent = '正在检查音色…'; try { const r = await api('/api/voice/test', 'POST'); S.voice = r.voice; n.className = 'note ok'; n.textContent = '已连接：' + r.name + '。可以试听了。'; fillVoice(); } catch (err) { n.className = 'note err'; n.textContent = err.message; } finally { b.disabled = false; } };
  $('#voicePreview').onclick = (e) => { if (!S.voice.ready) { toast('先保存声音设置'); return; } go('chat'); playVoice('/api/voice/preview', e.currentTarget, '声音初见 · 试听'); };
  $('#voiceClear').onclick = async (e) => { const b = e.currentTarget; b.disabled = true; try { const r = await api('/api/voice', 'PUT', { clearKey: true }); S.voice = r.voice; fillVoice(); $('#voiceNote').className = 'note'; $('#voiceNote').textContent = '密钥已移除，重新填入后可以继续生成语音。'; } catch (err) { toast(err.message); } finally { b.disabled = false; } };
}

// ===== 进门 =====
async function boot() {
  const [st, , stickers] = await Promise.all([refreshState(), loadMessages(), api('/api/stickers')]);
  S.stickers = stickers.stickers; fillForms(); renderStickers(); setComposer(); renderChat();
  $('#gate').hidden = true;
  const btn = $('#enter'); btn.disabled = false; btn.textContent = '进入';
  btn.onclick = () => { $('#cover').classList.add('gone'); const box = $('#msgs'); box.scrollTop = box.scrollHeight; };
  $('#coverFoot').textContent = S.counts.messages ? `已经说了 ${S.counts.messages} 句话` : 'est. ' + new Date().getFullYear();
  window.Life?.start();
  if (st.busy) watchBusy();
}
async function gate() {
  const btn = $('#enter'); const note = $('#gateNote');
  let auth;
  try { auth = await api('/api/auth'); } catch { $('#coverFoot').textContent = '连不上家里的服务器，检查一下网络后刷新'; return; }
  if (auth.authed) return boot();
  const setup = !auth.claimed;
  $('#gate').hidden = false; $('#code2').hidden = !setup;
  $('#code').placeholder = setup ? '设一个进门口令（至少 4 位）' : '进门口令';
  $('#coverFoot').textContent = setup ? '第一次来：这个口令只有你知道，以后凭它进门' : '';
  btn.disabled = false; btn.textContent = setup ? '设好了' : '进入';
  const submit = async (e) => {
    e?.preventDefault();
    const code = $('#code').value;
    if (code.length < 4) { note.textContent = '口令至少 4 位'; return; }
    if (setup && code !== $('#code2').value) { note.textContent = '两次输入的不一样'; return; }
    btn.disabled = true; note.textContent = '';
    try { await api(setup ? '/api/auth/setup' : '/api/auth/login', 'POST', { code }); $('#code').value = ''; $('#code2').value = ''; btn.textContent = '稍等'; await boot(); $('#enter').click(); }
    catch (err) { note.textContent = err.message; btn.disabled = false; }
  };
  btn.onclick = submit; $('#gate').onsubmit = submit;
}

$('#coverCameo').innerHTML = Bunny.cover();
wire(); setComposer(); applyState(); renderChat();
gate();
})();

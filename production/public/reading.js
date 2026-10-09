(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const bookIcon = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M12 5v15M12 5C8 2 4 3 2 4v15c4-2 7-1 10 1 3-2 6-3 10-1V4c-2-1-6-2-10 1Z"/></svg>';
  let root, book = null, books = [], tab = 'read', archived = false, filter = '', selected = '', saveTimer, saveQueue = Promise.resolve(), font = 17, pending = false;
  const drafts = new Map();
  try { font = Math.min(23, Math.max(15, Number(localStorage.getItem('cr-font')) || 17)); } catch {}
  async function api(path, method = 'GET', body) {
    const res = await fetch('/api/reading/' + path, { method, headers: method === 'GET' ? {} : {'content-type':'application/json'}, body: method === 'GET' ? undefined : JSON.stringify(body) });
    const data = await res.json(); if (!res.ok) throw new Error(data.error || '保存失败，请重试'); return data;
  }
  const showError = e => { const t = $('#toast'); if (t) { t.textContent = e.message; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 4000); } };
  const pct = b => Math.min(100, Math.round(((b.chapter + b.offset) / (b.count || b.chapters.length)) * 100));
  async function library() {
    await flush(); book = null; selected = ''; $('.page[data-page="reading"]').classList.remove('cr-in-book');
    root.innerHTML = '<div class="empty">正在打开书房…</div>';
    try { books = (await api('books' + (archived ? '?archived=1' : ''))).books; renderLibrary(); }
    catch (e) { root.innerHTML = '<div class="cr-empty"><h4>书房暂时没打开</h4><p>' + esc(e.message) + '</p><button class="btn" data-action="retry">再试一次</button></div>'; }
  }
  function renderLibrary() {
    root.innerHTML = `<div class="cr-library"><div class="card cr-intro"><div class="cr-eyebrow">A little room for two</div><h4>把故事，读给彼此听</h4><p>一人翻页，一人陪伴。<br>把喜欢的句子留下，让书里的世界慢慢变成我们的回忆。</p><div class="row"><button class="btn primary" data-action="import">＋ 放一本书进来</button></div></div><div class="cr-library-bar"><input class="field" id="crSearch" placeholder="找一本书…" aria-label="搜索书名或作者" value="${esc(filter)}"><span class="note">${archived ? '已收起' : '我们的书架'} · ${books.length}</span></div><div id="crBooks"></div><button class="cr-bottom-link" data-action="archive-list">${archived ? '返回我们的书架' : '看看收起的书'}</button></div>`;
    renderBooks();
  }
  function renderBooks() {
    const visible = books.filter(b => (b.title + b.author).toLowerCase().includes(filter.toLowerCase()));
    $('#crBooks').innerHTML = visible.length ? `<div class="cr-book-grid">${visible.map(b => `<button class="cr-book" data-book="${b.id}"><span class="cr-cover"><span class="cr-eyebrow">Notre bibliothèque</span><b>${esc(b.title)}</b><small>${esc(b.author || '等待一起翻开')}</small></span><span class="cr-book-meta">${b.read_at ? '读到 ' + pct(b) + '%' : '还未翻开'} · ${b.notes} 条摘记<span class="cr-progress"><i style="width:${pct(b)}%"></i></span></span></button>`).join('')}</div>` : `<div class="cr-empty">${bookIcon}<h4>${filter ? '没有找到这本书' : archived ? '没有收起的书' : '书架还空着'}</h4><p>${filter ? '换个书名或作者试试。' : '从一本喜欢的书开始。<br>支持 TXT 和未加密的文字版 EPUB。'}</p>${!filter && !archived ? '<button class="btn" data-action="import">导入第一本书</button>' : ''}</div>`;
  }
  async function openBook(id) {
    await flush(); root.innerHTML = '<div class="empty">正在翻开…</div>';
    try { book = (await api('books/' + id)).book; tab = 'read'; selected = ''; renderReader(); saveProgress(); }
    catch(e) { showError(e); library(); }
  }
  function textHtml(text) {
    const quotes = book.notes.filter(n => n.chapter === book.chapter && n.quote).map(n => n.quote);
    return text.split(/\n+/).filter(Boolean).map(p => {
      const matches = quotes.filter(q => p.includes(q)).sort((a,b) => b.length-a.length);
      let html = ''; let offset = 0;
      while (offset < p.length) {
        let at = p.length, chosen = '';
        for (const q of matches) { const i = p.indexOf(q, offset); if (i >= 0 && i < at) { at = i; chosen = q; } }
        html += esc(p.slice(offset, at)); if (!chosen) break;
        html += '<mark>' + esc(chosen) + '</mark>'; offset = at + chosen.length;
      }
      return '<p>' + html + '</p>';
    }).join('');
  }
  function renderReader() {
    $('.page[data-page="reading"]').classList.add('cr-in-book');
    root.innerHTML = `<div class="cr-reader"><div class="cr-reader-head"><div class="cr-reader-title"><button class="cr-mini" data-action="shelf">‹ 书架</button><b>${esc(book.title)}</b><button class="cr-mini" data-action="options" aria-label="书籍选项">•••</button></div><div class="cr-reader-tools"><select id="crChapter" aria-label="章节目录">${book.chapters.map((c,i) => `<option value="${i}" ${i===book.chapter?'selected':''}>${esc(c.title)}</option>`).join('')}</select><button class="cr-mini" data-action="smaller" aria-label="减小字体">A−</button><button class="cr-mini" data-action="larger" aria-label="增大字体">A＋</button></div></div><div class="cr-tabs"><button data-tab="read" class="${tab==='read'?'on':''}">正文</button><button data-tab="notes" class="${tab==='notes'?'on':''}">摘记 · ${book.notes.length}</button><button data-tab="talk" class="${tab==='talk'?'on':''}">一起聊</button></div><div class="cr-content" id="crContent"></div><div class="cr-reader-foot"><button data-action="prev" ${book.chapter===0?'disabled':''}>‹ 上一章</button><span id="crPosition">${book.chapter+1} / ${book.chapters.length} · ${pct(book)}%</span><button data-action="note">＋ 摘记</button><button data-action="next" ${book.chapter===book.chapters.length-1?'disabled':''}>下一章 ›</button></div></div>`;
    renderContent();
  }
  function draftKey() { return `${book.id}:${book.chapter}`; }
  function rememberDraft() { const input = $('#crQuestion'); if (book && input) drafts.set(draftKey(), input.value); }
  function renderContent() {
    const box = $('#crContent'), chapter = book.chapters[book.chapter];
    if (tab === 'read') {
      box.innerHTML = `<article class="cr-article" id="crArticle" style="--cr-font:${font}px"><div class="cr-eyebrow" style="text-align:center">${esc(book.author || 'Our reading time')}</div><h3>${esc(chapter.title)}</h3>${textHtml(chapter.text)}<div class="cr-chapter-end">◇ ◇ ◇</div></article>`;
      requestAnimationFrame(() => { if (box.isConnected) box.scrollTop = book.offset * Math.max(0, box.scrollHeight - box.clientHeight); });
      box.onscroll = () => { book.offset = box.scrollTop / Math.max(1,box.scrollHeight - box.clientHeight); $('#crPosition').textContent = `${book.chapter+1} / ${book.chapters.length} · ${pct(book)}%`; clearTimeout(saveTimer); saveTimer = setTimeout(saveProgress, 650); };
    } else if (tab === 'notes') {
      box.innerHTML = book.notes.length ? book.notes.map(n => `<div class="card cr-note"><small>${esc(book.chapters[n.chapter]?.title)} · ${new Date(n.ts).toLocaleDateString('zh-CN')}</small>${n.quote ? '<blockquote>'+esc(n.quote)+'</blockquote>':''}<p>${esc(n.text || '把这句话，留在这里。')}</p><button class="cr-mini" data-note-chapter="${n.chapter}">回到这一章 ›</button></div>`).join('') : '<div class="cr-empty"><h4>留住触动你的那一句</h4><p>在正文中长按选中文字，再点底部“＋ 摘记”。<br>也可以直接记录这一章的想法。</p></div>';
      box.onscroll = null; box.scrollTop = 0;
    } else {
      const chat = book.chat.filter(m => m.chapter === book.chapter);
      const name = $('#topName')?.textContent || '哥哥';
      box.innerHTML = `<div class="cr-talk-hint">围绕「${esc(chapter.title)}」聊一聊。回复会结合本章文字和你选中的摘录；模型暂时不可用时，仍然可以阅读和记笔记。</div>${chat.map(m=>`<div class="cr-talk-msg ${m.role==='him'?'him':''}"><b>${m.role==='him'?esc(name):'我'}</b>${esc(m.text)}</div>`).join('')}<div class="cr-talk-form"><textarea class="field" id="crQuestion" placeholder="这段让我想到……你觉得呢？" ${pending?'disabled':''}>${esc(drafts.get(draftKey()) || '')}</textarea><div class="row"><button class="chip" data-prompt="这一章最打动你的地方是什么？">聊聊这一章</button><button class="chip" data-prompt="帮我梳理这一章的内容，不剧透后面的情节。">整理本章</button></div><div class="row end"><button class="btn primary" data-action="ask" ${pending?'disabled':''}>${pending?'他正在读…':'和他聊聊'}</button></div><div class="cr-error" id="crTalkError" role="status"></div></div>`;
      box.onscroll = null; box.scrollTop = 0;
    }
  }
  function saveProgress() {
    clearTimeout(saveTimer); if (!book) return saveQueue;
    const id = book.id, body = {chapter:book.chapter, offset:book.offset};
    saveQueue = saveQueue.catch(()=>{}).then(()=>api(`books/${id}/progress`,'PUT',body));
    saveQueue.catch(showError); return saveQueue;
  }
  async function flush() { clearTimeout(saveTimer); rememberDraft(); if (book) await saveProgress().catch(()=>{}); }
  async function changeChapter(n) { if(pending) return; await flush(); book.chapter = n; book.offset = 0; selected = ''; tab = 'read'; renderReader(); saveProgress(); }
  function dialog(html) { root.insertAdjacentHTML('beforeend', `<div class="cr-dialog"><div class="cr-dialog-box">${html}</div></div>`); }
  function closeDialog() { root.querySelector('.cr-dialog')?.remove(); }
  function importer() {
    dialog(`<h3>放一本书进来</h3><p class="note">把你想一起读的故事，放到我们的书架。文字版 EPUB 不保留插图和原书排版。</p><label class="cr-file-label">选择 TXT / EPUB（最多 6 MB）<input type="file" id="crFile" accept=".txt,.epub"></label><label class="label" for="crImportTitle">书名</label><input class="field" id="crImportTitle" placeholder="留空时使用文件名或 EPUB 书名"><label class="label" for="crImportAuthor">作者（可选）</label><input class="field" id="crImportAuthor"><div class="cr-error" id="crImportError" role="status"></div><div class="row end"><button class="btn" data-action="cancel">取消</button><button class="btn primary" data-action="import-confirm">放上书架</button></div>`);
  }
  async function importBook(btn) {
    const file = $('#crFile').files[0]; if (!file) { $('#crImportError').textContent='先选择一本书'; return; }
    if (file.size > 6 * 1024 * 1024 || !/\.(txt|epub)$/i.test(file.name)) { $('#crImportError').textContent='请选择 6 MB 以内的 TXT 或 EPUB'; return; }
    btn.disabled = true; btn.textContent = '正在整理书页…';
    try {
      const format = /\.epub$/i.test(file.name) ? 'epub' : 'txt';
      const payload = { title:$('#crImportTitle').value.trim(), author:$('#crImportAuthor').value.trim(), format };
      if(format==='epub') payload.data = await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result.split(',')[1]);r.onerror=reject;r.readAsDataURL(file);});
      else { const bytes = await file.arrayBuffer(); let encoding='utf-8'; const b=new Uint8Array(bytes); if(b[0]===255&&b[1]===254) encoding='utf-16le';else if(b[0]===254&&b[1]===255) encoding='utf-16be'; try {payload.text=new TextDecoder(encoding,{fatal:true}).decode(bytes);}catch{payload.text=new TextDecoder('gb18030').decode(bytes);} if(!payload.title) payload.title=file.name.replace(/\.txt$/i,''); }
      const result = await api('books','POST',payload); book = result.book; tab='read'; selected=''; renderReader(); saveProgress();
    } catch(e) { $('#crImportError').textContent=e.message || '这本书没有导入成功'; btn.disabled=false;btn.textContent='放上书架'; }
  }
  function noteDialog() {
    const selection = window.getSelection(); const article = $('#crArticle');
    if(article && selection && article.contains(selection.anchorNode) && article.contains(selection.focusNode)) selected=selection.toString().trim().slice(0,3000);
    dialog(`<h3>留一页摘记</h3><p class="note">${esc(book.chapters[book.chapter].title)}</p>${selected?'<div class="cr-quote">'+esc(selected)+'</div>':'<p class="note" style="margin:12px 0">还没有选中文字，可以直接记录本章的想法。</p>'}<textarea class="field" id="crNoteText" placeholder="为什么喜欢这句话？此刻想到了什么？"></textarea><div class="cr-error" id="crNoteError" role="status"></div><div class="row end"><button class="btn" data-action="cancel">取消</button><button class="btn primary" data-action="save-note">收好这页</button></div>`);
  }
  async function saveNote(btn) {
    btn.disabled=true;
    try { const result=await api(`books/${book.id}/notes`,'POST',{chapter:book.chapter,quote:selected,text:$('#crNoteText').value}); book.notes.unshift(result.note); closeDialog(); selected=''; renderReader(); }
    catch(e){$('#crNoteError').textContent=e.message;btn.disabled=false;}
  }
  async function ask() {
    if(pending) return; const input=$('#crQuestion'), text=input.value.trim(); if(!text)return;
    const id=book.id, chapter=book.chapter; drafts.set(draftKey(),text); pending=true;renderContent();
    try { const result=await api(`books/${id}/discuss`,'POST',{chapter,text,quote:selected}); if(book?.id===id){book.chat=result.chat;drafts.delete(`${id}:${chapter}`);} }
    catch(e){if($('#crTalkError'))$('#crTalkError').textContent=e.message;pending=false;const b=root.querySelector('[data-action="ask"]');if(b){b.disabled=false;b.textContent='再试一次';}if($('#crQuestion'))$('#crQuestion').disabled=false;return;}
    finally{pending=false;}
    if(book?.id===id && tab==='talk')renderContent();
  }
  function options() { dialog(`<h3>这本书的书签</h3><p class="note">摘记与进度保存在我们的服务器。导出后也能自己留一份。</p><div class="row"><button class="btn" data-action="export">导出书籍与摘记</button><button class="btn" data-action="archive-book">${book.archived?'放回书架':'收起这本书'}</button></div><p class="note" style="margin-top:12px">收起后可以从书架底部找回，不会删除正文或摘记。</p><div class="row end"><button class="btn" data-action="cancel">关好</button></div>`); }
  async function download() { await flush(); const data=await api(`books/${book.id}/export`);const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=book.title.replace(/[\\/:*?"<>|]/g,'_')+'-共读摘记.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);closeDialog(); }
  const actions = { retry:library, shelf:library, import:importer, cancel:closeDialog, 'import-confirm':importBook, note:noteDialog, 'save-note':saveNote, ask, options, export:download,
    prev:()=>changeChapter(Math.max(0,book.chapter-1)), next:()=>changeChapter(Math.min(book.chapters.length-1,book.chapter+1)),
    'archive-list':()=>{archived=!archived;return library();},
    'archive-book':async()=>{await api(`books/${book.id}/archive`,'PUT',{archived:!book.archived});return library();},
    smaller:()=>resize(-1), larger:()=>resize(1)
  };
  function resize(d){ font=Math.max(15,Math.min(23,font+d));try{localStorage.setItem('cr-font',String(font));}catch{}if(tab==='read'){$('#crArticle').style.setProperty('--cr-font',font+'px');} }
  function mount() {
    root=$('#crRoot'); if(!root)return;
    root.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b||b.disabled)return;try{
      if(b.dataset.book)return openBook(Number(b.dataset.book));
      if(b.dataset.tab){if(pending)return;await flush();tab=b.dataset.tab;selected=window.getSelection()?.toString().trim().slice(0,3000)||selected;renderReader();return;}
      if(b.dataset.noteChapter)return changeChapter(Number(b.dataset.noteChapter));
      if(b.dataset.prompt){$('#crQuestion').value=b.dataset.prompt;drafts.set(draftKey(),b.dataset.prompt);return;}
      if(actions[b.dataset.action])await actions[b.dataset.action](b);
    }catch(err){showError(err);}});
    root.addEventListener('input',e=>{if(e.target.id==='crSearch'){filter=e.target.value;renderBooks();}if(e.target.id==='crQuestion')rememberDraft();});
    root.addEventListener('change',e=>{if(e.target.id==='crChapter')changeChapter(Number(e.target.value));});
    root.addEventListener('pointerup',()=>{const a=$('#crArticle'),s=window.getSelection();if(a&&s&&a.contains(s.anchorNode)&&a.contains(s.focusNode)&&s.toString().trim())selected=s.toString().trim().slice(0,3000);});
    window.addEventListener('pagehide',()=>{if(book){fetch(`/api/reading/books/${book.id}/progress`,{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({chapter:book.chapter,offset:book.offset}),keepalive:true}).catch(()=>{});}});
  }
  window.Coread={open:()=>{if(!root)mount();if(book)renderReader();else library();},leave:flush};
})();

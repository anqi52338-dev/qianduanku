(() => {
  const labels = { feed:'小日子', mail:'信箱', review:'书影', schedule:'日程', reminder:'提醒', collection:'珍藏', period:'周期', rooms:'相处', archived:'收纳盒' };
  const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const $ = (s,r=document)=>r.querySelector(s);
  const fmt = ts => new Date(ts).toLocaleString('zh-CN',{month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'});
  const localDay = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const localInput = iso => { const d=new Date(iso||Date.now()+3600000); return localDay(d)+'T'+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'); };
  let app, tab='feed', items=[], editItem=null, seq=0, query='', hits=[], selected=new Set(), searchMore=false, itemMore=false, preferences={}, room='incognito', roomBusy=false, roomVersion=0, started=false, calendarOffset=0;
  const conversations={incognito:[],test:[]}, notified=new Set();
  const root=()=>$('#lifeRoot'), historyRoot=()=>$('#historyRoot');
  function head() { return `<div class="life-tabs" role="navigation" aria-label="手账分类">${Object.entries(labels).map(([k,v])=>`<button data-tab="${k}" class="${tab===k?'on':''}">${v}</button>`).join('')}</div>`; }
  const textView = s => `<p class="life-text">${esc(s)}</p>`;
  const buttons = item => `<div class="life-actions"><button class="btn" data-detail="${item.id}">打开</button>${item.status==='archived'?`<button class="btn" data-restore="${item.id}">放回原处</button>`:''}</div>`;
  function summary(item) {
    const d=item.data, mark=item.kind==='mail'?(d.who==='him'?'他寄来的':'我写的') : item.kind==='review'?(d.medium==='film'?'电影':'书籍')+' · '+ '★'.repeat(d.rating||5) : (item.kind==='schedule'||item.kind==='reminder')? (d.done?'已完成 · ':'')+fmt(d.due) : item.kind==='period'?d.start+(d.end?' — '+d.end:' · 进行中') : item.kind==='collection'?`${d.messages?.length||0} 条对话`:labels[item.kind];
    return `<article class="card life-entry"><div class="life-meta">${esc(mark)} <time>${fmt(item.ts)}</time></div><h4>${esc(item.title)}</h4>${textView(item.content.slice(0,150))}${buttons(item)}</article>`;
  }
  async function section(next) { tab=next; editItem=null; items=[]; await render(); }
  async function render() {
    const version=++seq; root().innerHTML=head()+'<div class="empty">正在翻开这一页…</div>';
    try {
      if(tab==='rooms') { preferences=(await app.api('/api/life/prefs')).prefs; app.prefs(preferences); if(version===seq) renderRooms(); return; }
      if(tab==='feed') { const data=await app.api('/api/life/feed'); if(version!==seq)return; root().innerHTML=head()+`<div class="card life-intro"><h4>把日子慢慢收好</h4><p>信件、书影和约定，会在这里留下一个小小的脚印。</p></div>`+(data.feed.length?data.feed.map(f=>`<article class="card life-entry"><div class="life-meta">${esc(labels[f.type]||({diary:'日记',moment:'动态'}[f.type]))} · ${fmt(f.ts)}</div><h4>${esc(f.title)}</h4>${textView(f.excerpt)}<button class="btn" data-feed="${f.type}" data-id="${f.id}">翻开看看</button></article>`).join(''):'<div class="empty">日子还长，慢慢记下来。</div>'); return; }
      if(tab==='period') { preferences=(await app.api('/api/life/prefs')).prefs; app.prefs(preferences); }
      const result=await app.api('/api/life/items?'+(tab==='archived'?'archived=1':'kind='+tab)); if(version!==seq)return; items=result.items; itemMore=result.hasMore; renderList();
    } catch(e) { if(version===seq)root().innerHTML=head()+`<div class="card">${textView(e.message)}<button class="btn" data-reload>再试一次</button></div>`; }
  }
  function renderList() {
    let rows=[...items]; if(tab==='schedule'||tab==='reminder')rows.sort((a,b)=>Number(a.data.done)-Number(b.data.done)||Date.parse(a.data.due)-Date.parse(b.data.due));
    const intro = tab==='collection' ? '<p class="note">在聊天里点“收藏”，或在历史搜索里选择几句话一起珍藏。</p>' : tab==='reminder'?'<p class="note">页面打开时会提示到期事项；关闭网页后暂不发送系统通知。</p>':tab==='archived'?'<p class="note">收起的手账仍保留在这里，随时可以放回原处。</p>':'';
    root().innerHTML=head()+`<div class="row between"><span class="life-caption">${esc(labels[tab])} · ${items.length}${itemMore?'+':''} 页</span>${!['collection','archived'].includes(tab)?'<button class="btn primary" data-new>记一页</button>':''}</div>`+intro+(tab==='period'?periodCalendar():'')+(rows.length?rows.map(summary).join(''):'<div class="empty">这里还空着，留给下一段小故事。</div>')+(itemMore?'<button class="btn block" data-more-items>翻更早的手账</button>':'')+(tab==='archived'?'<button class="btn block" data-message-trash>查看收起的聊天</button>':'');
  }
  function periodCalendar() {
    const today=new Date(),view=new Date(today.getFullYear(),today.getMonth()+calendarOffset,1),y=view.getFullYear(),m=view.getMonth(),first=new Date(y,m,1),days=new Date(y,m+1,0).getDate();
    let cells=Array.from({length:first.getDay()},()=>'<i></i>').join('');
    for(let day=1;day<=days;day++){ const date=localDay(new Date(y,m,day)); const marked=items.some(i=>i.data.start<=date && date <=(i.data.end||i.data.start)); cells+=`<span class="${marked?'marked ':''}${day===today.getDate()&&m===today.getMonth()&&y===today.getFullYear()?'today':''}">${day}</span>`; }
    const latest=[...items].sort((a,b)=>b.data.start.localeCompare(a.data.start))[0]; let predicted='';
    if(latest){const d=new Date(latest.data.start+'T12:00:00');d.setDate(d.getDate()+preferences.cycleDays);predicted=`按 ${preferences.cycleDays} 天间隔推算，下次可能在 ${localDay(d)} 左右。`;}
    return `<div class="card"><div class="row between"><button class="btn" data-calendar="-1" aria-label="上一个月">‹</button><h4>${y} 年 ${m+1} 月</h4><button class="btn" data-calendar="1" aria-label="下一个月">›</button></div><div class="period-grid">${['日','一','二','三','四','五','六'].map(d=>`<b>${d}</b>`).join('')}${cells}</div><label class="label" for="cycleDays">用于日期推算的间隔（天）</label><div class="row"><input class="field" id="cycleDays" type="number" min="15" max="90" value="${preferences.cycleDays}"><button class="btn" data-cycle-save>保存</button></div><p class="note">${esc(predicted)}这里只做日期估算，不能用于避孕或医学判断。周期记录不会自动发送给聊天模型。</p></div>`;
  }
  function editor(item) {
    editItem=item||null; const kind=item?.kind||tab,d=item?.data||{};
    let extras='';
    if(kind==='mail')extras=`<label class="label" for="itemFormat">信纸</label><select class="field" id="itemFormat"><option value="letter" ${d.format!=='postcard'?'selected':''}>长信</option><option value="postcard" ${d.format==='postcard'?'selected':''}>明信片</option></select>`;
    if(kind==='review')extras=`<label class="label" for="itemMedium">书 / 电影</label><select class="field" id="itemMedium"><option value="book">书籍</option><option value="film" ${d.medium==='film'?'selected':''}>电影</option></select><label class="label" for="itemRating">喜欢程度（1–5）</label><input class="field" id="itemRating" type="number" min="1" max="5" value="${d.rating||5}">`;
    if(kind==='schedule'||kind==='reminder')extras=`<label class="label" for="itemDue">约定的时间</label><input class="field" id="itemDue" type="datetime-local" value="${localInput(d.due)}">`;
    if(kind==='period')extras=`<label class="label" for="itemStart">开始日期</label><input class="field" id="itemStart" type="date" value="${esc(d.start||localDay(new Date()))}"><label class="label" for="itemEnd">结束日期（可留空）</label><input class="field" id="itemEnd" type="date" value="${esc(d.end||'')}">`;
    root().innerHTML=head()+`<form class="card life-editor" id="lifeForm"><h4>${item?'修改':'写一页'}${esc(labels[kind])}</h4><label class="label" for="itemTitle">标题</label><input class="field" id="itemTitle" maxlength="120" required value="${esc(item?.title|| (kind==='period'?'这次周期':''))}">${extras}<label class="label" for="itemContent">${kind==='review'?'我的感想':kind==='mail'?'想说的话':'小记'}</label><textarea class="field tall" id="itemContent" maxlength="12000">${esc(item?.content||'')}</textarea><div class="life-actions"><button class="btn primary" type="submit">收好这一页</button><button class="btn" type="button" data-back>返回</button></div><p class="note" id="lifeFormNote" role="status"></p></form>`;
    $('#lifeForm').onsubmit=async e=>{e.preventDefault();const submit=e.submitter||$('#lifeForm button[type="submit"]');submit.disabled=true;try{let data={};if(kind==='mail')data.format=$('#itemFormat').value;if(kind==='review'){data.medium=$('#itemMedium').value;data.rating=Number($('#itemRating').value);}if(kind==='schedule'||kind==='reminder'){const value=$('#itemDue').value;if(!value)throw Error('选一个时间吧');data.due=new Date(value).toISOString();}if(kind==='period'){data.start=$('#itemStart').value;data.end=$('#itemEnd').value;}
      const body={kind,title:$('#itemTitle').value,content:$('#itemContent').value,data,...(item?{updated:item.updated}:{})};const r=await app.api(item?'/api/life/items/'+item.id:'/api/life/items',item?'PUT':'POST',body);app.toast('收好了');await detail(r.item.id);
    }catch(err){$('#lifeFormNote').textContent=err.message;}finally{submit.disabled=false;}};
  }
  async function detail(id) {
    const version=++seq; const r=await app.api('/api/life/items/'+id);if(version!==seq)return; const item=r.item,d=item.data; editItem=item;
    const snapshots=item.kind==='collection'?(d.messages||[]).map(m=>`<div class="collection-message"><b>${m.role==='me'?'我':'他'} · ${fmt(m.ts)}</b>${textView(m.text)}${m.image?`<img src="/api/file/${encodeURIComponent(m.image)}" alt="收藏的图片或表情" loading="lazy">`:''}</div>`).join(''):'';
    root().innerHTML=head()+`<article class="card ${item.kind==='mail'?'letter-paper':''}"><div class="life-meta">${esc(labels[item.kind])} · ${fmt(item.ts)}</div><h4>${esc(item.title)}</h4>${(item.kind==='schedule'||item.kind==='reminder')?`<p>${fmt(d.due)} · ${d.done?'已完成':'等着一起做'}</p>`:''}${item.kind==='period'?`<p>${esc(d.start)} ${d.end?'— '+esc(d.end):'· 尚未记结束日期'}</p>`:''}${textView(item.content)}${snapshots}${d.aiText?`<div class="life-ai"><b>他的小回应</b>${textView(d.aiText)}</div>`:''}<div class="life-actions"><button class="btn" data-back>返回列表</button><button class="btn" data-edit="${item.id}">修改</button>${item.status==='active'?`<button class="btn" data-archive="${item.id}">收起</button>`:`<button class="btn" data-restore="${item.id}">放回原处</button>`}</div>${item.status==='active'?`<div class="life-actions">${item.kind!=='period'?`<button class="btn" data-quote-item="${item.id}">带到聊天里</button>`:''}${item.kind==='mail'?`<button class="btn primary" data-ai="reply" data-id="${item.id}">请他回一封</button>`:''}${item.kind==='review'?`<button class="btn primary" data-ai="review" data-id="${item.id}">听听他的看法</button>`:''}${['schedule','reminder'].includes(item.kind)?`<button class="btn primary" data-done="${item.id}">${d.done?'改为待完成':'我们完成啦'}</button>`:''}</div>`:''}<p class="note" id="lifeDetailNote" role="status"></p></article>`;
  }
  async function collect(ids) { try { const r=await app.api('/api/life/collect','POST',{ids}); app.toast('放进珍藏了'); return r.item; } catch(e){app.toast(e.message);} }
  function renderRooms() {
    root().innerHTML=head()+`<div class="card"><h4>今天的相处小状态</h4><p class="note">这是你设定的角色状态，不是对 AI 真实情绪的检测。</p><div class="chips">${['平静','开心','想念','委屈','需要空间'].map(m=>`<button class="chip ${preferences.mood===m?'on':''}" data-mood="${m}">${m}</button>`).join('')}</div></div><div class="card"><h4>给彼此一点空间</h4><p>模拟拉黑：${preferences.blocked?'已开启，普通消息暂不发送':'未开启'}</p><button class="btn" data-block>${preferences.blocked?'解除模拟拉黑':'开启模拟拉黑'}</button><p class="note">由你控制开关，不会让 AI 自动阻止你聊天。</p>${preferences.blocked?'<label class="label" for="smallNote">递一张小纸条</label><textarea class="field" id="smallNote" maxlength="1000" placeholder="这一句，还是想让他看到…"></textarea><button class="btn primary" data-small-note>递给他</button>':''}</div><div class="card"><h4>两个独立的小窗口</h4><p class="note">不读取主聊天或记忆。只保留本页运行期间的消息，刷新即清空；调用的模型服务仍按自身数据政策处理内容。</p><div class="life-actions"><button class="btn" data-room="incognito">无痕聊天</button><button class="btn" data-room="test">模型测试</button></div></div>`;
  }
  function renderRoom() {
    const messages=conversations[room]; root().innerHTML=head()+`<div class="card"><div class="row between"><h4>${room==='incognito'?'无痕聊天':'模型测试'}</h4><button class="btn" data-clear-room>清空</button></div><p class="note">${room==='incognito'?'保留当前人设，聊天内容不写入本站数据库。':'独立测试当前聊天线路，不带入主聊天、人设和记忆。'}这个窗口最多带最近 24 条消息。</p><div class="isolated-messages">${messages.map(m=>`<div class="isolated-message ${m.role}"><b>${m.role==='user'?'我':'他'}</b>${textView(m.content)}</div>`).join('')||'<div class="empty">从一句新话开始。</div>'}${roomBusy?'<div class="note">正在等回复…</div>':''}</div><textarea class="field" id="roomInput" maxlength="3000" placeholder="只在这个窗口聊…" ${roomBusy?'disabled':''}></textarea><div class="life-actions"><button class="btn primary" data-room-send ${roomBusy?'disabled':''}>发送</button><button class="btn" data-room-back>回到相处页</button></div></div>`;
  }
  async function search(append=false) {
    const version=++seq; const r=await app.api('/api/life/search?q='+encodeURIComponent(query)+(append&&hits.length?'&before='+hits.at(-1).id:''));if(version!==seq)return;hits=append?[...hits,...r.messages]:r.messages;searchMore=r.hasMore;renderSearch();
  }
  function searchHead() { return `<form class="card history-search" id="historyForm"><label class="label" for="historyQuery">找找我们说过的话</label><div class="row"><input class="field" id="historyQuery" type="search" maxlength="100" value="${esc(query)}" placeholder="输入一句话或关键词"><button class="btn primary" type="submit">寻找</button></div><p class="note">搜索只供你回看，不会自动加入 AI 记忆。</p></form>`; }
  function searchCards(rows,context=false) { return rows.map(m=>`<article class="card history-hit" data-history-message="${m.id}"><div class="life-meta">${m.role==='me'?'我':'他'} · ${fmt(m.ts)} ${m.archived?'· 已收起':''}</div>${textView(m.text)}${m.image?`<img class="history-image" src="/api/file/${encodeURIComponent(m.image)}" alt="消息中的图片或表情" loading="lazy">`:''}<div class="life-actions">${m.archived?`<button class="btn" data-message-restore="${m.id}">恢复这条</button>`:`<label class="history-pick"><input type="checkbox" data-select="${m.id}" ${selected.has(m.id)?'checked':''}>选中</label><button class="btn" data-history-quote="${m.id}">引用</button>${context?'':`<button class="btn" data-context="${m.id}">前后文</button>`}`}</div></article>`).join(''); }
  function renderSearch() { historyRoot().innerHTML=searchHead()+`<div class="row between"><span class="note">${hits.length}${searchMore?'+':''} 条${query?'匹配':'最近的'}消息</span><button class="btn" data-collect-selected>收藏选中的话</button></div>`+searchCards(hits)+(searchMore?'<button class="btn block" data-more-search>继续寻找</button>':'')+(!hits.length?'<div class="empty">还没有找到，再换一个关键词试试。</div>':''); $('#historyForm').onsubmit=async e=>{e.preventDefault();query=$('#historyQuery').value.trim();selected.clear();try{await search();}catch(err){app.toast(err.message);}}; }
  async function messageMenu(m) {
    if(!m)return;app.go('history');++seq;historyRoot().innerHTML=`<div class="card"><h4>这句话的小抽屉</h4>${textView(m.text)}<p class="note">修改、重新回复、收起只支持最近一轮。收起可以恢复，不会擦除已整理的记忆。</p>${m.role==='me'&&m.type!=='sticker'?`<textarea class="field" id="messageEdit" maxlength="8000">${esc(m.text)}</textarea><button class="btn" data-message-action="edit" data-id="${m.id}">保存修改，再请他回复</button>`:''}<div class="life-actions"><button class="btn" data-message-action="regenerate" data-id="${m.id}">重新回复最近一轮</button><button class="btn" data-message-action="archive" data-id="${m.id}">收起最近一轮</button><button class="btn" data-return-search>返回搜索</button></div></div>`;
  }
  async function pollDue() { if(document.hidden)return;try{const r=await app.api('/api/life/due');const btn=$('#openLife');btn.dataset.due=r.items.length?String(r.items.length):'';for(const item of r.items){if(!notified.has(item.id)){notified.add(item.id);app.toast('到了约定的时间：'+item.title);break;}}}catch{} }
  function init(options) {
    app=options;
    root().onclick=async e=>{const b=e.target.closest('button');if(!b||(b.type==='submit'&&b.closest('form')))return;const d=b.dataset;b.disabled=true;try{
      if(d.tab)return await section(d.tab);
      if('reload'in d||'back'in d)return await render();
      if('new'in d)return editor();
      if(d.detail)return await detail(Number(d.detail));
      if(d.edit)return editor((await app.api('/api/life/items/'+d.edit)).item);
      if(d.archive||d.restore){const id=d.archive||d.restore;await app.api('/api/life/items/'+id,'PUT',{status:d.archive?'archived':'active'});app.toast(d.archive?'收进盒子了':'放回原处了');return await render();}
      if(d.done){const item=(await app.api('/api/life/items/'+d.done)).item;await app.api('/api/life/items/'+d.done,'PUT',{data:{done:!item.data.done},updated:item.updated});return await detail(item.id);}
      if(d.ai){const note=$('#lifeDetailNote');note.textContent='他正在写…';const r=await app.api('/api/life/items/'+d.id+'/'+d.ai,'POST');app.toast('他写好了');return await detail(r.item.id);}
      if(d.quoteItem){const item=(await app.api('/api/life/items/'+d.quoteItem)).item;app.draft('想和你聊聊这页'+labels[item.kind]+'：'+item.title+'\n'+(item.content||item.data.aiText||'').slice(0,3000));return;}
      if(d.feed){if(d.feed==='diary'){const data=await app.api('/api/diary'),entry=data.diary.find(i=>i.id===Number(d.id));if(entry)root().innerHTML=head()+`<article class="card letter-paper"><h4>${esc(entry.title)}</h4>${textView(entry.content)}<button class="btn" data-back>返回</button></article>`;}else if(d.feed==='moment')app.go('moments');else await detail(Number(d.id));return;}
      if('moreItems'in d){const r=await app.api('/api/life/items?'+(tab==='archived'?'archived=1':'kind='+tab)+'&before='+items.at(-1).id);items.push(...r.items);itemMore=r.hasMore;renderList();return;}
      if(d.calendar){calendarOffset+=Number(d.calendar);renderList();return;}
      if('cycleSave'in d){const r=await app.api('/api/life/prefs','PUT',{cycleDays:Number($('#cycleDays').value)});preferences=r.prefs;renderList();return;}
      if(d.mood||'block'in d){const r=await app.api('/api/life/prefs','PUT',d.mood?{mood:d.mood}:{blocked:!preferences.blocked});preferences=r.prefs;app.prefs(preferences);renderRooms();return;}
      if('smallNote'in d){const text=$('#smallNote').value.trim();if(!text)throw Error('写一句再递给他吧');app.smallNote(text);return;}
      if(d.room){room=d.room;renderRoom();return;}
      if('roomBack'in d){renderRooms();return;}
      if('clearRoom'in d){++roomVersion;conversations[room]=[];renderRoom();return;}
      if('roomSend'in d){const text=$('#roomInput').value.trim();if(!text)throw Error('写一句话吧');if(roomBusy)return;const currentRoom=room,version=roomVersion;conversations[currentRoom].push({role:'user',content:text});roomBusy=true;renderRoom();try{const r=await app.api('/api/life/isolated','POST',{mode:currentRoom,messages:conversations[currentRoom].slice(-23)});if(version===roomVersion)conversations[currentRoom].push({role:'assistant',content:r.text});}catch(err){if(version===roomVersion){conversations[currentRoom].pop();app.toast(err.message);}}finally{roomBusy=false;if(tab==='rooms'&&room===currentRoom){renderRoom();if(version===roomVersion&&conversations[currentRoom].at(-1)?.role!=='assistant')$('#roomInput').value=text;}}return;}
      if('messageTrash'in d){app.go('history');++seq;const r=await app.api('/api/life/messages/archived');hits=r.messages;historyRoot().innerHTML='<div class="card"><h4>收起的聊天</h4><p class="note">恢复后会重新加入主聊天记录。</p><button class="btn" data-return-search>返回搜索</button></div>'+searchCards(hits,true);return;}
    }catch(err){app.toast(err.message);const n=$('#lifeDetailNote');if(n)n.textContent=err.message;}finally{b.disabled=false;}};
    historyRoot().onclick=async e=>{const b=e.target.closest('button');if(!b||(b.type==='submit'&&b.closest('form')))return;const d=b.dataset;b.disabled=true;try{
      if(d.context){const r=await app.api('/api/life/context/'+d.context);hits=r.messages;historyRoot().innerHTML='<button class="btn" data-return-search>返回搜索</button><p class="note">这一页仅供回看。</p><button class="btn" data-collect-selected>收藏选中的话</button>'+searchCards(hits,true);}
      if(d.historyQuote){const m=hits.find(m=>m.id===Number(d.historyQuote));if(m)app.quote(m);}
      if('returnSearch'in d)await search();
      if('moreSearch'in d)await search(true);
      if('collectSelected'in d){if(!selected.size)throw Error('先选中几句话吧');if(selected.size>20)throw Error('一次最多收藏20句');await collect([...selected]);selected.clear();}
      if(d.messageAction){await app.api('/api/life/messages/'+d.id+'/'+d.messageAction,'POST',d.messageAction==='edit'?{text:$('#messageEdit').value}:{});await app.messagesChanged(d.messageAction!=='archive');app.go('chat');}
      if(d.messageRestore){await app.api('/api/life/messages/restore','POST',{id:Number(d.messageRestore)});await app.messagesChanged(false);app.toast('恢复好了');b.closest('article')?.remove();}
    }catch(err){app.toast(err.message);}finally{b.disabled=false;}};
    historyRoot().onchange=e=>{if(e.target.dataset.select){const id=Number(e.target.dataset.select);e.target.checked?selected.add(id):selected.delete(id);}};
  }
  window.Life={init,section,collect,messageMenu,open:page=>{if(page==='history'){seq++;return search().catch(e=>app.toast(e.message));}else return render();},start:()=>{if(started)return;started=true;pollDue();setInterval(pollDue,60000);}};
})();

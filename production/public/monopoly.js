(() => {
  'use strict';
  let api,toast,profile,root,state=null,busy=false,loading=false;
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const button=(action,label,disabled=false)=>`<button type="button" class="btn" data-board-action="${action}" ${disabled?'disabled':''}>${label}</button>`;
  function position(index){
    if(index<6)return [1,index+1];
    if(index<10)return [index-4,6];
    if(index<16)return [6,16-index];
    return [21-index,1];
  }
  function render(){
    if(!root||!state)return;
    const game=state.game;
    if(!game||game.status!=='active'){
      let finish='';
      if(game){const names=game.players.map(p=>`${esc(p.name)}：${p.coins} 枚金币`).join(' · ');const title=game.status==='ended'?'这局已收好':game.winner===null?'这一局平分秋色':`${esc(game.players[game.winner].name)}赢啦`;
        finish=`<div class="card"><h4>${title}</h4><p>${names}</p><p>可以提出一个双方愿意的小约定，也可以只说一句“玩得开心”。</p></div>`;}
      root.innerHTML=`${finish}<form class="card cb-start" id="boardStart"><h4>我们的情侣大富翁</h4><p>20 格小旅程，夸夸、真心话、约会和日常小挑战。你和${esc(profile()?.hisName||'恋人')}轮流掷骰，每人从 40 枚金币开始。</p><label>你的名字<input class="field" id="boardName" maxlength="20" value="${esc(game?.players[0]?.name||'安安')}" autocomplete="off"></label><label>一起玩几轮<select class="field" id="boardRounds"><option value="5">5 轮 · 小小一局</option><option value="10" selected>10 轮 · 慢慢玩</option><option value="15">15 轮 · 多陪一会儿</option></select></label><button class="btn block" type="submit" ${busy?'disabled':''}>${busy?'正在铺好棋盘…':'开始我们的旅程'}</button><p class="note">随时跳过任务，不扣分。进度保存在服务器，刷新或换设备后可以继续；最近 10 局也会随数据导出保存。只有点“让他回答”时才会请求聊天模型。</p></form>${history(game)}`;
      root.querySelector('#boardStart').onsubmit=e=>{e.preventDefault();if(busy)return;action('new',{name:root.querySelector('#boardName').value,rounds:Number(root.querySelector('#boardRounds').value)});};return;
    }
    const players=game.players,actor=players[game.actor],pending=game.pending;
    const scores=players.map((p,i)=>`<div class="cb-player ${i===game.actor?'active':''}"><span class="cb-pawn cb-pawn-${i}">${i===0?'♡':'☆'}</span><strong>${esc(p.name)}</strong><span>${p.coins} 金币 · ${game.owners.filter(o=>o===i).length} 处小屋</span></div>`).join('');
    const tiles=state.board.map(tile=>{const [row,col]=position(tile.index),owner=game.owners[tile.index];const pawns=players.map((p,i)=>p.position===tile.index?`<b class="cb-pawn cb-pawn-${i}" aria-label="${esc(p.name)}在这里">${i===0?'♡':'☆'}</b>`:'').join('');return `<div class="cb-tile ${owner!==null?'cb-owned-'+owner:''}" style="grid-row:${row};grid-column:${col}" aria-label="${esc(tile.name)}${owner!==null?'，属于'+esc(players[owner].name):''}"><span class="cb-tile-icon">${tile.icon}</span><span>${esc(tile.name)}</span><small>${tile.kind==='plot'?owner===null?tile.price+' 金币':'过路 '+tile.rent:'第 '+(tile.index+1)+' 格'}</small><div class="cb-tile-pawns">${pawns}</div></div>`;}).join('');
    let controls='';
    if(!pending)controls=`<p>${esc(actor.name)}，到你啦。</p>${button('roll',busy?'正在掷骰…':game.actor===0?'掷骰子':'帮他掷骰',busy)}`;
    else if(pending.kind==='buy'){const tile=state.board[pending.index];controls=`<h4>${esc(tile.name)}</h4><p>用 ${tile.price} 枚金币收下这处小地方。对方路过时，会留下 ${tile.rent} 枚过路金币。</p><div class="cb-actions">${button('buy','收下小屋',busy||actor.coins<tile.price)}${button('skip','先路过',busy)}</div>`;}
    else{controls=`<h4>${esc(actor.name)}的任务卡</h4><p class="cb-task">${esc(pending.task)}</p>`;
      if(game.actor===0)controls+='<label class="cb-answer-label">记下你的回答（可不填）<textarea class="field" id="boardAnswer" maxlength="1600" placeholder="想到什么就写下来…"></textarea></label>';
      else controls+=pending.reply?`<div class="cb-reply">${esc(pending.reply)}</div>`:`${button('respond',busy?'他正在想…':'让他回答',busy)}<p class="note">使用你已设置的聊天模型，可能消耗 API 额度。</p>`;
      controls+=`<div class="cb-actions">${button('complete','完成 · +6 金币',busy||game.actor===1&&!pending.reply)}${button('skip','跳过这张卡',busy)}</div>`;
    }
    root.innerHTML=`<div class="cb-score">${scores}</div><div class="cb-board">${tiles}<div class="cb-center"><em>Our Little Journey</em><span class="cb-dice">${game.dice||'♡'}</span><b>第 ${Math.floor(game.turn/2)+1} / ${game.rounds} 轮</b><span>轮到 ${esc(actor.name)}</span></div></div><div class="card cb-current">${controls}</div><details class="card cb-log"><summary>我们的足迹</summary><ol>${game.log.slice().reverse().map(item=>`<li>${esc(item.text)}</li>`).join('')}</ol></details>${history(game)}<div class="cb-footer"><span class="note">已自动保存 · ${new Date(game.updated).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}</span>${button('end','收起这一局',busy)}</div>`;
    root.querySelectorAll('[data-board-action]').forEach(el=>el.onclick=()=>{
      const kind=el.dataset.boardAction;
      if(kind==='end'&&!confirm('结束这一局？足迹会保留，之后可以开新局。'))return;
      if(kind==='complete'||kind==='skip'||kind==='buy')action('resolve',{action:kind,answer:root.querySelector('#boardAnswer')?.value||''});
      else action(kind);
    });
  }
  function history(game){const rows=game?.history||[];if(!rows.length)return '';return `<details class="card cb-log"><summary>收好的任务卡 · ${rows.length}</summary>${rows.slice().reverse().map(card=>`<div class="cb-saved-card"><b>${esc(game.players[card.actor].name)} · ${card.completed?'完成':'跳过'}</b><p>${esc(card.task)}</p>${card.answer?`<p class="cb-reply">${esc(card.answer)}</p>`:''}</div>`).join('')}</details>`;}
  async function action(kind,extra={}){
    if(busy)return;busy=true;
    const draft=root.querySelector('#boardAnswer')?.value;
    root.querySelectorAll('button').forEach(el=>el.disabled=true);
    try{state=await api('/api/monopoly/'+kind,'POST',{id:state.game?.id,version:state.game?.version,requestId:crypto.randomUUID(),...extra});render();}
    catch(error){toast(error.message);try{state=await api('/api/monopoly');}catch{}render();if(draft!==undefined&&root.querySelector('#boardAnswer'))root.querySelector('#boardAnswer').value=draft;}
    finally{busy=false;const answer=root.querySelector('#boardAnswer')?.value;render();if(answer!==undefined&&root.querySelector('#boardAnswer'))root.querySelector('#boardAnswer').value=answer;}
  }
  async function open(){if(loading||busy)return;loading=true;root.innerHTML='<div class="empty">正在铺开棋盘…</div>';try{state=await api('/api/monopoly');render();}catch(error){root.innerHTML='<div class="empty">暂时没能打开棋盘，返回主页后再试一次。</div>';toast(error.message);}finally{loading=false;}}
  window.CoupleBoard={init(options){({api,toast,profile}=options);root=document.querySelector('#boardRoot');},open};
})();

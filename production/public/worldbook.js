(() => {
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let app,data,bookId=null,schemeId=null,dirty=false,saving=false,edits=0;
const id=()=>crypto.randomUUID();
const book=()=>data?.books.find(b=>b.id===bookId),scheme=()=>data?.schemes.find(s=>s.id===schemeId);
function changed(){dirty=true;edits++;status();}
function status(){
  $('wbSave').disabled=!dirty||saving||!data;
  $('wbSave').textContent=saving?'正在保存…':'保存全部修改';
  const active=data?.schemes.find(s=>s.id===data.activeSchemeId);
  $('wbStatus').textContent=(dirty?'有未保存修改 · ':'已保存 · ')+(active?'当前方案：'+active.name:'世界书已关闭');
  $('wbActive').value=data?.activeSchemeId||'';
}
function render(){
  if(!data)return;
  const active=$('wbActive');active.innerHTML='<option value="">关闭世界书</option>'+data.schemes.map(s=>`<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('');
  $('wbBooks').innerHTML=data.books.map(b=>`<button type="button" class="chip ${b.id===bookId?'on':''}" data-book="${esc(b.id)}">${esc(b.name)}</button>`).join('')||'<p class="note">还没有世界书，点“新建世界书”开始。</p>';
  $('wbSchemes').innerHTML=data.schemes.map(s=>`<button type="button" class="chip ${s.id===schemeId?'on':''}" data-scheme="${esc(s.id)}">${esc(s.name)}</button>`).join('')||'<p class="note">新建一个方案，把需要一起使用的世界书勾选进去。</p>';
  const b=book();$('wbBookEditor').hidden=!b;
  if(b){$('wbBookName').value=b.name;$('wbContent').value=b.content;}
  const s=scheme();$('wbSchemeEditor').hidden=!s;
  if(s){$('wbSchemeName').value=s.name;$('wbMembers').innerHTML=data.books.map(b=>`<label class="wb-member"><input type="checkbox" value="${esc(b.id)}" ${s.bookIds.includes(b.id)?'checked':''}><span>${esc(b.name)}</span></label>`).join('')||'<p class="note">先新建世界书，再选择要加入的内容。</p>';}
  status();
}
async function load(discard=false){
  const before=edits;
  $('wbNote').textContent='正在读取…';
  try{const incoming=await app.api('/api/worldbook');if(saving||edits!==before||(dirty&&!discard)){$('wbNote').textContent='编辑内容已保留，请保存后再重新载入。';return;}data=incoming;dirty=false;bookId=data.books.some(b=>b.id===bookId)?bookId:data.books[0]?.id;schemeId=data.schemes.some(s=>s.id===schemeId)?schemeId:data.schemes[0]?.id;render();$('wbNote').textContent='';}
  catch(e){$('wbNote').textContent=e.message;}
}
async function save(){
  if(saving||!data)return;saving=true;status();$('wbWorkspace').disabled=true;
  const payload=structuredClone(data);
  try{data=await app.api('/api/worldbook','PUT',payload);dirty=false;render();$('wbNote').textContent='保存好了，启用方案会从下一次聊天或主动消息生效。';app.toast('世界书保存好了');}
  catch(e){$('wbNote').textContent=e.message+'。编辑内容仍保留在此页。';app.toast(e.message);}
  finally{saving=false;$('wbWorkspace').disabled=false;status();}
}
window.Worldbook={
  init(options){app=options;
    $('wbNewBook').onclick=()=>{if(!data)return;if(data.books.length>=50)return app.toast('最多 50 本世界书');const b={id:id(),name:'新的世界书',content:''};data.books.push(b);bookId=b.id;changed();render();$('wbBookName').focus();};
    $('wbNewScheme').onclick=()=>{if(!data)return;if(data.schemes.length>=30)return app.toast('最多 30 个方案');const s={id:id(),name:'新的方案',bookIds:[]};data.schemes.push(s);schemeId=s.id;changed();render();$('wbSchemeName').focus();};
    $('wbBooks').onclick=e=>{const b=e.target.closest('[data-book]');if(b){bookId=b.dataset.book;render();}};
    $('wbSchemes').onclick=e=>{const b=e.target.closest('[data-scheme]');if(b){schemeId=b.dataset.scheme;render();}};
    $('wbBookName').oninput=e=>{if(book()){book().name=e.target.value;changed();}};
    $('wbContent').oninput=e=>{if(book()){book().content=e.target.value;changed();}};
    $('wbSchemeName').oninput=e=>{if(scheme()){scheme().name=e.target.value;changed();}};
    for(const n of ['wbBookName','wbSchemeName'])$(n).onchange=()=>render();
    $('wbMembers').onchange=e=>{const s=scheme();if(!s||e.target.type!=='checkbox')return;s.bookIds=e.target.checked?[...s.bookIds,e.target.value]:s.bookIds.filter(id=>id!==e.target.value);changed();};
    $('wbActive').onchange=e=>{data.activeSchemeId=e.target.value||null;changed();};
    $('wbDeleteBook').onclick=()=>{const b=book();if(!b||!confirm('删除“'+b.name+'”？它也会从所有方案移除；保存后生效。'))return;data.books=data.books.filter(x=>x.id!==b.id);for(const s of data.schemes)s.bookIds=s.bookIds.filter(x=>x!==b.id);bookId=data.books[0]?.id;changed();render();};
    $('wbDeleteScheme').onclick=()=>{const s=scheme();if(!s||!confirm('删除方案“'+s.name+'”？书本内容仍会保留；保存后生效。'))return;data.schemes=data.schemes.filter(x=>x.id!==s.id);if(data.activeSchemeId===s.id)data.activeSchemeId=null;schemeId=data.schemes[0]?.id;changed();render();};
    $('wbSave').onclick=save;
    $('wbReload').onclick=()=>{if(!saving&&(!dirty||confirm('放弃此页未保存修改，重新读取服务器上的世界书？'))){load(true);}};
    $('wbBack').onclick=()=>app.go('chat');
    $('openWorldbook').onclick=()=>app.go('worldbook');
    $('settingsWorldbook').onclick=()=>app.go('worldbook');
    window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
  },
  open(){if(!dirty&&!saving)load();}
};
})();

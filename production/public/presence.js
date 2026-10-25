(() => {
const $=id=>document.getElementById(id);let app,state,dirty=false,cities=[],offset=0,started=false;
const note=(text,error=false)=>{const n=$('presenceNote');n.textContent=text;n.className=error?'note err':'note';};
function clock(){if(!state)return;const date=new Date(Date.now()+offset),tz=state.prefs.timezone;try{$('chatClock').textContent=new Intl.DateTimeFormat('zh-CN',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit',weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(date);}catch{} }
function update(s){if(!s)return;state=s;offset=s.now-Date.now();clock();const w=s.weather;
  $('weatherNow').textContent=!s.prefs.weatherEnabled?'天气已关闭':w?`${w.location} · ${w.condition} ${w.temperature}℃ · 今日 ${w.low??'—'}～${w.high??'—'}℃（数据时间 ${w.time}）`:`${s.prefs.location.name} · 天气暂未获取，点“刷新天气”重试`;
  $('locationNow').textContent='当前地区：'+s.prefs.location.name;
  $('proactiveUsage').textContent=`今天已发送 ${s.sentToday} 条，尝试 ${s.attemptsToday} / ${s.prefs.dailyLimit} 次。失败也占用一次，避免反复请求消耗额度。`+(s.lastError?' '+s.lastError:'');
}
function fill(){if(!state||dirty)return;const p=state.prefs;for(const [id,key]of [['timeZone','timezone'],['autoLimit','dailyLimit'],['autoIdle','idleMinutes'],['autoGap','gapMinutes'],['autoStart','start'],['autoEnd','end']])$(id).value=p[key];for(const [id,key]of [['weatherEnabled','weatherEnabled'],['autoEnabled','enabled'],['autoAllDay','allDay']])$(id).checked=p[key];$('autoHours').hidden=p.allDay;}
async function save(patch){const s=await app.api('/api/presence','PUT',patch);update(s);return s;}
function init(options){app=options;
  $('presenceCard').addEventListener('input',()=>dirty=true);$('presenceCard').addEventListener('change',()=>dirty=true);
  $('autoAllDay').onchange=()=>{dirty=true;$('autoHours').hidden=$('autoAllDay').checked;};
  $('presenceSave').onclick=async e=>{const b=e.currentTarget;b.disabled=true;try{await save({timezone:$('timeZone').value.trim(),weatherEnabled:$('weatherEnabled').checked,enabled:$('autoEnabled').checked,allDay:$('autoAllDay').checked,dailyLimit:Number($('autoLimit').value),idleMinutes:Number($('autoIdle').value),gapMinutes:Number($('autoGap').value),start:Number($('autoStart').value),end:Number($('autoEnd').value)});dirty=false;fill();note('时间、天气和主动消息设置已保存。');}catch(err){note(err.message,true);}finally{b.disabled=false;}};
  $('refreshWeather').onclick=async e=>{const b=e.currentTarget;b.disabled=true;try{update(await app.api('/api/presence/weather','POST',{}));note(state.weather?'天气已更新。':'天气暂时不可用，聊天会明确知道当前未取得天气，不会猜测。',!state.weather);}catch(err){note(err.message,true);}finally{b.disabled=false;}};
  $('locateWeather').onclick=async e=>{const b=e.currentTarget;if(!navigator.geolocation){note('浏览器不支持定位，继续使用当前城市（默认乐陵）。',true);return;}b.disabled=true;note('请在手机提示中允许定位…');try{const pos=await new Promise((resolve,reject)=>navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:false,timeout:15000,maximumAge:300000}));await save({location:{name:'手机定位所在地区',latitude:pos.coords.latitude,longitude:pos.coords.longitude},weatherEnabled:true});$('weatherEnabled').checked=true;update(await app.api('/api/presence/weather','POST',{}));note('定位已保存，天气使用约一公里精度的地区坐标。');}catch{note('定位未成功或未授权，保留当前城市；默认是乐陵，也可以手动查找城市。',true);}finally{b.disabled=false;}};
  $('searchCity').onclick=async e=>{const b=e.currentTarget;b.disabled=true;try{const result=await app.api('/api/presence/cities?name='+encodeURIComponent($('weatherCity').value.trim()));cities=result.cities;$('cityResults').replaceChildren(new Option(cities.length?'请选择城市':'未找到城市，请试试拼音或加上省份',''));cities.forEach((c,i)=>$('cityResults').add(new Option(c.name,String(i))));$('cityResults').hidden=false;}catch(err){note(err.message,true);}finally{b.disabled=false;}};
  $('cityResults').onchange=async e=>{if(e.target.value==='')return;const c=cities[Number(e.target.value)];if(!c)return;try{await save({location:c,weatherEnabled:true});$('weatherEnabled').checked=true;update(await app.api('/api/presence/weather','POST',{}));note('天气城市已保存。');}catch(err){note(err.message,true);}};
}
function start(){if(started)return;started=true;setInterval(clock,30000);app.api('/api/presence/weather','POST',{}).then(update).catch(()=>{});}
window.PhonePresence={init,update,fill,start};
})();

(function(root){
  function splitReply(text) {
    const value=String(text||'').replace(/\r\n?/g,'\n').trim();
    if(!value)return [];
    // Preserve code, links and structured replies as a single readable block.
    if(/```|https?:\/\/|^\s*(?:[-*#]|\d+[.)、])\s/m.test(value))return [value];
    const lines=value.split(/\n\s*\n|\n/).map(s=>s.trim()).filter(Boolean);
    if(lines.length>1)return lines;
    // A model may ignore separators. Split complete Chinese sentences without
    // changing text or cutting actions enclosed in parentheses.
    if(value.length<24)return [value];
    let depth=0,start=0;const sentences=[];
    for(let i=0;i<value.length;i++) {
      if('（('.includes(value[i]))depth++;
      if('）)'.includes(value[i]))depth=Math.max(0,depth-1);
      if(depth===0&&'。！？'.includes(value[i])) {
        while(i+1<value.length&&'。！？”’」』'.includes(value[i+1]))i++;
        sentences.push(value.slice(start,i+1));start=i+1;
      }
    }
    if(start<value.length)sentences.push(value.slice(start));
    if(sentences.length<2)return [value];
    const size=Math.ceil(sentences.length/4),parts=[];
    for(let i=0;i<sentences.length;i+=size)parts.push(sentences.slice(i,i+size).join(''));
    return parts.filter(s=>s.trim());
  }
  if(typeof module==='object'&&module.exports)module.exports=splitReply;
  else root.splitChatReply=splitReply;
})(typeof window==='object'?window:globalThis);

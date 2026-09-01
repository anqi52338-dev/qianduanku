import React, { useState, useEffect } from 'react';

export default function MomentsPage({ setActivePage, momentFeed, loadMoments, postMoment, momentText, setMomentText, momentImgData, setMomentImgData }) {
  const [localFeed, setLocalFeed] = useState([]);
  const momentImgRef = React.useRef(null);

  useEffect(() => {
    if (momentFeed && momentFeed.length > 0) {
      setLocalFeed(momentFeed);
    }
  }, [momentFeed]);

  const renderMoments = () => {
    const el = document.getElementById('momentFeed');
    if (!el) return;
    if (localFeed.length === 0) {
      el.innerHTML = '<div style="font-size:13px;color:var(--text-light)">还没有朋友圈动态</div>';
      return;
    }
    el.innerHTML = localFeed.map(m => `
      <div class="card">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <div style="width:36px;height:36px;border-radius:50%;background:var(--pink-soft);display:flex;align-items:center;justify-content:center;font-size:16px">${m.sender_type === 'user' ? '🌸' : '🤖'}</div>
          <div><div style="font-size:14px;font-weight:500">${m.sender_type === 'user' ? '我' : (m.agents?.name || '哥哥')}</div><div style="font-size:11px;color:var(--text-light)">${new Date(m.created_at).toLocaleString()}</div></div>
        </div>
        <div style="font-size:14px;line-height:1.5">${m.content || ''}</div>
        ${m.image ? `<img src="${m.image}" style="max-width:100%;border-radius:10px;margin-top:8px" />` : ''}
        <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border)">
          ${(m.moment_comments || []).map(c => `<div style="font-size:12px;color:var(--text-light)">${c.sender_type === 'user' ? '我' : (c.agents?.name || '哥哥')}：${c.content}</div>`).join('')}
        </div>
      </div>
    `).join('');
  };

  useEffect(() => {
    setTimeout(renderMoments, 100);
  }, [localFeed]);

  return (
    <div className="page show">
      <div className="page-head">
        <button className="back" onClick={() => setActivePage(null)}>← 返回</button>
        <div className="ptitle">朋友圈</div>
        <div style={{ width: '60px' }}></div>
      </div>
      <div className="page-body">
        <div className="card">
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '10px' }}>
            <textarea 
              id="momentText" 
              placeholder="这一刻的想法…" 
              value={momentText} 
              onChange={(e) => setMomentText(e.target.value)} 
              style={{ flex: 1, minHeight: '60px', margin: 0, border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 12px', fontSize: '14px', fontFamily: 'inherit', background: 'var(--pink-soft)', outline: 'none', resize: 'vertical' }} 
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
            <button onClick={() => momentImgRef.current?.click()} style={{ padding: '8px 12px', background: 'var(--pink-soft)', border: 'none', borderRadius: '10px', fontSize: '13px', color: 'var(--pink-text)', cursor: 'pointer' }}>＋ 图片</button>
            <span id="momentImgPreview" style={{ fontSize: '12px', color: 'var(--text-light)' }}>{momentImgData ? '已选1张图' : ''}</span>
            <button onClick={postMoment} style={{ marginLeft: 'auto', padding: '8px 16px', background: 'var(--pink-deep)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', cursor: 'pointer' }}>发布</button>
          </div>
        </div>
        <div id="momentFeed"></div>
      </div>
      <input type="file" ref={momentImgRef} className="hidden-file" accept="image/*" onChange={(e) => {
        const f = e.target.files[0];
        if (!f) return;
        const r = new FileReader();
        r.onload = (ev) => { 
          setMomentImgData(ev.target.result); 
          document.getElementById('momentImgPreview').textContent = '已选1张图';
          alert('图片已选');
        };
        r.readAsDataURL(f);
        e.target.value = '';
      }} />
    </div>
  );
}
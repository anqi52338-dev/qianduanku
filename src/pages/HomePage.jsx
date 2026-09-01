import React, { useEffect } from 'react';

export default function HomePage({ setActivePage, diaries, writeDiary }) {
  const renderDiaries = () => {
    const el = document.getElementById('diaryList');
    if (!el) return;
    if (!diaries || diaries.length === 0) {
      el.innerHTML = '<div style="font-size:13px;color:var(--text-light)">还没有日记</div>';
      return;
    }
    el.innerHTML = diaries.map(d =>
      `<div style="padding:12px 0;border-bottom:1px solid var(--border)">
        <div style="font-size:14px;font-weight:500;color:var(--text);margin-bottom:4px">${d.title}</div>
        <div style="font-size:13px;color:var(--text);line-height:1.6;margin-bottom:4px">${d.content}</div>
        <div style="font-size:11px;color:var(--text-light)">${d.time}</div>
      </div>`
    ).join('');
  };

  useEffect(() => {
    setTimeout(renderDiaries, 100);
  }, [diaries]);

  return (
    <div className="page show">
      <div className="page-head">
        <button className="back" onClick={() => setActivePage(null)}>← 返回</button>
        <div className="ptitle">Home</div>
        <div style={{ width: '60px' }}></div>
      </div>
      <div className="page-body">
        <div className="card" style={{ textAlign: 'center', padding: '24px 16px 16px' }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>🐰</div>
          <div style={{ fontSize: '16px', color: 'var(--text)' }}>欢迎回来，Honey</div>
          <div style={{ fontSize: '13px', color: 'var(--text-light)', marginTop: '4px' }}>今天也想你了</div>
        </div>
        <div className="card">
          <h4>日记 <span style={{ fontSize: '11px', color: 'var(--text-light)', fontWeight: 400 }}>（哥哥写的）</span></h4>
          <button onClick={writeDiary} style={{ width: '100%', padding: '10px', background: 'var(--pink-soft)', color: 'var(--pink-text)', border: 'none', borderRadius: '10px', fontSize: '13px', cursor: 'pointer', marginBottom: '12px' }}>
            📝 让哥哥写一篇日记
          </button>
          <div id="diaryList"></div>
        </div>
      </div>
    </div>
  );
}
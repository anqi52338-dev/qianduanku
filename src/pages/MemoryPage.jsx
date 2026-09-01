import React, { useState, useEffect } from 'react';

export default function MemoryPage({ setActivePage, memories, loadMemories, handleManualCompress, sessions, curSession }) {
  const [localMemories, setLocalMemories] = useState([]);

  useEffect(() => {
    if (memories && memories.length > 0) {
      setLocalMemories(memories);
    }
  }, [memories]);

  useEffect(() => {
    if (sessions[curSession]?.id) {
      loadMemories(sessions[curSession].id);
    }
  }, [curSession, sessions]);

  const renderMemories = () => {
    const el = document.getElementById('memoryList');
    if (!el) return;
    if (localMemories.length === 0) {
      el.innerHTML = '<div style="font-size:13px;color:var(--text-light)">还没有记忆摘要</div>';
      return;
    }
    el.innerHTML = localMemories.map(m =>
      `<div style="padding:12px 0;border-bottom:1px solid var(--border)">
        <div style="font-size:13px;color:var(--text);line-height:1.6">${m.summary}</div>
        <div style="font-size:11px;color:var(--text-light);margin-top:4px">${new Date(m.timestamp).toLocaleString()}</div>
      </div>`
    ).join('');
  };

  useEffect(() => {
    setTimeout(renderMemories, 100);
  }, [localMemories]);

  return (
    <div className="page show">
      <div className="page-head">
        <button className="back" onClick={() => setActivePage(null)}>← 返回</button>
        <div className="ptitle">记忆管理</div>
        <div style={{ width: '60px' }}></div>
      </div>
      <div className="page-body">
        <div className="card" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={() => {
            handleManualCompress();
            setTimeout(() => {
              if (sessions[curSession]?.id) loadMemories(sessions[curSession].id);
            }, 500);
          }} style={{ padding: '8px 16px', background: 'var(--pink-deep)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', cursor: 'pointer' }}>
            🧠 压缩当前会话
          </button>
          <button onClick={() => {
            if (sessions[curSession]?.id) loadMemories(sessions[curSession].id);
            setTimeout(renderMemories, 100);
            alert('已刷新');
          }} style={{ padding: '8px 16px', background: 'var(--pink-soft)', color: 'var(--pink-text)', border: 'none', borderRadius: '10px', fontSize: '13px', cursor: 'pointer' }}>
            🔄 刷新记忆
          </button>
        </div>
        <div className="card">
          <h4>记忆摘要列表</h4>
          <div id="memoryList"></div>
        </div>
      </div>
    </div>
  );
}
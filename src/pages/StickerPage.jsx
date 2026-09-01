import React, { useState } from 'react';

export default function StickerPage({ setActivePage, stickers, setStickers, sendSticker }) {
  const [pendingSticker, setPendingSticker] = useState(null);
  const stickerInputRef = React.useRef(null);

  const handleStickerUpload = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => setPendingSticker({ src: ev.target.result });
    r.readAsDataURL(f);
    e.target.value = '';
  };

  const confirmSticker = () => {
    if (!pendingSticker) { alert('请先选择图片'); return; }
    const nameInput = document.getElementById('stickerName');
    const emotionInput = document.getElementById('stickerEmotion');
    const name = nameInput?.value?.trim() || '未命名';
    const emotion = emotionInput?.value?.trim() || '开心';
    setStickers([...stickers, { src: pendingSticker.src, name, emotion }]);
    setPendingSticker(null);
    if (nameInput) nameInput.value = '';
    if (emotionInput) emotionInput.value = '';
    alert('表情已添加！');
  };

  return (
    <div className="page show">
      <div className="page-head">
        <button className="back" onClick={() => setActivePage(null)}>← 返回</button>
        <div className="ptitle">表情包</div>
        <div style={{ width: '60px' }}></div>
      </div>
      <div className="page-body">
        <div className="sticker-upload-area" onClick={() => stickerInputRef.current?.click()}>＋ 选择图片</div>
        <div className="card">
          <h4>表情名称</h4>
          <input type="text" id="stickerName" placeholder="例如：撒娇" style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--pink-soft)', fontSize: '14px', marginBottom: '10px' }} />
          <h4>情绪标签</h4>
          <select id="stickerEmotion" style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--pink-soft)', fontSize: '14px', marginBottom: '10px' }}>
            <option value="开心">开心</option>
            <option value="撒娇">撒娇</option>
            <option value="生气">生气</option>
            <option value="伤心">伤心</option>
            <option value="吃醋">吃醋</option>
            <option value="不想理人">不想理人</option>
            <option value="惊讶">惊讶</option>
            <option value="害羞">害羞</option>
          </select>
          <button className="save-btn" onClick={confirmSticker}>确认添加</button>
        </div>
        <div className="sticker-list">
          {stickers.map((s, i) => (
            <div key={i} className="sticker-item">
              <img src={s.src} onClick={() => sendSticker(s.src, s.name)} />
              <div className="info">
                <div className="name">{s.name}</div>
                <div className="desc">情绪：{s.emotion}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <input type="file" ref={stickerInputRef} className="hidden-file" accept="image/*" onChange={handleStickerUpload} />
    </div>
  );
}
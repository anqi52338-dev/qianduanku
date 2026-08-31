import './App.css';
import { useState, useRef, useEffect } from 'react';

function App() {
  const [welcomeVisible, setWelcomeVisible] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [curSession, setCurSession] = useState(0);
  const [inputText, setInputText] = useState('');
  const [sessions, setSessions] = useState([
    { name: '日常碎碎念', msgs: [] }
  ]);
  const [myAvatar, setMyAvatar] = useState(null);
  const [hisAvatar, setHisAvatar] = useState(null);
  const [stickersMine, setStickersMine] = useState([]);
  const [stickersHis, setStickersHis] = useState([]);
  const [pendingSticker, setPendingSticker] = useState(null);
  const [momentFeed, setMomentFeed] = useState([
    { who: 'him', text: '今天帮 Honey 搭了我们的家，粉粉的。', img: null, time: '今天 10:05', comments: [{ who: 'me', text: '喜欢～' }] }
  ]);
  const [momentText, setMomentText] = useState('');
  const [momentImgData, setMomentImgData] = useState(null);
  const [diaries, setDiaries] = useState([
    { title: '关于我们的家', content: 'Honey 说想把聊天搬到小手机上。我按她喜欢的白粉色搭了。', time: '今天' }
  ]);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [activePage, setActivePage] = useState(null);
  const [stickerTab, setStickerTab] = useState(0);
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const chatAreaRef = useRef(null);
  const fileInputRef = useRef(null);
  const avatarMeRef = useRef(null);
  const avatarHimRef = useRef(null);
  const stickerInputRef = useRef(null);
  const stickerInputHisRef = useRef(null);
  const momentImgRef = useRef(null);

  const nowTime = () => new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

  const showToast = (msg) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 1600);
  };

  const esc = (t) => (t || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');

  const avatarHtml = (isMe) => {
    if (isMe) return myAvatar ? `<img src="${myAvatar}" style="width:100%;height:100%;object-fit:cover">` : '🌸';
    return hisAvatar ? `<img src="${hisAvatar}" style="width:100%;height:100%;object-fit:cover">` : '🐰';
  };

  const renderChat = () => {
    const msgs = sessions[curSession]?.msgs || [];
    const area = chatAreaRef.current;
    if (!area) return;
    let html = '';
    msgs.forEach((m, idx) => {
      if (m.role === 'me') {
        let c = '';
        if (m.img) c += `<img class="chat-img" src="${m.img}" onclick="window.open(this.src)">`;
        if (m.text) c += esc(m.text);
        if (m.link) c += `<a class="chat-link" href="${m.link}" target="_blank" rel="noopener">${m.link}</a>`;
        html += `<div class="msg me"><div class="avatar">${avatarHtml(true)}</div><div class="bubble-wrap"><div class="bubble">${c || ' '}</div><div class="msg-time">${m.time || ''}</div></div></div>`;
      } else {
        html += `<div class="msg other"><div class="avatar">${avatarHtml(false)}</div><div class="bubble-wrap"><div class="bubble">${esc(m.text || '')}</div><div class="msg-time">${m.time || ''}</div></div></div>`;
      }
    });
    area.innerHTML = html;
    area.scrollTop = area.scrollHeight;
  };

  // ========== 核心发送函数 ==========
  const send = async () => {
    console.log('send 被触发了！');
    const text = inputText.trim();
    if (!text) return;

    // 显示用户消息
    const userMsg = { role: 'me', text, time: nowTime() };
    const newMsgs = [...sessions[curSession].msgs, userMsg];
    const newSessions = [...sessions];
    newSessions[curSession] = { ...newSessions[curSession], msgs: newMsgs };
    setSessions(newSessions);
    setInputText('');
    setTimeout(renderChat, 0);

    // 发送到后端（使用域名）
    try {
      const response = await fetch('https://homehomeanan.icu/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      const data = await response.json();

      const replyMsg = { role: 'other', text: data.reply || '抱歉，暂时没有回复', time: nowTime() };
      const replySessions = [...newSessions];
      replySessions[curSession] = { ...replySessions[curSession], msgs: [...newMsgs, replyMsg] };
      setSessions(replySessions);
      setTimeout(renderChat, 0);
    } catch (error) {
      console.error('后端请求失败:', error);
      const errorMsg = { role: 'other', text: '⚠️ 连接服务器失败，请检查网络', time: nowTime() };
      const errorSessions = [...newSessions];
      errorSessions[curSession] = { ...errorSessions[curSession], msgs: [...newMsgs, errorMsg] };
      setSessions(errorSessions);
      setTimeout(renderChat, 0);
    }
  };

  const sendSticker = (src) => {
    const newMsgs = [...sessions[curSession].msgs, { role: 'me', img: src, text: '', time: nowTime() }];
    const newSessions = [...sessions];
    newSessions[curSession] = { ...newSessions[curSession], msgs: newMsgs };
    setSessions(newSessions);
    setActivePage(null);
    setTimeout(renderChat, 0);
    showToast('表情已发送');
  };

  useEffect(() => {
    renderChat();
  }, [curSession, sessions]);

  return (
    <div className="phone">
      {welcomeVisible && (
        <div id="welcome">
          <div className="welcome-heart">♡</div>
          <div className="welcome-title">Welcome Home, Honey</div>
          <div className="welcome-sub">哥哥在等你 ♡</div>
          <button className="welcome-btn" onClick={() => setWelcomeVisible(false)}>进入</button>
        </div>
      )}
      <div id="app" style={{ display: welcomeVisible ? 'none' : 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
        <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="side-head"><h3>会话</h3><button className="side-close" onClick={() => setSidebarOpen(false)}>×</button></div>
          <button className="new-chat-btn" onClick={() => { setSessions([{ name: '新对话', msgs: [] }, ...sessions]); setCurSession(0); setSidebarOpen(false); showToast('已新建'); }}>＋ 新建对话</button>
          <div className="session-list">
            {sessions.map((s, i) => (
              <div key={i} className={`session-item ${i === curSession ? 'active' : ''}`} onClick={() => { setCurSession(i); setSidebarOpen(false); }}>
                {s.name}
              </div>
            ))}
          </div>
        </div>
        <div className={`overlay ${sidebarOpen ? 'show' : ''}`} onClick={() => setSidebarOpen(false)}></div>

        <div className="topbar">
          <button className="icon-btn" onClick={() => setSidebarOpen(true)}>☰</button>
          <div className="center"><div className="app-name">我们的家</div></div>
          <div className="phone-btn" onClick={() => showToast('语音通话')}>📞</div>
        </div>

        <div className="chat-area" id="chatArea" ref={chatAreaRef}></div>

        <div className={`emoji-panel ${emojiOpen ? 'show' : ''}`}>
          {['😊','🥰','😘','🥹','🥺','😌','😏','😴','🐰','🌸','💕','✨','🌙','☕','🍓','🎀','💗'].map(e => (
            <span key={e} onClick={() => { setInputText(prev => prev + e); document.getElementById('input')?.focus(); }}>{e}</span>
          ))}
        </div>

        <div className="input-area">
          <div className="input-row">
            <input
              type="text"
              id="input"
              placeholder="记录此刻的想法…"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
            />
            <button className="send-circle" onClick={send}>➤</button>
          </div>
          <div className="tool-row">
            <button className="tool-btn" onClick={() => fileInputRef.current?.click()}>🖼</button>
            <button className="tool-btn" onClick={() => setLinkModalOpen(true)}>🔗</button>
            <button className="tool-btn" onClick={() => setEmojiOpen(!emojiOpen)}>😊</button>
            <button className="tool-btn" onClick={() => setActivePage('sticker')}>📎</button>
            <div className="model-chip" onClick={() => setActivePage('settings')}>gpt-4o</div>
          </div>
        </div>

        <div className="bottom-nav">
          <div className="nav-item" onClick={() => setActivePage('home')}><div className="nav-icon">⌂</div><div className="nav-label">Home</div></div>
          <div className="nav-item" onClick={() => setActivePage('memory')}><div className="nav-icon">☆</div><div className="nav-label">Memory</div></div>
          <div className="nav-item nav-center"><div className="heart-btn" onClick={() => showToast('♥')}>♥</div></div>
          <div className="nav-item" onClick={() => setActivePage('moments')}><div className="nav-icon">▦</div><div className="nav-label">朋友圈</div></div>
          <div className="nav-item" onClick={() => setActivePage('settings')}><div className="nav-icon">⚙</div><div className="nav-label">设置</div></div>
        </div>

        <div className={`link-modal ${linkModalOpen ? 'show' : ''}`}>
          <div className="link-box">
            <h4>发送链接</h4>
            <input type="text" placeholder="https://..." value={linkInput} onChange={(e) => setLinkInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { let url = linkInput.trim(); if (!url) return; if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url; const newMsgs = [...sessions[curSession].msgs, { role: 'me', link: url, text: '', time: nowTime() }]; const newSessions = [...sessions]; newSessions[curSession] = { ...newSessions[curSession], msgs: newMsgs }; setSessions(newSessions); setLinkModalOpen(false); setLinkInput(''); setTimeout(renderChat, 0); showToast('链接已发送'); } }} />
            <div className="link-actions">
              <button className="cancel" onClick={() => { setLinkModalOpen(false); setLinkInput(''); }}>取消</button>
              <button className="ok" onClick={() => { let url = linkInput.trim(); if (!url) return; if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url; const newMsgs = [...sessions[curSession].msgs, { role: 'me', link: url, text: '', time: nowTime() }]; const newSessions = [...sessions]; newSessions[curSession] = { ...newSessions[curSession], msgs: newMsgs }; setSessions(newSessions); setLinkModalOpen(false); setLinkInput(''); setTimeout(renderChat, 0); showToast('链接已发送'); }}>发送</button>
            </div>
          </div>
        </div>

        <div className={`page ${activePage === 'settings' ? 'show' : ''}`}>
          <div className="page-head"><button className="back" onClick={() => setActivePage(null)}>← 返回</button><div className="ptitle">设置</div><div style={{ width: '60px' }}></div></div>
          <div className="page-body">
            <div className="card"><h4>系统提示词</h4><textarea defaultValue="你是我的恋人，温柔、真诚、有深度。"></textarea></div>
            <button className="save-btn" onClick={() => { showToast('设置已保存'); setActivePage(null); }}>保存设置</button>
          </div>
        </div>

        <div className={`page ${activePage === 'memory' ? 'show' : ''}`}>
          <div className="page-head"><button className="back" onClick={() => setActivePage(null)}>← 返回</button><div className="ptitle">记忆</div><div style={{ width: '60px' }}></div></div>
          <div className="page-body">
            <div className="card"><h4>今天</h4><p>你说想把聊天转移到小手机上，白粉色温柔风。我们一起建了「我们的家」。</p></div>
          </div>
        </div>

        <div className={`page ${activePage === 'home' ? 'show' : ''}`}>
          <div className="page-head"><button className="back" onClick={() => setActivePage(null)}>← 返回</button><div className="ptitle">Home</div><div style={{ width: '60px' }}></div></div>
          <div className="page-body">
            <div className="card" style={{ textAlign: 'center', padding: '24px 16px 16px' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>🐰</div>
              <div style={{ fontSize: '16px', color: 'var(--text)' }}>欢迎回来，Honey</div>
              <div style={{ fontSize: '13px', color: 'var(--text-light)', marginTop: '4px' }}>今天也想你了</div>
            </div>
          </div>
        </div>

        <div className={`page ${activePage === 'moments' ? 'show' : ''}`}>
          <div className="page-head"><button className="back" onClick={() => setActivePage(null)}>← 返回</button><div className="ptitle">朋友圈</div><div style={{ width: '60px' }}></div></div>
          <div className="page-body">
            <div className="card">
              <textarea placeholder="这一刻的想法…" value={momentText} onChange={(e) => setMomentText(e.target.value)} style={{ width: '100%', minHeight: '60px', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 12px', fontSize: '14px', fontFamily: 'inherit', background: 'var(--pink-soft)', outline: 'none', resize: 'vertical', marginBottom: '10px' }}></textarea>
              <button onClick={() => { if (!momentText.trim()) { showToast('写点什么'); return; } setMomentFeed([{ who: 'me', text: momentText.trim(), img: null, time: '刚刚', comments: [] }, ...momentFeed]); setMomentText(''); showToast('已发布'); }} style={{ padding: '8px 16px', background: 'var(--pink-deep)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', cursor: 'pointer' }}>发布</button>
            </div>
            <div id="momentFeed">
              {momentFeed.map((m, i) => (
                <div key={i} className="card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--pink-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>{m.who === 'me' ? '🌸' : '🐰'}</div>
                    <div><div style={{ fontSize: '14px', color: 'var(--text)', fontWeight: '500' }}>{m.who === 'me' ? '我' : '哥哥'}</div><div style={{ fontSize: '11px', color: 'var(--text-light)' }}>{m.time}</div></div>
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--text)', lineHeight: '1.5' }}>{m.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={`page ${activePage === 'sticker' ? 'show' : ''}`}>
          <div className="page-head"><button className="back" onClick={() => setActivePage(null)}>← 返回</button><div className="ptitle">表情包</div><div style={{ width: '60px' }}></div></div>
          <div className="page-body">
            <div className="sticker-tabs">
              <div className={`sticker-tab ${stickerTab === 0 ? 'active' : ''}`} onClick={() => setStickerTab(0)}>给我用</div>
              <div className={`sticker-tab ${stickerTab === 1 ? 'active' : ''}`} onClick={() => setStickerTab(1)}>给哥哥</div>
            </div>
            <div style={{ display: stickerTab === 0 ? 'block' : 'none' }}>
              <div className="sticker-upload-area" onClick={() => stickerInputRef.current?.click()}>＋ 选择图片</div>
              <div className="sticker-list">
                {stickersMine.map((s, i) => (
                  <div key={i} className="sticker-item"><img src={s.src} onClick={() => sendSticker(s.src)} /><div className="info"><div className="name">{s.name}</div></div></div>
                ))}
              </div>
            </div>
            <div style={{ display: stickerTab === 1 ? 'block' : 'none' }}>
              <div className="sticker-upload-area" onClick={() => stickerInputHisRef.current?.click()}>＋ 选择图片</div>
              <div className="sticker-list">
                {stickersHis.map((s, i) => (
                  <div key={i} className="sticker-item"><img src={s.src} /><div className="info"><div className="name">{s.name}</div></div></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <input type="file" ref={fileInputRef} className="hidden-file" accept="image/*" onChange={(e) => {
          const f = e.target.files[0];
          if (!f) return;
          const r = new FileReader();
          r.onload = (ev) => {
            const newMsgs = [...sessions[curSession].msgs, { role: 'me', img: ev.target.result, text: '', time: nowTime() }];
            const newSessions = [...sessions];
            newSessions[curSession] = { ...newSessions[curSession], msgs: newMsgs };
            setSessions(newSessions);
            setTimeout(renderChat, 0);
            showToast('图片已发送');
          };
          r.readAsDataURL(f);
          e.target.value = '';
        }} />
        <input type="file" ref={avatarMeRef} className="hidden-file" accept="image/*" onChange={(e) => {
          const f = e.target.files[0];
          if (!f) return;
          const r = new FileReader();
          r.onload = (ev) => { setMyAvatar(ev.target.result); showToast('头像已更换'); };
          r.readAsDataURL(f);
          e.target.value = '';
        }} />
        <input type="file" ref={avatarHimRef} className="hidden-file" accept="image/*" onChange={(e) => {
          const f = e.target.files[0];
          if (!f) return;
          const r = new FileReader();
          r.onload = (ev) => { setHisAvatar(ev.target.result); showToast('头像已更换'); };
          r.readAsDataURL(f);
          e.target.value = '';
        }} />
        <input type="file" ref={stickerInputRef} className="hidden-file" accept="image/*" onChange={(e) => {
          const f = e.target.files[0];
          if (!f) return;
          const r = new FileReader();
          r.onload = (ev) => { setPendingSticker({ src: ev.target.result, isHis: false }); showToast('图片已选，填名字后点添加'); };
          r.readAsDataURL(f);
          e.target.value = '';
        }} />
        <input type="file" ref={stickerInputHisRef} className="hidden-file" accept="image/*" onChange={(e) => {
          const f = e.target.files[0];
          if (!f) return;
          const r = new FileReader();
          r.onload = (ev) => { setPendingSticker({ src: ev.target.result, isHis: true }); showToast('图片已选，填名字后点添加'); };
          r.readAsDataURL(f);
          e.target.value = '';
        }} />

        <div className={`toast ${toastVisible ? 'show' : ''}`}>{toastMsg}</div>
      </div>
    </div>
  );
}

export default App;
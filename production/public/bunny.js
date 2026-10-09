// 浮雕徽章兔：象牙白的侧影浮在粉色底上，外圈浅金珠边。封面用椭圆大徽章，头像用圆形小徽章。
(() => {
  const defs = `<defs>
    <radialGradient id="cameoGround" cx="50%" cy="38%" r="75%"><stop offset="0" stop-color="#fdeeee"/><stop offset=".7" stop-color="#f4d3d6"/><stop offset="1" stop-color="#e9bcc2"/></radialGradient>
    <linearGradient id="cameoGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f1e3bf"/><stop offset=".5" stop-color="#cdb07a"/><stop offset="1" stop-color="#ecdcb4"/></linearGradient>
    <linearGradient id="cameoIvory" gradientUnits="userSpaceOnUse" x1="20" y1="10" x2="100" y2="125"><stop offset="0" stop-color="#fffefb"/><stop offset="1" stop-color="#f3e4d6"/></linearGradient>
    <filter id="cameoRelief" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="1.4" dy="2" stdDeviation="1.3" flood-color="#a8687a" flood-opacity=".5"/></filter>
  </defs>`;

  // 坐姿侧影，画在 120×125 的格子里，面朝左
  const hare = `<g filter="url(#cameoRelief)"><g fill="url(#cameoIvory)">
      <ellipse cx="58" cy="33" rx="5.6" ry="21" transform="rotate(30 58 33)"/>
      <ellipse cx="47" cy="29" rx="6.2" ry="22" transform="rotate(11 47 29)"/>
      <ellipse cx="41" cy="58" rx="17" ry="13.5" transform="rotate(-14 41 58)"/>
      <ellipse cx="28.500" cy="64" rx="8.500" ry="6.800"/>
      <ellipse cx="50" cy="77" rx="15" ry="16"/>
      <ellipse cx="46" cy="97" rx="14" ry="20"/>
      <ellipse cx="68" cy="92" rx="30" ry="26"/>
      <ellipse cx="80" cy="101" rx="20" ry="18"/>
      <circle cx="100" cy="103" r="7.500"/>
      <ellipse cx="40" cy="117" rx="10" ry="4.600"/>
      <ellipse cx="76" cy="118" rx="18" ry="5"/>
    </g></g>
    <g fill="none" stroke="#d9c2ad" stroke-width="1.100" stroke-linecap="round">
      <path d="M47.500 14c2.500 9 2.500 20-.500 30"/><path d="M62 20c-1 8-4 16-8 23"/>
      <path d="M64 104c2-11 11-18 22-17"/><path d="M36 100c1 6 4 11 8 14"/><path d="M33 68c3 2 7 2.500 10 1"/>
    </g>
    <ellipse cx="36" cy="56.500" rx="2.600" ry="2.900" fill="#8a6548"/><circle cx="35.200" cy="55.600" r=".9" fill="#fffefb"/>
    <path d="M21.500 62.500q1.800 1.600 3.600.400" fill="none" stroke="#d3a3a8" stroke-width="1.100" stroke-linecap="round"/>
    <g stroke="#b3935a" stroke-width=".7" stroke-linejoin="round"><path d="M50 73c-6-5-12-3-11 2s7 5 11-2zM50 73c5-6 12-5 12 0s-7 6-12 0z" fill="#f5c4cd"/><path d="M48 76l-4 10 4-2 2 3 1-11zM52 76l5 9-4-1-1 4-2-12z" fill="#f1b6c2"/><circle cx="50" cy="73.500" r="2.800" fill="#e9a3b2"/></g>`;

  const ring = (cx, cy, rx, ry, n) => Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2; return `<circle cx="${(cx + rx * Math.cos(a)).toFixed(1)}" cy="${(cy + ry * Math.sin(a)).toFixed(1)}" r="1.700"/>`; }).join('');
  // 一侧的月桂枝：叶子沿着椭圆下缘排开
  const laurel = (cx, cy, rx, ry, flip) => Array.from({ length: 7 }, (_, i) => {
    const a = (100 + i * 11) * Math.PI / 180; const x = cx + (flip ? -1 : 1) * rx * Math.cos(a); const y = cy + ry * Math.sin(a);
    // 叶子顺着枝条的方向斜出去，而不是朝圆心
    const rot = Math.atan2(y - cy, x - cx) * 180 / Math.PI + 90 + (flip ? 28 : -28);
    return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="5.200" ry="2" transform="rotate(${rot.toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
  }).join('') + `<path d="M${cx + (flip ? -1 : 1) * rx * Math.cos(100 * Math.PI / 180)} ${cy + ry * Math.sin(100 * Math.PI / 180)}A${rx} ${ry} 0 0 ${flip ? 1 : 0} ${cx + (flip ? -1 : 1) * rx * Math.cos(166 * Math.PI / 180)} ${cy + ry * Math.sin(166 * Math.PI / 180)}" fill="none"/>`;

  window.Bunny = {
    cover: () => `<svg viewBox="0 0 180 230" role="img" aria-label="兔子浮雕徽章">${defs}
      <ellipse cx="90" cy="122" rx="78" ry="98" fill="#fffdf9" stroke="url(#cameoGold)" stroke-width="2.500"/>
      <g fill="#f3e6c6" stroke="#c4a56a" stroke-width=".6">${ring(90, 122, 71.500, 91.500, 64)}</g>
      <ellipse cx="90" cy="122" rx="64" ry="84" fill="url(#cameoGround)" stroke="url(#cameoGold)" stroke-width="3"/>
      <ellipse cx="90" cy="122" rx="59.500" ry="79.500" fill="none" stroke="#fffdf9" stroke-opacity=".7" stroke-width="1"/>
      <g fill="#f0e2bd" stroke="#bfa066" stroke-width=".6" opacity=".95">${laurel(90, 122, 50, 68, false)}${laurel(90, 122, 50, 68, true)}</g>
      <g transform="translate(34 46) scale(.93)">${hare}</g>
      <g fill="#f5c4cd" stroke="#b3935a" stroke-width="1" stroke-linejoin="round" transform="translate(60 6)"><path d="M30 14C22 4 8 2 4 8c-3 5 2 13 12 13 5 0 10-3 14-7zM30 14c8-10 22-12 26-6 3 5-2 13-12 13-5 0-10-3-14-7z"/><path d="M26 17l-8 15 7-3 3 4 2-14zM34 17l8 15-7-3-3 4-2-14z" fill="#f1b6c2"/><circle cx="30" cy="14" r="5" fill="#e9a3b2"/></g>
    </svg>`,
    avatar: () => `<svg viewBox="0 0 120 120" role="img" aria-label="兔子徽章">${defs}
      <circle cx="60" cy="60" r="60" fill="url(#cameoGold)"/><circle cx="60" cy="60" r="55.500" fill="url(#cameoGround)"/>
      <circle cx="60" cy="60" r="52" fill="none" stroke="#fffdf9" stroke-opacity=".7" stroke-width="1"/>
      <g transform="translate(13 9) scale(.8)">${hare}</g>
    </svg>`,
  };
})();

/* 结局卡：用 canvas 生成 750x1200 的分享图 */
window.MPShare = (function () {
  const W = 750, H = 1200;
  const RARITY = { 1: '常见', 2: '少见', 3: '稀有', 4: '传说' };
  const RARITY_COLOR = { 1: '#9fb3c8', 2: '#7ec8ff', 3: '#c9a0ff', 4: '#f2b134' };
  const SITE = (location.protocol.startsWith('http') ? location.origin + location.pathname : '墨漂模拟器');

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  const NO_LEAD = '，。、；：？！”’）》」』,.;:?!)';
  function wrap(ctx, text, maxW) {
    const lines = []; let line = '';
    for (const ch of text) {
      if (ch === '\n') { lines.push(line); line = ''; continue; }
      const t = line + ch;
      // 标点不能落在行首
      if (ctx.measureText(t).width > maxW && line && NO_LEAD.indexOf(ch) < 0) { lines.push(line); line = ch; } else line = t;
    }
    if (line) lines.push(line);
    return lines;
  }
  const FONT = '"PingFang SC","Hiragino Sans GB","Noto Sans CJK SC","Microsoft YaHei",sans-serif';

  async function render(state) {
    const e = state.ending, sm = MP.summary(state);
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const ctx = c.getContext('2d');

    // 背景
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#1b2a3a'); g.addColorStop(1, '#2d4a63');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = .16; ctx.fillStyle = '#f2b134';
    ctx.beginPath(); ctx.arc(W - 60, 90, 180, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = .1; ctx.fillStyle = '#7ec8ff';
    ctx.beginPath(); ctx.arc(80, H - 160, 220, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;

    // 标题
    ctx.fillStyle = '#fff'; ctx.textAlign = 'left';
    ctx.font = `bold 34px ${FONT}`; ctx.fillText('🚋 墨漂模拟器', 56, 86);
    ctx.font = `20px ${FONT}`; ctx.fillStyle = 'rgba(255,255,255,.65)';
    ctx.fillText('Melbourne Life Restart', 56, 118);

    // 身份
    ctx.font = `24px ${FONT}`; ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.fillText(`${state.identity.emoji} ${state.identity.name} · 在墨 ${sm.years} 年 · ${sm.age} 岁`, 56, 190);

    // 稀有度
    ctx.textAlign = 'center';
    const rl = `${RARITY[e.rarity]}结局`;
    ctx.font = `bold 22px ${FONT}`;
    const rw = ctx.measureText(rl).width + 44;
    roundRect(ctx, W / 2 - rw / 2, 270, rw, 42, 21);
    ctx.fillStyle = RARITY_COLOR[e.rarity]; ctx.fill();
    ctx.fillStyle = e.rarity >= 2 ? '#1b2a3a' : '#fff'; ctx.fillText(rl, W / 2, 299);

    // 结局
    ctx.font = `120px ${FONT}`; ctx.fillText(e.emoji, W / 2, 450);
    ctx.fillStyle = '#fff'; ctx.font = `bold 68px ${FONT}`; ctx.fillText(e.name, W / 2, 550);
    ctx.font = `28px ${FONT}`; ctx.fillStyle = 'rgba(255,255,255,.9)';
    const lines = wrap(ctx, e.quote, W - 140);
    lines.forEach((l, i) => ctx.fillText(l, W / 2, 620 + i * 44));

    // 数据
    const stats = [[sm.years, '在墨年数'], [sm.moves, '搬家次数'], [sm.hotpot, '火锅次数'], [sm.fines, '罚款次数']];
    const sy = 840, sw = (W - 112 - 36) / 4;
    stats.forEach(([v, n], i) => {
      const x = 56 + i * (sw + 12);
      roundRect(ctx, x, sy, sw, 110, 18); ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.fill();
      ctx.fillStyle = '#f2b134'; ctx.font = `bold 42px ${FONT}`; ctx.fillText(String(v), x + sw / 2, sy + 58);
      ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.font = `20px ${FONT}`; ctx.fillText(n, x + sw / 2, sy + 92);
    });

    // 属性
    const ay = 990;
    ctx.font = `20px ${FONT}`;
    MP.ATTRS.forEach((a, i) => {
      const x = 56 + i * ((W - 112) / 5) + ((W - 112) / 10);
      ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillText(a.name, x, ay);
      ctx.fillStyle = '#fff'; ctx.font = `bold 30px ${FONT}`; ctx.fillText(String(state.attrs[a.key]), x, ay + 38);
      ctx.font = `20px ${FONT}`;
    });

    // 底部
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.font = `22px ${FONT}`;
    ctx.fillText('你能在墨尔本漂出什么结局？', 56, H - 92);
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.font = `18px ${FONT}`;
    ctx.fillText(SITE.length > 46 ? SITE.slice(0, 46) + '…' : SITE, 56, H - 58);

    // 二维码（库加载失败就跳过）
    try {
      if (window.qrcode && location.protocol.startsWith('http')) {
        const qr = window.qrcode(0, 'M'); qr.addData(SITE); qr.make();
        const n = qr.getModuleCount(), size = 120, cell = size / n, qx = W - 56 - size, qy = H - 60 - size;
        roundRect(ctx, qx - 10, qy - 10, size + 20, size + 20, 12); ctx.fillStyle = '#fff'; ctx.fill();
        ctx.fillStyle = '#1b2a3a';
        for (let r = 0; r < n; r++) for (let col = 0; col < n; col++) if (qr.isDark(r, col)) ctx.fillRect(qx + col * cell, qy + r * cell, cell + .5, cell + .5);
      }
    } catch (err) { /* ignore */ }

    return c.toDataURL('image/png');
  }
  return { render };
})();

/* 墨漂模拟器 · UI 层 */
(function () {
  const $ = (sel) => document.querySelector(sel);
  const screens = ['start', 'identity', 'points', 'life', 'ending', 'gallery'];
  let state = null;
  let alloc = {};
  let chosenIdentity = null;
  let busy = false;
  const RARITY = { 1: '常见', 2: '少见', 3: '稀有', 4: '传说' };

  function show(name) {
    screens.forEach(n => $('#screen-' + n).classList.toggle('active', n === name));
    $('#hud').classList.toggle('hidden', name !== 'life');
    window.scrollTo(0, 0);
  }

  /* ---------- 开始页 ---------- */
  function renderStart() {
    const st = MP.stats();
    const total = (window.MP_ENDINGS || []).filter(e => e.id !== 'ordinary').length;
    const got = Object.keys(st.endings).length;
    $('#start-stats').textContent = st.plays
      ? `你已经重开 ${st.plays} 次，解锁 ${got}/${total + 1} 种结局`
      : '还没有人替你活过这一生';
  }

  /* ---------- 身份 ---------- */
  function renderIdentities() {
    const box = $('#identity-list');
    box.innerHTML = '';
    MP_IDENTITIES.forEach(idn => {
      const btn = document.createElement('button');
      btn.className = 'identity-card';
      const bonus = MP.ATTRS.map(a => {
        const v = idn.base[a.key] || 0;
        if (!v) return '';
        return `<span class="tag ${v > 0 ? 'up' : 'down'}">${a.name} ${v > 0 ? '+' : ''}${v}</span>`;
      }).join('');
      btn.innerHTML = `<div class="identity-emoji">${idn.emoji}</div>
        <div class="identity-body"><div class="identity-name">${idn.name}</div>
        <div class="identity-desc">${idn.desc}</div><div class="identity-bonus">${bonus}</div></div>`;
      btn.onclick = () => { chosenIdentity = idn; resetAlloc(); renderPoints(); show('points'); };
      box.appendChild(btn);
    });
  }

  /* ---------- 加点 ---------- */
  function resetAlloc() { alloc = {}; MP.ATTRS.forEach(a => alloc[a.key] = 0); }
  function pointsLeft() { return MP.ALLOC_POINTS - MP.ATTRS.reduce((t, a) => t + alloc[a.key], 0); }
  function renderPoints() {
    const box = $('#points-list');
    box.innerHTML = '';
    const left = pointsLeft();
    MP.ATTRS.forEach(a => {
      const row = document.createElement('div');
      row.className = 'point-row';
      const v = alloc[a.key];
      row.innerHTML = `<div class="point-label">${a.name}<small>${a.hint}</small></div>
        <button class="point-btn" data-k="${a.key}" data-d="-1" ${v <= 0 ? 'disabled' : ''}>−</button>
        <div class="point-bar"><i style="width:${v * 10}%"></i></div>
        <div class="point-val">${v}</div>
        <button class="point-btn" data-k="${a.key}" data-d="1" ${v >= MP.ALLOC_MAX || left <= 0 ? 'disabled' : ''}>+</button>`;
      box.appendChild(row);
    });
    box.querySelectorAll('.point-btn').forEach(b => b.onclick = () => {
      alloc[b.dataset.k] += Number(b.dataset.d);
      renderPoints();
    });
    $('#points-left').textContent = left;
    $('#btn-begin').disabled = left !== 0;
  }
  function randomAlloc() {
    resetAlloc();
    let n = MP.ALLOC_POINTS;
    while (n > 0) {
      const a = MP.ATTRS[Math.floor(Math.random() * MP.ATTRS.length)];
      if (alloc[a.key] < MP.ALLOC_MAX) { alloc[a.key]++; n--; }
    }
    renderPoints();
  }

  /* ---------- HUD ---------- */
  function renderHud(fxList) {
    if (!state) return;
    $('#hud-identity').textContent = `${state.identity.emoji} ${state.identity.name} · ${state.age} 岁`;
    $('#hud-year').textContent = state.year ? `在墨第 ${state.year} 年` : '落地中';
    const box = $('#hud-attrs');
    box.innerHTML = MP.ATTRS.map(a => `<div class="hud-attr">${a.name}<b data-k="${a.key}">${state.attrs[a.key]}</b></div>`).join('');
    (fxList || []).forEach(f => {
      if (f.kind !== 'attr') return;
      const el = box.querySelector(`b[data-k="${f.key}"]`);
      if (el) { el.classList.add(f.v > 0 ? 'flash-up' : 'flash-down'); setTimeout(() => el.classList.remove('flash-up', 'flash-down'), 900); }
    });
  }

  /* ---------- 人生日志 ---------- */
  function fxChips(fx) {
    if (!fx || !fx.length) return '';
    return '<div class="evt-fx">' + fx.map(f => {
      if (f.kind === 'attr') return `<span class="fx ${f.v > 0 ? 'up' : 'down'}">${f.name} ${f.v > 0 ? '+' : ''}${f.v}</span>`;
      if (f.kind === 'flag') return `<span class="fx up">🏷 ${f.name}</span>`;
      if (f.kind === 'counter') return `<span class="fx">${f.name} +${f.v}</span>`;
      return '';
    }).join('') + '</div>';
  }
  const STAGE_NAME = { land: '落地期', grow: '发展期', settle: '定居期' };
  function seasonTag(entry) {
    if (!entry.seasonal) return '';
    return `<span class="season-tag">${entry.ev.seasonName || '限定'}</span>`;
  }
  function appendEntry(entry) {
    const log = $('#life-log');
    let el;
    if (entry.type === 'year') {
      el = document.createElement('div');
      el.className = 'year-tag';
      el.textContent = `第 ${entry.year} 年 · ${entry.age} 岁 · ${STAGE_NAME[entry.stage]}`;
      if (entry.fx && entry.fx.length) {
        const y = document.createElement('div');
        y.className = 'year-fx';
        y.innerHTML = '年度结算 ' + fxChips(entry.fx);
        log.appendChild(el); el = y;
      }
    } else if (entry.type === 'event') {
      el = document.createElement('div');
      el.className = 'evt' + (entry.seasonal ? ' seasonal' : '');
      el.innerHTML = seasonTag(entry) + `<p class="evt-text">${entry.text}</p>${fxChips(entry.fx)}`;
    } else if (entry.type === 'choice') {
      el = document.createElement('div');
      el.className = 'evt choice-made' + (entry.seasonal ? ' seasonal' : '');
      el.innerHTML = seasonTag(entry) + `<p class="evt-text">${entry.text}</p>`;
      el.id = 'evt-pending';
    } else if (entry.type === 'result') {
      const pend = $('#evt-pending');
      if (pend) {
        pend.id = '';
        pend.className = 'evt ' + (entry.ok === null ? 'choice-made' : entry.ok ? 'result-ok' : 'result-bad');
        pend.innerHTML += `<p class="evt-sub">▸ 你选择：${entry.choice.text}</p>` +
          (entry.text ? `<p class="evt-sub">${entry.text}</p>` : '') + fxChips(entry.fx);
      }
    }
    if (el) log.appendChild(el);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }
  function syncPadding() {
    const h = $('#life-controls').offsetHeight || 80;
    $('#life-log').style.paddingBottom = (h + 24) + 'px';
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }
  window.addEventListener('resize', () => { if ($('#screen-life').classList.contains('active')) syncPadding(); });
  function renderChoices(ev) {
    const box = $('#choice-box');
    box.innerHTML = '';
    ev.choices.forEach((c, i) => {
      const b = document.createElement('button');
      b.className = 'choice-btn';
      let hint = c.hint || '';
      if (c.roll) {
        const p = Math.round(MP.rollChance(state, c.roll) * 100);
        const an = MP.ATTRS.find(a => a.key === c.roll.stat);
        hint = `${an ? an.name : ''}判定 · 成功率约 ${p}%` + (hint ? ' · ' + hint : '');
      }
      b.innerHTML = c.text + (hint ? `<small>${hint}</small>` : '');
      b.onclick = () => {
        box.classList.add('hidden');
        $('#btn-next').classList.remove('hidden');
        const entry = MP.choose(state, i);
        appendEntry(entry);
        renderHud(entry.fx);
        syncPadding();
        if (state.over) setTimeout(showEnding, 900);
      };
      box.appendChild(b);
    });
    box.classList.remove('hidden');
    $('#btn-next').classList.add('hidden');
    syncPadding();
  }
  function next() {
    if (busy || !state || state.over) return;
    const entry = MP.step(state);
    if (entry.type === 'end') { showEnding(); return; }
    appendEntry(entry);
    if (entry.type === 'choice') { renderChoices(entry.ev); return; }
    renderHud(entry.fx);
    if (state.over) { setTimeout(showEnding, 900); return; }
    // 年份标签自动带出第一条事件，减少点击
    if (entry.type === 'year') { busy = true; setTimeout(() => { busy = false; next(); }, 350); }
  }

  /* ---------- 结局 ---------- */
  function showEnding() {
    if (!state || !state.ending) return;
    const e = state.ending;
    const st = MP.stats();
    const firstTime = (st.endings[e.id] || 0) === 1;
    $('#ending-card').innerHTML = `
      <span class="ending-rarity r${e.rarity}">${RARITY[e.rarity]}结局</span>
      <div class="ending-emoji">${e.emoji}</div>
      <div class="ending-name">${e.name}</div>
      <p class="ending-quote">${e.quote}</p>
      ${firstTime ? '<div class="ending-first">✦ 首次解锁</div>' : ''}`;
    const sm = MP.summary(state);
    $('#ending-stats').innerHTML = [
      [sm.years, '在墨年数'], [sm.moves, '搬家次数'], [sm.hotpot, '火锅次数'], [sm.fines, '罚款次数'],
    ].map(([v, n]) => `<div class="stat"><b>${v}</b><span>${n}</span></div>`).join('');
    $('#share-preview').classList.add('hidden');
    show('ending');
  }
  async function makeCard() {
    const btn = $('#btn-share');
    btn.disabled = true; btn.textContent = '生成中…';
    try {
      const url = await MPShare.render(state);
      $('#share-img').src = url;
      $('#share-preview').classList.remove('hidden');
      $('#btn-share-native').classList.toggle('hidden', !navigator.share);
      setTimeout(() => $('#share-preview').scrollIntoView({ behavior: 'smooth' }), 50);
    } finally { btn.disabled = false; btn.textContent = '生成结局卡'; }
  }
  async function nativeShare() {
    try {
      const blob = await (await fetch($('#share-img').src)).blob();
      const file = new File([blob], 'mopiao.png', { type: 'image/png' });
      const data = { title: '墨漂模拟器', text: `我在墨尔本漂出了「${state.ending.name}」结局，你呢？` };
      if (navigator.canShare && navigator.canShare({ files: [file] })) data.files = [file];
      await navigator.share(data);
    } catch (e) { /* 用户取消 */ }
  }

  /* ---------- 图鉴 ---------- */
  function renderGallery() {
    const st = MP.stats();
    const list = MP_ENDINGS.slice().sort((a, b) => (b.rarity - a.rarity) || ((b.priority || 0) - (a.priority || 0)));
    const got = list.filter(e => st.endings[e.id]).length;
    $('#gallery-sub').textContent = `已解锁 ${got} / ${list.length} 种结局 · 重开 ${st.plays} 次`;
    $('#gallery-grid').innerHTML = list.map(e => {
      const n = st.endings[e.id] || 0;
      const locked = !n;
      return `<div class="gal-card r${e.rarity} ${locked ? 'locked' : ''}">
        <div class="gal-emoji">${e.emoji}</div>
        <div class="gal-name">${locked ? '？？？' : e.name}</div>
        <div class="gal-rarity">${RARITY[e.rarity]}</div>
        ${locked ? '' : `<div class="gal-count">达成 ${n} 次</div>`}
      </div>`;
    }).join('');
  }

  /* ---------- 投稿 ---------- */
  const SUBMIT_TEMPLATE = `【墨漂模拟器 · 事件投稿】
事件描述（一两句话，越像真事越好）：

发生阶段（落地期 / 发展期 / 定居期）：
属性变化（英语 / 存款 / 人脉 / 心态 / 运气 加减几点）：
如果有选项，写出两个选项和各自结果：

署名（会显示在游戏里）：`;
  function openSubmit() {
    const url = (window.MP_CONFIG || {}).submitUrl;
    if (url) { window.open(url, '_blank', 'noopener'); return; }
    $('#submit-text').value = SUBMIT_TEMPLATE;
    $('#submit-modal').classList.remove('hidden');
  }
  async function copyTemplate() {
    const ta = $('#submit-text');
    let ok = false;
    try { await navigator.clipboard.writeText(ta.value); ok = true; }
    catch (e) { ta.select(); try { ok = document.execCommand('copy'); } catch (e2) {} }
    const b = $('#btn-copy');
    b.textContent = ok ? '已复制 ✓' : '请长按文本复制';
    setTimeout(() => { b.textContent = '复制模板'; }, 1800);
  }

  /* ---------- 启动 ---------- */
  function startLife() {
    state = MP.newGame(chosenIdentity.id, alloc);
    $('#life-log').innerHTML = `<div class="evt"><p class="evt-text">${chosenIdentity.intro}</p></div>`;
    $('#choice-box').classList.add('hidden');
    $('#btn-next').classList.remove('hidden');
    renderHud();
    show('life');
    syncPadding();
  }
  function bind() {
    $('#btn-start').onclick = () => { renderIdentities(); show('identity'); };
    $('#btn-random').onclick = randomAlloc;
    $('#btn-begin').onclick = startLife;
    $('#btn-next').onclick = next;
    $('#btn-restart').onclick = () => { renderStart(); show('start'); };
    $('#btn-share').onclick = makeCard;
    $('#btn-share-native').onclick = nativeShare;
    $('#btn-share-close').onclick = () => $('#share-preview').classList.add('hidden');
    $('#btn-gallery').onclick = () => { renderGallery(); show('gallery'); };
    $('#btn-gallery-back').onclick = () => { renderStart(); show('start'); };
    $('#btn-submit').onclick = openSubmit;
    $('#btn-submit-end').onclick = openSubmit;
    $('#btn-submit-close').onclick = () => $('#submit-modal').classList.add('hidden');
    $('#submit-modal').onclick = (e) => { if (e.target.id === 'submit-modal') e.target.classList.add('hidden'); };
    $('#btn-copy').onclick = copyTemplate;
    $('#btn-review').onclick = () => { show('life'); $('#life-controls').classList.add('hidden'); $('#hud').classList.remove('hidden'); window.scrollTo(0, document.body.scrollHeight); addBackBtn(); };
  }
  function addBackBtn() {
    if ($('#btn-back-ending')) return;
    const b = document.createElement('button');
    b.id = 'btn-back-ending'; b.className = 'btn btn-primary btn-wide';
    b.textContent = '回到结局'; b.style.margin = '12px 0';
    b.onclick = () => { b.remove(); $('#life-controls').classList.remove('hidden'); show('ending'); };
    $('#life-log').appendChild(b);
  }
  renderStart();
  bind();
})();

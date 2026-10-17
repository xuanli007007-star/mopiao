/* 墨漂模拟器 · 核心引擎
 * 数据来源：window.MP_IDENTITIES / MP_EVENTS_* / MP_ENDINGS
 * 对 UI 暴露：MP.newGame / MP.step / MP.choose / MP.summary / MP.stats
 */
window.MP = (function () {
  const ATTRS = [
    { key: 'eng',   name: '英语', hint: '听懂澳洲口音' },
    { key: 'money', name: '存款', hint: '一点约一万刀' },
    { key: 'net',   name: '人脉', hint: '微信群数量' },
    { key: 'mood',  name: '心态', hint: '归零就崩' },
    { key: 'luck',  name: '运气', hint: '判定全靠它' },
  ];
  const COUNTERS = { hotpot: '火锅', moves: '搬家', fines: '罚款', uber: 'Uber 单', coffee: '咖啡', jobs: '换工作' };
  const FLAG_NAMES = {
    pr: '拿到 PR', citizen: '入籍', car: '拿到驾照', house: '买了房', house_east: '东区学区房',
    business: '开了店', business3: '三家店', married: '结婚了', kid: '有娃了', job: '找到工作',
    investment: '投资房', degree: '毕业了', visa485: '485 签证', parents: '父母来了', dog: '养了狗',
  };
  const MAX_YEAR = 12;
  const ATTR_CAP = 15;
  const ALLOC_POINTS = 20;
  const ALLOC_MAX = 10;
  const STORE_KEY = 'mp_stats_v1';

  const rnd = (n) => Math.floor(Math.random() * n);
  let monthOverride = null; // 测试用：MP.setMonth(11)
  function currentMonth() { return monthOverride || (new Date().getMonth() + 1); }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function allEvents() {
    return [].concat(window.MP_EVENTS_LAND || [], window.MP_EVENTS_GROW || [], window.MP_EVENTS_SETTLE || [], window.MP_EVENTS_ANY || [], window.MP_EVENTS_SEASON || []);
  }
  function stageFor(year) { return year <= 1 ? 'land' : year <= 6 ? 'grow' : 'settle'; }
  function eventsPerYear(year) { return year === 1 ? 3 : (Math.random() < 0.3 ? 3 : 2); }

  /* ---------- 新游戏 ---------- */
  function newGame(identityId, alloc) {
    const identity = (window.MP_IDENTITIES || []).find(i => i.id === identityId);
    if (!identity) throw new Error('unknown identity ' + identityId);
    const attrs = {};
    // 底线：就算一分不加也不会落地就崩
    const BASELINE = { eng: 0, money: 1, net: 0, mood: 2, luck: 0 };
    ATTRS.forEach(a => { attrs[a.key] = (alloc[a.key] || 0) + (identity.base[a.key] || 0) + BASELINE[a.key]; });
    const s = {
      identity, attrs,
      year: 0, age: identity.startAge,
      flags: {}, counters: { hotpot: 0, moves: 0, fines: 0, uber: 0, coffee: 0, jobs: 0 },
      seen: {}, lastSeen: {}, log: [], over: false, ending: null, forcedEnding: null,
      pending: null, eventsLeft: 0,
    };
    (identity.flags || []).forEach(f => { s.flags[f] = true; });
    return s;
  }

  /* ---------- 事件筛选 ---------- */
  function eligible(ev, s) {
    if (ev.once !== false && s.seen[ev.id]) return false;
    if (ev.cooldown && s.lastSeen[ev.id] != null && s.year - s.lastSeen[ev.id] < ev.cooldown) return false;
    if (ev.season && ev.season.indexOf(currentMonth()) < 0) return false; // 节日限定：只在对应月份出现
    if (ev.stage && ev.stage !== 'any' && ev.stage !== stageFor(s.year)) return false;
    if (ev.minYear && s.year < ev.minYear) return false;
    if (ev.maxYear && s.year > ev.maxYear) return false;
    if (ev.ids && ev.ids.indexOf(s.identity.id) < 0) return false;
    if (ev.req && !ev.req.every(f => s.flags[f])) return false;
    if (ev.not && ev.not.some(f => s.flags[f])) return false;
    if (ev.cond && !ev.cond(s)) return false;
    return true;
  }
  function pickEvent(s) {
    const pool = allEvents().filter(ev => eligible(ev, s));
    if (!pool.length) return null;
    const total = pool.reduce((t, e) => t + (e.weight || 1), 0);
    let r = Math.random() * total;
    for (const e of pool) { r -= (e.weight || 1); if (r <= 0) return e; }
    return pool[pool.length - 1];
  }

  /* ---------- 效果 ---------- */
  function applyEffects(s, fx) {
    const out = [];
    if (!fx) return out;
    ATTRS.forEach(a => {
      const v = fx[a.key];
      if (typeof v === 'number' && v !== 0) {
        s.attrs[a.key] = clamp(s.attrs[a.key] + v, -10, ATTR_CAP);
        out.push({ kind: 'attr', key: a.key, name: a.name, v });
      }
    });
    (fx.flags || []).forEach(f => {
      if (!s.flags[f]) { s.flags[f] = true; if (FLAG_NAMES[f]) out.push({ kind: 'flag', name: FLAG_NAMES[f] }); }
    });
    (fx.unflags || []).forEach(f => { delete s.flags[f]; });
    if (fx.counters) Object.keys(fx.counters).forEach(k => {
      s.counters[k] = (s.counters[k] || 0) + fx.counters[k];
      if (COUNTERS[k]) out.push({ kind: 'counter', name: COUNTERS[k], v: fx.counters[k] });
    });
    if (fx.end) { s.forcedEnding = fx.end; }
    return out;
  }
  function checkOver(s) {
    if (s.over) return true;
    if (s.forcedEnding) { finish(s); return true; }
    if (s.year <= 1) { // 落地第一年不会崩，给新手一点缓冲
      if (s.attrs.mood < 1) s.attrs.mood = 1;
      if (s.attrs.money < -3) s.attrs.money = -3;
      return false;
    }
    if (s.attrs.mood <= 0) { s.forcedEnding = 'burnout'; finish(s); return true; }
    if (s.attrs.money <= -4) { s.forcedEnding = 'broke'; finish(s); return true; }
    return false;
  }
  function finish(s) {
    s.over = true;
    s.pending = null;
    s.ending = evaluateEnding(s);
    recordStats(s.ending.id);
  }
  function evaluateEnding(s) {
    const list = (window.MP_ENDINGS || []).slice().sort((a, b) => (b.priority || 0) - (a.priority || 0));
    if (s.forcedEnding) {
      const forced = list.find(e => e.id === s.forcedEnding);
      if (forced) return forced;
    }
    for (const e of list) {
      if (e.forcedOnly) continue;
      try { if (!e.cond || e.cond(s)) return e; } catch (err) { /* 条件写错不致命 */ }
    }
    return list.find(e => e.id === 'ordinary') || list[list.length - 1];
  }

  /* ---------- 年度结算：有工作有生意就有收入，有人陪就有心态 ---------- */
  function yearlyEffects(s) {
    if (s.year <= 1) return null;
    const fx = { money: 0, mood: 0 };
    if (s.flags.job) fx.money += (s.year >= 5 ? 2 : 1); // 工作几年后薪水会涨
    if (s.flags.student && !s.flags.degree && !s.flags.job) fx.money += 1; // 爸妈的生活费
    if (s.flags.parent && !s.flags.job && !s.flags.business) fx.money += 1; // 国内另一半打来的生活费
    if (s.flags.business) fx.money += 1;
    if (s.flags.business2) fx.money += 1;
    if (s.flags.business3) fx.money += 1;
    if (s.flags.investment && s.year >= 9) fx.money += 1;
    if ((s.flags.married || s.flags.partner || s.flags.dog || s.flags.parents) && s.attrs.mood < 8) fx.mood += 1;
    return fx;
  }

  /* ---------- 推进 ---------- */
  function step(s) {
    if (s.over) return { type: 'end', ending: s.ending };
    if (s.pending) return { type: 'choice', ev: s.pending };
    if (s.eventsLeft <= 0) {
      s.year += 1;
      s.age += 1;
      if (s.year > MAX_YEAR) { finish(s); return { type: 'end', ending: s.ending }; }
      s.eventsLeft = eventsPerYear(s.year);
      const fx = applyEffects(s, yearlyEffects(s));
      const entry = { type: 'year', year: s.year, age: s.age, stage: stageFor(s.year), fx };
      s.log.push(entry);
      return entry;
    }
    const ev = pickEvent(s);
    if (!ev) { s.eventsLeft = 0; return step(s); }
    s.seen[ev.id] = true;
    s.lastSeen[ev.id] = s.year;
    s.eventsLeft -= 1;
    const text = typeof ev.text === 'function' ? ev.text(s) : ev.text;
    if (ev.choices && ev.choices.length) {
      s.pending = ev;
      const entry = { type: 'choice', ev, text, seasonal: !!ev.season };
      s.log.push(entry);
      return entry;
    }
    const fx = applyEffects(s, ev.effects);
    const entry = { type: 'event', ev, text, fx, seasonal: !!ev.season };
    s.log.push(entry);
    checkOver(s);
    return entry;
  }

  function rollChance(s, roll) {
    const stat = s.attrs[roll.stat] || 0;
    return clamp(0.3 + stat * 0.055 + (roll.mod || 0), 0.08, 0.92);
  }
  function choose(s, idx) {
    const ev = s.pending;
    if (!ev) return null;
    const c = ev.choices[idx];
    s.pending = null;
    let fx = applyEffects(s, c.effects);
    let resultText = c.result || '';
    let ok = null;
    if (c.roll) {
      const p = rollChance(s, c.roll);
      ok = Math.random() < p;
      const branch = ok ? c.roll.success : c.roll.fail;
      resultText = branch.text;
      fx = fx.concat(applyEffects(s, branch.effects));
    }
    const entry = { type: 'result', ev, choice: c, text: resultText, fx, ok };
    s.log.push(entry);
    checkOver(s);
    return entry;
  }

  /* ---------- 统计 ---------- */
  function loadStats() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || { plays: 0, endings: {} }; }
    catch (e) { return { plays: 0, endings: {} }; }
  }
  function saveStats(st) { try { localStorage.setItem(STORE_KEY, JSON.stringify(st)); } catch (e) {} }
  function recordStats(endingId) {
    const st = loadStats();
    st.plays += 1;
    st.endings[endingId] = (st.endings[endingId] || 0) + 1;
    saveStats(st);
  }
  function summary(s) {
    return {
      years: Math.min(s.year, MAX_YEAR), age: s.age,
      moves: s.counters.moves, hotpot: s.counters.hotpot, fines: s.counters.fines,
      uber: s.counters.uber, coffee: s.counters.coffee,
    };
  }

  return {
    ATTRS, COUNTERS, FLAG_NAMES, MAX_YEAR, ALLOC_POINTS, ALLOC_MAX,
    newGame, step, choose, summary, stats: loadStats, rollChance, stageFor,
    setMonth: (m) => { monthOverride = m; }, currentMonth,
  };
})();

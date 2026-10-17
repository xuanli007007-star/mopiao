// 无头模拟：每个身份跑 N 局，随机加点、随机选项，统计结局分布和异常
const path = require('path');
const root = process.argv[2];
const N = Number(process.argv[3] || 3000);
global.window = {};
global.localStorage = { _d: {}, getItem(k) { return this._d[k] || null; }, setItem(k, v) { this._d[k] = v; } };
['data/identities', 'data/events_land', 'data/events_grow', 'data/events_settle', 'data/events_any', 'data/events_season', 'data/endings', 'engine'].forEach(f => require(path.join(root, 'js', f + '.js')));
const MP = window.MP; if (process.argv[4]) MP.setMonth(Number(process.argv[4]));
const results = {}; let errors = 0; let totalYears = 0, totalEvents = 0; const endingTotals = {};
const choiceStats = {}; const eventSeen = {};
for (const idn of window.MP_IDENTITIES) {
  results[idn.id] = { endings: {}, years: 0, broke: 0, burn: 0 };
  for (let i = 0; i < N; i++) {
    const alloc = {}; MP.ATTRS.forEach(a => alloc[a.key] = 0);
    alloc.mood = 3; let p = MP.ALLOC_POINTS - 3; while (p > 0) { const a = MP.ATTRS[Math.floor(Math.random() * 5)]; if (alloc[a.key] < MP.ALLOC_MAX) { alloc[a.key]++; p--; } }
    try {
      const s = MP.newGame(idn.id, alloc);
      let guard = 0;
      while (!s.over && guard++ < 500) {
        const e = MP.step(s);
        if (e.type === 'event' || e.type === 'choice') { totalEvents++; eventSeen[e.ev.id] = (eventSeen[e.ev.id] || 0) + 1; }
        if (e.type === 'choice') { let cands = e.ev.choices.map((c, i) => i).filter(i => !(e.ev.choices[i].effects && e.ev.choices[i].effects.end)); if (!cands.length) cands = e.ev.choices.map((c, i) => i); const k = cands[Math.floor(Math.random() * cands.length)]; const r = MP.choose(s, k); if (r.ok !== null) { choiceStats[e.ev.id] = choiceStats[e.ev.id] || { ok: 0, n: 0 }; choiceStats[e.ev.id].n++; if (r.ok) choiceStats[e.ev.id].ok++; } }
        if (e.type === 'end') break;
      }
      if (guard >= 500) { console.log('LOOP', idn.id); errors++; }
      const id = s.ending.id;
      results[idn.id].endings[id] = (results[idn.id].endings[id] || 0) + 1;
      endingTotals[id] = (endingTotals[id] || 0) + 1;
      results[idn.id].years += Math.min(s.year, MP.MAX_YEAR); totalYears += Math.min(s.year, MP.MAX_YEAR);
    } catch (err) { errors++; if (errors < 5) console.log('ERR', idn.id, err.stack.split('\n').slice(0, 3).join(' | ')); }
  }
}
const T = N * window.MP_IDENTITIES.length;
console.log(`games ${T} errors ${errors} avgYears ${(totalYears / T).toFixed(1)} avgEvents ${(totalEvents / T).toFixed(1)}`);
console.log('--- ending distribution (all) ---');
Object.entries(endingTotals).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(k.padEnd(14), (100 * v / T).toFixed(1) + '%'));
console.log('--- per identity top3 ---');
for (const [k, r] of Object.entries(results)) {
  const top = Object.entries(r.endings).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([e, n]) => `${e} ${(100 * n / N).toFixed(0)}%`).join(', ');
  console.log(k.padEnd(8), 'avgYears', (r.years / N).toFixed(1), '|', top);
}
const never = [...window.MP_EVENTS_LAND, ...window.MP_EVENTS_GROW, ...window.MP_EVENTS_SETTLE, ...window.MP_EVENTS_ANY, ...window.MP_EVENTS_SEASON].filter(e => !eventSeen[e.id]).map(e => e.id);
console.log('--- never triggered ---', never.length ? never.join(', ') : 'none');
const missing = window.MP_ENDINGS.filter(e => !endingTotals[e.id]).map(e => e.id);
console.log('--- endings never reached ---', missing.length ? missing.join(', ') : 'none');

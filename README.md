# 墨漂模拟器 · Melbourne Life Restart

随机投胎成一个刚落地墨尔本的华人，逐年经历租房、考车牌、凑 PR 分、拍卖抢学区房，最后拿到一张可以发小红书的结局卡。

纯前端 H5，无需构建，无需后端。

## 本地运行

```bash
python3 -m http.server 8765
```

然后打开 http://localhost:8765 。直接双击 index.html 也能玩，只是二维码不会生成。

## 部署

整个文件夹拖到 Cloudflare Pages、Vercel 或 GitHub Pages 即可。结局卡上的二维码会自动指向部署后的地址。

## 目录

```
index.html            页面骨架
css/style.css         样式，手机优先
js/engine.js          核心引擎：属性、事件调度、判定、年度结算、结局匹配
js/app.js             界面逻辑
js/share.js           结局卡 canvas 生成
js/data/identities.js 五种身份
js/data/events_*.js   事件池：land 落地期 / grow 发展期 / settle 定居期 / any 任意阶段 / season 节日限定
js/data/endings.js    结局库
js/config.js          可配置项：投稿表单地址
```

目前约 220 条事件、23 种结局、5 种身份。

## 节日限定事件

`events_season.js` 里的事件带 `season: [月份...]`，只在这些月份出现，卡片上会显示 `seasonName`。
已有中秋、墨尔本杯、春天花粉、春节、开学季、冬天、报税季、AFL 决赛、圣诞、夏天。
调试时可以在控制台执行 `MP.setMonth(11)` 强制切换月份。

## 投稿入口

开始页和结局页都有"投稿事件"。在 `js/config.js` 填入 `submitUrl`（比如一个 Google Form），
点击就会跳转；留空则弹出一个可复制的投稿模板。

## 结局图鉴

开始页的"结局图鉴"按本机 localStorage 记录显示已解锁的结局和达成次数，未解锁的只显示稀有度。

## 怎么加事件

在对应的 `events_*.js` 里加一个对象即可，字段如下：

```js
{
  id: 'grow_example',        // 唯一 id
  stage: 'grow',             // land(第1年) / grow(2-6年) / settle(7-12年) / any
  ids: ['student'],          // 可选：只给某些身份
  req: ['job'], not: ['pr'], // 可选：需要 / 排除的 flag
  cond: s => s.attrs.money >= 5, // 可选：任意条件
  minYear: 3, maxYear: 8,    // 可选：年份范围
  weight: 1, once: true,     // 可选：权重、是否只出现一次
  cooldown: 2,               // 可选：配合 once:false，至少隔几年再出现
  text: '事件描述',
  effects: { money: -1, mood: 1, flags: ['x'], counters: { hotpot: 1 } },
  // 或者给选项：
  choices: [
    { text: '选项 A', result: '结果描述', effects: { ... } },
    { text: '选项 B', roll: { stat: 'luck', mod: 0.1,
        success: { text: '成功', effects: { ... } },
        fail:    { text: '失败', effects: { ... } } } },
  ],
}
```

属性：`eng` 英语、`money` 存款、`net` 人脉、`mood` 心态、`luck` 运气。
判定成功率 = 30% + 属性值 × 5.5% + mod，范围 8% 到 92%。
`effects.end: '结局id'` 可以直接触发某个结局。

## 怎么加结局

在 `endings.js` 里加一个对象，`priority` 高的先匹配，`rarity` 1 到 4 对应 常见 / 少见 / 稀有 / 传说。
`forcedOnly: true` 的结局只能由事件或引擎触发。

## 平衡测试

`tools/sim.js` 是无头模拟脚本，随机加点、随机选项跑几千局，输出结局分布、每个身份的常见结局、从未触发的事件和结局。加完内容建议跑一遍：

```bash
node tools/sim.js . 2000
```

第三个参数可以指定月份，用来测试节日限定事件，例如 `node tools/sim.js . 1000 7`。

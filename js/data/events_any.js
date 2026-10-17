/* 任意阶段事件：救场事件和少量随机事件
 * cooldown: 同一事件至少隔多少年才会再出现 */
window.MP_EVENTS_ANY = [
  { id: 'any_broke', stage: 'any', minYear: 2, once: false, cooldown: 3, weight: 6, cond: s => s.attrs.money <= -1,
    text: '卡刷爆了，房租还有三天到期。',
    choices: [
      { text: '给爸妈打电话', result: '爸妈转了钱，顺便问了一句"要不回来吧"。你没有回答。', effects: { money: 3, mood: -2 } },
      { text: '去 Box Hill 餐馆打三份工', result: '早上送外卖，中午端盘子，晚上洗碗。三个月后你瘦了八斤，卡还上了。', effects: { money: 2, mood: -1, net: 1, counters: { jobs: 1 } } },
      { text: '算了，回国', result: '你把家具挂到群里，最后免费送了。', effects: { end: 'broke' } },
    ] },
  { id: 'any_lowmood', stage: 'any', minYear: 2, once: false, cooldown: 3, weight: 6, cond: s => s.attrs.mood <= 2,
    text: '你已经很久没有真心笑过了。微信群的消息你一条都不想点开。',
    choices: [
      { text: '约朋友去吃火锅', result: '锅开了，话也多了。朋友说你瘦了，你说吃完就好了。', effects: { mood: 2, money: -1, net: 1, counters: { hotpot: 1 } } },
      { text: '一个人去 St Kilda 看日落', result: '海鸥抢了你的薯条。但日落很好看，你拍了一张发给了妈妈。', effects: { mood: 2 } },
      { text: '订一张回国的机票', result: '你决定先回去缓一缓。', effects: { end: 'burnout' } },
    ] },
  { id: 'any_ato', stage: 'any', minYear: 2, weight: 0.6, text: 'ATO 发邮件说你多缴了税，退了 $2000。你反复确认了三遍这不是诈骗。',
    effects: { money: 2, mood: 1 } },
  { id: 'any_scamcall', stage: 'any', minYear: 2, text: '接到电话说你的包裹被海关扣了，要交保证金。你用中文骂了回去，对方用更标准的中文骂了回来。',
    effects: { mood: -1, luck: 1 } },
  { id: 'any_group_fight', stage: 'any', minYear: 2, text: '华人群里为了"墨尔本东区和西区哪个好"吵了三百条。你默默看完，没有发言，但心里站了东区。',
    effects: { net: 1 } },
  { id: 'any_lockdown', stage: 'any', minYear: 3, weight: 0.7, text: '那年全城封了很久。你学会了做酸菜鱼，看完了所有能看的剧，也认清了哪些朋友会给你送菜。',
    effects: { mood: -1, net: 1, money: -1 } },

  /* 第二批 */
  { id: 'any_weather_app', stage: 'any', minYear: 2, text: '天气预报：最高 35 度，最低 12 度。你带了羽绒服和短袖出门，两件都用上了。',
    effects: { luck: 1 } },
  { id: 'any_inspection', stage: 'any', minYear: 2, not: ['house'], text: '中介来做 inspection。你把三个月没洗的锅藏进了衣柜，还点了一根香薰。',
    effects: { mood: -1, luck: 1 } },
  { id: 'any_cherry_group', stage: 'any', minYear: 2, text: '你在群里拼了一箱车厘子，取货地点是一个陌生人的车库。你去了，车库里有二十个人在分车厘子。',
    effects: { net: 1, money: -1, mood: 1 } },
  { id: 'any_emergency', stage: 'any', minYear: 2, text: '半夜肚子疼去 emergency，等了六个小时，医生说是吃坏了。你决定以后火锅少点毛肚。',
    effects: { mood: -1 } },
  { id: 'any_payrise', stage: 'any', minYear: 3, req: ['job'], text: '年底加薪 3%，通胀 5%。你学会了一个新词：real wage。',
    effects: { mood: -1, eng: 1 } },
  { id: 'any_dogpark', stage: 'any', minYear: 2, req: ['dog'], text: '狗在公园和一只金毛玩了一下午，你和金毛主人聊了一下午。你们加了微信，狗没有。',
    effects: { net: 1, mood: 1 } },
  { id: 'any_hotpot_delivery', stage: 'any', minYear: 2, text: '暴雨天不想出门，你点了一份火锅外卖。送到的时候汤已经凉了，但你还是很满足。',
    effects: { money: -1, mood: 1, counters: { hotpot: 1 } } },
];

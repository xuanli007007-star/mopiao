/* 身份：决定起始属性、起始年龄、起始 flag 和专属事件池 */
window.MP_IDENTITIES = [
  {
    id: 'student', name: '留学生', emoji: '🎓', startAge: 19,
    desc: '拖着两个 32 寸箱子落地，学费是爸妈的，房租是自己的。',
    base: { eng: 1, money: 1, net: 0, mood: 1, luck: 0 },
    flags: ['student'],
    intro: '你拿着 CoE 和一箱老干妈，落地了墨尔本。',
  },
  {
    id: 'skilled', name: '技术移民', emoji: '💻', startAge: 28,
    desc: '国内卷了五年，带着雅思四个七和一腔孤勇来凑分。',
    base: { eng: 2, money: 2, net: 0, mood: 0, luck: 0 },
    flags: ['skilled'],
    intro: '你辞掉了国内的工作，带着全部存款和一本 EOI 攻略落地了。',
  },
  {
    id: 'parent', name: '陪读家长', emoji: '🧑‍🍳', startAge: 42,
    desc: '娃在这边上学，你负责做饭、接送、研究学区和房价。',
    base: { eng: -1, money: 3, net: 1, mood: 1, luck: 0 },
    flags: ['parent', 'kid'],
    intro: '娃进了东区的学校，你开始了每天接送和研究 Coles 半价的日子。',
  },
  {
    id: 'whv', name: '打工度假', emoji: '🎒', startAge: 24,
    desc: '一年签证，说是来看袋鼠的，其实是来攒钱和找出路的。',
    base: { eng: 0, money: 1, net: 1, mood: 2, luck: 1 },
    flags: ['whv'],
    intro: '你带着一年 WHV 签证和一张青旅订单落地，计划是边玩边赚。',
  },
  {
    id: 'abc', name: '二代 ABC', emoji: '🥑', startAge: 22,
    desc: '在 Glen Waverley 长大，中文只会点菜，家里催你考医考法。',
    base: { eng: 5, money: 1, net: 2, mood: 0, luck: 0 },
    flags: ['abc', 'citizen_born'],
    intro: '你不是落地，你是出生在这。只是毕业了，爸妈开始问你什么时候买房。',
  },
];

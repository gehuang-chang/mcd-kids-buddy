/**
 * 内置假数据（mock dataset）—— 仅在无 MCP Token 或真实调用失败时回退。
 * 结构对齐官方真实返回：儿童餐品(营养表单品) / 亲子玩乐活动(营销日历)。
 */

// 模块1 儿童友好餐品（字段对齐 list-nutrition-foods 解析结果）
const CHILD_MEALS_MOCK = [
  { name: '吉士汉堡包', energyKcal: 294, protein: 16, fat: 12, carbohydrate: 30, sodium: 673, calcium: 144 },
  { name: '麦香鸡', energyKcal: 369, protein: 15, fat: 17, carbohydrate: 39, sodium: 731, calcium: 73 },
  { name: '麦香鱼', energyKcal: 325, protein: 16, fat: 13, carbohydrate: 35, sodium: 556, calcium: 99 },
  { name: '麦乐鸡5块', energyKcal: 213, protein: 12, fat: 12, carbohydrate: 13, sodium: 422, calcium: 9 },
  { name: '大杯玉米杯', energyKcal: 87, protein: 4, fat: 1, carbohydrate: 12, sodium: 2, calcium: 10 },
  { name: '纯牛奶（盒装）', energyKcal: 129, protein: 7, fat: 7, carbohydrate: 10, sodium: 73, calcium: 231 },
  { name: '麦辣鸡翅-2块', energyKcal: 224, protein: 13, fat: 15, carbohydrate: 9, sodium: 537, calcium: 13 },
  { name: '香芋派', energyKcal: 232, protein: 2, fat: 12, carbohydrate: 28, sodium: 159, calcium: 7 }
];

// 模块2 亲子/玩具活动（字段对齐 campaign-calendar 解析结果）
const PLAY_ACTIVITIES_MOCK = [
  {
    date: '2026年10月',
    title: '乐享90分钟高质量亲子时间',
    desc: '打造高质量陪伴时光🎊 9本热门书籍且每月更新！更有开心乐园餐+随机玩具一份🎁 好吃又好玩！快报名参加吧~',
    image: ''
  },
  {
    date: '2026年10月',
    title: '麦当劳 X PEACEMINUSONE 联名',
    desc: 'GD同款联名复古棒球帽，任意餐品消费加39.9元即可得，经典红黄配色搭配复古轮廓。',
    image: ''
  }
];

module.exports = { CHILD_MEALS_MOCK, PLAY_ACTIVITIES_MOCK };

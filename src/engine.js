/**
 * 业务编排引擎（纯函数，便于测试与复用）
 * 模块1 儿童营养餐推荐：基于 list-nutrition-foods 真实单品营养
 * 模块2 当期亲子玩乐雷达：基于 campaign-calendar 真实活动
 * 真调时由 server.js 传入来自官方 MCP 的真实数据；无 token 时传入 src/data.js 的假数据。
 */

// 儿童单餐热量红线（公共营养提示，非医疗建议）
const CAL_RED_LINE = 500;

function flagMeal(m) {
  const calWarn = m.energyKcal > CAL_RED_LINE;
  return {
    ...m,
    calWarn,
    warnings: calWarn
      ? [`热量 ${m.energyKcal}kcal 超过 ${CAL_RED_LINE}kcal 儿童单餐红线，建议搭配步行/活动或拆分给两餐`]
      : []
  };
}

// 模块1 儿童营养餐智能推荐
function recommendChildMeals({ age, scene, meals }) {
  const list = meals || [];
  const scored = list.map(m => {
    let score = 0;
    if (scene === '加餐') score += (CAL_RED_LINE - m.energyKcal) / 100;        // 加餐偏好低热量
    if (scene === '正餐') score += (m.protein >= 15 ? 2 : 0) + (m.energyKcal >= 250 && m.energyKcal <= 450 ? 2 : 0); // 正餐偏好均衡
    if (scene === '奖励') score += (m.energyKcal <= 250 ? 2 : 0);              // 小奖励
    if (age <= 6 && m.energyKcal <= 300) score += 1;                          // 低龄偏好小份软食
    return { m, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 5).map(s => flagMeal(s.m));
  return {
    age, scene,
    redLines: { cal: CAL_RED_LINE },
    recommendations: top,
    tip: top.length
      ? `已按「${scene}」场景为 ${age} 岁孩子推荐前 ${top.length} 个营养更友好的餐品（数据来自麦当劳官方营养表）`
      : '暂无匹配餐品'
  };
}

// 模块2 当期亲子玩乐雷达
function playRadar({ activities }) {
  const all = activities || [];
  const withToy = all.filter(a => /玩具/.test(a.title + a.desc));
  const others = all.filter(a => !/玩具/.test(a.title + a.desc));
  const sorted = [...withToy, ...others];
  return {
    total: all.length,
    withToy: withToy.length,
    items: sorted,
    tip: withToy.length
      ? `当期有 ${withToy.length} 个活动送/含玩具，带娃可优先关注`
      : '当期暂无明确送玩具活动'
  };
}

module.exports = { CAL_RED_LINE, recommendChildMeals, playRadar };

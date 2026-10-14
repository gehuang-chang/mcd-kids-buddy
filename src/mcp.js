/**
 * 麦当劳官方 MCP 客户端（聚焦 2 模块：儿童营养餐推荐、当期亲子玩乐雷达）
 * 规范：MCP Streamable HTTP（JSON-RPC 2.0）。
 * 真实可用工具（已用 token 实测）：list-nutrition-foods / campaign-calendar。
 * 注意：门店类工具（query-meals / query-nearby-stores 等）依赖账号收藏门店，
 *       当前开发 token 未绑定门店，返回空，故本应用不依赖门店上下文。
 * 行为：配置了 MCD_MCP_TOKEN 时真实调用官方 MCP；任何异常安全回退 src/data.js 假数据。
 */

const { CHILD_MEALS_MOCK, PLAY_ACTIVITIES_MOCK } = require('./data');

let _sessionId = null;
let _initialized = false;

function log(tag, msg) { console.log(`[mcp:${tag}] ${msg}`); }

async function parseBody(res) {
  const text = await res.text();
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('text/event-stream')) {
    const lines = text.split('\n').filter(l => l.startsWith('data:'));
    const last = lines[lines.length - 1]?.replace(/^data:\s?/, '').trim();
    return last ? JSON.parse(last) : {};
  }
  try { return JSON.parse(text); } catch { return {}; }
}

async function mcpRequest(url, token, method, params, id) {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
    Authorization: `Bearer ${token}`
  };
  if (_sessionId) headers['Mcp-Session-Id'] = _sessionId;
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ jsonrpc: '2.0', id, method, params })
  });
  const sid = res.headers.get('mcp-session-id');
  if (sid) _sessionId = sid;
  if (!res.ok) throw new Error(`MCP HTTP ${res.status}`);
  return parseBody(res);
}

async function ensureInitialized(url, token) {
  if (_initialized) return;
  const r = await mcpRequest(url, token, 'initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'mcd-kids-buddy', version: '1.0.0' }
  }, 1);
  _initialized = true;
  log('init', `initialize ok, serverInfo=${JSON.stringify(r?.result?.serverInfo || {})}`);
}

// 调用工具，返回 content[0].text（非 JSON 文本原样返回）
async function callTool(url, token, name, args) {
  await ensureInitialized(url, token);
  const r = await mcpRequest(url, token, 'tools/call', { name, arguments: args || {} }, 2);
  const content = r?.result?.content || [];
  const text = content.find(c => c.type === 'text')?.text;
  try { return text ? JSON.parse(text) : (text || content); }
  catch { return text || content; }
}

// —— 解析：list-nutrition-foods 返回的文本表 ——
// 格式: [160]{productName,nutritionDescription,energyKj,energyKcal,protein,fat,carbohydrate,sodium,calcium}:\n 名称,描述,1288,308,16,16,24,781,213
function parseNutrition(str) {
  const items = [];
  const seen = new Set();
  String(str || '').split('\n').forEach(line => {
    const t = line.trim();
    if (!t || t.startsWith('[')) return; // 跳过表头 [160]{...}
    const p = t.split(',');
    if (p.length < 9) return;
    const name = p[0].trim();
    if (!name || seen.has(name)) return; // 同名餐品去重
    seen.add(name);
    items.push({
      name,
      energyKcal: parseFloat(p[3]) || 0,
      protein: parseFloat(p[4]) || 0,
      fat: parseFloat(p[5]) || 0,
      carbohydrate: parseFloat(p[6]) || 0,
      sodium: parseFloat(p[7]) || 0,
      calcium: parseFloat(p[8]) || 0
    });
  });
  return items;
}

// —— 解析：campaign-calendar 返回的 markdown ——
// 活动块: "- **活动标题**：X\n    **活动内容介绍**：Y\n    **活动图片介绍**：\n    <img src=\"...\">"
function parseCampaign(md) {
  const acts = [];
  const blocks = String(md || '').split(/#### /);
  for (const b of blocks) {
    const dateM = b.match(/^([^\n]+)/);
    const date = dateM ? dateM[1].replace(/\s+/g, ' ').trim() : '';
    const re = /活动标题\*\*：(.+?)\n\s*\*\*活动内容介绍\*\*：([\s\S]*?)\n\s*\*\*活动图片介绍\*\*：([\s\S]*?)(?=\n\s*- |\n#### |$)/g;
    let m;
    while ((m = re.exec(b))) {
      const title = m[1].trim();
      const desc = m[2].trim();
      const imgM = m[3].match(/src="([^"]+)"/);
      acts.push({ date, title, desc, image: imgM ? imgM[1] : '' });
    }
  }
  return acts;
}

// 从工具返回中提取真实数据字符串（兼容 "markdown说明+JSON" 包装 与 纯文本）
function extractDataString(r) {
  if (typeof r === 'string') {
    try { const j = JSON.parse(r); if (typeof j?.data === 'string') return j.data; } catch { /* 非 JSON */ }
    const m = r.match(/"data"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (m) { try { return JSON.parse('"' + m[1] + '"'); } catch { /* 反转义失败 */ } }
    const i = r.indexOf('[160]');
    if (i >= 0) return r.slice(i);
    return r;
  }
  if (r && typeof r.data === 'string') return r.data;
  if (r && Array.isArray(r.data)) return JSON.stringify(r.data);
  return '';
}

// 儿童友好餐品过滤：排除明显饮品/纯甜品，保留可作主食/加餐的单品
const CHILD_FRIENDLY = /汉堡|鸡|鱼|薯|玉米|牛奶|芝士|吉士|香芋|派|麦满分|新地|麦旋风|冰淇淋|鸡翅|鸡排|板烧|猪柳|培根/;
function filterChildFriendly(items) {
  return items.filter(it => CHILD_FRIENDLY.test(it.name) && it.energyKcal > 0 && it.energyKcal < 1200);
}

// 亲子/玩具相关活动过滤
function filterPlayActivities(acts) {
  return acts.filter(a => /玩具|亲子|乐园餐|孩子|派对|家庭|儿童|读书|体验营|陪伴/.test(a.title + a.desc));
}

function createDataSource() {
  const url = process.env.MCD_MCP_URL || 'https://mcp.mcd.cn';
  const token = process.env.MCD_MCP_TOKEN || '';
  const real = Boolean(token);

  return {
    isReal: real,

    // 模块1 数据源：真实营养表 -> 儿童友好餐品
    async getChildMeals() {
      if (!token) return { source: 'mock', data: CHILD_MEALS_MOCK };
      try {
        const r = await callTool(url, token, 'list-nutrition-foods', {});
        const str = extractDataString(r);
        const items = filterChildFriendly(parseNutrition(str));
        if (items.length) return { source: 'mcp', data: items };
        log('fallback', 'list-nutrition-foods 解析为空，回退假数据');
        return { source: 'mock', data: CHILD_MEALS_MOCK };
      } catch (e) {
        log('fallback', `list-nutrition-foods 失败：${e.message}`);
        return { source: 'mock', data: CHILD_MEALS_MOCK };
      }
    },

    // 模块2 数据源：真实当期活动 -> 亲子/玩具活动
    async getPlayActivities() {
      if (!token) return { source: 'mock', data: PLAY_ACTIVITIES_MOCK };
      try {
        const r = await callTool(url, token, 'campaign-calendar', { specifiedDate: '' });
        const md = extractDataString(r);
        const acts = filterPlayActivities(parseCampaign(md));
        if (acts.length) return { source: 'mcp', data: acts };
        log('fallback', 'campaign-calendar 解析为空，回退假数据');
        return { source: 'mock', data: PLAY_ACTIVITIES_MOCK };
      } catch (e) {
        log('fallback', `campaign-calendar 失败：${e.message}`);
        return { source: 'mock', data: PLAY_ACTIVITIES_MOCK };
      }
    }
  };
}

module.exports = { createDataSource };

/**
 * mcd-kids-buddy 服务入口（零依赖 Node 服务）
 * 职责：托管 public/ 静态资源 + 提供 /api/* 业务接口。
 * 聚焦 2 大模块：儿童营养餐推荐、当期亲子玩乐雷达。
 * 数据：有 MCP Token 时真实调用官方 MCP（list-nutrition-foods / campaign-calendar），否则用内置假数据。
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { createDataSource } = require('./src/mcp');
const { recommendChildMeals, playRadar } = require('./src/engine');

// —— 极简 .env 解析（不引入 dotenv 依赖）——
function loadEnv() {
  try {
    const txt = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
    txt.split('\n').forEach(line => {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    });
  } catch { /* 无 .env 则用系统环境变量 */ }
}
loadEnv();

const PORT = parseInt(process.env.PORT || '3000', 10);
const PUBLIC_DIR = path.join(__dirname, 'public');
const ds = createDataSource();

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function sendJson(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}

function serveStatic(req, res) {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = path.join(PUBLIC_DIR, path.normalize(urlPath));
  if (!filePath.startsWith(PUBLIC_DIR)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(filePath, (err, buf) => {
    if (err) {
      fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (e2, idx) => {
        if (e2) { res.writeHead(404); return res.end('Not Found'); }
        res.writeHead(200, { 'Content-Type': MIME['.html'] });
        res.end(idx);
      });
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(buf);
  });
}

async function handleApi(req, res, pathname, query) {
  if (pathname === '/api/health') {
    return sendJson(res, 200, { ok: true, real: ds.isReal, source: ds.isReal ? 'mcp' : 'mock' });
  }

  // 模块1 儿童营养餐推荐
  if (pathname === '/api/meal/recommend' && req.method === 'GET') {
    const age = parseInt(query.age || '5', 10);
    const scene = query.scene || '正餐';
    const { data: meals, source } = await ds.getChildMeals();
    return sendJson(res, 200, { source, ...recommendChildMeals({ age, scene, meals }) });
  }

  // 模块2 当期亲子玩乐雷达
  if (pathname === '/api/activities' && req.method === 'GET') {
    const { data: activities, source } = await ds.getPlayActivities();
    return sendJson(res, 200, { source, ...playRadar({ activities }) });
  }

  return sendJson(res, 404, { error: 'unknown api', pathname });
}

const server = http.createServer(async (req, res) => {
  const [pathPart] = req.url.split('?');
  const query = Object.fromEntries(new URLSearchParams(req.url.split('?')[1] || ''));
  try {
    if (pathPart.startsWith('/api/')) {
      await handleApi(req, res, pathPart, query);
    } else {
      serveStatic(req, res);
    }
  } catch (e) {
    sendJson(res, 500, { error: e.message });
  }
});

server.listen(PORT, () => {
  console.log(`\n🍔 麦麦带娃官已启动： http://localhost:${PORT}`);
  console.log(`   数据源模式： ${ds.isReal ? '真实麦当劳 MCP（list-nutrition-foods / campaign-calendar）' : '内置假数据（未配置 MCD_MCP_TOKEN）'}`);
  console.log(`   已开放模块： 儿童营养餐推荐 / 当期亲子玩乐雷达\n`);
});

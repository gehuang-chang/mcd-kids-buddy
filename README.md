# 🍔 麦麦带娃官（mcd-kids-buddy）

面向家长（尤其长沙业主群）的麦当劳亲子决策小助手。基于**麦当劳官方 MCP**真实数据，帮助家长：
1. **儿童营养餐推荐** —— 按孩子年龄与场景（加餐/正餐/奖励），从官方营养表中筛选更友好的餐品，并标注单餐热量红线。
2. **当期亲子玩乐雷达** —— 聚合当期官方营销活动，突出"送玩具/亲子/派对"类活动，带娃不踩空。

> 数据全部来自麦当劳官方 MCP（非爬虫、非手工录入），保证时效与合规。

---

## ✅ 真实使用麦当劳 MCP（参赛资格说明）

本项目**真实调用**麦当劳官方 MCP Server（`https://mcp.mcd.cn`），实际使用原子能力：

| 官方工具 | 用途 | 本项目模块 |
| --- | --- | --- |
| `list-nutrition-foods` | 获取麦当劳常见餐品营养成分（能量/蛋白/脂肪/碳水/钠/钙） | 模块1 儿童营养餐推荐 |
| `campaign-calendar` | 获取麦当劳中国当月营销活动日历（含亲子/玩具活动） | 模块2 当期亲子玩乐雷达 |

调用链路：`server.js` → `src/mcp.js`（MCP Streamable HTTP / JSON-RPC 2.0，`initialize` + `tools/call`）→ 官方 MCP → 解析真实返回 → `src/engine.js` 业务编排 → 前端展示。

**关于门店类工具**：官方 MCP 的 `query-meals` / `query-nearby-stores` / `create-order` 等需依赖账号"收藏门店/定位"上下文。当前开发用 Token 未绑定门店，此类接口返回空，因此本项目刻意**不依赖门店上下文**，仅使用全局公开数据（营养表 + 活动日历），确保每一次调用都是真实可用的官方数据、不虚构。

---

## 🚀 快速开始

```bash
# 1. 配置（复制并填入你的官方 MCP Token）
cp .env.example .env
# 编辑 .env：填入 MCD_MCP_TOKEN=你的token

# 2. 启动（零依赖，Node 22+）
node server.js
# 打开 http://localhost:3000
```

未配置 Token 时应用自动回退内置演示数据，仍可完整跑通交互。

## 🧩 技术实现

- 后端：零依赖 Node `http` 服务，托管 `public/` 并提供 `/api/*`
- MCP 客户端：`src/mcp.js`，按官方规范实现握手与工具调用，含"有 Token 真实调用、异常自动回退假数据"的安全兜底
- 业务编排：`src/engine.js` 纯函数（推荐排序、热量红线、活动筛选）
- 前端：`public/` 原生 HTML/CSS/JS，移动端友好，麦当劳红黄主题

## 📋 参赛信息

- 赛事：麦当劳程序员节创意开发大赛
- 仓库：`M-China/mcd-developer-innovation-challenge`（通过 Issue 报名）
- 原创声明：`CONTEST_DECLARATION.md`（官方原文，未改）
- MCP 配置样例：`mcp-config.example.json`（脱敏，仅环境变量占位符）

## 📄 License

[MIT](LICENSE) © 2026 gehuang-chang

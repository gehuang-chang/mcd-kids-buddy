# 麦当劳官方 MCP 接入说明（mcd-kids-buddy）

## 连接器

- **MCP Server URL**：`https://mcp.mcd.cn`
- **Token 获取**：报名后于 `open.mcd.cn/mcp` 获取，填入 `.env` 的 `MCD_MCP_TOKEN`
- **协议**：MCP Streamable HTTP（JSON-RPC 2.0），`initialize` 建会话 → `tools/call` 调工具
- **鉴权**：`Authorization: Bearer <token>`，会话复用 `Mcp-Session-Id`

## 实际调用的官方工具（2 个）

### 1. `list-nutrition-foods`（模块1 儿童营养餐推荐）
- 入参：`{}`（无参，返回全局餐品营养表）
- 返回：文本表，字段 `productName, nutritionDescription, energyKj, energyKcal, protein, fat, carbohydrate, sodium, calcium`
- 解析：`src/mcp.js` 的 `parseNutrition()` 按行解析为结构化餐品数组
- 业务：按场景（加餐/正餐/奖励）+ 年龄排序推荐，单餐热量红线 500kcal

### 2. `campaign-calendar`（模块2 当期亲子玩乐雷达）
- 入参：`{ specifiedDate: "" }`（返回当月活动）
- 返回：Markdown，含 `#### 日期` 与 `- **活动标题** / **活动内容介绍** / **活动图片介绍**`
- 解析：`src/mcp.js` 的 `parseCampaign()` 提取活动标题/内容/图片
- 业务：筛选含"玩具/亲子/派对"活动，突出当期送玩具机会

## 未使用但已探查的官方工具（说明）

经 `tools/list` 实测，官方共 34 个工具。以下因**依赖账号门店/定位上下文**或**与本项目定位不符**，当前版本未启用：

- `query-meals` / `query-meal-detail` / `query-nearby-stores` / `query-store-coupons`：需 `storeCode`（来自收藏门店），当前开发 Token 未绑定门店，调用返回空
- `create-order` / `cancel-order` / `auto-bind-coupons` / `available-coupons` 等：下单/领券类，超出"家长决策参考"定位
- 其余订单/积分/商城类工具：与亲子决策场景无关

> 说明：官方 34 个工具中**无任何"玩具库存"原子能力**。原"玩具雷达（库存）"设想在官方数据下无法实现，故模块2 调整为"当期亲子玩乐雷达"，基于真实存在的 `campaign-calendar` 活动数据，仍真实调用官方 MCP。

## 安全兜底

`src/mcp.js` 中所有数据源在"无 Token / 网络异常 / 解析失败"时，自动回退 `src/data.js` 的演示数据，保证 Web 应用始终可运行；前端明确标注当前数据来源（`source: mcp` 或 `source: mock`）。

## 配置文件

- `.env`：本地配置（含真实 Token，**禁止提交**，已在 `.gitignore`）
- `mcp-config.example.json`：脱敏样例，仅 `${MCD_MCP_TOKEN}` 占位符，供评委/协作者参考连接器配置

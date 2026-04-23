# 🦞 SIMIAICLAW 龙虾集群太极64卦系统

> 一站式智能体集群 · 无中心化分布式协作 · OpenSpace 自动进化 · ClawTip 支付闭环 · Dageno GEO/AEO 护航

## 系统架构

```
用户指令
   ↓
总控分身（兑宫·Orchestrator）
   ├→ 乾宫·探微军师（战略/选品/研究）
   ├→ 坤宫·文案女史（内容/文案/多语言）
   ├→ 震宫·镜画仙姬（视觉/视频/设计）
   ├→ 巽宫·记史官（执行/上架/RPA）
   ├→ 坎宫·营销虾（推广/流量/打赏）
   ├→ 离宫·验效掌事（监控/复盘/Dageno）
   ├→ 艮宫·技术虾（基础设施/Heartbeat自愈）
   └→ 兑宫·总控分身（协调/进化/永生）
          ↑
   OpenSpace（知识进化）+ ClawTip（支付闭环）+ Heartbeat（自愈监控）
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env，填入你的 API Key
```

### 3. 演示模式（无需真实 API Key）

```bash
npm run dev
# 或
npx tsx src/index.ts
```

### 4. Web API 模式

```bash
npx tsx src/index.ts web
# 启动后访问 http://localhost:3000
```

### 5. CLI 命令

```bash
# 查看系统状态
npx tsx src/cli/index.ts status

# 执行任务
npx tsx src/cli/index.ts execute "跨境选品上架"
npx tsx src/cli/index.ts execute "外贸GEO可见性"
npx tsx src/cli/index.ts execute "国内短视频"
npx tsx src/cli/index.ts execute "自媒体爆款"

# 心跳健康检查
npx tsx src/cli/index.ts heartbeat

# 知识库
npx tsx src/cli/index.ts knowledge stats
npx tsx src/cli/index.ts knowledge search "选品"

# 支付统计
npx tsx src/cli/index.ts clawtip

# 查看智能体
npx tsx src/cli/index.ts agents
npx tsx src/cli/index.ts agents 乾宫
```

## 核心模块

| 模块 | 路径 | 职责 |
|---|---|---|
| **64卦注册表** | `src/agents/registry.ts` | 64个智能体定义 |
| **OpenSpace** | `src/openspace/index.ts` | 知识进化与共享 |
| **ClawTip** | `src/clawtip/index.ts` | 支付闭环与变现 |
| **Heartbeat** | `src/heartbeat/index.ts` | 自愈监控 |
| **Orchestrator** | `src/orchestrator/index.ts` | 总控调度 |
| **CLI** | `src/cli/index.ts` | 命令行工具 |
| **Dashboard** | `src/web/status-dashboard.tsx` | 前端仪表盘 |

## 内置快捷指令

| 指令 | 触发宫位 | 说明 |
|---|---|---|
| `跨境选品上架` | 乾宫 | 选品→文案→视觉→上架→推广→复盘完整闭环 |
| `外贸GEO可见性` | 离宫 | B2B品牌AI可见性提升计划 |
| `国内短视频` | 坎宫 | 抖音/小红书内容工厂 |
| `自媒体爆款` | 坤宫 | 内容+打赏进化激励 |
| `Prompt Gap` | 离宫 | 内容缺口发现与修复 |
| `技能变现` | 巽宫 | ClawTip收款+进化机制 |
| `蜂巢永生` | 兑宫 | OPC协议+数字永生储备 |

## 扩展指南

### 接入真实 AI 模型

在 `src/orchestrator/index.ts` 的 `simulateAgentExecution` 方法中，
替换模拟输出为真实 LLM 调用：

```typescript
// 示例：接入 Anthropic Claude
import Anthropic from '@anthropic-ai/sdk';
const client = new Anthropic();
const message = await client.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 2048,
  messages: [{ role: 'user', content: userPrompt }],
});
```

### 添加新智能体

在 `src/agents/registry.ts` 中添加新的 `HexagramAgent` 实例，
然后重新编译即可。

### 自定义蜂巢分润协议

```typescript
import { clawTip } from './clawtip';
clawTip.createProtocol({
  name: '跨境选品专项',
  description: '针对跨境电商选品任务的分润协议',
  tasks: ['选品', '调研'],
  splitRules: { '乾宫': 20, '坤宫': 30, '坎宫': 30, '离宫': 20 },
  status: 'active',
  createdBy: 'system',
});
```

## 技术栈

- **语言**: TypeScript 5.3+
- **运行时**: Node.js 20+
- **构建**: tsx（开发）/ tsc（生产）
- **AI**: Anthropic Claude SDK / OpenAI SDK（可扩展）
- **日志**: Winston
- **数据**: JSON 文件存储（生产环境建议换为 Redis + PostgreSQL）

## 目录结构

```
simiaiclaw-taiji-cluster/
├── src/
│   ├── index.ts              # 主入口
│   ├── agents/
│   │   └── registry.ts       # 64卦智能体注册表
│   ├── orchestrator/
│   │   └── index.ts          # 总控分身（核心调度）
│   ├── openspace/
│   │   └── index.ts          # 知识进化模块
│   ├── clawtip/
│   │   └── index.ts          # 支付闭环模块
│   ├── heartbeat/
│   │   └── index.ts          # 自愈监控模块
│   ├── cli/
│   │   └── index.ts          # 命令行工具
│   ├── web/
│   │   └── status-dashboard.tsx  # React仪表盘
│   └── types/
│       └── index.ts          # 类型定义
├── data/                     # 数据存储（自动创建）
│   ├── openspace/
│   └── clawtip/
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## License

MIT · SIMIAICLAW · 龙虾集群太极64卦系统 v1.0

/**
 * SIMIAICLAW 龙虾集群太极64卦系统
 * 主入口文件
 *
 * 运行模式：
 *   npx tsx src/index.ts demo    — 演示模式（无需API Key）
 *   npx tsx src/index.ts web     — Web服务器模式（提供API + 前端）
 *   npx tsx src/index.ts full    — 完整模式（Web + 心跳监控）
 */

import 'dotenv/config';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
// Middleware 类型兼容助手（auth/index.ts 的中间件使用 Record<string,unknown> 而非 Express.Request）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ReqHandler = (req: any, res: any, next: () => void) => void;
import { orchestrator } from './orchestrator';
import { heartbeatMonitor } from './heartbeat';
import { openSpace } from './openspace';
import { clawTip } from './clawtip';
import { llmClient } from './llm';
import { geminiClient } from './gemini';
import { notebookLMService } from './notebooklm';
import { oneEvalService } from './oneeval';
import { paymentGateway } from './payments';
import { subscriptionService, COMPANY_INFO } from './subscription';
import { authService, authMiddleware, requireAuth, requireRole, requireSuperAdmin, SUPER_ADMIN_EMAIL } from './auth';
import { JWTPayload } from './auth';
import { getAnthropicApiKey, listAnthropicApiKeys, type AnthropicApiKey } from './mcp';
import { registerXiaojiaRoutes } from './xiaojia';
import { registerHappycapyRoutes } from './happycapy';
import { registerStudioRoutes } from './studio';
import { sopEngine } from './agents/anygen-sop';
import { HexagramAgent, Task } from './types';
import {
  getStatus as getHiggsfieldStatus,
  generateVideoUntilDone,
  estimateCost,
  PRICING_TABLE,
  PRESET_PROMPTS,
  type SeedanceGenerateOptions,
} from './higgsfield';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      auth?: JWTPayload | null;
    }
  }
}

// ============================================================
// 演示模式
// ============================================================
async function runDemo() {
  console.log('\n' + '═'.repeat(70));
  console.log('  🦞 SIMIAICLAW 龙虾集群太极64卦系统 — 演示模式');
  console.log('═'.repeat(70) + '\n');

  heartbeatMonitor.start();

  const demoTasks = [
    { cmd: '跨境选品上架', lane: '跨境电商' },
    { cmd: '外贸GEO可见性', lane: '外贸B2B' },
    { cmd: '国内短视频', lane: '国内电商' },
    { cmd: '自媒体爆款', lane: '自媒体' },
    { cmd: 'Prompt Gap', lane: '跨境电商' },
  ];

  for (const { cmd, lane } of demoTasks) {
    console.log('\n' + '─'.repeat(70));
    console.log(`🎯 执行: ${cmd} (${lane})`);
    console.log('─'.repeat(70));
    const result = await orchestrator.executeBuiltin(cmd, lane as '跨境电商');
    console.log(result.message);
    await new Promise(r => setTimeout(r, 300));
  }

  console.log('\n' + '='.repeat(70));
  console.log('📊 演示完成 — 最终系统状态');
  console.log('='.repeat(70));
  const status = orchestrator.getSystemStatus();
  console.log(JSON.stringify(status, null, 2));

  heartbeatMonitor.stop();
}

// ============================================================
// Web 服务器模式
// ============================================================
async function startWebServer(full = false) {
  const port = parseInt(process.env.PORT || '3000');
  const distPath = path.join(__dirname, '..', 'dist', 'client');

  const { default: express } = await import('express');
  const { default: cors } = await import('cors');
  const app = express();
  const apiRouter = express.Router();

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());

  // ── Auth 中间件（挂载到 req.auth） ─────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app.use(authMiddleware(authService) as any);

  // Mount API router after global middleware
  app.use('/api/v1', apiRouter);
  app.use('/api', apiRouter);

  //  ── 静态文件服务 ───────────────────────────────────────────

  // ── Auth 路由 ──────────────────────────────────────────────

  // 注册（创建账号 + 创建/加入租户）
  apiRouter.post('/auth/register', async (req, res) => {
    const { email, password, displayName, tenantName, tenantSlug } = req.body;
    const result = await authService.register({ email, password, displayName, tenantName, tenantSlug });
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.json({
      user: result.user,
      tenant: result.tenant,
      tokens: result.tokens,
    });
  });

  // 登录
  apiRouter.post('/auth/login', async (req, res) => {
    const { email, password, tenantId } = req.body;
    const result = await authService.login({ email, password, tenantId });
    if (!result.success) {
      return res.status(401).json({ error: result.error });
    }
    res.json({
      user: result.user,
      tenant: result.tenant,
      tokens: result.tokens,
    });
  });

  // 刷新 Token
  apiRouter.post('/auth/refresh', (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: '缺少 refreshToken' });
    const result = authService.refreshToken(refreshToken);
    if (!result.success) {
      return res.status(401).json({ error: result.error });
    }
    res.json({ user: result.user, tenant: result.tenant, tokens: result.tokens });
  });

  // 获取当前用户信息
  apiRouter.get('/auth/me', requireAuth as ReqHandler, (req, res) => {
    const user = authService.getUser(req.auth!.userId);
    if (!user) return res.status(404).json({ error: '用户不存在' });
    const tenants = authService.getUserTenants(req.auth!.userId);
    const activeTenant = authService.getTenant(req.auth!.tenantId);
    res.json({
      user: {
        ...user,
        tenants: tenants.map(t => ({
          id: t.id, name: t.name, slug: t.slug, plan: t.plan,
          role: t.members.find(m => m.userId === req.auth!.userId)?.role,
          memberCount: t.members.length,
        })),
      },
      activeTenant: activeTenant ? {
        id: activeTenant.id, name: activeTenant.name, slug: activeTenant.slug, plan: activeTenant.plan,
        role: req.auth!.role,
        memberCount: activeTenant.members.length,
      } : null,
    });
  });

  // 切换活跃租户
  apiRouter.post('/auth/switch-tenant', requireAuth as ReqHandler, (req, res) => {
    const { tenantId } = req.body;
    const result = authService.switchTenant(req.auth!.userId, tenantId);
    if (!result.success) return res.status(400).json({ error: result.error });
    res.json({ tenant: result.tenant, tokens: result.tokens });
  });

  // 获取用户的租户列表
  apiRouter.get('/auth/tenants', requireAuth as ReqHandler, (req, res) => {
    const tenants = authService.getUserTenants(req.auth!.userId);
    res.json({
      tenants: tenants.map(t => ({
        id: t.id, name: t.name, slug: t.slug, plan: t.plan,
        role: t.members.find(m => m.userId === req.auth!.userId)?.role,
        memberCount: t.members.length,
      })),
    });
  });

  // 邀请成员（生成邀请码）
  apiRouter.post('/tenants/invite', requireAuth as ReqHandler, (req, res) => {
    const { email, role } = req.body;
    const result = authService.inviteMember(req.auth!.tenantId, req.auth!.userId, email, role);
    res.json(result);
  });

  // 更新用户资料
  apiRouter.patch('/auth/me', requireAuth as ReqHandler, (req, res) => {
    const user = authService.updateUser(req.auth!.userId, req.body);
    if (!user) return res.status(404).json({ error: '用户不存在' });
    res.json({ user });
  });

  // ── 系统状态（已认证） ────────────────────────────────────
  apiRouter.get('/status', (_req, res) => {
    const status = orchestrator.getSystemStatus();
    const payments = (status as Record<string, unknown>);
    if (paymentGateway) {
      payments.payments = paymentGateway.getStats();
    }
    // 注入租户信息
    if (_req.auth) {
      const activeTenant = authService.getTenant(_req.auth.tenantId);
      const user = authService.getUser(_req.auth.userId);
      payments.tenant = activeTenant ? {
        id: activeTenant.id, name: activeTenant.name, plan: activeTenant.plan,
        role: _req.auth.role,
        quotas: activeTenant.quotas,
      } : null;
      payments.user = user ? { id: user.id, displayName: user.displayName, email: user.email } : null;
    }
    res.json(status);
  });

  // 执行指令（已认证）
  apiRouter.post('/execute', async (req, res) => {
    const tenantId = req.auth?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ success: false, message: '请先登录' });
    }
    try {
      const { command, lane } = req.body;
      const result = await orchestrator.executeBuiltin(command, lane);
      res.json({ ...result, tenantId });
    } catch (e) {
      res.status(500).json({ success: false, message: String(e) });
    }
  });

  // 健康报告
  apiRouter.get('/health', (_req, res) => {
    res.json(heartbeatMonitor.generateHealthReport());
  });

  // ══════════════════════════════════════════════════════════════
  // simiaiclaw 龙虾集群多智能体编排平台 API
  // ══════════════════════════════════════════════════════════════

  // 获取蜂群系统状态
  apiRouter.get('/swarm/status', (_req, res) => {
    const status = orchestrator.getSystemStatus();
    const tasks = Array.from((orchestrator as unknown as { taskManager: { tasks: Map<string, Task> } }).taskManager.tasks.values()).map(t => ({
      id: t.id, type: t.type, title: t.title, description: t.description,
      palace: t.palace, priority: t.priority, status: t.status, lane: t.lane,
      createdAt: (t.createdAt as Date).toISOString(),
      startedAt: t.startedAt ? (t.startedAt as Date).toISOString() : undefined,
      completedAt: t.completedAt ? (t.completedAt as Date).toISOString() : undefined,
      assignedTo: t.assignedTo, retryCount: t.retryCount, error: t.error,
    }));
    res.json({ ...status, tasks });
  });

  // 获取所有智能体列表
  apiRouter.get('/swarm/agents', (_req, res) => {
    const { ALL_HEXAGRAM_AGENTS } = require('./agents/registry');
    res.json(ALL_HEXAGRAM_AGENTS.map((a: HexagramAgent) => ({
      id: a.id, name: a.name, palace: a.palace, role: a.role,
      description: a.description, status: a.status, lanes: a.lanes,
      skills: a.skills, evolutionLevel: a.evolutionLevel,
      lastActive: (a.lastActive as Date).toISOString(), stats: a.stats,
    })));
  });

  // 按宫位获取智能体
  apiRouter.get('/swarm/palace/:palace', (req, res) => {
    const { ALL_HEXAGRAM_AGENTS } = require('./agents/registry');
    const palaceAgents = ALL_HEXAGRAM_AGENTS.filter((a: HexagramAgent) => a.palace === req.params.palace);
    res.json(palaceAgents.map((a: HexagramAgent) => ({
      id: a.id, name: a.name, palace: a.palace, role: a.role,
      description: a.description, status: a.status, lanes: a.lanes,
      skills: a.skills, evolutionLevel: a.evolutionLevel,
      lastActive: (a.lastActive as Date).toISOString(), stats: a.stats,
    })));
  });

  // 获取任务队列
  apiRouter.get('/swarm/tasks', (_req, res) => {
    const status = orchestrator.getSystemStatus();
    res.json(status.tasks);
  });

  // 执行蜂群指令
  apiRouter.post('/swarm/execute', async (req, res) => {
    const { command, lane } = req.body;
    if (!command) return res.status(400).json({ success: false, message: '缺少 command 字段' });
    try {
      const result = await orchestrator.executeBuiltin(command, lane);
      res.json(result);
    } catch (e) {
      res.status(500).json({ success: false, message: String(e) });
    }
  });

  // 演示模式：批量执行演示任务
  apiRouter.post('/swarm/demo', async (req, res) => {
    const { command, lane } = req.body;
    const demoCmds = command ? [command] : [
      '跨境选品上架', '外贸GEO可见性', '自媒体爆款', 'Prompt Gap',
    ];
    const results: Array<{ cmd: string; result: { success: boolean; message: string } }> = [];
    for (const cmd of demoCmds) {
      const result = await orchestrator.executeBuiltin(cmd, lane || '跨境电商');
      results.push({ cmd, result });
    }
    res.json({ success: true, results, total: results.length });
  });

  // 蜂群心跳状态
  apiRouter.get('/swarm/heartbeat', (_req, res) => {
    res.json({
      nodeCount: heartbeatMonitor.nodeCount,
      healthByPalace: heartbeatMonitor.getHealthByPalace(),
      report: heartbeatMonitor.generateHealthReport(),
    });
  });

  // LLM 统计
  apiRouter.get('/llm/stats', (_req, res) => {
    res.json(llmClient.getStats());
  });

  // ── Anthropic API Key 管理 ──────────────────────────────────
  // 获取 API Key 详情（调用 Anthropic Admin API，仅超级管理员）
  apiRouter.get('/anthropic/api-key/:apiKeyId', requireSuperAdmin(authService.getUser.bind(authService)) as ReqHandler, async (req, res) => {
    const { apiKeyId } = req.params;
    const result = await getAnthropicApiKey(apiKeyId);
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        hint: result.hint,
      });
    }
  });

  // 超级管理员身份检查
  apiRouter.get('/auth/is-admin', requireAuth as ReqHandler, (req, res) => {
    const user = authService.getUser(req.auth!.userId);
    const isAdmin = user ? authService.isAdmin(user.email) : false;
    res.json({
      isAdmin,
      superAdminEmail: SUPER_ADMIN_EMAIL,
      userEmail: user?.email || null,
    });
  });

  // 列出所有 API Keys（仅超级管理员）
  apiRouter.get('/anthropic/api-keys', requireSuperAdmin(authService.getUser.bind(authService)) as ReqHandler, async (_req, res) => {
    const result = await listAnthropicApiKeys();
    if (result.success) {
      res.json({
        success: true,
        keys: result.keys ?? [],
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        hint: result.hint,
      });
    }
  });

  // 获取 LLM 路由信息（包含 Anthropic 配置状态）
  apiRouter.get('/llm/routing', (_req, res) => {
    res.json(llmClient.getRoutingInfo());
  });

  // 支付统计（仅超级管理员 hmwhtm@gmail.com）
  apiRouter.get('/payments/stats', requireSuperAdmin(authService.getUser.bind(authService)) as ReqHandler, (_req, res) => {
    res.json(paymentGateway.getStats());
  });

  // 待审批支付列表（仅超级管理员）
  apiRouter.get('/payments/pending', requireSuperAdmin(authService.getUser.bind(authService)) as ReqHandler, (_req, res) => {
    res.json(paymentGateway.getPendingApprovals());
  });

  // 审批支付（仅超级管理员）
  apiRouter.post('/payments/approve', requireSuperAdmin(authService.getUser.bind(authService)) as ReqHandler, async (req, res) => {
    const { paymentId, approverNote } = req.body;
    const ok = await paymentGateway.approve(paymentId, approverNote);
    res.json({ success: ok });
  });

  // 拒绝支付（仅超级管理员）
  apiRouter.post('/payments/reject', requireSuperAdmin(authService.getUser.bind(authService)) as ReqHandler, async (req, res) => {
    const { paymentId, reason } = req.body;
    const ok = await paymentGateway.reject(paymentId, reason);
    res.json({ success: ok });
  });

  // 发起支付
  apiRouter.post('/payments/pay', async (req, res) => {
    try {
      const result = await paymentGateway.pay(req.body);
      res.json(result);
    } catch (e) {
      res.status(500).json({ success: false, error: String(e) });
    }
  });

  // 零钱包充值
  apiRouter.post('/payments/deposit', async (req, res) => {
    const { userId, amount, provider } = req.body;
    const result = await paymentGateway.deposit(userId, amount, provider);
    res.json(result);
  });

  // ══════════════════════════════════════════════════════════════
  // 订阅系统 API（个人/团队/企业三层订阅）
  // ══════════════════════════════════════════════════════════════

  // 获取订阅计划列表
  apiRouter.get('/subscription/plans', (_req, res) => {
    const plans = subscriptionService.getPlans();
    res.json({ plans, company: COMPANY_INFO });
  });

  // 获取单个订阅计划详情
  apiRouter.get('/subscription/plans/:planId', (req, res) => {
    const plan = subscriptionService.getPlanById(req.params.planId);
    if (!plan) return res.status(404).json({ error: '订阅计划不存在' });
    res.json({ plan, company: COMPANY_INFO });
  });

  // 获取当前租户的订阅状态
  apiRouter.get('/subscription/current', (req, res) => {
    const tenantId = req.auth?.tenantId;
    if (!tenantId) return res.status(401).json({ error: '请先登录' });
    const active = subscriptionService.getActiveSubscription(tenantId);
    const history = subscriptionService.getTenantSubscriptions(tenantId);
    res.json({ active, history, total: history.length });
  });

  // 创建订阅订单（生成待支付订单）
  apiRouter.post('/subscription/orders', requireAuth as ReqHandler, (req, res) => {
    const { planId, billingCycle, paymentMethod } = req.body as {
      planId: string;
      billingCycle: 'monthly' | 'quarterly' | 'halfyearly' | 'yearly';
      paymentMethod: 'wechat' | 'alipay' | 'bank_transfer';
    };
    if (!planId || !billingCycle || !paymentMethod) {
      return res.status(400).json({ error: '缺少必填字段: planId, billingCycle, paymentMethod' });
    }
    try {
      const order = subscriptionService.createOrder({
        tenantId: req.auth!.tenantId,
        userId: req.auth!.userId,
        planId,
        billingCycle,
        paymentMethod,
      });
      res.json({ order, company: paymentMethod === 'bank_transfer' ? COMPANY_INFO : undefined });
    } catch (e: unknown) {
      res.status(400).json({ error: String((e as Error).message) });
    }
  });

  // 取消订阅订单
  apiRouter.delete('/subscription/orders/:orderId', requireAuth as ReqHandler, (req, res) => {
    const ok = subscriptionService.cancelOrder(req.params.orderId);
    res.json({ success: ok });
  });

  // 获取待审批的订阅订单（管理员）
  apiRouter.get('/subscription/pending', (req, res) => {
    const tenantId = req.auth?.tenantId;
    if (!tenantId) return res.status(401).json({ error: '请先登录' });
    const tenant = authService.getTenant(tenantId);
    if (!tenant) return res.status(404).json({ error: '租户不存在' });
    const member = tenant.members.find(m => m.userId === req.auth!.userId);
    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      return res.status(403).json({ error: '权限不足，仅管理员可查看' });
    }
    res.json({ orders: subscriptionService.getPendingApprovals() });
  });

  // 审批通过订阅订单（管理员）
  apiRouter.post('/subscription/approve', requireAuth as ReqHandler, (req, res) => {
    const { orderId, note } = req.body as { orderId: string; note?: string };
    if (!orderId) return res.status(400).json({ error: '缺少 orderId' });
    const tenant = authService.getTenant(req.auth!.tenantId);
    const member = tenant?.members.find(m => m.userId === req.auth!.userId);
    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      return res.status(403).json({ error: '权限不足，仅管理员可审批' });
    }
    const sub = subscriptionService.approveOrder(orderId, req.auth!.userId, note);
    if (!sub) return res.status(404).json({ error: '订单不存在或已处理' });
    res.json({ success: true, subscription: sub });
  });

  // 拒绝订阅订单（管理员）
  apiRouter.post('/subscription/reject', requireAuth as ReqHandler, (req, res) => {
    const { orderId, reason } = req.body as { orderId: string; reason: string };
    if (!orderId) return res.status(400).json({ error: '缺少 orderId' });
    if (!reason) return res.status(400).json({ error: '缺少拒绝原因' });
    const ok = subscriptionService.rejectOrder(orderId, reason);
    res.json({ success: ok });
  });

  // 订阅统计（仅超级管理员）
  apiRouter.get('/subscription/stats', requireSuperAdmin(authService.getUser.bind(authService)) as ReqHandler, (_req, res) => {
    res.json(subscriptionService.getStats());
  });

  // OpenSpace 知识库
  apiRouter.get('/openspace/search', (req, res) => {
    const { q, lane } = req.query;
    const results = openSpace.search(
      String(q || ''),
      lane ? [lane as unknown as import('./types').Lane] : undefined
    );
    res.json({ results, total: results.length });
  });

  // ══════════════════════════════════════════════════════════════
  // Skill 商店 API
  // ══════════════════════════════════════════════════════════════
  const { skillService } = await import('./skills');

  // 获取技能列表（支持 source/category/search 过滤）
  apiRouter.get('/skills', (req, res) => {
    const tenantId = req.auth?.tenantId || 'demo';
    const { source, category, search } = req.query;
    const skills = skillService.getAllSkills(tenantId, {
      source: source as string,
      category: category as string,
      search: search as string,
    });
    res.json({ skills, total: skills.length });
  });

  // 获取单个技能详情
  apiRouter.get('/skills/:id', (req, res) => {
    const tenantId = req.auth?.tenantId || 'demo';
    const skill = skillService.getSkill(req.params.id, tenantId);
    if (!skill) return res.status(404).json({ error: '技能不存在' });
    res.json({ skill });
  });

  // 安装技能
  apiRouter.post('/skills/:id/install', requireAuth as ReqHandler, (req, res) => {
    const ok = skillService.installSkill(req.params.id, req.auth!.tenantId);
    res.json({ success: ok });
  });

  // 卸载技能
  apiRouter.delete('/skills/:id/install', requireAuth as ReqHandler, (req, res) => {
    const ok = skillService.uninstallSkill(req.params.id, req.auth!.tenantId);
    res.json({ success: ok });
  });

  // 创建自定义技能（需登录）
  apiRouter.post('/skills', requireAuth as ReqHandler, (req, res) => {
    const { name, description, longDescription, category, tags, instructions, icon } = req.body;
    if (!name || !description || !category) {
      return res.status(400).json({ error: '缺少必填字段: name, description, category' });
    }
    const user = authService.getUser(req.auth!.userId);
    const skill = skillService.createSkill(req.auth!.userId, user?.displayName || '未知用户', {
      name, description, longDescription, category, tags: tags || [], instructions, icon,
    });
    res.json({ skill });
  });

  // 打赏技能
  apiRouter.post('/skills/:id/reward', requireAuth as ReqHandler, (req, res) => {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: '打赏金额无效' });
    const ok = skillService.rewardSkill(req.params.id, req.auth!.tenantId, Number(amount));
    res.json({ success: ok, message: `已打赏 ${amount} 积分，感谢支持！` });
  });

  // ══════════════════════════════════════════════════════════════
  // SkillHub 集成 API（对接 https://www.skillhub.club）
  // 使用 @skill-hub/cli 命令行工具，无需 API Key
  // ══════════════════════════════════════════════════════════════
  const execAsync = promisify(exec);

  /** 执行 skillhub cli 命令并解析 JSON 输出 */
  async function runSkillHubCmd(args: string[]): Promise<unknown[]> {
    const cmd = `npx @skill-hub/cli ${args.join(' ')}`;
    try {
      const { stdout } = await execAsync(cmd, { timeout: 30000 });
      // CLI 输出包含非 JSON 行（如 "- Searching..."），提取 JSON 部分
      const lines = stdout.split('\n');
      const jsonStart = lines.findIndex(l => l.trim().startsWith('['));
      if (jsonStart < 0) return [];
      const jsonStr = lines.slice(jsonStart).join('\n');
      return JSON.parse(jsonStr);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      // 超时或网络错误时返回空数组
      if (msg.includes('timed out') || msg.includes('ETIMEDOUT') || msg.includes('npm warn')) {
        return [];
      }
      throw e;
    }
  }

  /** 将 CLI 返回的技能格式标准化 */
  function normalizeSkillHubSkill(s: Record<string, unknown>): Record<string, unknown> {
    return {
      id: s.id || s.slug,
      slug: s.slug,
      name: s.name,
      description: s.description || s.description_zh || '',
      author: s.author,
      stars: s.github_stars || s.stars,
      rating: s.simple_rating ? Number(s.simple_rating) : undefined,
      category: s.category,
      tags: Array.isArray(s.tags) ? s.tags : [],
      repoUrl: s.repo_url,
      isAggregator: s.is_aggregator,
    };
  }

  // 浏览技能目录（top 排行榜）
  apiRouter.get('/skillhub/catalog', async (req, res) => {
    try {
      const limit = Math.min(Number(req.query.limit) || 24, 100);
      const skills = await runSkillHubCmd(['top', '--limit', String(limit), '--json']);
      res.json({ skills: skills.map((s: unknown) => normalizeSkillHubSkill(s as Record<string, unknown>)), total: skills.length });
    } catch (e) {
      console.error('[SkillHub] catalog error:', e);
      res.status(500).json({ error: '获取技能目录失败', detail: String(e) });
    }
  });

  // 热门技能（24小时趋势）
  apiRouter.get('/skillhub/trending', async (req, res) => {
    try {
      const limit = Math.min(Number(req.query.limit) || 20, 100);
      const skills = await runSkillHubCmd(['trending', '--limit', String(limit), '--json']);
      res.json({ skills: skills.map((s: unknown) => normalizeSkillHubSkill(s as Record<string, unknown>)), total: skills.length });
    } catch (e) {
      console.error('[SkillHub] trending error:', e);
      res.status(500).json({ error: '获取热门技能失败', detail: String(e) });
    }
  });

  // 最新技能
  apiRouter.get('/skillhub/latest', async (req, res) => {
    try {
      const limit = Math.min(Number(req.query.limit) || 20, 100);
      const skills = await runSkillHubCmd(['latest', '--limit', String(limit), '--json']);
      res.json({ skills: skills.map((s: unknown) => normalizeSkillHubSkill(s as Record<string, unknown>)), total: skills.length });
    } catch (e) {
      console.error('[SkillHub] latest error:', e);
      res.status(500).json({ error: '获取最新技能失败', detail: String(e) });
    }
  });

  // 搜索技能（语义搜索）
  apiRouter.post('/skillhub/search', async (req, res) => {
    try {
      const { query, limit = 20 } = req.body as { query?: string; limit?: number };
      if (!query?.trim()) return res.status(400).json({ error: '缺少搜索关键词' });
      const skills = await runSkillHubCmd(['search', `"${query.trim()}"`, '--limit', String(Math.min(limit, 50)), '--json']);
      res.json({ results: skills.map((s: unknown) => normalizeSkillHubSkill(s as Record<string, unknown>)), total: skills.length });
    } catch (e) {
      console.error('[SkillHub] search error:', e);
      res.status(500).json({ error: '搜索技能失败', detail: String(e) });
    }
  });

  // 智能推荐（基于任务类型）
  apiRouter.get('/skillhub/recommend', async (req, res) => {
    try {
      const { task = 'all', query = 'AI agent development', limit = 10 } = req.query as Record<string, string>;
      const skills = await runSkillHubCmd(['recommend', '--task', task, '--query', `"${query}"`, '--limit', String(limit), '--json']);
      res.json({ skills: skills.map((s: unknown) => normalizeSkillHubSkill(s as Record<string, unknown>)), total: skills.length });
    } catch (e) {
      console.error('[SkillHub] recommend error:', e);
      res.status(500).json({ error: '获取推荐失败', detail: String(e) });
    }
  });

  // 一键安装技能（通过 npx @skill-hub/cli）
  apiRouter.post('/skillhub/install', requireAuth as ReqHandler, async (req, res) => {
    try {
      const { skillSlug, targetAgent, targetType = 'agent', hexagramId } = req.body as {
        skillSlug: string; targetAgent?: string; targetType?: string; hexagramId?: string;
      };
      if (!skillSlug) return res.status(400).json({ error: '缺少技能标识' });
      const target = targetAgent || 'claude';
      const cmd = `npx @skill-hub/cli install "${skillSlug}" --agent ${target} --yes`;
      const { stdout, stderr } = await execAsync(cmd, { timeout: 90000 });
      const tenantId = req.auth!.tenantId;
      skillService.saveInstalledSkill(tenantId, {
        slug: skillSlug,
        targetAgent: target,
        targetType,
        hexagramId,
        installedAt: new Date().toISOString(),
        source: 'skillhub',
      });
      res.json({ success: true, message: `✅ ${skillSlug} 已安装到 ${target}`, stdout });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[SkillHub] install error:', msg);
      res.status(500).json({ error: '安装失败', detail: msg });
    }
  });

  // 获取已从 SkillHub 安装的技能列表
  apiRouter.get('/skillhub/installed', (req, res) => {
    const tenantId = req.auth?.tenantId || 'demo';
    const installed = skillService.getSkillHubInstalls(tenantId);
    res.json({ skills: installed, total: installed.length });
  });

  // ══════════════════════════════════════════════════════════════
  // OpenSpace 自进化智能体社区 API（对接 HKUDS/OpenSpace）
  // https://github.com/HKUDS/OpenSpace · https://open-space.cloud
  // ══════════════════════════════════════════════════════════════

  /** 执行 openspace cli 命令并解析 JSON 输出 */
  async function runOpenSpaceCmd(args: string[]): Promise<unknown> {
    const cmd = `npx -y openspace-mcp ${args.join(' ')}`;
    try {
      const { stdout } = await execAsync(cmd, { timeout: 30000 });
      // 尝试解析 stdout 中的 JSON（CLI 输出可能包含进度行）
      const lines = stdout.split('\n');
      const jsonStart = lines.findIndex(l => l.trim().startsWith('{') || l.trim().startsWith('['));
      if (jsonStart < 0) return { stdout, parsed: null };
      const jsonStr = lines.slice(jsonStart).join('\n').trim();
      try {
        return { stdout, parsed: JSON.parse(jsonStr) };
      } catch {
        return { stdout, parsed: null, raw: jsonStr };
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('timed out') || msg.includes('ETIMEDOUT') || msg.includes('not found')) {
        return { stdout: '', parsed: null, error: 'OpenSpace CLI 未安装，请先运行: pip install openspace-ai 或 git clone https://github.com/HKUDS/OpenSpace' };
      }
      throw e;
    }
  }

  // OpenSpace 状态检测
  apiRouter.get('/openspace/status', async (_req, res) => {
    try {
      const result = await runOpenSpaceCmd(['--version']);
      const isInstalled = !(result as any).error;
      res.json({
        installed: isInstalled,
        version: (result as any).stdout?.trim() || null,
        dashboardUrl: 'https://open-space.cloud',
        githubUrl: 'https://github.com/HKUDS/OpenSpace',
        features: isInstalled ? ['skill-evolution', 'cloud-community', 'mcp-server', 'token-efficiency'] : [],
      });
    } catch {
      res.json({ installed: false, version: null, error: '请安装 OpenSpace: pip install openspace-ai' });
    }
  });

  // OpenSpace 云端技能市场（搜索社区技能）
  apiRouter.get('/openspace/cloud/skills', async (req, res) => {
    try {
      const { q = '', category, limit = 20 } = req.query;
      // 通过 MCP server 列出云端技能
      const result = await runOpenSpaceCmd(['skill', 'list', '--cloud', '--json', ...(String(q) ? ['--query', `"${q}"`] : []), '--limit', String(limit)]);
      res.json({ skills: (result as any).parsed || [], total: Array.isArray((result as any).parsed) ? ((result as any).parsed).length : 0 });
    } catch (e) {
      console.error('[OpenSpace] cloud skills error:', e);
      res.status(500).json({ error: '获取云端技能失败', skills: [], hint: '请确保 OpenSpace 已安装并配置了 API Key (OPENSPACE_API_KEY)' });
    }
  });

  // 从云端下载技能
  apiRouter.post('/openspace/cloud/download', requireAuth as ReqHandler, async (req, res) => {
    try {
      const { skillId, targetDir } = req.body as { skillId: string; targetDir?: string };
      if (!skillId) return res.status(400).json({ error: '缺少 skillId' });
      const result = await runOpenSpaceCmd(['download-skill', skillId, ...(targetDir ? ['--dir', targetDir] : []), '--json']);
      res.json({ success: true, skillId, result: result });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[OpenSpace] download error:', msg);
      res.status(500).json({ error: '下载技能失败', detail: msg });
    }
  });

  // 上传技能到云端
  apiRouter.post('/openspace/cloud/upload', requireAuth as ReqHandler, async (req, res) => {
    try {
      const { skillPath, visibility = 'public' } = req.body as { skillPath: string; visibility?: string };
      if (!skillPath) return res.status(400).json({ error: '缺少 skillPath' });
      const result = await runOpenSpaceCmd(['upload-skill', skillPath, '--visibility', visibility, '--json']);
      res.json({ success: true, result: result });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[OpenSpace] upload error:', msg);
      res.status(500).json({ error: '上传技能失败，需要配置 OPENSPACE_API_KEY', detail: msg });
    }
  });

  // OpenSpace 自进化状态（本地技能管理）
  apiRouter.get('/openspace/local/skills', (_req, res) => {
    // 返回本地 OpenSpace 知识库中的技能条目
    const stats = openSpace.getStats();
    res.json({
      total: stats.total,
      byType: stats.byType,
      byLane: stats.byLane,
      evolutionEnabled: true,
      cloudEnabled: !!(process.env.OPENSPACE_API_KEY),
      dashboardUrl: 'https://open-space.cloud',
    });
  });

  // ══════════════════════════════════════════════════════════════
  // HeyGen Video Agent API（自然语言一键生成视频）
  // https://developers.heygen.com/
  // ══════════════════════════════════════════════════════════════

  /** HeyGen API 请求封装 */
  async function heygenRequest(endpoint: string, body?: Record<string, unknown>): Promise<unknown> {
    const apiKey = process.env.HEYGEN_API_KEY;
    if (!apiKey) throw new Error('HEYGEN_API_KEY 未配置，请在环境变量中设置');
    const url = `https://api.heygen.com/v2/${endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json() as Record<string, unknown>;
    if (!response.ok) {
      throw new Error(`HeyGen API Error: ${JSON.stringify(data)}`);
    }
    return data;
  }

  // HeyGen 状态检测
  apiRouter.get('/heygen/status', (_req, res) => {
    const apiKey = process.env.HEYGEN_API_KEY;
    res.json({
      configured: !!apiKey,
      endpoint: 'https://api.heygen.com/v2/video-agents',
      docsUrl: 'https://developers.heygen.com/',
      features: ['text-to-video', 'avatar', 'voice', 'translation', 'lipsync'],
    });
  });

  // 创建 Video Agent 任务（自然语言生成视频）
  apiRouter.post('/heygen/video/generate', requireAuth as ReqHandler, async (req, res) => {
    try {
      const { prompt, avatarId, voiceId, width = 720, height = 1280 } = req.body as {
        prompt: string; avatarId?: string; voiceId?: string; width?: number; height?: number;
      };
      if (!prompt?.trim()) return res.status(400).json({ error: '请提供视频描述（prompt）' });

      // 调用 HeyGen Video Agent API
      const result = await heygenRequest('video-agents', {
        prompt: prompt.trim(),
        ...(avatarId ? { avatar_id: avatarId } : {}),
        ...(voiceId ? { voice_id: voiceId } : {}),
        dimension: { width, height },
      }) as Record<string, unknown>;

      res.json({
        success: true,
        videoId: result.video_id || result.id,
        status: result.status || 'processing',
        result,
        message: '视频生成任务已提交，Video ID 用于后续查询进度',
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[HeyGen] video generate error:', msg);
      if (msg.includes('HEYGEN_API_KEY')) {
        res.status(503).json({ error: 'HeyGen API Key 未配置', hint: '请在环境变量中设置 HEYGEN_API_KEY，可从 developers.heygen.com 获取' });
      } else {
        res.status(500).json({ error: '视频生成失败', detail: msg });
      }
    }
  });

  // 查询视频生成状态
  apiRouter.get('/heygen/video/:videoId', requireAuth as ReqHandler, async (req, res) => {
    try {
      const { videoId } = req.params;
      const apiKey = process.env.HEYGEN_API_KEY;
      if (!apiKey) return res.status(503).json({ error: 'HEYGEN_API_KEY 未配置' });

      const response = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
        headers: { 'X-Api-Key': apiKey },
      });
      const data = await response.json() as Record<string, unknown>;
      res.json(data);
    } catch (e: unknown) {
      res.status(500).json({ error: '查询失败', detail: String(e) });
    }
  });

  // 获取可用数字人和语音列表
  apiRouter.get('/heygen/resources', requireAuth as ReqHandler, async (_req, res) => {
    try {
      const apiKey = process.env.HEYGEN_API_KEY;
      if (!apiKey) return res.status(503).json({ error: 'HEYGEN_API_KEY 未配置' });

      const [avatarsRes, voicesRes] = await Promise.all([
        fetch('https://api.heygen.com/v1/avatar.list', { headers: { 'X-Api-Key': apiKey } }),
        fetch('https://api.heygen.com/v1/voice.list', { headers: { 'X-Api-Key': apiKey } }),
      ]);

      const [avatars, voices] = await Promise.all([avatarsRes.json(), voicesRes.json()]);
      res.json({ avatars, voices });
    } catch (e: unknown) {
      res.status(500).json({ error: '获取资源列表失败', detail: String(e) });
    }
  });

  // ══════════════════════════════════════════════════════════════
  // Higgsfield × Seedance 2.0 API
  // https://higgsfield.ai/seedance/2.0
  // 字节跳动 Seedance 2.0 · 世界最强 AI 视频模型 · 全球首发
  // API Base: https://seedanceapi.org/v1
  // ══════════════════════════════════════════════════════════════

  // 状态检测
  apiRouter.get('/higgsfield/status', (_req, res) => {
    res.json(getHiggsfieldStatus());
  });

  // 预置提示词
  apiRouter.get('/higgsfield/presets', (_req, res) => {
    res.json({ presets: PRESET_PROMPTS });
  });

  // 费用估算
  apiRouter.get('/higgsfield/estimate', (req, res) => {
    const { resolution = '720p', duration = 8, generate_audio = false } = req.query;
    const cost = estimateCost({
      resolution: resolution as '480p' | '720p',
      duration: Number(duration) as 4 | 8 | 12,
      generate_audio: generate_audio === 'true',
    });
    res.json({ cost, pricingTable: PRICING_TABLE });
  });

  // 一站式视频生成（提交 + 轮询直到完成）
  apiRouter.post('/higgsfield/generate', async (req, res) => {
    try {
      const {
        prompt,
        aspect_ratio = '16:9',
        resolution = '720p',
        duration = 8,
        generate_audio = false,
        fixed_lens = false,
        image_url = null,
        image_base64 = null,
      } = req.body as {
        prompt?: string;
        aspect_ratio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '21:9' | '9:21';
        resolution?: '480p' | '720p';
        duration?: 4 | 8 | 12;
        generate_audio?: boolean;
        fixed_lens?: boolean;
        image_url?: string | null;
        image_base64?: string | null;
      };

      if (!prompt?.trim()) {
        return res.status(400).json({ error: '请提供视频描述（prompt）' });
      }

      const options: SeedanceGenerateOptions = {
        prompt: prompt.trim(),
        aspect_ratio,
        resolution,
        duration,
        generate_audio,
        fixed_lens,
        image_url: image_url || undefined,
        image_base64: image_base64 || undefined,
      };

      console.log(`[Seedance 2.0] 生成请求: ar=${aspect_ratio} res=${resolution} dur=${duration}s audio=${generate_audio} lens=${fixed_lens}`);

      const result = await generateVideoUntilDone(options, (msg) => {
        console.log(`[Seedance 2.0] ${msg}`);
      });

      // 估算本次消耗
      const cost = estimateCost({ resolution, duration, generate_audio });

      res.json({
        success: true,
        task_id: result.task_id,
        video_url: result.video_url,
        consumed_credits: result.consumed_credits,
        estimated_credits: cost.credits,
        estimated_usd: cost.usd,
        options: { aspect_ratio, resolution, duration, generate_audio, fixed_lens },
        message: '视频生成完成！可下载或直接在页面预览',
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[Seedance 2.0] 生成失败:', msg);
      if (msg.includes('API Key') || msg.includes('KEY') || msg.includes('SEEDANCE')) {
        return res.status(503).json({
          error: 'API Key 未配置',
          hint: '请在 .env 中设置 SEEDANCE_API_KEY，可从 https://seedanceapi.org 获取',
          docsUrl: 'https://seedanceapi.org',
        });
      }
      if (msg.includes('积分不足') || msg.includes('INSUFFICIENT')) {
        return res.status(402).json({ error: '积分不足', hint: '请前往 https://seedanceapi.org 充值' });
      }
      res.status(500).json({ error: '视频生成失败', detail: msg });
    }
  });

  // 估算生成费用（POST 版，支持复杂参数）
  apiRouter.post('/higgsfield/estimate', (req, res) => {
    const { resolution = '720p', duration = 8, generate_audio = false } = req.body;
    const cost = estimateCost({
      resolution,
      duration,
      generate_audio,
    });
    res.json({ cost, pricingTable: PRICING_TABLE });
  });

  // ══════════════════════════════════════════════════════════════
  // HeyGen LiveAvatar API（实时数字人 WebRTC 流）
  // https://docs.liveavatar.com
  // API Base: https://api.liveavatar.com/v2
  // ══════════════════════════════════════════════════════════════

  // LiveAvatar 状态检测
  apiRouter.get('/liveavatar/status', (_req, res) => {
    const apiKey = process.env.HEYGEN_LIVEAVATAR_API_KEY || process.env.HEYGEN_API_KEY;
    res.json({
      configured: !!apiKey,
      apiBase: 'https://api.liveavatar.com/v2',
      docsUrl: 'https://docs.liveavatar.com',
      features: ['real-time-webcam', 'voice-chat', 'text-input', 'iframe-embed', 'web-sdk'],
      pricing: '2积分/分钟 (FULL模式) · 1积分/分钟 (LITE模式)',
      models: ['FULL (HeyGen托管WebRTC)', 'LITE (自备AI栈: LLM+TTS+ASR)'],
    });
  });

  // 创建 LiveAvatar 会话（获取 Embed URL 或 Session Token）
  apiRouter.post('/liveavatar/session', requireAuth as ReqHandler, async (req, res) => {
    try {
      const { avatarId, isSandbox = true, mode = 'full' } = req.body as {
        avatarId?: string;
        isSandbox?: boolean;
        mode?: 'full' | 'lite';
      };

      const apiKey = process.env.HEYGEN_LIVEAVATAR_API_KEY || process.env.HEYGEN_API_KEY;
      if (!apiKey) {
        return res.status(503).json({
          error: 'HEYGEN_LIVEAVATAR_API_KEY 未配置',
          hint: '请在 .env 文件中设置 HEYGEN_LIVEAVATAR_API_KEY，可从 app.liveavatar.com/developers 获取',
        });
      }

      // 创建 Embed Session（用于 iframe 嵌入）
      const embedResponse = await fetch('https://api.liveavatar.com/v2/embeddings', {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          avatar_id: avatarId || 'default',
          context_id: `simiaiclaw-${req.auth!.tenantId}-${Date.now()}`,
          is_sandbox: isSandbox,
          mode: mode === 'lite' ? 'lite' : undefined,
        }),
      });

      const embedData = await embedResponse.json() as Record<string, unknown>;

      if (!embedResponse.ok) {
        console.error('[LiveAvatar] session error:', embedData);
        return res.status(400).json({
          error: '创建 LiveAvatar 会话失败',
          detail: embedData,
          hint: '请确认 API Key 有 LiveAvatar 访问权限',
        });
      }

      res.json({
        success: true,
        sessionId: (embedData.data as Record<string, unknown>)?.session_id || Date.now().toString(),
        embedUrl: (embedData.data as Record<string, unknown>)?.url,
        embedScript: (embedData.data as Record<string, unknown>)?.script,
        mode,
        isSandbox,
        expiresIn: '7天（链接有效期）',
        message: 'LiveAvatar 会话已创建，请使用 Embed URL 在 iframe 中加载数字人',
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[LiveAvatar] session create error:', msg);
      res.status(500).json({ error: '创建会话失败', detail: msg });
    }
  });

  // 获取可用数字人列表（从 HeyGen 资源接口）
  apiRouter.get('/liveavatar/avatars', requireAuth as ReqHandler, async (_req, res) => {
    try {
      const apiKey = process.env.HEYGEN_LIVEAVATAR_API_KEY || process.env.HEYGEN_API_KEY;
      if (!apiKey) {
        return res.status(503).json({ error: 'API Key 未配置' });
      }

      // 尝试从 HeyGen 数字人列表接口获取
      const response = await fetch('https://api.heygen.com/v1/avatar.list', {
        headers: { 'X-Api-Key': apiKey },
      });

      if (!response.ok) {
        // 如果无法获取，返回默认 LiveAvatar 选项
        return res.json({
          avatars: [
            { id: 'default', name: '默认数字人', thumbnail: null, is_available: true, type: 'photo' },
            { id: 'young-man-sitting', name: '年轻男士（坐姿）', thumbnail: null, is_available: true, type: 'photo' },
            { id: 'young-woman-standing', name: '年轻女士（站姿）', thumbnail: null, is_available: true, type: 'photo' },
          ],
          total: 3,
          note: '部分数字人需从 app.liveavatar.com/avatars 激活',
        });
      }

      const data = await response.json() as Record<string, unknown>;
      res.json(data);
    } catch (e: unknown) {
      res.status(500).json({ error: '获取数字人列表失败', detail: String(e) });
    }
  });

  // ══════════════════════════════════════════════════════════════
  // Dageno GEO/AEO API — AI可见性营销系统
  // https://app.dageno.ai · https://docs.dageno.ai
  // 深度集成 BotSight / Prompt Gap Radar / Citation Share / 全引擎可见性
  // ══════════════════════════════════════════════════════════════

  // Dageno 状态检测
  apiRouter.get('/dageno/status', (_req, res) => {
    const apiKey = process.env.DAGENO_API_KEY;
    const workspaceId = process.env.DAGENO_WORKSPACE_ID || 'hmwhtm/simiai_top';
    res.json({
      configured: !!apiKey,
      apiBase: 'https://app.dageno.ai',
      docsUrl: 'https://docs.dageno.ai',
      workspaceId,
      features: [
        'BotSight (全引擎AI可见性监测)',
        'Prompt Gap Radar (关键词差距分析)',
        'Citation Share (引用分享率追踪)',
        'GEO Campaign (生成式引擎优化活动)',
        'Brand Entity (品牌实体管理)',
        'AI Index Score (AI指数评分)',
      ],
      pricing: '订阅制 · 根据 Workspace 套餐',
      models: [
        'ChatGPT (GPT-4o) — 主要索引引擎',
        'Perplexity — AI搜索引擎',
        'Gemini (Google AI) — Google生态',
        'Claude (Anthropic) — 企业级AI',
        'DeepSeek — 开源AI搜索',
      ],
      dagenoUrl: `https://app.dageno.ai/${workspaceId}/geo/overview`,
    });
  });

  // 代理 Dageno API（带认证头转发）
  app.all('/api/dageno/proxy', async (req, res) => {
    const apiKey = process.env.DAGENO_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error: 'DAGENO_API_KEY 未配置',
        hint: '请在 .env 中设置 DAGENO_API_KEY',
      });
    }
    const path = req.query.path as string || '';
    const dagenoUrl = `https://app.dageno.ai/${path}`;
    try {
      const response = await fetch(dagenoUrl, {
        method: req.method as 'GET' | 'POST' | 'PUT' | 'DELETE',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: ['POST', 'PUT', 'PATCH'].includes(req.method) ? JSON.stringify(req.body) : undefined,
      });
      const data = await response.text();
      res.status(response.status).set('Content-Type', 'application/json').send(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[Dageno] proxy error:', msg);
      res.status(500).json({ error: 'Dageno API 代理失败', detail: msg });
    }
  });

  // ══════════════════════════════════════════════════════════════
  // GPT Image 2 API — OpenAI 旗舰图像生成模型
  // https://platform.openai.com/docs/guides/images
  // Arena 图像榜第一 · 支持文生图/图生图/mask重绘/4K
  // ══════════════════════════════════════════════════════════════

  apiRouter.get('/gpt-image/status', async (_req, res) => {
    const apiKey = process.env.OPENAI_API_KEY;
    const gatewayKey = process.env.GPT_IMAGE_GATEWAY_KEY;
    res.json({
      configured: !!(apiKey || gatewayKey),
      provider: gatewayKey ? 'gateway' : apiKey ? 'openai' : 'none',
      docsUrl: 'https://platform.openai.com/docs/guides/images',
      pricing: {
        '1024x1024-low': '$0.006/张',
        '1024x1024-medium': '$0.053/张',
        '1024x1024-high': '$0.211/张',
        '1536x1024-high': '$0.165/张',
        '4K': '按 token 实计',
      },
    });
  });

  apiRouter.post('/gpt-image/generate', async (req, res) => {
    try {
      const {
        prompt,
        model = 'gpt-image-2',
        size = '1024x1024',
        quality = 'high',
        output_format = 'png',
        n = 1,
        input_image = null,   // base64 或 URL
        input_image_format = 'png',
        mask = null,          // base64 或 URL
      } = req.body as {
        prompt?: string;
        model?: string;
        size?: string;
        quality?: 'auto' | 'low' | 'medium' | 'high';
        output_format?: 'png' | 'jpeg' | 'webp';
        n?: number;
        input_image?: string | null;
        input_image_format?: string;
        mask?: string | null;
      };

      if (!prompt?.trim()) {
        return res.status(400).json({ error: '请提供图像描述（prompt）' });
      }

      // 优先使用专用网关 key，次选 OPENAI_API_KEY
      const apiKey = process.env.GPT_IMAGE_GATEWAY_KEY || process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return res.status(503).json({
          error: 'API Key 未配置',
          hint: '请在环境变量中设置 OPENAI_API_KEY 或 GPT_IMAGE_GATEWAY_KEY',
          docsUrl: 'https://platform.openai.com/docs/guides/images',
        });
      }

      // 决定 base URL（网关 vs OpenAI 官方）
      const gatewayBase = process.env.GPT_IMAGE_GATEWAY_URL || 'https://api.openai.com';

      // 构建请求体
      const body: Record<string, unknown> = {
        model: model || 'gpt-image-2',
        prompt: prompt.trim(),
        n: Math.min(n || 1, 1),
        quality,
        output_format,
      };

      // 尺寸合法性校验
      const VALID_SIZES = [
        '1024x1024', '1536x1024', '1024x1536',
        '2048x2048', '2048x1152', '2048x1280', '1280x2048',
        '3840x2160', '2160x3840', '1792x1024', '1024x1792',
      ];
      if (size && !VALID_SIZES.includes(size)) {
        return res.status(400).json({
          error: `不支持的尺寸: ${size}`,
          hint: `合法尺寸: ${VALID_SIZES.join(', ')}，或长宽≤3840且为16的倍数`,
        });
      }
      if (size) body.size = size;

      // 参考图
      if (input_image) {
        if (input_image.startsWith('data:') || input_image.startsWith('http')) {
          body.input_image = input_image;
        } else {
          // 纯 base64，补上前缀
          body.input_image = `data:image/${input_image_format || 'png'};base64,${input_image}`;
        }
      }

      // mask 图
      if (mask) {
        body.mask = mask.startsWith('data:') || mask.startsWith('http')
          ? mask
          : `data:image/png;base64,${mask}`;
      }

      console.log(`[GPT Image 2] 生成请求: ${model} · size=${size} · quality=${quality} · fmt=${output_format}`);

      const response = await fetch(`${gatewayBase}/v1/images/generations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(360_000), // 6 分钟超时
      });

      if (!response.ok) {
        const errBody = await response.text();
        console.error(`[GPT Image 2] API 错误 ${response.status}:`, errBody);
        return res.status(response.status).json({
          error: `GPT Image 2 API 返回 ${response.status}`,
          detail: errBody,
          hint: response.status === 400
            ? '检查尺寸是否合法（最大边≤3840px，且为16的倍数）'
            : response.status === 401
            ? 'API Key 无效'
            : response.status === 429
            ? '速率超限，请稍后重试'
            : '请查看 detail 字段',
        });
      }

      const data = await response.json() as {
        data?: Array<{ b64_json?: string; url?: string; revised_prompt?: string }>;
        created?: number;
      };

      const images = (data.data || []).map((img, idx) => ({
        index: idx,
        b64_json: img.b64_json || null,
        url: img.url || null,
        revised_prompt: img.revised_prompt || null,
      }));

      res.json({
        success: true,
        model: model || 'gpt-image-2',
        size: size || '1024x1024',
        quality,
        images,
        created: data.created,
        usage: '按张计费（见模型市场定价）',
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[GPT Image 2] 生成失败:', msg);
      if (msg.includes('timeout') || msg.includes('Timeout')) {
        return res.status(504).json({
          error: '生成超时（>6分钟）',
          hint: '请尝试降低画质（quality=medium）或减小尺寸',
        });
      }
      res.status(500).json({ error: '图像生成失败', detail: msg });
    }
  });

  // ══════════════════════════════════════════════════════════════
  // 静态广告生成器 API — 客户画像批量生成
  // ══════════════════════════════════════════════════════════════

  /**
   * POST /api/ad-generator/personas
   * 根据品牌研究文本，AI 生成 6 个详细的客户画像
   */
  apiRouter.post('/ad-generator/personas', async (req, res) => {
    try {
      const { brandResearch, productType } = req.body as {
        brandResearch?: string;
        productType?: string;
      };

      if (!brandResearch?.trim()) {
        return res.status(400).json({ error: 'brandResearch 为必填项' });
      }

      // 复用 LLM 客户端生成画像
      const { llmClient } = await import('./llm/index.js');
      const { Palace } = await import('./types/index.js');

      const systemPrompt = `You are an expert DTC (Direct-to-Consumer) brand strategist and customer persona analyst.
Your task: Generate 6 detailed customer personas based on the brand research provided.

For each persona, provide in STRICT JSON format:
{
  "title": "Persona title (e.g. 'Urban Professional Woman', 'Budget-Conscious Family')",
  "emoji": "A single relevant emoji",
  "age": "Age range (e.g. '28-38 years old')",
  "pain": "Their top 1-2 pain points that this product solves",
  "copy": "A short punchy ad copy text (1-2 sentences, max 60 chars each) tailored to this persona"
}

Return a JSON array of exactly 6 personas, no other text or explanation.`;

      const userPrompt = `Brand/Product Research:
${brandResearch.trim()}

Product Type: ${productType || 'general product'}

Generate 6 distinct customer personas. Make them diverse in demographics, motivations, and pain points.
Return ONLY valid JSON array.`;

      const llmResp = await llmClient.complete({
        agentId: 'dui',
        palace: Palace.DUI,
        task: userPrompt,
        systemPrompt,
      });

      let personas: any[] = [];
      const content = llmResp.content.trim();

      // 尝试解析 JSON
      try {
        // 尝试提取 JSON 数组（可能有 markdown 代码块包裹）
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          personas = JSON.parse(jsonMatch[0]);
        } else {
          personas = JSON.parse(content);
        }
      } catch {
        // JSON 解析失败，尝试提取关键信息
        console.warn('[Ad Generator] JSON parse failed, using fallback personas');
        personas = [];
      }

      // 如果解析失败或数量不足，生成 fallback
      if (personas.length === 0) {
        personas = [
          { title: 'Urban Professional', emoji: '👩‍💼', age: '28-38 years', pain: 'Time-poor, values efficiency and quality', copy: 'Save time. Choose quality.' },
          { title: 'Young Family', emoji: '👨‍👩‍👧', age: '30-42 years', pain: 'Safety concerns, budget management', copy: 'Safe for your family, friendly for your wallet.' },
          { title: 'Tech Enthusiast', emoji: '🧑‍💻', age: '22-35 years', pain: 'Seeks latest features, loves to share', copy: 'Join the future. Share the experience.' },
          { title: 'Value Seeker', emoji: '💰', age: '25-50 years', pain: 'Price-sensitive, needs clear value signal', copy: 'Best value. No compromise.' },
          { title: 'Quality Lifestyle', emoji: '🌟', age: '30-55 years', pain: 'Premium taste, willing to pay for excellence', copy: 'Elevate your everyday.' },
          { title: 'First-Time Buyer', emoji: '🆕', age: '20-30 years', pain: 'Overwhelmed by choices, needs guidance', copy: 'Easy. Reliable. Yours.' },
        ];
      }

      res.json({
        success: true,
        personas: personas.slice(0, 6),
        raw: llmResp.content,
        model: llmResp.model,
        latencyMs: llmResp.latencyMs,
      });

    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[Ad Generator] 画像生成失败:', msg);
      res.status(500).json({ error: '画像生成失败', detail: msg });
    }
  });

  // ══════════════════════════════════════════════════════════════
  // Gemini 文案+生图 API
  // https://ai.google.dev/gemini-api
  // 文案生成：gemini-2.0-flash / gemini-1.5-flash / gemini-1.5-pro
  // 图像生成：Vertex AI Imagen 3（需 GOOGLE_CLOUD 配置）
  // ══════════════════════════════════════════════════════════════

  // Gemini 状态检测
  apiRouter.get('/gemini/status', (_req, res) => {
    res.json(geminiClient.getStatus());
  });

  // 文案生成（POST，完整响应）
  apiRouter.post('/gemini/text', async (req, res) => {
    try {
      const { prompt, model, temperature, maxTokens, systemPrompt, imageBase64, imageMimeType } = req.body as {
        prompt?: string;
        model?: string;
        temperature?: number;
        maxTokens?: number;
        systemPrompt?: string;
        imageBase64?: string;
        imageMimeType?: string;
      };

      if (!prompt?.trim() && !imageBase64) {
        return res.status(400).json({ error: '请提供 prompt 或 imageBase64（至少有一个）' });
      }

      console.log(`[Gemini] 文案生成请求: model=${model || 'gemini-2.0-flash'} promptLen=${(prompt || '').length}`);
      const result = await geminiClient.generateText(prompt || '分析这张图片', {
        model: model as any,
        temperature,
        maxTokens,
        systemPrompt,
        imageBase64,
        imageMimeType,
      });

      res.json({
        success: true,
        id: result.id,
        text: result.text,
        model: result.model,
        usage: result.usage,
        latencyMs: result.latencyMs,
        finishReason: result.finishReason,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[Gemini] 文案生成失败:', msg);
      res.status(500).json({ error: '文案生成失败', detail: msg });
    }
  });

  // 文案生成（流式，SSE）
  apiRouter.post('/gemini/text/stream', async (req, res) => {
    try {
      const { prompt, model, temperature, maxTokens, systemPrompt } = req.body as {
        prompt?: string;
        model?: string;
        temperature?: number;
        maxTokens?: number;
        systemPrompt?: string;
      };

      if (!prompt?.trim()) {
        return res.status(400).json({ error: '请提供 prompt' });
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      for await (const chunk of geminiClient.streamText(prompt, {
        model: model as any,
        temperature,
        maxTokens,
        systemPrompt,
      })) {
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[Gemini] 流式生成失败:', msg);
      res.status(500).json({ error: '流式生成失败', detail: msg });
    }
  });

  // 多模态图片分析（图+文生成描述）
  apiRouter.post('/gemini/analyze', async (req, res) => {
    try {
      const { imageBase64, prompt, mimeType = 'image/png' } = req.body as {
        imageBase64?: string;
        prompt?: string;
        mimeType?: string;
      };

      if (!imageBase64) {
        return res.status(400).json({ error: '请提供 imageBase64' });
      }

      const result = await geminiClient.analyzeImage(
        imageBase64,
        prompt || '详细描述这张图片的内容、风格、色调和潜在应用场景'
      );

      res.json({
        success: true,
        text: result.text,
        model: result.model,
        usage: result.usage,
        latencyMs: result.latencyMs,
      });
    } catch (e: unknown) {
      res.status(500).json({ error: '图片分析失败', detail: String(e) });
    }
  });

  // 图像生成（Vertex AI Imagen 3）
  apiRouter.post('/gemini/image', async (req, res) => {
    try {
      const {
        prompt,
        sampleCount = 1,
        aspectRatio = '1:1',
        personGeneration = 'dont_allow',
      } = req.body as {
        prompt?: string;
        sampleCount?: 1 | 2 | 4;
        aspectRatio?: '1:1' | '9:16' | '16:9' | '3:4' | '4:3';
        personGeneration?: 'dont_allow' | 'allow_adult' | 'allow_all';
      };

      if (!prompt?.trim()) {
        return res.status(400).json({ error: '请提供图像描述（prompt）' });
      }

      const result = await geminiClient.generateImage({
        prompt: prompt.trim(),
        sampleCount,
        aspectRatio,
        personGeneration,
        outputType: 'base-url',
      });

      res.json({
        success: true,
        imageUrl: result.imageUrl,
        base64: result.base64,
        revisedPrompt: result.revisedPrompt,
        model: result.model,
        latencyMs: result.latencyMs,
        message: result.imageUrl || result.base64
          ? '图像生成完成'
          : '模拟模式：需配置 Vertex AI（GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON）才能生成真实图像',
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[Gemini] 图像生成失败:', msg);
      res.status(500).json({ error: '图像生成失败', detail: msg });
    }
  });

  // ══════════════════════════════════════════════════════════════
  // NotebookLM 知识库 API
  // Enterprise: Google Cloud NotebookLM API
  // Consumer: app.notebooklm.google.com OAuth2
  // Local: 本地模拟模式（无需配置）
  // ══════════════════════════════════════════════════════════════

  // NotebookLM 状态检测
  apiRouter.get('/notebooklm/status', (_req, res) => {
    res.json(notebookLMService.getStatus());
  });

  // 创建知识库笔记本
  apiRouter.post('/notebooklm/notebooks', requireAuth as ReqHandler, async (req, res) => {
    try {
      const { name, description } = req.body as { name?: string; description?: string };
      if (!name?.trim()) return res.status(400).json({ error: '请提供笔记本名称（name）' });

      const notebook = await notebookLMService.createNotebook({
        name: name.trim(),
        description,
        tenantId: req.auth!.tenantId,
      });
      res.json({ success: true, notebook });
    } catch (e: unknown) {
      res.status(500).json({ error: '创建笔记本失败', detail: String(e) });
    }
  });

  // 列出知识库笔记本
  apiRouter.get('/notebooklm/notebooks', requireAuth as ReqHandler, async (req, res) => {
    try {
      const notebooks = await notebookLMService.listNotebooks(req.auth!.tenantId);
      res.json({ notebooks, total: notebooks.length });
    } catch (e: unknown) {
      res.status(500).json({ error: '获取笔记本列表失败', detail: String(e) });
    }
  });

  // 获取单个笔记本
  apiRouter.get('/notebooklm/notebooks/:id', requireAuth as ReqHandler, async (req, res) => {
    try {
      const notebook = await notebookLMService.getNotebook(req.params.id);
      if (!notebook) return res.status(404).json({ error: '笔记本不存在' });
      res.json({ notebook });
    } catch (e: unknown) {
      res.status(500).json({ error: '获取笔记本失败', detail: String(e) });
    }
  });

  // 删除笔记本
  apiRouter.delete('/notebooklm/notebooks/:id', requireAuth as ReqHandler, async (req, res) => {
    try {
      const ok = await notebookLMService.deleteNotebook(req.params.id);
      res.json({ success: ok });
    } catch (e: unknown) {
      res.status(500).json({ error: '删除笔记本失败', detail: String(e) });
    }
  });

  // 添加来源（URL 或文件）
  apiRouter.post('/notebooklm/notebooks/:id/sources', requireAuth as ReqHandler, async (req, res) => {
    try {
      const { type, content, fileName, mimeType, url } = req.body as {
        type?: 'file' | 'url';
        content?: string;
        fileName?: string;
        mimeType?: string;
        url?: string;
      };

      if (!type) return res.status(400).json({ error: '请提供来源类型（type: file|url）' });

      const source = await notebookLMService.addSource({
        notebookId: req.params.id,
        type,
        content,
        fileName,
        mimeType,
        url,
      });
      res.json({ success: true, source });
    } catch (e: unknown) {
      res.status(500).json({ error: '添加来源失败', detail: String(e) });
    }
  });

  // 获取笔记本的来源列表
  apiRouter.get('/notebooklm/notebooks/:id/sources', requireAuth as ReqHandler, async (req, res) => {
    try {
      const sources = await notebookLMService.listSources(req.params.id);
      res.json({ sources, total: sources.length });
    } catch (e: unknown) {
      res.status(500).json({ error: '获取来源列表失败', detail: String(e) });
    }
  });

  // 知识库问答
  apiRouter.post('/notebooklm/notebooks/:id/ask', requireAuth as ReqHandler, async (req, res) => {
    try {
      const { query, sessionId } = req.body as { query?: string; sessionId?: string };
      if (!query?.trim()) return res.status(400).json({ error: '请提供问题（query）' });

      const result = await notebookLMService.ask({
        notebookId: req.params.id,
        query: query.trim(),
        sessionId,
      });

      res.json({
        success: true,
        answer: result.answer,
        citations: result.citations,
        modelId: result.modelId,
        latencyMs: result.latencyMs,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[NotebookLM] 问答失败:', msg);
      res.status(500).json({ error: '知识库问答失败', detail: msg });
    }
  });

  // 生成音频摘要（Audio Overview）
  apiRouter.post('/notebooklm/notebooks/:id/audio', requireAuth as ReqHandler, async (req, res) => {
    try {
      const { narratorName, suggestedTopics } = req.body as {
        narratorName?: string;
        suggestedTopics?: string[];
      };

      const audio = await notebookLMService.generateAudioOverview({
        notebookId: req.params.id,
        narratorName,
        suggestedTopics,
      });

      res.json({ success: true, audio });
    } catch (e: unknown) {
      res.status(500).json({ error: '生成音频摘要失败', detail: String(e) });
    }
  });

  // ══════════════════════════════════════════════════════════════
  // OneEval 评测框架 API（北大DCAI团队）
  // https://github.com/OpenDCAI/One-Eval
  // https://arxiv.org/abs/2603.09821
  // 依赖：pip install -e .（可选，未安装则自动降级模拟）
  // ══════════════════════════════════════════════════════════════

  // OneEval 状态检测
  apiRouter.get('/oneeval/status', async (_req, res) => {
    try {
      const status = await oneEvalService.getStatus();
      res.json(status);
    } catch (e: unknown) {
      res.status(500).json({ error: '状态检测失败', detail: String(e) });
    }
  });

  // 发起评测（自然语言输入）
  // POST /api/oneeval/eval
  // Body: { request: string, model?: string, apiKey?: string, benchmarks?: string[] }
  apiRouter.post('/oneeval/eval', async (req, res) => {
    try {
      const { request, model, apiKey, apiBase, modelType, timeout, benchmarks, language } = req.body as {
        request?: string;
        model?: string;
        apiKey?: string;
        apiBase?: string;
        modelType?: 'openai' | 'anthropic' | 'local';
        timeout?: number;
        benchmarks?: string[];
        language?: 'zh' | 'en';
      };

      if (!request?.trim()) {
        return res.status(400).json({ error: '请提供评测需求（request，自然语言描述）' });
      }

      console.log(`[OneEval] 评测请求: "${request.slice(0, 80)}..." model=${model || 'auto'}`);

      const plan = await oneEvalService.evaluate({
        request: request.trim(),
        model,
        apiKey,
        apiBase,
        modelType,
        timeout,
        benchmarks,
        language,
      });

      res.json({
        success: true,
        ...plan,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[OneEval] 评测失败:', msg);
      res.status(500).json({ error: '评测执行失败', detail: msg });
    }
  });

  // 流式评测（SSE）
  apiRouter.post('/oneeval/eval/stream', async (req, res) => {
    try {
      const { request, model, apiKey, apiBase, modelType, timeout, benchmarks, language } = req.body as {
        request?: string;
        model?: string;
        apiKey?: string;
        apiBase?: string;
        modelType?: 'openai' | 'anthropic' | 'local';
        timeout?: number;
        benchmarks?: string[];
        language?: 'zh' | 'en';
      };

      if (!request?.trim()) {
        return res.status(400).json({ error: '请提供评测需求（request）' });
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      for await (const chunk of oneEvalService.streamEvaluate({
        request: request.trim(),
        model,
        apiKey,
        apiBase,
        modelType,
        timeout,
        benchmarks,
        language,
      })) {
        res.write(chunk);
      }
      res.end();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[OneEval] 流式评测失败:', msg);
      res.status(500).json({ error: '流式评测失败', detail: msg });
    }
  });

  // 列出支持的 Benchmark 列表
  apiRouter.get('/oneeval/benchmarks', (_req, res) => {
    res.json({
      benchmarks: [
        { name: 'MMLU', dimension: '通用知识', dataset: 'hendrycks/MMLU', metrics: ['accuracy', 'pass@k'], domains: ['知识理解'] },
        { name: 'GSM8K', dimension: '数学推理', dataset: 'openai/gsm8k', metrics: ['accuracy', 'math_verify', 'numerical_match'], domains: ['数学'] },
        { name: 'MATH', dimension: '数学推理', dataset: 'hendrycks/MATH', metrics: ['accuracy', 'math_verify'], domains: ['数学'] },
        { name: 'IFEval', dimension: '指令遵循', dataset: 'ketch/instruction-following-eval', metrics: ['prompt_level_strict_acc', 'prompt_level_loose_acc'], domains: ['指令遵循'] },
        { name: 'BBH', dimension: '复杂推理', dataset: 'bigscience/bloom-560m-bbh', metrics: ['acc'], domains: ['推理'] },
        { name: 'HumanEval', dimension: '代码生成', dataset: 'openai/openai_humaneval', metrics: ['pass@1', 'pass@10', 'pass@100'], domains: ['代码'] },
        { name: 'MBPP', dimension: '代码生成', dataset: 'abulsaydan/mbpp', metrics: ['pass@1'], domains: ['代码'] },
        { name: 'MedQA', dimension: '医疗问答', dataset: 'bigbio/medqa', metrics: ['accuracy'], domains: ['医疗'] },
        { name: 'TruthfulQA', dimension: '幻觉检测', dataset: 'truthfulqa/truthfulqa_mc2', metrics: ['mc2_metrics'], domains: ['幻觉检测'] },
        { name: 'LegalBench', dimension: '法律理解', dataset: 'nguha/legalbench', metrics: ['accuracy'], domains: ['法律'] },
        { name: 'FinanceQA', dimension: '金融分析', dataset: '未定', metrics: ['accuracy'], domains: ['金融'] },
      ],
      total: 11,
      note: 'One-Eval 自动规划时会在此列表中根据需求筛选合适的 benchmark',
    });
  });

  // ══════════════════════════════════════════════════════════════
  // Ollama 本地大模型 API
  // https://ollama.com · http://localhost:11434
  // ══════════════════════════════════════════════════════════════

  // Ollama 状态检测
  apiRouter.get('/ollama/status', async (_req, res) => {
    const result = await llmClient.checkOllama();
    res.json({
      ...result,
      docsUrl: 'https://ollama.com',
      installHint: result.available
        ? null
        : '请运行: ollama serve（安装: https://ollama.com/download）',
      setupSteps: result.available ? null : [
        '1. 下载安装: https://ollama.com/download',
        '2. 运行: ollama serve',
        '3. 下载模型: ollama pull llama3',
        '4. 或使用 Docker: docker run -v ollama:/root/.ollama -p 11434:11434 ollama/ollama',
      ],
    });
  });

  // 获取 Ollama 可用模型列表
  apiRouter.get('/ollama/models', async (_req, res) => {
    try {
      const result = await llmClient.checkOllama();
      res.json({
        available: result.available,
        models: result.models,
        endpoint: result.endpoint,
      });
    } catch (e: unknown) {
      res.status(500).json({ error: '获取 Ollama 模型列表失败', detail: String(e) });
    }
  });

  // 启动 Ollama 容器（可选，快速启动）
  apiRouter.post('/ollama/start', requireAuth as ReqHandler, async (req, res) => {
    const { useDocker = false } = req.body as { useDocker?: boolean };
    const cmd = useDocker
      ? 'docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama'
      : 'pgrep -x ollama > /dev/null || ollama serve &';
    try {
      const { execAsync } = await import('child_process').then(m => ({ execAsync: promisify(m.exec) }));
      const { stdout } = await execAsync(cmd);
      res.json({ success: true, message: useDocker ? 'Ollama Docker 容器已启动' : 'Ollama 服务已启动/已在运行', output: stdout.trim() });
    } catch (e: unknown) {
      res.status(500).json({ error: '启动 Ollama 失败', detail: String(e) });
    }
  });

  // ══════════════════════════════════════════════════════════════
  // 火豹 API (huobaoapi.com) 统一中转网关
  // Base URL: https://huobaoapi.com/v1 · OpenAI 兼容
  // ══════════════════════════════════════════════════════════════

  // 火豹 API 状态检测
  apiRouter.get('/huobao/status', async (_req, res) => {
    const result = await llmClient.checkHuobao();
    res.json({
      ...result,
      docsUrl: 'https://docs.huobaoapi.com',
      signupUrl: 'https://huobaoapi.com/r/6hEy',
      supportedModels: result.apiKeyConfigured ? null : ['gpt-4o', 'gpt-4o-mini', 'claude-3.5-sonnet', 'deepseek-chat'],
      pricing: '按量计费，比官方 API 节省 30-70%',
    });
  });

  // 火豹 API 模型列表（通过代理转发，避免 CORS）
  apiRouter.get('/huobao/models', requireAuth as ReqHandler, async (_req, res) => {
    const apiKey = process.env.HUABAO_API_KEY;
    if (!apiKey) return res.status(503).json({ error: 'HUABAO_API_KEY 未配置' });
    try {
      const response = await fetch('https://huobaoapi.com/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      const data = await response.json() as Record<string, unknown>;
      res.json(data);
    } catch (e: unknown) {
      res.status(500).json({ error: '获取火豹模型列表失败', detail: String(e) });
    }
  });

  // 火豹聊天补全代理（透传到 huobaoapi.com，避免前端 CORS）
  apiRouter.post('/huobao/chat', requireAuth as ReqHandler, async (req, res) => {
    const apiKey = process.env.HUABAO_API_KEY;
    if (!apiKey) return res.status(503).json({ error: 'HUABAO_API_KEY 未配置' });
    try {
      const body = req.body;
      const response = await fetch('https://huobaoapi.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      // 流式响应透传
      if (body.stream) {
        res.setHeader('Content-Type', 'text/event-stream');
        if (response.body) {
          // Convert Web ReadableStream to Node.js Readable for Express streaming
          const { Readable } = await import('stream');
          Readable.fromWeb(response.body as ReadableStream<Uint8Array>).pipe(res);
        }
        return;
      }
      const data = await response.json() as Record<string, unknown>;
      res.json(data);
    } catch (e: unknown) {
      res.status(500).json({ error: '火豹聊天请求失败', detail: String(e) });
    }
  });

  // ══════════════════════════════════════════════════════════════
  // LLM 智能路由状态 API
  // ══════════════════════════════════════════════════════════════

  // 获取当前 LLM 引擎状态和智能路由信息
  apiRouter.get('/llm/routing', (_req, res) => {
    const info = llmClient.getRoutingInfo();
    res.json({
      ...info,
      routeStrategy: {
        description: `并发 ≤ ${info.lowVolumeThreshold} 时优先 Ollama（免费本地），否则使用付费引擎（火豹/Claude/OpenAI）`,
        rules: [
          { condition: `并发 ≤ ${info.lowVolumeThreshold}`, engine: 'ollama', cost: '免费', latency: '极低（本地）' },
          { condition: `并发 > ${info.lowVolumeThreshold}`, engine: 'huobao/anthropic/openai', cost: '按量计费', latency: '取决于网络' },
        ],
      },
      huobaoSignupUrl: 'https://huobaoapi.com/r/6hEy',
      ollamaInstallUrl: 'https://ollama.com/download',
    });
  });

  // ══════════════════════════════════════════════════════════════
  // 自定义 Agent API（自然语言创建）
  // ══════════════════════════════════════════════════════════════

  // ══════════════════════════════════════════════════════════════
  // 64卦智能体数据
  // ══════════════════════════════════════════════════════════════
  const { HEXAGRAM_64, PALACE_META, getHexagramsByPalace } = await import('./data/hexagram64');

  // 获取64卦完整数据
  apiRouter.get('/hexagrams', (_req, res) => {
    res.json({
      hexagrams: HEXAGRAM_64,
      palaces: PALACE_META,
      total: HEXAGRAM_64.length,
      byPalace: Object.keys(PALACE_META).map(p => ({
        palace: p,
        meta: PALACE_META[p],
        hexagrams: getHexagramsByPalace(p),
      })),
    });
  });

  // 获取单个卦详情
  apiRouter.get('/hexagrams/:id', (req, res) => {
    const hex = HEXAGRAM_64.find(h => h.id === req.params.id);
    if (!hex) return res.status(404).json({ error: '卦位不存在' });
    const { getCollabChain } = require('./data/hexagram64');
    res.json({ hex, collabChain: getCollabChain(hex.collabWith) });
  });

  // 获取自定义 Agent 列表
  apiRouter.get('/agents/custom', (req, res) => {
    const tenantId = req.auth?.tenantId || 'demo';
    const agents = skillService.getCustomAgents(tenantId);
    res.json({ agents, total: agents.length });
  });

  // 自然语言创建自定义 Agent
  apiRouter.post('/agents/custom/from-text', requireAuth as ReqHandler, (req, res) => {
    const { naturalLanguage } = req.body;
    if (!naturalLanguage) return res.status(400).json({ error: '请提供自然语言描述' });
    const agent = skillService.createAgentFromNaturalLanguage(
      req.auth!.tenantId, req.auth!.userId, naturalLanguage
    );
    res.json({ agent, message: `已创建「${agent.name}」：${agent.description}` });
  });

  // 更新自定义 Agent
  apiRouter.patch('/agents/custom/:id', requireAuth as ReqHandler, (req, res) => {
    const agent = skillService.updateCustomAgent(req.params.id, req.auth!.tenantId, req.body);
    if (!agent) return res.status(404).json({ error: 'Agent 不存在' });
    res.json({ agent });
  });

  // 删除自定义 Agent
  apiRouter.delete('/agents/custom/:id', requireAuth as ReqHandler, (req, res) => {
    const ok = skillService.deleteCustomAgent(req.params.id, req.auth!.tenantId);
    res.json({ success: ok });
  });

  // ══════════════════════════════════════════════════════════════
  // MCP 连接器 API
  // ══════════════════════════════════════════════════════════════
  const { mcpService } = await import('./mcp');

  apiRouter.get('/mcp/templates', (_req, res) => {
    res.json({ templates: mcpService.getTemplates() });
  });

  apiRouter.get('/mcp/servers', (req, res) => {
    const tenantId = req.auth?.tenantId || 'demo';
    res.json({ servers: mcpService.getServers(tenantId) });
  });

  apiRouter.post('/mcp/servers', requireAuth as ReqHandler, (req, res) => {
    const { templateId, name, config } = req.body;
    if (!templateId || !config) return res.status(400).json({ error: '缺少 templateId 或 config' });
    try {
      const server = mcpService.createServer(req.auth!.tenantId, req.auth!.userId, templateId, name || '', config);
      res.json({ server });
    } catch (e: unknown) {
      res.status(400).json({ error: String((e as Error).message) });
    }
  });

  apiRouter.patch('/mcp/servers/:id', requireAuth as ReqHandler, (req, res) => {
    const server = mcpService.updateServer(req.params.id, req.body);
    if (!server) return res.status(404).json({ error: '服务器不存在' });
    res.json({ server });
  });

  apiRouter.delete('/mcp/servers/:id', requireAuth as ReqHandler, (req, res) => {
    res.json({ success: mcpService.deleteServer(req.params.id) });
  });

  apiRouter.post('/mcp/servers/:id/test', requireAuth as ReqHandler, async (req, res) => {
    const result = await mcpService.testConnection(req.params.id);
    res.json(result);
  });

  // ══════════════════════════════════════════════════════════════
  // AI 大模型市场 API（1000+ 全球模型）
  // ══════════════════════════════════════════════════════════════
  const { modelService } = await import('./mcp');

  apiRouter.get('/models', (req, res) => {
    const { provider, capability, tier, search, enabled } = req.query;
    const models = modelService.getModels({
      provider: provider as any,
      capability: capability as any,
      tier: tier as any,
      search: search as string,
      enabled: enabled !== undefined ? enabled === 'true' : undefined,
    });
    res.json({ models, total: models.length });
  });

  apiRouter.get('/models/stats', (_req, res) => {
    res.json(modelService.getStats());
  });

  apiRouter.get('/models/providers', (_req, res) => {
    res.json({ providers: modelService.getProviders() });
  });

  apiRouter.patch('/models/:id/connect', requireAuth as ReqHandler, (req, res) => {
    const { apiKey } = req.body;
    if (!apiKey) return res.status(400).json({ error: '需要提供 API Key' });
    const model = modelService.connectModel(req.params.id, apiKey);
    if (!model) return res.status(404).json({ error: '模型不存在' });
    res.json({ model, message: `${model.name} 已连接` });
  });

  apiRouter.patch('/models/:id/disconnect', requireAuth as ReqHandler, (req, res) => {
    const model = modelService.disconnectModel(req.params.id);
    if (!model) return res.status(404).json({ error: '模型不存在' });
    res.json({ model });
  });

    //  ── 小加营销智能体 ──────────────────────────────────────
  registerXiaojiaRoutes(app);

  //  ── Happycapy Skills ──────────────────────────────────────────
  registerHappycapyRoutes(app);

  //  ── AI 短剧工作室 ─────────────────────────────────────────────
  registerStudioRoutes(app);

  // ══════════════════════════════════════════════════════════════
  // AnyGen.io 外贸助手 API
  // https://www.anygen.io/assistant
  // 客服助手 / 业务助手 / 全能助手
  // ══════════════════════════════════════════════════════════════
  const { anygenService, ANYGEN_ASSISTANTS } = await import('./agents/anygen');
  type AnyGenAssistantType = 'customer-service' | 'business' | 'universal';

  // 获取 AnyGen 助手列表
  apiRouter.get('/anygen/assistants', (_req, res) => {
    res.json({
      assistants: ANYGEN_ASSISTANTS.map(a => ({
        id: a.id,
        name: a.name,
        icon: a.icon,
        type: a.type,
        tagline: a.tagline,
        description: a.description,
        capabilities: a.capabilities,
        useCases: a.useCases,
        lanes: a.lanes,
        color: a.color,
        bgGradient: a.bgGradient,
        status: a.status,
        url: `${a.url}&invite=${encodeURIComponent(anygenService['config']?.inviteCode || '龙虾太极')}`,
      })),
    });
  });

  // 获取单个助手详情
  apiRouter.get('/anygen/assistants/:type', (req, res) => {
    const assistant = ANYGEN_ASSISTANTS.find(a => a.type === req.params.type);
    if (!assistant) return res.status(404).json({ error: '助手类型不存在', hint: '支持: customer-service / business / universal' });
    res.json({ assistant });
  });

  // 获取邀请链接（带邀请码）
  apiRouter.get('/anygen/invite-url', (req, res) => {
    const { type = 'universal' } = req.query;
    const assistant = ANYGEN_ASSISTANTS.find(a => a.type === (type as AnyGenAssistantType));
    if (!assistant) return res.status(404).json({ error: '助手类型不存在' });
    const inviteCode = anygenService['config']?.inviteCode || '龙虾太极';
    res.json({
      url: `${assistant.url}&invite=${encodeURIComponent(inviteCode)}`,
      inviteCode,
      assistant: assistant.name,
      assistantIcon: assistant.icon,
    });
  });

  // 新建对话
  apiRouter.post('/anygen/conversations', requireAuth as ReqHandler, (req, res) => {
    const { type, title } = req.body as { type?: AnyGenAssistantType; title?: string };
    const conversation = anygenService.createConversation(
      req.auth!.tenantId,
      req.auth!.userId,
      type || 'universal',
      title
    );
    res.json({ conversation });
  });

  // 获取对话历史
  apiRouter.get('/anygen/conversations', requireAuth as ReqHandler, (req, res) => {
    const conversations = anygenService.getAllConversations(req.auth!.tenantId);
    res.json({ conversations, total: conversations.length });
  });

  // 获取单个对话
  apiRouter.get('/anygen/conversations/:id', requireAuth as ReqHandler, (req, res) => {
    const conversation = anygenService.getConversation(req.params.id, req.auth!.tenantId);
    if (!conversation) return res.status(404).json({ error: '对话不存在' });
    res.json({ conversation });
  });

  // 发送消息
  apiRouter.post('/anygen/conversations/:id/messages', requireAuth as ReqHandler, async (req, res) => {
    const { content, attachments } = req.body as { content: string; attachments?: string[] };
    if (!content?.trim()) return res.status(400).json({ error: '消息内容不能为空' });
    try {
      const result = await anygenService.sendMessage(
        req.params.id,
        req.auth!.tenantId,
        req.auth!.userId,
        content,
        attachments
      );
      res.json(result);
    } catch (e: unknown) {
      res.status(500).json({ success: false, error: String(e) });
    }
  });

  // 删除对话
  apiRouter.delete('/anygen/conversations/:id', requireAuth as ReqHandler, (req, res) => {
    const ok = anygenService.deleteConversation(req.params.id, req.auth!.tenantId);
    res.json({ success: ok });
  });

  // 更新配置
  apiRouter.patch('/anygen/config', requireAuth as ReqHandler, (req, res) => {
    anygenService.updateConfig(req.body);
    res.json({ success: true, config: anygenService.loadConfig() });
  });

  // 获取配置
  apiRouter.get('/anygen/config', (_req, res) => {
    res.json({ config: anygenService.loadConfig() });
  });

  // ══════════════════════════════════════════════════════════════
  // AnyGen SOP 自动化引擎 API
  // 外贸全链路 SOP（询盘处理/订单跟踪/流失预警/差评逆转）
  // ══════════════════════════════════════════════════════════════

  // 获取 SOP 系统统计
  apiRouter.get('/anygen/sop/stats', (req, res) => {
    const tenantId = req.auth?.tenantId;
    res.json(sopEngine.getStats(tenantId));
  });

  // 获取 SOP 分类列表
  apiRouter.get('/anygen/sop/categories', (_req, res) => {
    res.json({ categories: sopEngine.getCategories() });
  });

  // 获取 SOP 模板列表（支持分类/赛道/搜索过滤）
  apiRouter.get('/anygen/sop/templates', (req, res) => {
    const tenantId = req.auth?.tenantId;
    const { category, lane, search } = req.query;
    let templates = sopEngine.getAllTemplates(tenantId);
    if (category) templates = templates.filter(t => t.category === category);
    if (lane) templates = templates.filter(t => t.lanes.includes(lane as string));
    if (search) {
      const q = (search as string).toLowerCase();
      templates = templates.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.toLowerCase().includes(q))
      );
    }
    res.json({ templates, total: templates.length });
  });

  // 获取单个 SOP 模板详情
  apiRouter.get('/anygen/sop/templates/:id', (req, res) => {
    const tenantId = req.auth?.tenantId;
    const template = sopEngine.getTemplate(req.params.id, tenantId);
    if (!template) return res.status(404).json({ error: 'SOP 模板不存在' });
    res.json({ template });
  });

  // 创建自定义 SOP 模板（需登录）
  apiRouter.post('/anygen/sop/templates', requireAuth as ReqHandler, (req, res) => {
    const tenantId = req.auth!.tenantId;
    const body = req.body as {
      name: string; description?: string; category: string; lanes?: string[]; tags?: string[];
      trigger?: { type: string; source?: string }; nodes: unknown[]; startNodeId: string; variables?: Record<string, unknown>;
    };
    const { name, description, category, lanes, tags, trigger, nodes, startNodeId, variables } = body;
    if (!name || !category || !nodes?.length || !startNodeId) {
      return res.status(400).json({ error: '缺少必填字段: name, category, nodes, startNodeId' });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const template = sopEngine.createTemplate(tenantId, {
      name, description: description || '', category, lanes: lanes || [], tags: tags || [],
      trigger: trigger ? { type: trigger.type as 'event' | 'schedule' | 'manual' | 'webhook', source: trigger.source || '' } : { type: 'manual' as const },
      nodes, startNodeId,
      variables: variables || {},
      author: tenantId, status: 'active',
    } as any);
    res.json({ template });
  });

  // 更新 SOP 模板（需是创建者）
  apiRouter.patch('/anygen/sop/templates/:id', requireAuth as ReqHandler, (req, res) => {
    const tenantId = req.auth!.tenantId;
    const template = sopEngine.getTemplate(req.params.id, tenantId);
    if (!template) return res.status(404).json({ error: 'SOP 模板不存在' });
    const updated = sopEngine.updateTemplate(req.params.id, req.body);
    res.json({ template: updated });
  });

  // 删除自定义 SOP 模板
  apiRouter.delete('/anygen/sop/templates/:id', requireAuth as ReqHandler, (req, res) => {
    const template = sopEngine.getTemplate(req.params.id);
    if (!template || template.author !== req.auth?.tenantId) {
      return res.status(404).json({ error: '模板不存在或无权删除' });
    }
    const ok = sopEngine.deleteTemplate(req.params.id);
    res.json({ success: ok });
  });

  // 触发 SOP 执行
  apiRouter.post('/anygen/sop/execute', requireAuth as ReqHandler, (req, res) => {
    const { templateId, trigger, input } = req.body as {
      templateId?: string; trigger?: { type: string; source?: string }; input?: Record<string, unknown>;
    };
    if (!templateId) return res.status(400).json({ error: '缺少 templateId' });
    try {
      const execution = sopEngine.execute(
        templateId,
        req.auth!.tenantId,
        req.auth!.userId,
        trigger ? { type: trigger.type as import('./agents/anygen-sop').SOPTriggerType, source: trigger.source } : { type: 'manual' as const },
        input || {}
      );
      res.json({ execution });
    } catch (e: unknown) {
      res.status(400).json({ error: String(e) });
    }
  });

  // 获取执行实例列表
  apiRouter.get('/anygen/sop/executions', requireAuth as ReqHandler, (req, res) => {
    const { status } = req.query;
    const executions = sopEngine.getTenantExecutions(req.auth!.tenantId, status as any);
    res.json({ executions, total: executions.length });
  });

  // 获取单个执行实例
  apiRouter.get('/anygen/sop/executions/:id', requireAuth as ReqHandler, (req, res) => {
    const execution = sopEngine.getExecution(req.params.id);
    if (!execution) return res.status(404).json({ error: '执行实例不存在' });
    if (execution.tenantId !== req.auth!.tenantId) return res.status(403).json({ error: '无权访问' });
    res.json({ execution });
  });

  // 人工确认 SOP 节点
  apiRouter.post('/anygen/sop/executions/:executionId/confirm', requireAuth as ReqHandler, (req, res) => {
    const { nodeId, answer } = req.body as { nodeId?: string; answer?: string };
    if (!nodeId || answer === undefined) return res.status(400).json({ error: '缺少 nodeId 或 answer' });
    const ok = sopEngine.confirmNode(req.params.executionId, nodeId, answer, req.auth!.userId);
    if (!ok) return res.status(400).json({ error: '确认失败，可能已超时或执行已完成' });
    res.json({ success: true });
  });

  // 取消 SOP 执行
  apiRouter.delete('/anygen/sop/executions/:id', requireAuth as ReqHandler, (req, res) => {
    const ok = sopEngine.cancelExecution(req.params.id, req.auth!.tenantId);
    res.json({ success: ok });
  });

  // ══════════════════════════════════════════════════════════════
  // CRM 多渠道客户管理系统 API
  // 集成：sonov.io邮件营销 / 谷歌广告 / 全球社媒 / simiaiclaw.com询盘
  // ══════════════════════════════════════════════════════════════
  const { crmService } = await import('./crm');

  // 仪表盘
  apiRouter.get('/crm/dashboard', requireAuth as ReqHandler, (req, res) => {
    const dash = crmService.getDashboard(req.auth!.tenantId);
    res.json(dash);
  });

  // 初始化示例数据
  apiRouter.post('/crm/init-demo', requireAuth as ReqHandler, (req, res) => {
    crmService.seedDemoData(req.auth!.tenantId);
    res.json({ success: true });
  });

  // 客户列表
  apiRouter.get('/crm/customers', requireAuth as ReqHandler, (req, res) => {
    const { search, source, status, tag } = req.query;
    const customers = crmService.getCustomers(req.auth!.tenantId, {
      search: search as string,
      source: source as any,
      status: status as any,
      tag: tag as string,
    });
    res.json(customers);
  });

  // 添加客户
  apiRouter.post('/crm/customers', requireAuth as ReqHandler, (req, res) => {
    const customer = crmService.addCustomer(req.auth!.tenantId, req.body);
    res.json(customer);
  });

  // 更新客户
  apiRouter.put('/crm/customers/:id', requireAuth as ReqHandler, (req, res) => {
    const customer = crmService.updateCustomer(req.params.id, req.auth!.tenantId, req.body);
    if (!customer) return res.status(404).json({ error: '客户不存在' });
    res.json(customer);
  });

  // 删除客户
  apiRouter.delete('/crm/customers/:id', requireAuth as ReqHandler, (req, res) => {
    const ok = crmService.deleteCustomer(req.params.id, req.auth!.tenantId);
    res.json({ success: ok });
  });

  // 邮件账号管理
  apiRouter.get('/crm/email-accounts', requireAuth as ReqHandler, (req, res) => {
    res.json(crmService.getEmailAccounts(req.auth!.tenantId));
  });

  apiRouter.post('/crm/email-accounts', requireAuth as ReqHandler, (req, res) => {
    const account = crmService.addEmailAccount(req.auth!.tenantId, req.body);
    res.json(account);
  });

  apiRouter.delete('/crm/email-accounts/:id', requireAuth as ReqHandler, (req, res) => {
    res.json({ success: crmService.deleteEmailAccount(req.params.id, req.auth!.tenantId) });
  });

  // 邮件营销活动
  apiRouter.get('/crm/campaigns', requireAuth as ReqHandler, (req, res) => {
    res.json(crmService.getCampaigns(req.auth!.tenantId));
  });

  apiRouter.post('/crm/campaigns', requireAuth as ReqHandler, (req, res) => {
    const campaign = crmService.createCampaign(req.auth!.tenantId, req.body, req.auth!.userId);
    res.json(campaign);
  });

  apiRouter.post('/crm/campaigns/:id/send', requireAuth as ReqHandler, (req, res) => {
    const customers = crmService.getCustomers(req.auth!.tenantId);
    const result = crmService.sendCampaign(req.params.id, req.auth!.tenantId, customers);
    res.json(result);
  });

  // 渠道来源管理
  apiRouter.get('/crm/channels', requireAuth as ReqHandler, (req, res) => {
    res.json(crmService.getChannels(req.auth!.tenantId));
  });

  apiRouter.post('/crm/channels', requireAuth as ReqHandler, (req, res) => {
    const channel = crmService.addChannel(req.auth!.tenantId, req.body);
    res.json(channel);
  });

  apiRouter.put('/crm/channels/:id', requireAuth as ReqHandler, (req, res) => {
    const channel = crmService.updateChannel(req.params.id, req.auth!.tenantId, req.body);
    if (!channel) return res.status(404).json({ error: '渠道不存在' });
    res.json(channel);
  });

  apiRouter.delete('/crm/channels/:id', requireAuth as ReqHandler, (req, res) => {
    res.json({ success: crmService.deleteChannel(req.params.id, req.auth!.tenantId) });
  });

  // 活动日志
  apiRouter.get('/crm/activity', requireAuth as ReqHandler, (req, res) => {
    const limit = parseInt(req.query.limit as string || '50');
    res.json(crmService.getRecentActivity(req.auth!.tenantId, limit));
  });

  console.log('🎯 CRM 多渠道AI客户管理系统路由已注册: /api/crm/*');

  // ══════════════════════════════════════════════════════════════
  // AnyGen 外贸助手 Webhook 触发器（支持外部事件接入）
  // ══════════════════════════════════════════════════════════════

  // 接收外部 Webhook 触发 SOP
  apiRouter.post('/anygen/sop/webhook/:templateId', async (req, res) => {
    const { templateId } = req.params;
    const signature = (req.headers['x-sop-signature'] as string) || '';
    const template = sopEngine.getTemplate(templateId);
    if (!template) return res.status(404).json({ error: 'SOP 模板不存在' });
    // Webhook 安全校验（可选）
    if (template.trigger.webhookSecret && signature !== template.trigger.webhookSecret) {
      return res.status(401).json({ error: '签名校验失败' });
    }
    try {
      const execution = await sopEngine.execute(
        templateId,
        'webhook-tenant',
        'webhook-user',
        { type: 'webhook', source: req.ip },
        req.body
      );
      res.json({ success: true, executionId: execution.id });
    } catch (e: unknown) {
      res.status(400).json({ error: String(e) });
    }
  });

  //  ── 静态文件服务 ───────────────────────────────────────────

  if (fs.existsSync(distPath)) {
    apiRouter.use(express.static(distPath));
    apiRouter.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log(`[Web] 前端静态文件: ${distPath}`);
  } else {
    console.log('[Web] ⚠️ 未找到前端构建文件，运行 `cd client && npm install && npm run build` 构建前端');
  }

  // ── 启动 ──────────────────────────────────────────────────
  if (full) {
    heartbeatMonitor.start();
    console.log('[Web] 💓 Heartbeat 监控已启动');
  }

  // 预获取 OneEval 状态（避免 app.listen 回调中的 await）
  const oneEvalStatus = await oneEvalService.getStatus();

  app.listen(port, () => {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`🦞 SIMIAICLAW 龙虾集群太极64卦系统`);
    console.log(`${'─'.repeat(60)}`);
    console.log(`🌐 Web 控制台: http://localhost:${port}`);
    console.log(`📡 API 基础地址: http://localhost:${port}/api`);
    console.log(`🤖 AI 模式: ${llmClient.isSimulating() ? '⚠️ 模拟（配置 API Key 启用真实AI）' : '✅ 真实AI在线'}`);
    console.log(`💰 支付网关: ${paymentGateway ? '✅ 已加载' : '⚠️ 未配置'}`);
    console.log(`🔐 多租户认证: ✅ 已启用`);
    console.log(`🤖 Gemini 文案+生图: ${geminiClient.isAvailable() ? '✅ 已启用' : '⚠️ 本地模拟（配置 GEMINI_API_KEY 启用）'}`);
    console.log(`📚 NotebookLM 知识库: ${notebookLMService.getStatus().available ? '✅ 已启用' : '⚠️ 本地模拟（配置 Google Cloud 启用）'}`);
    console.log(`📊 OneEval 评测框架: ${oneEvalStatus.oneEvalInstalled ? '✅ 已安装' : '⚠️ 未安装（pip install -e . 安装后启用真实评测）'}`);
    console.log(`${'─'.repeat(60)}\n`);
    console.log('📌 API 路由:');
    console.log('  POST /api/auth/register  — 注册 {email,password,displayName,tenantName?}');
    console.log('  POST /api/auth/login     — 登录 {email,password,tenantId?}');
    console.log('  POST /api/auth/refresh  — 刷新Token {refreshToken}');
    console.log('  GET  /api/auth/me        — 当前用户信息');
    console.log('  POST /api/auth/switch-tenant — 切换租户 {tenantId}');
    console.log('  GET  /api/status         — 系统完整状态（已认证）');
    console.log('  POST /api/execute        — 执行指令 {command, lane?}');
    console.log('  GET  /api/health         — 健康报告');
    console.log('  GET  /api/llm/stats      — AI 用量统计');
    console.log('  GET  /api/payments/stats — 支付统计');
    console.log('  POST /api/payments/pay   — 发起支付');
    console.log('  GET  /api/openspace/search?q=关键词 — 知识检索');
    console.log('');
  });
}

// ============================================================
// 入口选择
// ============================================================
const mode = process.argv[2] || 'demo';

if (mode === 'web') {
  startWebServer(false);
} else if (mode === 'full') {
  startWebServer(true);
} else {
  runDemo().catch(console.error);
}

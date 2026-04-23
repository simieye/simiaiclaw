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
import { orchestrator } from './orchestrator';
import { heartbeatMonitor } from './heartbeat';
import { openSpace } from './openspace';
import { clawTip } from './clawtip';
import { llmClient } from './llm';
import { paymentGateway } from './payments';
import { subscriptionService, COMPANY_INFO } from './subscription';
import { authService, authMiddleware, requireAuth, requireRole } from './auth';
import { JWTPayload } from './auth';

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

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());

  // ── Auth 中间件（挂载到 req.auth） ─────────────────────────
  app.use(authMiddleware(authService));

  // ── Auth 路由 ──────────────────────────────────────────────

  // 注册（创建账号 + 创建/加入租户）
  app.post('/api/auth/register', async (req, res) => {
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
  app.post('/api/auth/login', async (req, res) => {
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
  app.post('/api/auth/refresh', (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: '缺少 refreshToken' });
    const result = authService.refreshToken(refreshToken);
    if (!result.success) {
      return res.status(401).json({ error: result.error });
    }
    res.json({ user: result.user, tenant: result.tenant, tokens: result.tokens });
  });

  // 获取当前用户信息
  app.get('/api/auth/me', requireAuth as Parameters<typeof app.get>[2], (req, res) => {
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
  app.post('/api/auth/switch-tenant', requireAuth as Parameters<typeof app.post>[2], (req, res) => {
    const { tenantId } = req.body;
    const result = authService.switchTenant(req.auth!.userId, tenantId);
    if (!result.success) return res.status(400).json({ error: result.error });
    res.json({ tenant: result.tenant, tokens: result.tokens });
  });

  // 获取用户的租户列表
  app.get('/api/auth/tenants', requireAuth as Parameters<typeof app.get>[2], (req, res) => {
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
  app.post('/api/tenants/invite', requireAuth as Parameters<typeof app.post>[2], (req, res) => {
    const { email, role } = req.body;
    const result = authService.inviteMember(req.auth!.tenantId, req.auth!.userId, email, role);
    res.json(result);
  });

  // 更新用户资料
  app.patch('/api/auth/me', requireAuth as Parameters<typeof app.patch>[2], (req, res) => {
    const user = authService.updateUser(req.auth!.userId, req.body);
    if (!user) return res.status(404).json({ error: '用户不存在' });
    res.json({ user });
  });

  // ── 系统状态（已认证） ────────────────────────────────────
  app.get('/api/status', (_req, res) => {
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
  app.post('/api/execute', async (req, res) => {
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
  app.get('/api/health', (_req, res) => {
    res.json(heartbeatMonitor.generateHealthReport());
  });

  // LLM 统计
  app.get('/api/llm/stats', (_req, res) => {
    res.json(llmClient.getStats());
  });

  // 支付统计
  app.get('/api/payments/stats', (_req, res) => {
    res.json(paymentGateway.getStats());
  });

  // 待审批支付列表
  app.get('/api/payments/pending', (_req, res) => {
    res.json(paymentGateway.getPendingApprovals());
  });

  // 审批支付
  app.post('/api/payments/approve', async (req, res) => {
    const { paymentId, approverNote } = req.body;
    const ok = await paymentGateway.approve(paymentId, approverNote);
    res.json({ success: ok });
  });

  // 拒绝支付
  app.post('/api/payments/reject', async (req, res) => {
    const { paymentId, reason } = req.body;
    const ok = await paymentGateway.reject(paymentId, reason);
    res.json({ success: ok });
  });

  // 发起支付
  app.post('/api/payments/pay', async (req, res) => {
    try {
      const result = await paymentGateway.pay(req.body);
      res.json(result);
    } catch (e) {
      res.status(500).json({ success: false, error: String(e) });
    }
  });

  // 零钱包充值
  app.post('/api/payments/deposit', async (req, res) => {
    const { userId, amount, provider } = req.body;
    const result = await paymentGateway.deposit(userId, amount, provider);
    res.json(result);
  });

  // ══════════════════════════════════════════════════════════════
  // 订阅系统 API（个人/团队/企业三层订阅）
  // ══════════════════════════════════════════════════════════════

  // 获取订阅计划列表
  app.get('/api/subscription/plans', (_req, res) => {
    const plans = subscriptionService.getPlans();
    res.json({ plans, company: COMPANY_INFO });
  });

  // 获取单个订阅计划详情
  app.get('/api/subscription/plans/:planId', (req, res) => {
    const plan = subscriptionService.getPlanById(req.params.planId);
    if (!plan) return res.status(404).json({ error: '订阅计划不存在' });
    res.json({ plan, company: COMPANY_INFO });
  });

  // 获取当前租户的订阅状态
  app.get('/api/subscription/current', (req, res) => {
    const tenantId = req.auth?.tenantId;
    if (!tenantId) return res.status(401).json({ error: '请先登录' });
    const active = subscriptionService.getActiveSubscription(tenantId);
    const history = subscriptionService.getTenantSubscriptions(tenantId);
    res.json({ active, history, total: history.length });
  });

  // 创建订阅订单（生成待支付订单）
  app.post('/api/subscription/orders', requireAuth as Parameters<typeof app.post>[2], (req, res) => {
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
  app.delete('/api/subscription/orders/:orderId', requireAuth as Parameters<typeof app.delete>[2], (req, res) => {
    const ok = subscriptionService.cancelOrder(req.params.orderId);
    res.json({ success: ok });
  });

  // 获取待审批的订阅订单（管理员）
  app.get('/api/subscription/pending', (req, res) => {
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
  app.post('/api/subscription/approve', requireAuth as Parameters<typeof app.post>[2], (req, res) => {
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
  app.post('/api/subscription/reject', requireAuth as Parameters<typeof app.post>[2], (req, res) => {
    const { orderId, reason } = req.body as { orderId: string; reason: string };
    if (!orderId) return res.status(400).json({ error: '缺少 orderId' });
    if (!reason) return res.status(400).json({ error: '缺少拒绝原因' });
    const ok = subscriptionService.rejectOrder(orderId, reason);
    res.json({ success: ok });
  });

  // 订阅统计（管理员）
  app.get('/api/subscription/stats', (_req, res) => {
    res.json(subscriptionService.getStats());
  });

  // OpenSpace 知识库
  app.get('/api/openspace/search', (req, res) => {
    const { q, lane } = req.query;
    const results = openSpace.search(
      String(q || ''),
      lane ? [lane as Parameters<typeof openSpace.search>[1]] : undefined
    );
    res.json({ results, total: results.length });
  });

  // ══════════════════════════════════════════════════════════════
  // Skill 商店 API
  // ══════════════════════════════════════════════════════════════
  const { skillService } = await import('./skills');

  // 获取技能列表（支持 source/category/search 过滤）
  app.get('/api/skills', (req, res) => {
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
  app.get('/api/skills/:id', (req, res) => {
    const tenantId = req.auth?.tenantId || 'demo';
    const skill = skillService.getSkill(req.params.id, tenantId);
    if (!skill) return res.status(404).json({ error: '技能不存在' });
    res.json({ skill });
  });

  // 安装技能
  app.post('/api/skills/:id/install', requireAuth as Parameters<typeof app.post>[2], (req, res) => {
    const ok = skillService.installSkill(req.params.id, req.auth!.tenantId);
    res.json({ success: ok });
  });

  // 卸载技能
  app.delete('/api/skills/:id/install', requireAuth as Parameters<typeof app.delete>[2], (req, res) => {
    const ok = skillService.uninstallSkill(req.params.id, req.auth!.tenantId);
    res.json({ success: ok });
  });

  // 创建自定义技能（需登录）
  app.post('/api/skills', requireAuth as Parameters<typeof app.post>[2], (req, res) => {
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
  app.post('/api/skills/:id/reward', requireAuth as Parameters<typeof app.post>[2], (req, res) => {
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
  app.get('/api/skillhub/catalog', async (req, res) => {
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
  app.get('/api/skillhub/trending', async (req, res) => {
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
  app.get('/api/skillhub/latest', async (req, res) => {
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
  app.post('/api/skillhub/search', async (req, res) => {
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
  app.get('/api/skillhub/recommend', async (req, res) => {
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
  app.post('/api/skillhub/install', requireAuth as Parameters<typeof app.post>[2], async (req, res) => {
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
      const msg = e instanceof Error ? (e.stderr || e.message) : String(e);
      console.error('[SkillHub] install error:', msg);
      res.status(500).json({ error: '安装失败', detail: msg });
    }
  });

  // 获取已从 SkillHub 安装的技能列表
  app.get('/api/skillhub/installed', (req, res) => {
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
  app.get('/api/openspace/status', async (_req, res) => {
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
  app.get('/api/openspace/cloud/skills', async (req, res) => {
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
  app.post('/api/openspace/cloud/download', requireAuth as Parameters<typeof app.post>[2], async (req, res) => {
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
  app.post('/api/openspace/cloud/upload', requireAuth as Parameters<typeof app.post>[2], async (req, res) => {
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
  app.get('/api/openspace/local/skills', (_req, res) => {
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
  app.get('/api/heygen/status', (_req, res) => {
    const apiKey = process.env.HEYGEN_API_KEY;
    res.json({
      configured: !!apiKey,
      endpoint: 'https://api.heygen.com/v2/video-agents',
      docsUrl: 'https://developers.heygen.com/',
      features: ['text-to-video', 'avatar', 'voice', 'translation', 'lipsync'],
    });
  });

  // 创建 Video Agent 任务（自然语言生成视频）
  app.post('/api/heygen/video/generate', requireAuth as Parameters<typeof app.post>[2], async (req, res) => {
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
  app.get('/api/heygen/video/:videoId', requireAuth as Parameters<typeof app.get>[2], async (req, res) => {
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
  app.get('/api/heygen/resources', requireAuth as Parameters<typeof app.get>[2], async (_req, res) => {
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
  // Ollama 本地大模型 API
  // https://ollama.com · http://localhost:11434
  // ══════════════════════════════════════════════════════════════

  // Ollama 状态检测
  app.get('/api/ollama/status', async (_req, res) => {
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
  app.get('/api/ollama/models', async (_req, res) => {
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
  app.post('/api/ollama/start', requireAuth as Parameters<typeof app.post>[2], async (req, res) => {
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
  app.get('/api/huobao/status', async (_req, res) => {
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
  app.get('/api/huobao/models', requireAuth as Parameters<typeof app.get>[2], async (_req, res) => {
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
  app.post('/api/huobao/chat', requireAuth as Parameters<typeof app.post>[2], async (req, res) => {
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
        response.body?.pipe(res);
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
  app.get('/api/llm/routing', (_req, res) => {
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
  app.get('/api/hexagrams', (_req, res) => {
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
  app.get('/api/hexagrams/:id', (req, res) => {
    const hex = HEXAGRAM_64.find(h => h.id === req.params.id);
    if (!hex) return res.status(404).json({ error: '卦位不存在' });
    const { getCollabChain } = require('./data/hexagram64');
    res.json({ hex, collabChain: getCollabChain(hex.collabWith) });
  });

  // 获取自定义 Agent 列表
  app.get('/api/agents/custom', (req, res) => {
    const tenantId = req.auth?.tenantId || 'demo';
    const agents = skillService.getCustomAgents(tenantId);
    res.json({ agents, total: agents.length });
  });

  // 自然语言创建自定义 Agent
  app.post('/api/agents/custom/from-text', requireAuth as Parameters<typeof app.post>[2], (req, res) => {
    const { naturalLanguage } = req.body;
    if (!naturalLanguage) return res.status(400).json({ error: '请提供自然语言描述' });
    const agent = skillService.createAgentFromNaturalLanguage(
      req.auth!.tenantId, req.auth!.userId, naturalLanguage
    );
    res.json({ agent, message: `已创建「${agent.name}」：${agent.description}` });
  });

  // 更新自定义 Agent
  app.patch('/api/agents/custom/:id', requireAuth as Parameters<typeof app.patch>[2], (req, res) => {
    const agent = skillService.updateCustomAgent(req.params.id, req.auth!.tenantId, req.body);
    if (!agent) return res.status(404).json({ error: 'Agent 不存在' });
    res.json({ agent });
  });

  // 删除自定义 Agent
  app.delete('/api/agents/custom/:id', requireAuth as Parameters<typeof app.delete>[2], (req, res) => {
    const ok = skillService.deleteCustomAgent(req.params.id, req.auth!.tenantId);
    res.json({ success: ok });
  });

  // ══════════════════════════════════════════════════════════════
  // MCP 连接器 API
  // ══════════════════════════════════════════════════════════════
  const { mcpService } = await import('./mcp');

  app.get('/api/mcp/templates', (_req, res) => {
    res.json({ templates: mcpService.getTemplates() });
  });

  app.get('/api/mcp/servers', (req, res) => {
    const tenantId = req.auth?.tenantId || 'demo';
    res.json({ servers: mcpService.getServers(tenantId) });
  });

  app.post('/api/mcp/servers', requireAuth as Parameters<typeof app.post>[2], (req, res) => {
    const { templateId, name, config } = req.body;
    if (!templateId || !config) return res.status(400).json({ error: '缺少 templateId 或 config' });
    try {
      const server = mcpService.createServer(req.auth!.tenantId, req.auth!.userId, templateId, name || '', config);
      res.json({ server });
    } catch (e: unknown) {
      res.status(400).json({ error: String((e as Error).message) });
    }
  });

  app.patch('/api/mcp/servers/:id', requireAuth as Parameters<typeof app.patch>[2], (req, res) => {
    const server = mcpService.updateServer(req.params.id, req.body);
    if (!server) return res.status(404).json({ error: '服务器不存在' });
    res.json({ server });
  });

  app.delete('/api/mcp/servers/:id', requireAuth as Parameters<typeof app.delete>[2], (req, res) => {
    res.json({ success: mcpService.deleteServer(req.params.id) });
  });

  app.post('/api/mcp/servers/:id/test', requireAuth as Parameters<typeof app.post>[2], async (req, res) => {
    const result = await mcpService.testConnection(req.params.id);
    res.json(result);
  });

  // ══════════════════════════════════════════════════════════════
  // AI 大模型市场 API（1000+ 全球模型）
  // ══════════════════════════════════════════════════════════════
  const { modelService } = await import('./mcp');

  app.get('/api/models', (req, res) => {
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

  app.get('/api/models/stats', (_req, res) => {
    res.json(modelService.getStats());
  });

  app.get('/api/models/providers', (_req, res) => {
    res.json({ providers: modelService.getProviders() });
  });

  app.patch('/api/models/:id/connect', requireAuth as Parameters<typeof app.patch>[2], (req, res) => {
    const { apiKey } = req.body;
    if (!apiKey) return res.status(400).json({ error: '需要提供 API Key' });
    const model = modelService.connectModel(req.params.id, apiKey);
    if (!model) return res.status(404).json({ error: '模型不存在' });
    res.json({ model, message: `${model.name} 已连接` });
  });

  app.patch('/api/models/:id/disconnect', requireAuth as Parameters<typeof app.patch>[2], (req, res) => {
    const model = modelService.disconnectModel(req.params.id);
    if (!model) return res.status(404).json({ error: '模型不存在' });
    res.json({ model });
  });

  //  ── 静态文件服务 ───────────────────────────────────────────
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
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

  app.listen(port, () => {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`🦞 SIMIAICLAW 龙虾集群太极64卦系统`);
    console.log(`${'─'.repeat(60)}`);
    console.log(`🌐 Web 控制台: http://localhost:${port}`);
    console.log(`📡 API 基础地址: http://localhost:${port}/api`);
    console.log(`🤖 AI 模式: ${llmClient.isSimulating() ? '⚠️ 模拟（配置 API Key 启用真实AI）' : '✅ 真实AI在线'}`);
    console.log(`💰 支付网关: ${paymentGateway ? '✅ 已加载' : '⚠️ 未配置'}`);
    console.log(`🔐 多租户认证: ✅ 已启用`);
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

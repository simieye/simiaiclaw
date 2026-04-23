/**
 * SIMIAICLAW 龙虾集群太极64卦系统
 * 订阅系统 — 个人/团队/企业三层订阅计划
 *
 * 定价：
 *   个人：199/月  599/季度  3999/半年  6990/年
 *   团队：999/月  2999/季度  5999/半年  12999/年
 *   企业：2999/月起（按需订阅，按token使用量计费）
 *
 * 支付方式：微信 / 支付宝 / 企业对公转账
 *
 * 企业账户信息：
 *   账户名称: 深圳市斯密爱科技有限公司
 *   账户号码: 4000020709200461489
 *   开户银行: 中国工商银行股份有限公司深圳华城支行
 *   法定代表人: 何明旺
 *   企业名称: 深圳市斯密爱科技有限公司
 *   企业统一码: 91440300MAG1CEBT8B
 */

import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

// ============================================================
// 常量
// ============================================================

export const COMPANY_INFO = {
  name: '深圳市斯密爱科技有限公司',
  bankAccount: '4000020709200461489',
  bank: '中国工商银行股份有限公司深圳华城支行',
  legalPerson: '何明旺',
  unifiedCode: '91440300MAG1CEBT8B',
};

// 订阅计划定义
export type SubscriptionTier = 'personal' | 'team' | 'enterprise';
export type BillingCycle = 'monthly' | 'quarterly' | 'halfyearly' | 'yearly';

export interface SubscriptionPlan {
  id: string;
  tier: SubscriptionTier;
  name: string;
  nameEn: string;
  description: string;
  features: string[];
  tokenQuota: string;       // token 配额描述
  price: {
    monthly: number;
    quarterly: number;
    halfyearly: number;
    yearly: number;
  };
  color: string;
  gradient: string;
  popular?: boolean;        // 推荐标识
  enterpriseMinMonthly?: number; // 企业最低月费
}

// 预置订阅计划
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'personal-monthly',
    tier: 'personal',
    name: '个人版',
    nameEn: 'Personal',
    description: '适合独立创业者与自由职业者',
    features: [
      '✅ 访问所有 AI 太极工具',
      '✅ 月度任务量：1000 次',
      '✅ Token 配额：100万/月',
      '✅ 64卦智能体系统',
      '✅ MCP 连接器（5个）',
      '✅ 技能商店访问权',
      '✅ 邮件支持',
    ],
    tokenQuota: '100万 token/月',
    price: { monthly: 199, quarterly: 599, halfyearly: 3999, yearly: 6990 },
    color: '#10b981',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'personal-quarterly',
    tier: 'personal',
    name: '个人版·季度',
    nameEn: 'Personal Q',
    description: '季度付更优惠，立省 ¥998',
    features: [
      '✅ 访问所有 AI 太极工具',
      '✅ 月度任务量：1200 次（含10%加速包）',
      '✅ Token 配额：150万/月',
      '✅ 64卦智能体系统',
      '✅ MCP 连接器（8个）',
      '✅ 技能商店访问权',
      '✅ 优先邮件支持',
    ],
    tokenQuota: '150万 token/月',
    price: { monthly: 199.67, quarterly: 599, halfyearly: 0, yearly: 0 },
    color: '#10b981',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'personal-halfyearly',
    tier: 'personal',
    name: '个人版·半年',
    nameEn: 'Personal H',
    description: '半年付最划算，立省 ¥3005',
    features: [
      '✅ 访问所有 AI 太极工具',
      '✅ 月度任务量：1500 次',
      '✅ Token 配额：200万/月',
      '✅ 64卦智能体系统',
      '✅ MCP 连接器（10个）',
      '✅ 技能商店 + 打赏特权',
      '✅ 优先邮件支持',
    ],
    tokenQuota: '200万 token/月',
    price: { monthly: 666.5, quarterly: 0, halfyearly: 3999, yearly: 0 },
    color: '#10b981',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'personal-yearly',
    tier: 'personal',
    name: '个人版·年费',
    nameEn: 'Personal Y',
    description: '年度订阅，享最大优惠，立省 ¥4602',
    features: [
      '✅ 访问所有 AI 太极工具',
      '✅ 月度任务量：2000 次',
      '✅ Token 配额：300万/月',
      '✅ 64卦智能体系统',
      '✅ MCP 连接器（15个）',
      '✅ 技能商店 + 打赏特权',
      '✅ 专属客户成功经理',
    ],
    tokenQuota: '300万 token/月',
    price: { monthly: 582.5, quarterly: 0, halfyearly: 0, yearly: 6990 },
    color: '#10b981',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'team-monthly',
    tier: 'team',
    name: '团队版',
    nameEn: 'Team',
    description: '适合小型团队与创业公司',
    features: [
      '✅ 最多 10 名团队成员',
      '✅ 月度任务量：5000 次',
      '✅ Token 配额：500万/月',
      '✅ 64卦智能体系统',
      '✅ MCP 连接器（20个）',
      '✅ 技能商店 + 打赏特权',
      '✅ 团队管理控制台',
      '✅ 优先邮件+群组支持',
    ],
    tokenQuota: '500万 token/月',
    price: { monthly: 999, quarterly: 2999, halfyearly: 5999, yearly: 12999 },
    color: '#3b82f6',
    gradient: 'from-blue-500 to-indigo-600',
    popular: true,
  },
  {
    id: 'team-quarterly',
    tier: 'team',
    name: '团队版·季度',
    nameEn: 'Team Q',
    description: '季度付更优惠，立省 ¥998',
    features: [
      '✅ 最多 12 名团队成员',
      '✅ 月度任务量：6000 次',
      '✅ Token 配额：600万/月',
      '✅ 64卦智能体系统',
      '✅ MCP 连接器（25个）',
      '✅ 技能商店 + 打赏特权',
      '✅ 团队管理控制台',
      '✅ 优先邮件+群组支持',
    ],
    tokenQuota: '600万 token/月',
    price: { monthly: 999.67, quarterly: 2999, halfyearly: 0, yearly: 0 },
    color: '#3b82f6',
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'team-halfyearly',
    tier: 'team',
    name: '团队版·半年',
    nameEn: 'Team H',
    description: '半年付最划算，立省 ¥5005',
    features: [
      '✅ 最多 15 名团队成员',
      '✅ 月度任务量：7000 次',
      '✅ Token 配额：800万/月',
      '✅ 64卦智能体系统',
      '✅ MCP 连接器（30个）',
      '✅ 技能商店 + 打赏特权',
      '✅ 团队管理控制台',
      '✅ 优先邮件+群组支持',
    ],
    tokenQuota: '800万 token/月',
    price: { monthly: 999.83, quarterly: 0, halfyearly: 5999, yearly: 0 },
    color: '#3b82f6',
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'team-yearly',
    tier: 'team',
    name: '团队版·年费',
    nameEn: 'Team Y',
    description: '年度订阅，享最大优惠，立省 ¥10893',
    features: [
      '✅ 最多 20 名团队成员',
      '✅ 月度任务量：10000 次',
      '✅ Token 配额：1000万/月',
      '✅ 64卦智能体系统',
      '✅ MCP 连接器（无限）',
      '✅ 技能商店 + 打赏特权',
      '✅ 团队管理控制台',
      '✅ 专属客户成功经理',
    ],
    tokenQuota: '1000万 token/月',
    price: { monthly: 1083.25, quarterly: 0, halfyearly: 0, yearly: 12999 },
    color: '#3b82f6',
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'enterprise-custom',
    tier: 'enterprise',
    name: '企业版',
    nameEn: 'Enterprise',
    description: '按需订阅，按实际 token 使用量计费，适合中大型企业',
    features: [
      '✅ 无限制团队成员',
      '✅ 无限制任务量',
      '✅ 按量计费（实际消耗 token × 单价）',
      '✅ 64卦智能体系统',
      '✅ MCP 连接器（无限）',
      '✅ 技能商店 + 打赏特权',
      '✅ 专属客户成功经理',
      '✅ SSO 单点登录',
      '✅ 私有化部署方案',
      '✅ 7×24 专属技术支持',
    ],
    tokenQuota: '按需弹性计费',
    price: { monthly: 2999, quarterly: 0, halfyearly: 0, yearly: 0 },
    color: '#8b5cf6',
    gradient: 'from-violet-600 to-purple-700',
    enterpriseMinMonthly: 2999,
  },
];

// ============================================================
// 类型定义
// ============================================================

export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'trial' | 'pending';

export interface SubscriptionRecord {
  id: string;
  tenantId: string;
  userId: string;
  planId: string;
  tier: SubscriptionTier;
  billingCycle: BillingCycle;
  amount: number;         // 实际支付金额（分）
  currency: 'CNY';
  status: SubscriptionStatus;
  startedAt: string | Date;     // 订阅开始时间
  expiresAt: string | Date;      // 订阅到期时间
  autoRenew: boolean;
  paymentMethod: 'wechat' | 'alipay' | 'bank_transfer' | 'unknown';
  paymentProof?: string;  // 支付凭证截图URL（管理员审批用）
  approvedAt?: string;    // 管理员审批通过时间
  approvedBy?: string;    // 审批人
  createdAt: string | Date;
  updatedAt: string | Date;
  note?: string;          // 管理员备注
}

export interface SubscriptionOrder {
  id: string;
  orderNo: string;        // 订单号
  tenantId: string;
  userId: string;
  planId: string;
  tier: SubscriptionTier;
  billingCycle: BillingCycle;
  amount: number;         // 分
  currency: 'CNY';
  status: 'pending' | 'paid' | 'cancelled' | 'refunded';
  paymentMethod?: 'wechat' | 'alipay' | 'bank_transfer';
  qrCodeUrl?: string;    // 微信/支付宝二维码URL
  bankInfo?: typeof COMPANY_INFO; // 企业转账信息
  expiresAt: string | Date;
  createdAt: string | Date;
  paidAt?: string;
  note?: string;          // 管理员备注
}

export interface SubscriptionStats {
  total: number;
  active: number;
  expired: number;
  pending: number;
  revenue: number;       // 分
  byTier: Record<SubscriptionTier, number>;
  byCycle: Record<BillingCycle, number>;
}

// ============================================================
// 订阅服务
// ============================================================

export class SubscriptionService {
  private dataPath: string;
  private records: Map<string, SubscriptionRecord> = new Map();
  private orders: Map<string, SubscriptionOrder> = new Map();
  private pendingApprovals: Map<string, SubscriptionOrder> = new Map();

  constructor(dataDir = './data/subscription') {
    this.dataPath = dataDir;
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    this.load();
    console.log('[SubscriptionService] 📦 订阅系统初始化');
  }

  private load(): void {
    const recordsPath = path.join(this.dataPath, 'records.json');
    const ordersPath = path.join(this.dataPath, 'orders.json');

    if (fs.existsSync(recordsPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(recordsPath, 'utf-8'));
        (data.records || []).forEach((r: SubscriptionRecord) => {
          this.records.set(r.id, {
            ...r,
            startedAt: new Date(r.startedAt),
            expiresAt: new Date(r.expiresAt),
            createdAt: new Date(r.createdAt),
            updatedAt: new Date(r.updatedAt),
            approvedAt: r.approvedAt ? new Date(r.approvedAt) : undefined,
          } as SubscriptionRecord);
        });
      } catch { /* ignore */ }
    }

    if (fs.existsSync(ordersPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(ordersPath, 'utf-8'));
        (data.orders || []).forEach((o: SubscriptionOrder) => {
          this.orders.set(o.id, {
            ...o,
            createdAt: new Date(o.createdAt),
            paidAt: o.paidAt ? new Date(o.paidAt) : undefined,
            expiresAt: new Date(o.expiresAt),
          } as SubscriptionOrder);
        });
        (data.pendingApprovals || []).forEach((o: SubscriptionOrder) => {
          this.pendingApprovals.set(o.id, o as SubscriptionOrder);
        });
      } catch { /* ignore */ }
    }
  }

  private save(): void {
    const recordsPath = path.join(this.dataPath, 'records.json');
    const ordersPath = path.join(this.dataPath, 'orders.json');

    fs.writeFileSync(recordsPath, JSON.stringify({
      records: Array.from(this.records.values()),
    }, null, 2));

    fs.writeFileSync(ordersPath, JSON.stringify({
      orders: Array.from(this.orders.values()),
      pendingApprovals: Array.from(this.pendingApprovals.values()),
    }, null, 2));
  }

  // 获取订阅计划列表
  getPlans(): SubscriptionPlan[] {
    return SUBSCRIPTION_PLANS;
  }

  getPlanById(planId: string): SubscriptionPlan | undefined {
    return SUBSCRIPTION_PLANS.find(p => p.id === planId);
  }

  // 获取租户的当前订阅
  getActiveSubscription(tenantId: string): SubscriptionRecord | null {
    const subs = Array.from(this.records.values());
    const active = subs.find(s =>
      s.tenantId === tenantId &&
      (s.status === 'active' || s.status === 'trial') &&
      new Date(s.expiresAt) > new Date()
    );
    return active || null;
  }

  // 创建订阅订单（生成待支付订单）
  createOrder(params: {
    tenantId: string;
    userId: string;
    planId: string;
    billingCycle: BillingCycle;
    paymentMethod: 'wechat' | 'alipay' | 'bank_transfer';
  }): SubscriptionOrder {
    const plan = this.getPlanById(params.planId);
    if (!plan) throw new Error(`订阅计划不存在: ${params.planId}`);

    const priceKey = params.billingCycle === 'quarterly' ? 'quarterly'
      : params.billingCycle === 'halfyearly' ? 'halfyearly'
      : params.billingCycle === 'yearly' ? 'yearly'
      : 'monthly';
    const amount = plan.price[priceKey];

    if (amount <= 0) throw new Error(`该订阅计划不支持 ${params.billingCycle} 计费周期`);

    // 计算到期时间
    const now = new Date();
    const expiresAt = new Date(now);
    switch (params.billingCycle) {
      case 'monthly': expiresAt.setMonth(expiresAt.getMonth() + 1); break;
      case 'quarterly': expiresAt.setMonth(expiresAt.getMonth() + 3); break;
      case 'halfyearly': expiresAt.setMonth(expiresAt.getMonth() + 6); break;
      case 'yearly': expiresAt.setFullYear(expiresAt.getFullYear() + 1); break;
    }

    const orderId = uuidv4();
    const order: SubscriptionOrder = {
      id: orderId,
      orderNo: `SUB${Date.now()}${uuidv4().slice(0, 6).toUpperCase()}`,
      tenantId: params.tenantId,
      userId: params.userId,
      planId: params.planId,
      tier: plan.tier,
      billingCycle: params.billingCycle,
      amount: Math.round(amount * 100), // 元→分
      currency: 'CNY',
      status: 'pending',
      paymentMethod: params.paymentMethod,
      bankInfo: params.paymentMethod === 'bank_transfer' ? COMPANY_INFO : undefined,
      expiresAt: expiresAt.toISOString(),
      createdAt: now.toISOString(),
    };

    this.orders.set(orderId, order);
    this.pendingApprovals.set(orderId, order);
    this.save();

    console.log(`[Subscription] 📝 创建订单: ${order.orderNo} ¥${amount} (${params.billingCycle})`);
    return order;
  }

  // 模拟支付成功（企业转账审批通过后调用）
  confirmOrder(orderId: string, approvedBy: string, note?: string): SubscriptionRecord | null {
    const order = this.pendingApprovals.get(orderId) || this.orders.get(orderId);
    if (!order) return null;
    if (order.status !== 'pending') return null;

    // 更新订单
    order.status = 'paid';
    order.paidAt = new Date().toISOString();
    this.orders.set(orderId, order);
    this.pendingApprovals.delete(orderId);

    // 创建订阅记录
    const subId = uuidv4();
    const sub: SubscriptionRecord = {
      id: subId,
      tenantId: order.tenantId,
      userId: order.userId,
      planId: order.planId,
      tier: order.tier,
      billingCycle: order.billingCycle,
      amount: order.amount,
      currency: 'CNY',
      status: 'active',
      startedAt: new Date().toISOString(),
      expiresAt: order.expiresAt,
      autoRenew: false,
      paymentMethod: order.paymentMethod || 'unknown',
      approvedAt: new Date().toISOString(),
      approvedBy,
      note,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

      this.records.set(subId, sub);
      this.save();

      console.log(`[Subscription] ✅ 订阅激活: ${subId} → ${order.planId} 至 ${order.expiresAt}`);
    return sub;
  }

  // 取消订单（拒绝/用户取消）
  cancelOrder(orderId: string, reason?: string): boolean {
    const order = this.pendingApprovals.get(orderId) || this.orders.get(orderId);
    if (!order) return false;

    order.status = 'cancelled';
    if (reason) order.note = reason;
    this.orders.set(orderId, order);
    this.pendingApprovals.delete(orderId);
    this.save();

    console.log(`[Subscription] ❌ 订单取消: ${order.orderNo}`);
    return true;
  }

  // 审批订阅订单
  approveOrder(orderId: string, approverId: string, note?: string): SubscriptionRecord | null {
    return this.confirmOrder(orderId, approverId, note);
  }

  // 拒绝订阅订单
  rejectOrder(orderId: string, reason: string): boolean {
    return this.cancelOrder(orderId, `拒绝: ${reason}`);
  }

  // 获取待审批列表（管理员用）
  getPendingApprovals(): SubscriptionOrder[] {
    return Array.from(this.pendingApprovals.values()).filter(o => o.status === 'pending');
  }

  // 获取租户的所有订阅记录
  getTenantSubscriptions(tenantId: string): SubscriptionRecord[] {
    return Array.from(this.records.values())
      .filter(s => s.tenantId === tenantId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // 获取所有订阅记录
  getAllSubscriptions(): SubscriptionRecord[] {
    return Array.from(this.records.values());
  }

  // 统计数据
  getStats(): SubscriptionStats {
    const subs = Array.from(this.records.values());
    const byTier: Record<SubscriptionTier, number> = { personal: 0, team: 0, enterprise: 0 };
    const byCycle: Record<BillingCycle, number> = { monthly: 0, quarterly: 0, halfyearly: 0, yearly: 0 };

    subs.forEach(s => {
      byTier[s.tier]++;
      byCycle[s.billingCycle]++;
    });

    const active = subs.filter(s => s.status === 'active' && new Date(s.expiresAt) > new Date());
    const expired = subs.filter(s => s.status === 'expired' || new Date(s.expiresAt) < new Date());

    return {
      total: subs.length,
      active: active.length,
      expired: expired.length,
      pending: this.pendingApprovals.size,
      revenue: subs.filter(s => s.status === 'active').reduce((sum, s) => sum + s.amount, 0),
      byTier,
      byCycle,
    };
  }
}

// ============================================================
// 导出单例
// ============================================================

export const subscriptionService = new SubscriptionService('./data/subscription');

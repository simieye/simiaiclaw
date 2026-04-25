/**
 * SIMIAICLAW 龙虾集群太极64卦系统
 * 订阅系统面板 — 个人/团队/企业三层订阅计划
 */
import React, { useEffect, useState } from 'react';
import { api, type SubscriptionPlan, type SubscriptionOrder, type CompanyInfo, type SubscriptionRecord } from '../api/client';
import { toast } from 'sonner';

// 订阅计划兜底数据（网络失败时使用）
const FALLBACK_PLANS: SubscriptionPlan[] = [
  { id: 'personal-monthly', tier: 'personal', name: '个人版', nameEn: 'Personal', description: '适合独立创业者与自由职业者', features: ['✅ 访问所有 AI 太极工具', '✅ 月度任务量：1000 次', '✅ Token 配额：100万/月', '✅ 64卦智能体系统', '✅ MCP 连接器（5个）', '✅ 技能商店访问权', '✅ 邮件支持'], tokenQuota: '100万 token/月', price: { monthly: 199, quarterly: 599, halfyearly: 3999, yearly: 6990 }, color: '#10b981', gradient: 'from-emerald-500 to-teal-600' },
  { id: 'personal-quarterly', tier: 'personal', name: '个人版·季度', nameEn: 'Personal Q', description: '季度付更优惠，立省 ¥998', features: ['✅ 访问所有 AI 太极工具', '✅ 月度任务量：1200 次', '✅ Token 配额：150万/月', '✅ 64卦智能体系统', '✅ MCP 连接器（8个）', '✅ 优先邮件支持'], tokenQuota: '150万 token/月', price: { monthly: 199.67, quarterly: 599, halfyearly: 0, yearly: 0 }, color: '#10b981', gradient: 'from-emerald-500 to-teal-600' },
  { id: 'personal-halfyearly', tier: 'personal', name: '个人版·半年', nameEn: 'Personal H', description: '半年付最划算，立省 ¥3005', features: ['✅ 访问所有 AI 太极工具', '✅ 月度任务量：1500 次', '✅ Token 配额：200万/月', '✅ 64卦智能体系统', '✅ MCP 连接器（10个）', '✅ 技能商店 + 打赏特权', '✅ 优先邮件支持'], tokenQuota: '200万 token/月', price: { monthly: 666.5, quarterly: 0, halfyearly: 3999, yearly: 0 }, color: '#10b981', gradient: 'from-emerald-500 to-teal-600' },
  { id: 'personal-yearly', tier: 'personal', name: '个人版·年费', nameEn: 'Personal Y', description: '年度订阅，享最大优惠，立省 ¥4602', features: ['✅ 访问所有 AI 太极工具', '✅ 月度任务量：2000 次', '✅ Token 配额：300万/月', '✅ 64卦智能体系统', '✅ MCP 连接器（15个）', '✅ 专属客户成功经理'], tokenQuota: '300万 token/月', price: { monthly: 582.5, quarterly: 0, halfyearly: 0, yearly: 6990 }, color: '#10b981', gradient: 'from-emerald-500 to-teal-600' },
  { id: 'team-monthly', tier: 'team', name: '团队版', nameEn: 'Team', description: '适合小型团队与创业公司', features: ['✅ 最多 10 名团队成员', '✅ 月度任务量：5000 次', '✅ Token 配额：500万/月', '✅ 64卦智能体系统', '✅ MCP 连接器（20个）', '✅ 团队管理控制台', '✅ 优先邮件+群组支持'], tokenQuota: '500万 token/月', price: { monthly: 999, quarterly: 2999, halfyearly: 5999, yearly: 12999 }, color: '#3b82f6', gradient: 'from-blue-500 to-indigo-600', popular: true },
  { id: 'team-quarterly', tier: 'team', name: '团队版·季度', nameEn: 'Team Q', description: '季度付更优惠，立省 ¥998', features: ['✅ 最多 12 名团队成员', '✅ 月度任务量：6000 次', '✅ Token 配额：600万/月', '✅ MCP 连接器（25个）', '✅ 团队管理控制台'], tokenQuota: '600万 token/月', price: { monthly: 999.67, quarterly: 2999, halfyearly: 0, yearly: 0 }, color: '#3b82f6', gradient: 'from-blue-500 to-indigo-600' },
  { id: 'team-halfyearly', tier: 'team', name: '团队版·半年', nameEn: 'Team H', description: '半年付最划算，立省 ¥5005', features: ['✅ 最多 15 名团队成员', '✅ 月度任务量：7000 次', '✅ Token 配额：800万/月', '✅ MCP 连接器（30个）'], tokenQuota: '800万 token/月', price: { monthly: 999.83, quarterly: 0, halfyearly: 5999, yearly: 0 }, color: '#3b82f6', gradient: 'from-blue-500 to-indigo-600' },
  { id: 'team-yearly', tier: 'team', name: '团队版·年费', nameEn: 'Team Y', description: '年度订阅，享最大优惠，立省 ¥10893', features: ['✅ 最多 20 名团队成员', '✅ 月度任务量：10000 次', '✅ Token 配额：1000万/月', '✅ MCP 连接器（无限）', '✅ 专属客户成功经理'], tokenQuota: '1000万 token/月', price: { monthly: 1083.25, quarterly: 0, halfyearly: 0, yearly: 12999 }, color: '#3b82f6', gradient: 'from-blue-500 to-indigo-600' },
  { id: 'enterprise-custom', tier: 'enterprise', name: '企业版', nameEn: 'Enterprise', description: '按需订阅，按实际 token 使用量计费，适合中大型企业', features: ['✅ 无限制团队成员', '✅ 无限制任务量', '✅ 按量计费', '✅ MCP 连接器（无限）', '✅ SSO 单点登录', '✅ 私有化部署方案', '✅ 7×24 专属技术支持'], tokenQuota: '按需弹性计费', price: { monthly: 2999, quarterly: 0, halfyearly: 0, yearly: 0 }, color: '#8b5cf6', gradient: 'from-violet-600 to-purple-700', enterpriseMinMonthly: 2999 },
];

// 企业账户信息（前端展示用）
const COMPANY: CompanyInfo = {
  name: '深圳市斯密爱科技有限公司',
  bankAccount: '4000020709200461489',
  bank: '中国工商银行股份有限公司深圳华城支行',
  legalPerson: '何明旺',
  unifiedCode: '91440300MAG1CEBT8B',
};

// 计费周期中文名
const BILLING_LABELS: Record<string, string> = {
  monthly: '月付',
  quarterly: '季度付',
  halfyearly: '半年付',
  yearly: '年付',
};

const TIER_NAMES: Record<string, string> = {
  personal: '个人版',
  team: '团队版',
  enterprise: '企业版',
};

const TIER_COLORS: Record<string, string> = {
  personal: 'from-emerald-500 to-teal-600',
  team: 'from-blue-500 to-indigo-600',
  enterprise: 'from-violet-600 to-purple-700',
};

const TIER_BORDER: Record<string, string> = {
  personal: 'border-emerald-500/30',
  team: 'border-blue-500/30',
  enterprise: 'border-violet-500/30',
};

const TIER_TEXT: Record<string, string> = {
  personal: 'text-emerald-400',
  team: 'text-blue-400',
  enterprise: 'text-violet-400',
};

export function SubscriptionPanel() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [activePlan, setActivePlan] = useState<string>('personal');
  const [activeCycle, setActiveCycle] = useState<string>('monthly');
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [orderResult, setOrderResult] = useState<SubscriptionOrder | null>(null);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [currentSub, setCurrentSub] = useState<SubscriptionRecord | null>(null);
  const [pendingOrders, setPendingOrders] = useState<SubscriptionOrder[]>([]);
  const [showApproval, setShowApproval] = useState(false);
  const [approvalNote, setApprovalNote] = useState('');

  // 加载订阅数据（带重试 + 兜底数据）
  useEffect(() => {
    const load = async () => {
      const fallbackResult = { plans: FALLBACK_PLANS, company: COMPANY };
      // 重试辅助函数
      const withRetry = async (
        fn: () => Promise<unknown>,
        fallback: unknown,
        retries = 2
      ): Promise<unknown> => {
        for (let i = 0; i <= retries; i++) {
          try { return await fn(); }
          catch (e) {
            if (i === retries) {
              console.warn('[Subscription] fetch 失败，使用兜底数据:', e);
              return fallback;
            }
            await new Promise(r => setTimeout(r, 500 * (i + 1)));
          }
        }
        return fallback;
      };
      try {
        const [plansData, subData, pendingData] = await Promise.all([
          withRetry(() => api.getSubscriptionPlans(), fallbackResult) as Promise<{ plans: SubscriptionPlan[]; company: CompanyInfo }>,
          withRetry(() => api.getCurrentSubscription(), { active: null, history: [], total: 0 }) as Promise<{ active: SubscriptionRecord | null; history: SubscriptionRecord[]; total: number }>,
          withRetry(() => api.getPendingSubscriptions(), { orders: [] }) as Promise<{ orders: SubscriptionOrder[] }>,
        ]);
        setPlans((plansData as { plans: SubscriptionPlan[]; company: CompanyInfo }).plans || FALLBACK_PLANS);
        setCompanyInfo((plansData as { plans: SubscriptionPlan[]; company: CompanyInfo }).company || COMPANY);
        setCurrentSub((subData as { active: SubscriptionRecord | null }).active);
        setPendingOrders((pendingData as { orders: SubscriptionOrder[] }).orders || []);
      } catch (e) {
        console.error('[Subscription] 加载失败:', e);
        setPlans(FALLBACK_PLANS);
        setCompanyInfo(COMPANY);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // 切换标签页
  const tabs = [
    { id: 'personal', label: '👤 个人订阅', color: 'text-emerald-400' },
    { id: 'team', label: '👥 团队订阅', color: 'text-blue-400' },
    { id: 'enterprise', label: '🏢 企业订阅', color: 'text-violet-400' },
  ];

  // 按标签筛选计划
  const filteredPlans = plans.filter(p => p.tier === activePlan);

  // 获取当前选中计划在选中周期下的价格
  const selectedPlan = filteredPlans[0];
  const currentPrice = selectedPlan?.price?.[activeCycle as keyof typeof selectedPlan.price] ?? 0;

  // 创建订阅订单
  const handleSubscribe = async () => {
    if (!selectedPlan) return;
    setOrdering(true);
    try {
      // 始终使用默认支付方式
      const { order, company } = await api.createSubscriptionOrder({
        planId: selectedPlan.id,
        billingCycle: activeCycle as 'monthly' | 'quarterly' | 'halfyearly' | 'yearly',
        paymentMethod: 'bank_transfer', // 默认企业对公转账
      });
      setOrderResult(order);
      if (company) setCompanyInfo(company);
      toast.success('订单已生成，请完成支付');
    } catch (e: unknown) {
      toast.error(String(e) || '下单失败');
    } finally {
      setOrdering(false);
    }
  };

  // 审批订单（管理员）
  const handleApprove = async (orderId: string) => {
    try {
      await api.approveSubscription(orderId, approvalNote);
      toast.success('订单已审批通过，订阅已激活');
      setShowApproval(false);
      // 刷新数据
      const [subData, pendingData] = await Promise.all([
        api.getCurrentSubscription(),
        api.getPendingSubscriptions(),
      ]);
      setCurrentSub(subData.active);
      setPendingOrders(pendingData.orders || []);
    } catch (e: unknown) {
      toast.error(String(e) || '审批失败');
    }
  };

  // 拒绝订单（管理员）
  const handleReject = async (orderId: string) => {
    const reason = prompt('请输入拒绝原因（必填）：');
    if (!reason) return;
    try {
      await api.rejectSubscription(orderId, reason);
      toast.success('订单已拒绝');
      setPendingOrders(prev => prev.filter(o => o.id !== orderId));
    } catch (e: unknown) {
      toast.error(String(e) || '操作失败');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse">📦</div>
          <p className="text-slate-400">加载订阅计划中...</p>
        </div>
      </div>
    );
  }

  // 订单成功弹窗
  if (orderResult) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <div className="glass-card p-6 border border-emerald-500/30 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-white mb-2">订单已生成</h2>
          <p className="text-slate-400 text-sm mb-6">订单号：{orderResult.orderNo}</p>

          <div className="bg-slate-800/60 rounded-xl p-4 mb-6 text-left">
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">订阅计划</span>
                <span className="text-white">{TIER_NAMES[orderResult.tier]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">计费周期</span>
                <span className="text-white">{BILLING_LABELS[orderResult.billingCycle]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">应付金额</span>
                <span className="text-2xl font-bold text-emerald-400">
                  ¥{(orderResult.amount / 100).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* 微信/支付宝扫码提示 */}
          {orderResult.paymentMethod !== 'bank_transfer' && (
            <div className="mb-4 p-4 bg-slate-800/60 rounded-xl">
              <p className="text-sm text-slate-400 mb-2">
                {orderResult.paymentMethod === 'wechat' ? '💚 微信支付' : '🔵 支付宝支付'}
              </p>
              <div className="bg-white rounded-xl p-4 inline-block">
                <div className="text-slate-400 text-xs mb-2">请扫描二维码完成支付</div>
                <img
                  src="/wechat-qrcode.png"
                  alt="微信收款码"
                  className="w-44 h-44 object-contain mx-auto rounded-lg"
                />
              </div>
            </div>
          )}

          {/* 企业对公转账信息 */}
          {(orderResult.paymentMethod === 'bank_transfer' || orderResult.bankInfo) && (
            <div className="text-left">
              <p className="text-sm text-amber-400 mb-3 flex items-center gap-2">
                <span>🏦</span>
                <span>请通过对公转账完成支付，付款成功后联系管理员审批激活</span>
              </p>
              <div className="bg-slate-800/60 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">账户名称</span>
                  <span className="text-white font-medium">{(orderResult.bankInfo || companyInfo || COMPANY).name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">账户号码</span>
                  <span className="text-white font-mono">{(orderResult.bankInfo || companyInfo || COMPANY).bankAccount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">开户银行</span>
                  <span className="text-white">{(orderResult.bankInfo || companyInfo || COMPANY).bank}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">企业名称</span>
                  <span className="text-white">{(orderResult.bankInfo || companyInfo || COMPANY).name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">统一社会信用代码</span>
                  <span className="text-white font-mono">{(orderResult.bankInfo || companyInfo || COMPANY).unifiedCode}</span>
                </div>
                <div className="pt-2 border-t border-slate-700 mt-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">转账金额</span>
                    <span className="text-xl font-bold text-amber-400">
                      ¥{(orderResult.amount / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-slate-400">附言/备注</span>
                    <span className="text-white font-mono">{orderResult.orderNo}</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                💡 付款时请在备注中填写订单号 <span className="text-white font-mono">{orderResult.orderNo}</span>，以便系统自动识别
              </p>
            </div>
          )}

          <div className="mt-6 flex gap-3 justify-center">
            <button
              onClick={() => setOrderResult(null)}
              className="bg-slate-700 hover:bg-slate-600 text-white text-sm px-6 py-2.5 rounded-xl transition-colors"
            >
              返回订阅页面
            </button>
            <button
              onClick={() => toast.info('请联系管理员审批您的订单')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm px-6 py-2.5 rounded-xl transition-colors"
            >
              联系管理员审批
            </button>
          </div>
        </div>

        {/* 待审批订单（管理员视角） */}
        {showApproval && pendingOrders.length > 0 && (
          <div className="glass-card p-6 border border-amber-500/30">
            <h3 className="text-sm font-medium text-amber-400 mb-4 flex items-center gap-2">
              <span>📋</span> 待审批订单（管理员）
            </h3>
            <div className="space-y-3">
              {pendingOrders.map(order => (
                <div key={order.id} className="bg-slate-800/60 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-white font-medium">{TIER_NAMES[order.tier]}</span>
                      <span className="text-slate-500 text-xs ml-2">{order.orderNo}</span>
                    </div>
                    <span className="text-xl font-bold text-amber-400">
                      ¥{(order.amount / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mb-3">
                    {BILLING_LABELS[order.billingCycle]} · {new Date(order.createdAt).toLocaleString('zh-CN')}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(order.id)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4 py-1.5 rounded-lg transition-colors"
                    >
                      ✅ 审批通过
                    </button>
                    <button
                      onClick={() => handleReject(order.id)}
                      className="bg-red-600/80 hover:bg-red-500 text-white text-xs px-4 py-1.5 rounded-lg transition-colors"
                    >
                      ❌ 拒绝
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 当前订阅状态 */}
      {currentSub && (
        <div className="glass-card p-5 border border-cyan-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-600/40 to-blue-600/40 border border-cyan-500/30 flex items-center justify-center text-2xl">
                ✅
              </div>
              <div>
                <div className="text-sm font-semibold text-white">当前订阅</div>
                <div className={`text-xs ${TIER_TEXT[currentSub.tier] || 'text-white'}`}>
                  {TIER_NAMES[currentSub.tier]} · {BILLING_LABELS[currentSub.billingCycle]}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-emerald-400">
                ¥{(currentSub.amount / 100).toFixed(0)}
              </div>
              <div className="text-xs text-slate-500">
                至 {new Date(currentSub.expiresAt).toLocaleDateString('zh-CN')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 待审批订单（管理员视角） */}
      {showApproval && pendingOrders.length > 0 && (
        <div className="glass-card p-5 border border-amber-500/30">
          <h3 className="text-sm font-medium text-amber-400 mb-4 flex items-center gap-2">
            <span>📋</span> 待审批订单（管理员）
          </h3>
          <div className="space-y-3">
            {pendingOrders.map(order => (
              <div key={order.id} className="bg-slate-800/60 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-white font-medium">{TIER_NAMES[order.tier]}</span>
                    <span className="text-slate-500 text-xs ml-2 font-mono">{order.orderNo}</span>
                  </div>
                  <span className="text-xl font-bold text-amber-400">
                    ¥{(order.amount / 100).toFixed(2)}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mb-3">
                  {BILLING_LABELS[order.billingCycle]} · 支付方式：
                  {order.paymentMethod === 'bank_transfer' ? '企业对公转账' :
                   order.paymentMethod === 'wechat' ? '微信支付' : '支付宝'}
                  · {new Date(order.createdAt).toLocaleString('zh-CN')}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(order.id)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4 py-1.5 rounded-lg transition-colors"
                  >
                    ✅ 审批通过
                  </button>
                  <button
                    onClick={() => handleReject(order.id)}
                    className="bg-red-600/80 hover:bg-red-500 text-white text-xs px-4 py-1.5 rounded-lg transition-colors"
                  >
                    ❌ 拒绝
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 订阅类型切换 */}
      <div className="flex gap-1 bg-slate-800/60 p-1 rounded-xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActivePlan(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activePlan === tab.id
                ? `bg-gradient-to-r ${TIER_COLORS[tab.id]} text-white shadow-lg`
                : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 计费周期切换 */}
      <div className="flex gap-2">
        {(['monthly', 'quarterly', 'halfyearly', 'yearly'] as Array<'monthly' | 'quarterly' | 'halfyearly' | 'yearly'>).map(cycle => {
          const price = selectedPlan?.price?.[cycle] ?? 0;
          const label = BILLING_LABELS[cycle];
          const isActive = activeCycle === cycle;
          // 计算节省百分比
          const cycles = cycle === 'quarterly' ? 3 : cycle === 'halfyearly' ? 6 : 12;
          const totalMonthly = price * cycles;
          const monthlyPrice = selectedPlan?.price.monthly ?? 0;
          const savingPct = cycle !== 'monthly' && monthlyPrice > 0
            ? Math.round((monthlyPrice * cycles - price) / (monthlyPrice * cycles) * 100)
            : 0;

          return (
            <button
              key={cycle}
              onClick={() => price > 0 && setActiveCycle(cycle)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                isActive
                  ? `bg-gradient-to-r ${TIER_COLORS[activePlan]} text-white border-transparent`
                  : price > 0
                    ? 'bg-slate-800/60 text-slate-300 border-slate-700/50 hover:border-slate-600'
                    : 'bg-slate-800/30 text-slate-600 border-transparent cursor-not-allowed'
              }`}
            >
              <div>{label}</div>
              {price > 0 && (
                <div className="text-xs opacity-70">
                  {isActive ? `¥${price.toFixed(0)}` : `¥${price.toFixed(0)}`}
                  {savingPct > 0 && <span className="ml-1 text-emerald-400">省{savingPct}%</span>}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* 计划详情卡片 */}
      {selectedPlan && (
        <div className={`glass-card p-6 border ${TIER_BORDER[activePlan]}`}>
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className={`text-2xl font-bold bg-gradient-to-r ${TIER_COLORS[activePlan]} bg-clip-text text-transparent`}>
                {selectedPlan.name}
              </div>
              <div className="text-slate-400 text-sm mt-1">{selectedPlan.description}</div>
            </div>
            <div className="text-right">
              <div className={`text-4xl font-bold ${TIER_TEXT[activePlan]}`}>
                ¥{currentPrice.toFixed(0)}
              </div>
              <div className="text-slate-500 text-xs">
                {activeCycle === 'monthly' ? '/月' :
                 activeCycle === 'quarterly' ? '/季度' :
                 activeCycle === 'halfyearly' ? '/半年' : '/年'}
              </div>
            </div>
          </div>

          {/* 权益列表 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
            {selectedPlan.features.map((feature, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className={`${
                  feature.startsWith('✅') ? 'text-emerald-400' :
                  feature.startsWith('❌') ? 'text-red-400' : 'text-slate-400'
                } mt-0.5`}>
                  {feature.startsWith('✅') ? '✓' : feature.startsWith('❌') ? '✗' : '•'}
                </span>
                <span className="text-slate-300">{feature.replace(/^[✅❌]\s/, '')}</span>
              </div>
            ))}
          </div>

          {/* Token 配额 */}
          <div className={`bg-gradient-to-r ${TIER_COLORS[activePlan]} opacity-10 rounded-xl p-3 mb-6 flex items-center justify-between`}>
            <span className="text-sm text-white/80">Token 月度配额</span>
            <span className="text-lg font-bold text-white">{selectedPlan.tokenQuota}</span>
          </div>

          {/* 企业版特别说明 */}
          {activePlan === 'enterprise' && (
            <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4 mb-6">
              <div className="text-sm text-violet-300 font-medium mb-2">🏢 企业版特点</div>
              <ul className="text-xs text-slate-400 space-y-1">
                <li>• 按实际 token 消耗量计费，无固定月费上限</li>
                <li>• 支持私有化部署，保障数据安全</li>
                <li>• 支持 SSO 单点登录，与企业身份系统对接</li>
                <li>• 专属客户成功经理，7×24 技术支持</li>
                <li>• 支持对公转账、发票开具</li>
              </ul>
            </div>
          )}

          {/* 支付方式选择 */}
          <div className="mb-4">
            <div className="text-sm text-slate-400 mb-2">支付方式</div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'wechat', label: '💚 微信支付', desc: '即时到账' },
                { id: 'alipay', label: '🔵 支付宝', desc: '即时到账' },
                { id: 'bank_transfer', label: '🏦 对公转账', desc: '1-3个工作日' },
              ].map(method => (
                <div
                  key={method.id}
                  className="bg-slate-800/60 rounded-xl p-3 text-center border border-slate-700/50"
                >
                  <div className="text-sm text-white font-medium">{method.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{method.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleSubscribe}
            disabled={ordering || currentPrice <= 0}
            className={`w-full py-3.5 rounded-xl font-semibold text-base transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r ${TIER_COLORS[activePlan]} hover:opacity-90 text-white`}
          >
            {ordering ? '⏳ 生成订单中...' : `立即订阅 · ¥${currentPrice.toFixed(0)}`}
          </button>

          {activePlan === 'personal' && activeCycle === 'yearly' && (
            <p className="text-center text-xs text-slate-500 mt-2">
              年度订阅平均每月 ¥582.5，相比月付节省 ¥4602
            </p>
          )}
          {activePlan === 'team' && activeCycle === 'yearly' && (
            <p className="text-center text-xs text-slate-500 mt-2">
              年度订阅平均每月 ¥1083，相比月付节省 ¥10893
            </p>
          )}
        </div>
      )}

      {/* 全计划概览表 */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-medium text-slate-300 mb-4">📊 全部订阅计划价格一览</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-2 text-slate-500 font-medium">计划</th>
                <th className="text-right py-2 text-slate-500 font-medium">月付</th>
                <th className="text-right py-2 text-slate-500 font-medium">季度付</th>
                <th className="text-right py-2 text-slate-500 font-medium">半年付</th>
                <th className="text-right py-2 text-slate-500 font-medium">年付</th>
              </tr>
            </thead>
            <tbody>
              {(['personal', 'team', 'enterprise'] as const).map(tier => {
                const tierPlans = plans.filter(p => p.tier === tier);
                const mainPlan = tierPlans[0];
                if (!mainPlan) return null;
                return (
                  <tr key={tier} className="border-b border-slate-800 hover:bg-slate-800/30">
                    <td className={`py-2.5 font-medium ${TIER_TEXT[tier]}`}>
                      {TIER_NAMES[tier]}
                    </td>
                    <td className="text-right py-2.5 text-slate-300">
                      {mainPlan.price.monthly > 0 ? `¥${mainPlan.price.monthly}` : '—'}
                    </td>
                    <td className="text-right py-2.5 text-slate-300">
                      {mainPlan.price.quarterly > 0 ? `¥${mainPlan.price.quarterly}` : '—'}
                    </td>
                    <td className="text-right py-2.5 text-slate-300">
                      {mainPlan.price.halfyearly > 0 ? `¥${mainPlan.price.halfyearly}` : '—'}
                    </td>
                    <td className="text-right py-2.5 text-slate-300">
                      {mainPlan.price.yearly > 0 ? `¥${mainPlan.price.yearly}` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 企业对公转账信息（常驻展示） */}
      <div className="glass-card p-5 border border-violet-500/20">
        <h3 className="text-sm font-medium text-violet-400 mb-3 flex items-center gap-2">
          <span>🏦</span> 企业对公转账收款账户
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {[
            { label: '账户名称', value: COMPANY.name },
            { label: '账户号码', value: COMPANY.bankAccount, mono: true },
            { label: '开户银行', value: COMPANY.bank },
            { label: '统一社会信用代码', value: COMPANY.unifiedCode, mono: true },
          ].map(item => (
            <div key={item.label} className="flex gap-3">
              <span className="text-slate-500 shrink-0">{item.label}</span>
              <span className={`text-white ${item.mono ? 'font-mono' : ''}`}>{item.value}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-3">
          💡 付款时请在备注中填写您的订单号，以便系统自动识别并快速审批开通
        </p>
      </div>

      {/* 客户服务 */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-medium text-slate-300 mb-3">📞 客户服务</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          {[
            { icon: '💬', label: '在线客服', desc: '工作日 9:00-18:00', action: '立即咨询' },
            { icon: '📧', label: '邮件支持', desc: 'support@simiaiclaw.ai', action: '发送邮件' },
            { icon: '📋', label: '工单系统', desc: '提交技术支持工单', action: '提交工单' },
          ].map(item => (
            <button
              key={item.label}
              className="bg-slate-800/60 rounded-xl p-4 text-left hover:bg-slate-700/60 transition-colors border border-slate-700/50"
            >
              <div className="text-lg mb-1">{item.icon}</div>
              <div className="text-white font-medium text-xs">{item.label}</div>
              <div className="text-slate-500 text-[10px] mt-0.5">{item.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

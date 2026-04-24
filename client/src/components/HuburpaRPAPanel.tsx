/**
 * SIMIAICLAW 龙虾集群 · 虎步RPA控制面板
 * 巽宫·执行卦专属 · 与八爪鱼并列为双RPA引擎
 * 集成虎步RPA API（紫鸟生态 / 亚马逊跨境电商专用）
 * 实现：计划提交 → 任务执行 → 结果回调 → AI分析 全自动闭环
 */

import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';

// ── 虎步RPA 常量 ──────────────────────────────────────────────
const HB_API_BASE = 'https://sbappstoreapi.ziniao.com/rest/sop-openapi';
const HB_WEB = 'https://www.huburpa.com';
const HB_SUPPORT = 'https://support.huburpa.com';

// ── 类型定义 ──────────────────────────────────────────────
interface HubuConfig {
  appId: string;
  appSecret: string;
  appToken: string;
  tokenExpire: number;
}

interface RpaInfo {
  scriptId: string;
  name: string;
  params: { name: string; label: string; type: string }[];
}

interface TaskRecord {
  taskRecordId: string;
  planId: string;
  taskId: string;
  sellerId: string;
  storeName: string;
  siteName: string;
  siteCode: string;
  rpaId: string;
  taskStartTime: string;
  taskEndTime: string;
  taskResultType: string;
  errorCode: string;
  errorMsg: string;
  downloadUrl: string;
  reportFromDate: string;
  reportEndData: string;
}

interface TaskResult {
  planId: string;
  taskRecordId: string;
  rpaId: string;
  sellerId: string;
  storeName: string;
  siteName: string;
  siteCode: string;
  taskResultType: string;
  errorCode: string;
  errorMsg: string;
  downloadUrl: string;
  taskStartTime: string;
  taskEndTime: string;
  downloadUrl2?: string;
}

// ── 工具函数 ──────────────────────────────────────────────
function formatTimestamp(ms: string): string {
  if (!ms) return '-';
  return new Date(Number(ms)).toLocaleString('zh-CN');
}

function getResultTypeLabel(type: string): { label: string; color: string } {
  const map: Record<string, { label: string; color: string }> = {
    SUCCESS: { label: '成功', color: '#22c55e' },
    UPLOAD_SUCCESS: { label: '已上传', color: '#22c55e' },
    UPLOAD_FAIL: { label: '上传失败', color: '#ef4444' },
    REPORT_NOT_EXISTS: { label: '报表不存在', color: '#f97316' },
    TASK_ERROR: { label: '任务异常', color: '#ef4444' },
    CREAT_REPORT_ERROR: { label: '生成错误', color: '#ef4444' },
    REDOSING: { label: '重新获取中', color: '#eab308' },
    NOT_ENOUGH_BALANCE: { label: '余额不足', color: '#ef4444' },
    NOT_UPLOAD: { label: '未上传', color: '#94a3b8' },
  };
  return map[type] || { label: type, color: '#94a3b8' };
}

// ── 核心：虎步API客户端 ──────────────────────────────────────────────
async function getHubuToken(config: HubuConfig): Promise<string | null> {
  if (config.appToken && config.tokenExpire > Date.now()) {
    return config.appToken;
  }
  try {
    const resp = await fetch(`${HB_API_BASE}/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appId: config.appId, appSecret: config.appSecret }),
    });
    const data = await resp.json();
    if (data.code === 0 && data.data?.appToken) {
      return data.data.appToken;
    }
  } catch { /* network error */ }
  return null;
}

async function hubuCreatePlan(token: string, body: object): Promise<string | null> {
  try {
    const resp = await fetch(`${HB_API_BASE}/rpa/company/plans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
      },
      body: JSON.stringify(body),
    });
    const data = await resp.json();
    if (data.code === 0) return data.data?.planId;
    toast.error(`虎步API错误: ${data.msg}`);
  } catch (e) {
    toast.error('虎步API请求失败，请检查网络');
  }
  return null;
}

async function hubuQueryResults(token: string, planId: string, page = 1, pageSize = 20): Promise<TaskRecord[]> {
  try {
    const resp = await fetch(
      `${HB_API_BASE}/rpa/company/tasks/results?planId=${planId}&pageNum=${page}&pageSize=${pageSize}`,
      { headers: { 'Authorization': token } }
    );
    const data = await resp.json();
    if (data.code === 0) return data.data?.curPage || [];
  } catch { /* ignore */ }
  return [];
}

// ── 预置RPA模板 ──────────────────────────────────────────────
const RPA_TEMPLATES = [
  {
    scriptId: '2001',
    name: '亚马逊竞品销售监控',
    icon: '📊',
    category: '竞品监控',
    desc: '按ASIN批量抓取竞品销量、库存、价格、排名，数据自动落库',
    params: [
      { name: 'asinList', label: 'ASIN列表', type: 'text' },
      { name: 'dateRange', label: '时间范围', type: 'select', options: ['last7', 'last30', 'lastWeekSunday'] },
      { name: 'site', label: '站点', type: 'select', options: ['US', 'CA', 'UK', 'DE', 'ES', 'FR', 'IT', 'JP'] },
    ],
  },
  {
    scriptId: '3001',
    name: '亚马逊订单数据抓取',
    icon: '📦',
    category: '订单管理',
    desc: '批量导出FBA订单买家信息、地址、SKU，支持按状态筛选',
    params: [
      { name: 'orderStatus', label: '订单状态', type: 'select', options: ['all', 'shipped', 'pending'] },
      { name: 'marketPlace', label: '站点', type: 'text' },
      { name: 'downloadTimeType', label: '下载时间', type: 'select', options: ['last60', 'lastweekSunday', 'lastMonth'] },
    ],
  },
  {
    scriptId: '4001',
    name: '竞品主图与评论抓取',
    icon: '🖼️',
    category: '视觉分析',
    desc: '抓取竞品主图、Review评分、内容，支持多ASIN批量',
    params: [
      { name: 'asinList', label: 'ASIN列表', type: 'text' },
      { name: 'reviewCount', label: '抓取评论数', type: 'select', options: ['50', '100', '200'] },
      { name: 'site', label: '站点', type: 'text' },
    ],
  },
  {
    scriptId: '5001',
    name: '差评分析报告',
    icon: '🔍',
    category: '评价分析',
    desc: '抓取竞品差评，自动归类问题类型，生成改善建议',
    params: [
      { name: 'asin', label: 'ASIN', type: 'text' },
      { name: 'starFilter', label: '星级筛选', type: 'select', options: ['1-2', '1-3', 'all'] },
      { name: 'marketPlace', label: '站点', type: 'text' },
    ],
  },
  {
    scriptId: '6001',
    name: '动态定价监控',
    icon: '💰',
    category: '定价策略',
    desc: '监控竞品价格变化，生成调价建议报表',
    params: [
      { name: 'asinList', label: 'ASIN列表', type: 'text' },
      { name: 'frequency', label: '监控频率', type: 'select', options: ['hourly', 'daily'] },
      { name: 'site', label: '站点', type: 'text' },
    ],
  },
  {
    scriptId: '7001',
    name: '库存预警报表',
    icon: '⚠️',
    category: '库存管理',
    desc: '监控FBA库存水位，提前预警断货风险',
    params: [
      { name: 'skuList', label: 'SKU列表', type: 'text' },
      { name: 'threshold', label: '预警阈值(天)', type: 'text' },
    ],
  },
];

// ── 预置Master Prompt（64卦 × 虎步RPA） ──────────────────────────────────────────────
const MASTER_PROMPTS = [
  {
    id: 'hubu-01',
    label: '竞品销售分析',
    prompt: `你是一个跨境电商数据分析专家。请分析虎步RPA抓取的竞品销售数据（ASIN: {asin}，{site}站，上周数据）：

1. 销量趋势：环比变化、峰值分析
2. 竞品排名：BSR类目排名波动原因推断
3. 库存水位：竞品库存深度判断
4. 定价策略：价格区间与毛利空间分析
5. 太极卦象判断：依据数据给出投资/观望/撤退的卦象建议（乾卦激进/坤卦防守/谦卦观望）

数据格式：CSV/Excel，请生成结构化分析报告。`,
  },
  {
    id: 'hubu-02',
    label: '差评归因分析',
    prompt: `你是一个亚马逊产品体验专家。请对以下差评数据进行归因分析（ASIN: {asin}，{site}站）：

1. 问题聚类：质量/物流/服务/描述不符 四象限归类
2. 痛点评数：1星/2星分别占比及核心问题
3. 竞品借鉴：该ASIN的差评可作为自身Listing优化的方向
4. 卦象诊断：依据差评严重程度给出卦象建议（损卦止损/颐卦改善/大畜卦蓄力）

请生成差评归因矩阵和改善建议清单。`,
  },
  {
    id: 'hubu-03',
    label: '库存补货策略',
    prompt: `你是一个FBA库存管理顾问。请根据以下数据生成补货计划：

1. 当前库存：{currentStock} 件
2. 日均销量：{dailySales} 件
3. 在途库存：{inTransit} 件（预计{daysToArrive}天后到达）
4. FBA库存：{fbaStock} 件
5. 断货红线：{safetyStock} 件

要求：
- 计算各SKU的建议补货量（考虑物流时效和安全库存）
- 生成紧急/常规/观望 三档补货优先级
- 卦象辅助：用豫卦（顺时动）判断补货时机是否合适
- 输出格式：Markdown表格 + 行动计划`,
  },
];

// ── 高频Prompt模板 ──────────────────────────────────────────────
const QUICK_PROMPTS = [
  { label: '🚀 竞品监控全流程', prompt: '使用虎步RPA抓取ASIN {asin} 近30天销量数据，然后分析其排名变化趋势' },
  { label: '📦 订单数据导出', prompt: '用虎步RPA导出{storeName}店铺上周所有FBA订单的买家地址数据' },
  { label: '🖼️ 竞品主图抓取', prompt: '使用虎步RPA抓取{asin}的竞品主图和所有图片，并保存到指定目录' },
  { label: '🔍 差评深度分析', prompt: '用虎步RPA抓取{asin}的1-2星差评，提取关键词并归类问题类型' },
  { label: '💰 定价策略报告', prompt: '抓取{asin}所在类目Top20竞品的价格分布，生成调价建议' },
];

// ── 主组件 ──────────────────────────────────────────────
export function HuburpaRPAPanel() {
  const [activeTab, setActiveTab] = useState<'templates' | 'run' | 'results' | 'prompts' | 'settings'>('templates');
  const [config, setConfig] = useState<HubuConfig>({
    appId: localStorage.getItem('hubu_appId') || '',
    appSecret: localStorage.getItem('hubu_appSecret') || '',
    appToken: localStorage.getItem('hubu_appToken') || '',
    tokenExpire: Number(localStorage.getItem('hubu_tokenExpire') || '0'),
  });
  const [tokenStatus, setTokenStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [selectedTemplate, setSelectedTemplate] = useState<typeof RPA_TEMPLATES[0] | null>(null);
  const [runParams, setRunParams] = useState<Record<string, string>>({});
  const [actionType, setActionType] = useState<'AT_ONCE' | 'ASSIGN_TIME' | 'REPEAT_BY_DAY' | 'REPEAT_BY_WEEK' | 'REPEAT_BY_MONTH'>('AT_ONCE');
  const [assignedTime, setAssignedTime] = useState('');
  const [sellerIds, setSellerIds] = useState('');
  const [marketPlaces, setMarketPlaces] = useState('US');
  const [runningPlanId, setRunningPlanId] = useState<string | null>(null);
  const [results, setResults] = useState<TaskRecord[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [history, setHistory] = useState<{ planId: string; name: string; time: string; status: string }[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<typeof QUICK_PROMPTS[0] | null>(null);

  // Token验证
  const validateToken = async () => {
    if (!config.appId || !config.appSecret) {
      toast.error('请先填写 AppID 和 AppSecret');
      return;
    }
    setTokenStatus('loading');
    const token = await getHubuToken(config);
    if (token) {
      const expire = Date.now() + 2 * 60 * 60 * 1000;
      setConfig(prev => ({ ...prev, appToken: token, tokenExpire: expire }));
      localStorage.setItem('hubu_appToken', token);
      localStorage.setItem('hubu_tokenExpire', String(expire));
      setTokenStatus('ok');
      toast.success('虎步RPA Token 验证成功！');
    } else {
      setTokenStatus('error');
      toast.error('Token 获取失败，请检查 AppID / AppSecret / IP白名单');
    }
  };

  // 提交执行计划
  const handleSubmitPlan = async () => {
    if (!selectedTemplate || !config.appToken) {
      toast.error('请先选择模板并验证Token');
      return;
    }
    const runWith = Object.entries(runParams)
      .filter(([, v]) => v)
      .map(([name, value]) => ({ name, value }));

    const body: Record<string, unknown> = {
      name: `龙虾-${selectedTemplate.name}-${Date.now()}`,
      platformId: '0', // 亚马逊
      actionType,
      scriptList: [{ scriptId: selectedTemplate.scriptId, runWith }],
      storeScopeType: sellerIds ? 'ASSIGNED' : 'ALL',
    };
    if (actionType === 'ASSIGN_TIME' && assignedTime) {
      body.assignTime = new Date(assignedTime).getTime();
    }
    if (sellerIds) {
      body.storeAndMarketPlaceList = sellerIds.split(',').map(sid => ({
        sellerIds: sid.trim(),
        marketPlace: marketPlaces,
      }));
    }

    const planId = await hubuCreatePlan(config.appToken, body);
    if (planId) {
      setRunningPlanId(planId);
      setHistory(prev => [{ planId, name: selectedTemplate.name, time: new Date().toLocaleTimeString('zh-CN'), status: 'pending' }, ...prev]);
      toast.success(`计划已提交！PlanId: ${planId}`);
      // 自动查询结果
      setTimeout(() => {
        setActiveTab('results');
        queryResults(planId);
      }, 5000);
    }
  };

  // 查询结果
  const queryResults = async (planId: string) => {
    if (!config.appToken) return;
    setResultsLoading(true);
    const records = await hubuQueryResults(config.appToken, planId);
    setResults(records);
    setResultsLoading(false);
    if (records.length > 0) {
      toast.success(`获取到 ${records.length} 条执行结果`);
    }
  };

  // 导出为JSON
  const exportResults = () => {
    if (!results.length) { toast.error('暂无数据可导出'); return; }
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `huburpa-results-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('结果已导出为 JSON 文件');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1100px', margin: '0 auto' }}>
      {/* 顶部导航 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '24px' }}>🐯</span>
        <span style={{ fontWeight: 700, fontSize: '16px', color: '#f97316' }}>虎步RPA 控制台</span>
        <span style={{ fontSize: '11px', color: '#94a3b8', background: '#1e293b', padding: '2px 8px', borderRadius: '4px' }}>巽宫·执行卦</span>
        {tokenStatus === 'ok' && <span style={{ fontSize: '11px', color: '#22c55e', background: '#14532d', padding: '2px 8px', borderRadius: '4px' }}>✓ Token有效</span>}
        {tokenStatus === 'error' && <span style={{ fontSize: '11px', color: '#ef4444', background: '#450a0a', padding: '2px 8px', borderRadius: '4px' }}>✗ Token无效</span>}
      </div>

      {/* Tab导航 */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '1px solid #334155', paddingBottom: '4px', flexWrap: 'wrap' }}>
        {(['templates', 'run', 'results', 'prompts', 'settings'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '6px 16px', border: 'none', borderRadius: '6px 6px 0 0', cursor: 'pointer', fontSize: '13px',
            background: activeTab === tab ? '#f97316' : 'transparent', color: activeTab === tab ? '#fff' : '#94a3b8',
            fontWeight: activeTab === tab ? 600 : 400,
          }}>
            {{ templates: '📦 模板市场', run: '▶️ 执行任务', results: '📊 执行结果', prompts: '🧙 Master Prompt', settings: '⚙️ 配置' }[tab]}
          </button>
        ))}
      </div>

      {/* ── 模板市场 ── */}
      {activeTab === 'templates' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>
              共 {RPA_TEMPLATES.length} 个预置RPA模板，可在应用市场查看更多 →
            </p>
            <a href={HB_WEB} target="_blank" rel="noopener noreferrer" style={{ color: '#f97316', fontSize: '13px', textDecoration: 'none' }}>
              🛒 虎步应用市场 →
            </a>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {RPA_TEMPLATES.map(tpl => (
              <div key={tpl.scriptId} onClick={() => { setSelectedTemplate(tpl); setActiveTab('run'); setRunParams({}); }} style={{
                border: '1px solid #334155', borderRadius: '10px', padding: '16px', cursor: 'pointer',
                background: '#0f172a', transition: 'all 0.2s', position: 'relative',
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#f97316')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#334155')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span style={{ fontSize: '22px' }}>{tpl.icon}</span>
                  <span style={{ fontSize: '11px', color: '#f97316', background: '#451a03', padding: '2px 6px', borderRadius: '4px' }}>{tpl.category}</span>
                </div>
                <div style={{ fontWeight: 600, fontSize: '14px', color: '#e2e8f0', marginBottom: '6px' }}>{tpl.name}</div>
                <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>{tpl.desc}</div>
                <div style={{ fontSize: '11px', color: '#475569', marginTop: '8px', fontFamily: 'monospace' }}>ID: {tpl.scriptId}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 执行任务 ── */}
      {activeTab === 'run' && (
        <div>
          {selectedTemplate ? (
            <div>
              <div style={{ background: '#1e293b', borderRadius: '10px', padding: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '28px' }}>{selectedTemplate.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '16px', color: '#f97316' }}>{selectedTemplate.name}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>ScriptId: {selectedTemplate.scriptId} · {selectedTemplate.category}</div>
                </div>
                <button onClick={() => { setSelectedTemplate(null); setActiveTab('templates'); }} style={{ marginLeft: 'auto', background: '#334155', border: 'none', color: '#94a3b8', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                  更换模板
                </button>
              </div>

              {/* 执行参数 */}
              <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', padding: '20px', marginBottom: '16px' }}>
                <h4 style={{ color: '#e2e8f0', margin: '0 0 16px 0', fontSize: '14px' }}>🔧 RPA运行参数</h4>
                {selectedTemplate.params.map(p => (
                  <div key={p.name} style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '4px' }}>
                      {p.label} <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    {p.type === 'select' ? (
                      <select value={runParams[p.name] || ''} onChange={e => setRunParams(prev => ({ ...prev, [p.name]: e.target.value }))} style={{
                        width: '100%', padding: '8px 12px', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#e2e8f0', fontSize: '13px',
                      }}>
                        <option value="">请选择</option>
                        {(p as { options: string[] }).options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input value={runParams[p.name] || ''} onChange={e => setRunParams(prev => ({ ...prev, [p.name]: e.target.value }))} placeholder={`输入${p.label}`} style={{
                        width: '100%', padding: '8px 12px', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#e2e8f0', fontSize: '13px', boxSizing: 'border-box',
                      }} />
                    )}
                  </div>
                ))}
              </div>

              {/* 店铺配置 */}
              <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', padding: '20px', marginBottom: '16px' }}>
                <h4 style={{ color: '#e2e8f0', margin: '0 0 16px 0', fontSize: '14px' }}>🏪 店铺与执行方式</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '4px' }}>SellerId（逗号分隔，留空=全部）</label>
                    <input value={sellerIds} onChange={e => setSellerIds(e.target.value)} placeholder="如: AB123CD,EF456GH" style={{
                      width: '100%', padding: '8px 12px', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#e2e8f0', fontSize: '13px', boxSizing: 'border-box',
                    }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '4px' }}>站点</label>
                    <input value={marketPlaces} onChange={e => setMarketPlaces(e.target.value)} placeholder="US,CA,UK" style={{
                      width: '100%', padding: '8px 12px', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#e2e8f0', fontSize: '13px', boxSizing: 'border-box',
                    }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '4px' }}>执行方式</label>
                  <select value={actionType} onChange={e => setActionType(e.target.value as typeof actionType)} style={{
                    width: '100%', padding: '8px 12px', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#e2e8f0', fontSize: '13px',
                  }}>
                    <option value="AT_ONCE">⚡ 立即执行</option>
                    <option value="ASSIGN_TIME">⏰ 指定时间</option>
                    <option value="REPEAT_BY_DAY">📅 每天</option>
                    <option value="REPEAT_BY_WEEK">📆 每周</option>
                    <option value="REPEAT_BY_MONTH">📆 每月</option>
                  </select>
                </div>
                {actionType === 'ASSIGN_TIME' && (
                  <div style={{ marginTop: '12px' }}>
                    <input type="datetime-local" value={assignedTime} onChange={e => setAssignedTime(e.target.value)} style={{
                      padding: '8px 12px', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#e2e8f0', fontSize: '13px', width: '100%', boxSizing: 'border-box',
                    }} />
                  </div>
                )}
              </div>

              {/* 提交 */}
              <button onClick={handleSubmitPlan} disabled={tokenStatus !== 'ok'} style={{
                width: '100%', padding: '14px', background: tokenStatus === 'ok' ? '#f97316' : '#334155',
                color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 700, cursor: tokenStatus === 'ok' ? 'pointer' : 'not-allowed',
              }}>
                {tokenStatus === 'ok' ? `▶ 提交虎步RPA计划（${selectedTemplate.name}）` : '⚠️ 请先在「配置」中验证 Token'}
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🐯</div>
              <p>请先从「模板市场」选择一个RPA模板</p>
              <button onClick={() => setActiveTab('templates')} style={{ marginTop: '12px', padding: '8px 20px', background: '#f97316', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                去选择模板 →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── 执行结果 ── */}
      {activeTab === 'results' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ color: '#e2e8f0', margin: 0, fontSize: '15px' }}>📊 最近执行结果</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              {runningPlanId && (
                <button onClick={() => queryResults(runningPlanId)} style={{ padding: '6px 14px', background: '#334155', color: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                  🔄 刷新
                </button>
              )}
              <button onClick={exportResults} style={{ padding: '6px 14px', background: '#f97316', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                📥 导出JSON
              </button>
            </div>
          </div>

          {/* 历史记录 */}
          {history.length > 0 && (
            <div style={{ background: '#1e293b', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>📋 执行历史</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {history.slice(0, 5).map(h => (
                  <div key={h.planId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                    <span style={{ color: '#94a3b8' }}>{h.name}</span>
                    <span style={{ color: '#64748b' }}>{h.time}</span>
                    <span style={{ fontFamily: 'monospace', color: '#f97316' }}>{h.planId}</span>
                    <button onClick={() => queryResults(h.planId)} style={{ padding: '2px 8px', background: '#334155', border: 'none', color: '#94a3b8', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>
                      查询
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 结果表格 */}
          {resultsLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>加载中...</div>
          ) : results.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>📭</div>
              <p>暂无执行结果，请先提交任务或输入PlanId查询</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid #334155' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#1e293b' }}>
                    {['店铺', '站点', '状态', '开始时间', '结束时间', '错误', '下载地址'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b', fontWeight: 500, borderBottom: '1px solid #334155', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => {
                    const typeInfo = getResultTypeLabel(r.taskResultType);
                    return (
                      <tr key={`${r.taskRecordId}-${i}`} style={{ background: i % 2 === 0 ? '#0f172a' : '#111827', borderBottom: '1px solid #1e293b' }}>
                        <td style={{ padding: '10px 12px', color: '#e2e8f0', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.storeName}</td>
                        <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{r.siteName} ({r.siteCode})</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ color: typeInfo.color, background: `${typeInfo.color}22`, padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>
                            {typeInfo.label}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', color: '#64748b', whiteSpace: 'nowrap' }}>{formatTimestamp(r.taskStartTime)}</td>
                        <td style={{ padding: '10px 12px', color: '#64748b', whiteSpace: 'nowrap' }}>{formatTimestamp(r.taskEndTime)}</td>
                        <td style={{ padding: '10px 12px', color: '#ef4444', fontSize: '11px', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.errorMsg || r.errorCode || '-'}</td>
                        <td style={{ padding: '10px 12px' }}>
                          {r.downloadUrl ? (
                            <a href={r.downloadUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#f97316', fontSize: '11px', textDecoration: 'none' }}>下载</a>
                          ) : <span style={{ color: '#475569' }}>-</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Master Prompt ── */}
      {activeTab === 'prompts' && (
        <div>
          <div style={{ background: '#1e293b', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>
              🧙 <strong style={{ color: '#f97316' }}>64卦 × 虎步RPA Master Prompt</strong>：将虎步RPA抓取的原始数据，通过太极AI进行二次分析，自动生成决策建议。
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px', marginBottom: '20px' }}>
            {MASTER_PROMPTS.map(p => (
              <div key={p.id} style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '16px' }}>
                <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: '8px', fontSize: '14px' }}>{p.label}</div>
                <div style={{ color: '#64748b', fontSize: '12px', lineHeight: 1.6, marginBottom: '12px', maxHeight: '80px', overflow: 'hidden' }}>{p.prompt}</div>
                <button onClick={() => {
                  navigator.clipboard.writeText(p.prompt);
                  toast.success('Prompt 已复制到剪贴板！');
                }} style={{ padding: '6px 14px', background: '#f97316', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                  📋 复制 Prompt
                </button>
              </div>
            ))}
          </div>

          <h4 style={{ color: '#e2e8f0', margin: '0 0 12px 0', fontSize: '14px' }}>⚡ 快捷执行链</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {QUICK_PROMPTS.map((qp, i) => (
              <div key={i} style={{ background: '#1e293b', borderRadius: '8px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8', fontSize: '13px' }}>{qp.label}</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => {
                    navigator.clipboard.writeText(qp.prompt);
                    toast.success('Prompt 已复制！');
                  }} style={{ padding: '4px 12px', background: '#334155', border: 'none', color: '#e2e8f0', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                    复制
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 完整Master Prompt */}
          <div style={{ marginTop: '20px', background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ color: '#f97316', margin: 0, fontSize: '14px' }}>🧙 虎步RPA × 64卦 完整Master Prompt</h4>
              <button onClick={() => {
                navigator.clipboard.writeText(MASTER_PROMPTS.map(p => p.prompt).join('\n\n---\n\n'));
                toast.success('全部复制成功！');
              }} style={{ padding: '6px 14px', background: '#f97316', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                📋 复制全部
              </button>
            </div>
            <pre style={{ color: '#94a3b8', fontSize: '12px', lineHeight: 1.8, overflowX: 'auto', margin: 0, whiteSpace: 'pre-wrap' }}>
{`你是一个跨境电商AI太极分析师，集成虎步RPA数据抓取能力与64卦决策系统。

## 核心工作流
1. 接收虎步RPA抓取的数据（CSV/JSON格式，通常包含ASIN、销量、排名、价格等）
2. 进行结构化数据分析（趋势、对比、异常检测）
3. 结合太极64卦体系给出卦象判断和决策建议
4. 输出：Markdown报告 + 卦象建议 + 行动计划

## 卦象决策框架
- 乾卦（111111）：激进扩张，适合数据强势、竞品疲软
- 坤卦（000000）：防守观望，适合市场不明、数据下行
- 谦卦（101110）：谨慎前行，适合稳步增长、需要验证
- 豫卦（000110）：顺势而动，适合补货、扩品时机判断
- 损卦（100010）：止损优化，适合差评分析、运营问题诊断
- 颐卦（010010）：蓄力改善，适合产品迭代、Listing优化

## 数据格式要求
输入：虎步RPA导出CSV/JSON（必须包含字段：asin, sales, rank, price, site）
输出：结构化报告（Markdown格式）

请开始分析虎步RPA抓取的数据。`}
            </pre>
          </div>
        </div>
      )}

      {/* ── 配置 ── */}
      {activeTab === 'settings' && (
        <div>
          <div style={{ background: '#1e293b', borderRadius: '10px', padding: '20px', marginBottom: '16px' }}>
            <h3 style={{ color: '#e2e8f0', margin: '0 0 16px 0', fontSize: '15px' }}>🔑 API凭证配置</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '4px' }}>AppID</label>
                <input value={config.appId} onChange={e => setConfig(prev => ({ ...prev, appId: e.target.value }))} placeholder="请输入虎步AppID" style={{
                  width: '100%', padding: '8px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#e2e8f0', fontSize: '13px', boxSizing: 'border-box',
                }} />
              </div>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '4px' }}>AppSecret</label>
                <input type="password" value={config.appSecret} onChange={e => setConfig(prev => ({ ...prev, appSecret: e.target.value }))} placeholder="请输入虎步AppSecret" style={{
                  width: '100%', padding: '8px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#e2e8f0', fontSize: '13px', boxSizing: 'border-box',
                }} />
              </div>
            </div>
            <button onClick={validateToken} disabled={tokenStatus === 'loading'} style={{
              padding: '10px 24px', background: '#f97316', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
            }}>
              {tokenStatus === 'loading' ? '验证中...' : '✅ 验证Token'}
            </button>
          </div>

          <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '20px', marginBottom: '16px' }}>
            <h4 style={{ color: '#e2e8f0', margin: '0 0 12px 0', fontSize: '14px' }}>📋 接入指南</h4>
            <ol style={{ color: '#94a3b8', fontSize: '13px', lineHeight: 2, paddingLeft: '20px', margin: 0 }}>
              <li>登录 <a href={HB_WEB} target="_blank" rel="noopener noreferrer" style={{ color: '#f97316' }}>虎步RPA官网</a> → 管理设置 → API管理 → API自用申请</li>
              <li>选择「包含创建任务在内的全部接口」并提交申请</li>
              <li>将服务器IP加入<strong style={{ color: '#e2e8f0' }}>IP白名单</strong>（必填）</li>
              <li>获取 AppID 和 AppSecret，填入上方配置</li>
              <li>点击「验证Token」确认连通性</li>
              <li>前往「模板市场」选择RPA，前往「执行任务」提交计划</li>
            </ol>
          </div>

          <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '20px', marginBottom: '16px' }}>
            <h4 style={{ color: '#e2e8f0', margin: '0 0 12px 0', fontSize: '14px' }}>🔗 核心接口速查</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { method: 'POST', path: '/rpa/company/plans', desc: '提交执行计划' },
                { method: 'GET', path: '/rpa/company/tasks/results', desc: '查询任务执行结果' },
                { method: 'POST', path: '/auth/token', desc: '获取/刷新 AppToken' },
              ].map(api => (
                <div key={api.path} style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '13px' }}>
                  <span style={{ background: api.method === 'POST' ? '#065f46' : '#1e3a5f', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>{api.method}</span>
                  <code style={{ color: '#f97316', fontFamily: 'monospace' }}>{HB_API_BASE}{api.path}</code>
                  <span style={{ color: '#64748b' }}>{api.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SDK下载 */}
          <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '20px' }}>
            <h4 style={{ color: '#e2e8f0', margin: '0 0 12px 0', fontSize: '14px' }}>🛠️ SDK下载</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {['Java', 'Python', 'Node.js', 'PHP'].map(lang => (
                <a key={lang} href={HB_SUPPORT} target="_blank" rel="noopener noreferrer" style={{
                  padding: '10px 14px', background: '#1e293b', borderRadius: '6px', color: '#94a3b8', fontSize: '13px', textDecoration: 'none', textAlign: 'center',
                }}>
                  {lang}
                </a>
              ))}
            </div>
          </div>

          {/* 保存配置 */}
          <button onClick={() => {
            localStorage.setItem('hubu_appId', config.appId);
            localStorage.setItem('hubu_appSecret', config.appSecret);
            toast.success('配置已保存到本地！');
          }} style={{
            width: '100%', marginTop: '12px', padding: '10px', background: '#334155', color: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px',
          }}>
            💾 保存配置
          </button>
        </div>
      )}
    </div>
  );
}

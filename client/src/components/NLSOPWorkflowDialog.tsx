/**
 * 自然语言 SOP 业务流程工作流创建对话框
 * SIMIAICLAW · 64卦太极系统
 * 输入自然语言描述 → AI 解析 SOP 步骤 → 映射卦位节点 → 生成标准化业务流程工作流
 */
import React, { useState } from 'react';

interface SOPStep {
  id: string;
  order: number;
  name: string;
  description: string;
  hexagramId: string;
  hexagramName: string;
  palace: string;
  icon: string;
  input: string;
  output: string;
  duration: string;
  tools: string[];
  kpi?: string;
}

interface GeneratedSOPWorkflow {
  id: string;
  name: string;
  industry: string;
  description: string;
  steps: SOPStep[];
  totalNodes: number;
  estimatedDuration: string;
  createdAt: string;
}

// ══════════════════════════════════════════════════════════════
// SOP 步骤模板库（按行业分类）
// ══════════════════════════════════════════════════════════════

const SOP_TEMPLATES: Record<string, {
  name: string;
  industry: string;
  steps: Omit<SOPStep, 'id' | 'hexagramId' | 'hexagramName' | 'palace' | 'icon'>[];
}> = {
  ecommerce: {
    name: '跨境电商选品-上架-运营 SOP',
    industry: '跨境电商',
    steps: [
      { order: 1, name: '市场调研与竞品分析', description: '调研目标市场热度、竞品销量、价格区间、用户评价', input: '市场关键词', output: '竞品分析报告', duration: '2-4小时', tools: ['数据分析', '竞品监控'], kpi: 'Top 100 热销品' },
      { order: 2, name: '选品决策与供应商对接', description: '评估利润空间，确认供应商报价和交期', input: '竞品数据', output: '选品清单 + 供应商报价单', duration: '1-2天', tools: ['供应商筛选', '成本核算'], kpi: '利润率 > 30%' },
      { order: 3, name: '产品 listing 优化', description: '撰写高转化标题、五点描述、A+内容，嵌入关键词', input: '产品信息', output: '优化后 listing', duration: '30分钟/品', tools: ['文案生成', '关键词优化'], kpi: '转化率 > 10%' },
      { order: 4, name: '视觉素材制作', description: '白底图+场景图+视频+图文详情页', input: '产品素材', output: '完整视觉包', duration: '1-2天', tools: ['图片处理', '视频剪辑'], kpi: '点击率 > 5%' },
      { order: 5, name: '广告投放与推广', description: 'SP/SB/SD 广告结构搭建，关键词广告组设置', input: '产品 ASIN', output: '广告活动报表', duration: '持续优化', tools: ['广告管理', '数据分析'], kpi: 'ACOS < 25%' },
      { order: 6, name: '数据复盘与迭代', description: '周度分析销量、广告花费、BSR 排名，优化策略', input: '运营数据', output: '优化建议报告', duration: '每周一次', tools: ['数据分析', '报告生成'], kpi: '月增长率 > 20%' },
    ],
  },
  content: {
    name: '内容矩阵生产 SOP',
    industry: '内容创作',
    steps: [
      { order: 1, name: '热点选题挖掘', description: '监测平台热榜、行业热点，生成选题矩阵', input: '平台数据', output: '选题清单（10-20个）', duration: '1小时/天', tools: ['热点监控', 'AI选题'], kpi: '选题命中率 > 60%' },
      { order: 2, name: '脚本/文案撰写', description: '按选题撰写脚本或文案，嵌入 SEO 关键词', input: '选题', output: '脚本/文案初稿', duration: '20-40分钟/篇', tools: ['AI文案', 'SEO优化'], kpi: '完播率 > 40%' },
      { order: 3, name: '素材拍摄/生成', description: '拍摄或 AI 生成配图、视频素材', input: '文案脚本', output: '素材文件包', duration: '30-60分钟/篇', tools: ['视频生成', '图片处理'], kpi: '素材通过率 > 90%' },
      { order: 4, name: '多平台分发与发布', description: '一键分发至抖音/小红书/B站/公众号等平台', input: '成品素材', output: '发布记录', duration: '10分钟/平台', tools: ['内容分发', '定时发布'], kpi: '覆盖 5+ 平台' },
      { order: 5, name: '互动运营与粉丝维护', description: '回复评论、私信，收集用户反馈', input: '互动数据', output: '用户反馈报告', duration: '持续进行', tools: ['评论管理', '数据分析'], kpi: '互动率 > 5%' },
    ],
  },
  brand: {
    name: '品牌出海全链路 SOP',
    industry: '品牌出海',
    steps: [
      { order: 1, name: '品牌定位与市场调研', description: '确定目标市场、用户画像、竞争差异化', input: '市场数据', output: '品牌定位文档', duration: '3-5天', tools: ['市场调研', '用户画像'], kpi: '品牌定位清晰度 100%' },
      { order: 2, name: '品牌形象设计与 VI', description: 'LOGO、VI色系、视觉风格、产品包装', input: '品牌定位', output: '完整VI手册', duration: '5-10天', tools: ['视觉设计', '品牌规范'], kpi: '品牌识别度 > 80%' },
      { order: 3, name: '品牌官网/GEO 建站', description: 'AI 建站 + GEO 内容布局 + SEO 结构化', input: '品牌素材', output: '品牌官网 + GEO 内容矩阵', duration: '3-7天', tools: ['AI建站', 'GEO分发', 'SEO优化'], kpi: 'SEO关键词覆盖 50+' },
      { order: 4, name: '社媒矩阵搭建与内容运营', description: '搭建 Instagram/TikTok/LinkedIn 矩阵', input: '品牌素材', output: '社媒运营计划', duration: '持续进行', tools: ['内容生产', '社交运营'], kpi: '粉丝增长 500+/月' },
      { order: 5, name: '红人营销与 PR 曝光', description: '对接 KOL/KOC，进行产品测评和内容合作', input: '红人名单', output: '合作内容 + 曝光数据', duration: '2-4周', tools: ['红人匹配', 'PR管理'], kpi: '触达用户 10万+' },
      { order: 6, name: '数据监控与品牌迭代', description: '监测品牌声量、搜索指数、舆情', input: '全网数据', output: '品牌健康度报告', duration: '每月一次', tools: ['舆情监控', '数据分析'], kpi: '品牌搜索量 +30%/月' },
    ],
  },
  data: {
    name: '数据分析复盘 SOP',
    industry: '数据分析',
    steps: [
      { order: 1, name: '数据采集与清洗', description: '汇总各平台后台数据，去重清洗', input: '原始数据源', output: '清洗后数据集', duration: '1-2小时', tools: ['数据采集', '清洗处理'], kpi: '数据完整率 > 95%' },
      { order: 2, name: '核心指标计算', description: '计算 DAU/MAU、GMV、转化率、留存率等', input: '清洗数据', output: '指标看板', duration: '30分钟', tools: ['指标计算', '可视化'], kpi: '指标准确率 100%' },
      { order: 3, name: '同比环比分析', description: '与上周/月/期对比，发现异常和趋势', input: '历史数据', output: '趋势分析报告', duration: '1-2小时', tools: ['趋势分析', '异常检测'], kpi: '异常识别率 > 90%' },
      { order: 4, name: '归因分析与洞察提炼', description: '找出核心增长驱动因素，归因成功/失败原因', input: '指标数据', output: '归因分析文档', duration: '2-3小时', tools: ['归因分析', 'AI洞察'], kpi: '洞察覆盖率 > 80%' },
      { order: 5, name: '优化建议与行动计划', description: '基于洞察生成可执行的下一步行动计划', input: '归因报告', output: '行动计划清单', duration: '1-2小时', tools: ['AI建议', '任务分解'], kpi: '行动项清晰度 100%' },
      { order: 6, name: '复盘报告生成与分发', description: '生成完整复盘 PPT/报告，定时发送给团队', input: '行动计划', output: '复盘报告', duration: '30分钟', tools: ['报告生成', '自动分发'], kpi: '报告完整度 100%' },
    ],
  },
  customer: {
    name: '智能客服 SOP',
    industry: '客户服务',
    steps: [
      { order: 1, name: '客户咨询分类识别', description: 'AI 自动识别咨询类型：售前/售后/投诉/退款', input: '用户消息', output: '咨询分类标签', duration: '< 1秒/条', tools: ['意图识别', 'NLP分析'], kpi: '分类准确率 > 95%' },
      { order: 2, name: '知识库检索匹配', description: '从知识库中匹配最佳回复答案', input: '分类标签 + 用户问题', output: '候选回复列表', duration: '< 2秒/条', tools: ['知识库检索', '向量匹配'], kpi: '召回率 > 90%' },
      { order: 3, name: '智能回复生成', description: '基于知识库和上下文生成专业回复草稿', input: '匹配答案', output: '回复草稿', duration: '< 3秒/条', tools: ['AI生成', '语气优化'], kpi: '满意度 > 85%' },
      { order: 4, name: '人工介入与升级', description: '复杂问题自动升级给人工客服', input: '无法解答的咨询', output: '升级工单', duration: '< 5秒/条', tools: ['工单系统', '自动路由'], kpi: '升级及时率 100%' },
      { order: 5, name: '满意度收集与学习', description: '收集用户满意度评价，更新知识库', input: '会话记录', output: '满意度报告 + 知识库更新', duration: '每日汇总', tools: ['反馈收集', '知识更新'], kpi: '好评率 > 90%' },
    ],
  },
  video: {
    name: 'AI 视频工厂 SOP',
    industry: '视频创作',
    steps: [
      { order: 1, name: '选题策划与脚本生成', description: '输入主题，AI 自动生成完整视频脚本和分镜', input: '视频主题', output: '完整分镜脚本', duration: '5-10分钟', tools: ['AI脚本', '分镜生成'], kpi: '脚本通过率 > 80%' },
      { order: 2, name: 'AI 视频素材生成', description: '使用 AI 生成视频片段、配图素材', input: '分镜脚本', output: '素材片段包', duration: '10-20分钟', tools: ['视频生成', '图像生成'], kpi: '素材可用率 > 85%' },
      { order: 3, name: '配音与字幕生成', description: 'AI 生成配音（多语言）+ 自动字幕', input: '视频素材', output: '配音文件 + 字幕文件', duration: '5-15分钟', tools: ['语音合成', '字幕生成'], kpi: '语音自然度 > 90%' },
      { order: 4, name: '视频剪辑与合成', description: '自动剪辑拼接，添加转场、BGM、特效', input: '素材包', output: '成片视频', duration: '10-20分钟', tools: ['视频剪辑', '特效处理'], kpi: '成片质量 > 85分' },
      { order: 5, name: '多平台适配与分发', description: '自动裁剪适配不同平台比例，添加水印', input: '成片', output: '各平台适配版本', duration: '5分钟', tools: ['格式转换', '自动分发'], kpi: '覆盖 3+ 平台' },
      { order: 6, name: '数据追踪与效果分析', description: '追踪播放量、完播率、转化数据', input: '分发数据', output: '效果分析报告', duration: '每日汇总', tools: ['数据追踪', '效果分析'], kpi: '平均播放完成率 > 50%' },
    ],
  },
};

// 64卦宫位路由映射（关键词 → 卦位）
const HEXAGRAM_KEYWORDS: Record<string, { hexId: string; name: string; palace: string; icon: string }> = {
  // 乾宫：战略、决策、增长
  '乾宫': { hexId: 'Q1', name: '乾为天', palace: '乾宫', icon: '⚔️' },
  // 坤宫：运营、执行、落地
  '坤宫': { hexId: 'K1', name: '坤为地', palace: '坤宫', icon: '📝' },
  // 震宫：视觉、内容、创意
  '震宫': { hexId: 'Z1', name: '震为雷', palace: '震宫', icon: '🎨' },
  // 巽宫：技术、工具、自动化
  '巽宫': { hexId: 'X1', name: '巽为风', palace: '巽宫', icon: '⚙️' },
  // 坎宫：营销、推广、增长
  '坎宫': { hexId: 'C1', name: '坎为水', palace: '坎宫', icon: '🚀' },
  // 离宫：数据、分析、洞察
  '离宫': { hexId: 'L1', name: '离为火', palace: '离宫', icon: '📊' },
  // 艮宫：品牌、视觉、IP
  '艮宫': { hexId: 'G1', name: '艮为山', palace: '艮宫', icon: '🏔️' },
  // 兑宫：总控、协作、调度
  '兑宫': { hexId: 'D1', name: '兑为泽', palace: '兑宫', icon: '🦞' },
};

// SOP类型到宫位映射
const SOP_TYPE_TO_PALACE: Record<string, string> = {
  '市场调研': '乾宫', '竞品分析': '乾宫', '选品': '乾宫',
  '运营': '坤宫', '执行': '坤宫', '落地': '坤宫', '管理': '坤宫',
  '内容': '震宫', '文案': '震宫', '脚本': '震宫', '视觉': '震宫', '素材': '震宫', '视频': '震宫', '剪辑': '震宫', '拍摄': '震宫',
  '技术': '巽宫', '建站': '巽宫', '开发': '巽宫', '自动化': '巽宫', 'SEO': '巽宫',
  '营销': '坎宫', '推广': '坎宫', '广告': '坎宫', '投放': '坎宫', '分发': '坎宫', '社交': '坎宫', '红人': '坎宫',
  '数据': '离宫', '分析': '离宫', '复盘': '离宫', '洞察': '离宫', '指标': '离宫', '监控': '离宫',
  '品牌': '艮宫', 'IP': '艮宫', 'VI': '艮宫', '包装': '艮宫', '设计': '艮宫',
  '总控': '兑宫', '协作': '兑宫', '客服': '兑宫', '调度': '兑宫', '协调': '兑宫',
};

function detectPalace(keyword: string): string {
  for (const [key, palace] of Object.entries(SOP_TYPE_TO_PALACE)) {
    if (keyword.includes(key)) return palace;
  }
  return '兑宫'; // 默认总控
}

function parseNaturalLanguage(text: string): { industry: string; steps: Omit<SOPStep, 'id' | 'hexagramId' | 'hexagramName' | 'palace' | 'icon'>[] } {
  const lower = text.toLowerCase();

  // 检测行业
  let industry = '通用业务';
  if (lower.includes('电商') || lower.includes('amazon') || lower.includes('亚马逊') || lower.includes('shopee') || lower.includes('跨境')) industry = '跨境电商';
  else if (lower.includes('内容') || lower.includes('小红书') || lower.includes('抖音') || lower.includes('社媒') || lower.includes('自媒体')) industry = '内容创作';
  else if (lower.includes('品牌') || lower.includes('出海') || lower.includes('独立站')) industry = '品牌出海';
  else if (lower.includes('数据') || lower.includes('分析') || lower.includes('复盘') || lower.includes('BI')) industry = '数据分析';
  else if (lower.includes('客服') || lower.includes('售后') || lower.includes('咨询')) industry = '客户服务';
  else if (lower.includes('视频') || lower.includes('TikTok') || lower.includes('youtube')) industry = '视频创作';

  // 关键词检测 → 生成步骤
  const keywords = [
    '调研', '分析', '竞品', '市场', '选品',
    '内容', '文案', '脚本', '素材', '视觉', '图片', '视频', '剪辑',
    'SEO', '建站', 'GEO', '投放', '广告', '推广', '营销', '分发',
    '数据', '指标', '监控', '复盘', '优化',
    '品牌', 'IP', '设计',
    '客服', '咨询', '服务',
    '总控', '调度',
  ];

  const found = keywords.filter(k => lower.includes(k) || lower.includes(k.replace(/[A-Z]/g, s => s.toLowerCase())));
  if (found.length === 0) found.push('运营');

  // 过滤重复，保留语义
  const unique: string[] = [];
  const seen = new Set<string>();
  found.forEach(f => {
    const norm = f.replace(/[A-Z]/g, s => s.toLowerCase());
    if (!seen.has(norm)) { seen.add(norm); unique.push(f); }
  });

  // 生成步骤描述
  const stepTemplates: Record<string, { name: string; desc: string; duration: string; tools: string[] }> = {
    '调研': { name: '深度市场调研', desc: '调研市场规模、目标用户、竞争格局', duration: '2-4小时', tools: ['市场调研', '竞品分析'] },
    '分析': { name: '综合数据分析', desc: '多维度数据分析，生成业务洞察', duration: '1-2小时', tools: ['数据分析', 'AI洞察'] },
    '竞品': { name: '竞品对标分析', desc: '分析竞品优劣势，寻找差异化机会', duration: '1-3小时', tools: ['竞品监控', '差异化分析'] },
    '市场': { name: '市场机会评估', desc: '评估市场容量、增长空间、进入时机', duration: '2-4小时', tools: ['市场调研', '增长预测'] },
    '选品': { name: '智能选品决策', desc: '多维评估选品，利润率和风险分析', duration: '1-2天', tools: ['选品工具', '成本核算'] },
    '内容': { name: '内容策划与生产', desc: '策划内容主题，AI 生成高质量文案', duration: '30分钟/篇', tools: ['AI文案', '内容策划'] },
    '文案': { name: '文案创作与优化', desc: '撰写 SEO 优化文案，提升转化率', duration: '20分钟/篇', tools: ['AI文案', 'SEO优化'] },
    '脚本': { name: '脚本/方案撰写', desc: '撰写视频脚本、活动方案、商业计划', duration: '30-60分钟', tools: ['AI写作', '方案模板'] },
    '素材': { name: '视觉素材制作', desc: 'AI 生成图片、视频、海报等素材', duration: '10-30分钟/件', tools: ['图像生成', '视频生成'] },
    '视觉': { name: '视觉设计与包装', desc: '设计产品图、品牌视觉、宣传物料', duration: '1-3天', tools: ['视觉设计', 'AI修图'] },
    '图片': { name: '图片处理与优化', desc: 'AI 修图、批量处理、尺寸适配', duration: '5-20分钟/张', tools: ['AI修图', '批量处理'] },
    '视频': { name: '视频制作与剪辑', desc: 'AI 生成视频片段，自动剪辑合成', duration: '10-30分钟/条', tools: ['视频生成', '自动剪辑'] },
    '剪辑': { name: '视频剪辑合成', desc: '拼接、转场、特效、配音合成', duration: '15-30分钟/条', tools: ['视频剪辑', '特效处理'] },
    'SEO': { name: 'SEO 优化布局', desc: '关键词研究、站内优化、外链建设', duration: '持续进行', tools: ['SEO工具', '内容优化'] },
    '建站': { name: 'AI 智能建站', desc: 'AI 生成品牌官网，结构化 SEO 内容', duration: '3-7天', tools: ['AI建站', 'GEO分发'] },
    'GEO': { name: 'GEO 内容分发', desc: '结构化内容全网分发，品牌全域曝光', duration: '持续进行', tools: ['GEO分发', '内容矩阵'] },
    '投放': { name: '广告投放管理', desc: '搭建广告结构，关键词策略，持续优化', duration: '持续优化', tools: ['广告管理', '数据分析'] },
    '广告': { name: '广告创意制作', desc: '制作图文广告、短视频广告素材', duration: '30分钟/套', tools: ['广告创意', 'A/B测试'] },
    '推广': { name: '全渠道推广', desc: '多平台推广策略，KOL/KOC 合作', duration: '2-4周', tools: ['推广策略', '红人营销'] },
    '营销': { name: '营销活动策划', desc: '策划促销活动，提升转化和复购', duration: '1-3天', tools: ['活动策划', '转化优化'] },
    '分发': { name: '多平台内容分发', desc: '一键分发内容至各平台，定时发布', duration: '10分钟/平台', tools: ['自动分发', '定时发布'] },
    '数据': { name: '数据采集与分析', desc: '采集各平台数据，生成分析报告', duration: '1-2小时', tools: ['数据采集', 'BI分析'] },
    '指标': { name: '核心指标监控', desc: '实时监控 KPI 指标，异常预警', duration: '实时', tools: ['指标监控', '异常检测'] },
    '监控': { name: '业务数据监控', desc: '多维度数据监控，实时掌握业务状态', duration: '实时', tools: ['数据监控', '预警通知'] },
    '复盘': { name: '周期性业务复盘', desc: '周/月度复盘，生成优化建议', duration: '1-2小时', tools: ['复盘报告', 'AI建议'] },
    '优化': { name: '策略优化迭代', desc: '基于数据反馈持续优化业务流程', duration: '持续进行', tools: ['A/B测试', '迭代优化'] },
    '品牌': { name: '品牌建设与维护', desc: '品牌定位、VI 设计、长期品牌资产', duration: '长期', tools: ['品牌策略', 'VI设计'] },
    'IP': { name: 'IP 打造与运营', desc: '创始人IP/品牌IP打造，持续内容输出', duration: '长期', tools: ['IP策划', '内容矩阵'] },
    '设计': { name: '设计规范制定', desc: '制定设计系统，统一视觉语言', duration: '1-2周', tools: ['设计规范', '组件库'] },
    '客服': { name: '智能客服运营', desc: 'AI 客服接待，人工协作，满意度管理', duration: '7×24小时', tools: ['AI客服', '知识库'] },
    '咨询': { name: '咨询解答服务', desc: '智能解答用户咨询，高效转人工', duration: '实时', tools: ['AI问答', '知识库检索'] },
    '服务': { name: '客户服务管理', desc: '售前咨询、售后服务、投诉处理', duration: '持续', tools: ['工单管理', 'CRM'] },
    '总控': { name: '总控协调与调度', desc: '协调各环节，监控整体流程进度', duration: '持续', tools: ['总控调度', '进度监控'] },
    '调度': { name: '任务分配与调度', desc: '智能分配任务，协调团队高效协作', duration: '持续', tools: ['任务调度', '协作管理'] },
    '运营': { name: '日常运营管理', desc: '日常运营执行，数据跟踪与优化', duration: '持续', tools: ['运营工具', '数据跟踪'] },
  };

  const steps: Omit<SOPStep, 'id' | 'hexagramId' | 'hexagramName' | 'palace' | 'icon'>[] = [];
  let order = 1;

  // 如果有关键词，按关键词生成；否则使用模板
  if (unique.length > 0) {
    for (const kw of unique.slice(0, 8)) {
      const tpl = stepTemplates[kw];
      if (tpl) {
        steps.push({
          order: order++,
          name: tpl.name,
          description: tpl.desc,
          input: '待处理数据',
          output: '处理结果',
          duration: tpl.duration,
          tools: tpl.tools,
        });
      }
    }
  }

  // 如果步骤太少，补充行业标准步骤
  if (steps.length < 3) {
    const template = SOP_TEMPLATES[industry] || SOP_TEMPLATES['ecommerce'];
    template.steps.slice(0, 4).forEach((s, i) => {
      if (!steps.find(e => e.name.includes(s.name.substring(0, 4)))) {
        steps.push({ ...s, order: order++ });
      }
    });
  }

  return { industry, steps: steps.slice(0, 8) };
}

// ══════════════════════════════════════════════════════════════
// 主组件
// ══════════════════════════════════════════════════════════════

interface NLSOPWorkflowDialogProps {
  onClose: () => void;
  onGenerated?: (workflow: GeneratedSOPWorkflow) => void;
}

const EXAMPLES = [
  { label: '🛒 跨境电商选品到广告投放', text: '我想做一个跨境电商的完整流程，从选品调研开始，然后优化listing，做视觉素材，最后做广告投放和数据分析复盘' },
  { label: '📝 内容矩阵多平台运营', text: '我要做小红书和抖音的内容运营，需要定期追热点写文案，生成配图素材，然后分发到各平台，最后做数据复盘' },
  { label: '🌐 品牌出海 GEO 全域曝光', text: '我想要一个品牌出海的 SOP，包括市场调研、品牌定位、AI 建站、GEO 内容分发、社媒运营和红人营销' },
  { label: '🤖 智能客服全流程', text: '我想搭建一套 AI 智能客服 SOP，自动分类客户问题，检索知识库生成回复，复杂问题转人工，最后收集满意度' },
  { label: '🎬 AI 视频工厂流水线', text: '我需要一个 AI 视频工厂的 SOP，从选题脚本开始，AI 生成视频素材，字幕配音，最后剪辑合成多平台分发' },
  { label: '📊 数据驱动运营复盘', text: '搭建一个数据复盘 SOP，数据采集清洗，计算核心指标，分析同比环比，归因洞察，最后生成优化建议和报告' },
];

export function NLSOPWorkflowDialog({ onClose, onGenerated }: NLSOPWorkflowDialogProps) {
  const [step, setStep] = useState<'input' | 'parsing' | 'preview' | 'done'>('input');
  const [inputText, setInputText] = useState('');
  const [detectedKeywords, setDetectedKeywords] = useState<string[]>([]);
  const [detectedIndustry, setDetectedIndustry] = useState('');
  const [parsingProgress, setParsingProgress] = useState(0);
  const [parsedSteps, setParsedSteps] = useState<SOPStep[]>([]);
  const [workflowName, setWorkflowName] = useState('');
  const [activeTab, setActiveTab] = useState<'steps' | 'overview'>('steps');

  // 填充示例
  const applyExample = (text: string) => {
    setInputText(text);
  };

  // 开始解析
  const startParsing = () => {
    if (!inputText.trim()) return;
    setStep('parsing');
    setParsingProgress(0);

    // 解析动画
    const keywords = inputText.match(/[选品|文案|脚本|素材|视频|剪辑|广告|投放|数据|分析|复盘|SEO|建站|GEO|品牌|客服|咨询|调研|运营|推广|监控|指标|设计|IP|营销|分发|调度|总控]+/g) || [];
    setDetectedKeywords(keywords.slice(0, 10));

    const phases = [
      { progress: 15, action: '🔍 关键词提取...' },
      { progress: 35, action: '🏭 行业类型识别...' },
      { progress: 55, action: '🧭 64卦宫位路由...' },
      { progress: 75, action: '📋 SOP 步骤生成...' },
      { progress: 90, action: '🔗 节点连线规划...' },
      { progress: 100, action: '✨ 工作流配置完成！' },
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < phases.length) {
        setParsingProgress(phases[i].progress);
        i++;
      } else {
        clearInterval(interval);

        // 生成工作流步骤
        const { industry, steps: rawSteps } = parseNaturalLanguage(inputText);
        setDetectedIndustry(industry);

        const steps: SOPStep[] = rawSteps.map((s, idx) => {
          const palace = detectPalace(s.name + s.description);
          const hex = HEXAGRAM_KEYWORDS[palace] || HEXAGRAM_KEYWORDS['兑宫'];
          return {
            ...s,
            id: `sop_step_${Date.now()}_${idx}`,
            hexagramId: hex.hexId,
            hexagramName: hex.name,
            palace: hex.palace,
            icon: hex.icon,
          };
        });

        setParsedSteps(steps);
        setWorkflowName(`${industry} SOP 流程 v${new Date().toLocaleDateString('zh-CN').replace(/\//g, '.')}`);
        setStep('preview');
      }
    }, 600);
  };

  // 保存工作流
  const saveWorkflow = () => {
    const wf: GeneratedSOPWorkflow = {
      id: `sop_${Date.now()}`,
      name: workflowName,
      industry: detectedIndustry,
      description: inputText,
      steps: parsedSteps,
      totalNodes: parsedSteps.length,
      estimatedDuration: parsedSteps.reduce((acc, s) => acc + (parseInt(s.duration) || 1), 0) + '分钟（不含持续优化）',
      createdAt: new Date().toISOString(),
    };

    // 保存到 localStorage
    const existing = JSON.parse(localStorage.getItem('simiaiclaw_sop_workflows') || '[]');
    localStorage.setItem('simiaiclaw_sop_workflows', JSON.stringify([wf, ...existing]));

    onGenerated?.(wf);
    setStep('done');
  };

  // 导出为工作流配置
  const exportAsWorkflow = () => {
    const wfNodes = parsedSteps.map((s, i) => ({
      id: `node_${Date.now()}_${i}`,
      hexId: s.hexagramId,
      name: s.name,
      palace: s.palace,
      duty: s.description,
      x: 200 + (i % 4) * 200,
      y: 150 + Math.floor(i / 4) * 180,
      status: 'idle' as const,
      config: { tools: s.tools.join(', '), kpi: s.kpi || '' },
    }));

    const wf = {
      id: `wf_${Date.now()}`,
      name: workflowName,
      description: inputText.substring(0, 100),
      nodes: wfNodes,
      connections: wfNodes.slice(0, -1).map((n, i) => ({
        id: `conn_${Date.now()}_${i}`,
        from: n.id,
        to: wfNodes[i + 1].id,
        label: '→',
      })),
      status: 'draft' as const,
      createdAt: new Date().toISOString(),
      runCount: 0,
    };

    const existing = JSON.parse(localStorage.getItem('simiaiclaw_workflows') || '[]');
    localStorage.setItem('simiaiclaw_workflows', JSON.stringify([wf, ...existing]));

    return wf;
  };

  const PALACE_COLORS: Record<string, { accent: string; bg: string; border: string; glow: string }> = {
    '乾宫': { accent: 'text-red-400', bg: 'bg-red-950/30', border: 'border-red-500/30', glow: 'shadow-red-500/10' },
    '坤宫': { accent: 'text-amber-400', bg: 'bg-amber-950/30', border: 'border-amber-500/30', glow: 'shadow-amber-500/10' },
    '震宫': { accent: 'text-purple-400', bg: 'bg-purple-950/30', border: 'border-purple-500/30', glow: 'shadow-purple-500/10' },
    '巽宫': { accent: 'text-emerald-400', bg: 'bg-emerald-950/30', border: 'border-emerald-500/30', glow: 'shadow-emerald-500/10' },
    '坎宫': { accent: 'text-blue-400', bg: 'bg-blue-950/30', border: 'border-blue-500/30', glow: 'shadow-blue-500/10' },
    '离宫': { accent: 'text-orange-400', bg: 'bg-orange-950/30', border: 'border-orange-500/30', glow: 'shadow-orange-500/10' },
    '艮宫': { accent: 'text-gray-300', bg: 'bg-gray-900/30', border: 'border-gray-500/30', glow: 'shadow-gray-500/10' },
    '兑宫': { accent: 'text-cyan-400', bg: 'bg-cyan-950/30', border: 'border-cyan-500/30', glow: 'shadow-cyan-500/10' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600/40 to-violet-600/40 border border-indigo-500/30 flex items-center justify-center text-xl">📋</div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-white">自然语言创建 SOP 业务流程</h2>
            <p className="text-xs text-slate-500">输入业务流程描述 → AI 解析 → 生成标准化 SOP 工作流</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors text-lg">✕</button>
        </div>

        {/* 步骤指示器 */}
        <div className="px-6 pt-4 pb-2 shrink-0">
          <div className="flex items-center gap-2">
            {(['input', 'parsing', 'preview', 'done'] as const).map((s, i) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${step === s ? 'bg-indigo-600 text-white' : i < ['input', 'parsing', 'preview', 'done'].indexOf(step) ? 'bg-emerald-600/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                  <span>{i + 1}</span>
                  <span>{s === 'input' ? '输入描述' : s === 'parsing' ? 'AI解析' : s === 'preview' ? '预览确认' : '完成'}</span>
                </div>
                {i < 3 && <div className="flex-1 h-px bg-slate-800" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* 主体 */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {/* ── Step 1: 输入 ── */}
          {step === 'input' && (
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-2 block">📝 描述你的业务流程</label>
                <textarea
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder="例如：我想做一个跨境电商的完整流程，从选品调研开始，然后优化 listing，做视觉素材，最后做广告投放和数据分析复盘……"
                  className="w-full h-32 bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 resize-none focus:outline-none focus:border-indigo-500/60 transition-colors"
                  maxLength={500}
                />
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-slate-600">支持中英文，关键词越多生成越准确</span>
                  <span className="text-[10px] text-slate-600">{inputText.length}/500</span>
                </div>
              </div>

              {/* 64卦能力展示 */}
              <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/40">
                <p className="text-xs font-semibold text-slate-400 mb-3">🧭 64卦智能路由能力</p>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { icon: '⚔️', name: '乾宫', desc: '战略决策' },
                    { icon: '📝', name: '坤宫', desc: '运营执行' },
                    { icon: '🎨', name: '震宫', desc: '视觉创意' },
                    { icon: '⚙️', name: '巽宫', desc: '技术自动化' },
                    { icon: '🚀', name: '坎宫', desc: '营销推广' },
                    { icon: '📊', name: '离宫', desc: '数据分析' },
                    { icon: '🏔️', name: '艮宫', desc: '品牌IP' },
                    { icon: '🦞', name: '兑宫', desc: '总控调度' },
                  ].map(g => (
                    <div key={g.name} className="flex items-center gap-1.5 bg-slate-800/60 rounded-lg px-2 py-1.5">
                      <span className="text-sm">{g.icon}</span>
                      <div>
                        <div className="text-[10px] font-semibold text-white">{g.name}</div>
                        <div className="text-[9px] text-slate-500">{g.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 示例 */}
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-2">💡 或选择一个示例快速开始</p>
                <div className="grid grid-cols-2 gap-2">
                  {EXAMPLES.map(ex => (
                    <button
                      key={ex.label}
                      onClick={() => applyExample(ex.text)}
                      className="text-left bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/40 hover:border-indigo-500/40 rounded-lg px-3 py-2 transition-all group"
                    >
                      <div className="text-[11px] font-semibold text-slate-300 group-hover:text-indigo-300 transition-colors">{ex.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={startParsing}
                disabled={!inputText.trim()}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:from-slate-700 disabled:to-slate-700 text-white text-sm font-bold shadow-lg shadow-indigo-500/20 disabled:shadow-none transition-all disabled:cursor-not-allowed"
              >
                🚀 开始 AI 解析 → 生成 SOP 工作流
              </button>
            </div>
          )}

          {/* ── Step 2: 解析中 ── */}
          {step === 'parsing' && (
            <div className="flex flex-col items-center justify-center py-16 space-y-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-slate-800 flex items-center justify-center">
                  <div
                    className="w-16 h-16 rounded-full border-4 border-indigo-500/40 flex items-center justify-center"
                    style={{ borderTopColor: '#6366f1', animation: 'spin 1s linear infinite', borderRightColor: parsingProgress > 30 ? '#6366f1' : 'transparent', borderBottomColor: parsingProgress > 60 ? '#6366f1' : 'transparent', borderLeftColor: parsingProgress > 80 ? '#6366f1' : 'transparent' }}
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl">🧭</span>
                </div>
              </div>

              <div className="text-center space-y-2">
                <p className="text-sm font-bold text-white">正在解析业务流程...</p>
                <p className="text-xs text-slate-500">基于 64 卦太极系统路由引擎</p>
              </div>

              {/* 进度条 */}
              <div className="w-72 space-y-2">
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full transition-all duration-500"
                    style={{ width: `${parsingProgress}%` }}
                  />
                </div>
                <div className="space-y-1">
                  {[
                    { p: 15, label: '🔍 提取关键词', done: parsingProgress >= 15 },
                    { p: 35, label: '🏭 识别行业类型', done: parsingProgress >= 35 },
                    { p: 55, label: '🧭 路由至 64 卦宫位', done: parsingProgress >= 55 },
                    { p: 75, label: '📋 生成 SOP 步骤', done: parsingProgress >= 75 },
                    { p: 90, label: '🔗 规划节点连线', done: parsingProgress >= 90 },
                  ].map(item => (
                    <div key={item.p} className={`text-xs flex items-center gap-2 ${item.done ? 'text-indigo-400' : 'text-slate-600'}`}>
                      <span>{item.done ? '✅' : '○'}</span>
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 检测到的关键词 */}
              {parsingProgress >= 15 && detectedKeywords.length > 0 && (
                <div className="bg-slate-800/40 rounded-xl px-4 py-2 max-w-xs">
                  <p className="text-[10px] text-slate-500 mb-1">已识别关键词：</p>
                  <div className="flex flex-wrap gap-1">
                    {detectedKeywords.map(k => (
                      <span key={k} className="text-[10px] bg-indigo-600/20 text-indigo-300 px-1.5 py-0.5 rounded-full">{k}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: 预览 ── */}
          {step === 'preview' && (
            <div className="space-y-4 pt-2">
              {/* 工作流名称 */}
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">📌 工作流名称</label>
                <input
                  value={workflowName}
                  onChange={e => setWorkflowName(e.target.value)}
                  className="w-full bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/60"
                />
              </div>

              {/* Tab切换 */}
              <div className="flex gap-2">
                {(['steps', 'overview'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${activeTab === t ? 'bg-indigo-600 text-white' : 'bg-slate-800/60 text-slate-400 hover:text-white'}`}
                  >
                    {t === 'steps' ? `📋 SOP步骤 (${parsedSteps.length}步)` : '🗺️ 流程概览'}
                  </button>
                ))}
              </div>

              {activeTab === 'steps' && (
                <div className="space-y-3">
                  {parsedSteps.map((step, i) => {
                    const pc = PALACE_COLORS[step.palace] || PALACE_COLORS['兑宫'];
                    return (
                      <div key={step.id} className={`${pc.bg} border ${pc.border} rounded-xl p-4 ${pc.glow} transition-all`}>
                        {/* 步骤头部 */}
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-7 h-7 rounded-lg ${pc.bg} border ${pc.border} flex items-center justify-center text-sm font-bold ${pc.accent}`}>
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white">{step.name}</span>
                              <span className={`text-[10px] ${pc.accent} bg-slate-900/40 px-1.5 py-0.5 rounded-full`}>
                                {step.icon} {step.palace} · {step.hexagramName}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">{step.description}</p>
                          </div>
                          <span className="text-[10px] text-slate-600 shrink-0">{step.duration}</span>
                        </div>

                        {/* 步骤详情 */}
                        <div className="flex flex-wrap items-center gap-2 ml-10">
                          <span className="text-[10px] text-slate-500">📥 输入：<span className="text-slate-400">{step.input}</span></span>
                          <span className="text-[10px] text-slate-500">📤 输出：<span className="text-slate-400">{step.output}</span></span>
                          {step.tools.map(t => (
                            <span key={t} className="text-[10px] bg-slate-800/60 text-slate-400 px-1.5 py-0.5 rounded-full border border-slate-700/40">{t}</span>
                          ))}
                          {step.kpi && (
                            <span className="text-[10px] text-amber-400/80 bg-amber-900/20 px-1.5 py-0.5 rounded-full">🎯 {step.kpi}</span>
                          )}
                        </div>

                        {/* 连接箭头 */}
                        {i < parsedSteps.length - 1 && (
                          <div className="flex items-center gap-2 mt-2 ml-10">
                            <div className="w-px h-4 border-l-2 border-dashed border-slate-700/60" />
                            <span className="text-[10px] text-slate-600">↓</span>
                            <div className="w-px h-4 border-l-2 border-dashed border-slate-700/60" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTab === 'overview' && (
                <div className="space-y-4">
                  {/* 流程图预览 */}
                  <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/40">
                    <p className="text-xs font-semibold text-slate-400 mb-3">🗺️ 流程拓扑图</p>
                    <div className="flex flex-wrap gap-2 items-center justify-center">
                      {parsedSteps.map((step, i) => {
                        const pc = PALACE_COLORS[step.palace] || PALACE_COLORS['兑宫'];
                        return (
                          <React.Fragment key={step.id}>
                            <div className={`flex flex-col items-center gap-1 ${pc.bg} border ${pc.border} rounded-lg px-3 py-2 min-w-[80px]`}>
                              <span className="text-[10px] text-slate-600">{step.icon} {step.hexagramId}</span>
                              <span className={`text-xs font-bold ${pc.accent}`}>{step.name.substring(0, 5)}</span>
                              <span className="text-[9px] text-slate-600">{step.duration}</span>
                            </div>
                            {i < parsedSteps.length - 1 && (
                              <span className="text-slate-600 text-lg mx-1">→</span>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>

                  {/* 统计卡片 */}
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: 'SOP 步骤', value: parsedSteps.length, icon: '📋', color: 'text-indigo-400' },
                      { label: '涉及宫位', value: new Set(parsedSteps.map(s => s.palace)).size, icon: '🧭', color: 'text-amber-400' },
                      { label: '使用工具', value: new Set(parsedSteps.flatMap(s => s.tools)).size, icon: '⚙️', color: 'text-emerald-400' },
                      { label: 'KPI 指标', value: parsedSteps.filter(s => s.kpi).length, icon: '🎯', color: 'text-orange-400' },
                    ].map(stat => (
                      <div key={stat.label} className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/40 text-center">
                        <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{stat.icon} {stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* 宫位分布 */}
                  <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/40">
                    <p className="text-xs font-semibold text-slate-400 mb-3">🏛️ 宫位参与分布</p>
                    {Object.entries(
                      parsedSteps.reduce((acc: Record<string, number>, s) => {
                        acc[s.palace] = (acc[s.palace] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([palace, count]) => {
                      const pc = PALACE_COLORS[palace] || PALACE_COLORS['兑宫'];
                      const hex = HEXAGRAM_KEYWORDS[palace] || HEXAGRAM_KEYWORDS['兑宫'];
                      const pct = Math.round((count / parsedSteps.length) * 100);
                      return (
                        <div key={palace} className="flex items-center gap-3 mb-2">
                          <span className="text-sm w-8">{hex.icon}</span>
                          <span className={`text-xs w-12 ${pc.accent}`}>{palace}</span>
                          <div className="flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div className={`h-full ${pc.accent.replace('text-', 'bg-').replace('-400', '-500').replace('-300', '-400')}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[10px] text-slate-500 w-8 text-right">{count}步</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 按钮 */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep('input')}
                  className="flex-1 py-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white text-sm font-medium border border-slate-700/60 transition-all"
                >
                  ← 重新描述
                </button>
                <button
                  onClick={saveWorkflow}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all"
                >
                  💾 保存 SOP 流程
                </button>
              </div>
            </div>
          )}

          {/* ── Step 4: 完成 ── */}
          {step === 'done' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-600/30 to-teal-600/30 border border-emerald-500/40 flex items-center justify-center text-4xl animate-bounce">
                ✅
              </div>
              <div className="text-center space-y-2">
                <p className="text-base font-bold text-white">SOP 流程创建成功！</p>
                <p className="text-sm text-slate-400">{workflowName}</p>
                <p className="text-xs text-slate-500">{parsedSteps.length} 个标准化步骤 · 已保存至本地</p>
              </div>

              <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/40 max-w-sm w-full space-y-2">
                {parsedSteps.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-2 text-xs">
                    <span className="w-5 h-5 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                    <span className="text-white">{s.name}</span>
                    <span className="ml-auto text-slate-600">{s.icon} {s.palace}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 w-full max-w-sm">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-white text-sm font-medium transition-all"
                >
                  完成 ✓
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

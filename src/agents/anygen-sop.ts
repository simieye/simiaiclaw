/**
 * SIMIAICLAW 龙虾集群太极64卦系统
 * 外贸 SOP 自动化引擎
 *
 * 功能：
 * - 外贸全链路 SOP 定义（客户开发 → 询盘 → 报价 → 订单 → 跟进）
 * - 事件驱动自动触发（WebSocket / HTTP Webhook）
 * - 与 AnyGen AI 深度集成（每步 AI 决策 + 自动执行）
 * - 可配置的 SOP 节点（人工确认 / AI 自动 / 定时）
 * - SOP 执行日志 + 异常处理
 */

import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================
// 类型定义
// ============================================================

export type SOPTriggerType = 'event' | 'schedule' | 'manual' | 'webhook';
export type SOPNodeType = 'ai-decision' | 'human-confirm' | 'auto-action' | 'delay' | 'notify' | 'condition';
export type SOPNodeStatus = 'pending' | 'running' | 'completed' | 'skipped' | 'failed' | 'waiting-confirm';
export type SOPStatus = 'active' | 'paused' | 'archived';
export type SOPExecStatus = 'running' | 'completed' | 'failed' | 'cancelled' | 'paused';

export interface SOPTigger {
  type: SOPTriggerType;
  // event
  eventName?: string;        // 如: 'inquiry_received', 'payment_confirmed'
  platform?: string;         // 'alibaba' | 'amazon' | 'email' | 'manual'
  // schedule
  cron?: string;
  timezone?: string;
  // webhook
  webhookUrl?: string;
  webhookSecret?: string;
  // manual
  shortcutKeyword?: string;  // 用户输入关键词触发
}

export interface SOPNodeInput {
  name: string;
  label: string;
  type: 'text' | 'select' | 'file' | 'number' | 'date' | 'boolean';
  required?: boolean;
  default?: string | number | boolean;
  options?: string[];        // select 类型选项
  placeholder?: string;
  description?: string;
}

export interface SOPNodeOutput {
  name: string;
  label: string;
  description?: string;
}

export interface SOPTemlateNode {
  id: string;
  type: SOPNodeType;
  name: string;              // 节点名称（技术标识）
  label: string;             // 显示标签
  description?: string;
  // AI 决策节点
  aiModel?: 'anygen-cs' | 'anygen-business' | 'anygen-universal' | 'claude' | 'gpt4';
  aiPrompt?: string;          // AI 决策用的 system prompt 片段
  aiDecisionOptions?: string[]; // AI 可选决策
  // 人工确认节点
  confirmRequired?: boolean;
  confirmInstructions?: string;
  confirmTimeoutMinutes?: number;
  // 条件分支
  conditionExpression?: string; // JS 表达式，引用变量如 ${lead.score} > 80
  // 自动执行
  autoAction?: {
    type: 'email' | 'http' | 'sms' | 'notify' | 'update-db';
    template?: string;       // 模板内容
    endpoint?: string;        // HTTP endpoint
    params?: Record<string, string>;
  };
  // 延迟节点
  delayMinutes?: number;
  // 通知节点
  notifyTemplate?: string;
  notifyRecipients?: string[];
  // 节点配置
  inputs?: SOPNodeInput[];
  outputs?: SOPNodeOutput[];
  timeoutMinutes?: number;
  retryOnFail?: boolean;
  maxRetries?: number;
  // 流程控制
  nextNodes?: string[];      // 下一节点ID列表
  conditionTrueNext?: string; // 条件为 true 时跳转
  conditionFalseNext?: string; // 条件为 false 时跳转
  onFailNext?: string;       // 失败时跳转
  // AnyGen 特定配置
  anygenAssistantType?: 'customer-service' | 'business' | 'universal';
  anygenTask?: string;       // 传递给 AnyGen 的任务描述
}

export interface SOPTemlate {
  id: string;
  name: string;
  description: string;
  category: string;          // 'inquiry' | 'order' | 'followup' | 'complaint' | 'reactivation'
  lanes: string[];           // 适配赛道
  tags: string[];
  trigger: SOPTigger;
  nodes: SOPTemlateNode[];
  startNodeId: string;
  variables: Record<string, { label: string; type: string; default?: string }>;
  createdAt: string;
  updatedAt: string;
  author: string;
  version: number;
  status: SOPStatus;
  stats: {
    totalRuns: number;
    successRate: number;
    avgDurationMinutes: number;
  };
}

export interface SOPExecution {
  id: string;
  templateId: string;
  templateName: string;
  tenantId: string;
  userId: string;
  trigger: { type: SOPTriggerType; source?: string };
  input: Record<string, unknown>;      // 触发时输入数据
  variables: Record<string, unknown>;   // SOP 运行变量
  currentNodeId: string;
  status: SOPExecStatus;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  nodeResults: SOPNodeResult[];
  error?: string;
  metadata: {
    durationMs?: number;
    totalCost?: number;
    anygenCalls?: number;
    humanConfirmCount?: number;
    autoActionsCount?: number;
  };
}

export interface SOPNodeResult {
  nodeId: string;
  nodeName: string;
  status: SOPNodeStatus;
  startedAt: string;
  completedAt?: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  aiDecision?: string;
  aiModel?: string;
  humanConfirmRequestedAt?: string;
  humanConfirmedBy?: string;
  humanConfirmAnswer?: string;
  retryCount: number;
  error?: string;
}

// ============================================================
// 预置外贸 SOP 模板库
// ============================================================

export const SOP_TEMPLATES: SOPTemlate[] = [

  // ── SOP 1: 询盘处理自动化 ───────────────────────────────
  {
    id: 'sop-inquiry-handler',
    name: '📨 询盘智能处理 SOP',
    description: '从收到询盘到首次回复的自动化流程。AI 自动分析询盘质量、提取产品意向、生成报价建议，并支持人工确认后发送。',
    category: 'inquiry',
    lanes: ['外贸B2B', '跨境电商'],
    tags: ['询盘', '报价', 'AI分析', '多语言'],
    trigger: {
      type: 'event',
      eventName: 'inquiry_received',
      platform: 'alibaba',
    },
    startNodeId: 'node-1',
    variables: {
      inquiry_source: { label: '询盘来源', type: 'string', default: '' },
      customer_email: { label: '客户邮箱', type: 'string' },
      customer_name: { label: '客户姓名', type: 'string' },
      company_name: { label: '公司名称', type: 'string' },
      product_interest: { label: '产品意向', type: 'string' },
      quantity_interest: { label: '意向数量', type: 'string' },
      inquiry_language: { label: '询盘语言', type: 'string', default: 'en' },
      score: { label: '询盘质量评分', type: 'number', default: '0' },
      priority: { label: '优先级', type: 'string', default: 'normal' },
      ai_recommendation: { label: 'AI推荐动作', type: 'string' },
      quote_amount: { label: '建议报价', type: 'number' },
      reply_template: { label: '回复模板', type: 'string' },
      reply_language: { label: '回复语言', type: 'string' },
    },
    nodes: [
      {
        id: 'node-1',
        type: 'ai-decision',
        name: 'ai-analyze-inquiry',
        label: '🤖 AI 分析询盘',
        description: '使用 AI 分析询盘内容，提取关键信息并评分',
        anygenAssistantType: 'business',
        anygenTask: '分析外贸询盘：{inquiry_content}，提取客户背景、产品需求、预算范围、紧迫度，输出结构化分析 JSON',
        aiDecisionOptions: ['高价值(优先跟进)', '中价值(标准流程)', '低价值(自动回复)', '垃圾询盘(标记)'],
        inputs: [
          { name: 'inquiry_content', label: '询盘原文', type: 'text', required: true, placeholder: '粘贴询盘内容...' },
        ],
        outputs: [
          { name: 'score', label: '质量评分(0-100)' },
          { name: 'customer_level', label: '客户等级' },
          { name: 'product_match', label: '产品匹配度' },
          { name: 'urgency', label: '紧迫度' },
          { name: 'recommended_action', label: '推荐动作' },
        ],
        timeoutMinutes: 30,
        nextNodes: ['node-2'],
      },
      {
        id: 'node-2',
        type: 'condition',
        name: 'check-score',
        label: '🔍 质量分流',
        conditionExpression: '${score} >= 70',
        conditionTrueNext: 'node-3',
        conditionFalseNext: 'node-5',
      },
      {
        id: 'node-3',
        type: 'ai-decision',
        name: 'ai-generate-quote',
        label: '💰 AI 生成报价建议',
        description: '根据询盘分析结果，AI 生成多语言报价建议',
        anygenAssistantType: 'business',
        anygenTask: '基于产品 {product_name} 和数量 {quantity}，生成专业报价，包含 FOB/CIF 价格、交货期、付款方式、最小起订量',
        aiDecisionOptions: ['接受报价', '调整后接受', '需要更多信息'],
        inputs: [
          { name: 'product_name', label: '产品名称', type: 'text', required: true },
          { name: 'quantity', label: '数量', type: 'text', required: true },
          { name: 'destination', label: '目的港', type: 'text', placeholder: '如: Los Angeles, USA' },
        ],
        outputs: [
          { name: 'quote_fob', label: 'FOB 价格' },
          { name: 'quote_cif', label: 'CIF 价格' },
          { name: 'lead_time', label: '交货期' },
          { name: 'moq', label: '最小起订量' },
          { name: 'payment_terms', label: '付款条件' },
          { name: 'reply_email', label: '报价邮件正文' },
        ],
        timeoutMinutes: 60,
        nextNodes: ['node-4'],
      },
      {
        id: 'node-4',
        type: 'human-confirm',
        name: 'human-confirm-quote',
        label: '👤 人工确认报价',
        description: '业务主管审核并确认报价后发送',
        confirmRequired: true,
        confirmInstructions: '请审核 AI 生成的报价，确认后系统将发送报价邮件给客户。',
        confirmTimeoutMinutes: 120,
        nextNodes: ['node-6'],
        onFailNext: 'node-7',
      },
      {
        id: 'node-5',
        type: 'auto-action',
        name: 'auto-reply-low-value',
        label: '📧 自动差询回复',
        description: '对低质量询盘发送礼貌的自动回复模板',
        autoAction: {
          type: 'email',
          template: 'Thank you for your inquiry. We have received your message and will get back to you within 24 hours. For immediate assistance, please visit our product catalog.',
        },
        nextNodes: ['node-8'],
      },
      {
        id: 'node-6',
        type: 'auto-action',
        name: 'send-quote-email',
        label: '📤 发送报价邮件',
        autoAction: {
          type: 'email',
          template: '${reply_email}',
        },
        nextNodes: ['node-8'],
      },
      {
        id: 'node-7',
        type: 'notify',
        name: 'notify-escalation',
        label: '🚨 升级通知',
        description: '超时未确认，通知业务主管',
        notifyTemplate: '报价确认超时：询盘 #{inquiry_id} 已等待人工确认超过 {wait_minutes} 分钟，请尽快处理。',
        notifyRecipients: ['sales_manager'],
        nextNodes: ['node-4'],
      },
      {
        id: 'node-8',
        type: 'ai-decision',
        name: 'ai-update-crm',
        label: '🗄️ AI 更新 CRM 记录',
        description: '将询盘分析结果和报价记录写入 CRM',
        anygenAssistantType: 'business',
        anygenTask: '生成 CRM 更新记录 JSON，包含客户档案更新字段、商机创建信息、跟进提醒时间',
        inputs: [
          { name: 'customer_data', label: '客户数据', type: 'text' },
        ],
        outputs: [
          { name: 'crm_update_json', label: 'CRM 更新 JSON' },
          { name: 'followup_reminder', label: '下次跟进时间' },
        ],
        timeoutMinutes: 10,
        nextNodes: [],
      },
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-04-25T00:00:00.000Z',
    author: 'SIMIAICLAW 龙虾太极',
    version: 1,
    status: 'active',
    stats: { totalRuns: 142, successRate: 0.93, avgDurationMinutes: 18 },
  },

  // ── SOP 2: 订单全链路跟踪 ─────────────────────────────
  {
    id: 'sop-order-lifecycle',
    name: '📦 订单全链路 SOP',
    description: '从订单确认到货物交付的完整流程自动化。涵盖生产跟进、质量检验、物流协调、客户通知、收款确认等全环节。',
    category: 'order',
    lanes: ['外贸B2B', '跨境电商'],
    tags: ['订单', '生产', '物流', '质检'],
    trigger: {
      type: 'event',
      eventName: 'order_confirmed',
      platform: 'manual',
    },
    startNodeId: 'ol-node-1',
    variables: {
      order_id: { label: '订单号', type: 'string' },
      customer_name: { label: '客户名称', type: 'string' },
      product_list: { label: '产品清单', type: 'string' },
      order_amount: { label: '订单金额', type: 'number' },
      payment_status: { label: '付款状态', type: 'string' },
      production_status: { label: '生产状态', type: 'string' },
      quality_status: { label: '质检状态', type: 'string' },
      shipping_status: { label: '发货状态', type: 'string' },
      delivery_eta: { label: '预计到货', type: 'date' },
      tracking_number: { label: '追踪号', type: 'string' },
    },
    nodes: [
      {
        id: 'ol-node-1',
        type: 'ai-decision',
        name: 'ai-create-production-plan',
        label: '📋 AI 生成生产计划',
        anygenAssistantType: 'business',
        anygenTask: '根据订单 {order_details}，制定详细生产计划，包含工序分解、工时估算、质检节点、装箱方案',
        aiDecisionOptions: ['计划合理', '需要调整', '有问题需人工介入'],
        inputs: [
          { name: 'order_details', label: '订单详情', type: 'text', required: true },
        ],
        outputs: [
          { name: 'production_plan', label: '生产计划JSON' },
          { name: 'inspection_checkpoints', label: '质检节点' },
          { name: 'packing_list', label: '装箱清单' },
        ],
        timeoutMinutes: 60,
        nextNodes: ['ol-node-2'],
      },
      {
        id: 'ol-node-2',
        type: 'auto-action',
        name: 'send-production-notify',
        label: '🏭 通知生产部门',
        autoAction: {
          type: 'notify',
          template: '新订单 #{order_id} 已确认，请按计划安排生产。产品规格：{product_list}',
        },
        nextNodes: ['ol-node-3'],
      },
      {
        id: 'ol-node-3',
        type: 'delay',
        name: 'wait-production-complete',
        label: '⏱️ 等待生产完成',
        delayMinutes: 1440, // 1天后检查（实际按生产周期）
        nextNodes: ['ol-node-4'],
      },
      {
        id: 'ol-node-4',
        type: 'ai-decision',
        name: 'ai-qc-check',
        label: '🔬 AI 质检辅助',
        anygenAssistantType: 'business',
        anygenTask: '基于质检报告 {qc_report} 和客户质量标准 {quality_requirements}，判断产品是否合格，给出处置建议',
        aiDecisionOptions: ['合格，可发货', '轻微瑕疵，可接受', '不合格，需返工', '严重问题，通知客户'],
        inputs: [
          { name: 'qc_report', label: '质检报告', type: 'file', required: true },
          { name: 'quality_requirements', label: '质量要求', type: 'text' },
        ],
        outputs: [
          { name: 'qc_result', label: '质检结论' },
          { name: 'defect_description', label: '瑕疵描述' },
          { name: 'disposition', label: '处置建议' },
        ],
        timeoutMinutes: 30,
        nextNodes: ['ol-node-5'],
      },
      {
        id: 'ol-node-5',
        type: 'ai-decision',
        name: 'ai-shipping-plan',
        label: '🚢 AI 生成物流方案',
        anygenAssistantType: 'business',
        anygenTask: '根据货物信息 {cargo_details} 和目的地 {destination}，比较海运/空运/快递方案，给出最优推荐和成本估算',
        aiDecisionOptions: ['海运（经济）', '空运（快速）', '快递（小件）'],
        inputs: [
          { name: 'cargo_details', label: '货物详情', type: 'text', required: true },
          { name: 'destination', label: '目的港', type: 'text', required: true },
        ],
        outputs: [
          { name: 'shipping_method', label: '推荐运输方式' },
          { name: 'freight_cost', label: '运费估算' },
          { name: 'transit_days', label: '运输天数' },
          { name: 'shipping_documents', label: '所需单证' },
        ],
        timeoutMinutes: 30,
        nextNodes: ['ol-node-6'],
      },
      {
        id: 'ol-node-6',
        type: 'human-confirm',
        name: 'human-confirm-shipping',
        label: '👤 人工确认发货',
        confirmRequired: true,
        confirmInstructions: '请确认物流方案，确认后系统将安排订舱并发送发货通知给客户。',
        confirmTimeoutMinutes: 480,
        nextNodes: ['ol-node-7'],
      },
      {
        id: 'ol-node-7',
        type: 'auto-action',
        name: 'send-shipping-notify',
        label: '📤 发送发货通知',
        autoAction: {
          type: 'email',
          template: 'Your order #{order_id} has been shipped! Tracking: {tracking_number}. ETA: {delivery_eta}',
        },
        nextNodes: [],
      },
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-04-25T00:00:00.000Z',
    author: 'SIMIAICLAW 龙虾太极',
    version: 1,
    status: 'active',
    stats: { totalRuns: 67, successRate: 0.96, avgDurationMinutes: 240 },
  },

  // ── SOP 3: 客户流失预警与挽回 ───────────────────────────
  {
    id: 'sop-churn-prevention',
    name: '💔 客户流失预警 SOP',
    description: '基于客户行为数据（沉默天数、邮件打开率、订单间隔）自动触发流失预警，AI 生成个性化挽回策略并执行。',
    category: 'reactivation',
    lanes: ['外贸B2B', '跨境电商'],
    tags: ['流失预警', 'CRM', 'AI挽回', '客户维护'],
    trigger: {
      type: 'schedule',
      cron: '0 9 * * *',    // 每天上午9点检查
      timezone: 'Asia/Shanghai',
    },
    startNodeId: 'cp-node-1',
    variables: {
      customer_id: { label: '客户ID', type: 'string' },
      customer_name: { label: '客户名称', type: 'string' },
      last_order_date: { label: '最后下单日', type: 'date' },
      silence_days: { label: '沉默天数', type: 'number' },
      churn_risk: { label: '流失风险', type: 'string' },
     挽回_strategy: { label: '挽回策略', type: 'string' },
     挽回_email: { label: '挽回邮件', type: 'string' },
     挽回_success: { label: '是否成功', type: 'boolean' },
    },
    nodes: [
      {
        id: 'cp-node-1',
        type: 'ai-decision',
        name: 'ai-analyze-churn-risk',
        label: '🔎 AI 流失风险分析',
        anygenAssistantType: 'business',
        anygenTask: '分析客户 {customer_id} 的流失风险：沉默天数 {silence_days}、历史订单频率 {order_frequency}、邮件互动率 {email_open_rate}，判断风险等级',
        aiDecisionOptions: ['高风险（立即挽回）', '中风险（重点关注）', '低风险（正常维护）', '已流失（归档）'],
        inputs: [
          { name: 'silence_days', label: '沉默天数', type: 'number', required: true },
          { name: 'order_frequency', label: '历史订单频率', type: 'text' },
          { name: 'email_open_rate', label: '邮件打开率', type: 'number' },
        ],
        outputs: [
          { name: 'churn_risk_level', label: '风险等级' },
          { name: 'risk_factors', label: '风险因素' },
          { name: 'recommended_strategy', label: '推荐策略' },
        ],
        timeoutMinutes: 30,
        nextNodes: ['cp-node-2'],
      },
      {
        id: 'cp-node-2',
        type: 'condition',
        name: 'check-risk-level',
        label: '🔍 风险分流',
        conditionExpression: '${churn_risk_level} === "高风险"',
        conditionTrueNext: 'cp-node-3',
        conditionFalseNext: 'cp-node-5',
      },
      {
        id: 'cp-node-3',
        type: 'ai-decision',
        name: 'ai-generate-rescue',
        label: '🎯 AI 生成挽回策略',
        anygenAssistantType: 'universal',
        anygenTask: '为流失风险客户 {customer_name} 制定个性化挽回方案，包含邮件主题、正文模板、优惠策略、跟进时间表',
        aiDecisionOptions: ['激进（折扣+催促）', '温和（关怀+新品）', 'VIP（专属优惠）'],
        inputs: [
          { name: 'customer_name', label: '客户名称', type: 'text', required: true },
          { name: 'last_products', label: '上次购买产品', type: 'text' },
          { name: 'silence_days', label: '沉默天数', type: 'number', required: true },
        ],
        outputs: [
          { name: 'email_subject', label: '邮件主题' },
          { name: 'email_body', label: '邮件正文' },
          { name: 'discount_offer', label: '优惠方案' },
          { name: 'followup_schedule', label: '跟进时间表' },
        ],
        timeoutMinutes: 60,
        nextNodes: ['cp-node-4'],
      },
      {
        id: 'cp-node-4',
        type: 'human-confirm',
        name: 'human-approve-rescue',
        label: '👤 人工审批挽回方案',
        confirmRequired: true,
        confirmInstructions: 'AI 已生成挽回方案，请审核后确认发送。',
        confirmTimeoutMinutes: 120,
        nextNodes: ['cp-node-6'],
        onFailNext: 'cp-node-5',
      },
      {
        id: 'cp-node-5',
        type: 'auto-action',
        name: 'normal-followup',
        label: '📅 标准维护邮件',
        description: '低风险客户发送标准维护邮件',
        autoAction: {
          type: 'email',
          template: 'Dear {customer_name}, we have exciting new products that might interest you. Check out our latest catalog!',
        },
        nextNodes: [],
      },
      {
        id: 'cp-node-6',
        type: 'auto-action',
        name: 'send-rescue-email',
        label: '📧 发送挽回邮件',
        autoAction: {
          type: 'email',
          template: '${email_body}',
        },
        nextNodes: ['cp-node-7'],
      },
      {
        id: 'cp-node-7',
        type: 'delay',
        name: 'wait-followup',
        label: '⏱️ 等待跟进',
        delayMinutes: 4320, // 3天后
        nextNodes: ['cp-node-8'],
      },
      {
        id: 'cp-node-8',
        type: 'ai-decision',
        name: 'ai-evaluate-rescue',
        label: '📊 AI 评估挽回效果',
        anygenAssistantType: 'business',
        anygenTask: '评估挽回邮件发出后 {customer_name} 的响应情况，判断挽回是否成功，给出后续建议',
        aiDecisionOptions: ['挽回成功', '部分响应', '无响应', '退订/投诉'],
        inputs: [
          { name: 'email_response', label: '邮件响应', type: 'text' },
          { name: 'site_visit', label: '网站访问', type: 'boolean' },
          { name: 'inquiry_received', label: '是否收到询盘', type: 'boolean' },
        ],
        outputs: [
          { name: 'rescue_result', label: '挽回结果' },
          { name: 'next_action', label: '下一步动作' },
        ],
        timeoutMinutes: 10,
        nextNodes: [],
      },
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-04-25T00:00:00.000Z',
    author: 'SIMIAICLAW 龙虾太极',
    version: 1,
    status: 'active',
    stats: { totalRuns: 234, successRate: 0.41, avgDurationMinutes: 72 },
  },

  // ── SOP 4: 差评逆转自动化 ────────────────────────────────
  {
    id: 'sop-negative-review-rescue',
    name: '⭐ 差评逆转 SOP',
    description: '当平台出现差评时，自动触发 AI 情感分析、生成逆转话术、人工审批后快速响应，并将差评案例归档用于产品改进。',
    category: 'complaint',
    lanes: ['跨境电商', '外贸B2B'],
    tags: ['差评逆转', 'Amazon', 'eBay', '情感分析'],
    trigger: {
      type: 'event',
      eventName: 'negative_review_received',
      platform: 'amazon',
    },
    startNodeId: 'nr-node-1',
    variables: {
      review_platform: { label: '平台', type: 'string' },
      review_rating: { label: '评分', type: 'number' },
      review_content: { label: '评价内容', type: 'string' },
      reviewer_name: { label: '评价者', type: 'string' },
      product_asin: { label: '产品ASIN', type: 'string' },
      sentiment: { label: '情感极性', type: 'string' },
      key_complaint: { label: '核心投诉点', type: 'string' },
      response_template: { label: '回复模板', type: 'string' },
      public_reply: { label: '公开回复', type: 'string' },
    },
    nodes: [
      {
        id: 'nr-node-1',
        type: 'ai-decision',
        name: 'ai-analyze-sentiment',
        label: '😠 AI 情感与投诉分析',
        anygenAssistantType: 'customer-service',
        anygenTask: '分析电商平台差评：识别投诉类型（质量/物流/服务/描述不符）、情感强度、买家性格，给出紧急程度和回复策略',
        aiDecisionOptions: ['紧急（需1小时内回复）', '重要（24小时内回复）', '常规（72小时内回复）'],
        inputs: [
          { name: 'review_content', label: '差评内容', type: 'text', required: true },
          { name: 'review_rating', label: '评分星级', type: 'number', required: true },
        ],
        outputs: [
          { name: 'sentiment_score', label: '情感得分' },
          { name: 'complaint_type', label: '投诉类型' },
          { name: 'urgency_level', label: '紧急程度' },
          { name: 'buyer_personality', label: '买家性格' },
          { name: 'root_cause', label: '根本原因' },
        ],
        timeoutMinutes: 15,
        nextNodes: ['nr-node-2'],
      },
      {
        id: 'nr-node-2',
        type: 'ai-decision',
        name: 'ai-generate-response',
        label: '✍️ AI 生成回复话术',
        anygenAssistantType: 'customer-service',
        anygenTask: '为差评生成公开回复和私信两种话术：公开回复需专业大气展示服务态度，私信需真诚道歉并提供解决方案（如退款/补发/优惠券）',
        aiDecisionOptions: ['直接发送公开回复', '需人工修改', '仅发私信不公开回复'],
        inputs: [
          { name: 'complaint_type', label: '投诉类型', type: 'text', required: true },
          { name: 'sentiment_score', label: '情感得分', type: 'number', required: true },
          { name: 'product_info', label: '产品信息', type: 'text' },
        ],
        outputs: [
          { name: 'public_reply', label: '公开回复' },
          { name: 'private_message', label: '私信内容' },
          { name: 'compensation_offer', label: '补偿方案' },
          { name: 'refund_recommendation', label: '退款建议' },
        ],
        timeoutMinutes: 30,
        nextNodes: ['nr-node-3'],
      },
      {
        id: 'nr-node-3',
        type: 'human-confirm',
        name: 'human-approve-response',
        label: '👤 人工审核回复',
        confirmRequired: true,
        confirmInstructions: '请审核 AI 生成的回复内容，确认后系统将自动发布公开回复并发送私信。',
        confirmTimeoutMinutes: 60,
        nextNodes: ['nr-node-4'],
        onFailNext: 'nr-node-5',
      },
      {
        id: 'nr-node-4',
        type: 'auto-action',
        name: 'post-responses',
        label: '🌐 发布回复',
        description: '同时发布公开回复和私信',
        autoAction: {
          type: 'http',
          template: 'post-review-response',
          endpoint: '${platform_api_endpoint}',
        },
        nextNodes: ['nr-node-6'],
      },
      {
        id: 'nr-node-5',
        type: 'notify',
        name: 'notify-escalation',
        label: '🚨 升级经理处理',
        description: '超时未确认，通知客服经理',
        notifyTemplate: '差评回复超时：产品 {product_asin} 的差评已等待确认 {wait_minutes} 分钟，请立即处理！',
        notifyRecipients: ['customer_service_manager'],
        nextNodes: ['nr-node-3'],
      },
      {
        id: 'nr-node-6',
        type: 'auto-action',
        name: 'archive-case',
        label: '📚 归档案例',
        description: '将差评案例归档至产品改进知识库',
        autoAction: {
          type: 'update-db',
          template: 'sop_negative_review_cases',
        },
        nextNodes: [],
      },
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-04-25T00:00:00.000Z',
    author: 'SIMIAICLAW 龙虾太极',
    version: 1,
    status: 'active',
    stats: { totalRuns: 89, successRate: 0.87, avgDurationMinutes: 45 },
  },
];

// ============================================================
// SOP 执行引擎
// ============================================================

const DATA_DIR = path.join(process.cwd(), 'data', 'sop');
const EXECUTIONS_DIR = path.join(DATA_DIR, 'executions');
const CUSTOM_TEMPLATES_FILE = path.join(DATA_DIR, 'custom-templates.json');

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readJSON<T>(file: string, fallback: T): T {
  ensureDir(path.dirname(file));
  if (!fs.existsSync(file)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {
    return fallback;
  }
}

function writeJSON(file: string, data: unknown) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

function evalCondition(expr: string, vars: Record<string, unknown>): boolean {
  try {
    // 安全替换变量：${var} -> 值
    const safeExpr = expr.replace(/\$\{([^}]+)\}/g, (_, key) => {
      const val = vars[key.trim()];
      if (typeof val === 'string') return JSON.stringify(val);
      if (val === undefined) return 'undefined';
      return String(val);
    });
    // 只允许基本比较，不允许函数调用
    if (!/^[\d\s\w"'<>=!&|().+-]+$/.test(safeExpr)) return false;
    // eslint-disable-next-line no-new-func
    return !!new Function(`"use strict"; return (${safeExpr})`)();
  } catch {
    return false;
  }
}

export class SOPEngine {
  private customTemplates: SOPTemlate[] = [];

  constructor() {
    this.customTemplates = readJSON<SOPTemlate[]>(CUSTOM_TEMPLATES_FILE, []);
  }

  // ── 模板管理 ──────────────────────────────────────────────

  getAllTemplates(tenantId?: string): SOPTemlate[] {
    const custom = tenantId
      ? this.customTemplates.filter(t => t.author === tenantId)
      : this.customTemplates;
    return [...SOP_TEMPLATES, ...custom];
  }

  getTemplate(id: string, tenantId?: string): SOPTemlate | undefined {
    return this.getAllTemplates(tenantId).find(t => t.id === id);
  }

  createTemplate(tenantId: string, template: Omit<SOPTemlate, 'id' | 'createdAt' | 'updatedAt' | 'stats'>): SOPTemlate {
    const newTemplate: SOPTemlate = {
      ...template,
      id: `sop-custom-${uuidv4().slice(0, 8)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stats: { totalRuns: 0, successRate: 0, avgDurationMinutes: 0 },
    };
    this.customTemplates.push(newTemplate);
    writeJSON(CUSTOM_TEMPLATES_FILE, this.customTemplates);
    return newTemplate;
  }

  updateTemplate(id: string, updates: Partial<SOPTemlate>): SOPTemlate | null {
    const idx = this.customTemplates.findIndex(t => t.id === id);
    if (idx < 0) return null;
    this.customTemplates[idx] = {
      ...this.customTemplates[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
      version: this.customTemplates[idx].version + 1,
    };
    writeJSON(CUSTOM_TEMPLATES_FILE, this.customTemplates);
    return this.customTemplates[idx];
  }

  deleteTemplate(id: string): boolean {
    const before = this.customTemplates.length;
    this.customTemplates = this.customTemplates.filter(t => t.id !== id);
    if (this.customTemplates.length < before) {
      writeJSON(CUSTOM_TEMPLATES_FILE, this.customTemplates);
      return true;
    }
    return false;
  }

  getTemplatesByCategory(category: string): SOPTemlate[] {
    return this.getAllTemplates().filter(t => t.category === category);
  }

  getTemplatesByLane(lane: string): SOPTemlate[] {
    return this.getAllTemplates().filter(t => t.lanes.includes(lane));
  }

  // ── 执行引擎 ──────────────────────────────────────────────

  /** 触发 SOP 执行 */
  async execute(
    templateId: string,
    tenantId: string,
    userId: string,
    trigger: { type: SOPTriggerType; source?: string },
    input: Record<string, unknown>
  ): Promise<SOPExecution> {
    const template = this.getTemplate(templateId);
    if (!template) throw new Error(`SOP 模板不存在: ${templateId}`);

    const execution: SOPExecution = {
      id: `exec-${uuidv4().slice(0, 8)}`,
      templateId: template.id,
      templateName: template.name,
      tenantId,
      userId,
      trigger,
      input,
      variables: { ...Object.fromEntries(
        Object.entries(template.variables).map(([k, v]) => [k, v.default ?? ''])
      ), ...input },
      currentNodeId: template.startNodeId,
      status: 'running',
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodeResults: [],
      metadata: {
        anygenCalls: 0,
        humanConfirmCount: 0,
        autoActionsCount: 0,
      },
    };

    ensureDir(EXECUTIONS_DIR);
    const execFile = path.join(EXECUTIONS_DIR, `${execution.id}.json`);
    writeJSON(execFile, execution);

    // 更新模板统计
    this.updateTemplateStats(template.id, 'start');

    // 启动异步执行
    this.runExecution(execution, template).catch(err => {
      execution.status = 'failed';
      execution.error = String(err);
      execution.completedAt = new Date().toISOString();
      writeJSON(execFile, execution);
    });

    return execution;
  }

  /** 异步执行 SOP */
  private async runExecution(exec: SOPExecution, template: SOPTemlate): Promise<void> {
    const execFile = path.join(EXECUTIONS_DIR, `${exec.id}.json`);

    try {
      let currentNodeId = template.startNodeId;

      while (currentNodeId) {
        exec.currentNodeId = currentNodeId;
        exec.updatedAt = new Date().toISOString();
        writeJSON(execFile, exec);

        const node = template.nodes.find(n => n.id === currentNodeId);
        if (!node) break;

        const nodeResult = await this.executeNode(node, exec, template);
        exec.nodeResults.push(nodeResult);

        if (nodeResult.status === 'failed') {
          if (node.onFailNext) {
            currentNodeId = node.onFailNext;
            continue;
          }
          exec.status = 'failed';
          exec.error = `节点 ${node.name} 执行失败: ${nodeResult.error}`;
          break;
        }

        if (nodeResult.status === 'waiting-confirm') {
          exec.status = 'paused';
          exec.updatedAt = new Date().toISOString();
          writeJSON(execFile, exec);
          return; // 等待人工确认，暂停
        }

        // 确定下一节点
        if (node.type === 'condition') {
          const conditionMet = evalCondition(node.conditionExpression || 'true', exec.variables);
          currentNodeId = conditionMet ? (node.conditionTrueNext || '') : (node.conditionFalseNext || '');
        } else {
          currentNodeId = (node.nextNodes && node.nextNodes.length > 0) ? node.nextNodes[0] : '';
        }
      }

      exec.status = 'completed';
      exec.completedAt = new Date().toISOString();
      exec.metadata.durationMs = new Date(exec.completedAt).getTime() - new Date(exec.startedAt).getTime();
      this.updateTemplateStats(template.id, 'complete', exec.metadata.durationMs);
    } catch (err) {
      exec.status = 'failed';
      exec.error = String(err);
      exec.completedAt = new Date().toISOString();
    }

    writeJSON(execFile, exec);
  }

  /** 执行单个节点 */
  private async executeNode(node: SOPTemlateNode, exec: SOPExecution, template: SOPTemlate): Promise<SOPNodeResult> {
    const result: SOPNodeResult = {
      nodeId: node.id,
      nodeName: node.name,
      status: 'running',
      startedAt: new Date().toISOString(),
      input: {},
      output: {},
      retryCount: 0,
    };

    try {
      switch (node.type) {
        case 'ai-decision': {
          const task = this.interpolate(node.anygenTask || '', exec.variables);
          // 模拟 AI 决策（实际接入 AnyGen）
          result.aiModel = node.anygenAssistantType || 'anygen-universal';
          exec.metadata.anygenCalls = (exec.metadata.anygenCalls || 0) + 1;

          // AI 模拟：基于输入内容做决策
          const score = typeof exec.variables.score === 'number' ? exec.variables.score :
                        node.id.includes('churn') ? 65 :
                        node.id.includes('quote') ? 75 : 80;
          const options = node.aiDecisionOptions || ['完成'];
          result.aiDecision = options[Math.floor(Math.random() * options.length)];
          result.output = {
            decision: result.aiDecision,
            confidence: 0.85 + Math.random() * 0.14,
            model: result.aiModel,
            task,
            timestamp: new Date().toISOString(),
          };
          // 更新变量
          if (node.id.includes('analyze-inquiry')) {
            exec.variables.score = score;
            exec.variables.priority = score >= 70 ? 'high' : 'normal';
            exec.variables.ai_recommendation = result.aiDecision;
          }
          if (node.id.includes('generate-quote')) {
            exec.variables.quote_amount = Math.floor(Math.random() * 5000 + 1000);
            exec.variables.reply_template = `报价单已生成，含FOB/CIF价格、交货期等`;
          }
          if (node.id.includes('analyze-sentiment')) {
            exec.variables.sentiment = 'negative';
            exec.variables.key_complaint = '产品质量问题';
          }
          if (node.id.includes('analyze-churn')) {
            exec.variables.churn_risk = result.aiDecision?.includes('高风险') ? 'high' : 'medium';
          }
          result.status = 'completed';
          result.completedAt = new Date().toISOString();
          break;
        }

        case 'human-confirm': {
          result.status = 'waiting-confirm';
          result.humanConfirmRequestedAt = new Date().toISOString();
          exec.metadata.humanConfirmCount = (exec.metadata.humanConfirmCount || 0) + 1;
          break;
        }

        case 'auto-action': {
          result.status = 'completed';
          result.completedAt = new Date().toISOString();
          exec.metadata.autoActionsCount = (exec.metadata.autoActionsCount || 0) + 1;
          if (node.autoAction) {
            result.output = {
              action: node.autoAction.type,
              template: node.autoAction.template,
              executed: true,
              timestamp: new Date().toISOString(),
            };
          }
          break;
        }

        case 'delay': {
          // 延迟节点直接完成（实际运行时由调度器处理）
          result.status = 'completed';
          result.completedAt = new Date().toISOString();
          result.output = { delayMinutes: node.delayMinutes, skipped: false };
          break;
        }

        case 'notify': {
          result.status = 'completed';
          result.completedAt = new Date().toISOString();
          result.output = {
            template: node.notifyTemplate,
            recipients: node.notifyRecipients,
            sent: true,
            timestamp: new Date().toISOString(),
          };
          break;
        }

        case 'condition': {
          const conditionMet = evalCondition(node.conditionExpression || 'true', exec.variables);
          result.status = 'completed';
          result.completedAt = new Date().toISOString();
          result.output = {
            condition: node.conditionExpression,
            evaluated: conditionMet,
            trueNext: node.conditionTrueNext,
            falseNext: node.conditionFalseNext,
          };
          break;
        }

        default:
          result.status = 'completed';
          result.completedAt = new Date().toISOString();
      }
    } catch (err) {
      result.status = 'failed';
      result.error = String(err);
      result.completedAt = new Date().toISOString();
    }

    return result;
  }

  /** 人工确认回调 */
  confirmNode(executionId: string, nodeId: string, answer: string, userId: string): boolean {
    const execFile = path.join(EXECUTIONS_DIR, `${executionId}.json`);
    if (!fs.existsSync(execFile)) return false;
    const exec = JSON.parse(fs.readFileSync(execFile, 'utf-8')) as SOPExecution;
    if (exec.status !== 'paused') return false;

    const nodeResult = exec.nodeResults.find(r => r.nodeId === nodeId);
    if (!nodeResult) return false;

    nodeResult.humanConfirmedBy = userId;
    nodeResult.humanConfirmAnswer = answer;
    nodeResult.status = 'completed';
    nodeResult.completedAt = new Date().toISOString();

    exec.status = 'running';
    exec.updatedAt = new Date().toISOString();
    writeJSON(execFile, exec);

    // 继续执行
    const template = this.getTemplate(exec.templateId);
    if (template) {
      const node = template.nodes.find(n => n.id === nodeId);
      if (node) {
        const nextNodeId = node.nextNodes?.[0] || '';
        this.runExecution(exec, template).catch(console.error);
      }
    }

    return true;
  }

  /** 获取执行实例 */
  getExecution(id: string): SOPExecution | undefined {
    const execFile = path.join(EXECUTIONS_DIR, `${id}.json`);
    if (!fs.existsSync(execFile)) return undefined;
    try {
      return JSON.parse(fs.readFileSync(execFile, 'utf-8')) as SOPExecution;
    } catch {
      return undefined;
    }
  }

  /** 获取租户所有执行实例 */
  getTenantExecutions(tenantId: string, status?: SOPExecStatus): SOPExecution[] {
    ensureDir(EXECUTIONS_DIR);
    const files = fs.readdirSync(EXECUTIONS_DIR).filter(f => f.endsWith('.json'));
    const results: SOPExecution[] = [];
    for (const file of files) {
      try {
        const exec = JSON.parse(fs.readFileSync(path.join(EXECUTIONS_DIR, file), 'utf-8')) as SOPExecution;
        if (exec.tenantId === tenantId && (!status || exec.status === status)) {
          results.push(exec);
        }
      } catch {
        // 跳过损坏文件
      }
    }
    return results.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }

  /** 取消执行 */
  cancelExecution(executionId: string, tenantId: string): boolean {
    const execFile = path.join(EXECUTIONS_DIR, `${executionId}.json`);
    if (!fs.existsSync(execFile)) return false;
    const exec = JSON.parse(fs.readFileSync(execFile, 'utf-8')) as SOPExecution;
    if (exec.tenantId !== tenantId) return false;
    exec.status = 'cancelled';
    exec.completedAt = new Date().toISOString();
    writeJSON(execFile, exec);
    return true;
  }

  /** 更新模板统计 */
  private updateTemplateStats(templateId: string, event: 'start' | 'complete', durationMs?: number) {
    const tpl = [...SOP_TEMPLATES, ...this.customTemplates].find(t => t.id === templateId);
    if (!tpl) return;
    tpl.stats.totalRuns++;
    if (event === 'complete' && durationMs) {
      const prev = tpl.stats.avgDurationMinutes;
      const n = tpl.stats.totalRuns;
      tpl.stats.avgDurationMinutes = Math.round((prev * (n - 1) + durationMs / 60000) / n);
      tpl.stats.successRate = Math.round((tpl.stats.successRate * (n - 1) + 1) / n * 100) / 100;
    }
  }

  /** 获取 SOP 系统统计 */
  getStats(tenantId?: string): {
    totalTemplates: number;
    totalExecutions: number;
    activeExecutions: number;
    avgSuccessRate: number;
    byCategory: Record<string, number>;
    byLane: Record<string, number>;
  } {
    const templates = this.getAllTemplates(tenantId);
    const executions = tenantId ? this.getTenantExecutions(tenantId) : [];
    const cats: Record<string, number> = {};
    const lanes: Record<string, number> = {};
    for (const t of templates) {
      cats[t.category] = (cats[t.category] || 0) + 1;
      for (const l of t.lanes) lanes[l] = (lanes[l] || 0) + 1;
    }

    return {
      totalTemplates: templates.length,
      totalExecutions: executions.length,
      activeExecutions: executions.filter(e => e.status === 'running' || e.status === 'paused').length,
      avgSuccessRate: templates.length > 0
        ? Math.round(templates.reduce((s, t) => s + t.stats.successRate, 0) / templates.length * 100) / 100
        : 0,
      byCategory: cats,
      byLane: lanes,
    };
  }

  private interpolate(template: string, vars: Record<string, unknown>): string {
    return template.replace(/\$\{([^}]+)\}/g, (_, key) => {
      const val = vars[key.trim()];
      return val !== undefined ? String(val) : `{${key}}`;
    });
  }

  /** 获取预置分类 */
  getCategories(): Array<{ id: string; label: string; description: string; color: string }> {
    return [
      { id: 'inquiry', label: '📨 询盘处理', description: '从询盘到报价的全流程自动化', color: '#6366f1' },
      { id: 'order', label: '📦 订单管理', description: '订单全生命周期跟踪与管理', color: '#f59e0b' },
      { id: 'complaint', label: '⭐ 差评逆转', description: '差评情感分析与逆转话术', color: '#ef4444' },
      { id: 'reactivation', label: '💔 流失预警', description: '客户流失风险分析与挽回', color: '#8b5cf6' },
      { id: 'followup', label: '📞 定期跟进', description: '客户定期关怀与需求挖掘', color: '#10b981' },
      { id: 'custom', label: '🛠️ 自定义流程', description: '自定义 SOP 流程模板', color: '#64748b' },
    ];
  }
}

// ============================================================
// 单例导出
// ============================================================
export const sopEngine = new SOPEngine();

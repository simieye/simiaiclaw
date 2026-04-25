/**
 * SIMIAICLAW 智能体集群知识图谱可视化
 * 运行时可视化 · SkillHub/MCP/多智能体集群数据互通
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

// ══════════════════════════════════════════════════════════════
// 类型定义
// ══════════════════════════════════════════════════════════════

interface GraphNode {
  id: string;
  type: 'agent' | 'skill' | 'knowledge' | 'mcp' | 'model' | 'data';
  name: string;
  icon: string;
  color: string;
  bg: string;
  border: string;
  sub?: string;
  status?: 'active' | 'idle' | 'error' | 'connected';
  metrics?: { label: string; value: string; color: string };
  skills?: number;
  knowledge?: number;
  connections?: string[]; // 关联的节点ID
}

interface GraphEdge {
  source: string;
  target: string;
  type: 'uses' | 'trains' | 'connects' | 'routes' | 'feeds';
  label?: string;
  animated?: boolean;
}

interface RuntimeEvent {
  id: string;
  from: string;
  to: string;
  type: 'query' | 'response' | 'sync' | 'train';
  timestamp: number;
  message: string;
}

interface AgentRuntime {
  agentId: string;
  requests: number;
  tokens: number;
  latency: string;
  knowledgeHits: number;
}

// ══════════════════════════════════════════════════════════════
// 模拟数据
// ══════════════════════════════════════════════════════════════

const AGENT_NODES: GraphNode[] = [
  // 核心智能体集群
  { id: 'agent_main', type: 'agent', name: '龙虾集群主控', icon: '🦞', color: 'text-cyan-400', bg: 'bg-cyan-950/60', border: 'border-cyan-500/50', sub: '主控智能体集群', status: 'active', metrics: { label: 'QPS', value: '128', color: 'text-cyan-400' }, skills: 24, knowledge: 7 },
  { id: 'agent_fin', type: 'agent', name: '行业分析师', icon: '📊', color: 'text-amber-400', bg: 'bg-amber-950/60', border: 'border-amber-500/50', sub: '金融 · 投顾', status: 'active', metrics: { label: '日分析', value: '3,421', color: 'text-amber-400' }, skills: 18, knowledge: 4 },
  { id: 'agent_cs', type: 'agent', name: '龙虾客服助手', icon: '💬', color: 'text-emerald-400', bg: 'bg-emerald-950/60', border: 'border-emerald-500/50', sub: '多轮对话 · FAQ', status: 'active', metrics: { label: '日咨询', value: '8,930', color: 'text-emerald-400' }, skills: 12, knowledge: 3 },
  { id: 'agent_content', type: 'agent', name: '内容创作官', icon: '✍️', color: 'text-pink-400', bg: 'bg-pink-950/60', border: 'border-pink-500/50', sub: '文案 · 视频 · 多语言', status: 'idle', metrics: { label: '产出', value: '156篇/日', color: 'text-pink-400' }, skills: 15, knowledge: 2 },
  { id: 'agent_compliance', type: 'agent', name: '合规审核员', icon: '⚖️', color: 'text-violet-400', bg: 'bg-violet-950/60', border: 'border-violet-500/50', sub: '政策 · 合同 · 风控', status: 'active', metrics: { label: '审核', value: '2,104/日', color: 'text-violet-400' }, skills: 9, knowledge: 5 },
  { id: 'agent_ops', type: 'agent', name: '运营督导', icon: '📈', color: 'text-orange-400', bg: 'bg-orange-950/60', border: 'border-orange-500/50', sub: '数据 · 报表 · 预警', status: 'active', metrics: { label: '报表', value: '89份/日', color: 'text-orange-400' }, skills: 11, knowledge: 3 },
];

const SKILL_NODES: GraphNode[] = [
  // SkillHub 技能节点
  { id: 'skill_1', type: 'skill', name: '图像识别', icon: '🖼️', color: 'text-pink-400', bg: 'bg-pink-950/40', border: 'border-pink-800/30', sub: 'CV · OCR · 目标检测', skills: 1 },
  { id: 'skill_2', type: 'skill', name: 'PDF解析', icon: '📄', color: 'text-red-400', bg: 'bg-red-950/40', border: 'border-red-800/30', sub: '表格抽取 · 章节分割', skills: 1 },
  { id: 'skill_3', type: 'skill', name: '语音合成', icon: '🎙️', color: 'text-blue-400', bg: 'bg-blue-950/40', border: 'border-blue-800/30', sub: 'TTS · 多语言 · 情感', skills: 1 },
  { id: 'skill_4', type: 'skill', name: '数据可视化', icon: '📊', color: 'text-cyan-400', bg: 'bg-cyan-950/40', border: 'border-cyan-800/30', sub: '图表 · 报表生成', skills: 1 },
  { id: 'skill_5', type: 'skill', name: '网络搜索', icon: '🔍', color: 'text-emerald-400', bg: 'bg-emerald-950/40', border: 'border-emerald-800/30', sub: '实时信息 · RAG增强', skills: 1 },
  { id: 'skill_6', type: 'skill', name: '代码执行', icon: '⚡', color: 'text-yellow-400', bg: 'bg-yellow-950/40', border: 'border-yellow-800/30', sub: 'Python · JS · 沙箱', skills: 1 },
  { id: 'skill_7', type: 'skill', name: '翻译助手', icon: '🌐', color: 'text-indigo-400', bg: 'bg-indigo-950/40', border: 'border-indigo-800/30', sub: '28语言 · 术语库', skills: 1 },
  { id: 'skill_8', type: 'skill', name: '邮件处理', icon: '📧', color: 'text-slate-400', bg: 'bg-slate-800/40', border: 'border-slate-700/30', sub: 'IMAP/SMTP · 分类', skills: 1 },
];

const KNOWLEDGE_NODES: GraphNode[] = [
  { id: 'kb_1', type: 'knowledge', name: '产品知识库', icon: '📚', color: 'text-amber-400', bg: 'bg-amber-950/40', border: 'border-amber-800/30', sub: '128 个文档 · v2.1', knowledge: 1 },
  { id: 'kb_2', type: 'knowledge', name: '客服FAQ库', icon: '💬', color: 'text-emerald-400', bg: 'bg-emerald-950/40', border: 'border-emerald-800/30', sub: '1,200 条问答', knowledge: 1 },
  { id: 'kb_3', type: 'knowledge', name: '行业报告库', icon: '📰', color: 'text-blue-400', bg: 'bg-blue-950/40', border: 'border-blue-800/30', sub: '512 份报告', knowledge: 1 },
  { id: 'kb_4', type: 'knowledge', name: '合规知识库', icon: '⚖️', color: 'text-violet-400', bg: 'bg-violet-950/40', border: 'border-violet-800/30', sub: 'GDPR·HIPAA·网络安全', knowledge: 1 },
];

const MCP_NODES: GraphNode[] = [
  { id: 'mcp_1', type: 'mcp', name: 'Slack Connector', icon: '💬', color: 'text-purple-400', bg: 'bg-purple-950/40', border: 'border-purple-800/30', sub: '消息同步 · 频道管理' },
  { id: 'mcp_2', type: 'mcp', name: 'GitHub MCP', icon: '🐙', color: 'text-slate-300', bg: 'bg-slate-800/40', border: 'border-slate-700/30', sub: 'PR · Issue · Code Review' },
  { id: 'mcp_3', type: 'mcp', name: 'Notion MCP', icon: '📓', color: 'text-white', bg: 'bg-white/5', border: 'border-white/20', sub: '笔记同步 · 知识沉淀' },
  { id: 'mcp_4', type: 'mcp', name: '飞书 MCP', icon: '📱', color: 'text-blue-400', bg: 'bg-blue-950/40', border: 'border-blue-800/30', sub: '多维表格 · 审批流' },
  { id: 'mcp_5', type: 'mcp', name: '数据库 MCP', icon: '🗄️', color: 'text-cyan-400', bg: 'bg-cyan-950/40', border: 'border-cyan-800/30', sub: 'MySQL · PostgreSQL' },
];

const MODEL_NODES: GraphNode[] = [
  { id: 'model_1', type: 'model', name: 'Claude Sonnet 4', icon: '🤖', color: 'text-orange-400', bg: 'bg-orange-950/40', border: 'border-orange-800/30', sub: '主力推理 · 深度思考' },
  { id: 'model_2', type: 'model', name: 'DeepSeek V3', icon: '🧠', color: 'text-cyan-400', bg: 'bg-cyan-950/40', border: 'border-cyan-800/30', sub: '中文优化 · 高性价比' },
  { id: 'model_3', type: 'model', name: 'Hunyuan Pro', icon: '🌊', color: 'text-blue-400', bg: 'bg-blue-950/40', border: 'border-blue-800/30', sub: '多模态 · 腾讯生态' },
];

const DATA_NODES: GraphNode[] = [
  { id: 'data_1', type: 'data', name: 'ClawTip 训练池', icon: '🔥', color: 'text-red-400', bg: 'bg-red-950/40', border: 'border-red-800/30', sub: '2.8M 条交互数据' },
  { id: 'data_2', type: 'data', name: 'OpenSpace 自进化', icon: '🧬', color: 'text-emerald-400', bg: 'bg-emerald-950/40', border: 'border-emerald-800/30', sub: '1.2M 进化节点' },
  { id: 'data_3', type: 'data', name: '太极流路由', icon: '☯️', color: 'text-amber-400', bg: 'bg-amber-950/40', border: 'border-amber-800/30', sub: '智能路由 · 负载均衡' },
];

// 图谱边（连接关系）
const GRAPH_EDGES: GraphEdge[] = [
  // 主控 → 技能
  { source: 'agent_main', target: 'skill_1', type: 'uses', label: '视觉识别' },
  { source: 'agent_main', target: 'skill_5', type: 'uses', label: '实时检索' },
  { source: 'agent_main', target: 'skill_6', type: 'uses', label: '代码执行' },
  // 行业分析 → 技能/知识
  { source: 'agent_fin', target: 'skill_4', type: 'uses', label: '可视化' },
  { source: 'agent_fin', target: 'kb_3', type: 'trains', label: 'RAG' },
  { source: 'agent_fin', target: 'model_2', type: 'routes', label: '路由' },
  // 客服 → 技能/知识
  { source: 'agent_cs', target: 'skill_8', type: 'uses', label: '邮件' },
  { source: 'agent_cs', target: 'skill_7', type: 'uses', label: '翻译' },
  { source: 'agent_cs', target: 'kb_2', type: 'trains', label: 'RAG' },
  { source: 'agent_cs', target: 'mcp_1', type: 'connects', label: '同步' },
  // 内容创作 → 技能
  { source: 'agent_content', target: 'skill_1', type: 'uses', label: '图像' },
  { source: 'agent_content', target: 'skill_3', type: 'uses', label: '配音' },
  { source: 'agent_content', target: 'skill_7', type: 'uses', label: '翻译' },
  { source: 'agent_content', target: 'kb_1', type: 'trains', label: 'RAG' },
  // 合规审核 → MCP/知识
  { source: 'agent_compliance', target: 'kb_4', type: 'trains', label: '合规' },
  { source: 'agent_compliance', target: 'mcp_5', type: 'connects', label: '查询' },
  // 运营 → MCP
  { source: 'agent_ops', target: 'mcp_3', type: 'connects', label: '同步' },
  { source: 'agent_ops', target: 'mcp_4', type: 'connects', label: '飞书' },
  // 技能 → MCP
  { source: 'skill_5', target: 'mcp_2', type: 'feeds', label: '代码' },
  // 模型连接
  { source: 'model_1', target: 'data_1', type: 'feeds', label: '训练' },
  { source: 'model_2', target: 'data_2', type: 'feeds', label: '进化' },
  { source: 'model_3', target: 'data_3', type: 'routes', label: '路由' },
  // 主控连接各平台
  { source: 'agent_main', target: 'mcp_1', type: 'connects', animated: true },
  { source: 'agent_main', target: 'mcp_3', type: 'connects', animated: true },
  { source: 'agent_main', target: 'model_1', type: 'routes', animated: true },
  { source: 'agent_main', target: 'model_2', type: 'routes', animated: true },
  { source: 'agent_main', target: 'data_3', type: 'feeds', animated: true },
];

// 节点类型配置
const NODE_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  agent:    { label: '🦞 智能体集群', color: 'text-cyan-400' },
  skill:    { label: '⚡ 技能', color: 'text-yellow-400' },
  knowledge: { label: '📚 知识库', color: 'text-amber-400' },
  mcp:      { label: '🔌 MCP平台', color: 'text-purple-400' },
  model:    { label: '🧠 AI模型', color: 'text-orange-400' },
  data:     { label: '🔥 数据层', color: 'text-red-400' },
};

const EDGE_TYPE_CONFIG: Record<string, { label: string; color: string; dash?: string }> = {
  uses:     { label: '调用', color: '#06b6d4' },
  trains:   { label: '训练RAG', color: '#a855f7' },
  connects: { label: '连接', color: '#8b5cf6' },
  routes:   { label: '路由', color: '#f59e0b' },
  feeds:    { label: '数据流', color: '#ef4444' },
};

// 运行时事件模拟
const RUNTIME_EVENTS: RuntimeEvent[] = [
  { id: 'e1', from: 'agent_main', to: 'agent_cs', type: 'query', timestamp: Date.now(), message: '咨询产品功能' },
  { id: 'e2', from: 'agent_cs', to: 'kb_2', type: 'response', timestamp: Date.now(), message: '检索FAQ' },
  { id: 'e3', from: 'agent_main', to: 'model_1', type: 'sync', timestamp: Date.now(), message: '路由Claude' },
  { id: 'e4', from: 'agent_fin', to: 'kb_3', type: 'train', timestamp: Date.now(), message: '分析报告RAG' },
  { id: 'e5', from: 'agent_content', to: 'skill_3', type: 'query', timestamp: Date.now(), message: '生成配音' },
  { id: 'e6', from: 'agent_compliance', to: 'mcp_5', type: 'sync', timestamp: Date.now(), message: '合规查询' },
  { id: 'e7', from: 'agent_ops', to: 'mcp_4', type: 'response', timestamp: Date.now(), message: '推送报表' },
];

// ══════════════════════════════════════════════════════════════
// 节点位置计算（放射状布局）
// ══════════════════════════════════════════════════════════════

function computeNodePositions(centerX: number, centerY: number, radius: number, count: number, spreadAngle = 30) {
  const positions: Array<{ x: number; y: number; angle: number }> = [];
  for (let i = 0; i < count; i++) {
    const angle = ((i / count) * 360 - 90 + (Math.random() - 0.5) * spreadAngle) * (Math.PI / 180);
    const r = radius + (Math.random() - 0.5) * radius * 0.2;
    positions.push({
      x: centerX + Math.cos(angle) * r,
      y: centerY + Math.sin(angle) * r,
      angle,
    });
  }
  return positions;
}

// ══════════════════════════════════════════════════════════════
// 子组件：图谱节点
// ══════════════════════════════════════════════════════════════

function GraphNodeComponent({ node, x, y, selected, onClick, animating }: {
  node: GraphNode;
  x: number;
  y: number;
  selected: boolean;
  onClick: (id: string) => void;
  animating: boolean;
}) {
  const size = node.type === 'agent' ? 80 : node.type === 'model' ? 64 : 56;
  const isCenter = node.id === 'agent_main';
  const isActive = node.status === 'active';

  return (
    <div
      className={`absolute cursor-pointer transition-all duration-300 flex flex-col items-center ${isCenter ? 'z-20' : 'z-10'}`}
      style={{
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        transform: selected ? 'scale(1.15)' : 'scale(1)',
      }}
      onClick={() => onClick(node.id)}
    >
      {/* 节点主体 */}
      <div className={`relative flex flex-col items-center justify-center rounded-full border-2 ${node.border} ${node.bg} transition-all duration-200 ${
        selected ? 'shadow-2xl ring-2 ring-white/30' : 'hover:shadow-lg'
      }`}
        style={{ width: size, height: size }}
      >
        {/* 活跃脉冲 */}
        {isActive && (
          <div className="absolute inset-0 rounded-full animate-ping opacity-20"
            style={{ backgroundColor: node.color.replace('text-', '') }}
          />
        )}

        <span className="text-2xl leading-none">{node.icon}</span>

        {/* 状态指示 */}
        {node.status && (
          <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 ${
            node.status === 'active' ? 'bg-emerald-400 border-slate-900' :
            node.status === 'idle' ? 'bg-amber-400 border-slate-900' :
            'bg-red-400 border-slate-900'
          }`}
          />
        )}

        {/* 技能/知识数量角标 */}
        {(node.skills || node.knowledge) && (
          <div className="absolute -bottom-1 -right-1 min-w-[18px] h-[18px] bg-cyan-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {node.skills || node.knowledge}
          </div>
        )}

        {/* 中心节点特殊光晕 */}
        {isCenter && (
          <div className="absolute inset-[-4px] rounded-full border-2 border-cyan-400/30 animate-spin-slow"
            style={{ animationDuration: '8s' }}
          />
        )}
      </div>

      {/* 节点名称标签 */}
      <div className={`text-[10px] mt-1.5 text-center leading-tight max-w-[72px] truncate font-medium ${
        selected ? 'text-white' : 'text-slate-400'
      }`}>
        {node.name}
      </div>
      {node.metrics && (
        <div className={`text-[9px] font-bold ${node.metrics.color}`}>{node.metrics.value}</div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 子组件：图谱连线
// ══════════════════════════════════════════════════════════════

function GraphEdgeComponent({ edge, nodes, containerWidth, containerHeight }: {
  edge: GraphEdge;
  nodes: Map<string, { x: number; y: number }>;
  containerWidth: number;
  containerHeight: number;
}) {
  const sourcePos = nodes.get(edge.source);
  const targetPos = nodes.get(edge.target);
  if (!sourcePos || !targetPos) return null;

  const x1 = sourcePos.x, y1 = sourcePos.y;
  const x2 = targetPos.x, y2 = targetPos.y;

  // 计算贝塞尔控制点
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const cx = (x1 + x2) / 2 - dy * 0.1;
  const cy = (y1 + y2) / 2 + dx * 0.1;

  const cfg = EDGE_TYPE_CONFIG[edge.type];
  const isHighlighted = edge.animated;

  // 计算标签位置
  const labelX = (x1 + x2) / 2;
  const labelY = (y1 + y2) / 2 - 6;

  return (
    <g className="pointer-events-none">
      {/* 发光背景线 */}
      {isHighlighted && (
        <path
          d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`}
          stroke={cfg.color}
          strokeWidth={4}
          strokeOpacity={0.15}
          fill="none"
        />
      )}

      {/* 主连线 */}
      <path
        d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`}
        stroke={cfg.color}
        strokeWidth={isHighlighted ? 1.5 : 1}
        strokeOpacity={isHighlighted ? 0.8 : 0.4}
        strokeDasharray={edge.type === 'routes' ? '4 3' : edge.type === 'feeds' ? '6 2' : undefined}
        fill="none"
        className={edge.animated ? 'animate-flow' : ''}
      />

      {/* 流动粒子动画 */}
      {edge.animated && (
        <circle r="2.5" fill={cfg.color}>
          <animateMotion dur="3s" repeatCount="indefinite"
            path={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`}
          />
        </circle>
      )}

      {/* 边标签 */}
      {edge.label && !isHighlighted && (
        <g>
          <rect x={labelX - 14} y={labelY - 6} width={28} height={14} rx={3} fill="#0f172a" fillOpacity={0.8} />
          <text x={labelX} y={labelY} textAnchor="middle" dominantBaseline="middle"
            fill={cfg.color} fontSize="8" fontFamily="monospace">
            {edge.label}
          </text>
        </g>
      )}
    </g>
  );
}

// ══════════════════════════════════════════════════════════════
// 子组件：运行时事件流
// ══════════════════════════════════════════════════════════════

function RuntimeEventFeed({ events, nodes }: { events: RuntimeEvent[]; nodes: Map<string, { x: number; y: number }> }) {
  const [visible, setVisible] = useState<RuntimeEvent[]>([]);

  useEffect(() => {
    let idx = 0;
    const add = () => {
      const evt = RUNTIME_EVENTS[idx % RUNTIME_EVENTS.length];
      const clone: RuntimeEvent = { ...evt, id: `live_${Date.now()}_${idx}` };
      setVisible(prev => [...prev.slice(-6), clone]);
      idx++;
    };
    add();
    const t = setInterval(add, 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="space-y-1.5">
      {visible.map(evt => {
        const fromNode = [...AGENT_NODES, ...MCP_NODES, ...KNOWLEDGE_NODES, ...MODEL_NODES].find(n => n.id === evt.from);
        const toNode = [...AGENT_NODES, ...SKILL_NODES, ...KNOWLEDGE_NODES, ...MCP_NODES].find(n => n.id === evt.to);
        const cfg = (() => {
          const m: Record<string, { icon: string; color: string }> = {
            query: { icon: '❓', color: 'text-cyan-400' },
            response: { icon: '✅', color: 'text-emerald-400' },
            sync: { icon: '🔄', color: 'text-blue-400' },
            train: { icon: '🎯', color: 'text-purple-400' },
          };
          return m[evt.type] ?? { icon: '•', color: 'text-slate-400' };
        })();

        return (
          <div key={evt.id} className="flex items-center gap-2 text-xs bg-slate-800/60 rounded-lg px-3 py-2 border border-slate-700/30 animate-slideIn">
            <span className="text-base">{cfg.icon}</span>
            <div className="flex-1 min-w-0">
              <span className={fromNode?.color || 'text-slate-300'}>{fromNode?.icon} {fromNode?.name}</span>
              <span className="text-slate-500 mx-1">→</span>
              <span className={toNode?.color || 'text-slate-300'}>{toNode?.icon} {toNode?.name}</span>
            </div>
            <span className="text-slate-600 text-[10px] flex-shrink-0">{(evt.message)}</span>
          </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 子组件：节点详情面板
// ══════════════════════════════════════════════════════════════

function NodeDetailPanel({ node, onClose, edges }: {
  node: GraphNode | null;
  onClose: () => void;
  edges: GraphEdge[];
}) {
  if (!node) return null;

  const connectedEdges = edges.filter(e => e.source === node.id || e.target === node.id);
  const connectedNodeIds = connectedEdges.map(e => e.source === node.id ? e.target : e.source);
  const allNodes = [...AGENT_NODES, ...SKILL_NODES, ...KNOWLEDGE_NODES, ...MCP_NODES, ...MODEL_NODES, ...DATA_NODES];
  const connectedNodes = allNodes.filter(n => connectedNodeIds.includes(n.id));

  return (
    <div className="glass-card border border-cyan-500/30 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${node.bg} border ${node.border} flex items-center justify-center text-xl ${node.color}`}>
            {node.icon}
          </div>
          <div>
            <div className="text-sm font-semibold text-white">{node.name}</div>
            <div className="text-xs text-slate-400">{node.sub}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {node.status && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              node.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
              node.status === 'idle' ? 'bg-amber-500/20 text-amber-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              ● {node.status === 'active' ? '运行中' : node.status === 'idle' ? '空闲' : '异常'}
            </span>
          )}
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg">✕</button>
        </div>
      </div>

      {/* 指标 */}
      {node.metrics && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-800/60 rounded-lg p-2.5 text-center">
            <div className={`text-sm font-bold ${node.metrics.color}`}>{node.metrics.value}</div>
            <div className="text-[10px] text-slate-500">{node.metrics.label}</div>
          </div>
          {node.skills && (
            <div className="bg-slate-800/60 rounded-lg p-2.5 text-center">
              <div className="text-sm font-bold text-yellow-400">{node.skills}</div>
              <div className="text-[10px] text-slate-500">关联技能</div>
            </div>
          )}
          {node.knowledge !== undefined && node.knowledge > 0 && (
            <div className="bg-slate-800/60 rounded-lg p-2.5 text-center">
              <div className="text-sm font-bold text-amber-400">{node.knowledge}</div>
              <div className="text-[10px] text-slate-500">知识库</div>
            </div>
          )}
        </div>
      )}

      {/* 连接关系 */}
      <div>
        <div className="text-xs font-medium text-slate-400 mb-2">🔗 关联连接（{connectedNodes.length}）</div>
        <div className="space-y-1.5 max-h-32 overflow-y-auto">
          {connectedEdges.map((edge, i) => {
            const otherId = edge.source === node.id ? edge.target : edge.source;
            const other = allNodes.find(n => n.id === otherId);
            const cfg = EDGE_TYPE_CONFIG[edge.type];
            if (!other) return null;
            return (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                  edge.type === 'uses' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' :
                  edge.type === 'trains' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                  edge.type === 'connects' ? 'bg-violet-500/20 text-violet-400 border-violet-500/30' :
                  edge.type === 'routes' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                  'bg-red-500/20 text-red-400 border-red-500/30'
                }`}>
                  {cfg.label}
                </span>
                <span className={`${other.color}`}>{other.icon} {other.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 主组件
// ══════════════════════════════════════════════════════════════

export function AgentKnowledgeGraph() {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph');
  const [highlightAgent, setHighlightAgent] = useState<string>('agent_main');
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 900, height: 560 });

  // 运行时指标
  const [runtimeStats, setRuntimeStats] = useState<AgentRuntime[]>([
    { agentId: 'agent_main', requests: 2847, tokens: 128400, latency: '89ms', knowledgeHits: 312 },
    { agentId: 'agent_cs', requests: 8930, tokens: 45200, latency: '145ms', knowledgeHits: 1280 },
    { agentId: 'agent_fin', requests: 3421, tokens: 89000, latency: '234ms', knowledgeHits: 89 },
    { agentId: 'agent_content', requests: 1560, tokens: 234000, latency: '567ms', knowledgeHits: 45 },
    { agentId: 'agent_compliance', requests: 2104, tokens: 34500, latency: '198ms', knowledgeHits: 567 },
    { agentId: 'agent_ops', requests: 890, tokens: 12300, latency: '123ms', knowledgeHits: 234 },
  ]);

  // 动态更新运行时指标
  useEffect(() => {
    const t = setInterval(() => {
      setRuntimeStats(prev => prev.map(s => ({
        ...s,
        requests: s.requests + Math.floor(Math.random() * 20),
        tokens: s.tokens + Math.floor(Math.random() * 500),
        latency: `${80 + Math.floor(Math.random() * 100)}ms`,
      })));
    }, 3000);
    return () => clearInterval(t);
  }, []);

  // 容器尺寸
  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        setContainerSize({
          width: entry.contentRect.width || 900,
          height: entry.contentRect.height || 560,
        });
      }
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // 计算节点位置
  const centerX = containerSize.width / 2;
  const centerY = containerSize.height / 2;

  const allNodes = [...AGENT_NODES, ...SKILL_NODES, ...KNOWLEDGE_NODES, ...MCP_NODES, ...MODEL_NODES, ...DATA_NODES];
  const filteredNodes = filterType === 'all' ? allNodes : allNodes.filter(n => n.type === filterType || n.id === 'agent_main');

  // 为每个节点计算位置
  const nodePositions = useCallback(() => {
    const map = new Map<string, { x: number; y: number }>();

    // 中心节点固定
    const mainNode = allNodes.find(n => n.id === 'agent_main');
    if (mainNode) map.set('agent_main', { x: centerX, y: centerY });

    // 其余节点分组放射
    const groups: Array<{ nodes: GraphNode[]; radius: number; count: number }> = [
      { nodes: AGENT_NODES.filter(n => n.id !== 'agent_main'), radius: 140, count: 5 },
      { nodes: SKILL_NODES, radius: 220, count: 8 },
      { nodes: KNOWLEDGE_NODES, radius: 280, count: 4 },
      { nodes: MCP_NODES, radius: 330, count: 5 },
      { nodes: MODEL_NODES, radius: 370, count: 3 },
      { nodes: DATA_NODES, radius: 400, count: 3 },
    ];

    groups.forEach(({ nodes: groupNodes, radius, count }) => {
      const positions = computeNodePositions(centerX, centerY, radius, Math.max(groupNodes.length, count), 20);
      groupNodes.forEach((node, i) => {
        if (positions[i]) map.set(node.id, { x: positions[i].x, y: positions[i].y });
      });
    });

    return map;
  }, [centerX, centerY]);

  const positions = nodePositions();

  // 节点过滤显示
  const visibleNodes = filteredNodes.filter(n => positions.has(n.id));

  // SkillHub 总览
  const skillhubTotal = 84573;
  const connectedSkills = allNodes.reduce((sum, n) => sum + (n.skills || 0), 0);
  const mcpTotal = 47;
  const connectedMCP = MCP_NODES.length;

  return (
    <div className="space-y-5">
      {/* 标题栏 */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold taiji-gradient">🕸️ 智能体集群知识图谱</h2>
          <p className="text-sm text-slate-400 mt-1">运行时可视化 · SkillHub · MCP多平台 · 数据互通</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* 视图切换 */}
          <div className="flex gap-1 bg-slate-800/60 rounded-lg p-1 border border-slate-700/40">
            <button
              onClick={() => setViewMode('graph')}
              className={`px-3 py-1 rounded text-xs transition-colors ${viewMode === 'graph' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >🕸️ 图谱</button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded text-xs transition-colors ${viewMode === 'list' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >📋 列表</button>
          </div>
        </div>
      </div>

      {/* 全局统计 */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { icon: '🦞', label: '智能体集群', value: AGENT_NODES.length, color: 'text-cyan-400', bg: 'bg-cyan-950/40', border: 'border-cyan-800/40' },
          { icon: '⚡', label: '已用技能', value: `${connectedSkills}/${skillhubTotal}+`, color: 'text-yellow-400', bg: 'bg-yellow-950/40', border: 'border-yellow-800/40', sub: 'SkillHub全局' },
          { icon: '📚', label: '知识库', value: KNOWLEDGE_NODES.length, color: 'text-amber-400', bg: 'bg-amber-950/40', border: 'border-amber-800/40', sub: '文档向量库' },
          { icon: '🔌', label: 'MCP平台', value: `${connectedMCP}/${mcpTotal}`, color: 'text-purple-400', bg: 'bg-purple-950/40', border: 'border-purple-800/40', sub: '多平台连接' },
          { icon: '🔥', label: '日交互', value: runtimeStats.reduce((s, r) => s + r.requests, 0).toLocaleString(), color: 'text-red-400', bg: 'bg-red-950/40', border: 'border-red-800/40', sub: '实时更新' },
        ].map((stat, i) => (
          <div key={i} className={`glass-card p-3 border ${stat.border} ${stat.bg}`}>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-base">{stat.icon}</span>
              <span className={`text-xs font-medium ${stat.color}`}>{stat.label}</span>
            </div>
            <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
            {stat.sub && <div className="text-[10px] text-slate-500 mt-0.5">{stat.sub}</div>}
          </div>
        ))}
      </div>

      {/* 图谱主体 */}
      {viewMode === 'graph' ? (
        <div className="grid grid-cols-5 gap-4">
          {/* 图谱区域 */}
          <div className="col-span-3 glass-card border border-slate-700/50 rounded-2xl overflow-hidden">
            {/* 图谱过滤器 */}
            <div className="px-4 py-2.5 border-b border-slate-700/40 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500">节点筛选：</span>
              <button onClick={() => setFilterType('all')}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${filterType === 'all' ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400' : 'border-slate-700/50 text-slate-400 hover:border-slate-600'}`}>
                全部
              </button>
              {Object.entries(NODE_TYPE_CONFIG).map(([type, cfg]) => (
                <button key={type}
                  onClick={() => setFilterType(type)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${filterType === type ? 'border-cyan-500/50 bg-cyan-500/10' : 'border-slate-700/50 text-slate-400 hover:border-slate-600'} ${cfg.color}`}
                >
                  {cfg.label}
                </button>
              ))}
            </div>

            {/* 图谱画布 */}
            <div ref={containerRef} className="relative bg-slate-950/60" style={{ height: 500 }}>
              {/* SVG 连线层 */}
              <svg className="absolute inset-0 w-full h-full overflow-visible">
                <defs>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                    <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>

                {/* 网格背景 */}
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                </pattern>
                <rect width="100%" height="100%" fill="url(#grid)" />

                {/* 中心太极光晕 */}
                <circle cx={centerX} cy={centerY} r={60} fill="none" stroke="#06b6d4" strokeWidth="1" strokeOpacity={0.1} />
                <circle cx={centerX} cy={centerY} r={100} fill="none" stroke="#06b6d4" strokeWidth="0.5" strokeOpacity={0.05} />

                {/* 边 */}
                {GRAPH_EDGES.map((edge, i) => {
                  const sourcePos = positions.get(edge.source);
                  const targetPos = positions.get(edge.target);
                  if (!sourcePos || !targetPos) return null;
                  // 如果节点被过滤则不显示
                  if (!positions.has(edge.source) || !positions.has(edge.target)) return null;

                  const x1 = sourcePos.x, y1 = sourcePos.y;
                  const x2 = targetPos.x, y2 = targetPos.y;
                  const dx = x2 - x1, dy = y2 - y1;
                  const cx = (x1 + x2) / 2 - dy * 0.08;
                  const cy = (y1 + y2) / 2 + dx * 0.08;
                  const cfg = EDGE_TYPE_CONFIG[edge.type];
                  const isHighlighted = edge.animated;

                  return (
                    <g key={i}>
                      {isHighlighted && (
                        <path d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`}
                          stroke={cfg.color} strokeWidth={3} strokeOpacity={0.12} fill="none" />
                      )}
                      <path d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`}
                        stroke={cfg.color} strokeWidth={isHighlighted ? 1.2 : 0.8}
                        strokeOpacity={isHighlighted ? 0.7 : 0.3}
                        strokeDasharray={edge.type === 'routes' ? '4 3' : edge.type === 'feeds' ? '6 2' : undefined}
                        fill="none"
                      />
                      {isHighlighted && (
                        <circle r="2.5" fill={cfg.color} filter="url(#glow)">
                          <animateMotion dur={`${2 + Math.random() * 2}s`} repeatCount="indefinite"
                            path={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`} />
                        </circle>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* 节点层 */}
              {visibleNodes.map(node => {
                const pos = positions.get(node.id);
                if (!pos) return null;
                return (
                  <GraphNodeComponent
                    key={node.id}
                    node={node}
                    x={pos.x}
                    y={pos.y}
                    selected={selectedNode?.id === node.id}
                    onClick={id => setSelectedNode(prev => prev?.id === id ? null : visibleNodes.find(n => n.id === id) || null)}
                    animating={false}
                  />
                );
              })}

              {/* 图例 */}
              <div className="absolute bottom-3 left-3 flex flex-wrap gap-2 max-w-[400px]">
                {Object.entries(EDGE_TYPE_CONFIG).map(([type, cfg]) => (
                  <div key={type} className="flex items-center gap-1.5 text-[10px] text-slate-500">
                    <div className="w-4 h-px bg-current opacity-60" style={{ backgroundColor: cfg.color }} />
                    <span style={{ color: cfg.color }}>{cfg.label}</span>
                  </div>
                ))}
              </div>

              {/* 节点类型图例 */}
              <div className="absolute top-3 right-3 bg-slate-900/80 rounded-xl p-2.5 border border-slate-700/40 space-y-1">
                {Object.entries(NODE_TYPE_CONFIG).map(([type, cfg]) => (
                  <div key={type} className="flex items-center gap-1.5 text-[10px]">
                    <div className={`w-2 h-2 rounded-full ${type === 'agent' ? 'bg-cyan-500' : type === 'skill' ? 'bg-yellow-500' : type === 'knowledge' ? 'bg-amber-500' : type === 'mcp' ? 'bg-purple-500' : type === 'model' ? 'bg-orange-500' : 'bg-red-500'}`} />
                    <span className={cfg.color}>{cfg.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 右侧面板 */}
          <div className="col-span-2 space-y-4">
            {/* 节点详情 */}
            {selectedNode ? (
              <NodeDetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} edges={GRAPH_EDGES} />
            ) : (
              <div className="glass-card border border-slate-700/50 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-semibold text-slate-300">💡 点击图谱中的节点查看详情</h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(NODE_TYPE_CONFIG).map(([type, cfg]) => {
                    const count = allNodes.filter(n => n.type === type).length;
                    return (
                      <button key={type}
                        onClick={() => {
                          const first = allNodes.find(n => n.type === type);
                          if (first) setSelectedNode(first);
                        }}
                        className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/40 hover:border-slate-600/60 text-left transition-colors"
                      >
                        <div className={`text-xs font-bold ${cfg.color}`}>{count} {cfg.label}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">点击选择</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 运行时事件流 */}
            <div className="glass-card border border-slate-700/50 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  运行时事件流
                </h3>
                <span className="text-[10px] text-slate-500">实时</span>
              </div>
              <RuntimeEventFeed events={[]} nodes={positions} />
            </div>

            {/* 智能体集群运行时指标 */}
            <div className="glass-card border border-slate-700/50 rounded-2xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-slate-300">📊 运行时指标</h3>
              <div className="space-y-2">
                {runtimeStats.map(stat => {
                  const agent = AGENT_NODES.find(a => a.id === stat.agentId);
                  if (!agent) return null;
                  return (
                    <div key={stat.agentId} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className={`flex items-center gap-1 ${agent.color}`}>{agent.icon} {agent.name}</span>
                        <span className="text-slate-500">{stat.latency}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-800/80 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full transition-all ${agent.color.replace('text-', 'bg-')}`}
                            style={{ width: `${Math.min(100, (stat.requests / 10000) * 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 w-12 text-right">{stat.requests.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ===== 列表视图 ===== */
        <div className="space-y-5">
          {/* 智能体列表 */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              🦞 智能体集群节点（{AGENT_NODES.length}）
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {AGENT_NODES.map(agent => {
                const edges = GRAPH_EDGES.filter(e => e.source === agent.id || e.target === agent.id);
                const skills = SKILL_NODES.filter(s => edges.some(e => e.source === s.id || e.target === s.id));
                const kbs = KNOWLEDGE_NODES.filter(k => edges.some(e => e.source === k.id || e.target === k.id));
                const mcps = MCP_NODES.filter(m => edges.some(e => e.source === m.id || e.target === m.id));
                const rStat = runtimeStats.find(r => r.agentId === agent.id);

                return (
                  <div key={agent.id} className={`glass-card p-4 border ${agent.border} ${agent.bg} hover:shadow-lg transition-all cursor-pointer`}
                    onClick={() => setSelectedNode(agent)}>
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${agent.color}`}>{agent.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white">{agent.name}</div>
                        <div className="text-xs text-slate-500">{agent.sub}</div>
                      </div>
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${
                        agent.status === 'active' ? 'bg-emerald-400' : 'bg-amber-400'
                      }`} />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center">
                        <div className="text-yellow-400 font-bold">{skills.length}</div>
                        <div className="text-slate-500 text-[10px]">技能</div>
                      </div>
                      <div className="text-center">
                        <div className="text-amber-400 font-bold">{kbs.length}</div>
                        <div className="text-slate-500 text-[10px]">知识</div>
                      </div>
                      <div className="text-center">
                        <div className="text-purple-400 font-bold">{mcps.length}</div>
                        <div className="text-slate-500 text-[10px]">MCP</div>
                      </div>
                    </div>
                    {rStat && (
                      <div className="mt-2 pt-2 border-t border-slate-700/30 flex justify-between text-[10px] text-slate-500">
                        <span>{(rStat.requests).toLocaleString()} 次/日</span>
                        <span>{rStat.latency}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* SkillHub 全局连接 */}
          <div className="glass-card border border-yellow-800/30 bg-yellow-950/20 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-yellow-300">⚡ SkillHub 全局技能网络</h3>
              <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">84,573+ 技能</span>
            </div>
            <p className="text-xs text-slate-400">当前集群已接入 <span className="text-yellow-400 font-bold">{connectedSkills}</span> 个 SkillHub 技能，分布在 6 大类别，支持跨智能体复用。</p>
            <div className="grid grid-cols-6 gap-2">
              {[
                { cat: 'AI模型', count: 12400, color: 'bg-violet-500/20 text-violet-400' },
                { cat: '开发工具', count: 28300, color: 'bg-blue-500/20 text-blue-400' },
                { cat: '效率工具', count: 19800, color: 'bg-emerald-500/20 text-emerald-400' },
                { cat: '创意设计', count: 15200, color: 'bg-pink-500/20 text-pink-400' },
                { cat: '商业营销', count: 8500, color: 'bg-amber-500/20 text-amber-400' },
                { cat: '集成类', count: 1373, color: 'bg-cyan-500/20 text-cyan-400' },
              ].map(item => (
                <div key={item.cat} className={`text-center p-2 rounded-lg border ${item.color} border-current/20`}>
                  <div className="text-xs font-bold">{(item.count / 1000).toFixed(1)}k</div>
                  <div className="text-[10px] opacity-70">{item.cat}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="text-emerald-400">●</span>
              <span>已连接 {connectedSkills} 个</span>
              <span className="text-slate-600">·</span>
              <span className="text-yellow-400/70">支持跨智能体技能路由</span>
            </div>
          </div>

          {/* MCP 多平台矩阵 */}
          <div className="glass-card border border-purple-800/30 bg-purple-950/20 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-purple-300">🔌 MCP 多平台连接矩阵</h3>
              <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">47 个平台</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {[
                { name: 'Slack', icon: '💬', status: 'connected', color: 'text-purple-400' },
                { name: 'GitHub', icon: '🐙', status: 'connected', color: 'text-slate-300' },
                { name: 'Notion', icon: '📓', status: 'connected', color: 'text-white' },
                { name: '飞书', icon: '📱', status: 'connected', color: 'text-blue-400' },
                { name: 'MySQL', icon: '🗄️', status: 'connected', color: 'text-cyan-400' },
              ].map(platform => (
                <div key={platform.name} className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-3 text-center space-y-1">
                  <div className="text-xl">{platform.icon}</div>
                  <div className={`text-xs font-medium ${platform.color}`}>{platform.name}</div>
                  <div className="flex items-center justify-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                    <span className="text-[10px] text-emerald-400">已连接</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-xs text-slate-500">
              数据互通：MCP平台 → 智能体 → 知识库 → AI模型 → 数据层，全链路自动流转
            </div>
          </div>

          {/* 多智能体协作矩阵 */}
          <div className="glass-card border border-cyan-800/30 bg-cyan-950/20 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-cyan-300">🔄 多智能体协作数据流</h3>
            <div className="space-y-2">
              {[
                { flow: '用户咨询', agents: ['agent_main → agent_cs'], input: '自然语言', output: '精准回答' },
                { flow: '行业分析', agents: ['agent_main → agent_fin → model_2'], input: '数据请求', output: '分析报告' },
                { flow: '合规审核', agents: ['agent_main → agent_compliance → kb_4 → mcp_5'], input: '合同/文件', output: '合规报告' },
                { flow: '内容创作', agents: ['agent_main → agent_content → skill_3 → skill_7'], input: '创意指令', output: '多语言内容' },
              ].map((flow, i) => (
                <div key={i} className="flex items-center gap-3 text-xs bg-slate-800/40 rounded-xl px-4 py-2.5 border border-slate-700/30">
                  <div className="w-16 text-center">
                    <div className="text-cyan-400 font-medium">{flow.flow}</div>
                  </div>
                  <div className="flex-1 text-slate-400">{flow.agents}</div>
                  <div className="text-slate-500 text-[10px]">{flow.input} →</div>
                  <div className="text-emerald-400 text-[10px]">→ {flow.output}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slideIn { animation: slideIn 0.3s ease-out; }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
      `}</style>
    </div>
  );
}

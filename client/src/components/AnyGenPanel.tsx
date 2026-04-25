/**
 * AnyGenPanel — AnyGen.io 外贸助手集成面板
 * SIMIAICLAW 龙虾集群太极64卦系统
 *
 * 功能：
 * - 三大助手：客服助手 / 业务助手 / 全能助手
 * - SOP 自动化工作台（询盘处理 / 订单跟踪 / 流失预警 / 差评逆转）
 * - 对话历史管理
 * - AnyGen API 集成状态
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

// ── 类型定义 ───────────────────────────────────────────────

type AnyGenTab = 'assistants' | 'sop' | 'conversations' | 'settings';
type SOPTab = 'overview' | 'templates' | 'executions' | 'editor';
type ExecStatus = 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';

interface AnyGenAssistant {
  id: string;
  type: 'customer-service' | 'business' | 'universal';
  name: string;
  icon: string;
  tagline: string;
  description: string;
  capabilities: string[];
  useCases: string[];
  lanes: string[];
  color: string;
  bgGradient: string;
  status: 'online' | 'coming-soon';
  url: string;
}

interface AnyGenConversation {
  id: string;
  assistantType: string;
  title: string;
  messages: AnyGenMessage[];
  createdAt: string;
  updatedAt: string;
}

interface AnyGenMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

interface SOPTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  lanes: string[];
  tags: string[];
  startNodeId: string;
  nodes: SOPNode[];
  stats: { totalRuns: number; successRate: number; avgDurationMinutes: number };
  version: number;
  status: 'active' | 'paused' | 'archived';
}

interface SOPNode {
  id: string;
  type: 'ai-decision' | 'human-confirm' | 'auto-action' | 'delay' | 'notify' | 'condition';
  name: string;
  label: string;
  description?: string;
  anygenAssistantType?: string;
}

interface SOPExecution {
  id: string;
  templateId: string;
  templateName: string;
  status: ExecStatus;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  currentNodeId: string;
  nodeResults: SOPNodeResult[];
  metadata: { anygenCalls: number; humanConfirmCount: number; autoActionsCount: number; durationMs?: number };
  variables: Record<string, unknown>;
}

interface SOPNodeResult {
  nodeId: string;
  nodeName: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  aiDecision?: string;
  aiModel?: string;
  humanConfirmRequestedAt?: string;
  humanConfirmedBy?: string;
  humanConfirmAnswer?: string;
  output: Record<string, unknown>;
  error?: string;
}

interface SOPCategory {
  id: string;
  label: string;
  description: string;
  color: string;
}

// ── API ────────────────────────────────────────────────────

const API_BASE = '/api';

async function apiFetch(path: string, opts?: RequestInit): Promise<unknown> {
  const token = localStorage.getItem('accessToken');
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error((err as { error?: string }).error || `请求失败: ${res.status}`);
  }
  return res.json();
}

// ── 助手配置 ───────────────────────────────────────────────

const ASSISTANT_COLORS: Record<string, { gradient: string; light: string; ring: string }> = {
  'customer-service': { gradient: 'from-violet-600 to-indigo-600', light: 'bg-violet-500/10', ring: 'ring-violet-500' },
  'business': { gradient: 'from-amber-500 to-orange-500', light: 'bg-amber-500/10', ring: 'ring-amber-500' },
  'universal': { gradient: 'from-emerald-500 to-teal-500', light: 'bg-emerald-500/10', ring: 'ring-emerald-500' },
};

// ── 组件：助手卡片 ─────────────────────────────────────────

function AssistantCard({
  assistant,
  onSelect,
  onOpenBrowser,
}: {
  assistant: AnyGenAssistant;
  onSelect: (a: AnyGenAssistant) => void;
  onOpenBrowser: (a: AnyGenAssistant) => void;
}) {
  const colors = ASSISTANT_COLORS[assistant.type] || ASSISTANT_COLORS['universal'];

  return (
    <div
      className={`relative rounded-2xl bg-gradient-to-br ${colors.gradient} p-px cursor-pointer group hover:scale-[1.02] transition-transform`}
      onClick={() => onSelect(assistant)}
    >
      <div className="bg-slate-900 rounded-[15px] p-5 h-full">
        <div className="flex items-start justify-between mb-3">
          <div className="text-3xl">{assistant.icon}</div>
          <span className={`text-xs px-2 py-0.5 rounded-full ${colors.light} ${colors.ring} ring-1`}>
            {assistant.status === 'online' ? '● 在线' : '⏳ 即将上线'}
          </span>
        </div>

        <h3 className="font-bold text-white text-base mb-1">{assistant.name}</h3>
        <p className="text-white/60 text-xs mb-3">{assistant.tagline}</p>
        <p className="text-white/50 text-xs leading-relaxed mb-4 line-clamp-3">{assistant.description}</p>

        <div className="flex flex-wrap gap-1 mb-4">
          {assistant.capabilities.slice(0, 3).map(cap => (
            <span key={cap} className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/70">{cap}</span>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={e => { e.stopPropagation(); onSelect(assistant); }}
            className="flex-1 bg-white text-slate-900 font-semibold text-xs py-2 rounded-lg hover:bg-white/90 transition"
          >
            💬 开始对话
          </button>
          <button
            onClick={e => { e.stopPropagation(); onOpenBrowser(assistant); }}
            className="flex-1 bg-white/15 text-white text-xs py-2 rounded-lg hover:bg-white/25 transition border border-white/20"
          >
            🌐 浏览器
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 组件：对话面板 ─────────────────────────────────────────

function ChatPanel({
  assistant,
  conversation,
  onBack,
  onSendMessage,
  onSendLoading,
  onNewConversation,
}: {
  assistant: AnyGenAssistant;
  conversation: AnyGenConversation | null;
  onBack: () => void;
  onSendMessage: (content: string) => Promise<void>;
  onSendLoading: boolean;
  onNewConversation: () => void;
}) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages.length]);

  const handleSend = async () => {
    if (!input.trim() || onSendLoading) return;
    const text = input.trim();
    setInput('');
    await onSendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const colors = ASSISTANT_COLORS[assistant.type] || ASSISTANT_COLORS['universal'];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`flex items-center gap-3 px-4 py-3 bg-gradient-to-r ${colors.gradient} rounded-t-xl`}>
        <button onClick={onBack} className="text-white/80 hover:text-white text-sm">← 返回</button>
        <div className="text-xl">{assistant.icon}</div>
        <div>
          <div className="text-white font-semibold text-sm">{assistant.name}</div>
          <div className="text-white/60 text-xs">{assistant.tagline}</div>
        </div>
        <div className="ml-auto">
          <button onClick={onNewConversation} className="text-xs text-white/80 hover:text-white px-3 py-1 rounded-lg bg-white/15 hover:bg-white/25 transition">
            + 新对话
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950">
        {!conversation?.messages.length && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">{assistant.icon}</div>
            <h3 className="text-white font-semibold mb-1">{assistant.name}</h3>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">{assistant.description}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {assistant.capabilities.slice(0, 4).map(cap => (
                <span key={cap} className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-400">{cap}</span>
              ))}
            </div>
          </div>
        )}

        {conversation?.messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-indigo-600 text-white rounded-br-md'
                : msg.role === 'system'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs'
                : 'bg-slate-800 text-slate-200 rounded-bl-md'
            }`}>
              <div className="whitespace-pre-wrap">{msg.content}</div>
              <div className={`text-xs mt-1 ${msg.role === 'user' ? 'text-indigo-200' : 'text-slate-600'}`}>
                {new Date(msg.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {onSendLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/50">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`向 ${assistant.name} 提问... (Enter 发送，Shift+Enter 换行)`}
            rows={2}
            className="flex-1 bg-slate-800 text-white text-sm rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-600"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || onSendLoading}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl text-sm font-medium transition"
          >
            {onSendLoading ? '...' : '发送'}
          </button>
        </div>
        <div className="flex gap-4 mt-2 px-1">
          <span className="text-xs text-slate-600">💡 支持语音输入 · 多语言翻译 · 图片上传</span>
        </div>
      </div>
    </div>
  );
}

// ── 组件：SOP 模板卡片 ─────────────────────────────────────

function SOPTemplateCard({
  template,
  onExecute,
  onView,
}: {
  template: SOPTemplate;
  onExecute: (t: SOPTemplate) => void;
  onView: (t: SOPTemplate) => void;
}) {
  const catColors: Record<string, string> = {
    inquiry: 'text-indigo-400 bg-indigo-500/10',
    order: 'text-amber-400 bg-amber-500/10',
    complaint: 'text-red-400 bg-red-500/10',
    reactivation: 'text-purple-400 bg-purple-500/10',
    followup: 'text-emerald-400 bg-emerald-500/10',
    custom: 'text-slate-400 bg-slate-500/10',
  };
  const catColor = catColors[template.category] || catColors['custom'];

  const statusColors: Record<string, string> = {
    active: 'text-emerald-400',
    paused: 'text-amber-400',
    archived: 'text-slate-500',
  };

  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 hover:border-indigo-500/40 transition">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full ${catColor}`}>
            {template.category}
          </span>
          <span className={`text-xs ${statusColors[template.status] || 'text-slate-400'}`}>
            {template.status === 'active' ? '● 运行中' : template.status === 'paused' ? '⏸ 已暂停' : '📁 已归档'}
          </span>
        </div>
        <div className="text-xs text-slate-600">v{template.version}</div>
      </div>

      <h4 className="font-semibold text-white text-sm mb-1">{template.name}</h4>
      <p className="text-slate-500 text-xs mb-3 line-clamp-2">{template.description}</p>

      <div className="flex flex-wrap gap-1 mb-3">
        {template.tags.slice(0, 3).map(tag => (
          <span key={tag} className="text-xs px-2 py-0.5 rounded bg-slate-700/50 text-slate-400">{tag}</span>
        ))}
      </div>

      <div className="flex items-center gap-4 mb-3 text-xs text-slate-500">
        <span>📊 {template.stats.totalRuns} 次执行</span>
        <span>✅ {Math.round(template.stats.successRate * 100)}% 成功率</span>
        <span>⏱️ 平均{template.stats.avgDurationMinutes}分钟</span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onExecute(template)}
          className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-2 rounded-lg transition font-medium"
        >
          ▶ 执行 SOP
        </button>
        <button
          onClick={() => onView(template)}
          className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs py-2 rounded-lg transition"
        >
          📋 查看详情
        </button>
      </div>
    </div>
  );
}

// ── 组件：SOP 执行历史卡片 ──────────────────────────────────

function ExecutionCard({ exec, onConfirm, onView }: {
  exec: SOPExecution;
  onConfirm: (e: SOPExecution) => void;
  onView: (e: SOPExecution) => void;
}) {
  const statusConfig: Record<ExecStatus, { label: string; color: string; bg: string }> = {
    running: { label: '🔄 运行中', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    paused: { label: '⏸ 待确认', color: 'text-amber-400', bg: 'bg-amber-500/10' },
    completed: { label: '✅ 已完成', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    failed: { label: '❌ 失败', color: 'text-red-400', bg: 'bg-red-500/10' },
    cancelled: { label: '🚫 已取消', color: 'text-slate-400', bg: 'bg-slate-500/10' },
  };
  const cfg = statusConfig[exec.status] || statusConfig['failed'];

  const pendingConfirm = exec.nodeResults.find(r => r.status === 'waiting-confirm');

  return (
    <div className={`bg-slate-800/60 border rounded-xl p-4 ${exec.status === 'paused' ? 'border-amber-500/40' : 'border-slate-700/50'}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="text-white text-sm font-medium">{exec.templateName}</h4>
          <div className="text-xs text-slate-500 mt-0.5">
            {new Date(exec.startedAt).toLocaleString('zh-CN')}
            {exec.metadata.durationMs && ` · ${Math.round(exec.metadata.durationMs / 60000)}分钟`}
          </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
      </div>

      {pendingConfirm && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-3">
          <div className="text-amber-400 text-xs font-medium mb-1">⏳ 需要人工确认</div>
          <div className="text-slate-400 text-xs">{pendingConfirm.nodeName} 等待您的审批</div>
          <button
            onClick={() => onConfirm(exec)}
            className="mt-2 bg-amber-600 hover:bg-amber-500 text-white text-xs px-3 py-1.5 rounded-lg transition"
          >
            去确认
          </button>
        </div>
      )}

      <div className="flex items-center gap-3 mb-3 text-xs text-slate-500">
        <span>🤖 {exec.metadata.anygenCalls || 0} 次AI调用</span>
        <span>✅ {exec.metadata.autoActionsCount || 0} 次自动执行</span>
        <span>👤 {exec.metadata.humanConfirmCount || 0} 次人工确认</span>
      </div>

      <div className="flex gap-2">
        {exec.status === 'paused' && pendingConfirm && (
          <button
            onClick={() => onConfirm(exec)}
            className="flex-1 bg-amber-600 hover:bg-amber-500 text-white text-xs py-2 rounded-lg transition"
          >
            ✅ 审批确认
          </button>
        )}
        <button
          onClick={() => onView(exec)}
          className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs py-2 rounded-lg transition"
        >
          📊 查看详情
        </button>
      </div>
    </div>
  );
}

// ── 主组件 ─────────────────────────────────────────────────

export function AnyGenPanel() {
  const [activeTab, setActiveTab] = useState<AnyGenTab>('assistants');
  const [sopTab, setSopTab] = useState<SOPTab>('overview');
  const [assistants, setAssistants] = useState<AnyGenAssistant[]>([]);
  const [selectedAssistant, setSelectedAssistant] = useState<AnyGenAssistant | null>(null);
  const [activeConversation, setActiveConversation] = useState<AnyGenConversation | null>(null);
  const [chatLoading, setChatLoading] = useState(false);

  // SOP 状态
  const [sopTemplates, setSopTemplates] = useState<SOPTemplate[]>([]);
  const [sopCategories, setSopCategories] = useState<SOPCategory[]>([]);
  const [sopExecutions, setSopExecutions] = useState<SOPExecution[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<SOPTemplate | null>(null);
  const [selectedExecution, setSelectedExecution] = useState<SOPExecution | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sopSearch, setSopSearch] = useState('');
  const [sopLoading, setSopLoading] = useState(false);
  const [execDetailOpen, setExecDetailOpen] = useState(false);

  // 加载助手列表
  useEffect(() => {
    apiFetch('/anygen/assistants').then((data: unknown) => {
      const res = data as { assistants: AnyGenAssistant[] };
      setAssistants(res.assistants || []);
    }).catch(() => {
      // 使用内置数据
      setAssistants([]);
    });
  }, []);

  // 加载 SOP 数据
  const loadSOPData = useCallback(async () => {
    setSopLoading(true);
    try {
      const [catsRes, tplsRes, execsRes] = await Promise.all([
        apiFetch('/anygen/sop/categories').catch(() => ({ categories: [] })),
        apiFetch(`/anygen/sop/templates${selectedCategory !== 'all' ? `?category=${selectedCategory}` : ''}`).catch(() => ({ templates: [] })),
        apiFetch('/anygen/sop/executions').catch(() => ({ executions: [] })),
      ]);
      setSopCategories((catsRes as { categories: SOPCategory[] }).categories || []);
      setSopTemplates((tplsRes as { templates: SOPTemplate[] }).templates || []);
      setSopExecutions((execsRes as { executions: SOPExecution[] }).executions || []);
    } catch (err) {
      console.error('[SOP] load error:', err);
    }
    setSopLoading(false);
  }, [selectedCategory]);

  useEffect(() => {
    if (activeTab === 'sop') loadSOPData();
  }, [activeTab, loadSOPData]);

  // 发送消息
  const handleSendMessage = async (content: string) => {
    if (!selectedAssistant) return;
    setChatLoading(true);
    try {
      let conversation = activeConversation;
      if (!conversation) {
        const createRes = await apiFetch('/anygen/conversations', {
          method: 'POST',
          body: JSON.stringify({ type: selectedAssistant.type, title: content.slice(0, 50) }),
        }) as { conversation: AnyGenConversation };
        conversation = createRes.conversation;
        setActiveConversation(conversation);
      }
      const res = await apiFetch(`/anygen/conversations/${conversation.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }) as { conversation: AnyGenConversation };
      setActiveConversation(res.conversation);
    } catch (err) {
      toast.error(`发送失败: ${err}`);
    }
    setChatLoading(false);
  };

  // 执行 SOP
  const handleExecuteSOP = async (template: SOPTemplate) => {
    setSopLoading(true);
    try {
      const res = await apiFetch('/anygen/sop/execute', {
        method: 'POST',
        body: JSON.stringify({ templateId: template.id, trigger: { type: 'manual' } }),
      }) as { execution: SOPExecution };
      toast.success(`SOP「${template.name}」已启动！`);
      setSopExecutions(prev => [res.execution, ...prev]);
      setSelectedExecution(res.execution);
      setExecDetailOpen(true);
      setSopTab('executions');
    } catch (err) {
      toast.error(`执行失败: ${err}`);
    }
    setSopLoading(false);
  };

  // SOP 人工确认
  const handleConfirmNode = async (exec: SOPExecution) => {
    const node = exec.nodeResults.find(r => r.status === 'waiting-confirm');
    if (!node) return;
    const answer = prompt(`请确认「${node.nodeName}」的操作结果（直接确认请输入"确认"）:`);
    if (!answer) return;
    try {
      await apiFetch(`/anygen/sop/executions/${exec.id}/confirm`, {
        method: 'POST',
        body: JSON.stringify({ nodeId: node.nodeId, answer }),
      });
      toast.success('确认已提交，SOP 继续执行');
      loadSOPData();
    } catch (err) {
      toast.error(`确认失败: ${err}`);
    }
  };

  // 打开 AnyGen 浏览器
  const handleOpenBrowser = (assistant: AnyGenAssistant) => {
    const inviteCode = '龙虾太极';
    window.open(`${assistant.url}&invite=${encodeURIComponent(inviteCode)}`, '_blank');
  };

  // 过滤 SOP 模板
  const filteredTemplates = sopTemplates.filter(t => {
    if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
    if (sopSearch) {
      const q = sopSearch.toLowerCase();
      return t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.tags.some(tag => tag.toLowerCase().includes(q));
    }
    return true;
  });

  const tabItems: { id: AnyGenTab; label: string; icon: string }[] = [
    { id: 'assistants', label: '助手', icon: '🤖' },
    { id: 'sop', label: 'SOP 自动化', icon: '⚡' },
    { id: 'conversations', label: '对话历史', icon: '💬' },
    { id: 'settings', label: '设置', icon: '⚙️' },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white rounded-xl overflow-hidden">

      {/* 顶部导航 */}
      <div className="flex items-center px-4 py-3 border-b border-slate-800 bg-slate-900/80 gap-1">
        {tabItems.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white font-medium'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
        <div className="ml-auto text-xs text-slate-600">
          AnyGen.io × SIMIAICLAW 龙虾太极
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-hidden">

        {/* ── 助手面板 ── */}
        {activeTab === 'assistants' && (
          selectedAssistant ? (
            <div className="h-full flex flex-col">
              <ChatPanel
                assistant={selectedAssistant}
                conversation={activeConversation}
                onBack={() => { setSelectedAssistant(null); setActiveConversation(null); }}
                onSendMessage={handleSendMessage}
                onSendLoading={chatLoading}
                onNewConversation={() => setActiveConversation(null)}
              />
            </div>
          ) : (
            <div className="p-6 overflow-y-auto h-full">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-1">AnyGen 外贸助手</h2>
                <p className="text-slate-500 text-sm">字节跳动 AI 智能体 · 三种专业角色 · 全外贸流程覆盖</p>
              </div>

              {assistants.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { type: 'customer-service', icon: '🎧', name: '客服助手', tagline: '7×24 智能客服 · 多语言即时响应',
                      description: '自动处理客户咨询、FAQ 生成、情感分析、差评逆转、投诉分类。多语言支持：英/德/法/西/葡/日/韩',
                      capabilities: ['智能意图识别', '多语言翻译', 'FAQ 自动生成', '差评逆转话术'],
                      color: '#6366f1', bgGradient: 'from-violet-600 to-indigo-600', status: 'online' as const, url: 'https://www.anygen.io/assistant?mode=customer-service', lanes: ['跨境电商'], id: 'cs' },
                    { type: 'business', icon: '💼', name: '业务助手', tagline: '外贸B2B全链路 · 询盘到订单',
                      description: '覆盖外贸全流程：询盘分析、报价生成、合同起草、客户背调、订单跟进、物流协调、风险预警',
                      capabilities: ['询盘智能分析', '报价单生成', '合同风险审查', '物流方案对比'],
                      color: '#f59e0b', bgGradient: 'from-amber-500 to-orange-500', status: 'online' as const, url: 'https://www.anygen.io/assistant?mode=business', lanes: ['外贸B2B'], id: 'biz' },
                    { type: 'universal', icon: '🧠', name: '全能助手', tagline: '复杂任务规划 · 多步骤自主执行',
                      description: 'AnyGen 全能型智能体，处理跨领域复杂任务。规划→执行→交付，端到端自动化。文档、PPT、报告全覆盖',
                      capabilities: ['任务自动规划', 'PPT/Word 生成', '语音交互', '图片多模态理解'],
                      color: '#10b981', bgGradient: 'from-emerald-500 to-teal-500', status: 'online' as const, url: 'https://www.anygen.io/assistant?mode=universal', lanes: ['跨境电商', '外贸B2B'], id: 'uni' },
                  ].map(a => (
                    <AssistantCard
                      key={a.id}
                      assistant={a as AnyGenAssistant}
                      onSelect={setSelectedAssistant}
                      onOpenBrowser={handleOpenBrowser}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {assistants.map(a => (
                    <AssistantCard
                      key={a.id}
                      assistant={a}
                      onSelect={setSelectedAssistant}
                      onOpenBrowser={handleOpenBrowser}
                    />
                  ))}
                </div>
              )}

              <div className="mt-6 bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                <h3 className="text-white font-medium text-sm mb-3">📌 快速开始</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-400">
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <div className="text-amber-400 font-medium mb-1">💬 开始对话</div>
                    <div>选择上方助手类型，直接在浏览器中与 AI 对话</div>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <div className="text-indigo-400 font-medium mb-1">⚡ SOP 自动化</div>
                    <div>在 SOP 自动化面板配置询盘处理、订单跟踪等流程</div>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <div className="text-emerald-400 font-medium mb-1">🌐 浏览器模式</div>
                    <div>点击「浏览器」在新窗口打开 AnyGen 完整界面</div>
                  </div>
                </div>
              </div>
            </div>
          )
        )}

        {/* ── SOP 自动化 ── */}
        {activeTab === 'sop' && (
          <div className="h-full overflow-y-auto">
            {/* SOP 子导航 */}
            <div className="sticky top-0 z-10 bg-slate-950/95 border-b border-slate-800 px-4 py-2 flex items-center gap-2">
              {(['overview', 'templates', 'executions'] as SOPTab[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setSopTab(tab)}
                  className={`text-xs px-3 py-1.5 rounded-lg transition ${
                    sopTab === tab ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {tab === 'overview' ? '📊 总览' : tab === 'templates' ? '📋 模板库' : '▶ 执行记录'}
                </button>
              ))}
              <div className="ml-auto flex items-center gap-2">
                <input
                  value={sopSearch}
                  onChange={e => setSopSearch(e.target.value)}
                  placeholder="搜索 SOP..."
                  className="bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-600 w-48"
                />
                <button onClick={loadSOPData} className="text-xs text-slate-400 hover:text-white px-2">🔄</button>
              </div>
            </div>

            <div className="p-4">
              {/* 总览 */}
              {sopTab === 'overview' && (
                <div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                      { label: 'SOP 模板', value: sopTemplates.length, icon: '📋', color: 'text-indigo-400' },
                      { label: '执行总数', value: sopExecutions.length, icon: '▶', color: 'text-blue-400' },
                      { label: '运行中', value: sopExecutions.filter(e => e.status === 'running' || e.status === 'paused').length, icon: '🔄', color: 'text-amber-400' },
                      { label: '成功率', value: sopTemplates.length > 0
                        ? `${Math.round(sopTemplates.reduce((s, t) => s + t.stats.successRate, 0) / sopTemplates.length * 100)}%`
                        : '—', icon: '✅', color: 'text-emerald-400' },
                    ].map(stat => (
                      <div key={stat.label} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
                        <div className={`text-2xl mb-1 ${stat.color}`}>{stat.icon}</div>
                        <div className="text-2xl font-bold text-white">{stat.value}</div>
                        <div className="text-xs text-slate-500">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* 分类卡片 */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                    {(sopCategories.length > 0 ? sopCategories : [
                      { id: 'inquiry', label: '📨 询盘处理', description: '从询盘到报价自动化', color: '#6366f1' },
                      { id: 'order', label: '📦 订单管理', description: '订单全生命周期跟踪', color: '#f59e0b' },
                      { id: 'complaint', label: '⭐ 差评逆转', description: '差评情感分析与逆转', color: '#ef4444' },
                      { id: 'reactivation', label: '💔 流失预警', description: '客户流失风险与挽回', color: '#8b5cf6' },
                      { id: 'followup', label: '📞 定期跟进', description: '客户定期关怀', color: '#10b981' },
                      { id: 'custom', label: '🛠️ 自定义', description: '自定义 SOP 流程', color: '#64748b' },
                    ]).map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => { setSelectedCategory(cat.id); setSopTab('templates'); }}
                        className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 text-left hover:border-indigo-500/40 transition"
                      >
                        <div className="text-sm font-medium text-white mb-0.5">{cat.label}</div>
                        <div className="text-xs text-slate-500">{cat.description}</div>
                        <div className="text-xs text-indigo-400 mt-1">
                          {sopTemplates.filter(t => t.category === cat.id).length} 个模板
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* 最新执行 */}
                  {sopExecutions.length > 0 && (
                    <div>
                      <h3 className="text-white font-medium text-sm mb-3">▶ 最新执行</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {sopExecutions.slice(0, 4).map(exec => (
                          <ExecutionCard
                            key={exec.id}
                            exec={exec}
                            onConfirm={handleConfirmNode}
                            onView={e => { setSelectedExecution(e); setExecDetailOpen(true); }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 模板库 */}
              {sopTab === 'templates' && (
                <div>
                  <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition ${selectedCategory === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                    >
                      全部
                    </button>
                    {(sopCategories.length > 0 ? sopCategories : [
                      { id: 'inquiry', label: '📨 询盘处理' }, { id: 'order', label: '📦 订单管理' },
                      { id: 'complaint', label: '⭐ 差评逆转' }, { id: 'reactivation', label: '💔 流失预警' },
                    ]).map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition ${selectedCategory === cat.id ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {sopLoading ? (
                    <div className="text-center py-12 text-slate-500">加载中...</div>
                  ) : filteredTemplates.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-4xl mb-3">📋</div>
                      <p className="text-slate-500 text-sm">暂无 SOP 模板</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {filteredTemplates.map(tpl => (
                        <SOPTemplateCard
                          key={tpl.id}
                          template={tpl}
                          onExecute={handleExecuteSOP}
                          onView={t => { setSelectedTemplate(t); }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 执行记录 */}
              {sopTab === 'executions' && (
                <div>
                  {sopExecutions.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-4xl mb-3">▶</div>
                      <p className="text-slate-500 text-sm">暂无执行记录</p>
                      <p className="text-slate-600 text-xs mt-1">选择一个模板执行 SOP 开始体验</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sopExecutions.map(exec => (
                        <ExecutionCard
                          key={exec.id}
                          exec={exec}
                          onConfirm={handleConfirmNode}
                          onView={e => { setSelectedExecution(e); setExecDetailOpen(true); }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 对话历史 ── */}
        {activeTab === 'conversations' && (
          <div className="p-6 overflow-y-auto h-full">
            <h2 className="text-white font-bold mb-4">💬 对话历史</h2>
            {activeConversation ? (
              <div>
                <button onClick={() => setActiveConversation(null)} className="text-slate-400 hover:text-white text-sm mb-3">
                  ← 返回列表
                </button>
                <div className="space-y-2">
                  {activeConversation.messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-xl px-4 py-2.5 text-sm ${
                        msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-200'
                      }`}>
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                        <div className="text-xs mt-1 opacity-60">
                          {new Date(msg.createdAt).toLocaleString('zh-CN')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <div className="text-4xl mb-3">💬</div>
                <p className="text-sm">暂无对话记录</p>
                <p className="text-xs mt-1">选择一个助手开始对话</p>
              </div>
            )}
          </div>
        )}

        {/* ── 设置 ── */}
        {activeTab === 'settings' && (
          <div className="p-6 overflow-y-auto h-full max-w-2xl">
            <h2 className="text-white font-bold mb-4">⚙️ AnyGen 设置</h2>

            <div className="space-y-4">
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
                <h3 className="text-white font-medium text-sm mb-3">🔑 API 配置</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">AnyGen API Key</label>
                    <input
                      type="password"
                      placeholder="sk-ag-..."
                      className="w-full bg-slate-900 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <p className="text-xs text-slate-600 mt-1">从 anygen.io 获取，或访问 anygen.io/assistant 直接使用</p>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">API 端点</label>
                    <input
                      defaultValue="https://api.anygen.io/v1"
                      className="w-full bg-slate-900 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-2 rounded-lg transition">
                      保存配置
                    </button>
                    <a
                      href="https://www.anygen.io/home"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs px-4 py-2 rounded-lg transition"
                    >
                      🌐 访问 AnyGen
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
                <h3 className="text-white font-medium text-sm mb-3">🤖 助手偏好</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { label: '默认助手', value: '全能助手', icon: '🧠' },
                    { label: '语言', value: '中文 + English', icon: '🌐' },
                    { label: '语音模式', value: '已启用', icon: '🎤' },
                    { label: '邀请码', value: '龙虾太极', icon: '🎫' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                      <span className="text-slate-400">{item.icon} {item.label}</span>
                      <span className="text-white text-xs">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
                <h3 className="text-white font-medium text-sm mb-3">📖 集成说明</h3>
                <div className="text-xs text-slate-400 space-y-2 leading-relaxed">
                  <p><strong className="text-white">AnyGen.io</strong> 是字节跳动推出的 AI 智能体工作平台。</p>
                  <p>本系统通过两种方式与 AnyGen 深度集成：</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li><strong className="text-white">浏览器嵌入模式</strong>：点击「浏览器」在新窗口打开 AnyGen，完整功能</li>
                    <li><strong className="text-white">API 调用模式</strong>：配置 API Key 后，可通过后端直接调用 AnyGen 能力</li>
                    <li><strong className="text-white">SOP 自动化</strong>：AnyGen AI 决策节点嵌入 SOP 工作流</li>
                  </ul>
                  <p>邀请码：<code className="bg-slate-700 px-1 rounded text-amber-400">龙虾太极</code>（注册时填写可获得额外权益）</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── SOP 执行详情弹窗 ── */}
      {execDetailOpen && selectedExecution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <div>
                <h3 className="text-white font-bold">{selectedExecution.templateName}</h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  执行ID: {selectedExecution.id} · 开始于 {new Date(selectedExecution.startedAt).toLocaleString('zh-CN')}
                </p>
              </div>
              <button onClick={() => setExecDetailOpen(false)} className="text-slate-400 hover:text-white text-xl">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {/* 执行进度 */}
              <div className="flex items-center gap-4 mb-4">
                <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                  selectedExecution.status === 'running' ? 'bg-blue-500/10 text-blue-400' :
                  selectedExecution.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                  selectedExecution.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                  selectedExecution.status === 'paused' ? 'bg-amber-500/10 text-amber-400' :
                  'bg-slate-500/10 text-slate-400'
                }`}>
                  {selectedExecution.status === 'running' ? '🔄 运行中' :
                   selectedExecution.status === 'completed' ? '✅ 已完成' :
                   selectedExecution.status === 'failed' ? '❌ 失败' :
                   selectedExecution.status === 'paused' ? '⏸ 待确认' : '🚫 已取消'}
                </div>
                {selectedExecution.metadata.durationMs && (
                  <span className="text-xs text-slate-500">⏱️ {Math.round(selectedExecution.metadata.durationMs / 60000)}分钟</span>
                )}
              </div>

              {/* 节点结果 */}
              <h4 className="text-white font-medium text-sm">📍 执行节点</h4>
              {selectedExecution.nodeResults.length === 0 ? (
                <p className="text-slate-500 text-sm">暂无节点记录</p>
              ) : (
                <div className="space-y-2">
                  {selectedExecution.nodeResults.map((node, i) => (
                    <div key={i} className={`border rounded-lg p-3 ${
                      node.status === 'completed' ? 'border-emerald-500/20 bg-emerald-500/5' :
                      node.status === 'waiting-confirm' ? 'border-amber-500/30 bg-amber-500/5' :
                      node.status === 'failed' ? 'border-red-500/20 bg-red-500/5' :
                      'border-slate-700/50 bg-slate-800/30'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white text-xs font-medium">{node.nodeName}</span>
                        <span className={`text-xs ${
                          node.status === 'completed' ? 'text-emerald-400' :
                          node.status === 'waiting-confirm' ? 'text-amber-400' :
                          node.status === 'failed' ? 'text-red-400' : 'text-slate-500'
                        }`}>
                          {node.status === 'completed' ? '✅' : node.status === 'waiting-confirm' ? '⏳' : node.status === 'failed' ? '❌' : '⏸'}
                          {' '}{node.status}
                        </span>
                      </div>
                      {node.aiDecision && (
                        <div className="text-xs text-indigo-400 mt-1">
                          🤖 AI 决策：{node.aiDecision}
                          {node.aiModel && <span className="text-slate-500 ml-1">({node.aiModel})</span>}
                        </div>
                      )}
                      {node.humanConfirmRequestedAt && !node.humanConfirmedBy && (
                        <div className="text-xs text-amber-400 mt-1">⏳ 等待人工确认...</div>
                      )}
                      {node.humanConfirmedBy && (
                        <div className="text-xs text-emerald-400 mt-1">✅ 已由 {node.humanConfirmedBy} 确认：{node.humanConfirmAnswer}</div>
                      )}
                      {node.error && (
                        <div className="text-xs text-red-400 mt-1">❌ {node.error}</div>
                      )}
                      {Object.keys(node.output).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-slate-500 cursor-pointer">查看输出</summary>
                          <pre className="mt-1 text-xs text-slate-400 bg-slate-900 rounded p-2 overflow-x-auto">
                            {JSON.stringify(node.output, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * SIMIAICLAW 龙虾集群太极64卦系统
 * 前端状态仪表盘 (React 组件)
 * 
 * 展示：八宫状态、任务队列、心跳健康、知识库统计、支付看板
 */

import React, { useState, useEffect } from 'react';
import { Palace } from './types';

const PALACE_COLORS: Record<Palace, { bg: string; border: string; icon: string }> = {
  [Palace.QIAN]: { bg: 'from-red-900/20 to-red-950/40', border: 'border-red-500/50', icon: '⚔️' },
  [Palace.KUN]:  { bg: 'from-amber-900/20 to-amber-950/40', border: 'border-amber-500/50', icon: '📝' },
  [Palace.ZHEN]: { bg: 'from-purple-900/20 to-purple-950/40', border: 'border-purple-500/50', icon: '🎨' },
  [Palace.XUN]:  { bg: 'from-green-900/20 to-green-950/40', border: 'border-green-500/50', icon: '⚙️' },
  [Palace.KAN]:  { bg: 'from-blue-900/20 to-blue-950/40', border: 'border-blue-500/50', icon: '🚀' },
  [Palace.LI]:   { bg: 'from-orange-900/20 to-orange-950/40', border: 'border-orange-500/50', icon: '📊' },
  [Palace.GEN]:  { bg: 'from-gray-800/20 to-gray-900/40', border: 'border-gray-500/50', icon: '🏔️' },
  [Palace.DUI]:  { bg: 'from-cyan-900/20 to-cyan-950/40', border: 'border-cyan-500/50', icon: '🦞' },
};

const PALACE_NAMES: Record<Palace, string> = {
  [Palace.QIAN]: '乾宫', [Palace.KUN]: '坤宫', [Palace.ZHEN]: '震宫', [Palace.XUN]: '巽宫',
  [Palace.KAN]: '坎宫', [Palace.LI]: '离宫', [Palace.GEN]: '艮宫', [Palace.DUI]: '兑宫',
};

interface SystemStatus {
  timestamp: string;
  agents: { total: number; byPalace: Array<{ palace: string; count: number }> };
  tasks: { total: number; pending: number; running: number; completed: number; failed: number };
  heartbeat: {
    nodeCount: number;
    healthByPalace: Record<string, { up: number; down: number; total: number }>;
  };
  openspace: { total: number; byType: Record<string, number>; byLane: Record<string, number> };
  clawtip: { total: number; completed: number; pending: number; revenue: number };
}

interface HealthReport {
  overallStatus: 'healthy' | 'degraded' | 'critical';
  activeAgents: number;
  failedAgents: number;
  nodes: Array<{ palace: string; agentId: string; status: string; responseTime: number }>;
}

// ============================================================
// 八宫状态卡片
// ============================================================
function PalaceCard({ palace, health }: { palace: Palace; health: { up: number; down: number; total: number } }) {
  const colors = PALACE_COLORS[palace];
  const pct = health.total > 0 ? Math.round(health.up / health.total * 100) : 0;
  return (
    <div className={`bg-gradient-to-br ${colors.bg} border ${colors.border} rounded-xl p-4`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">{colors.icon}</span>
        <h3 className="font-semibold text-white">{PALACE_NAMES[palace]}</h3>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">在线</span>
          <span className="text-green-400">{health.up}/{health.total}</span>
        </div>
        <div className="w-full bg-black/30 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: pct === 100 ? '#4ade80' : pct > 50 ? '#facc15' : '#f87171' }}
          />
        </div>
        <div className="text-xs text-gray-500 text-right">{pct}% 健康</div>
      </div>
    </div>
  );
}

// ============================================================
// 任务看板
// ============================================================
function TaskBoard({ tasks }: { tasks: SystemStatus['tasks'] }) {
  const items = [
    { label: '总计', value: tasks.total, color: 'text-white' },
    { label: '待处理', value: tasks.pending, color: 'text-yellow-400' },
    { label: '运行中', value: tasks.running, color: 'text-blue-400' },
    { label: '已完成', value: tasks.completed, color: 'text-green-400' },
    { label: '失败', value: tasks.failed, color: 'text-red-400' },
  ];
  return (
    <div className="bg-gray-900/80 border border-gray-700 rounded-xl p-4">
      <h2 className="text-sm font-medium text-gray-400 mb-3">📋 任务队列</h2>
      <div className="grid grid-cols-5 gap-3">
        {items.map(i => (
          <div key={i.label} className="text-center">
            <div className={`text-2xl font-bold ${i.color}`}>{i.value}</div>
            <div className="text-xs text-gray-500">{i.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// OpenSpace 知识库
// ============================================================
function OpenSpacePanel({ stats }: { stats: SystemStatus['openspace'] }) {
  return (
    <div className="bg-gray-900/80 border border-gray-700 rounded-xl p-4">
      <h2 className="text-sm font-medium text-gray-400 mb-3">🧠 OpenSpace 知识库</h2>
      <div className="text-3xl font-bold text-purple-400 mb-2">{stats.total} 条</div>
      <div className="text-xs text-gray-500 mb-3">知识条目</div>
      <div className="space-y-1">
        {Object.entries(stats.byType || {}).map(([type, count]) => (
          <div key={type} className="flex justify-between text-xs">
            <span className="text-gray-400 capitalize">{type}</span>
            <span className="text-purple-300">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// ClawTip 支付看板
// ============================================================
function ClawTipPanel({ stats }: { stats: SystemStatus['clawtip'] }) {
  return (
    <div className="bg-gray-900/80 border border-gray-700 rounded-xl p-4">
      <h2 className="text-sm font-medium text-gray-400 mb-3">💰 ClawTip 支付闭环</h2>
      <div className="text-3xl font-bold text-emerald-400 mb-2">
        ¥{(stats.revenue || 0).toLocaleString()}
      </div>
      <div className="text-xs text-gray-500 mb-3">累计流水</div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div><div className="text-lg font-bold text-white">{stats.total}</div><div className="text-xs text-gray-500">总计</div></div>
        <div><div className="text-lg font-bold text-green-400">{stats.completed}</div><div className="text-xs text-gray-500">完成</div></div>
        <div><div className="text-lg font-bold text-yellow-400">{stats.pending}</div><div className="text-xs text-gray-500">待审批</div></div>
      </div>
    </div>
  );
}

// ============================================================
// 指令执行器
// ============================================================
function CommandExecutor({ onExecute }: { onExecute: (cmd: string) => void }) {
  const [cmd, setCmd] = useState('');
  const quickCommands = [
    { label: '🎯 跨境选品上架', cmd: '跨境选品上架' },
    { label: '🌐 外贸GEO可见性', cmd: '外贸GEO可见性' },
    { label: '📱 国内短视频', cmd: '国内短视频' },
    { label: '🔥 自媒体爆款', cmd: '自媒体爆款' },
    { label: '🔍 Prompt Gap', cmd: 'Prompt Gap' },
    { label: '💎 技能变现', cmd: '技能变现' },
    { label: '🐝 蜂巢协作', cmd: '蜂巢永生' },
    { label: '💓 系统健康', cmd: 'healthcheck' },
  ];

  return (
    <div className="bg-gray-900/80 border border-gray-700 rounded-xl p-4">
      <h2 className="text-sm font-medium text-gray-400 mb-3">⚡ 指令执行器</h2>
      <div className="flex gap-2 mb-3">
        <input
          value={cmd}
          onChange={e => setCmd(e.target.value)}
          placeholder="输入指令或从下方选择..."
          className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
          onKeyDown={e => e.key === 'Enter' && cmd && onExecute(cmd)}
        />
        <button
          onClick={() => cmd && onExecute(cmd)}
          className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 rounded-lg text-sm font-medium transition-colors"
        >
          执行
        </button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {quickCommands.map(q => (
          <button
            key={q.cmd}
            onClick={() => onExecute(q.cmd)}
            className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-2 py-2 text-xs text-gray-300 hover:text-white transition-colors text-left"
          >
            {q.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 主仪表盘
// ============================================================
export function TaijiDashboard() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/status');
        if (res.ok) setStatus(await res.json());
      } catch { /* 演示模式 */ }
      setLoading(false);
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleExecute = (cmd: string) => {
    fetch('/api/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: cmd }),
    }).then(r => r.json()).then(console.log).catch(console.error);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">🦞</div>
          <div className="text-gray-400">SIMIAICLAW 龙虾集群启动中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      {/* 头部 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
          🦞 SIMIAICLAW 龙虾集群太极64卦系统
        </h1>
        <p className="text-gray-500 text-sm mt-1">64卦智能体协同 · 实时监控面板 · {status?.timestamp ? new Date(status.timestamp).toLocaleString('zh-CN') : ''}</p>
      </div>

      {/* 状态总览 */}
      {status && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-900/80 border border-gray-700 rounded-xl p-4 text-center">
            <div className="text-4xl font-bold text-cyan-400">{status.agents.total}</div>
            <div className="text-xs text-gray-500 mt-1">智能体总数</div>
          </div>
          <div className="bg-gray-900/80 border border-gray-700 rounded-xl p-4 text-center">
            <div className="text-4xl font-bold text-green-400">{status.heartbeat.nodeCount}</div>
            <div className="text-xs text-gray-500 mt-1">心跳监控节点</div>
          </div>
          <div className="bg-gray-900/80 border border-gray-700 rounded-xl p-4 text-center">
            <div className="text-4xl font-bold text-purple-400">{status.openspace.total}</div>
            <div className="text-xs text-gray-500 mt-1">知识条目</div>
          </div>
        </div>
      )}

      {/* 八宫状态 */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {Object.values(Palace).map(p => (
          <PalaceCard
            key={p}
            palace={p}
            health={status?.heartbeat?.healthByPalace?.[p] || { up: 8, down: 0, total: 8 }}
          />
        ))}
      </div>

      {/* 任务 + 知识 + 支付 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {status && <TaskBoard tasks={status.tasks} />}
        {status && <OpenSpacePanel stats={status.openspace} />}
        {status && <ClawTipPanel stats={status.clawtip} />}
      </div>

      {/* 指令执行器 */}
      <CommandExecutor onExecute={handleExecute} />
    </div>
  );
}

export default TaijiDashboard;

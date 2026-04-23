/**
 * LLM 统计面板
 */
import React from 'react';

interface LLMStats {
  simulateMode: boolean;
  totalRequests: number;
  costUSD: number;
}

interface Props {
  stats: LLMStats;
}

export function LLMStatsPanel({ stats }: Props) {
  return (
    <div className="glass-card p-4">
      <h3 className="text-sm font-medium text-slate-400 mb-3">🧠 AI 模型使用统计</h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-cyan-400">
            {stats.totalRequests}
          </div>
          <div className="text-xs text-slate-500">请求次数</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-amber-400">
            ${stats.costUSD.toFixed(4)}
          </div>
          <div className="text-xs text-slate-500">累计成本</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold ${stats.simulateMode ? 'text-amber-400' : 'text-emerald-400'}`}>
            {stats.simulateMode ? '⚠️' : '✅'}
          </div>
          <div className="text-xs text-slate-500">运行模式</div>
        </div>
      </div>
      {stats.simulateMode && (
        <div className="mt-3 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <p className="text-xs text-amber-400">
            💡 当前为模拟模式，请在 .env 中配置 ANTHROPIC_API_KEY 以启用真实 AI
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * 指令执行器
 */
import React, { useState } from 'react';
import { api } from '../api/client';
import { useDashboardStore } from '../stores/dashboard';
import { toast } from 'sonner';

const QUICK_COMMANDS = [
  { label: '🎯 跨境选品上架', cmd: '跨境选品上架', lane: '跨境电商' },
  { label: '🌐 外贸GEO可见性', cmd: '外贸GEO可见性', lane: '外贸B2B' },
  { label: '📱 国内短视频', cmd: '国内短视频', lane: '国内电商' },
  { label: '🔥 自媒体爆款', cmd: '自媒体爆款', lane: '自媒体' },
  { label: '🔍 Prompt Gap修复', cmd: 'Prompt Gap', lane: '跨境电商' },
  { label: '💎 技能变现收款', cmd: '技能变现', lane: '自媒体' },
  { label: '🐝 蜂巢协作', cmd: '蜂巢永生', lane: '跨境电商' },
  { label: '💓 系统健康检查', cmd: 'healthcheck', lane: '跨境电商' },
];

export function CommandBar() {
  const [cmd, setCmd] = useState('');
  const { isExecuting, setIsExecuting, setCommandOutput } = useDashboardStore();

  const handleExecute = async (command: string, lane?: string) => {
    if (isExecuting) return;
    setIsExecuting(true);
    toast.promise(api.execute(command, lane), {
      loading: `🚀 执行中: ${command}`,
      success: (res) => {
        setCommandOutput(res.message);
        return res.message;
      },
      error: (err) => `❌ 执行失败: ${err}`,
    });
    setIsExecuting(false);
  };

  return (
    <div className="glass-card p-4">
      <h3 className="text-sm font-medium text-slate-400 mb-3">⚡ 指令执行器</h3>
      <div className="flex gap-2 mb-4">
        <input
          value={cmd}
          onChange={e => setCmd(e.target.value)}
          placeholder="输入指令或从下方选择快捷命令..."
          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors placeholder-slate-600"
          onKeyDown={e => e.key === 'Enter' && cmd && handleExecute(cmd)}
        />
        <button
          onClick={() => cmd && handleExecute(cmd)}
          disabled={isExecuting || !cmd}
          className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-6 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          {isExecuting ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              执行中
            </>
          ) : '▶ 执行'}
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {QUICK_COMMANDS.map(q => (
          <button
            key={q.cmd}
            onClick={() => handleExecute(q.cmd, q.lane)}
            disabled={isExecuting}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500/40 rounded-lg px-3 py-2.5 text-xs text-slate-300 hover:text-white transition-all text-left"
          >
            {q.label}
          </button>
        ))}
      </div>
    </div>
  );
}

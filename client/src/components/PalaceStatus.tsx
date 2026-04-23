/**
 * 八宫状态展示组件
 */
import React from 'react';

const PALACE_INFO: Record<string, { bg: string; border: string; icon: string; name: string }> = {
  '乾宫': { bg: 'from-red-950/40 to-red-900/20', border: 'border-red-500/40', icon: '⚔️', name: '乾宫·天' },
  '坤宫': { bg: 'from-amber-950/40 to-amber-900/20', border: 'border-amber-500/40', icon: '📝', name: '坤宫·地' },
  '震宫': { bg: 'from-purple-950/40 to-purple-900/20', border: 'border-purple-500/40', icon: '🎨', name: '震宫·雷' },
  '巽宫': { bg: 'from-emerald-950/40 to-emerald-900/20', border: 'border-emerald-500/40', icon: '⚙️', name: '巽宫·风' },
  '坎宫': { bg: 'from-blue-950/40 to-blue-900/20', border: 'border-blue-500/40', icon: '🚀', name: '坎宫·水' },
  '离宫': { bg: 'from-orange-950/40 to-orange-900/20', border: 'border-orange-500/40', icon: '📊', name: '离宫·火' },
  '艮宫': { bg: 'from-gray-900/40 to-gray-800/20', border: 'border-gray-500/40', icon: '🏔️', name: '艮宫·山' },
  '兑宫': { bg: 'from-cyan-950/40 to-cyan-900/20', border: 'border-cyan-500/40', icon: '🦞', name: '兑宫·泽' },
};

interface Props {
  healthByPalace: Record<string, { up: number; down: number; total: number }>;
}

export function PalaceStatus({ healthByPalace }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {Object.entries(PALACE_INFO).map(([palace, info]) => {
        const health = healthByPalace[palace] || { up: 8, down: 0, total: 8 };
        const pct = health.total > 0 ? Math.round((health.up / health.total) * 100) : 0;
        const statusColor = pct === 100 ? '#4ade80' : pct > 50 ? '#facc15' : '#f87171';
        return (
          <div key={palace} className={`bg-gradient-to-br ${info.bg} border ${info.border} rounded-xl p-4`}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{info.icon}</span>
              <div>
                <h3 className="font-semibold text-white text-sm">{info.name}</h3>
                <p className="text-xs text-slate-400">{palace}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">在线</span>
                <span className="text-emerald-400">{health.up}/{health.total}</span>
              </div>
              <div className="w-full bg-black/30 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: statusColor }}
                />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">健康</span>
                <span style={{ color: statusColor }}>{pct}%</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

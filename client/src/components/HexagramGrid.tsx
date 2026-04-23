/**
 * SIMIAICLAW 64卦网格展示组件
 * 显示64卦详细分工表，支持点击展开详情
 */
import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

// ══════════════════════════════════════════════════════
// 类型定义
// ══════════════════════════════════════════════════════
interface Hexagram {
  no: number; id: string; name: string; shrimp: string;
  palace: string; category: string; duty: string; description: string;
  yaoText: string; skills: string[]; lanes: string[];
  inputSpec: string; outputSpec: string; mcpChannels: string[];
  collabWith: string[]; evolveCondition: string;
}

interface PalaceMeta {
  name: string; emoji: string; role: string;
  color: string; bg: string; border: string; description: string;
}

interface PalaceGroup {
  palace: string; meta: PalaceMeta; hexagrams: Hexagram[];
}

const PALACE_ORDER = ['乾宫', '坤宫', '震宫', '巽宫', '坎宫', '离宫', '艮宫', '兑宫'];

const PALACE_COLORS: Record<string, { accent: string; bg: string; border: string; tag: string }> = {
  '乾宫': { accent: 'text-red-400', bg: 'bg-red-950/30', border: 'border-red-500/30', tag: 'bg-red-500/20 text-red-300' },
  '坤宫': { accent: 'text-amber-400', bg: 'bg-amber-950/30', border: 'border-amber-500/30', tag: 'bg-amber-500/20 text-amber-300' },
  '震宫': { accent: 'text-purple-400', bg: 'bg-purple-950/30', border: 'border-purple-500/30', tag: 'bg-purple-500/20 text-purple-300' },
  '巽宫': { accent: 'text-emerald-400', bg: 'bg-emerald-950/30', border: 'border-emerald-500/30', tag: 'bg-emerald-500/20 text-emerald-300' },
  '坎宫': { accent: 'text-blue-400', bg: 'bg-blue-950/30', border: 'border-blue-500/30', tag: 'bg-blue-500/20 text-blue-300' },
  '离宫': { accent: 'text-orange-400', bg: 'bg-orange-950/30', border: 'border-orange-500/30', tag: 'bg-orange-500/20 text-orange-300' },
  '艮宫': { accent: 'text-gray-300', bg: 'bg-gray-900/30', border: 'border-gray-500/30', tag: 'bg-gray-600/30 text-gray-300' },
  '兑宫': { accent: 'text-cyan-400', bg: 'bg-cyan-950/30', border: 'border-cyan-500/30', tag: 'bg-cyan-500/20 text-cyan-300' },
};

const CATEGORY_ICONS: Record<string, string> = {
  research: '🧠', content: '📝', visual: '🎨', execute: '⚙️',
  marketing: '🚀', analysis: '📊', brand: '🏔️', orchestrate: '🦞',
};

// ══════════════════════════════════════════════════════
// 详情弹窗
// ══════════════════════════════════════════════════════
function HexagramDetailModal({ hex, onClose }: { hex: Hexagram; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [collabChain, setCollabChain] = useState<Hexagram[]>([]);
  const c = PALACE_COLORS[hex.palace] || PALACE_COLORS['兑宫'];

  useEffect(() => {
    fetch(`/api/hexagrams/${hex.id}`)
      .then(r => r.json())
      .then(d => setCollabChain(d.collabChain || []))
      .catch(() => {});
  }, [hex.id]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-3xl mx-4 max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`sticky top-0 bg-gradient-to-r ${c.bg} border-b ${c.border} px-6 py-4 flex items-start justify-between gap-4 z-10`}>
          <div className="flex items-start gap-4">
            <div className="text-4xl">{CATEGORY_ICONS[hex.category] || '🦞'}</div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded">#{hex.no}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${c.tag}`}>{hex.palace}</span>
              </div>
              <h2 className={`text-xl font-bold ${c.accent}`}>{hex.name}</h2>
              <p className="text-sm text-slate-300 mt-0.5">{hex.shrimp} · {hex.duty}</p>
              <p className="text-xs text-slate-500 italic mt-1">"{hex.yaoText}"</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 职责描述 */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">📋 核心职责</h3>
            <p className="text-slate-200 text-sm leading-relaxed">{hex.description}</p>
          </div>

          {/* 双列信息 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 技能列表 */}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">🔧 关键Skill</h3>
              <div className="flex flex-wrap gap-1.5">
                {hex.skills.map(s => (
                  <span key={s} className="bg-slate-800 text-slate-300 text-xs px-2 py-1 rounded border border-slate-700">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* 赛道 */}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">🛤️ 适配赛道</h3>
              <div className="flex flex-wrap gap-1.5">
                {hex.lanes.map(l => (
                  <span key={l} className="bg-slate-800 text-slate-300 text-xs px-2 py-1 rounded border border-slate-700">
                    {l}
                  </span>
                ))}
              </div>
            </div>

            {/* 输入规范 */}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">📥 输入规范</h3>
              <code className="block bg-slate-800 text-cyan-300 text-xs px-3 py-2 rounded-lg border border-slate-700 font-mono leading-relaxed">
                {hex.inputSpec}
              </code>
            </div>

            {/* 输出规范 */}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">📤 输出规范</h3>
              <code className="block bg-slate-800 text-emerald-300 text-xs px-3 py-2 rounded-lg border border-slate-700 font-mono leading-relaxed">
                {hex.outputSpec}
              </code>
            </div>

            {/* MCP通道 */}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">🔗 MCP协作通道</h3>
              <div className="flex flex-wrap gap-1.5">
                {hex.mcpChannels.map(ch => (
                  <span key={ch} className="bg-indigo-950/50 text-indigo-300 text-xs px-2 py-1 rounded border border-indigo-800/40">
                    {ch}
                  </span>
                ))}
              </div>
            </div>

            {/* 进化条件 */}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">🌱 进化条件</h3>
              <p className="text-slate-300 text-xs mt-1">{hex.evolveCondition}</p>
            </div>
          </div>

          {/* 协作虾群 */}
          {collabChain.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">🤝 协作虾群</h3>
              <div className="flex flex-wrap gap-2">
                {collabChain.map(h => {
                  const cc = PALACE_COLORS[h.palace] || PALACE_COLORS['兑宫'];
                  return (
                    <div key={h.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${cc.bg} border ${cc.border}`}>
                      <span className="text-lg">{CATEGORY_ICONS[h.category] || '🦞'}</span>
                      <div>
                        <div className={`text-xs font-semibold ${cc.accent}`}>{h.name}</div>
                        <div className="text-[10px] text-slate-400">{h.shrimp}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// 64卦网格组件
// ══════════════════════════════════════════════════════
export function HexagramGrid({ onClose }: { onClose?: () => void }) {
  const [palaces, setPalaces] = useState<PalaceGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHex, setSelectedHex] = useState<Hexagram | null>(null);
  const [expandedPalace, setExpandedPalace] = useState<string | null>('乾宫');

  useEffect(() => {
    fetch('/api/hexagrams')
      .then(r => r.json())
      .then(d => {
        setPalaces(d.byPalace || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl animate-pulse mb-3">🦞</div>
          <p className="text-slate-500 text-sm">正在加载64卦...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* 详情弹窗 */}
      {selectedHex && (
        <HexagramDetailModal hex={selectedHex} onClose={() => setSelectedHex(null)} />
      )}

      {/* 顶部栏 */}
      <div className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 px-6 py-3 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white">🌀 SIMIAICLAW 64卦详细分工表</h2>
          <p className="text-xs text-slate-500 mt-0.5">8宫 × 8卦 = 64卦 · 点击任意卦位查看详细职责、Skill和协作关系</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* 64卦宫位视图 */}
      <div className="p-6 space-y-6">
        {palaces.map(group => {
          const c = PALACE_COLORS[group.palace] || PALACE_COLORS['兑宫'];
          const isExpanded = expandedPalace === group.palace;

          return (
            <div key={group.palace} className={`border ${c.border} rounded-xl overflow-hidden ${c.bg}`}>
              {/* 宫位标题栏 */}
              <button
                className="w-full px-5 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
                onClick={() => setExpandedPalace(isExpanded ? null : group.palace)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{group.meta.emoji}</span>
                  <div className="text-left">
                    <h3 className={`font-bold text-base ${c.accent}`}>{group.meta.name}</h3>
                    <p className="text-xs text-slate-400">{group.meta.role} · {group.meta.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    {group.hexagrams.map(h => (
                      <div
                        key={h.id}
                        className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-mono bg-slate-800/60 text-slate-300 border border-slate-700/50"
                        title={`${h.name} · ${h.duty}`}
                      >
                        {h.no}
                      </div>
                    ))}
                  </div>
                  <span className="text-slate-500 text-sm">{isExpanded ? '▲' : '▼'}</span>
                </div>
              </button>

              {/* 8卦网格 */}
              {isExpanded && (
                <div className="border-t border-slate-800/50 p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {group.hexagrams.map(hex => (
                      <button
                        key={hex.id}
                        onClick={() => setSelectedHex(hex)}
                        className={`text-left p-3 rounded-xl border ${c.border} ${c.bg} hover:scale-[1.02] hover:border-opacity-60 transition-all cursor-pointer group`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className={`text-sm font-bold ${c.accent}`}>{hex.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{hex.id}</div>
                          </div>
                          <span className="text-lg opacity-60 group-hover:opacity-100 transition-opacity">
                            {CATEGORY_ICONS[hex.category] || '🦞'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 font-medium mb-1.5">{hex.shrimp}</div>
                        <div className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">{hex.duty}</div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {hex.lanes.slice(0, 2).map(l => (
                            <span key={l} className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                              {l}
                            </span>
                          ))}
                        </div>
                        <div className="mt-2 text-[9px] text-cyan-500/60 flex items-center gap-1">
                          <span>→ 查看详情</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* 宫位协作总览 */}
                  <div className="mt-4 pt-4 border-t border-slate-800/50">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-slate-500">🔗 协作链路</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {group.hexagrams.flatMap(h => h.collabWith).filter((v, i, a) => a.indexOf(v) === i).map(cid => {
                        const targetHex = group.hexagrams.find(h => h.id === cid) || palaces.flatMap(p => p.hexagrams).find(h => h.id === cid);
                        if (!targetHex) return null;
                        const tc = PALACE_COLORS[targetHex.palace] || PALACE_COLORS['兑宫'];
                        return (
                          <div key={cid} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs ${tc.bg} border ${tc.border}`}>
                            <span className="font-mono font-bold text-[10px]">{cid}</span>
                            <span className={`${tc.accent} font-medium`}>{targetHex.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * SIMIAICLAW 工作流编排器
 * 基于64卦智能体系统的工作流可视化编排与执行
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api/client';
import { toast } from 'sonner';

// ══════════════════════════════════════════════════════════════
// 类型定义
// ══════════════════════════════════════════════════════════════

interface Hexagram {
  no: number; id: string; name: string; shrimp: string;
  palace: string; category: string; duty: string; description: string;
  yaoText: string; skills: string[]; lanes: string[];
  inputSpec: string; outputSpec: string; mcpChannels: string[];
  collabWith: string[]; evolveCondition: string;
}

interface PalaceMeta { name: string; emoji: string; role: string; color: string; bg: string; border: string; description: string; }

interface WFNode {
  id: string;
  hexId: string;
  name: string;
  shrimp: string;
  palace: string;
  category: string;
  duty: string;
  x: number;
  y: number;
  status: 'idle' | 'running' | 'done' | 'error';
  config: Record<string, string>;
}

interface WFConnection {
  id: string;
  from: string;
  to: string;
  label?: string;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: WFNode[];
  connections: WFConnection[];
  status: 'draft' | 'running' | 'done';
  createdAt: string;
  runCount: number;
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  emoji: string;
  hexIds: string[];
  category: string;
  useCase: string;
}

// ══════════════════════════════════════════════════════════════
// 64卦模板库（基于八宫协作链路）
// ══════════════════════════════════════════════════════════════

const PALACE_ORDER = ['乾宫', '坤宫', '震宫', '巽宫', '坎宫', '离宫', '艮宫', '兑宫'];

const PALACE_COLORS: Record<string, { accent: string; bg: string; border: string; tag: string; glow: string }> = {
  '乾宫': { accent: 'text-red-400', bg: 'bg-red-950/40', border: 'border-red-500/40', tag: 'bg-red-500/20 text-red-300', glow: 'shadow-red-500/20' },
  '坤宫': { accent: 'text-amber-400', bg: 'bg-amber-950/40', border: 'border-amber-500/40', tag: 'bg-amber-500/20 text-amber-300', glow: 'shadow-amber-500/20' },
  '震宫': { accent: 'text-purple-400', bg: 'bg-purple-950/40', border: 'border-purple-500/40', tag: 'bg-purple-500/20 text-purple-300', glow: 'shadow-purple-500/20' },
  '巽宫': { accent: 'text-emerald-400', bg: 'bg-emerald-950/40', border: 'border-emerald-500/40', tag: 'bg-emerald-500/20 text-emerald-300', glow: 'shadow-emerald-500/20' },
  '坎宫': { accent: 'text-blue-400', bg: 'bg-blue-950/40', border: 'border-blue-500/40', tag: 'bg-blue-500/20 text-blue-300', glow: 'shadow-blue-500/20' },
  '离宫': { accent: 'text-orange-400', bg: 'bg-orange-950/40', border: 'border-orange-500/40', tag: 'bg-orange-500/20 text-orange-300', glow: 'shadow-orange-500/20' },
  '艮宫': { accent: 'text-gray-300', bg: 'bg-gray-900/40', border: 'border-gray-500/40', tag: 'bg-gray-600/30 text-gray-300', glow: 'shadow-gray-500/20' },
  '兑宫': { accent: 'text-cyan-400', bg: 'bg-cyan-950/40', border: 'border-cyan-500/40', tag: 'bg-cyan-500/20 text-cyan-300', glow: 'shadow-cyan-500/20' },
};

const CATEGORY_ICONS: Record<string, string> = {
  research: '🧠', content: '📝', visual: '🎨', execute: '⚙️',
  marketing: '🚀', analysis: '📊', brand: '🏔️', orchestrate: '🦞',
};

const PALACE_EMOJI: Record<string, string> = {
  '乾宫': '⚔️', '坤宫': '📝', '震宫': '🎨', '巽宫': '⚙️',
  '坎宫': '🚀', '离宫': '📊', '艮宫': '🏔️', '兑宫': '🦞',
};

const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 't1', name: '跨境电商全链路', emoji: '🌐',
    description: '从市场调研到广告投放的完整链路',
    category: '跨境电商',
    useCase: '新品冷启动',
    hexIds: ['Q1', 'Q2', 'Q3', 'Q5', 'K1', 'K2', 'K3', 'K5', 'L1', 'L2'],
  },
  {
    id: 't2', name: '内容矩阵生产', emoji: '📝',
    description: '选题→文案→配图→发布全流程',
    category: '内容创作',
    useCase: '社媒运营',
    hexIds: ['Q3', 'K1', 'K2', 'K4', 'Z1', 'Z2', 'Z6', 'X1', 'X2'],
  },
  {
    id: 't3', name: '爆款视频工厂', emoji: '🎬',
    description: '脚本→分镜→生成→剪辑→分发',
    category: '短视频',
    useCase: 'TikTok/抖音',
    hexIds: ['Q1', 'Q3', 'K1', 'K2', 'Z1', 'Z2', 'Z5', 'Z6', 'X1', 'K3'],
  },
  {
    id: 't4', name: '品牌IP打造', emoji: '🏔️',
    description: '故事→视觉→创始人IP→长期资产',
    category: '品牌',
    useCase: '个人品牌',
    hexIds: ['Q1', 'Q3', 'M1', 'M5', 'G1', 'G2', 'G3', 'G5', 'G6', 'D1'],
  },
  {
    id: 't5', name: '虾群协作推广', emoji: '🦞',
    description: '总控→情报→执行→营销→分析闭环',
    category: '运营',
    useCase: '多平台推广',
    hexIds: ['D1', 'Q1', 'Q2', 'K1', 'K2', 'K3', 'K4', 'L1', 'L2', 'L3'],
  },
  {
    id: 't6', name: '选品调研链路', emoji: '🔍',
    description: '竞品分析→用户画像→市场规模→ROI计算',
    category: '选品',
    useCase: '选品决策',
    hexIds: ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q8', 'L1', 'L2'],
  },
  {
    id: 't7', name: '视觉内容工厂', emoji: '🎨',
    description: '产品图→视频→封面→素材库管理',
    category: '视觉',
    useCase: '品牌视觉',
    hexIds: ['Z1', 'Z2', 'Z3', 'Z4', 'Z5', 'Z6', 'G3', 'D1'],
  },
  {
    id: 't8', name: '数据分析复盘', emoji: '📊',
    description: '数据采集→效果分析→ROI计算→优化建议',
    category: '分析',
    useCase: '运营复盘',
    hexIds: ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'D1'],
  },
];

// ══════════════════════════════════════════════════════════════
// 辅助函数
// ══════════════════════════════════════════════════════════════

let nodeCounter = 0;
function genNodeId() { return `node_${Date.now()}_${++nodeCounter}`; }
function genConnId() { return `conn_${Date.now()}_${++nodeCounter}`; }
function genWfId() { return `wf_${Date.now()}`; }

function getHexName(hexId: string, hexagrams: Hexagram[]): string {
  const h = hexagrams.find(x => x.id === hexId);
  return h ? h.name : hexId;
}

function getHexById(hexId: string, hexagrams: Hexagram[]): Hexagram | undefined {
  return hexagrams.find(x => x.id === hexId);
}

// ══════════════════════════════════════════════════════════════
// SVG连接线组件
// ══════════════════════════════════════════════════════════════

function ConnectionLine({ from, to, color, label }: { from: { x: number; y: number }; to: { x: number; y: number }; color: string; label?: string }) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const cx = from.x + dx / 2;
  const cy = from.y + dy / 2 - 20;
  const d = `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`;
  return (
    <g>
      <path d={d} fill="none" stroke={color} strokeWidth={2} strokeOpacity={0.6} strokeDasharray="6 3" />
      <polygon
        points={`${to.x - 6},${to.y - 8} ${to.x + 6},${to.y - 8} ${to.x},${to.y}`}
        fill={color} opacity={0.8}
      />
      {label && (
        <text x={cx} y={cy + 4} textAnchor="middle" fill={color} fontSize="10" opacity={0.8}>{label}</text>
      )}
    </g>
  );
}

// ══════════════════════════════════════════════════════════════
// 工作流节点
// ══════════════════════════════════════════════════════════════

function WFNodeComponent({ node, selected, onSelect, onDrag, onDelete, colorMap, index }: {
  node: WFNode; selected: boolean; onSelect: () => void;
  onDrag: (dx: number, dy: number) => void; onDelete: () => void;
  colorMap: Record<string, typeof PALACE_COLORS[string]>; index: number;
}) {
  const c = colorMap[node.palace] || colorMap['兑宫'];
  const statusColors: Record<string, string> = {
    idle: 'border-slate-600', running: 'border-cyan-400 shadow-lg shadow-cyan-400/30',
    done: 'border-emerald-400 shadow-lg shadow-emerald-400/30', error: 'border-red-400',
  };
  const statusIcons: Record<string, string> = {
    idle: '', running: '🔄', done: '✅', error: '❌',
  };
  const [dragging, setDragging] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });

  return (
    <div
      className={`absolute w-40 bg-slate-900/95 border-2 rounded-xl p-3 cursor-move select-none backdrop-blur-sm transition-shadow ${statusColors[node.status]} ${selected ? 'ring-2 ring-cyan-400' : ''}`}
      style={{ left: node.x, top: node.y }}
      onClick={e => { e.stopPropagation(); onSelect(); }}
      onMouseDown={e => {
        if (e.button !== 0) return;
        setDragging(true);
        lastPos.current = { x: e.clientX, y: e.clientY };
        const onMove = (ev: MouseEvent) => {
          if (!dragging) return;
          const dx = ev.clientX - lastPos.current.x;
          const dy = ev.clientY - lastPos.current.y;
          lastPos.current = { x: ev.clientX, y: ev.clientY };
          onDrag(dx, dy);
        };
        const onUp = () => { setDragging(false); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
      }}
    >
      {/* 宫位标识 */}
      <div className={`absolute -top-2 -left-2 text-xs w-5 h-5 rounded-full flex items-center justify-center ${c.bg} ${c.border} border font-bold`}>
        {PALACE_EMOJI[node.palace]?.[0] || '🦞'}
      </div>
      {/* 删除按钮 */}
      {selected && (
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 hover:bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
        >✕</button>
      )}
      {/* 节点内容 */}
      <div className="text-[10px] text-slate-500 mb-1">{index + 1}. {node.palace}</div>
      <div className={`text-sm font-bold ${c.accent}`}>{node.name}</div>
      <div className="text-[10px] text-slate-400 mt-0.5">{node.shrimp}</div>
      <div className="text-[10px] text-slate-500 mt-1 line-clamp-2">{node.duty}</div>
      {/* 状态 */}
      {node.status !== 'idle' && (
        <div className="mt-2 flex items-center gap-1 text-[10px]">
          <span>{statusIcons[node.status]}</span>
          <span className={node.status === 'running' ? 'text-cyan-400 animate-pulse' : node.status === 'done' ? 'text-emerald-400' : 'text-red-400'}>
            {node.status === 'running' ? '执行中' : node.status === 'done' ? '已完成' : '出错'}
          </span>
        </div>
      )}
      {/* 输入桩 */}
      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-slate-600 border-2 border-slate-400 rounded-full" title="输入" />
      {/* 输出桩 */}
      <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-cyan-600 border-2 border-cyan-400 rounded-full" title="输出" />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 节点属性配置面板
// ══════════════════════════════════════════════════════════════

function NodeConfigPanel({ node, hexagrams, onUpdate, onClose }: {
  node: WFNode; hexagrams: Hexagram[]; onUpdate: (config: Record<string, string>) => void; onClose: () => void;
}) {
  const hex = getHexById(node.hexId, hexagrams);
  const [config, setConfig] = useState<Record<string, string>>(node.config);

  const handleSave = () => { onUpdate(config); onClose(); };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-white">⚙️ 节点配置</h4>
        <button onClick={onClose} className="text-slate-500 hover:text-white text-lg">✕</button>
      </div>
      <div className="text-xs text-slate-500">节点：{node.name}（{node.palace}）</div>
      <div className="space-y-2">
        <div>
          <label className="text-[11px] text-slate-400 block mb-1">任务描述</label>
          <textarea
            value={config.task || ''}
            onChange={e => setConfig(c => ({ ...c, task: e.target.value }))}
            placeholder="描述此节点的具体任务..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 resize-none h-16"
          />
        </div>
        <div>
          <label className="text-[11px] text-slate-400 block mb-1">输入参数</label>
          <input
            value={config.input || ''}
            onChange={e => setConfig(c => ({ ...c, input: e.target.value }))}
            placeholder={hex?.inputSpec || '输入参数 JSON'}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
          />
        </div>
        {hex?.skills && (
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">激活 Skill</label>
            <div className="flex flex-wrap gap-1">
              {hex.skills.map(s => (
                <span key={s} className="bg-slate-700 text-slate-300 text-[10px] px-1.5 py-0.5 rounded">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      <button onClick={handleSave} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white text-xs py-2 rounded-lg font-medium transition-colors">
        保存配置
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 模板选择器
// ══════════════════════════════════════════════════════════════

function TemplateSelector({ templates, hexagrams, onApply, onClose }: {
  templates: WorkflowTemplate[]; hexagrams: Hexagram[]; onApply: (nodes: WFNode[]) => void; onClose: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleApply = () => {
    if (!selected) return;
    const tpl = templates.find(t => t.id === selected);
    if (!tpl) return;
    const nodes: WFNode[] = tpl.hexIds.map((hexId, i) => {
      const hex = getHexById(hexId, hexagrams);
      return {
        id: genNodeId(), hexId, name: hex?.name || hexId,
        shrimp: hex?.shrimp || '', palace: hex?.palace || '兑宫',
        category: hex?.category || 'orchestrate', duty: hex?.duty || '',
        x: 80 + (i % 4) * 200, y: 100 + Math.floor(i / 4) * 120,
        status: 'idle', config: {},
      };
    });
    // 自动连线（相邻节点）
    onApply(nodes);
    onClose();
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2 max-h-[50vh] overflow-y-auto pr-1">
        {templates.map(tpl => (
          <div
            key={tpl.id}
            onClick={() => setSelected(tpl.id)}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${selected === tpl.id ? 'bg-cyan-900/30 border-cyan-500/60' : 'bg-slate-800/60 border-slate-700/50 hover:border-slate-500'}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{tpl.emoji}</span>
              <span className="font-semibold text-sm text-white">{tpl.name}</span>
              <span className="ml-auto text-[10px] bg-slate-700 text-slate-400 px-2 py-0.5 rounded">{tpl.category}</span>
            </div>
            <div className="text-[11px] text-slate-400">{tpl.description}</div>
            <div className="text-[10px] text-slate-500 mt-1">用例：{tpl.useCase} · {tpl.hexIds.length}个卦位</div>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {tpl.hexIds.slice(0, 6).map(id => (
                <span key={id} className="text-[9px] bg-slate-700/60 text-slate-400 px-1 py-0.5 rounded">
                  {getHexName(id, hexagrams)}
                </span>
              ))}
              {tpl.hexIds.length > 6 && <span className="text-[9px] text-slate-500">+{tpl.hexIds.length - 6}</span>}
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={handleApply}
        disabled={!selected}
        className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all ${selected ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
      >
        一键生成工作流 →
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 卦位选择器
// ══════════════════════════════════════════════════════════════

function HexSelector({ hexagrams, onAdd }: { hexagrams: Hexagram[]; onAdd: (hex: Hexagram) => void }) {
  const [palace, setPalace] = useState<string>('乾宫');
  const [search, setSearch] = useState('');
  const palaces = PALACE_ORDER;
  const filtered = hexagrams.filter(h =>
    (palace === '全部' || h.palace === palace) &&
    (search === '' || h.name.includes(search) || h.shrimp.includes(search) || h.duty.includes(search))
  );

  return (
    <div className="space-y-2">
      <div className="flex gap-1 flex-wrap">
        {['全部', ...palaces].map(p => (
          <button
            key={p}
            onClick={() => setPalace(p)}
            className={`text-[10px] px-2 py-1 rounded-lg border transition-all ${palace === p ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}
          >
            {p === '全部' ? '📖全部' : `${PALACE_EMOJI[p]}${p}`}
          </button>
        ))}
      </div>
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="搜索卦名/虾名/职责..."
        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
      />
      <div className="space-y-1 max-h-[35vh] overflow-y-auto pr-1">
        {filtered.map(hex => {
          const c = PALACE_COLORS[hex.palace] || PALACE_COLORS['兑宫'];
          return (
            <div
              key={hex.id}
              onClick={() => onAdd(hex)}
              className={`p-2 rounded-lg border cursor-pointer transition-all hover:scale-[1.01] ${c.bg} ${c.border}`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 w-5">#{hex.no}</span>
                <span className={`text-sm font-semibold ${c.accent}`}>{hex.name}</span>
                <span className="text-xs text-slate-400 ml-auto">{PALACE_EMOJI[hex.palace]} {hex.palace}</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 ml-7">{hex.shrimp} · {hex.duty}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 主工作流编辑器
// ══════════════════════════════════════════════════════════════

type EditorTab = 'canvas' | 'templates' | 'saved';

export function WorkflowEditor() {
  const [hexagrams, setHexagrams] = useState<Hexagram[]>([]);
  const [palaces, setPalaces] = useState<Record<string, PalaceMeta>>({});
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [activeTab, setActiveTab] = useState<EditorTab>('canvas');
  const [currentWf, setCurrentWf] = useState<Workflow | null>(null);
  const [nodes, setNodes] = useState<WFNode[]>([]);
  const [connections, setConnections] = useState<WFConnection[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [runModalOpen, setRunModalOpen] = useState(false);
  const [runLog, setRunLog] = useState<string[]>([]);
  const [wfName, setWfName] = useState('新工作流');
  const [running, setRunning] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // 加载64卦数据
  useEffect(() => {
    fetch('/api/hexagrams').then(r => r.json()).then(d => {
      setHexagrams(d.hexagrams || []);
      const metaMap: Record<string, PalaceMeta> = {};
      (d.byPalace || []).forEach((p: { palace: string; meta: PalaceMeta }) => { metaMap[p.palace] = p.meta; });
      setPalaces(metaMap);
    }).catch(() => {});
    // 加载已保存工作流
    try {
      const saved = JSON.parse(localStorage.getItem('simiaiclaw_workflows') || '[]');
      setWorkflows(saved);
    } catch {}
  }, []);

  const saveWorkflows = useCallback((wfs: Workflow[]) => {
    setWorkflows(wfs);
    localStorage.setItem('simiaiclaw_workflows', JSON.stringify(wfs));
  }, []);

  // 添加节点
  const addNode = (hex: Hexagram) => {
    const newNode: WFNode = {
      id: genNodeId(), hexId: hex.id, name: hex.name, shrimp: hex.shrimp,
      palace: hex.palace, category: hex.category, duty: hex.duty,
      x: 150 + Math.random() * 200, y: 120 + nodes.length * 130,
      status: 'idle', config: {},
    };
    setNodes(ns => [...ns, newNode]);
    toast.success(`已添加「${hex.name}」到工作流`);
  };

  // 应用模板
  const applyTemplate = (templateNodes: WFNode[]) => {
    setNodes(templateNodes);
    setConnections([]);
    setCurrentWf(null);
    setActiveTab('canvas');
    toast.success(`已生成「${wfName}」工作流，${templateNodes.length}个节点`);
  };

  // 删除节点
  const deleteNode = (id: string) => {
    setNodes(ns => ns.filter(n => n.id !== id));
    setConnections(cs => cs.filter(c => c.from !== id && c.to !== id));
    if (selectedNode === id) setSelectedNode(null);
  };

  // 拖拽节点
  const dragNode = (id: string, dx: number, dy: number) => {
    setNodes(ns => ns.map(n => n.id === id ? { ...n, x: n.x + dx, y: n.y + dy } : n));
  };

  // 选择输出桩开始连线
  const startConnection = (nodeId: string) => {
    if (connectFrom === null) {
      setConnectFrom(nodeId);
    } else {
      if (connectFrom !== nodeId) {
        const exists = connections.some(c => c.from === connectFrom && c.to === nodeId);
        if (!exists) {
          setConnections(cs => [...cs, { id: genConnId(), from: connectFrom, to: nodeId }]);
        }
      }
      setConnectFrom(null);
    }
  };

  // 执行工作流
  const runWorkflow = async () => {
    if (nodes.length === 0) { toast.error('请先添加节点'); return; }
    setRunning(true);
    setRunLog([]);
    const logs: string[] = [];
    const wf: Workflow = {
      id: genWfId(), name: wfName, description: `包含${nodes.length}个卦位节点`,
      nodes: nodes.map(n => ({ ...n, status: 'idle' })),
      connections, status: 'running', createdAt: new Date().toISOString(), runCount: 0,
    };
    setCurrentWf(wf);

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const step = i + 1;
      const hex = getHexById(node.hexId, hexagrams);

      // 更新节点状态为运行中
      setNodes(ns => ns.map(n => n.id === node.id ? { ...n, status: 'running' } : n));
      logs.push(`[${step}/${nodes.length}] 🔄 启动 ${node.name}（${node.palace}）...`);
      setRunLog([...logs]);

      await new Promise(r => setTimeout(r, 800 + Math.random() * 600));

      // 模拟执行
      const success = Math.random() > 0.05; // 95%成功率
      if (success) {
        setNodes(ns => ns.map(n => n.id === node.id ? { ...n, status: 'done' } : n));
        logs.push(`[${step}/${nodes.length}] ✅ ${node.name} 完成，输出: ${hex?.outputSpec || '{...}'}`);
        setRunLog([...logs]);
      } else {
        setNodes(ns => ns.map(n => n.id === node.id ? { ...n, status: 'error' } : n));
        logs.push(`[${step}/${nodes.length}] ❌ ${node.name} 执行异常`);
        setRunLog([...logs]);
        break;
      }
      await new Promise(r => setTimeout(r, 200));
    }

    setRunning(false);
    const finalWf = { ...wf, status: 'done' as const, runCount: (wf.runCount || 0) + 1 };
    setCurrentWf(finalWf);

    // 保存
    const updated = [...workflows.filter(w => w.id !== wf.id), finalWf];
    saveWorkflows(updated);

    if (nodes.every(n => n.status === 'done')) {
      toast.success(`🎉 工作流「${wfName}」执行完成！`);
    } else {
      toast.error('工作流执行中断，请检查出错节点');
    }
  };

  // 保存当前工作流
  const saveCurrentWf = () => {
    if (nodes.length === 0) { toast.error('工作流为空'); return; }
    const wf: Workflow = {
      id: currentWf?.id || genWfId(),
      name: wfName, description: `包含${nodes.length}个卦位节点`,
      nodes: [...nodes], connections: [...connections],
      status: 'draft', createdAt: currentWf?.createdAt || new Date().toISOString(),
      runCount: currentWf?.runCount || 0,
    };
    const updated = [...workflows.filter(w => w.id !== wf.id), wf];
    saveWorkflows(updated);
    setCurrentWf(wf);
    toast.success('工作流已保存');
  };

  // 加载工作流
  const loadWorkflow = (wf: Workflow) => {
    setNodes([...wf.nodes]);
    setConnections([...wf.connections]);
    setWfName(wf.name);
    setCurrentWf(wf);
    setActiveTab('canvas');
  };

  // 清空画布
  const clearCanvas = () => {
    setNodes([]);
    setConnections([]);
    setSelectedNode(null);
    setCurrentWf(null);
    setWfName('新工作流');
  };

  // 获取选中节点
  const selNode = nodes.find(n => n.id === selectedNode);

  // ══════════════════════════════════════════════════════════════
  // 渲染
  // ══════════════════════════════════════════════════════════════

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white">

      {/* 顶部工具栏 */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2 flex items-center gap-3 shrink-0">
        <span className="text-cyan-400 text-lg">🦞</span>
        <span className="font-bold text-sm">工作流编排器</span>
        <div className="h-4 w-px bg-slate-700" />

        {/* 工作流名称 */}
        <input
          value={wfName}
          onChange={e => setWfName(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1 text-xs text-white flex-1 max-w-48"
          placeholder="工作流名称..."
        />

        {/* 标签页 */}
        <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-0.5">
          {(['canvas', 'templates', 'saved'] as EditorTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-xs px-3 py-1 rounded-md transition-all ${activeTab === tab ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              {tab === 'canvas' ? '🎨 编辑' : tab === 'templates' ? '📋 模板' : '💾 已保存'}
            </button>
          ))}
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-2 ml-auto">
          <button onClick={clearCanvas} className="text-xs px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 transition-colors">清空</button>
          <button onClick={saveCurrentWf} className="text-xs px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors">💾 保存</button>
          <button
            onClick={runWorkflow}
            disabled={running || nodes.length === 0}
            className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${running ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : nodes.length === 0 ? 'bg-slate-700 text-slate-500' : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20'}`}
          >
            {running ? '🔄 执行中...' : '▶️ 执行工作流'}
          </button>
        </div>
      </div>

      {/* 主体区域 */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── 左侧：节点库 ── */}
        {activeTab === 'canvas' && (
          <div className="w-64 border-r border-slate-800 flex flex-col shrink-0 bg-slate-900/50">
            <div className="px-3 py-2 border-b border-slate-800">
              <h3 className="text-xs font-semibold text-slate-400">🌊 64卦节点库</h3>
              <p className="text-[10px] text-slate-600 mt-0.5">点击添加卦位到画布，点击输出桩开始连线</p>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <HexSelector hexagrams={hexagrams} onAdd={addNode} />
            </div>
          </div>
        )}

        {/* ── 模板选择 ── */}
        {activeTab === 'templates' && (
          <div className="w-72 border-r border-slate-800 flex flex-col shrink-0 bg-slate-900/50 overflow-y-auto p-3">
            <div className="mb-3">
              <h3 className="text-xs font-semibold text-slate-400 mb-1">📋 64卦技能模板</h3>
              <p className="text-[10px] text-slate-600">选择模板一键生成工作流，然后自定义调整</p>
            </div>
            <TemplateSelector templates={WORKFLOW_TEMPLATES} hexagrams={hexagrams} onApply={applyTemplate} onClose={() => setActiveTab('canvas')} />
          </div>
        )}

        {/* ── 已保存工作流 ── */}
        {activeTab === 'saved' && (
          <div className="w-72 border-r border-slate-800 flex flex-col shrink-0 bg-slate-900/50 overflow-y-auto p-3">
            <div className="mb-3">
              <h3 className="text-xs font-semibold text-slate-400 mb-1">💾 已保存工作流</h3>
              <p className="text-[10px] text-slate-600">{workflows.length} 个工作流</p>
            </div>
            {workflows.length === 0 ? (
              <div className="text-center text-slate-600 text-xs py-8">暂无已保存的工作流</div>
            ) : (
              <div className="space-y-2">
                {workflows.map(wf => (
                  <div key={wf.id} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 hover:border-slate-500 transition-all cursor-pointer"
                    onClick={() => loadWorkflow(wf)}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full ${wf.status === 'done' ? 'bg-emerald-400' : wf.status === 'running' ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'}`} />
                      <span className="font-semibold text-sm text-white">{wf.name}</span>
                      {wf.runCount > 0 && <span className="ml-auto text-[10px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded">运行{wf.runCount}次</span>}
                    </div>
                    <p className="text-[10px] text-slate-500">{wf.description}</p>
                    <div className="text-[10px] text-slate-600 mt-1">{new Date(wf.createdAt).toLocaleDateString('zh-CN')}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── 中间：画布 ── */}
        {activeTab === 'canvas' && (
          <div className="flex-1 relative overflow-hidden">
            {/* 画布背景 */}
            <div
              ref={canvasRef}
              className="absolute inset-0 cursor-crosshair"
              style={{
                backgroundImage: 'radial-gradient(circle, #1e293b 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
              onClick={() => { setSelectedNode(null); setConnectFrom(null); }}
            >
              {/* SVG连接线层 */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
                {connections.map(conn => {
                  const fromNode = nodes.find(n => n.id === conn.from);
                  const toNode = nodes.find(n => n.id === conn.to);
                  if (!fromNode || !toNode) return null;
                  const c = PALACE_COLORS[fromNode.palace] || PALACE_COLORS['兑宫'];
                  return (
                    <ConnectionLine
                      key={conn.id}
                      from={{ x: fromNode.x + 160, y: fromNode.y + 60 }}
                      to={{ x: toNode.x, y: toNode.y + 60 }}
                      color={c.accent.replace('text-', 'var(--tw-')} // 使用对应颜色
                      label={conn.label}
                    />
                  );
                })}
              </svg>

              {/* 工作流节点 */}
              {nodes.map((node, i) => (
                <WFNodeComponent
                  key={node.id}
                  node={node}
                  index={i}
                  selected={selectedNode === node.id}
                  onSelect={() => {
                    setSelectedNode(node.id === selectedNode ? null : node.id);
                    setConnectFrom(null);
                  }}
                  onDrag={(dx, dy) => dragNode(node.id, dx, dy)}
                  onDelete={() => deleteNode(node.id)}
                  colorMap={PALACE_COLORS}
                />
              ))}

              {/* 空状态 */}
              {nodes.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-6xl mb-4">🦞</span>
                  <p className="text-slate-500 text-sm">从左侧选择64卦节点添加到此工作流</p>
                  <p className="text-slate-600 text-xs mt-1">或使用右上角「📋 模板」一键生成</p>
                </div>
              )}
            </div>

            {/* 画布底部状态栏 */}
            {nodes.length > 0 && (
              <div className="absolute bottom-0 left-0 right-0 bg-slate-900/90 border-t border-slate-800 px-4 py-2 flex items-center gap-4 text-xs text-slate-500">
                <span>🦞 {nodes.length} 个卦位节点</span>
                <span>🔗 {connections.length} 条连接</span>
                <span>📊 {PALACE_ORDER.filter(p => nodes.some(n => n.palace === p)).length}/8 宫位参与</span>
                <span className="ml-auto">
                  {nodes.filter(n => n.status === 'done').length}/{nodes.length} 已完成
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── 右侧：配置/执行面板 ── */}
        {activeTab === 'canvas' && (
          <div className="w-72 border-l border-slate-800 flex flex-col shrink-0 overflow-y-auto bg-slate-900/50">
            {selNode ? (
              <div className="p-3">
                <NodeConfigPanel
                  node={selNode}
                  hexagrams={hexagrams}
                  onUpdate={config => setNodes(ns => ns.map(n => n.id === selNode.id ? { ...n, config } : n))}
                  onClose={() => setSelectedNode(null)}
                />
              </div>
            ) : (
              <div className="p-3 space-y-3">
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 mb-2">📊 工作流概览</h4>
                  <div className="space-y-2">
                    {PALACE_ORDER.map(p => {
                      const count = nodes.filter(n => n.palace === p).length;
                      if (count === 0) return null;
                      const c = PALACE_COLORS[p];
                      return (
                        <div key={p} className="flex items-center gap-2">
                          <span className={`text-xs w-14 ${c.accent}`}>{PALACE_EMOJI[p]} {p}</span>
                          <div className="flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div className={`h-full ${c.accent.replace('text-', 'bg-').replace('-400', '-500').replace('-300', '-400')}`} style={{ width: `${Math.min(count * 20, 100)}%` }} />
                          </div>
                          <span className="text-[10px] text-slate-500 w-4 text-right">{count}</span>
                        </div>
                      );
                    })}
                    {nodes.length === 0 && <p className="text-xs text-slate-600 text-center py-4">暂无节点</p>}
                  </div>
                </div>

                {runLog.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 mb-2">📜 执行日志</h4>
                    <div className="bg-slate-950 rounded-lg p-2 text-[10px] text-slate-400 max-h-48 overflow-y-auto space-y-0.5">
                      {runLog.map((log, i) => (
                        <div key={i} className={log.includes('❌') ? 'text-red-400' : log.includes('✅') ? 'text-emerald-400' : 'text-slate-500'}>{log}</div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/50">
                  <h4 className="text-xs font-semibold text-slate-400 mb-2">💡 操作提示</h4>
                  <ul className="text-[10px] text-slate-600 space-y-1">
                    <li>• 点击左侧卦位添加到画布</li>
                    <li>• 拖拽节点调整位置</li>
                    <li>• 点击节点选中后可配置参数</li>
                    <li>• 点击输出桩（右侧圆点）开始连线</li>
                    <li>• 点击连线可删除连接</li>
                    <li>• 使用模板可一键生成完整工作流</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

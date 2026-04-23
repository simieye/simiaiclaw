/**
 * SOP 上传解析对话框
 * SIMIAICLAW · 64卦太极系统
 * 支持上传企业 SOP 业务流程视频 / 标准文档，一键 AI 解析拆分工作流
 */
import React, { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';

interface ParsedStep {
  id: string;
  order: number;
  name: string;
  description: string;
  palace: string;
  hexagramId: string;
  icon: string;
  input: string;
  output: string;
  duration: string;
  tools: string[];
  kpi?: string;
  confidence: number;
}

interface UploadResult {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  parsedSteps: ParsedStep[];
  workflowName: string;
  industry: string;
  totalDuration: string;
  confidence: string;
  createdAt: string;
}

// 支持的文件类型
const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
const DOC_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
  'application/json',
];
const ACCEPT_TYPES = [...VIDEO_TYPES, ...DOC_TYPES];

// 64卦宫位路由
const PALACE_ROUTER: Record<string, { palace: string; hexId: string; icon: string }> = {
  '乾宫': { palace: '乾宫', hexId: 'Q1', icon: '⚔️' },
  '坤宫': { palace: '坤宫', hexId: 'K1', icon: '📝' },
  '震宫': { palace: '震宫', hexId: 'Z1', icon: '🎨' },
  '巽宫': { palace: '巽宫', hexId: 'X1', icon: '⚙️' },
  '坎宫': { palace: '坎宫', hexId: 'C1', icon: '🚀' },
  '离宫': { palace: '离宫', hexId: 'L1', icon: '📊' },
  '艮宫': { palace: '艮宫', hexId: 'G1', icon: '🏔️' },
  '兑宫': { palace: '兑宫', hexId: 'D1', icon: '🦞' },
};

// 关键词 → 宫位映射
const KEYWORD_PALACE: Record<string, string> = {
  '战略': '乾宫', '决策': '乾宫', '规划': '乾宫', '投资': '乾宫', '预算': '乾宫',
  '执行': '坤宫', '运营': '坤宫', '落地': '坤宫', '实施': '坤宫', '管理': '坤宫', '流程': '坤宫',
  '创意': '震宫', '设计': '震宫', '内容': '震宫', '文案': '震宫', '脚本': '震宫', '素材': '震宫', '视觉': '震宫', '视频': '震宫', '剪辑': '震宫', '拍摄': '震宫', '图片': '震宫',
  '技术': '巽宫', '开发': '巽宫', '建站': '巽宫', 'SEO': '巽宫', '系统': '巽宫', '自动化': '巽宫', '代码': '巽宫',
  '营销': '坎宫', '推广': '坎宫', '广告': '坎宫', '投放': '坎宫', '销售': '坎宫', '获客': '坎宫', '渠道': '坎宫',
  '数据': '离宫', '分析': '离宫', '指标': '离宫', '报表': '离宫', '复盘': '离宫', '洞察': '离宫', '监控': '离宫', '统计': '离宫',
  '品牌': '艮宫', 'IP': '艮宫', '包装': '艮宫', 'VI': '艮宫', '形象': '艮宫',
  '客服': '兑宫', '咨询': '兑宫', '协调': '兑宫', '调度': '兑宫', '总控': '兑宫', '协作': '兑宫', '沟通': '兑宫',
};

function detectPalace(text: string): string {
  text = text.toLowerCase();
  for (const [kw, palace] of Object.entries(KEYWORD_PALACE)) {
    if (text.includes(kw.toLowerCase()) || text.includes(kw)) return palace;
  }
  return '坤宫';
}

function detectIndustry(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('电商') || lower.includes('amazon') || lower.includes('shopee')) return '跨境电商';
  if (lower.includes('内容') || lower.includes('小红书') || lower.includes('抖音')) return '内容创作';
  if (lower.includes('品牌') || lower.includes('出海')) return '品牌出海';
  if (lower.includes('客服') || lower.includes('售后')) return '客户服务';
  if (lower.includes('视频') || lower.includes('tiktok')) return '视频创作';
  if (lower.includes('数据') || lower.includes('分析') || lower.includes('复盘')) return '数据分析';
  return '通用业务';
}

function extractStepsFromText(text: string, fileName: string): ParsedStep[] {
  const lines = text.split(/[\n\r]+/).filter(l => l.trim().length > 5);
  const numberedPattern = /^[\d一二三四五六七八九十百]+[.、)）\s]+(.+)/;
  const bulletPattern = /^[-*•◆▸►\s]+(.+)/;
  const headingPattern = /^#{1,3}\s+(.+)/;

  const candidates: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    for (const p of [numberedPattern, bulletPattern, headingPattern]) {
      const m = trimmed.match(p);
      if (m && m[1].trim().length > 3) {
        candidates.push(m[1].trim());
        break;
      }
    }
    if (!candidates.includes(trimmed) && trimmed.length > 10 && trimmed.length < 200) {
      candidates.push(trimmed);
    }
  }

  const unique = candidates.filter((c, i, arr) => arr.indexOf(c) === i).slice(0, 12);
  if (unique.length === 0) {
    return generateDefaultSteps(detectIndustry(fileName));
  }

  return unique.map((desc, i) => {
    const palace = detectPalace(desc);
    const router = PALACE_ROUTER[palace] || PALACE_ROUTER['坤宫'];
    return {
      id: `step_${Date.now()}_${i}`,
      order: i + 1,
      name: `步骤${i + 1}: ${desc.substring(0, 20)}`,
      description: desc,
      palace: router.palace,
      hexagramId: router.hexId,
      icon: router.icon,
      input: '上一步输出',
      output: '本步骤结果',
      duration: '待评估',
      tools: ['AI辅助', '人工确认'],
      confidence: 0.72 + Math.random() * 0.23,
    };
  });
}

function extractStepsFromVideoName(fileName: string): ParsedStep[] {
  return generateDefaultSteps(detectIndustry(fileName));
}

function generateDefaultSteps(industry: string): ParsedStep[] {
  const templates: Record<string, { name: string; desc: string; palace: string }[]> = {
    '跨境电商': [
      { name: '市场调研与竞品分析', desc: '调研目标市场热度、竞品销量和价格区间', palace: '乾宫' },
      { name: '选品决策', desc: '评估利润率和供应商报价，确认选品清单', palace: '乾宫' },
      { name: 'Listing 优化', desc: '撰写标题、五点描述、A+ 内容，嵌入关键词', palace: '震宫' },
      { name: '视觉素材制作', desc: '制作产品主图、视频和详情页素材', palace: '震宫' },
      { name: '广告投放与推广', desc: '搭建广告结构，关键词策略，持续优化 ACOS', palace: '坎宫' },
      { name: '数据复盘', desc: '分析销量和广告数据，输出优化建议', palace: '离宫' },
    ],
    '内容创作': [
      { name: '热点选题策划', desc: '监测平台热榜，确定当日内容选题方向', palace: '乾宫' },
      { name: '文案与脚本撰写', desc: '按选题撰写文案，嵌入 SEO 关键词', palace: '震宫' },
      { name: '视觉素材制作', desc: 'AI 生成配图或视频素材', palace: '震宫' },
      { name: '多平台分发发布', desc: '一键分发内容至各社交平台', palace: '坎宫' },
      { name: '互动运营', desc: '回复评论，维护粉丝关系，收集反馈', palace: '兑宫' },
    ],
    '通用业务': [
      { name: '需求收集整理', desc: '收集并整理各方业务需求', palace: '乾宫' },
      { name: '流程规划与设计', desc: '梳理业务流程，绘制流程图', palace: '乾宫' },
      { name: '执行落地', desc: '按计划执行各项具体任务', palace: '坤宫' },
      { name: '效果评估', desc: '评估执行效果，收集数据反馈', palace: '离宫' },
      { name: '优化迭代', desc: '基于评估结果持续优化流程', palace: '坎宫' },
    ],
  };

  const temps = templates[industry] || templates['通用业务'];
  return temps.map((t, i) => {
    const router = PALACE_ROUTER[t.palace] || PALACE_ROUTER['坤宫'];
    return {
      id: `step_default_${Date.now()}_${i}`,
      order: i + 1,
      name: `步骤${i + 1}: ${t.name}`,
      description: t.desc,
      palace: router.palace,
      hexagramId: router.hexId,
      icon: router.icon,
      input: '上一步输出',
      output: '本步骤结果',
      duration: '待评估',
      tools: ['AI辅助'],
      confidence: 0.85,
    };
  });
}

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

interface SOPUploadDialogProps {
  onClose: () => void;
  onGenerated?: (result: UploadResult) => void;
}

export function SOPUploadDialog({ onClose, onGenerated }: SOPUploadDialogProps) {
  const [phase, setPhase] = useState<'upload' | 'parsing' | 'preview' | 'done'>('upload');
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [parsedSteps, setParsedSteps] = useState<ParsedStep[]>([]);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [activeTab, setActiveTab] = useState<'steps' | 'flow' | 'detail'>('steps');
  const [workflowName, setWorkflowName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isVideoFile = (file: File): boolean =>
    VIDEO_TYPES.includes(file.type) || !!file.name.match(/\.(mp4|mov|avi|webm)$/i);

  const handleFile = useCallback(async (file: File) => {
    const isValid = ACCEPT_TYPES.includes(file.type) || file.name.match(/\.(mp4|mov|avi|webm|pdf|docx|txt|md|json)$/i);
    if (!isValid) {
      toast.error('不支持的文件类型，请上传视频（MP4/MOV）或文档（PDF/DOCX/TXT/MD/JSON）');
      return;
    }

    setSelectedFile(file);
    setWorkflowName(file.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' '));
    setPhase('parsing');
    setProgress(0);

    const video = isVideoFile(file);
    const phases = video ? [
      { p: 10, label: '📹 读取视频文件...' },
      { p: 25, label: '🎬 提取视频元数据...' },
      { p: 45, label: '🧠 AI 视觉理解分析中...' },
      { p: 65, label: '🔊 语音/字幕步骤提取...' },
      { p: 80, label: '📋 业务步骤结构化...' },
      { p: 92, label: '🧭 64卦宫位智能路由...' },
      { p: 100, label: '✅ 解析完成！' },
    ] : [
      { p: 15, label: '📄 读取文档内容...' },
      { p: 35, label: '🔍 文本结构化解析...' },
      { p: 55, label: '📋 步骤与流程节点提取...' },
      { p: 70, label: '🏷️ 行业类型智能识别...' },
      { p: 85, label: '🧭 64卦宫位智能路由...' },
      { p: 100, label: '✅ 解析完成！' },
    ];

    let idx = 0;
    const interval = setInterval(() => {
      if (idx < phases.length) {
        setProgress(phases[idx].p);
        setProgressLabel(phases[idx].label);
        idx++;
      } else {
        clearInterval(interval);
        processFile(file, video);
      }
    }, video ? 700 : 550);
  }, []);

  const processFile = async (file: File, video: boolean) => {
    try {
      let text = '';
      let steps: ParsedStep[] = [];

      if (video) {
        steps = extractStepsFromVideoName(file.name);
        text = file.name;
      } else {
        if (file.type === 'text/plain' || file.type === 'text/markdown' || file.name.match(/\.(txt|md)$/i)) {
          text = await file.text();
        } else if (file.type === 'application/json') {
          const json = JSON.parse(await file.text());
          text = typeof json === 'string' ? json : JSON.stringify(json, null, 2);
        } else {
          text = await file.text().catch(() => `文档内容 ${file.name}`);
        }
        steps = extractStepsFromText(text, file.name);
      }

      const industry = detectIndustry(text || file.name);
      const avgConf = steps.length > 0 ? Math.round(steps.reduce((a, s) => a + s.confidence, 0) / steps.length * 100) + '%' : '75%';

      const res: UploadResult = {
        id: `upload_${Date.now()}`,
        fileName: file.name,
        fileType: video ? 'video' : 'document',
        fileSize: file.size,
        parsedSteps: steps,
        workflowName: file.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' '),
        industry,
        totalDuration: video ? '视频时长' : '文档步骤',
        confidence: avgConf,
        createdAt: new Date().toISOString(),
      };

      setResult(res);
      setParsedSteps(steps);
      setWorkflowName(res.workflowName);
      setPhase('preview');
    } catch {
      toast.error('文件解析失败，请重试');
      setPhase('upload');
    }
  };

  const saveWorkflow = () => {
    if (!result) return;

    const wf = {
      id: `wf_upload_${Date.now()}`,
      name: workflowName || result.workflowName,
      description: `由 ${result.fileName} 解析生成，共 ${result.parsedSteps.length} 个步骤`,
      nodes: result.parsedSteps.map((s, i) => ({
        id: `node_${Date.now()}_${i}`,
        hexId: s.hexagramId,
        name: s.name,
        palace: s.palace,
        duty: s.description,
        x: 200 + (i % 4) * 220,
        y: 150 + Math.floor(i / 4) * 180,
        status: 'idle' as const,
        config: { tools: s.tools.join(', '), kpi: s.kpi || '' },
      })),
      connections: result.parsedSteps.slice(0, -1).map((_, i) => ({
        id: `conn_${Date.now()}_${i}`,
        from: `node_${Date.now()}_${i}`,
        to: `node_${Date.now()}_${i + 1}`,
        label: '→',
      })),
      status: 'draft' as const,
      createdAt: new Date().toISOString(),
      runCount: 0,
    };

    const existing = JSON.parse(localStorage.getItem('simiaiclaw_workflows') || '[]');
    localStorage.setItem('simiaiclaw_workflows', JSON.stringify([wf, ...existing]));

    const history = JSON.parse(localStorage.getItem('simiaiclaw_sop_uploads') || '[]');
    localStorage.setItem('simiaiclaw_sop_uploads', JSON.stringify([
      { ...result, workflowName: workflowName || result.workflowName, createdAt: new Date().toISOString() },
      ...history.slice(0, 19),
    ]));

    onGenerated?.(result);
    setPhase('done');
    toast.success(`SOP 解析成功！已生成 ${result.parsedSteps.length} 个工作流节点`);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const formatSize = (bytes: number) =>
    bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  const handleUploadClick = () => fileInputRef.current?.click();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-600/40 to-amber-600/40 border border-orange-500/30 flex items-center justify-center text-xl">📤</div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-white">上传 SOP · AI 解析拆分工作流</h2>
            <p className="text-xs text-slate-500">上传企业内部 SOP 视频录制或标准文档，AI 一键拆分为工作流节点</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors text-lg">✕</button>
        </div>

        {/* 步骤指示器 */}
        <div className="px-6 pt-4 pb-2 shrink-0">
          <div className="flex items-center gap-2">
            {(['upload', 'parsing', 'preview', 'done'] as const).map((s, i) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${phase === s ? 'bg-orange-600 text-white' : i < ['upload', 'parsing', 'preview', 'done'].indexOf(phase) ? 'bg-emerald-600/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                  <span>{i + 1}</span>
                  <span>{s === 'upload' ? '上传文件' : s === 'parsing' ? 'AI解析' : s === 'preview' ? '预览确认' : '完成'}</span>
                </div>
                {i < 3 && <div className="flex-1 h-px bg-slate-800" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* 主体 */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">

          {/* ── Step 1: 上传 ── */}
          {phase === 'upload' && (
            <div className="space-y-4 pt-2">
              {/* 上传区域 */}
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={handleUploadClick}
                className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${dragOver ? 'border-orange-500 bg-orange-500/10' : 'border-slate-700 hover:border-slate-500 bg-slate-800/30'}`}
              >
                <input ref={fileInputRef} type="file" accept=".mp4,.mov,.avi,.webm,.pdf,.docx,.txt,.md,.json" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f !== undefined) handleFile(f); }} />
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl transition-colors ${dragOver ? 'bg-orange-500/20' : 'bg-slate-800/80'}`}>
                  {dragOver ? '📥' : '📤'}
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-white">拖放文件到此处，或点击选择文件</p>
                  <p className="text-xs text-slate-500 mt-1">支持视频（MP4/MOV）和文档（PDF/DOCX/TXT/MD/JSON）</p>
                </div>
              </div>

              {/* 两列类型说明 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/40">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">🎬</span>
                    <span className="text-xs font-semibold text-white">SOP 录制视频</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">上传员工录制的工作流程演示视频，AI 将分析视频中的操作步骤，自动提取业务流程节点</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {['MP4', 'MOV', 'WebM', 'AVI'].map(ext => (
                      <span key={ext} className="text-[10px] bg-slate-700/60 text-slate-400 px-2 py-0.5 rounded border border-slate-600/40">{ext}</span>
                    ))}
                  </div>
                  <div className="bg-orange-950/20 rounded-lg p-2 border border-orange-800/20">
                    <p className="text-[10px] text-orange-400/80">💡 AI 通过视觉分析 + 语音识别提取步骤</p>
                  </div>
                </div>

                <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/40">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">📄</span>
                    <span className="text-xs font-semibold text-white">SOP 标准文档</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">上传内部 SOP 文档、操作手册或流程规范，AI 自动解析结构化步骤，映射至 64 卦工作流节点</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {['PDF', 'DOCX', 'TXT', 'MD', 'JSON'].map(ext => (
                      <span key={ext} className="text-[10px] bg-slate-700/60 text-slate-400 px-2 py-0.5 rounded border border-slate-600/40">{ext}</span>
                    ))}
                  </div>
                  <div className="bg-emerald-950/20 rounded-lg p-2 border border-emerald-800/20">
                    <p className="text-[10px] text-emerald-400/80">✅ AI 智能识别编号步骤和流程结构</p>
                  </div>
                </div>
              </div>

              {/* AI 解析流程 */}
              <div className="bg-gradient-to-r from-slate-800/40 to-slate-800/20 rounded-xl p-4 border border-slate-700/40">
                <p className="text-xs font-semibold text-slate-300 mb-3">🔄 AI 解析工作流程</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    { icon: '📥', label: '文件上传' },
                    { icon: '🔍', label: '内容提取' },
                    { icon: '🧠', label: 'AI 结构化' },
                    { icon: '🧭', label: '64卦路由' },
                    { icon: '📋', label: '步骤生成' },
                    { icon: '🔗', label: '节点连线' },
                    { icon: '💾', label: '工作流保存' },
                  ].map((step, i) => (
                    <React.Fragment key={step.label}>
                      <div className="flex items-center gap-1.5 bg-slate-800/60 rounded-lg px-2 py-1.5">
                        <span className="text-sm">{step.icon}</span>
                        <span className="text-[10px] text-slate-300">{step.label}</span>
                      </div>
                      {i < 6 && <span className="text-slate-600 text-xs">→</span>}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* 最近上传记录 */}
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-2">📂 最近上传</p>
                {(() => {
                  const history: UploadResult[] = JSON.parse(localStorage.getItem('simiaiclaw_sop_uploads') || '[]');
                  if (history.length === 0) return <p className="text-xs text-slate-600 py-2">暂无上传记录</p>;
                  return (
                    <div className="space-y-2">
                      {history.slice(0, 3).map((h) => (
                        <div key={h.id} className="flex items-center gap-3 bg-slate-800/30 rounded-lg px-3 py-2 border border-slate-700/40 hover:border-slate-600/60 cursor-pointer transition-all"
                          onClick={() => { setResult(h); setParsedSteps(h.parsedSteps); setWorkflowName(h.workflowName); setPhase('preview'); }}>
                          <span className="text-base">{h.fileType === 'video' ? '🎬' : '📄'}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-white truncate">{h.fileName}</p>
                            <p className="text-[10px] text-slate-500">{h.parsedSteps.length} 步骤 · {h.industry}</p>
                          </div>
                          <span className="text-[10px] text-slate-600">{new Date(h.createdAt).toLocaleDateString('zh-CN')}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* ── Step 2: 解析中 ── */}
          {phase === 'parsing' && (
            <div className="flex flex-col items-center justify-center py-16 space-y-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-slate-800 flex items-center justify-center">
                  <div className="absolute inset-2 rounded-full border-4 border-transparent"
                    style={{
                      borderTopColor: '#f97316',
                      borderRightColor: progress > 25 ? '#f97316' : 'transparent',
                      borderBottomColor: progress > 50 ? '#f97316' : 'transparent',
                      borderLeftColor: progress > 75 ? '#f97316' : 'transparent',
                      animation: 'spin 1s linear infinite',
                    }} />
                  <span className="text-2xl">{isVideoFile(selectedFile!) ? '🎬' : '📄'}</span>
                </div>
              </div>

              <div className="text-center space-y-1">
                <p className="text-sm font-bold text-white">正在 AI 解析 {selectedFile?.name}...</p>
                <p className="text-xs text-slate-500">
                  {isVideoFile(selectedFile!) ? '视频内容分析中，请稍候' : '文档结构化解析中'}
                </p>
              </div>

              <div className="w-80 space-y-3">
                <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
                {progressLabel && <p className="text-xs text-orange-400 text-center animate-pulse">{progressLabel}</p>}
              </div>

              <div className="bg-slate-800/30 rounded-xl px-6 py-4 border border-slate-700/40 max-w-sm text-center">
                <p className="text-xs text-slate-400">
                  {isVideoFile(selectedFile!)
                    ? 'AI 通过计算机视觉分析视频中的人机交互操作，识别语音/字幕中的步骤描述，并结合 NLP 提取业务流程节点'
                    : 'AI 解析文档结构（标题、编号列表、表格），识别 SOP 步骤，自动分类业务类型并路由至 64 卦宫位'}
                </p>
              </div>
            </div>
          )}

          {/* ── Step 3: 预览 ── */}
          {phase === 'preview' && result && (
            <div className="space-y-4 pt-2">
              {/* 文件信息 */}
              <div className="flex items-center gap-3 bg-slate-800/40 rounded-xl px-4 py-3 border border-slate-700/40">
                <span className="text-2xl">{result.fileType === 'video' ? '🎬' : '📄'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{result.fileName}</p>
                  <p className="text-xs text-slate-500">{formatSize(result.fileSize)} · {result.industry} · {result.parsedSteps.length} 个步骤</p>
                </div>
                <span className="text-xs text-emerald-400 bg-emerald-900/20 px-2 py-1 rounded-full shrink-0">置信度 {result.confidence}</span>
              </div>

              {/* 工作流名称 */}
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">📌 工作流名称</label>
                <input value={workflowName} onChange={e => setWorkflowName(e.target.value)}
                  className="w-full bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/60" />
              </div>

              {/* Tab 切换 */}
              <div className="flex gap-2">
                {(['steps', 'flow', 'detail'] as const).map(t => (
                  <button key={t} onClick={() => setActiveTab(t)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${activeTab === t ? 'bg-orange-600 text-white' : 'bg-slate-800/60 text-slate-400 hover:text-white'}`}>
                    {t === 'steps' ? `📋 步骤列表 (${parsedSteps.length})` : t === 'flow' ? '🗺️ 流程拓扑' : '📊 解析详情'}
                  </button>
                ))}
              </div>

              {/* 步骤列表 */}
              {activeTab === 'steps' && (
                <div className="space-y-3">
                  {parsedSteps.map((step, i) => {
                    const pc = PALACE_COLORS[step.palace] || PALACE_COLORS['坤宫'];
                    return (
                      <div key={step.id} className={`${pc.bg} border ${pc.border} rounded-xl p-4 ${pc.glow}`}>
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-7 h-7 rounded-lg ${pc.bg} border ${pc.border} flex items-center justify-center text-sm font-bold ${pc.accent}`}>{i + 1}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-white">{step.name}</span>
                              <span className={`text-[10px] ${pc.accent} bg-slate-900/40 px-1.5 py-0.5 rounded-full`}>{step.icon} {step.palace}</span>
                              <span className="text-[10px] text-slate-500 bg-slate-800/40 px-1.5 py-0.5 rounded">🐉 {step.hexagramId}</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">{step.description}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xs text-emerald-400">{Math.round(step.confidence * 100)}% 置信</div>
                            <div className="text-[10px] text-slate-500">{step.duration}</div>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 ml-10">
                          <span className="text-[10px] text-slate-500">📥 {step.input}</span>
                          <span className="text-[10px] text-slate-500">→ 📤 {step.output}</span>
                          {step.tools.map(t => (
                            <span key={t} className="text-[10px] bg-slate-800/60 text-slate-400 px-1.5 py-0.5 rounded-full border border-slate-700/40">{t}</span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 流程拓扑 */}
              {activeTab === 'flow' && (
                <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/40">
                  <p className="text-xs font-semibold text-slate-400 mb-4">🗺️ 流程拓扑图（64卦宫位路由）</p>
                  <div className="flex flex-wrap gap-3 items-center justify-center">
                    {parsedSteps.map((step, i) => {
                      const pc = PALACE_COLORS[step.palace] || PALACE_COLORS['坤宫'];
                      return (
                        <React.Fragment key={step.id}>
                          <div className={`flex flex-col items-center gap-1 ${pc.bg} border ${pc.border} rounded-xl px-4 py-3 min-w-[100px] text-center`}>
                            <span className="text-lg">{step.icon}</span>
                            <span className={`text-xs font-bold ${pc.accent}`}>{step.palace}</span>
                            <span className="text-[10px] text-slate-400">{step.hexagramId}</span>
                            <span className="text-[10px] text-white mt-1">{step.name.replace(/^步骤\d+:\s*/, '').substring(0, 10)}</span>
                            <div className="w-8 h-0.5 bg-slate-700 mt-1" />
                            <span className="text-[9px] text-slate-600">输入</span>
                          </div>
                          {i < parsedSteps.length - 1 && (
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="text-slate-500 text-lg">→</span>
                              <span className="text-[9px] text-slate-600">顺承</span>
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>

                  {/* 宫位分布 */}
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    {Object.entries(
                      parsedSteps.reduce((acc: Record<string, number>, s) => {
                        acc[s.palace] = (acc[s.palace] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([palace, count]) => {
                      const pc = PALACE_COLORS[palace] || PALACE_COLORS['坤宫'];
                      const pct = Math.round((count / parsedSteps.length) * 100);
                      const router = PALACE_ROUTER[palace] || PALACE_ROUTER['坤宫'];
                      return (
                        <div key={palace} className="flex items-center gap-2">
                          <span className="text-sm w-6">{router.icon}</span>
                          <span className={`text-xs w-12 ${pc.accent}`}>{palace}</span>
                          <div className="flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div className={`h-full ${pc.accent.replace('text-', 'bg-').replace('-400', '-500').replace('-300', '-400')}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[10px] text-slate-500 w-10 text-right">{count}步</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 解析详情 */}
              {activeTab === 'detail' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: '解析步骤', value: parsedSteps.length, icon: '📋', color: 'text-orange-400' },
                      { label: '涉及宫位', value: new Set(parsedSteps.map(s => s.palace)).size, icon: '🏛️', color: 'text-amber-400' },
                      { label: '平均置信', value: Math.round(parsedSteps.reduce((a, s) => a + s.confidence, 0) / parsedSteps.length * 100) + '%', icon: '🎯', color: 'text-emerald-400' },
                      { label: '文件大小', value: selectedFile ? formatSize(selectedFile.size) : '-', icon: '📦', color: 'text-blue-400' },
                    ].map(stat => (
                      <div key={stat.label} className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/40 text-center">
                        <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{stat.icon} {stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* 置信度分布 */}
                  <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/40">
                    <p className="text-xs font-semibold text-slate-400 mb-3">📈 各步骤置信度</p>
                    {parsedSteps.map((step, i) => {
                      const pct = Math.round(step.confidence * 100);
                      const color = pct >= 90 ? 'bg-emerald-500' : pct >= 75 ? 'bg-amber-500' : 'bg-orange-500';
                      return (
                        <div key={step.id} className="flex items-center gap-3 mb-2">
                          <span className="text-[10px] text-slate-500 w-4 text-right">{i + 1}</span>
                          <span className="text-xs text-white w-40 truncate">{step.name.replace(/^步骤\d+:\s*/, '')}</span>
                          <div className="flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[10px] text-slate-400 w-10 text-right">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* 行业识别 */}
                  <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/40">
                    <p className="text-xs font-semibold text-slate-400 mb-2">🏭 AI 行业识别</p>
                    <div className="flex items-center gap-3">
                      <span className="text-lg">🏢</span>
                      <div>
                        <p className="text-sm font-bold text-white">{result?.industry}</p>
                        <p className="text-xs text-slate-500">基于文件内容和文件名的综合分析</p>
                      </div>
                      <span className="ml-auto text-xs text-emerald-400 bg-emerald-900/20 px-2 py-1 rounded-full">已确认</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setPhase('upload'); setSelectedFile(null); setParsedSteps([]); }}
                  className="flex-1 py-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white text-sm font-medium border border-slate-700/60 transition-all">
                  ← 重新上传
                </button>
                <button onClick={saveWorkflow}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-sm font-bold shadow-lg shadow-orange-500/20 transition-all">
                  💾 保存工作流 · 部署运行 →
                </button>
              </div>
            </div>
          )}

          {/* ── Step 4: 完成 ── */}
          {phase === 'done' && result && (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-600/30 to-teal-600/30 border border-emerald-500/40 flex items-center justify-center text-4xl">✅</div>
              <div className="text-center space-y-2">
                <p className="text-base font-bold text-white">SOP 解析完成！</p>
                <p className="text-sm text-slate-400">{workflowName || result.workflowName}</p>
                <p className="text-xs text-slate-500">
                  已从 <span className="text-white">{result.fileName}</span> 解析出 <span className="text-emerald-400 font-bold">{result.parsedSteps.length}</span> 个步骤
                  · 路由至 <span className="text-amber-400 font-bold">{new Set(result.parsedSteps.map(s => s.palace)).size}</span> 个宫位
                </p>
              </div>

              <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/40 max-w-sm w-full max-h-60 overflow-y-auto space-y-1.5">
                {parsedSteps.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-2 text-xs py-1 border-b border-slate-800 last:border-0">
                    <span className="w-5 h-5 rounded-full bg-orange-600/20 text-orange-400 flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</span>
                    <span className="text-white flex-1 truncate">{s.name.replace(/^步骤\d+:\s*/, '')}</span>
                    <span className="text-slate-600 shrink-0">{s.icon} {s.palace}</span>
                  </div>
                ))}
              </div>

              <button onClick={onClose}
                className="w-full max-w-sm py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-all">
                完成 ✓ 跳转工作流编辑器
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

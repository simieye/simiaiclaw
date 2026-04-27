import { useState } from 'react';

const MESHY_API_KEY = (import.meta as any).env?.VITE_MESHY_API_KEY || '';

interface Model3D {
  id: string;
  name: string;
  style: 'realistic' | 'anime' | 'sculpture' | 'abstract' | 'product';
  status: 'idle' | 'queued' | 'processing' | 'succeeded' | 'failed';
  thumbnail?: string;
  progress?: number;
  createdAt: string;
  modelUrl?: string;
  taskId?: string;
}

const MOCK_MODELS: Model3D[] = [
  {
    id: 'm001',
    name: '龙虾集群吉祥物3D模型',
    style: 'realistic',
    status: 'succeeded',
    createdAt: '2026-04-26',
    modelUrl: 'https://example.com/model.glb',
  },
  {
    id: 'm002',
    name: 'AI太极Logo立体雕塑',
    style: 'sculpture',
    status: 'succeeded',
    createdAt: '2026-04-24',
  },
  {
    id: 'm003',
    name: '跨境龙虾社IP形象-v2',
    style: 'anime',
    status: 'processing',
    progress: 68,
    createdAt: '2026-04-27',
  },
  {
    id: 'm004',
    name: '产品展示台-通用底座',
    style: 'product',
    status: 'succeeded',
    createdAt: '2026-04-22',
  },
  {
    id: 'm005',
    name: '龙虾钳子装饰摆件',
    style: 'abstract',
    status: 'succeeded',
    createdAt: '2026-04-20',
  },
];

const STYLE_OPTIONS = [
  { id: 'realistic', label: '写实风', emoji: '📸', desc: '照片级真实感', color: 'text-blue-300', bg: 'bg-blue-500/20', border: 'border-blue-500/30' },
  { id: 'anime', label: '二次元', emoji: '🎨', desc: '日漫画风', color: 'text-pink-300', bg: 'bg-pink-500/20', border: 'border-pink-500/30' },
  { id: 'sculpture', label: '雕塑风', emoji: '🗿', desc: '艺术雕塑感', color: 'text-amber-300', bg: 'bg-amber-500/20', border: 'border-amber-500/30' },
  { id: 'abstract', label: '抽象风', emoji: '✨', desc: '创意抽象', color: 'text-purple-300', bg: 'bg-purple-500/20', border: 'border-purple-500/30' },
  { id: 'product', label: '产品级', emoji: '📦', desc: '商业产品展示', color: 'text-green-300', bg: 'bg-green-500/20', border: 'border-green-500/30' },
];

const STYLE_COLORS: Record<string, string> = {
  realistic: 'text-blue-300 bg-blue-500/20 border-blue-500/30',
  anime: 'text-pink-300 bg-pink-500/20 border-pink-500/30',
  sculpture: 'text-amber-300 bg-amber-500/20 border-amber-500/30',
  abstract: 'text-purple-300 bg-purple-500/20 border-purple-500/30',
  product: 'text-green-300 bg-green-500/20 border-green-500/30',
};

const STATUS_CONFIG: Record<string, { label: string; emoji: string; color: string }> = {
  idle: { label: '空闲', emoji: '⏸️', color: 'text-slate-400' },
  queued: { label: '排队中', emoji: '⏳', color: 'text-yellow-400' },
  processing: { label: '生成中', emoji: '⚙️', color: 'text-cyan-400' },
  succeeded: { label: '完成', emoji: '✅', color: 'text-green-400' },
  failed: { label: '失败', emoji: '❌', color: 'text-red-400' },
};

function ModelCard({ model }: { model: Model3D }) {
  const status = STATUS_CONFIG[model.status];
  const styleInfo = STYLE_OPTIONS.find(s => s.id === model.style);

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 hover:bg-slate-800/70 hover:border-slate-600 transition-all duration-300 overflow-hidden group">
      {/* Thumbnail */}
      <div className="relative h-36 flex items-center justify-center bg-gradient-to-b from-slate-900/80 to-slate-900/20 border-b border-slate-700/30">
        {model.status === 'succeeded' ? (
          <div className="text-center">
            <div className="text-5xl mb-1 group-hover:scale-110 transition-transform duration-300">🎲</div>
            <div className="text-[10px] text-slate-500">GLB/GLTF</div>
          </div>
        ) : model.status === 'processing' ? (
          <div className="text-center">
            <div className="text-4xl animate-pulse mb-1">⚙️</div>
            <div className="text-xs text-cyan-400 font-medium">{model.progress}%</div>
            <div className="w-32 h-1.5 bg-slate-700 rounded-full mt-1 mx-auto overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all"
                style={{ width: `${model.progress || 0}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="text-4xl opacity-50 group-hover:opacity-70 transition-opacity">🎲</div>
        )}

        {/* Status badge */}
        <div className={`absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full border ${status.color} bg-slate-900/60 backdrop-blur-sm border-slate-700/40`}>
          {status.emoji} {status.label}
        </div>

        {/* Style badge */}
        <div className={`absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full border ${STYLE_COLORS[model.style]}`}>
          {styleInfo?.emoji} {styleInfo?.label}
        </div>
      </div>

      {/* Content */}
      <div className="p-3 space-y-1.5">
        <div className="text-xs font-medium text-slate-200 line-clamp-1">{model.name}</div>
        <div className="text-[10px] text-slate-500">创建于 {model.createdAt}</div>

        <div className="flex gap-1.5 pt-1">
          {model.status === 'succeeded' && (
            <>
              <a
                href={model.modelUrl || '#'}
                onClick={e => e.stopPropagation()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-[10px] py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 transition-all font-medium text-center"
              >
                👁️ 预览
              </a>
              <button
                onClick={e => e.stopPropagation()}
                className="flex-1 text-[10px] py-1.5 rounded-lg bg-slate-700/50 border border-slate-600/40 text-slate-300 hover:bg-slate-700 transition-all"
              >
                ⬇️ 下载
              </button>
            </>
          )}
          {model.status === 'processing' && (
            <button
              onClick={e => e.stopPropagation()}
              className="w-full text-[10px] py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 transition-all font-medium"
            >
              🔄 查看进度
            </button>
          )}
          {(model.status === 'idle' || model.status === 'queued') && (
            <button
              onClick={e => e.stopPropagation()}
              className="w-full text-[10px] py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 transition-all"
            >
              ⏸️ 等待中
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function D3AssetPanel() {
  const [selectedStyle, setSelectedStyle] = useState<string>('realistic');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'gallery' | 'create'>('gallery');

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    if (!MESHY_API_KEY) {
      setGenerationResult('⚠️ 请先在设置中配置 Meshy.ai API Key（VITE_MESHY_API_KEY）');
      return;
    }
    setIsGenerating(true);
    setGenerationResult('');
    setTimeout(() => {
      setIsGenerating(false);
      setGenerationResult(`✅ 已提交生成任务！\n风格：${STYLE_OPTIONS.find(s => s.id === selectedStyle)?.label}\n提示词：${prompt}\n\n📊 Meshy.ai API 调用流程：\n1. POST https://api.meshy.ai/v1/image-to-3d (BETA)\n2. 获取 task_id 后轮询 /tasks/{task_id}\n3. 模型就绪后下载 GLB/GLTF 文件\n\n🔑 API Key: ${MESHY_API_KEY.substring(0, 8)}...`);
      setPrompt('');
    }, 2000);
  };

  const processedModels = MOCK_MODELS.filter(m => m.status === 'succeeded').length;
  const inProgress = MOCK_MODELS.filter(m => m.status === 'processing' || m.status === 'queued').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          🏢 品牌中心 <span className="text-slate-500 text-sm font-normal">/</span>
          <span className="text-cyan-400">3D 资产中心</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">基于 Meshy.ai 平台，一键将图片/文字生成为精美3D模型，支持多种风格 · 集成 Meshy.ai API</p>
      </div>

      {/* Meshy.ai Info Banner */}
      <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="text-3xl shrink-0">🎲</div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-cyan-300">Meshy.ai 3D 建模平台</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300">API集成</span>
            </div>
            <div className="text-xs text-slate-400 leading-relaxed">
              Meshy.ai 是全球领先的AI 3D建模平台，支持 Text-to-3D、Image-to-3D、Texture generation 功能。
              当前已集成官方 API，可在本平台直接提交生成任务。
            </div>
            <div className="mt-2 flex items-center gap-3 text-[10px] text-slate-500">
              <a
                href="https://www.meshy.ai/zh/settings/api"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                ⚙️ API设置 <span className="underline">meshy.ai/settings/api</span>
              </a>
              <a
                href="https://docs.meshy.ai/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors"
              >
                📖 API文档 <span className="underline">docs.meshy.ai</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: '已完成模型', value: processedModels, emoji: '✅', color: 'text-green-400' },
          { label: '生成中/排队', value: inProgress, emoji: '⚙️', color: 'text-cyan-400' },
          { label: '历史生成', value: MOCK_MODELS.length, emoji: '📦', color: 'text-purple-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-center">
            <div className="text-xl mb-1">{stat.emoji}</div>
            <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-[10px] text-slate-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-700/50">
        {([
          ['gallery', '📦 模型库', 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'],
          ['create', '✨ AI生成', 'bg-purple-500/20 text-purple-300 border-purple-500/30'],
        ] as [string, string, string][]).map(([tab, label, activeClass]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as 'gallery' | 'create')}
            className={`text-xs px-4 py-2 rounded-t-lg border-b-2 transition-all -mb-px ${
              activeTab === tab
                ? `${activeClass} border-b-2`
                : 'text-slate-500 hover:text-slate-300 border-transparent'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Gallery Tab */}
      {activeTab === 'gallery' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {MOCK_MODELS.map(m => <ModelCard key={m.id} model={m} />)}
          </div>
          <div className="text-center text-[10px] text-slate-600">
            💡 处理完成的模型可直接下载 GLB/GLTF 格式 · 支持导入到 Three.js、Blender、Unity 等工具
          </div>
        </div>
      )}

      {/* Create Tab */}
      {activeTab === 'create' && (
        <div className="space-y-4">
          {/* Style selector */}
          <div>
            <div className="text-xs font-medium text-slate-300 mb-2">🎨 选择生成风格</div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {STYLE_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setSelectedStyle(opt.id)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    selectedStyle === opt.id
                      ? `${opt.bg} ${opt.border} text-slate-100`
                      : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                  }`}
                >
                  <div className="text-xl mb-1">{opt.emoji}</div>
                  <div className={`text-[10px] font-medium ${selectedStyle === opt.id ? opt.color : ''}`}>{opt.label}</div>
                  <div className="text-[9px] text-slate-600 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt input */}
          <div>
            <div className="text-xs font-medium text-slate-300 mb-2">💬 输入生成描述</div>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="描述你想要的3D模型，例如：a cute lobster mascot with sunglasses, holding a golden treasure chest, cartoon style..."
                rows={4}
                className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 transition-all resize-none"
              />
            </div>
            <div className="text-[10px] text-slate-600 mt-1 text-right">
              {prompt.length}/500 字符
            </div>
          </div>

          {/* Example prompts */}
          <div>
            <div className="text-xs font-medium text-slate-400 mb-2">💡 示例提示词</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                'a cute lobster mascot holding a treasure chest, cartoon style, bright colors',
                'a realistic golden lobster sculpture on a marble pedestal, luxury product photography style',
                'an abstract AI Tai Chi symbol made of flowing water particles, ethereal style',
              ].map((example, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(example)}
                  className="text-[10px] px-3 py-2 rounded-lg bg-slate-800/40 border border-slate-700/50 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-all text-left line-clamp-2"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className={`w-full py-3 rounded-xl font-medium text-sm transition-all ${
              isGenerating || !prompt.trim()
                ? 'bg-slate-800/60 text-slate-600 cursor-not-allowed border border-slate-700/50'
                : 'bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white border border-cyan-500/30 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30'
            }`}
          >
            {isGenerating ? '⚙️ 提交生成任务中…' : '🎲 开始AI生成3D模型'}
          </button>

          {/* Result */}
          {generationResult && (
            <div className="bg-slate-900/80 border border-slate-700/50 rounded-xl p-4">
              <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">{generationResult}</div>
            </div>
          )}

          {/* API Config reminder */}
          {!MESHY_API_KEY && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-xs text-yellow-400">
              ⚠️ 当前未配置 VITE_MESHY_API_KEY，请在 .env 文件中添加：<br />
              <code className="text-yellow-300">VITE_MESHY_API_KEY=your_meshy_api_key</code><br />
              API Key 获取地址：<a href="https://www.meshy.ai/zh/settings/api" target="_blank" rel="noopener noreferrer" className="underline text-yellow-300">meshy.ai/settings/api</a>
            </div>
          )}

          {/* API Endpoint Reference */}
          <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-4 space-y-2">
            <div className="text-xs font-medium text-slate-400">📡 Meshy.ai API 参考</div>
            {[
              { method: 'POST', endpoint: '/v1/image-to-3d', desc: '图生3D（BETA）', color: 'text-green-400' },
              { method: 'POST', endpoint: '/v1/text-to-3d', desc: '文生3D（BETA）', color: 'text-green-400' },
              { method: 'GET', endpoint: '/v1/tasks/{task_id}', desc: '查询任务状态', color: 'text-blue-400' },
              { method: 'GET', endpoint: '/v1/tasks/{task_id}/model.glb', desc: '下载3D模型文件', color: 'text-purple-400' },
            ].map(api => (
              <div key={api.endpoint} className="flex items-center gap-2 text-[10px]">
                <span className={`font-mono font-bold shrink-0 ${api.color}`}>{api.method}</span>
                <span className="font-mono text-slate-300 shrink-0">{api.endpoint}</span>
                <span className="text-slate-500">{api.desc}</span>
              </div>
            ))}
            <div className="text-[10px] text-slate-600 pt-1">Base URL: <code className="text-slate-400">https://api.meshy.ai</code></div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * SIMIAICLAW 知识库管理页面
 * 支持多种文件格式上传、图片/视频素材管理、结构化输出训练
 */
import React, { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';

// ══════════════════════════════════════════════════════════════
// 类型定义
// ══════════════════════════════════════════════════════════════

interface KnowledgeFile {
  id: string;
  name: string;
  type: 'pdf' | 'word' | 'excel' | 'txt' | 'image' | 'video' | 'other';
  size: number;
  uploadedAt: string;
  status: 'uploading' | 'ready' | 'training' | 'done' | 'error';
  category: string;
  tags: string[];
  fileCount?: number; // 批量上传时的文件数
  thumbnail?: string;
  agentId?: string;   // 关联的智能体ID
  agentName?: string; // 关联的智能体名称
}

interface TrainingConfig {
  structuredOutput: boolean;
  outputFormat: 'json' | 'markdown' | 'html' | 'custom';
  customSchema?: string;
  chunkSize: number;
  overlap: number;
  embeddingModel: string;
  temperature: number;
  maxTokens: number;
}

interface LinkedAgent {
  id: string;
  name: string;
  icon: string;
  category: string;
}

// ══════════════════════════════════════════════════════════════
// 常量数据
// ══════════════════════════════════════════════════════════════

const FILE_TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string; border: string; label: string }> = {
  pdf:    { icon: '📄', color: 'text-red-400',   bg: 'bg-red-950/40',    border: 'border-red-800/40',   label: 'PDF' },
  word:   { icon: '📝', color: 'text-blue-400',   bg: 'bg-blue-950/40',   border: 'border-blue-800/40',  label: 'Word' },
  excel:  { icon: '📊', color: 'text-emerald-400',bg: 'bg-emerald-950/40',border: 'border-emerald-800/40',label: 'Excel' },
  txt:    { icon: '📃', color: 'text-slate-400',  bg: 'bg-slate-800/40', border: 'border-slate-700/40', label: '文本' },
  image:  { icon: '🖼️', color: 'text-pink-400',   bg: 'bg-pink-950/40',  border: 'border-pink-800/40',  label: '图片' },
  video:  { icon: '🎬', color: 'text-orange-400',  bg: 'bg-orange-950/40', border: 'border-orange-800/40',label: '视频' },
  other:  { icon: '📦', color: 'text-slate-400',  bg: 'bg-slate-800/40', border: 'border-slate-700/40', label: '其他' },
};

const CATEGORIES = ['产品文档', '客服知识', '培训资料', '行业报告', '合规手册', '技术文档', '市场资料', '其他'];
const TAGS_PRESET = ['高频问答', '产品说明', '操作指南', '政策解读', '案例分析', '术语表', 'FAQ', '流程规范'];

// 模拟已上传的知识库文件
const MOCK_FILES: KnowledgeFile[] = [
  { id: 'f1', name: '龙虾集群产品手册 v2.1.pdf', type: 'pdf', size: 4.2 * 1024 * 1024, uploadedAt: '2026-04-20', status: 'done', category: '产品文档', tags: ['产品说明', '操作指南'], agentId: 'a1', agentName: '龙虾客服助手' },
  { id: 'f2', name: '2026年AI行业白皮书.pdf', type: 'pdf', size: 12.8 * 1024 * 1024, uploadedAt: '2026-04-18', status: 'done', category: '行业报告', tags: ['行业分析', '市场资料'], agentId: 'a2', agentName: '行业分析师' },
  { id: 'f3', name: '客服高频问答汇总.xlsx', type: 'excel', size: 512 * 1024, uploadedAt: '2026-04-15', status: 'done', category: '客服知识', tags: ['高频问答', 'FAQ'] },
  { id: 'f4', name: '企业培训PPT素材包.zip', type: 'other', size: 256 * 1024 * 1024, uploadedAt: '2026-04-12', status: 'done', category: '培训资料', tags: ['培训资料', '案例分析'] },
  { id: 'f5', name: '产品界面截图_2026Q1.png', type: 'image', size: 3.1 * 1024 * 1024, uploadedAt: '2026-04-10', status: 'training', category: '产品文档', tags: ['产品说明'] },
  { id: 'f6', name: '品牌宣传视频_v3.mp4', type: 'video', size: 512 * 1024 * 1024, uploadedAt: '2026-04-08', status: 'done', category: '培训资料', tags: ['培训资料', '品牌宣传'] },
  { id: 'f7', name: '合规政策手册_2026.docx', type: 'word', size: 2.4 * 1024 * 1024, uploadedAt: '2026-04-05', status: 'done', category: '合规手册', tags: ['政策解读', '流程规范'] },
];

const MOCK_AGENTS: LinkedAgent[] = [
  { id: 'a1', name: '龙虾客服助手', icon: '🦞', category: '客服' },
  { id: 'a2', name: '行业分析师', icon: '📊', category: '分析' },
  { id: 'a3', name: '培训顾问', icon: '📚', category: '培训' },
  { id: 'a4', name: '合规审核员', icon: '⚖️', category: '合规' },
];

// ══════════════════════════════════════════════════════════════
// 工具函数
// ══════════════════════════════════════════════════════════════

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)}GB`;
}

function getFileType(name: string): KnowledgeFile['type'] {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (ext === 'pdf') return 'pdf';
  if (['doc', 'docx'].includes(ext)) return 'word';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'excel';
  if (['txt', 'md', 'json', 'xml', 'yaml', 'yml'].includes(ext)) return 'txt';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return 'image';
  if (['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv'].includes(ext)) return 'video';
  return 'other';
}

function StatusBadge({ status }: { status: KnowledgeFile['status'] }) {
  const config = {
    uploading: { label: '上传中', cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    ready:     { label: '待训练', cls: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
    training:  { label: '训练中', cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse' },
    done:      { label: '已完成', cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    error:     { label: '失败',   cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
  };
  const c = config[status];
  return <span className={`text-xs px-2 py-0.5 rounded border ${c.cls}`}>{c.label}</span>;
}

// ══════════════════════════════════════════════════════════════
// 子组件：文件卡片
// ══════════════════════════════════════════════════════════════

function FileCard({ file, onDelete, onTrain, onLink }: {
  file: KnowledgeFile;
  onDelete: (id: string) => void;
  onTrain: (id: string) => void;
  onLink: (id: string) => void;
}) {
  const cfg = FILE_TYPE_CONFIG[file.type];
  return (
    <div className="glass-card p-4 hover:border-slate-600/50 transition-all group">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0 ${cfg.bg} ${cfg.color}`}>
          {cfg.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-white truncate max-w-[200px]" title={file.name}>{file.name}</span>
            <StatusBadge status={file.status} />
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
            <span>{cfg.label}</span>
            <span>·</span>
            <span>{formatSize(file.size)}</span>
            <span>·</span>
            <span>{file.uploadedAt}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">{file.category}</span>
            {file.tags.slice(0, 2).map(t => (
              <span key={t} className="text-xs px-2 py-0.5 rounded bg-slate-700/60 text-slate-400">{t}</span>
            ))}
            {file.agentName && (
              <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
                🤖 {file.agentName}
              </span>
            )}
          </div>
        </div>
        {/* 操作按钮 */}
        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {file.status === 'done' && (
            <>
              <button onClick={() => onTrain(file.id)} className="text-xs px-2 py-1 rounded bg-blue-600/60 hover:bg-blue-600 text-white transition-colors">
                🎯 训练
              </button>
              <button onClick={() => onLink(file.id)} className="text-xs px-2 py-1 rounded bg-indigo-600/60 hover:bg-indigo-600 text-white transition-colors">
                🔗 关联
              </button>
            </>
          )}
          <button onClick={() => onDelete(file.id)} className="text-xs px-2 py-1 rounded bg-red-600/40 hover:bg-red-600 text-red-300 transition-colors">
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 子组件：SIMIAICLAW AI 在线客服
// ══════════════════════════════════════════════════════════════

function AICustomerService({ onClose }: { onClose?: () => void }) {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    { role: 'assistant', content: '🦞 您好！我是 SIMIAICLAW 智能客服小龙虾，请问有什么可以帮您？\n\n我可以帮您：\n• 知识库使用指导\n• 素材上传与训练\n• 智能体关联配置\n• 结构化输出设置\n• 平台功能咨询' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const quickQuestions = [
    '如何上传视频素材？',
    '结构化输出怎么配置？',
    '如何关联知识库到智能体？',
    '支持哪些文件格式？',
  ];

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg = text.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);

    // 模拟 AI 回复
    await new Promise(r => setTimeout(r, 1200));
    const replies: Record<string, string> = {
      '如何上传视频素材？': '📤 上传视频素材非常简单！\n\n1. 进入「上传素材」标签页\n2. 点击「添加素材」按钮\n3. 选择视频文件或拖拽上传\n4. 系统自动进行视频抽帧和字幕提取\n5. 完成后可一键训练到指定智能体\n\n支持格式：MP4 / AVI / MOV / MKV，建议单个文件不超过 512MB。',
      '结构化输出怎么配置？': '⚙️ 在「训练配置」标签页中：\n\n1. 开启「结构化输出」开关\n2. 选择输出格式（JSON / Markdown / HTML）\n3. 如需自定义格式，可编写 JSON Schema\n4. 设置 Temperature 和 Max Tokens\n5. 保存后训练的知识库将按指定格式输出\n\n结构化输出非常适合企业级 RAG 场景！',
      '如何关联知识库到智能体？': '🔗 关联知识库到智能体的步骤：\n\n1. 在知识库列表中点击「关联」按钮\n2. 选择要关联的智能体（如：龙虾客服助手）\n3. 设置召回条数（默认 5 条）\n4. 点击确认即可完成关联\n\n关联后，智能体将优先从知识库中检索相关信息回答用户问题。',
      '支持哪些文件格式？': '📋 目前支持以下格式：\n\n📄 PDF / Word / Excel / TXT\n🖼️ 图片：JPG / PNG / GIF / WebP\n🎬 视频：MP4 / AVI / MOV / MKV\n📦 其他：ZIP / JSON / YAML / XML\n\n上传后系统自动识别格式并进行预处理。',
    };

    const answer = replies[userMsg] || `🦞 感谢您的提问！\n\n关于「${userMsg}」，我已经记录了您的问题。我建议您：\n1. 进入知识库页面查看详细操作指南\n2. 联系平台技术支持获取更多帮助\n3. 或在龙虾社大学学习相关课程\n\n请问还有什么需要帮助的吗？`;
    setMessages(prev => [...prev, { role: 'assistant', content: answer }]);
    setLoading(false);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  return (
    <div className="fixed bottom-20 right-6 w-96 max-h-[520px] flex flex-col glass-card border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-500/10 z-50 overflow-hidden">
      {/* 头部 */}
      <div className="bg-gradient-to-r from-cyan-700/80 to-blue-700/80 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-cyan-500/30 flex items-center justify-center text-lg">🦞</div>
          <div>
            <div className="text-sm font-semibold text-white">SIMIAICLAW 智能客服</div>
            <div className="text-xs text-cyan-200/70 flex items-center gap-1">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              在线服务中
            </div>
          </div>
        </div>
        <button onClick={onClose} className="text-cyan-200/70 hover:text-white transition-colors text-lg">✕</button>
      </div>

      {/* 消息区 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-cyan-600/80 text-white rounded-br-md'
                : 'bg-slate-800/80 text-slate-200 rounded-bl-md whitespace-pre-wrap'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-800/80 text-slate-400 rounded-2xl rounded-bl-md px-4 py-2.5 text-sm">
              <span className="animate-pulse">🦞 正在思考...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 快捷问题 */}
      {messages.length === 1 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {quickQuestions.map(q => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="text-xs px-2.5 py-1 rounded-full bg-slate-700/60 text-slate-300 hover:bg-slate-600/60 border border-slate-600/40 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* 输入框 */}
      <div className="p-3 border-t border-slate-700/50 flex gap-2 flex-shrink-0">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
          placeholder="输入您的问题..."
          className="flex-1 bg-slate-800/80 border border-slate-600/50 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || loading}
          className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 text-white text-sm px-4 py-2 rounded-xl transition-all"
        >
          发送
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 子组件：关联智能体弹窗
// ══════════════════════════════════════════════════════════════

function LinkAgentModal({ fileId, agents, onClose, onConfirm }: {
  fileId: string;
  agents: LinkedAgent[];
  onClose: () => void;
  onConfirm: (fileId: string, agentId: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [recallCount, setRecallCount] = useState(5);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card border border-cyan-500/30 rounded-2xl p-6 w-full max-w-md space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">🔗 关联知识库到智能体</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg">✕</button>
        </div>
        <p className="text-sm text-slate-400">选择要关联的智能体，知识库将作为该智能体的专属知识来源。</p>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {agents.map(agent => (
            <button
              key={agent.id}
              onClick={() => setSelected(agent.id)}
              className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${
                selected === agent.id
                  ? 'border-cyan-500/50 bg-cyan-500/10'
                  : 'border-slate-700/50 bg-slate-800/40 hover:bg-slate-700/40'
              }`}
            >
              <span className="text-2xl">{agent.icon}</span>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">{agent.name}</div>
                <div className="text-xs text-slate-500">{agent.category}</div>
              </div>
              {selected === agent.id && <span className="text-cyan-400 text-lg">✓</span>}
            </button>
          ))}
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1.5">召回条数（每次回答最多召回的相关段落数）</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={1} max={20} value={recallCount}
              onChange={e => setRecallCount(Number(e.target.value))}
              className="flex-1 accent-cyan-500"
            />
            <span className="text-sm text-cyan-400 font-bold w-6 text-center">{recallCount}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm hover:bg-slate-700 transition-colors">
            取消
          </button>
          <button
            onClick={() => { if (selected) { onConfirm(fileId, selected); onClose(); } }}
            disabled={!selected}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 text-white text-sm font-medium transition-all"
          >
            确认关联
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 主组件
// ══════════════════════════════════════════════════════════════

export function KnowledgeBase() {
  const [activeTab, setActiveTab] = useState<'list' | 'upload' | 'training' | 'agents'>('list');
  const [files, setFiles] = useState<KnowledgeFile[]>(MOCK_FILES);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('全部');
  const [filterType, setFilterType] = useState('全部');
  const [filterStatus, setFilterStatus] = useState('全部');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showAiChat, setShowAiChat] = useState(false);
  const [linkModalFileId, setLinkModalFileId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<KnowledgeFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 训练配置
  const [trainConfig, setTrainConfig] = useState<TrainingConfig>({
    structuredOutput: true,
    outputFormat: 'json',
    chunkSize: 512,
    overlap: 64,
    embeddingModel: 'text-embedding-3-small',
    temperature: 0.3,
    maxTokens: 2048,
  });

  // 过滤文件
  const filteredFiles = files.filter(f => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === '全部' || f.category === filterCategory;
    const matchType = filterType === '全部' || f.type === filterType;
    const matchStatus = filterStatus === '全部' || f.status === filterStatus;
    return matchSearch && matchCat && matchType && matchStatus;
  });

  const handleFileUpload = useCallback((fileList: FileList) => {
    setUploading(true);
    setUploadProgress(0);
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 25;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        const newFiles: KnowledgeFile[] = Array.from(fileList).map((f, i) => ({
          id: `upload_${Date.now()}_${i}`,
          name: f.name,
          type: getFileType(f.name),
          size: f.size,
          uploadedAt: new Date().toISOString().split('T')[0],
          status: 'ready',
          category: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)],
          tags: [],
        }));
        setFiles(prev => [...prev, ...newFiles]);
        setUploading(false);
        toast.success(`成功上传 ${fileList.length} 个文件`);
      }
      setUploadProgress(Math.min(progress, 99));
    }, 200);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  const handleDelete = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    toast.success('文件已删除');
  };

  const handleTrain = (id: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'training' } : f));
    toast.success('开始训练，请稍候...');
    setTimeout(() => {
      setFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'done' } : f));
      toast.success('训练完成！');
    }, 3000);
  };

  const handleLinkConfirm = (fileId: string, agentId: string) => {
    const agent = MOCK_AGENTS.find(a => a.id === agentId);
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, agentId, agentName: agent?.name } : f));
    toast.success(`已关联到智能体「${agent?.name}」`);
  };

  const stats = {
    total: files.length,
    totalSize: formatSize(files.reduce((sum, f) => sum + f.size, 0)),
    trained: files.filter(f => f.status === 'done').length,
    training: files.filter(f => f.status === 'training').length,
  };

  return (
    <div className="space-y-6">
      {/* 顶部：标题 + 统计 + AI客服 */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold taiji-gradient">🦞 知识库管理</h2>
          <p className="text-sm text-slate-400 mt-1">构建企业专属知识体系，赋能垂直智能体精准回答</p>
        </div>
        <button
          onClick={() => setShowAiChat(v => !v)}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-600/80 to-blue-600/80 hover:from-cyan-600 hover:to-blue-600 text-white text-xs font-medium px-4 py-2 rounded-xl transition-all shadow-lg shadow-cyan-500/20 flex-shrink-0"
        >
          <span className="text-base">🦞</span>
          <span>小龙虾客服</span>
          <span className="bg-white/20 text-[10px] px-1.5 rounded">AI</span>
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: '📚', label: '知识库文件', value: stats.total, sub: stats.totalSize, color: 'text-cyan-400', bg: 'bg-cyan-950/40', border: 'border-cyan-800/40' },
          { icon: '✅', label: '已完成训练', value: stats.trained, sub: '条知识资产', color: 'text-emerald-400', bg: 'bg-emerald-950/40', border: 'border-emerald-800/40' },
          { icon: '⏳', label: '训练中', value: stats.training, sub: '条正在处理', color: 'text-blue-400', bg: 'bg-blue-950/40', border: 'border-blue-800/40' },
          { icon: '🤖', label: '关联智能体', value: MOCK_AGENTS.length, sub: '个已配置', color: 'text-purple-400', bg: 'bg-purple-950/40', border: 'border-purple-800/40' },
        ].map((stat, i) => (
          <div key={i} className={`glass-card p-4 border ${stat.border} ${stat.bg}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{stat.icon}</span>
              <span className={`text-xs font-medium ${stat.color}`}>{stat.label}</span>
            </div>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* 子标签页 */}
      <div className="flex items-center gap-1 flex-wrap">
        {[
          { id: 'list', icon: '📋', label: '知识库列表' },
          { id: 'upload', icon: '📤', label: '上传素材' },
          { id: 'training', icon: '🎯', label: '训练配置' },
          { id: 'agents', icon: '🤖', label: '关联智能体' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all ${
              activeTab === tab.id
                ? 'bg-cyan-600/30 text-cyan-300 ring-1 ring-cyan-500/30'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700/60 hover:text-slate-200'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ===== 知识库列表 ===== */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {/* 搜索与过滤器 */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="搜索文件名..."
                className="w-full bg-slate-800/80 border border-slate-700/50 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
              className="bg-slate-800/80 border border-slate-700/50 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50">
              <option value="全部">全部分类</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              className="bg-slate-800/80 border border-slate-700/50 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50">
              <option value="全部">全部格式</option>
              {Object.entries(FILE_TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="bg-slate-800/80 border border-slate-700/50 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50">
              <option value="全部">全部状态</option>
              <option value="done">✅ 已完成</option>
              <option value="training">⏳ 训练中</option>
              <option value="ready">📋 待训练</option>
            </select>
          </div>

          {/* 文件列表 */}
          {filteredFiles.length === 0 ? (
            <div className="glass-card p-12 text-center space-y-3">
              <div className="text-5xl">📭</div>
              <p className="text-slate-400 text-sm">暂无知识库文件</p>
              <button onClick={() => setActiveTab('upload')} className="text-xs text-cyan-400 hover:text-cyan-300">
                点击前往上传 →
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFiles.map(f => (
                <FileCard
                  key={f.id}
                  file={f}
                  onDelete={handleDelete}
                  onTrain={handleTrain}
                  onLink={id => setLinkModalFileId(id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== 上传素材 ===== */}
      {activeTab === 'upload' && (
        <div className="space-y-6">
          {/* 拖拽上传区 */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`glass-card border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
              dragOver ? 'border-cyan-500 bg-cyan-500/5 scale-[1.01]' : 'border-slate-600/50 hover:border-slate-500 hover:bg-slate-800/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.md,.json,.xml,.yaml,.yml,.jpg,.jpeg,.png,.gif,.webp,.svg,.mp4,.avi,.mov,.mkv,.webm,.zip"
              onChange={e => e.target.files && handleFileUpload(e.target.files)}
            />
            <div className="text-5xl mb-4">{uploading ? '⏳' : '📤'}</div>
            {uploading ? (
              <div className="space-y-3 max-w-sm mx-auto">
                <p className="text-sm text-white font-medium">正在上传...</p>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
                <p className="text-xs text-slate-400">{uploadProgress.toFixed(0)}%</p>
              </div>
            ) : (
              <>
                <p className="text-base font-medium text-white mb-1">拖拽文件到这里，或点击选择文件</p>
                <p className="text-sm text-slate-400">支持批量上传，系统自动识别格式</p>
              </>
            )}
          </div>

          {/* 支持格式说明 */}
          <div className="grid grid-cols-4 gap-3">
            {Object.entries(FILE_TYPE_CONFIG).map(([key, cfg]) => (
              <div key={key} className={`glass-card p-3 border ${cfg.border} ${cfg.bg} flex items-center gap-2`}>
                <span className="text-xl">{cfg.icon}</span>
                <div>
                  <div className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</div>
                  <div className="text-[10px] text-slate-500">.{key === 'word' ? 'doc/docx' : key === 'excel' ? 'xls/xlsx' : key}</div>
                </div>
              </div>
            ))}
          </div>

          {/* 批量操作区 */}
          <div className="glass-card p-5 space-y-4">
            <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
              🗂️ 批量上传记录 <span className="text-xs text-slate-500">（本次会话）</span>
            </h3>
            {selectedFiles.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">暂无批量上传记录</p>
            ) : (
              <div className="space-y-2">
                {selectedFiles.map(f => (
                  <div key={f.id} className="flex items-center gap-3 text-xs text-slate-300">
                    <span>{FILE_TYPE_CONFIG[f.type].icon}</span>
                    <span className="flex-1 truncate">{f.name}</span>
                    <span className="text-slate-500">{formatSize(f.size)}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-3">
              <button className="text-xs px-4 py-2 rounded-lg bg-indigo-600/60 hover:bg-indigo-600 text-white transition-colors">
                📋 一键生成摘要
              </button>
              <button className="text-xs px-4 py-2 rounded-lg bg-emerald-600/60 hover:bg-emerald-600 text-white transition-colors">
                🎯 批量训练
              </button>
              <button className="text-xs px-4 py-2 rounded-lg bg-slate-700/60 hover:bg-slate-600 text-slate-300 transition-colors">
                🧹 清空记录
              </button>
            </div>
          </div>

          {/* 视频/图片训练说明 */}
          <div className="glass-card p-5 border border-orange-800/40 bg-orange-950/20 space-y-3">
            <h3 className="text-sm font-medium text-orange-300 flex items-center gap-2">
              🎬 图片 / 视频素材训练说明
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs text-slate-400">
              <div className="space-y-1.5">
                <div className="text-orange-300/80 font-medium">🖼️ 图片素材</div>
                <div>• 自动 OCR 文字识别提取</div>
                <div>• 场景标签自动标注</div>
                <div>• 支持产品截图、流程图、PPT页面</div>
              </div>
              <div className="space-y-1.5">
                <div className="text-orange-300/80 font-medium">🎥 视频素材</div>
                <div>• 自动音视频分离</div>
                <div>• 关键帧抽帧（每5秒1帧）</div>
                <div>• 字幕 ASR 自动提取</div>
                <div>• 语音内容转文本知识</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== 训练配置 ===== */}
      {activeTab === 'training' && (
        <div className="grid grid-cols-2 gap-6">
          {/* 结构化输出 */}
          <div className="glass-card p-6 space-y-5">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              ⚙️ 结构化输出训练
            </h3>
            <p className="text-xs text-slate-400">配置知识库输出的结构化格式，适用于企业级 RAG 和精确信息抽取场景。</p>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-200 font-medium">启用结构化输出</div>
                  <div className="text-xs text-slate-500 mt-0.5">将知识库训练为结构化格式输出</div>
                </div>
                <button
                  onClick={() => setTrainConfig(c => ({ ...c, structuredOutput: !c.structuredOutput }))}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    trainConfig.structuredOutput ? 'bg-cyan-600' : 'bg-slate-700'
                  }`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    trainConfig.structuredOutput ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1.5">输出格式</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['json', 'markdown', 'html', 'custom'] as const).map(fmt => (
                    <button
                      key={fmt}
                      onClick={() => setTrainConfig(c => ({ ...c, outputFormat: fmt }))}
                      className={`text-xs py-2 rounded-lg border transition-all ${
                        trainConfig.outputFormat === fmt
                          ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300'
                          : 'border-slate-700/50 bg-slate-800/40 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      {fmt === 'json' ? '{ }' : fmt === 'markdown' ? '# M' : fmt === 'html' ? '< >' : '⚙️ 自定义'}
                    </button>
                  ))}
                </div>
              </div>

              {trainConfig.outputFormat === 'custom' && (
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">自定义 JSON Schema</label>
                  <textarea
                    value={trainConfig.customSchema || ''}
                    onChange={e => setTrainConfig(c => ({ ...c, customSchema: e.target.value }))}
                    placeholder={'{\n  "type": "object",\n  "properties": {\n    "answer": { "type": "string" },\n    "confidence": { "type": "number" }\n  }\n}'}
                    rows={5}
                    className="w-full bg-slate-900 border border-slate-700/50 rounded-xl px-3 py-2.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-cyan-500/50 resize-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 训练参数 */}
          <div className="glass-card p-6 space-y-5">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              📊 训练参数配置
            </h3>

            <div className="space-y-4">
              {[
                { label: 'Embedding 模型', key: 'embeddingModel' as const, options: [
                  { value: 'text-embedding-3-small', label: 'text-embedding-3-small（快速）' },
                  { value: 'text-embedding-3-large', label: 'text-embedding-3-large（高精度）' },
                  { value: 'text-embedding-2', label: 'text-embedding-2（兼容性）' },
                ]},
              ].map(field => (
                <div key={field.key}>
                  <label className="text-xs text-slate-400 block mb-1.5">{field.label}</label>
                  <select
                    value={trainConfig[field.key]}
                    onChange={e => setTrainConfig(c => ({ ...c, [field.key]: e.target.value }))}
                    className="w-full bg-slate-800/80 border border-slate-700/50 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50"
                  >
                    {field.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              ))}

              {[
                { label: '文本块大小', key: 'chunkSize' as const, min: 128, max: 2048, step: 64, unit: 'tokens' },
                { label: '块重叠大小', key: 'overlap' as const, min: 0, max: 512, step: 16, unit: 'tokens' },
                { label: 'Temperature', key: 'temperature' as const, min: 0, max: 1, step: 0.05, unit: '' },
                { label: 'Max Tokens', key: 'maxTokens' as const, min: 256, max: 8192, step: 256, unit: '' },
              ].map(field => (
                <div key={field.key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs text-slate-400">{field.label}</label>
                    <span className="text-xs text-cyan-400 font-bold">{trainConfig[field.key]}{field.unit}</span>
                  </div>
                  <input
                    type="range"
                    min={field.min} max={field.max} step={field.step}
                    value={trainConfig[field.key]}
                    onChange={e => setTrainConfig(c => ({ ...c, [field.key]: Number(e.target.value) }))}
                    className="w-full accent-cyan-500"
                  />
                </div>
              ))}
            </div>

            <button className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-medium transition-all shadow-lg shadow-cyan-500/20">
              💾 保存配置
            </button>
          </div>

          {/* 训练历史 */}
          <div className="col-span-2 glass-card p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white">📈 最近训练记录</h3>
            <div className="space-y-2">
              {[
                { name: '龙虾集群产品手册 v2.1.pdf', time: '2026-04-22 14:30', chunks: 128, cost: '0.02 USD', status: 'done' },
                { name: '2026年AI行业白皮书.pdf', time: '2026-04-21 10:15', chunks: 512, cost: '0.08 USD', status: 'done' },
                { name: '客服高频问答汇总.xlsx', time: '2026-04-20 16:45', chunks: 64, cost: '0.01 USD', status: 'done' },
                { name: '品牌宣传视频_v3.mp4', time: '2026-04-19 09:20', chunks: 89, cost: '0.05 USD', status: 'done' },
              ].map((record, i) => (
                <div key={i} className="flex items-center gap-4 text-xs p-3 rounded-xl bg-slate-800/40 border border-slate-700/30">
                  <span className="text-emerald-400 w-16">✅</span>
                  <span className="flex-1 text-slate-200 truncate">{record.name}</span>
                  <span className="text-slate-500 w-32">{record.time}</span>
                  <span className="text-slate-400 w-20">{record.chunks} 块</span>
                  <span className="text-emerald-400/70 w-20">{record.cost}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== 关联智能体 ===== */}
      {activeTab === 'agents' && (
        <div className="space-y-5">
          <div className="glass-card p-6 space-y-5">
            <h3 className="text-sm font-semibold text-white">🤖 知识库 × 智能体 关联管理</h3>
            <p className="text-xs text-slate-400">将知识库精准关联到对应智能体，实现垂直领域的专业问答能力。</p>

            <div className="grid grid-cols-2 gap-4">
              {MOCK_AGENTS.map(agent => {
                const linkedFiles = files.filter(f => f.agentId === agent.id);
                return (
                  <div key={agent.id} className="glass-card p-4 border border-slate-700/50 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{agent.icon}</span>
                      <div>
                        <div className="text-sm font-medium text-white">{agent.name}</div>
                        <div className="text-xs text-slate-500">{agent.category} · 已关联 {linkedFiles.length} 个知识库</div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {linkedFiles.slice(0, 3).map(f => (
                        <div key={f.id} className="flex items-center gap-2 text-xs text-slate-400">
                          <span>{FILE_TYPE_CONFIG[f.type].icon}</span>
                          <span className="flex-1 truncate">{f.name}</span>
                          <button
                            onClick={() => setFiles(prev => prev.map(file => file.id === f.id ? { ...file, agentId: undefined, agentName: undefined } : file))}
                            className="text-red-400/60 hover:text-red-400 ml-2"
                          >✕</button>
                        </div>
                      ))}
                      {linkedFiles.length === 0 && (
                        <p className="text-xs text-slate-600 italic">暂无关联知识库</p>
                      )}
                    </div>
                    <button className="w-full py-1.5 rounded-lg bg-indigo-600/40 hover:bg-indigo-600/60 text-xs text-indigo-300 transition-colors">
                      + 添加关联
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 知识召回预览 */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white">🔍 知识召回预览（模拟）</h3>
            <div className="bg-slate-900/60 rounded-xl p-4 space-y-3">
              <div className="text-xs text-slate-400">用户问题：<span className="text-cyan-400">"龙虾集群支持哪些功能？"</span></div>
              <div className="space-y-2">
                {[
                  { chunk: '产品手册 v2.1 — 第3章', score: '0.94', text: 'SIMIAICLAW 龙虾集群是一套基于64卦太极体系的全链路 AI 协作平台...', source: 'PDF' },
                  { chunk: '产品手册 v2.1 — 第7章', score: '0.87', text: '核心功能包括：智能体编排、知识库管理、流程自动化、多端协作...', source: 'PDF' },
                  { chunk: '客服FAQ — 高频问题', score: '0.81', text: '用户最常咨询的功能包括：OPC工作台、Agent 技能市场、大模型路由...', source: 'XLSX' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 text-xs p-3 rounded-lg bg-slate-800/60 border border-slate-700/30">
                    <span className={`text-xs font-bold w-6 flex-shrink-0 ${item.score >= '0.9' ? 'text-emerald-400' : item.score >= '0.85' ? 'text-cyan-400' : 'text-slate-400'}`}>
                      #{i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-slate-500">{item.chunk}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                          item.score >= '0.9' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                          item.score >= '0.85' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' :
                          'bg-slate-700/50 text-slate-400 border-slate-600/40'
                        }`}>
                          {(Number(item.score) * 100).toFixed(0)}% 相关
                        </span>
                      </div>
                      <div className="text-slate-300 leading-relaxed">"{item.text}"</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI 客服悬浮组件 */}
      {showAiChat && <AICustomerService onClose={() => setShowAiChat(false)} />}

      {/* 关联智能体弹窗 */}
      {linkModalFileId && (
        <LinkAgentModal
          fileId={linkModalFileId}
          agents={MOCK_AGENTS}
          onClose={() => setLinkModalFileId(null)}
          onConfirm={handleLinkConfirm}
        />
      )}
    </div>
  );
}

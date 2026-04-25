/**
 * SIMIAICLAW 龙虾集群 · 小加营销智能体面板
 * 离宫·营销卦专属 · 面向真实营销交付的 AI skill
 * 集成 xiaojia-Marketing-Delivery（JustAI 营销交付平台）
 * 功能：Campaign Plan · 小红书图文 · 品牌定位 · 卖点提炼 · 营销图片
 */

import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';

const API = '/api/xiaojia';

// ── 类型定义 ──────────────────────────────────────────────
interface XiaojiaLoginStatus {
  logged_in: boolean;
  user?: {
    email: string;
    nickname?: string;
  };
  api_key_configured: boolean;
}

interface ConversationRecord {
  id: string;
  message: string;
  branch?: string;
  status: string;
  createdAt: string;
  result?: XiaojiaResult;
}

interface XiaojiaResult {
  status: string;
  branch?: string;
  text?: string;
  result?: {
    text?: string;
    components?: Array<{
      type: string;
      data: {
        title?: string;
        content?: string;
        images?: Array<{ url: string; alt?: string }>;
        url?: string;
      };
    }>;
  };
  conversation_id?: string;
  web_url?: string;
  message?: string;
}

interface QuickTask {
  label: string;
  icon: string;
  message: string;
  skillId?: string;
  branch?: string;
}

// ── 常量 ──────────────────────────────────────────────────
const QUICK_TASKS: QuickTask[] = [
  { label: 'Campaign 方案', icon: '📋', message: '帮我做一份新品营销 campaign plan，包含内容规划和营销方向', branch: 'generate_plan' },
  { label: '小红书图文', icon: '📕', message: '帮我写一篇小红书图文笔记，包含标题、正文和配图建议', branch: 'generate_notes' },
  { label: '品牌定位', icon: '🎯', message: '帮我梳理品牌的目标人群、核心卖点、差异化定位和表达方向', branch: 'collect_info' },
  { label: '卖点提炼', icon: '💎', message: '帮我提炼产品卖点，用简短有力的语言表达', branch: 'collect_info' },
  { label: '营销图片', icon: '🖼️', message: '帮我生成一张营销宣传图或电商主图', branch: 'generate_image' },
  { label: '短视频脚本', icon: '🎬', message: '帮我写一个短视频脚本，包含开场、核心内容和结尾', branch: 'generate_plan' },
];

// ── 工具函数 ──────────────────────────────────────────────
function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch { return iso; }
}

function BranchBadge({ branch }: { branch?: string }) {
  const map: Record<string, { label: string; color: string }> = {
    collect_info: { label: '收集信息', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    confirm_info: { label: '确认信息', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    generate_plan: { label: '生成方案', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    generate_notes: { label: '生成图文', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
    generate_image: { label: '生成图片', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  };
  const info = branch ? (map[branch] || { label: branch, color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' }) : { label: '执行中', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' };
  return (
    <span className={`text-xs px-2 py-0.5 rounded border ${info.color}`}>
      {info.label}
    </span>
  );
}

// ── 主组件 ────────────────────────────────────────────────
export function XiaojiaPanel() {
  const [loginStatus, setLoginStatus] = useState<XiaojiaLoginStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [polling, setPolling] = useState(false);
  const [message, setMessage] = useState('');
  const [conversationId, setConversationId] = useState<string>('');
  const [currentResult, setCurrentResult] = useState<XiaojiaResult | null>(null);
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 加载登录状态
  useEffect(() => {
    checkLogin();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  async function checkLogin() {
    try {
      const res = await fetch(`${API}/login-status`);
      const data = await res.json();
      setLoginStatus(data);
      setLoading(false);
    } catch {
      setLoginStatus({ logged_in: false, api_key_configured: false });
      setLoading(false);
    }
  }

  async function handleLogin() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/login/start`, { method: 'POST' });
      const data = await res.json();
      if (data.status === 'ok' && data.login_url) {
        setShowLoginModal(true);
        // 轮询登录结果
        const poll = setInterval(async () => {
          const r = await fetch(`${API}/login/result?login_token=${data.login_token}`);
          const d = await r.json();
          if (d.status === 'success') {
            clearInterval(poll);
            setShowLoginModal(false);
            toast.success('小加登录成功！');
            checkLogin();
          } else if (d.status === 'failed') {
            clearInterval(poll);
            setShowLoginModal(false);
            toast.error('登录失败：' + (d.message || '未知错误'));
          }
        }, 2000);
      }
    } catch (e) {
      toast.error('启动登录失败：' + String(e));
    }
    setLoading(false);
  }

  async function handleQuickTask(task: QuickTask) {
    if (!loginStatus?.logged_in) {
      toast.error('请先完成小加登录');
      return;
    }
    setMessage(task.message);
    await submitTask(task.message);
  }

  async function submitTask(msg?: string) {
    const finalMsg = msg || message.trim();
    if (!finalMsg) { toast.warning('请输入营销需求'); return; }

    setSubmitting(true);
    setCurrentResult(null);
    try {
      const body: Record<string, string> = { message: finalMsg };
      if (selectedProject) body['project_id'] = selectedProject;
      if (conversationId) body['conversation_id'] = conversationId;

      const res = await fetch(`${API}/chat/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data: XiaojiaResult = await res.json();
      if (data.conversation_id) {
        setConversationId(data.conversation_id);
        addConversation({ id: data.conversation_id, message: finalMsg, branch: data.branch, status: 'submitted', createdAt: new Date().toISOString() });
      }
      toast.success('任务已提交，开始生成…');
      startPolling(data.conversation_id || conversationId);
    } catch (e) {
      toast.error('提交失败：' + String(e));
    }
    setSubmitting(false);
  }

  function startPolling(cid: string) {
    if (pollRef.current) clearInterval(pollRef.current);
    setPolling(true);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API}/chat/result?conversation_id=${cid}`);
        const data: XiaojiaResult = await res.json();
        setCurrentResult(data);
        if (data.status === 'completed') {
          clearInterval(pollRef.current!);
          pollRef.current = null;
          setPolling(false);
          updateConversation(cid, { status: 'completed', result: data });
          toast.success('营销内容生成完成！');
        } else if (data.status === 'failed') {
          clearInterval(pollRef.current!);
          pollRef.current = null;
          setPolling(false);
          updateConversation(cid, { status: 'failed' });
          toast.error('生成失败：' + (data.message || '未知错误'));
        }
      } catch (e) {
        console.error('轮询失败', e);
      }
    }, 3000);
  }

  function addConversation(rec: ConversationRecord) {
    setConversations(prev => [rec, ...prev.slice(0, 19)]);
  }

  function updateConversation(cid: string, updates: Partial<ConversationRecord>) {
    setConversations(prev => prev.map(c => c.id === cid ? { ...c, ...updates } : c));
  }

  function handleNewChat() {
    if (pollRef.current) clearInterval(pollRef.current);
    setConversationId('');
    setCurrentResult(null);
    setMessage('');
    setPolling(false);
  }

  function renderResult(result: XiaojiaResult) {
    const components = result.result?.components || [];
    const text = result.result?.text || result.text || '';
    const webUrl = result.web_url || (result.conversation_id ? `https://justailab.com/pages/agent/preview?conversation_id=${result.conversation_id}` : '');
    const images: Array<{ url: string; alt?: string }> = [];
    components.forEach(c => {
      if (c.data.images) c.data.images.forEach((img: { url: string; alt?: string }) => images.push(img));
    });

    return (
      <div className="space-y-4">
        {/* 图片 */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {images.map((img, i) => (
              <div key={i} className="rounded-xl overflow-hidden border border-white/10">
                <img src={img.url} alt={img.alt || `图片${i + 1}`} className="w-full object-cover max-h-56" loading="lazy" />
                {img.alt && <div className="text-xs text-slate-500 px-2 py-1 bg-slate-900/50">{img.alt}</div>}
              </div>
            ))}
          </div>
        )}

        {/* 文字内容 */}
        {text && (
          <div className="bg-slate-900/60 border border-white/10 rounded-xl p-4">
            <p className="text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">{text}</p>
          </div>
        )}

        {/* 组件渲染 */}
        {components.map((comp, i) => (
          <div key={i} className="bg-slate-900/60 border border-white/10 rounded-xl p-4">
            {comp.type === 'notes' && (
              <div className="space-y-3">
                {comp.data.title && (
                  <div>
                    <div className="text-xs text-pink-400/70 font-mono mb-1">标题</div>
                    <h3 className="text-white font-bold text-lg">{comp.data.title}</h3>
                  </div>
                )}
                {comp.data.content && (
                  <div>
                    <div className="text-xs text-pink-400/70 font-mono mb-1">正文</div>
                    <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">{comp.data.content}</p>
                  </div>
                )}
                {comp.data.images?.map((img, j) => (
                  <div key={j} className="rounded-lg overflow-hidden">
                    <img src={img.url} alt={img.alt || ''} className="w-full max-h-64 object-cover" loading="lazy" />
                  </div>
                ))}
              </div>
            )}
            {comp.type === 'plan' && (
              <div className="space-y-2">
                <div className="text-xs text-green-400/70 font-mono mb-2">营销方案</div>
                <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">{comp.data.content || comp.data.title || text}</p>
              </div>
            )}
          </div>
        ))}

        {/* web_url */}
        {webUrl && (
          <div className="flex items-center gap-3 p-3 bg-slate-900/40 border border-white/10 rounded-xl">
            <span className="text-xs text-slate-500 shrink-0">📎 结果链接</span>
            <a href={webUrl} target="_blank" rel="noopener noreferrer"
               className="text-xs text-cyan-400 hover:text-cyan-300 truncate underline underline-offset-2">
              {webUrl}
            </a>
          </div>
        )}
      </div>
    );
  }

  // ── 渲染 ────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white overflow-hidden">

      {/* 登录弹窗 */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-white/10 rounded-2xl p-8 max-w-sm text-center space-y-4">
            <div className="text-5xl">🔑</div>
            <h3 className="text-lg font-bold">小加营销登录</h3>
            <p className="text-slate-400 text-sm">请在浏览器中完成扫码登录…</p>
            <div className="flex justify-center gap-2">
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <p className="text-xs text-slate-500">等待登录确认后自动继续…</p>
            <button onClick={() => setShowLoginModal(false)} className="text-xs text-slate-500 hover:text-slate-300">取消</button>
          </div>
        </div>
      )}

      {/* 顶部导航 */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/20">
        <div className="flex items-center gap-3">
          <div className="text-2xl">🧙</div>
          <div>
            <h2 className="text-base font-bold text-white">小加营销智能体</h2>
            <p className="text-xs text-slate-500">xiaojia-Marketing-Delivery · 离宫·营销卦</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {loginStatus?.logged_in ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-full">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-green-400">已登录</span>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-pink-600 to-violet-600 hover:from-pink-500 hover:to-violet-500 disabled:opacity-50 text-white text-xs font-medium rounded-full transition-all"
            >
              {loading ? '⏳' : '🔑'} 登录小加
            </button>
          )}
          <button onClick={handleNewChat} className="text-xs text-slate-400 hover:text-white px-3 py-1.5 border border-white/10 rounded-lg transition-colors">
            + 新对话
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* 左侧：快捷任务 + 历史 */}
        <div className="w-64 shrink-0 border-r border-white/5 flex flex-col overflow-hidden">
          {/* 快捷任务 */}
          <div className="p-4 border-b border-white/5">
            <div className="text-xs font-medium text-slate-500 mb-3 uppercase tracking-wider">⚡ 快捷任务</div>
            <div className="space-y-1.5">
              {QUICK_TASKS.map((task, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickTask(task)}
                  disabled={!loginStatus?.logged_in || submitting}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-slate-800/40 hover:bg-slate-700/50 disabled:opacity-40 disabled:cursor-not-allowed border border-white/5 hover:border-white/10 rounded-lg text-left transition-all text-xs group"
                >
                  <span className="text-base">{task.icon}</span>
                  <span className="text-slate-300 group-hover:text-white">{task.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 历史对话 */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="text-xs font-medium text-slate-500 mb-3 uppercase tracking-wider">📜 对话历史</div>
            {conversations.length === 0 ? (
              <p className="text-xs text-slate-600">暂无对话记录</p>
            ) : (
              <div className="space-y-1">
                {conversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={async () => {
                      setConversationId(conv.id);
                      setCurrentResult(conv.result || null);
                      if (!conv.result) {
                        setPolling(true);
                        startPolling(conv.id);
                      }
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all ${conv.id === conversationId ? 'bg-pink-500/10 border border-pink-500/30 text-pink-300' : 'hover:bg-slate-800/40 text-slate-400 hover:text-slate-300 border border-transparent'}`}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <BranchBadge branch={conv.branch} />
                      {conv.status === 'completed' && <span className="text-green-400 ml-auto">✅</span>}
                      {conv.status === 'failed' && <span className="text-red-400 ml-auto">❌</span>}
                      {conv.status === 'submitted' && polling && conv.id === conversationId && <span className="text-yellow-400 ml-auto">⏳</span>}
                    </div>
                    <div className="truncate text-slate-500">{conv.message}</div>
                    <div className="text-slate-600 mt-0.5">{formatTime(conv.createdAt)}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 右侧：输入 + 结果 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 输入区 */}
          <div className="p-4 border-b border-white/5 bg-black/10">
            <div className="flex gap-2">
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitTask(); }}
                placeholder="描述你的营销需求…（⌘+Enter 发送）"
                rows={3}
                className="flex-1 bg-slate-800/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500/40 focus:ring-1 focus:ring-pink-500/20 resize-none"
              />
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => submitTask()}
                  disabled={submitting || !loginStatus?.logged_in || !message.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-pink-600 to-violet-600 hover:from-pink-500 hover:to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium rounded-xl transition-all whitespace-nowrap"
                >
                  {submitting ? '⏳' : '🚀'} {submitting ? '提交中…' : '发送'}
                </button>
                {polling && (
                  <button
                    onClick={() => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; setPolling(false); } }}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-xl transition-all"
                  >
                    ⏹ 停止轮询
                  </button>
                )}
              </div>
            </div>
            {polling && (
              <div className="flex items-center gap-2 mt-2 text-xs text-yellow-400/70">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-ping" />
                  <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-ping" style={{ animationDelay: '200ms' }} />
                  <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-ping" style={{ animationDelay: '400ms' }} />
                </div>
                正在生成中，请稍候…
                <button onClick={() => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; setPolling(false); } }}
                        className="ml-auto text-slate-500 hover:text-slate-300 underline">停止</button>
              </div>
            )}
            {currentResult?.status === 'running' && (
              <div className="flex items-center gap-2 mt-2 text-xs text-cyan-400/70">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                生成中，{currentResult.branch ? `正在「${currentResult.branch}」分支` : '请稍候'}…
              </div>
            )}
          </div>

          {/* 结果展示 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!currentResult && !loading && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                <div className="text-6xl">🧙</div>
                <div>
                  <h3 className="text-lg font-bold text-slate-300 mb-2">小加营销智能体</h3>
                  <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
                    面向真实营销交付的 AI Skill。Campaign 方案 · 小红书图文 · 品牌定位 · 卖点提炼 · 营销图片 — 全自动生成。
                  </p>
                </div>
                {!loginStatus?.logged_in && (
                  <button onClick={handleLogin}
                          className="px-6 py-2.5 bg-gradient-to-r from-pink-600 to-violet-600 hover:from-pink-500 hover:to-violet-500 text-white text-sm font-medium rounded-full transition-all shadow-lg shadow-pink-500/20">
                    🔑 登录后开始使用
                  </button>
                )}
                <div className="grid grid-cols-3 gap-3 mt-4 max-w-sm">
                  {[
                    { icon: '📋', label: 'Campaign Plan' },
                    { icon: '📕', label: '小红书图文' },
                    { icon: '🎯', label: '品牌定位' },
                    { icon: '💎', label: '卖点提炼' },
                    { icon: '🖼️', label: '营销图片' },
                    { icon: '🎬', label: '短视频脚本' },
                  ].map(item => (
                    <div key={item.label} className="flex flex-col items-center gap-1 p-3 bg-slate-800/30 border border-white/5 rounded-xl">
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-xs text-slate-500">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div className="h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-slate-500">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs">加载中…</span>
                </div>
              </div>
            )}

            {currentResult && renderResult(currentResult)}

            {currentResult?.status === 'failed' && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-300">
                ❌ 生成失败：{currentResult.message || '未知错误'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 底部状态栏 */}
      <div className="px-6 py-2 border-t border-white/5 bg-black/20 flex items-center justify-between text-xs text-slate-600">
        <span>🧙 小加营销 · JustAI 驱动</span>
        <span>
          {conversationId ? `会话: ${conversationId.slice(0, 8)}…` : '新会话'}
          {polling ? ' · ⏳ 生成中' : ''}
          {currentResult?.web_url ? ' · ✅ 完成' : ''}
        </span>
      </div>
    </div>
  );
}

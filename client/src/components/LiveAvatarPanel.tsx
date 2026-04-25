/**
 * HeyGen LiveAvatar 实时数字人面板
 * 企业级 AI 数字人，支持实时 1:1 对话、WebRTC 低延迟流
 * 文档: https://docs.liveavatar.com
 * API Base: https://api.liveavatar.com/v2
 */
import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import { toast } from 'sonner';

interface LiveAvatarStatus {
  configured: boolean;
  docsUrl: string;
  features: string[];
  pricing: string;
  models: string[];
}

interface Avatar {
  id: string;
  name: string;
  thumbnail: string | null;
  is_available: boolean;
  type: string;
}

interface SessionResult {
  success: boolean;
  sessionId: string;
  embedUrl: string;
  embedScript: string;
  mode: string;
  isSandbox: boolean;
  message: string;
}

export function LiveAvatarPanel({ onClose }: { onClose: () => void }) {
  const [status, setStatus] = useState<LiveAvatarStatus | null>(null);
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState('default');
  const [mode, setMode] = useState<'full' | 'lite'>('full');
  const [isSandbox, setIsSandbox] = useState(true);
  const [session, setSession] = useState<SessionResult | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    loadStatus();
    loadAvatars();
  }, []);

  const loadStatus = async () => {
    try {
      const data = await api.getLiveAvatarStatus();
      setStatus(data);
    } catch (e) {
      console.error('[LiveAvatar] status error:', e);
    }
  };

  const loadAvatars = async () => {
    setIsLoading(true);
    try {
      const data = await api.getLiveAvatarAvatars();
      setAvatars(data.avatars || []);
      if (data.avatars?.length > 0) {
        setSelectedAvatar(data.avatars[0].id);
      }
    } catch (e) {
      console.error('[LiveAvatar] avatars error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const createSession = async () => {
    if (!status?.configured) {
      toast.error('LiveAvatar API Key 未配置，请联系管理员设置 HEYGEN_LIVEAVATAR_API_KEY');
      return;
    }
    setIsCreating(true);
    try {
      const result = await api.createLiveAvatarSession({
        avatarId: selectedAvatar,
        isSandbox,
        mode,
      });
      setSession(result);
      toast.success('LiveAvatar 会话已创建！正在加载数字人...');
    } catch (e: unknown) {
      toast.error(`创建会话失败: ${String(e)}`);
    } finally {
      setIsCreating(false);
    }
  };

  const stopSession = () => {
    setSession(null);
    toast.info('LiveAvatar 会话已结束');
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatInput('');

    // 模拟 AI 回复（实际通过 LiveAvatar Web SDK 或 HeyGen API 发送）
    await new Promise(r => setTimeout(r, 800));
    setChatMessages(prev => [...prev, {
      role: 'assistant',
      content: `已收到: "${userMsg}" — LiveAvatar 数字人正在响应中，通过 iframe embed 模式实现实时对话。`,
    }]);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-6xl h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-violet-900/80 to-purple-900/80 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl shadow-lg shadow-violet-500/30">
              🎭
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">HeyGen LiveAvatar 实时数字人</h2>
              <p className="text-xs text-violet-200 mt-0.5">
                企业级 AI 数字人 · 实时 1:1 对话 · WebRTC 低延迟流
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* 状态指示器 */}
            <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5">
              <div className={`w-2 h-2 rounded-full ${status?.configured ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
              <span className="text-xs text-white/80">
                {status?.configured ? '✅ API 已配置' : '⚠️ API 未配置'}
              </span>
            </div>

            {/* 费用信息 */}
            <div className="bg-white/10 rounded-lg px-3 py-1.5">
              <span className="text-xs text-violet-200">💰 {status?.pricing || '2积分/分钟'}</span>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors text-lg"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden">

          {/* Left: Avatar Preview / Session */}
          <div className="flex-1 flex flex-col p-5">

            {!session ? (
              /* 配置区域 */
              <div className="flex-1 flex flex-col items-center justify-center gap-8">

                {/* Hero Visual */}
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center text-5xl shadow-2xl shadow-violet-500/30 animate-pulse">
                    🎭
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">HeyGen LiveAvatar</h3>
                  <p className="text-slate-400 text-sm max-w-md mx-auto">
                    栩栩如生的 AI 数字人，支持实时 1:1 对话、WebRTC 低延迟流、唇形同步、自然表情
                  </p>
                </div>

                {/* 配置卡片 */}
                <div className="w-full max-w-lg bg-slate-800/60 border border-slate-700 rounded-2xl p-6 space-y-5">

                  {/* 数字人选择 */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-2 font-medium">🎭 选择数字人</label>
                    <select
                      value={selectedAvatar}
                      onChange={e => setSelectedAvatar(e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
                    >
                      {isLoading ? (
                        <option value="">加载中...</option>
                      ) : avatars.length === 0 ? (
                        <option value="default">默认数字人</option>
                      ) : (
                        avatars.map(a => (
                          <option key={a.id} value={a.id}>
                            {a.name} {a.is_available ? '' : '(不可用)'}
                          </option>
                        ))
                      )}
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1.5">
                      需从 app.liveavatar.com/avatars 激活更多数字人
                    </p>
                  </div>

                  {/* 模式选择 */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-2 font-medium">⚙️ 运行模式</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'full', label: 'FULL', desc: 'HeyGen 托管 WebRTC', badge: '2积分/分钟', icon: '🌐' },
                        { id: 'lite', label: 'LITE', desc: '自备 LLM + TTS + ASR', badge: '1积分/分钟', icon: '⚡' },
                      ].map(m => (
                        <button
                          key={m.id}
                          onClick={() => setMode(m.id as 'full' | 'lite')}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            mode === m.id
                              ? 'border-violet-500 bg-violet-500/20'
                              : 'border-slate-700 bg-slate-700/30 hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-bold text-white">{m.icon} {m.label}</span>
                            <span className="text-[10px] bg-violet-500/30 text-violet-300 px-1.5 py-0.5 rounded">{m.badge}</span>
                          </div>
                          <p className="text-[11px] text-slate-400">{m.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 沙盒模式 */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white font-medium">🧪 沙盒模式</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">沙盒模式不消耗积分，适合开发测试</p>
                    </div>
                    <button
                      onClick={() => setIsSandbox(v => !v)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        isSandbox ? 'bg-violet-500' : 'bg-slate-600'
                      }`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        isSandbox ? 'translate-x-7' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>

                  {/* 开始按钮 */}
                  <button
                    onClick={createSession}
                    disabled={isCreating || !status?.configured}
                    className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-violet-500/30 flex items-center justify-center gap-2"
                  >
                    {isCreating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>正在创建会话...</span>
                      </>
                    ) : (
                      <>
                        <span className="text-lg">▶</span>
                        <span>启动 LiveAvatar 数字人</span>
                      </>
                    )}
                  </button>

                  {!status?.configured && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
                      <p className="text-xs text-amber-300">
                        ⚠️ LiveAvatar API Key 未配置。请联系系统管理员，在服务端设置环境变量：
                        <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-200 ml-1">
                          HEYGEN_LIVEAVATAR_API_KEY
                        </code>
                      </p>
                    </div>
                  )}
                </div>

                {/* 特性列表 */}
                <div className="grid grid-cols-3 gap-4 w-full max-w-2xl">
                  {[
                    { icon: '🌐', title: '实时 WebRTC', desc: '低延迟视频流' },
                    { icon: '🗣️', title: '唇形同步', desc: '精确口型匹配' },
                    { icon: '🎭', title: '自然表情', desc: 'AI 驱动的面部动作' },
                    { icon: '💬', title: '语音对话', desc: '实时 1:1 交互' },
                    { icon: '📱', title: '多终端', desc: 'Web / App / iframe' },
                    { icon: '🛡️', title: '企业安全', desc: '数据加密传输' },
                  ].map(f => (
                    <div key={f.title} className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3 text-center">
                      <div className="text-2xl mb-1.5">{f.icon}</div>
                      <div className="text-xs font-semibold text-white">{f.title}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{f.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* LiveAvatar 会话区域 */
              <div className="flex-1 flex flex-col gap-4">
                {/* Session Header */}
                <div className="flex items-center justify-between bg-slate-800/60 rounded-xl px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-sm text-white font-medium">LiveAvatar 会话进行中</span>
                    <span className="text-xs text-slate-400 bg-slate-700 px-2 py-0.5 rounded">
                      {mode.toUpperCase()} · {isSandbox ? '🧪 沙盒' : '🏭 生产'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Session: {session.sessionId ? `${session.sessionId.slice(0, 12)}...` : '—'}</span>
                    <button
                      onClick={stopSession}
                      className="bg-red-500/20 hover:bg-red-500/40 text-red-300 text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      ⏹ 结束会话
                    </button>
                  </div>
                </div>

                {/* Avatar Display (iframe embed) */}
                <div className="flex-1 bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 flex flex-col">
                  {session.embedUrl ? (
                    <iframe
                      ref={iframeRef}
                      src={session.embedUrl}
                      className="flex-1 w-full border-0"
                      allow="microphone; camera; autoplay; display-capture"
                      title="HeyGen LiveAvatar"
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                    />
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
                      <div className="text-6xl animate-pulse">🎭</div>
                      <div className="text-center">
                        <p className="text-white font-medium mb-1">LiveAvatar 准备就绪</p>
                        <p className="text-slate-400 text-sm">正在加载数字人，请稍候...</p>
                      </div>
                      <div className="flex gap-2 text-xs text-slate-500">
                        <span>💡 请允许麦克风和摄像头权限</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat / Control Bar */}
                <div className="bg-slate-800/60 rounded-xl px-4 py-3 flex items-center gap-3">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
                    placeholder="输入你想对数字人说的话..."
                    className="flex-1 bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                  />
                  <button
                    onClick={sendChatMessage}
                    disabled={!chatInput.trim()}
                    className="bg-violet-600 hover:bg-violet-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5"
                  >
                    <span>✉</span>
                    <span>发送</span>
                  </button>
                  <button
                    onClick={() => setShowChat(v => !v)}
                    className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2.5 rounded-xl text-sm transition-colors"
                    title="查看对话历史"
                  >
                    💬
                  </button>
                  <a
                    href={session.embedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2.5 rounded-xl text-sm transition-colors"
                    title="在新窗口打开"
                  >
                    ↗
                  </a>
                </div>

                {/* Chat History Sidebar */}
                {showChat && (
                  <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 max-h-48 overflow-y-auto">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-slate-300">💬 对话历史</span>
                      <button onClick={() => setChatMessages([])} className="text-[10px] text-slate-500 hover:text-slate-300">
                        清空
                      </button>
                    </div>
                    {chatMessages.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-4">暂无对话记录</p>
                    ) : (
                      <div className="space-y-2">
                        {chatMessages.map((msg, i) => (
                          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-xl px-3 py-2 text-xs ${
                              msg.role === 'user'
                                ? 'bg-violet-600/80 text-white'
                                : 'bg-slate-700 text-slate-200'
                            }`}>
                              <span className="opacity-60 text-[10px] mr-1">{msg.role === 'user' ? '👤' : '🎭'}</span>
                              {msg.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Info Panel */}
          {!session && (
            <div className="w-72 bg-slate-800/40 border-l border-slate-700/60 p-5 flex flex-col gap-5 overflow-y-auto">

              {/* Quick Start Guide */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  📖 快速入门
                </h4>
                <div className="space-y-2.5">
                  {[
                    { step: '1', title: '获取 API Key', desc: '从 app.liveavatar.com/developers 获取', icon: '🔑' },
                    { step: '2', title: '创建数字人', desc: '拍摄2分钟视频，AI自动生成形象', icon: '🎥' },
                    { step: '3', title: '配置模式', desc: 'FULL 模式 HeyGen 托管 WebRTC', icon: '🌐' },
                    { step: '4', title: '启动会话', desc: '点击启动开始实时对话', icon: '▶' },
                  ].map(item => (
                    <div key={item.step} className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-violet-500/20 border border-violet-500/40 flex items-center justify-center text-[10px] font-bold text-violet-300 shrink-0 mt-0.5">
                        {item.step}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-white">{item.icon} {item.title}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Features */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  ✨ 功能特性
                </h4>
                <div className="space-y-1.5">
                  {(status?.features || [
                    'real-time-webcam', 'voice-chat', 'text-input',
                    'iframe-embed', 'web-sdk', 'lip-sync', 'facial-expressions'
                  ]).map(f => (
                    <div key={f} className="flex items-center gap-2 text-[11px] text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                      {f.replace(/-/g, ' ')}
                    </div>
                  ))}
                </div>
              </div>

              {/* SDK Info */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  🛠 SDK / API
                </h4>
                <div className="space-y-2">
                  <a
                    href="https://docs.liveavatar.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-slate-700/60 hover:bg-slate-700 rounded-xl px-3 py-2.5 text-xs text-violet-300 hover:text-violet-200 transition-colors"
                  >
                    📄 官方文档 · docs.liveavatar.com
                  </a>
                  <a
                    href="https://app.liveavatar.com/developers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-slate-700/60 hover:bg-slate-700 rounded-xl px-3 py-2.5 text-xs text-violet-300 hover:text-violet-200 transition-colors"
                  >
                    🔑 API Key 管理 · app.liveavatar.com
                  </a>
                  <a
                    href="https://github.com/heygen-com/liveavatar-web-sdk"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-slate-700/60 hover:bg-slate-700 rounded-xl px-3 py-2.5 text-xs text-violet-300 hover:text-violet-200 transition-colors"
                  >
                    📦 Web SDK · @heygen/liveavatar-web-sdk
                  </a>
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-gradient-to-br from-violet-900/40 to-purple-900/40 border border-violet-500/20 rounded-xl p-4">
                <h4 className="text-xs font-bold text-violet-200 mb-3">💰 计费说明</h4>
                <div className="space-y-2 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-300">FULL 模式</span>
                    <span className="text-violet-200 font-medium">2 积分/分钟</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">LITE 模式</span>
                    <span className="text-violet-200 font-medium">1 积分/分钟</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">沙盒环境</span>
                    <span className="text-green-300 font-medium">免费</span>
                  </div>
                </div>
              </div>

              {/* Integration */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  🔗 系统集成
                </h4>
                <div className="space-y-1.5 text-[11px] text-slate-400">
                  <p>后端 API 端点:</p>
                  <code className="block bg-slate-800 rounded-lg px-2 py-1.5 text-[10px] text-slate-300 break-all leading-relaxed">
                    POST /api/liveavatar/session<br/>
                    GET /api/liveavatar/status<br/>
                    GET /api/liveavatar/avatars
                  </code>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

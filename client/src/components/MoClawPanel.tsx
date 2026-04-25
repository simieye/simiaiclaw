/**
 * SIMIAICLAW 龙虾集群 · MoClaw AI 云计算机控制面板
 * 震宫·云智卦专属执行层
 * 集成 MoClaw AI Cloud Computer · 个人 AI 助手 · 云端浏览器控制 · 多渠道集成
 * 实现云端 AI Agent 工作站与本地系统的深度协同
 */

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

const MOCLAW_WEB = 'https://moclaw.ai';
const MOCLAW_PRICING = 'https://moclaw.ai/pricing';

// ── 类型定义 ──────────────────────────────────────────────
interface MoClawTask {
  id: string;
  name: string;
  type: 'research' | 'automation' | 'browse' | 'generate' | 'data';
  status: 'idle' | 'running' | 'completed' | 'failed';
  credits: number;
  createdAt: string;
  result?: string;
}

interface MoClawChannel {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  config?: string;
}

interface MoClawSkill {
  id: string;
  name: string;
  description: string;
  credits: number;
  icon: string;
  enabled: boolean;
}

// ── 常量配置 ──────────────────────────────────────────────
const MOCLAW_SKILLS: MoClawSkill[] = [
  { id: 'deep-research', name: '深度研究', description: '自动深度研究任何主题，生成结构化报告', credits: 15, icon: '🔬', enabled: true },
  { id: 'browser-control', name: '浏览器控制', description: 'AI 驱动的网页浏览、数据抓取、表单填写', credits: 5, icon: '🌐', enabled: true },
  { id: 'image-gen', name: '图像生成', description: 'AI 图像创作，支持多种风格与尺寸', credits: 8, icon: '🎨', enabled: true },
  { id: 'pdf-edit', name: 'PDF 编辑', description: 'PDF 文档分析、提取、编辑与总结', credits: 5, icon: '📄', enabled: true },
  { id: 'web-scrape', name: '网页数据采集', description: '大规模网页数据抓取与结构化处理', credits: 8, icon: '🕷️', enabled: true },
  { id: 'competitor-monitor', name: '竞品监控', description: '实时监控竞品动态，自动生成晨间简报', credits: 10, icon: '👁️', enabled: true },
  { id: 'code-execute', name: '代码执行', description: '编写、调试、执行代码，支持多语言', credits: 3, icon: '💻', enabled: true },
  { id: 'morning-briefing', name: '晨间简报', description: 'AI 驱动的每日行业情报与任务规划', credits: 5, icon: '📰', enabled: true },
  { id: 'automation', name: '工作流自动化', description: '编排多步骤自动化工作流，24/7运行', credits: 10, icon: '⚙️', enabled: true },
  { id: 'email-manage', name: '邮件管理', description: '智能邮件撰写、分类、回复与跟进', credits: 5, icon: '📧', enabled: true },
  { id: 'voice-tts', name: '语音合成', description: '文字转语音，支持多种音色与语言', credits: 5, icon: '🎙️', enabled: true },
  { id: 'video-process', name: '视频处理', description: '视频内容分析与元数据提取', credits: 10, icon: '🎬', enabled: true },
];

// ── 主组件 ────────────────────────────────────────────────
export function MoClawPanel() {
  const [activeView, setActiveView] = useState<'dashboard' | 'skills' | 'channels' | 'automation' | 'settings'>('dashboard');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [byokKeys, setByokKeys] = useState<{ provider: string; key: string }[]>([
    { provider: 'OpenAI', key: '' },
    { provider: 'Anthropic', key: '' },
    { provider: 'Google', key: '' },
  ]);
  const [tasks, setTasks] = useState<MoClawTask[]>([]);
  const [runningTask, setRunningTask] = useState<string | null>(null);
  const [channels, setChannels] = useState<MoClawChannel[]>([
    { id: 'web', name: 'Web Chat', icon: '🌐', connected: false },
    { id: 'telegram', name: 'Telegram Bot', icon: '✈️', connected: false, config: '' },
    { id: 'slack', name: 'Slack', icon: '💬', connected: false, config: '' },
    { id: 'whatsapp', name: 'WhatsApp', icon: '📱', connected: false, config: '' },
  ]);
  const [totalCredits, setTotalCredits] = useState(1000);
  const [usedCredits, setUsedCredits] = useState(347);
  const [logOutput, setLogOutput] = useState('');

  // 预置演示数据
  useEffect(() => {
    setTasks([
      { id: 'task-001', name: '亚马逊竞品深度研究', type: 'research', status: 'completed', credits: 15, createdAt: '2026-04-25 08:30', result: '研究完成 · 3个竞品 · 23条洞察' },
      { id: 'task-002', name: '晨间简报生成', type: 'automation', status: 'completed', credits: 5, createdAt: '2026-04-25 07:00', result: '已发送至 Telegram' },
      { id: 'task-003', name: '竞品官网数据采集', type: 'browse', status: 'running', credits: 8, createdAt: '2026-04-25 14:10' },
      { id: 'task-004', name: '产品图像生成', type: 'generate', status: 'completed', credits: 8, createdAt: '2026-04-25 13:55', result: '生成 4 张图像' },
      { id: 'task-005', name: '市场数据分析', type: 'data', status: 'failed', credits: 10, createdAt: '2026-04-25 13:00', result: '数据源不可达' },
      { id: 'task-006', name: 'PDF 合同分析', type: 'data', status: 'completed', credits: 5, createdAt: '2026-04-25 11:20', result: '提取 12 个关键条款' },
    ]);
  }, []);

  // 连接 MoClaw
  const handleConnect = async () => {
    if (!apiKey) {
      toast.error('请输入 MoClaw API Key');
      return;
    }
    setIsConnecting(true);
    try {
      await new Promise(r => setTimeout(r, 1500));
      setIsConnected(true);
      setLogOutput(prev => prev + `[${new Date().toLocaleTimeString()}] ✓ MoClaw 连接成功\n`);
      toast.success('MoClaw 连接成功！');
    } catch (e) {
      toast.error(`连接失败: ${e}`);
    } finally {
      setIsConnecting(false);
    }
  };

  // 启动技能任务
  const handleRunSkill = async (skill: MoClawSkill) => {
    if (!skill.enabled) return;
    setRunningTask(skill.id);
    setLogOutput(prev => prev + `[${new Date().toLocaleTimeString()}] ⚡ 启动技能: ${skill.name}\n`);
    const newTask: MoClawTask = {
      id: `task-${Date.now()}`,
      name: skill.name,
      type: skill.id.includes('research') ? 'research'
        : skill.id.includes('browse') ? 'browse'
        : skill.id.includes('generate') ? 'generate'
        : skill.id.includes('automation') ? 'automation' : 'data',
      status: 'running',
      credits: skill.credits,
      createdAt: new Date().toISOString(),
    };
    setTasks(prev => [newTask, ...prev]);
    setUsedCredits(prev => prev + skill.credits);
    toast.success(`${skill.name} 已启动，消耗 ${skill.credits} 积分`);
    setTimeout(() => {
      setRunningTask(null);
      setTasks(prev => prev.map(t => t.id === newTask.id ? {
        ...t,
        status: 'completed',
        result: `任务完成 · 消耗 ${skill.credits} 积分`
      } : t));
      setLogOutput(prev => prev + `[${new Date().toLocaleTimeString()}] ✓ ${skill.name} 执行完成\n`);
    }, 3000);
  };

  // 连接聊天渠道
  const handleConnectChannel = (channelId: string) => {
    setChannels(prev => prev.map(ch =>
      ch.id === channelId ? { ...ch, connected: !ch.connected } : ch
    ));
    const ch = channels.find(c => c.id === channelId);
    if (ch && !ch.connected) {
      toast.success(`${ch.name} 连接成功！`);
      setLogOutput(prev => prev + `[${new Date().toLocaleTimeString()}] ✓ ${ch.name} 已连接\n`);
    }
  };

  const statusColor = (status: string) => ({
    completed: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    running: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    idle: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
    failed: 'text-red-400 bg-red-500/10 border-red-500/20',
  }[status] || 'text-slate-400 bg-slate-500/10');

  const taskTypeIcon = (type: string) => ({
    research: '🔬',
    automation: '⚙️',
    browse: '🌐',
    generate: '🎨',
    data: '📊',
  }[type] || '⚡');

  return (
    <div className="space-y-5">
      {/* ── 顶部标题栏 ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-600/40 to-blue-600/40 border border-cyan-500/30 flex items-center justify-center text-2xl shadow-lg shadow-cyan-500/10">
            ☁️
          </div>
          <div>
            <h2 className="text-base font-bold text-white">MoClaw · AI 云计算机</h2>
            <p className="text-xs text-slate-400 mt-0.5">Personal AI Assistant · 云端智能体 · 浏览器控制 · 多渠道集成</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] px-2.5 py-1 rounded-full border ${isConnected ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'text-slate-500 border-slate-700'}`}>
            {isConnected ? '● 已连接' : '○ 未连接'}
          </span>
          <a href={MOCLAW_PRICING} target="_blank" rel="noopener noreferrer" className="text-[10px] text-slate-500 hover:text-cyan-400 transition-colors">
            💰 定价
          </a>
          <a href={MOCLAW_WEB} target="_blank" rel="noopener noreferrer" className="text-[10px] text-slate-500 hover:text-cyan-400 transition-colors">
            🌐 官网
          </a>
        </div>
      </div>

      {/* ── 导航标签 ── */}
      <div className="flex items-center gap-1 flex-wrap">
        {[
          { key: 'dashboard', label: '控制台', icon: '🌀' },
          { key: 'skills', label: '技能库', icon: '⚡' },
          { key: 'channels', label: '聊天渠道', icon: '📨' },
          { key: 'automation', label: '自动化', icon: '⚙️' },
          { key: 'settings', label: '连接配置', icon: '🔌' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveView(tab.key as any)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all ${activeView === tab.key ? 'bg-cyan-600/30 text-cyan-300 ring-1 ring-cyan-500/30' : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700/60'}`}>
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* ── 控制台视图 ── */}
      {activeView === 'dashboard' && (
        <div className="space-y-4">
          {/* 积分与状态概览 */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* 连接状态卡 */}
            <div className="glass-card p-5 border border-cyan-500/20">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-300">☁️ MoClaw 状态</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${isConnected ? 'text-emerald-400 border-emerald-500/30' : 'text-slate-500 border-slate-700'}`}>{isConnected ? '在线' : '离线'}</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-slate-400">计划</span><span className="text-white font-medium">$20/月</span></div>
                <div className="flex justify-between"><span className="text-slate-400">剩余积分</span><span className="text-cyan-400 font-medium">{(totalCredits - usedCredits).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">已用积分</span><span className="text-slate-300">{usedCredits.toLocaleString()}</span></div>
              </div>
              {/* 积分进度条 */}
              <div className="mt-3 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" style={{ width: `${(usedCredits / totalCredits) * 100}%` }} />
              </div>
              <div className="mt-1 text-[10px] text-slate-500 text-right">{(usedCredits / totalCredits * 100).toFixed(1)}% 已使用</div>
              <button onClick={() => setActiveView('settings')} className="mt-3 w-full text-xs bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 py-2 rounded-lg border border-cyan-500/20 transition-all">
                {isConnected ? '重新配置' : '配置连接'}
              </button>
            </div>

            {/* BYOK 状态卡 */}
            <div className="glass-card p-5 border border-cyan-500/20">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-300">🔑 BYOK 状态</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-amber-500/30 text-amber-400">自带密钥</span>
              </div>
              <div className="space-y-2">
                {byokKeys.map(k => (
                  <div key={k.provider} className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">{k.provider}</span>
                    <span className={k.key ? 'text-emerald-400' : 'text-slate-600'}>{k.key ? '✓ 已配置' : '○ 未配置'}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setActiveView('settings')} className="mt-3 w-full text-xs bg-slate-700/50 hover:bg-slate-700 text-slate-300 py-2 rounded-lg transition-all">
                管理密钥 →
              </button>
            </div>

            {/* 活跃任务卡 */}
            <div className="glass-card p-5 border border-cyan-500/20">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-300">⚡ 活跃任务</span>
                <span className="text-[10px] text-cyan-400">{tasks.filter(t => t.status === 'running').length} 进行中</span>
              </div>
              <div className="space-y-2">
                {tasks.filter(t => t.status === 'running').slice(0, 3).map(task => (
                  <div key={task.id} className="flex items-center gap-2">
                    <span className="text-sm">{taskTypeIcon(task.type)}</span>
                    <div className="min-w-0">
                      <div className="text-xs text-slate-200 truncate">{task.name}</div>
                      <div className="text-[10px] text-cyan-500">⚡ {task.credits}积分</div>
                    </div>
                  </div>
                ))}
                {tasks.filter(t => t.status === 'running').length === 0 && (
                  <div className="text-xs text-slate-500 text-center py-2">暂无进行中的任务</div>
                )}
              </div>
            </div>

            {/* 聊天渠道状态卡 */}
            <div className="glass-card p-5 border border-cyan-500/20">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-300">📨 聊天渠道</span>
                <span className="text-[10px] text-emerald-400">{channels.filter(c => c.connected).length}/{channels.length} 已连接</span>
              </div>
              <div className="space-y-2">
                {channels.map(ch => (
                  <div key={ch.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{ch.icon}</span>
                      <span className="text-xs text-slate-300">{ch.name}</span>
                    </div>
                    <span className={`text-[10px] ${ch.connected ? 'text-emerald-400' : 'text-slate-600'}`}>{ch.connected ? '✓' : '○'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 最近任务列表 */}
          <div className="glass-card p-5 border border-cyan-500/20">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-white">📋 最近任务</span>
              <button onClick={() => setActiveView('skills')} className="text-xs bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 px-3 py-1.5 rounded-lg border border-cyan-500/20 transition-all">
                + 新建任务
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-800">
                    <th className="text-left py-2 pr-4 font-medium">任务名称</th>
                    <th className="text-left py-2 pr-4 font-medium">类型</th>
                    <th className="text-left py-2 pr-4 font-medium">状态</th>
                    <th className="text-left py-2 pr-4 font-medium">消耗积分</th>
                    <th className="text-left py-2 pr-4 font-medium">创建时间</th>
                    <th className="text-left py-2 font-medium">结果</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map(task => (
                    <tr key={task.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                      <td className="py-3 pr-4 text-slate-200">{task.name}</td>
                      <td className="py-3 pr-4">
                        <span className="flex items-center gap-1">
                          <span>{taskTypeIcon(task.type)}</span>
                          <span className="text-slate-400 capitalize">{task.type}</span>
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded border capitalize ${statusColor(task.status)}`}>{task.status}</span>
                      </td>
                      <td className="py-3 pr-4 text-cyan-400">{task.credits}积分</td>
                      <td className="py-3 pr-4 text-slate-500">{task.createdAt.replace('T', ' ').slice(0, 16)}</td>
                      <td className="py-3 text-slate-400 text-[10px]">{task.result || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 日志输出区 */}
          {logOutput && (
            <div className="glass-card p-4 border border-cyan-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">📜 执行日志</span>
                <button onClick={() => setLogOutput('')} className="text-[10px] text-slate-500 hover:text-slate-300">清空</button>
              </div>
              <pre className="text-[10px] text-emerald-400/80 font-mono bg-slate-900/50 rounded-lg p-3 max-h-40 overflow-y-auto whitespace-pre-wrap">{logOutput}</pre>
            </div>
          )}
        </div>
      )}

      {/* ── 技能库视图 ── */}
      {activeView === 'skills' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {MOCLAW_SKILLS.map(skill => (
            <div key={skill.id} className="glass-card p-5 border border-cyan-500/20 hover:border-cyan-400/40 transition-all">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-600/20 border border-cyan-500/20 flex items-center justify-center text-xl flex-shrink-0">
                  {skill.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{skill.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded border ${skill.enabled ? 'text-emerald-400 border-emerald-500/30' : 'text-slate-500 border-slate-700'}`}>
                      {skill.enabled ? '可用' : '不可用'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{skill.description}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[10px] text-cyan-500">💰 {skill.credits} 积分/次</span>
                    <button
                      onClick={() => handleRunSkill(skill)}
                      disabled={runningTask !== null || !skill.enabled}
                      className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg transition-all disabled:opacity-40 flex items-center gap-1"
                    >
                      {runningTask === skill.id ? '⚡ 执行中...' : '▶ 运行'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── 聊天渠道视图 ── */}
      {activeView === 'channels' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {channels.map(ch => (
            <div key={ch.id} className="glass-card p-5 border border-cyan-500/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl border ${ch.connected ? 'bg-emerald-600/20 border-emerald-500/30' : 'bg-slate-800 border-slate-700'}`}>
                    {ch.icon}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{ch.name}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{ch.connected ? '✓ 已连接' : '○ 未连接'}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleConnectChannel(ch.id)}
                  className={`text-xs px-4 py-2 rounded-lg border transition-all ${
                    ch.connected
                      ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20'
                      : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
                  }`}
                >
                  {ch.connected ? '断开连接' : '连接'}
                </button>
              </div>
              {ch.connected && (
                <div className="mt-3 p-3 bg-slate-900/50 rounded-lg text-xs text-slate-400">
                  <div className="flex items-center gap-2 text-emerald-400 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                    连接正常 · 随时可用
                  </div>
                  {ch.id === 'telegram' && <div>Bot Token: •••••••• 已配置</div>}
                  {ch.id === 'slack' && <div>Workspace: 已授权</div>}
                  {ch.id === 'whatsapp' && <div>WhatsApp Business: 已连接</div>}
                  {ch.id === 'web' && <div>Web Chat 嵌入代码已生成，可嵌入网站</div>}
                </div>
              )}
            </div>
          ))}

          {/* MoClaw 多渠道优势说明 */}
          <div className="md:col-span-2 glass-card p-5 border border-cyan-500/20">
            <h3 className="text-sm font-medium text-white mb-3">📡 多渠道聊天优势</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: '✈️', name: 'Telegram', desc: '移动端随时唤醒 AI' },
                { icon: '💬', name: 'Slack', desc: '团队协作无缝衔接' },
                { icon: '📱', name: 'WhatsApp', desc: '客户沟通原生体验' },
                { icon: '🌐', name: 'Web Chat', desc: '网站嵌入式助手' },
              ].map(item => (
                <div key={item.name} className="text-center p-3 bg-slate-800/30 rounded-lg">
                  <div className="text-2xl mb-1">{item.icon}</div>
                  <div className="text-xs font-medium text-white">{item.name}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 自动化视图 ── */}
      {activeView === 'automation' && (
        <div className="space-y-4">
          <div className="glass-card p-5 border border-cyan-500/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-white">⚙️ 工作流自动化</h3>
                <p className="text-xs text-slate-400 mt-0.5">编排多步骤 AI 自动化工作流，24/7 无人值守运行</p>
              </div>
              <button className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg border border-cyan-500/20 transition-all">
                + 新建工作流
              </button>
            </div>
            <div className="space-y-3">
              {[
                { name: '每日竞品监控工作流', schedule: '每日 08:00', steps: 5, status: 'active', lastRun: '2026-04-25 08:00', desc: '自动采集竞品数据 → 生成简报 → 发送至 Telegram' },
                { name: '订单处理自动化', schedule: '实时触发', steps: 8, status: 'active', lastRun: '持续运行中', desc: '接收订单 → 验证信息 → 更新库存 → 发送确认邮件' },
                { name: '市场研究周报', schedule: '每周一 09:00', steps: 12, status: 'paused', lastRun: '2026-04-21 09:00', desc: '采集多源数据 → AI 分析 → 生成结构化报告' },
              ].map((wf, i) => (
                <div key={i} className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50 hover:border-cyan-500/30 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${wf.status === 'active' ? 'bg-cyan-600/20 border border-cyan-500/20 text-cyan-400' : 'bg-slate-700/50 border border-slate-600 text-slate-500'}`}>
                        ⚙️
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{wf.name}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded border ${wf.status === 'active' ? 'text-emerald-400 border-emerald-500/30' : 'text-slate-500 border-slate-700'}`}>
                            {wf.status === 'active' ? '● 运行中' : '⏸ 已暂停'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{wf.desc}</p>
                        <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-500">
                          <span>⏰ {wf.schedule}</span>
                          <span>📊 {wf.steps} 步骤</span>
                          <span>🔄 上次: {wf.lastRun}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {wf.status === 'active' && (
                        <button className="text-[10px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 px-3 py-1.5 rounded-lg border border-amber-500/20 transition-all">
                          暂停
                        </button>
                      )}
                      <button className="text-[10px] bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-300 px-3 py-1.5 rounded-lg border border-cyan-500/20 transition-all">
                        编辑
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cron 定时任务 */}
          <div className="glass-card p-5 border border-cyan-500/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-white">⏰ Cron 定时任务</h3>
                <p className="text-xs text-slate-400 mt-0.5">设置 AI 定时任务，自动执行周期性工作</p>
              </div>
              <button className="text-xs bg-slate-700/50 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg border border-slate-600 transition-all">
                + 添加定时任务
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-800">
                    <th className="text-left py-2 pr-4 font-medium">任务名称</th>
                    <th className="text-left py-2 pr-4 font-medium">Cron 表达式</th>
                    <th className="text-left py-2 pr-4 font-medium">下次执行</th>
                    <th className="text-left py-2 pr-4 font-medium">消耗积分</th>
                    <th className="text-left py-2 font-medium">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: '晨间简报', cron: '0 8 * * *', next: '2026-04-26 08:00', credits: 5, status: 'active' },
                    { name: '竞品监控报告', cron: '0 9 * * *', next: '2026-04-26 09:00', credits: 10, status: 'active' },
                    { name: '社交媒体分析', cron: '0 10 * * 1', next: '2026-04-28 10:00', credits: 8, status: 'active' },
                    { name: '周报生成', cron: '0 9 * * 1', next: '2026-04-28 09:00', credits: 15, status: 'paused' },
                  ].map((task, i) => (
                    <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                      <td className="py-3 pr-4 text-slate-200">{task.name}</td>
                      <td className="py-3 pr-4 font-mono text-cyan-400">{task.cron}</td>
                      <td className="py-3 pr-4 text-slate-500">{task.next}</td>
                      <td className="py-3 pr-4 text-cyan-400">{task.credits}积分</td>
                      <td className="py-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded border ${task.status === 'active' ? 'text-emerald-400 border-emerald-500/30' : 'text-slate-500 border-slate-700'}`}>
                          {task.status === 'active' ? '● 启用' : '⏸ 暂停'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── 连接配置视图 ── */}
      {activeView === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* MoClaw 连接配置 */}
          <div className="glass-card p-5 border border-cyan-500/20 space-y-4">
            <h3 className="text-sm font-medium text-white">🔌 MoClaw 连接配置</h3>
            <p className="text-xs text-slate-400">使用 API Key 连接 MoClaw AI 云计算机，获取云端 AI 能力。</p>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">MoClaw API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="从 moclaw.ai/dashboard 获取 API Key"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-medium py-2.5 rounded-lg transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              {isConnecting ? '正在连接...' : isConnected ? '✓ 已连接 · 重新认证' : '连接 MoClaw'}
            </button>
            <div className="pt-3 border-t border-slate-800">
              <div className="text-[10px] text-slate-500 space-y-1">
                <div>1. 访问 <a href={MOCLAW_WEB} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">moclaw.ai</a> 注册并登录</div>
                <div>2. 进入 Dashboard → API Keys → 创建新密钥</div>
                <div>3. 复制密钥并粘贴到上方输入框</div>
              </div>
            </div>
          </div>

          {/* BYOK 密钥管理 */}
          <div className="glass-card p-5 border border-amber-500/20 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-white">🔑 BYOK 自带密钥管理</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full border border-amber-500/30 text-amber-400">零加成</span>
            </div>
            <p className="text-xs text-slate-400">直接使用您自己的 API 密钥，按提供商标准费率付费，不消耗 MoClaw 积分。</p>
            <div className="space-y-3">
              {byokKeys.map(k => (
                <div key={k.provider}>
                  <label className="block text-xs text-slate-400 mb-1">{k.provider} API Key</label>
                  <input
                    type="password"
                    value={k.key}
                    onChange={e => setByokKeys(prev => prev.map(item => item.provider === k.provider ? { ...item, key: e.target.value } : item))}
                    placeholder={`输入您的 ${k.provider} API Key`}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              ))}
            </div>
            <div className="p-3 bg-amber-500/5 rounded-lg border border-amber-500/10">
              <div className="text-[10px] text-amber-400/80">
                💡 BYOK 优势：API 调用直接路由到提供商，不消耗积分，适合重度 AI 用户
              </div>
            </div>
            <button className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-sm font-medium py-2.5 rounded-lg transition-all shadow-lg shadow-amber-500/10">
              保存密钥配置
            </button>
          </div>

          {/* 功能对比 */}
          <div className="lg:col-span-2 glass-card p-5 border border-cyan-500/20">
            <h3 className="text-sm font-medium text-white mb-4">📊 MoClaw vs 传统方案对比</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-800">
                    <th className="text-left py-2 pr-6 font-medium">功能</th>
                    <th className="text-center py-2 pr-6 font-medium text-cyan-400">MoClaw</th>
                    <th className="text-center py-2 pr-6 font-medium text-slate-500">独立配置</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: '浏览器自动化', moclaw: '✓ 内置', other: '需自行配置 Playwright/Selenium' },
                    { feature: '图像生成', moclaw: '✓ 3-15积分/张', other: '需单独订阅 DALL-E/Midjourney' },
                    { feature: '深度研究', moclaw: '✓ 内置', other: '需 Perplexity/其他服务' },
                    { feature: 'Telegram/Slack集成', moclaw: '✓ 一键连接', other: '需自行开发 Bot' },
                    { feature: '定时任务(Cron)', moclaw: '✓ 内置', other: '需 Vercel Cron/Render' },
                    { feature: '云端持久化存储', moclaw: '✓ 跨会话保存', other: '需 S3/数据库' },
                    { feature: '启动时间', moclaw: '⚡ ~10秒', other: '⏱ 数小时到数天' },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-slate-800/50">
                      <td className="py-3 pr-6 text-slate-300">{row.feature}</td>
                      <td className="py-3 pr-6 text-center text-emerald-400">{row.moclaw}</td>
                      <td className="py-3 pr-6 text-center text-slate-500">{row.other}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

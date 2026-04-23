/**
 * MCP 连接器设置面板
 * 管理外部软件和平台连接
 */
import React, { useEffect, useState } from 'react';
import { api, type MCPServerTemplate, type MCPServer } from '../api/client';
import { toast } from 'sonner';

const CATEGORY_ICONS: Record<string, string> = {
  database: '💾', devtools: '🔧', communication: '📡',
  storage: '🗄️', ai: '🤖', workflow: '🔗', payment: '💳',
  ecommerce: '🛒', social: '💬', other: '🔌',
};

const STATUS_COLORS: Record<string, string> = {
  connected: 'text-emerald-400 bg-emerald-500/10',
  disconnected: 'text-slate-400 bg-slate-500/10',
  connecting: 'text-amber-400 bg-amber-500/10',
  error: 'text-red-400 bg-red-500/10',
};

export function MCPSettings() {
  const [activeTab, setActiveTab] = useState<'servers' | 'templates'>('servers');
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [templates, setTemplates] = useState<MCPServerTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<MCPServerTemplate | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tRes, sRes] = await Promise.all([api.getMCPTemplates(), api.getMCPServers()]);
      setTemplates(tRes.templates);
      setServers(sRes.servers);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleAddServer = async () => {
    if (!selectedTemplate) return;
    const missing = selectedTemplate.fields.filter(f => f.required && !formValues[f.key]);
    if (missing.length > 0) {
      toast.error(`请填写必填字段：${missing.map(f => f.label).join(', ')}`);
      return;
    }
    setCreating(true);
    try {
      await api.createMCPServer(selectedTemplate.id, formValues._name || selectedTemplate.name, formValues);
      toast.success('服务器已添加');
      setShowAdd(false);
      setSelectedTemplate(null);
      setFormValues({});
      loadData();
    } catch (e) { toast.error(String(e)); }
    setCreating(false);
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    try {
      const res = await api.testMCPConnection(id);
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
      loadData();
    } catch (e) { toast.error(String(e)); }
    setTestingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此连接器？')) return;
    await api.deleteMCPServer(id);
    toast.success('已删除');
    loadData();
  };

  const groupedTemplates = templates.reduce((acc, t) => {
    const cat = t.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(t);
    return acc;
  }, {} as Record<string, MCPServerTemplate[]>);

  return (
    <div className="space-y-5">
      {/* 顶部：标题 + 添加按钮 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            🔌 MCP 连接器
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">连接外部软件和平台，消除数据孤岛</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
        >
          + 添加连接器
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: '已连接', value: servers.filter(s => s.status === 'connected').length, color: 'text-emerald-400', icon: '🟢' },
          { label: '未连接', value: servers.filter(s => s.status === 'disconnected').length, color: 'text-slate-400', icon: '⚪' },
          { label: '连接错误', value: servers.filter(s => s.status === 'error').length, color: 'text-red-400', icon: '🔴' },
          { label: '可用模板', value: templates.length, color: 'text-indigo-400', icon: '📦' },
        ].map(s => (
          <div key={s.label} className="glass-card p-3 text-center">
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-400 mt-0.5">{s.icon} {s.label}</div>
          </div>
        ))}
      </div>

      {/* 已配置的服务器列表 */}
      {servers.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-slate-400">已配置的连接器</h4>
          {servers.map(server => (
            <div key={server.id} className="glass-card p-4 flex items-center gap-4">
              <div className="text-2xl">{server.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white text-sm">{server.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[server.status]}`}>
                    {server.status === 'connected' ? '已连接' : server.status === 'disconnected' ? '未连接' : server.status === 'error' ? '错误' : '连接中'}
                  </span>
                  <span className="text-xs text-slate-500">{CATEGORY_ICONS[server.category] || '🔌'} {server.category}</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 truncate">{server.endpoint || server.description}</p>
                {server.errorMessage && (
                  <p className="text-xs text-red-400 mt-0.5">⚠️ {server.errorMessage}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleTest(server.id)}
                  disabled={testingId === server.id}
                  className="text-xs bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-400 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  {testingId === server.id ? '测试中...' : '测试连接'}
                </button>
                <button
                  onClick={() => handleDelete(server.id)}
                  className="text-xs bg-red-600/10 hover:bg-red-600/30 text-red-400 px-3 py-1.5 rounded-lg transition-colors"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 空白状态 */}
      {servers.length === 0 && (
        <div className="glass-card p-8 text-center">
          <div className="text-4xl mb-3">🔌</div>
          <p className="text-slate-400 text-sm">暂无连接器</p>
          <p className="text-slate-500 text-xs mt-1">添加第一个 MCP 连接器，连接你的外部软件生态</p>
          <button
            onClick={() => setShowAdd(true)}
            className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-2 rounded-lg transition-colors"
          >
            + 添加第一个连接器
          </button>
        </div>
      )}

      {/* 模板快速入口 */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-slate-400">快速添加 · 按类别</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {Object.entries(groupedTemplates).map(([cat, tpls]) => (
            <div key={cat} className="glass-card p-3">
              <div className="text-xs font-medium text-slate-300 mb-2">{CATEGORY_ICONS[cat] || '🔌'} {cat}</div>
              <div className="space-y-1">
                {tpls.map(t => (
                  <button
                    key={t.id}
                    onClick={() => { setSelectedTemplate(t); setShowAdd(true); }}
                    className="block w-full text-left text-xs text-slate-400 hover:text-white hover:bg-white/5 px-2 py-1 rounded transition-colors"
                  >
                    {t.icon} {t.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 添加连接器弹窗 */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-lg max-h-[80vh] overflow-y-auto">
            {!selectedTemplate ? (
              <>
                <div className="p-5 border-b border-white/10">
                  <h3 className="font-semibold text-white text-sm">选择连接器模板</h3>
                  <p className="text-xs text-slate-400 mt-0.5">选择一个平台开始配置</p>
                </div>
                <div className="p-4 space-y-3">
                  {Object.entries(groupedTemplates).map(([cat, tpls]) => (
                    <div key={cat}>
                      <div className="text-xs text-slate-500 mb-1.5">{CATEGORY_ICONS[cat] || '🔌'} {cat.toUpperCase()}</div>
                      <div className="space-y-1">
                        {tpls.map(t => (
                          <button
                            key={t.id}
                            onClick={() => setSelectedTemplate(t)}
                            className="w-full text-left glass-card p-3 hover:bg-white/5 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{t.icon}</span>
                              <div>
                                <div className="text-sm font-medium text-white">{t.name}</div>
                                <div className="text-xs text-slate-400">{t.description}</div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="p-5 border-b border-white/10 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{selectedTemplate.icon}</span>
                      <h3 className="font-semibold text-white text-sm">{selectedTemplate.name}</h3>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{selectedTemplate.description}</p>
                  </div>
                  <button onClick={() => { setShowAdd(false); setSelectedTemplate(null); setFormValues({}); }} className="text-slate-400 hover:text-white">✕</button>
                </div>
                <div className="p-5 space-y-4">
                  {selectedTemplate.fields.map(field => (
                    <div key={field.key}>
                      <label className="block text-xs text-slate-400 mb-1.5">
                        {field.label}
                        {field.required && <span className="text-red-400 ml-1">*</span>}
                        {field.helpText && <span className="text-slate-500 ml-1">· {field.helpText}</span>}
                      </label>
                      {field.type === 'select' ? (
                        <select
                          value={formValues[field.key] || ''}
                          onChange={e => setFormValues({ ...formValues, [field.key]: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                        >
                          <option value="">请选择...</option>
                          {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      ) : (
                        <input
                          type={field.type === 'password' ? 'password' : field.type === 'url' ? 'url' : 'text'}
                          placeholder={field.placeholder}
                          value={formValues[field.key] || ''}
                          onChange={e => setFormValues({ ...formValues, [field.key]: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="p-5 border-t border-white/10 flex items-center justify-between">
                  <button
                    onClick={() => { setSelectedTemplate(null); setFormValues({}); }}
                    className="text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    ← 返回选择
                  </button>
                  <button
                    onClick={handleAddServer}
                    disabled={creating}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium px-5 py-2 rounded-lg transition-colors"
                  >
                    {creating ? '添加中...' : '添加连接器'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

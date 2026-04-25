/**
 * SIMIAICLAW 龙虾集群 · Happycapy Skills 面板
 * 坎宫·技能商店卦 · 集成 happycapy.ai 技能市场
 * 支持: 浏览/安装/卸载来自 happycapy-ai/Happycapy-skills 的 Claude Skills
 */

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

const API = '/api/happycapy';

interface Skill {
  name: string;
  description: string;
  category: string;
  installed: boolean;
}

const CATEGORIES = [
  { id: 'all', label: '全部', emoji: '🌐' },
  { id: 'design-media', label: '设计·媒体', emoji: '🎨' },
  { id: 'content-doc', label: '内容·文档', emoji: '📄' },
  { id: 'dev-tools', label: '开发工具', emoji: '🔧' },
  { id: 'social-comm', label: '社交·通讯', emoji: '💬' },
  { id: 'data', label: '数据·分析', emoji: '📊' },
  { id: 'security', label: '安全·认证', emoji: '🔐' },
  { id: 'meta', label: '元技能', emoji: '🧠' },
  { id: 'other', label: '其他', emoji: '📦' },
];

const CategoryIcon: React.FC<{ cat: string }> = ({ cat }) => {
  const c = CATEGORIES.find(x => x.id === cat);
  return <span title={c?.label}>{c?.emoji ?? '📦'}</span>;
};

export const HappycapyPanel: React.FC = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSkill, setLoadingSkill] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState<{ name: string; content: string } | null>(null);
  const [installing, setInstalling] = useState<string | null>(null);
  const [showInstalled, setShowInstalled] = useState(false);

  const loadSkills = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/skills`);
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json();
      setSkills(data.skills || []);
    } catch (e) {
      toast.error('获取技能列表失败: ' + String(e));
      setSkills([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSkills(); }, [loadSkills]);

  const filtered = skills.filter(s => {
    const matchCat = showInstalled ? s.installed : filter === 'all' || s.category === filter;
    const matchSearch = !search || s.name.includes(search) || s.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleInstall = async (name: string) => {
    setInstalling(name);
    try {
      const r = await fetch(`${API}/skills/${name}/install`, { method: 'POST' });
      if (!r.ok) throw new Error(await r.text());
      setSkills(prev => prev.map(s => s.name === name ? { ...s, installed: true } : s));
      toast.success(`已安装「${name}」`);
    } catch (e) {
      toast.error(`安装「${name}」失败: ` + String(e));
    } finally {
      setInstalling(null);
    }
  };

  const handleUninstall = async (name: string) => {
    setInstalling(name);
    try {
      const r = await fetch(`${API}/skills/${name}/install`, { method: 'DELETE' });
      if (!r.ok) throw new Error(await r.text());
      setSkills(prev => prev.map(s => s.name === name ? { ...s, installed: false } : s));
      toast.success(`已卸载「${name}」`);
    } catch (e) {
      toast.error(`卸载「${name}」失败: ` + String(e));
    } finally {
      setInstalling(null);
    }
  };

  const handleViewDetail = async (name: string) => {
    if (detail?.name === name) { setDetail(null); return; }
    setLoadingSkill(name);
    try {
      const r = await fetch(`${API}/skills/${name}`);
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json();
      setDetail(data);
    } catch (e) {
      toast.error('获取详情失败: ' + String(e));
    } finally {
      setLoadingSkill(null);
    }
  };

  return (
    <div style={{ padding: '16px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '15px' }}>Happycapy Skills</h3>
          <p style={{ margin: '2px 0 0', color: '#94a3b8', fontSize: '12px' }}>
            来自 <a href="https://github.com/happycapy-ai/Happycapy-skills" target="_blank" rel="noreferrer" style={{ color: '#60a5fa' }}>happycapy-ai/Happycapy-skills</a> · Claude Code 技能商店
          </p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#94a3b8', cursor: 'pointer' }}>
            <input type="checkbox" checked={showInstalled} onChange={e => setShowInstalled(e.target.checked)} />
            仅显示已安装
          </label>
          <button onClick={loadSkills} style={btnStyle('#1e293b')}>🔄 刷新</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索技能..." style={{ ...inputStyle, flex: 1, minWidth: 200 }} />
        {CATEGORIES.map(c => (
          <button key={c.id} onClick={() => setFilter(c.id)} style={{ ...catBtnStyle, background: filter === c.id ? '#3b82f6' : '#1e293b', color: filter === c.id ? '#fff' : '#94a3b8' }}>
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>加载中...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          {showInstalled ? '暂无已安装的技能' : '未找到匹配的技能'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
          {filtered.map(skill => (
            <div key={skill.name} style={{ ...cardStyle, border: skill.installed ? '1px solid #22c55e44' : '1px solid #334155' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                <CategoryIcon cat={skill.category} />
                <strong style={{ fontSize: '13px', flex: 1 }}>{skill.name}</strong>
                {skill.installed && <span style={{ fontSize: '10px', background: '#22c55e22', color: '#4ade80', padding: '1px 6px', borderRadius: '4px' }}>已安装</span>}
              </div>
              <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>{skill.description || '无描述'}</p>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => handleViewDetail(skill.name)} disabled={loadingSkill === skill.name} style={{ ...btnStyle('#1e293b'), flex: 1, fontSize: '11px' }}>
                  {loadingSkill === skill.name ? '加载中...' : detail?.name === skill.name ? '收起详情' : '📖 查看 SKILL.md'}
                </button>
                {skill.installed ? (
                  <button onClick={() => handleUninstall(skill.name)} disabled={installing === skill.name} style={{ ...btnStyle('#7f1d1d'), fontSize: '11px' }}>
                    {installing === skill.name ? '卸载中...' : '🗑 卸载'}
                  </button>
                ) : (
                  <button onClick={() => handleInstall(skill.name)} disabled={installing === skill.name} style={{ ...btnStyle('#14532d'), fontSize: '11px' }}>
                    {installing === skill.name ? '安装中...' : '⬇ 安装'}
                  </button>
                )}
              </div>
              {detail?.name === skill.name && (
                <div style={{ marginTop: '10px', borderTop: '1px solid #334155', paddingTop: '8px' }}>
                  <pre style={{ margin: 0, fontSize: '10px', color: '#94a3b8', whiteSpace: 'pre-wrap', maxHeight: '300px', overflow: 'auto', lineHeight: 1.5, background: '#0f172a', padding: '8px', borderRadius: '6px' }}>
                    {detail.content}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '16px', padding: '12px', background: '#0f172a', borderRadius: '8px', fontSize: '12px', color: '#64748b' }}>
        💡 <strong style={{ color: '#94a3b8' }}>安装</strong> 后技能保存到 <code style={{ color: '#60a5fa' }}>data/skills/happycapy-skills/</code>，
        可被 SIMIAICLAW 龙虾集群 AI 直接调用。<a href="https://github.com/happycapy-ai/Happycapy-skills" target="_blank" rel="noreferrer" style={{ color: '#60a5fa' }}>查看 GitHub 仓库 →</a>
      </div>
    </div>
  );
};

const inputStyle: React.CSSProperties = { background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#e2e8f0', padding: '6px 10px', fontSize: '13px', outline: 'none' };
const btnStyle = (bg: string): React.CSSProperties => ({ background: bg, border: '1px solid #334155', borderRadius: '6px', color: '#e2e8f0', padding: '5px 10px', fontSize: '12px', cursor: 'pointer' });
const catBtnStyle: React.CSSProperties = { border: '1px solid #334155', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap' };
const cardStyle: React.CSSProperties = { background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '12px' };

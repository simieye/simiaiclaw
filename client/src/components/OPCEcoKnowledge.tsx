/**
 * OPC生态合作知识库
 * 每个子菜单页面独立知识库，保存生态资料与共享，支持一键分发全球社媒和独立网站
 */
import React, { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';

// ── 类型定义 ──────────────────────────────────────────────

export type EcoSubMenu =
  | 'opc-map' | 'opc-vendors' | 'opc-community' | 'opc-park'
  | 'opc-super' | 'opc-phone' | 'opc-box' | 'opc-incubator' | 'opc-ai-eco';

type SocialPlatform = 'twitter' | 'linkedin' | 'weibo' | 'xiaohongshu' | 'zhihu' | 'wechat' | 'bilibili' | 'youtube' | 'tiktok';

interface EcoMaterial {
  id: string;
  name: string;
  type: 'pdf' | 'ppt' | 'doc' | 'image' | 'video' | 'link' | 'article';
  size?: number;
  uploadedAt: string;
  author: string;
  tags: string[];
  description: string;
  views: number;
  shares: number;
  status: 'draft' | 'published' | 'distributed';
  platformStatus?: Partial<Record<SocialPlatform, 'pending' | 'success' | 'failed'>>;
  thumbnail?: string;
  url?: string;
}

interface DistChannel {
  id: SocialPlatform;
  name: string;
  icon: string;
  color: string;
  bg: string;
  description: string;
  enabled: boolean;
 粉丝: string;
  maxChars: number;
}

// ── 常量数据 ──────────────────────────────────────────────

const SUBMENU_KB_CONFIG: Record<EcoSubMenu, { name: string; icon: string; tagline: string; color: string }> = {
  'opc-map':       { name: 'OPC生态地图知识库',       icon: '🗺', tagline: '全国产业布局与政策资料',  color: '#00C9A7' },
  'opc-vendors':   { name: '全球厂商生态知识库',      icon: '🌐', tagline: '生态厂商介绍与合资料',     color: '#7C3AED' },
  'opc-community': { name: 'OPC社区知识库',            icon: '👥', tagline: '社群运营与活动资料',       color: '#3B82F6' },
  'opc-park':      { name: '产业园区知识库',          icon: '🏭', tagline: '园区政策与入驻指南',       color: '#F59E0B' },
  'opc-super':     { name: '超级个体知识库',          icon: '🚀', tagline: '创业方法论与工具包',       color: '#10B981' },
  'opc-phone':     { name: '龙虾手机知识库',          icon: '📱', tagline: '硬件产品手册与评测',       color: '#8B5CF6' },
  'opc-box':       { name: '龙虾云盒子知识库',        icon: '📦', tagline: '边缘设备文档与方案',       color: '#06B6D4' },
  'opc-incubator': { name: '创投孵化知识库',          icon: '💼', tagline: '投资机构与孵化项目',       color: '#EC4899' },
  'opc-ai-eco':    { name: 'AI智能体生态知识库',     icon: '🤖', tagline: '技术文档与生态合作方案',   color: '#EF4444' },
};

// 社媒分发渠道
const SOCIAL_CHANNELS: DistChannel[] = [
  { id: 'twitter',       name: 'X (Twitter)',    icon: '🐦', color: 'text-white',       bg: 'bg-zinc-800',    description: '国际AI/科技社区',     enabled: true,  粉丝: '15.6万',  maxChars: 280 },
  { id: 'linkedin',      name: 'LinkedIn',      icon: '💼', color: 'text-blue-400',     bg: 'bg-blue-950',    description: '职业社交·商务传播',   enabled: true,  粉丝: '8.2万',   maxChars: 3000 },
  { id: 'weibo',         name: '微博',           icon: '📡', color: 'text-orange-400',   bg: 'bg-orange-950',  description: '中文科技话题广场',    enabled: true,  粉丝: '23.4万',  maxChars: 2000 },
  { id: 'xiaohongshu',   name: '小红书',         icon: '📒', color: 'text-pink-400',     bg: 'bg-pink-950',   description: '生活方式·种草传播',   enabled: true,  粉丝: '12.8万',  maxChars: 1000 },
  { id: 'zhihu',         name: '知乎',           icon: '💬', color: 'text-blue-400',      bg: 'bg-blue-950',   description: '深度问答·知识分享',   enabled: true,  粉丝: '5.6万',   maxChars: 5000 },
  { id: 'wechat',        name: '微信公众号',     icon: '💌', color: 'text-green-400',     bg: 'bg-green-950',  description: '私域传播·深度阅读',   enabled: true,  粉丝: '3.2万',   maxChars: 20000 },
  { id: 'bilibili',      name: 'B站',           icon: '📺', color: 'text-pink-400',     bg: 'bg-purple-950', description: 'Z世代·视频科普',       enabled: true,  粉丝: '18.9万',  maxChars: 233 },
  { id: 'youtube',       name: 'YouTube',       icon: '▶️', color: 'text-red-500',       bg: 'bg-red-950',    description: '全球视频·长内容',     enabled: true,  粉丝: '4.5万',   maxChars: 5000 },
  { id: 'tiktok',        name: 'TikTok',        icon: '🎵', color: 'text-white',         bg: 'bg-zinc-900',   description: '短视频·全球传播',     enabled: true,  粉丝: '9.7万',   maxChars: 2200 },
];

// 模拟知识库材料
function createMockMaterials(submenu: EcoSubMenu): EcoMaterial[] {
  const configs: Record<EcoSubMenu, EcoMaterial[]> = {
    'opc-map': [
      { id: 'm1', name: '2026全国OPC产业地图.pdf', type: 'pdf', size: 8.4*1024*1024, uploadedAt: '2026-04-20', author: '生态运营部', tags: ['产业地图','政策'], description: '最新版全国OPC产业布局地图，含各省份园区、社区、算力节点分布', views: 3420, shares: 856, status: 'distributed', platformStatus: { twitter: 'success', weibo: 'success', linkedin: 'success' }, thumbnail: '🗺' },
      { id: 'm2', name: '长三角OPC试点政策汇总.docx', type: 'doc', size: 2.1*1024*1024, uploadedAt: '2026-04-18', author: '政策研究组', tags: ['政策','长三角'], description: '汇总上海、苏州、杭州三地OPC专项扶持政策，含申请条件与流程', views: 2180, shares: 421, status: 'published', thumbnail: '📄' },
      { id: 'm3', name: '中西部低成本创业带报告.pdf', type: 'pdf', size: 5.7*1024*1024, uploadedAt: '2026-04-15', author: '战略规划部', tags: ['创业带','中西部'], description: '成都、武汉、西安、长沙、重庆五大中西部城市OPC创业环境深度分析', views: 1560, shares: 312, status: 'published', thumbnail: '📊' },
      { id: 'm4', name: 'OPC园区评级标准体系.pdf', type: 'pdf', size: 1.8*1024*1024, uploadedAt: '2026-04-10', author: '标准委员会', tags: ['标准','评级'], description: '全国OPC产业园区分级评定标准，含一级/二级/三级园区指标体系', views: 980, shares: 156, status: 'published', thumbnail: '🏆' },
    ],
    'opc-vendors': [
      { id: 'm1', name: 'OpenClaw开源基座白皮书.pdf', type: 'pdf', size: 12.3*1024*1024, uploadedAt: '2026-04-22', author: '技术生态部', tags: ['OpenClaw','开源'], description: 'OpenClaw全球技术源头白皮书，31万GitHub星，开源智能体标准详解', views: 5680, shares: 1423, status: 'distributed', platformStatus: { twitter: 'success', linkedin: 'success', github: 'success' } as any, thumbnail: '🦞' },
      { id: 'm2', name: '国内大厂合作方案.pptx', type: 'ppt', size: 18.5*1024*1024, uploadedAt: '2026-04-19', author: '商务合作部', tags: ['大厂','腾讯','阿里'], description: '与腾讯、阿里、字节、百度、月之暗面、智谱的战略合作方案与分工', views: 2890, shares: 567, status: 'published', thumbnail: '🤝' },
      { id: 'm3', name: 'OPC手机硬件规格书.pdf', type: 'pdf', size: 4.2*1024*1024, uploadedAt: '2026-04-16', author: '硬件产品部', tags: ['硬件','OPC手机'], description: '明途OPC龙虾手机技术规格书，含AI算力模块与智能体接口文档', views: 1920, shares: 389, status: 'published', thumbnail: '📱' },
    ],
    'opc-community': [
      { id: 'm1', name: 'OPC超级个体创业手册v2.pdf', type: 'pdf', size: 9.8*1024*1024, uploadedAt: '2026-04-21', author: '社群运营部', tags: ['创业','手册'], description: '最新版超级个体创业实操手册，覆盖选品、内容、流量、变现全链路', views: 7840, shares: 2341, status: 'distributed', platformStatus: { weibo: 'success', xiaohongshu: 'success', bilibili: 'success' }, thumbnail: '🚀' },
      { id: 'm2', name: 'AI创客培训课程体系.pptx', type: 'ppt', size: 25.6*1024*1024, uploadedAt: '2026-04-17', author: '培训教育部', tags: ['培训','课程'], description: '面向AI创业者的系统化培训课程体系，含线上+线下混合模式', views: 3200, shares: 789, status: 'published', thumbnail: '📚' },
      { id: 'm3', name: '社群活动策划方案包.zip', type: 'link', uploadedAt: '2026-04-14', author: '活动运营组', tags: ['活动','策划'], description: '月均20场+社群活动模板包，含线上直播/线下沙龙/黑客松全套策划', views: 2100, shares: 534, status: 'published', thumbnail: '🎉' },
    ],
    'opc-park': [
      { id: 'm1', name: '园区入驻指南2026.pdf', type: 'pdf', size: 6.3*1024*1024, uploadedAt: '2026-04-20', author: '园区运营部', tags: ['入驻','指南'], description: '全国50+OPC产业园区入驻全流程指南，含申请、审批、补贴申领', views: 4200, shares: 890, status: 'published', thumbnail: '🏭' },
      { id: 'm2', name: '算力中心配置方案.docx', type: 'doc', size: 3.4*1024*1024, uploadedAt: '2026-04-16', author: '技术中台', tags: ['算力','配置'], description: '园区普惠算力中心配置标准，含GPU集群规格与调度策略', views: 1890, shares: 234, status: 'draft', thumbnail: '⚡' },
    ],
    'opc-super': [
      { id: 'm1', name: '一人公司创业工具包.zip', type: 'link', uploadedAt: '2026-04-23', author: '超级个体研究院', tags: ['工具包','效率'], description: '100+AI工具清单，含智能体配置模板、工作流SOP、数据看板', views: 12300, shares: 4567, status: 'distributed', platformStatus: { twitter: 'success', weibo: 'success', xiaohongshu: 'success', zhihu: 'success' }, thumbnail: '🧰' },
      { id: 'm2', name: 'AI副业赚钱实战案例集.pdf', type: 'pdf', size: 7.2*1024*1024, uploadedAt: '2026-04-19', author: '内容创作部', tags: ['案例','变现'], description: '收录50个真实AI副业变现案例，含月入过万的具体路径与数据', views: 18700, shares: 8901, status: 'distributed', platformStatus: { weibo: 'success', xiaohongshu: 'success', bilibili: 'success', youtube: 'success' }, thumbnail: '💰' },
      { id: 'm3', name: '超级个体年度规划表.xlsx', type: 'image', size: 0.8*1024*1024, uploadedAt: '2026-04-12', author: '战略规划部', tags: ['规划','模板'], description: '年度OKR+KPI双轨规划表，含收入目标、技能提升、内容产出模板', views: 8900, shares: 3456, status: 'published', thumbnail: '📈' },
    ],
    'opc-phone': [
      { id: 'm1', name: '龙虾手机产品手册v3.pdf', type: 'pdf', size: 14.2*1024*1024, uploadedAt: '2026-04-21', author: '产品部', tags: ['手册','产品'], description: '龙虾手机完整产品手册，含AI功能详解、API接口、智能体部署指南', views: 5600, shares: 1234, status: 'published', thumbnail: '📱' },
      { id: 'm2', name: 'OPC手机开箱评测视频.mp4', type: 'video', size: 256*1024*1024, uploadedAt: '2026-04-18', author: '内容工作室', tags: ['评测','视频'], description: '专业评测团队出品，含AI算力跑分、智能体运行、多场景实测', views: 34200, shares: 8765, status: 'distributed', platformStatus: { youtube: 'success', bilibili: 'success', tiktok: 'success' }, thumbnail: '🎬' },
    ],
    'opc-box': [
      { id: 'm1', name: '龙虾云盒子技术白皮书.pdf', type: 'pdf', size: 9.6*1024*1024, uploadedAt: '2026-04-20', author: '硬件研发部', tags: ['白皮书','技术'], description: '边缘算力一体机完整技术白皮书，含部署架构与性能数据', views: 4200, shares: 987, status: 'published', thumbnail: '📦' },
      { id: 'm2', name: '企业边缘AI部署方案.pptx', type: 'ppt', size: 15.8*1024*1024, uploadedAt: '2026-04-15', author: '解决方案部', tags: ['方案','企业'], description: '面向中小企业的边缘AI部署完整方案，含ROI计算与实施路径', views: 2890, shares: 456, status: 'published', thumbnail: '💡' },
    ],
    'opc-incubator': [
      { id: 'm1', name: '孵化项目BP模板包.zip', type: 'link', uploadedAt: '2026-04-22', author: '投资孵化部', tags: ['BP','模板'], description: '含通用BP模板、OPC行业定制版本、财务预测模型与路演PPT框架', views: 6700, shares: 2341, status: 'published', thumbnail: '📋' },
      { id: 'm2', name: '投资机构名录2026.xlsx', type: 'image', size: 1.2*1024*1024, uploadedAt: '2026-04-18', author: '资本对接部', tags: ['投资','名录'], description: '覆盖200+专注AI/科技赛道的投资机构，含联系人、偏好、过往案例', views: 8900, shares: 3210, status: 'published', thumbnail: '🏦' },
      { id: 'm3', name: '算力补贴申请全攻略.pdf', type: 'pdf', size: 3.8*1024*1024, uploadedAt: '2026-04-14', author: '政策研究组', tags: ['补贴','政策'], description: '各省市算力补贴政策汇总，含申请流程、常见驳回原因与应对策略', views: 12300, shares: 5678, status: 'distributed', platformStatus: { weibo: 'success', zhihu: 'success', xiaohongshu: 'success' }, thumbnail: '💵' },
    ],
    'opc-ai-eco': [
      { id: 'm1', name: 'workBrain技术架构图.png', type: 'image', size: 4.5*1024*1024, uploadedAt: '2026-04-23', author: '核心架构组', tags: ['workBrain','架构'], description: 'workBrain智能体核心架构全景图，含模块解耦与数据流设计', views: 4500, shares: 1234, status: 'published', thumbnail: '🧠' },
      { id: 'm2', name: 'AgentSkill开发指南.pdf', type: 'pdf', size: 11.8*1024*1024, uploadedAt: '2026-04-19', author: '开发者关系', tags: ['AgentSkill','开发'], description: '完整AgentSkill开发文档，含工具链、调试方法与生产部署最佳实践', views: 7800, shares: 2890, status: 'published', thumbnail: '🛠' },
      { id: 'm3', name: '零代码构建AI员工实战.mp4', type: 'video', size: 512*1024*1024, uploadedAt: '2026-04-16', author: '内容工作室', tags: ['视频','实战'], description: '完整演示如何使用龙虾系统零代码构建专属AI员工，含真实案例', views: 45600, shares: 18234, status: 'distributed', platformStatus: { youtube: 'success', bilibili: 'success', twitter: 'success' }, thumbnail: '🤖' },
    ],
  };
  return configs[submenu] || [];
}

// ── 子组件 ────────────────────────────────────────────────

function MaterialCard({ mat, onDistribute, onPublish }: { mat: EcoMaterial; onDistribute: (id: string) => void; onPublish: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);

  const typeConfig: Record<string, { icon: string; color: string; bg: string }> = {
    pdf:    { icon: '📄', color: 'text-red-400', bg: 'bg-red-500/10' },
    ppt:    { icon: '📊', color: 'text-orange-400', bg: 'bg-orange-500/10' },
    doc:    { icon: '📝', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    image:  { icon: '🖼️', color: 'text-pink-400', bg: 'bg-pink-500/10' },
    video:  { icon: '🎬', color: 'text-purple-400', bg: 'bg-purple-500/10' },
    link:   { icon: '🔗', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    article:{ icon: '📰', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  };
  const tc = typeConfig[mat.type] || typeConfig.link;

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    draft:     { label: '草稿', color: 'text-slate-400', bg: 'bg-slate-700/40' },
    published: { label: '已发布', color: 'text-blue-400', bg: 'bg-blue-500/20' },
    distributed:{ label: '已分发', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  };
  const sc = statusConfig[mat.status];

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes > 1024*1024) return `${(bytes/1024/1024).toFixed(1)} MB`;
    return `${(bytes/1024).toFixed(0)} KB`;
  };

  return (
    <div className="border border-slate-700/50 rounded-xl bg-slate-800/30 hover:bg-slate-800/60 transition-all group">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg ${tc.bg} flex items-center justify-center text-lg flex-shrink-0`}>
            {mat.thumbnail || tc.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm font-semibold text-white truncate">{mat.name}</h4>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${sc.bg} ${sc.color} flex-shrink-0`}>{sc.label}</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">{mat.description}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[10px] text-slate-600">{mat.author}</span>
              <span className="text-[10px] text-slate-600">{mat.uploadedAt}</span>
              {mat.size && <span className="text-[10px] text-slate-600">{formatSize(mat.size)}</span>}
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {mat.tags.map(tag => (
                <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-700/60 text-slate-400">{tag}</span>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            {mat.status !== 'published' && (
              <button onClick={() => onPublish(mat.id)} className="text-[10px] px-2 py-1 rounded bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 transition-colors">
                发布
              </button>
            )}
            {mat.status !== 'distributed' && (
              <button onClick={() => onDistribute(mat.id)} className="text-[10px] px-2 py-1 rounded bg-amber-600/20 text-amber-400 hover:bg-amber-600/40 transition-colors">
                分发
              </button>
            )}
          </div>
        </div>
        {/* 展开详情 */}
        <button onClick={() => setExpanded(v => !v)} className="w-full mt-2 text-[10px] text-slate-500 hover:text-slate-400 flex items-center justify-center gap-1 transition-colors">
          {expanded ? '收起' : '查看更多'}
          <span className={`transition-transform ${expanded ? 'rotate-90' : ''}`}>▸</span>
        </button>
        {expanded && (
          <div className="mt-3 pt-3 border-t border-slate-700/30 space-y-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-500">👁 {mat.views.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-500">🔗 {mat.shares.toLocaleString()}</span>
              </div>
            </div>
            {mat.platformStatus && Object.keys(mat.platformStatus).length > 0 && (
              <div className="flex flex-wrap gap-1">
                {Object.entries(mat.platformStatus).map(([platform, status]) => {
                  const ch = SOCIAL_CHANNELS.find(c => c.id === platform);
                  if (!ch) return null;
                  return (
                    <span key={platform} className={`text-[9px] px-1.5 py-0.5 rounded ${
                      status === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 
                      status === 'failed' ? 'bg-red-500/20 text-red-400' : 
                      'bg-slate-700/60 text-slate-400'
                    }`}>
                      {ch.icon} {ch.name}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// 一键分发弹窗
function DistributeModal({ mat, submenu, onClose }: { mat: EcoMaterial; submenu: EcoSubMenu; onClose: () => void }) {
  const [selected, setSelected] = useState<Set<SocialPlatform>>(new Set(['twitter', 'linkedin', 'weibo']));
  const [distributing, setDistributing] = useState(false);
  const [progress, setProgress] = useState<Partial<Record<SocialPlatform, 'pending' | 'success' | 'failed'>>>({});

  const toggle = (id: SocialPlatform) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDistribute = async () => {
    if (selected.size === 0) { toast.error('请至少选择一个平台'); return; }
    setDistributing(true);
    const platforms = Array.from(selected);
    for (const p of platforms) {
      setProgress(prev => ({ ...prev, [p]: 'pending' }));
      await new Promise(r => setTimeout(r, 600 + Math.random() * 800));
      // 模拟成功率 90%
      const success = Math.random() > 0.1;
      setProgress(prev => ({ ...prev, [p]: success ? 'success' : 'failed' }));
    }
    setDistributing(false);
    toast.success(`分发完成！${platforms.filter(p => progress[p] !== 'failed').length}/${platforms.length} 个平台成功`);
  };

  const config = SUBMENU_KB_CONFIG[submenu];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-lg overflow-hidden">
        {/* 头部 */}
        <div className="p-5 border-b border-slate-700/50 bg-gradient-to-r from-amber-950/50 to-orange-950/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                🚀 一键分发至全球社媒
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">选择目标平台，一次发布，多点触达</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none">×</button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* 素材信息 */}
          <div className="bg-slate-800/50 rounded-xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center text-lg flex-shrink-0">
              {mat.thumbnail || '📄'}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-white truncate">{mat.name}</div>
              <div className="text-[11px] text-slate-500">{config.icon} {config.name}</div>
            </div>
          </div>

          {/* AI生成文案预览 */}
          <div className="bg-gradient-to-r from-cyan-950/50 to-blue-950/50 rounded-xl p-3 border border-cyan-500/20">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[10px] text-cyan-400">✨ AI生成分发文案</span>
            </div>
            <p className="text-[12px] text-slate-300 leading-relaxed">
              【{config.name}重磅发布】{mat.description} | 龙虾集群OPC生态持续扩容，欢迎各路创业者、开发者、产业伙伴加入！🦞 #OPC #AI创业 #超级个体
            </p>
          </div>

          {/* 平台选择 */}
          <div>
            <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <span>📡</span> 选择分发平台（已选 {selected.size}/{SOCIAL_CHANNELS.length}）
            </div>
            <div className="grid grid-cols-3 gap-2">
              {SOCIAL_CHANNELS.map(ch => {
                const isSelected = selected.has(ch.id);
                const prog = progress[ch.id];
                return (
                  <button
                    key={ch.id}
                    onClick={() => !distributing && toggle(ch.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected 
                        ? 'border-amber-500/50 bg-amber-500/10' 
                        : 'border-slate-700/50 bg-slate-800/40 hover:bg-slate-800'
                    } ${distributing ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-base">{ch.icon}</span>
                      <span className={`text-[11px] font-semibold ${isSelected ? 'text-amber-300' : 'text-slate-300'}`}>{ch.name}</span>
                    </div>
                    <div className="text-[9px] text-slate-500 mb-0.5">{ch.description}</div>
                    <div className="text-[9px] text-slate-600">粉丝 {ch.粉丝}</div>
                    {prog && (
                      <div className="mt-1">
                        {prog === 'pending' && <span className="text-[9px] text-amber-400 animate-pulse">⏳ 分发中...</span>}
                        {prog === 'success' && <span className="text-[9px] text-emerald-400">✅ 成功</span>}
                        {prog === 'failed' && <span className="text-[9px] text-red-400">❌ 失败</span>}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 独立网站分发 */}
          <div className="bg-violet-950/30 rounded-xl p-3 border border-violet-500/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-violet-400 text-sm">🌐</span>
                <span className="text-[11px] font-semibold text-violet-300">同时发布至独立网站</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-8 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-3.5 after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-violet-600"></div>
              </label>
            </div>
            <div className="text-[10px] text-slate-500">自动生成专属页面，生成独立 URL，可绑定自定义域名</div>
          </div>

          {/* 操作 */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl py-3 text-sm transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleDistribute}
              disabled={distributing || selected.size === 0}
              className={`flex-[2] rounded-xl py-3 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                distributing 
                  ? 'bg-amber-600/50 text-amber-200 cursor-wait' 
                  : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg shadow-amber-500/20'
              }`}
            >
              {distributing ? (
                <>
                  <span className="animate-spin">⟳</span>
                  分发中...
                </>
              ) : (
                <>
                  🚀 一键分发至 {selected.size} 个平台
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 发布弹窗
function PublishModal({ mat, onClose }: { mat: EcoMaterial; onClose: () => void }) {
  const [title, setTitle] = useState(mat.name.replace(/\.[^.]+$/, ''));
  const [description, setDescription] = useState(mat.description);
  const [tags, setTags] = useState(mat.tags.join(', '));
  const [publishing, setPublishing] = useState(false);

  const handlePublish = () => {
    if (!title.trim()) { toast.error('请输入标题'); return; }
    setPublishing(true);
    setTimeout(() => {
      setPublishing(false);
      toast.success('发布成功！素材已加入知识库');
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-md overflow-hidden">
        <div className="p-5 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">📤 发布素材</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none">×</button>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1.5">标题</label>
            <input value={title} onChange={e => setTitle(e.target.value)} 
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors" />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1.5">简介</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none" />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1.5">标签（逗号分隔）</label>
            <input value={tags} onChange={e => setTags(e.target.value)} 
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors" />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl py-3 text-sm">取消</button>
            <button onClick={handlePublish} disabled={publishing}
              className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3 text-sm font-medium transition-colors disabled:opacity-50">
              {publishing ? '发布中...' : '✅ 确认发布'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 新建素材弹窗
function NewMaterialModal({ submenu, onClose, onCreated }: { submenu: EcoSubMenu; onClose: () => void; onCreated: (m: EcoMaterial) => void }) {
  const [type, setType] = useState<EcoMaterial['type']>('article');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = () => {
    if (!name.trim()) { toast.error('请输入素材名称'); return; }
    setCreating(true);
    setTimeout(() => {
      const newMat: EcoMaterial = {
        id: `m_${Date.now()}`,
        name: name.trim(),
        type,
        size: type === 'video' ? 256*1024*1024 : type === 'pdf' ? 4.2*1024*1024 : 1*1024*1024,
        uploadedAt: new Date().toLocaleDateString('zh-CN'),
        author: '我',
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        description,
        views: 0,
        shares: 0,
        status: 'draft',
      };
      onCreated(newMat);
      setCreating(false);
      toast.success('素材创建成功！');
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-md overflow-hidden">
        <div className="p-5 border-b border-slate-700/50 bg-gradient-to-r from-cyan-950/50 to-blue-950/50">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">➕ 新建生态素材</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none">×</button>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1.5">素材类型</label>
            <div className="grid grid-cols-4 gap-2">
              {(['article', 'pdf', 'ppt', 'link', 'video', 'image'] as const).map(t => (
                <button key={t} onClick={() => setType(t)}
                  className={`py-2 rounded-lg text-[11px] font-medium transition-colors ${
                    type === t ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}>
                  {{ article:'📰 文章', pdf:'📄 PDF', ppt:'📊 PPT', link:'🔗 链接', video:'🎬 视频', image:'🖼️ 图片' }[t]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1.5">素材名称</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="输入素材名称..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors" />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1.5">素材描述</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="简要描述素材内容..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors resize-none" />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1.5">标签（逗号分隔）</label>
            <input value={tags} onChange={e => setTags(e.target.value)} placeholder="例如: 政策, 创业, 工具"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors" />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl py-3 text-sm">取消</button>
            <button onClick={handleCreate} disabled={creating}
              className="flex-[2] bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl py-3 text-sm font-medium transition-colors disabled:opacity-50">
              {creating ? '创建中...' : '✅ 创建素材'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// RRR文章生成器
function ArticleGenerator({ submenu, onClose }: { submenu: EcoSubMenu; onClose: () => void }) {
  const [topic, setTopic] = useState('');
  const [generating, setGenerating] = useState(false);
  const [article, setArticle] = useState<{ title: string; content: string; tags: string[] } | null>(null);
  const [distributing, setDistributing] = useState(false);

  const config = SUBMENU_KB_CONFIG[submenu];

  const handleGenerate = async () => {
    if (!topic.trim()) { toast.error('请输入文章主题'); return; }
    setGenerating(true);
    await new Promise(r => setTimeout(r, 2000));
    setGenerating(false);
    setArticle({
      title: `🦞 ${config.name.replace('知识库', '')}：${topic}`,
      content: `**${config.name}深度解读**

${topic}是当前OPC生态中最受关注的话题之一。在2025年AI市场快速演变的背景下，OPC生态正在以惊人的速度抢占市场份额。

**当前运行率收入（RRR）：3000万美元**
预计2025年底将达到**3.6亿美元**，月增长率达25%。

通过与全球生态伙伴的深度合作，我们正在构建一个以"速度与规模"为核心的AI生态体系。这一叙事不仅吸引了顶级投资机构的目光，也为超级个体的创业之路提供了坚实的技术和资源支撑。

**核心优势：**
• 太极流架构：低延迟30%，成本降低25%
• RRR驱动的增长叙事：投资人必看的增速指标
• 全球生态协同：开源+大厂+硬件+社区四层架构

**战略展望：**
到2027年，OPC生态将实现**10亿美元RRR**和**100亿美元估值**，成为AI时代超级个体创业的首选平台。

立即加入OPC生态，共建AI未来！🦞`,
      tags: ['OPC生态', 'AI创业', '超级个体', 'RRR增长', config.name.replace('知识库', '')],
    });
    toast.success('文章生成完成！');
  };

  const handleDistributeArticle = async () => {
    setDistributing(true);
    await new Promise(r => setTimeout(r, 1500));
    setDistributing(false);
    toast.success('文章已一键分发至所有已选平台！');
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-700/50 bg-gradient-to-r from-amber-950/50 to-red-950/50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">✨ AI文章创作 + 一键分发</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">基于RRR叙事生成引人入胜的生态文章，自动适配各平台格式</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none">×</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {!article ? (
            <>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1.5">📝 文章主题</label>
                <input value={topic} onChange={e => setTopic(e.target.value)} 
                  placeholder={`例如：${config.name.replace('知识库', '')}如何赋能超级个体创业`}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors" />
              </div>
              {/* RRR数据卡 */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: '当前RRR', value: '3000万', unit: '美元', color: 'text-amber-400', bg: 'bg-amber-500/10' },
                  { label: '年底目标', value: '3.6亿', unit: '美元', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                  { label: '月增长率', value: '25', unit: '%', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
                ].map(m => (
                  <div key={m.label} className={`rounded-xl p-3 text-center ${m.bg}`}>
                    <div className={`text-lg font-bold ${m.color}`}>{m.value}</div>
                    <div className="text-[10px] text-slate-400">{m.unit}</div>
                    <div className="text-[9px] text-slate-600 mt-0.5">{m.label}</div>
                  </div>
                ))}
              </div>
              <button onClick={handleGenerate} disabled={generating}
                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl py-3 text-sm font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {generating ? <><span className="animate-spin">⟳</span> AI正在创作...</> : <><span>✨</span> 生成生态文章</>}
              </button>
            </>
          ) : (
            <>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
                <div className="text-sm font-bold text-amber-300 mb-1">📌 {article.title}</div>
                <div className="flex flex-wrap gap-1">
                  {article.tags.map(tag => (
                    <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="bg-slate-800/60 rounded-xl p-4">
                <pre className="text-[12px] text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">{article.content}</pre>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setArticle(null)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl py-3 text-sm">✏️ 修改</button>
                <button onClick={handleDistributeArticle} disabled={distributing}
                  className="flex-[2] bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl py-3 text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {distributing ? <><span className="animate-spin">⟳</span> 分发中...</> : <><span>🚀</span> 一键分发全平台</>}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── 主组件 ────────────────────────────────────────────────

interface OPCEcoKnowledgeProps {
  submenu: EcoSubMenu;
}

export function OPCEcoKnowledge({ submenu }: OPCEcoKnowledgeProps) {
  const [materials, setMaterials] = useState<EcoMaterial[]>(() => createMockMaterials(submenu));
  const [filter, setFilter] = useState<'all' | 'draft' | 'published' | 'distributed'>('all');
  const [search, setSearch] = useState('');
  const [distributingMat, setDistributingMat] = useState<EcoMaterial | null>(null);
  const [publishingMat, setPublishingMat] = useState<EcoMaterial | null>(null);
  const [newMatOpen, setNewMatOpen] = useState(false);
  const [articleOpen, setArticleOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const config = SUBMENU_KB_CONFIG[submenu];

  const filtered = materials.filter(m => {
    if (filter !== 'all' && m.status !== filter) return false;
    if (search && !m.name.toLowerCase().includes(search.toLowerCase()) && !m.tags.some(t => t.includes(search))) return false;
    return true;
  });

  const stats = {
    total: materials.length,
    published: materials.filter(m => m.status === 'published' || m.status === 'distributed').length,
    totalViews: materials.reduce((acc, m) => acc + m.views, 0),
    totalShares: materials.reduce((acc, m) => acc + m.shares, 0),
    distributed: materials.filter(m => m.status === 'distributed').length,
  };

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    setTimeout(() => {
      const newMats = files.map(file => ({
        id: `upload_${Date.now()}_${Math.random()}`,
        name: file.name,
        type: (file.type.includes('pdf') ? 'pdf' : file.type.includes('word') || file.type.includes('document') ? 'doc' :
               file.type.includes('presentation') || file.type.includes('powerpoint') ? 'ppt' :
               file.type.includes('image') ? 'image' : file.type.includes('video') ? 'video' : 'link') as EcoMaterial['type'],
        size: file.size,
        uploadedAt: new Date().toLocaleDateString('zh-CN'),
        author: '我',
        tags: [],
        description: '',
        views: 0,
        shares: 0,
        status: 'draft' as const,
      }));
      setMaterials(prev => [...prev, ...newMats]);
      setUploading(false);
      toast.success(`${files.length} 个文件已上传！`);
    }, 1200);
    e.target.value = '';
  }, []);

  const handlePublish = (id: string) => {
    const mat = materials.find(m => m.id === id);
    if (mat) setPublishingMat(mat);
  };

  const handleDistribute = (id: string) => {
    const mat = materials.find(m => m.id === id);
    if (mat) setDistributingMat(mat);
  };

  const handleMaterialCreated = (m: EcoMaterial) => {
    setMaterials(prev => [m, ...prev]);
  };

  const handlePublishConfirm = () => {
    if (publishingMat) {
      setMaterials(prev => prev.map(m => m.id === publishingMat.id ? { ...m, status: 'published' as const } : m));
      setPublishingMat(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* 顶部统计条 */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: '总素材', value: stats.total, icon: '📦', color: 'text-slate-300', bg: 'bg-slate-500/10' },
          { label: '已发布', value: stats.published, icon: '✅', color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: '已分发', value: stats.distributed, icon: '🚀', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: '总浏览', value: stats.totalViews.toLocaleString(), icon: '👁', color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: '总分享', value: stats.totalShares.toLocaleString(), icon: '🔗', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-3 text-center border ${s.bg}`}>
            <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-slate-500">{s.icon} {s.label}</div>
          </div>
        ))}
      </div>

      {/* 操作栏 */}
      <div className="flex items-center gap-3">
        {/* 搜索 */}
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索素材..."
            className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors" />
        </div>
        {/* 过滤 */}
        <div className="flex bg-slate-800/60 rounded-xl p-1 border border-slate-700/40">
          {(['all', 'draft', 'published', 'distributed'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                filter === f ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}>
              {{ all:'全部', draft:'草稿', published:'已发布', distributed:'已分发' }[f]}
            </button>
          ))}
        </div>
        {/* 上传 */}
        <button onClick={() => fileInputRef.current?.click()}
          className="bg-slate-800/60 hover:bg-slate-700 text-slate-300 rounded-xl px-4 py-2.5 text-sm border border-slate-700/40 transition-colors flex items-center gap-1.5">
          {uploading ? <><span className="animate-spin text-amber-400">⟳</span> 上传中...</> : <><span>⬆️</span> 上传</>}
        </button>
        <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx,.ppt,.pptx,.xlsx,.png,.jpg,.mp4,.zip,.txt" onChange={handleFileUpload} className="hidden" />
        {/* 新建 */}
        <button onClick={() => setNewMatOpen(true)}
          className="bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 rounded-xl px-4 py-2.5 text-sm border border-cyan-500/30 transition-colors flex items-center gap-1.5">
          <span>➕</span> 新建
        </button>
        {/* AI文章 */}
        <button onClick={() => setArticleOpen(true)}
          className="bg-gradient-to-r from-amber-600/20 to-orange-600/20 hover:from-amber-600/30 hover:to-orange-600/30 text-amber-400 rounded-xl px-4 py-2.5 text-sm border border-amber-500/30 transition-colors flex items-center gap-1.5">
          <span>✨</span> AI写文章
        </button>
      </div>

      {/* 素材列表 */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-sm text-slate-400">暂无{filter !== 'all' ? ['草稿', '已发布', '已分发'][parseInt(filter === 'draft' ? '0' : filter === 'published' ? '1' : '2')] : ''}素材</p>
          <p className="text-[11px] text-slate-600 mt-1">上传文件或新建素材开始构建知识库</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(mat => (
            <MaterialCard key={mat.id} mat={mat} onDistribute={handleDistribute} onPublish={handlePublish} />
          ))}
        </div>
      )}

      {/* 分发全选快捷栏 */}
      {materials.length > 0 && (
        <div className="bg-gradient-to-r from-amber-950/40 to-orange-950/40 rounded-xl p-3 border border-amber-500/20 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 text-sm">🚀</span>
            <span className="text-[11px] text-amber-300 font-medium">快速分发</span>
          </div>
          <div className="flex gap-1.5">
            {SOCIAL_CHANNELS.slice(0, 6).map(ch => (
              <span key={ch.id} className="text-[10px] px-2 py-1 rounded-lg bg-slate-800/60 text-slate-400 border border-slate-700/40 flex items-center gap-1">
                {ch.icon} {ch.name}
              </span>
            ))}
          </div>
          <button onClick={() => materials[0] && handleDistribute(materials[0].id)}
            className="ml-auto bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 rounded-lg px-4 py-1.5 text-[11px] font-medium border border-amber-500/30 transition-colors">
            一键全平台分发 →
          </button>
        </div>
      )}

      {/* 弹窗 */}
      {distributingMat && (
        <DistributeModal mat={distributingMat} submenu={submenu} onClose={() => setDistributingMat(null)} />
      )}
      {publishingMat && (
        <PublishModal mat={publishingMat} onClose={() => { handlePublishConfirm(); setPublishingMat(null); }} />
      )}
      {newMatOpen && (
        <NewMaterialModal submenu={submenu} onClose={() => setNewMatOpen(false)} onCreated={handleMaterialCreated} />
      )}
      {articleOpen && (
        <ArticleGenerator submenu={submenu} onClose={() => setArticleOpen(false)} />
      )}
    </div>
  );
}

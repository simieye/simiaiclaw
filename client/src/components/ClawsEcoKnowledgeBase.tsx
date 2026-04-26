/**
 * 跨境龙虾社 · 龙虾社知识库
 * 课程资料、视频图文、工具包、链接、学员成果展示（功能完整版）
 */
import React, { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';

// ── 类型定义 ──────────────────────────────────────────────────────────
type Section = 'video' | 'graphic' | 'tools' | 'links' | 'students';
type ModalType = 'videoLink' | 'cloudLink' | 'tool' | 'addTool' | 'editLink' | 'addLink' | 'student' | null;
type LinkType = { name: string; desc: string; url: string; icon: string };
type ToolType = { name: string; desc: string; tag: string; tagColor: string; url?: string; locked?: boolean };
type StudentType = { name: string; tier: string; achievement: string; date: string; screenshot?: string };
type LessonData = { videoUrl?: string; graphicUrls?: string[]; cloudLink?: string; cloudPwd?: string };
type ChapterLessonData = Record<string, Record<number, LessonData>>;
type GraphicChapterData = Record<number, string[]>;

// ── 数据定义 ──────────────────────────────────────────────────────────
const CHAPTERS = [
  { num: 1, name: '抓住机遇·开店启航', lessons: ['①基础准备·工具准备', '②TikTok市场概况与赛道分析', '③店铺设置与基础搭建'] },
  { num: 2, name: '产品上架 AI助力优质LISTING', lessons: ['①后台解析与竞品调研', '②主图设计要点与优质图库', '③高转化详情页结构', '④关键词布局与埋词技巧', '⑤变体设置与定价策略', '⑥AI写手实操教学', '⑦AI精修主图实操教学', '⑧优质竞品调研与选品', '⑨TikTok Shop改价策略', '⑩上架实操教学'] },
  { num: 3, name: '营销定价策略和平台规则解读', lessons: ['①定价底层逻辑', '②定价策略与调价策略', '③营销工具使用指南', '④平台规则红线解读'] },
  { num: 4, name: '商品卡入池全系列玩法 ⭐王牌板块', lessons: ['①商品卡爆单原理', '②商品卡流量入口解析', '③如何正确选品找货源', '④产品线梳理与产品矩阵', '⑤如何定价做利润', '⑥如何找对标竞品', '⑦如何制作高点击主图', '⑧高转化详情页设计', '⑨标题优化与关键词布局', '⑩动销起量全流程', '⑪商品卡全系列玩法总结'] },
  { num: 5, name: '店铺基石-体验分的维护', lessons: ['①体验分构成解析', '②差评预防与处理', '③口碑维护全流程', '④如何提升揽收履约率', '⑤IM回复与客服技巧', '⑥达人口碑建设', '⑦营销活动提升转化率', '⑧体验分维护总结'] },
  { num: 6, name: '独家快速起店法实操（内部）', lessons: ['①店群与单店的抉择', '②快速起店的核心逻辑', '③高效选品策略', '④批量上架与产品优化', '⑤快速起店总结'], locked: true },
  { num: 7, name: '批量上架和订单处理', lessons: ['①ERP批量上架教学', '②订单处理与发货流程'] },
  { num: 8, name: '手把手教学达人运营全流程', lessons: ['①达人体系搭建', '②高效建联达人策略', '③达人合作模式与话术', '④如何高效管理达人', '⑤达人带货数据复盘', '⑥达人带货话术升级', '⑦达人口碑维护', '⑧达人资源积累与维护', '⑨达人运营总结'] },
  { num: 9, name: '短视频带货全流程', lessons: ['①TikTok账号定位策略', '②短视频内容创作核心', '③TikTok内容算法解析', '④短视频脚本结构设计', '⑤TikTok带货短视频制作', '⑥TikTok短视频剪辑技巧', '⑦TikTok账号运营实操', '⑧TikTok Shop联盟带货', '⑨TikTok选品策略', '⑩TikTok矩阵账号布局', '⑪短视频SEO优化技巧', '⑫TikTok直播带货入门', '⑬直播话术与互动技巧', '⑭短视频账号防封解封指南', '⑮TikTok Shop选品进阶', '⑯TikTok短视频带货总结'] },
  { num: 10, name: 'ADS广告专题-超信投放课', lessons: ['①TikTok广告投放底层逻辑', '②TikTok广告后台全解', '③广告受众定向技巧', '④广告素材创意制作', '⑤广告投放策略优化', '⑥广告数据分析与复盘', '⑦广告投放避坑指南', '⑧广告投放成本控制', '⑨TikTok广告投放总结', '⑩TikTok全链路爆单打法'] },
];

// ── 工具提示图标映射 ──────────────────────────────────────────────────
const ICON_OPTIONS = ['🎓', '🏪', '📊', '🌏', '🔧', '🦞', '📦', '🛒', '💰', '📱', '🌐', '🔗'];

// ── 主组件 ────────────────────────────────────────────────────────────
export function ClawsEcoKnowledgeBase() {
  const [activeSection, setActiveSection] = useState<Section>('video');
  const [activeChapter, setActiveChapter] = useState(1);
  const [expandedLessons, setExpandedLessons] = useState<Record<number, boolean>>({});

  // ── 课时数据（视频/图文/网盘）──────────────────────────────────────
  const [lessonData, setLessonData] = useState<ChapterLessonData>({});
  const [graphicData, setGraphicData] = useState<GraphicChapterData>({});

  // ── 工具包数据 ──────────────────────────────────────────────────────
  const [tools, setTools] = useState<ToolType[]>([
    { name: '内部选品工具包', desc: '精准选品分析，含蓝海词挖掘', tag: 'PDF', tagColor: 'bg-amber-600' },
    { name: '达人话术合集', desc: '寄样/沟通/谈判全套话术', tag: 'DOC', tagColor: 'bg-blue-600' },
    { name: '高转化详情页模板', desc: 'PSD/Figma双格式，可直接套用', tag: 'PSD/Figma', tagColor: 'bg-violet-600' },
    { name: '批量上架工具', desc: 'ERP一键搬家批量上架插件', tag: '插件', tagColor: 'bg-green-600' },
    { name: '定价公式计算器', desc: '含利润计算、成本核算模板', tag: 'Excel', tagColor: 'bg-teal-600' },
    { name: '内部起店脚本（私教专属）', desc: '快速破0不外传内部资料', tag: 'PDF', tagColor: 'bg-red-600', locked: true },
  ]);

  // ── 链接数据 ───────────────────────────────────────────────────────
  const [links, setLinks] = useState<LinkType[]>([
    { name: 'TikTok Seller University', desc: '官方学习中心·政策规则', url: '', icon: '🎓' },
    { name: 'TikTok Shop Seller Center', desc: '卖家后台·直接管店', url: '', icon: '🏪' },
    { name: 'TikTok Business Center', desc: '广告投放·数据分析', url: '', icon: '📊' },
    { name: '东南亚电商平台入口', desc: 'Shopee / Lazada / Tokopedia', url: '', icon: '🌏' },
    { name: '汇率/物流查询工具', desc: '日常运营必备工具', url: '', icon: '🔧' },
    { name: '龙虾社官方社群入口', desc: '学员答疑群·资源对接', url: '', icon: '🦞' },
  ]);

  // ── 学员数据 ───────────────────────────────────────────────────────
  const [students, setStudents] = useState<StudentType[]>([
    { name: '学员@小王', tier: '私教版', achievement: '7天出第一单，30天日出50单', date: '2026-03' },
    { name: '学员@阿玲', tier: '陪跑版', achievement: '14天自然流爆单，月入过万', date: '2026-02' },
    { name: '学员@Tony', tier: '私教版', achievement: '货损起店，月GMV突破10万', date: '2026-01' },
    { name: '学员@Lisa', tier: '基础版', achievement: '自学成才，3个月做到类目TOP10', date: '2026-01' },
  ]);
  const [studentScreenshots, setStudentScreenshots] = useState<Record<number, string>>({});
  const [reviewScreenshots, setReviewScreenshots] = useState<string[]>([]);

  // ── 弹窗状态 ───────────────────────────────────────────────────────
  const [modal, setModal] = useState<ModalType>(null);
  const [modalData, setModalData] = useState<Record<string, string>>({});
  const [editLinkIndex, setEditLinkIndex] = useState<number | null>(null);
  const [editToolIndex, setEditToolIndex] = useState<number | null>(null);
  const [editStudentIndex, setEditStudentIndex] = useState<number | null>(null);
  const [newToolTag, setNewToolTag] = useState('PDF');
  const [newToolTagColor, setNewToolTagColor] = useState('bg-amber-600');

  // ── 文件上传 Ref ────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadTarget, setUploadTarget] = useState<string>(''); // 'video-ch1-0' | 'graphic-ch1' | 'student-screenshot-0' | 'review-screenshot' | 'tool-file'

  // ── 辅助函数 ────────────────────────────────────────────────────────
  const toggleLesson = (num: number) => {
    setExpandedLessons(prev => ({ ...prev, [num]: !prev[num] }));
  };

  const chapterKey = String(activeChapter);
  const getLessonData = (lessonIdx: number): LessonData =>
    (lessonData[chapterKey]?.[lessonIdx]) || {};

  const updateLessonData = (lessonIdx: number, update: Partial<LessonData>) => {
    setLessonData(prev => ({
      ...prev,
      [chapterKey]: {
        ...(prev[chapterKey] || {}),
        [lessonIdx]: { ...getLessonData(lessonIdx), ...update },
      },
    }));
  };

  const getGraphicUrls = (chNum: number): string[] =>
    graphicData[chNum] || [];

  const setGraphicUrls = (chNum: number, urls: string[]) => {
    setGraphicData(prev => ({ ...prev, [chNum]: urls }));
  };

  const openModal = (type: ModalType, data: Record<string, string> = {}) => {
    setModalData(data);
    setModal(type);
  };

  const closeModal = () => {
    setModal(null);
    setModalData({});
    setEditLinkIndex(null);
    setEditToolIndex(null);
    setEditStudentIndex(null);
  };

  // ── 文件上传处理 ───────────────────────────────────────────────────
  const triggerFileUpload = (target: string) => {
    setUploadTarget(target);
    fileInputRef.current?.click();
  };

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const target = uploadTarget;

    // 本地预览（Base64）
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;

      if (target.startsWith('video-')) {
        const [, ch, idx] = target.split('-');
        const chNum = parseInt(ch);
        setActiveChapter(chNum);
        setTimeout(() => {
          updateLessonData(parseInt(idx), { videoUrl: url });
          toast.success('视频上传成功');
        }, 50);
      } else if (target.startsWith('graphic-ch')) {
        const chNum = parseInt(target.replace('graphic-ch', ''));
        setGraphicUrls(chNum, [...getGraphicUrls(chNum), url]);
        toast.success('图片上传成功');
      } else if (target.startsWith('student-screenshot-')) {
        const idx = parseInt(target.replace('student-screenshot-', ''));
        setStudentScreenshots(prev => ({ ...prev, [idx]: url }));
        toast.success('截图上传成功');
      } else if (target === 'review-screenshot') {
        setReviewScreenshots(prev => [...prev, url]);
        toast.success('好评截图上传成功');
      }
    };
    reader.readAsDataURL(file);

    // 清空 input，允许重复选同一文件
    e.target.value = '';
  }, [uploadTarget, lessonData, graphicData]);

  const removeImage = (target: string, imgIndex: number) => {
    if (target.startsWith('graphic-ch')) {
      const chNum = parseInt(target.replace('graphic-ch', ''));
      const urls = getGraphicUrls(chNum).filter((_, i) => i !== imgIndex);
      setGraphicUrls(chNum, urls);
      toast.success('图片已移除');
    }
  };

  const TABS: { id: Section; label: string; icon: string }[] = [
    { id: 'video', label: '视频课程', icon: '🎬' },
    { id: 'graphic', label: '图文教程', icon: '📖' },
    { id: 'tools', label: '工具包下载', icon: '🛠️' },
    { id: 'links', label: '网站链接', icon: '🔗' },
    { id: 'students', label: '学员成果', icon: '🏆' },
  ];

  const currentChapter = CHAPTERS.find(c => c.num === activeChapter);

  // ── 弹窗组件 ───────────────────────────────────────────────────────
  const renderModal = () => {
    if (!modal) return null;

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
           onClick={(e) => e.target === e.currentTarget && closeModal()}>
        <div className="bg-slate-800 border border-slate-600 rounded-2xl p-5 w-full max-w-md shadow-2xl">
          {/* 标题栏 */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white text-sm font-semibold">
              {modal === 'videoLink' && '🔗 添加视频链接'}
              {modal === 'cloudLink' && '☁️ 添加网盘链接'}
              {modal === 'tool' && '🛠️ 编辑工具包'}
              {modal === 'addTool' && '➕ 添加新工具包'}
              {modal === 'editLink' && '✏️ 编辑链接'}
              {modal === 'addLink' && '➕ 添加网站链接'}
              {modal === 'student' && (editStudentIndex !== null ? '✏️ 编辑喜报' : '➕ 添加学员喜报')}
            </h3>
            <button onClick={closeModal} className="text-slate-500 hover:text-white text-lg leading-none">✕</button>
          </div>

          {/* ── 视频链接弹窗 ─────────────────────────────────────── */}
          {modal === 'videoLink' && (() => {
            const [url, setUrl] = useState(modalData.url || '');
            const [ch, idx] = [parseInt(modalData.ch || '1'), parseInt(modalData.idx || '0')];
            return (
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-400 text-xs mb-1.5">视频链接地址</label>
                  <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..."
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500" />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs mb-1.5">备注文本（选填）</label>
                  <input placeholder="如：B站视频 / 腾讯视频 / YouTube"
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500" />
                </div>
                <button
                  onClick={() => {
                    if (!url.trim()) { toast.error('请输入视频链接'); return; }
                    updateLessonData(idx, { videoUrl: url });
                    toast.success('视频链接已保存');
                    closeModal();
                  }}
                  className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition-colors"
                >
                  💾 保存视频链接
                </button>
              </div>
            );
          })()}

          {/* ── 网盘链接弹窗 ─────────────────────────────────────── */}
          {modal === 'cloudLink' && (() => {
            const [cloudUrl, setCloudUrl] = useState(modalData.cloudUrl || '');
            const [cloudPwd, setCloudPwd] = useState('');
            const [idx] = [parseInt(modalData.idx || '0')];
            return (
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-400 text-xs mb-1.5">网盘链接</label>
                  <input value={cloudUrl} onChange={e => setCloudUrl(e.target.value)} placeholder="百度/阿里/Google Drive 链接"
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500" />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs mb-1.5">提取码（选填）</label>
                  <input value={cloudPwd} onChange={e => setCloudPwd(e.target.value)} placeholder="如：龙虾"
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500" />
                </div>
                <button
                  onClick={() => {
                    if (!cloudUrl.trim()) { toast.error('请输入网盘链接'); return; }
                    updateLessonData(idx, { cloudLink: cloudUrl, cloudPwd });
                    toast.success('网盘链接已保存');
                    closeModal();
                  }}
                  className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
                >
                  💾 保存网盘链接
                </button>
              </div>
            );
          })()}

          {/* ── 编辑工具包弹窗 ───────────────────────────────────── */}
          {modal === 'tool' && editToolIndex !== null && (() => {
            const tool = tools[editToolIndex];
            const [name, setName] = useState(modalData.name || tool.name);
            const [desc, setDesc] = useState(modalData.desc || tool.desc);
            const [url, setUrl] = useState(modalData.url || tool.url || '');
            return (
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-400 text-xs mb-1.5">工具名称</label>
                  <input value={name} onChange={e => setName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500" />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs mb-1.5">描述</label>
                  <input value={desc} onChange={e => setDesc(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500" />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs mb-1.5">下载链接 / 上传文件</label>
                  <input value={url} onChange={e => setUrl(e.target.value)} placeholder="网盘地址或直链"
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500 mb-2" />
                  <button
                    onClick={() => triggerFileUpload(`tool-file-${editToolIndex}`)}
                    className="w-full py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs border border-slate-600 transition-colors"
                  >
                    📎 或本地上传文件
                  </button>
                </div>
                <button
                  onClick={() => {
                    if (!name.trim()) { toast.error('请输入工具名称'); return; }
                    const updated = [...tools];
                    updated[editToolIndex] = { ...updated[editToolIndex], name, desc, url };
                    setTools(updated);
                    toast.success('工具包已更新');
                    closeModal();
                  }}
                  className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition-colors"
                >
                  💾 保存工具包
                </button>
                <button
                  onClick={() => {
                    setTools(prev => prev.filter((_, i) => i !== editToolIndex));
                    toast.success('工具包已删除');
                    closeModal();
                  }}
                  className="w-full py-2 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 text-xs border border-red-500/30 transition-colors"
                >
                  🗑️ 删除工具包
                </button>
              </div>
            );
          })()}

          {/* ── 添加新工具包弹窗 ──────────────────────────────────── */}
          {modal === 'addTool' && (() => {
            const [name, setName] = useState('');
            const [desc, setDesc] = useState('');
            const [url, setUrl] = useState('');
            return (
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-400 text-xs mb-1.5">工具名称 *</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="如：TikTok选品助手"
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500" />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs mb-1.5">描述</label>
                  <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="工具功能说明"
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500" />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs mb-1.5">文件类型</label>
                  <div className="flex gap-2 flex-wrap">
                    {['PDF','DOC','Excel','PSD','Figma','插件','其他'].map(tag => (
                      <button key={tag} onClick={() => { setNewToolTag(tag); setNewToolTagColor(TAG_COLORS[tag] || 'bg-slate-600'); }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all ${
                          newToolTag === tag ? `${TAG_COLORS[tag] || 'bg-slate-600'} text-white border-transparent` : 'bg-slate-800 text-slate-400 border-slate-600'
                        }`}>
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-slate-400 text-xs mb-1.5">下载链接</label>
                  <input value={url} onChange={e => setUrl(e.target.value)} placeholder="网盘地址或直链"
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500" />
                </div>
                <button
                  onClick={() => {
                    if (!name.trim()) { toast.error('请输入工具名称'); return; }
                    setTools(prev => [...prev, { name, desc, tag: newToolTag, tagColor: newToolTagColor, url }]);
                    toast.success('新工具包已添加');
                    closeModal();
                  }}
                  className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition-colors"
                >
                  💾 添加工具包
                </button>
              </div>
            );
          })()}

          {/* ── 编辑链接弹窗 ──────────────────────────────────────── */}
          {modal === 'editLink' && editLinkIndex !== null && (() => {
            const link = links[editLinkIndex];
            const [name, setName] = useState(modalData.name || link.name);
            const [desc, setDesc] = useState(modalData.desc || link.desc);
            const [url, setUrl] = useState(modalData.url || link.url);
            const [icon, setIcon] = useState(modalData.icon || link.icon);
            return (
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-400 text-xs mb-1.5">名称 *</label>
                  <input value={name} onChange={e => setName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500" />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs mb-1.5">描述</label>
                  <input value={desc} onChange={e => setDesc(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500" />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs mb-1.5">网址 URL</label>
                  <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..."
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500" />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs mb-1.5">图标</label>
                  <div className="flex gap-2 flex-wrap">
                    {ICON_OPTIONS.map(ic => (
                      <button key={ic} onClick={() => setIcon(ic)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm border transition-all ${
                          icon === ic ? 'bg-cyan-600 border-cyan-500' : 'bg-slate-800 border-slate-600 hover:border-cyan-500/50'
                        }`}>
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (!name.trim()) { toast.error('请输入名称'); return; }
                    const updated = [...links];
                    updated[editLinkIndex] = { ...updated[editLinkIndex], name, desc, url, icon };
                    setLinks(updated);
                    toast.success('链接已更新');
                    closeModal();
                  }}
                  className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition-colors"
                >
                  💾 保存链接
                </button>
                <button
                  onClick={() => {
                    setLinks(prev => prev.filter((_, i) => i !== editLinkIndex));
                    toast.success('链接已删除');
                    closeModal();
                  }}
                  className="w-full py-2 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 text-xs border border-red-500/30 transition-colors"
                >
                  🗑️ 删除链接
                </button>
              </div>
            );
          })()}

          {/* ── 添加链接弹窗 ───────────────────────────────────────── */}
          {modal === 'addLink' && (() => {
            const [name, setName] = useState('');
            const [desc, setDesc] = useState('');
            const [url, setUrl] = useState('');
            const [icon, setIcon] = useState('🔗');
            return (
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-400 text-xs mb-1.5">名称 *</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="网站名称"
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500" />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs mb-1.5">描述</label>
                  <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="网站用途说明"
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500" />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs mb-1.5">网址 URL</label>
                  <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..."
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500" />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs mb-1.5">图标</label>
                  <div className="flex gap-2 flex-wrap">
                    {ICON_OPTIONS.map(ic => (
                      <button key={ic} onClick={() => setIcon(ic)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm border transition-all ${
                          icon === ic ? 'bg-cyan-600 border-cyan-500' : 'bg-slate-800 border-slate-600 hover:border-cyan-500/50'
                        }`}>
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (!name.trim()) { toast.error('请输入名称'); return; }
                    setLinks(prev => [...prev, { name, desc, url, icon }]);
                    toast.success('链接已添加');
                    closeModal();
                  }}
                  className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition-colors"
                >
                  💾 添加链接
                </button>
              </div>
            );
          })()}

          {/* ── 添加/编辑学员喜报弹窗 ─────────────────────────────── */}
          {modal === 'student' && (() => {
            const existing = editStudentIndex !== null ? students[editStudentIndex] : null;
            const [name, setName] = useState(existing?.name || '');
            const [tier, setTier] = useState(existing?.tier || '基础版');
            const [achievement, setAchievement] = useState(existing?.achievement || '');
            const [date, setDate] = useState(existing?.date || new Date().toISOString().slice(0, 7));
            return (
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-400 text-xs mb-1.5">学员昵称 *</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="如：学员@小王"
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500" />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs mb-1.5">报名版本</label>
                  <div className="flex gap-2">
                    {['基础版', '陪跑版', '私教版'].map(t => (
                      <button key={t} onClick={() => setTier(t)}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium border transition-all ${
                          tier === t ? (t === '私教版' ? 'bg-rose-600/30 text-rose-300 border-rose-500/40' : 'bg-cyan-600/30 text-cyan-300 border-cyan-500/40') : 'bg-slate-800 text-slate-400 border-slate-600'
                        }`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-slate-400 text-xs mb-1.5">成果描述 *</label>
                  <textarea value={achievement} onChange={e => setAchievement(e.target.value)} placeholder="如：7天出第一单，月入过万" rows={2}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500 resize-none" />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs mb-1.5">日期（年月）</label>
                  <input type="month" value={date} onChange={e => setDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500" />
                </div>
                <button
                  onClick={() => {
                    if (!name.trim() || !achievement.trim()) { toast.error('请填写完整信息'); return; }
                    const newStudent: StudentType = { name, tier, achievement, date };
                    if (editStudentIndex !== null) {
                      const updated = [...students];
                      updated[editStudentIndex] = newStudent;
                      setStudents(updated);
                      toast.success('喜报已更新');
                    } else {
                      setStudents(prev => [newStudent, ...prev]);
                      toast.success('新喜报已添加');
                    }
                    closeModal();
                  }}
                  className="w-full py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium transition-colors"
                >
                  💾 {editStudentIndex !== null ? '更新喜报' : '添加喜报'}
                </button>
                {editStudentIndex !== null && (
                  <button
                    onClick={() => {
                      setStudents(prev => prev.filter((_, i) => i !== editStudentIndex));
                      toast.success('喜报已删除');
                      closeModal();
                    }}
                    className="w-full py-2 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 text-xs border border-red-500/30 transition-colors"
                  >
                    🗑️ 删除喜报
                  </button>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col overflow-hidden relative">
      {/* ── 隐藏的文件输入框 ────────────────────────────────────────── */}
      <input
        ref={fileInputRef}
        type="file"
        accept={uploadTarget.startsWith('video') ? 'video/*' : 'image/*,.pdf'}
        className="hidden"
        onChange={handleFileChange}
      />

      {/* ── 顶部标题 ────────────────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-3 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-lg shadow-lg shadow-cyan-900/30">
            🦞
          </div>
          <div>
            <h2 className="text-white font-bold text-base leading-tight">龙虾社知识库</h2>
            <p className="text-slate-500 text-xs mt-0.5">跨境龙虾社 · TikTok跨境课程全套资料</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <span className="px-2 py-0.5 rounded-full bg-cyan-600/20 text-cyan-400 text-[10px] font-medium border border-cyan-500/30">📺 10大课程板块</span>
          <span className="px-2 py-0.5 rounded-full bg-amber-600/20 text-amber-400 text-[10px] font-medium border border-amber-500/30">⭐ 王牌：商品卡暴力起店</span>
          <span className="px-2 py-0.5 rounded-full bg-rose-600/20 text-rose-400 text-[10px] font-medium border border-rose-500/30">🛠️ {tools.filter(t => !t.locked).length}大工具包</span>
        </div>
      </div>

      {/* ── 标签切换 ────────────────────────────────────────────────── */}
      <div className="px-4 py-2 flex-shrink-0 border-b border-slate-800/60 flex gap-1 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeSection === tab.id
                ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-900/20'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 border border-transparent'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── 内容区域 ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* ── 视频课程 ──────────────────────────────────────────────── */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeSection === 'video' && (
          <div className="p-4 space-y-4">
            {/* 章节导航 */}
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {CHAPTERS.map(ch => (
                <button
                  key={ch.num}
                  onClick={() => setActiveChapter(ch.num)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeChapter === ch.num
                      ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-800/60 text-slate-500 hover:text-slate-300 border border-transparent'
                  }`}
                >
                  第{ch.num}章
                </button>
              ))}
            </div>

            {currentChapter && (
              <div className="space-y-3">
                {/* 章节头 */}
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      currentChapter.locked ? 'bg-rose-600/20 text-rose-400 border border-rose-500/30' : 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30'
                    }`}>
                      {currentChapter.num}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-white text-sm font-semibold leading-snug">
                          第{currentChapter.num}章 · {currentChapter.name}
                        </h3>
                        {currentChapter.locked && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-600/20 text-rose-400 text-[9px] font-medium border border-rose-500/30">🔒 内部不外传</span>
                        )}
                        {currentChapter.num === 4 && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-600/20 text-amber-400 text-[9px] font-medium border border-amber-500/30">⭐ 王牌板块</span>
                        )}
                      </div>
                      <p className="text-slate-500 text-[10px] mt-1">共{currentChapter.lessons.length}节课时 · 点击展开上传资料</p>
                    </div>
                  </div>
                </div>

                {/* 课时列表 */}
                <div className="space-y-1.5">
                  {currentChapter.lessons.map((lesson, i) => {
                    const data = getLessonData(i);
                    const isExpanded = expandedLessons[i];

                    return (
                      <div key={i} className="bg-slate-800/40 rounded-lg border border-slate-700/40 overflow-hidden">
                        {/* 课时标题行 */}
                        <button
                          onClick={() => toggleLesson(i)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-700/30 transition-colors"
                        >
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium flex-shrink-0 ${
                            currentChapter.locked ? 'bg-rose-600/20 text-rose-400' : 'bg-cyan-600/20 text-cyan-400'
                          }`}>
                            {i + 1}
                          </div>
                          <span className="text-slate-300 text-xs flex-1 leading-snug">{lesson}</span>
                          {/* 已上传内容指示 */}
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {data.videoUrl && <span className="text-[9px] text-cyan-400 bg-cyan-600/20 px-1 py-0.5 rounded">🎬</span>}
                            {data.graphicUrls?.length ? <span className="text-[9px] text-blue-400 bg-blue-600/20 px-1 py-0.5 rounded">📖×{data.graphicUrls.length}</span> : null}
                            {data.cloudLink && <span className="text-[9px] text-teal-400 bg-teal-600/20 px-1 py-0.5 rounded">☁️</span>}
                            <span className={`text-slate-600 text-xs transition-transform ${isExpanded ? 'rotate-90' : ''}`}>▸</span>
                          </div>
                        </button>

                        {/* 课时展开内容 */}
                        {isExpanded && (
                          <div className="px-4 pb-4 pt-2 border-t border-slate-700/40 space-y-3">
                            {/* 视频区域 */}
                            <div>
                              <div className="text-slate-400 text-[10px] font-medium mb-1.5 flex items-center gap-1.5">
                                <span>🎬</span> 视频
                                {data.videoUrl && <span className="text-cyan-400">已上传</span>}
                              </div>
                              {data.videoUrl ? (
                                <div className="flex items-center gap-2">
                                  {data.videoUrl.startsWith('data:') || data.videoUrl.startsWith('blob:') ? (
                                    <div className="flex-1 h-12 rounded-lg bg-green-600/20 border border-green-500/30 flex items-center px-3 gap-2">
                                      <span className="text-green-400 text-xs">📹 本地视频已上传</span>
                                    </div>
                                  ) : (
                                    <a href={data.videoUrl} target="_blank" rel="noopener noreferrer"
                                      className="flex-1 h-12 rounded-lg bg-cyan-600/20 border border-cyan-500/30 flex items-center px-3 gap-2 hover:bg-cyan-600/30 transition-colors">
                                      <span className="text-cyan-400 text-xs truncate">🔗 {data.videoUrl}</span>
                                    </a>
                                  )}
                                  <button
                                    onClick={() => triggerFileUpload(`video-${activeChapter}-${i}`)}
                                    className="px-2.5 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-[10px] border border-slate-600 transition-colors whitespace-nowrap"
                                  >
                                    替换
                                  </button>
                                  <button
                                    onClick={() => updateLessonData(i, { videoUrl: '' })}
                                    className="px-2.5 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 text-[10px] border border-red-500/30 transition-colors whitespace-nowrap"
                                  >
                                    移除
                                  </button>
                                </div>
                              ) : (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => triggerFileUpload(`video-${activeChapter}-${i}`)}
                                    className="flex-1 h-12 rounded-lg bg-slate-900/60 border border-dashed border-slate-600/50 flex flex-col items-center justify-center gap-0.5 cursor-pointer hover:border-cyan-500/50 hover:bg-slate-900/80 transition-colors"
                                  >
                                    <div className="text-slate-400 text-[10px]">⬆️ 本地上传</div>
                                    <div className="text-slate-600 text-[8px]">MP4·AVI·WebM</div>
                                  </button>
                                  <button
                                    onClick={() => openModal('videoLink', { ch: String(activeChapter), idx: String(i) })}
                                    className="flex-1 h-12 rounded-lg bg-slate-900/60 border border-dashed border-slate-600/50 flex flex-col items-center justify-center gap-0.5 cursor-pointer hover:border-cyan-500/50 hover:bg-slate-900/80 transition-colors"
                                  >
                                    <div className="text-slate-400 text-[10px]">🔗 添加链接</div>
                                    <div className="text-slate-600 text-[8px]">B站·腾讯·YouTube</div>
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* 图文区域 */}
                            <div>
                              <div className="text-slate-400 text-[10px] font-medium mb-1.5 flex items-center gap-1.5">
                                <span>📖</span> 图文资料
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                {[
                                  ...(data.graphicUrls || []).map((url, gi) => (
                                    <div key={gi} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-600/50">
                                      <img src={url} alt={`图文${gi + 1}`} className="w-full h-full object-cover" />
                                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                        <button onClick={() => triggerFileUpload(`video-${activeChapter}-${i}`)}
                                          className="px-1.5 py-1 rounded bg-slate-700 text-white text-[8px]">替换</button>
                                        <button onClick={() => updateLessonData(i, { graphicUrls: (data.graphicUrls || []).filter((_, gi2) => gi2 !== gi) })}
                                          className="px-1.5 py-1 rounded bg-red-600 text-white text-[8px]">✕</button>
                                      </div>
                                    </div>
                                  )),
                                  // 上传占位格
                                  ...(((data.graphicUrls?.length) ?? 0) < 6 ? [{ placeholder: true, idx: (data.graphicUrls?.length) ?? 0 }] : []).filter(() => !currentChapter.locked).map(({ idx }) => (
                                    <div key={`upload-${idx}`}
                                      onClick={() => triggerFileUpload(`video-${activeChapter}-${i}`)}
                                      className="aspect-square rounded-lg bg-slate-900/60 border border-dashed border-slate-700/50 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-cyan-500/40 hover:bg-slate-900/80 transition-all"
                                    >
                                      <div className="text-slate-600 text-lg">➕</div>
                                      <div className="text-slate-600 text-[8px]">上传图片</div>
                                    </div>
                                  ))
                                ]}
                              </div>
                            </div>

                            {/* 网盘链接 */}
                            <div>
                              <div className="text-slate-400 text-[10px] font-medium mb-1.5 flex items-center justify-between">
                                <span className="flex items-center gap-1.5"><span>☁️</span> 网盘资料</span>
                                {data.cloudLink && (
                                  <span className="text-teal-400 flex items-center gap-1">
                                    <a href={data.cloudLink} target="_blank" rel="noopener noreferrer" className="hover:underline">已保存链接</a>
                                    {data.cloudPwd && <span className="text-amber-400">🔑 {data.cloudPwd}</span>}
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => openModal('cloudLink', { idx: String(i) })}
                                className="w-full py-2 rounded-lg bg-blue-600/20 text-blue-400 text-[10px] font-medium border border-blue-500/30 hover:bg-blue-600/30 transition-colors"
                              >
                                {data.cloudLink ? '✏️ 编辑网盘链接' : '☁️ 添加网盘链接'}
                              </button>
                            </div>

                            {/* 锁定提示 */}
                            {currentChapter.locked && (
                              <div className="bg-rose-600/10 rounded-lg p-3 border border-rose-700/30 text-center">
                                <div className="text-rose-400 text-xs font-medium mb-1">🔒 私教版专属内容</div>
                                <div className="text-slate-500 text-[10px]">请联系管理员 SIMIAIOS 获取访问权限</div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* ── 图文教程 ──────────────────────────────────────────────── */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeSection === 'graphic' && (
          <div className="p-4 space-y-4">
            <div className="bg-gradient-to-r from-cyan-600/10 to-blue-600/10 rounded-xl p-4 border border-cyan-700/30 flex items-center gap-3">
              <div className="text-2xl flex-shrink-0">📖</div>
              <div>
                <div className="text-cyan-300 text-xs font-medium mb-0.5">图文教程专区</div>
                <p className="text-slate-400 text-[10px] leading-relaxed">上传课程核心图文资料，支持 PNG/JPG/PDF，整理成体系化学习手册</p>
              </div>
            </div>

            <div className="space-y-3">
              {CHAPTERS.filter(ch => !ch.locked).map(ch => {
                const imgs = getGraphicUrls(ch.num);
                return (
                  <div key={ch.num} className="bg-slate-800/40 rounded-xl border border-slate-700/40 overflow-hidden">
                    {/* 章节头 */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700/40">
                      <div className="w-7 h-7 rounded-lg bg-cyan-600/20 text-cyan-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {ch.num}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-slate-200 text-xs font-medium leading-snug">
                          第{ch.num}章 · {ch.name.replace(' ⭐王牌板块', '')}
                        </div>
                        <div className="text-slate-500 text-[9px] mt-0.5">{imgs.length}张图片已上传</div>
                      </div>
                      <button
                        onClick={() => triggerFileUpload(`graphic-ch${ch.num}`)}
                        className="px-2.5 py-1 rounded-lg bg-cyan-600/20 text-cyan-400 text-[10px] font-medium border border-cyan-500/30 hover:bg-cyan-600/30 transition-colors whitespace-nowrap"
                      >
                        ➕ 上传图片
                      </button>
                    </div>

                    {/* 图片网格 */}
                    <div className="p-3">
                      <div className="grid grid-cols-4 gap-2">
                        {imgs.map((url, gi) => (
                          <div key={gi} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-700/40">
                            <img src={url} alt={`第${ch.num}章图${gi + 1}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
                              <button
                                onClick={() => window.open(url, '_blank')}
                                className="px-2 py-1 rounded bg-cyan-600 text-white text-[9px]"
                              >
                                查看大图
                              </button>
                              <button
                                onClick={() => removeImage(`graphic-ch${ch.num}`, gi)}
                                className="px-2 py-1 rounded bg-red-600 text-white text-[9px]"
                              >
                                删除
                              </button>
                            </div>
                            <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] px-1 rounded">{gi + 1}/{imgs.length}</div>
                          </div>
                        ))}
                        {Array.from({ length: Math.max(0, 4 - imgs.length) }).map((_, gi) => (
                          <div key={`empty-${gi}`}
                            onClick={() => triggerFileUpload(`graphic-ch${ch.num}`)}
                            className="aspect-square rounded-lg bg-slate-900/60 border border-dashed border-slate-700/50 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-cyan-500/40 hover:bg-slate-900/80 transition-all"
                          >
                            <div className="text-slate-600 text-xl">➕</div>
                            <div className="text-slate-600 text-[8px]">添加图片</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* ── 工具包下载 ─────────────────────────────────────────────── */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeSection === 'tools' && (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {tools.map((tool, i) => (
                <div key={i} className={`rounded-xl border p-4 flex flex-col gap-2 transition-all ${
                  tool.locked
                    ? 'bg-slate-800/30 border-rose-700/30 opacity-80'
                    : 'bg-slate-800/50 border-slate-700/50 hover:border-cyan-600/30 hover:bg-slate-800/70'
                }`}>
                  <div className="flex items-start gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${tool.locked ? 'bg-rose-600/20' : 'bg-cyan-600/20'}`}>
                      <span className="text-sm">{tool.locked ? '🔒' : '🛠️'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-semibold leading-snug ${tool.locked ? 'text-rose-300' : 'text-slate-200'}`}>{tool.name}</div>
                      <div className="text-slate-500 text-[10px] mt-0.5 leading-relaxed">{tool.desc}</div>
                    </div>
                  </div>

                  {tool.url && !tool.locked && (
                    <a href={tool.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-cyan-400 text-[10px] hover:underline truncate">
                      🔗 {tool.url}
                    </a>
                  )}

                  <div className="flex items-center justify-between mt-1">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium text-white ${tool.tagColor}`}>{tool.tag}</span>
                    {tool.locked ? (
                      <div className="flex items-center gap-1">
                        <span className="px-2 py-1 rounded-lg bg-rose-600/20 text-rose-400 text-[10px] font-medium border border-rose-500/30">🔒 私教专属</span>
                        <button
                          onClick={() => navigator.clipboard.writeText('SIMIAIOS')}
                          className="px-2 py-1 rounded-lg bg-rose-600/10 text-rose-400/70 text-[10px] border border-rose-500/20 hover:text-rose-400 transition-colors"
                        >
                          📋 咨询
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => openModal('tool', { name: tool.name, desc: tool.desc, url: tool.url || '' })}
                        className="px-2.5 py-1 rounded-lg bg-cyan-600/20 text-cyan-400 text-[10px] font-medium border border-cyan-500/30 hover:bg-cyan-600/30 transition-colors whitespace-nowrap"
                      >
                        {tool.url ? '✏️ 编辑' : '⬆️ 上传/链接'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 添加新工具 */}
            <button
              onClick={() => openModal('addTool')}
              className="w-full py-3 rounded-xl border border-dashed border-slate-700/50 text-slate-500 text-xs hover:text-slate-300 hover:border-cyan-600/30 transition-all flex items-center justify-center gap-2"
            >
              <span>➕</span> 添加新工具包
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* ── 网站链接 ───────────────────────────────────────────────── */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeSection === 'links' && (
          <div className="p-4 space-y-3">
            <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/40">
              <div className="text-slate-300 text-xs font-medium mb-3 flex items-center justify-between">
                <span className="flex items-center gap-1.5"><span>🔗</span> 网站链接收藏</span>
                <button
                  onClick={() => openModal('addLink')}
                  className="px-2.5 py-1 rounded-lg bg-cyan-600/20 text-cyan-400 text-[10px] font-medium border border-cyan-500/30 hover:bg-cyan-600/30 transition-colors"
                >
                  ➕ 添加
                </button>
              </div>

              <div className="space-y-2">
                {links.map((link, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-900/60 border border-slate-700/40 hover:border-cyan-600/30 hover:bg-slate-900/80 transition-all group">
                    <div className="w-8 h-8 rounded-lg bg-cyan-600/20 flex items-center justify-center text-sm flex-shrink-0">
                      {link.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-slate-200 text-xs font-medium leading-snug">{link.name}</div>
                      <div className="text-slate-500 text-[10px] mt-0.5">{link.desc}</div>
                      {link.url && (
                        <a href={link.url} target="_blank" rel="noopener noreferrer"
                          className="text-cyan-400 text-[10px] hover:underline truncate block mt-0.5">
                          🔗 {link.url}
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {link.url ? (
                        <a href={link.url} target="_blank" rel="noopener noreferrer"
                          className="px-2 py-1 rounded-lg bg-cyan-600/20 text-cyan-400 text-[10px] hover:bg-cyan-600/30 transition-colors border border-cyan-500/30">
                          🔗 访问
                        </a>
                      ) : null}
                      <button
                        onClick={() => openModal('editLink', { name: link.name, desc: link.desc, url: link.url, icon: link.icon })}
                        className="px-2 py-1 rounded-lg bg-slate-700/60 text-slate-400 text-[10px] hover:text-white hover:bg-slate-600/60 transition-colors border border-transparent hover:border-slate-500"
                      >
                        ✏️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 联系方式卡片 */}
            <div className="bg-gradient-to-r from-amber-600/10 to-orange-600/10 rounded-xl p-4 border border-amber-700/30">
              <div className="text-amber-400 text-xs font-medium mb-3 flex items-center gap-2">
                <span>📱</span> 联系方式
              </div>
              <div className="space-y-2">
                {([
                  { label: '管理员微信', value: 'SIMIAIOS', color: 'amber' },
                  { label: '学员咨询', value: 'TikTok开店', color: 'cyan' },
                ] as const).map(({ label, value, color }) => {
                  const copyFn = () => { navigator.clipboard.writeText(value); toast.success('\u5df2\u590d\u5236\uff1a' + value); };
                  const btnCls = color === 'amber' ? 'bg-amber-600/20 text-amber-400 border-amber-500/30 hover:bg-amber-600/30' : 'bg-cyan-600/20 text-cyan-400 border-cyan-500/30 hover:bg-cyan-600/30';
                  const valCls = color === 'amber' ? 'text-amber-400' : 'text-cyan-400';
                  return (
                    <div key={label} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-600/20 flex items-center justify-center text-sm flex-shrink-0">💬</div>
                      <div className="flex-1">
                        <div className="text-slate-200 text-xs font-medium">{label}</div>
                        <div className={"text-sm font-bold mt-0.5 " + valCls}>{value}</div>
                      </div>
                      <button onClick={copyFn} className={"px-2.5 py-1.5 rounded-lg text-[10px] font-medium border transition-colors " + btnCls}>
                        📋 复制
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* ── 学员成果 ───────────────────────────────────────────────── */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeSection === 'students' && (
          <div className="p-4 space-y-4">

            {/* 喜报墙 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 text-sm">🏆</span>
                  <span className="text-slate-200 text-xs font-semibold">学员出单喜报墙</span>
                  <span className="text-slate-600 text-[10px]">（{students.length}条）</span>
                </div>
                <button
                  onClick={() => openModal('student')}
                  className="px-2.5 py-1 rounded-lg bg-amber-600/20 text-amber-400 text-[10px] font-medium border border-amber-500/30 hover:bg-amber-600/30 transition-colors"
                >
                  ➕ 添加喜报
                </button>
              </div>

              <div className="space-y-2">
                {students.map((s, i) => (
                  <div key={i} className="bg-slate-800/40 rounded-xl border border-slate-700/40 p-3 flex items-center gap-3 hover:border-cyan-600/30 transition-colors group">
                    {/* 头像 */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-600/30 to-blue-700/30 border border-cyan-500/30 flex items-center justify-center text-sm flex-shrink-0 overflow-hidden">
                      {studentScreenshots[i] ? (
                        <img src={studentScreenshots[i]} alt="截图" className="w-full h-full object-cover" />
                      ) : (
                        <span>&#x1F99E;</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-slate-200 text-xs font-semibold">{s.name}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                          s.tier === '私教版' ? 'bg-rose-600/20 text-rose-400 border border-rose-500/30'
                            : s.tier === '陪跑版' ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30'
                            : 'bg-slate-700/60 text-slate-400 border border-slate-600/30'
                        }`}>
                          {s.tier}
                        </span>
                      </div>
                      <div className="text-amber-400 text-[10px] mt-0.5 font-medium">{s.achievement}</div>
                      <div className="text-slate-600 text-[9px] mt-0.5">{s.date}</div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => triggerFileUpload(`student-screenshot-${i}`)}
                        className="px-2 py-1 rounded-lg bg-slate-700/60 text-slate-400 text-[10px] hover:text-white hover:bg-slate-600/60 transition-colors border border-transparent hover:border-slate-500 whitespace-nowrap"
                      >
                        📷 截图
                      </button>
                      <button
                        onClick={() => openModal('student', {})}
                        className="px-2 py-1 rounded-lg bg-slate-700/60 text-slate-400 text-[10px] hover:text-white hover:bg-slate-600/60 transition-colors border border-transparent hover:border-slate-500 whitespace-nowrap"
                      >
                        ✏️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 好评截图集 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400 text-sm">⭐</span>
                  <span className="text-slate-200 text-xs font-semibold">学员好评截图集</span>
                  <span className="text-slate-600 text-[10px]">（{reviewScreenshots.length}张）</span>
                </div>
                <button
                  onClick={() => triggerFileUpload('review-screenshot')}
                  className="px-2.5 py-1 rounded-lg bg-slate-700/60 text-slate-400 text-[10px] hover:text-white hover:bg-slate-600/60 transition-colors"
                >
                  ➕ 上传截图
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {reviewScreenshots.map((url, i) => (
                  <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-700/40 bg-slate-800">
                    <img src={url} alt={`好评${i + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                      <button onClick={() => window.open(url, '_blank')}
                        className="px-2 py-1 rounded bg-cyan-600 text-white text-[9px]">查看</button>
                      <button onClick={() => setReviewScreenshots(prev => prev.filter((_, j) => j !== i))}
                        className="px-2 py-1 rounded bg-red-600 text-white text-[9px]">删除</button>
                    </div>
                    <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] px-1 rounded">{i + 1}</div>
                  </div>
                ))}
                {Array.from({ length: Math.max(0, 8 - reviewScreenshots.length) }).map((_, i) => (
                  <div key={`empty-${i}`}
                    onClick={() => triggerFileUpload('review-screenshot')}
                    className="aspect-square rounded-xl bg-slate-800/40 border border-dashed border-slate-700/50 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-cyan-500/40 hover:bg-slate-800/70 transition-all"
                  >
                    <div className="text-slate-600 text-2xl">➕</div>
                    <div className="text-slate-600 text-[9px]">上传好评</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 成单喜报模板 */}
            <div className="bg-gradient-to-r from-green-600/10 to-emerald-600/10 rounded-xl p-4 border border-green-700/30">
              <div className="text-green-400 text-xs font-medium mb-2 flex items-center gap-1.5">
                <span>📝</span> 成单喜报模板（可直接复制使用）
              </div>
              <div className="bg-slate-900/80 rounded-lg p-3 text-slate-400 text-[10px] leading-relaxed font-mono border border-slate-700/40 space-y-1">
                <div>🎉 恭喜学员@XXX 成功报名跨境龙虾社旗舰私教版！</div>
                <div>正式开启TikTok东南亚跨境电商之路 🚀</div>
                <div>从开店→选品→上架→出单，我们全程陪跑！</div>
                <div>下一个爆单的就是你 💎</div>
                <div className="text-amber-400">地球号：SIMIAIOS（备注：TikTok开店）</div>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `🎉 恭喜学员@XXX 成功报名跨境龙虾社旗舰私教版！\n正式开启TikTok东南亚跨境电商之路 🚀\n从开店→选品→上架→出单，我们全程陪跑！\n下一个爆单的就是你 💎\n地球号：SIMIAIOS（备注：TikTok开店）`
                  );
                  toast.success('喜报模板已复制到剪贴板！');
                }}
                className="w-full mt-2 py-2 rounded-lg bg-green-600/20 text-green-400 text-xs font-medium border border-green-500/30 hover:bg-green-600/30 transition-colors flex items-center justify-center gap-1.5"
              >
                📋 一键复制喜报模板
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── 弹窗 ─────────────────────────────────────────────────────── */}
      {renderModal()}
    </div>
  );
}

// ── 常量 ──────────────────────────────────────────────────────────────
const TAG_COLORS: Record<string, string> = {
  'PDF': 'bg-amber-600',
  'DOC': 'bg-blue-600',
  'Excel': 'bg-teal-600',
  'PSD': 'bg-violet-600',
  'Figma': 'bg-pink-600',
  '插件': 'bg-green-600',
  '其他': 'bg-slate-600',
};

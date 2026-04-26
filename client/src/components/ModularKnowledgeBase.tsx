import { useState, useRef } from 'react';
import { toast } from 'sonner';

interface ResourceItem {
  id: string;
  title: string;
  desc?: string;
  url?: string;
  cloudCode?: string;
  tag?: string;
  createdAt: number;
}

interface Category {
  id: string;
  label: string;
  icon: string;
  color: string;
  tagColor: string;
  placeholder: string;
  descPlaceholder: string;
  urlPlaceholder: string;
}

const CATEGORIES: Category[] = [
  { id: 'image', label: '图片素材', icon: '🖼️', color: 'text-rose-400', tagColor: 'bg-rose-600/20 text-rose-300', placeholder: '输入图片标题', descPlaceholder: '图片描述（选填）', urlPlaceholder: '图片访问地址' },
  { id: 'video', label: '视频素材', icon: '🎬', color: 'text-cyan-400', tagColor: 'bg-cyan-600/20 text-cyan-300', placeholder: '输入视频标题', descPlaceholder: '视频描述（选填）', urlPlaceholder: '视频播放地址' },
  { id: 'file', label: '文件资料', icon: '📄', color: 'text-amber-400', tagColor: 'bg-amber-600/20 text-amber-300', placeholder: '输入文件名称', descPlaceholder: '文件说明（选填）', urlPlaceholder: '文件下载地址' },
  { id: 'cloud', label: '网盘链接', icon: '☁️', color: 'text-blue-400', tagColor: 'bg-blue-600/20 text-blue-300', placeholder: '输入网盘名称', descPlaceholder: '备注信息（选填）', urlPlaceholder: '网盘链接地址' },
  { id: 'website', label: '网站链接', icon: '🔗', color: 'text-emerald-400', tagColor: 'bg-emerald-600/20 text-emerald-300', placeholder: '输入网站名称', descPlaceholder: '网站描述（选填）', urlPlaceholder: '网站URL地址' },
  { id: 'ai', label: 'AI工具', icon: '🤖', color: 'text-violet-400', tagColor: 'bg-violet-600/20 text-violet-300', placeholder: '输入AI工具名称', descPlaceholder: '工具描述或用途（选填）', urlPlaceholder: '工具访问地址' },
];

const TAGS: Record<string, string[]> = {
  image: ['选品图', '主图', '详情页', '素材', '学员作品'],
  video: ['课程片段', '带货视频', '教学演示', '素材', '其他'],
  file: ['PDF', 'Word', 'Excel', 'PPT', '其他'],
  cloud: ['百度网盘', '阿里云盘', 'Google Drive', 'OneDrive', '其他'],
  website: ['官方后台', '电商平台', '物流工具', '选品工具', '其他'],
  ai: ['ChatGPT', 'Claude', 'Midjourney', 'AI视频', '其他'],
};

function genId() { return Math.random().toString(36).slice(2); }

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}


interface ModalProps {
  category: Category;
  editItem?: ResourceItem;
  onSave: (item: ResourceItem) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

function ResourceModal({ category, editItem, onSave, onDelete, onClose }: ModalProps) {
  const [title, setTitle] = useState(editItem?.title || '');
  const [desc, setDesc] = useState(editItem?.desc || '');
  const [url, setUrl] = useState(editItem?.url || '');
  const [cloudCode, setCloudCode] = useState(editItem?.cloudCode || '');
  const [selectedTag, setSelectedTag] = useState(editItem?.tag || (TAGS[category.id]?.[0] || ''));
  const [fileName, setFileName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const tags = TAGS[category.id] || [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setUrl(URL.createObjectURL(file));
  };

  const handleSave = () => {
    if (!title.trim()) { toast.error('请输入标题'); return; }
    if (!url.trim()) { toast.error('请输入链接或上传文件'); return; }
    onSave({ id: editItem?.id || genId(), title: title.trim(), desc: desc.trim(), url: url.trim(), cloudCode: cloudCode.trim(), tag: selectedTag, createdAt: editItem?.createdAt || Date.now() });
    onClose();
  };

  const ic = 'w-full bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-500 transition-colors';

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4' onClick={onClose}>
      <div className='bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl w-full max-w-lg' onClick={e => e.stopPropagation()}>
        <div className='flex items-center justify-between px-5 py-4 border-b border-slate-700/50'>
          <div className='flex items-center gap-2'><span className='text-lg'>{category.icon}</span><span className='text-sm font-semibold text-slate-200'>{(editItem ? '编辑' : '添加') + ' ' + category.label}</span></div>
          <button onClick={onClose} className='w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors text-xs'>✕</button>
        </div>
        <div className='p-5 space-y-4'>
          {tags.length > 0 && (
            <div>
              <label className='text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-2 block'>类型标签</label>
              <div className='flex flex-wrap gap-1.5'>
                {tags.map(tag => (
                  <button key={tag} onClick={() => setSelectedTag(tag)}
                    className={'px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all ' + (selectedTag === tag ? category.tagColor + ' border-transparent' : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600')}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className='text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-2 block'>标题 <span className='text-rose-400'>*</span></label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder={category.placeholder} className={ic} />
          </div>
          <div>
            <label className='text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-2 block'>描述（选填）</label>
            <input value={desc} onChange={e => setDesc(e.target.value)} placeholder={category.descPlaceholder} className={ic} />
          </div>
          {category.id === 'image' || category.id === 'video' || category.id === 'file' ? (
            <div>
              <label className='text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-2 block'>{category.id === 'file' ? '上传文件' : '上传' + (category.id === 'image' ? '图片' : '视频')}</label>
              <input ref={fileRef} type='file' accept={category.id === 'image' ? 'image/*' : category.id === 'video' ? 'video/*' : '*'} className='hidden' onChange={handleFileChange} />
              <button onClick={() => fileRef.current?.click()} className={ic + ' text-left truncate cursor-pointer hover:bg-slate-800'}>{fileName || '点击选择文件...'}</button>
              <div className='mt-2'>
                <label className='text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1.5 block'>或输入访问链接</label>
                <input value={url} onChange={e => setUrl(e.target.value)} placeholder={category.urlPlaceholder} className={ic} />
              </div>
            </div>
          ) : (
            <div>
              <label className='text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-2 block'>链接地址 <span className='text-rose-400'>*</span></label>
              <input value={url} onChange={e => setUrl(e.target.value)} placeholder={category.urlPlaceholder} className={ic} />
            </div>
          )}
          {category.id === 'cloud' && (
            <div>
              <label className='text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-2 block'>提取码（选填）</label>
              <input value={cloudCode} onChange={e => setCloudCode(e.target.value)} placeholder='输入网盘提取码' className={ic} />
            </div>
          )}
        </div>
        <div className='flex items-center gap-2 px-5 py-4 border-t border-slate-700/50'>
          {editItem && onDelete && <button onClick={() => { onDelete(editItem.id); onClose(); }} className='px-4 py-2 rounded-lg text-xs font-medium bg-rose-600/20 text-rose-400 border border-rose-500/30 hover:bg-rose-600/30 transition-colors'>删除</button>}
          <div className='flex-1' />
          <button onClick={onClose} className='px-4 py-2 rounded-lg text-xs font-medium bg-slate-800 text-slate-400 hover:bg-slate-700 transition-colors'>取消</button>
          <button onClick={handleSave} className='px-5 py-2 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors'>保存</button>
        </div>
      </div>
    </div>
  );
}


interface CardProps { item: ResourceItem; category: Category; onEdit: () => void; onDelete: () => void; }

function ResourceCard({ item, category, onEdit, onDelete }: CardProps) {
  const [hover, setHover] = useState(false);
  const copyText = (text: string, label: string) => { navigator.clipboard.writeText(text).then(() => toast.success(label + ' 已复制')); };

  return (
    <div className={'rounded-xl border bg-slate-800/30 p-3 flex flex-col gap-2 transition-all cursor-pointer border-slate-700/40 hover:border-slate-600/60' + (hover ? ' bg-slate-800/50' : '')}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onClick={onEdit}>
      {hover && (
        <div className='flex gap-1.5 self-end'>
          <button onClick={e => { e.stopPropagation(); onEdit(); }} className='w-6 h-6 rounded-md bg-slate-900/90 border border-slate-600 flex items-center justify-center text-[9px] text-slate-300 hover:text-white transition-colors'>✏️</button>
          <button onClick={e => { e.stopPropagation(); onDelete(); }} className='w-6 h-6 rounded-md bg-slate-900/90 border border-slate-600 flex items-center justify-center text-[9px] text-slate-300 hover:text-rose-400 transition-colors'>🗑️</button>
        </div>
      )}
      <div className='w-full h-20 rounded-lg overflow-hidden bg-slate-800/60 flex items-center justify-center'>
        {category.id === 'image' && item.url ? <img src={item.url} alt={item.title} className='w-full h-full object-cover' /> :
         category.id === 'video' && item.url ? <div className='relative w-full h-full'><video src={item.url} className='w-full h-full object-cover' /><div className='absolute inset-0 flex items-center justify-center bg-black/30'><span className='text-white text-lg'>▶</span></div></div> :
         <span className='text-2xl'>{category.icon}</span>}
      </div>
      <div className='flex-1 min-w-0'>
        <div className='flex items-center gap-1.5 mb-1'><span className={'px-1.5 py-0.5 rounded text-[9px] font-medium ' + category.tagColor}>{item.tag || ''}</span></div>
        <div className='text-xs font-semibold text-slate-200 truncate leading-tight'>{item.title}</div>
        {item.desc && <div className='text-[10px] text-slate-500 mt-0.5 truncate'>{item.desc}</div>}
        {item.cloudCode && (
          <div className='flex items-center gap-1 mt-1'>
            <span className='text-[10px] text-slate-600'>提取码：</span>
            <button onClick={e => { e.stopPropagation(); copyText(item.cloudCode || '', '提取码'); }} className='text-[10px] font-bold text-cyan-400 hover:text-cyan-300'>{item.cloudCode}</button>
          </div>
        )}
      </div>
      <div className='flex items-center justify-between pt-1 border-t border-slate-700/30'>
        <span className='text-[9px] text-slate-600'>{formatTime(item.createdAt)}</span>
        <div className='flex gap-1.5'>
          {item.url && <button onClick={e => { e.stopPropagation(); window.open(item.url, '_blank'); }} className='px-2 py-0.5 rounded text-[9px] bg-cyan-600/20 text-cyan-400 hover:bg-cyan-600/30 transition-colors'>🔗</button>}
          {item.url && <button onClick={e => { e.stopPropagation(); copyText(item.url || '', '链接'); }} className='px-2 py-0.5 rounded text-[9px] bg-slate-700/60 text-slate-400 hover:text-slate-200 transition-colors'>📋</button>}
        </div>
      </div>
    </div>
  );
}


export function ModularKnowledgeBase() {
  const [activeCategory, setActiveCategory] = useState<string>(CATEGORIES[0].id);
  const [resources, setResources] = useState<Record<string, ResourceItem[]>>(() => {
    const init: Record<string, ResourceItem[]> = {};
    CATEGORIES.forEach(c => { init[c.id] = []; });
    return init;
  });
  const [modal, setModal] = useState<{ category: Category; editItem?: ResourceItem } | null>(null);
  const [searchMap, setSearchMap] = useState<Record<string, string>>({});

  const activeCat = CATEGORIES.find(c => c.id === activeCategory)!;
  const items = resources[activeCategory] || [];
  const filtered = searchMap[activeCategory] ? items.filter(i => i.title.includes(searchMap[activeCategory]) || i.desc?.includes(searchMap[activeCategory])) : items;

  const handleSave = (item: ResourceItem) => {
    setResources(prev => {
      const list = prev[activeCategory] || [];
      const idx = list.findIndex(i => i.id === item.id);
      const updated = idx >= 0 ? list.map((x, i) => i === idx ? item : x) : [item, ...list];
      return { ...prev, [activeCategory]: updated };
    });
    toast.success(modal?.editItem ? '已更新' : '已添加');
  };

  const handleDelete = (id: string) => {
    setResources(prev => ({ ...prev, [activeCategory]: (prev[activeCategory] || []).filter(i => i.id !== id) }));
    toast.success('已删除');
  };

  const counts: Record<string, number> = {};
  CATEGORIES.forEach(c => { counts[c.id] = (resources[c.id] || []).length; });

  return (
    <div className='h-full flex flex-col overflow-hidden'>
      <div className='px-5 pt-4 pb-3 border-b border-slate-700/40 flex-shrink-0'>
        <div className='flex items-center gap-2 mb-0.5'><span className='text-base'>🗂️</span><span className='text-sm font-bold text-slate-200'>模块化知识库</span></div>
        <p className='text-[10px] text-slate-600'>分类管理图片、视频、文件、网盘、网站、AI工具链接</p>
      </div>
      <div className='flex-shrink-0 px-5 pt-3 pb-2 border-b border-slate-700/40 overflow-x-auto'>
        <div className='flex gap-1.5 min-w-max'>
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className={'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all whitespace-nowrap ' + (activeCategory === cat.id ? 'bg-slate-700/80 text-slate-200 border-slate-600' : 'bg-transparent text-slate-500 border-transparent hover:bg-slate-800/60 hover:text-slate-300')}>
              <span>{cat.icon}</span><span>{cat.label}</span>
              {counts[cat.id] > 0 && <span className={'px-1 py-0.5 rounded-full text-[9px] ' + (activeCategory === cat.id ? 'bg-cyan-600/40 text-cyan-300' : 'bg-slate-700 text-slate-500')}>{counts[cat.id]}</span>}
            </button>
          ))}
        </div>
      </div>
      <div className='flex-1 overflow-y-auto p-5'>
        <div className='flex items-center gap-2 mb-4'>
          <div className='flex-1 relative'>
            <span className='absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs'>🔍</span>
            <input value={searchMap[activeCategory] || ''} onChange={e => setSearchMap(prev => ({ ...prev, [activeCategory]: e.target.value }))}
              placeholder={'搜索' + activeCat.label + '...'}
              className='w-full bg-slate-800/50 border border-slate-700/50 rounded-lg pl-7 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-500 transition-colors' />
          </div>
          <button onClick={() => setModal({ category: activeCat })}
            className='flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors flex-shrink-0'>
            <span>＋</span><span>添加{activeCat.label}</span>
          </button>
        </div>
        <div className='flex items-center gap-2 mb-3 text-[10px] text-slate-600'>
          <span className={'w-2 h-2 rounded-full ' + activeCat.tagColor.replace('text-', 'bg-').replace('/20', '/40')} />
          <span>共 <span className={'font-semibold ' + activeCat.color}>{filtered.length}</span> 条{activeCat.label}</span>
          {searchMap[activeCategory] && <span className='text-cyan-600'>· 筛选结果</span>}
        </div>
        {filtered.length > 0 ? (
          <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3'>
            {filtered.map(item => (
              <ResourceCard key={item.id} item={item} category={activeCat} onEdit={() => setModal({ category: activeCat, editItem: item })} onDelete={() => handleDelete(item.id)} />
            ))}
          </div>
        ) : (
          <div className='flex flex-col items-center justify-center py-16 text-center'>
            <div className='w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center text-3xl mb-3'>{activeCat.icon}</div>
            <div className='text-sm font-medium text-slate-500 mb-1'>暂无{activeCat.label}</div>
            <div className='text-[11px] text-slate-600 mb-4'>点击右上角按钮添加第一条{activeCat.label}</div>
            <button onClick={() => setModal({ category: activeCat })}
              className='px-4 py-2 rounded-lg text-xs font-medium bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-600/30 transition-colors'>＋ 添加第一条{activeCat.label}</button>
          </div>
        )}
      </div>
      <div className='flex-shrink-0 px-5 py-2.5 border-t border-slate-700/40 bg-slate-900/40'>
        <div className='flex items-center gap-3 overflow-x-auto'>
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className={'flex items-center gap-1 text-[10px] transition-colors whitespace-nowrap ' + (activeCategory === cat.id ? cat.color + ' font-semibold' : 'text-slate-600 hover:text-slate-400')}>
              <span>{cat.icon}</span><span>{cat.label}</span>
              <span className={activeCategory === cat.id ? 'text-cyan-500' : 'text-slate-700'}>{(resources[cat.id] || []).length}</span>
            </button>
          ))}
        </div>
      </div>
      {modal && <ResourceModal category={modal.category} editItem={modal.editItem} onSave={handleSave} onDelete={modal.editItem ? handleDelete : undefined} onClose={() => setModal(null)} />}
    </div>
  );
}

/**
 * 文档解析服务 - 多格式转 Markdown
 * SIMIAICLAW 龙虾集群太极64卦系统
 *
 * 支持格式: PDF, DOCX, PPTX, XLSX, TXT, MD
 * 输出: 标准 Markdown 格式，供 AI 大模型直接调用
 */
import React from 'react';
import { toast } from 'sonner';

// ── 类型定义 ───────────────────────────────────────────────────────────────

export interface ParsedDoc {
  id: string;
  name: string;            // 原始文件名
  size: number;           // 字节
  sizeLabel: string;      // 格式化大小
  mimeType: string;       // MIME 类型
  format: string;         // 格式标签 (PDF/DOCX/PPTX/XLSX/TXT/MD)
  markdown: string;        // 转换后的 Markdown 内容
  charCount: number;      // 字符数
  tokenEstimate: number;   // 估算 Token 数（约 1 token ≈ 4 字符）
  uploadedAt: string;     // ISO 时间戳
  status: 'parsing' | 'done' | 'error';
  error?: string;
}

export interface KnowledgeBase {
  docs: ParsedDoc[];
  combinedMarkdown: string;  // 所有文档合并后的 Markdown
  totalTokens: number;
  totalChars: number;
}

export interface SkillExport {
  name: string;
  description: string;
  instructions: string;   // 完整 Markdown 内容
  category: string;
  tags: string[];
}

// ── 格式判断 ────────────────────────────────────────────────────────────────

export function getFileFormat(name: string, mimeType: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const formatMap: Record<string, string> = {
    pdf: 'PDF',
    doc: 'DOC', docx: 'DOCX',
    ppt: 'PPT', pptx: 'PPTX',
    xls: 'XLS', xlsx: 'XLSX',
    txt: 'TXT',
    md: 'MD', markdown: 'MD',
  };
  return formatMap[ext] || formatMap[mimeType.split('/')[1]] || ext.toUpperCase();
}

export function isSupported(name: string): boolean {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  return ['pdf', 'docx', 'pptx', 'xlsx', 'txt', 'md', 'doc', 'ppt', 'xls'].includes(ext);
}

// ── Markdown 转换核心 ──────────────────────────────────────────────────────

/** 纯文本 / Markdown 文件 → Markdown */
async function parseText(file: File): Promise<string> {
  const text = await file.text();
  return text.trim();
}

/** 通用 XML-based Office 文件解析（PPTX/XLSX） */
async function parseXmlOffice(file: File, type: 'pptx' | 'xlsx'): Promise<string> {
  const JSZip = await loadJSZip();
  const zip = await JSZip.loadAsync(file);
  const results: string[] = [];

  if (type === 'pptx') {
    // 解析幻灯片 XML
    const slideFiles = Object.keys(zip.files).filter(
      f => f.match(/^ppt[\/\\]slides[\/\\]slide\d+\.xml$/)
    ).sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)/)?.[1] || '0');
      const numB = parseInt(b.match(/slide(\d+)/)?.[1] || '0');
      return numA - numB;
    });

    for (const slidePath of slideFiles) {
      const xml = await zip.files[slidePath].async('string');
      const slideNum = slidePath.match(/slide(\d+)/)?.[1] || '?';
      const text = extractTextFromXML(xml);
      if (text.trim()) results.push(`## 幻灯片 ${slideNum}\n\n${text}`);
    }

    // 解析母版标题
    const titles: string[] = [];
    const titleFiles = Object.keys(zip.files).filter(f => f.includes('slideMasters'));
    for (const tf of titleFiles) {
      const xml = await zip.files[tf].async('string');
      const t = extractTextFromXML(xml);
      if (t.trim()) titles.push(t);
    }

    if (results.length) {
      return `# ${file.name}\n\n---\n\n${results.join('\n\n---\n\n')}`;
    }
    return `# ${file.name}\n\n（无法解析幻灯片内容）`;
  } else {
    // 解析 Excel XML
    const sheetFiles = Object.keys(zip.files).filter(
      f => f.match(/^xl[\/\\]worksheets[\/\\]sheet\d+\.xml$/)
    ).sort();

    for (const sheetPath of sheetFiles) {
      const sheetXml = await zip.files[sheetPath].async('string');
      const sharedStrings: string[] = [];

      // 读取共享字符串表
      const ssPath = 'xl/sharedStrings.xml';
      if (zip.files[ssPath]) {
        const ssXml = await zip.files[ssPath].async('string');
        const matches = [...ssXml.matchAll(/<t[^>]*>([^<]*)<\/t>/g)];
        matches.forEach(m => { if (m[1]) sharedStrings.push(m[1]); });
      }

      const rows = extractTableFromXML(sheetXml, sharedStrings);
      if (rows.length) results.push(`### 工作表 ${sheetPath.match(/sheet(\d+)/)?.[1] || '?'}\n\n${rows}`);
    }

    if (results.length) {
      return `# ${file.name}\n\n---\n\n${results.join('\n\n---\n\n')}`;
    }
    return `# ${file.name}\n\n（无法解析表格内容）`;
  }
}

/** DOCX 文件 → Markdown */
async function parseDocx(file: File): Promise<string> {
  const JSZip = await loadJSZip();
  const zip = await JSZip.loadAsync(file);

  // 尝试使用 Mammoth.js
  try {
    const Mammoth = await loadMammoth();
    const result = await Mammoth.convertToMarkdown({ arrayBuffer: await file.arrayBuffer() });
    return result.value || '(文档内容为空)';
  } catch {
    // 回退：XML 解析
    const docXml = await zip.files['word/document.xml']?.async('string');
    if (!docXml) return '(无法解析 DOCX 内容)';
    return extractDocxFromXML(docXml);
  }
}

/** PDF 文件 → Markdown */
async function parsePdf(file: File): Promise<string> {
  const pdfjsLib = await loadPdfJs();
  const data = new Uint8Array(await file.arrayBuffer());

  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const chunks: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => item.str)
      .join(' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
    if (pageText) chunks.push(`## 第 ${i} 页\n\n${pageText}`);
  }

  if (chunks.length) {
    return `# ${file.name}\n\n---\n\n${chunks.join('\n\n---\n\n')}`;
  }
  return `# ${file.name}\n\n（无法提取 PDF 文本内容，请确保 PDF 包含文本层而非纯图片）`;
}

// ── 工具函数 ────────────────────────────────────────────────────────────────

function extractTextFromXML(xml: string): string {
  // 提取所有 <a:t> 标签文本（Office Open XML 标准）
  const matches = [...xml.matchAll(/<a:t[^>]*>([^<]*)<\/a:t>/g)];
  const lines: string[] = [];
  let currentLine: string[] = [];

  // 模拟段落结构：遇到 </a:p> 换行
  const paragraphs = xml.split(/<\/?a:p[^>]*>/g);
  paragraphs.forEach(p => {
    const texts = [...p.matchAll(/<a:t[^>]*>([^<]*)<\/a:t>/g)].map(m => m[1]);
    if (texts.length) lines.push(texts.join(''));
  });

  return lines.filter(l => l.trim()).join('\n\n');
}

function extractTableFromXML(xml: string, sharedStrings: string[]): string {
  const tableRows: string[][] = [];

  // 提取表格行
  const rowMatches = [...xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)];
  for (const rowMatch of rowMatches) {
    const rowXml = rowMatch[1];
    const cells = [...rowXml.matchAll(/<c[^>]*>[\s\S]*?<v>([^<]*)<\/v>[\s\S]*?<\/c>/g)];
    const rowData = cells.map(c => {
      const isShared = c[0].includes('t="s"');
      const val = c[1];
      return isShared && sharedStrings[parseInt(val)] !== undefined
        ? sharedStrings[parseInt(val)]
        : val;
    });
    if (rowData.length) tableRows.push(rowData);
  }

  if (!tableRows.length) return '';

  // 转换为 Markdown 表格
  const header = tableRows[0];
  const separator = header.map(() => '---');
  const body = tableRows.slice(1);

  const lines = [
    `| ${header.join(' | ')} |`,
    `| ${separator.join(' | ')} |`,
    ...body.map(row => `| ${row.join(' | ')} |`),
  ];

  return lines.join('\n');
}

function extractDocxFromXML(xml: string): string {
  const paragraphs = xml.split(/<w:p[ />]/);
  const lines: string[] = [];

  for (const para of paragraphs) {
    const texts = [...para.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map(m => m[1]);
    if (texts.length) {
      const text = texts.join('');
      if (text.trim()) lines.push(text);
    }
  }

  return lines.join('\n\n');
}

// ── 动态加载依赖库 ─────────────────────────────────────────────────────────

let jsZipPromise: Promise<any> | null = null;
let mammothPromise: Promise<any> | null = null;
let pdfJsPromise: Promise<any> | null = null;

async function loadJSZip(): Promise<any> {
  if (jsZipPromise) return jsZipPromise;
  jsZipPromise = import('jszip').then(m => m.default || m);
  return jsZipPromise;
}

async function loadMammoth(): Promise<any> {
  if (mammothPromise) return mammothPromise;
  mammothPromise = import('mammoth').then(m => m.default || m);
  return mammothPromise;
}

async function loadPdfJs(): Promise<any> {
  if (pdfJsPromise) return pdfJsPromise;
  pdfJsPromise = import('pdfjs-dist').then(m => {
    // 设置 worker（CDN 加载）
    const lib = m.default || m;
    if (!lib.getDocument) {
      throw new Error('pdfjs-dist 未正确加载');
    }
    // 禁用 worker（使用主线程解析，避免 CDN worker 加载问题）
    lib.GlobalWorkerOptions.workerSrc = '';
    return lib;
  });
  return pdfJsPromise;
}

// ── 主解析函数 ──────────────────────────────────────────────────────────────

/**
 * 将文件转换为 Markdown
 * @throws 解析失败时抛出错误
 */
export async function parseFileToMarkdown(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const mimeType = file.type;

  switch (ext) {
    case 'txt':
    case 'md':
    case 'markdown':
      return parseText(file);

    case 'docx':
      return parseDocx(file);

    case 'doc':
      // DOC 格式直接返回提示（不支持原生解析）
      return `# ${file.name}\n\n（.doc 格式需要转换为 .docx 后上传，或将内容粘贴到品牌介绍中）`;

    case 'pptx':
    case 'ppt':
      return parseXmlOffice(file, 'pptx');

    case 'xlsx':
    case 'xls':
      return parseXmlOffice(file, 'xlsx');

    case 'pdf':
      return parsePdf(file);

    default:
      return `# ${file.name}\n\n（不支持的格式: ${ext}）`;
  }
}

/**
 * 批量解析文件（带进度回调）
 */
export async function parseFiles(
  files: File[],
  onProgress?: (done: number, total: number, currentFile: string) => void
): Promise<ParsedDoc[]> {
  const results: ParsedDoc[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const id = `${Date.now()}-${i}-${file.name}`;
    const format = getFileFormat(file.name, file.type);
    const sizeLabel = file.size < 1024 * 1024
      ? `${(file.size / 1024).toFixed(1)} KB`
      : `${(file.size / 1024 / 1024).toFixed(1)} MB`;

    const doc: ParsedDoc = {
      id,
      name: file.name,
      size: file.size,
      sizeLabel,
      mimeType: file.type || 'application/octet-stream',
      format,
      markdown: '',
      charCount: 0,
      tokenEstimate: 0,
      uploadedAt: new Date().toISOString(),
      status: 'parsing',
    };

    results.push(doc);
    onProgress?.(i, files.length, file.name);

    try {
      const markdown = await parseFileToMarkdown(file);
      doc.markdown = markdown;
      doc.charCount = markdown.length;
      doc.tokenEstimate = Math.ceil(markdown.length / 4);
      doc.status = 'done';
    } catch (err) {
      doc.status = 'error';
      doc.error = String(err);
      doc.markdown = `【解析错误】\n\n文件: ${file.name}\n错误: ${String(err)}\n\n请尝试将文件另存为 .docx 或 .pdf 后重新上传。`;
    }

    onProgress?.(i + 1, files.length, file.name);
  }

  return results;
}

/**
 * 合并多个文档的 Markdown
 */
export function combineMarkdown(docs: ParsedDoc[]): string {
  const done = docs.filter(d => d.status === 'done');
  if (!done.length) return '';

  return done.map((d, i) =>
    `<!-- 文档 ${i + 1}: ${d.name} -->\n# ${d.name}\n\n${d.markdown}`
  ).join('\n\n---\n\n');
}

/**
 * 生成知识库摘要
 */
export function buildKnowledgeSummary(docs: ParsedDoc[]): {
  totalTokens: number;
  totalChars: number;
  formatBreakdown: Record<string, number>;
} {
  const done = docs.filter(d => d.status === 'done');
  const formatBreakdown: Record<string, number> = {};

  for (const d of done) {
    formatBreakdown[d.format] = (formatBreakdown[d.format] || 0) + 1;
  }

  return {
    totalTokens: done.reduce((s, d) => s + d.tokenEstimate, 0),
    totalChars: done.reduce((s, d) => s + d.charCount, 0),
    formatBreakdown,
  };
}

/**
 * 导出为可复用的 Skill 文件（SKILL.md 格式）
 */
export function exportAsSkill(
  botName: string,
  docs: ParsedDoc[],
  metadata?: { brandDesc?: string; botType?: string; personality?: string }
): SkillExport {
  const combined = combineMarkdown(docs);
  const summary = buildKnowledgeSummary(docs);

  const skillMarkdown = `# Skill: ${botName}

> 由 AI太极系统 机器人工作室生成 | ${new Date().toLocaleString('zh-CN')}
> 文档数: ${docs.filter(d => d.status === 'done').length} | 约 ${summary.totalTokens.toLocaleString()} tokens

## 简介

${metadata?.brandDesc || `${botName} 企业知识库，涵盖产品介绍、操作手册、常见问题等核心内容。`}

## 使用说明

本 Skill 包含 ${botName} 的完整企业知识库，可供 AI 大模型在回答客户咨询时参考使用。

### 适用场景
- 客户产品咨询
- 售后服务支持
- 价格与方案说明
- 技术问题解答

### 使用方式
在对话中引用本 Skill 的相关内容，或让 AI 基于以下知识库内容进行回答。

## 知识库内容

${combined}

---

*本 Skill 由 AI太极系统 自动生成 · ${new Date().toISOString()}*`;

  return {
    name: botName,
    description: `${botName}企业知识库，包含${docs.filter(d => d.status === 'done').length}份文档，约${summary.totalTokens.toLocaleString()} tokens`,
    instructions: skillMarkdown,
    category: 'knowledge-base',
    tags: ['知识库', botName, '企业文档', ...(metadata?.botType === 'sales' ? ['销售'] : ['客服'])],
  };
}

/**
 * 触发浏览器下载文件
 */
export function downloadMarkdown(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.md') ? filename : `${filename}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── React 集成组件 ─────────────────────────────────────────────────────────

interface DocUploadProps {
  docs: ParsedDoc[];
  onChange: (docs: ParsedDoc[]) => void;
  botName?: string;
}

export function DocUploadPanel({ docs, onChange, botName }: DocUploadProps) {
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState({ done: 0, total: 0, current: '' });

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // 过滤不支持的格式
    const supported = files.filter(f => isSupported(f.name));
    const skipped = files.length - supported.length;
    if (skipped > 0) toast.warning(`已跳过 ${skipped} 个不支持格式的文件`);

    setUploading(true);
    setProgress({ done: 0, total: supported.length, current: '' });

    // 先添加占位文档
    const placeholders: ParsedDoc[] = supported.map((f, i) => ({
      id: `${Date.now()}-${i}-${f.name}`,
      name: f.name,
      size: f.size,
      sizeLabel: f.size < 1024 * 1024 ? `${(f.size / 1024).toFixed(1)} KB` : `${(f.size / 1024 / 1024).toFixed(1)} MB`,
      mimeType: f.type || 'application/octet-stream',
      format: getFileFormat(f.name, f.type),
      markdown: '',
      charCount: 0,
      tokenEstimate: 0,
      uploadedAt: new Date().toISOString(),
      status: 'parsing' as const,
    }));

    onChange([...docs, ...placeholders]);

    // 解析文件
    const parsed = await parseFiles(supported, (done, total, currentFile) => {
      setProgress({ done, total, current: currentFile });
    });

    // 更新文档列表
    const newDocs = docs.concat(parsed);
    onChange(newDocs);

    setUploading(false);
    toast.success(`已解析 ${parsed.filter(p => p.status === 'done').length}/${supported.length} 个文档`);

    // 清空 input，允许重复上传同名文件
    if (fileRef.current) fileRef.current.value = '';
  };

  const removeDoc = (id: string) => {
    onChange(docs.filter(d => d.id !== id));
  };

  const downloadDoc = (doc: ParsedDoc) => {
    downloadMarkdown(doc.markdown, doc.name.replace(/\.[^.]+$/, '.md'));
    toast.success(`已下载: ${doc.name.replace(/\.[^.]+$/, '.md')}`);
  };

  const doneCount = docs.filter(d => d.status === 'done').length;
  const totalTokens = docs.reduce((s, d) => s + d.tokenEstimate, 0);

  return (
    <div>
      {/* 顶部状态 */}
      {docs.length > 0 && (
        <div className="flex items-center gap-3 mb-3 px-3 py-2 bg-slate-800/50 rounded-xl border border-slate-700/40">
          <span className="text-xs text-slate-300">
            📚 {doneCount}/{docs.length} 个文档已解析
          </span>
          {totalTokens > 0 && (
            <span className="text-xs text-cyan-400">
              ≈ {totalTokens.toLocaleString()} tokens
            </span>
          )}
          <div className="ml-auto flex gap-2">
            {botName && (
              <button
                onClick={() => {
                  const skill = exportAsSkill(botName, docs);
                  downloadMarkdown(skill.instructions, `${botName}-knowledge-skill.md`);
                  toast.success('✨ Skill 文件已下载！可导入其他机器人使用');
                }}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-violet-600/80 hover:bg-violet-500 text-white transition-colors"
              >
                ✨ 导出为 Skill
              </button>
            )}
            <button
              onClick={() => {
                const combined = combineMarkdown(docs);
                downloadMarkdown(combined, 'knowledge-base.md');
              }}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
            >
              📥 导出 Markdown
            </button>
          </div>
        </div>
      )}

      {/* 上传区 */}
      <input
        ref={fileRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md"
        className="hidden"
        onChange={handleFiles}
      />
      <div
        onClick={() => !uploading && fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
          uploading
            ? 'border-cyan-500/50 bg-cyan-950/20'
            : 'border-slate-600/50 hover:border-cyan-500/50'
        }`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-400">
              正在解析 {progress.current}... ({progress.done}/{progress.total})
            </span>
            {progress.total > 0 && (
              <div className="w-48 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-500 rounded-full transition-all"
                  style={{ width: `${(progress.done / progress.total) * 100}%` }}
                />
              </div>
            )}
            <span className="text-[10px] text-slate-600">
              PDF · DOCX · PPTX · XLSX · TXT · MD → Markdown
            </span>
          </div>
        ) : (
          <>
            <div className="text-2xl mb-1">📤</div>
            <div className="text-xs text-slate-400">点击或拖放上传文档</div>
            <div className="text-[10px] text-slate-600 mt-1">
              PDF · DOC/DOCX · PPT/PPTX · XLS/XLSX · TXT · MD → 自动转 Markdown
            </div>
          </>
        )}
      </div>

      {/* 文档列表 */}
      {docs.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {docs.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between bg-slate-800/50 rounded-xl px-3 py-2.5 border border-slate-700/40">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {/* 格式图标 */}
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                  doc.status === 'done' ? 'bg-emerald-500/20 text-emerald-400' :
                  doc.status === 'error' ? 'bg-red-500/20 text-red-400' :
                  'bg-slate-700 text-slate-400'
                }`}>
                  {doc.format}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-200 truncate max-w-[160px]">{doc.name}</span>
                    <span className="text-[10px] text-slate-500 flex-shrink-0">{doc.sizeLabel}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {doc.status === 'parsing' && (
                      <span className="text-[10px] text-amber-400">⏳ 解析中...</span>
                    )}
                    {doc.status === 'done' && (
                      <>
                        <span className="text-[10px] text-emerald-400">✅ 已解析</span>
                        <span className="text-[10px] text-slate-500">{doc.charCount.toLocaleString()} 字 · ≈{doc.tokenEstimate.toLocaleString()} tokens</span>
                      </>
                    )}
                    {doc.status === 'error' && (
                      <span className="text-[10px] text-red-400">❌ {doc.error?.slice(0, 40)}</span>
                    )}
                  </div>
                </div>
              </div>
              {/* 操作 */}
              <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                {doc.status === 'done' && (
                  <>
                    <button
                      onClick={() => downloadDoc(doc)}
                      title="下载 Markdown"
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-cyan-400 hover:bg-cyan-950/30 transition-colors text-xs"
                    >
                      📥
                    </button>
                    <button
                      onClick={() => {
                        const preview = window.open('', '_blank');
                        if (preview) {
                          preview.document.write(`<html><head><title>${doc.name}</title><style>body{background:#0f172a;color:#e2e8f0;padding:2rem;font-family:system-ui;max-width:800px;margin:0 auto}pre{white-space:pre-wrap;word-break:break-word}</style></head><body><pre>${doc.markdown.replace(/</g, '&lt;')}</pre></body></html>`);
                          preview.document.close();
                        }
                      }}
                      title="预览 Markdown"
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-blue-400 hover:bg-blue-950/30 transition-colors text-xs"
                    >
                      👁
                    </button>
                  </>
                )}
                <button
                  onClick={() => removeDoc(doc.id)}
                  title="移除"
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-colors text-sm"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 知识库总览 */}
      {docs.length > 0 && doneCount > 0 && (
        <div className="mt-3 bg-gradient-to-r from-cyan-950/30 to-blue-950/30 border border-cyan-800/30 rounded-xl px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-cyan-300">🧠 知识库摘要</span>
            <span className="text-[10px] text-slate-500">
              {Object.entries(
                docs.filter(d => d.status === 'done').reduce<Record<string, number>>((acc, d) => {
                  acc[d.format] = (acc[d.format] || 0) + 1;
                  return acc;
                }, {})
              ).map(([fmt, cnt]) => `${fmt}×${cnt}`).join(' · ')}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-base font-bold text-cyan-400">{doneCount}</div>
              <div className="text-[10px] text-slate-400">文档数</div>
            </div>
            <div>
              <div className="text-base font-bold text-cyan-400">{totalTokens.toLocaleString()}</div>
              <div className="text-[10px] text-slate-400">估算 Tokens</div>
            </div>
            <div>
              <div className="text-base font-bold text-cyan-400">
                {docs.reduce((s, d) => s + d.charCount, 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400">总字符</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

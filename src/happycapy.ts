import type { Express } from 'express';
import * as fs from 'fs';
import * as path from 'path';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { fileURLToPath } = require('url');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const __dirname3 = path.dirname(fileURLToPath(__filename));
const DATA_DIR = path.join(__dirname3, '..', 'data', 'skills', 'happycapy-skills');
const SKILLS_INDEX = path.join(DATA_DIR, 'skills-index.json');
const GITHUB_REPO = 'happycapy-ai/Happycapy-skills';
const RAW_BASE = `https://raw.githubusercontent.com/${GITHUB_REPO}/main/skills`;
const API_BASE = `https://api.github.com/repos/${GITHUB_REPO}/contents/skills`;

interface SkillMeta {
  name: string;
  description: string;
  category: string;
  installed: boolean;
}

// ── 技能索引缓存 ──────────────────────────────────────────────
async function fetchSkillIndex(): Promise<SkillMeta[]> {
  try {
    const res = await fetch(API_BASE);
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    const items = await res.json() as { name: string }[];

    const skills: SkillMeta[] = await Promise.all(
      items.map(async (item) => {
        try {
          const r = await fetch(`${RAW_BASE}/${item.name}/SKILL.md`);
          if (!r.ok) return { name: item.name, description: '', category: 'other', installed: false };
          const text = await r.text();
          const descMatch = text.match(/^description:\s*(.+)$/m);
          const cat = detectCategory(item.name);
          return {
            name: item.name,
            description: descMatch ? descMatch[1].replace(/^["']|["']$/g, '').trim() : '',
            category: cat,
            installed: fs.existsSync(path.join(DATA_DIR, item.name, 'SKILL.md')),
          };
        } catch {
          return { name: item.name, description: '', category: 'other', installed: false };
        }
      })
    );
    return skills;
  } catch {
    return [];
  }
}

function detectCategory(name: string): string {
  if (/ai-image|image|ai-video|video|canvas|design|ui|ux|slide|carousel/.test(name)) return 'design-media';
  if (/pdf|doc|resume|writing|pptx|notion|markdown|latex/.test(name)) return 'content-doc';
  if (/github|git|code|script|test|debug|deploy|vercel|cloudflare/.test(name)) return 'dev-tools';
  if (/slack|twitter|instagram|reddit|social|xiaohongshu|telegram|whatsapp/.test(name)) return 'social-comm';
  if (/database|postgres|sql|mysql|mongo|supabase|redis/.test(name)) return 'data';
  if (/auth|login|password|oauth|jwt|security/.test(name)) return 'security';
  if (/pdf|extract|parse|convert|transform|scrape/.test(name)) return 'data';
  if (/skill|agent|team|cortex|capability/.test(name)) return 'meta';
  return 'other';
}

// ── 路由注册 ─────────────────────────────────────────────────
export function registerHappycapyRoutes(app: Express) {
  // 列出所有技能
  app.get('/api/happycapy/skills', async (_req, res) => {
    try {
      const skills = await fetchSkillIndex();
      if (skills.length > 0) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
        fs.writeFileSync(SKILLS_INDEX, JSON.stringify(skills, null, 2));
      }
      res.json({ skills, source: skills.length > 0 ? 'github' : 'cache' });
    } catch (err) {
      res.status(500).json({ error: '获取技能列表失败', detail: String(err) });
    }
  });

  // 获取单个技能内容
  app.get('/api/happycapy/skills/:name', async (req, res) => {
    const { name } = req.params;
    const safeName = name.replace(/[^a-z0-9-]/gi, '');
    try {
      const r = await fetch(`${RAW_BASE}/${safeName}/SKILL.md`);
      if (!r.ok) return res.status(404).json({ error: '技能不存在' });
      const content = await r.text();
      res.json({ name: safeName, content });
    } catch (err) {
      res.status(500).json({ error: '获取技能内容失败', detail: String(err) });
    }
  });

  // 安装技能到本地
  app.post('/api/happycapy/skills/:name/install', async (req, res) => {
    const { name } = req.params;
    const safeName = name.replace(/[^a-z0-9-]/gi, '');
    const destDir = path.join(DATA_DIR, safeName);
    try {
      fs.mkdirSync(destDir, { recursive: true });
      const r = await fetch(`${RAW_BASE}/${safeName}/SKILL.md`);
      if (!r.ok) return res.status(404).json({ error: '技能不存在' });
      const content = await r.text();
      fs.writeFileSync(path.join(destDir, 'SKILL.md'), content);

      // 可选：拉取 references/、scripts/、assets/
      const metaRes = await fetch(`${API_BASE}/${safeName}`);
      if (metaRes.ok) {
        const files = await metaRes.json() as { name: string; type: string; download_url: string | null }[];
        for (const file of files) {
          if (file.type === 'file' && file.download_url && !['SKILL.md', 'README.md'].includes(file.name)) {
            try {
              const fr = await fetch(file.download_url);
              if (fr.ok) {
                const dir = file.name.startsWith('references') ? 'references'
                  : file.name.startsWith('scripts') ? 'scripts'
                  : file.name.startsWith('assets') ? 'assets' : 'extras';
                const subDir = path.join(destDir, dir);
                fs.mkdirSync(subDir, { recursive: true });
                const buf = Buffer.from(await fr.arrayBuffer());
                fs.writeFileSync(path.join(subDir, file.name), buf);
              }
            } catch { /* skip individual file errors */ }
          }
        }
      }

      // 更新索引中的 installed 状态
      if (fs.existsSync(SKILLS_INDEX)) {
        const idx: SkillMeta[] = JSON.parse(fs.readFileSync(SKILLS_INDEX, 'utf-8'));
        const entry = idx.find(s => s.name === safeName);
        if (entry) entry.installed = true;
        fs.writeFileSync(SKILLS_INDEX, JSON.stringify(idx, null, 2));
      }

      res.json({ success: true, path: destDir });
    } catch (err) {
      res.status(500).json({ error: '安装技能失败', detail: String(err) });
    }
  });

  // 卸载技能
  app.delete('/api/happycapy/skills/:name/install', (req, res) => {
    const { name } = req.params;
    const safeName = name.replace(/[^a-z0-9-]/gi, '');
    const destDir = path.join(DATA_DIR, safeName);
    try {
      if (fs.existsSync(destDir)) {
        fs.rmSync(destDir, { recursive: true });
      }
      if (fs.existsSync(SKILLS_INDEX)) {
        const idx: SkillMeta[] = JSON.parse(fs.readFileSync(SKILLS_INDEX, 'utf-8'));
        const entry = idx.find(s => s.name === safeName);
        if (entry) entry.installed = false;
        fs.writeFileSync(SKILLS_INDEX, JSON.stringify(idx, null, 2));
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: '卸载技能失败', detail: String(err) });
    }
  });

  // 获取已安装的技能
  app.get('/api/happycapy/skills-installed', (_req, res) => {
    try {
      if (!fs.existsSync(DATA_DIR)) return res.json({ skills: [] });
      const dirs = fs.readdirSync(DATA_DIR).filter(
        d => d !== 'skills-index.json' && fs.statSync(path.join(DATA_DIR, d)).isDirectory()
      );
      const skills = dirs.map(d => {
        const meta = path.join(DATA_DIR, d, 'SKILL.md');
        let description = '';
        let category = 'other';
        if (fs.existsSync(meta)) {
          const text = fs.readFileSync(meta, 'utf-8');
          const descMatch = text.match(/^description:\s*(.+)$/m);
          if (descMatch) description = descMatch[1].replace(/^["']|["']$/g, '').trim();
          category = detectCategory(d);
        }
        return { name: d, description, category, installed: true };
      });
      res.json({ skills });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  console.log(`[Happycapy] Happycapy Skills 路由已注册: /api/happycapy/*`);
}
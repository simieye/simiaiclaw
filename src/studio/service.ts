/**
 * SIMIAICLAW 龙虾集群太极64卦系统
 * AI 短剧工作室 - 服务层
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import type {
  Character, Shot, Script,
  GenerateScriptRequest
} from './types';
import { geminiClient } from '../gemini';

// ── 数据持久化 ──────────────────────────────────────────────
const DATA_DIR = path.join(process.cwd(), 'data', 'studio');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const SCRIPTS_FILE = path.join(DATA_DIR, 'scripts.json');
const CHARACTERS_FILE = path.join(DATA_DIR, 'characters.json');
const SHOTS_FILE = path.join(DATA_DIR, 'shots.json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJson<T>(file: string, fallback: T): T {
  ensureDir();
  if (!fs.existsSync(file)) return fallback;
  try { return JSON.parse(fs.readFileSync(file, 'utf-8')); }
  catch { return fallback; }
}

function writeJson(file: string, data: unknown) {
  ensureDir();
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

function genId() { return crypto.randomUUID(); }
function now() { return new Date().toISOString(); }

// ── 角色管理 ─────────────────────────────────────────────────
export function listCharacters(): Character[] {
  return readJson<Character[]>(CHARACTERS_FILE, []);
}

export function getCharacter(id: string): Character | null {
  return listCharacters().find(c => c.id === id) ?? null;
}

export function createCharacter(data: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>): Character {
  const characters = listCharacters();
  const character: Character = { ...data, id: genId(), createdAt: now(), updatedAt: now() };
  characters.push(character);
  writeJson(CHARACTERS_FILE, characters);
  return character;
}

export function updateCharacter(id: string, patch: Partial<Character>): Character | null {
  const characters = listCharacters();
  const idx = characters.findIndex(c => c.id === id);
  if (idx === -1) return null;
  characters[idx] = { ...characters[idx], ...patch, updatedAt: now() };
  writeJson(CHARACTERS_FILE, characters);
  return characters[idx];
}

export function deleteCharacter(id: string): boolean {
  const characters = listCharacters().filter(c => c.id !== id);
  if (characters.length === listCharacters().length) return false;
  writeJson(CHARACTERS_FILE, characters);
  return true;
}

// ── 脚本生成（AI 驱动）─────────────────────────────────────────
export function listScripts(): Script[] {
  return readJson<Script[]>(SCRIPTS_FILE, []);
}

export function getScript(id: string): Script | null {
  return listScripts().find(s => s.id === id) ?? null;
}

export async function generateScript(req: GenerateScriptRequest): Promise<Script> {
  const { genre, template, title, synopsis, characterCount = 3, shotCount = 12 } = req;

  // AI 生成角色设定
  const charactersPrompt = `你是短剧编剧。根据以下信息生成 ${characterCount} 个角色设定。

类型: ${genre}
模板: ${template}
故事: ${synopsis || '自由发挥'}

请为每个角色输出：name, age, gender, personality, appearance, role, avatarPrompt（用英文，Stable Diffusion 风格，描述外貌特征和服装）

以 JSON 数组格式返回，不要有其他文字。`;

  const charactersRaw = await geminiClient.generateText(charactersPrompt, {
    temperature: 0.7,
    maxTokens: 2000,
  });

  let characters: Partial<Character>[] = [];
  try {
    const jsonMatch = (charactersRaw.text || '').match(/\[[\s\S]*?\]/);
    if (jsonMatch) characters = JSON.parse(jsonMatch[0]);
  } catch {
    // 解析失败则使用默认角色
    characters = [
      { name: '主角', gender: '男', role: '主角', personality: '勇敢正义', appearance: '高大英俊', avatarPrompt: 'young handsome man, dramatic lighting, cinematic, 8k' },
      { name: '女主', gender: '女', role: '主角', personality: '聪明善良', appearance: '美丽大方', avatarPrompt: 'beautiful young woman, elegant, dramatic lighting, cinematic, 8k' },
      { name: '反派', gender: '男', role: '反派', personality: '阴险狡诈', appearance: '冷酷', avatarPrompt: 'evil villain man, dark atmosphere, cinematic, 8k' },
    ];
  }

  const fullCharacters: Character[] = characters.map((c, i) => ({
    id: genId(),
    name: c.name || `角色${i + 1}`,
    gender: c.gender || '中性',
    personality: c.personality || '',
    appearance: c.appearance || '',
    role: (c.role as Character['role']) || '配角',
    avatarPrompt: c.avatarPrompt || `${c.appearance || ''} ${c.name || ''}`,
    negativePrompt: 'ugly, deformed, bad anatomy, blurry, watermark, text',
    createdAt: now(),
    updatedAt: now(),
  }));

  // AI 生成镜头脚本
  const shotsPrompt = `你是短剧分镜编剧。为"${title}"生成 ${shotCount} 个分镜镜头列表。

类型: ${genre}
模板: ${template}
故事概要: ${synopsis || '自由发挥'}
角色: ${fullCharacters.map(c => `${c.name}(${c.role})`).join('、')}

每个镜头输出：seq, scene, camera, angle, duration(默认3秒), action, dialogue(可选), visualPrompt（英文，AI视频生成提示词）, negativePrompt

以 JSON 数组格式返回。`;

  const shotsRaw = await geminiClient.generateText(shotsPrompt, {
    temperature: 0.7,
    maxTokens: 3000,
  });

  let shotDefs: Partial<Shot>[] = [];
  try {
    const jsonMatch = (shotsRaw.text || '').match(/\[[\s\S]*?\]/);
    if (jsonMatch) shotDefs = JSON.parse(jsonMatch[0]);
  } catch {
    // 生成默认镜头
    shotDefs = Array.from({ length: shotCount }, (_, i) => ({
      seq: i + 1,
      scene: `场景${i + 1}`,
      camera: '中景' as const,
      angle: '平视' as const,
      duration: 3,
      action: '角色行动',
      dialogue: '',
      visualPrompt: `cinematic scene ${i + 1}, dramatic lighting, 8k`,
      negativePrompt: 'ugly, deformed, bad anatomy, blurry',
    }));
  }

  const shots: Shot[] = shotDefs.map((s, i) => ({
    id: genId(),
    scriptId: '', // 稍后填充
    seq: s.seq ?? i + 1,
    scene: s.scene || `场景${i + 1}`,
    camera: (s.camera as Shot['camera']) || '中景',
    angle: (s.angle as Shot['angle']) || '平视',
    duration: s.duration ?? 3,
    characterIds: fullCharacters.slice(0, 2).map(c => c.id),
    action: s.action || '',
    dialogue: s.dialogue || '',
    visualPrompt: s.visualPrompt || 'cinematic scene',
    negativePrompt: s.negativePrompt || 'ugly, deformed, blurry',
    videoStatus: 'idle',
    createdAt: now(),
    updatedAt: now(),
  }));

  const script: Script = {
    id: genId(),
    title,
    genre,
    template,
    totalShots: shots.length,
    synopsis: synopsis || '',
    tags: [genre, template],
    characters: fullCharacters,
    shots: shots.map(s => ({ ...s, scriptId: '' })),
    status: 'scripting',
    createdAt: now(),
    updatedAt: now(),
  };

  // 填充 scriptId
  script.shots = script.shots.map(s => ({ ...s, scriptId: script.id }));

  const scripts = listScripts();
  scripts.push(script);
  writeJson(SCRIPTS_FILE, scripts);

  return script;
}

export function updateScript(id: string, patch: Partial<Script>): Script | null {
  const scripts = listScripts();
  const idx = scripts.findIndex(s => s.id === id);
  if (idx === -1) return null;
  scripts[idx] = { ...scripts[idx], ...patch, updatedAt: now() };
  writeJson(SCRIPTS_FILE, scripts);
  return scripts[idx];
}

export function updateShot(shotId: string, patch: Partial<Shot>): Shot | null {
  const shots: Shot[] = readJson(SHOTS_FILE, []);
  const idx = shots.findIndex(s => s.id === shotId);
  if (idx === -1) {
    // 从 scripts 中更新
    const scripts = listScripts();
    for (const script of scripts) {
      const si = script.shots.findIndex(s => s.id === shotId);
      if (si !== -1) {
        script.shots[si] = { ...script.shots[si], ...patch, updatedAt: now() };
        writeJson(SCRIPTS_FILE, scripts);
        return script.shots[si];
      }
    }
    return null;
  }
  shots[idx] = { ...shots[idx], ...patch, updatedAt: now() };
  writeJson(SHOTS_FILE, shots);
  return shots[idx];
}

export function listShots(scriptId: string): Shot[] {
  const script = getScript(scriptId);
  return script?.shots || [];
}

// ── 模板脚本（无需 AI，快速生成）────────────────────────────────
const TEMPLATE_SCRIPTS: Record<string, {
  synopsis: string;
  shotDefs: Array<{ scene: string; camera: Shot['camera']; angle: Shot['angle']; action: string; dialogue?: string }>;
}> = {
  '爽文逆袭': {
    synopsis: '平凡少年被陷害后意外觉醒，一路逆袭打脸，最终站上巅峰。',
    shotDefs: [
      { scene: '破旧出租屋', camera: '近景', angle: '平视', action: '主角颓废地坐在床边', dialogue: '三年了，我受够了这一切...' },
      { scene: '豪华办公室', camera: '远景', angle: '俯拍', action: '反派傲慢地站在落地窗前', dialogue: '你永远不可能超过我。' },
      { scene: '颁奖典礼', camera: '中景', angle: '仰拍', action: '主角接过奖杯，全场掌声雷动', dialogue: '谢谢大家，这只是开始。' },
    ],
  },
  '霸总甜宠': {
    synopsis: '高冷总裁与倔强女孩意外同居，日久生情，上演甜蜜宠溺。',
    shotDefs: [
      { scene: '清晨卧室', camera: '近景', angle: '平视', action: '女主发现身边多了个人，惊坐起来', dialogue: '你、你怎么会在这里！' },
      { scene: '总裁办公室', camera: '远景', angle: '仰拍', action: '男主西装笔挺，冷漠地批阅文件', dialogue: '合同期限一年，违约金你赔不起。' },
      { scene: '雨中街道', camera: '中景', angle: '平视', action: '男主撑着伞走向女主，脱下外套披在她身上', dialogue: '傻瓜，淋感冒了谁做饭？' },
    ],
  },
  '复仇打脸': {
    synopsis: '女主被闺蜜陷害家破人亡，重生归来步步为营，让仇人付出代价。',
    shotDefs: [
      { scene: '豪华宴会厅', camera: '远景', angle: '俯拍', action: '女主身着华丽礼服，优雅地走向人群', dialogue: '好久不见，各位。' },
      { scene: '破旧公寓', camera: '近景', angle: '俯拍', action: '曾经的闺蜜跪在地上，泪流满面', dialogue: '对不起，求你放过我...' },
      { scene: '高楼天台', camera: '中景', angle: '平视', action: '女主俯视城市夜景，露出冷笑', dialogue: '这只是开始。' },
    ],
  },
};

export function generateTemplateScript(
  template: Script['template'],
  title: string,
  genre: Script['genre'],
  extraShots = 5
): Script {
  const tpl = TEMPLATE_SCRIPTS[template] || TEMPLATE_SCRIPTS['爽文逆袭'];
  const scriptId = genId();

  const shots: Shot[] = tpl.shotDefs.map((s, i) => ({
    id: genId(),
    scriptId,
    seq: i + 1,
    scene: s.scene,
    camera: s.camera,
    angle: s.angle,
    duration: 3,
    characterIds: [],
    action: s.action,
    dialogue: s.dialogue || '',
    visualPrompt: `${s.scene}, ${s.camera} shot, ${s.angle} angle, cinematic, dramatic lighting, 8k`,
    negativePrompt: 'ugly, deformed, bad anatomy, blurry, watermark',
    videoStatus: 'idle',
    createdAt: now(),
    updatedAt: now(),
  }));

  const extra: Shot[] = Array.from({ length: extraShots }, (_, i) => ({
    id: genId(),
    scriptId,
    seq: shots.length + i + 1,
    scene: `过渡场景${i + 1}`,
    camera: '中景',
    angle: '平视',
    duration: 3,
    characterIds: [],
    action: '场景过渡',
    dialogue: '',
    visualPrompt: `transition scene, cinematic, ${tpl.synopsis.slice(0, 20)}, 8k`,
    negativePrompt: 'ugly, deformed, bad anatomy, blurry',
    videoStatus: 'idle',
    createdAt: now(),
    updatedAt: now(),
  }));

  const script: Script = {
    id: scriptId,
    title,
    genre,
    template,
    totalShots: shots.length + extra.length,
    synopsis: tpl.synopsis,
    tags: [genre, template],
    characters: [],
    shots: [...shots, ...extra],
    status: 'draft',
    createdAt: now(),
    updatedAt: now(),
  };

  const scripts = listScripts();
  scripts.push(script);
  writeJson(SCRIPTS_FILE, scripts);

  return script;
}

/**
 * SIMIAICLAW 龙虾集群太极64卦系统
 * AI 短剧工作室 - 类型定义
 */

export type DramaGenre =
  | '霸总' | '甜宠' | '重生' | '逆袭' | '穿越' | '悬疑'
  | '复仇' | '职场' | '校园' | '玄幻' | '搞笑' | '科幻';

export type ScriptTemplateType =
  | '爽文逆袭' | '霸总甜宠' | '复仇打脸' | '职场升职'
  | '穿越逆天' | '重生复仇' | '悬疑反转' | '搞笑段子';

export type VideoPlatform = '可灵' | '即梦' | 'Pika' | 'Seedance' | '即梦-图生视频' | '可灵-图生视频';

export interface Character {
  id: string;
  name: string;
  age?: string;
  gender?: '男' | '女' | '中性';
  personality?: string;
  appearance?: string;
  role: '主角' | '配角' | '反派' | 'NPC';
  avatarPrompt?: string; // AI 生图用的正向提示词
  negativePrompt?: string;
  voiceId?: string;
  imageUrl?: string; // 角色定妆照 URL
  createdAt: string;
  updatedAt: string;
}

export interface Shot {
  id: string;
  scriptId: string;
  seq: number; // 镜头序号
  scene: string; // 场景描述
  camera: '特写' | '近景' | '中景' | '远景' | '航拍' | '手持跟拍' | '固定';
  angle: '平视' | '仰拍' | '俯拍' | '过肩' | '荷兰角';
  duration?: number; // 秒数
  characterIds: string[];
  action: string; // 角色动作
  dialogue?: string; // 对话/独白
  visualPrompt: string; // AI 视频生成正向提示词
  negativePrompt?: string;
  imageUrl?: string; // 生成的剧照 URL
  videoUrl?: string; // 生成的视频 URL
  videoStatus: 'idle' | 'generating' | 'done' | 'failed';
  videoError?: string;
  model?: VideoPlatform;
  createdAt: string;
  updatedAt: string;
}

export interface Script {
  id: string;
  title: string;
  genre: DramaGenre;
  template: ScriptTemplateType;
  totalShots: number;
  targetDuration?: number; // 目标时长（秒）
  synopsis?: string; // 故事梗概
  tags: string[];
  characters: Character[];
  shots: Shot[];
  status: 'draft' | 'scripting' | 'shooting' | 'done';
  createdAt: string;
  updatedAt: string;
}

export interface StudioProject {
  id: string;
  name: string;
  genre: DramaGenre;
  template: ScriptTemplateType;
  scripts: Script[];
  currentScriptId?: string;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}

// API 请求/响应类型
export interface GenerateScriptRequest {
  genre: DramaGenre;
  template: ScriptTemplateType;
  title: string;
  synopsis?: string;
  characterCount?: number; // 角色数量，默认 3
  shotCount?: number; // 镜头数量，默认 12
  language?: '中文' | '英文' | '双语字幕';
}

export interface GenerateShotsRequest {
  scriptId: string;
  model?: VideoPlatform;
  count?: number; // 批量生成数量
}

export interface GenerateVideoRequest {
  shotId: string;
  model: VideoPlatform;
}

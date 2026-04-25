/**
 * SIMIAICLAW 龙虾集群太极64卦系统
 * AI 短剧工作室 - Express 路由
 */

import type { Application } from 'express';
import { requireAuth } from '../auth';
import {
  listCharacters, getCharacter, createCharacter, updateCharacter, deleteCharacter,
  listScripts, getScript, generateScript, updateScript, updateShot, listShots,
  generateTemplateScript,
} from './service';
import type { Character, GenerateScriptRequest, Shot } from './types';

export function registerStudioRoutes(app: Application) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const auth = requireAuth as any;

  const BASE = '/api/v1/studio/drama';

  // ── 角色管理 ─────────────────────────────────────────────────
  app.get(`${BASE}/characters`, auth, (_req, res) => {
    res.json({ characters: listCharacters() });
  });

  app.get(`${BASE}/characters/:id`, auth, (req, res) => {
    const character = getCharacter(req.params.id);
    if (!character) return res.status(404).json({ error: '角色不存在' });
    res.json(character);
  });

  app.post(`${BASE}/characters`, auth, (req, res) => {
    const data = req.body as Omit<Character, 'id' | 'createdAt' | 'updatedAt'>;
    if (!data.name) return res.status(400).json({ error: '角色名称不能为空' });
    const character = createCharacter(data);
    res.status(201).json(character);
  });

  app.patch(`${BASE}/characters/:id`, auth, (req, res) => {
    const character = updateCharacter(req.params.id, req.body);
    if (!character) return res.status(404).json({ error: '角色不存在' });
    res.json(character);
  });

  app.delete(`${BASE}/characters/:id`, auth, (req, res) => {
    const ok = deleteCharacter(req.params.id);
    if (!ok) return res.status(404).json({ error: '角色不存在' });
    res.json({ success: true });
  });

  // ── 脚本管理 ─────────────────────────────────────────────────
  app.get(`${BASE}/scripts`, auth, (_req, res) => {
    res.json({ scripts: listScripts() });
  });

  app.get(`${BASE}/scripts/:id`, auth, (req, res) => {
    const script = getScript(req.params.id);
    if (!script) return res.status(404).json({ error: '剧本不存在' });
    res.json(script);
  });

  // AI 生成完整剧本（角色 + 镜头）
  app.post(`${BASE}/scripts/generate`, auth, async (req, res) => {
    try {
      const reqBody = req.body as GenerateScriptRequest;
      if (!reqBody.genre || !reqBody.template || !reqBody.title) {
        return res.status(400).json({ error: '缺少必填字段: genre, template, title' });
      }
      const script = await generateScript(reqBody);
      res.status(201).json(script);
    } catch (e) {
      console.error('[Studio] generateScript error:', e);
      res.status(500).json({ error: '生成剧本失败', detail: String(e) });
    }
  });

  // 模板快速生成剧本（无需 AI）
  app.post(`${BASE}/scripts/template`, auth, (req, res) => {
    const { template, title, genre, extraShots = 5 } = req.body;
    if (!template || !title || !genre) {
      return res.status(400).json({ error: '缺少必填字段: template, title, genre' });
    }
    const script = generateTemplateScript(template, title, genre, extraShots);
    res.status(201).json(script);
  });

  app.patch(`${BASE}/scripts/:id`, auth, (req, res) => {
    const script = updateScript(req.params.id, req.body);
    if (!script) return res.status(404).json({ error: '剧本不存在' });
    res.json(script);
  });

  // ── 镜头管理 ─────────────────────────────────────────────────
  app.get(`${BASE}/shots/:scriptId`, auth, (req, res) => {
    res.json({ shots: listShots(req.params.scriptId) });
  });

  app.patch(`${BASE}/shots/:shotId`, auth, (req, res) => {
    const shot = updateShot(req.params.shotId, req.body);
    if (!shot) return res.status(404).json({ error: '镜头不存在' });
    res.json(shot);
  });

  // 批量更新镜头
  app.patch(`${BASE}/shots/:shotId/batch`, auth, (req, res) => {
    const { updates } = req.body as { updates: Partial<Shot>[] };
    if (!Array.isArray(updates)) return res.status(400).json({ error: 'updates 必须是数组' });
    const results = updates.map(u => updateShot(req.params.shotId, u));
    res.json({ results });
  });

  // ── 剧目 / 项目 ───────────────────────────────────────────────
  app.get(`${BASE}/projects`, auth, (_req, res) => {
    res.json({ scripts: listScripts() });
  });

  console.log('✅ AI 短剧工作室路由已注册 (v1/drama/*)');
}

/**
 * SIMIAICLAW 龙虾集群太极64卦系统
 * 小加营销智能体 (xiaojia-Marketing-Delivery) API 路由
 * 代理 JustAI OpenAPI: https://justailab.com
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data', 'xiaojia');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

const JUSTAI_BASE = 'https://justailab.com';

interface XiaojiaConfig {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  user?: { email: string; nickname?: string };
}

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadConfig(): XiaojiaConfig {
  ensureDir();
  if (!fs.existsSync(CONFIG_FILE)) return {};
  try { return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8')); }
  catch { return {}; }
}

function saveConfig(cfg: XiaojiaConfig) {
  ensureDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf-8');
}

async function justaiFetch(path: string, payload: Record<string, unknown>, apiKey?: string): Promise<unknown> {
  const baseUrl = loadConfig().baseUrl || JUSTAI_BASE;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

  const resp = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload, (k, v) => {
      if (Array.isArray(v) && k === 'project_id' || k === 'skill_id') return v.filter(Boolean);
      return v;
    }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`JustAI API ${resp.status}: ${body}`);
  }
  return resp.json();
}

// ── Express 路由 ────────────────────────────────────────────
export function registerXiaojiaRoutes(app: import('express').Express) {

  // 登录状态
  app.get('/api/xiaojia/login-status', (_req, res) => {
    const cfg = loadConfig();
    res.json({
      logged_in: !!cfg.apiKey,
      user: cfg.user,
      api_key_configured: !!cfg.apiKey,
    });
  });

  // 启动登录（返回扫码 URL）
  app.post('/api/xiaojia/login/start', async (_req, res) => {
    try {
      const result = await justaiFetch('/openapi/auth/login/start', {});
      res.json(result);
    } catch (e) {
      res.status(500).json({ status: 'error', message: String(e) });
    }
  });

  // 查询登录结果
  app.get('/api/xiaojia/login/result', async (req, res) => {
    const { login_token } = req.query;
    if (!login_token || typeof login_token !== 'string') {
      return res.status(400).json({ status: 'error', message: '缺少 login_token' });
    }
    try {
      const result = await justaiFetch('/openapi/auth/login/result', { login_token }) as Record<string, unknown>;
      // 登录成功 → 保存 API Key
      if (result['status'] === 'success' && result['api_key']) {
        const cfg = loadConfig();
        cfg.apiKey = result['api_key'] as string;
        cfg.baseUrl = JUSTAI_BASE;
        cfg.timeout = 300;
        cfg.user = { email: (result['email'] as string) || 'justai_user' };
        saveConfig(cfg);
      }
      res.json(result);
    } catch (e) {
      res.status(500).json({ status: 'error', message: String(e) });
    }
  });

  // 登出（清除配置）
  app.post('/api/xiaojia/logout', (_req, res) => {
    const cfg = loadConfig();
    cfg.apiKey = undefined;
    cfg.user = undefined;
    saveConfig(cfg);
    res.json({ success: true });
  });

  // 提交营销任务
  app.post('/api/xiaojia/chat/submit', async (req, res) => {
    const cfg = loadConfig();
    if (!cfg.apiKey) {
      return res.status(401).json({ status: 'error', message: '请先完成小加登录' });
    }

    const { message, conversation_id, project_id, skill_id, form_id, form_data } = req.body as {
      message?: string;
      conversation_id?: string;
      project_id?: string | string[];
      skill_id?: string | string[];
      form_id?: string;
      form_data?: Record<string, unknown>;
    };

    if (!message && !form_id) {
      return res.status(400).json({ status: 'error', message: '--message 和 --form-id 至少提供一个' });
    }

    try {
      const payload: Record<string, unknown> = {};
      if (message) payload['message'] = message;
      if (conversation_id) payload['conversation_id'] = conversation_id;
      if (project_id) payload['project_id'] = Array.isArray(project_id) ? project_id : [project_id];
      if (skill_id) payload['skill_id'] = Array.isArray(skill_id) ? skill_id : [skill_id];
      if (form_id) payload['form_id'] = form_id;
      if (form_data) payload['form_data'] = form_data;

      const result = await justaiFetch('/openapi/agent/chat_submit', payload, cfg.apiKey);
      res.json(result);
    } catch (e) {
      res.status(500).json({ status: 'error', message: String(e) });
    }
  });

  // 查询任务结果（轮询）
  app.get('/api/xiaojia/chat/result', async (req, res) => {
    const cfg = loadConfig();
    if (!cfg.apiKey) {
      return res.status(401).json({ status: 'error', message: '请先完成小加登录' });
    }

    const { conversation_id } = req.query;
    if (!conversation_id || typeof conversation_id !== 'string') {
      return res.status(400).json({ status: 'error', message: '缺少 conversation_id' });
    }

    try {
      const result = await justaiFetch('/openapi/agent/chat_result', { conversation_id }, cfg.apiKey);
      res.json(result);
    } catch (e) {
      res.status(500).json({ status: 'error', message: String(e) });
    }
  });

  // 获取可选资料库列表
  app.get('/api/xiaojia/projects', async (_req, res) => {
    const cfg = loadConfig();
    if (!cfg.apiKey) {
      return res.status(401).json({ error: '请先完成小加登录' });
    }
    try {
      const result = await justaiFetch('/openapi/project/list', {}, cfg.apiKey) as { data?: { items?: Array<{ id: string; name: string }> } };
      res.json(result);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  console.log('[Xiaojia] 小加营销智能体路由已注册: /api/xiaojia/*');
}

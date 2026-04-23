/**
 * SIMIAICLAW 龙虾集群太极64卦系统
 * 多租户认证模块
 *
 * 功能：
 * - 多租户隔离（每个租户有独立数据空间）
 * - JWT 无状态认证
 * - PBKDF2 密码哈希（Node.js 内置，无需额外依赖）
 * - 角色权限控制（owner / admin / member / viewer）
 * - Session 管理
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

// ==================== 常量 ====================
const DATA_DIR = path.join(__dirname, '..', '..', 'data', 'auth');
const TENANTS_FILE = path.join(DATA_DIR, 'tenants.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

const SALT_LEN = 32;
const KEY_LEN = 64;
const ITERATIONS = 100_000;
const ACCESS_TOKEN_TTL = '24h';
const REFRESH_TOKEN_TTL = '7d';
const JWT_SECRET = process.env.JWT_SECRET || process.env.EXPRESS_SESSION_SECRET || 'simiaiclaw-dev-secret-change-in-prod';

// ==================== 类型定义 ====================

export type UserRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface Tenant {
  id: string;
  name: string;                  // 企业/团队名称
  slug: string;                  // URL 友好标识
  plan: 'free' | 'pro' | 'enterprise';
  ownerId: string;
  members: TenantMember[];
  createdAt: string;
  updatedAt: string;
  // 租户级配置
  config: TenantConfig;
  // 配额
  quotas: TenantQuotas;
}

export interface TenantMember {
  userId: string;
  role: UserRole;
  joinedAt: string;
  nickname?: string;
}

export interface TenantConfig {
  maxAgents: number;             // 最大智能体数
  maxUsers: number;              // 最大成员数
  llmProvider: 'anthropic' | 'openai' | 'both';
  customBranding: boolean;
  ssoEnabled: boolean;
}

export interface TenantQuotas {
  tasksPerDay: number;
  storageMB: number;
  apiCallsPerMonth: number;
  used: {
    tasksToday: number;
    storageUsedMB: number;
    apiCallsThisMonth: number;
  };
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  displayName: string;
  avatar?: string;
  tenantIds: string[];           // 用户所属的租户列表
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  isActive: boolean;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  defaultLane?: string;
  notifications: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JWTPayload {
  userId: string;
  tenantId: string;
  role: UserRole;
  type: 'access' | 'refresh';
  jti: string;                   // JWT ID，用于刷新 token
}

export interface LoginResult {
  success: boolean;
  user?: PublicUser;
  tokens?: AuthTokens;
  tenant?: Tenant;
  error?: string;
}

export interface PublicUser {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  tenantIds: string[];
  preferences: UserPreferences;
}

// ==================== 工具函数 ====================

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadTenants(): Tenant[] {
  ensureDataDir();
  if (!fs.existsSync(TENANTS_FILE)) {
    fs.writeFileSync(TENANTS_FILE, JSON.stringify([]));
    return [];
  }
  return JSON.parse(fs.readFileSync(TENANTS_FILE, 'utf8'));
}

function saveTenants(tenants: Tenant[]) {
  ensureDataDir();
  fs.writeFileSync(TENANTS_FILE, JSON.stringify(tenants, null, 2));
}

function loadUsers(): User[] {
  ensureDataDir();
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([]));
    return [];
  }
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
}

function saveUsers(users: User[]) {
  ensureDataDir();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LEN, 'sha512').toString('hex');
}

function verifyPassword(password: string, hash: string, salt: string): boolean {
  return hashPassword(password, salt) === hash;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) + '-' + uuidv4().slice(0, 6);
}

function planQuotas(plan: Tenant['plan']): TenantQuotas {
  const configs: Record<Tenant['plan'], TenantQuotas> = {
    free: { tasksPerDay: 20, storageMB: 100, apiCallsPerMonth: 1000, used: { tasksToday: 0, storageUsedMB: 0, apiCallsThisMonth: 0 } },
    pro: { tasksPerDay: 500, storageMB: 5000, apiCallsPerMonth: 50000, used: { tasksToday: 0, storageUsedMB: 0, apiCallsThisMonth: 0 } },
    enterprise: { tasksPerDay: 999999, storageMB: 999999, apiCallsPerMonth: 999999, used: { tasksToday: 0, storageUsedMB: 0, apiCallsThisMonth: 0 } },
  };
  return configs[plan];
}

function planConfig(plan: Tenant['plan']): TenantConfig {
  const configs: Record<Tenant['plan'], TenantConfig> = {
    free: { maxAgents: 8, maxUsers: 2, llmProvider: 'anthropic', customBranding: false, ssoEnabled: false },
    pro: { maxAgents: 64, maxUsers: 20, llmProvider: 'both', customBranding: true, ssoEnabled: false },
    enterprise: { maxAgents: 999999, maxUsers: 999999, llmProvider: 'both', customBranding: true, ssoEnabled: true },
  };
  return configs[plan];
}

// ==================== AuthService ====================

export class AuthService {
  private tenants: Tenant[] = [];
  private users: User[] = [];

  constructor() {
    this.tenants = loadTenants();
    this.users = loadUsers();
  }

  private persist() {
    saveTenants(this.tenants);
    saveUsers(this.users);
  }

  /** 注册：创建账号 + 创建新租户（或加入已有租户） */
  async register(params: {
    email: string;
    password: string;
    displayName: string;
    tenantName?: string;       // 提供则创建新租户
    tenantSlug?: string;       // 提供则加入已有租户
    inviteCode?: string;        // 邀请码
  }): Promise<LoginResult> {
    const { email, password, displayName, tenantName, tenantSlug, inviteCode } = params;

    // 1. 校验邮箱格式
    if (!email || !email.includes('@')) {
      return { success: false, error: '请提供有效的邮箱地址' };
    }
    if (password.length < 6) {
      return { success: false, error: '密码长度至少 6 位' };
    }

    // 2. 检查邮箱是否已注册
    const existing = this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return { success: false, error: '该邮箱已被注册' };
    }

    // 3. 确定租户
    let tenant: Tenant;

    if (tenantSlug) {
      // 加入已有租户
      const t = this.tenants.find(t => t.slug === tenantSlug || t.id === tenantSlug);
      if (!t) return { success: false, error: '租户不存在' };
      if (t.members.length >= t.quotas.maxUsers) {
        return { success: false, error: `租户已达成员上限（${t.quotas.maxUsers}人）` };
      }
      tenant = t;
    } else {
      // 创建新租户
      const slug = tenantName ? generateSlug(tenantName) : generateSlug(displayName + '-workspace');
      const duplicate = this.tenants.find(t => t.slug === slug);
      if (duplicate) return { success: false, error: '租户名已被占用' };

      const newTenant: Tenant = {
        id: uuidv4(),
        name: tenantName || (displayName + ' 的团队'),
        slug,
        plan: 'free',
        ownerId: '', // 稍后填充
        members: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        config: planConfig('free'),
        quotas: planQuotas('free'),
      };
      this.tenants.push(newTenant);
      tenant = newTenant;
    }

    // 4. 创建用户
    const salt = crypto.randomBytes(SALT_LEN).toString('hex');
    const passwordHash = hashPassword(password, salt);

    const newUser: User = {
      id: uuidv4(),
      email: email.toLowerCase(),
      passwordHash,
      salt,
      displayName,
      tenantIds: [tenant.id],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      preferences: { theme: 'auto', notifications: true },
    };

    // 5. 设置租户成员关系
    const isOwner = !tenant.ownerId;
    if (isOwner) {
      tenant.ownerId = newUser.id;
      tenant.plan = 'pro'; // 创建者给 Pro 试用
    }
    tenant.members.push({
      userId: newUser.id,
      role: isOwner ? 'owner' : 'member',
      joinedAt: new Date().toISOString(),
      nickname: displayName,
    });
    tenant.updatedAt = new Date().toISOString();

    this.users.push(newUser);
    this.persist();

    const tokens = this.generateTokens(newUser, tenant);
    return {
      success: true,
      user: this.toPublic(newUser),
      tokens,
      tenant,
    };
  }

  /** 登录 */
  async login(params: { email: string; password: string; tenantId?: string }): Promise<LoginResult> {
    const { email, password, tenantId } = params;

    const user = this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user || !user.isActive) {
      return { success: false, error: '邮箱或密码错误' };
    }

    if (!verifyPassword(password, user.passwordHash, user.salt)) {
      return { success: false, error: '邮箱或密码错误' };
    }

    // 确定登录租户
    let targetTenant: Tenant | undefined;
    if (tenantId) {
      targetTenant = this.tenants.find(t => t.id === tenantId && user.tenantIds.includes(t.id));
    }
    if (!targetTenant) {
      const tid = user.tenantIds[0];
      targetTenant = this.tenants.find(t => t.id === tid);
    }
    if (!targetTenant) {
      return { success: false, error: '用户未关联任何租户' };
    }

    // 更新最后登录
    user.lastLoginAt = new Date().toISOString();
    this.persist();

    const member = targetTenant.members.find(m => m.userId === user.id);
    const tokens = this.generateTokens(user, targetTenant);

    return {
      success: true,
      user: this.toPublic(user),
      tokens,
      tenant: targetTenant,
    };
  }

  /** 获取用户的租户列表 */
  getUserTenants(userId: string): Tenant[] {
    const user = this.users.find(u => u.id === userId);
    if (!user) return [];
    return this.tenants.filter(t => user.tenantIds.includes(t.id));
  }

  /** 切换活跃租户（生成新 Token） */
  switchTenant(userId: string, tenantId: string): LoginResult {
    const user = this.users.find(u => u.id === userId);
    if (!user) return { success: false, error: '用户不存在' };
    if (!user.tenantIds.includes(tenantId)) {
      return { success: false, error: '无权访问该租户' };
    }
    const tenant = this.tenants.find(t => t.id === tenantId);
    if (!tenant) return { success: false, error: '租户不存在' };

    const tokens = this.generateTokens(user, tenant);
    return { success: true, user: this.toPublic(user), tokens, tenant };
  }

  /** 验证 JWT Token */
  verifyToken(token: string): JWTPayload | null {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
      if (payload.type !== 'access') return null;
      return payload;
    } catch {
      return null;
    }
  }

  /** 刷新 Token */
  refreshToken(token: string): LoginResult {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
      if (payload.type !== 'refresh') return { success: false, error: '无效的刷新令牌' };

      const user = this.users.find(u => u.id === payload.userId);
      if (!user || !user.isActive) return { success: false, error: '用户不存在或已禁用' };

      const tenant = this.tenants.find(t => t.id === payload.tenantId);
      if (!tenant) return { success: false, error: '租户不存在' };

      const tokens = this.generateTokens(user, tenant);
      return { success: true, user: this.toPublic(user), tokens, tenant };
    } catch {
      return { success: false, error: '令牌已失效，请重新登录' };
    }
  }

  /** 获取用户信息 */
  getUser(userId: string): PublicUser | null {
    const user = this.users.find(u => u.id === userId);
    return user ? this.toPublic(user) : null;
  }

  /** 获取租户详情 */
  getTenant(tenantId: string): Tenant | null {
    return this.tenants.find(t => t.id === tenantId) || null;
  }

  /** 列出公开租户（用于注册时选择） */
  listPublicTenants(): Array<{ id: string; name: string; slug: string; plan: string }> {
    return this.tenants.map(t => ({ id: t.id, name: t.name, slug: t.slug, plan: t.plan }));
  }

  /** 更新用户资料 */
  updateUser(userId: string, updates: Partial<Pick<User, 'displayName' | 'avatar' | 'preferences'>>): PublicUser | null {
    const user = this.users.find(u => u.id === userId);
    if (!user) return null;
    if (updates.displayName) user.displayName = updates.displayName;
    if (updates.avatar) user.avatar = updates.avatar;
    if (updates.preferences) user.preferences = { ...user.preferences, ...updates.preferences };
    user.updatedAt = new Date().toISOString();
    this.persist();
    return this.toPublic(user);
  }

  /** 更新租户配置 */
  updateTenant(tenantId: string, userId: string, updates: Partial<Pick<Tenant, 'name' | 'config'>>): Tenant | null {
    const tenant = this.tenants.find(t => t.id === tenantId);
    if (!tenant) return null;
    const member = tenant.members.find(m => m.userId === userId);
    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      return null; // 无权限
    }
    if (updates.name) tenant.name = updates.name;
    if (updates.config) tenant.config = { ...tenant.config, ...updates.config };
    tenant.updatedAt = new Date().toISOString();
    this.persist();
    return tenant;
  }

  /** 邀请成员 */
  inviteMember(tenantId: string, inviterId: string, email: string, role: UserRole = 'member'): { success: boolean; inviteCode?: string; error?: string } {
    const tenant = this.tenants.find(t => t.id === tenantId);
    if (!tenant) return { success: false, error: '租户不存在' };
    const inviter = tenant.members.find(m => m.userId === inviterId);
    if (!inviter || inviter.role === 'viewer') return { success: false, error: '无权限邀请成员' };

    const inviteCode = uuidv4().slice(0, 8).toUpperCase();
    return { success: true, inviteCode };
  }

  // ==================== 内部方法 ====================

  private generateTokens(user: User, tenant: Tenant): AuthTokens {
    const member = tenant.members.find(m => m.userId === user.id);
    const role: UserRole = member?.role || 'member';

    const payload: Omit<JWTPayload, 'jti' | 'type'> = {
      userId: user.id,
      tenantId: tenant.id,
      role,
    };

    const accessToken = jwt.sign(
      { ...payload, type: 'access', jti: uuidv4() } as JWTPayload,
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL }
    );

    const refreshToken = jwt.sign(
      { ...payload, type: 'refresh', jti: uuidv4() } as JWTPayload,
      JWT_SECRET,
      { expiresIn: REFRESH_TOKEN_TTL }
    );

    return { accessToken, refreshToken, expiresIn: 86400 };
  }

  private toPublic(user: User): PublicUser {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatar: user.avatar,
      tenantIds: user.tenantIds,
      preferences: user.preferences,
    };
  }
}

// ==================== Express 中间件 ====================

export function authMiddleware(auth: AuthService) {
  return (req: Record<string, unknown>, _res: Record<string, unknown>, next: () => void) => {
    const authHeader = (req.headers as Record<string, string> | undefined)?.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      (req as Record<string, unknown>).auth = null;
      return next();
    }

    const token = authHeader.slice(7);
    const payload = auth.verifyToken(token);
    (req as Record<string, unknown>).auth = payload;
    return next();
  };
}

export function requireAuth(req: Record<string, unknown>, res: Record<string, { status: (code: number) => { json: (data: unknown) => void } }>, next: () => void) {
  if (!(req.auth as JWTPayload | null)) {
    return res.status(401).json({ error: '请先登录' });
  }
  return next();
}

export function requireRole(...roles: UserRole[]) {
  return (req: Record<string, unknown>, res: Record<string, { status: (code: number) => { json: (data: unknown) => void } }>, next: () => void) => {
    const auth = req.auth as JWTPayload | null;
    if (!auth) return res.status(401).json({ error: '请先登录' });
    const hierarchy: UserRole[] = ['viewer', 'member', 'admin', 'owner'];
    const userLevel = hierarchy.indexOf(auth.role);
    const requiredLevel = Math.min(...roles.map(r => hierarchy.indexOf(r)));
    if (userLevel < requiredLevel) {
      return res.status(403).json({ error: '权限不足' });
    }
    return next();
  };
}

// ==================== 单例导出 ====================
export const authService = new AuthService();

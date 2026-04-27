/**
 * SIMIAICLAW 龙虾集群太极64卦系统
 * 多渠道AI客户管理系统 CRM
 * 集成：sonov.io邮件营销 / 谷歌广告 / 全球社媒 / simiaiclaw.com询盘
 */

import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuid } from 'uuid';

// ============================================================
// 数据存储路径
// ============================================================
const DATA_DIR = path.join(process.cwd(), 'data', 'crm');
const CUSTOMERS_FILE = path.join(DATA_DIR, 'customers.json');
const EMAILS_FILE = path.join(DATA_DIR, 'emails.json');
const CAMPAIGNS_FILE = path.join(DATA_DIR, 'campaigns.json');
const CHANNELS_FILE = path.join(DATA_DIR, 'channels.json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJSON<T>(file: string, fallback: T): T {
  ensureDir();
  if (!fs.existsSync(file)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {
    return fallback;
  }
}

function writeJSON(file: string, data: unknown) {
  ensureDir();
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

// ============================================================
// 类型定义
// ============================================================

export type CustomerSource =
  | 'website_inquiry'      // simiaiclaw.com询盘
  | 'google_ads'          // 谷歌广告
  | 'social_media'         // 社媒（Facebook/Instagram/TikTok/LinkedIn等）
  | 'email'               // 邮件营销
  | 'organic'             // 自然流量
  | 'referral'           // 口碑推荐
  | 'event'              // 展会活动
  | 'manual';            // 手动录入

export type CustomerStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';

export type SocialPlatform = 'facebook' | 'instagram' | 'tiktok' | 'linkedin' | 'twitter' | 'youtube' | 'whatsapp' | 'wechat';

export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  source: CustomerSource;
  sourceDetail?: string; // 如：Google Ads关键词、Facebook广告ID等
  status: CustomerStatus;
  tags: string[];
  notes: string;
  socialProfiles: Partial<Record<SocialPlatform, string>>;
  assignedTo?: string; // 负责销售
  lastContactAt?: string;
  nextFollowUpAt?: string;
  estimatedValue?: number; // 预估价值（美元）
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailAccount {
  id: string;
  tenantId: string;
  name: string;          // 显示名称，如 "个人Gmail" / "企业邮箱"
  email: string;        // hmwhtm@gmail.com / hemingwang@simiai.top
  provider: 'gmail' | 'sonov' | 'smtp';
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;    // 加密存储
  isDefault: boolean;
  createdAt: string;
}

export interface EmailCampaign {
  id: string;
  tenantId: string;
  name: string;
  subject: string;
  template: string;     // HTML模板
  targetAudience: 'all' | 'new' | 'qualified' | 'lost' | 'custom';
  targetTags?: string[];
  customerIds?: string[];
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  scheduledAt?: string;
  sentAt?: string;
  stats: {
    sent: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
  };
  fromEmail: string;
  fromName: string;
  createdAt: string;
  createdBy: string;
}

export interface ChannelSource {
  id: string;
  tenantId: string;
  name: string;
  type: CustomerSource;
  platform?: string;
  accountId?: string;
  adSpend?: number;      // 广告花费（当月）
  impressions?: number;  // 展示次数
  clicks?: number;       // 点击次数
  leads?: number;        // 产生的线索数
  cpl?: number;          // 单线索成本
  active: boolean;
  config: Record<string, unknown>;
  createdAt: string;
}

export interface GoogleAdsConfig {
  customerId: string;
  refreshToken?: string;
  active: boolean;
}

export interface CRMDashboard {
  totalCustomers: number;
  bySource: Record<string, number>;
  byStatus: Record<string, number>;
  monthlyGrowth: number; // 环比增长
  totalValue: number;
  avgDealSize: number;
  recentActivity: ActivityLogEntry[];
}

export interface ActivityLogEntry {
  id: string;
  tenantId: string;
  customerId?: string;
  type: 'customer_added' | 'status_changed' | 'email_sent' | 'note_added' | 'followup_set' | 'value_updated';
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  createdBy?: string;
}

// ============================================================
// CRM Service
// ============================================================

class CRMService {
  // ── 客户管理 ──────────────────────────────────────────────

  getCustomers(tenantId: string, filters?: {
    source?: CustomerSource;
    status?: CustomerStatus;
    search?: string;
    tag?: string;
  }): Customer[] {
    let customers = readJSON<Customer[]>(CUSTOMERS_FILE, []).filter(c => c.tenantId === tenantId);

    if (filters?.source) customers = customers.filter(c => c.source === filters.source);
    if (filters?.status) customers = customers.filter(c => c.status === filters.status);
    if (filters?.tag) customers = customers.filter(c => c.tags.includes(filters.tag!));
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      customers = customers.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.company?.toLowerCase().includes(q)
      );
    }

    return customers.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  getCustomer(id: string, tenantId: string): Customer | undefined {
    const customers = readJSON<Customer[]>(CUSTOMERS_FILE, []);
    return customers.find(c => c.id === id && c.tenantId === tenantId);
  }

  addCustomer(tenantId: string, data: Omit<Customer, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Customer {
    const customers = readJSON<Customer[]>(CUSTOMERS_FILE, []);
    const now = new Date().toISOString();
    const customer: Customer = {
      ...data,
      id: uuid(),
      tenantId,
      createdAt: now,
      updatedAt: now,
    };
    customers.push(customer);
    writeJSON(CUSTOMERS_FILE, customers);
    this.logActivity(tenantId, 'customer_added', `新增客户：${customer.name}（${customer.email}）`, customer.id);
    return customer;
  }

  updateCustomer(id: string, tenantId: string, updates: Partial<Customer>): Customer | null {
    const customers = readJSON<Customer[]>(CUSTOMERS_FILE, []);
    const idx = customers.findIndex(c => c.id === id && c.tenantId === tenantId);
    if (idx < 0) return null;
    const prev = customers[idx];
    if (prev.status !== updates.status && updates.status) {
      this.logActivity(tenantId, 'status_changed', `客户 ${prev.name} 状态变更：${prev.status} → ${updates.status}`, id);
    }
    customers[idx] = { ...prev, ...updates, id: prev.id, tenantId: prev.tenantId, updatedAt: new Date().toISOString() };
    writeJSON(CUSTOMERS_FILE, customers);
    return customers[idx];
  }

  deleteCustomer(id: string, tenantId: string): boolean {
    const customers = readJSON<Customer[]>(CUSTOMERS_FILE, []);
    const idx = customers.findIndex(c => c.id === id && c.tenantId === tenantId);
    if (idx < 0) return false;
    customers.splice(idx, 1);
    writeJSON(CUSTOMERS_FILE, customers);
    return true;
  }

  // ── 邮件账号管理 ──────────────────────────────────────────

  getEmailAccounts(tenantId: string): EmailAccount[] {
    return readJSON<EmailAccount[]>(EMAILS_FILE, []).filter(e => e.tenantId === tenantId);
  }

  addEmailAccount(tenantId: string, data: Omit<EmailAccount, 'id' | 'tenantId' | 'createdAt'>): EmailAccount {
    const accounts = readJSON<EmailAccount[]>(EMAILS_FILE, []);
    // 如果设为默认，先取消其他的默认
    if (data.isDefault) {
      accounts.forEach(a => { if (a.tenantId === tenantId) a.isDefault = false; });
    }
    const account: EmailAccount = { ...data, id: uuid(), tenantId, createdAt: new Date().toISOString() };
    accounts.push(account);
    writeJSON(EMAILS_FILE, accounts);
    return account;
  }

  deleteEmailAccount(id: string, tenantId: string): boolean {
    const accounts = readJSON<EmailAccount[]>(EMAILS_FILE, []);
    const idx = accounts.findIndex(a => a.id === id && a.tenantId === tenantId);
    if (idx < 0) return false;
    accounts.splice(idx, 1);
    writeJSON(EMAILS_FILE, accounts);
    return true;
  }

  getDefaultEmailAccount(tenantId: string): EmailAccount | undefined {
    return this.getEmailAccounts(tenantId).find(a => a.isDefault);
  }

  // ── 邮件营销活动 ──────────────────────────────────────────

  getCampaigns(tenantId: string): EmailCampaign[] {
    return readJSON<EmailCampaign[]>(CAMPAIGNS_FILE, []).filter(c => c.tenantId === tenantId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  createCampaign(tenantId: string, data: Omit<EmailCampaign, 'id' | 'tenantId' | 'createdAt' | 'stats'>, userId: string): EmailCampaign {
    const campaigns = readJSON<EmailCampaign[]>(CAMPAIGNS_FILE, []);
    const campaign: EmailCampaign = {
      ...data,
      id: uuid(),
      tenantId,
      stats: { sent: 0, opened: 0, clicked: 0, bounced: 0, unsubscribed: 0 },
      createdAt: new Date().toISOString(),
      createdBy: userId,
    };
    campaigns.push(campaign);
    writeJSON(CAMPAIGNS_FILE, campaigns);
    return campaign;
  }

  updateCampaignStats(id: string, tenantId: string, stats: Partial<EmailCampaign['stats']>): void {
    const campaigns = readJSON<EmailCampaign[]>(CAMPAIGNS_FILE, []);
    const idx = campaigns.findIndex(c => c.id === id && c.tenantId === tenantId);
    if (idx >= 0) {
      campaigns[idx].stats = { ...campaigns[idx].stats, ...stats };
      writeJSON(CAMPAIGNS_FILE, campaigns);
    }
  }

  sendCampaign(id: string, tenantId: string, customers: Customer[]): { success: boolean; sent: number } {
    const campaigns = readJSON<EmailCampaign[]>(CAMPAIGNS_FILE, []);
    const idx = campaigns.findIndex(c => c.id === id && c.tenantId === tenantId);
    if (idx < 0) return { success: false, sent: 0 };

    const campaign = campaigns[idx];
    const emailAccount = this.getDefaultEmailAccount(tenantId);
    if (!emailAccount) return { success: false, sent: 0 };

    // 统计目标客户数
    let targetCustomers = customers;
    if (campaign.targetAudience !== 'all' && campaign.targetAudience !== 'custom') {
      targetCustomers = customers.filter(c => {
        if (campaign.targetAudience === 'new') return c.status === 'new';
        if (campaign.targetAudience === 'qualified') return ['qualified', 'proposal', 'negotiation'].includes(c.status);
        if (campaign.targetAudience === 'lost') return c.status === 'lost';
        return true;
      });
    }
    if (campaign.customerIds?.length) {
      const ids = new Set(campaign.customerIds);
      targetCustomers = targetCustomers.filter(c => ids.has(c.id));
    }

    // 更新活动状态
    campaigns[idx].status = 'sending';
    campaigns[idx].sentAt = new Date().toISOString();
    writeJSON(CAMPAIGNS_FILE, campaigns);

    // 记录邮件发送活动
    this.logActivity(tenantId, 'email_sent',
      `邮件活动「${campaign.name}」发送给 ${targetCustomers.length} 位客户，从 ${emailAccount.email} 发出`,
      undefined, { campaignId: id, count: targetCustomers.length }
    );

    // 更新统计
    this.updateCampaignStats(id, tenantId, { sent: targetCustomers.length });

    return { success: true, sent: targetCustomers.length };
  }

  // ── 渠道来源管理 ──────────────────────────────────────────

  getChannels(tenantId: string): ChannelSource[] {
    return readJSON<ChannelSource[]>(CHANNELS_FILE, []).filter(c => c.tenantId === tenantId);
  }

  addChannel(tenantId: string, data: Omit<ChannelSource, 'id' | 'tenantId' | 'createdAt'>): ChannelSource {
    const channels = readJSON<ChannelSource[]>(CHANNELS_FILE, []);
    const channel: ChannelSource = { ...data, id: uuid(), tenantId, createdAt: new Date().toISOString() };
    channels.push(channel);
    writeJSON(CHANNELS_FILE, channels);
    return channel;
  }

  updateChannel(id: string, tenantId: string, updates: Partial<ChannelSource>): ChannelSource | null {
    const channels = readJSON<ChannelSource[]>(CHANNELS_FILE, []);
    const idx = channels.findIndex(c => c.id === id && c.tenantId === tenantId);
    if (idx < 0) return null;
    channels[idx] = { ...channels[idx], ...updates };
    writeJSON(CHANNELS_FILE, channels);
    return channels[idx];
  }

  deleteChannel(id: string, tenantId: string): boolean {
    const channels = readJSON<ChannelSource[]>(CHANNELS_FILE, []);
    const idx = channels.findIndex(c => c.id === id && c.tenantId === tenantId);
    if (idx < 0) return false;
    channels.splice(idx, 1);
    writeJSON(CHANNELS_FILE, channels);
    return true;
  }

  // ── 仪表盘 ──────────────────────────────────────────────

  getDashboard(tenantId: string): CRMDashboard {
    const customers = readJSON<Customer[]>(CUSTOMERS_FILE, []).filter(c => c.tenantId === tenantId);
    const channels = this.getChannels(tenantId);

    const bySource: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    customers.forEach(c => {
      bySource[c.source] = (bySource[c.source] || 0) + 1;
      byStatus[c.status] = (byStatus[c.status] || 0) + 1;
    });

    // 计算月度增长（对比上个月）
    const now = new Date();
    const thisMonth = customers.filter(c => new Date(c.createdAt) >= new Date(now.getFullYear(), now.getMonth(), 1));
    const lastMonth = customers.filter(c => {
      const d = new Date(c.createdAt);
      return d >= new Date(now.getFullYear(), now.getMonth() - 1, 1) && d < new Date(now.getFullYear(), now.getMonth(), 1);
    });
    const monthlyGrowth = lastMonth.length > 0
      ? ((thisMonth.length - lastMonth.length) / lastMonth.length) * 100
      : thisMonth.length > 0 ? 100 : 0;

    const totalValue = customers.reduce((sum, c) => sum + (c.estimatedValue || 0), 0);
    const avgDealSize = customers.length > 0 ? totalValue / customers.length : 0;

    const activityLog = this.getRecentActivity(tenantId, 20);

    // 渠道线索统计
    channels.forEach(ch => {
      if (ch.active) {
        const leads = customers.filter(c => c.source === ch.type).length;
        if (ch.leads !== leads) {
          this.updateChannel(ch.id, tenantId, { leads });
        }
      }
    });

    return {
      totalCustomers: customers.length,
      bySource,
      byStatus,
      monthlyGrowth: Math.round(monthlyGrowth * 10) / 10,
      totalValue,
      avgDealSize: Math.round(avgDealSize),
      recentActivity: activityLog,
    };
  }

  // ── 活动日志 ──────────────────────────────────────────────

  private logActivity(tenantId: string, type: ActivityLogEntry['type'], description: string, customerId?: string, metadata?: Record<string, unknown>, createdBy?: string) {
    const logFile = path.join(DATA_DIR, `activity_${tenantId}.json`);
    const logs = readJSON<ActivityLogEntry[]>(logFile, []);
    logs.unshift({ id: uuid(), tenantId, customerId, type, description, metadata, createdAt: new Date().toISOString(), createdBy });
    // 只保留最近1000条
    writeJSON(logFile, logs.slice(0, 1000));
  }

  getRecentActivity(tenantId: string, limit = 20): ActivityLogEntry[] {
    const logFile = path.join(DATA_DIR, `activity_${tenantId}.json`);
    return readJSON<ActivityLogEntry[]>(logFile, []).slice(0, limit);
  }

  // ── 批量导入客户（从Google Ads/社媒平台） ─────────────────

  batchImportCustomers(tenantId: string, entries: Array<{
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    source: CustomerSource;
    sourceDetail?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  }>): { added: number; skipped: number } {
    const customers = readJSON<Customer[]>(CUSTOMERS_FILE, []);
    const existingEmails = new Set(customers.map(c => c.email.toLowerCase()));
    let added = 0, skipped = 0;

    for (const entry of entries) {
      if (entry.email && existingEmails.has(entry.email.toLowerCase())) {
        skipped++;
        continue;
      }
      if (entry.email) existingEmails.add(entry.email.toLowerCase());
      const now = new Date().toISOString();
      customers.push({
        id: uuid(),
        tenantId,
        name: entry.name,
        email: entry.email || '',
        phone: entry.phone,
        company: entry.company,
        source: entry.source,
        sourceDetail: entry.sourceDetail,
        status: 'new',
        tags: [],
        notes: '',
        socialProfiles: {},
        utmSource: entry.utmSource,
        utmMedium: entry.utmMedium,
        utmCampaign: entry.utmCampaign,
        createdAt: now,
        updatedAt: now,
      });
      added++;
    }

    writeJSON(CUSTOMERS_FILE, customers);
    return { added, skipped };
  }

  // ── 初始化示例数据 ─────────────────────────────────────────

  seedDemoData(tenantId: string): void {
    if (this.getCustomers(tenantId).length > 0) return; // 已有数据不重复初始化

    const demoCustomers: Array<Omit<Customer, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>> = [
      { name: 'Michael Chen', email: 'michael@techcorp.io', phone: '+1-415-555-0102', company: 'TechCorp International', source: 'google_ads', sourceDetail: 'Google Ads - AI Tools Campaign', status: 'qualified', tags: ['美国', 'B2B', 'AI'], notes: '对AI客服解决方案感兴趣，有预算决策权', socialProfiles: { linkedin: 'michael-chen-techcorp', twitter: '@michael_ai' }, estimatedValue: 50000, utmSource: 'google', utmMedium: 'cpc', utmCampaign: 'q1_ai_tools' },
      { name: 'Sarah Johnson', email: 'sarah.j@retailplus.co', phone: '+44-20-7946-0958', company: 'RetailPlus Global', source: 'website_inquiry', status: 'proposal', tags: ['英国', '零售', '电商'], notes: '来自simiaiclaw.com询盘表单，希望了解企业订阅方案', socialProfiles: { linkedin: 'sarah-johnson-retail' }, estimatedValue: 25000 },
      { name: 'David Park', email: 'david@nexgenlogistics.com', phone: '+82-2-555-0177', company: 'NexGen Logistics Korea', source: 'social_media', sourceDetail: 'LinkedIn广告 - 物流AI', status: 'negotiation', tags: ['韩国', '物流', 'AI'], notes: '在LinkedIn看到我们的广告，已发送报价方案，等待回复', socialProfiles: { linkedin: 'david-nexgen', whatsapp: '+82-10-5555-0177' }, estimatedValue: 35000, utmSource: 'linkedin', utmMedium: 'social', utmCampaign: 'logistics_ai_2025' },
      { name: 'Emma Schmidt', email: 'emma.s@europeantech.de', company: 'EuroTech GmbH', source: 'email', status: 'contacted', tags: ['德国', '科技', '企业'], notes: '邮件营销活动第三封触发，客户回复询问演示时间', socialProfiles: {}, estimatedValue: 18000 },
      { name: 'James Wu', email: 'james@pioneer-hk.com', phone: '+852-5555-0198', company: 'Pioneer Trade HK', source: 'organic', status: 'new', tags: ['香港', '贸易'], notes: '通过搜索引擎自然流量访问，对多语言AI感兴趣', socialProfiles: { wechat: 'james_wu_hk' }, estimatedValue: 12000 },
      { name: 'Lisa Anderson', email: 'lisa@digitalretail.io', company: 'Digital Retail Inc', source: 'google_ads', sourceDetail: 'Google Ads - Retail AI', status: 'won', tags: ['美国', '零售', '企业客户'], notes: '已签约！年度合同，12个月企业订阅', socialProfiles: { linkedin: 'lisa-digitalretail' }, estimatedValue: 96000, utmSource: 'google', utmMedium: 'cpc' },
      { name: 'Marco Rossi', email: 'marco.rossi@italiatech.it', company: 'ItaliaTech SRL', source: 'referral', status: 'qualified', tags: ['意大利', '科技'], notes: '客户Lisa Anderson推荐，对AI写作助手感兴趣', socialProfiles: { linkedin: 'marco-rossi-italiatech' }, estimatedValue: 22000 },
      { name: 'Yuki Tanaka', email: 'yuki.t@tokyoinnovate.jp', company: 'Tokyo Innovate Co', source: 'event', sourceDetail: '广交会2025', status: 'new', tags: ['日本', '创新科技'], notes: '广交会现场交换名片后录入，已发送公司介绍资料', socialProfiles: {}, estimatedValue: 15000 },
    ];

    demoCustomers.forEach(c => this.addCustomer(tenantId, c));

    // 添加邮件账号
    this.addEmailAccount(tenantId, {
      name: '企业邮箱（企业域名）',
      email: 'hemingwang@simiai.top',
      provider: 'smtp',
      smtpHost: 'smtp.zoho.com',
      smtpPort: 587,
      smtpUser: 'hemingwang@simiai.top',
      smtpPass: '',
      isDefault: true,
    });
    this.addEmailAccount(tenantId, {
      name: '个人Gmail',
      email: 'hmwhtm@gmail.com',
      provider: 'gmail',
      isDefault: false,
    });

    // 添加渠道
    this.addChannel(tenantId, {
      name: 'Google Ads - AI工具系列',
      type: 'google_ads',
      platform: 'google_ads',
      adSpend: 8500,
      impressions: 125000,
      clicks: 4200,
      leads: 156,
      cpl: 54.49,
      active: true,
      config: { campaignId: 'gads_ai_tools_2025' },
    });
    this.addChannel(tenantId, {
      name: 'LinkedIn广告 - B2B精准投放',
      type: 'social_media',
      platform: 'linkedin',
      adSpend: 5200,
      impressions: 48000,
      clicks: 1890,
      leads: 89,
      cpl: 58.43,
      active: true,
      config: { campaignId: 'li_b2b_ai_2025' },
    });
    this.addChannel(tenantId, {
      name: 'simiaiclaw.com 自然询盘',
      type: 'website_inquiry',
      platform: 'simiaiclaw.com',
      active: true,
      config: {},
    });
    this.addChannel(tenantId, {
      name: 'Facebook/Instagram - 品牌曝光',
      type: 'social_media',
      platform: 'facebook',
      adSpend: 3200,
      impressions: 89000,
      clicks: 2340,
      leads: 67,
      cpl: 47.76,
      active: true,
      config: {},
    });
  }
}

export const crmService = new CRMService();

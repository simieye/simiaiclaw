/**
 * SIMIAICLAW 龙虾集群太极64卦系统
 * ClawTip 支付闭环模块 — 接入真实支付网关
 */

import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { PaymentRecord, PaymentStatus, HoneycombProtocol } from '../types';
import { paymentGateway, PaymentProvider } from '../payments';

export enum PaymentTier { SMALL = 'small', MEDIUM = 'medium', LARGE = 'large' }

const TIP_THRESHOLDS = { basic: 100, medium: 500, premium: 1000 };

export class ClawTip {
  private records = new Map<string, PaymentRecord>();
  private protocols = new Map<string, HoneycombProtocol>();
  private balances = new Map<string, number>();
  private dataPath: string;

  constructor(dataDir = './data/clawtip') {
    this.dataPath = dataDir;
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    this.load();
  }

  private load(): void {
    const p = path.join(this.dataPath, 'records.json');
    if (fs.existsSync(p)) {
      try {
        const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
        data.records?.forEach((r: PaymentRecord) => {
          this.records.set(r.id, {
            ...r, createdAt: new Date(r.createdAt),
            confirmedAt: r.confirmedAt ? new Date(r.confirmedAt) : undefined
          });
        });
      } catch (e) { /* ignore */ }
    }
  }

  private save(): void {
    fs.writeFileSync(path.join(this.dataPath, 'records.json'),
      JSON.stringify({ records: Array.from(this.records.values()) }, null, 2));
  }

  private tier(amount: number): PaymentTier {
    if (amount < 500) return PaymentTier.SMALL;
    if (amount < 5000) return PaymentTier.MEDIUM;
    return PaymentTier.LARGE;
  }

  async pay(params: {
    type: PaymentRecord['type']; amount: number; from: string; to: string;
    taskId?: string; skillId?: string; note?: string; provider?: PaymentProvider;
  }): Promise<{ approved: boolean; tier: PaymentTier; needsApproval: boolean; record: PaymentRecord; paymentResult?: unknown }> {
    const tier = this.tier(params.amount);
    const provider = params.provider || PaymentProvider.INTERNAL;

    // 尝试真实支付网关
    if (!this.paymentGatewayConfigured()) {
      return this.payInternal(params, tier);
    }

    try {
      const result = await paymentGateway.pay({
        amount: params.amount,
        currency: 'CNY',
        provider,
        from: params.from,
        to: params.to,
        type: params.type,
        taskId: params.taskId,
        skillId: params.skillId,
        description: params.note,
      });

      const record: PaymentRecord = {
        id: result.paymentId, type: params.type, amount: params.amount, currency: 'CNY',
        status: result.status,
        from: params.from, to: params.to, taskId: params.taskId, skillId: params.skillId,
        note: params.note, createdAt: new Date(),
        confirmedAt: result.status === PaymentStatus.COMPLETED ? new Date() : undefined,
      };
      this.records.set(record.id, record);
      this.save();

      return {
        approved: result.success && result.status === PaymentStatus.COMPLETED,
        tier: result.tier as unknown as PaymentTier,
        needsApproval: result.requiresApproval,
        record,
        paymentResult: result,
      };
    } catch (e) {
      console.warn('[ClawTip] 支付网关异常，降级到内部处理:', e);
      return this.payInternal(params, tier);
    }
  }

  private paymentGatewayConfigured(): boolean {
    // 检查是否有外部支付配置（简化判断）
    return !!(process.env.STRIPE_SECRET_KEY || process.env.WECHAT_MCH_ID || process.env.ALIPAY_APP_ID);
  }

  private payInternal(params: {
    type: PaymentRecord['type']; amount: number; from: string; to: string;
    taskId?: string; skillId?: string; note?: string;
  }, tier: PaymentTier): { approved: boolean; tier: PaymentTier; needsApproval: boolean; record: PaymentRecord } {
    const record: PaymentRecord = {
      id: uuidv4(), type: params.type, amount: params.amount, currency: 'CNY',
      status: tier === PaymentTier.SMALL ? PaymentStatus.COMPLETED : PaymentStatus.PENDING,
      from: params.from, to: params.to, taskId: params.taskId, skillId: params.skillId,
      note: params.note, createdAt: new Date(),
    };
    if (tier === PaymentTier.SMALL) {
      record.confirmedAt = new Date();
      const b = this.balances.get(params.to) || 0;
      this.balances.set(params.to, b + params.amount);
    }
    this.records.set(record.id, record);
    this.save();
    return { approved: tier === PaymentTier.SMALL, tier, needsApproval: tier !== PaymentTier.SMALL, record };
  }

  checkEvolutionTrigger(agentId: string): string | null {
    const total = this.balances.get(agentId) || 0;
    if (total >= TIP_THRESHOLDS.premium) return 'premium';
    if (total >= TIP_THRESHOLDS.medium) return 'medium';
    if (total >= TIP_THRESHOLDS.basic) return 'basic';
    return null;
  }

  createProtocol(p: Omit<HoneycombProtocol, 'id' | 'createdAt' | 'totalRevenue'>): HoneycombProtocol {
    const full: HoneycombProtocol = { ...p, id: uuidv4(), createdAt: new Date(), totalRevenue: 0 };
    this.protocols.set(full.id, full);
    return full;
  }

  getStats() {
    const recs = Array.from(this.records.values());
    const done = recs.filter(r => r.status === PaymentStatus.COMPLETED);
    return {
      total: recs.length, completed: done.length, pending: recs.filter(r => r.status === PaymentStatus.PENDING).length,
      revenue: done.reduce((s, r) => s + r.amount, 0),
      balances: Object.fromEntries(this.balances),
      protocols: this.protocols.size,
    };
  }
}

export const clawTip = new ClawTip(process.env.CLAWTIP_DATA_DIR || './data/clawtip');

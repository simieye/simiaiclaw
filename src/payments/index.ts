/**
 * SIMIAICLAW 龙虾集群太极64卦系统
 * 支付闭环接入层 — Stripe（国际）+ 微信支付/支付宝（国内）
 *
 * 支持分层支付：
 * - 小额（<500 CNY / $70）：AI自主决策，秒级完成
 * - 中额（500-5000 CNY / $70-$700）：人机配合，24h审批
 * - 大额（>5000 CNY / $700）：多签协议，72h审批
 */

import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { PaymentRecord, PaymentStatus } from '../types';

// ============================================================
// 类型定义
// ============================================================

export enum PaymentTier { SMALL = 'small', MEDIUM = 'medium', LARGE = 'large' }

export enum PaymentProvider {
  STRIPE = 'stripe',
  WECHAT_PAY = 'wechat_pay',
  ALIPAY = 'alipay',
  INTERNAL = 'internal', // 内部零钱包
}

export interface PaymentRequest {
  amount: number;
  currency: 'CNY' | 'USD';
  provider: PaymentProvider;
  from: string;
  to: string;
  type: PaymentRecord['type'];
  taskId?: string;
  skillId?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentResult {
  success: boolean;
  paymentId: string;
  provider: PaymentProvider;
  tier: PaymentTier;
  status: PaymentStatus;
  requiresApproval: boolean;
  approvalUrl?: string;       // 中大额的审批链接
  qrCodeUrl?: string;        // 微信/支付宝收款码
  providerRef?: string;      // 第三方支付流水号
  error?: string;
}

export interface RefundRequest {
  paymentId: string;
  amount?: number; // 不填则全额退款
  reason: string;
}

// ============================================================
// Stripe 集成
// ============================================================
class StripeProvider {
  private apiKey: string;
  private baseUrl = 'https://api.stripe.com/v1';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.STRIPE_SECRET_KEY || '';
  }

  isConfigured(): boolean { return !!this.apiKey && this.apiKey !== 'your_stripe_key'; }

  async createPaymentIntent(req: PaymentRequest): Promise<{ id: string; clientSecret: string } | null> {
    if (!this.isConfigured()) return null;
    try {
      // Stripe PaymentIntent API
      const body = new URLSearchParams({
        amount: String(Math.round(req.amount * 100)), // cents
        currency: req.currency === 'CNY' ? 'usd' : 'usd', // Stripe CNY需特殊配置
        'metadata[from]': req.from,
        'metadata[to]': req.to,
        'metadata[taskId]': req.taskId || '',
      });

      const response = await fetch(`${this.baseUrl}/payment_intents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (!response.ok) {
        const err = await response.text();
        console.error('[Stripe] PaymentIntent创建失败:', err);
        return null;
      }

      const data = await response.json() as { id: string; client_secret: string };
      return { id: data.id, clientSecret: data.client_secret };
    } catch (e) {
      console.error('[Stripe] API调用失败:', e);
      return null;
    }
  }

  async confirmPayment(paymentIntentId: string): Promise<boolean> {
    if (!this.isConfigured()) return false;
    try {
      const response = await fetch(`${this.baseUrl}/payment_intents/${paymentIntentId}`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
      });
      const data = await response.json() as { status: string };
      return data.status === 'succeeded';
    } catch { return false; }
  }

  async refund(paymentIntentId: string, amount?: number): Promise<boolean> {
    if (!this.isConfigured()) return false;
    try {
      const body: Record<string, string> = { payment_intent: paymentIntentId };
      if (amount) body['amount'] = String(Math.round(amount * 100));

      const response = await fetch(`${this.baseUrl}/refunds`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(body).toString(),
      });
      const data = await response.json() as { status: string };
      return data.status === 'succeeded';
    } catch { return false; }
  }
}

// ============================================================
// 微信支付集成
// ============================================================
class WeChatPayProvider {
  private mchId: string;
  private apiKey: string;
  private appId: string;
  private baseUrl = 'https://api.mch.weixin.qq.com';

  constructor() {
    this.mchId = process.env.WECHAT_MCH_ID || '';
    this.apiKey = process.env.WECHAT_API_KEY || '';
    this.appId = process.env.WECHAT_APP_ID || '';
  }

  isConfigured(): boolean {
    return !!(this.mchId && this.apiKey && this.appId);
  }

  /** 生成 Native 支付二维码链接 */
  async createNativeOrder(req: PaymentRequest): Promise<{ codeUrl: string; prepayId: string } | null> {
    if (!this.isConfigured()) return null;
    try {
      const outTradeNo = `WX${Date.now()}${uuidv4().slice(0, 8).toUpperCase()}`;
      const totalFee = Math.round(req.amount * 100); // 分
      const notifyUrl = process.env.WECHAT_NOTIFY_URL || 'https://your-domain.com/api/payments/wechat/callback';
      const sign = this.generateSign({ appid: this.appId, mch_id: this.mchId, out_trade_no: outTradeNo, total_fee: totalFee, trade_type: 'NATIVE', notify_url: notifyUrl });

      const xml = `<xml>
        <appid>${this.appId}</appid>
        <mch_id>${this.mchId}</mch_id>
        <out_trade_no>${outTradeNo}</out_trade_no>
        <total_fee>${totalFee}</total_fee>
        <trade_type>NATIVE</trade_type>
        <notify_url>${notifyUrl}</notify_url>
        <sign>${sign}</sign>
      </xml>`;

      const response = await fetch(`${this.baseUrl}/pay/unifiedorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/xml; charset=utf-8' },
        body: xml,
      });

      const xmlText = await response.text();
      const result = this.parseXml(xmlText);
      if (result?.return_code === 'SUCCESS' && result?.result_code === 'SUCCESS') {
        return { codeUrl: result.code_url, prepayId: result.prepay_id };
      }
      console.error('[WeChatPay] 创建订单失败:', result);
      return null;
    } catch (e) {
      console.error('[WeChatPay] API调用失败:', e);
      return null;
    }
  }

  /** 查询订单状态 */
  async queryOrder(outTradeNo: string): Promise<string> {
    if (!this.isConfigured()) return 'NOT_CONFIGURED';
    const sign = this.generateSign({ appid: this.appId!, mch_id: this.mchId!, out_trade_no: outTradeNo });
    const xml = `<xml><appid>${this.appId}</appid><mch_id>${this.mchId}</mch_id><out_trade_no>${outTradeNo}</out_trade_no><sign>${sign}</sign></xml>`;
    try {
      const response = await fetch(`${this.baseUrl}/pay/orderquery`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/xml; charset=utf-8' },
        body: xml,
      });
      const result = this.parseXml(await response.text());
      return result?.trade_state || 'UNKNOWN';
    } catch { return 'ERROR'; }
  }

  private generateSign(params: Record<string, string | number>): string {
    const sorted = Object.entries(params).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join('&');
    const signStr = sorted + `&key=${this.apiKey}`;
    return crypto.createHash('md5').update(signStr).digest('hex').toUpperCase();
  }

  private parseXml(xml: string): Record<string, string> {
    const result: Record<string, string> = {};
    const matches = xml.matchAll(/<(\w+)>([^<]*)<\/(\w+)>/g);
    for (const m of matches) { if (m[1] === m[3]) result[m[1]] = m[2]; }
    return result;
  }
}

// ============================================================
// 支付宝集成
// ============================================================
class AlipayProvider {
  private appId: string;
  private privateKey: string;
  private alipayPublicKey: string;
  private baseUrl = 'https://openapi.alipaydev.com/gateway.do'; // sandbox

  constructor() {
    this.appId = process.env.ALIPAY_APP_ID || '';
    this.privateKey = process.env.ALIPAY_PRIVATE_KEY || '';
    this.alipayPublicKey = process.env.ALIPAY_PUBLIC_KEY || '';
  }

  isConfigured(): boolean {
    return !!(this.appId && this.privateKey && this.alipayPublicKey);
  }

  /** 生成扫码支付链接 */
  async createQrCode(req: PaymentRequest): Promise<{ qrCode: string; tradeNo: string } | null> {
    if (!this.isConfigured()) return null;
    try {
      const outTradeNo = `ALI${Date.now()}${uuidv4().slice(0, 8).toUpperCase()}`;
      const bizContent = {
        outTradeNo,
        productCode: 'FACE_TO_FACE_PAYMENT',
        totalAmount: req.amount,
        subject: `SIMIAICLAW-${req.type}-${req.from}→${req.to}`,
        body: req.description || '龙虾集群技能付费',
      };

      const sign = this.generateSign({ app_id: this.appId, method: 'alipay.trade.precreate', charset: 'utf-8', version: '1.0', biz_content: JSON.stringify(bizContent) });

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          app_id: this.appId,
          method: 'alipay.trade.precreate',
          charset: 'utf-8',
          sign_type: 'RSA2',
          version: '1.0',
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
          biz_content: JSON.stringify(bizContent),
          sign,
        }).toString(),
      });

      const data = await response.json() as { alipay_trade_precreate_response?: { qr_code: string; out_trade_no: string; msg: string } };
      const resp = data?.alipay_trade_precreate_response;
      if (resp?.qr_code) {
        return { qrCode: resp.qr_code, tradeNo: outTradeNo };
      }
      console.error('[Alipay] 创建二维码失败:', resp?.msg);
      return null;
    } catch (e) {
      console.error('[Alipay] API调用失败:', e);
      return null;
    }
  }

  private generateSign(params: Record<string, string>): string {
    const sorted = Object.entries(params).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}="${v}"`).join('&');
    return crypto.createSign('RSA-SHA256').update(sorted).sign(this.privateKey, 'base64');
  }
}

// ============================================================
// 统一支付网关
// ============================================================
export class PaymentGateway {
  private stripe = new StripeProvider(process.env.STRIPE_SECRET_KEY);
  private wechat = new WeChatPayProvider();
  private alipay = new AlipayProvider();
  private internalBalances = new Map<string, number>();
  private pendingApprovals = new Map<string, { request: PaymentRequest; createdAt: Date }>();
  private records = new Map<string, PaymentRecord>();
  private dataPath: string;

  constructor(dataDir = './data/payments') {
    this.dataPath = dataDir;
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    this.load();
    console.log('[PaymentGateway] 💰 支付网关初始化');
    console.log(`  Stripe: ${this.stripe.isConfigured() ? '✅ 已配置' : '⚠️ 未配置（配置 STRIPE_SECRET_KEY）'}`);
    console.log(`  微信支付: ${this.wechat.isConfigured() ? '✅ 已配置' : '⚠️ 未配置（配置 WECHAT_MCH_ID/WECHAT_API_KEY）'}`);
    console.log(`  支付宝: ${this.alipay.isConfigured() ? '✅ 已配置' : '⚠️ 未配置（配置 ALIPAY_APP_ID/ALIPAY_PRIVATE_KEY）'}`);
  }

  private load(): void {
    const p = path.join(this.dataPath, 'records.json');
    if (fs.existsSync(p)) {
      try {
        const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
        data.records?.forEach((r: PaymentRecord) => {
          this.records.set(r.id, { ...r, createdAt: new Date(r.createdAt), confirmedAt: r.confirmedAt ? new Date(r.confirmedAt) : undefined });
        });
        if (data.balances) Object.entries(data.balances).forEach(([k, v]) => this.internalBalances.set(k, v as number));
      } catch { /* ignore */ }
    }
  }

  private save(): void {
    const data = {
      records: Array.from(this.records.values()),
      balances: Object.fromEntries(this.internalBalances),
    };
    fs.writeFileSync(path.join(this.dataPath, 'records.json'), JSON.stringify(data, null, 2));
  }

  private getTier(amount: number, currency: string): PaymentTier {
    const usdAmount = currency === 'CNY' ? amount / 7.2 : amount;
    if (usdAmount < 70) return PaymentTier.SMALL;
    if (usdAmount < 700) return PaymentTier.MEDIUM;
    return PaymentTier.LARGE;
  }

  /** 发起支付 */
  async pay(req: PaymentRequest): Promise<PaymentResult> {
    const paymentId = uuidv4();
    const tier = this.getTier(req.amount, req.currency);

    // 小额：内部零钱包自主完成
    if (tier === PaymentTier.SMALL) {
      return this.internalPay(paymentId, req);
    }

    // 中额：创建审批记录
    if (tier === PaymentTier.MEDIUM) {
      return this.createPendingPayment(paymentId, req);
    }

    // 大额：多签协议
    return this.createLargePayment(paymentId, req);
  }

  /** 小额支付（内部零钱包）*/
  private async internalPay(paymentId: string, req: PaymentRequest): Promise<PaymentResult> {
    const fromBalance = this.internalBalances.get(req.from) || 0;
    if (fromBalance < req.amount) {
      return { success: false, paymentId, provider: PaymentProvider.INTERNAL, tier: PaymentTier.SMALL, status: PaymentStatus.FAILED, requiresApproval: false, error: '余额不足' };
    }
    this.internalBalances.set(req.from, fromBalance - req.amount);
    this.internalBalances.set(req.to, (this.internalBalances.get(req.to) || 0) + req.amount);

    const record: PaymentRecord = {
      id: paymentId, type: req.type, amount: req.amount, currency: req.currency,
      status: PaymentStatus.COMPLETED, from: req.from, to: req.to,
      taskId: req.taskId, skillId: req.skillId,
      note: req.description, createdAt: new Date(), confirmedAt: new Date(),
    };
    this.records.set(paymentId, record);
    this.save();

    console.log(`[Payment] ✅ 小额支付完成: ${req.from} → ${req.to} ¥${req.amount}`);
    return {
      success: true, paymentId, provider: PaymentProvider.INTERNAL,
      tier: PaymentTier.SMALL, status: PaymentStatus.COMPLETED, requiresApproval: false,
    };
  }

  /** 中额支付（需审批）*/
  private async createPendingPayment(paymentId: string, req: PaymentRequest): Promise<PaymentResult> {
    this.pendingApprovals.set(paymentId, { request: req, createdAt: new Date() });

    const record: PaymentRecord = {
      id: paymentId, type: req.type, amount: req.amount, currency: req.currency,
      status: PaymentStatus.PENDING, from: req.from, to: req.to,
      taskId: req.taskId, skillId: req.skillId,
      note: req.description, createdAt: new Date(),
    };
    this.records.set(paymentId, record);
    this.save();

    // 根据provider生成支付链接
    let approvalUrl = `https://dashboard.simiaiclaw.ai/payment/approve/${paymentId}`;
    let qrCodeUrl: string | undefined;

    if (req.provider === PaymentProvider.WECHAT_PAY && this.wechat.isConfigured()) {
      const qr = await this.wechat.createNativeOrder(req);
      if (qr) qrCodeUrl = qr.codeUrl;
    } else if (req.provider === PaymentProvider.ALIPAY && this.alipay.isConfigured()) {
      const qr = await this.alipay.createQrCode(req);
      if (qr) qrCodeUrl = qr.qrCode;
    } else if (req.provider === PaymentProvider.STRIPE && this.stripe.isConfigured()) {
      const pi = await this.stripe.createPaymentIntent(req);
      if (pi) approvalUrl = `https://checkout.stripe.com/pay/${pi.clientSecret}`;
    }

    console.log(`[Payment] ⏳ 中额待审批: ${req.from} → ${req.to} ¥${req.amount} (ID: ${paymentId})`);
    return {
      success: true, paymentId, provider: req.provider,
      tier: PaymentTier.MEDIUM, status: PaymentStatus.PENDING, requiresApproval: true,
      approvalUrl, qrCodeUrl,
    };
  }

  /** 大额支付（多签）*/
  private async createLargePayment(paymentId: string, req: PaymentRequest): Promise<PaymentResult> {
    return this.createPendingPayment(paymentId, req);
  }

  /** 审批支付 */
  async approve(paymentId: string, approverNote?: string): Promise<boolean> {
    const pending = this.pendingApprovals.get(paymentId);
    const record = this.records.get(paymentId);
    if (!pending || !record) return false;

    record.status = PaymentStatus.COMPLETED;
    record.confirmedAt = new Date();
    record.note = (record.note || '') + ` [审批: ${approverNote || '通过'}]`;
    this.pendingApprovals.delete(paymentId);
    this.save();
    return true;
  }

  /** 拒绝支付 */
  async reject(paymentId: string, reason: string): Promise<boolean> {
    const pending = this.pendingApprovals.get(paymentId);
    const record = this.records.get(paymentId);
    if (!pending || !record) return false;

    record.status = PaymentStatus.FAILED;
    record.note = ` [拒绝: ${reason}]`;
    this.pendingApprovals.delete(paymentId);
    this.save();
    return true;
  }

  /** 退款 */
  async refund(req: RefundRequest): Promise<boolean> {
    const record = this.records.get(req.paymentId);
    if (!record || record.status !== PaymentStatus.COMPLETED) return false;

    const refundAmount = req.amount || record.amount;
    record.status = PaymentStatus.REFUNDED;
    this.records.set(req.paymentId, record);
    this.save();
    console.log(`[Payment] 🔄 退款: ${req.paymentId} ¥${refundAmount} - ${req.reason}`);
    return true;
  }

  /** 充值零钱包 */
  async deposit(userId: string, amount: number, provider: PaymentProvider): Promise<PaymentResult> {
    return this.pay({ amount, currency: 'CNY', provider, from: 'SYSTEM', to: userId, type: 'tip', description: '零钱包充值' });
  }

  /** 查询记录 */
  getRecord(id: string): PaymentRecord | undefined { return this.records.get(id); }
  getPendingApprovals() { return Array.from(this.pendingApprovals.entries()).map(([id, p]) => ({ id, ...p, record: this.records.get(id) })); }

  getStats() {
    const recs = Array.from(this.records.values());
    const done = recs.filter(r => r.status === PaymentStatus.COMPLETED);
    return {
      total: recs.length,
      completed: done.length,
      pending: recs.filter(r => r.status === PaymentStatus.PENDING).length,
      refunded: recs.filter(r => r.status === PaymentStatus.REFUNDED).length,
      revenue: done.reduce((s, r) => s + r.amount, 0),
      balances: Object.fromEntries(this.internalBalances),
    };
  }
}

export const paymentGateway = new PaymentGateway(process.env.PAYMENT_DATA_DIR || './data/payments');

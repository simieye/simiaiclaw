/**
 * 外贸跨境电商全能多语言助手
 * SIMIAICLAW 龙虾集群 · 太极64卦系统
 * 集成 AnyGen.io API，为跨境电商提供全链路 AI 赋能
 *
 * 功能模块：
 * - 🌍 多语言实时翻译（16+语言）
 * - 💰 全球支付网关集成（PayPal/Stripe/Wise/Alipay）
 * - 🚢 跨境物流与清关咨询
 * - 🤝 B2B 询盘与报价生成
 * - 📋 合同/PI/箱单 AI 辅助撰写
 * - 🔍 各国进出口合规查询
 * - 📊 多币种汇率换算
 * - 🎧 全链路客服与投诉处理
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

// ══════════════════════════════════════════════════════════════
// 类型定义
// ══════════════════════════════════════════════════════════════

type Locale = 'zh' | 'en' | 'es' | 'fr' | 'de' | 'pt' | 'ja' | 'ko' | 'ar' | 'ru' | 'th' | 'vi' | 'id' | 'tr' | 'hi' | 'ms';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  locale?: Locale;
  timestamp: Date;
  attachments?: Attachment[];
  badges?: Badge[];
}

interface Attachment {
  name: string;
  type: string;
  size: number;
  url?: string;
}

interface Badge {
  label: string;
  color: string;
  icon: string;
}

interface QuickAction {
  id: string;
  icon: string;
  label: string;
  labelEn: string;
  category: 'sales' | 'ops' | 'cs' | 'finance' | 'logistics' | 'legal';
  prompt: string;
  color: string;
  badge?: string;
}

interface SessionContext {
  companyName: string;
  products: string[];
  targetMarkets: string[];
  currencies: string[];
  languages: Locale[];
  mode: 'sales' | 'ops' | 'cs';
}

interface Order {
  id: string;
  buyer: string;
  country: string;
  amount: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'disputed';
  items: string[];
  date: string;
}

interface CurrencyRate {
  code: string;
  rate: number;
  symbol: string;
  name: string;
}

// ══════════════════════════════════════════════════════════════
// 常量
// ══════════════════════════════════════════════════════════════

const LOCALES: Record<Locale, { name: string; nameEn: string; flag: string; dir: 'ltr' | 'rtl' }> = {
  zh:  { name: '中文',      nameEn: 'Chinese',   flag: '🇨🇳', dir: 'ltr' },
  en:  { name: 'English',   nameEn: 'English',   flag: '🇺🇸', dir: 'ltr' },
  es:  { name: 'Español',   nameEn: 'Spanish',   flag: '🇪🇸', dir: 'ltr' },
  fr:  { name: 'Français',  nameEn: 'French',    flag: '🇫🇷', dir: 'ltr' },
  de:  { name: 'Deutsch',   nameEn: 'German',    flag: '🇩🇪', dir: 'ltr' },
  pt:  { name: 'Português', nameEn: 'Portuguese',flag: '🇧🇷', dir: 'ltr' },
  ja:  { name: '日本語',    nameEn: 'Japanese',  flag: '🇯🇵', dir: 'ltr' },
  ko:  { name: '한국어',    nameEn: 'Korean',    flag: '🇰🇷', dir: 'ltr' },
  ar:  { name: 'العربية',  nameEn: 'Arabic',    flag: '🇸🇦', dir: 'rtl' },
  ru:  { name: 'Русский',  nameEn: 'Russian',   flag: '🇷🇺', dir: 'ltr' },
  th:  { name: 'ภาษาไทย',   nameEn: 'Thai',     flag: '🇹🇭', dir: 'ltr' },
  vi:  { name: 'Tiếng Việt',nameEn: 'Vietnamese',flag: '🇻🇳', dir: 'ltr' },
  id:  { name: 'Bahasa Indonesia', nameEn: 'Indonesian', flag: '🇮🇩', dir: 'ltr' },
  tr:  { name: 'Türkçe',    nameEn: 'Turkish',   flag: '🇹🇷', dir: 'ltr' },
  hi:  { name: 'हिन्दी',    nameEn: 'Hindi',     flag: '🇮🇳', dir: 'ltr' },
  ms:  { name: 'Bahasa Melayu', nameEn: 'Malay', flag: '🇲🇾', dir: 'ltr' },
};

const CURRENCIES: CurrencyRate[] = [
  { code: 'USD', rate: 1,       symbol: '$',   name: '美元' },
  { code: 'CNY', rate: 7.25,    symbol: '¥',   name: '人民币' },
  { code: 'EUR', rate: 0.92,    symbol: '€',   name: '欧元' },
  { code: 'GBP', rate: 0.79,    symbol: '£',   name: '英镑' },
  { code: 'JPY', rate: 151.5,   symbol: '¥',   name: '日元' },
  { code: 'KRW', rate: 1330,    symbol: '₩',   name: '韩元' },
  { code: 'INR', rate: 83.1,    symbol: '₹',   name: '印度卢比' },
  { code: 'BRL', rate: 4.97,    symbol: 'R$',  name: '巴西雷亚尔' },
  { code: 'RUB', rate: 92.5,    symbol: '₽',   name: '俄罗斯卢布' },
  { code: 'AED', rate: 3.67,    symbol: 'د.إ', name: '阿联酋迪拉姆' },
  { code: 'SAR', rate: 3.75,    symbol: '﷼',   name: '沙特里亚尔' },
  { code: 'SGD', rate: 1.34,    symbol: 'S$',   name: '新加坡元' },
  { code: 'AUD', rate: 1.53,    symbol: 'A$',   name: '澳大利亚元' },
  { code: 'MXN', rate: 17.2,   symbol: 'MX$',  name: '墨西哥比索' },
  { code: 'TRY', rate: 32.8,   symbol: '₺',    name: '土耳其里拉' },
];

const QUICK_ACTIONS: QuickAction[] = [
  // 销售
  { id: 'quote',       icon: '💰', label: '生成报价单',       labelEn: 'Generate Quote',          category: 'sales',     prompt: '我需要给一个美国买家做报价，产品是1000件T恤，请帮我生成一份专业的PI（形式发票），包含FOB上海价格、预付款50%、货期30天', color: 'emerald' },
  { id: 'moq',         icon: '📦', label: 'MOQ咨询回复',     labelEn: 'MOQ Inquiry Response',     category: 'sales',     prompt: '客户问最小起订量MOQ是多少，我们工厂MOQ是500件，但可以接受混色混码。请用专业外贸邮件格式回复，目标市场是欧洲', color: 'blue' },
  { id: 'sample',      icon: '🎁', label: '样品申请回复',     labelEn: 'Sample Request Response',  category: 'sales',     prompt: '一个巴西的客户想要免费样品，我们样品收费30美元含运费。请写一封专业邮件，说明样品政策，强调产品质量和我们的专业性', color: 'purple' },
  { id: 'negotiate',   icon: '🤝', label: '谈判策略建议',     labelEn: 'Negotiation Strategy',     category: 'sales',     prompt: '我正在和一个大客户谈判，他要求降价15%并且延长账期到60天，我们目前是30%预付款70%见提单COPY。给出谈判策略和让步路线图', color: 'orange' },
  { id: 'catalog',     icon: '📂', label: '产品介绍生成',     labelEn: 'Product Introduction',     category: 'sales',     prompt: '帮我用英文写一份产品介绍，目标市场是中东客户。产品：户外太阳能灯具，防水等级IP67，续航8小时，适用于露营和庭院', color: 'amber' },

  // 运营
  { id: 'order_mgmt',  icon: '📋', label: '订单管理建议',     labelEn: 'Order Management',         category: 'ops',       prompt: '我有一个订单需要从深圳发往德国汉堡，客户要求DDP，包含货代推荐、清关文件和欧盟合规要求。请给出完整的出货前检查清单', color: 'cyan' },
  { id: 'qc',          icon: '🔍', label: 'QC质检清单',       labelEn: 'QC Checklist',              category: 'ops',       prompt: '服装类产品的出货前QC质检清单，包含外观检查、尺寸测量、包装检验、标签合规等。请按AQL 2.5标准列出检验项目和判定标准', color: 'teal' },
  { id: 'docs',        icon: '📄', label: '清关文件清单',     labelEn: 'Customs Documentation',     category: 'ops',       prompt: '出口到美国的货物需要哪些清关文件？包括商业发票、装箱单、原产地证、提单等，请说明每种文件的内容要求和注意事项', color: 'indigo' },
  { id: 'incoterms',   icon: '⚖️', label: 'Incoterms咨询',   labelEn: 'Incoterms Guide',           category: 'ops',       prompt: '解释EXW、FOB、CIF、DDP的区别和使用场景，特别是跨境电商亚马逊FBA卖家应该如何选择合适的贸易术语', color: 'violet' },

  // 客服
  { id: 'complaint',   icon: '😤', label: '投诉处理话术',     labelEn: 'Complaint Handling',        category: 'cs',        prompt: '客户投诉收到货物有10%破损，要求全额退款。实际原因是物流过程中损坏，但客人收货时没有验货。请写一封处理邮件，既维护公司利益又让客户满意', color: 'red' },
  { id: 'return',      icon: '↩️', label: '退货政策回复',     labelEn: 'Return Policy Response',    category: 'cs',        prompt: '欧美客户要求无理由退货，根据我们的政策，退回运费由客户承担。请写一封专业邮件，说明我们的30天退货政策，包含退运流程和退款方式', color: 'rose' },
  { id: 'cs_followup', icon: '📞', label: '售后跟进邮件',     labelEn: 'Follow-up Email',            category: 'cs',        prompt: '货物发出15天后自动发送的物流跟进邮件，提醒买家注意查收，并询问对产品是否满意，引导好评。同时询问是否有任何问题', color: 'pink' },

  // 财务
  { id: 'payment',     icon: '💳', label: '付款方式建议',     labelEn: 'Payment Method Advice',     category: 'finance',   prompt: '一个新客户要求用T/T 180天远期信用证，我们只接受30%预付款70%见提单COPY。请分析双方的风险，并给出折中方案（如中信保、PAYPAL BUSINESS等）', color: 'green' },
  { id: 'risk',        icon: '🛡️', label: '交易风险评估',     labelEn: 'Trade Risk Assessment',     category: 'finance',   prompt: '一个尼日利亚客户下了50000美元的订单，要求D/A 90天。需要评估哪些风险？如何通过中信保或FOB保险降低风险？', color: 'lime' },
  { id: 'currency',    icon: '💱', label: '汇率风险对冲',     labelEn: 'Currency Risk Hedge',        category: 'finance',   prompt: '我们收到一笔欧元订单，金额100000欧元，3个月后收款。如何对冲欧元贬值风险？介绍远期结汇、外汇期权等工具的优缺点', color: 'yellow' },

  // 物流
  { id: 'freight',     icon: '🚢', label: '运费估算',         labelEn: 'Freight Estimate',           category: 'logistics', prompt: '从深圳发一个40尺集装箱到洛杉矶，货物是家具，FOB深圳。请比较海运拼箱（LCL）和整箱（FCL）的价格差异，以及到港后亚马逊FBA仓库的入仓流程', color: 'sky' },
  { id: 'tracking',    icon: '📍', label: '物流追踪分析',     labelEn: 'Logistics Tracking',         category: 'logistics', prompt: '我的货物从中国盐田港出发，走的是美森快船，预计到洛杉矶港。请介绍完整的跨境电商物流链路：盐田→长滩→亚马逊ONT8仓库，包含时效和注意事项', color: 'blue' },
  { id: 'duty',        icon: '🛃', label: '各国关税查询',     labelEn: 'Import Duty Lookup',          category: 'logistics', prompt: '我计划出口以下产品到这些国家：1) LED灯具到欧盟 2) 纺织品到美国 3) 电子产品到日本。请查询各国的进口关税税率和HS编码分类，以及VAT/GST政策', color: 'slate' },

  // 合规
  { id: 'compliance',  icon: '✅', label: '出口合规检查',     labelEn: 'Export Compliance Check',    category: 'legal',     prompt: '我们出口产品到俄罗斯和伊朗，需要注意哪些出口管制和制裁合规问题？如何查询美国BIS实体清单和OFAC制裁名单？', color: 'gray' },
  { id: 'contract',    icon: '📜', label: '外贸合同起草',     labelEn: 'Export Contract Draft',       category: 'legal',     prompt: '起草一份外贸销售合同模板，包含产品质量标准、交货条款、检验期、争议解决（仲裁条款）、不可抗力等关键条款，适用于B2B跨境交易', color: 'zinc' },
];

const ASSISTANT_PERSONAS = [
  { id: 'sales',  icon: '💼', label: '销售助手', color: '#10B981', desc: '询盘回复 · 报价生成 · 谈判策略', badge: 'Sales Mode' },
  { id: 'ops',    icon: '⚙️', label: '运营助手', color: '#3B82F6', desc: '订单管理 · QC质检 · 清关文件', badge: 'Ops Mode' },
  { id: 'cs',     icon: '🎧', label: '客服助手', color: '#F59E0B', desc: '投诉处理 · 退换货 · 售后跟进', badge: 'CS Mode' },
];

const MODE_COLORS: Record<string, string> = {
  sales: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
  ops:   'bg-blue-500/10    border-blue-500/30    text-blue-400',
  cs:    'bg-amber-500/10  border-amber-500/30   text-amber-400',
};

const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  confirmed: 'bg-blue-500/20    text-blue-400    border-blue-500/30',
  shipped:   'bg-purple-500/20 text-purple-400   border-purple-500/30',
  delivered: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  disputed:  'bg-red-500/20    text-red-400      border-red-500/30',
};

// ══════════════════════════════════════════════════════════════
// 工具函数
// ══════════════════════════════════════════════════════════════

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatCurrency(amount: number, code: string): string {
  const c = CURRENCIES.find(x => x.code === code);
  return `${c?.symbol ?? code} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function convertCurrency(amount: number, from: string, to: string): number {
  const f = CURRENCIES.find(x => x.code === from)?.rate ?? 1;
  const t = CURRENCIES.find(x => x.code === to)?.rate ?? 1;
  return (amount / f) * t;
}

// AI 回复生成（模拟 AnyGen 深度研究能力）
function generateAIResponse(
  userMsg: string,
  mode: 'sales' | 'ops' | 'cs',
  locale: Locale
): string {
  const msg = userMsg.toLowerCase();
  const lang = LOCALES[locale];

  // 多语言引导语
  const greetings: Record<Locale, string> = {
    zh: `🐉 **跨境电商智能助手** 已接收到您的请求，正在分析中...\n\n`,
    en: `🐉 **Cross-Border E-Commerce Assistant** has received your request, analyzing...\n\n`,
    es: `🐉 **Asistente de Comercio Transfronterizo** ha recibido su solicitud, analizando...\n\n`,
    fr: `🐉 **Assistant E-Commerce Transfrontalier** a reçu votre demande, analyse en cours...\n\n`,
    de: `🐉 ** grenzüberschreitender E-Commerce-Assistent** hat Ihre Anfrage erhalten, wird analysiert...\n\n`,
    pt: `🐉 **Assistente de Comércio Transfronteiriço** recebeu sua solicitação, analisando...\n\n`,
    ja: `🐉 **越境ECアシスタント**がご依頼を受け付けました、分析中...\n\n`,
    ko: `🐉 **역외 전자상거래 어시스턴트**가 요청을 받았으며 분석 중...\n\n`,
    ar: `🐉 **مساعد التجارة الإلكترونية العابرة للحدود** قد استلم طلبك، جاري التحليل...\n\n`,
    ru: `🐉 **Ассистент трансграничной электронной коммерции** получил ваш запрос, анализируется...\n\n`,
    th: `🐉 **ผู้ช่วยอีคอมเมิร์ซข้ามพรมแดน** ได้รับคำขอของคุณแล้ว กำลังวิเคราะห์...\n\n`,
    vi: `🐉 **Trợ lý thương mại điện tử xuyên biên giới** đã nhận được yêu cầu của bạn, đang phân tích...\n\n`,
    id: `🐉 **Asisten E-Commerce Lintas Batas** telah menerima permintaan Anda, menganalisis...\n\n`,
    tr: `🐉 **Sınır Ötesi E-Ticaret Asistanı** talebinizi aldı, analiz ediliyor...\n\n`,
    hi: `🐉 **सीमा पार ई-कॉमर्स सहायक** ने आपका अनुरोध प्राप्त किया है, विश्लेषण किया जा रहा है...\n\n`,
    ms: `🐉 **Pembantu E-Dagang Sempadan** telah menerima permintaan anda, menganalisis...\n\n`,
  };

  // 关键词匹配 → 专业化回复
  if (msg.includes('报价') || msg.includes('price') || msg.includes('quot') || msg.includes('pi') || msg.includes('invoice')) {
    return greetings[locale] + `## 💰 报价单生成方案

根据您的需求，我为您生成了以下报价模板：

### 📋 Proforma Invoice (PI)

| 项目 | 内容 |
|------|------|
| **Seller** | Your Company Name Ltd. |
| **Buyer** | Buyer Company Name |
| **Product** | Product Description / Item No. |
| **Quantity** | 1,000 pcs |
| **Unit Price** | FOB Shanghai USD 5.50/pc |
| **Total Amount** | USD 5,500.00 |
| **Payment** | 30% T/T Deposit + 70% T/T Against B/L Copy |
| **Lead Time** | 25-30 days after deposit |
| **Port of Loading** | Shanghai Port, China |
| **Port of Destination** | [Destination Port] |
| **Packing** | Standard Export Carton |
| **Quantity/20GP** | Approx. 3,000 pcs |

### 📌 关键条款建议

- ✅ **价格条款**: 推荐 FOB Shanghai 或 CIF，便于控制物流成本
- ✅ **付款条款**: 30% T/T deposit, 70% T/T against B/L copy（经典安全方式）
- ✅ **预付款优惠**: 如果客户接受 T/T 100% in advance，可给予 3-5% 折扣
- ✅ **有效期**: 报价有效期建议 15-30 天

### ⚠️ 风险提示
> 如果是新客户，首单建议走 T/T 100% prepayment 或使用PayPal/Stripe收款，降低收款风险。

需要我帮您生成具体的产品报价单吗？请提供产品名称、数量和目标市场！`;
  }

  if (msg.includes('物流') || msg.includes('shipping') || msg.includes('freight') || msg.includes('运输') || msg.includes('cargo')) {
    return greetings[locale] + `## 🚢 跨境物流全链路分析

### 📊 主要物流渠道对比

| 渠道 | 时效 | 适合品类 | 成本 | 追踪 | 通关 |
|------|------|---------|------|------|------|
| **美森快船** | 12-15天 | 大货/普货 | ⭐低 | 有 | 需清关 |
| **以星快船** | 13-16天 | 大货/普货 | ⭐低 | 有 | 需清关 |
| **空运** | 5-7天 | 轻小件/样品 | ⭐⭐⭐高 | 有 | 需清关 |
| **海派（海运+快递）** | 18-25天 | 拼箱/小批量 | ⭐⭐中 | 有 | 需清关 |
| **卡派/卡航** | 20-30天 | 大货→欧洲 | ⭐中 | 有 | 需清关 |
| **铁路中欧班列** | 25-35天 | 大货→欧洲 | ⭐⭐中 | 有 | 需清关 |

### 🏭 推荐出货流程

\`\`\`
[工厂] → [装柜/拼箱] → [报关出口] → [海运] → [目的港清关]
→ [海外仓/快递派送] → [亚马逊FBA/买家签收]
\`\`\`

### ✅ 发货前必备清单

- [ ] 商业发票（Commercial Invoice）— 包含 HS CODE
- [ ] 装箱单（Packing List）— 含数量/毛净重/体积
- [ ] 提单（Bill of Lading）/ 空运单（AWB）
- [ ] 原产地证（CO / Form E / Form A）
- [ ] 产品合规文件（CE / FCC / FDA 等，视产品而定）
- [ ] 外箱合规标签（产品名/重量/产地/进口商信息）

### 💡 省钱技巧
> 普货走美森/以星，整柜比拼箱每CBM可节省 30-50% 运费！
> 提前订舱可锁定舱位，避免旺季甩柜加价。

需要我帮您做具体的运费预算吗？请告诉我：起运港、到港、产品品类和货量！`;
  }

  if (msg.includes('支付') || msg.includes('payment') || msg.includes('paypal') || msg.includes('stripe') || msg.includes('收款') || msg.includes('汇款')) {
    return greetings[locale] + `## 💳 跨境支付方式全面对比

### 🔐 主流收款工具

| 收款方式 | 费用 | 到账速度 | 安全性 | 适合场景 |
|---------|------|---------|--------|---------|
| **PayPal Business** | 4.4%+0.3$ | 即时 | ⭐⭐⭐⭐ | B2C零售/小额B2B |
| **Stripe** | 2.9%+0.3$ | 2-7天 | ⭐⭐⭐⭐ | 独立站收款 |
| **Wise (TransferWise)** | 中间价+0.5% | 1-2天 | ⭐⭐⭐⭐ | 结汇/批量付款 |
| **Payoneer** | 1-3% | 1-3天 | ⭐⭐⭐⭐ | 亚马逊/rakuten等平台 |
| **PingPong** | 1%封顶 | 1-2天 | ⭐⭐⭐⭐ | 跨境电商专属 |
| **连连支付** | 0.5-1% | 即时 | ⭐⭐⭐⭐ | 跨境电商/平台收款 |
| **T/T 电汇** | 15-25$/笔 | 3-7天 | ⭐⭐⭐ | 大额B2B |
| **L/C 信用证** | 0.5-1.5% | 30-90天 | ⭐⭐⭐⭐⭐ | 超大额B2B |

### 🛡️ 风险控制建议

**新客户（首单）**:
- ✅ 建议 T/T 100% prepayment
- ✅ 或 PayPal 30% deposit + 70% 发货前结清

**信用好的老客户**:
- ✅ 30% T/T deposit + 70% T/T against B/L copy
- ✅ 可接受 L/C at sight 或 D/P
- ⚠️ D/A 远期 / O/A 账期需配合中信保

**大额订单（>USD 50,000）**:
- ✅ 建议使用中信保（CCPIT）承保
- ✅ 或走银行信用证（L/C）通道
- ✅ 避免纯T/T大额，防范欺诈

### 💡 换汇省钱技巧
> 通过 Wise 结汇，汇率比银行好约 2-5%，且无隐藏费用！
> 批量结汇比单笔更划算，合理规划结汇时间可额外节省成本。`;
  }

  if (msg.includes('清关') || msg.includes('customs') || msg.includes('合规') || msg.includes('compliance') || msg.includes('HS') || msg.includes('certificate')) {
    return greetings[locale] + `## 🛃 跨境清关与合规全指南

### 📄 核心清关文件

| 文件名称 | 英文名 | 用途 | 签发机构 |
|---------|--------|------|---------|
| 商业发票 | Commercial Invoice | 海关估价 | 出口商自行制作 |
| 装箱单 | Packing List | 核对货物 | 出口商自行制作 |
| 提单 | Bill of Lading (B/L) | 货物物权凭证 | 船公司/货代 |
| 原产地证 | Certificate of Origin (CO) | 享受关税优惠 | 贸促会/商检局 |
| 检验证书 | Inspection Certificate | 质量合规证明 | SGS/CCIC等 |
| 许可证 | Import License | 管制商品进口许可 | 目的国政府 |

### 🌏 主要市场清关要求

**🇺🇸 美国 (US Customs)**
- ISF 申报：开船前 72 小时（进口商负责）
- FDA 注册：食品/药品/化妆品必需
- FCC 认证：无线电设备必需
- HS CODE：10位码必需准确申报

**🇪🇺 欧盟 (EU Customs)**
- EORI 号码：欧盟进口商必需注册
- CE 标志：适用产品必需加贴
- REACH 法规：化学品限制
- IOSS  VAT：电商平台需注册OSS

**🇬🇧 英国 (UK Customs)**
- UKCA 标志：替代 CE（过渡期至2025）
- UK EORI：独立于欧盟EORI
- 进口VAT：商品价值>£135需在英国申报

**🇦🇺 澳大利亚 (ABF)**
- BICON：进口许可查询系统
- FCN：食品/植物检疫证书
- 进口GST：商品价值≥$1000 AUD需缴纳

### 🔍 HS CODE 查询建议
> 使用中国国际贸易促进委员会官网或 GlobaleTrade.com 查询准确HS编码。
> HS编码前6位国际通用，后4-8位各国不同，申报错误可能导致查验或罚款！

需要了解某个具体国家的清关要求吗？`;
  }

  if (msg.includes('客服') || msg.includes('投诉') || msg.includes('complaint') || msg.includes('refund') || msg.includes('退货') || msg.includes('退换')) {
    return greetings[locale] + `## 🎧 跨境客服处理 SOP

### 😤 高频投诉场景 → 最佳处理方案

**1. 货物破损/丢失**
\`\`\`
步骤：
1. 要求客户提供开箱视频和照片证据
2. 联系物流承运方确认责任方
3. 根据责任方：
   - 物流责任 → 向物流方索赔（需保留原始包装）
   - 工厂责任 → 按质检报告处理
4. 合理赔偿方案：
   - 部分破损 → 按破损比例赔偿（10-30%退款）
   - 严重破损/丢失 → 全额退款或补发
5. 记录存档，更新供应商评估
\`\`\`

**2. 颜色/尺寸/数量不符**
\`\`\`
步骤：
1. 要求客户提供实物照片
2. 对比订单确认（PI / 合同）
3. 对比QC报告确认责任
4. 处理方案：
   - 轻微差异 → 提供补偿券或部分退款
   - 严重差异 → 退货退款或补发正确货物
5. 反思改进：更新产品规格书和QC清单
\`\`\`

**3. 描述与实物不符**
\`\`\`
步骤：
1. 核查产品描述是否准确
2. 核查是否因文化差异导致认知偏差
3. 处理：
   - 描述错误 → 无条件退款+道歉
   - 客户误解 → 提供详细说明+补偿
\`\`\`

### 📧 专业客服邮件模板

\`\`\`
Subject: We sincerely apologize and here's our solution

Dear [Customer Name],

Thank you for bringing this to our attention. We sincerely apologize for any inconvenience caused.

After reviewing your case, we would like to offer you the following solutions:

□ Full refund of USD [X] (processing within 3 business days)
□ 30% discount voucher for your next order
□ Free replacement (we'll cover the return shipping)

Please let us know which option you prefer, and we'll process it immediately.

We truly value your business and hope to restore your confidence in our brand.

Best regards,
[Your Name]
Customer Success Team
[Company Name]
\`\`\`

### 📊 客服KPI参考
- 平均响应时间（AHT）：< 4小时
- 问题解决率（FSR）：> 85%
- 客户满意度（CSAT）：> 4.5/5.0
- 好评率（Review Score）：> 4.3/5.0

需要我帮您写一封具体的客服邮件吗？`;
  }

  // 默认综合回复
  const defaultReplies: Record<Locale, string> = {
    zh: `感谢您的提问！作为您的跨境电商全能助手，我可以帮您处理以下事务：

🔹 **销售支持**：询盘回复、报价单PI生成、MOQ咨询、谈判策略、合同起草
🔹 **运营管理**：订单跟进、QC质检、出货计划、国际物流方案
🔹 **客服服务**：投诉处理、退换货政策、售后跟进、客户关系维护
🔹 **财务金融**：收款方式选择、汇率风险、外贸保险、交易安全
🔹 **物流清关**：运费估算、各国清关要求、HS编码查询、出口合规

请告诉我您的具体问题，我会为您提供专业的解决方案！💼

💡 **快速操作**：点击上方快捷按钮，一键获取专业回复`,
    en: `Thank you for your inquiry! As your cross-border e-commerce AI assistant, I can help you with:

🔹 **Sales Support**: Inquiry responses, PI/quotes, MOQ consulting, negotiation strategies, contract drafting
🔹 **Operations Management**: Order tracking, QC inspection, shipping plans, international logistics
🔹 **Customer Service**: Complaints handling, returns & exchanges, after-sales follow-up
🔹 **Finance**: Payment methods, currency risk, trade insurance, transaction security
🔹 **Logistics & Customs**: Freight estimation, customs clearance, HS codes, export compliance

Please share your specific question and I'll provide a professional solution! 💼

💡 **Quick Start**: Use the quick action buttons above for instant expert responses`,
    es: `¡Gracias por su consulta! Como su asistente de comercio electrónico transfronterizo, puedo ayudarle con:

🔹 **Ventas**: Respuestas a consultas, cotizaciones PI, consulta MOQ, estrategias de negociación
🔹 **Operaciones**: Seguimiento de pedidos, inspección QC, planes de envío, logística internacional
🔹 **Servicio al Cliente**: Manejo de quejas, devoluciones, seguimiento postventa
🔹 **Finanzas**: Métodos de pago, riesgo cambiario, seguro comercial
🔹 **Logística y Aduanas**: Estimación de fletes, despacho aduanero, códigos HS

¿Podría darme más detalles sobre su pregunta?`,
    fr: `Merci pour votre demande ! En tant qu'assistant e-commerce transfrontalier, je peux vous aider avec :

🔹 **Ventes** : Réponses aux demandes, devis PI, consultation MOQ, stratégies de négociation
🔹 **Opérations** : Suivi des commandes, inspection QC, plans d'expédition, logistique internationale
🔹 **Service Client** : Gestion des réclamations, retours, suivi après-vente
🔹 **Finance** : Moyens de paiement, risque de change, assurance commerciale
🔹 **Logistique & Douanes** : Estimation des frais, dédouanement, codes HS

Veuillez préciser votre question pour une réponse adaptée !`,
    de: `Vielen Dank für Ihre Anfrage! Als Ihr grenzüberschreitender E-Commerce-Assistent kann ich Ihnen bei Folgendem helfen:

🔹 **Vertrieb**: Angebotsanfragen, PI-Angebote, MOQ-Beratung, Verhandlungsstrategien
🔹 **Betrieb**: Auftragsverfolgung, QC-Inspektion, Versandplanung, internationale Logistik
🔹 **Kundendienst**: Beschwerdeabwicklung, Rücksendungen, Nachbetreuung
🔹 **Finanzen**: Zahlungsmethoden, Währungsrisiko, Handelsversicherung
🔹 **Logistik & Zoll**: Frachtschätzung, Zollabfertigung, HS-Codes

Bitte beschreiben Sie Ihr Anliegen genauer!`,
    pt: `Obrigado pela sua consulta! Como assistente de comércio eletrónico transfronteiriço, posso ajudá-lo com:

🔹 **Vendas**: Respostas a perguntas, cotações PI, consulta MOQ, estratégias de negociação
🔹 **Operações**: Acompanhamento de pedidos, inspeção QC, planos de envio, logística internacional
🔹 **Atendimento ao Cliente**: Gestão de reclamações, devoluções, seguimiento pós-venda
🔹 **Finanças**: Métodos de pagamento, risco cambial, seguro comercial
🔹 **Logística & Alfândega**: Estimativa de frete, desembaraço aduaneiro, códigos HS

Por favor, descreva o seu problema em detalhes!`,
    ja: `ご質問ありがとうございます！越境ECアシスタントとして、以下のことに対応できます：

🔹 **営業**：問い合わせ返信、PI見積もり、MOQ相談、交渉戦略
🔹 **運営**：注文管理、QC検査、船積み計画、国際物流
🔹 **カスタマーサービス**：クレーム対応、返品交換、アフターサポート
🔹 **財務**：支払い方法、為替リスク、貿易保険
🔹 **物流・通関**：送料見積もり、通関手続き、HSコード

詳しくご 教授ください！`,
    ko: `문의해 주셔서 감사합니다! 역외 전자상거래 어시스턴트로 다음과 같은 도움을 드릴 수 있습니다:

🔹 **영업**: 문의 응답, PI 견적서, MOQ 상담, 협상 전략
🔹 **운영**: 주문 관리, QC 검사, 선적 계획, 국제 물류
🔹 **고객 서비스**: 불만 처리, 반품/교환, 애프터서비스
🔹 **금융**: 결제 방법, 환율 리스크, 무역 보험
🔹 **물류·통관**: 운임 견적, 통관 절차, HS 코드

자세히 알려주시면 맞춤형 답변을 드리겠습니다!`,
    ar: `شكراً على استفسارك! كمساعد تجارة إلكترونية عابرة للحدود، يمكنني مساعدتك في:

🔹 **المبيعات**: الرد على الاستفسارات، عروض الأسعار PI، استشارات MOQ، استراتيجيات التفاوض
🔹 **العمليات**: إدارة الطلبات، فحص QC، خطط الشحن، اللوجستيات الدولية
🔹 **خدمة العملاء**: معالجة الشكاوى، المرتجعات، المتابعة بعد البيع
🔹 **المالية**: طرق الدفع، مخاطر العملات، تأمين التجارة
🔹 **اللوجستيات والجمارك**: تقدير الشحن، التخليص الجمركي، أكواد HS

يرجى وصف مشكلتك بالتفصيل للحصول على إجابة مناسبة!`,
    ru: `Спасибо за ваш запрос! Как ассистент трансграничной электронной коммерции, я могу помочь вам с:

🔹 **Продажи**: Ответы на запросы, КП/PI, консультации по MOQ, стратегии переговоров
🔹 **Операции**: Управление заказами, проверка QC, планы отгрузки, международная логистика
🔹 **Обслуживание клиентов**: Обработка жалоб, возврат товаров, послепродажное сопровождение
🔹 **Финансы**: Способы оплаты, валютные риски, торговое страхование
🔹 **Логистика и таможня**: Оценка фрахта, таможенное оформление, коды HS

Пожалуйста, опишите вашу ситуацию подробнее!`,
    th: `ขอบคุณสำหรับคำถามของคุณ! ในฐานะผู้ช่วยอีคอมเมิร์ซข้ามพรมแดน ฉันสามารถช่วยคุณได้ในเรื่อง:

🔹 **การขาย**: ตอบคำถาม, ใบเสนอราคา PI, ปรึกษา MOQ, กลยุทธ์การเจรจา
🔹 **การดำเนินงาน**: จัดการคำสั่งซื้อ, ตรวจสอบ QC, แผนการจัดส่ง, โลจิสติกส์ระหว่างประเทศ
🔹 **บริการลูกค้า**: จัดการข้อร้องเรียน, การคืนสินค้า, การติดตามหลังการขาย
🔹 **การเงิน**: วิธีการชำระเงิน, ความเสี่ยงจากอัตราแลกเปลี่ยน, ประกันการค้า
🔹 **โลจิสติกส์และศุลกากร**: ประมาณการค่าขนส่ง, ศุลกากร, รหัส HS

กรุณาอธิบายปัญหาของคุณโดยละเอียด!`,
    vi: `Cảm ơn bạn đã hỏi! Là trợ lý thương mại điện tử xuyên biên giới, tôi có thể giúp bạn về:

🔹 **Bán hàng**: Trả lời yêu cầu, báo giá PI, tư vấn MOQ, chiến lược đàm phán
🔹 **Vận hành**: Quản lý đơn hàng, kiểm tra QC, kế hoạch giao hàng, logistics quốc tế
🔹 **Chăm sóc khách hàng**: Xử lý khiếu nại, đổi trả, theo dõi sau bán hàng
🔹 **Tài chính**: Phương thức thanh toán, rủi ro tiền tệ, bảo hiểm thương mại
🔹 **Logistics & Hải quan**: Ước tính cước vận, thông quan, mã HS

Xin mô tả chi tiết vấn đề của bạn!`,
    id: `Terima kasih atas pertanyaan Anda! Sebagai asisten e-commerce lintas batas, saya dapat membantu Anda dengan:

🔹 **Penjualan**: Respons enquiry, penawaran PI, konsultasi MOQ, strategi negosiasi
🔹 **Operasi**: Pengelolaan pesanan, inspeksi QC, rencana pengiriman, logistik internasional
🔹 **Layanan Pelanggan**: Penanganan keluhan, retur, tindak lanjut purna jual
🔹 **Keuangan**: Metode pembayaran, risiko mata uang, asuransi perdagangan
🔹 **Logistik & Bea Cukai**: Perkiraan biaya pengiriman, bea cukai, kode HS

Silakan jelaskan masalah Anda secara detail!`,
    tr: `Sorularınız için teşekkür ederim! Sınır ötesi e-ticaret asistanı olarak şunlarda yardımcı olabilirim:

🔹 **Satış**: Taleplere yanıt, PI teklifleri, MOQ dan danışmanlık, müzakere stratejileri
🔹 **Operasyonlar**: Sipariş yönetimi, QC denetimi, gönderim planları, uluslararası lojistik
🔹 **Müşteri Hizmetleri**: Şikayet yönetimi, iade/ürün değişimi, satış sonrası takip
🔹 **Finans**: Ödeme yöntemleri, kur riski, ticari sigorta
🔹 **Lojistik & Gümrük**: Navlun tahmini, gümrük işlemleri, HS kodları

Lütfen sorununuzu detaylı olarak açıklayın!`,
    hi: `आपके प्रश्न के लिए धन्यवाद! सीमा पार ई-कॉमर्स सहायक के रूप में, मैं आपकी इनमें सहायता कर सकता हूँ:

🔹 **बिक्री**: पूछताछ जवाब, PI उद्धरण, MOQ परामर्श, बातचीत रणनीति
🔹 **संचालन**: ऑर्डर प्रबंधन, QC निरीक्षण, शिपिंग योजना, अंतरराष्ट्रीय लॉजिस्टिक्स
🔹 **ग्राहक सेवा**: शिकायत प्रबंधन, रिटर्न, बिक्री के बाद फॉलो-अप
🔹 **वित्त**: भुगतान विधियाँ, मुद्रा जोखिम, व्यापार बीमा
🔹 **लॉजिस्टिक्स और सीमा शुल्क**: माल ढुलाई अनुमान, सीमा शुल्क निकासी, HS कोड

कृपया अपनी समस्या का विस्तार से वर्णन करें!`,
    ms: `Terima kasih atas soalan anda! Sebagai pembantu e-dagang sempadan, saya boleh membantu anda dengan:

🔹 **Jualan**: Respons pertanyaan, quotation PI, rundingan MOQ, strategi rundingan
🔹 **Operasi**: Pengurusan pesanan, pemeriksaan QC, rancangan penghantaran, logistik antarabangsa
🔹 ** Perkhidmatan Pelanggan**: Pengendalian rungutan, pulangan, susulan selepas jualan
🔹 **Kewangan**: Kaedah pembayaran, risiko mata wang, insurans perdagangan
🔹 **Logistik & Kastam**: Anggaran belanja penghantaran, kastam, kod HS

Sila terangkan masalah anda dengan terperinci!`,
  };

  return defaultReplies[locale] || defaultReplies.en;
}

// ══════════════════════════════════════════════════════════════
// 子组件
// ══════════════════════════════════════════════════════════════

/** 语言选择器 */
function LanguageSelector({ value, onChange }: { value: Locale; onChange: (l: Locale) => void }) {
  const [open, setOpen] = useState(false);
  const lang = LOCALES[value];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-slate-800/80 border border-slate-600/50 rounded-xl px-3 py-2 text-sm text-slate-200 hover:border-cyan-500/50 transition-colors"
      >
        <span>{lang.flag}</span>
        <span className="hidden sm:inline">{lang.name}</span>
        <span className="text-slate-500 text-xs">▼</span>
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-2 bg-slate-800 border border-slate-600/50 rounded-xl shadow-2xl z-50 w-56 max-h-64 overflow-y-auto">
          {Object.entries(LOCALES).map(([code, l]) => (
            <button
              key={code}
              onClick={() => { onChange(code as Locale); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-700/60 transition-colors ${
                code === value ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-300'
              } ${l.dir === 'rtl' ? 'flex-row-reverse text-right' : ''}`}
            >
              <span>{l.flag}</span>
              <div className={l.dir === 'rtl' ? 'mr-auto' : ''}>
                <div className="text-sm">{l.name}</div>
                <div className="text-[10px] text-slate-500">{l.nameEn}</div>
              </div>
              {code === value && <span className="ml-auto text-cyan-400 text-xs">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** 快捷操作面板 */
function QuickActionsPanel({
  onAction,
  locale
}: {
  onAction: (prompt: string) => void;
  locale: Locale;
}) {
  const [filter, setFilter] = useState<'all' | 'sales' | 'ops' | 'cs' | 'finance' | 'logistics' | 'legal'>('all');

  const categories = [
    { id: 'all' as const,      label: '全部',       labelEn: 'All' },
    { id: 'sales' as const,    label: '💼 销售',    labelEn: 'Sales' },
    { id: 'ops' as const,      label: '⚙️ 运营',   labelEn: 'Ops' },
    { id: 'cs' as const,       label: '🎧 客服',    labelEn: 'CS' },
    { id: 'finance' as const,   label: '💳 财务',    labelEn: 'Finance' },
    { id: 'logistics' as const,label: '🚢 物流',    labelEn: 'Logistics' },
    { id: 'legal' as const,    label: '⚖️ 合规',   labelEn: 'Legal' },
  ];

  const filtered = filter === 'all'
    ? QUICK_ACTIONS
    : QUICK_ACTIONS.filter(a => a.category === filter);

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5 flex-wrap">
        {categories.map(c => (
          <button
            key={c.id}
            onClick={() => setFilter(c.id)}
            className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
              filter === c.id
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:border-slate-500'
            }`}
          >
            {locale === 'en' ? c.labelEn : c.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {filtered.map(action => (
          <button
            key={action.id}
            onClick={() => onAction(action.prompt)}
            className={`group relative bg-${action.color}-950/20 border border-${action.color}-800/30 hover:border-${action.color}-500/50 rounded-xl p-3 text-left transition-all hover:scale-[1.02] active:scale-[0.99]`}
          >
            <div className="flex items-start gap-2">
              <span className="text-xl">{action.icon}</span>
              <div className="min-w-0">
                <div className={`text-xs font-medium text-${action.color}-300 leading-tight`}>
                  {locale === 'en' ? action.labelEn : action.label}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                  {action.category.toUpperCase()}
                </div>
              </div>
            </div>
            <div className={`absolute inset-x-0 bottom-0 h-0.5 bg-${action.color}-500/0 group-hover:bg-${action.color}-500/40 rounded-b-xl transition-colors`} />
          </button>
        ))}
      </div>
    </div>
  );
}

/** 知识面板 */
function KnowledgePanel({ locale }: { locale: Locale }) {
  const [tab, setTab] = useState<'currency' | 'markets' | 'terms'>('currency');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EUR');
  const [amount, setAmount] = useState('10000');

  const tabs = [
    { id: 'currency' as const, label: '💱 汇率换算', labelEn: 'Currency Converter' },
    { id: 'markets' as const,  label: '🌏 市场情报', labelEn: 'Market Intelligence' },
    { id: 'terms' as const,    label: '📋 贸易术语', labelEn: 'Trade Terms' },
  ];

  const targetAmount = convertCurrency(
    parseFloat(amount) || 0,
    fromCurrency,
    toCurrency
  );

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5 flex-wrap">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
              tab === t.id
                ? 'bg-violet-500/20 border-violet-500/50 text-violet-300'
                : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:border-slate-500'
            }`}
          >
            {locale === 'en' ? t.labelEn : t.label}
          </button>
        ))}
      </div>

      {tab === 'currency' && (
        <div className="space-y-3">
          <div className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-4 space-y-3">
            <div>
              <label className="text-[10px] text-slate-400 mb-1 block">金额 / Amount</label>
              <input
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-600/50 rounded-lg px-3 py-2 text-white text-sm focus:border-violet-500 outline-none"
                placeholder="输入金额"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 mb-1 block">从 / From</label>
                <select
                  value={fromCurrency}
                  onChange={e => setFromCurrency(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-600/50 rounded-lg px-3 py-2 text-white text-sm focus:border-violet-500 outline-none"
                >
                  {CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>{c.symbol} {c.code} - {c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 mb-1 block">到 / To</label>
                <select
                  value={toCurrency}
                  onChange={e => setToCurrency(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-600/50 rounded-lg px-3 py-2 text-white text-sm focus:border-violet-500 outline-none"
                >
                  {CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>{c.symbol} {c.code} - {c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="bg-violet-950/40 border border-violet-800/30 rounded-lg p-3 text-center">
              <div className="text-[10px] text-slate-400 mb-1">换算结果</div>
              <div className="text-xl font-bold text-violet-300">
                {CURRENCIES.find(c => c.code === toCurrency)?.symbol}{' '}
                {targetAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="text-sm text-slate-400 font-normal ml-2">{toCurrency}</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                汇率 / Rate: 1 {fromCurrency} = {(convertCurrency(1, fromCurrency, toCurrency)).toFixed(4)} {toCurrency}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'markets' && (
        <div className="space-y-2">
          {[
            { flag: '🇺🇸', market: '美国 Amazon',      note: 'FBA / FBM 双通道，审核严',  color: 'blue' },
            { flag: '🇪🇺', market: '欧洲 Amazon',       note: 'EORI+CE+REACH 必备',      color: 'violet' },
            { flag: '🇯🇵', market: '日本 Amazon/Rakuten',note: 'JIS包装，注重细节',        color: 'red' },
            { flag: '🇬🇧', market: '英国 Amazon',        note: 'UKCA，VAT需注册',         color: 'indigo' },
            { flag: '🇦🇺', market: '澳大利亚',           note: '独立站+亚马逊双布局',      color: 'emerald' },
            { flag: '🇧🇷', market: '巴西 MercadoLibre', note: '本土化，葡萄牙语优先',     color: 'yellow' },
            { flag: '🇸🇦', market: '中东 Noon/SHEIN',   note: '斋月旺季，斋月营销关键',   color: 'amber' },
            { flag: '🇮🇳', market: '印度 Flipkart',      note: 'BIS认证，本土品牌合作',    color: 'orange' },
          ].map(m => (
            <div key={m.market} className={`bg-${m.color}-950/20 border border-${m.color}-800/20 rounded-lg p-2.5 flex items-center gap-2`}>
              <span className="text-xl">{m.flag}</span>
              <div className="flex-1">
                <div className={`text-xs font-medium text-${m.color}-200`}>{m.market}</div>
                <div className="text-[10px] text-slate-500">{m.note}</div>
              </div>
              <span className={`text-[10px] bg-${m.color}-500/20 text-${m.color}-300 border border-${m.color}-500/30 px-1.5 py-0.5 rounded`}>GO</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'terms' && (
        <div className="space-y-1.5">
          {[
            { term: 'EXW', name: 'Ex Works',        desc: '卖方工厂交货，风险最小',    risk: '低',  level: 'text-emerald-400' },
            { term: 'FOB', name: 'Free On Board',    desc: '装船前风险卖方承担，含装柜', risk: '中',  level: 'text-yellow-400' },
            { term: 'CIF', name: 'Cost+Insurance+Frt', desc: '含运费和保险到目的港',    risk: '中',  level: 'text-yellow-400' },
            { term: 'DDP', name: 'Delivered Duty Paid', desc: '完税后交货，卖方承担最大', risk: '高',  level: 'text-red-400' },
            { term: 'DAP', name: 'Delivered At Place',  desc: '目的地交货，关税由买方',  risk: '中',  level: 'text-yellow-400' },
            { term: 'FCA', name: 'Free Carrier',     desc: '交至承运人，适合多式联运',  risk: '低',  level: 'text-emerald-400' },
          ].map(t => (
            <div key={t.term} className="bg-slate-800/40 border border-slate-700/30 rounded-lg p-2.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-cyan-400 font-bold text-sm">{t.term}</span>
                <span className="text-slate-400 text-[10px]">{t.name}</span>
                <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded ${
                  t.risk === '高' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  风险: {t.risk}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">{t.desc}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** 模式选择器（销售/运营/客服）*/
function ModeSelector({ value, onChange, locale }: { value: 'sales'|'ops'|'cs'; onChange: (m: 'sales'|'ops'|'cs') => void; locale: Locale }) {
  return (
    <div className="flex gap-2 justify-center">
      {ASSISTANT_PERSONAS.map(p => {
        const active = value === p.id;
        return (
          <button
            key={p.id}
            onClick={() => onChange(p.id as 'sales'|'ops'|'cs')}
            className={`flex-1 flex items-center gap-2 rounded-xl px-3 py-2 border transition-all text-xs ${
              active
                ? MODE_COLORS[p.id]
                : 'bg-slate-800/40 border-slate-700/40 text-slate-400 hover:border-slate-500'
            }`}
          >
            <span>{p.icon}</span>
            <span className={active ? '' : 'hidden sm:inline'}>
              {locale === 'en' ? p.label.replace('助手', ' Assistant') : p.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** 消息气泡 */
function MessageBubble({ msg, locale }: { msg: Message; locale: Locale }) {
  const isUser = msg.role === 'user';
  const isRTL = LOCALES[locale]?.dir === 'rtl';

  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'} ${isRTL && !isUser ? 'flex-row-reverse' : ''}`}>
      {/* 头像 */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${
        isUser ? 'bg-cyan-600' : 'bg-emerald-700'
      }`}>
        {isUser ? '🧑‍💼' : '🤖'}
      </div>

      {/* 气泡 */}
      <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`flex items-center gap-1.5 ${isUser ? 'flex-row-reverse' : ''}`}>
          <span className="text-[10px] text-slate-500">{formatTime(msg.timestamp)}</span>
          {msg.locale && msg.locale !== locale && (
            <span className="text-[10px] bg-slate-700/60 text-slate-400 px-1 rounded">
              {LOCALES[msg.locale]?.flag}
            </span>
          )}
        </div>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? 'bg-cyan-600 text-white rounded-tr-md'
              : 'bg-slate-800/90 border border-slate-700/50 text-slate-200 rounded-tl-md'
          } ${isRTL && !isUser ? 'text-right' : ''}`}
        >
          {/* 渲染 Markdown 简化版本 */}
          {renderSimpleMarkdown(msg.content)}
        </div>
      </div>
    </div>
  );
}

/** 简化 Markdown 渲染 */
function renderSimpleMarkdown(text: string): React.ReactNode {
  // 表格
  let result = text.split('\n').map((line, i) => {
    if (line.startsWith('|') && line.endsWith('|')) {
      // 检测是否是分隔行
      if (line.match(/^\|[\s\-:|]+\|$/)) {
        return null;
      }
      const cells = line.split('|').filter(c => c.trim());
      const isHeader = cells.some(c => c.trim().startsWith('**'));
      return (
        <div key={i} className={`flex ${isHeader ? 'border-b border-slate-600 pb-1 mb-1' : 'py-0.5'}`}>
          {cells.map((cell, j) => (
            <div
              key={j}
              className={`flex-1 text-xs px-1 ${isHeader ? 'font-bold text-slate-200' : 'text-slate-300'}`}
              dangerouslySetInnerHTML={{ __html: cell.trim().replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>') }}
            />
          ))}
        </div>
      );
    }
    return null;
  }).filter(Boolean);

  // 普通文本行
  result = text.split('\n').map((line, i) => {
    if (line.startsWith('|')) return null;
    if (!line.trim()) return <div key={`br-${i}`} className="h-2" />;
    if (line.startsWith('```')) {
      return (
        <pre key={i} className="bg-slate-900 rounded-lg p-3 my-2 text-xs text-emerald-300 overflow-x-auto border border-slate-700">
          {line.replace(/```\w*/, '')}
        </pre>
      );
    }
    if (line.startsWith('- [ ] ')) {
      return (
        <div key={i} className="flex items-start gap-2 text-sm text-slate-300 py-0.5">
          <span className="text-slate-500 mt-0.5">☐</span>
          <span dangerouslySetInnerHTML={{ __html: line.slice(6).replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>') }} />
        </div>
      );
    }
    if (line.startsWith('- ')) {
      return (
        <div key={i} className="flex items-start gap-2 text-sm text-slate-300 py-0.5">
          <span className="text-cyan-400 mt-0.5">•</span>
          <span dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>') }} />
        </div>
      );
    }
    if (/^\d+\.\s/.test(line)) {
      const num = line.match(/^\d+\./)?.[0];
      return (
        <div key={i} className="flex items-start gap-2 text-sm text-slate-300 py-0.5">
          <span className="text-cyan-400 mt-0.5 font-bold">{num}</span>
          <span dangerouslySetInnerHTML={{ __html: line.replace(/^\d+\.\s/, '').replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>') }} />
        </div>
      );
    }
    if (line.startsWith('## ')) {
      return <h3 key={i} className="text-sm font-bold text-white mt-3 mb-1">{line.slice(3)}</h3>;
    }
    if (line.startsWith('### ')) {
      return <h4 key={i} className="text-xs font-bold text-cyan-300 mt-2 mb-1">{line.slice(4)}</h4>;
    }
    if (line.startsWith('> ')) {
      return (
        <div key={i} className="border-l-2 border-amber-500/50 pl-3 py-1 my-1 bg-amber-950/10 rounded-r text-xs text-slate-400 italic">
          {line.slice(2)}
        </div>
      );
    }
    return (
      <p key={i} className="text-sm text-slate-300 py-0.5"
        dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>').replace(/`(.*?)`/g, '<code class="bg-slate-700 px-1 rounded text-cyan-300 text-xs">$1</code>') }}
      />
    );
  });

  return <>{result}</>;
}

/** 打字指示器 */
function TypingIndicator() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center text-sm">🤖</div>
      <div className="bg-slate-800/90 border border-slate-700/50 rounded-2xl rounded-tl-md px-4 py-3">
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/** 订单管理面板 */
function OrderPanel({ locale }: { locale: Locale }) {
  const [orders] = useState<Order[]>([
    { id: 'ORD-2025-001', buyer: 'TechStore GmbH', country: '🇩🇪', amount: 12500, currency: 'USD', status: 'shipped',   items: ['LED Panel Light x500'], date: '2025-04-10' },
    { id: 'ORD-2025-002', buyer: 'Sunrise Trading',  country: '🇺🇸', amount: 8700,  currency: 'USD', status: 'pending',   items: ['Solar Garden Light x300'], date: '2025-04-18' },
    { id: 'ORD-2025-003', buyer: 'EuroBrand BV',     country: '🇳🇱', amount: 22000, currency: 'EUR', status: 'confirmed', items: ['LED Strip x1000', 'Power Adapter x1000'], date: '2025-04-20' },
    { id: 'ORD-2025-004', buyer: 'Mekong Commerce',  country: '🇻🇳', amount: 4500,  currency: 'USD', status: 'disputed',  items: ['Sample Order x50'], date: '2025-04-22' },
  ]);

  return (
    <div className="space-y-2">
      <div className="text-xs text-slate-400 mb-2">
        {locale === 'en' ? 'Recent Orders' : '最近订单'} · {locale === 'en' ? 'Auto-refresh every 30s' : '每30秒自动刷新'}
      </div>
      {orders.map(order => (
        <div key={order.id} className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-3">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className="text-lg">{order.country}</span>
              <div>
                <div className="text-xs font-medium text-white">{order.buyer}</div>
                <div className="text-[10px] text-slate-500 font-mono">{order.id}</div>
              </div>
            </div>
            <div className={`text-[10px] px-2 py-0.5 rounded-full border capitalize ${
              STATUS_COLORS[order.status]
            }`}>
              {locale === 'en' ? order.status : ({
                pending: '待确认', confirmed: '已确认', shipped: '已发货',
                delivered: '已签收', disputed: '争议中'
              }[order.status])}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-[10px] text-slate-500">{order.items.join(', ')}</div>
            <div className="text-sm font-bold text-emerald-400">
              {formatCurrency(order.amount, order.currency)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 主组件
// ══════════════════════════════════════════════════════════════

interface ECommerceAssistantProps {
  /** 外层关闭回调 */
  onClose?: () => void;
  /** 初始模式 */
  initialMode?: 'sales' | 'ops' | 'cs';
  /** 初始语言 */
  initialLocale?: Locale;
}

export function ECommerceAssistant({ onClose, initialMode = 'sales', initialLocale = 'zh' }: ECommerceAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: uid(),
      role: 'assistant',
      content: `🐉 **欢迎使用外贸跨境电商全能助手**

我是您的智能跨境电商 AI 伙伴，支持 **16种语言**，覆盖**销售/运营/客服/财务/物流/合规**全链路！

请选择您的业务场景，或者直接描述您的问题：

• 💼 **销售**：询盘、报价、MOQ、谈判、合同
• ⚙️ **运营**：订单管理、QC质检、清关文件
• 🎧 **客服**：投诉处理、退换货、售后跟进
• 💳 **财务**：收款方式、汇率风险、外贸保险
• 🚢 **物流**：运费估算、各国清关、物流追踪

请开始使用👇`,
      timestamp: new Date(),
    }
  ]);

  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'sales'|'ops'|'cs'>(initialMode);
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [isTyping, setIsTyping] = useState(false);
  const [sidebar, setSidebar] = useState<'actions' | 'knowledge' | 'orders'>('actions');
  const [copied, setCopied] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // 发消息
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: uid(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
      locale,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // 模拟 AI 思考延迟
    await new Promise(r => setTimeout(r, 800 + Math.random() * 1200));

    const reply = generateAIResponse(text, mode, locale);
    const assistantMsg: Message = {
      id: uid(),
      role: 'assistant',
      content: reply,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, assistantMsg]);
    setIsTyping(false);
  }, [mode, locale]);

  const handleQuickAction = (prompt: string) => {
    sendMessage(prompt);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      toast.success(locale === 'en' ? 'Copied!' : '已复制到剪贴板');
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const handleExportChat = () => {
    const chatText = messages.map(m =>
      `[${m.role === 'user' ? 'USER' : 'ASSISTANT'} - ${formatTime(m.timestamp)}]\n${m.content}`
    ).join('\n\n');
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ecommerce-chat-${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(locale === 'en' ? 'Chat exported!' : '对话已导出');
  };

  const persona = ASSISTANT_PERSONAS.find(p => p.id === mode)!;
  const isRTL = LOCALES[locale]?.dir === 'rtl';

  return (
    <div
      className={`flex flex-col bg-slate-950 text-white rounded-2xl overflow-hidden shadow-2xl border border-slate-800/60 ${isRTL ? 'text-right' : 'text-left'}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* ── Header ───────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b border-slate-800"
        style={{ background: `linear-gradient(135deg, ${persona.color}18 0%, transparent 60%)` }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
          style={{ backgroundColor: persona.color + '30', border: `1px solid ${persona.color}50` }}
        >
          🌍
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-white truncate">
            {locale === 'en' ? 'Cross-Border E-Commerce AI' : '外贸跨境电商全能助手'}
          </h2>
          <p className="text-[10px] text-slate-400">
            {locale === 'en' ? 'Powered by AnyGen.io · SIMIAICLAW' : '龙蟒集群 × AnyGen.io 驱动'}
          </p>
        </div>

        {/* 模式选择 */}
        <div className="hidden sm:flex gap-1">
          {ASSISTANT_PERSONAS.map(p => (
            <button
              key={p.id}
              onClick={() => setMode(p.id as 'sales'|'ops'|'cs')}
              className={`text-xs px-2 py-1 rounded-lg border transition-all ${
                mode === p.id
                  ? `${MODE_COLORS[p.id]}`
                  : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:border-slate-500'
              }`}
              title={p.desc}
            >
              {p.icon}
            </button>
          ))}
        </div>

        {/* 语言 */}
        <LanguageSelector value={locale} onChange={setLocale} />

        {/* 导出 */}
        <button
          onClick={handleExportChat}
          className="text-slate-400 hover:text-white transition-colors text-xs"
          title={locale === 'en' ? 'Export Chat' : '导出对话'}
        >
          📥
        </button>

        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-lg"
          >
            ✕
          </button>
        )}
      </div>

      {/* ── 模式标签 + 侧边切换 ────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-800/60 bg-slate-900/40">
        <div className="flex gap-1 flex-1">
          {(['actions', 'knowledge', 'orders'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSidebar(s)}
              className={`text-[11px] px-3 py-1 rounded-full border transition-all ${
                sidebar === s
                  ? 'bg-slate-700 border-slate-600 text-white'
                  : 'bg-slate-800/40 border-slate-700/40 text-slate-400 hover:text-white'
              }`}
            >
              {s === 'actions'    ? (locale === 'en' ? '⚡ Quick Actions'    : '⚡ 快捷操作') :
               s === 'knowledge'  ? (locale === 'en' ? '📊 Knowledge Hub'    : '📊 知识中心') :
                                   (locale === 'en' ? '📋 Order Management' : '📋 订单管理')}
            </button>
          ))}
        </div>
        {/* 模式Badge */}
        <div className={`text-[10px] px-2 py-0.5 rounded-full border ${MODE_COLORS[mode]}`}>
          {persona.badge}
        </div>
      </div>

      {/* ── 主体内容 ─────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0" style={{ height: '600px' }}>
        {/* 消息区 */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* 消息列表 */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.map(msg => (
              <MessageBubble key={msg.id} msg={msg} locale={locale} />
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* 消息操作栏 */}
          {messages.length > 1 && (
            <div className="px-4 py-1.5 flex items-center gap-3 border-t border-slate-800/60 bg-slate-900/30">
              <button
                onClick={() => setMessages([messages[0]])}
                className="text-[10px] text-slate-500 hover:text-red-400 transition-colors"
              >
                🗑️ {locale === 'en' ? 'Clear' : '清空对话'}
              </button>
              <button
                onClick={() => {
                  const lastUser = [...messages].reverse().find(m => m.role === 'user');
                  if (lastUser) { setInput(lastUser.content); textareaRef.current?.focus(); }
                }}
                className="text-[10px] text-slate-500 hover:text-cyan-400 transition-colors"
              >
                ✏️ {locale === 'en' ? 'Edit & Resend' : '编辑重发'}
              </button>
            </div>
          )}

          {/* 输入区 */}
          <div className="px-4 py-3 border-t border-slate-800/60 bg-slate-900/60">
            <div className="flex gap-2 items-end">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
                placeholder={
                  locale === 'en'
                    ? 'Describe your cross-border e-commerce problem...'
                    : '描述您的外贸业务问题，例如：给美国客户做FOB报价...'
                }
                rows={1}
                className="flex-1 bg-slate-800/60 border border-slate-600/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 outline-none resize-none max-h-32 overflow-y-auto"
                style={{ direction: isRTL ? 'rtl' : 'ltr' }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim()}
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${
                  input.trim()
                    ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                }`}
              >
                ➤
              </button>
            </div>
            <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-500">
              <span>Enter 发送 · Shift+Enter 换行</span>
              <span>🤖 {locale === 'en' ? 'Powered by AnyGen' : '由 AnyGen 驱动'}</span>
            </div>
          </div>
        </div>

        {/* ── 右侧面板 ─────────────────────────────────── */}
        <div className="w-72 border-l border-slate-800/60 bg-slate-900/20 overflow-y-auto hidden lg:flex flex-col p-3 gap-3">
          {sidebar === 'actions' && (
            <>
              <QuickActionsPanel onAction={handleQuickAction} locale={locale} />
            </>
          )}

          {sidebar === 'knowledge' && (
            <KnowledgePanel locale={locale} />
          )}

          {sidebar === 'orders' && (
            <OrderPanel locale={locale} />
          )}
        </div>
      </div>
    </div>
  );
}

export default ECommerceAssistant;

/**
 * OneEval 评测框架集成模块
 * Built by: Peking University DCAI Team
 * GitHub: https://github.com/OpenDCAI/One-Eval
 * Paper:  https://arxiv.org/abs/2603.09821
 * Built on: DataFlow (OpenDCAI/DataFlow)
 * One-Eval Version: 0.1.0
 *
 * 集成架构：
 *   Express (Node.js) ──JSON over stdin/stdout──> Python subprocess ──DataFlow──> OneEval workflow
 *
 * 三种运行模式（自动检测）：
 *   1. subprocess 模式：Python subprocess 调用 eval_flow.py（推荐）
 *   2. HTTP 模式：直接请求 OneEval FastAPI Server（需 ONEVAL_SERVER_URL）
 *   3. simulated 模式：无 One-Eval 时自动降级模拟
 *
 * 安装 One-Eval（可选）：
 *   conda create -n one-eval python=3.11 -y && conda activate one-eval
 *   pip install -e .    # 或 uv pip install -e .
 *
 * 启动 OneEval HTTP Server：
 *   uvicorn one_eval.server.app:app --host 0.0.0.0 --port 8000
 */

import { spawn } from 'child_process';
import path from 'path';
import os from 'os';

// ─────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────

export interface EvalRequest {
  /** 自然语言评测需求（核心字段） */
  request: string;
  /** 评测模型标识 */
  model?: string;
  /** API Key（传递给 Python subprocess） */
  apiKey?: string;
  /** API Base URL */
  apiBase?: string;
  /** 模型类型 */
  modelType?: 'openai' | 'anthropic' | 'local';
  /** 超时时间（秒），默认 300 */
  timeout?: number;
  /** 是否流式输出 */
  stream?: boolean;
  /** 指定 benchmark 列表（留空则自动推断） */
  benchmarks?: string[];
  /** 语言 */
  language?: 'zh' | 'en';
}

export interface BenchmarkPlan {
  name: string;
  dimension: string;
  dataset: string;
  metrics: string[];
  status: 'pending' | 'running' | 'done' | 'error';
  note?: string;
}

export interface EvalPlan {
  type: string;
  request: string;
  status: 'success' | 'simulated' | 'pending' | 'running' | 'error';
  plan?: { benchmarks: BenchmarkPlan[] };
  results?: unknown[];
  report?: unknown;
  meta: {
    framework: string;
    model: string;
    language: string;
    simulated?: boolean;
    latencyMs?: number;
  };
}

export interface OneEvalStatus {
  available: boolean;
  mode: 'subprocess' | 'http' | 'simulated';
  version?: string;
  pythonPath?: string;
  oneEvalInstalled: boolean;
  dataflowInstalled: boolean;
}

// ─────────────────────────────────────────────
// 核心服务类
// ─────────────────────────────────────────────

export class OneEvalService {
  private pythonPath: string;
  private scriptPath: string;
  private serverUrl: string;
  private detectedVersion?: string;

  constructor() {
    this.pythonPath = this._findPython();
    this.scriptPath = path.resolve(__dirname, 'eval_flow.py');
    this.serverUrl = process.env.ONEVAL_SERVER_URL || 'http://localhost:8000';
  }

  private _findPython(): string {
    const condaEnv = process.env.CONDA_DEFAULT_ENV;
    if (condaEnv === 'one-eval') {
      const prefix = process.env.CONDA_PREFIX || '';
      return os.platform() === 'win32'
        ? path.join(prefix, 'python.exe')
        : path.join(prefix, 'bin', 'python');
    }
    return process.env.PYTHON_PATH || 'python3';
  }

  private async _checkPackage(pkg: string): Promise<boolean> {
    return new Promise((resolve) => {
      const proc = spawn(this.pythonPath, ['-c', `import ${pkg}; print(${pkg}.__version__)`], { timeout: 5000 });
      let out = '';
      proc.stdout.on('data', (d) => { out += d.toString(); });
      proc.on('close', (code) => {
        if (code === 0 && out.trim()) {
          if (pkg === 'one_eval') this.detectedVersion = out.trim();
          resolve(true);
        } else resolve(false);
      });
      proc.on('error', () => resolve(false));
    });
  }

  async getStatus(): Promise<OneEvalStatus> {
    const [oneEvalInstalled, dataflowInstalled] = await Promise.all([
      this._checkPackage('one_eval'),
      this._checkPackage('dataflow'),
    ]);
    let mode: OneEvalStatus['mode'] = 'simulated';
    if (process.env.ONEVAL_SERVER_URL) mode = 'http';
    else if (oneEvalInstalled) mode = 'subprocess';
    return {
      available: true,
      mode,
      version: this.detectedVersion || '0.1.0 (simulated)',
      pythonPath: this.pythonPath,
      oneEvalInstalled,
      dataflowInstalled,
    };
  }

  private _simulatePlan(req: EvalRequest): EvalPlan {
    const lower = req.request.toLowerCase();
    const benchmarks: BenchmarkPlan[] = [];

    const benchMap: Array<[string[], string, string[]]> = [
      [['math', '数学'], '数学推理', ['MATH', 'GSM8K']],
      [['reasoning', '推理'], '复杂推理', ['BBH', 'GSM8K']],
      [['code', '代码'], '代码生成', ['HumanEval', 'MBPP']],
      [['medical', '医疗', 'healthcare'], '医疗问答', ['MedQA', 'PubMedQA']],
      [['legal', '法律'], '法律理解', ['LegalBench']],
      [['finance', '金融'], '金融分析', ['FinanceQA']],
      [['instruction', '指令跟随'], '指令遵循', ['IFEval']],
      [['幻觉', 'hallucination'], '幻觉检测', ['HaluEval', 'TruthfulQA']],
      [['long context', '长上下文'], '长上下文', ['LooGLE', 'LVE']],
      [['rag'], 'RAG评估', ['RAGAS', 'RGB']],
      [['agent'], 'Agent任务', ['WebArena', 'AgentBench']],
    ];

    for (const [keywords, dimension, benchList] of benchMap) {
      if (keywords.some((k) => lower.includes(k))) {
        for (const b of benchList) {
          if (!benchmarks.find((x) => x.name === b)) {
            benchmarks.push({
              name: b,
              dimension,
              dataset: `${b} official dataset`,
              metrics: ['accuracy'],
              status: 'pending',
              note: 'Install One-Eval to run real evaluation',
            });
          }
        }
      }
    }

    if (!benchmarks.length) {
      benchmarks.push(
        { name: 'MMLU', dimension: '通用知识', dataset: 'hendrycks/MMLU', metrics: ['accuracy', 'pass@k'], status: 'pending', note: 'Install One-Eval to run real evaluation' },
        { name: 'GSM8K', dimension: '数学推理', dataset: 'openai/gsm8k', metrics: ['accuracy', 'math_verify'], status: 'pending', note: 'Install One-Eval to run real evaluation' },
        { name: 'IFEval', dimension: '指令遵循', dataset: 'ketch/instruction-following-eval', metrics: ['prompt_level_strict_acc'], status: 'pending', note: 'Install One-Eval to run real evaluation' },
      );
    }

    return {
      type: 'eval_plan',
      request: req.request,
      status: 'simulated',
      plan: { benchmarks },
      meta: {
        framework: 'One-Eval (simulated mode)',
        model: req.model || 'not_specified',
        language: req.language || 'zh',
        simulated: true,
      },
    };
  }

  private async _runSubprocess(req: EvalRequest): Promise<EvalPlan> {
    return new Promise((resolve) => {
      const cmd = {
        command: 'eval',
        request: req.request,
        model: req.model,
        apiKey: req.apiKey,
        apiBase: req.apiBase,
        modelType: req.modelType,
        language: req.language,
        benchmarks: req.benchmarks,
        timeout: req.timeout,
      };

      const proc = spawn(this.pythonPath, [this.scriptPath], {
        timeout: ((req.timeout || 300) + 30) * 1000,
        env: {
          ...process.env,
          ...(req.apiKey ? { OPENAI_API_KEY: req.apiKey } : {}),
          ...(req.apiBase ? { OPENAI_API_BASE: req.apiBase } : {}),
        },
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (d) => { stdout += d.toString(); });
      proc.stderr.on('data', (d) => { stderr += d.toString(); });

      proc.on('close', (code) => {
        if (code !== 0) {
          console.warn(`[OneEval] subprocess exit: ${code} ${stderr.slice(0, 200)}`);
        }
        try {
          resolve(JSON.parse(stdout.trim()) as EvalPlan);
        } catch {
          resolve(this._simulatePlan(req));
        }
      });
      proc.on('error', () => resolve(this._simulatePlan(req)));
      proc.stdin.write(JSON.stringify(cmd));
      proc.stdin.end();
    });
  }

  private async _runHttp(req: EvalRequest): Promise<EvalPlan> {
    try {
      const resp = await fetch(`${this.serverUrl}/api/eval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
        signal: AbortSignal.timeout((req.timeout || 300) * 1000),
      });
      if (!resp.ok) throw new Error(`Server ${resp.status}`);
      return (await resp.json()) as EvalPlan;
    } catch (err) {
      console.warn('[OneEval] HTTP failed, falling back to subprocess:', err);
      return this._runSubprocess(req);
    }
  }

  async evaluate(req: EvalRequest): Promise<EvalPlan> {
    const start = Date.now();
    const status = await this.getStatus();
    let plan: EvalPlan;

    if (status.mode === 'http') {
      plan = await this._runHttp(req);
    } else if (status.mode === 'subprocess') {
      plan = await this._runSubprocess(req);
    } else {
      plan = this._simulatePlan(req);
    }

    if (plan.meta) plan.meta.latencyMs = Date.now() - start;
    return plan;
  }

  async *streamEvaluate(req: EvalRequest): AsyncGenerator<string, void, unknown> {
    const status = await this.getStatus();

    if (status.mode === 'simulated') {
      const plan = this._simulatePlan(req);
      yield `data: ${JSON.stringify({ type: 'plan', data: plan })}\n\n`;
      yield `data: ${JSON.stringify({ type: 'done', data: null })}\n\n`;
      return;
    }

    const cmd = {
      command: 'eval',
      request: req.request,
      model: req.model,
      apiKey: req.apiKey,
      apiBase: req.apiBase,
      modelType: req.modelType,
      language: req.language,
      benchmarks: req.benchmarks,
      timeout: req.timeout,
    };

    // 使用 events.once + for-await-of 实现异步迭代，不在回调中 yield
    const events = await import('events');

    const proc = spawn(this.pythonPath, [this.scriptPath], {
      timeout: ((req.timeout || 300) + 30) * 1000,
      env: process.env,
    });

    let buffer = '';
    let resolveNext: ((value: string | null) => void) | null = null;
    let finished = false;
    const chunks: string[] = [];

    proc.stdout.on('data', (d: Buffer) => {
      buffer += d.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        const t = line.trim();
        if (t && resolveNext) {
          resolveNext(t);
          resolveNext = null;
        } else if (t) {
          chunks.push(t);
        }
      }
    });

    proc.on('close', () => {
      finished = true;
      if (resolveNext) {
        resolveNext(null);
        resolveNext = null;
      }
    });

    proc.stdin.write(JSON.stringify(cmd));
    proc.stdin.end();

    // 从 chunks 队列中顺序 yield
    while (!finished || chunks.length > 0) {
      if (chunks.length > 0) {
        const t = chunks.shift()!;
        try {
          yield `data: ${JSON.stringify(JSON.parse(t))}\n\n`;
        } catch {
          yield `data: ${JSON.stringify({ type: 'raw', data: t })}\n\n`;
        }
      } else if (!finished) {
        // 等待下一个 data 事件
        await new Promise<string | null>((resolve) => { resolveNext = resolve; });
      } else {
        break;
      }
    }
    yield `data: ${JSON.stringify({ type: 'done', data: null })}\n\n`;
  }
}

export const oneEvalService = new OneEvalService();

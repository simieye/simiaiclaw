"""
One-Eval 工作流 Python 封装脚本
通过 subprocess 与 Node.js 主进程通信（JSON over stdin/stdout）
"""

import sys
import json
import os
from typing import Any

def _check_installed() -> tuple[bool, str]:
    try:
        import importlib
        importlib.import_module("one_eval")
        return True, "installed"
    except ImportError:
        return False, "not_installed"

def _run_workflow(natural_language_request: str, **kwargs) -> dict[str, Any]:
    installed, status = _check_installed()
    if not installed:
        return _simulate_workflow(natural_language_request, **kwargs)
    try:
        import subprocess
        import tempfile

        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".json", delete=False, encoding="utf-8"
        ) as f:
            task = {"request": natural_language_request, **kwargs}
            json.dump(task, f, ensure_ascii=False)
            task_file = f.name

        try:
            cmd = [sys.executable, "-m", "one_eval.graph.workflow_all", natural_language_request]
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=kwargs.get("timeout", 300),
                env={**os.environ, "PYTHONIOENCODING": "utf-8"},
            )
            if result.returncode != 0:
                print(json.dumps({
                    "type": "error",
                    "message": f"One-Eval subprocess failed: {result.stderr[:500]}",
                    "fallback": "simulated",
                }), file=sys.stderr)
                return _simulate_workflow(natural_language_request, **kwargs)
            try:
                return json.loads(result.stdout)
            except json.JSONDecodeError:
                return {
                    "type": "raw_output",
                    "stdout": result.stdout[:5000],
                    "stderr": result.stderr[:500],
                    "returncode": result.returncode,
                }
        finally:
            os.unlink(task_file)
    except Exception as e:
        print(json.dumps({"type": "error", "message": str(e), "fallback": "simulated"}), file=sys.stderr)
        return _simulate_workflow(natural_language_request, **kwargs)

def _simulate_workflow(request: str, **kwargs) -> dict[str, Any]:
    lower_req = request.lower()
    benchmarks = []
    dimensions = []
    BENCH_MAP = {
        "math": ["MATH", "GSM8K"], "数学": ["MATH", "GSM8K"],
        "reasoning": ["GSM8K", "BBH"], "推理": ["GSM8K", "BBH"],
        "code": ["HumanEval", "MBPP"], "代码": ["HumanEval", "MBPP"],
        "medical": ["MedQA", "PubMedQA"], "医疗": ["MedQA", "PubMedQA"],
        "healthcare": ["MedQA", "PubMedQA"],
        "法律": ["LegalBench", "LeCauna"], "legal": ["LegalBench", "LeCauna"],
        "金融": ["FinanceQA", "BBH-Finance"], "finance": ["FinanceQA", "BBH-Finance"],
        "instruction": ["IFEval"], "指令跟随": ["IFEval"],
        "mmlu": ["MMLU"],
        "幻觉": ["HaluEval", "TruthfulQA"],
        "hallucination": ["HaluEval", "TruthfulQA"],
        "long context": ["LooGLE", "LVE"], "长上下文": ["LooGLE", "LVE"],
        "rag": ["RAGAS", "RGB"],
        "agent": ["WebArena", "AgentBench"],
    }
    for keyword, bench_list in BENCH_MAP.items():
        if keyword in lower_req:
            for b in bench_list:
                if b not in benchmarks:
                    benchmarks.append(b)
                    dimensions.append(_dimension_of(b))
    if not benchmarks:
        benchmarks = ["MMLU", "GSM8K", "IFEval"]
        dimensions = ["知识理解", "数学推理", "指令遵循"]
    return {
        "type": "eval_plan",
        "request": request,
        "status": "simulated",
        "plan": {
            "benchmarks": [
                {"name": b, "dimension": dim, "dataset": _dataset_of(b),
                 "metrics": _metrics_of(b), "status": "pending",
                 "note": "Simulated: install One-Eval to run real evaluation"}
                for b, dim in zip(benchmarks, dimensions)
            ],
        },
        "meta": {
            "framework": "One-Eval (simulated mode)",
            "model": kwargs.get("model", "not_specified"),
            "language": "zh",
            "simulated": True,
        },
    }

def _dimension_of(bench: str) -> str:
    dim_map = {
        "MMLU": "通用知识", "CEval": "通用知识", "CMMLU": "通用知识",
        "GSM8K": "数学推理", "MATH": "数学推理", "AIME": "数学推理",
        "BBH": "复杂推理", "BBH-Finance": "金融推理",
        "HumanEval": "代码生成", "MBPP": "代码生成",
        "MedQA": "医疗问答", "PubMedQA": "医疗问答",
        "LegalBench": "法律理解", "LeCauna": "法律推理",
        "FinanceQA": "金融分析", "IFEval": "指令遵循",
        "HaluEval": "幻觉检测", "TruthfulQA": "幻觉检测",
        "LooGLE": "长上下文", "LVE": "长上下文",
        "RAGAS": "RAG评估", "RGB": "RAG评估",
        "WebArena": "Agent任务", "AgentBench": "Agent任务",
    }
    return dim_map.get(bench, "综合能力")

def _dataset_of(bench: str) -> str:
    ds_map = {
        "MMLU": "hendrycks/MMLU", "GSM8K": "openai/gsm8k",
        "MATH": "hendrycks/MATH", "IFEval": "ketch/instruction-following-eval",
        "MedQA": "bigbio/medqa", "TruthfulQA": "truthfulqa/truthfulqa_mc2",
        "HumanEval": "openai/openai_humaneval", "BBH": "bigscience/bloom-560m-bbh",
        "LegalBench": "nguha/legalbench",
    }
    return ds_map.get(bench, f"{bench} official dataset")

def _metrics_of(bench: str) -> list[str]:
    met_map = {
        "MMLU": ["accuracy", "pass@k"],
        "GSM8K": ["accuracy", "math_verify", "numerical_match"],
        "MATH": ["accuracy", "math_verify"],
        "IFEval": ["prompt_level_strict_acc", "prompt_level_loose_acc"],
        "MedQA": ["accuracy"], "TruthfulQA": ["mc2_metrics"],
        "HumanEval": ["pass@1", "pass@10"],
        "BBH": ["acc"],
    }
    return met_map.get(bench, ["accuracy"])

if __name__ == "__main__":
    try:
        raw = sys.stdin.read().strip()
        if not raw:
            if len(sys.argv) > 1:
                request = sys.argv[1]
                kwargs = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}
            else:
                print(json.dumps({"error": "No input provided"}))
                sys.exit(1)
        else:
            cmd = json.loads(raw)
            request = cmd.get("request", "")
            kwargs = {k: v for k, v in cmd.items() if k != "command"}
        if not request:
            print(json.dumps({"error": "Empty request"}))
            sys.exit(1)
        result = _run_workflow(request, **kwargs)
        print(json.dumps(result, ensure_ascii=False))
    except json.JSONDecodeError as e:
        print(json.dumps({"error": f"Invalid JSON: {e}"}))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

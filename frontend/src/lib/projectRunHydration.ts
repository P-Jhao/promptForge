import type { ProjectRunDraft } from "@/types/project";
import type { GenerationState } from "@/types/store";
import type { ValidationReport } from "@/types/validation";

/**
 * 将本地运行记录恢复为诊断摘要。页面重新打开时不能伪造仍在运行的请求，
 * 因此 running 会明确变为 cancelled，候选和加载状态由当前会话初始化。
 */
export function runRecordToGeneration(run: ProjectRunDraft | undefined): GenerationState | undefined {
  if (run === undefined) return undefined;
  const interrupted = run.status === "running";
  return {
    status: interrupted ? "cancelled" : run.status,
    runId: run.runId,
    validationReport: run.validationReport === undefined ? undefined : cloneValidationReport(run.validationReport),
    mode: run.mode,
    modeForced: run.modeForced,
    startedAt: run.startedAt,
    elapsedMs: run.endedAt === undefined ? undefined : Math.max(0, run.endedAt - run.startedAt),
    failedNode: run.failedNode,
    error: interrupted ? run.error ?? "该运行在页面关闭前未完成" : run.error,
    completedSteps: [],
    stageTimings: {},
    preservedResult: false,
  };
}

function cloneValidationReport(report: ValidationReport): ValidationReport {
  return {
    ...report,
    layers: report.layers.map((layer) => ({ ...layer })),
    repairHistory: report.repairHistory.map((attempt) => ({ ...attempt })),
  };
}

import { REPAIR_LIMITS } from "@/constants/validation";
import type { CandidateValidation } from "@/types/candidate";
import type {
  RepairAttempt,
  ValidationErrorCategory,
  ValidationLayer,
  ValidationLayerId,
  ValidationReport,
  ValidationStatus,
} from "@/types/validation";

export interface RepairContext {
  candidateId: string;
  attempt: number;
  runId: string;
  startedAt: number;
  errorSignature: string;
  previousHistory: RepairAttempt[];
}

export type RepairRequestContext = Omit<RepairContext, "runId">;

const LAYER_LABELS: Record<ValidationLayerId, string> = {
  L0: "协议完整性",
  L1: "源码完整性",
  L2: "预览运行",
  L3: "固定功能",
  L4: "保存恢复",
  L5: "有限修复",
};

export function createCandidateValidation(
  candidateId: string,
  runId: string,
  protocol: ValidationStatus = "pass",
  files: ValidationStatus = "pass",
  preview: ValidationStatus = "not-verified",
  repair?: RepairContext,
): CandidateValidation {
  const now = Date.now();
  const layers: ValidationLayer[] = [
    createLayer("L0", protocol, "SSE 与候选协议已完整接收"),
    createLayer("L1", files, "候选文件已通过路径、内容和大小校验"),
    createLayer("L2", preview, "等待真实 Sandpack 构建和应用挂载证据"),
    createLayer("L3", "skipped", "当前候选没有绑定固定任务看板场景"),
    createLayer("L4", "skipped", "保存恢复由用户确认后单独验收"),
    createLayer("L5", repair ? "not-verified" : "skipped", repair ? "修复候选等待重新验证" : "尚未触发有限修复"),
  ];
  const repairHistory = repair === undefined
    ? []
    : [...repair.previousHistory, {
      attempt: repair.attempt,
      runId: repair.runId,
      status: "not-verified" as const,
      durationMs: Math.max(0, now - repair.startedAt),
      errorSignature: repair.errorSignature,
    }];
  return {
    protocol,
    files,
    preview,
    report: {
      candidateId,
      runId,
      overall: deriveOverall(layers),
      layers,
      repairAttempts: repairHistory.length,
      repairDurationMs: repairHistory.reduce((total, item) => total + item.durationMs, 0),
      repairHistory,
      updatedAt: now,
    },
  };
}

export function updateValidationLayer(
  validation: CandidateValidation,
  id: ValidationLayerId,
  status: ValidationStatus,
  summary: string,
  evidence?: string,
  errorCategory?: ValidationErrorCategory,
): CandidateValidation {
  const now = Date.now();
  const hasRepair = validation.report.repairHistory.length > 0;
  const layers = validation.report.layers.map((layer) => {
    if (layer.id === id) return { ...layer, status, summary, evidence, errorCategory, updatedAt: now };
    if (id === "L2" && layer.id === "L5" && hasRepair) {
      return {
        ...layer,
        status,
        summary: status === "pass" ? "修复后重新验证通过" : status === "fail" ? "修复后重新验证失败" : "修复候选等待重新验证",
        updatedAt: now,
      };
    }
    return layer;
  });
  const repairHistory = id === "L2" && validation.report.repairHistory.length > 0
    ? validation.report.repairHistory.map((attempt, index, all) => index === all.length - 1 ? { ...attempt, status } : attempt)
    : validation.report.repairHistory;
  const report: ValidationReport = {
    ...validation.report,
    layers,
    overall: deriveOverall(layers),
    repairHistory,
    repairDurationMs: repairHistory.reduce((total, item) => total + item.durationMs, 0),
    updatedAt: now,
  };
  return {
    protocol: id === "L0" ? status : validation.protocol,
    files: id === "L1" ? status : validation.files,
    preview: id === "L2" ? status : validation.preview,
    report,
  };
}

export function deriveOverall(layers: readonly ValidationLayer[]): ValidationStatus {
  const required = layers.filter((layer) => layer.id === "L0" || layer.id === "L1" || layer.id === "L2");
  if (required.some((layer) => layer.status === "fail")) return "fail";
  if (required.some((layer) => layer.status === "not-verified")) return "not-verified";
  if (required.some((layer) => layer.status === "skipped")) return "skipped";
  return "pass";
}

export function canApplyValidation(validation: CandidateValidation): boolean {
  return validation.report.overall === "pass" &&
    validation.protocol === "pass" && validation.files === "pass" && validation.preview === "pass";
}

export function repairErrorSignature(validation: CandidateValidation): string | null {
  const layer = validation.report.layers.find((item) =>
    item.status === "fail" && (item.errorCategory === "build" || item.errorCategory === "runtime" || item.errorCategory === "resource"),
  );
  return layer === undefined ? null : `${layer.errorCategory}:${layer.summary}:${layer.evidence ?? ""}`;
}

export function canAttemptRepair(validation: CandidateValidation): boolean {
  const report = validation.report;
  if (report.repairAttempts >= REPAIR_LIMITS.maxAttempts || report.repairDurationMs >= REPAIR_LIMITS.totalBudgetMs) return false;
  const signature = repairErrorSignature(validation);
  if (signature === null || report.repairHistory.some((attempt) => attempt.errorSignature === signature)) return false;
  return true;
}

export function layerStatusLabel(status: ValidationStatus): string {
  return status === "pass" ? "通过" : status === "fail" ? "失败" : status === "skipped" ? "跳过" : "未验证";
}

export function layerLabel(id: ValidationLayerId): string {
  return LAYER_LABELS[id];
}

function createLayer(id: ValidationLayerId, status: ValidationStatus, summary: string): ValidationLayer {
  return { id, label: LAYER_LABELS[id], status, summary, updatedAt: Date.now() };
}

import type {
  RepairAttempt,
  ValidationErrorCategory,
  ValidationLayer,
  ValidationLayerId,
  ValidationReport,
  ValidationStatus,
} from "@/types/validation";

/** Parse the serializable validation summary stored with a project run. */
export function parseValidationReport(value: unknown): ValidationReport {
  const record = requireRecord(value, "校验报告");
  const layersValue = record.layers;
  if (!Array.isArray(layersValue) || layersValue.length !== 6) throw corrupt("校验层级不完整");
  const layers = layersValue.map(parseLayer);
  const ids = new Set(layers.map((layer) => layer.id));
  if (ids.size !== 6) throw corrupt("校验层级重复");
  const overall = requireStatus(record.overall, "校验总体状态");
  const repairHistory = parseRepairHistory(record.repairHistory);
  const repairAttempts = requireCount(record.repairAttempts, "修复次数");
  const repairDurationMs = requireCount(record.repairDurationMs, "修复耗时");
  if (overall !== deriveStoredOverall(layers)) throw corrupt("校验总体状态与层级不一致");
  if (repairAttempts !== repairHistory.length) throw corrupt("修复次数与记录不一致");
  if (repairDurationMs !== repairHistory.reduce((total, item) => total + item.durationMs, 0)) throw corrupt("修复耗时与记录不一致");
  return {
    candidateId: requireId(record.candidateId, "校验候选 ID"),
    runId: requireId(record.runId, "校验运行 ID"),
    overall,
    layers,
    repairAttempts,
    repairDurationMs,
    repairHistory,
    updatedAt: requireTimestamp(record.updatedAt, "校验更新时间"),
  };
}

function deriveStoredOverall(layers: ValidationLayer[]): ValidationStatus {
  const required = layers.filter((layer) => layer.id === "L0" || layer.id === "L1" || layer.id === "L2");
  if (required.some((layer) => layer.status === "fail")) return "fail";
  if (required.some((layer) => layer.status === "not-verified")) return "not-verified";
  if (required.some((layer) => layer.status === "skipped")) return "skipped";
  return "pass";
}

function parseLayer(value: unknown): ValidationLayer {
  const record = requireRecord(value, "校验层级");
  const id = requireLayerId(record.id);
  const evidence = record.evidence === undefined ? undefined : requireString(record.evidence, "校验证据");
  const errorCategory = record.errorCategory === undefined ? undefined : requireCategory(record.errorCategory);
  return {
    id,
    label: requireString(record.label, "校验层级名称"),
    status: requireStatus(record.status, `校验层级状态：${id}`),
    summary: requireString(record.summary, `校验层级摘要：${id}`),
    evidence,
    errorCategory,
    updatedAt: requireTimestamp(record.updatedAt, `校验层级更新时间：${id}`),
  };
}

function parseRepairHistory(value: unknown): RepairAttempt[] {
  if (!Array.isArray(value)) throw corrupt("修复记录不是数组");
  return value.map((item) => {
    const record = requireRecord(item, "修复记录");
    return {
      attempt: requirePositiveCount(record.attempt, "修复序号"),
      runId: requireId(record.runId, "修复运行 ID"),
      status: requireStatus(record.status, "修复状态"),
      durationMs: requireCount(record.durationMs, "单轮修复耗时"),
      errorSignature: requireString(record.errorSignature, "修复错误签名"),
    };
  });
}

function requireLayerId(value: unknown): ValidationLayerId {
  if (value === "L0" || value === "L1" || value === "L2" || value === "L3" || value === "L4" || value === "L5") return value;
  throw corrupt("校验层级 ID 无效");
}

function requireStatus(value: unknown, label: string): ValidationStatus {
  if (value === "pass" || value === "fail" || value === "skipped" || value === "not-verified") return value;
  throw corrupt(`${label}无效`);
}

function requireCategory(value: unknown): ValidationErrorCategory {
  const categories: ValidationErrorCategory[] = [
    "protocol", "source", "build", "runtime", "resource", "network", "external-timeout", "template", "storage", "conflict", "cancelled", "unknown",
  ];
  if (typeof value === "string" && categories.includes(value as ValidationErrorCategory)) return value as ValidationErrorCategory;
  throw corrupt("校验错误类别无效");
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw corrupt(`${label}格式无效`);
  return value as Record<string, unknown>;
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string") throw corrupt(`${label}必须是文本`);
  return value;
}

function requireId(value: unknown, label: string): string {
  const id = requireString(value, label);
  if (id.trim().length === 0 || id.length > 200 || id.includes("/")) throw corrupt(`${label}无效`);
  return id;
}

function requireTimestamp(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0) throw corrupt(`${label}无效`);
  return value;
}

function requireCount(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) throw corrupt(`${label}无效`);
  return value;
}

function requirePositiveCount(value: unknown, label: string): number {
  const count = requireCount(value, label);
  if (count < 1) throw corrupt(`${label}无效`);
  return count;
}

function corrupt(message: string): never {
  throw new Error(message);
}

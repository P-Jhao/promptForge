export type ValidationStatus = "pass" | "fail" | "skipped" | "not-verified";

export type ValidationLayerId = "L0" | "L1" | "L2" | "L3" | "L4" | "L5";

export type ValidationErrorCategory =
  | "protocol"
  | "source"
  | "build"
  | "runtime"
  | "resource"
  | "network"
  | "external-timeout"
  | "template"
  | "storage"
  | "conflict"
  | "cancelled"
  | "unknown";

export interface ValidationLayer {
  id: ValidationLayerId;
  label: string;
  status: ValidationStatus;
  summary: string;
  evidence?: string;
  errorCategory?: ValidationErrorCategory;
  updatedAt: number;
}

export interface RepairAttempt {
  attempt: number;
  runId: string;
  status: ValidationStatus;
  durationMs: number;
  errorSignature: string;
}

export interface ValidationReport {
  candidateId: string;
  runId: string;
  overall: ValidationStatus;
  layers: ValidationLayer[];
  repairAttempts: number;
  repairDurationMs: number;
  repairHistory: RepairAttempt[];
  updatedAt: number;
}

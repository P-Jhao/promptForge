import type { SerializableFileMap } from "./project";
import type { ValidationReport, ValidationStatus } from "./validation";

export type CandidateOperation = "create" | "edit";
export type CandidateStatus = "staged" | "conflict";

export interface CandidateChange {
  operation: "add" | "modify" | "delete";
  path: string;
  content?: string;
}

export interface CandidateResourceReference {
  id: string;
  kind: string;
  hostPath: string;
  sandpackPath: string;
  exportPath: string;
  contentType: string;
  contentHash: string | null;
  hashStatus: "known" | "unknown";
}

export interface CandidateValidation {
  protocol: ValidationStatus;
  files: ValidationStatus;
  preview: ValidationStatus;
  report: ValidationReport;
}

/** Serializable candidate data; it is deliberately separate from ThoughtItem. */
export interface CandidateState {
  candidateId: string;
  runId: string;
  projectId: string;
  baseVersionId: string | null;
  /** Original workspace hash used by applyStagedCandidate. */
  baseHash: string;
  /** Hash of the files/resources supplied to the model for this candidate. */
  modelBaseHash: string;
  /** Model name suggestion, applied only after the user applies a create candidate. */
  suggestedProjectName?: string;
  /** Project name captured before this request, used to preserve a manual rename. */
  projectNameAtRequest?: string;
  /** Present together for a candidate repaired from another staged candidate. */
  sourceCandidateId?: string;
  sourceBaseHash?: string;
  operation: CandidateOperation;
  prompt: string;
  assistantMessageId: string;
  files: SerializableFileMap;
  resources: CandidateResourceReference[];
  changes: CandidateChange[];
  summary: string;
  validation: CandidateValidation;
  status: CandidateStatus;
  conflictReason?: string;
  createdAt: number;
}

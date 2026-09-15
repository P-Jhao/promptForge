import type { SerializableFileMap } from "./project";

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
  protocol: "pass" | "fail";
  files: "pass" | "fail";
  preview: "not-verified" | "pass" | "fail";
}

/** Serializable candidate data; it is deliberately separate from ThoughtItem. */
export interface CandidateState {
  candidateId: string;
  runId: string;
  projectId: string;
  baseVersionId: string | null;
  baseHash: string;
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

import type { ProjectDraft } from "@/types/project";

/**
 * Keeps the last persisted baseline available while the SPA remounts a route.
 * The cache never contains the current draft, only a snapshot acknowledged by
 * IndexedDB after a successful read or write.
 */
export interface ProjectBaseline {
  projectId: string;
  revision: number;
  fingerprint: string;
  draft: ProjectDraft;
}

const baselines = new Map<string, ProjectBaseline>();

export function getProjectBaseline(projectId: string): ProjectBaseline | undefined {
  return baselines.get(projectId);
}

export function setProjectBaseline(baseline: ProjectBaseline): void {
  if (baseline.projectId.trim().length === 0) throw new Error("项目基线缺少项目 ID");
  if (!Number.isSafeInteger(baseline.revision) || baseline.revision < 1) {
    throw new Error("项目基线修订号无效");
  }
  if (baseline.fingerprint.length === 0) throw new Error("项目基线缺少指纹");
  baselines.set(baseline.projectId, baseline);
}

export function removeProjectBaseline(projectId: string): void {
  baselines.delete(projectId);
}

export function isCurrentBaselineRead(
  requestId: number,
  currentRequestId: number,
  targetProjectId: string,
  currentProjectId: string,
): boolean {
  return requestId === currentRequestId && targetProjectId === currentProjectId;
}

/** Used by deterministic storage fixtures and does not mutate the baseline cache. */
export function clearProjectBaselineCache(): void {
  baselines.clear();
}

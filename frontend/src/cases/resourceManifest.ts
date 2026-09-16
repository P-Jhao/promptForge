import type { SandpackFiles } from "@/types/store";

export type CaseResourceKind = "image" | "font" | "data";

export interface CaseResourceEntry {
  id: string;
  kind: CaseResourceKind;
  required: boolean;
  hostPath: string;
  sandpackPath: string;
  exportPath: string;
  contentType: string;
}

export interface CaseResourceManifest {
  version: 1;
  caseId: string;
  resources: readonly CaseResourceEntry[];
}

/**
 * One manifest is shared by the host case route, Sandpack and ZIP export.
 * The host path and app URL are root-relative. Sandpack's runtime resolves
 * preview requests by their exact root-relative file key, so the case keeps
 * the asset at /book-cover.svg and maps it to public/book-cover.svg on export.
 */
export const NOVEL_CASE_RESOURCE_MANIFEST: CaseResourceManifest = {
  version: 1,
  caseId: "novel-reading-management",
  resources: [
    {
      id: "book-cover",
      kind: "image",
      required: true,
      hostPath: "/book-cover.svg",
      sandpackPath: "/book-cover.svg",
      exportPath: "public/book-cover.svg",
      contentType: "image/svg+xml",
    },
  ],
};

/**
 * Validate that every required manifest resource is carried by the file map.
 * A browser-visible host URL alone is insufficient for Sandpack or export.
 */
export function validateResourceManifest(
  files: SandpackFiles,
  manifest: CaseResourceManifest,
): void {
  const seenIds = new Set<string>();
  const seenSandpackPaths = new Set<string>();

  for (const resource of manifest.resources) {
    if (seenIds.has(resource.id)) {
      throw new Error(`资源清单包含重复资源 ID：${resource.id}`);
    }
    seenIds.add(resource.id);

    if (seenSandpackPaths.has(resource.sandpackPath)) {
      throw new Error(`资源清单包含重复路径：${resource.sandpackPath}`);
    }
    seenSandpackPaths.add(resource.sandpackPath);

    if (!resource.required) continue;
    const file = files[resource.sandpackPath];
    if (file === undefined) {
      throw new Error(
        `案例资源缺失：${resource.id}（${resource.sandpackPath}）。无法启动完整预览或导出。`,
      );
    }
    if (file.code.trim().length === 0) {
      throw new Error(`案例资源为空：${resource.id}（${resource.sandpackPath}）。`);
    }
  }
}

export function getRequiredHostPaths(
  manifest: CaseResourceManifest,
): readonly string[] {
  return manifest.resources
    .filter((resource) => resource.required)
    .map((resource) => resource.hostPath);
}

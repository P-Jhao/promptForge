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

export interface CaseExternalResourceEntry {
  id: string;
  kind: CaseResourceKind;
  required: boolean;
  url: string;
  contentType: string;
  source: string;
}

export interface CaseResourceManifest {
  version: 1;
  caseId: string;
  resources: readonly CaseResourceEntry[];
  externalResources?: readonly CaseExternalResourceEntry[];
}

export const NOVEL_CASE_COVER_URLS = [
  "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&h=560&fit=crop",
  "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400&h=560&fit=crop",
  "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=560&fit=crop",
  "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=560&fit=crop",
  "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&h=560&fit=crop",
  "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=400&h=560&fit=crop",
] as const;

export const NOVEL_DEFAULT_COVER_URL = NOVEL_CASE_COVER_URLS[0];

const NOVEL_CASE_EXTERNAL_RESOURCES: readonly CaseExternalResourceEntry[] =
  NOVEL_CASE_COVER_URLS.map((url, index) => ({
    id: `book-cover-${String(index + 1).padStart(3, "0")}`,
    kind: "image" as const,
    required: true,
    url,
    contentType: "image/jpeg",
    source: "fixed-unsplash-allowlist",
  }));

/**
 * One manifest is shared by the host case route, Sandpack and ZIP export.
 * Novel covers are fixed external URLs: they are checked by the host and
 * recorded in the exported manifest, while no remote bytes are fabricated as
 * Sandpack or ZIP files.
 */
export const NOVEL_CASE_RESOURCE_MANIFEST: CaseResourceManifest = {
  version: 1,
  caseId: "novel-reading-management",
  resources: [],
  externalResources: NOVEL_CASE_EXTERNAL_RESOURCES,
};

/**
 * Validate local resources against the file map and external resources against
 * their URL policy. External resources are never expected in the file map.
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

  for (const resource of manifest.externalResources ?? []) {
    if (seenIds.has(resource.id)) {
      throw new Error(`资源清单包含重复资源 ID：${resource.id}`);
    }
    seenIds.add(resource.id);
    if (!/^https:\/\//.test(resource.url)) {
      throw new Error(`外部资源 URL 必须使用 HTTPS：${resource.id}`);
    }
    if (manifest.caseId === "novel-reading-management" && !isNovelCoverUrl(resource.url)) {
      throw new Error(`小说案例封面 URL 不在固定 allowlist：${resource.url}`);
    }
  }
}

export function getRequiredHostPaths(
  manifest: CaseResourceManifest,
): readonly string[] {
  return [
    ...manifest.resources
    .filter((resource) => resource.required)
    .map((resource) => resource.hostPath),
    ...(manifest.externalResources ?? [])
      .filter((resource) => resource.required)
      .map((resource) => resource.url),
  ];
}

function isNovelCoverUrl(value: string): boolean {
  return (NOVEL_CASE_COVER_URLS as readonly string[]).includes(value);
}

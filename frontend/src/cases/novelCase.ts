import { NOVEL_CASE_FILES } from "./generatedFiles";
import {
  NOVEL_CASE_RESOURCE_MANIFEST,
  validateResourceManifest,
  type CaseResourceManifest,
} from "./resourceManifest";

export type NovelCaseScene = "library" | "notes";

export interface NovelCaseFile {
  code: string;
}

export type NovelCaseFiles = Record<string, NovelCaseFile>;

export const NOVEL_CASE_MANIFEST: CaseResourceManifest =
  NOVEL_CASE_RESOURCE_MANIFEST;

/**
 * The case is assembled from the backend/mock outputs by
 * scripts/assembleNovelCase.mjs. The generated source tree is kept in the
 * repository so this preview does not call the chat or template APIs.
 */
export function createNovelCaseFiles(scene: NovelCaseScene): NovelCaseFiles {
  const files: NovelCaseFiles = {};
  for (const [path, source] of Object.entries(NOVEL_CASE_FILES)) {
    if (typeof source !== "string" || source.length === 0) {
      throw new Error(`Novel case bundle contains an empty source file: ${path}`);
    }
    files[path] = { code: source };
  }

  if (files["/App.tsx"] === undefined) {
    throw new Error("Novel case bundle is missing /App.tsx");
  }

  validateResourceManifest(files, NOVEL_CASE_MANIFEST);

  const route = scene === "notes" ? "/novels/novel_001" : "/novels";
  const marker = "export default function App() {";
  if (!files["/App.tsx"].code.includes(marker)) {
    throw new Error("Novel case bundle is missing the App route entry");
  }
  files["/App.tsx"].code = files["/App.tsx"].code.replace(
    marker,
    `${marker}\n  if (typeof window !== "undefined" && window.location.hash === "") { window.location.hash = "${route}"; }`,
  );
  return files;
}

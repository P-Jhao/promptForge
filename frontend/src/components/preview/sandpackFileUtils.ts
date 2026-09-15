import type { SandpackFiles } from "@/types/store";

export function toPlainFiles(files: SandpackFiles): Record<string, string> {
  return Object.fromEntries(Object.entries(files).map(([path, file]) => [path, file.code]));
}

export function toSandpackFiles(files: Record<string, string>): SandpackFiles {
  return Object.fromEntries(Object.entries(files).map(([path, code]) => [path, { code }]));
}

export function toStoreFiles(files: Record<string, unknown>): SandpackFiles {
  return Object.fromEntries(Object.entries(files).map(([path, file]) => {
    if (typeof file === "string") return [path, { code: file }];
    if (isRecord(file) && typeof file.code === "string") return [path, { code: file.code }];
    throw new Error(`Sandpack 返回了无效文件：${path}`);
  }));
}

export function formatSandpackError(error: unknown): string {
  if (isRecord(error) && typeof error.message === "string") return error.message;
  return "外部预览打包器返回了错误，请重试。";
}

export function sameFiles(first: SandpackFiles, second: SandpackFiles): boolean {
  const firstPaths = Object.keys(first);
  const secondPaths = Object.keys(second);
  if (firstPaths.length !== secondPaths.length) return false;
  return firstPaths.every((path) => first[path]?.code === second[path]?.code);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

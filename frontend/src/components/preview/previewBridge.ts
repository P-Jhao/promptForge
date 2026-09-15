import type { SandpackFiles } from "@/types/store";

export const PREVIEW_BRIDGE_FILE = "/__promptforge_preview_bridge.js";
export const PREVIEW_BRIDGE_SOURCE = "promptforge-preview";
const PREVIEW_BRIDGE_IMPORT = `import "${PREVIEW_BRIDGE_FILE}";`;
const PREVIEW_GUARD_IMPORT = `import * as PromptForgeReact from "react";
import type { ErrorInfo, ReactNode } from "react";`;
const PREVIEW_GUARD_OPEN = "<PromptForgePreviewGuard>";
const PREVIEW_GUARD_CLOSE = "</PromptForgePreviewGuard>";
const PREVIEW_GUARD_BEGIN = "/* promptforge preview guard begin */";
const PREVIEW_GUARD_END = "/* promptforge preview guard end */";
const PREVIEW_BOUNDARY_BEGIN = "/* promptforge boundary report begin */";
const PREVIEW_BOUNDARY_END = "/* promptforge boundary report end */";
const PREVIEW_GUARD_CODE = `${PREVIEW_GUARD_BEGIN}
${PREVIEW_GUARD_IMPORT}
interface PromptForgePreviewGuardProps { children: ReactNode; }
interface PromptForgePreviewGuardState { hasError: boolean; }
class PromptForgePreviewGuard extends PromptForgeReact.Component<PromptForgePreviewGuardProps, PromptForgePreviewGuardState> {
  state: PromptForgePreviewGuardState = { hasError: false };
  static getDerivedStateFromError(error: unknown): PromptForgePreviewGuardState {
    window.parent.postMessage({ source: "${PREVIEW_BRIDGE_SOURCE}", type: "runtime-error", message: describePreviewError(error) }, "*");
    return { hasError: true };
  }
  componentDidCatch(error: unknown, _info: ErrorInfo): void {
    window.parent.postMessage({ source: "${PREVIEW_BRIDGE_SOURCE}", type: "runtime-error", message: describePreviewError(error) }, "*");
  }
  componentDidMount(): void {
    if (!this.state.hasError) reportPreviewMounted();
  }
  componentDidUpdate(): void {
    if (!this.state.hasError) reportPreviewMounted();
  }
  render(): ReactNode { return this.props.children; }
}
function describePreviewError(value: unknown): string {
  return value instanceof Error ? value.message : String(value);
}
function reportPreviewMounted(): void {
  window.parent.postMessage({ source: "${PREVIEW_BRIDGE_SOURCE}", type: "app-mounted" }, "*");
}
function reportPreviewRuntimeError(error: unknown): void {
  window.parent.postMessage({ source: "${PREVIEW_BRIDGE_SOURCE}", type: "runtime-error", message: describePreviewError(error) }, "*");
}
${PREVIEW_GUARD_END}
`;

const PREVIEW_BRIDGE_CODE = `const source = "${PREVIEW_BRIDGE_SOURCE}";
const send = (type, payload = {}) => {
  window.parent.postMessage({ source, type, ...payload }, "*");
};
const describeError = (value) => {
  if (value instanceof Error) return value.message;
  if (typeof value === "string") return value;
  try { return JSON.stringify(value); } catch { return "未知运行时错误"; }
};
window.addEventListener("error", (event) => {
  const target = event.target;
  if (target instanceof HTMLImageElement) {
    send("runtime-error", { message: "资源加载失败：" + target.src });
    return;
  }
  send("runtime-error", { message: describeError(event.error ?? event.message) });
}, true);
window.addEventListener("unhandledrejection", (event) => {
  send("runtime-error", { message: describeError(event.reason) });
});
`;

export function createPreviewFiles(files: SandpackFiles): SandpackFiles {
  const entryPath = findEntryPath(files);
  if (entryPath === null) return files;
  const entry = files[entryPath];
  if (entry.code.startsWith(PREVIEW_BRIDGE_IMPORT)) return files;
  const augmentedCode = addMountGuard(entry.code);

  return {
    ...files,
    [entryPath]: { ...entry, code: augmentedCode },
    [PREVIEW_BRIDGE_FILE]: { code: PREVIEW_BRIDGE_CODE },
  };
}

export function stripPreviewFiles(files: SandpackFiles): SandpackFiles {
  const stripped = { ...files };
  delete stripped[PREVIEW_BRIDGE_FILE];
  for (const entryPath of getEntryPaths()) {
    const entry = stripped[entryPath];
    if (entry !== undefined && entry.code.startsWith(PREVIEW_BRIDGE_IMPORT)) {
      stripped[entryPath] = {
        ...entry,
        code: removeMountGuard(entry.code),
      };
    }
  }
  return stripped;
}

function addMountGuard(source: string): string {
  const renderCall = "root.render(";
  const sourceWithBoundary = addBoundaryRuntimeReporter(source);
  const renderIndex = sourceWithBoundary.indexOf(renderCall);
  if (renderIndex < 0) return `${PREVIEW_BRIDGE_IMPORT}\n${source}`;
  const closeIndex = sourceWithBoundary.lastIndexOf(");");
  if (closeIndex <= renderIndex) return `${PREVIEW_BRIDGE_IMPORT}\n${source}`;
  return `${PREVIEW_BRIDGE_IMPORT}\n${PREVIEW_GUARD_CODE}${sourceWithBoundary.slice(0, renderIndex + renderCall.length)}${PREVIEW_GUARD_OPEN}\n${sourceWithBoundary.slice(renderIndex + renderCall.length, closeIndex)}${PREVIEW_GUARD_CLOSE}\n${sourceWithBoundary.slice(closeIndex)}`;
}

function removeMountGuard(source: string): string {
  const withoutBridge = source.slice(PREVIEW_BRIDGE_IMPORT.length).replace(/^\n/, "");
  const guardMarker = withoutBridge.indexOf(PREVIEW_GUARD_BEGIN);
  const guardStart = guardMarker >= 0 ? guardMarker : withoutBridge.indexOf(PREVIEW_GUARD_IMPORT);
  const rootRenderIndex = withoutBridge.indexOf("root.render(");
  if (guardStart < 0 || rootRenderIndex < 0) return withoutBridge;

  const openIndex = withoutBridge.indexOf(PREVIEW_GUARD_OPEN, rootRenderIndex);
  const closeIndex = withoutBridge.lastIndexOf(PREVIEW_GUARD_CLOSE);
  if (openIndex < 0 || closeIndex < openIndex) return withoutBridge;
  const sourceAfterGuard = withoutBridge.slice(findGuardEnd(withoutBridge, guardStart)).replace(/^\n/, "");
  const sourceWithoutGuardImports = withoutBridge.slice(0, guardStart) + sourceAfterGuard;
  const adjustedRenderIndex = sourceWithoutGuardImports.indexOf("root.render(");
  const adjustedOpenIndex = sourceWithoutGuardImports.indexOf(PREVIEW_GUARD_OPEN, adjustedRenderIndex);
  const adjustedCloseIndex = sourceWithoutGuardImports.lastIndexOf(PREVIEW_GUARD_CLOSE);
  if (adjustedRenderIndex < 0 || adjustedOpenIndex < 0 || adjustedCloseIndex < adjustedOpenIndex) {
    return withoutBridge;
  }
  const body = sourceWithoutGuardImports
    .slice(adjustedOpenIndex + PREVIEW_GUARD_OPEN.length, adjustedCloseIndex)
    .replace(/^\n/, "");
  const afterClose = sourceWithoutGuardImports
    .slice(adjustedCloseIndex + PREVIEW_GUARD_CLOSE.length)
    .replace(/^\n/, "");
  return removeBoundaryRuntimeReporter(`${sourceWithoutGuardImports.slice(0, adjustedRenderIndex + "root.render(".length)}${body}${afterClose}`);
}

function addBoundaryRuntimeReporter(source: string): string {
  const boundarySignature = "static getDerivedStateFromError(error: unknown): ErrorBoundaryState {";
  if (!source.includes(boundarySignature) || source.includes(PREVIEW_BOUNDARY_BEGIN)) return source;
  const report = `\n    ${PREVIEW_BOUNDARY_BEGIN}\n    reportPreviewRuntimeError(error);\n    ${PREVIEW_BOUNDARY_END}`;
  return source.replace(boundarySignature, `${boundarySignature}${report}`);
}

function removeBoundaryRuntimeReporter(source: string): string {
  const report = `\n    ${PREVIEW_BOUNDARY_BEGIN}\n    reportPreviewRuntimeError(error);\n    ${PREVIEW_BOUNDARY_END}`;
  return source.replace(report, "");
}

function findGuardEnd(source: string, guardStart: number): number {
  const guardEnd = source.indexOf(PREVIEW_GUARD_END, guardStart);
  return guardEnd < 0 ? source.length : guardEnd + PREVIEW_GUARD_END.length;
}

export interface PreviewBridgeEvent {
  type: "app-mounted" | "runtime-error";
  message?: string;
}

export function readPreviewBridgeEvent(value: unknown): PreviewBridgeEvent | null {
  if (!isRecord(value) || value.source !== PREVIEW_BRIDGE_SOURCE) return null;
  if (value.type === "app-mounted") return { type: value.type };
  if (value.type === "runtime-error" && typeof value.message === "string") {
    return { type: value.type, message: value.message };
  }
  return null;
}

function findEntryPath(files: SandpackFiles): string | null {
  return getEntryPaths().find((path) => files[path] !== undefined) ?? null;
}

function getEntryPaths(): readonly string[] {
  return ["/index.tsx", "/index.ts", "/index.jsx", "/index.js"];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

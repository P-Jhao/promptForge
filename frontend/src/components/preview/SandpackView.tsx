"use client";

import {
  SandpackCodeEditor,
  SandpackFileExplorer,
  SandpackLayout,
  SandpackPreview,
  useSandpack,
} from "@codesandbox/sandpack-react";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BuildingLoadingOverlay } from "@/components/preview/BuildingLoadingOverlay";
import { createPreviewFiles, stripPreviewFiles } from "@/components/preview/previewBridge";
import { usePreviewDiagnostics } from "@/components/preview/usePreviewDiagnostics";
import { isPreviewDiagnosticsReady } from "@/components/preview/previewDiagnosticsState";
import { getReactTS_Template } from "@/services/api";
import { areSandpackFilesEqual, useSandpackStore } from "@/store/sandpackStore";
import { useChatStore } from "@/store/chatStore";
import type { CaseResourceManifest } from "@/cases/resourceManifest";
import type { SandpackFiles, ViewMode } from "@/types/store";
import { formatSandpackError, toSandpackFiles, toStoreFiles } from "./sandpackFileUtils";
import { PREVIEW_REFRESH_EVENT } from "./PreviewToolbar";
import { PreviewError } from "./PreviewError";
import { useWorkspaceSession } from "@/components/shell/WorkspaceSessionContext";

const SandpackProvider = dynamic(
  () => import("@codesandbox/sandpack-react").then((mod) => mod.SandpackProvider),
  { ssr: false, loading: () => <BuildingLoadingOverlay message="正在加载预览组件" detail="正在加载 Sandpack 运行环境…" /> },
);

interface SandpackViewProps {
  /** A preassembled case bypasses both chat and the template API. */
  initialFiles?: SandpackFiles;
  /** The manifest belongs to the selected case and is used by save/export checks. */
  initialManifest?: CaseResourceManifest;
}

interface TemplateLoadState {
  key: string;
  status: "loading" | "ready" | "error";
  error?: string;
}

export function SandpackView({ initialFiles, initialManifest }: SandpackViewProps) {
  const session = useWorkspaceSession();
  const { viewMode, generatedFiles, currentFiles, setPreviewFiles, setPreviewManifest } = useSandpackStore();
  const candidate = useChatStore((state) => state.candidate);
  const activeInitialFiles = session.surface === "example" ? initialFiles : undefined;
  const activeInitialManifest = session.surface === "example" ? initialManifest : undefined;
  const [templateFiles, setTemplateFiles] = useState<SandpackFiles>({});
  const [templateRetryCount, setTemplateRetryCount] = useState(0);
  const caseSignature = useMemo(
    () => activeInitialFiles === undefined ? null : JSON.stringify(activeInitialFiles),
    [activeInitialFiles],
  );
  const templateRequestKey = activeInitialFiles === undefined
    ? `template:${templateRetryCount}`
    : "case";
  const [templateLoad, setTemplateLoad] = useState<TemplateLoadState>(() => ({
    key: templateRequestKey,
    status: activeInitialFiles === undefined ? "loading" : "ready",
  }));
  useEffect(() => {
    setPreviewFiles(activeInitialFiles ?? null);
    return () => setPreviewFiles(null);
  }, [activeInitialFiles, setPreviewFiles]);

  useEffect(() => {
    setPreviewManifest(activeInitialFiles === undefined ? undefined : activeInitialManifest);
    return () => setPreviewManifest(undefined);
  }, [activeInitialFiles, activeInitialManifest, setPreviewManifest]);

  useEffect(() => {
    if (activeInitialFiles !== undefined) return;
    let cancelled = false;
    void getReactTS_Template().then((template) => {
      if (cancelled) return;
      setTemplateFiles(template);
      window.__templateFiles = template;
      setTemplateLoad({ key: templateRequestKey, status: "ready" });
    }).catch((error: unknown) => {
      if (cancelled) return;
      setTemplateLoad({
        key: templateRequestKey,
        status: "error",
        error: error instanceof Error ? error.message : "React 模板加载失败",
      });
    });
    return () => { cancelled = true; };
  }, [activeInitialFiles, templateRequestKey]);

  useEffect(() => {
    window.__templateFiles = templateFiles;
  }, [templateFiles]);

  const resultFiles = viewMode === "preview" && session.surface === "project" && candidate !== null
    ? toSandpackFiles(candidate.files)
    : activeInitialFiles !== undefined
      ? activeInitialFiles
      : session.surface === "project"
        ? (currentFiles ?? generatedFiles)
        : null;
  const hasResultFiles = resultFiles !== null && resultFiles !== undefined && Object.keys(resultFiles).length > 0;
  const templateStatus = templateLoad.key === templateRequestKey ? templateLoad.status : "loading";
  const templateError = templateStatus === "error" ? templateLoad.error ?? "React 模板加载失败" : null;
  const blockingTemplate = activeInitialFiles === undefined && templateStatus === "loading" && !hasResultFiles;
  const sourceFiles = useMemo(
    () => ({ ...templateFiles, ...(resultFiles ?? {}) }),
    [resultFiles, templateFiles],
  );
  const previewFiles = useMemo(
    () => viewMode === "preview" ? createPreviewFiles(sourceFiles) : sourceFiles,
    [sourceFiles, viewMode],
  );
  const candidatePreview = session.surface === "project" && viewMode === "preview" && candidate !== null;

  if (blockingTemplate) {
    return <div className="relative h-full w-full"><BuildingLoadingOverlay message="正在加载 React 模板" detail="正在读取可导出的模板文件…" /></div>;
  }
  if (templateError !== null && !hasResultFiles) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gray-50 p-6 text-center">
        <p className="text-sm font-medium text-gray-700">预览模板加载失败</p>
        <p className="max-w-md text-xs text-gray-500">{templateError}</p>
        <button type="button" onClick={() => setTemplateRetryCount((value) => value + 1)} className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50">重试模板</button>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <SandpackProvider
        key={`${viewMode}:${caseSignature ?? "generated"}:${candidate?.candidateId ?? "accepted"}:${hasResultFiles ? "files" : "blank"}`}
        template="react-ts"
        theme="light"
        files={previewFiles}
        options={{
          externalResources: ["https://cdn.tailwindcss.com"],
          visibleFiles: ["/App.tsx", "/index.tsx", "/styles.css"],
          activeFile: "/App.tsx",
          autoReload: true,
          recompileMode: "delayed",
          recompileDelay: 200,
        }}
        style={{ height: "100%", width: "100%" }}
      >
        <div className="relative h-full w-full border-none sandpack-wrapper">
          <SandpackLayout style={{ height: "100%", border: "none", borderRadius: 0 }}>
            <SandpackContent viewMode={viewMode} syncEditor={session.surface === "project" && activeInitialFiles === undefined && !candidatePreview} templateError={templateError} hasProjectFiles={hasResultFiles} templateFiles={templateFiles} />
          </SandpackLayout>
        </div>
      </SandpackProvider>
      {templateError !== null && hasResultFiles && (
        <div className="pointer-events-auto absolute left-1/2 top-3 z-30 flex max-w-[calc(100%-24px)] -translate-x-1/2 items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 shadow-sm">
          <span>模板加载失败，当前仍展示已收到的完整结果。</span>
          <button type="button" onClick={() => setTemplateRetryCount((value) => value + 1)} className="font-semibold underline underline-offset-2">重试</button>
        </div>
      )}
    </div>
  );
}

function SandpackContent({ viewMode, syncEditor, templateError, hasProjectFiles, templateFiles }: { viewMode: ViewMode; syncEditor: boolean; templateError: string | null; hasProjectFiles: boolean; templateFiles: SandpackFiles }) {
  const { sandpack } = useSandpack();
  useEffect(() => {
    const handleRefresh = () => { void sandpack.runSandpack().catch(() => undefined); };
    window.addEventListener(PREVIEW_REFRESH_EVENT, handleRefresh);
    return () => window.removeEventListener(PREVIEW_REFRESH_EVENT, handleRefresh);
  }, [sandpack]);
  return viewMode === "preview"
    ? <PreviewContent syncEditor={syncEditor} templateError={templateError} hasProjectFiles={hasProjectFiles} templateFiles={templateFiles} />
    : <CodeContent syncEditor={syncEditor} hasProjectFiles={hasProjectFiles} templateFiles={templateFiles} />;
}

function PreviewContent({ syncEditor, templateError, hasProjectFiles, templateFiles }: { syncEditor: boolean; templateError: string | null; hasProjectFiles: boolean; templateFiles: SandpackFiles }) {
  const { sandpack, listen } = useSandpack();
  const { setCurrentFiles } = useSandpackStore();
  const candidateId = useChatStore((state) => state.candidate?.candidateId);
  const setCandidatePreviewStatus = useChatStore((state) => state.setCandidatePreviewStatus);
  const previewRootRef = useRef<HTMLDivElement>(null);
  const lastFilesRef = useRef<SandpackFiles | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const diagnostics = usePreviewDiagnostics(listen, previewRootRef, retryKey);
  const buildError = diagnostics.buildError ?? (
    diagnostics.buildState === "error" && sandpack.error !== null
      ? formatSandpackError(sandpack.error)
      : null
  );

  useEffect(() => {
    const files = stripPreviewFiles(toStoreFiles(sandpack.files));
    const previousFiles = lastFilesRef.current;
    lastFilesRef.current = files;
    if (previousFiles === null && !hasProjectFiles) return;
    if (!hasProjectFiles && areSandpackFilesEqual(templateFiles, files)) return;
    if (previousFiles !== null && areSandpackFilesEqual(previousFiles, files)) return;
    if (syncEditor) setCurrentFiles(files);
  }, [hasProjectFiles, sandpack.files, setCurrentFiles, syncEditor, templateFiles]);

  const retryPreview = (): void => {
    setRetryKey((value) => value + 1);
    void sandpack.runSandpack().catch(() => undefined);
  };

  const hasError = buildError !== null || diagnostics.runtimeError !== null;
  const diagnosticsReady = isPreviewDiagnosticsReady(diagnostics);
  const waiting = diagnostics.buildState !== "success" || diagnostics.mountState !== "ready";
  const showCentralLoading = waiting && !diagnostics.hasRenderedBefore && !hasError && !diagnostics.timedOut;

  useEffect(() => {
    if (candidateId === undefined || syncEditor) return;
    if (templateError !== null) {
      setCandidatePreviewStatus(candidateId, "fail", "template", "React 模板加载失败", templateError);
      return;
    }
    if (diagnostics.timedOut) {
      setCandidatePreviewStatus(candidateId, "fail", "external-timeout", "外部预览环境超时", diagnostics.lastEvent ?? undefined);
      return;
    }
    if (hasError) {
      setCandidatePreviewStatus(
        candidateId,
        "fail",
        diagnostics.errorCategory ?? "build",
        diagnostics.runtimeError ?? buildError ?? "预览运行失败",
        diagnostics.lastEvent ?? undefined,
      );
      return;
    }
    const previewStatus = diagnosticsReady ? "pass" : "not-verified";
    setCandidatePreviewStatus(candidateId, previewStatus, undefined, previewStatus === "pass" ? "Sandpack 构建完成且应用已挂载" : "等待真实构建与应用挂载", diagnostics.lastEvent ?? undefined);
  }, [candidateId, diagnostics.buildState, diagnostics.errorCategory, diagnostics.lastEvent, diagnostics.mountState, diagnostics.runtimeError, diagnostics.timedOut, diagnosticsReady, hasError, buildError, setCandidatePreviewStatus, syncEditor, templateError]);

  return (
    <div ref={previewRootRef} className="relative h-full w-full bg-white">
      <SandpackPreview style={{ height: "100%" }} showOpenInCodeSandbox={false} showRefreshButton={false} showSandpackErrorOverlay={false} />
      {showCentralLoading && (
        <BuildingLoadingOverlay
          message={diagnostics.buildState === "success" ? "正在等待应用挂载" : "正在启动预览"}
          detail={diagnostics.longWait ? "启动耗时较长，仍在等待真实运行事件…" : "正在等待 Sandpack 构建和应用挂载…"}
        />
      )}
      {waiting && diagnostics.hasRenderedBefore && !hasError && !diagnostics.timedOut && (
        <BuildingLoadingOverlay compact message={diagnostics.longWait ? "预览启动耗时较长" : "正在重新编译预览"} />
      )}
      {diagnostics.timedOut && (
        <PreviewError title="预览启动超时" message="外部运行环境在配置的等待边界内没有完成构建或应用挂载。已有画面和代码仍可查看。" onRetry={retryPreview} />
      )}
      {buildError !== null && (
        <PreviewError title="预览构建失败" message={buildError} onRetry={retryPreview} />
      )}
      {diagnostics.runtimeError !== null && buildError === null && (
        <PreviewError title="预览运行时错误" message={diagnostics.runtimeError} onRetry={retryPreview} />
      )}
    </div>
  );
}

function CodeContent({ syncEditor, hasProjectFiles, templateFiles }: { syncEditor: boolean; hasProjectFiles: boolean; templateFiles: SandpackFiles }) {
  const { sandpack } = useSandpack();
  const { setCurrentFiles } = useSandpackStore();
  const [isFileTreeOpen, setIsFileTreeOpen] = useState(true);
  const lastFilesRef = useRef<SandpackFiles | null>(null);

  useEffect(() => {
    const files = toStoreFiles(sandpack.files);
    const previousFiles = lastFilesRef.current;
    lastFilesRef.current = files;
    if (previousFiles === null && !hasProjectFiles) return;
    if (!hasProjectFiles && areSandpackFilesEqual(templateFiles, files)) return;
    if (previousFiles !== null && areSandpackFilesEqual(previousFiles, files)) return;
    if (syncEditor) setCurrentFiles(files);
  }, [hasProjectFiles, sandpack.files, setCurrentFiles, syncEditor, templateFiles]);

  return (
    <div className="relative h-full w-full bg-white">
      <div className="relative flex h-full w-full overflow-hidden">
        <div className={`relative h-full flex-shrink-0 overflow-hidden border-r border-gray-200 transition-all ${isFileTreeOpen ? "w-[200px]" : "w-0 border-none"}`}>
          <div className={`h-full w-full overflow-y-auto transition-opacity ${isFileTreeOpen ? "opacity-100" : "opacity-0"}`}>
            <SandpackFileExplorer style={{ height: "auto", width: "100%" }} />
          </div>
        </div>
        <div className="relative h-full min-w-0 flex-1 overflow-hidden">
          <SandpackCodeEditor style={{ height: "100%", width: "100%" }} showTabs showLineNumbers showInlineErrors wrapContent closableTabs />
        </div>
        <button
          type="button"
          onClick={() => setIsFileTreeOpen((value) => !value)}
          className={`absolute top-7 z-20 flex h-6 w-6 items-center justify-center border border-gray-200 bg-white text-gray-500 shadow-sm hover:text-gray-700 ${isFileTreeOpen ? "rounded-full" : "rounded-r-full rounded-l-none border-l-0"}`}
          style={{ left: isFileTreeOpen ? 200 : 0, transform: isFileTreeOpen ? "translateX(-50%)" : "translateX(0)" }}
          aria-label={isFileTreeOpen ? "收起文件树" : "展开文件树"}
        >
          {isFileTreeOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>
    </div>
  );
}

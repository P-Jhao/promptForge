"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { SandpackView } from "@/components/preview/SandpackView";
import { CASE_DESCRIPTORS, isWorkspaceCaseId, loadWorkspaceCase, type WorkspaceCaseBundle } from "@/cases/caseRegistry";
import type { NovelCaseScene } from "@/cases/novelCase";
import type { WorkspaceCaseContext } from "@/types/workspace";

function readScene(value: string | null): NovelCaseScene {
  return value === "notes" ? "notes" : "library";
}

function CaseLoading({ label }: { label: string }) {
  return <div className="flex h-full items-center justify-center bg-gray-50 text-sm text-gray-500">正在加载{label}案例…</div>;
}

function WorkspaceContent() {
  const searchParams = useSearchParams();
  const caseParam = searchParams.get("case");
  const caseId = isWorkspaceCaseId(caseParam) ? caseParam : null;
  const scene = readScene(searchParams.get("scene"));
  const [loaded, setLoaded] = useState<{ key: string; bundle: WorkspaceCaseBundle | null; error: string | null }>({ key: "", bundle: null, error: null });
  const requestKey = caseId === null ? "empty" : `${caseId}:${scene}`;

  useEffect(() => {
    let active = true;
    if (caseId === null) {
      return () => { active = false; };
    }
    void loadWorkspaceCase(caseId, scene).then((nextBundle) => {
      if (active) setLoaded({ key: requestKey, bundle: nextBundle, error: null });
    }).catch((error: unknown) => {
      if (active) setLoaded({ key: requestKey, bundle: null, error: error instanceof Error ? error.message : "案例加载失败" });
    });
    return () => { active = false; };
  }, [caseId, requestKey, scene]);

  const caseDescriptor = caseId === null ? undefined : CASE_DESCRIPTORS.find((item) => item.id === caseId);
  const isReady = loaded.key === requestKey;
  const bundle = isReady ? loaded.bundle : null;
  const loadError = isReady ? loaded.error : null;
  const caseContext: WorkspaceCaseContext | undefined = caseDescriptor === undefined
    ? undefined
    : { descriptor: caseDescriptor, files: bundle?.files, manifest: bundle?.manifest };
  const content = caseId !== null && !isReady
    ? <CaseLoading label={caseDescriptor?.title ?? "示例"} />
    : loadError !== null
      ? <div className="flex h-full flex-col items-center justify-center gap-2 bg-gray-50 p-6 text-center"><p className="text-sm font-medium text-red-700">案例加载失败</p><p className="max-w-lg text-xs text-gray-500">{loadError}</p></div>
      : <SandpackView initialFiles={bundle?.files} initialManifest={bundle?.manifest} />;

  return <AppShell caseContext={caseContext}>{content}</AppShell>;
}

export default function WorkspacePage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-gray-50 text-sm text-gray-500">正在打开工作台…</div>}>
      <WorkspaceContent />
    </Suspense>
  );
}

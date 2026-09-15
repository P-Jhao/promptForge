"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { SandpackView } from "@/components/preview/SandpackView";
import {
  createNovelCaseFiles,
  type NovelCaseScene,
} from "@/cases/novelCase";

function readScene(value: string | null): NovelCaseScene {
  if (value === "library" || value === "notes") {
    return value;
  }

  return "library";
}

function WorkspaceContent() {
  const searchParams = useSearchParams();
  const caseName = searchParams.get("case");
  const scene = readScene(searchParams.get("scene"));
  const caseFiles = useMemo(
    () => caseName === "novel" ? createNovelCaseFiles(scene) : undefined,
    [caseName, scene],
  );

  return (
    <AppShell>
      <SandpackView initialFiles={caseFiles} />
    </AppShell>
  );
}

export default function WorkspacePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-gray-50 text-sm text-gray-500">
          正在打开工作台…
        </div>
      }
    >
      <WorkspaceContent />
    </Suspense>
  );
}

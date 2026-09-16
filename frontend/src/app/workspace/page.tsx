"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { SandpackView } from "@/components/preview/SandpackView";
import {
  createNovelCaseFiles,
  NOVEL_CASE_MANIFEST,
  type NovelCaseScene,
} from "@/cases/novelCase";
import {
  createTaskBoardCaseFiles,
  TASK_BOARD_CASE_MANIFEST,
} from "@/cases/task-board/taskBoardCase";

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
    () => {
      if (caseName === "novel") return createNovelCaseFiles(scene);
      if (caseName === "task-board-real-eval") return createTaskBoardCaseFiles();
      return undefined;
    },
    [caseName, scene],
  );
  const caseManifest = caseName === "novel"
    ? NOVEL_CASE_MANIFEST
    : caseName === "task-board-real-eval"
      ? TASK_BOARD_CASE_MANIFEST
      : undefined;

  return (
    <AppShell>
      <SandpackView initialFiles={caseFiles} initialManifest={caseManifest} />
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

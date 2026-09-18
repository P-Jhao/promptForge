"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChatPanel } from "./ChatPanel";
import { PreviewPanel } from "./PreviewPanel";
import { ProjectManager } from "./ProjectManager";
import { WorkspaceSessionContext } from "./WorkspaceSessionContext";
import { useProjectPersistence } from "@/hooks/useProjectPersistence";
import { useChatStore } from "@/store/chatStore";
import { useSandpackStore } from "@/store/sandpackStore";
import type { LayoutMode, AppShellProps } from "@/types/components";
import type { WorkspaceSurface } from "@/types/workspace";
import styles from "./AppShell.module.css";

export function AppShell({ children, caseContext }: AppShellProps) {
  const router = useRouter();
  const projectId = useChatStore((state) => state.currentProjectId);
  const createNewProject = useChatStore((state) => state.createNewProject);
  const clearProjectFiles = useSandpackStore((state) => state.clearProjectFiles);
  const clearGeneratedFiles = useSandpackStore((state) => state.clearGeneratedFiles);
  const persistence = useProjectPersistence();
  const { dirty: persistenceDirty, status: persistenceStatus, saveCurrentProject } = persistence;
  const caseId = caseContext?.descriptor.id ?? null;
  const [surface, setSurface] = useState<WorkspaceSurface>(() => caseId === null ? "chooser" : "example");
  const [isForking, setIsForking] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("split");
  const [mobilePanel, setMobilePanel] = useState<"chat" | "preview">("chat");
  const surfaceRef = useRef<WorkspaceSurface>(surface);
  const previousCaseIdRef = useRef<string | null>(caseId);
  const forkSettlementRef = useRef(false);

  const setWorkspaceSurface = useCallback((nextSurface: WorkspaceSurface): void => {
    surfaceRef.current = nextSurface;
    setSurface(nextSurface);
  }, []);

  const openCaseChooser = useCallback((): void => {
    if (surfaceRef.current === "example") {
      createNewProject();
      clearGeneratedFiles();
    }
    forkSettlementRef.current = false;
    setAutoSaved(false);
    setWorkspaceSurface("chooser");
    if (caseId !== null) router.replace("/workspace");
  }, [caseId, clearGeneratedFiles, createNewProject, router, setWorkspaceSurface]);

  useEffect(() => {
    const previousCaseId = previousCaseIdRef.current;
    if (previousCaseId === caseId) return;
    previousCaseIdRef.current = caseId;
    if (caseId !== null) {
      setAutoSaved(false);
      setWorkspaceSurface("example");
      return;
    }
    if (surfaceRef.current === "example") {
      createNewProject();
      clearGeneratedFiles();
      forkSettlementRef.current = false;
      setAutoSaved(false);
    }
    if (surfaceRef.current !== "project") setWorkspaceSurface("chooser");
  }, [caseId, clearGeneratedFiles, createNewProject, setWorkspaceSurface]);

  useEffect(() => {
    if (persistenceDirty && !forkSettlementRef.current) setAutoSaved(false);
  }, [persistenceDirty]);

  useEffect(() => {
    if (!forkSettlementRef.current || !persistenceDirty || persistenceStatus === "saving") return;
    forkSettlementRef.current = false;
    void saveCurrentProject().then(() => setAutoSaved(true)).catch(() => setAutoSaved(false));
  }, [persistenceDirty, persistenceStatus, saveCurrentProject]);

  const forkCase = useCallback(async (): Promise<void> => {
    const activeCaseContext = caseContext;
    const files = activeCaseContext?.files;
    if (activeCaseContext === undefined || files === undefined) {
      const error = new Error("案例仍在加载，请稍候再创建项目");
      toast.info(error.message);
      throw error;
    }
    if (isForking) return;
    setIsForking(true);
    try {
      await persistence.forkFromCase(activeCaseContext.descriptor.title, files);
      forkSettlementRef.current = true;
      setAutoSaved(true);
      setWorkspaceSurface("project");
      router.replace("/workspace");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "创建项目失败，请重试");
      throw error;
    } finally {
      setIsForking(false);
    }
  }, [caseContext, isForking, persistence, router, setWorkspaceSurface]);

  const startBlankProject = useCallback((): void => {
    if (surfaceRef.current === "chooser") {
      createNewProject();
      clearProjectFiles();
    }
    forkSettlementRef.current = false;
    setAutoSaved(false);
    setWorkspaceSurface("project");
    if (caseId !== null) router.replace("/workspace");
  }, [caseId, clearProjectFiles, createNewProject, router, setWorkspaceSurface]);

  const session = useMemo(() => ({
    surface,
    caseContext,
    isForking,
    autoSaved,
    forkCase,
    openCaseChooser,
    startBlankProject,
  }), [autoSaved, caseContext, forkCase, isForking, openCaseChooser, startBlankProject, surface]);

  return (
    <WorkspaceSessionContext.Provider value={session}>
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <Link href="/" className={styles.brand} aria-label="返回 PromptForge 首页">
            <span className={styles.brandMark}>
              <Image src="/logo.png" alt="" fill priority sizes="32px" className={styles.brandImage} />
            </span>
            <span className={styles.brandName}>PromptForge</span>
            <span className={styles.beta}>Beta</span>
          </Link>
          <span className={styles.topbarDivider} aria-hidden="true" />
          <ProjectManager persistence={persistence} />
        </header>

        <div className={styles.mobileTabs} role="tablist" aria-label="工作台区域">
          <button type="button" role="tab" aria-selected={mobilePanel === "chat"} onClick={() => setMobilePanel("chat")}>
            对话与进度
          </button>
          <button type="button" role="tab" aria-selected={mobilePanel === "preview"} onClick={() => setMobilePanel("preview")}>
            预览与代码
          </button>
        </div>

        <main className={`${styles.body} ${layoutMode === "preview-only" ? styles.previewOnly : ""}`}>
          <section className={`${styles.chatColumn} ${mobilePanel === "chat" ? styles.mobileVisible : styles.mobileHidden}`} aria-label="对话与进度">
            <div className={styles.panel}>
              <ChatPanel key={`${projectId}-${surface}`} persistence={persistence} />
            </div>
          </section>
          <section className={`${styles.previewColumn} ${mobilePanel === "preview" ? styles.mobileVisible : styles.mobileHidden}`} aria-label="预览与代码">
            <PreviewPanel
              layoutMode={layoutMode}
              onExitFullScreen={() => setLayoutMode("split")}
              onEnterFullScreen={() => setLayoutMode("preview-only")}
            >
              {children}
            </PreviewPanel>
          </section>
        </main>
      </div>
    </WorkspaceSessionContext.Provider>
  );
}

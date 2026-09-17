"use client";

import { ChevronDown, Copy, Download, FolderOpen, History, MoreHorizontal, Plus, Save } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { CaseResourceManifest } from "@/cases/resourceManifest";
import { downloadGeneratedCode, resolveDownloadSource } from "@/lib/downloadCode";
import type { SandpackFiles, ProjectVersion } from "@/types/store";
import styles from "./ProjectManager.module.css";

interface ProjectManagerTopActionsProps {
  projectName: string;
  acceptedVersion: ProjectVersion | undefined;
  statusText: string;
  dirty: boolean;
  busy: boolean;
  storageBusy: boolean;
  isLoading: boolean;
  candidatePresent: boolean;
  previewFiles: SandpackFiles | null;
  currentFiles: SandpackFiles | null;
  generatedFiles: SandpackFiles | null;
  previewManifest: CaseResourceManifest | undefined;
  onOpenProjects: () => void;
  onSave: () => void;
  onNewProject: () => void;
  onSaveAs: () => void;
}

export function ProjectManagerTopActions({
  projectName,
  acceptedVersion,
  statusText,
  dirty,
  busy,
  storageBusy,
  isLoading,
  candidatePresent,
  previewFiles,
  currentFiles,
  generatedFiles,
  previewManifest,
  onOpenProjects,
  onSave,
  onNewProject,
  onSaveAs,
}: ProjectManagerTopActionsProps) {
  const [showMore, setShowMore] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const actionsDisabled = busy || storageBusy || isLoading || candidatePresent;
  const templateFiles = typeof window !== "undefined" ? window.__templateFiles ?? {} : {};
  const downloadSource = resolveDownloadSource({
    previewFiles,
    currentFiles,
    generatedFiles,
    templateFiles,
    previewManifest,
    dirty,
  });

  useEffect(() => {
    if (!showMore) return;
    const closeOnOutside = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (!moreMenuRef.current?.contains(target) && !moreButtonRef.current?.contains(target)) setShowMore(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setShowMore(false);
      requestAnimationFrame(() => moreButtonRef.current?.focus());
    };
    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [showMore]);

  const exportCurrent = async (): Promise<void> => {
    if (!downloadSource.hasFiles || isDownloading) return;
    setIsDownloading(true);
    try {
      await downloadGeneratedCode(downloadSource.files, downloadSource.templateFiles, downloadSource.manifest);
      toast.success(`${downloadSource.label}已开始下载`);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "导出失败，请重试");
    } finally {
      setIsDownloading(false);
    }
  };

  const closeMenu = (callback: () => void): void => {
    setShowMore(false);
    callback();
  };

  return (
    <div className={styles.root} aria-label="项目管理">
      <button
        type="button"
        className={styles.projectButton}
        onClick={() => closeMenu(onOpenProjects)}
        disabled={actionsDisabled}
        title="切换或打开本地项目"
      >
        <span className={styles.projectName}>{projectName}</span>
        <ChevronDown size={14} aria-hidden="true" />
      </button>
      <span className={`${styles.status} ${dirty ? styles.dirty : ""}`} role="status">
        <span>{acceptedVersion === undefined ? "尚无已接受版本" : `已接受版本 v${String(acceptedVersion.versionNumber)}`}</span>
        <span aria-hidden="true">·</span>
        <span>{statusText}</span>
      </span>
      <div className={styles.actions}>
        <button type="button" className={styles.actionButton} onClick={onSave} disabled={busy || storageBusy} title="保存当前工作副本"><Save size={14} /> <span>保存</span></button>
        <button type="button" className={`${styles.actionButton} ${styles.exportButton}`} onClick={() => void exportCurrent()} disabled={!downloadSource.hasFiles || isDownloading} title={`导出${downloadSource.label}`}><Download size={14} /> <span>{isDownloading ? "导出中…" : `导出 · ${downloadSource.label}`}</span></button>
        <div className={styles.moreWrap}>
          <button ref={moreButtonRef} type="button" className={styles.actionButton} aria-haspopup="menu" aria-expanded={showMore} onClick={() => setShowMore((value) => !value)}><MoreHorizontal size={16} /> <span>更多</span></button>
          {showMore && (
            <div ref={moreMenuRef} className={styles.menu} role="menu" aria-label="更多项目操作">
              <button type="button" role="menuitem" onClick={() => closeMenu(onNewProject)} disabled={actionsDisabled}><Plus size={14} />新建项目</button>
              <button type="button" role="menuitem" onClick={() => closeMenu(onSaveAs)} disabled={actionsDisabled}><Copy size={14} />另存为</button>
              <button type="button" role="menuitem" onClick={() => closeMenu(onOpenProjects)} disabled={actionsDisabled}><FolderOpen size={14} />打开项目</button>
              <button type="button" role="menuitem" onClick={() => closeMenu(onOpenProjects)} disabled={actionsDisabled}><History size={14} />版本历史</button>
              <button type="button" role="menuitem" onClick={() => closeMenu(onOpenProjects)} disabled={actionsDisabled}><span className={styles.menuGlyph}>Aa</span>重命名</button>
              <button type="button" role="menuitem" onClick={() => closeMenu(onOpenProjects)} disabled={actionsDisabled} className={styles.dangerItem}><span className={styles.menuGlyph}>×</span>删除项目</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

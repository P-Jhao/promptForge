"use client";

import { ChevronDown, Copy, Download, FolderOpen, History, MoreHorizontal, Plus, Save, Share2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { CaseResourceManifest } from "@/cases/resourceManifest";
import { downloadGeneratedCode, resolveDownloadSource } from "@/lib/downloadCode";
import type { SandpackFiles } from "@/types/store";
import styles from "./ProjectManager.module.css";

interface ProjectManagerTopActionsProps {
  projectName: string;
  statusText: string;
  isExample: boolean;
  isChooser: boolean;
  caseTitle?: string;
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
  onOpenCaseChooser: () => void;
}

export function ProjectManagerTopActions({
  projectName,
  statusText,
  isExample,
  isChooser,
  caseTitle,
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
  onOpenCaseChooser,
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

  const shareWorkspace = async (): Promise<void> => {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({
          title: caseTitle ?? projectName,
          text: isExample ? "在 PromptForge 查看这个示例项目" : "PromptForge 本地工作区链接；项目数据仍保存在当前浏览器",
          url,
        });
        return;
      }
      if (navigator.clipboard === undefined) throw new Error("当前浏览器不支持复制链接");
      await navigator.clipboard.writeText(url);
      toast.success(isExample ? "示例链接已复制" : "工作区链接已复制；项目数据仍保存在当前浏览器");
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error(error instanceof Error ? error.message : "分享失败，请重试");
    }
  };

  const closeMenu = (callback: () => void): void => {
    setShowMore(false);
    callback();
  };

  if (isExample) {
    return (
      <div className={styles.root} aria-label="示例项目操作">
        <div className={styles.exampleIdentity}>
          <span className={styles.breadcrumbSlash} aria-hidden="true">/</span>
          <strong>{caseTitle ?? "示例项目"}</strong>
          <span className={styles.exampleBadge}>示例项目</span>
        </div>
        <div className={styles.actions}>
          <button type="button" className={`${styles.actionButton} ${styles.primaryButton}`} onClick={onOpenCaseChooser} disabled={actionsDisabled} title="离开当前案例，开始一个新的项目">
            <Plus size={14} /> <span>开始一个新的项目</span>
          </button>
          <button type="button" className={styles.actionButton} onClick={() => void shareWorkspace()} title="分享当前示例链接"><Share2 size={14} /> <span>分享</span></button>
          <div className={styles.moreWrap}>
            <button ref={moreButtonRef} type="button" className={styles.actionButton} aria-haspopup="menu" aria-expanded={showMore} onClick={() => setShowMore((value) => !value)}><MoreHorizontal size={16} /> <span>更多</span></button>
            {showMore && (
              <div ref={moreMenuRef} className={styles.menu} role="menu" aria-label="更多示例操作">
                <button type="button" role="menuitem" onClick={() => closeMenu(onOpenCaseChooser)}><FolderOpen size={14} />其他示例</button>
                <button type="button" role="menuitem" onClick={() => closeMenu(() => void shareWorkspace())}><Share2 size={14} />复制示例链接</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (isChooser) {
    return (
      <div className={styles.root} aria-label="案例选择">
        <div className={styles.chooserIdentity}>
          <span className={styles.breadcrumbSlash} aria-hidden="true">/</span>
          <strong>选择案例</strong>
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.actionButton} onClick={() => closeMenu(onOpenProjects)} disabled={actionsDisabled} title="打开本地项目"><FolderOpen size={14} /> <span>打开项目</span></button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root} aria-label="项目管理">
      <button type="button" className={styles.projectButton} onClick={() => closeMenu(onOpenProjects)} disabled={actionsDisabled} title="切换或打开本地项目">
        <span className={styles.projectName}>{projectName}</span>
        <ChevronDown size={14} aria-hidden="true" />
      </button>
      <span className={`${styles.status} ${dirty ? styles.dirty : ""}`} role="status">{statusText}</span>
      <div className={styles.actions}>
        <button type="button" className={styles.actionButton} onClick={() => void shareWorkspace()} title="分享当前工作区链接"><Share2 size={14} /> <span>分享</span></button>
        <button type="button" className={`${styles.actionButton} ${styles.exportButton}`} onClick={() => void exportCurrent()} disabled={!downloadSource.hasFiles || isDownloading} title={`导出${downloadSource.label}`}><Download size={14} /> <span>{isDownloading ? "导出中…" : "导出"}</span></button>
        <div className={styles.moreWrap}>
          <button ref={moreButtonRef} type="button" className={styles.actionButton} aria-haspopup="menu" aria-expanded={showMore} onClick={() => setShowMore((value) => !value)}><MoreHorizontal size={16} /> <span>更多</span></button>
          {showMore && (
            <div ref={moreMenuRef} className={styles.menu} role="menu" aria-label="更多项目操作">
              {dirty && <button type="button" role="menuitem" onClick={() => closeMenu(onSave)} disabled={busy || storageBusy}><Save size={14} />保存</button>}
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

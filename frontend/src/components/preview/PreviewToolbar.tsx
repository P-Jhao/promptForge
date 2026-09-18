"use client";

import { Code2, Eye, Maximize2, Minimize2, RefreshCw } from "lucide-react";
import { useSandpackStore } from "@/store/sandpackStore";
import type { PreviewToolbarProps } from "@/types/components";

export const PREVIEW_REFRESH_EVENT = "promptforge:refresh-preview";

export function PreviewToolbar({ isFullScreen, onEnterFullScreen, onExitFullScreen }: PreviewToolbarProps) {
  const { viewMode, setViewMode } = useSandpackStore();

  const refresh = (): void => {
    if (typeof window !== "undefined") window.dispatchEvent(new Event(PREVIEW_REFRESH_EVENT));
  };

  return (
    <div className="preview-toolbar" aria-label="预览工具栏">
      <div className="preview-view-toggle" role="group" aria-label="查看方式">
        <button type="button" onClick={() => setViewMode("preview")} aria-pressed={viewMode === "preview"}>
          <Eye size={14} aria-hidden="true" /> 预览
        </button>
        <button type="button" onClick={() => setViewMode("code")} aria-pressed={viewMode === "code"}>
          <Code2 size={14} aria-hidden="true" /> 代码
        </button>
      </div>
      <div className="preview-toolbar-actions">
        <button type="button" onClick={refresh} title="重新运行预览" aria-label="重新运行预览">
          <RefreshCw size={14} aria-hidden="true" /> <span>刷新</span>
        </button>
        <button type="button" onClick={isFullScreen ? onExitFullScreen : onEnterFullScreen} title={isFullScreen ? "退出全屏" : "全屏查看"}>
          {isFullScreen ? <Minimize2 size={14} aria-hidden="true" /> : <Maximize2 size={14} aria-hidden="true" />}
          <span>{isFullScreen ? "退出全屏" : "全屏"}</span>
        </button>
      </div>
    </div>
  );
}

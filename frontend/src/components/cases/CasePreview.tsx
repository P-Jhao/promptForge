"use client";

import Link from "next/link";
import { Download, ExternalLink, FileCode2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import {
  createNovelCaseFiles,
  NOVEL_CASE_MANIFEST,
  type NovelCaseScene,
} from "@/cases/novelCase";
import { downloadGeneratedCode } from "@/lib/downloadCode";

interface CasePreviewProps {
  scene?: NovelCaseScene;
  onSceneChange?: (scene: NovelCaseScene) => void;
  compact?: boolean;
  showOpenWorkspace?: boolean;
}

export function CasePreview({
  scene = "library",
  onSceneChange,
  compact = false,
  showOpenWorkspace = true,
}: CasePreviewProps) {
  const [internalScene, setInternalScene] = useState<NovelCaseScene>(scene);
  const [resourceCheck, setResourceCheck] = useState<"checking" | "ready" | "error">("checking");
  const [resourceError, setResourceError] = useState<string | null>(null);
  const [resourceRetry, setResourceRetry] = useState(0);
  const activeScene = onSceneChange === undefined ? internalScene : scene;
  const files = createNovelCaseFiles(activeScene);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.all(NOVEL_CASE_MANIFEST.resources.filter((resource) => resource.required).map(async (resource) => {
      const response = await fetch(resource.hostPath, { signal: controller.signal, cache: "no-store" });
      if (!response.ok) {
        throw new Error(`${resource.id}（${resource.hostPath}）返回 HTTP ${response.status}`);
      }
    })).then(() => {
      if (!controller.signal.aborted) setResourceCheck("ready");
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      setResourceCheck("error");
      setResourceError(error instanceof Error ? error.message : "案例资源无法读取");
    });
    return () => controller.abort();
  }, [resourceRetry]);

  const handleDownload = async () => {
    try {
      await downloadGeneratedCode(files, {}, NOVEL_CASE_MANIFEST);
      toast.success("案例源码已下载");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "源码下载失败");
    }
  };

  return (
    <section className={`case-preview ${compact ? "case-preview-compact" : ""}`}>
      <div className="case-preview-header">
        <div>
          <div className="case-kicker">
            <ShieldCheck size={14} aria-hidden="true" />
            预置案例 · 同一份成果的两个场景
          </div>
          <h3>小说阅读管理</h3>
        </div>
        <div className="case-preview-actions">
          <button type="button" onClick={handleDownload} title="导出案例源码">
            <Download size={14} aria-hidden="true" />
            <span>导出源码</span>
          </button>
          {showOpenWorkspace && (
            <Link href={`/workspace?case=novel&scene=${activeScene}`} title="在工作台查看案例源码">
              <ExternalLink size={14} aria-hidden="true" />
              <span>在工作台打开</span>
            </Link>
          )}
        </div>
      </div>

      <div className="case-scene-tabs" role="tablist" aria-label="案例场景">
        <button
          type="button"
          role="tab"
          aria-selected={activeScene === "library"}
          className={activeScene === "library" ? "active" : ""}
          onClick={() => { setInternalScene("library"); onSceneChange?.("library"); }}
        >
          书库管理
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeScene === "notes"}
          className={activeScene === "notes" ? "active" : ""}
          onClick={() => { setInternalScene("notes"); onSceneChange?.("notes"); }}
        >
          阅读笔记
        </button>
      </div>

      <div className="case-resource-status" role={resourceCheck === "error" ? "alert" : "status"}>
        {resourceCheck === "checking" && <span>正在检查案例资源…</span>}
        {resourceCheck === "ready" && <span>资源已就绪：Sandpack 与导出使用同一份清单。</span>}
        {resourceCheck === "error" && (
          <>
            <span>资源无法加载：{resourceError ?? "未知错误"}</span>
            <button
              type="button"
              onClick={() => {
                setResourceCheck("checking");
                setResourceError(null);
                setResourceRetry((value) => value + 1);
              }}
            >
              重新检查
            </button>
          </>
        )}
      </div>

      <div className="case-iframe-wrap">
        <iframe
          key={activeScene}
          title={`${activeScene === "library" ? "书库管理" : "阅读笔记"}案例预览`}
          src={`/case-preview/${activeScene}`}
        />
      </div>

      {!compact && (
        <div className="case-source-note">
          <FileCode2 size={15} aria-hidden="true" />
          <span>无需调用模型即可加载成果；源码可载入工作台并导出，案例数据仅保留在当前浏览会话。</span>
        </div>
      )}
    </section>
  );
}

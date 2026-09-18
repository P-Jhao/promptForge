// 右侧预览面板
"use client";

import { PreviewToolbar } from "@/components/preview/PreviewToolbar";
import type { PreviewPanelProps } from "@/types/components";

/**
 * PreviewPanel
 *
 * 职责：
 * - 作为 Preview 区域的结构容器
 * - 承载 PreviewToolbar
 * - 将真正的预览内容（Sandpack）包裹进来
 *
 * 不负责：
 * - 不生成内容
 * - 不管理 Sandpack 状态
 * - 不直接控制布局（只能通过回调请求）
 */
export function PreviewPanel({
  children,
  layoutMode,
  onEnterFullScreen,
  onExitFullScreen,
}: PreviewPanelProps) {
  const isFullScreen = layoutMode === "preview-only";

  return (
    <section className="relative h-full w-full overflow-hidden bg-transparent">
      {/* Preview content */}
      <div className="h-full w-full">
        <div className="flex h-full w-full flex-col overflow-hidden rounded-[10px] border border-gray-200 bg-white shadow-sm">
          <div className="preview-toolbar-slot flex shrink-0 border-b border-gray-100 bg-white px-3 py-2">
            <PreviewToolbar
              isFullScreen={isFullScreen}
              onEnterFullScreen={onEnterFullScreen}
              onExitFullScreen={onExitFullScreen}
            />
          </div>
          <div className="relative min-h-0 flex-1">{children}</div>
        </div>
      </div>
    </section>
  );
}

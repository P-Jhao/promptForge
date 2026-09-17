"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ChatPanel } from "./ChatPanel";
import { PreviewPanel } from "./PreviewPanel";
import { ProjectManager } from "./ProjectManager";
import { useProjectPersistence } from "@/hooks/useProjectPersistence";
import { useChatStore } from "@/store/chatStore";
import type { LayoutMode, AppShellProps } from "@/types/components";
import styles from "./AppShell.module.css";

export function AppShell({ children }: AppShellProps) {
  const projectId = useChatStore((state) => state.currentProjectId);
  const persistence = useProjectPersistence();
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("split");
  const [mobilePanel, setMobilePanel] = useState<"chat" | "preview">("chat");

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <Link href="/" className={styles.brand} aria-label="返回 PromptForge 首页">
          <span className={styles.brandMark}>
            <Image src="/logo.png" alt="" fill priority sizes="32px" className={styles.brandImage} />
          </span>
          <span className={styles.brandName}>PromptForge</span>
          <span className={styles.beta}>Beta</span>
        </Link>
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
            <ChatPanel key={projectId} persistence={persistence} />
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
  );
}

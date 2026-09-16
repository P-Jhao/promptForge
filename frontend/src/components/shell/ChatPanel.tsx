"use client";

import { Bubble, Sender } from "@ant-design/x";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useChat } from "@/hooks/useChat";
import type { ProjectPersistenceApi } from "@/hooks/useProjectPersistence";
import { useChatStore } from "@/store/chatStore";
import { useSandpackStore } from "@/store/sandpackStore";
import { evaluateNewProjectDecision } from "@/lib/newProjectGuard";
import { isNewProjectRequest } from "@/lib/requestIntent";
import { MockModeToggle } from "./MockModeToggle";
import { ThoughtChain } from "./ThoughtChain";
import { VersionCard } from "./VersionCard";
import { GenerationStatusPanel } from "./GenerationStatusPanel";
import { CandidatePanel } from "./CandidatePanel";
import type { MockConfig } from "@/types/mock";

const REQUEST_SUGGESTIONS = [
  "做一个支持搜索和状态筛选的小说书库管理页",
  "做一个带进度、笔记和书签的阅读详情页",
  "做一个面向前端开发者的项目管理后台",
];

export function ChatPanel({ persistence }: { persistence: ProjectPersistenceApi }) {
  const router = useRouter();
  const { messages, isLoading, sendMessage, cancelMessage, retryLastMessage, canRetry, candidate, applyCandidate, repairCandidate, discardCandidate } = useChat();
  const thoughts = useChatStore((state) => state.messageThoughts);
  const versions = useChatStore((state) => state.versions);
  const currentVersion = useChatStore((state) => state.currentVersion);
  const projectName = useChatStore((state) => state.projectName);
  const createNewProject = useChatStore((state) => state.createNewProject);
  const isAssembling = useSandpackStore((state) => state.isAssembling);
  const clearGeneratedFiles = useSandpackStore((state) => state.clearGeneratedFiles);
  const generation = useChatStore((state) => state.generation);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState("");
  const [mockConfig, setMockConfig] = useState<MockConfig>({ global: true });
  const [confirmingNewProject, setConfirmingNewProject] = useState(false);
  const [newProjectBusy, setNewProjectBusy] = useState(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  const checkNewProjectGuards = (ignoreDirty: boolean): boolean => {
    const latest = useChatStore.getState();
    if (useSandpackStore.getState().isAssembling) {
      toast.info("当前项目仍在准备预览，请稍后再新建项目");
      return false;
    }
    if (persistence.status === "saving" || persistence.status === "loading") {
      toast.info("当前项目仍在保存或读取，请稍后再新建项目");
      return false;
    }
    const decision = evaluateNewProjectDecision({
      dirty: ignoreDirty ? false : persistence.dirty,
      isLoading: latest.isLoading,
      candidatePresent: latest.candidate !== null,
    });
    if (decision === "blocked-loading") {
      toast.info("当前请求仍在进行，请稍后再新建项目");
      return false;
    }
    if (decision === "blocked-candidate") {
      toast.info("请先应用或放弃当前候选，再新建项目");
      return false;
    }
    if (decision === "confirm-dirty") {
      toast.info("当前项目有未保存修改，请选择保存、放弃或取消");
      return false;
    }
    return true;
  };

  const startNewProject = (discardDirty: boolean): void => {
    if (!checkNewProjectGuards(discardDirty)) return;
    setNewProjectBusy(true);
    createNewProject();
    clearGeneratedFiles();
    setConfirmingNewProject(false);
    setInputValue("");
    setNewProjectBusy(false);
    router.replace("/workspace");
  };

  const saveAndStartNewProject = async (): Promise<void> => {
    if (!checkNewProjectGuards(true)) return;
    setNewProjectBusy(true);
    try {
      await persistence.saveCurrentProject();
      createNewProject();
      clearGeneratedFiles();
      setConfirmingNewProject(false);
      setInputValue("");
      router.replace("/workspace");
    } catch {
      // 保存错误由 persistence 暴露，当前项目和输入保持不变。
    } finally {
      setNewProjectBusy(false);
    }
  };

  const submit = (value: string) => {
    const content = value.trim();
    if (!content || isLoading || mockConfig.global || candidate !== null) return;
    if (isNewProjectRequest(content)) {
      const latest = useChatStore.getState();
      const decision = evaluateNewProjectDecision({
        dirty: persistence.dirty,
        isLoading: latest.isLoading,
        candidatePresent: latest.candidate !== null,
      });
      if (persistence.status === "saving" || persistence.status === "loading") {
        toast.info("当前项目仍在保存或读取，请稍后再新建项目");
        return;
      }
      if (isAssembling || decision === "blocked-loading") {
        toast.info("当前请求或预览仍在进行，请稍后再新建项目");
        return;
      }
      if (decision === "blocked-candidate") {
        toast.info("请先应用或放弃当前候选，再新建项目");
        return;
      }
      setConfirmingNewProject(true);
      return;
    }
    void sendMessage(content, undefined, mockConfig);
    setInputValue("");
  };

  const setExampleMode = (enabled: boolean) => {
    setMockConfig({ global: enabled });
    if (enabled) {
      setInputValue("");
    }
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="chat-panel-intro">
        <div>
          <span className="chat-kicker">PROMPTFORGE WORKSPACE</span>
          <h2>描述你想交付的前端页面</h2>
          <p>从用户、数据和关键动作开始，生成可预览的 React/TypeScript 原型。</p>
        </div>
        <Link href="/#hero-case" className="chat-case-link">看案例 <ArrowUpRight size={14} /></Link>
      </div>

      <GenerationStatusPanel />
      {candidate !== null && (
        <CandidatePanel candidate={candidate} onApply={() => void applyCandidate()} onRepair={() => void repairCandidate()} onDiscard={discardCandidate} disabled={isLoading} />
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3">
        {messages.length === 0 ? (
          <div className="chat-empty">
            {mockConfig.global ? (
              <div className="chat-example-empty">
                <p>当前为示例体验，下面的成果已预置，不会根据新输入伪生成。</p>
                <div className="chat-case-links">
                  <Link href="/workspace?case=novel&scene=library">打开书库管理案例</Link>
                  <Link href="/workspace?case=novel&scene=notes">打开阅读笔记案例</Link>
                </div>
                <p className="chat-example-hint">想描述自己的需求，请切换到真实生成。</p>
              </div>
            ) : (
              <>
                <p>还没有需求，试试：</p>
                <div className="chat-suggestions">
                  {REQUEST_SUGGESTIONS.map((suggestion) => (
                    <button type="button" key={suggestion} onClick={() => setInputValue(suggestion)}>
                      {suggestion}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : messages.map((message) => {
          const version = versions.find((item) => item.assistantMessageId === message.id);
          const messageThought = thoughts[message.id] ?? [];
          const isEmptyAssistant = message.role === "assistant" && message.content.length === 0 && messageThought.length === 0;
          return (
            <div key={message.id} className="mb-4">
              {!isEmptyAssistant && (message.content || message.attachments?.length) && (
                <Bubble.List items={[{
                  key: message.id,
                  role: message.role === "user" ? "user" : "model",
                  placement: message.role === "user" ? "end" : "start",
                  content: <div className="whitespace-pre-wrap">{message.content || "正在处理…"}</div>,
                }]} />
              )}
              {message.role === "assistant" && messageThought.length > 0 && <div className="mt-2"><ThoughtChain thoughts={messageThought} /></div>}
              {version && (
                <VersionCard
                  version={version}
                  projectName={projectName}
                  isCurrentVersion={version.versionNumber === currentVersion}
                  onMetadataSave={persistence.updateVersionMetadata}
                />
              )}
            </div>
          );
        })}
        {generation.status === "error" && (
          <button type="button" className="chat-retry" onClick={() => void retryLastMessage()} disabled={isLoading || !canRetry} title={canRetry ? "重新执行原始请求" : "当前页面已丢失原始请求，无法重试"}>
            <RotateCcw size={14} /> {canRetry ? "重新执行原始请求" : "无法重试：请求上下文已丢失"}
          </button>
        )}
      </div>

      <div className="shrink-0 border-t border-gray-200 p-2">
        <MockModeToggle enabled={mockConfig.global === true} onChange={setExampleMode} />
        <p className="chat-boundary">当前为{mockConfig.global ? "示例体验" : "真实体验"}。示例体验只加载预置成果；真实请求会结合当前项目和你的描述处理新页面、现有页面调整或问题讨论，需要补充信息时会先请你澄清。</p>
        <Sender
          value={inputValue}
          onChange={setInputValue}
          placeholder="例如：做一个带搜索和筛选的内容管理后台"
          loading={isLoading}
          disabled={mockConfig.global || candidate !== null || confirmingNewProject || newProjectBusy}
          onCancel={cancelMessage}
          onSubmit={submit}
        />
      </div>

      {confirmingNewProject && (
        <div className="project-modal-backdrop" role="presentation">
          <section className="project-modal project-modal-small" role="alertdialog" aria-modal="true" aria-labelledby="new-project-title" aria-describedby="new-project-description">
            <div className="project-modal-head"><h2 id="new-project-title">新建独立项目？</h2></div>
            <p id="new-project-description" className="project-modal-note">将创建一个空白项目。当前项目的聊天记录、代码、候选和版本不会自动带入。</p>
            {persistence.dirty && <p className="project-modal-note" role="status">当前项目有未保存修改，请先保存，或明确放弃这些修改。</p>}
            <div className="project-modal-actions project-modal-actions-stack">
              <button type="button" autoFocus onClick={() => setConfirmingNewProject(false)} disabled={newProjectBusy}>取消</button>
              {persistence.dirty && <button type="button" onClick={() => void saveAndStartNewProject()} disabled={newProjectBusy}>保存当前项目后新建</button>}
              <button type="button" onClick={() => startNewProject(persistence.dirty)} disabled={newProjectBusy}>{persistence.dirty ? "放弃修改并新建" : "创建空白项目"}</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

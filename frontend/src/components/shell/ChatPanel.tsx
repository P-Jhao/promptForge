"use client";

import { Bubble, Sender } from "@ant-design/x";
import { useEffect, useRef, useState } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CASE_DESCRIPTORS } from "@/cases/caseRegistry";
import { useChat } from "@/hooks/useChat";
import type { ProjectPersistenceApi } from "@/hooks/useProjectPersistence";
import { useChatStore } from "@/store/chatStore";
import { useSandpackStore } from "@/store/sandpackStore";
import { evaluateNewProjectDecision } from "@/lib/newProjectGuard";
import { isNewProjectRequest } from "@/lib/requestIntent";
import { useWorkspaceSession } from "./WorkspaceSessionContext";
import { CaseChooserPanel } from "./CaseChooserPanel";
import { ExampleProjectPanel } from "./ExampleProjectPanel";
import { ThoughtChain } from "./ThoughtChain";
import { VersionCard } from "./VersionCard";
import { GenerationStatusPanel } from "./GenerationStatusPanel";
import { CandidatePanel } from "./CandidatePanel";

export function ChatPanel({ persistence }: { persistence: ProjectPersistenceApi }) {
  const router = useRouter();
  const { messages, isLoading, sendMessage, cancelMessage, retryLastMessage, canRetry, candidate, applyCandidate, repairCandidate, discardCandidate } = useChat();
  const workspace = useWorkspaceSession();
  const thoughts = useChatStore((state) => state.messageThoughts);
  const versions = useChatStore((state) => state.versions);
  const currentVersion = useChatStore((state) => state.currentVersion);
  const projectName = useChatStore((state) => state.projectName);
  const createNewProject = useChatStore((state) => state.createNewProject);
  const resetGeneration = useChatStore((state) => state.resetGeneration);
  const isAssembling = useSandpackStore((state) => state.isAssembling);
  const clearGeneratedFiles = useSandpackStore((state) => state.clearGeneratedFiles);
  const generation = useChatStore((state) => state.generation);
  const currentProjectId = useChatStore((state) => state.currentProjectId);
  const scrollRef = useRef<HTMLDivElement>(null);
  const previousProjectIdRef = useRef(currentProjectId);
  const [inputValue, setInputValue] = useState("");
  const [confirmingNewProject, setConfirmingNewProject] = useState(false);
  const [newProjectBusy, setNewProjectBusy] = useState(false);
  const [preparingPrompt, setPreparingPrompt] = useState(false);
  const isExample = workspace.surface === "example";
  const isChooser = workspace.surface === "chooser";
  const { registerRequestCancellation } = workspace;

  useEffect(() => {
    if (previousProjectIdRef.current === currentProjectId) return;
    previousProjectIdRef.current = currentProjectId;
    setInputValue("");
  }, [currentProjectId]);

  useEffect(() => {
    registerRequestCancellation(cancelMessage);
    return () => registerRequestCancellation(null);
  }, [cancelMessage, registerRequestCancellation]);

  useEffect(() => {
    if (isExample || isChooser) {
      scrollRef.current?.scrollTo({ top: 0 });
      return;
    }
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [isChooser, isExample, messages, isLoading]);

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
    if (!content || isLoading || workspace.isForking || candidate !== null) return;
    if (!isExample && !isChooser && isNewProjectRequest(content)) {
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

    resetGeneration();
    setPreparingPrompt(true);
    void (async () => {
      try {
        if (isExample) {
          await workspace.forkCase();
        } else if (isChooser) {
          workspace.startBlankProject();
        }
        await sendMessage(content, undefined, { global: false });
        setInputValue("");
      } catch {
        // Fork and persistence errors are already exposed by the workspace layer.
      } finally {
        setPreparingPrompt(false);
      }
    })();
  };

  const showPromptPreparation = preparingPrompt && !isLoading && generation.status === "idle";

  return (
    <div className="flex h-full flex-col bg-white">
      {showPromptPreparation ? (
        <div className="chat-preparing" role="status" aria-live="polite">
          <Loader2 className="animate-spin" size={15} />
          <div>
            <strong>正在理解你的需求…</strong>
            <span>准备生成流程…</span>
          </div>
        </div>
      ) : <GenerationStatusPanel />}
      {candidate !== null && (
        <CandidatePanel candidate={candidate} onApply={() => void applyCandidate()} onRepair={() => void repairCandidate()} onDiscard={discardCandidate} disabled={isLoading} />
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3">
        {isExample && workspace.caseContext !== undefined && (
          <ExampleProjectPanel
            caseContext={workspace.caseContext}
            descriptors={CASE_DESCRIPTORS}
            isForking={workspace.isForking}
            onFork={workspace.forkCase}
          />
        )}
        {isChooser && <CaseChooserPanel descriptors={CASE_DESCRIPTORS} onSuggestionSelect={setInputValue} />}
        {!isExample && !isChooser && (
          <div className="chat-agent-intro">
            <div>
              <span className="chat-kicker">PROMPTFORGE AGENT</span>
              <h2>继续描述你的修改</h2>
              <p>我会基于当前工作副本更新页面，并在右侧同步预览。</p>
            </div>
            <span className="chat-agent-status"><span />就绪</span>
          </div>
        )}
        {messages.map((message) => {
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
        <Sender
          value={inputValue}
          onChange={setInputValue}
          placeholder={isExample ? "描述你想如何修改这个案例…" : isChooser ? "描述你想创建的前端项目…" : "继续描述你的修改…"}
          loading={isLoading}
          disabled={workspace.isForking || candidate !== null || confirmingNewProject || newProjectBusy || preparingPrompt}
          onCancel={() => {
            cancelMessage();
            setPreparingPrompt(false);
          }}
          onSubmit={submit}
        />
        {isExample && <p className="chat-boundary">发送后将基于此案例创建可编辑项目</p>}
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

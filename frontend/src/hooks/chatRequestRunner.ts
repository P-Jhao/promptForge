import { toast } from "sonner";
import type { ChatMessage } from "@/types/message";
import { generateAppStream } from "@/services/api";
import { useChatStore } from "@/store/chatStore";
import { useSandpackStore } from "@/store/sandpackStore";
import type { ErrorStreamEvent, StreamEvent } from "@/types/api";
import type { BackendFlowType, StepType } from "@/types/flow";
import type { CandidateState } from "@/types/candidate";
import {
  candidateEventToState,
  summarizeFileChanges as calculateCandidateChanges,
  validateCandidateEventAgainstBase,
  validatePlainFiles,
  type CandidateEventPayload,
} from "@/lib/changeContract";
import { createCandidateValidation } from "@/lib/validationReport";
import { FLOW_CONFIG, NEXT_STEP_MAP, getPhaseByNode } from "@/constants/chat";
import {
  findPendingThoughtKey,
  getFilesPayload,
  getIntentProductName,
  getStreamErrorDetails,
  getThoughtDetails,
  getStepLabel,
  type ActiveRequest,
  type RetryableRequest,
} from "./chatStreamUtils";

export interface RefCell<T> {
  current: T;
}

export interface ChatRequestRunnerContext {
  activeRequestRef: RefCell<ActiveRequest | null>;
  lastRequestRef: RefCell<RetryableRequest | null>;
  requestIdRef: RefCell<number>;
}

export async function runChatRequest(
  request: RetryableRequest,
  context: ChatRequestRunnerContext,
): Promise<void> {
  const chatState = useChatStore.getState();
  if (chatState.isLoading || context.activeRequestRef.current !== null || (chatState.candidate !== null && request.repair === undefined)) return;

  const requestId = context.requestIdRef.current + 1;
  context.requestIdRef.current = requestId;
  const controller = new AbortController();
  const startedAt = Date.now();
  const userMessage: ChatMessage = {
    id: crypto.randomUUID(), role: "user", content: request.content,
    attachments: request.attachments,
  };
  const assistantMessage: ChatMessage = {
    id: crypto.randomUUID(), role: "assistant", content: "",
  };
  const assistantId = assistantMessage.id;
  context.activeRequestRef.current = { id: requestId, controller, assistantMessageId: assistantId, startedAt, repair: request.repair };
  context.lastRequestRef.current = { ...request, history: [...request.history] };

  const previousAssistantId = [...useChatStore.getState().messages]
    .reverse().find((message) => message.role === "assistant")?.id;
  const previousFiles = useSandpackStore.getState().generatedFiles !== null;
  const currentHistory = [...request.history, userMessage];
  const runId = request.runId ?? `run-${crypto.randomUUID()}`;
  const repairContext = request.repair === undefined ? undefined : { ...request.repair, runId };
  let activeFlow: BackendFlowType | null = null;
  let latestFiles: Record<string, string> | null = null;
  let streamedCandidate: CandidateEventPayload | null = null;
  let suggestedProjectName: string | undefined;
  const projectNameAtRequest = chatState.projectName;
  let streamFailed = false;
  let streamCompleted = false;
  let lastStageAt: number | undefined = startedAt;

  const {
    addMessage, appendMessageContent, setLoading, addThought, updateThought,
    archiveThoughts, updatePhaseProgress, collapsePhase,
    setCurrentFlow, setGeneration, markPendingThoughts, stageCandidate, finishCandidateRepair,
  } = useChatStore.getState();
  const { setIsAssembling } = useSandpackStore.getState();
  addMessage(userMessage);
  addMessage(assistantMessage);
  setLoading(true);
  setCurrentFlow(null);
  setGeneration({
    status: "running", runId,
    validationReport: request.repair === undefined ? undefined : useChatStore.getState().candidate?.validation.report,
    mode: request.mockConfig.global ? "mock" : "real",
    modeForced: false, currentPhase: undefined, currentStep: undefined,
    completedSteps: [], failedStep: undefined, error: undefined,
    failedNode: undefined, startedAt, elapsedMs: undefined, stageTimings: {},
    preservedResult: previousFiles, nextStep: undefined,
  });

  const isCurrentRequest = () =>
    context.activeRequestRef.current?.id === requestId && !controller.signal.aborted;
  const elapsed = () => Date.now() - startedAt;
  const fail = (message: string, node?: string) => {
    if (streamFailed) return;
    streamFailed = true;
    const thoughtKey = node ? findPendingThoughtKey(assistantId, node) : undefined;
    if (thoughtKey) updateThought(assistantId, thoughtKey, { status: "error", description: message });
    markPendingThoughts(assistantId, message);
    if (activeFlow !== "chat") {
      addThought(assistantId, {
        key: `error-${Date.now()}`, title: "生成失败", description: message, status: "error",
      });
    } else {
      toast.error(message);
    }
    setGeneration({
      status: "error", failedStep: getStepLabel(node), failedNode: node, error: message,
      elapsedMs: elapsed(), currentPhase: undefined, currentStep: undefined, nextStep: undefined,
      preservedResult: useSandpackStore.getState().generatedFiles !== null,
    });
    setIsAssembling(false);
    if (request.repair !== undefined) {
      const currentCandidate = useChatStore.getState().candidate;
      if (currentCandidate?.candidateId === request.repair.candidateId) {
        finishCandidateRepair(request.repair.candidateId, "fail", elapsed());
      }
    }
    setLoading(false);
    context.activeRequestRef.current = null;
    controller.abort();
  };

  try {
    await generateAppStream({
      messages: currentHistory,
      projectId: request.projectId,
      mockConfig: request.mockConfig,
      operation: request.operation,
      base: request.base,
      runId,
    }, async (event: StreamEvent) => {
      if (!isCurrentRequest() || streamFailed || streamCompleted) return;
      if (event.type === "mode") {
        setGeneration({ mode: event.data.mode, modeForced: event.data.forced });
        if (event.data.forced && event.data.message) toast.info(event.data.message);
        return;
      }
      if (event.type === "flow") {
        if (activeFlow !== null) { fail("收到重复的流程事件"); return; }
        activeFlow = event.data.flow;
        setCurrentFlow(activeFlow);
        const flowReceivedAt = Date.now();
        const flowTimings = { ...useChatStore.getState().generation.stageTimings, flow: flowReceivedAt - startedAt };
        lastStageAt = flowReceivedAt;
        if (event.data.operation === "edit" && request.operation !== "edit") { fail("收到未请求的编辑流程事件"); return; }
        if (activeFlow !== "traditional") {
          setGeneration({ currentPhase: undefined, currentStep: undefined, stageTimings: flowTimings });
          return;
        }
        if (request.operation === "edit" || event.data.operation === "edit") {
          setGeneration({ currentPhase: undefined, currentStep: undefined, stageTimings: flowTimings });
          return;
        }
        setGeneration({ currentPhase: "planning", currentStep: "analysis", stageTimings: flowTimings });
        if (previousAssistantId) archiveThoughts(previousAssistantId);
        const initialType: StepType = FLOW_CONFIG.traditional.initialStep ?? "analysis";
        const details = getThoughtDetails(initialType, "pending");
        addThought(assistantId, { key: initialType, type: "node", phase: getPhaseByNode(initialType), title: details.title, description: details.description, status: "pending" });
        return;
      }
      if (event.type === "candidate") {
        if (activeFlow !== "traditional" || request.operation !== "edit") { fail("收到未请求的候选编辑结果"); return; }
        if (event.data.projectId !== request.projectId || event.data.baseHash !== request.base.hash || event.data.baseVersionId !== request.base.versionId) {
          fail("候选与本次编辑基线不一致");
          return;
        }
        try {
          await validateCandidateEventAgainstBase(event.data, request.base);
        } catch (error: unknown) {
          fail(error instanceof Error ? error.message : "候选内容与冻结基线不一致");
          return;
        }
        streamedCandidate = event.data;
        latestFiles = event.data.files;
        return;
      }
      if (event.type === "chat") {
        if (activeFlow !== "chat") { fail("收到文本事件前未确定聊天流程"); return; }
        appendMessageContent(assistantId, event.data.delta);
        return;
      }
      if (event.type === "error") {
        const details = getStreamErrorDetails(event as ErrorStreamEvent);
        fail(details.message, details.node);
        return;
      }
      if (event.type === "done") {
        if (activeFlow === null) { fail("生成响应缺少流程事件"); return; }
        if (activeFlow === "traditional" && latestFiles === null) { fail("生成完成事件缺少完整文件结果"); return; }
        if (activeFlow === "traditional" && request.operation === "edit" && streamedCandidate === null) { fail("编辑完成事件缺少候选元数据"); return; }
        streamCompleted = true;
        if (activeFlow === "traditional" && latestFiles !== null) {
          const stagedCandidate: CandidateState = streamedCandidate === null
            ? {
              candidateId: `${runId}:candidate`, runId, projectId: request.projectId,
              baseVersionId: request.base.versionId, baseHash: request.base.hash, modelBaseHash: request.base.hash,
              suggestedProjectName, projectNameAtRequest,
              operation: "create", prompt: request.content, assistantMessageId: assistantId,
              files: { ...latestFiles }, resources: request.base.resources.map((resource) => ({ ...resource })),
              changes: calculateCandidateChanges(request.base.files, latestFiles),
              summary: `收到 ${Object.keys(latestFiles).length} 个文件，等待确认应用。`,
              validation: createCandidateValidation(`${runId}:candidate`, runId),
              status: "staged", createdAt: Date.now(),
            }
            : await candidateEventToState(streamedCandidate, request.content, assistantId, request.base, repairContext);
          stageCandidate(stagedCandidate);
        }
        setGeneration({ status: "success", elapsedMs: elapsed(), currentPhase: undefined, currentStep: undefined, nextStep: undefined, preservedResult: previousFiles });
        setIsAssembling(false);
        return;
      }
      if (activeFlow !== "traditional") { fail("收到传统流程步骤前未确定传统流程"); return; }
      const stepType = event.type;
      const stepData = event.data;
      const receivedAt = Date.now();
      const stageTimings = { ...useChatStore.getState().generation.stageTimings };
      if (lastStageAt !== undefined) stageTimings[stepType] = receivedAt - lastStageAt;
      lastStageAt = receivedAt;
      if (stepType === "files") {
        const files = getFilesPayload(stepData);
        if (files === undefined || Object.keys(files).length === 0) { fail("文件结果格式无效，未保存生成结果"); return; }
        try { validatePlainFiles(files); } catch (error: unknown) {
          fail(error instanceof Error ? error.message : "文件结果校验失败");
          return;
        }
        latestFiles = files;
      }
      if (stepType === "intent") {
        const productName = getIntentProductName(stepData);
        if (request.operation === "generate" && productName) suggestedProjectName = productName;
      }
      const details = getThoughtDetails(stepType, "success", stepData);
      updateThought(assistantId, stepType, { status: "success", description: details.description, content: JSON.stringify(stepData, null, 2) });
      const phase = getPhaseByNode(stepType);
      if (phase) {
        updatePhaseProgress(phase);
        const info = useChatStore.getState().phaseCompletion[phase];
        if (info && info.completed === info.total) collapsePhase(assistantId, phase);
      }
      const nextType = NEXT_STEP_MAP[stepType];
      const nextPhase = nextType && nextType !== "done" ? getPhaseByNode(nextType) : undefined;
      setGeneration({
        currentPhase: nextPhase, currentStep: nextType === "done" ? undefined : nextType,
        completedSteps: [...new Set([...useChatStore.getState().generation.completedSteps, stepType])],
        stageTimings, nextStep: nextType === "done" ? undefined : nextType,
      });
      if (nextType && nextType !== "done") {
        if (nextType === "app") setIsAssembling(true);
        const nextDetails = getThoughtDetails(nextType, "pending");
        addThought(assistantId, { key: nextType, type: "node", phase: getPhaseByNode(nextType), title: nextDetails.title, description: nextDetails.description, status: "pending" });
      }
    }, controller.signal);
    if (isCurrentRequest() && !streamCompleted) fail("生成流提前结束，未收到完成事件");
  } catch (error: unknown) {
    if (!controller.signal.aborted && isCurrentRequest()) fail(error instanceof Error ? error.message : "生成请求失败");
  } finally {
    if (context.activeRequestRef.current?.id === requestId) {
      context.activeRequestRef.current = null;
      setLoading(false);
    }
  }
}

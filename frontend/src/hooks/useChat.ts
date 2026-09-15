"use client";

import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import type { ChatMessage } from "@/types/message";
import { generateAppStream } from "@/services/api";
import { useChatStore } from "@/store/chatStore";
import { useSandpackStore } from "@/store/sandpackStore";
import type { ErrorStreamEvent, StreamEvent } from "@/types/api";
import type { BackendFlowType, StepType } from "@/types/flow";
import type { MockConfig } from "@/types/mock";
import { FLOW_CONFIG, NEXT_STEP_MAP, getPhaseByNode } from "@/constants/chat";
import {
  findPendingThoughtKey,
  getFilesPayload,
  getIntentProductName,
  getStreamErrorDetails,
  getThoughtDetails,
  getStepLabel,
  type Attachment,
  type ActiveRequest,
  type RetryableRequest,
  type TraditionalVersionContext,
} from "./chatStreamUtils";

export function useChat() {
  const {
    messages, isLoading, addMessage, appendMessageContent, setLoading,
    addThought, updateThought, archiveThoughts, updatePhaseProgress,
    collapsePhase, updateProjectName, incrementVersion, getCurrentThreadId,
    saveVersion, setCurrentFlow, setGeneration, markPendingThoughts,
  } = useChatStore();
  const { setGeneratedFiles, setIsAssembling } = useSandpackStore();
  const activeRequestRef = useRef<ActiveRequest | null>(null);
  const lastRequestRef = useRef<RetryableRequest | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => () => {
    const activeRequest = activeRequestRef.current;
    if (activeRequest !== null) {
      activeRequestRef.current = null;
      activeRequest.controller.abort();
      if (activeRequest.assistantMessageId) {
        markPendingThoughts(activeRequest.assistantMessageId, "已停止接收后续结果");
      }
      setGeneration({
        status: "cancelled",
        error: "已停止接收生成结果",
        elapsedMs: Date.now() - activeRequest.startedAt,
        preservedResult: useSandpackStore.getState().generatedFiles !== null,
      });
      setLoading(false);
      setIsAssembling(false);
    }
  }, [markPendingThoughts, setGeneration, setIsAssembling, setLoading]);

  const runRequest = useCallback(async (request: RetryableRequest) => {
    if (useChatStore.getState().isLoading || activeRequestRef.current !== null) return;

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
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
    activeRequestRef.current = { id: requestId, controller, assistantMessageId: assistantId, startedAt };
    lastRequestRef.current = { ...request, history: [...request.history] };

    const previousAssistantId = [...useChatStore.getState().messages]
      .reverse().find((message) => message.role === "assistant")?.id;
    const previousFiles = useSandpackStore.getState().generatedFiles !== null;
    const currentHistory = [...request.history, userMessage];
    let activeFlow: BackendFlowType | null = null;
    let versionContext: TraditionalVersionContext | null = null;
    let latestFiles: Record<string, string> | null = null;
    let streamFailed = false;
    let streamCompleted = false;
    let savedVersion = false;
    let lastStageAt: number | undefined = startedAt;

    addMessage(userMessage);
    addMessage(assistantMessage);
    setLoading(true);
    setCurrentFlow(null);
    setGeneration({
      status: "running", mode: request.mockConfig.global ? "mock" : "real",
      modeForced: false, currentPhase: undefined, currentStep: undefined,
      completedSteps: [], failedStep: undefined, error: undefined,
      failedNode: undefined,
      startedAt, elapsedMs: undefined, stageTimings: {},
      preservedResult: previousFiles, nextStep: undefined,
    });

    const isCurrentRequest = () =>
      activeRequestRef.current?.id === requestId && !controller.signal.aborted;
    const elapsed = () => Date.now() - startedAt;

    const fail = (message: string, node?: string) => {
      if (streamFailed) return;
      streamFailed = true;
      const thoughtKey = node ? findPendingThoughtKey(assistantId, node) : undefined;
      if (thoughtKey) {
        updateThought(assistantId, thoughtKey, { status: "error", description: message });
      }
      markPendingThoughts(assistantId, message);
      if (activeFlow !== "chat") {
        addThought(assistantId, {
          key: `error-${Date.now()}`, title: "生成失败", description: message, status: "error",
        });
      } else {
        toast.error(message);
      }
      setGeneration({
        status: "error", failedStep: getStepLabel(node), failedNode: node, error: message, elapsedMs: elapsed(),
        currentPhase: undefined, currentStep: undefined, nextStep: undefined,
        preservedResult: useSandpackStore.getState().generatedFiles !== null,
      });
      setIsAssembling(false);
      setLoading(false);
      activeRequestRef.current = null;
      controller.abort();
    };

    try {
      await generateAppStream({
        messages: currentHistory, projectId: request.projectId, mockConfig: request.mockConfig,
      }, (event: StreamEvent) => {
        if (!isCurrentRequest() || streamFailed) return;
        if (event.type === "mode") {
          setGeneration({ mode: event.data.mode, modeForced: event.data.forced });
          if (event.data.forced && event.data.message) toast.info(event.data.message);
          return;
        }
        if (event.type === "flow") {
          if (activeFlow !== null) {
            fail("收到重复的流程事件");
            return;
          }
          activeFlow = event.data.flow;
          setCurrentFlow(activeFlow);
          const flowReceivedAt = Date.now();
          const flowTimings = { ...useChatStore.getState().generation.stageTimings, flow: flowReceivedAt - startedAt };
          lastStageAt = flowReceivedAt;
          if (activeFlow !== "traditional") {
            setGeneration({ currentPhase: undefined, currentStep: undefined, stageTimings: flowTimings });
            return;
          }
          setGeneration({ currentPhase: "planning", currentStep: "analysis", stageTimings: flowTimings });
          if (previousAssistantId) archiveThoughts(previousAssistantId);
          const operation = useChatStore.getState().versions.length > 0 ? "edit" : "create";
          const versionNumber = incrementVersion();
          versionContext = { versionNumber, threadId: getCurrentThreadId(), operation };
          const initialType: StepType = FLOW_CONFIG.traditional.initialStep ?? "analysis";
          const details = getThoughtDetails(initialType, "pending");
          addThought(assistantId, { key: initialType, type: "node", phase: getPhaseByNode(initialType), title: details.title, description: details.description, status: "pending" });
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
          if (activeFlow === "traditional" && latestFiles === null) {
            fail("生成完成事件缺少完整文件结果");
            return;
          }
          streamCompleted = true;
          if (activeFlow === "traditional" && latestFiles !== null) {
            setGeneratedFiles(latestFiles);
          }
          if (activeFlow === "traditional" && latestFiles !== null && versionContext && !savedVersion) {
            saveVersion({
              versionNumber: versionContext.versionNumber, threadId: versionContext.threadId,
              assistantMessageId: assistantId, operation: versionContext.operation,
              prompt: request.content, timestamp: Date.now(), files: latestFiles,
              fileCount: Object.keys(latestFiles).length, changes: undefined,
            });
            savedVersion = true;
          }
          setGeneration({ status: "success", elapsedMs: elapsed(), currentPhase: undefined, currentStep: undefined, nextStep: undefined, preservedResult: false });
          setIsAssembling(false);
          return;
        }

        if (activeFlow !== "traditional") {
          fail("收到传统流程步骤前未确定传统流程");
          return;
        }
        const stepType = event.type;
        const stepData = event.data;
        const receivedAt = Date.now();
        const stageTimings = { ...useChatStore.getState().generation.stageTimings };
        if (lastStageAt !== undefined) stageTimings[stepType] = receivedAt - lastStageAt;
        lastStageAt = receivedAt;
        if (stepType === "files") {
          const files = getFilesPayload(stepData);
          if (files === undefined || Object.keys(files).length === 0) {
            fail("文件结果格式无效，未保存生成结果");
            return;
          }
          latestFiles = files;
        }
        if (stepType === "intent") {
          const productName = getIntentProductName(stepData);
          if (productName) updateProjectName(productName);
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
      if (isCurrentRequest() && !streamCompleted) {
        fail("生成流提前结束，未收到完成事件");
      }
    } catch (error: unknown) {
      if (!controller.signal.aborted && isCurrentRequest()) {
        fail(error instanceof Error ? error.message : "生成请求失败");
      }
    } finally {
      if (activeRequestRef.current?.id === requestId) {
        activeRequestRef.current = null;
        setLoading(false);
      }
    }
  }, [addMessage, appendMessageContent, archiveThoughts, addThought, collapsePhase,
    getCurrentThreadId, incrementVersion, markPendingThoughts, saveVersion,
    setCurrentFlow, setGeneration, setGeneratedFiles, setIsAssembling, setLoading,
    updatePhaseProgress, updateProjectName, updateThought]);

  const sendMessage = useCallback(async (
    content: string, attachments: Attachment[] | undefined, mockConfig: MockConfig,
  ) => {
    const state = useChatStore.getState();
    await runRequest({ content, attachments, mockConfig, history: [...state.messages], projectId: state.currentProjectId });
  }, [runRequest]);

  const retryLastMessage = useCallback(async () => {
    const request = lastRequestRef.current;
    if (request === null) {
      toast.error("没有可重新执行的请求");
      return;
    }
    await runRequest({ ...request, history: [...request.history] });
  }, [runRequest]);

  const cancelMessage = useCallback(() => {
    const activeRequest = activeRequestRef.current;
    if (activeRequest === null) return;
    activeRequestRef.current = null;
    activeRequest.controller.abort();
    if (activeRequest.assistantMessageId) {
      markPendingThoughts(activeRequest.assistantMessageId, "已停止接收后续结果");
    }
    const preservedResult = useSandpackStore.getState().generatedFiles !== null;
    setGeneration({ status: "cancelled", error: "已取消生成", elapsedMs: Date.now() - activeRequest.startedAt, preservedResult });
    setLoading(false);
    setIsAssembling(false);
  }, [markPendingThoughts, setGeneration, setIsAssembling, setLoading]);

  return {
    messages,
    isLoading,
    sendMessage,
    cancelMessage,
    retryLastMessage,
    canRetry: lastRequestRef.current !== null,
  };
}

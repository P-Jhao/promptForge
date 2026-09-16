"use client";

import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useChatStore } from "@/store/chatStore";
import { useSandpackStore } from "@/store/sandpackStore";
import type { ChatMessage } from "@/types/message";
import type { MockConfig } from "@/types/mock";
import { createBaseSnapshot, hashEditBase, hashResourceReferences } from "@/lib/changeContract";
import { canAttemptRepair, repairErrorSignature } from "@/lib/validationReport";
import type { RepairRequestContext } from "@/lib/validationReport";
import { classifyRequestIntent, isNewProjectRequest } from "@/lib/requestIntent";
import { applyStagedCandidate } from "./candidateActions";
import { runChatRequest } from "./chatRequestRunner";
import type { ActiveRequest, Attachment, RetryableRequest } from "./chatStreamUtils";

export function useChat() {
  const {
    messages, isLoading, markPendingThoughts, setGeneration, setLoading, candidate, finishCandidateRepair, addMessage,
  } = useChatStore();
  const { setIsAssembling } = useSandpackStore();
  const activeRequestRef = useRef<ActiveRequest | null>(null);
  const lastRequestRef = useRef<RetryableRequest | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => () => {
    const activeRequest = activeRequestRef.current;
    if (activeRequest === null) return;
    activeRequestRef.current = null;
    activeRequest.controller.abort();
    if (activeRequest.repair !== undefined) {
      finishCandidateRepair(activeRequest.repair.candidateId, "skipped", Date.now() - activeRequest.startedAt);
    }
    if (activeRequest.assistantMessageId) {
      markPendingThoughts(activeRequest.assistantMessageId, "已停止接收后续结果");
    }
    setGeneration({
      status: "cancelled", error: "已停止接收生成结果",
      elapsedMs: Date.now() - activeRequest.startedAt,
      preservedResult: useSandpackStore.getState().generatedFiles !== null,
    });
    setLoading(false);
    setIsAssembling(false);
  }, [finishCandidateRepair, markPendingThoughts, setGeneration, setIsAssembling, setLoading]);

  const runRequest = useCallback((request: RetryableRequest) => runChatRequest(request, {
    activeRequestRef, lastRequestRef, requestIdRef,
  }), []);

  const sendMessage = useCallback(async (
    content: string,
    attachments: Attachment[] | undefined,
    mockConfig: MockConfig,
  ) => {
    const state = useChatStore.getState();
    try {
      const sandpack = useSandpackStore.getState();
      const files = sandpack.currentFiles ?? sandpack.generatedFiles;
      const hasFiles = files !== null && Object.keys(files).length > 0;
      if (isNewProjectRequest(content)) {
        toast.info("请先确认创建独立项目；当前项目内容不会自动带入。");
        return;
      }
      const classification = classifyRequestIntent(content, hasFiles);
      if (classification.intent === "clarify") {
        const clarification = classification.clarification ?? "请补充你希望完成的页面或修改内容。";
        const userMessage: ChatMessage = {
          id: crypto.randomUUID(), role: "user", content, attachments,
        };
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(), role: "assistant", content: clarification,
        };
        addMessage(userMessage);
        addMessage(assistantMessage);
        return;
      }
      const operation = classification.intent === "edit" ? "edit" : "generate";
      const base = await createBaseSnapshot(
        state.currentProjectId,
        state.versions.at(-1)?.versionId ?? null,
        files,
        typeof window === "undefined" ? undefined : window.__resourceManifest,
      );
      if (operation === "edit" && Object.keys(base.files).length === 0) {
        throw new Error("编辑请求需要当前编辑器文件作为基线");
      }
      const latestState = useChatStore.getState();
      if (latestState.currentProjectId !== state.currentProjectId) {
        throw new Error("项目已切换，请在当前项目中重新发送需求");
      }
      if (latestState.isLoading || latestState.candidate !== null) {
        throw new Error("当前项目正在处理其他请求，请稍后再试");
      }
      await runRequest({
        content, attachments, mockConfig, history: [...state.messages],
        projectId: state.currentProjectId, operation, intent: classification.intent, base,
      });
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "无法冻结当前编辑文件");
    }
  }, [addMessage, runRequest]);

  const retryLastMessage = useCallback(async () => {
    const request = lastRequestRef.current;
    if (request === null) {
      toast.error("没有可重新执行的请求");
      return;
    }
    await runRequest({ ...request, runId: undefined, history: [...request.history] });
  }, [runRequest]);

  const repairCandidate = useCallback(async () => {
    const state = useChatStore.getState();
    const currentCandidate = state.candidate;
    if (currentCandidate === null) {
      toast.error("当前没有可修复的候选");
      return;
    }
    if (!canAttemptRepair(currentCandidate.validation)) {
      toast.error("该候选不满足有限修复条件，保留候选并请人工处理");
      return;
    }
    const errorSignature = repairErrorSignature(currentCandidate.validation);
    if (errorSignature === null) {
      toast.error("当前候选没有可自动修复的代码或运行错误");
      return;
    }
    try {
      const resources = await hashResourceReferences(currentCandidate.files, currentCandidate.resources);
      const runId = `run-${crypto.randomUUID()}`;
      const repair: RepairRequestContext = {
        candidateId: currentCandidate.candidateId,
        attempt: currentCandidate.validation.report.repairAttempts + 1,
        startedAt: Date.now(),
        errorSignature,
        previousHistory: [...currentCandidate.validation.report.repairHistory],
      };
      const base = {
        projectId: currentCandidate.projectId,
        versionId: currentCandidate.baseVersionId,
        hash: await hashEditBase(currentCandidate.files, resources),
        files: { ...currentCandidate.files },
        resources,
        sourceCandidateId: currentCandidate.candidateId,
        sourceBaseHash: currentCandidate.baseHash,
      };
      state.beginCandidateRepair(currentCandidate.candidateId, {
        attempt: repair.attempt,
        runId,
        status: "not-verified",
        durationMs: 0,
        errorSignature,
      });
      await runRequest({
        content: `请修复当前候选中的代码或运行问题，仅保留现有功能并返回最小结构化文件变更。诊断签名：${errorSignature}`,
        attachments: undefined,
        mockConfig: { global: false },
        history: [...state.messages],
        projectId: currentCandidate.projectId,
        operation: "edit",
        intent: "edit",
        runId,
        base,
        repair,
      });
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "无法准备候选修复");
    }
  }, [runRequest]);

  const applyCandidate = useCallback(async (): Promise<void> => {
    await applyStagedCandidate();
  }, []);

  const discardCandidate = useCallback(() => useChatStore.getState().clearCandidate(), []);

  const cancelMessage = useCallback(() => {
    const activeRequest = activeRequestRef.current;
    if (activeRequest === null) return;
    activeRequestRef.current = null;
    activeRequest.controller.abort();
    if (activeRequest.repair !== undefined) {
      finishCandidateRepair(activeRequest.repair.candidateId, "skipped", Date.now() - activeRequest.startedAt);
    }
    if (activeRequest.assistantMessageId) {
      markPendingThoughts(activeRequest.assistantMessageId, "已停止接收后续结果");
    }
    const preservedResult = useSandpackStore.getState().generatedFiles !== null;
    setGeneration({
      status: "cancelled", error: "已取消生成",
      elapsedMs: Date.now() - activeRequest.startedAt, preservedResult,
    });
    setLoading(false);
    setIsAssembling(false);
  }, [finishCandidateRepair, markPendingThoughts, setGeneration, setIsAssembling, setLoading]);

  return {
    messages,
    isLoading,
    sendMessage,
    cancelMessage,
    retryLastMessage,
    candidate,
    applyCandidate,
    repairCandidate,
    discardCandidate,
    canRetry: lastRequestRef.current !== null && lastRequestRef.current.repair === undefined,
  };
}

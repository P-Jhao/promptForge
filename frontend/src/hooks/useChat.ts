"use client";

import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useChatStore } from "@/store/chatStore";
import { useSandpackStore } from "@/store/sandpackStore";
import type { MockConfig } from "@/types/mock";
import { createBaseSnapshot } from "@/lib/changeContract";
import { applyStagedCandidate } from "./candidateActions";
import { runChatRequest } from "./chatRequestRunner";
import type { ActiveRequest, Attachment, RequestOperation, RetryableRequest } from "./chatStreamUtils";

export function useChat() {
  const {
    messages, isLoading, markPendingThoughts, setGeneration, setLoading, candidate,
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
  }, [markPendingThoughts, setGeneration, setIsAssembling, setLoading]);

  const runRequest = useCallback((request: RetryableRequest) => runChatRequest(request, {
    activeRequestRef, lastRequestRef, requestIdRef,
  }), []);

  const sendMessage = useCallback(async (
    content: string,
    attachments: Attachment[] | undefined,
    mockConfig: MockConfig,
    operation: RequestOperation = "generate",
  ) => {
    const state = useChatStore.getState();
    try {
      const sandpack = useSandpackStore.getState();
      const files = sandpack.currentFiles ?? sandpack.generatedFiles;
      const base = await createBaseSnapshot(
        state.currentProjectId,
        state.versions.at(-1)?.versionId ?? null,
        files,
        typeof window === "undefined" ? undefined : window.__resourceManifest,
      );
      if (operation === "edit" && Object.keys(base.files).length === 0) {
        throw new Error("编辑请求需要当前编辑器文件作为基线");
      }
      await runRequest({
        content, attachments, mockConfig, history: [...state.messages],
        projectId: state.currentProjectId, operation, base,
      });
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "无法冻结当前编辑文件");
    }
  }, [runRequest]);

  const retryLastMessage = useCallback(async () => {
    const request = lastRequestRef.current;
    if (request === null) {
      toast.error("没有可重新执行的请求");
      return;
    }
    await runRequest({ ...request, history: [...request.history] });
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
  }, [markPendingThoughts, setGeneration, setIsAssembling, setLoading]);

  return {
    messages,
    isLoading,
    sendMessage,
    cancelMessage,
    retryLastMessage,
    candidate,
    applyCandidate,
    discardCandidate,
    canRetry: lastRequestRef.current !== null,
  };
}

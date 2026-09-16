import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import { PREVIEW_TIMINGS } from "@/constants/preview";
import { readPreviewBridgeEvent, requestPreviewMount } from "./previewBridge";
import {
  INITIAL_PREVIEW_DIAGNOSTICS,
  reducePreviewDiagnostics,
  type PreviewDiagnosticsState,
} from "./previewDiagnosticsState";
import type { ValidationErrorCategory } from "@/types/validation";

type SandpackListen = (listener: (message: unknown) => void) => () => void;

export type PreviewDiagnostics = PreviewDiagnosticsState;

export function usePreviewDiagnostics(
  listen: SandpackListen,
  previewRootRef: RefObject<HTMLDivElement | null>,
  retryKey: number,
): PreviewDiagnostics {
  const mountedBeforeRef = useRef(false);
  const buildSucceededRef = useRef(false);
  const mountReadyRef = useRef(false);
  const listenRef = useRef(listen);
  const [diagnostics, setDiagnostics] = useState(INITIAL_PREVIEW_DIAGNOSTICS);

  useLayoutEffect(() => {
    listenRef.current = listen;
  }, [listen]);

  useLayoutEffect(() => {
    let disposed = false;
    let longWaitTimer: number | undefined;
    let timeoutTimer: number | undefined;

    const clearTimers = (): void => {
      if (longWaitTimer !== undefined) window.clearTimeout(longWaitTimer);
      if (timeoutTimer !== undefined) window.clearTimeout(timeoutTimer);
    };
    const clearTimersWhenReady = (): void => {
      if (buildSucceededRef.current && mountReadyRef.current) clearTimers();
    };
    const beginWaiting = (): void => {
      buildSucceededRef.current = false;
      mountReadyRef.current = false;
      setDiagnostics((current) => reducePreviewDiagnostics(current, {
        type: "restart",
        hasRenderedBefore: mountedBeforeRef.current,
      }));
      clearTimers();
      longWaitTimer = window.setTimeout(() => {
        if (!disposed) setDiagnostics((current) => ({ ...current, longWait: true }));
      }, PREVIEW_TIMINGS.longWaitMs);
      timeoutTimer = window.setTimeout(() => {
        if (!disposed) setDiagnostics((current) => reducePreviewDiagnostics(current, { type: "external-timeout" }));
      }, PREVIEW_TIMINGS.timeoutMs);
    };

    beginWaiting();

    const handleSandpackMessage = (message: unknown): void => {
      if (!isRecord(message) || typeof message.type !== "string") return;
      const eventType = message.type;
      if (eventType === "start" || eventType === "compile") {
        beginWaiting();
        return;
      }
      if (eventType === "success") {
        setDiagnostics((current) => reducePreviewDiagnostics(current, { type: "sandpack-success" }));
        return;
      }
      if (eventType === "state") {
        setDiagnostics((current) => reducePreviewDiagnostics(current, { type: "sandpack-state" }));
        return;
      }
      if (eventType === "done") {
        if (message.compilatonError !== false) {
          buildSucceededRef.current = false;
          clearTimers();
          const buildError = message.compilatonError === true
            ? readSandpackError(message)
            : "Sandpack 完成事件缺少编译结果，无法确认预览构建成功。";
          setDiagnostics((current) => reducePreviewDiagnostics(current, {
            type: "build-error",
            message: buildError,
            errorCategory: classifyPreviewError(buildError, "build"),
          }));
          return;
        }
        buildSucceededRef.current = true;
        setDiagnostics((current) => reducePreviewDiagnostics(current, { type: "sandpack-done", compilationError: false }));
        clearTimersWhenReady();
        requestPreviewMount(getPreviewIframe(previewRootRef));
        return;
      }
      if (
        eventType === "action" &&
        (message.action === "show-error" ||
          (message.action === "notification" && message.notificationType === "error"))
      ) {
        buildSucceededRef.current = false;
        clearTimers();
        const errorMessage = readSandpackError(message);
        const errorCategory = classifyPreviewError(errorMessage, message.action === "notification" ? "runtime" : "build");
        setDiagnostics((current) => reducePreviewDiagnostics(current, {
          type: "build-error",
          message: errorMessage,
          errorCategory,
        }));
      }
    };

    const handleWindowMessage = (event: MessageEvent<unknown>): void => {
      const iframe = previewRootRef.current?.querySelector("iframe");
      if (iframe === undefined || iframe === null || iframe.contentWindow === null || event.source !== iframe.contentWindow) return;
      const bridgeEvent = readPreviewBridgeEvent(event.data);
      if (bridgeEvent === null) return;
      if (bridgeEvent.type === "app-mounted") {
        mountReadyRef.current = true;
        mountedBeforeRef.current = true;
        setDiagnostics((current) => reducePreviewDiagnostics(current, { type: "app-mounted" }));
        clearTimersWhenReady();
        return;
      }
      clearTimers();
      const errorMessage = bridgeEvent.message ?? "预览应用发生运行时错误";
      setDiagnostics((current) => reducePreviewDiagnostics(current, {
        type: "runtime-error",
        message: errorMessage,
        errorCategory: classifyPreviewError(errorMessage, "runtime"),
      }));
    };

    const unsubscribe = listenRef.current(handleSandpackMessage);
    window.addEventListener("message", handleWindowMessage);
    requestPreviewMount(getPreviewIframe(previewRootRef));
    return () => {
      disposed = true;
      clearTimers();
      unsubscribe();
      window.removeEventListener("message", handleWindowMessage);
    };
  }, [previewRootRef, retryKey]);

  return diagnostics;
}

function getPreviewIframe(previewRootRef: RefObject<HTMLDivElement | null>): HTMLIFrameElement | null {
  return previewRootRef.current?.querySelector<HTMLIFrameElement>("iframe") ?? null;
}

function readSandpackError(message: Record<string, unknown>): string {
  if (typeof message.message === "string" && message.message.length > 0) return message.message;
  if (typeof message.title === "string" && message.title.length > 0) return message.title;
  return "Sandpack 构建失败，请查看代码中的错误位置。";
}

function classifyPreviewError(
  message: string,
  fallback: ValidationErrorCategory,
): ValidationErrorCategory {
  const normalized = message.toLowerCase();
  if (normalized.includes("time_out") || normalized.includes("timeout") || normalized.includes("timed out")) return "external-timeout";
  if (normalized.includes("network") || normalized.includes("failed to fetch") || normalized.includes("dependency install")) return "network";
  if (normalized.includes("resource") || normalized.includes("asset") || normalized.includes("404") || normalized.includes(".svg")) return "resource";
  return fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

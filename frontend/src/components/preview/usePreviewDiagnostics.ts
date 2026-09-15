import { useEffect, useRef, useState, type RefObject } from "react";
import { PREVIEW_TIMINGS } from "@/constants/preview";
import { readPreviewBridgeEvent } from "./previewBridge";

type SandpackListen = (listener: (message: unknown) => void) => () => void;

export interface PreviewDiagnostics {
  buildState: "waiting" | "success" | "error";
  mountState: "waiting" | "ready";
  buildError: string | null;
  runtimeError: string | null;
  longWait: boolean;
  timedOut: boolean;
  hasRenderedBefore: boolean;
  lastEvent: string | null;
}

const INITIAL_STATE: PreviewDiagnostics = {
  buildState: "waiting",
  mountState: "waiting",
  buildError: null,
  runtimeError: null,
  longWait: false,
  timedOut: false,
  hasRenderedBefore: false,
  lastEvent: null,
};

export function usePreviewDiagnostics(
  listen: SandpackListen,
  previewRootRef: RefObject<HTMLDivElement | null>,
  retryKey: number,
): PreviewDiagnostics {
  const mountedBeforeRef = useRef(false);
  const listenRef = useRef(listen);
  const [diagnostics, setDiagnostics] = useState(INITIAL_STATE);

  useEffect(() => {
    listenRef.current = listen;
  }, [listen]);

  useEffect(() => {
    let disposed = false;
    let longWaitTimer: number | undefined;
    let timeoutTimer: number | undefined;

    const clearTimers = (): void => {
      if (longWaitTimer !== undefined) window.clearTimeout(longWaitTimer);
      if (timeoutTimer !== undefined) window.clearTimeout(timeoutTimer);
    };
    const beginWaiting = (): void => {
      setDiagnostics((current) => ({
        ...current,
        buildState: "waiting",
        mountState: "waiting",
        buildError: null,
        runtimeError: null,
        longWait: false,
        timedOut: false,
        lastEvent: "start",
        hasRenderedBefore: mountedBeforeRef.current,
      }));
      clearTimers();
      longWaitTimer = window.setTimeout(() => {
        if (!disposed) setDiagnostics((current) => ({ ...current, longWait: true }));
      }, PREVIEW_TIMINGS.longWaitMs);
      timeoutTimer = window.setTimeout(() => {
        if (!disposed) setDiagnostics((current) => ({ ...current, timedOut: true }));
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
        setDiagnostics((current) => ({ ...current, lastEvent: eventType }));
        return;
      }
      if (eventType === "state") {
        setDiagnostics((current) => ({ ...current, lastEvent: eventType }));
        return;
      }
      if (eventType === "done") {
        if (message.compilatonError !== false) {
          clearTimers();
          setDiagnostics((current) => ({
            ...current,
            buildState: "error",
            buildError: message.compilatonError === true
              ? readSandpackError(message)
              : "Sandpack 完成事件缺少编译结果，无法确认预览构建成功。",
            lastEvent: eventType,
          }));
          return;
        }
        setDiagnostics((current) => ({ ...current, buildState: "success", lastEvent: eventType }));
        return;
      }
      if (
        eventType === "action" &&
        (message.action === "show-error" ||
          (message.action === "notification" && message.notificationType === "error"))
      ) {
        clearTimers();
        setDiagnostics((current) => ({
          ...current,
          buildState: "error",
          buildError: readSandpackError(message),
          lastEvent: "action/show-error",
        }));
      }
    };

    const handleWindowMessage = (event: MessageEvent<unknown>): void => {
      const iframe = previewRootRef.current?.querySelector("iframe");
      if (iframe === undefined || iframe === null || iframe.contentWindow === null || event.source !== iframe.contentWindow) return;
      const bridgeEvent = readPreviewBridgeEvent(event.data);
      if (bridgeEvent === null) return;
      if (bridgeEvent.type === "app-mounted") {
        mountedBeforeRef.current = true;
        clearTimers();
        setDiagnostics((current) => ({ ...current, mountState: "ready", hasRenderedBefore: true, timedOut: false, lastEvent: "app-mounted" }));
        return;
      }
      clearTimers();
      setDiagnostics((current) => ({
        ...current,
        runtimeError: bridgeEvent.message ?? "预览应用发生运行时错误",
        lastEvent: "runtime-error",
      }));
    };

    const unsubscribe = listenRef.current(handleSandpackMessage);
    window.addEventListener("message", handleWindowMessage);
    return () => {
      disposed = true;
      clearTimers();
      unsubscribe();
      window.removeEventListener("message", handleWindowMessage);
    };
  }, [previewRootRef, retryKey]);

  return diagnostics;
}

function readSandpackError(message: Record<string, unknown>): string {
  if (typeof message.message === "string" && message.message.length > 0) return message.message;
  if (typeof message.title === "string" && message.title.length > 0) return message.title;
  return "Sandpack 构建失败，请查看代码中的错误位置。";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

import type { ValidationErrorCategory } from "@/types/validation";

export type PreviewBuildState = "waiting" | "success" | "error";
export type PreviewMountState = "waiting" | "ready";

export interface PreviewDiagnosticsState {
  buildState: PreviewBuildState;
  mountState: PreviewMountState;
  buildError: string | null;
  runtimeError: string | null;
  errorCategory: ValidationErrorCategory | null;
  longWait: boolean;
  timedOut: boolean;
  hasRenderedBefore: boolean;
  lastEvent: string | null;
}

export const INITIAL_PREVIEW_DIAGNOSTICS: PreviewDiagnosticsState = {
  buildState: "waiting",
  mountState: "waiting",
  buildError: null,
  runtimeError: null,
  errorCategory: null,
  longWait: false,
  timedOut: false,
  hasRenderedBefore: false,
  lastEvent: null,
};

export type PreviewDiagnosticEvent =
  | { type: "restart"; hasRenderedBefore: boolean }
  | { type: "sandpack-success" | "sandpack-state" }
  | { type: "sandpack-done"; compilationError: false }
  | { type: "external-timeout" }
  | { type: "build-error"; message: string; errorCategory: ValidationErrorCategory }
  | { type: "runtime-error"; message: string; errorCategory: ValidationErrorCategory }
  | { type: "app-mounted" };

export function reducePreviewDiagnostics(
  state: PreviewDiagnosticsState,
  event: PreviewDiagnosticEvent,
): PreviewDiagnosticsState {
  switch (event.type) {
    case "restart":
      return {
        ...state,
        buildState: "waiting",
        mountState: "waiting",
        buildError: null,
        runtimeError: null,
        errorCategory: null,
        longWait: false,
        timedOut: false,
        hasRenderedBefore: event.hasRenderedBefore,
        lastEvent: "start",
      };
    case "sandpack-success":
      return { ...state, lastEvent: "success" };
    case "sandpack-state":
      return { ...state, lastEvent: "state" };
    case "sandpack-done":
      return {
        ...state,
        buildState: "success",
        buildError: null,
        errorCategory: state.runtimeError === null ? null : state.errorCategory,
        lastEvent: "done",
      };
    case "external-timeout":
      return { ...state, timedOut: true, lastEvent: "timeout" };
    case "build-error":
      return {
        ...state,
        buildState: "error",
        buildError: event.message,
        runtimeError: null,
        errorCategory: event.errorCategory,
        lastEvent: "action/show-error",
      };
    case "runtime-error":
      return {
        ...state,
        runtimeError: event.message,
        errorCategory: event.errorCategory,
        lastEvent: "runtime-error",
      };
    case "app-mounted":
      return {
        ...state,
        mountState: "ready",
        hasRenderedBefore: true,
        lastEvent: "app-mounted",
      };
  }
}

export function isPreviewDiagnosticsReady(state: PreviewDiagnosticsState): boolean {
  return state.buildState === "success"
    && state.mountState === "ready"
    && state.buildError === null
    && state.runtimeError === null
    && !state.timedOut;
}

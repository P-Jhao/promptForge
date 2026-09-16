// API 相关类型定义

import type { BackendFlowType, StepType } from "./flow";
import type { CandidateChange, CandidateResourceReference } from "./candidate";

/** 客户端请求可以明确声明的处理操作。 */
export type ChatOperation = "generate" | "edit" | "chat";

/**
 * SSE 流式事件的基础结构
 */
export interface StreamErrorData {
  /** LangGraph 节点名称，例如 serviceNode */
  node?: string;
  /** 后端返回的具体错误信息 */
  message?: string;
}

/** 后端 flow 事件载荷 */
export interface FlowEventData {
  flow: BackendFlowType;
  operation?: ChatOperation;
}

/** Chat flow 的文本增量事件载荷 */
export interface ChatEventData {
  delta: string;
}

export interface ModeEventData {
  mode: "mock" | "real";
  forced: boolean;
  message?: string;
}

export interface FlowStreamEvent {
  type: "flow";
  data: FlowEventData;
  message?: string;
}

export interface ChatStreamEvent {
  type: "chat";
  data: ChatEventData;
  message?: string;
}

export interface ModeStreamEvent {
  type: "mode";
  data: ModeEventData;
  message?: string;
}

export interface ErrorStreamEvent {
  type: "error";
  data?: StreamErrorData;
  message?: string;
}

export interface DoneStreamEvent {
  type: "done";
  data?: unknown;
  message?: string;
}

export interface CandidateStreamEvent {
  type: "candidate";
  data: {
    candidateId: string;
    runId: string;
    operation: "edit";
    projectId: string;
    baseVersionId: string | null;
    /** Hash of the files/resources supplied to this model run. */
    baseHash: string;
    /** Hash of the original workspace used by the eventual apply gate. */
    acceptanceBaseHash: string;
    sourceCandidateId?: string;
    sourceBaseHash?: string;
    files: Record<string, string>;
    resources: CandidateResourceReference[];
    changes: CandidateChange[];
    summary: string;
  };
  message?: string;
}

export interface StepStreamEvent {
  type: StepType;
  data?: unknown;
  message?: string;
}

/** SSE 流式事件的明确联合类型 */
export type StreamEvent =
  | FlowStreamEvent
  | ChatStreamEvent
  | ModeStreamEvent
  | CandidateStreamEvent
  | ErrorStreamEvent
  | DoneStreamEvent
  | StepStreamEvent;

/**
 * 具体的事件类型枚举 (与后端 events 对应)
 * 使用 StepType 联合类型统一 Traditional 和 Figma 流程的步骤
 */
export type StreamEventType = StreamEvent["type"];

/**
 * 具体的事件载荷可以根据需要在此扩展，
 * 目前为了松耦合，我们在 api service 层使用 unknown，在业务 hook 层再去 cast 具体类型。
 */

// Store 相关类型定义
import type { ReactNode } from "react";
import type { ChatMessage } from "./message";
import type { FlowType, Phase, StepType } from "./flow";
import type { ProjectHydration, VersionMetadata } from "./project";
import type { CandidateState } from "./candidate";
import type { RepairAttempt, ValidationErrorCategory, ValidationReport, ValidationStatus } from "./validation";
import type { CaseResourceManifest } from "@/cases/resourceManifest";

// ============================================================================
// Sandpack Store 类型
// ============================================================================

/** 视图模式 */
export type ViewMode = "preview" | "code";

/** Sandpack 文件格式 */
export type SandpackFiles = Record<string, { code: string }>;

/** Sandpack Store 状态与方法 */
export interface SandpackStore {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  /** AI 生成的文件 */
  generatedFiles: SandpackFiles | null;
  setGeneratedFiles: (files: Record<string, string>) => void;
  /** Sandpack 当前文件内容（包含编辑器中的本地改动） */
  currentFiles: SandpackFiles | null;
  setCurrentFiles: (files: SandpackFiles) => void;
  /** 预置案例专用的展示文件，不属于当前项目工作副本。 */
  previewFiles: SandpackFiles | null;
  setPreviewFiles: (files: SandpackFiles | null) => void;
  /** 预置案例专用的资源清单，不参与项目草稿、版本或消息持久化。 */
  previewManifest: CaseResourceManifest | undefined;
  setPreviewManifest: (manifest: CaseResourceManifest | undefined) => void;
  clearProjectFiles: () => void;
  clearGeneratedFiles: () => void;

  /** 组装状态 */
  isAssembling: boolean;
  setIsAssembling: (isAssembling: boolean) => void;
}

export type GenerationStatus =
  | "idle"
  | "running"
  | "success"
  | "error"
  | "cancelled";

export type GenerationMode = "mock" | "real";

export interface GenerationState {
  status: GenerationStatus;
  /** 当前请求/候选的可追溯运行 ID；不包含密钥或完整敏感请求。 */
  runId?: string;
  /** 最近一次候选校验摘要，供本地运行记录保存；候选文件仍保持隔离。 */
  validationReport?: ValidationReport;
  mode?: GenerationMode;
  modeForced?: boolean;
  currentPhase?: Phase;
  currentStep?: StepType;
  completedSteps: StepType[];
  failedStep?: string;
  failedNode?: string;
  error?: string;
  startedAt?: number;
  elapsedMs?: number;
  /** 从首次阶段事件到下一阶段事件的客户端接收间隔，包含网络传输。 */
  stageTimings: Record<string, number>;
  preservedResult: boolean;
  nextStep?: string;
}

// ============================================================================
// Chat Store 类型
// ============================================================================

/** 版本变更记录 */
export interface VersionChanges {
  added: string[]; // 新增的文件路径
  modified: string[]; // 修改的文件路径
  deleted: string[]; // 删除的文件路径
}

/** 项目版本 */
export interface ProjectVersion {
  versionId: string; // 版本唯一ID "v1", "v2", "v3"...
  versionNumber: number; // 版本号 1, 2, 3...
  threadId: string; // 对应的 LangGraph thread_id
  assistantMessageId: string; // 关联生成该版本的 assistant 消息

  /** 版本元数据 */
  operation: "create" | "edit" | "restore"; // 操作类型：创建、编辑或恢复
  prompt: string; // 用户输入的需求描述
  timestamp: number; // 创建时间戳

  /** 文件快照 */
  files: Record<string, string> | null; // 该版本生成的所有文件
  fileCount: number; // 文件数量

  /** 变更记录（相对于上一版本） */
  changes?: VersionChanges;
  /** 可编辑的展示元数据；不会改变版本快照、hash 或版本号。 */
  label?: string;
  notes?: string;
  /** 恢复或编辑时的来源版本，用于追溯，不改变旧版本内容 */
  parentVersionId?: string;
  restoredFromVersionId?: string;
}

/** 思维链项的接口 (参考 ant-design/x 的 ThoughtItem) */
export interface ThoughtItem {
  key: string;
  title: ReactNode;
  status?: "pending" | "success" | "error";
  description?: ReactNode;
  content?: ReactNode; // 存储具体的输出结果 (JSON/Text)

  /** 阶段聚合相关字段 */
  type?: "node" | "phase" | "history"; // 类型：节点级 or 阶段级 or 历史记录
  phase?: string; // 所属阶段
  nodeCount?: number; // 阶段包含的节点数（仅 type=phase 时使用）
  completedNodes?: string[]; // 已完成的节点列表（仅 type=phase 时使用）
  expanded?: boolean; // 阶段/历史是否展开（type=phase/history 时使用）
  nodeDetails?: ThoughtItem[]; // 节点详细信息（用于展开显示）
  historyThoughts?: ThoughtItem[]; // 历史思维链（仅 type=history 时使用）
  timestamp?: number; // 创建时间戳（仅 type=history 时使用，用于显示时间）
}

/** Chat Store 状态与方法 */
export interface ChatState {
  /** 项目管理 */
  currentProjectId: string; // 当前项目 ID
  projectName: string; // 当前项目名称

  /** 版本管理 */
  currentVersion: number; // 当前版本号
  versions: ProjectVersion[]; // 版本历史列表

  /** 流程类型 */
  currentFlow: FlowType | null; // 当前流程类型（traditional / chat / figma）

  messages: ChatMessage[]; // 纯消息数据，不含 thoughts
  messageThoughts: Record<string, ThoughtItem[]>; // messageId -> thoughts 映射
  isLoading: boolean;
  phaseCompletion: Record<string, { completed: number; total: number }>; // 阶段完成进度
  generation: GenerationState;
  candidate: CandidateState | null;

  /** Flow Actions */
  setCurrentFlow: (flow: FlowType | null) => void; // 设置当前流程类型

  /** Project Actions */
  createNewProject: (name?: string) => void; // 创建新项目
  setCurrentProject: (projectId: string, name?: string) => void; // 切换项目
  resetProject: () => void; // 重置当前项目（清空消息和思维链）
  updateProjectName: (name: string) => void; // 更新项目名称

  /** Version Actions */
  saveVersion: (version: Omit<ProjectVersion, "versionId">) => void; // 保存版本快照
  updateVersionMetadata: (versionId: string, metadata: VersionMetadata) => void;
  incrementVersion: () => number; // 递增版本号并返回新版本号
  getCurrentThreadId: () => string; // 获取当前版本的 threadId

  /** Actions */
  hydrateProject: (project: ProjectHydration) => void;
  stageCandidate: (candidate: CandidateState) => void;
  setCandidatePreviewStatus: (
    candidateId: string,
    status: CandidateState["validation"]["preview"],
    errorCategory?: ValidationErrorCategory,
    summary?: string,
    evidence?: string,
  ) => void;
  beginCandidateRepair: (candidateId: string, attempt: RepairAttempt) => void;
  finishCandidateRepair: (candidateId: string, status: ValidationStatus, durationMs: number) => void;
  setCandidateConflict: (reason: string) => void;
  clearCandidate: () => void;
  addMessage: (message: ChatMessage) => void;
  appendMessageContent: (messageId: string, delta: string) => void;
  setLoading: (loading: boolean) => void;
  setGeneration: (update: Partial<GenerationState>) => void;
  resetGeneration: () => void;
  resetMessage: (messageId: string) => void;
  clearMessageThoughts: (messageId: string) => void;
  markPendingThoughts: (messageId: string, description: string) => void;

  /** ThoughtChain Actions */
  addThought: (messageId: string, thought: ThoughtItem) => void;
  updateThought: (
    messageId: string,
    key: string,
    updates: Partial<ThoughtItem>,
  ) => void;
  archiveThoughts: (messageId: string) => void;

  /** Phase Actions */
  updatePhaseProgress: (phase: string) => void;
  collapsePhase: (messageId: string, phase: string) => void;
  togglePhaseExpansion: (phaseKey: string) => void;

  /** History Actions */
  toggleHistoryExpansion: (historyKey: string) => void;
}

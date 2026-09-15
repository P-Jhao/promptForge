import { create } from "zustand";
import { PHASE_NODES, PHASE_INFO, PhaseName } from "@/constants/chat";
import type {
  ChatState,
  ThoughtItem,
  ProjectVersion,
  VersionChanges,
  GenerationState,
} from "@/types/store";
import type { CandidateState } from "@/types/candidate";
import { updateValidationLayer } from "@/lib/validationReport";
import type { RepairAttempt, ValidationErrorCategory, ValidationStatus } from "@/types/validation";

// Re-export types for backward compatibility
export type { ThoughtItem, ProjectVersion, VersionChanges };

// 生成唯一项目 ID 的工具函数
const generateProjectId = () => {
  return `project-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

const initialGeneration: GenerationState = {
  status: "idle",
  completedSteps: [],
  stageTimings: {},
  preservedResult: false,
};

export const useChatStore = create<ChatState>((set, get) => ({
  // 初始化项目状态
  currentProjectId: generateProjectId(),
  projectName: "新项目",

  // 初始化版本状态
  currentVersion: 0, // 0 表示还未创建第一个版本
  versions: [],

  // 初始化流程类型
  currentFlow: null,

  messages: [],
  messageThoughts: {}, // ✨ 初始化思维链映射
  isLoading: false,
  phaseCompletion: {},
  generation: initialGeneration,
  candidate: null,

  // 设置当前流程类型
  setCurrentFlow: (flow) => set({ currentFlow: flow }),

  // 创建新项目
  createNewProject: (name) =>
    set({
      currentProjectId: generateProjectId(),
      projectName: name || "新项目",
      currentVersion: 0, // 重置版本号
      versions: [], // 清空版本历史
      currentFlow: null, // 重置流程类型
      messages: [],
      messageThoughts: {},
      phaseCompletion: {},
      generation: { ...initialGeneration },
      isLoading: false,
      candidate: null,
    }),

  // 切换项目（未来可扩展为加载历史项目）
  setCurrentProject: (projectId, name) =>
    set({
      currentProjectId: projectId,
      projectName: name || "项目",
    }),

  // 重置当前项目
  resetProject: () =>
    set((state) => ({
      messages: [],
      messageThoughts: {},
      phaseCompletion: {},
      generation: { ...initialGeneration },
      isLoading: false,
      // 保留 projectId 和 projectName
      currentProjectId: state.currentProjectId,
      projectName: state.projectName,
      candidate: null,
    })),

  // 更新项目名称
  updateProjectName: (name) => set({ projectName: name }),

  hydrateProject: (project) =>
    set({
      currentProjectId: project.projectId,
      projectName: project.projectName,
      currentVersion: project.currentVersion,
      versions: project.versions,
      messages: project.messages,
      messageThoughts: {},
      phaseCompletion: {},
      currentFlow: null,
      generation: { ...initialGeneration },
      isLoading: false,
      candidate: null,
    }),

  stageCandidate: (candidate: CandidateState) => set((state) => ({
    candidate,
    generation: {
      ...state.generation,
      runId: candidate.runId,
      validationReport: candidate.validation.report,
    },
  })),

  setCandidatePreviewStatus: (
    candidateId: string,
    status: CandidateState["validation"]["preview"],
    errorCategory?: ValidationErrorCategory,
    summary?: string,
    evidence?: string,
  ) => set((state) => {
    if (state.candidate === null || state.candidate.candidateId !== candidateId) return state;
    const nextValidation = updateValidationLayer(
      state.candidate.validation,
      "L2",
      status,
      summary ?? (status === "pass" ? "真实预览已构建并完成应用挂载" : "等待真实预览证据"),
      evidence,
      errorCategory,
    );
    return {
      candidate: { ...state.candidate, validation: nextValidation },
      generation: {
        ...state.generation,
        runId: state.candidate.runId,
        validationReport: nextValidation.report,
      },
    };
  }),

  beginCandidateRepair: (candidateId: string, attempt: RepairAttempt) => set((state) => {
    if (state.candidate === null || state.candidate.candidateId !== candidateId) return state;
    const report = state.candidate.validation.report;
    const repairHistory = [...report.repairHistory, { ...attempt, status: "not-verified" as const }];
    const layers = report.layers.map((layer) => layer.id === "L5"
      ? { ...layer, status: "not-verified" as const, summary: "修复请求进行中", updatedAt: Date.now() }
      : layer);
    const validation = {
      ...state.candidate.validation,
      report: {
        ...report,
        layers,
        overall: report.overall,
        repairAttempts: repairHistory.length,
        repairDurationMs: repairHistory.reduce((total, item) => total + item.durationMs, 0),
        repairHistory,
        updatedAt: Date.now(),
      },
    };
    return {
      candidate: { ...state.candidate, validation },
      generation: {
        ...state.generation,
        runId: state.candidate.runId,
        validationReport: validation.report,
      },
    };
  }),

  finishCandidateRepair: (candidateId: string, status: ValidationStatus, durationMs: number) => set((state) => {
    if (state.candidate === null || state.candidate.candidateId !== candidateId) return state;
    const report = state.candidate.validation.report;
    if (report.repairHistory.length === 0) return state;
    const lastIndex = report.repairHistory.length - 1;
    const repairHistory = report.repairHistory.map((attempt, index) => index === lastIndex
      ? { ...attempt, status, durationMs: Math.max(attempt.durationMs, durationMs) }
      : attempt);
    const validation = {
      ...state.candidate.validation,
      report: {
        ...report,
        layers: report.layers.map((layer) => layer.id === "L5"
          ? { ...layer, status, summary: status === "skipped" ? "修复已取消或被环境阻断" : "修复请求未产生可应用候选", updatedAt: Date.now() }
          : layer),
        repairDurationMs: repairHistory.reduce((total, item) => total + item.durationMs, 0),
        repairHistory,
        updatedAt: Date.now(),
      },
    };
    return {
      candidate: { ...state.candidate, validation },
      generation: {
        ...state.generation,
        runId: state.candidate.runId,
        validationReport: validation.report,
      },
    };
  }),

  setCandidateConflict: (reason: string) => set((state) => {
    if (state.candidate === null) return state;
    const validation = updateValidationLayer(
      state.candidate.validation,
      "L0",
      "fail",
      reason,
      undefined,
      "conflict",
    );
    return {
      candidate: {
        ...state.candidate,
        status: "conflict",
        conflictReason: reason,
        validation,
      },
      generation: {
        ...state.generation,
        runId: state.candidate.runId,
        validationReport: validation.report,
      },
    };
  }),

  clearCandidate: () => set({ candidate: null }),

  // 版本管理方法

  // 递增版本号并返回新版本号
  incrementVersion: () => {
    const state = get();
    const newVersion = state.currentVersion + 1;
    set({ currentVersion: newVersion });
    return newVersion;
  },

  // 获取当前版本的 threadId
  getCurrentThreadId: () => {
    const state = get();
    return `${state.currentProjectId}-v${state.currentVersion}`;
  },

  // 保存版本快照
  saveVersion: (versionData) =>
    set((state) => {
      const versionId = `v${versionData.versionNumber}`;
      const newVersion: ProjectVersion = {
        ...versionData,
        versionId,
      };

      console.log("[ChatStore] Saving version:", {
        versionNumber: versionData.versionNumber,
        operation: versionData.operation,
        fileCount: versionData.fileCount,
        threadId: versionData.threadId,
      });

      return {
        versions: [...state.versions, newVersion],
      };
    }),

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  appendMessageContent: (messageId, delta) =>
    set((state) => {
      const message = state.messages.find((item) => item.id === messageId);
      if (!message) {
        throw new Error(`Cannot append content: message ${messageId} was not found`);
      }

      return {
        messages: state.messages.map((item) =>
          item.id === messageId
            ? { ...item, content: `${item.content}${delta}` }
            : item,
        ),
      };
    }),

  setLoading: (loading) => set({ isLoading: loading }),

  setGeneration: (update) =>
    set((state) => ({ generation: { ...state.generation, ...update } })),

  resetGeneration: () => set({ generation: { ...initialGeneration } }),

  resetMessage: (messageId) =>
    set((state) => ({
      messages: state.messages.map((message) =>
        message.id === messageId ? { ...message, content: "" } : message,
      ),
    })),

  clearMessageThoughts: (messageId) =>
    set((state) => ({
      messageThoughts: { ...state.messageThoughts, [messageId]: [] },
      phaseCompletion: {},
    })),

  markPendingThoughts: (messageId, description) =>
    set((state) => ({
      messageThoughts: {
        ...state.messageThoughts,
        [messageId]: (state.messageThoughts[messageId] ?? []).map((thought) =>
          thought.status === "pending"
            ? { ...thought, status: "error", description }
            : thought,
        ),
      },
    })),

  addThought: (messageId, thought) =>
    set((state) => {
      const currentThoughts = state.messageThoughts[messageId] || [];
      return {
        messageThoughts: {
          ...state.messageThoughts,
          [messageId]: [...currentThoughts, thought],
        },
      };
    }),

  updateThought: (messageId, key, updates) =>
    set((state) => {
      const currentThoughts = state.messageThoughts[messageId];
      if (!currentThoughts) return state;

      return {
        messageThoughts: {
          ...state.messageThoughts,
          [messageId]: currentThoughts.map((t) =>
            t.key === key ? { ...t, ...updates } : t,
          ),
        },
      };
    }),

  updatePhaseProgress: (phase) =>
    set((state) => {
      const phaseNodes = PHASE_NODES[phase as PhaseName] || [];
      const current = state.phaseCompletion[phase] || {
        completed: 0,
        total: phaseNodes.length,
      };

      return {
        phaseCompletion: {
          ...state.phaseCompletion,
          [phase]: {
            ...current,
            completed: current.completed + 1,
          },
        },
      };
    }),

  collapsePhase: (messageId, phase) =>
    set((state) => {
      const thoughts = state.messageThoughts[messageId] || [];

      // 1. 找出该阶段的所有节点 thought
      const phaseNodes = thoughts.filter(
        (t) => t.phase === phase && t.type === "node",
      );

      if (phaseNodes.length === 0) return state; // 没有节点，不折叠

      // 2. 删除这些节点 thought
      const filteredThoughts = thoughts.filter(
        (t) => !(t.phase === phase && t.type === "node"),
      );

      // 3. 找到第一个节点的位置，插入阶段汇总
      const insertIndex = thoughts.findIndex(
        (t) => t.phase === phase && t.type === "node",
      );

      // 4. 构造阶段汇总 thought
      const phaseThought: ThoughtItem = {
        key: `phase-${phase}`,
        type: "phase",
        phase,
        title: PHASE_INFO[phase as PhaseName]?.title || phase,
        status: "success",
        description: `完成 ${phaseNodes.length} 个步骤`,
        nodeCount: phaseNodes.length,
        completedNodes: phaseNodes.map((n) => n.key),
        expanded: false,
        nodeDetails: phaseNodes,
      };

      // 5. 插入阶段汇总到原位置
      if (insertIndex >= 0) {
        filteredThoughts.splice(insertIndex, 0, phaseThought);
      }

      return {
        messageThoughts: {
          ...state.messageThoughts,
          [messageId]: filteredThoughts,
        },
      };
    }),

  togglePhaseExpansion: (phaseKey) =>
    set((state) => {
      const updatedThoughts: Record<string, ThoughtItem[]> = {};

      Object.keys(state.messageThoughts).forEach((messageId) => {
        updatedThoughts[messageId] = state.messageThoughts[messageId].map(
          (t) => (t.key === phaseKey ? { ...t, expanded: !t.expanded } : t),
        );
      });

      return { messageThoughts: updatedThoughts };
    }),

  archiveThoughts: (messageId) =>
    set((state) => {
      const thoughts = state.messageThoughts[messageId] || [];

      // 如果当前消息没有思维链，无需归档
      if (thoughts.length === 0) {
        return { phaseCompletion: {} };
      }

      // 创建历史记录项
      const historyItem: ThoughtItem = {
        key: `history-${Date.now()}`,
        type: "history",
        title: "历史记录",
        status: "success",
        description: `包含 ${thoughts.length} 个步骤`,
        expanded: false,
        historyThoughts: [...thoughts],
        timestamp: Date.now(),
      };

      return {
        messageThoughts: {
          ...state.messageThoughts,
          [messageId]: [historyItem],
        },
        phaseCompletion: {},
      };
    }),

  toggleHistoryExpansion: (historyKey) =>
    set((state) => {
      const updatedThoughts: Record<string, ThoughtItem[]> = {};

      Object.keys(state.messageThoughts).forEach((messageId) => {
        updatedThoughts[messageId] = state.messageThoughts[messageId].map(
          (t) => (t.key === historyKey ? { ...t, expanded: !t.expanded } : t),
        );
      });

      return { messageThoughts: updatedThoughts };
    }),
}));

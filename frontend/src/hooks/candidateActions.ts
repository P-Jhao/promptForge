import { toast } from "sonner";
import { useChatStore } from "@/store/chatStore";
import { useSandpackStore } from "@/store/sandpackStore";
import { hashEditBase, toPlainFiles, validatePlainFiles } from "@/lib/changeContract";
import { canApplyValidation } from "@/lib/validationReport";
import { resolveCandidateProjectName } from "@/lib/candidateProjectName";

/** Apply only a candidate whose validation and frozen workspace base still match. */
export async function applyStagedCandidate(): Promise<void> {
  const candidate = useChatStore.getState().candidate;
  if (candidate === null) return;
  if (candidate.status !== "staged") {
    toast.error(candidate.conflictReason ?? "候选基线已冲突，不能应用");
    return;
  }
  if (!canApplyValidation(candidate.validation)) {
    toast.error("候选尚未完成结构和预览校验，暂不能应用");
    return;
  }
  try {
    validatePlainFiles(candidate.files);
  } catch (error: unknown) {
    toast.error(error instanceof Error ? error.message : "候选文件校验失败");
    return;
  }

  const chatState = useChatStore.getState();
  if (chatState.currentProjectId !== candidate.projectId) {
    chatState.setCandidateConflict("当前项目已切换，候选未应用。");
    return;
  }
  const sandpackState = useSandpackStore.getState();
  const currentFiles = sandpackState.currentFiles ?? sandpackState.generatedFiles;
  const currentHash = await hashEditBase(toPlainFiles(currentFiles), candidate.resources);
  if (currentHash !== candidate.baseHash) {
    chatState.setCandidateConflict("当前编辑文件已变化，请重新基于最新文件生成候选。");
    return;
  }

  const projectNameAfterApply = resolveCandidateProjectName(candidate, useChatStore.getState().projectName);
  const versionNumber = chatState.incrementVersion();
  useSandpackStore.getState().setGeneratedFiles(candidate.files);
  useChatStore.getState().saveVersion({
    versionNumber,
    threadId: useChatStore.getState().getCurrentThreadId(),
    assistantMessageId: candidate.assistantMessageId,
    operation: candidate.operation,
    prompt: candidate.prompt,
    timestamp: Date.now(),
    files: candidate.files,
    fileCount: Object.keys(candidate.files).length,
    changes: {
      added: candidate.changes.filter((change) => change.operation === "add").map((change) => change.path),
      modified: candidate.changes.filter((change) => change.operation === "modify").map((change) => change.path),
      deleted: candidate.changes.filter((change) => change.operation === "delete").map((change) => change.path),
    },
  });
  if (projectNameAfterApply !== undefined) {
    useChatStore.getState().updateProjectName(projectNameAfterApply);
  }
  useChatStore.getState().clearCandidate();
  useChatStore.getState().setGeneration({ status: "success", error: undefined, preservedResult: false });
}

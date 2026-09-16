import { useState, type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";
import type { ProjectPersistenceApi } from "./useProjectPersistence";
import type { ProjectMutationTarget } from "@/components/shell/ProjectMutationDialogs";

interface ProjectManagerMutationInput {
  projectId: string;
  isLoading: boolean;
  isAssembling: boolean;
  candidatePresent: boolean;
  dirty: boolean;
  storageSaving: boolean;
  busy: boolean;
  setBusy: Dispatch<SetStateAction<boolean>>;
  setShowBrowser: Dispatch<SetStateAction<boolean>>;
  persistence: Pick<ProjectPersistenceApi, "renameProject" | "deleteProject">;
  onCurrentProjectDeleted: () => void;
}

export function useProjectManagerMutations({ projectId, isLoading, isAssembling, candidatePresent, dirty, storageSaving, busy, setBusy, setShowBrowser, persistence, onCurrentProjectDeleted }: ProjectManagerMutationInput) {
  const [renameTarget, setRenameTarget] = useState<ProjectMutationTarget | null>(null);
  const [renameName, setRenameName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ProjectMutationTarget | null>(null);

  const canStartMutation = (): boolean => {
    if (busy || isLoading || isAssembling || storageSaving) {
      toast.info("当前项目仍在生成、写入或校验，请稍后再操作");
      return false;
    }
    if (candidatePresent) {
      toast.info("请先应用或放弃当前候选");
      return false;
    }
    if (dirty) {
      toast.info("当前项目有未保存修改，请先保存、另存为或放弃修改");
      return false;
    }
    return true;
  };

  const requestRename = (target: ProjectMutationTarget): void => {
    if (!canStartMutation()) return;
    setRenameTarget(target);
    setRenameName(target.name);
    setShowBrowser(false);
  };

  const requestDelete = (target: ProjectMutationTarget): void => {
    if (!canStartMutation()) return;
    setDeleteTarget(target);
    setShowBrowser(false);
  };

  const confirmRename = async (): Promise<void> => {
    if (renameTarget === null) return;
    setBusy(true);
    try {
      await persistence.renameProject(renameTarget.projectId, renameName, renameTarget.revision);
      setRenameTarget(null);
    } catch {
      // Repository errors remain visible through persistence.error.
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async (): Promise<void> => {
    if (deleteTarget === null) return;
    const target = deleteTarget;
    setBusy(true);
    try {
      await persistence.deleteProject(target.projectId, target.revision);
      setDeleteTarget(null);
      if (target.projectId === projectId) onCurrentProjectDeleted();
    } catch {
      // Keep the list item and current workbench after a transaction failure.
    } finally {
      setBusy(false);
    }
  };

  return { renameTarget, renameName, deleteTarget, setRenameName, setRenameTarget, setDeleteTarget, requestRename, requestDelete, confirmRename, confirmDelete };
}

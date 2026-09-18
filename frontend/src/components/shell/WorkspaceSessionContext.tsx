"use client";

import { createContext, useContext } from "react";
import type { WorkspaceSession } from "@/types/workspace";

const defaultSession: WorkspaceSession = {
  surface: "chooser",
  isForking: false,
  autoSaved: false,
  forkCase: async () => {
    throw new Error("工作区上下文未初始化");
  },
  openCaseChooser: () => undefined,
  startBlankProject: () => undefined,
};

export const WorkspaceSessionContext = createContext<WorkspaceSession>(defaultSession);

export function useWorkspaceSession(): WorkspaceSession {
  return useContext(WorkspaceSessionContext);
}

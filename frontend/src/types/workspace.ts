import type { CaseResourceManifest } from "@/cases/resourceManifest";
import type { WorkspaceCaseDescriptor } from "@/cases/caseRegistry";
import type { SandpackFiles } from "./store";

export interface WorkspaceCaseContext {
  descriptor: WorkspaceCaseDescriptor;
  files?: SandpackFiles;
  manifest?: CaseResourceManifest;
}

export type WorkspaceSurface = "example" | "project" | "chooser";

export interface WorkspaceSession {
  surface: WorkspaceSurface;
  caseContext?: WorkspaceCaseContext;
  isForking: boolean;
  autoSaved: boolean;
  forkCase: () => Promise<void>;
  openCaseChooser: () => void;
  startBlankProject: () => void;
}

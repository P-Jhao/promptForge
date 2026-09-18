import { create } from "zustand";
import type { SandpackStore, SandpackFiles } from "@/types/store";

// Re-export types for backward compatibility
export type { SandpackFiles };

export const useSandpackStore = create<SandpackStore>((set) => ({
  viewMode: "preview",
  setViewMode: (mode) => set({ viewMode: mode }),

  generatedFiles: null,
  currentFiles: null,
  previewFiles: null,
  previewManifest: undefined,
  setGeneratedFiles: (files) => {
    // 转换为 Sandpack 格式: { "/App.tsx": "code" } -> { "/App.tsx": { code: "code" } }
    const sandpackFiles: SandpackFiles = {};
    Object.entries(files).forEach(([path, code]) => {
      sandpackFiles[path] = { code };
    });
    set({ generatedFiles: sandpackFiles, currentFiles: sandpackFiles });
  },
  setCurrentFiles: (files) => set((state) => (
    state.currentFiles !== null && areSandpackFilesEqual(state.currentFiles, files)
      ? state
      : { currentFiles: files }
  )),
  setPreviewFiles: (files) => set((state) => state.previewFiles === files ? state : { previewFiles: files }),
  setPreviewManifest: (manifest) => set((state) => state.previewManifest === manifest ? state : { previewManifest: manifest }),
  clearProjectFiles: () => set({ generatedFiles: null, currentFiles: null }),
  clearGeneratedFiles: () => set({ generatedFiles: null, currentFiles: null, previewFiles: null, previewManifest: undefined }),

  isAssembling: false,
  setIsAssembling: (isAssembling) => set({ isAssembling }),
}));

export function areSandpackFilesEqual(
  first: SandpackFiles,
  second: SandpackFiles,
): boolean {
  const firstPaths = Object.keys(first);
  const secondPaths = Object.keys(second);
  if (firstPaths.length !== secondPaths.length) return false;
  return firstPaths.every((path) => first[path]?.code === second[path]?.code);
}

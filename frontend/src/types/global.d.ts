// 全局类型扩展
import type { SandpackFiles } from "./store";
import type { CaseResourceManifest } from "../cases/resourceManifest";

declare global {
  interface Window {
    /** Sandpack 模板文件（由 SandpackView 设置，供 PreviewToolbar 使用） */
    __templateFiles?: SandpackFiles;
    /** 当前案例资源清单（由 SandpackView 设置，供导出校验使用） */
    __resourceManifest?: CaseResourceManifest;
  }
}

export {};

import type { WorkspaceSectionKey } from "../types/analytics";

export interface WorkspaceNavigationItem {
  key: WorkspaceSectionKey;
  label: string;
}

export const workspaceNavigation: readonly WorkspaceNavigationItem[] = [
  { key: "analytics", label: "数据分析" },
  { key: "customers", label: "客户管理" },
  { key: "productCenter", label: "产品中心" },
  { key: "team", label: "团队协作" },
] as const;

export type NavigationKey =
  | "workspace"
  | "customers"
  | "opportunities"
  | "followups"
  | "contracts"
  | "products"
  | "reports"
  | "team"
  | "settings";

export type OpportunityStage = "需求确认" | "方案沟通" | "商务谈判" | "已赢单";
export type FollowUpStatus = "待处理" | "已完成";
export type ContractStatus = "草稿" | "审批中" | "履行中" | "已完成";
export type ProductCategory = "订阅服务" | "实施服务" | "数据服务" | "增值服务";
export type TeamStatus = "在线" | "忙碌" | "离线" | "待加入";

export interface OpportunityRecord {
  id: string;
  title: string;
  customer: string;
  owner: string;
  amount: number;
  stage: OpportunityStage;
  expectedClose: string;
  lastUpdate: string;
}

export interface FollowUpTask {
  id: string;
  customer: string;
  contact: string;
  owner: string;
  type: "电话" | "会议" | "邮件" | "演示";
  date: string;
  summary: string;
  status: FollowUpStatus;
}

export interface ContractRecord {
  id: string;
  number: string;
  customer: string;
  amount: number;
  status: ContractStatus;
  startDate: string;
  endDate: string;
  owner: string;
}

export interface ProductRecord {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  active: boolean;
  customers: number;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  customerCount: number;
  status: TeamStatus;
}

export interface WorkspaceSettings {
  companyName: string;
  timezone: string;
  emailNotifications: boolean;
  browserNotifications: boolean;
  weeklyReport: boolean;
  compactTable: boolean;
}

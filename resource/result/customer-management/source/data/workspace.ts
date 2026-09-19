import type {
  ContractRecord,
  FollowUpTask,
  OpportunityRecord,
  ProductRecord,
  TeamMember,
  WorkspaceSettings,
} from "../types/workspace";

export const initialOpportunities: OpportunityRecord[] = [
  { id: "opp-001", title: "企业协作平台升级", customer: "腾讯科技有限公司", owner: "张三", amount: 680000, stage: "商务谈判", expectedClose: "2026-10-18", lastUpdate: "2026-09-18" },
  { id: "opp-002", title: "智能客服年度项目", customer: "阿里巴巴集团", owner: "李华", amount: 520000, stage: "方案沟通", expectedClose: "2026-10-30", lastUpdate: "2026-09-17" },
  { id: "opp-003", title: "数据洞察订阅", customer: "字节跳动", owner: "张伟", amount: 360000, stage: "需求确认", expectedClose: "2026-11-08", lastUpdate: "2026-09-16" },
  { id: "opp-004", title: "渠道运营工作台", customer: "华为技术有限公司", owner: "刘芳", amount: 910000, stage: "商务谈判", expectedClose: "2026-10-12", lastUpdate: "2026-09-18" },
  { id: "opp-005", title: "客户成功服务包", customer: "小米科技", owner: "赵敏", amount: 240000, stage: "已赢单", expectedClose: "2026-09-25", lastUpdate: "2026-09-15" },
  { id: "opp-006", title: "营销自动化试点", customer: "美团点评", owner: "孙磊", amount: 180000, stage: "方案沟通", expectedClose: "2026-11-15", lastUpdate: "2026-09-14" },
];

export const initialFollowUps: FollowUpTask[] = [
  { id: "fu-001", customer: "腾讯科技有限公司", contact: "王小明", owner: "张三", type: "会议", date: "2026-09-19", summary: "确认二期方案范围与采购节奏", status: "待处理" },
  { id: "fu-002", customer: "阿里巴巴集团", contact: "李华", owner: "张三", type: "电话", date: "2026-09-19", summary: "回访试用反馈并确认下一轮演示", status: "待处理" },
  { id: "fu-003", customer: "华为技术有限公司", contact: "刘芳", owner: "李华", type: "邮件", date: "2026-09-18", summary: "发送安全评审材料和商务条款清单", status: "已完成" },
  { id: "fu-004", customer: "字节跳动", contact: "张伟", owner: "张三", type: "演示", date: "2026-09-20", summary: "演示数据报表与权限管理能力", status: "待处理" },
  { id: "fu-005", customer: "小米科技", contact: "赵敏", owner: "陈强", type: "会议", date: "2026-09-17", summary: "完成上线复盘并记录增购需求", status: "已完成" },
];

export const initialContracts: ContractRecord[] = [
  { id: "ct-001", number: "CRM-2026-0912", customer: "腾讯科技有限公司", amount: 680000, status: "审批中", startDate: "2026-10-01", endDate: "2027-09-30", owner: "张三" },
  { id: "ct-002", number: "CRM-2026-0831", customer: "小米科技", amount: 240000, status: "履行中", startDate: "2026-09-01", endDate: "2027-08-31", owner: "赵敏" },
  { id: "ct-003", number: "CRM-2026-0720", customer: "京东集团", amount: 420000, status: "履行中", startDate: "2026-08-01", endDate: "2027-07-31", owner: "周杰" },
  { id: "ct-004", number: "CRM-2026-0618", customer: "网易", amount: 320000, status: "已完成", startDate: "2025-07-01", endDate: "2026-06-30", owner: "吴倩" },
  { id: "ct-005", number: "CRM-2026-0918", customer: "美团点评", amount: 180000, status: "草稿", startDate: "2026-11-01", endDate: "2027-10-31", owner: "孙磊" },
];

export const initialProducts: ProductRecord[] = [
  { id: "pd-001", name: "CRM 专业版", category: "订阅服务", price: 128000, active: true, customers: 42 },
  { id: "pd-002", name: "销售自动化套件", category: "订阅服务", price: 88000, active: true, customers: 31 },
  { id: "pd-003", name: "数据洞察中心", category: "数据服务", price: 76000, active: true, customers: 26 },
  { id: "pd-004", name: "企业实施服务", category: "实施服务", price: 120000, active: true, customers: 18 },
  { id: "pd-005", name: "客户成功服务包", category: "增值服务", price: 48000, active: false, customers: 12 },
];

export const initialTeamMembers: TeamMember[] = [
  { id: "tm-001", name: "张三", role: "销售经理", department: "企业销售一组", email: "zhangsan@example.demo", customerCount: 32, status: "在线" },
  { id: "tm-002", name: "李华", role: "客户经理", department: "企业销售一组", email: "lihua@example.demo", customerCount: 26, status: "忙碌" },
  { id: "tm-003", name: "张伟", role: "客户经理", department: "企业销售二组", email: "zhangwei@example.demo", customerCount: 21, status: "在线" },
  { id: "tm-004", name: "刘芳", role: "解决方案顾问", department: "售前顾问组", email: "liufang@example.demo", customerCount: 15, status: "离线" },
  { id: "tm-005", name: "陈强", role: "客户成功经理", department: "客户成功组", email: "chenqiang@example.demo", customerCount: 18, status: "在线" },
];

export const defaultWorkspaceSettings: WorkspaceSettings = {
  companyName: "星河客户管理演示空间",
  timezone: "Asia/Shanghai",
  emailNotifications: true,
  browserNotifications: true,
  weeklyReport: true,
  compactTable: false,
};

import type { IconName } from "../components/Icon";
import type { PageKey } from "../types/analytics";

export interface AnalyticsNavItem {
  key: PageKey;
  label: string;
  title: string;
  subtitle: string;
  icon: IconName;
}

export const analyticsNavItems: readonly AnalyticsNavItem[] = [
  { key: "overview", label: "总览看板", title: "数据分析看板", subtitle: "全面掌握业务数据，洞察增长趋势，驱动更好的决策", icon: "home" },
  { key: "business", label: "业务数据", title: "业务数据", subtitle: "查看订单、收入与客户转化表现，定位增长结构与目标完成情况", icon: "barChart" },
  { key: "users", label: "用户分析", title: "用户分析", subtitle: "跟踪用户增长、活跃度与留存表现，识别高价值用户群体", icon: "user" },
  { key: "products", label: "产品分析", title: "产品分析", subtitle: "比较产品使用规模、功能渗透与转化效率，优化产品投入方向", icon: "cube" },
  { key: "channels", label: "渠道分析", title: "渠道分析", subtitle: "评估各获客渠道的规模、转化与效率，优化渠道组合", icon: "link" },
  { key: "finance", label: "财务分析", title: "财务分析", subtitle: "追踪收入、客单价与利润结构，掌握经营质量变化", icon: "file" },
  { key: "reports", label: "自定义报表", title: "自定义报表", subtitle: "按需组合指标和模块，生成可导出的本地分析报表", icon: "report" },
] as const;

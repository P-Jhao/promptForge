export type RangeKey = "7" | "30" | "90" | "empty";
export type TrendKey = "customers" | "revenue" | "orders" | "api";
export type PageKey = "overview" | "business" | "users" | "products" | "channels" | "finance" | "reports";
export type WorkspaceSectionKey = "analytics" | "customers" | "productCenter" | "team" | "account" | "preferences";
export type CustomerStatus = "活跃" | "沉睡";
export type CustomerLevel = "黄金客户" | "重要客户" | "普通客户";
export type StatusFilter = "all" | CustomerStatus;
export type SortKey = "amount" | "created";
export type SortDirection = "asc" | "desc";

export interface TrendPoint {
  date: string;
  fullDate: string;
  value: number;
}

export interface MetricItem {
  key: "newCustomers" | "revenue" | "orders" | "conversion" | "activeUsers" | "apiCalls";
  label: string;
  value: string;
  change: string;
  tone: "blue" | "green" | "violet";
  icon: "users" | "money" | "document" | "bolt" | "user" | "cube";
}

export interface ChannelDatum {
  name: string;
  value: number;
  color: string;
}

export interface IndustryDatum {
  name: string;
  value: number;
  color: string;
}

export interface RangeSnapshot {
  key: RangeKey;
  label: string;
  startDate: string;
  endDate: string;
  customerTotal: number;
  metrics: MetricItem[];
  trends: Record<TrendKey, TrendPoint[]>;
  channels: ChannelDatum[];
  industries: IndustryDatum[];
}

export interface CustomerRow {
  id: string;
  company: string;
  contact: string;
  industry: string;
  level: CustomerLevel;
  amount: number;
  created: string;
  active: string;
  status: CustomerStatus;
  note: string;
}

export interface CustomerFilters {
  query: string;
  status: StatusFilter;
  industry: string;
}

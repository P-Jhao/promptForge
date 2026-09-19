export type CustomerStatus = "intent" | "won" | "following" | "pending" | "lost";
export type CustomerSource = "官网咨询" | "转介绍" | "活动线索" | "合作伙伴" | "内容获客";
export type CompanySize = "1-50人" | "51-200人" | "201-1000人" | "1000-5000人" | "5000人以上";

export interface FollowUpRecord {
  id: string;
  date: string;
  note: string;
}

export interface SalesOpportunity {
  id: string;
  title: string;
  amount: string;
  stage: "需求确认" | "方案沟通" | "商务谈判" | "已赢单";
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  company: string;
  industry: string;
  email: string;
  phone: string;
  status: CustomerStatus;
  source: CustomerSource;
  tags: string[];
  note: string;
  lastFollowUp: string;
  createdAt: string;
  englishName: string;
  companySize: CompanySize;
  website: string;
  address: string;
  description: string;
  contactRole: string;
  followUps: FollowUpRecord[];
  opportunities: SalesOpportunity[];
}

export interface CustomerFormValues {
  name: string;
  company: string;
  industry: string;
  email: string;
  phone: string;
  status: CustomerStatus;
  source: CustomerSource;
  companySize: CompanySize;
  contactRole: string;
  website: string;
  address: string;
  tags: string;
  note: string;
}

export type StatusFilter = CustomerStatus | "all";
export type IndustryFilter = string | "all";
export type SourceFilter = CustomerSource | "all";
export type SizeFilter = CompanySize | "all";

export interface CustomerFilters {
  query: string;
  status: StatusFilter;
  industry: IndustryFilter;
  source: SourceFilter;
  companySize: SizeFilter;
}

export interface CustomerStats {
  total: number;
  potential: number;
  won: number;
  lost: number;
}

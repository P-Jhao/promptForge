import type { ChannelDatum, CustomerLevel, CustomerRow, IndustryDatum, MetricItem, RangeKey, RangeSnapshot, TrendKey, TrendPoint } from "../types/analytics";
import { mmdd } from "../utils/format";

const RANGE_END = "2024-04-22";

function makeDates(startIso: string, count: number): string[] {
  const start = new Date(`${startIso}T00:00:00Z`).getTime();
  return Array.from({ length: count }, (_, index) => new Date(start + index * 86_400_000).toISOString().slice(0, 10));
}

function toTrendPoints(dates: readonly string[], values: readonly number[]): TrendPoint[] {
  return dates.map((fullDate, index) => ({ fullDate, date: mmdd(fullDate), value: values[index] ?? 0 }));
}

function generatedValues(length: number, base: number, slope: number, wave: number): number[] {
  return Array.from({ length }, (_, index) => Math.max(0, Math.round(base + index * slope + ((index * 7) % 13 - 6) * wave)));
}

function trendSet(dates: readonly string[], customers: readonly number[], scale: number): Record<TrendKey, TrendPoint[]> {
  return {
    customers: toTrendPoints(dates, customers),
    revenue: toTrendPoints(dates, generatedValues(dates.length, 94 * scale, 5.1 * scale, 2.7 * scale)),
    orders: toTrendPoints(dates, generatedValues(dates.length, 48 * scale, 1.65 * scale, 0.8 * scale)),
    api: toTrendPoints(dates, generatedValues(dates.length, 176 * scale, 7.8 * scale, 4.1 * scale)),
  };
}

const dates30 = makeDates("2024-03-23", 31);
const customers30 = [78, 84, 102, 128, 119, 118, 142, 168, 181, 196, 173, 165, 185, 199, 211, 207, 239, 268, 222, 204, 201, 218, 238, 204, 231, 252, 235, 260, 278, 284, 302];
const dates7 = makeDates("2024-04-16", 7);
const customers7 = [236, 248, 261, 276, 284, 294, 309];
const dates90 = makeDates("2024-01-24", 90);
const customers90 = generatedValues(90, 52, 2.36, 1.9);

const metrics30: MetricItem[] = [
  { key: "newCustomers", label: "新增客户数", value: "1,268", change: "+12.5%", tone: "blue", icon: "users" },
  { key: "revenue", label: "总收入（元）", value: "¥ 238,560", change: "+18.2%", tone: "green", icon: "money" },
  { key: "orders", label: "订单数", value: "892", change: "+9.4%", tone: "blue", icon: "document" },
  { key: "conversion", label: "客户转化率", value: "6.8%", change: "+1.2%", tone: "violet", icon: "bolt" },
  { key: "activeUsers", label: "活跃用户数", value: "12,480", change: "+14.6%", tone: "blue", icon: "user" },
  { key: "apiCalls", label: "API 调用量", value: "86,521", change: "+27.3%", tone: "blue", icon: "cube" },
];

const metrics7: MetricItem[] = [
  { key: "newCustomers", label: "新增客户数", value: "309", change: "+8.4%", tone: "blue", icon: "users" },
  { key: "revenue", label: "总收入（元）", value: "¥ 56,780", change: "+11.6%", tone: "green", icon: "money" },
  { key: "orders", label: "订单数", value: "198", change: "+6.2%", tone: "blue", icon: "document" },
  { key: "conversion", label: "客户转化率", value: "7.1%", change: "+0.8%", tone: "violet", icon: "bolt" },
  { key: "activeUsers", label: "活跃用户数", value: "2,486", change: "+10.1%", tone: "blue", icon: "user" },
  { key: "apiCalls", label: "API 调用量", value: "18,920", change: "+16.8%", tone: "blue", icon: "cube" },
];

const metrics90: MetricItem[] = [
  { key: "newCustomers", label: "新增客户数", value: "3,964", change: "+20.8%", tone: "blue", icon: "users" },
  { key: "revenue", label: "总收入（元）", value: "¥ 692,450", change: "+24.6%", tone: "green", icon: "money" },
  { key: "orders", label: "订单数", value: "2,740", change: "+17.3%", tone: "blue", icon: "document" },
  { key: "conversion", label: "客户转化率", value: "6.4%", change: "+1.5%", tone: "violet", icon: "bolt" },
  { key: "activeUsers", label: "活跃用户数", value: "38,920", change: "+22.1%", tone: "blue", icon: "user" },
  { key: "apiCalls", label: "API 调用量", value: "254,160", change: "+31.4%", tone: "blue", icon: "cube" },
];

const emptyMetrics = metrics30.map((metric) => ({ ...metric, value: "—", change: "—" }));

const industries30: IndustryDatum[] = [
  { name: "互联网", value: 32.4, color: "#4d7cf2" },
  { name: "科技服务", value: 18.6, color: "#89b8ef" },
  { name: "金融", value: 12.8, color: "#3fc59c" },
  { name: "教育", value: 10.5, color: "#f1a03d" },
  { name: "制造业", value: 8.7, color: "#9c6ddd" },
  { name: "其他", value: 17.0, color: "#bfd5e5" },
];

const channels30: ChannelDatum[] = [
  { name: "官网", value: 1680, color: "#5b6fea" },
  { name: "内容营销", value: 1240, color: "#3db0df" },
  { name: "社交媒体", value: 892, color: "#47c89d" },
  { name: "合作伙伴", value: 680, color: "#f1bf49" },
  { name: "其他", value: 420, color: "#f16470" },
];

function scaleChannels(scale: number): ChannelDatum[] {
  return channels30.map((item) => ({ ...item, value: Math.round(item.value * scale) }));
}

function tweakIndustries(delta: number): IndustryDatum[] {
  const values = [32.4 + delta, 18.6 - delta * 0.2, 12.8 + delta * 0.1, 10.5 - delta * 0.1, 8.7, 17 - delta * 0.8];
  return industries30.map((item, index) => ({ ...item, value: Number((values[index] ?? item.value).toFixed(1)) }));
}

export const rangeOptions: Array<{ value: RangeKey; label: string }> = [
  { value: "7", label: "过去 7 天" },
  { value: "30", label: "过去 30 天" },
  { value: "90", label: "过去 90 天" },
  { value: "empty", label: "无数据演示" },
];

export const snapshots: Record<RangeKey, RangeSnapshot> = {
  "7": {
    key: "7",
    label: "过去 7 天",
    startDate: "2024-04-16",
    endDate: RANGE_END,
    customerTotal: 309,
    metrics: metrics7,
    trends: trendSet(dates7, customers7, 0.72),
    channels: scaleChannels(0.28),
    industries: tweakIndustries(2.1),
  },
  "30": {
    key: "30",
    label: "过去 30 天",
    startDate: "2024-03-23",
    endDate: RANGE_END,
    customerTotal: 1268,
    metrics: metrics30,
    trends: trendSet(dates30, customers30, 1),
    channels: channels30,
    industries: industries30,
  },
  "90": {
    key: "90",
    label: "过去 90 天",
    startDate: "2024-01-24",
    endDate: RANGE_END,
    customerTotal: 3964,
    metrics: metrics90,
    trends: trendSet(dates90, customers90, 1.32),
    channels: scaleChannels(2.7),
    industries: tweakIndustries(-1.8),
  },
  empty: {
    key: "empty",
    label: "无数据演示",
    startDate: "—",
    endDate: "—",
    customerTotal: 0,
    metrics: emptyMetrics,
    trends: { customers: [], revenue: [], orders: [], api: [] },
    channels: [],
    industries: [],
  },
};

export const trendTabs: Array<{ key: TrendKey; label: string }> = [
  { key: "customers", label: "新增客户" },
  { key: "revenue", label: "收入" },
  { key: "orders", label: "订单数" },
  { key: "api", label: "API 调用量" },
];

const featuredCustomers: CustomerRow[] = [
  { id: "featured-1", company: "腾讯科技有限公司", contact: "陈嘉禾", industry: "互联网", level: "黄金客户", amount: 58000, created: "2024-04-20", active: "2024-04-22", status: "活跃", note: "企业 API 套餐，近期扩充调用额度。" },
  { id: "featured-2", company: "阿里巴巴集团", contact: "周雯", industry: "电子商务", level: "重要客户", amount: 42000, created: "2024-04-18", active: "2024-04-21", status: "活跃", note: "内容生成场景试点，月度复盘中。" },
  { id: "featured-3", company: "华为技术有限公司", contact: "林远", industry: "通信技术", level: "重要客户", amount: 35000, created: "2024-04-16", active: "2024-04-20", status: "活跃", note: "研发知识库场景，处于稳定使用阶段。" },
  { id: "featured-4", company: "字节跳动", contact: "赵清", industry: "内容媒体", level: "普通客户", amount: 28000, created: "2024-04-14", active: "2024-04-20", status: "沉睡", note: "近期登录频率降低，建议安排回访。" },
  { id: "featured-5", company: "美团点评", contact: "方可", industry: "本地生活", level: "重要客户", amount: 26000, created: "2024-04-12", active: "2024-04-19", status: "活跃", note: "运营团队持续使用批量分析功能。" },
  { id: "featured-6", company: "小米科技", contact: "徐宁", industry: "智能硬件", level: "普通客户", amount: 18000, created: "2024-04-10", active: "2024-04-18", status: "活跃", note: "智能客服试点，使用频率稳定。" },
  { id: "featured-7", company: "京东集团", contact: "马然", industry: "电子商务", level: "普通客户", amount: 16000, created: "2024-04-08", active: "2024-04-16", status: "沉睡", note: "试用团队暂停扩容，等待下轮评估。" },
  { id: "featured-8", company: "网易", contact: "沈悦", industry: "游戏文娱", level: "普通客户", amount: 12000, created: "2024-04-05", active: "2024-04-15", status: "活跃", note: "游戏内容标签项目按计划推进。" },
];

const companyPrefixes = ["星云", "云启", "灵犀", "启明", "蓝鲸", "知行", "卓越", "远见", "凌云", "新辰", "青禾", "极光"];
const companySuffixes = ["科技有限公司", "数字科技", "信息服务", "智能系统", "网络科技", "数据服务"];
const contacts = ["王欣", "李晨", "孙萌", "张雅", "吴航", "郑宇", "何清", "唐菲", "罗杰", "程安"];
const industries = ["互联网", "科技服务", "金融", "教育", "制造业", "电子商务", "通信技术", "内容媒体", "本地生活", "智能硬件", "游戏文娱"];
const levels: CustomerLevel[] = ["普通客户", "重要客户", "普通客户", "普通客户", "黄金客户"];

function dateAt(startIso: string, offset: number): string {
  const start = new Date(`${startIso}T00:00:00Z`).getTime();
  return new Date(start + offset * 86_400_000).toISOString().slice(0, 10);
}

function makeCustomer(index: number, created: string, bucket: "recent" | "older"): CustomerRow {
  const prefix = companyPrefixes[index % companyPrefixes.length] ?? "云启";
  const suffix = companySuffixes[(index * 5) % companySuffixes.length] ?? "科技有限公司";
  const activeOffset = Math.min(8, 1 + (index % 8));
  const createdTime = new Date(`${created}T00:00:00Z`).getTime();
  const active = new Date(Math.min(new Date(`${RANGE_END}T00:00:00Z`).getTime(), createdTime + activeOffset * 86_400_000)).toISOString().slice(0, 10);
  return {
    id: `${bucket}-${index + 1}`,
    company: `${prefix}${String(index + 1).padStart(3, "0")}${suffix}`,
    contact: contacts[(index * 3) % contacts.length] ?? "王欣",
    industry: industries[(index * 7) % industries.length] ?? "科技服务",
    level: levels[index % levels.length] ?? "普通客户",
    amount: 6400 + ((index * 3700) % 32600),
    created,
    active,
    status: index % 5 === 0 || index % 7 === 0 ? "沉睡" : "活跃",
    note: bucket === "recent" ? "合成演示客户，用于筛选、分页和导出交互。" : "历史合成演示客户，用于 90 天范围展示。",
  };
}

const generatedRecent = Array.from({ length: 120 }, (_, index) => makeCustomer(index, dateAt("2024-03-23", index % 13), "recent"));
const generatedOlder = Array.from({ length: 96 }, (_, index) => makeCustomer(index + 200, dateAt("2024-01-24", index % 59), "older"));

export const customers: CustomerRow[] = [...featuredCustomers, ...generatedRecent, ...generatedOlder].sort((a, b) => {
  const dateOrder = b.created.localeCompare(a.created);
  if (dateOrder !== 0) return dateOrder;
  const aFeatured = a.id.startsWith("featured-") ? 1 : 0;
  const bFeatured = b.id.startsWith("featured-") ? 1 : 0;
  return bFeatured - aFeatured;
});

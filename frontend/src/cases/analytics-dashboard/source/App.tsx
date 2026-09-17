import { useMemo, useState } from "react";

type TrendKey = "customers" | "revenue" | "orders" | "api";
type RangeKey = "7" | "30" | "90" | "empty";
type MetricTone = "blue" | "green" | "violet" | "orange";
type CustomerStatus = "活跃" | "沉睡";

interface TrendPoint { date: string; value: number; }
interface CustomerRow { company: string; industry: string; level: string; amount: string; created: string; active: string; status: CustomerStatus; }
interface MetricCardProps { label: string; value: string; change: string; tone: MetricTone; icon: string; }
interface RangeSnapshot { label: string; startDate: string; endDate: string; metrics: MetricCardProps[]; trends: Record<TrendKey, TrendPoint[]>; }

const dates = ["03-23", "03-24", "03-25", "03-26", "03-27", "03-28", "03-29", "03-30", "03-31", "04-01", "04-02", "04-03", "04-04", "04-05", "04-06", "04-07", "04-08", "04-09", "04-10", "04-11", "04-12", "04-13", "04-14", "04-15", "04-16", "04-17", "04-18", "04-19", "04-20", "04-21", "04-22"];
const customerTrend = [78, 84, 102, 128, 119, 118, 142, 168, 181, 196, 173, 165, 185, 199, 211, 207, 239, 268, 222, 204, 201, 218, 238, 204, 231, 252, 235, 260, 278, 284, 302];
const trendData: Record<TrendKey, TrendPoint[]> = {
  customers: dates.map((date, index) => ({ date, value: customerTrend[index] })),
  revenue: dates.map((date, index) => ({ date, value: Math.round(82 + index * 6 + (index % 5) * 13) })),
  orders: dates.map((date, index) => ({ date, value: Math.round(38 + index * 2.1 + (index % 4) * 5) })),
  api: dates.map((date, index) => ({ date, value: Math.round(160 + index * 7 + (index % 6) * 15) })),
};

const metrics: MetricCardProps[] = [
  { label: "新增客户数", value: "1,268", change: "+12.5%", tone: "blue", icon: "♧" },
  { label: "总收入（元）", value: "¥ 238,560", change: "+18.2%", tone: "green", icon: "¥" },
  { label: "订单数", value: "892", change: "+9.4%", tone: "blue", icon: "▤" },
  { label: "客户转化率", value: "6.8%", change: "+1.2%", tone: "violet", icon: "ϟ" },
  { label: "活跃用户数", value: "12,480", change: "+14.6%", tone: "blue", icon: "♙" },
  { label: "API 调用量", value: "86,521", change: "+27.3%", tone: "blue", icon: "◇" },
];
const rangeOptions: Array<{ value: RangeKey; label: string }> = [{ value: "7", label: "过去 7 天" }, { value: "30", label: "过去 30 天" }, { value: "90", label: "过去 90 天" }, { value: "empty", label: "无数据演示" }];
const sevenDates = ["04-16", "04-17", "04-18", "04-19", "04-20", "04-21", "04-22"];
const sevenCustomerTrend = [236, 248, 261, 276, 284, 294, 309];
const ninetyDates = Array.from({ length: 90 }, (_, index) => new Date(Date.UTC(2024, 0, 24 + index)).toISOString().slice(5, 10));
const ninetyCustomerTrend = Array.from({ length: 90 }, (_, index) => 58 + index * 2 + (index % 7) * 9);
const createTrendSnapshot = (rangeDates: readonly string[], customerValues: readonly number[], base: number): Record<TrendKey, TrendPoint[]> => ({
  customers: rangeDates.map((date, index) => ({ date, value: customerValues[index] })),
  revenue: rangeDates.map((date, index) => ({ date, value: base + index * 6 + (index % 5) * 13 })),
  orders: rangeDates.map((date, index) => ({ date, value: Math.round(base / 2 + index * 2.1 + (index % 4) * 5) })),
  api: rangeDates.map((date, index) => ({ date, value: base * 2 + index * 7 + (index % 6) * 15 })),
});
const emptyMetrics = metrics.map((metric) => ({ ...metric, value: "—", change: "—" }));
const snapshots: Record<RangeKey, RangeSnapshot> = {
  "7": { label: "过去 7 天", startDate: "2024-04-16", endDate: "2024-04-22", metrics: [{ label: "新增客户数", value: "309", change: "+8.4%", tone: "blue", icon: "♧" }, { label: "总收入（元）", value: "¥ 56,780", change: "+11.6%", tone: "green", icon: "¥" }, { label: "订单数", value: "198", change: "+6.2%", tone: "blue", icon: "▤" }, { label: "客户转化率", value: "7.1%", change: "+0.8%", tone: "violet", icon: "ϟ" }, { label: "活跃用户数", value: "2,486", change: "+10.1%", tone: "blue", icon: "♙" }, { label: "API 调用量", value: "18,920", change: "+16.8%", tone: "blue", icon: "◇" }], trends: createTrendSnapshot(sevenDates, sevenCustomerTrend, 74) },
  "30": { label: "过去 30 天", startDate: "2024-03-23", endDate: "2024-04-22", metrics, trends: trendData },
  "90": { label: "过去 90 天", startDate: "2024-01-24", endDate: "2024-04-22", metrics: [{ label: "新增客户数", value: "3,964", change: "+20.8%", tone: "blue", icon: "♧" }, { label: "总收入（元）", value: "¥ 692,450", change: "+24.6%", tone: "green", icon: "¥" }, { label: "订单数", value: "2,740", change: "+17.3%", tone: "blue", icon: "▤" }, { label: "客户转化率", value: "6.4%", change: "+1.5%", tone: "violet", icon: "ϟ" }, { label: "活跃用户数", value: "38,920", change: "+22.1%", tone: "blue", icon: "♙" }, { label: "API 调用量", value: "254,160", change: "+31.4%", tone: "blue", icon: "◇" }], trends: createTrendSnapshot(ninetyDates, ninetyCustomerTrend, 94) },
  empty: { label: "无数据演示", startDate: "—", endDate: "—", metrics: emptyMetrics, trends: createTrendSnapshot([], [], 0) },
};

const channels = [{ name: "官网", value: 1680, color: "#596ff0" }, { name: "内容营销", value: 1240, color: "#40b9e6" }, { name: "社交媒体", value: 892, color: "#54cba5" }, { name: "合作伙伴", value: 680, color: "#f3c45a" }, { name: "其他", value: 420, color: "#f06b76" }];
const industries = [{ name: "互联网", value: 32.4, color: "#5578ed" }, { name: "科技服务", value: 18.6, color: "#a4c9df" }, { name: "金融", value: 12.8, color: "#59cfaa" }, { name: "教育", value: 10.5, color: "#f0a64a" }, { name: "制造业", value: 8.7, color: "#a477e5" }, { name: "其他", value: 17, color: "#bcd4e5" }];
const customers: CustomerRow[] = [
  { company: "腾讯科技有限公司", industry: "互联网", level: "黄金客户", amount: "¥ 58,000", created: "2024-04-20", active: "2024-04-22", status: "活跃" },
  { company: "阿里巴巴集团", industry: "电子商务", level: "重要客户", amount: "¥ 42,000", created: "2024-04-18", active: "2024-04-21", status: "活跃" },
  { company: "华为技术有限公司", industry: "通信技术", level: "重要客户", amount: "¥ 35,000", created: "2024-04-16", active: "2024-04-20", status: "活跃" },
  { company: "字节跳动", industry: "内容媒体", level: "普通客户", amount: "¥ 28,000", created: "2024-04-14", active: "2024-04-20", status: "沉睡" },
  { company: "美团点评", industry: "本地生活", level: "重要客户", amount: "¥ 26,000", created: "2024-04-12", active: "2024-04-19", status: "活跃" },
  { company: "小米科技", industry: "智能硬件", level: "普通客户", amount: "¥ 18,000", created: "2024-04-10", active: "2024-04-18", status: "活跃" },
  { company: "京东集团", industry: "电子商务", level: "普通客户", amount: "¥ 16,000", created: "2024-04-08", active: "2024-04-16", status: "沉睡" },
  { company: "网易", industry: "游戏文娱", level: "普通客户", amount: "¥ 12,000", created: "2024-04-05", active: "2024-04-15", status: "活跃" },
];
const trendTabs: Array<{ key: TrendKey; label: string }> = [{ key: "customers", label: "新增客户" }, { key: "revenue", label: "收入" }, { key: "orders", label: "订单数" }, { key: "api", label: "API 调用量" }];

export default function App() {
  const [trendKey, setTrendKey] = useState<TrendKey>("customers");
  const [range, setRange] = useState<RangeKey>("30");
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState(false);
  const snapshot = snapshots[range];
  const visibleCustomers = useMemo(() => customers.filter((row) => {
    const matchesQuery = row.company.includes(query) || row.industry.includes(query);
    return matchesQuery && (!activeFilter || row.status === "活跃");
  }), [activeFilter, query]);
  const tableRows = range === "empty" ? [] : visibleCustomers;

  return <div className="analytics-app">
    <header className="topbar"><div className="brand"><span className="brand-mark" aria-hidden="true">✦</span><strong>PromptForge</strong></div><nav className="primary-nav" aria-label="主导航"><button className="active" type="button">数据分析</button><button type="button">客户管理</button><button type="button">产品中心</button><button type="button">团队协作</button></nav><div className="topbar-tools"><label className="global-search"><span>⌕</span><input placeholder="搜索数据看板、指标或功能..." aria-label="搜索" /><kbd>⌘ K</kbd></label><button className="notification" type="button" aria-label="通知">♧<i /></button><span className="top-avatar">Z</span><button className="account" type="button"><strong>张三</strong><small>企业版</small><span>⌄</span></button></div></header>
    <div className="workspace"><aside className="analytics-sidebar"><div className="side-title"><span>▥</span><strong>数据分析</strong></div><nav className="side-nav" aria-label="数据分析导航"><button className="active" type="button">⌂<span>总览看板</span></button><button type="button">▣<span>业务数据</span></button><button type="button">♙<span>用户分析</span></button><button type="button">◇<span>产品分析</span></button><button type="button">♧<span>渠道分析</span></button><button type="button">▤<span>财务分析</span></button><button type="button">▧<span>自定义报表</span></button></nav><div className="side-divider" /><span className="side-label">数据工具</span><nav className="side-nav tools"><button type="button">⇩<span>数据导出</span></button><button type="button">⌕<span>数据订阅</span></button><button type="button">⚙<span>报表设置</span></button></nav><div className="sync-card"><strong>数据更新</strong><span>● 已实时更新</span><small>最近更新：2024-04-22 10:24</small></div></aside>
      <main className="dashboard-main"><section className="page-heading"><div><h1>数据分析看板</h1><p>全面掌握业务数据，洞察增长趋势，驱动更好的决策</p></div><div className="date-controls"><label className="date-range"><span>▣</span><input value={snapshot.startDate} readOnly aria-label="开始日期" /><b>→</b><input value={snapshot.endDate} readOnly aria-label="结束日期" /></label><label className="period-select"><select value={range} onChange={(event) => setRange(event.target.value as RangeKey)} aria-label="日期范围">{rangeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><span>⌄</span></label></div></section>
        <section className="metric-grid" aria-label="核心指标">{snapshot.metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}</section>
        {range === "empty" ? <EmptyDashboardState label={snapshot.label} /> : <section className="visual-grid"><article className="panel trend-panel"><div className="panel-title"><h2>业务趋势</h2><div className="trend-tabs">{trendTabs.map((tab) => <button key={tab.key} className={trendKey === tab.key ? "active" : ""} type="button" onClick={() => setTrendKey(tab.key)}>{tab.label}</button>)}</div></div><TrendChart data={snapshot.trends[trendKey]} trendKey={trendKey} /></article><article className="panel channel-panel"><div className="panel-title"><h2>渠道来源</h2><button className="mini-select" type="button">全部渠道　⌄</button></div><ChannelChart /></article><article className="panel industry-panel"><div className="panel-title"><h2>客户行业分布</h2><button className="mini-select" type="button">全部　⌄</button></div><IndustryChart /></article></section>}
        <section className="panel table-panel"><div className="table-heading"><h2>客户数据明细</h2><div className="table-actions"><label className="table-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索客户名称、联系人或行业..." aria-label="搜索客户明细" /></label><button className={activeFilter ? "action active" : "action"} type="button" onClick={() => setActiveFilter((value) => !value)}>▽ 筛选</button><button className="action" type="button">⇩ 导出</button><button className="action more-action" type="button" aria-label="更多">•••</button></div></div><CustomerTable rows={tableRows} /></section>
      </main>
    </div>
  </div>;
}

function MetricCard({ label, value, change, tone, icon }: MetricCardProps) { return <article className="metric-card"><span className={`metric-icon ${tone}`}>{icon}</span><span className="metric-label">{label}</span><strong>{value}</strong><span className="metric-change">{change === "—" ? "—" : `↗ ${change}`}</span><small>{change === "—" ? "暂无数据" : "较上周期"}</small></article>; }

function EmptyDashboardState({ label }: { label: string }) {
  return <section className="panel" role="status" style={{ alignItems: "center", display: "flex", flexDirection: "column", gap: "10px", gridColumn: "1 / -1", justifyContent: "center", minHeight: "266px", padding: "28px", textAlign: "center" }}><strong style={{ color: "#17264e", fontSize: "16px" }}>当前范围暂无数据</strong><span style={{ color: "#8290a8", fontSize: "12px" }}>{label} 没有可展示的业务记录，请切换到其他日期范围查看演示。</span></section>;
}

function TrendChart({ data, trendKey }: { data: TrendPoint[]; trendKey: TrendKey }) {
  const width = 660; const height = 210; const pad = { left: 40, right: 14, top: 22, bottom: 30 }; const max = trendKey === "customers" ? 400 : trendKey === "revenue" ? 400 : trendKey === "orders" ? 150 : 500; const x = (index: number) => pad.left + index * (width - pad.left - pad.right) / (data.length - 1); const y = (value: number) => pad.top + (1 - value / max) * (height - pad.top - pad.bottom); const points = data.map((point, index) => `${x(index)},${y(point.value)}`).join(" "); const area = `M ${x(0)} ${height - pad.bottom} L ${data.map((point, index) => `${x(index)} ${y(point.value)}`).join(" L ")} L ${x(data.length - 1)} ${height - pad.bottom} Z`; const matchingFocusIndex = data.findIndex((point) => point.date === "04-10"); const focusIndex = matchingFocusIndex >= 0 ? matchingFocusIndex : Math.floor((data.length - 1) / 2); const focus = data[focusIndex]; if (focus === undefined) throw new Error("业务趋势数据不能为空"); const ticks = trendKey === "customers" ? [0, 100, 200, 300, 400] : [0, max / 4, max / 2, max * .75, max]; const labelIndexes = Array.from(new Set([0, Math.floor((data.length - 1) / 3), Math.floor((data.length - 1) * 2 / 3), data.length - 1]));
  return <div className="chart-wrap"><svg className="trend-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="业务趋势折线图"><defs><linearGradient id="trend-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#5472ee" stopOpacity=".2" /><stop offset="1" stopColor="#5472ee" stopOpacity="0" /></linearGradient></defs><g className="grid-lines">{ticks.map((tick) => <g key={tick}><line x1={pad.left} x2={width - pad.right} y1={y(tick)} y2={y(tick)} /><text x={pad.left - 9} y={y(tick) + 3} textAnchor="end">{Math.round(tick)}</text></g>)}</g><path className="trend-area" d={area} /><polyline className="trend-line" points={points} /><line className="focus-line" x1={x(focusIndex)} x2={x(focusIndex)} y1={y(focus.value) + 8} y2={height - pad.bottom} /><circle className="focus-ring" cx={x(focusIndex)} cy={y(focus.value)} r="6" /><circle className="focus-dot" cx={x(focusIndex)} cy={y(focus.value)} r="3" /><g className="chart-tooltip"><rect x={x(focusIndex) + 8} y={y(focus.value) - 57} width="132" height="53" rx="7" /><text x={x(focusIndex) + 20} y={y(focus.value) - 38}>{focus.date === "04-10" ? "2024-04-10" : `2024-${focus.date}`}</text><circle cx={x(focusIndex) + 21} cy={y(focus.value) - 20} r="4" /><text className="tooltip-value" x={x(focusIndex) + 31} y={y(focus.value) - 16}>{trendKey === "customers" ? "新增客户" : trendTabs.find((tab) => tab.key === trendKey)?.label}　{focus.value}</text></g>{labelIndexes.map((index) => <text className="x-label" key={data[index].date} x={x(index)} y={height - 8} textAnchor={index === 0 ? "start" : index === data.length - 1 ? "end" : "middle"}>{data[index].date}</text>)}</svg></div>;
}

function ChannelChart() { const max = 2000; return <div className="bar-chart"><div className="bar-y-axis"><span>2,000</span><span>1,500</span><span>1,000</span><span>500</span><span>0</span></div><div className="bars">{channels.map((channel) => <div className="bar-column" key={channel.name}><strong>{channel.value.toLocaleString()}</strong><i style={{ height: `${channel.value / max * 100}%`, background: channel.color }} /><span>{channel.name}</span></div>)}</div></div>; }

function IndustryChart() {
  const circumference = 2 * Math.PI * 53;
  const segments = industries.reduce<Array<{ industry: (typeof industries)[number]; length: number; offset: number }>>((items, industry) => {
    const previous = items[items.length - 1];
    const length = industry.value / 100 * circumference;
    const offset = previous === undefined ? 0 : previous.offset + previous.length;
    return [...items, { industry, length, offset }];
  }, []);

  return <div className="industry-content"><div className="donut"><svg viewBox="0 0 140 140" role="img" aria-label="客户行业分布环形图"><circle className="donut-track" cx="70" cy="70" r="53" />{segments.map(({ industry, length, offset }) => <circle key={industry.name} cx="70" cy="70" r="53" stroke={industry.color} strokeDasharray={`${length} ${circumference - length}`} strokeDashoffset={-offset} />)}<text x="70" y="67" textAnchor="middle">1,268</text><text x="70" y="84" textAnchor="middle">客户总数</text></svg></div><div className="industry-list">{industries.map((industry) => <div className="industry-item" key={industry.name}><i style={{ background: industry.color }} /><span>{industry.name}</span><strong>{industry.value.toFixed(1)}%</strong></div>)}</div></div>;
}

function CustomerTable({ rows }: { rows: CustomerRow[] }) { return <><div className="table-scroll"><table><thead><tr><th className="check-cell"><input type="checkbox" aria-label="全选" /></th><th>客户名称</th><th>行业</th><th>客户等级</th><th>成交金额（元）　↕</th><th>创建时间　↕</th><th>最近活跃</th><th>状态</th><th>操作</th></tr></thead><tbody>{rows.length === 0 ? <tr><td colSpan={9} style={{ color: "#8290a8", padding: "26px", textAlign: "center" }}>当前范围暂无客户数据</td></tr> : rows.map((row) => <tr key={row.company}><td className="check-cell"><input type="checkbox" aria-label={`选择${row.company}`} /></td><td><span className="company-logo">{row.company.slice(0, 1)}</span>{row.company}</td><td>{row.industry}</td><td><span className={`level ${row.level === "黄金客户" ? "gold" : row.level === "重要客户" ? "important" : "normal"}`}>{row.level}</span></td><td>{row.amount}</td><td>{row.created}</td><td>{row.active}</td><td><span className={`status ${row.status === "活跃" ? "online" : "sleep"}`}>{row.status}</span></td><td><button className="view-button" type="button">查看</button>　•••</td></tr>)}</tbody></table></div><div className="table-footer"><span>共 128 条记录</span><div className="pagination"><button type="button">‹</button><button className="active" type="button">1</button><button type="button">2</button><button type="button">3</button><button type="button">4</button><button type="button">5</button><button type="button">›</button><button className="page-size" type="button">10 条/页　⌄</button></div></div></>; }

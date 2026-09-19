import { EmptyState } from "../components/EmptyState";
import { IndustryChart } from "../components/IndustryChart";
import { InsightCards, type InsightCardItem } from "../components/InsightCards";
import { TrendChart } from "../components/TrendChart";
import type { CustomerRow, RangeKey, RangeSnapshot } from "../types/analytics";
import { formatNumber } from "../utils/format";
import { changeFor, metricNumber } from "../utils/metrics";

export function UserAnalysisPage({ range, snapshot, rows, onFeedback }: { range: RangeKey; snapshot: RangeSnapshot; rows: readonly CustomerRow[]; onFeedback: (message: string) => void }) {
  const active = rows.filter((row) => row.status === "活跃").length;
  const dormant = rows.length - active;
  const highValue = rows.filter((row) => row.level !== "普通客户").length;
  const activeUsers = metricNumber(snapshot, "activeUsers");
  const cards: InsightCardItem[] = [
    { label: "活跃用户数", value: activeUsers ? formatNumber(activeUsers) : "—", change: changeFor(snapshot, "activeUsers"), note: "较上周期", icon: "user", tone: "blue" },
    { label: "新增客户", value: snapshot.customerTotal ? formatNumber(snapshot.customerTotal) : "—", change: changeFor(snapshot, "newCustomers"), note: "范围内", icon: "users", tone: "green" },
    { label: "样本活跃客户", value: rows.length ? `${active} / ${rows.length}` : "—", change: rows.length ? `${Math.round(active / rows.length * 100)}%` : "—", note: "活跃占比", icon: "bolt", tone: "violet" },
    { label: "高价值客户", value: rows.length ? formatNumber(highValue) : "—", change: rows.length ? `${Math.round(highValue / rows.length * 100)}%` : "—", note: "黄金/重要客户", icon: "report", tone: "amber" },
  ];

  if (range === "empty") return <section className="panel dashboard-empty"><EmptyState title="当前范围暂无用户数据" description="切换到有数据的日期范围，即可查看用户增长、活跃度、留存与行业画像。" /></section>;

  const behavior = [
    { label: "使用工作台", value: 86 }, { label: "调用 API", value: 72 }, { label: "导出报表", value: 58 }, { label: "创建自动化", value: 41 }, { label: "团队协作", value: 34 },
  ];
  const cohorts = [
    { name: "新注册用户", count: Math.max(24, Math.round(snapshot.customerTotal * .22)), d1: 78, d7: 61, d30: 44 },
    { name: "企业客户", count: Math.max(18, Math.round(snapshot.customerTotal * .13)), d1: 91, d7: 82, d30: 69 },
    { name: "API 高频用户", count: Math.max(12, Math.round(snapshot.customerTotal * .08)), d1: 94, d7: 88, d30: 76 },
    { name: "内容创作者", count: Math.max(16, Math.round(snapshot.customerTotal * .11)), d1: 83, d7: 68, d30: 51 },
  ];

  return <>
    <InsightCards items={cards} />
    <section className="secondary-grid user-grid">
      <article className="panel secondary-panel wide-panel"><div className="panel-title"><div><h2>用户增长趋势</h2><p>新增用户随日期范围同步变化</p></div></div><TrendChart key={`${range}-users`} data={snapshot.trends.customers} trendKey="customers" /></article>
      <article className="panel secondary-panel"><div className="panel-title"><div><h2>用户行为偏好</h2><p>核心功能使用渗透率</p></div></div><div className="horizontal-bars">{behavior.map((item) => <button type="button" key={item.label} onClick={() => onFeedback(`${item.label}使用渗透率为 ${item.value}%。`)}><span>{item.label}</span><i><b style={{ width: `${item.value}%` }} /></i><strong>{item.value}%</strong></button>)}</div><div className="user-status-summary"><span><i className="active-dot" />活跃客户 {active}</span><span><i className="sleep-dot" />沉睡客户 {dormant}</span></div></article>
      <article className="panel secondary-panel profile-panel"><div className="panel-title"><div><h2>用户行业画像</h2><p>按客户行业分布</p></div></div><IndustryChart data={snapshot.industries} total={snapshot.customerTotal} onFeedback={onFeedback} /></article>
    </section>
    <section className="panel detail-panel"><div className="panel-title detail-panel-title"><div><h2>用户留存分群</h2><p>不同用户群的 1 / 7 / 30 日留存表现</p></div></div><div className="secondary-table-scroll"><table className="secondary-table"><thead><tr><th>用户群</th><th>样本数</th><th>次日留存</th><th>7 日留存</th><th>30 日留存</th><th>状态</th></tr></thead><tbody>{cohorts.map((row) => <tr key={row.name}><td><strong className="table-primary">{row.name}</strong></td><td>{formatNumber(row.count)}</td><td>{row.d1}%</td><td>{row.d7}%</td><td>{row.d30}%</td><td><span className={`status ${row.d30 >= 60 ? "online" : "sleep"}`}>{row.d30 >= 60 ? "稳定" : "待提升"}</span></td></tr>)}</tbody></table></div></section>
  </>;
}

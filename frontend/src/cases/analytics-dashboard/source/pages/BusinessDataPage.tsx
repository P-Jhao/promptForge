import { useMemo, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { InsightCards, type InsightCardItem } from "../components/InsightCards";
import { TrendChart } from "../components/TrendChart";
import type { RangeKey, RangeSnapshot, TrendKey } from "../types/analytics";
import { formatCurrency, formatNumber } from "../utils/format";
import { changeFor, metricNumber } from "../utils/metrics";

const segmentNames = ["企业 API", "团队版", "专业版", "定制服务"] as const;
const segmentShares = [0.39, 0.28, 0.21, 0.12] as const;
const segmentConversion = [8.6, 7.4, 6.2, 4.8] as const;

export function BusinessDataPage({ range, snapshot, onFeedback }: { range: RangeKey; snapshot: RangeSnapshot; onFeedback: (message: string) => void }) {
  const [trendKey, setTrendKey] = useState<TrendKey>("revenue");
  const [activeSegment, setActiveSegment] = useState(0);
  const revenue = metricNumber(snapshot, "revenue");
  const orders = metricNumber(snapshot, "orders");
  const customers = metricNumber(snapshot, "newCustomers");
  const completion = range === "7" ? 72 : range === "30" ? 86 : range === "90" ? 94 : 0;
  const cards: InsightCardItem[] = [
    { label: "营业收入", value: revenue ? formatCurrency(revenue) : "—", change: changeFor(snapshot, "revenue"), note: "较上周期", icon: "money", tone: "green" },
    { label: "有效订单", value: orders ? formatNumber(orders) : "—", change: changeFor(snapshot, "orders"), note: "较上周期", icon: "document", tone: "blue" },
    { label: "新增客户", value: customers ? formatNumber(customers) : "—", change: changeFor(snapshot, "newCustomers"), note: "较上周期", icon: "users", tone: "violet" },
    { label: "目标完成度", value: completion ? `${completion}%` : "—", change: completion ? `+${Math.max(1.2, completion / 18).toFixed(1)}%` : "—", note: "计划进度", icon: "report", tone: "amber" },
  ];
  const rows = useMemo(() => segmentNames.map((name, index) => ({
    name,
    revenue: Math.round(revenue * segmentShares[index]),
    orders: Math.max(0, Math.round(orders * segmentShares[index])),
    conversion: segmentConversion[index] + (range === "7" ? .5 : range === "90" ? -.3 : 0),
    completion: Math.max(0, Math.min(100, completion - index * 7 + 6)),
  })), [completion, orders, range, revenue]);

  if (range === "empty") return <section className="panel dashboard-empty"><EmptyState title="当前范围暂无业务数据" description="切换日期范围后，可查看业务收入、订单结构、目标完成度和趋势明细。" /></section>;

  const selected = rows[activeSegment];
  return <>
    <InsightCards items={cards} />
    <section className="secondary-grid business-grid">
      <article className="panel secondary-panel wide-panel">
        <div className="panel-title"><div><h2>核心业务趋势</h2><p>按日期范围同步展示关键经营指标</p></div><div className="trend-tabs" role="tablist">{(["revenue", "orders", "customers", "api"] as const).map((key) => <button type="button" role="tab" aria-selected={trendKey === key} className={trendKey === key ? "active" : ""} key={key} onClick={() => setTrendKey(key)}>{{ revenue: "收入", orders: "订单", customers: "新增客户", api: "API 调用" }[key]}</button>)}</div></div>
        <TrendChart key={`${range}-${trendKey}-business`} data={snapshot.trends[trendKey]} trendKey={trendKey} />
      </article>
      <article className="panel secondary-panel">
        <div className="panel-title"><div><h2>业务结构</h2><p>点击业务线查看当前范围贡献</p></div></div>
        <div className="segment-list">{rows.map((row, index) => <button type="button" key={row.name} className={activeSegment === index ? "active" : ""} onClick={() => setActiveSegment(index)}><span>{row.name}</span><strong>{revenue ? `${Math.round(row.revenue / revenue * 100)}%` : "0%"}</strong><i><b style={{ width: `${revenue ? row.revenue / revenue * 100 : 0}%` }} /></i></button>)}</div>
        <div className="segment-detail"><span>{selected.name}</span><strong>{formatCurrency(selected.revenue)}</strong><small>{formatNumber(selected.orders)} 单 · 转化率 {selected.conversion.toFixed(1)}%</small></div>
      </article>
    </section>
    <section className="panel detail-panel">
      <div className="panel-title detail-panel-title"><div><h2>业务线明细</h2><p>各业务线收入、订单、转化率与目标进度</p></div><button className="text-action" type="button" onClick={() => onFeedback("业务线明细已刷新为当前日期范围数据。")}>刷新数据</button></div>
      <div className="secondary-table-scroll"><table className="secondary-table"><thead><tr><th>业务线</th><th>收入</th><th>订单数</th><th>转化率</th><th>目标完成度</th><th>操作</th></tr></thead><tbody>{rows.map((row) => <tr key={row.name}><td><strong className="table-primary">{row.name}</strong></td><td>{formatCurrency(row.revenue)}</td><td>{formatNumber(row.orders)}</td><td>{row.conversion.toFixed(1)}%</td><td><div className="progress-cell"><i><b style={{ width: `${row.completion}%` }} /></i><span>{row.completion}%</span></div></td><td><button className="view-button" type="button" onClick={() => onFeedback(`已定位到${row.name}的业务明细。`)}>查看</button></td></tr>)}</tbody></table></div>
    </section>
  </>;
}

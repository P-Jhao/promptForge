import { EmptyState } from "../components/EmptyState";
import { InsightCards, type InsightCardItem } from "../components/InsightCards";
import { TrendChart } from "../components/TrendChart";
import type { RangeKey, RangeSnapshot } from "../types/analytics";
import { formatCurrency, formatNumber } from "../utils/format";
import { changeFor, metricNumber } from "../utils/metrics";

export function FinanceAnalysisPage({ range, snapshot, onFeedback }: { range: RangeKey; snapshot: RangeSnapshot; onFeedback: (message: string) => void }) {
  const revenue = metricNumber(snapshot, "revenue");
  const orders = metricNumber(snapshot, "orders");
  const avgOrder = orders ? revenue / orders : 0;
  const grossMargin = range === "7" ? 72.4 : range === "30" ? 70.8 : range === "90" ? 69.6 : 0;
  const grossProfit = revenue * grossMargin / 100;
  const cards: InsightCardItem[] = [
    { label: "总收入", value: revenue ? formatCurrency(revenue) : "—", change: changeFor(snapshot, "revenue"), note: "较上周期", icon: "money", tone: "green" },
    { label: "平均客单价", value: avgOrder ? formatCurrency(Math.round(avgOrder)) : "—", change: range === "empty" ? "—" : "+7.6%", note: "按订单计算", icon: "document", tone: "blue" },
    { label: "毛利率", value: grossMargin ? `${grossMargin.toFixed(1)}%` : "—", change: range === "empty" ? "—" : "+1.4%", note: "合成口径", icon: "report", tone: "violet" },
    { label: "毛利润", value: grossProfit ? formatCurrency(Math.round(grossProfit)) : "—", change: range === "empty" ? "—" : "+15.9%", note: "收入 × 毛利率", icon: "barChart", tone: "amber" },
  ];

  if (range === "empty") return <section className="panel dashboard-empty"><EmptyState title="当前范围暂无财务数据" description="切换日期范围后，可查看收入趋势、成本结构、利润与结算状态。" /></section>;

  const costItems = [
    { label: "模型与算力成本", value: 14.8 }, { label: "销售与渠道费用", value: 7.9 }, { label: "客户成功与交付", value: 4.6 }, { label: "基础设施", value: 2.1 },
  ];
  const totalCostRate = costItems.reduce((sum, item) => sum + item.value, 0);
  const periods = range === "7" ? ["04-16", "04-17", "04-18", "04-19", "04-20", "04-21", "04-22"] : ["第 1 周", "第 2 周", "第 3 周", "第 4 周", "本周"];
  const base = revenue / periods.length;
  const cashflow = periods.map((label, index) => ({ label, inflow: Math.round(base * (.82 + index * .08)), outflow: Math.round(base * (.27 + index * .015)) }));
  const maxFlow = Math.max(...cashflow.map((item) => item.inflow), 1);

  return <>
    <InsightCards items={cards} />
    <section className="secondary-grid finance-grid">
      <article className="panel secondary-panel wide-panel"><div className="panel-title"><div><h2>收入趋势</h2><p>当前日期范围的收入变化</p></div></div><TrendChart key={`${range}-finance`} data={snapshot.trends.revenue} trendKey="revenue" /></article>
      <article className="panel secondary-panel"><div className="panel-title"><div><h2>成本结构</h2><p>占收入比例</p></div><span className="panel-chip">总成本 {totalCostRate.toFixed(1)}%</span></div><div className="cost-list">{costItems.map((item) => <button key={item.label} type="button" onClick={() => onFeedback(`${item.label}占收入 ${item.value.toFixed(1)}%。`)}><span>{item.label}</span><strong>{item.value.toFixed(1)}%</strong><i><b style={{ width: `${item.value / 18 * 100}%` }} /></i></button>)}</div></article>
    </section>
    <section className="panel detail-panel cashflow-panel"><div className="panel-title detail-panel-title"><div><h2>现金流概览</h2><p>模拟经营现金流入与支出</p></div><div className="cashflow-legend"><span><i className="inflow-dot" />流入</span><span><i className="outflow-dot" />支出</span></div></div><div className="cashflow-chart">{cashflow.map((item) => <div className="cashflow-column" key={item.label}><div className="cashflow-bars"><i className="cash-in" style={{ height: `${Math.max(8, item.inflow / maxFlow * 100)}%` }} title={`流入 ${formatCurrency(item.inflow)}`} /><i className="cash-out" style={{ height: `${Math.max(8, item.outflow / maxFlow * 100)}%` }} title={`支出 ${formatCurrency(item.outflow)}`} /></div><span>{item.label}</span></div>)}</div><div className="finance-summary-row"><span>经营收入 <strong>{formatCurrency(revenue)}</strong></span><span>成本支出 <strong>{formatCurrency(Math.round(revenue * totalCostRate / 100))}</strong></span><span>预计毛利润 <strong>{formatCurrency(Math.round(grossProfit))}</strong></span><span>订单数 <strong>{formatNumber(orders)}</strong></span></div></section>
  </>;
}

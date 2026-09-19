import type { Dispatch, SetStateAction } from "react";
import { ChannelChart } from "../components/ChannelChart";
import { CustomerTable } from "../components/CustomerTable";
import { EmptyState } from "../components/EmptyState";
import { IndustryChart } from "../components/IndustryChart";
import { MetricCards } from "../components/MetricCards";
import { TrendChart } from "../components/TrendChart";
import { trendTabs } from "../data/demoData";
import type { CustomerTableState } from "../hooks/useCustomerTable";
import type { RangeKey, RangeSnapshot, TrendKey } from "../types/analytics";

interface OverviewPageProps {
  range: RangeKey;
  snapshot: RangeSnapshot;
  trendKey: TrendKey;
  setTrendKey: Dispatch<SetStateAction<TrendKey>>;
  setRange: Dispatch<SetStateAction<RangeKey>>;
  tableState: CustomerTableState;
  onExport: () => void;
  onFeedback: (message: string) => void;
}

export function OverviewPage({ range, snapshot, trendKey, setTrendKey, setRange, tableState, onExport, onFeedback }: OverviewPageProps) {
  return <>
    <MetricCards metrics={snapshot.metrics} />

    {range === "empty" ? <section className="panel dashboard-empty"><EmptyState title="当前范围暂无业务数据" description="这是空数据状态演示。切换到过去 7 天、30 天或 90 天即可恢复指标、趋势和客户记录。" actionLabel="查看过去 30 天" onAction={() => { setRange("30"); onFeedback("已恢复过去 30 天数据。") }} /></section> : <section className="visual-grid">
      <article className="panel trend-panel">
        <div className="panel-title"><h2>业务趋势</h2><div className="trend-tabs" role="tablist" aria-label="趋势指标">{trendTabs.map((tab) => <button key={tab.key} className={trendKey === tab.key ? "active" : ""} type="button" role="tab" aria-selected={trendKey === tab.key} onClick={() => setTrendKey(tab.key)}>{tab.label}</button>)}</div></div>
        <TrendChart key={`${range}-${trendKey}`} data={snapshot.trends[trendKey]} trendKey={trendKey} />
      </article>
      <article className="panel channel-panel"><div className="panel-title"><h2>渠道来源</h2></div><ChannelChart data={snapshot.channels} onFeedback={onFeedback} /></article>
      <article className="panel industry-panel"><div className="panel-title"><h2>客户行业分布</h2></div><IndustryChart data={snapshot.industries} total={snapshot.customerTotal} onFeedback={onFeedback} /></article>
    </section>}

    <CustomerTable state={tableState} emptyRange={range === "empty"} onExport={onExport} onFeedback={onFeedback} />
  </>;
}

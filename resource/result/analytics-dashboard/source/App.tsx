import { useEffect, useState, type ChangeEvent } from "react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { MetricCards } from "./components/MetricCards";
import { TrendChart } from "./components/TrendChart";
import { ChannelChart } from "./components/ChannelChart";
import { IndustryChart } from "./components/IndustryChart";
import { CustomerTable } from "./components/CustomerTable";
import { EmptyState } from "./components/EmptyState";
import { Toast } from "./components/Toast";
import { Icon } from "./components/Icon";
import { customers, rangeOptions, snapshots, trendTabs } from "./data/demoData";
import { useCustomerTable } from "./hooks/useCustomerTable";
import type { RangeKey, TrendKey } from "./types/analytics";
import { customersToCsv, downloadTextFile } from "./utils/csv";

export default function App() {
  const [range, setRange] = useState<RangeKey>("30");
  const [trendKey, setTrendKey] = useState<TrendKey>("customers");
  const [toast, setToast] = useState("");
  const snapshot = snapshots[range];
  const tableState = useCustomerTable({ rows: customers, startDate: snapshot.startDate, endDate: snapshot.endDate, emptyRange: range === "empty" });

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const feedback = (message: string) => setToast(message);
  const exportRows = () => {
    if (tableState.filteredRows.length === 0) {
      feedback("当前筛选没有可导出的客户数据。");
      return;
    }
    const filename = `analytics-customers-${range}d-2024-04-22.csv`;
    downloadTextFile(filename, customersToCsv(tableState.filteredRows));
    feedback(`已生成 ${tableState.filteredRows.length} 条客户记录的本地 CSV。`);
  };

  return <div className="preview-canvas">
    <div className="demo-window">
      <div className="window-chrome" aria-hidden="true"><span className="traffic red" /><span className="traffic yellow" /><span className="traffic green" /></div>
      <div className="analytics-app">
        <Header onFeedback={feedback} />
        <div className="workspace">
          <Sidebar onExport={exportRows} onFeedback={feedback} />
          <main className="dashboard-main">
            <section className="page-heading">
              <div><h1>数据分析看板</h1><p>全面掌握业务数据，洞察增长趋势，驱动更好的决策</p></div>
              <div className="date-controls">
                <div className="date-range" aria-label="当前日期范围"><Icon name="calendar" size={16} /><span>{snapshot.startDate}</span><b>→</b><span>{snapshot.endDate}</span></div>
                <label className="period-select"><select value={range} onChange={(event: ChangeEvent<HTMLSelectElement>) => { const next = event.target.value as RangeKey; setRange(next); feedback(`已切换至${snapshots[next].label}。`); }} aria-label="日期范围">{rangeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><Icon name="chevronDown" size={14} /></label>
              </div>
            </section>

            <MetricCards metrics={snapshot.metrics} />

            {range === "empty" ? <section className="panel dashboard-empty"><EmptyState title="当前范围暂无业务数据" description="这是空数据状态演示。切换到过去 7 天、30 天或 90 天即可恢复指标、趋势和客户记录。" actionLabel="查看过去 30 天" onAction={() => { setRange("30"); feedback("已恢复过去 30 天数据。") }} /></section> : <section className="visual-grid">
              <article className="panel trend-panel">
                <div className="panel-title"><h2>业务趋势</h2><div className="trend-tabs" role="tablist" aria-label="趋势指标">{trendTabs.map((tab) => <button key={tab.key} className={trendKey === tab.key ? "active" : ""} type="button" role="tab" aria-selected={trendKey === tab.key} onClick={() => setTrendKey(tab.key)}>{tab.label}</button>)}</div></div>
                <TrendChart key={`${range}-${trendKey}`} data={snapshot.trends[trendKey]} trendKey={trendKey} />
              </article>
              <article className="panel channel-panel"><div className="panel-title"><h2>渠道来源</h2></div><ChannelChart data={snapshot.channels} onFeedback={feedback} /></article>
              <article className="panel industry-panel"><div className="panel-title"><h2>客户行业分布</h2></div><IndustryChart data={snapshot.industries} total={snapshot.customerTotal} onFeedback={feedback} /></article>
            </section>}

            <CustomerTable state={tableState} emptyRange={range === "empty"} onExport={exportRows} onFeedback={feedback} />
          </main>
        </div>
      </div>
    </div>
    {toast ? <Toast message={toast} onClose={() => setToast("")} /> : null}
  </div>;
}

import { useEffect, useState, type ReactNode } from "react";
import { Header } from "./components/Header";
import { MobileSectionNav } from "./components/MobileSectionNav";
import { PageHeading } from "./components/PageHeading";
import { Sidebar } from "./components/Sidebar";
import { Toast } from "./components/Toast";
import { analyticsNavItems } from "./data/navigation";
import { customers, snapshots } from "./data/demoData";
import { useCustomerTable } from "./hooks/useCustomerTable";
import { BusinessDataPage } from "./pages/BusinessDataPage";
import { ChannelAnalysisPage } from "./pages/ChannelAnalysisPage";
import { CustomReportPage } from "./pages/CustomReportPage";
import { FinanceAnalysisPage } from "./pages/FinanceAnalysisPage";
import { OverviewPage } from "./pages/OverviewPage";
import { ProductAnalysisPage } from "./pages/ProductAnalysisPage";
import { UserAnalysisPage } from "./pages/UserAnalysisPage";
import type { PageKey, RangeKey, TrendKey } from "./types/analytics";
import { customersToCsv, downloadTextFile } from "./utils/csv";

export default function App() {
  const [activePage, setActivePage] = useState<PageKey>("overview");
  const [range, setRange] = useState<RangeKey>("30");
  const [trendKey, setTrendKey] = useState<TrendKey>("customers");
  const [toast, setToast] = useState("");
  const snapshot = snapshots[range];
  const pageMeta = analyticsNavItems.find((item) => item.key === activePage) ?? analyticsNavItems[0];
  const tableState = useCustomerTable({ rows: customers, startDate: snapshot.startDate, endDate: snapshot.endDate, emptyRange: range === "empty" });

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const feedback = (message: string) => setToast(message);
  const exportRows = () => {
    if (tableState.filteredRows.length === 0) {
      feedback("当前日期范围或筛选条件下没有可导出的客户数据。");
      return;
    }
    const filename = `analytics-customers-${range}d-2024-04-22.csv`;
    downloadTextFile(filename, customersToCsv(tableState.filteredRows));
    feedback(`已生成 ${tableState.filteredRows.length} 条客户记录的本地 CSV。`);
  };
  const navigate = (page: PageKey) => {
    setActivePage(page);
    const target = analyticsNavItems.find((item) => item.key === page);
    if (target) feedback(`已进入${target.label}。`);
  };
  const changeRange = (next: RangeKey) => {
    setRange(next);
    feedback(`已切换至${snapshots[next].label}，当前页面数据已同步更新。`);
  };

  let content: ReactNode;
  switch (activePage) {
    case "business":
      content = <BusinessDataPage range={range} snapshot={snapshot} onFeedback={feedback} />;
      break;
    case "users":
      content = <UserAnalysisPage range={range} snapshot={snapshot} rows={tableState.rangeRows} onFeedback={feedback} />;
      break;
    case "products":
      content = <ProductAnalysisPage range={range} snapshot={snapshot} onFeedback={feedback} />;
      break;
    case "channels":
      content = <ChannelAnalysisPage range={range} snapshot={snapshot} onFeedback={feedback} />;
      break;
    case "finance":
      content = <FinanceAnalysisPage range={range} snapshot={snapshot} onFeedback={feedback} />;
      break;
    case "reports":
      content = <CustomReportPage range={range} snapshot={snapshot} onFeedback={feedback} />;
      break;
    default:
      content = <OverviewPage range={range} snapshot={snapshot} trendKey={trendKey} setTrendKey={setTrendKey} setRange={setRange} tableState={tableState} onExport={exportRows} onFeedback={feedback} />;
  }

  return <div className="preview-canvas">
    <div className="demo-window">
      <div className="window-chrome" aria-hidden="true"><span className="traffic red" /><span className="traffic yellow" /><span className="traffic green" /></div>
      <div className="analytics-app">
        <Header onFeedback={feedback} />
        <div className="workspace">
          <Sidebar activePage={activePage} onNavigate={navigate} onExport={exportRows} onFeedback={feedback} />
          <main className="dashboard-main">
            <MobileSectionNav active={activePage} onNavigate={navigate} />
            <PageHeading title={pageMeta.title} subtitle={pageMeta.subtitle} range={range} onRangeChange={changeRange} />
            {content}
          </main>
        </div>
      </div>
    </div>
    {toast ? <Toast message={toast} onClose={() => setToast("")} /> : null}
  </div>;
}

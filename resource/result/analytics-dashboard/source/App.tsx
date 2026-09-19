import { useEffect, useState, type ReactNode } from "react";
import { Header } from "./components/Header";
import { MobileSectionNav } from "./components/MobileSectionNav";
import { PageHeading } from "./components/PageHeading";
import { Sidebar } from "./components/Sidebar";
import { Toast } from "./components/Toast";
import { analyticsNavItems } from "./data/navigation";
import { customers, snapshots } from "./data/demoData";
import { workspaceNavigation } from "./data/workspaceNavigation";
import { useCustomerTable } from "./hooks/useCustomerTable";
import { AccountInfoPage } from "./pages/AccountInfoPage";
import { BusinessDataPage } from "./pages/BusinessDataPage";
import { ChannelAnalysisPage } from "./pages/ChannelAnalysisPage";
import { CustomerManagementPage } from "./pages/CustomerManagementPage";
import { CustomReportPage } from "./pages/CustomReportPage";
import { FinanceAnalysisPage } from "./pages/FinanceAnalysisPage";
import { OverviewPage } from "./pages/OverviewPage";
import { PreferencesPage } from "./pages/PreferencesPage";
import { ProductAnalysisPage } from "./pages/ProductAnalysisPage";
import { ProductCenterPage } from "./pages/ProductCenterPage";
import { TeamCollaborationPage } from "./pages/TeamCollaborationPage";
import { UserAnalysisPage } from "./pages/UserAnalysisPage";
import type { PageKey, RangeKey, TrendKey, WorkspaceSectionKey } from "./types/analytics";
import { customersToCsv, downloadTextFile } from "./utils/csv";

const sectionLabels: Record<WorkspaceSectionKey, string> = {
  analytics: "数据分析",
  customers: "客户管理",
  productCenter: "产品中心",
  team: "团队协作",
  account: "账户信息",
  preferences: "偏好设置",
};

export default function App() {
  const [activeSection, setActiveSection] = useState<WorkspaceSectionKey>("analytics");
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
    setActiveSection("analytics");
    setActivePage(page);
    const target = analyticsNavItems.find((item) => item.key === page);
    if (target) feedback(`已进入${target.label}。`);
  };
  const navigateSection = (section: WorkspaceSectionKey) => {
    setActiveSection(section);
    feedback(`已进入${sectionLabels[section]}。`);
  };
  const globalSearch = (query: string) => {
    const normalized = query.toLowerCase();
    if (normalized.includes("客户") || normalized.includes("联系人")) {
      setActiveSection("customers");
      feedback(`已根据“${query}”进入客户管理。`);
    } else if (normalized.includes("产品") || normalized.includes("api")) {
      setActiveSection("productCenter");
      feedback(`已根据“${query}”进入产品中心。`);
    } else if (normalized.includes("团队") || normalized.includes("协作") || normalized.includes("成员")) {
      setActiveSection("team");
      feedback(`已根据“${query}”进入团队协作。`);
    } else if (normalized.includes("账户") || normalized.includes("账号")) {
      setActiveSection("account");
      feedback(`已根据“${query}”进入账户信息。`);
    } else if (normalized.includes("偏好") || normalized.includes("设置")) {
      setActiveSection("preferences");
      feedback(`已根据“${query}”进入偏好设置。`);
    } else {
      setActiveSection("analytics");
      feedback(`已在数据分析区域定位“${query}”。`);
    }
  };
  const changeRange = (next: RangeKey) => {
    setRange(next);
    feedback(`已切换至${snapshots[next].label}，当前页面数据已同步更新。`);
  };

  let analyticsContent: ReactNode;
  switch (activePage) {
    case "business":
      analyticsContent = <BusinessDataPage range={range} snapshot={snapshot} onFeedback={feedback} />;
      break;
    case "users":
      analyticsContent = <UserAnalysisPage range={range} snapshot={snapshot} rows={tableState.rangeRows} onFeedback={feedback} />;
      break;
    case "products":
      analyticsContent = <ProductAnalysisPage range={range} snapshot={snapshot} onFeedback={feedback} />;
      break;
    case "channels":
      analyticsContent = <ChannelAnalysisPage range={range} snapshot={snapshot} onFeedback={feedback} />;
      break;
    case "finance":
      analyticsContent = <FinanceAnalysisPage range={range} snapshot={snapshot} onFeedback={feedback} />;
      break;
    case "reports":
      analyticsContent = <CustomReportPage range={range} snapshot={snapshot} onFeedback={feedback} />;
      break;
    default:
      analyticsContent = <OverviewPage range={range} snapshot={snapshot} trendKey={trendKey} setTrendKey={setTrendKey} setRange={setRange} tableState={tableState} onExport={exportRows} onFeedback={feedback} />;
  }

  let suiteContent: ReactNode;
  switch (activeSection) {
    case "customers": suiteContent = <CustomerManagementPage onFeedback={feedback} />; break;
    case "productCenter": suiteContent = <ProductCenterPage onFeedback={feedback} />; break;
    case "team": suiteContent = <TeamCollaborationPage onFeedback={feedback} />; break;
    case "account": suiteContent = <AccountInfoPage onFeedback={feedback} />; break;
    case "preferences": suiteContent = <PreferencesPage onFeedback={feedback} />; break;
    default: suiteContent = null;
  }

  return <div className="preview-canvas">
    <div className="demo-window">
      <div className="window-chrome" aria-hidden="true"><span className="traffic red" /><span className="traffic yellow" /><span className="traffic green" /></div>
      <div className="analytics-app">
        <Header activeSection={activeSection} onNavigate={navigateSection} onSearch={globalSearch} onFeedback={feedback} />
        <nav className="mobile-app-nav" aria-label="移动端主导航">{workspaceNavigation.map((item) => <button key={item.key} className={activeSection === item.key ? "active" : ""} type="button" onClick={() => navigateSection(item.key)}>{item.label}</button>)}</nav>
        {activeSection === "analytics" ? <div className="workspace">
          <Sidebar activePage={activePage} onNavigate={navigate} onExport={exportRows} onFeedback={feedback} />
          <main className="dashboard-main">
            <MobileSectionNav active={activePage} onNavigate={navigate} />
            <PageHeading title={pageMeta.title} subtitle={pageMeta.subtitle} range={range} onRangeChange={changeRange} />
            {analyticsContent}
          </main>
        </div> : <div className="workspace suite-workspace"><main className="dashboard-main suite-main">{suiteContent}</main></div>}
      </div>
    </div>
    {toast ? <Toast message={toast} onClose={() => setToast("")} /> : null}
  </div>;
}

import { useState } from "react";
import { analyticsNavItems } from "../data/navigation";
import type { PageKey } from "../types/analytics";
import { Icon } from "./Icon";

interface SidebarProps {
  activePage: PageKey;
  onNavigate: (page: PageKey) => void;
  onExport: () => void;
  onFeedback: (message: string) => void;
}

export function Sidebar({ activePage, onNavigate, onExport, onFeedback }: SidebarProps) {
  const [subscribed, setSubscribed] = useState(false);
  return <aside className="analytics-sidebar">
    <div className="side-title"><Icon name="barChart" size={20} /><strong>数据分析</strong></div>
    <nav className="side-nav" aria-label="数据分析导航">
      {analyticsNavItems.map((item) => <button key={item.key} className={activePage === item.key ? "active" : ""} type="button" onClick={() => onNavigate(item.key)}><Icon name={item.icon} size={17} /><span>{item.label}</span></button>)}
    </nav>
    <div className="side-divider" />
    <span className="side-label">数据工具</span>
    <nav className="side-nav tools" aria-label="数据工具">
      <button type="button" onClick={onExport}><Icon name="download" size={17} /><span>数据导出</span></button>
      <button type="button" className={subscribed ? "tool-on" : ""} aria-pressed={subscribed} onClick={() => {
        setSubscribed((value) => {
          const next = !value;
          onFeedback(next ? "数据订阅已开启，每日经营摘要将在本地演示中标记为已订阅。" : "数据订阅已关闭。");
          return next;
        });
      }}><Icon name="tag" size={17} /><span>数据订阅{subscribed ? " · 已开启" : ""}</span></button>
      <button type="button" onClick={() => { onNavigate("reports"); onFeedback("已进入自定义报表设置。") }}><Icon name="settings" size={17} /><span>报表设置</span></button>
    </nav>
    <div className="sync-card"><strong>数据更新</strong><span><i />已实时更新</span><small>最近更新：2024-04-22 10:24</small></div>
  </aside>;
}

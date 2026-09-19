import { useState } from "react";
import { Icon, type IconName } from "./Icon";

interface SidebarProps {
  onExport: () => void;
  onFeedback: (message: string) => void;
}

const navItems: Array<{ label: string; icon: IconName }> = [
  { label: "总览看板", icon: "home" },
  { label: "业务数据", icon: "barChart" },
  { label: "用户分析", icon: "user" },
  { label: "产品分析", icon: "cube" },
  { label: "渠道分析", icon: "link" },
  { label: "财务分析", icon: "file" },
  { label: "自定义报表", icon: "report" },
];

export function Sidebar({ onExport, onFeedback }: SidebarProps) {
  const [active, setActive] = useState("总览看板");
  return <aside className="analytics-sidebar">
    <div className="side-title"><Icon name="barChart" size={20} /><strong>数据分析</strong></div>
    <nav className="side-nav" aria-label="数据分析导航">
      {navItems.map((item) => <button key={item.label} className={active === item.label ? "active" : ""} type="button" onClick={() => {
        setActive(item.label);
        if (item.label !== "总览看板") onFeedback(`${item.label}已选中；本案例继续展示总览数据。`);
      }}><Icon name={item.icon} size={17} /><span>{item.label}</span></button>)}
    </nav>
    <div className="side-divider" />
    <span className="side-label">数据工具</span>
    <nav className="side-nav tools" aria-label="数据工具">
      <button type="button" onClick={onExport}><Icon name="download" size={17} /><span>数据导出</span></button>
      <button type="button" onClick={() => onFeedback("数据订阅已开启演示反馈；不会连接外部服务。") }><Icon name="tag" size={17} /><span>数据订阅</span></button>
      <button type="button" onClick={() => onFeedback("报表设置已打开演示反馈。") }><Icon name="settings" size={17} /><span>报表设置</span></button>
    </nav>
    <div className="sync-card"><strong>数据更新</strong><span><i />已实时更新</span><small>最近更新：2024-04-22 10:24</small></div>
  </aside>;
}

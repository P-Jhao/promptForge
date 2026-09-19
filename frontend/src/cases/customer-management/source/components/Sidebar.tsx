import type { IconName } from "./Icon";
import { Icon } from "./Icon";

const items: { label: string; icon: IconName; active?: boolean }[] = [
  { label: "工作台", icon: "home" },
  { label: "客户管理", icon: "users", active: true },
  { label: "销售机会", icon: "opportunity" },
  { label: "跟进记录", icon: "clock" },
  { label: "合同管理", icon: "file" },
  { label: "产品管理", icon: "box" },
  { label: "数据报表", icon: "chart" },
  { label: "团队协作", icon: "team" },
  { label: "系统设置", icon: "settings" },
];

export function Sidebar({ onNavigate, onUpgrade }: { onNavigate: (label: string) => void; onUpgrade: () => void }) {
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav" aria-label="客户管理功能导航">
        {items.map((item, index) => (
          <button
            key={item.label}
            type="button"
            className={`sidebar-item${item.active ? " active" : ""}${index === 8 ? " sidebar-item-settings" : ""}`}
            onClick={() => onNavigate(item.label)}
            aria-current={item.active ? "page" : undefined}
          >
            <Icon name={item.icon} size={19} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <button className="upgrade-card" type="button" onClick={onUpgrade}>
        <span className="upgrade-crown">♛</span>
        <span><strong>升级到专业版</strong><small>解锁更多高级功能</small></span>
        <span className="upgrade-arrow">›</span>
      </button>
    </aside>
  );
}

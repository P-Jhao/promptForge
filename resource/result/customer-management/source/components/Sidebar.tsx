import type { NavigationKey } from "../types/workspace";
import type { IconName } from "./Icon";
import { Icon } from "./Icon";

const items: { key: NavigationKey; label: string; icon: IconName }[] = [
  { key: "workspace", label: "工作台", icon: "home" },
  { key: "customers", label: "客户管理", icon: "users" },
  { key: "opportunities", label: "销售机会", icon: "opportunity" },
  { key: "followups", label: "跟进记录", icon: "clock" },
  { key: "contracts", label: "合同管理", icon: "file" },
  { key: "products", label: "产品管理", icon: "box" },
  { key: "reports", label: "数据报表", icon: "chart" },
  { key: "team", label: "团队协作", icon: "team" },
  { key: "settings", label: "系统设置", icon: "settings" },
];

export function Sidebar({ activeKey, onNavigate, onUpgrade }: { activeKey: NavigationKey; onNavigate: (key: NavigationKey) => void; onUpgrade: () => void }) {
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav" aria-label="客户管理功能导航">
        {items.map((item, index) => {
          const active = item.key === activeKey;
          return (
            <button
              key={item.key}
              type="button"
              className={`sidebar-item${active ? " active" : ""}${index === 8 ? " sidebar-item-settings" : ""}`}
              onClick={() => onNavigate(item.key)}
              aria-current={active ? "page" : undefined}
              title={item.label}
            >
              <Icon name={item.icon} size={19} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      <button className="upgrade-card" type="button" onClick={onUpgrade}>
        <span className="upgrade-crown">♛</span>
        <span><strong>升级到专业版</strong><small>解锁更多高级功能</small></span>
        <span className="upgrade-arrow">›</span>
      </button>
    </aside>
  );
}

import { useState, type ChangeEvent, type FormEvent } from "react";
import { Icon } from "./Icon";

interface HeaderProps {
  onFeedback: (message: string) => void;
}

const navItems = ["数据分析", "客户管理", "产品中心", "团队协作"];

export function Header({ onFeedback }: HeaderProps) {
  const [activeNav, setActiveNav] = useState("数据分析");
  const [search, setSearch] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const submitSearch = () => {
    const value = search.trim();
    onFeedback(value ? `已搜索“${value}”，当前案例仅展示数据分析结果。` : "请输入要搜索的数据看板、指标或功能。" );
  };

  return <header className="topbar">
    <div className="brand" aria-label="PromptForge">
      <span className="brand-mark"><Icon name="logo" size={22} /></span>
      <strong>PromptForge</strong>
    </div>
    <span className="topbar-divider" />
    <nav className="primary-nav" aria-label="主导航">
      {navItems.map((item) => <button key={item} className={activeNav === item ? "active" : ""} type="button" onClick={() => {
        setActiveNav(item);
        if (item !== "数据分析") onFeedback(`${item}已选中；本案例保持在数据分析演示页。`);
      }}>{item}</button>)}
    </nav>
    <div className="topbar-tools">
      <form className="global-search" onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); submitSearch(); }}>
        <Icon name="search" size={16} />
        <input value={search} onChange={(event: ChangeEvent<HTMLInputElement>) => setSearch(event.target.value)} placeholder="搜索数据看板、指标或功能..." aria-label="全局搜索" />
        <kbd>⌘ K</kbd>
      </form>
      <div className="top-popover-anchor">
        <button className="icon-button notification" type="button" aria-label="通知" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen((value) => !value)}>
          <Icon name="bell" size={18} /><i />
        </button>
        {notificationsOpen && <div className="top-popover notification-popover" role="status"><strong>通知</strong><p>数据看板已在 10:24 完成同步。</p><button type="button" onClick={() => { setNotificationsOpen(false); onFeedback("通知已标记为已读。") }}>标记已读</button></div>}
      </div>
      <span className="top-avatar">Z</span>
      <div className="top-popover-anchor account-anchor">
        <button className="account" type="button" aria-expanded={accountOpen} onClick={() => setAccountOpen((value) => !value)}><strong>张三</strong><small>企业版</small><Icon name="chevronDown" size={14} /></button>
        {accountOpen && <div className="top-popover account-popover"><button type="button" onClick={() => onFeedback("已打开账户信息演示。")}>账户信息</button><button type="button" onClick={() => onFeedback("已打开偏好设置演示。")}>偏好设置</button></div>}
      </div>
    </div>
  </header>;
}

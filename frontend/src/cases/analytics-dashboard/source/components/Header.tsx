import { useState, type ChangeEvent, type FormEvent } from "react";
import { workspaceNavigation } from "../data/workspaceNavigation";
import type { WorkspaceSectionKey } from "../types/analytics";
import { Icon } from "./Icon";

interface HeaderProps {
  activeSection: WorkspaceSectionKey;
  onNavigate: (section: WorkspaceSectionKey) => void;
  onSearch: (query: string) => void;
  onFeedback: (message: string) => void;
}

export function Header({ activeSection, onNavigate, onSearch, onFeedback }: HeaderProps) {
  const [search, setSearch] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const submitSearch = () => {
    const value = search.trim();
    if (!value) {
      onFeedback("请输入要搜索的数据看板、客户、产品或功能。");
      return;
    }
    onSearch(value);
  };

  const navigate = (section: WorkspaceSectionKey) => {
    setAccountOpen(false);
    setNotificationsOpen(false);
    onNavigate(section);
  };

  return <header className="topbar">
    <div className="brand" aria-label="数据分析看板">
      <span className="brand-mark"><Icon name="barChart" size={22} /></span>
      <strong>数据看板</strong>
    </div>
    <span className="topbar-divider" />
    <nav className="primary-nav" aria-label="主导航">
      {workspaceNavigation.map((item) => <button key={item.key} className={activeSection === item.key ? "active" : ""} type="button" onClick={() => navigate(item.key)}>{item.label}</button>)}
    </nav>
    <div className="topbar-tools">
      <form className="global-search" onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); submitSearch(); }}>
        <Icon name="search" size={16} />
        <input value={search} onChange={(event: ChangeEvent<HTMLInputElement>) => setSearch(event.target.value)} placeholder="搜索数据看板、指标或功能..." aria-label="全局搜索" />
        <kbd>⌘ K</kbd>
      </form>
      <div className="top-popover-anchor">
        <button className="icon-button notification" type="button" aria-label="通知" aria-expanded={notificationsOpen} onClick={() => { setNotificationsOpen((value) => !value); setAccountOpen(false); }}>
          <Icon name="bell" size={18} /><i />
        </button>
        {notificationsOpen && <div className="top-popover notification-popover" role="status"><strong>通知</strong><p>数据看板已在 10:24 完成同步。</p><button type="button" onClick={() => { setNotificationsOpen(false); onFeedback("通知已标记为已读。"); }}>标记已读</button></div>}
      </div>
      <span className="top-avatar">Z</span>
      <div className="top-popover-anchor account-anchor">
        <button className="account" type="button" aria-expanded={accountOpen} onClick={() => { setAccountOpen((value) => !value); setNotificationsOpen(false); }}><strong>张三</strong><small>企业版</small><Icon name="chevronDown" size={14} /></button>
        {accountOpen && <div className="top-popover account-popover"><button type="button" onClick={() => navigate("account")}>账户信息</button><button type="button" onClick={() => navigate("preferences")}>偏好设置</button></div>}
      </div>
    </div>
  </header>;
}

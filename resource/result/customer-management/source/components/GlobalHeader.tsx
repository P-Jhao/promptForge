import { useState } from "react";
import { Icon } from "./Icon";
import { PersonAvatar } from "./Identity";

export function GlobalHeader({
  query,
  onQueryChange,
  onResetDemo,
  searchPlaceholder,
  searchDisabled = false,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  onResetDemo: () => void;
  searchPlaceholder: string;
  searchDisabled?: boolean;
}) {
  const [popover, setPopover] = useState<"help" | "notifications" | "account" | null>(null);
  const toggle = (next: "help" | "notifications" | "account") => setPopover((current) => (current === next ? null : next));

  return (
    <header className="global-header">
      <div className="header-brand">
        <span className="brand-symbol"><span /></span>
        <strong>客户管理后台</strong>
        <span className="pro-badge">Pro</span>
      </div>
      <label className={`global-search${searchDisabled ? " is-disabled" : ""}`}>
        <Icon name="search" size={17} />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={searchPlaceholder}
          aria-label="搜索当前模块"
          disabled={searchDisabled}
        />
        <kbd>⌘ K</kbd>
      </label>
      <div className="header-actions">
        <div className="header-popover-anchor">
          <button className="header-icon-button has-dot" type="button" onClick={() => toggle("notifications")} aria-label="通知">
            <Icon name="bell" size={20} />
          </button>
          {popover === "notifications" && <div className="header-popover"><strong>通知</strong><p>当前没有新的客户提醒。</p></div>}
        </div>
        <div className="header-popover-anchor">
          <button className="header-icon-button" type="button" onClick={() => toggle("help")} aria-label="帮助">
            <Icon name="help" size={20} />
          </button>
          {popover === "help" && <div className="header-popover"><strong>快捷提示</strong><p>左侧导航可切换全部演示模块；列表与卡片操作都会保留在当前预览会话中。</p></div>}
        </div>
        <span className="header-divider" />
        <div className="header-popover-anchor account-anchor">
          <button className="account-button" type="button" onClick={() => toggle("account")} aria-label="账户菜单">
            <PersonAvatar name="张三" size="sm" />
            <span><strong>张三</strong><small>管理员</small></span>
            <Icon name="chevronDown" size={15} />
          </button>
          {popover === "account" && (
            <div className="header-popover account-popover">
              <strong>演示账户</strong>
              <p>所有修改仅保存在当前预览内存中。</p>
              <button type="button" onClick={() => { onResetDemo(); setPopover(null); }}>重置演示数据</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

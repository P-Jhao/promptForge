import type { ChangeEvent } from "react";
import type { NavItem, ThemeMode } from "../types/blog";
import { navItems } from "../data/site";
import { Icon } from "./Icon";

interface HeaderProps {
  activeNav: NavItem;
  query: string;
  subscribed: boolean;
  theme: ThemeMode;
  onClearQuery: () => void;
  onNavigate: (item: NavItem) => void;
  onQueryChange: (value: string) => void;
  onSubscribe: () => void;
  onThemeToggle: () => void;
}

export function Header({
  activeNav,
  query,
  subscribed,
  theme,
  onClearQuery,
  onNavigate,
  onQueryChange,
  onSubscribe,
  onThemeToggle,
}: HeaderProps) {
  return (
    <header className="blog-header">
      <button className="blog-brand" type="button" onClick={() => onNavigate("首页")} aria-label="返回博客首页">
        <span className="brand-logo" aria-hidden="true"><i /><i /><i /></span>
        <span className="brand-title">清川的博客</span>
        <span className="brand-divider" aria-hidden="true" />
        <span className="brand-tagline">记录思考，创造更好的自己</span>
      </button>

      <nav className="main-nav" aria-label="主导航">
        {navItems.map((item) => (
          <button
            key={item}
            type="button"
            className={activeNav === item ? "active" : ""}
            aria-current={activeNav === item ? "page" : undefined}
            onClick={() => onNavigate(item)}
          >
            {item}
          </button>
        ))}
      </nav>

      <div className="header-actions">
        <label className="search-box">
          <Icon name="search" size={17} />
          <input
            id="article-search"
            value={query}
            onChange={(event: ChangeEvent<HTMLInputElement>) => onQueryChange(event.target.value)}
            placeholder="搜索文章、标签或内容..."
            aria-label="搜索文章"
          />
          {query.length > 0 ? (
            <button type="button" className="search-clear" onClick={onClearQuery} aria-label="清除搜索">×</button>
          ) : (
            <kbd>⌘ K</kbd>
          )}
        </label>
        <button className="icon-button" type="button" onClick={onThemeToggle} aria-label={theme === "dark" ? "切换浅色模式" : "切换深色模式"}>
          <Icon name={theme === "dark" ? "sun" : "moon"} size={19} />
        </button>
        <button className={`subscribe-button ${subscribed ? "is-subscribed" : ""}`} type="button" onClick={onSubscribe}>
          {subscribed ? <><Icon name="check" size={15} />已订阅</> : "订阅"}
        </button>
      </div>
    </header>
  );
}

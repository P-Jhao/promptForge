import { analyticsNavItems } from "../data/navigation";
import type { PageKey } from "../types/analytics";

export function MobileSectionNav({ active, onNavigate }: { active: PageKey; onNavigate: (page: PageKey) => void }) {
  return <nav className="mobile-section-nav" aria-label="数据分析页面导航">
    {analyticsNavItems.map((item) => <button key={item.key} className={active === item.key ? "active" : ""} type="button" onClick={() => onNavigate(item.key)}>{item.label}</button>)}
  </nav>;
}

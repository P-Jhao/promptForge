import { Icon, type IconName } from "./Icon";

export interface InsightCardItem {
  label: string;
  value: string;
  change?: string;
  note?: string;
  icon: IconName;
  tone?: "blue" | "green" | "violet" | "amber";
}

export function InsightCards({ items }: { items: readonly InsightCardItem[] }) {
  return <section className="insight-grid" aria-label="核心分析指标">
    {items.map((item) => <article className="insight-card" key={item.label}>
      <span className={`insight-icon ${item.tone ?? "blue"}`}><Icon name={item.icon} size={18} /></span>
      <div className="insight-copy"><span>{item.label}</span><strong>{item.value}</strong><div>{item.change ? <b>{item.change}</b> : null}{item.note ? <small>{item.note}</small> : null}</div></div>
    </article>)}
  </section>;
}

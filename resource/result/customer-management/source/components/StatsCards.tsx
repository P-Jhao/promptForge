import type { CustomerStats } from "../types/customer";
import { Icon } from "./Icon";

export function StatsCards({ stats }: { stats: CustomerStats }) {
  const cards = [
    { label: "全部客户", value: stats.total, trend: "+12%", trendClass: "up", icon: "users" as const, tone: "purple" },
    { label: "潜在客户", value: stats.potential, trend: "+8%", trendClass: "up", icon: "team" as const, tone: "blue" },
    { label: "成交客户", value: stats.won, trend: "+24%", trendClass: "up", icon: "check" as const, tone: "green" },
    { label: "流失客户", value: stats.lost, trend: "-6%", trendClass: "down", icon: "opportunity" as const, tone: "pink" },
  ];
  return (
    <section className="stats-grid" aria-label="客户统计">
      {cards.map((card) => (
        <article className="stat-card" key={card.label}>
          <span className={`stat-icon stat-icon-${card.tone}`}><Icon name={card.icon} size={20} /></span>
          <div className="stat-content">
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <small>较上月 <b className={card.trendClass}>{card.trend} {card.trendClass === "up" ? "↑" : "↓"}</b></small>
          </div>
        </article>
      ))}
    </section>
  );
}

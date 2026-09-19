import type { MetricItem } from "../types/analytics";
import { Icon } from "./Icon";

export function MetricCards({ metrics }: { metrics: readonly MetricItem[] }) {
  return <section className="metric-grid" aria-label="核心指标">
    {metrics.map((metric) => <article className="metric-card" key={metric.key}>
      <span className={`metric-icon ${metric.tone}`}><Icon name={metric.icon} size={21} /></span>
      <span className="metric-label">{metric.label}</span>
      <strong>{metric.value}</strong>
      <span className={`metric-change ${metric.change === "—" ? "muted" : ""}`}>{metric.change === "—" ? "—" : <><Icon name="arrowUp" size={13} />{metric.change}</>}</span>
      <small>{metric.change === "—" ? "暂无数据" : "较上周期"}</small>
    </article>)}
  </section>;
}

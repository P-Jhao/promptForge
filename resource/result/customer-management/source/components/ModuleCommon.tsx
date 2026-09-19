import type { IconName } from "./Icon";
import { Icon } from "./Icon";

export interface ModuleMetric {
  label: string;
  value: string;
  hint: string;
  icon: IconName;
  tone?: "primary" | "success" | "warning" | "danger";
}

export function ModulePageHeader({
  title,
  subtitle,
  actionLabel,
  actionIcon = "plus",
  onAction,
}: {
  title: string;
  subtitle: string;
  actionLabel?: string;
  actionIcon?: IconName;
  onAction?: () => void;
}) {
  return (
    <header className="page-heading module-page-heading">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {actionLabel !== undefined && onAction !== undefined && (
        <button className="add-customer-button" type="button" onClick={onAction}>
          <Icon name={actionIcon} size={17} />
          {actionLabel}
        </button>
      )}
    </header>
  );
}

export function ModuleMetrics({ metrics }: { metrics: ModuleMetric[] }) {
  return (
    <section className="module-metric-grid" aria-label="模块概览">
      {metrics.map((metric) => (
        <article key={metric.label} className={`module-metric-card tone-${metric.tone ?? "primary"}`}>
          <span className="module-metric-icon"><Icon name={metric.icon} size={20} /></span>
          <span className="module-metric-copy">
            <small>{metric.label}</small>
            <strong>{metric.value}</strong>
            <em>{metric.hint}</em>
          </span>
        </article>
      ))}
    </section>
  );
}

export function ModuleEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="module-empty-state">
      <span><Icon name="search" size={22} /></span>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}

export function StatusPill({ children, tone = "neutral" }: { children: string; tone?: "neutral" | "success" | "warning" | "danger" | "primary" }) {
  return <span className={`module-status-pill ${tone}`}>{children}</span>;
}

export function formatCurrency(value: number): string {
  return `¥${value.toLocaleString("zh-CN")}`;
}

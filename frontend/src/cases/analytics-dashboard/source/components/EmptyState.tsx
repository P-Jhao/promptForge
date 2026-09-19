import { Icon } from "./Icon";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
}

export function EmptyState({ title, description, actionLabel, onAction, compact = false }: EmptyStateProps) {
  return <div className={compact ? "empty-state compact" : "empty-state"} role="status">
    <span className="empty-icon"><Icon name="inbox" size={22} /></span>
    <strong>{title}</strong>
    <p>{description}</p>
    {actionLabel && onAction ? <button type="button" onClick={onAction}>{actionLabel}</button> : null}
  </div>;
}

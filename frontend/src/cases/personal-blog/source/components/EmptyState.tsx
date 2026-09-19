import { Icon } from "./Icon";

interface EmptyStateProps {
  onClear: () => void;
}

export function EmptyState({ onClear }: EmptyStateProps) {
  return (
    <div className="empty-state" role="status">
      <span className="empty-icon"><Icon name="search" size={24} /></span>
      <h3>没有找到匹配的文章</h3>
      <p>试试更短的关键词，或清除当前分类与标签筛选。</p>
      <button type="button" onClick={onClear}>清除搜索和筛选</button>
    </div>
  );
}

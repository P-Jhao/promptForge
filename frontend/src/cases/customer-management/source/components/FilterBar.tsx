import { useState } from "react";
import { COMPANY_SIZES, INDUSTRIES, SOURCES, STATUS_LABELS } from "../data/customers";
import type { CustomerFilters, CustomerStatus } from "../types/customer";
import { hasActiveFilters } from "../utils/customer";
import { Icon } from "./Icon";

export function FilterBar({
  filters,
  resultCount,
  onChange,
  onClear,
}: {
  filters: CustomerFilters;
  resultCount: number;
  onChange: (patch: Partial<CustomerFilters>) => void;
  onClear: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const active = hasActiveFilters(filters);
  const statuses: CustomerStatus[] = ["intent", "won", "following", "pending", "lost"];
  return (
    <div className="filter-region">
      <div className="filter-toolbar">
        <label className="table-search">
          <Icon name="search" size={17} />
          <input
            value={filters.query}
            onChange={(event) => onChange({ query: event.target.value })}
            placeholder="搜索客户名称、联系人或电话..."
            aria-label="搜索客户名称、联系人、公司或电话"
          />
        </label>
        <label className="compact-select">
          <span className="sr-only">状态筛选</span>
          <select value={filters.status} onChange={(event) => onChange({ status: event.target.value as CustomerFilters["status"] })}>
            <option value="all">全部状态</option>
            {statuses.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}
          </select>
          <Icon name="chevronDown" size={14} />
        </label>
        <label className="compact-select">
          <span className="sr-only">行业筛选</span>
          <select value={filters.industry} onChange={(event) => onChange({ industry: event.target.value })}>
            <option value="all">全部行业</option>
            {INDUSTRIES.map((industry) => <option key={industry} value={industry}>{industry}</option>)}
          </select>
          <Icon name="chevronDown" size={14} />
        </label>
        <label className="compact-select">
          <span className="sr-only">来源筛选</span>
          <select value={filters.source} onChange={(event) => onChange({ source: event.target.value as CustomerFilters["source"] })}>
            <option value="all">全部来源</option>
            {SOURCES.map((source) => <option key={source} value={source}>{source}</option>)}
          </select>
          <Icon name="chevronDown" size={14} />
        </label>
        <button className={`filter-more-button${expanded ? " active" : ""}`} type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>
          <Icon name="filter" size={15} />
          更多筛选
        </button>
      </div>
      {expanded && (
        <div className="advanced-filters">
          <label>
            <span>公司规模</span>
            <select value={filters.companySize} onChange={(event) => onChange({ companySize: event.target.value as CustomerFilters["companySize"] })}>
              <option value="all">全部规模</option>
              {COMPANY_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
            </select>
          </label>
          <div className="advanced-filter-summary">当前匹配 <strong>{resultCount}</strong> 个客户</div>
          <button type="button" className="clear-filter-button" onClick={onClear} disabled={!active}>清除筛选</button>
        </div>
      )}
    </div>
  );
}

import { useMemo, useState, type ChangeEvent, type MouseEvent as ReactMouseEvent } from "react";
import type { CustomerRow, CustomerStatus, StatusFilter } from "../types/analytics";
import type { CustomerTableState } from "../hooks/useCustomerTable";
import { formatCurrency } from "../utils/format";
import { EmptyState } from "./EmptyState";
import { Icon } from "./Icon";

interface CustomerTableProps {
  state: CustomerTableState;
  emptyRange: boolean;
  onExport: () => void;
  onFeedback: (message: string) => void;
}

function levelClass(level: CustomerRow["level"]): string {
  if (level === "黄金客户") return "gold";
  if (level === "重要客户") return "important";
  return "normal";
}

function statusClass(status: CustomerStatus): string {
  return status === "活跃" ? "online" : "sleep";
}

function pageWindow(page: number, pageCount: number): number[] {
  const count = Math.min(5, pageCount);
  if (pageCount <= 5) return Array.from({ length: count }, (_, index) => index + 1);
  const start = Math.max(1, Math.min(page - 2, pageCount - 4));
  return Array.from({ length: count }, (_, index) => start + index);
}

export function CustomerTable({ state, emptyRange, onExport, onFeedback }: CustomerTableProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [detail, setDetail] = useState<CustomerRow | null>(null);
  const pageNumbers = useMemo(() => pageWindow(state.page, state.pageCount), [state.page, state.pageCount]);
  const allPageSelected = state.pageRows.length > 0 && state.pageRows.every((row) => state.selectedIds.has(row.id));

  const copySummary = async () => {
    const summary = `客户明细：当前筛选 ${state.filteredRows.length} 条，活跃 ${state.filteredRows.filter((row) => row.status === "活跃").length} 条，沉睡 ${state.filteredRows.filter((row) => row.status === "沉睡").length} 条。`;
    try {
      await navigator.clipboard.writeText(summary);
      onFeedback("当前筛选摘要已复制到剪贴板。");
    } catch {
      onFeedback(summary);
    }
    setMoreOpen(false);
  };

  return <section className="panel table-panel">
    <div className="table-heading">
      <div className="table-title-group"><h2>客户数据明细</h2>{state.selectedIds.size > 0 ? <span className="selection-count">已选择 {state.selectedIds.size} 条</span> : null}</div>
      <div className="table-actions">
        <label className="table-search"><Icon name="search" size={16} /><input value={state.filters.query} onChange={(event: ChangeEvent<HTMLInputElement>) => state.setQuery(event.target.value)} placeholder="搜索客户名称、联系人或行业..." aria-label="搜索客户名称、联系人或行业" />{state.filters.query ? <button type="button" className="search-clear" onClick={() => state.setQuery("")} aria-label="清空搜索"><Icon name="close" size={13} /></button> : null}</label>
        <div className="popover-anchor">
          <button className={`action ${state.hasFilters ? "active" : ""}`} type="button" aria-expanded={filterOpen} onClick={() => { setFilterOpen((value) => !value); setMoreOpen(false); }}><Icon name="filter" size={14} />筛选{state.hasFilters ? <em /> : null}</button>
          {filterOpen ? <FilterPopover status={state.filters.status} industry={state.filters.industry} industries={state.industries} hasFilters={state.hasFilters} onStatus={state.setStatus} onIndustry={state.setIndustry} onClear={() => { state.clearFilters(); onFeedback("筛选条件已清除。") }} onClose={() => setFilterOpen(false)} /> : null}
        </div>
        <button className="action" type="button" onClick={onExport}><Icon name="download" size={14} />导出</button>
        <div className="popover-anchor">
          <button className="action more-action" type="button" aria-label="更多表格操作" aria-expanded={moreOpen} onClick={() => { setMoreOpen((value) => !value); setFilterOpen(false); }}><Icon name="more" size={16} /></button>
          {moreOpen ? <div className="menu-popover table-more-menu"><button type="button" onClick={copySummary}><Icon name="copy" size={14} />复制当前摘要</button><button type="button" onClick={() => { state.clearFilters(); state.setPage(1); setMoreOpen(false); onFeedback("表格已恢复默认视图。") }}><Icon name="refresh" size={14} />恢复默认视图</button></div> : null}
        </div>
      </div>
    </div>

    <div className="table-scroll">
      <table>
        <thead><tr>
          <th className="check-cell"><input type="checkbox" aria-label="选择当前页" checked={allPageSelected} onChange={state.togglePageSelection} /></th>
          <th>客户名称</th><th>行业</th><th>客户等级</th>
          <th><button className="sort-button" type="button" onClick={() => state.toggleSort("amount")}>成交金额（元）<span>{state.sortKey === "amount" ? (state.sortDirection === "desc" ? "↓" : "↑") : "↕"}</span></button></th>
          <th><button className="sort-button" type="button" onClick={() => state.toggleSort("created")}>创建时间<span>{state.sortKey === "created" ? (state.sortDirection === "desc" ? "↓" : "↑") : "↕"}</span></button></th>
          <th>最近活跃</th><th>状态</th><th>操作</th>
        </tr></thead>
        <tbody>
          {state.pageRows.map((row) => <tr key={row.id}>
            <td className="check-cell"><input type="checkbox" checked={state.selectedIds.has(row.id)} onChange={() => state.toggleSelected(row.id)} aria-label={`选择${row.company}`} /></td>
            <td><span className={`company-logo logo-${row.id.charCodeAt(row.id.length - 1) % 5}`}>{row.company.slice(0, 1)}</span>{row.company}</td>
            <td>{row.industry}</td>
            <td><span className={`level ${levelClass(row.level)}`}>{row.level}</span></td>
            <td>{formatCurrency(row.amount)}</td><td>{row.created}</td><td>{row.active}</td>
            <td><span className={`status ${statusClass(row.status)}`}>{row.status}</span></td>
            <td><div className="row-actions"><button className="view-button" type="button" onClick={() => setDetail(row)}>查看</button><button className="row-more" type="button" aria-label={`查看${row.company}更多信息`} onClick={() => { setDetail(row); onFeedback(`已打开${row.company}客户详情。`) }}><Icon name="more" size={15} /></button></div></td>
          </tr>)}
          {state.pageRows.length === 0 ? <tr><td className="empty-cell" colSpan={9}><EmptyState compact title={emptyRange ? "当前日期范围暂无客户数据" : "没有找到匹配的客户"} description={emptyRange ? "切换到 7 天、30 天或 90 天范围查看合成演示数据。" : "请调整关键词、状态或行业筛选条件。"} actionLabel={!emptyRange && state.hasFilters ? "清除筛选" : undefined} onAction={!emptyRange && state.hasFilters ? state.clearFilters : undefined} /></td></tr> : null}
        </tbody>
      </table>
    </div>
    <div className="table-footer">
      <span>{emptyRange ? "共 0 条记录" : state.hasFilters ? `筛选 ${state.filteredRows.length} / ${state.rangeRows.length} 条记录` : `共 ${state.rangeRows.length} 条记录`}</span>
      <div className="pagination">
        <button className="page-arrow" type="button" disabled={state.page <= 1} onClick={() => state.setPage(Math.max(1, state.page - 1))} aria-label="上一页"><Icon name="arrowLeft" size={15} /></button>
        {pageNumbers.map((number) => <button className={number === state.page ? "active" : ""} type="button" key={number} onClick={() => state.setPage(number)}>{number}</button>)}
        <button className="page-arrow" type="button" disabled={state.page >= state.pageCount} onClick={() => state.setPage(Math.min(state.pageCount, state.page + 1))} aria-label="下一页"><Icon name="arrowRight" size={15} /></button>
        <label className="page-size"><select value={state.pageSize} onChange={(event: ChangeEvent<HTMLSelectElement>) => state.setPageSize(Number(event.target.value))}><option value={10}>10 条/页</option><option value={20}>20 条/页</option><option value={50}>50 条/页</option></select><Icon name="chevronDown" size={13} /></label>
      </div>
    </div>
    {detail ? <CustomerDetailDrawer row={detail} onClose={() => setDetail(null)} /> : null}
  </section>;
}

function FilterPopover({ status, industry, industries, hasFilters, onStatus, onIndustry, onClear, onClose }: {
  status: StatusFilter;
  industry: string;
  industries: readonly string[];
  hasFilters: boolean;
  onStatus: (status: StatusFilter) => void;
  onIndustry: (industry: string) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  return <div className="filter-popover">
    <div className="filter-popover-head"><strong>筛选客户</strong><button type="button" onClick={onClose} aria-label="关闭筛选"><Icon name="close" size={15} /></button></div>
    <label><span>客户状态</span><select value={status} onChange={(event: ChangeEvent<HTMLSelectElement>) => onStatus(event.target.value as StatusFilter)}><option value="all">全部状态</option><option value="活跃">活跃</option><option value="沉睡">沉睡</option></select></label>
    <label><span>行业</span><select value={industry} onChange={(event: ChangeEvent<HTMLSelectElement>) => onIndustry(event.target.value)}><option value="all">全部行业</option>{industries.map((item) => <option value={item} key={item}>{item}</option>)}</select></label>
    <div className="filter-popover-footer"><button type="button" className="clear-filter" disabled={!hasFilters} onClick={onClear}>清除筛选</button><button type="button" className="apply-filter" onClick={onClose}>完成</button></div>
  </div>;
}

function CustomerDetailDrawer({ row, onClose }: { row: CustomerRow; onClose: () => void }) {
  return <div className="drawer-layer" role="dialog" aria-modal="true" aria-label={`${row.company}客户详情`} onMouseDown={(event: ReactMouseEvent<HTMLDivElement>) => { if (event.currentTarget === event.target) onClose(); }}>
    <aside className="customer-drawer"><div className="drawer-head"><div><span>客户详情</span><h3>{row.company}</h3></div><button type="button" onClick={onClose} aria-label="关闭客户详情"><Icon name="close" size={18} /></button></div>
      <div className="drawer-body"><div className="drawer-summary"><span className="drawer-logo">{row.company.slice(0, 1)}</span><div><strong>{row.company}</strong><span>{row.contact} · {row.industry}</span></div></div>
        <dl><div><dt>客户等级</dt><dd>{row.level}</dd></div><div><dt>成交金额</dt><dd>{formatCurrency(row.amount)}</dd></div><div><dt>创建时间</dt><dd>{row.created}</dd></div><div><dt>最近活跃</dt><dd>{row.active}</dd></div><div><dt>状态</dt><dd><span className={`status ${statusClass(row.status)}`}>{row.status}</span></dd></div></dl>
        <div className="drawer-note"><strong>跟进备注</strong><p>{row.note}</p></div>
      </div><div className="drawer-footer"><button type="button" onClick={onClose}>关闭</button></div>
    </aside>
  </div>;
}

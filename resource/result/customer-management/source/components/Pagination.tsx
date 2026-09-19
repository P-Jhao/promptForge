import { Icon } from "./Icon";

function pageItems(page: number, pageCount: number): Array<number | "ellipsis"> {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, index) => index + 1);
  const items: Array<number | "ellipsis"> = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pageCount - 1, page + 1);
  if (start > 2) items.push("ellipsis");
  for (let value = start; value <= end; value += 1) items.push(value);
  if (end < pageCount - 1) items.push("ellipsis");
  items.push(pageCount);
  return items;
}

export function Pagination({
  total,
  page,
  pageCount,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: {
  total: number;
  page: number;
  pageCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  const items = pageItems(page, pageCount);
  return (
    <div className="table-footer">
      <span>共 {total} 条记录</span>
      <div className="pagination-controls">
        <button type="button" onClick={() => onPageChange(page - 1)} disabled={page <= 1} aria-label="上一页"><Icon name="chevronLeft" size={14} /></button>
        {items.map((item, index) => item === "ellipsis" ? (
          <span className="page-ellipsis" key={`ellipsis-${index}`}>…</span>
        ) : (
          <button type="button" key={item} className={item === page ? "active" : ""} onClick={() => onPageChange(item)} aria-current={item === page ? "page" : undefined}>{item}</button>
        ))}
        <button type="button" onClick={() => onPageChange(page + 1)} disabled={page >= pageCount} aria-label="下一页"><Icon name="chevronRight" size={14} /></button>
        <label className="page-size-select">
          <select value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))} aria-label="每页显示数量">
            <option value={10}>10 条/页</option>
            <option value={20}>20 条/页</option>
            <option value={50}>50 条/页</option>
          </select>
          <Icon name="chevronDown" size={13} />
        </label>
      </div>
    </div>
  );
}

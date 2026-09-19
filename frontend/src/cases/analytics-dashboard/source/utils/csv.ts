import type { CustomerRow } from "../types/analytics";
import { formatCurrency } from "./format";

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export function customersToCsv(rows: readonly CustomerRow[]): string {
  const header = ["客户名称", "联系人", "行业", "客户等级", "成交金额（元）", "创建时间", "最近活跃", "状态"];
  const lines = rows.map((row) => [
    row.company,
    row.contact,
    row.industry,
    row.level,
    formatCurrency(row.amount),
    row.created,
    row.active,
    row.status,
  ].map(csvCell).join(","));
  return [header.map(csvCell).join(","), ...lines].join("\r\n");
}

export function downloadTextFile(filename: string, content: string, mime = "text/csv;charset=utf-8"): void {
  const blob = new Blob(["\uFEFF", content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

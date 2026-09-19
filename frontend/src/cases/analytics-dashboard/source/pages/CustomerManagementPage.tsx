import { useMemo, useState, type ChangeEvent } from "react";
import { Icon } from "../components/Icon";
import { SuitePageHeading } from "../components/SuitePageHeading";
import { customers } from "../data/demoData";
import type { CustomerRow, CustomerStatus } from "../types/analytics";
import { formatCurrency } from "../utils/format";

const statusOptions: Array<{ value: "all" | CustomerStatus; label: string }> = [
  { value: "all", label: "全部状态" }, { value: "活跃", label: "活跃" }, { value: "沉睡", label: "沉睡" },
];

export function CustomerManagementPage({ onFeedback }: { onFeedback: (message: string) => void }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | CustomerStatus>("all");
  const [page, setPage] = useState(1);
  const [extraRows, setExtraRows] = useState<CustomerRow[]>([]);
  const rows = useMemo(() => [...extraRows, ...customers.slice(0, 28)], [extraRows]);
  const filtered = useMemo(() => rows.filter((row) => {
    const keyword = query.trim().toLowerCase();
    const matchesQuery = !keyword || `${row.company} ${row.contact} ${row.industry}`.toLowerCase().includes(keyword);
    return matchesQuery && (status === "all" || row.status === status);
  }), [query, rows, status]);
  const pageSize = 8;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const activeCount = rows.filter((row) => row.status === "活跃").length;
  const totalAmount = rows.reduce((sum, row) => sum + row.amount, 0);

  const addCustomer = () => {
    const index = extraRows.length + 1;
    const row: CustomerRow = { id: `manual-${index}`, company: `新建演示客户 ${String(index).padStart(2, "0")}`, contact: "新联系人", industry: "科技服务", level: "普通客户", amount: 8800 + index * 1200, created: "2024-04-22", active: "2024-04-22", status: "活跃", note: "由客户管理页本地新增的演示客户。" };
    setExtraRows((current) => [row, ...current]);
    setPage(1);
    onFeedback(`已在本地新增“${row.company}”。`);
  };

  return <>
    <SuitePageHeading title="客户管理" subtitle="集中维护客户档案、状态与跟进信息，快速定位需要重点关注的客户。" actions={<button className="primary-action suite-primary" type="button" onClick={addCustomer}><Icon name="users" size={14} />新建客户</button>} />
    <section className="suite-stat-grid">
      <article className="suite-stat-card"><span>客户总数</span><strong>{rows.length}</strong><small>当前本地演示数据</small></article>
      <article className="suite-stat-card"><span>活跃客户</span><strong>{activeCount}</strong><small>{Math.round(activeCount / Math.max(1, rows.length) * 100)}% 活跃占比</small></article>
      <article className="suite-stat-card"><span>沉睡客户</span><strong>{rows.length - activeCount}</strong><small>建议安排唤醒跟进</small></article>
      <article className="suite-stat-card"><span>成交金额</span><strong>{formatCurrency(totalAmount)}</strong><small>当前列表累计</small></article>
    </section>
    <section className="panel suite-panel">
      <div className="suite-toolbar">
        <label className="suite-search"><Icon name="search" size={16} /><input value={query} onChange={(event: ChangeEvent<HTMLInputElement>) => { setQuery(event.target.value); setPage(1); }} placeholder="搜索客户名称、联系人或行业" /></label>
        <label className="suite-select"><select value={status} onChange={(event: ChangeEvent<HTMLSelectElement>) => { setStatus(event.target.value as "all" | CustomerStatus); setPage(1); }}>{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><Icon name="chevronDown" size={13} /></label>
        {(query || status !== "all") ? <button className="action" type="button" onClick={() => { setQuery(""); setStatus("all"); setPage(1); onFeedback("客户筛选条件已清除。"); }}>清除筛选</button> : null}
      </div>
      <div className="suite-table-wrap"><table className="suite-table"><thead><tr><th>客户名称</th><th>联系人</th><th>行业</th><th>客户等级</th><th>成交金额</th><th>最近活跃</th><th>状态</th><th>操作</th></tr></thead><tbody>{pageRows.map((row) => <tr key={row.id}><td><strong className="table-primary">{row.company}</strong></td><td>{row.contact}</td><td>{row.industry}</td><td>{row.level}</td><td>{formatCurrency(row.amount)}</td><td>{row.active}</td><td><span className={`status ${row.status === "活跃" ? "online" : "sleep"}`}>{row.status}</span></td><td><button className="view-button" type="button" onClick={() => onFeedback(`${row.company}：${row.note}`)}>查看</button></td></tr>)}{pageRows.length === 0 ? <tr><td colSpan={8}><div className="suite-empty"><Icon name="inbox" size={24} /><strong>没有匹配的客户</strong><span>调整关键词或状态筛选后重试。</span></div></td></tr> : null}</tbody></table></div>
      <div className="suite-pagination"><span>共 {filtered.length} 条</span><div><button type="button" disabled={safePage <= 1} onClick={() => setPage(Math.max(1, safePage - 1))}><Icon name="arrowLeft" size={14} /></button><strong>{safePage} / {pageCount}</strong><button type="button" disabled={safePage >= pageCount} onClick={() => setPage(Math.min(pageCount, safePage + 1))}><Icon name="arrowRight" size={14} /></button></div></div>
    </section>
  </>;
}

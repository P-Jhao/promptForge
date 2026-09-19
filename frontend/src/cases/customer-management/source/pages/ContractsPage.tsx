import { useMemo, useState } from "react";
import type { ContractRecord, ContractStatus } from "../types/workspace";
import { ModuleEmptyState, ModuleMetrics, ModulePageHeader, StatusPill, formatCurrency } from "../components/ModuleCommon";

const statuses: ContractStatus[] = ["草稿", "审批中", "履行中", "已完成"];

export function ContractsPage({ items, query, onAdd, onFeedback }: { items: ContractRecord[]; query: string; onAdd: () => void; onFeedback: (message: string) => void }) {
  const [status, setStatus] = useState<ContractStatus | "all">("all");
  const filtered = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase();
    return items.filter((item) => {
      if (status !== "all" && item.status !== status) return false;
      if (keyword.length === 0) return true;
      return [item.number, item.customer, item.owner, item.status].join(" ").toLocaleLowerCase().includes(keyword);
    });
  }, [items, query, status]);
  const activeValue = items.filter((item) => item.status === "审批中" || item.status === "履行中").reduce((sum, item) => sum + item.amount, 0);
  const add = () => { onAdd(); onFeedback("已新增一份演示合同草稿"); };

  return <div className="crm-content">
    <ModulePageHeader title="合同管理" subtitle="跟踪合同审批、履行周期和签约金额。" actionLabel="新建合同" onAction={add} />
    <ModuleMetrics metrics={[
      { label: "合同总数", value: String(items.length), hint: "全部演示合同", icon: "file" },
      { label: "执行中金额", value: formatCurrency(activeValue), hint: "审批中 + 履行中", icon: "chart", tone: "success" },
      { label: "审批中", value: String(items.filter((item) => item.status === "审批中").length), hint: "等待内部确认", icon: "clock", tone: "warning" },
      { label: "履行中", value: String(items.filter((item) => item.status === "履行中").length), hint: "当前有效合同", icon: "check", tone: "primary" },
    ]} />
    <section className="module-panel module-table-card"><div className="module-table-toolbar"><div><strong>合同列表</strong><span>共 {filtered.length} 条结果</span></div><label>状态<select value={status} onChange={(event) => setStatus(event.target.value as ContractStatus | "all")}><option value="all">全部状态</option>{statuses.map((value) => <option key={value} value={value}>{value}</option>)}</select></label></div>
      {filtered.length === 0 ? <ModuleEmptyState title="没有匹配的合同" description="尝试更换关键词或合同状态。" /> : <div className="module-table-scroll"><table className="module-table"><thead><tr><th>合同编号</th><th>客户</th><th>金额</th><th>状态</th><th>合同周期</th><th>负责人</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}><td><strong>{item.number}</strong></td><td>{item.customer}</td><td>{formatCurrency(item.amount)}</td><td><StatusPill tone={item.status === "已完成" ? "success" : item.status === "审批中" ? "warning" : item.status === "履行中" ? "primary" : "neutral"}>{item.status}</StatusPill></td><td>{item.startDate} — {item.endDate}</td><td>{item.owner}</td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}

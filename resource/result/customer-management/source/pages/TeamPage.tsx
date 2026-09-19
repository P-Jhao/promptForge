import { useMemo, useState } from "react";
import type { TeamMember } from "../types/workspace";
import { ModuleEmptyState, ModuleMetrics, ModulePageHeader, StatusPill } from "../components/ModuleCommon";

export function TeamPage({ items, query, onInvite, onFeedback }: { items: TeamMember[]; query: string; onInvite: () => void; onFeedback: (message: string) => void }) {
  const [department, setDepartment] = useState("all");
  const departments = Array.from(new Set(items.map((item) => item.department)));
  const filtered = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase();
    return items.filter((item) => {
      if (department !== "all" && item.department !== department) return false;
      if (keyword.length === 0) return true;
      return [item.name, item.role, item.department, item.email].join(" ").toLocaleLowerCase().includes(keyword);
    });
  }, [department, items, query]);
  const invite = () => { onInvite(); onFeedback("已添加一名待加入的演示成员"); };

  return <div className="crm-content">
    <ModulePageHeader title="团队协作" subtitle="查看成员分工、在线状态和客户负责数量。" actionLabel="邀请成员" onAction={invite} />
    <ModuleMetrics metrics={[
      { label: "团队成员", value: String(items.length), hint: "当前演示成员", icon: "team" },
      { label: "在线 / 忙碌", value: String(items.filter((item) => item.status === "在线" || item.status === "忙碌").length), hint: "当前可协作成员", icon: "check", tone: "success" },
      { label: "负责客户", value: String(items.reduce((sum, item) => sum + item.customerCount, 0)), hint: "团队客户覆盖", icon: "users", tone: "primary" },
      { label: "待加入", value: String(items.filter((item) => item.status === "待加入").length), hint: "等待接受邀请", icon: "clock", tone: "warning" },
    ]} />
    <section className="module-panel module-table-card"><div className="module-table-toolbar"><div><strong>成员列表</strong><span>共 {filtered.length} 条结果</span></div><label>团队<select value={department} onChange={(event) => setDepartment(event.target.value)}><option value="all">全部团队</option>{departments.map((value) => <option key={value} value={value}>{value}</option>)}</select></label></div>
      {filtered.length === 0 ? <ModuleEmptyState title="没有匹配的成员" description="尝试更换关键词或团队筛选。" /> : <div className="team-card-grid">{filtered.map((item) => <article key={item.id}><span className="team-avatar">{item.name.slice(-1)}</span><div><strong>{item.name}</strong><small>{item.role} · {item.department}</small><p>{item.email}</p></div><div className="team-card-meta"><StatusPill tone={item.status === "在线" ? "success" : item.status === "忙碌" ? "warning" : item.status === "待加入" ? "primary" : "neutral"}>{item.status}</StatusPill><span>{item.customerCount} 个客户</span></div></article>)}</div>}
    </section>
  </div>;
}

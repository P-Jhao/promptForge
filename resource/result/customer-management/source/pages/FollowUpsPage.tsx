import { useMemo, useState } from "react";
import type { FollowUpStatus, FollowUpTask } from "../types/workspace";
import { ModuleEmptyState, ModuleMetrics, ModulePageHeader, StatusPill } from "../components/ModuleCommon";

export function FollowUpsPage({ items, query, onAdd, onToggle, onFeedback }: { items: FollowUpTask[]; query: string; onAdd: () => void; onToggle: (id: string) => void; onFeedback: (message: string) => void }) {
  const [status, setStatus] = useState<FollowUpStatus | "all">("all");
  const filtered = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase();
    return items.filter((item) => {
      if (status !== "all" && item.status !== status) return false;
      if (keyword.length === 0) return true;
      return [item.customer, item.contact, item.owner, item.summary, item.type].join(" ").toLocaleLowerCase().includes(keyword);
    });
  }, [items, query, status]);
  const add = () => { onAdd(); onFeedback("已新增一条演示跟进任务"); };
  const toggle = (item: FollowUpTask) => { onToggle(item.id); onFeedback(item.status === "已完成" ? "已恢复为待处理" : "跟进任务已完成"); };

  return (
    <div className="crm-content">
      <ModulePageHeader title="跟进记录" subtitle="查看沟通计划、完成状态和客户跟进摘要。" actionLabel="添加跟进" onAction={add} />
      <ModuleMetrics metrics={[
        { label: "全部跟进", value: String(items.length), hint: "当前演示记录", icon: "clock" },
        { label: "待处理", value: String(items.filter((item) => item.status === "待处理").length), hint: "需要继续推进", icon: "calendar", tone: "warning" },
        { label: "已完成", value: String(items.filter((item) => item.status === "已完成").length), hint: "已记录完成结果", icon: "check", tone: "success" },
        { label: "会议 / 演示", value: String(items.filter((item) => item.type === "会议" || item.type === "演示").length), hint: "高触达沟通", icon: "team", tone: "primary" },
      ]} />
      <section className="module-panel module-table-card">
        <div className="module-table-toolbar"><div><strong>跟进计划</strong><span>共 {filtered.length} 条结果</span></div><label>状态<select value={status} onChange={(event) => setStatus(event.target.value as FollowUpStatus | "all")}><option value="all">全部状态</option><option value="待处理">待处理</option><option value="已完成">已完成</option></select></label></div>
        {filtered.length === 0 ? <ModuleEmptyState title="没有匹配的跟进记录" description="尝试更换搜索关键词或状态筛选。" /> : <div className="followup-card-list">
          {filtered.map((item) => <article key={item.id} className={item.status === "已完成" ? "is-done" : ""}><div className="followup-date"><strong>{item.date.slice(8)}</strong><span>{item.date.slice(5, 7)}月</span></div><div className="followup-main"><div><strong>{item.customer}</strong><StatusPill tone={item.status === "已完成" ? "success" : "warning"}>{item.status}</StatusPill></div><p>{item.summary}</p><small>{item.type} · 联系人 {item.contact} · 负责人 {item.owner}</small></div><button type="button" onClick={() => toggle(item)}>{item.status === "已完成" ? "恢复" : "完成"}</button></article>)}
        </div>}
      </section>
    </div>
  );
}

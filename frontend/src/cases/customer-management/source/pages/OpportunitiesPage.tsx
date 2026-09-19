import { useMemo, useState } from "react";
import type { OpportunityRecord, OpportunityStage } from "../types/workspace";
import { ModuleEmptyState, ModuleMetrics, ModulePageHeader, StatusPill, formatCurrency } from "../components/ModuleCommon";

const stages: OpportunityStage[] = ["需求确认", "方案沟通", "商务谈判", "已赢单"];

export function OpportunitiesPage({ items, query, onAdd, onFeedback }: { items: OpportunityRecord[]; query: string; onAdd: () => void; onFeedback: (message: string) => void }) {
  const [stage, setStage] = useState<OpportunityStage | "all">("all");
  const filtered = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase();
    return items.filter((item) => {
      if (stage !== "all" && item.stage !== stage) return false;
      if (keyword.length === 0) return true;
      return [item.title, item.customer, item.owner, item.stage].join(" ").toLocaleLowerCase().includes(keyword);
    });
  }, [items, query, stage]);
  const pipelineValue = items.filter((item) => item.stage !== "已赢单").reduce((sum, item) => sum + item.amount, 0);
  const wonValue = items.filter((item) => item.stage === "已赢单").reduce((sum, item) => sum + item.amount, 0);

  const add = () => { onAdd(); onFeedback("已新增一条演示销售机会"); };

  return (
    <div className="crm-content">
      <ModulePageHeader title="销售机会" subtitle="集中管理销售阶段、预计成交时间和商机金额。" actionLabel="新建商机" onAction={add} />
      <ModuleMetrics metrics={[
        { label: "销售机会", value: String(items.length), hint: "全部演示商机", icon: "opportunity" },
        { label: "进行中金额", value: formatCurrency(pipelineValue), hint: "不含已赢单", icon: "chart", tone: "warning" },
        { label: "已赢单金额", value: formatCurrency(wonValue), hint: `${items.filter((item) => item.stage === "已赢单").length} 条已赢单`, icon: "check", tone: "success" },
        { label: "商务谈判", value: String(items.filter((item) => item.stage === "商务谈判").length), hint: "重点推进阶段", icon: "clock", tone: "primary" },
      ]} />
      <section className="module-panel module-table-card">
        <div className="module-table-toolbar">
          <div><strong>商机列表</strong><span>共 {filtered.length} 条结果</span></div>
          <label>阶段<select value={stage} onChange={(event) => setStage(event.target.value as OpportunityStage | "all")}><option value="all">全部阶段</option>{stages.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
        </div>
        {filtered.length === 0 ? <ModuleEmptyState title="没有匹配的销售机会" description="尝试更换搜索关键词或阶段筛选。" /> : (
          <div className="module-table-scroll"><table className="module-table"><thead><tr><th>商机名称</th><th>客户</th><th>负责人</th><th>阶段</th><th>金额</th><th>预计成交</th><th>最近更新</th></tr></thead><tbody>
            {filtered.map((item) => <tr key={item.id}><td><strong>{item.title}</strong></td><td>{item.customer}</td><td>{item.owner}</td><td><StatusPill tone={item.stage === "已赢单" ? "success" : item.stage === "商务谈判" ? "warning" : "primary"}>{item.stage}</StatusPill></td><td>{formatCurrency(item.amount)}</td><td>{item.expectedClose}</td><td>{item.lastUpdate}</td></tr>)}
          </tbody></table></div>
        )}
      </section>
    </div>
  );
}

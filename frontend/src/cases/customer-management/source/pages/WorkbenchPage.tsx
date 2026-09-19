import type { Customer, CustomerStats } from "../types/customer";
import type { ContractRecord, FollowUpTask, OpportunityRecord } from "../types/workspace";
import { Icon } from "../components/Icon";
import { ModuleMetrics, ModulePageHeader, StatusPill, formatCurrency } from "../components/ModuleCommon";

export function WorkbenchPage({
  stats,
  customers,
  opportunities,
  followUps,
  contracts,
  onCreateCustomer,
  onNavigateCustomers,
}: {
  stats: CustomerStats;
  customers: Customer[];
  opportunities: OpportunityRecord[];
  followUps: FollowUpTask[];
  contracts: ContractRecord[];
  onCreateCustomer: () => void;
  onNavigateCustomers: () => void;
}) {
  const activeOpportunityValue = opportunities.filter((item) => item.stage !== "已赢单").reduce((sum, item) => sum + item.amount, 0);
  const pendingFollowUps = followUps.filter((item) => item.status === "待处理").length;
  const activeContracts = contracts.filter((item) => item.status === "审批中" || item.status === "履行中").length;
  const recentCustomers = customers.slice(0, 5);

  return (
    <div className="crm-content">
      <ModulePageHeader
        title="工作台"
        subtitle="快速查看客户、销售机会、待办跟进和合同进展。"
        actionLabel="新增客户"
        onAction={onCreateCustomer}
      />
      <ModuleMetrics metrics={[
        { label: "客户总数", value: String(stats.total), hint: `${stats.potential} 个潜在客户`, icon: "users" },
        { label: "活跃商机金额", value: formatCurrency(activeOpportunityValue), hint: `${opportunities.length} 条销售机会`, icon: "opportunity", tone: "success" },
        { label: "待处理跟进", value: String(pendingFollowUps), hint: "按计划持续推进", icon: "clock", tone: "warning" },
        { label: "执行中合同", value: String(activeContracts), hint: "含审批中与履行中", icon: "file", tone: "primary" },
      ]} />

      <section className="workbench-grid">
        <article className="module-panel workbench-panel-large">
          <div className="module-panel-heading">
            <div><strong>销售漏斗</strong><span>基于当前演示商机</span></div>
            <button type="button" onClick={onNavigateCustomers}>查看客户</button>
          </div>
          <div className="funnel-list">
            {(["需求确认", "方案沟通", "商务谈判", "已赢单"] as const).map((stage, index) => {
              const items = opportunities.filter((item) => item.stage === stage);
              const amount = items.reduce((sum, item) => sum + item.amount, 0);
              const width = Math.max(28, 100 - index * 18);
              return (
                <div className="funnel-row" key={stage}>
                  <span>{stage}<small>{items.length} 条</small></span>
                  <div className="funnel-track"><i style={{ width: `${width}%` }} /></div>
                  <strong>{formatCurrency(amount)}</strong>
                </div>
              );
            })}
          </div>
        </article>

        <article className="module-panel">
          <div className="module-panel-heading"><div><strong>今日待办</strong><span>需要优先跟进的事项</span></div></div>
          <div className="workbench-task-list">
            {followUps.filter((item) => item.status === "待处理").slice(0, 4).map((item) => (
              <div key={item.id}>
                <span className="task-icon"><Icon name="clock" size={16} /></span>
                <span><strong>{item.customer}</strong><small>{item.summary}</small></span>
                <time>{item.date.slice(5)}</time>
              </div>
            ))}
          </div>
        </article>

        <article className="module-panel workbench-panel-wide">
          <div className="module-panel-heading"><div><strong>最近客户动态</strong><span>来自客户列表的最新记录</span></div><button type="button" onClick={onNavigateCustomers}>进入客户管理</button></div>
          <div className="recent-customer-grid">
            {recentCustomers.map((customer) => (
              <div key={customer.id}>
                <span className="recent-customer-avatar">{customer.company.slice(0, 1)}</span>
                <span><strong>{customer.company}</strong><small>{customer.name} · {customer.industry}</small></span>
                <StatusPill tone={customer.status === "won" ? "success" : customer.status === "lost" ? "danger" : "primary"}>
                  {customer.status === "intent" ? "意向客户" : customer.status === "won" ? "已成交" : customer.status === "following" ? "跟进中" : customer.status === "pending" ? "待跟进" : "已流失"}
                </StatusPill>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

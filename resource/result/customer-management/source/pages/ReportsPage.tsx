import { useMemo, useState } from "react";
import type { ContractRecord, OpportunityRecord } from "../types/workspace";
import type { CustomerStats } from "../types/customer";
import { ModuleMetrics, ModulePageHeader, formatCurrency } from "../components/ModuleCommon";

const periods = ["近7天", "近30天", "本季度"] as const;
type ReportPeriod = typeof periods[number];

const chartData: Record<ReportPeriod, { label: string; value: number; amount: number }[]> = {
  "近7天": [
    { label: "09/13", value: 42, amount: 8 }, { label: "09/14", value: 55, amount: 11 }, { label: "09/15", value: 48, amount: 10 }, { label: "09/16", value: 68, amount: 14 }, { label: "09/17", value: 62, amount: 13 }, { label: "09/18", value: 84, amount: 18 }, { label: "09/19", value: 74, amount: 16 },
  ],
  "近30天": [
    { label: "第1周", value: 46, amount: 35 }, { label: "第2周", value: 58, amount: 43 }, { label: "第3周", value: 72, amount: 51 }, { label: "第4周", value: 86, amount: 64 },
  ],
  "本季度": [
    { label: "7月", value: 54, amount: 108 }, { label: "8月", value: 71, amount: 142 }, { label: "9月", value: 88, amount: 176 },
  ],
};

export function ReportsPage({ stats, opportunities, contracts, onFeedback }: { stats: CustomerStats; opportunities: OpportunityRecord[]; contracts: ContractRecord[]; onFeedback: (message: string) => void }) {
  const [period, setPeriod] = useState<ReportPeriod>("近30天");
  const series = chartData[period];
  const contractValue = contracts.reduce((sum, item) => sum + item.amount, 0);
  const opportunityValue = opportunities.reduce((sum, item) => sum + item.amount, 0);
  const average = Math.round(opportunityValue / Math.max(1, opportunities.length));
  const conversion = stats.total === 0 ? 0 : Math.round((stats.won / stats.total) * 100);
  const rows = useMemo(() => series.map((item) => `${item.label},${item.amount},${item.value}%`).join("\n"), [series]);

  const exportCsv = () => {
    const content = `周期,新增线索,目标达成率\n${rows}`;
    const blob = new Blob(["\uFEFF", content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `crm-report-${period}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    onFeedback("报表 CSV 已生成");
  };

  return <div className="crm-content">
    <ModulePageHeader title="数据报表" subtitle="汇总客户转化、销售金额与增长趋势。" actionLabel="导出 CSV" actionIcon="external" onAction={exportCsv} />
    <ModuleMetrics metrics={[
      { label: "客户转化率", value: `${conversion}%`, hint: `${stats.won} 个已成交客户`, icon: "users", tone: "success" },
      { label: "商机总金额", value: formatCurrency(opportunityValue), hint: `${opportunities.length} 条销售机会`, icon: "opportunity" },
      { label: "平均商机金额", value: formatCurrency(average), hint: "基于当前演示商机", icon: "chart", tone: "warning" },
      { label: "合同总金额", value: formatCurrency(contractValue), hint: `${contracts.length} 份演示合同`, icon: "file", tone: "primary" },
    ]} />
    <section className="report-grid">
      <article className="module-panel report-chart-card"><div className="module-panel-heading"><div><strong>销售趋势</strong><span>目标达成率与新增线索变化</span></div><div className="period-switch">{periods.map((value) => <button key={value} className={period === value ? "active" : ""} type="button" onClick={() => setPeriod(value)}>{value}</button>)}</div></div><div className="report-chart">{series.map((item) => <div key={item.label}><span className="report-bar-track"><i style={{ height: `${item.value}%` }} /></span><small>{item.label}</small><b>{item.amount}</b></div>)}</div></article>
      <article className="module-panel"><div className="module-panel-heading"><div><strong>关键洞察</strong><span>根据当前演示数据自动汇总</span></div></div><div className="insight-list"><div><span>01</span><p><strong>高意向客户仍是主要增长来源</strong><small>当前潜在客户 {stats.potential} 个，可结合跟进计划继续推进。</small></p></div><div><span>02</span><p><strong>商务谈判阶段金额集中</strong><small>重点关注大额商机的预计成交时间和合同审批。</small></p></div><div><span>03</span><p><strong>已成交客户可继续扩展增购</strong><small>产品使用情况可与合同续签计划联动查看。</small></p></div></div></article>
    </section>
  </div>;
}

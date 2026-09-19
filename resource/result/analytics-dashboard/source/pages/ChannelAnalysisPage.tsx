import { ChannelChart } from "../components/ChannelChart";
import { EmptyState } from "../components/EmptyState";
import { InsightCards, type InsightCardItem } from "../components/InsightCards";
import type { RangeKey, RangeSnapshot } from "../types/analytics";
import { formatCurrency, formatNumber } from "../utils/format";
import { metricNumber } from "../utils/metrics";

export function ChannelAnalysisPage({ range, snapshot, onFeedback }: { range: RangeKey; snapshot: RangeSnapshot; onFeedback: (message: string) => void }) {
  const totalVisits = snapshot.channels.reduce((sum, channel) => sum + channel.value, 0);
  const revenue = metricNumber(snapshot, "revenue");
  const customers = snapshot.customerTotal;
  const strongest = snapshot.channels.reduce((best, channel) => channel.value > best.value ? channel : best, snapshot.channels[0] ?? { name: "—", value: 0, color: "#dfe6ef" });
  const cards: InsightCardItem[] = [
    { label: "渠道触达", value: totalVisits ? formatNumber(totalVisits) : "—", change: range === "empty" ? "—" : "+16.8%", note: "总触达量", icon: "link", tone: "blue" },
    { label: "渠道新增客户", value: customers ? formatNumber(customers) : "—", change: range === "empty" ? "—" : "+12.5%", note: "归因客户", icon: "users", tone: "green" },
    { label: "平均获客成本", value: range === "empty" ? "—" : "¥ 126", change: range === "empty" ? "—" : "-6.3%", note: "环比改善", icon: "money", tone: "violet" },
    { label: "最高贡献渠道", value: strongest.name, change: totalVisits ? `${Math.round(strongest.value / totalVisits * 100)}%` : "—", note: "触达占比", icon: "report", tone: "amber" },
  ];

  if (range === "empty") return <section className="panel dashboard-empty"><EmptyState title="当前范围暂无渠道数据" description="切换日期范围后，可查看渠道来源、转化效率与获客成本表现。" /></section>;

  const rows = snapshot.channels.map((channel, index) => {
    const share = totalVisits ? channel.value / totalVisits : 0;
    const conversion = Math.max(2.5, 8.8 - index * 1.05);
    const leads = Math.round(channel.value * conversion / 100);
    const channelRevenue = Math.round(revenue * share);
    const cac = leads ? Math.round((channelRevenue * (.09 + index * .012)) / leads) : 0;
    return { ...channel, share, conversion, leads, revenue: channelRevenue, cac };
  });

  return <>
    <InsightCards items={cards} />
    <section className="secondary-grid channel-analysis-grid">
      <article className="panel secondary-panel channel-large"><div className="panel-title"><div><h2>渠道来源分布</h2><p>点击柱状图或下拉菜单可突出渠道</p></div></div><ChannelChart data={snapshot.channels} onFeedback={onFeedback} /></article>
      <article className="panel secondary-panel"><div className="panel-title"><div><h2>渠道贡献占比</h2><p>按触达量计算</p></div></div><div className="channel-share-list">{rows.map((row) => <button type="button" key={row.name} onClick={() => onFeedback(`${row.name}贡献 ${Math.round(row.share * 100)}% 的渠道触达。`)}><i style={{ background: row.color }} /><span>{row.name}</span><strong>{Math.round(row.share * 100)}%</strong><em>{formatNumber(row.value)}</em></button>)}</div></article>
    </section>
    <section className="panel detail-panel"><div className="panel-title detail-panel-title"><div><h2>渠道效率明细</h2><p>触达、线索、转化率、获客成本与收入贡献</p></div></div><div className="secondary-table-scroll"><table className="secondary-table"><thead><tr><th>渠道</th><th>触达量</th><th>有效线索</th><th>转化率</th><th>平均获客成本</th><th>收入贡献</th><th>操作</th></tr></thead><tbody>{rows.map((row) => <tr key={row.name}><td><span className="channel-name"><i style={{ background: row.color }} />{row.name}</span></td><td>{formatNumber(row.value)}</td><td>{formatNumber(row.leads)}</td><td>{row.conversion.toFixed(1)}%</td><td>{formatCurrency(row.cac)}</td><td>{formatCurrency(row.revenue)}</td><td><button type="button" className="view-button" onClick={() => onFeedback(`已查看${row.name}渠道归因明细。`)}>归因明细</button></td></tr>)}</tbody></table></div></section>
  </>;
}

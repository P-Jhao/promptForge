import { useMemo, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { InsightCards, type InsightCardItem } from "../components/InsightCards";
import { TrendChart } from "../components/TrendChart";
import type { RangeKey, RangeSnapshot } from "../types/analytics";
import { formatNumber } from "../utils/format";
import { changeFor, metricNumber } from "../utils/metrics";

const products = [
  { name: "AI 工作台", share: .36, adoption: 82, conversion: 8.4, icon: "工作" },
  { name: "企业 API", share: .29, adoption: 74, conversion: 9.1, icon: "API" },
  { name: "团队知识库", share: .21, adoption: 63, conversion: 6.8, icon: "知" },
  { name: "自动化中心", share: .14, adoption: 48, conversion: 5.6, icon: "自" },
] as const;

export function ProductAnalysisPage({ range, snapshot, onFeedback }: { range: RangeKey; snapshot: RangeSnapshot; onFeedback: (message: string) => void }) {
  const [selected, setSelected] = useState(0);
  const apiCalls = metricNumber(snapshot, "apiCalls");
  const activeUsers = metricNumber(snapshot, "activeUsers");
  const totalCustomers = snapshot.customerTotal;
  const cards: InsightCardItem[] = [
    { label: "产品活跃用户", value: activeUsers ? formatNumber(activeUsers) : "—", change: changeFor(snapshot, "activeUsers"), note: "跨产品", icon: "user", tone: "blue" },
    { label: "API 调用量", value: apiCalls ? formatNumber(apiCalls) : "—", change: changeFor(snapshot, "apiCalls"), note: "调用总量", icon: "cube", tone: "violet" },
    { label: "功能渗透率", value: range === "empty" ? "—" : "68.4%", change: range === "empty" ? "—" : "+4.6%", note: "核心功能", icon: "bolt", tone: "green" },
    { label: "付费转化率", value: range === "empty" ? "—" : "7.3%", change: range === "empty" ? "—" : "+0.9%", note: "试用到付费", icon: "money", tone: "amber" },
  ];

  const productRows = useMemo(() => products.map((product, index) => ({
    ...product,
    users: Math.max(0, Math.round(activeUsers * product.share)),
    customers: Math.max(0, Math.round(totalCustomers * product.share)),
    calls: Math.max(0, Math.round(apiCalls * (product.share + index * .018))),
  })), [activeUsers, apiCalls, totalCustomers]);

  if (range === "empty") return <section className="panel dashboard-empty"><EmptyState title="当前范围暂无产品数据" description="切换日期范围后，可查看产品活跃、功能渗透、产品使用量和转化表现。" /></section>;

  const current = productRows[selected];
  const features = [
    { name: "提示词模板", use: 89, change: "+8.2%" }, { name: "批量任务", use: 76, change: "+5.7%" }, { name: "团队共享", use: 64, change: "+3.1%" }, { name: "版本历史", use: 52, change: "+1.8%" }, { name: "Webhook", use: 37, change: "+6.4%" },
  ];

  return <>
    <InsightCards items={cards} />
    <section className="product-cards" aria-label="产品表现">{productRows.map((product, index) => <button type="button" key={product.name} className={`product-card ${selected === index ? "active" : ""}`} onClick={() => setSelected(index)}><span className="product-card-icon">{product.icon}</span><div><span>{product.name}</span><strong>{formatNumber(product.users)} <small>活跃用户</small></strong><p>采用率 {product.adoption}% · 转化率 {product.conversion}%</p><i><b style={{ width: `${product.adoption}%` }} /></i></div></button>)}</section>
    <section className="secondary-grid product-grid"><article className="panel secondary-panel wide-panel"><div className="panel-title"><div><h2>{current.name} 使用趋势</h2><p>当前选择产品的使用规模趋势</p></div><span className="panel-chip">{formatNumber(current.calls)} 次使用</span></div><TrendChart key={`${range}-${selected}-product`} data={snapshot.trends.api} trendKey="api" /></article><article className="panel secondary-panel"><div className="panel-title"><div><h2>当前产品概览</h2><p>点击上方产品卡片切换</p></div></div><div className="product-focus"><span className="product-focus-icon">{current.icon}</span><strong>{current.name}</strong><p>{formatNumber(current.customers)} 家客户正在使用该产品，采用率 {current.adoption}%，试用到付费转化率 {current.conversion}%。</p><button type="button" onClick={() => onFeedback(`已打开${current.name}的功能使用明细。`)}>查看功能明细</button></div></article></section>
    <section className="panel detail-panel"><div className="panel-title detail-panel-title"><div><h2>功能使用排行</h2><p>{current.name} 的关键功能使用率</p></div></div><div className="feature-rows">{features.map((feature, index) => <button type="button" key={feature.name} onClick={() => onFeedback(`${feature.name}当前使用率 ${feature.use}%。`)}><span className="rank-number">{index + 1}</span><strong>{feature.name}</strong><i><b style={{ width: `${feature.use}%` }} /></i><span>{feature.use}%</span><em>{feature.change}</em></button>)}</div></section>
  </>;
}

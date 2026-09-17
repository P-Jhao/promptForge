import { useMemo, useState } from "react";
import type { ReactNode } from "react";

type RangeKey = "7" | "30" | "90" | "empty";
type MetricTone = "blue" | "violet" | "green" | "orange";

interface AnalyticsRow {
  date: string;
  visits: number;
  orders: number;
  revenue: number;
  categories: Record<string, number>;
}

interface CategoryRow {
  name: string;
  value: number;
}

const CATEGORIES = ["订阅", "咨询", "增值服务"];
const RANGE_OPTIONS: Array<{ value: RangeKey; label: string }> = [
  { value: "7", label: "近 7 天" },
  { value: "30", label: "近 30 天" },
  { value: "90", label: "近 90 天" },
  { value: "empty", label: "无数据演示" },
];
const FIXED_DATA: AnalyticsRow[] = Array.from({ length: 60 }, (_, index) => {
  const date = new Date(Date.UTC(2024, 5, 1 + index)).toISOString().slice(0, 10);
  return {
    date,
    visits: 420 + (index * 37) % 280,
    orders: 38 + (index * 11) % 42,
    revenue: 12800 + (index * 1730) % 9200,
    categories: {
      订阅: 18 + (index * 5) % 18,
      咨询: 9 + (index * 3) % 12,
      增值服务: 6 + (index * 2) % 9,
    },
  };
});

export default function App() {
  const [range, setRange] = useState<RangeKey>("30");
  const filtered = useMemo(() => range === "empty" ? [] : FIXED_DATA.slice(-Number(range)), [range]);
  const metrics = useMemo(() => filtered.reduce((total, row) => ({
    visits: total.visits + row.visits,
    orders: total.orders + row.orders,
    revenue: total.revenue + row.revenue,
  }), { visits: 0, orders: 0, revenue: 0 }), [filtered]);
  const categories = useMemo<CategoryRow[]>(() => CATEGORIES.map((name) => ({
    name,
    value: filtered.reduce((total, row) => total + row.categories[name], 0),
  })), [filtered]);
  const conversion = metrics.visits === 0 ? 0 : (metrics.orders / metrics.visits) * 100;
  const averageOrder = metrics.orders === 0 ? 0 : metrics.revenue / metrics.orders;
  const activeRange = RANGE_OPTIONS.find((option) => option.value === range)?.label ?? "近 30 天";
  const change = range === "7" ? "+12.8%" : range === "90" ? "+18.4%" : range === "empty" ? "—" : "+16.2%";

  return (
    <div className="analytics-app">
      <aside className="analytics-sidebar">
        <div className="brand-lockup"><span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3.5 14.3 8l5 .7-3.6 3.5.9 5-4.6-2.4-4.6 2.4.9-5-3.6-3.5 5-.7L12 3.5Z" /></svg></span><div><strong>PulseBoard</strong><span>业务分析平台</span></div></div>
        <div className="sidebar-group"><span className="sidebar-label">工作台</span><nav aria-label="工作台导航"><button className="side-nav active" type="button"><span className="nav-icon">▦</span>数据看板</button><button className="side-nav" type="button"><span className="nav-icon">◫</span>统计报表</button><button className="side-nav" type="button"><span className="nav-icon">⌁</span>实时监控</button></nav></div>
        <div className="sidebar-group"><span className="sidebar-label">管理</span><nav aria-label="管理导航"><button className="side-nav" type="button"><span className="nav-icon">◌</span>团队成员</button><button className="side-nav" type="button"><span className="nav-icon">⚙</span>系统设置</button></nav></div>
        <div className="sidebar-bottom"><div className="sidebar-help"><span className="help-dot">?</span><div><strong>需要帮助？</strong><span>查看使用指南</span></div><span className="arrow">↗</span></div><div className="sidebar-user"><span className="avatar small-avatar">陈</span><span><strong>陈嘉豪</strong><small>管理员</small></span><span className="more">•••</span></div></div>
      </aside>

      <div className="analytics-shell">
        <header className="topbar"><div className="breadcrumbs"><span>工作台</span><b>/</b><strong>数据看板</strong></div><div className="topbar-actions"><button className="top-icon" type="button" aria-label="通知">♧<i /></button><span className="topbar-divider" /><span className="avatar">陈</span><button className="top-name" type="button">陈嘉豪 <span>⌄</span></button></div></header>
        <main className="dashboard-main">
          <section className="page-heading"><div><p className="eyebrow">ANALYTICS OVERVIEW</p><h1>经营分析看板</h1><p className="page-subtitle">用数据看见业务变化，让每一次决策都有依据。</p></div><div className="heading-meta"><span className="live-dot" />数据已更新 <strong>刚刚</strong></div></section>

          <section className="filter-bar"><div className="filter-intro"><span className="filter-symbol">⌁</span><div><strong>筛选数据范围</strong><small>所有指标与图表将同步更新</small></div></div><div className="filter-controls"><span className="filter-caption">日期范围</span><label className="range-select"><select value={range} onChange={(event) => setRange(event.target.value as RangeKey)} aria-label="选择数据范围">{RANGE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><span>⌄</span></label><span className="range-active">{activeRange}</span></div></section>

          <section className="metric-grid" aria-label="核心指标"><MetricCard label="总访问量" value={metrics.visits.toLocaleString()} hint="较前一周期" change={change} tone="blue" icon="↗" /><MetricCard label="订单总数" value={metrics.orders.toLocaleString()} hint="较前一周期" change={change} tone="violet" icon="◈" /><MetricCard label="转化率" value={`${conversion.toFixed(1)}%`} hint="订单 / 访问量" change={range === "empty" ? "—" : "+2.6%"} tone="green" icon="◎" /><MetricCard label="总收入" value={`¥${metrics.revenue.toLocaleString()}`} hint="含税收入" change={range === "empty" ? "—" : "+21.3%"} tone="orange" icon="¥" /></section>

          {filtered.length === 0 ? <EmptyState activeRange={activeRange} /> : <>
            <section className="chart-grid"><article className="panel trend-panel"><PanelHeading title="访问与订单趋势" subtitle={`${filtered[0].date} — ${filtered[filtered.length - 1].date}`} extra={<span className="chart-legend"><i className="legend-visits" />访问量 <i className="legend-orders" />订单数</span>} /><TrendChart rows={filtered} /></article><article className="panel category-panel"><PanelHeading title="业务分类" subtitle="当前范围订单构成" extra={<span className="panel-link">查看明细 ↗</span>} /><CategoryChart rows={categories} /></article></section>
            <section className="insight-grid"><article className="insight-card"><div className="insight-title"><span className="insight-icon purple">◉</span><span>平均客单价</span><small>较前一周期</small></div><strong>¥{averageOrder.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong><div className="mini-progress"><i style={{ width: `${Math.min(100, conversion * 12)}%` }} /></div><span className="insight-foot">订单质量持续提升</span></article><article className="insight-card"><div className="insight-title"><span className="insight-icon blue">⌁</span><span>日均访问量</span><small>活跃度</small></div><strong>{Math.round(metrics.visits / filtered.length).toLocaleString()}</strong><div className="spark-bars" aria-hidden="true">{[42, 58, 50, 74, 64, 86, 78].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div><span className="insight-foot">高于上周同期 8.4%</span></article><article className="insight-card"><div className="insight-title"><span className="insight-icon orange">✦</span><span>增长机会</span><small>业务提示</small></div><strong>订阅业务</strong><div className="opportunity-line"><span>贡献订单最多</span><b>{categories[0].value.toLocaleString()}</b></div><span className="insight-foot">建议关注复购转化</span></article></section>
            <section className="data-note"><span>i</span><p>数据集共 {filtered.length} 天，筛选变化会同步重新计算指标卡、趋势图和分类图。数据为固定合成内容，仅用于产品界面演示。</p><b>合成数据</b></section>
          </>}
        </main>
      </div>
    </div>
  );
}

function MetricCard({ label, value, hint, change, tone, icon }: { label: string; value: string; hint: string; change: string; tone: MetricTone; icon: string }) {
  return <article className="metric-card"><div className={`metric-icon ${tone}`}>{icon}</div><div className="metric-copy"><span>{label}</span><small>{hint}</small></div><strong>{value}</strong><em className={change === "—" ? "muted" : ""}>{change}</em></article>;
}

function PanelHeading({ title, subtitle, extra }: { title: string; subtitle: string; extra: ReactNode }) {
  return <div className="panel-heading"><div><h2>{title}</h2><p>{subtitle}</p></div>{extra}</div>;
}

function TrendChart({ rows }: { rows: AnalyticsRow[] }) {
  const width = 760; const height = 290; const pad = { left: 42, right: 18, top: 18, bottom: 34 };
  const max = Math.ceil(Math.max(...rows.map((row) => Math.max(row.visits, row.orders * 8)), 1) / 100) * 100;
  const x = (index: number) => pad.left + (index / Math.max(rows.length - 1, 1)) * (width - pad.left - pad.right);
  const y = (value: number) => pad.top + (1 - value / max) * (height - pad.top - pad.bottom);
  const visits = rows.map((row, index) => `${x(index)},${y(row.visits)}`).join(" ");
  const orders = rows.map((row, index) => `${x(index)},${y(row.orders * 8)}`).join(" ");
  const area = `M ${x(0)} ${height - pad.bottom} L ${visits.split(" ").map((point) => point.replace(",", " ")).join(" L ")} L ${x(rows.length - 1)} ${height - pad.bottom} Z`;
  const ticks = [max, max * .75, max * .5, max * .25, 0];
  const labelIndexes = Array.from(new Set([0, Math.floor((rows.length - 1) / 3), Math.floor((rows.length - 1) * 2 / 3), rows.length - 1]));
  return <svg className="trend-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="访问量和订单趋势折线图"><defs><linearGradient id="trend-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#6a7eea" stopOpacity=".18" /><stop offset="1" stopColor="#6a7eea" stopOpacity="0" /></linearGradient></defs><g className="grid-lines">{ticks.map((tick) => <g key={tick}><line x1={pad.left} x2={width - pad.right} y1={y(tick)} y2={y(tick)} /><text x={pad.left - 10} y={y(tick) + 3} textAnchor="end">{tick === 0 ? "0" : `${Math.round(tick / 100) / 10}k`}</text></g>)}</g><path className="trend-area" d={area} /><polyline className="trend-line visits-line" points={visits} /><polyline className="trend-line orders-line" points={orders} /><circle className="trend-point visits-point" cx={x(rows.length - 1)} cy={y(rows[rows.length - 1].visits)} r="4" /><circle className="trend-point orders-point" cx={x(rows.length - 1)} cy={y(rows[rows.length - 1].orders * 8)} r="4" />{labelIndexes.map((index) => <text className="x-label" key={rows[index].date} x={x(index)} y={height - 8} textAnchor={index === 0 ? "start" : index === rows.length - 1 ? "end" : "middle"}>{rows[index].date.slice(5).replace("-", "/")}</text>)}</svg>;
}

function CategoryChart({ rows }: { rows: CategoryRow[] }) {
  const total = rows.reduce((sum, row) => sum + row.value, 0); const circumference = 2 * Math.PI * 53;
  const colors = ["#6378e4", "#9b86ef", "#efb561"];
  const segments = rows.reduce<Array<{ row: CategoryRow; index: number; length: number; offset: number }>>((items, row, index) => {
    const previous = items[index - 1];
    const length = total === 0 ? 0 : (row.value / total) * circumference;
    const offset = previous === undefined ? 0 : previous.offset + previous.length;
    return [...items, { row, index, length, offset }];
  }, []);
  return <div className="category-content"><div className="donut-wrap"><svg viewBox="0 0 140 140" role="img" aria-label="业务分类订单占比"><circle className="donut-track" cx="70" cy="70" r="53" /><g transform="rotate(-90 70 70)">{segments.map(({ row, index, length, offset }) => <circle className="donut-segment" key={row.name} cx="70" cy="70" r="53" stroke={colors[index]} strokeDasharray={`${length} ${circumference - length}`} strokeDashoffset={-offset} />)}</g><text className="donut-total" x="70" y="67" textAnchor="middle">{total.toLocaleString()}</text><text className="donut-label" x="70" y="84" textAnchor="middle">订单总数</text></svg></div><div className="category-list">{rows.map((row, index) => { const percentage = total === 0 ? 0 : (row.value / total) * 100; return <div className="category-item" key={row.name}><div><span className="category-name"><i style={{ background: colors[index] }} />{row.name}</span><strong>{row.value.toLocaleString()}</strong></div><div className="category-meter"><i style={{ width: `${percentage}%`, background: colors[index] }} /></div><small>{percentage.toFixed(1)}%</small></div>; })}</div></div>;
}

function EmptyState({ activeRange }: { activeRange: string }) {
  return <section className="empty-state" role="status"><div className="empty-orb"><span>⌁</span></div><h2>当前范围暂无数据</h2><p>{activeRange} 没有可展示的业务记录，请切换到其他日期范围查看演示。</p><div className="empty-hint"><span>↗</span><strong>固定合成数据</strong><small>切换范围后指标与图表会自动同步</small></div></section>;
}

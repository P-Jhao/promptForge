import { useState } from "react";
import { Icon } from "../components/Icon";
import { SuitePageHeading } from "../components/SuitePageHeading";

const catalog = [
  { id: "workspace", name: "AI 工作台", description: "提示词、批处理与工作流的一站式创作空间。", users: "8,642", usage: "82%", icon: "工作" },
  { id: "api", name: "企业 API", description: "稳定的模型调用、密钥管理与用量治理。", users: "6,284", usage: "74%", icon: "API" },
  { id: "knowledge", name: "团队知识库", description: "沉淀团队资料并提供可检索的上下文。", users: "4,318", usage: "63%", icon: "知" },
  { id: "automation", name: "自动化中心", description: "将重复任务组合为可复用的自动化流程。", users: "3,106", usage: "48%", icon: "自" },
] as const;

type ProductId = (typeof catalog)[number]["id"];

export function ProductCenterPage({ onFeedback }: { onFeedback: (message: string) => void }) {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({ workspace: true, api: true, knowledge: true, automation: false });
  const [selected, setSelected] = useState<ProductId>("workspace");
  const current = catalog.find((item) => item.id === selected) ?? catalog[0];
  const toggle = (id: string, name: string) => setEnabled((state) => {
    const next = !state[id];
    onFeedback(`${name}已${next ? "启用" : "停用"}。`);
    return { ...state, [id]: next };
  });

  return <>
    <SuitePageHeading title="产品中心" subtitle="管理企业可用产品与功能模块，查看使用规模并快速调整启用状态。" actions={<button className="action" type="button" onClick={() => onFeedback("产品目录已刷新为最新的本地演示状态。") }><Icon name="refresh" size={14} />刷新目录</button>} />
    <section className="suite-stat-grid">
      <article className="suite-stat-card"><span>已启用产品</span><strong>{Object.values(enabled).filter(Boolean).length}</strong><small>共 {catalog.length} 个产品</small></article>
      <article className="suite-stat-card"><span>产品活跃用户</span><strong>12,480</strong><small>较上周期 +14.6%</small></article>
      <article className="suite-stat-card"><span>API 调用量</span><strong>86,521</strong><small>过去 30 天</small></article>
      <article className="suite-stat-card"><span>平均采用率</span><strong>66.8%</strong><small>核心功能采用情况</small></article>
    </section>
    <section className="suite-product-layout">
      <div className="suite-product-grid">{catalog.map((product) => <article key={product.id} className={`suite-product-card ${selected === product.id ? "selected" : ""}`}><button className="suite-product-main" type="button" onClick={() => setSelected(product.id)}><span className="suite-product-icon">{product.icon}</span><div><strong>{product.name}</strong><p>{product.description}</p><small>{product.users} 活跃用户 · 采用率 {product.usage}</small></div></button><div className="suite-product-actions"><button className="action" type="button" onClick={() => { setSelected(product.id); onFeedback(`已打开${product.name}配置面板。`); }}>配置</button><button className={`suite-switch ${enabled[product.id] ? "on" : ""}`} type="button" aria-pressed={enabled[product.id]} onClick={() => toggle(product.id, product.name)}><span /></button></div></article>)}</div>
      <aside className="panel suite-detail-card"><span className="suite-detail-kicker">当前产品</span><h2>{current.name}</h2><p>{current.description}</p><dl><div><dt>活跃用户</dt><dd>{current.users}</dd></div><div><dt>采用率</dt><dd>{current.usage}</dd></div><div><dt>运行状态</dt><dd>{enabled[current.id] ? "已启用" : "已停用"}</dd></div></dl><button className="primary-action" type="button" onClick={() => onFeedback(`已进入${current.name}的功能管理演示。`)}>管理功能</button></aside>
    </section>
  </>;
}

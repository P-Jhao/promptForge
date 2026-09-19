import { useMemo, useState } from "react";
import type { ProductCategory, ProductRecord } from "../types/workspace";
import { ModuleEmptyState, ModuleMetrics, ModulePageHeader, StatusPill, formatCurrency } from "../components/ModuleCommon";

const categories: ProductCategory[] = ["订阅服务", "实施服务", "数据服务", "增值服务"];

export function ProductsPage({ items, query, onAdd, onToggle, onFeedback }: { items: ProductRecord[]; query: string; onAdd: () => void; onToggle: (id: string) => void; onFeedback: (message: string) => void }) {
  const [category, setCategory] = useState<ProductCategory | "all">("all");
  const filtered = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase();
    return items.filter((item) => {
      if (category !== "all" && item.category !== category) return false;
      if (keyword.length === 0) return true;
      return [item.name, item.category].join(" ").toLocaleLowerCase().includes(keyword);
    });
  }, [items, query, category]);
  const add = () => { onAdd(); onFeedback("已新增一个演示产品"); };
  const toggle = (item: ProductRecord) => { onToggle(item.id); onFeedback(item.active ? "产品已停用" : "产品已启用"); };
  const active = items.filter((item) => item.active);

  return <div className="crm-content">
    <ModulePageHeader title="产品管理" subtitle="维护产品目录、定价、启停状态和客户使用情况。" actionLabel="新增产品" onAction={add} />
    <ModuleMetrics metrics={[
      { label: "产品总数", value: String(items.length), hint: "全部演示产品", icon: "box" },
      { label: "已启用", value: String(active.length), hint: "可用于销售", icon: "check", tone: "success" },
      { label: "客户覆盖", value: String(items.reduce((sum, item) => sum + item.customers, 0)), hint: "累计产品使用数", icon: "users", tone: "primary" },
      { label: "平均目录价", value: formatCurrency(Math.round(items.reduce((sum, item) => sum + item.price, 0) / Math.max(1, items.length))), hint: "基于当前目录", icon: "chart", tone: "warning" },
    ]} />
    <section className="module-panel module-table-card"><div className="module-table-toolbar"><div><strong>产品目录</strong><span>共 {filtered.length} 条结果</span></div><label>分类<select value={category} onChange={(event) => setCategory(event.target.value as ProductCategory | "all")}><option value="all">全部分类</option>{categories.map((value) => <option key={value} value={value}>{value}</option>)}</select></label></div>
      {filtered.length === 0 ? <ModuleEmptyState title="没有匹配的产品" description="尝试更换搜索关键词或产品分类。" /> : <div className="product-card-grid">{filtered.map((item) => <article key={item.id}><div className="product-card-icon">{item.name.slice(0, 1)}</div><div className="product-card-copy"><div><strong>{item.name}</strong><StatusPill tone={item.active ? "success" : "neutral"}>{item.active ? "已启用" : "已停用"}</StatusPill></div><p>{item.category}</p><span><b>{formatCurrency(item.price)}</b><small>{item.customers} 个客户使用</small></span></div><button type="button" onClick={() => toggle(item)}>{item.active ? "停用" : "启用"}</button></article>)}</div>}
    </section>
  </div>;
}

import { useMemo, useState, type ChangeEvent } from "react";
import { EmptyState } from "../components/EmptyState";
import { Icon } from "../components/Icon";
import type { RangeKey, RangeSnapshot } from "../types/analytics";
import { downloadTextFile } from "../utils/csv";
import { formatNumber } from "../utils/format";

interface ReportModule {
  key: "metrics" | "trend" | "channel" | "industry" | "customers" | "finance";
  label: string;
  description: string;
  icon: "report" | "barChart" | "link" | "users" | "document" | "money";
}

const modules: readonly ReportModule[] = [
  { key: "metrics", label: "核心指标", description: "六项经营指标与环比变化", icon: "report" },
  { key: "trend", label: "业务趋势", description: "新增客户、收入、订单与 API 趋势", icon: "barChart" },
  { key: "channel", label: "渠道来源", description: "渠道触达和贡献结构", icon: "link" },
  { key: "industry", label: "行业分布", description: "客户行业画像", icon: "users" },
  { key: "customers", label: "客户明细", description: "客户记录与状态摘要", icon: "document" },
  { key: "finance", label: "财务摘要", description: "收入、订单与客单价", icon: "money" },
];

const presetModules: Record<string, readonly ReportModule["key"][]> = {
  "增长周报": ["metrics", "trend", "channel"],
  "客户经营": ["metrics", "industry", "customers"],
  "管理层月报": ["metrics", "trend", "channel", "industry", "finance"],
};

export function CustomReportPage({ range, snapshot, onFeedback }: { range: RangeKey; snapshot: RangeSnapshot; onFeedback: (message: string) => void }) {
  const [name, setName] = useState("经营分析报告");
  const [selected, setSelected] = useState<Set<ReportModule["key"]>>(() => new Set(["metrics", "trend", "channel"]));
  const [generated, setGenerated] = useState(true);

  const selectedModules = useMemo(() => modules.filter((item) => selected.has(item.key)), [selected]);
  const toggle = (key: ReportModule["key"]) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
    setGenerated(false);
  };
  const applyPreset = (preset: string) => {
    setSelected(new Set(presetModules[preset] ?? []));
    setName(preset);
    setGenerated(false);
    onFeedback(`已应用“${preset}”模板。`);
  };
  const generate = () => {
    if (selected.size === 0) {
      onFeedback("请至少选择一个报表模块。")
      return;
    }
    setGenerated(true);
    onFeedback(`已生成“${name.trim() || "未命名报表"}”预览，共 ${selected.size} 个模块。`);
  };
  const exportReport = () => {
    if (selected.size === 0) {
      onFeedback("当前没有可导出的报表模块。")
      return;
    }
    const rows = [
      ["报表名称", name.trim() || "未命名报表"],
      ["日期范围", `${snapshot.startDate} 至 ${snapshot.endDate}`],
      ["已选模块", selectedModules.map((item) => item.label).join("、")],
      ...snapshot.metrics.map((metric) => [metric.label, metric.value]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\r\n");
    downloadTextFile(`custom-report-${range}.csv`, csv);
    onFeedback("自定义报表 CSV 已在本地生成。")
  };

  return <>
    <section className="report-toolbar panel">
      <div><span className="report-kicker">报表名称</span><label className="report-name"><Icon name="report" size={16} /><input value={name} onChange={(event: ChangeEvent<HTMLInputElement>) => { setName(event.target.value); setGenerated(false); }} aria-label="报表名称" /></label></div>
      <div className="report-presets"><span>快速模板</span>{Object.keys(presetModules).map((preset) => <button type="button" key={preset} onClick={() => applyPreset(preset)}>{preset}</button>)}</div>
      <div className="report-actions"><button type="button" className="action" onClick={() => { setSelected(new Set()); setGenerated(false); onFeedback("已清空报表模块。") }}>清空</button><button type="button" className="action" onClick={exportReport}><Icon name="download" size={14} />导出 CSV</button><button type="button" className="primary-action" onClick={generate}>生成预览</button></div>
    </section>

    <section className="report-builder-grid">
      <article className="panel module-panel"><div className="panel-title"><div><h2>选择报表模块</h2><p>勾选需要展示在报表中的内容</p></div><span className="panel-chip">已选 {selected.size}</span></div><div className="module-list">{modules.map((item) => <label className={selected.has(item.key) ? "selected" : ""} key={item.key}><input type="checkbox" checked={selected.has(item.key)} onChange={() => toggle(item.key)} /><span className="module-icon"><Icon name={item.icon} size={17} /></span><span><strong>{item.label}</strong><small>{item.description}</small></span></label>)}</div></article>
      <article className="panel report-preview-panel"><div className="panel-title"><div><h2>报表预览</h2><p>{snapshot.label} · {snapshot.startDate} 至 {snapshot.endDate}</p></div>{generated ? <span className="preview-ready"><Icon name="check" size={13} />已生成</span> : <span className="preview-pending">待更新</span>}</div>
        {selectedModules.length === 0 ? <EmptyState compact title="还没有选择报表模块" description="从左侧勾选内容后点击“生成预览”。" /> : <div className={`report-preview ${generated ? "" : "stale"}`}>
          <div className="preview-cover"><span>{name.trim() || "未命名报表"}</span><strong>{snapshot.label}经营数据摘要</strong><small>数据分析看板 · 合成演示数据</small></div>
          <div className="preview-metrics">{snapshot.metrics.slice(0, 4).map((metric) => <div key={metric.key}><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.change}</small></div>)}</div>
          <div className="preview-module-list">{selectedModules.map((module, index) => <div key={module.key}><span>{String(index + 1).padStart(2, "0")}</span><Icon name={module.icon} size={15} /><div><strong>{module.label}</strong><small>{module.description}</small></div></div>)}</div>
          <div className="preview-footer"><span>客户总数：{formatNumber(snapshot.customerTotal)}</span><span>模块数：{selectedModules.length}</span></div>
        </div>}
      </article>
    </section>
  </>;
}

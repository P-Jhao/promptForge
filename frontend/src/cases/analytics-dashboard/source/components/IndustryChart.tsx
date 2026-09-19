import { useState, type ChangeEvent } from "react";
import type { IndustryDatum } from "../types/analytics";
import { formatNumber } from "../utils/format";

export function IndustryChart({ data, total, onFeedback }: { data: readonly IndustryDatum[]; total: number; onFeedback: (message: string) => void }) {
  const [selected, setSelected] = useState("all");
  const circumference = 2 * Math.PI * 53;
  let runningOffset = 0;
  const segments = data.map((industry) => {
    const length = industry.value / 100 * circumference;
    const segment = { industry, length, offset: runningOffset };
    runningOffset += length;
    return segment;
  });

  return <div className="industry-block">
    <label className="mini-select-control industry-select" aria-label="行业图表筛选"><select value={selected} onChange={(event: ChangeEvent<HTMLSelectElement>) => {
      setSelected(event.target.value);
      onFeedback(event.target.value === "all" ? "已显示全部行业。" : `已突出显示${event.target.value}行业。`);
    }}><option value="all">全部</option>{data.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}</select><span>⌄</span></label>
    <div className="industry-content">
      <div className="donut"><svg viewBox="0 0 140 140" role="img" aria-label="客户行业分布环形图"><g className="donut-rotated"><circle className="donut-track" cx="70" cy="70" r="53" />{segments.map(({ industry, length, offset }) => <circle className={selected !== "all" && selected !== industry.name ? "dimmed" : ""} key={industry.name} cx="70" cy="70" r="53" stroke={industry.color} strokeDasharray={`${length} ${circumference - length}`} strokeDashoffset={-offset} />)}</g><text x="70" y="67" textAnchor="middle">{formatNumber(total)}</text><text className="donut-subtitle" x="70" y="84" textAnchor="middle">客户总数</text></svg></div>
      <div className="industry-list">{data.map((industry) => <button className={`industry-item ${selected !== "all" && selected !== industry.name ? "dimmed" : ""}`} type="button" key={industry.name} onClick={() => { setSelected(industry.name); onFeedback(`已突出显示${industry.name}行业。`); }}><i style={{ background: industry.color }} /><span>{industry.name}</span><strong>{industry.value.toFixed(1)}%</strong></button>)}</div>
    </div>
  </div>;
}

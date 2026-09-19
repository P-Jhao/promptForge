import { useMemo, useState, type ChangeEvent } from "react";
import type { ChannelDatum } from "../types/analytics";
import { formatNumber } from "../utils/format";

export function ChannelChart({ data, onFeedback }: { data: readonly ChannelDatum[]; onFeedback: (message: string) => void }) {
  const [selected, setSelected] = useState("all");
  const max = useMemo(() => Math.max(1, ...data.map((item) => item.value)) * 1.12, [data]);
  const axisMax = Math.ceil(max / 500) * 500;
  const ticks = [axisMax, axisMax * .75, axisMax * .5, axisMax * .25, 0];
  return <div className="channel-chart-wrap">
    <label className="mini-select-control" aria-label="渠道筛选">
      <select value={selected} onChange={(event: ChangeEvent<HTMLSelectElement>) => { setSelected(event.target.value); onFeedback(event.target.value === "all" ? "已显示全部渠道。" : `已突出显示${event.target.value}渠道。`); }}>
        <option value="all">全部渠道</option>{data.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
      </select><span>⌄</span>
    </label>
    <div className="bar-chart">
      <div className="bar-y-axis">{ticks.map((tick) => <span key={tick}>{formatNumber(Math.round(tick))}</span>)}</div>
      <div className="bars">{data.map((channel) => <button className={`bar-column ${selected !== "all" && selected !== channel.name ? "dimmed" : ""}`} key={channel.name} type="button" onClick={() => { setSelected(channel.name); onFeedback(`已突出显示${channel.name}渠道。`); }} title={`${channel.name}：${formatNumber(channel.value)}`}>
        <strong>{formatNumber(channel.value)}</strong><i style={{ height: `${Math.max(10, channel.value / axisMax * 100)}%`, background: channel.color }} /><span>{channel.name}</span>
      </button>)}</div>
    </div>
  </div>;
}

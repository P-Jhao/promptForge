import type { ChangeEvent } from "react";
import { rangeOptions, snapshots } from "../data/demoData";
import type { RangeKey } from "../types/analytics";
import { Icon } from "./Icon";

interface PageHeadingProps {
  title: string;
  subtitle: string;
  range: RangeKey;
  onRangeChange: (range: RangeKey) => void;
}

export function PageHeading({ title, subtitle, range, onRangeChange }: PageHeadingProps) {
  const snapshot = snapshots[range];
  return <section className="page-heading">
    <div><h1>{title}</h1><p>{subtitle}</p></div>
    <div className="date-controls">
      <div className="date-range" aria-label="当前日期范围"><Icon name="calendar" size={16} /><span>{snapshot.startDate}</span><b>→</b><span>{snapshot.endDate}</span></div>
      <label className="period-select"><select value={range} onChange={(event: ChangeEvent<HTMLSelectElement>) => onRangeChange(event.target.value as RangeKey)} aria-label="日期范围">{rangeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><Icon name="chevronDown" size={14} /></label>
    </div>
  </section>;
}

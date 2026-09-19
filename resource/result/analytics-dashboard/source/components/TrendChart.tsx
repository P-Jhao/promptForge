import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { TrendKey, TrendPoint } from "../types/analytics";
import { formatNumber } from "../utils/format";

const labels: Record<TrendKey, string> = {
  customers: "新增客户",
  revenue: "收入",
  orders: "订单数",
  api: "API 调用量",
};

const units: Record<TrendKey, string> = {
  customers: "",
  revenue: " 万元",
  orders: "",
  api: " 次",
};

function niceMax(value: number): number {
  if (value <= 100) return 100;
  if (value <= 200) return 200;
  if (value <= 400) return 400;
  if (value <= 500) return 500;
  if (value <= 1000) return 1000;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  return Math.ceil(value / magnitude) * magnitude;
}

export function TrendChart({ data, trendKey }: { data: readonly TrendPoint[]; trendKey: TrendKey }) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const defaultIndex = useMemo(() => {
    const exact = data.findIndex((point) => point.fullDate === "2024-04-10");
    return exact >= 0 ? exact : Math.floor((data.length - 1) / 2);
  }, [data]);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const activeIndex = Math.max(0, Math.min(data.length - 1, hoverIndex ?? defaultIndex));

  if (data.length === 0) return null;

  const width = 660;
  const height = 220;
  const pad = { left: 42, right: 14, top: 22, bottom: 31 };
  const chartWidth = width - pad.left - pad.right;
  const chartHeight = height - pad.top - pad.bottom;
  const rawMax = Math.max(...data.map((point) => point.value));
  const max = niceMax(rawMax * 1.18);
  const x = (index: number) => data.length === 1 ? pad.left + chartWidth / 2 : pad.left + index * chartWidth / (data.length - 1);
  const y = (value: number) => pad.top + (1 - value / max) * chartHeight;
  const points = data.map((point, index) => `${x(index)},${y(point.value)}`).join(" ");
  const areaPath = `M ${x(0)} ${height - pad.bottom} L ${data.map((point, index) => `${x(index)} ${y(point.value)}`).join(" L ")} L ${x(data.length - 1)} ${height - pad.bottom} Z`;
  const active = data[activeIndex] ?? data[0];
  const tickValues = [0, max * .25, max * .5, max * .75, max];
  const labelCount = data.length <= 7 ? data.length : 7;
  const xIndexes = Array.from({ length: labelCount }, (_, index) => Math.round(index * (data.length - 1) / Math.max(1, labelCount - 1)));
  const tooltipWidth = 142;
  const tooltipX = Math.min(width - tooltipWidth - 5, Math.max(pad.left + 4, x(activeIndex) + 8));
  const tooltipY = Math.max(5, y(active.value) - 62);
  const gradientId = `trend-fill-${trendKey}`;

  const handlePointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const relativeX = (event.clientX - rect.left) / rect.width * width;
    const ratio = Math.max(0, Math.min(1, (relativeX - pad.left) / chartWidth));
    setHoverIndex(Math.round(ratio * (data.length - 1)));
  };

  return <div className="chart-wrap">
    <svg ref={svgRef} className="trend-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${labels[trendKey]}业务趋势折线图`} onPointerMove={handlePointerMove} onPointerLeave={() => setHoverIndex(null)}>
      <defs><linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#536df3" stopOpacity=".18" /><stop offset="1" stopColor="#536df3" stopOpacity="0" /></linearGradient></defs>
      <g className="grid-lines">{tickValues.map((tick) => <g key={tick}><line x1={pad.left} x2={width - pad.right} y1={y(tick)} y2={y(tick)} /><text x={pad.left - 10} y={y(tick) + 3} textAnchor="end">{formatNumber(Math.round(tick))}</text></g>)}</g>
      <path className="trend-area" style={{ fill: `url(#${gradientId})` }} d={areaPath} />
      <polyline className="trend-line" points={points} />
      <line className="focus-line" x1={x(activeIndex)} x2={x(activeIndex)} y1={y(active.value) + 7} y2={height - pad.bottom} />
      <circle className="focus-ring" cx={x(activeIndex)} cy={y(active.value)} r="6" />
      <circle className="focus-dot" cx={x(activeIndex)} cy={y(active.value)} r="3" />
      <g className="chart-tooltip" transform={`translate(${tooltipX} ${tooltipY})`}>
        <rect width={tooltipWidth} height="55" rx="7" />
        <text x="12" y="18">{active.fullDate}</text>
        <circle cx="13" cy="38" r="4" />
        <text className="tooltip-value" x="23" y="42">{labels[trendKey]}　{formatNumber(active.value)}{units[trendKey]}</text>
      </g>
      {xIndexes.map((index) => <text className="x-label" key={`${data[index]?.fullDate}-${index}`} x={x(index)} y={height - 8} textAnchor={index === 0 ? "start" : index === data.length - 1 ? "end" : "middle"}>{data[index]?.date}</text>)}
      <rect className="chart-hit-area" x={pad.left} y={pad.top} width={chartWidth} height={chartHeight} fill="transparent" />
    </svg>
  </div>;
}

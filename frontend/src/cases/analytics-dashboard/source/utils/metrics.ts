import type { MetricItem, RangeSnapshot } from "../types/analytics";

export function metricByKey(snapshot: RangeSnapshot, key: MetricItem["key"]): MetricItem | undefined {
  return snapshot.metrics.find((metric) => metric.key === key);
}

export function metricNumber(snapshot: RangeSnapshot, key: MetricItem["key"]): number {
  const raw = metricByKey(snapshot, key)?.value ?? "";
  if (raw === "—") return 0;
  const parsed = Number(raw.replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function changeFor(snapshot: RangeSnapshot, key: MetricItem["key"]): string {
  return metricByKey(snapshot, key)?.change ?? "—";
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("zh-CN").format(value);
}

export function formatCurrency(value: number): string {
  return `¥ ${formatNumber(value)}`;
}

export function parseIsoDate(value: string): number {
  return Date.parse(`${value}T00:00:00Z`);
}

export function withinDateRange(value: string, startDate: string, endDate: string): boolean {
  const time = parseIsoDate(value);
  return time >= parseIsoDate(startDate) && time <= parseIsoDate(endDate);
}

export function mmdd(value: string): string {
  return value.slice(5);
}

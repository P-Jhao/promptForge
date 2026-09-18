import type { Customer, CustomerFilters, CustomerStats } from "../types/customer";

export function filterCustomers(customers: Customer[], filters: CustomerFilters): Customer[] {
  const query = filters.query.trim().toLocaleLowerCase();
  return customers.filter((customer) => {
    if (filters.status !== "all" && customer.status !== filters.status) return false;
    if (filters.industry !== "all" && customer.industry !== filters.industry) return false;
    if (filters.source !== "all" && customer.source !== filters.source) return false;
    if (filters.companySize !== "all" && customer.companySize !== filters.companySize) return false;
    if (query.length === 0) return true;
    const searchable = [
      customer.company,
      customer.name,
      customer.phone,
      customer.email,
      customer.industry,
      customer.source,
      customer.contactRole,
      ...customer.tags,
    ]
      .join(" ")
      .toLocaleLowerCase();
    return searchable.includes(query);
  });
}

export function getCustomerStats(customers: Customer[]): CustomerStats {
  return customers.reduce<CustomerStats>(
    (stats, customer) => {
      stats.total += 1;
      if (customer.status === "won") stats.won += 1;
      else if (customer.status === "lost") stats.lost += 1;
      else stats.potential += 1;
      return stats;
    },
    { total: 0, potential: 0, won: 0, lost: 0 },
  );
}

export function hasActiveFilters(filters: CustomerFilters): boolean {
  return (
    filters.query.trim().length > 0 ||
    filters.status !== "all" ||
    filters.industry !== "all" ||
    filters.source !== "all" ||
    filters.companySize !== "all"
  );
}

export function todayDateString(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function createId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

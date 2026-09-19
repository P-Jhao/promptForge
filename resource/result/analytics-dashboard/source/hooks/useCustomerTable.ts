import { useEffect, useMemo, useState } from "react";
import type { CustomerFilters, CustomerRow, SortDirection, SortKey, StatusFilter } from "../types/analytics";
import { withinDateRange } from "../utils/format";

interface UseCustomerTableOptions {
  rows: readonly CustomerRow[];
  startDate: string;
  endDate: string;
  emptyRange: boolean;
}

export function useCustomerTable({ rows, startDate, endDate, emptyRange }: UseCustomerTableOptions) {
  const [filters, setFilters] = useState<CustomerFilters>({ query: "", status: "all", industry: "all" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState<SortKey>("created");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const rangeRows = useMemo(() => emptyRange ? [] : rows.filter((row) => withinDateRange(row.created, startDate, endDate)), [emptyRange, endDate, rows, startDate]);
  const industries = useMemo(() => Array.from(new Set(rangeRows.map((row) => row.industry))).sort((a, b) => a.localeCompare(b, "zh-CN")), [rangeRows]);

  const filteredRows = useMemo(() => {
    const query = filters.query.trim().toLocaleLowerCase("zh-CN");
    return rangeRows.filter((row) => {
      const matchesQuery = query.length === 0 || [row.company, row.contact, row.industry].some((value) => value.toLocaleLowerCase("zh-CN").includes(query));
      const matchesStatus = filters.status === "all" || row.status === filters.status;
      const matchesIndustry = filters.industry === "all" || row.industry === filters.industry;
      return matchesQuery && matchesStatus && matchesIndustry;
    }).sort((a, b) => {
      const result = sortKey === "amount" ? a.amount - b.amount : a.created.localeCompare(b.created);
      return sortDirection === "asc" ? result : -result;
    });
  }, [filters, rangeRows, sortDirection, sortKey]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageRows = filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => { setPage(1); }, [filters.query, filters.status, filters.industry, startDate, endDate, pageSize]);
  useEffect(() => { setSelectedIds(new Set()); }, [startDate, endDate, filters.query, filters.status, filters.industry]);
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);

  const hasFilters = filters.query.trim().length > 0 || filters.status !== "all" || filters.industry !== "all";

  const setQuery = (query: string) => setFilters((current) => ({ ...current, query }));
  const setStatus = (status: StatusFilter) => setFilters((current) => ({ ...current, status }));
  const setIndustry = (industry: string) => setFilters((current) => ({ ...current, industry }));
  const clearFilters = () => setFilters({ query: "", status: "all", industry: "all" });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDirection((current) => current === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDirection("desc"); }
  };

  const toggleSelected = (id: string) => setSelectedIds((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const togglePageSelection = () => setSelectedIds((current) => {
    const next = new Set(current);
    const ids = pageRows.map((row) => row.id);
    const allSelected = ids.length > 0 && ids.every((id) => current.has(id));
    ids.forEach((id) => { if (allSelected) next.delete(id); else next.add(id); });
    return next;
  });

  return {
    filters, industries, rangeRows, filteredRows, pageRows, page: safePage, pageCount, pageSize,
    sortKey, sortDirection, selectedIds, hasFilters,
    setQuery, setStatus, setIndustry, clearFilters, setPage, setPageSize, toggleSort, toggleSelected, togglePageSelection,
  };
}

export type CustomerTableState = ReturnType<typeof useCustomerTable>;

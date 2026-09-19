import { useEffect, useMemo, useState } from "react";
import { EMPTY_CUSTOMER_FORM, INITIAL_CUSTOMERS } from "../data/customers";
import type {
  Customer,
  CustomerFilters,
  CustomerFormValues,
  FollowUpRecord,
  SalesOpportunity,
} from "../types/customer";
import { createId, filterCustomers, getCustomerStats, todayDateString } from "../utils/customer";

const DEFAULT_FILTERS: CustomerFilters = {
  query: "",
  status: "all",
  industry: "all",
  source: "all",
  companySize: "all",
};

function formValuesToCustomer(values: CustomerFormValues): Omit<Customer, "id" | "createdAt" | "lastFollowUp" | "followUps" | "opportunities"> {
  const tags = values.tags
    .split(/[，,]/)
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
  return {
    name: values.name.trim(),
    company: values.company.trim(),
    industry: values.industry,
    email: values.email.trim(),
    phone: values.phone.trim(),
    status: values.status,
    source: values.source,
    tags,
    note: values.note.trim(),
    englishName: values.company.trim(),
    companySize: values.companySize,
    website: values.website.trim(),
    address: values.address.trim(),
    description: values.note.trim() || "暂无公司简介。",
    contactRole: values.contactRole.trim() || "联系人",
  };
}

export function useCustomerManager() {
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [filters, setFilters] = useState<CustomerFilters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(10);
  const [selectedId, setSelectedId] = useState<string | null>("c-001");
  const [checkedIds, setCheckedIds] = useState<string[]>(["c-001"]);

  const filteredCustomers = useMemo(() => filterCustomers(customers, filters), [customers, filters]);
  const stats = useMemo(() => getCustomerStats(customers), [customers]);
  const pageCount = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
  const pageCustomers = filteredCustomers.slice((page - 1) * pageSize, page * pageSize);
  const selectedCustomer = customers.find((customer) => customer.id === selectedId) ?? null;

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const updateFilters = (patch: Partial<CustomerFilters>) => {
    setFilters((current) => ({ ...current, ...patch }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  };

  const setPageSize = (nextSize: number) => {
    setPageSizeState(nextSize);
    setPage(1);
  };

  const createCustomer = (values: CustomerFormValues): Customer => {
    const now = todayDateString();
    const base = formValuesToCustomer(values);
    const customer: Customer = {
      ...base,
      id: createId("c"),
      createdAt: now,
      lastFollowUp: "待安排",
      description: "合成演示企业资料，不对应真实自然人或实际商务关系。",
      followUps: [],
      opportunities: [],
    };
    setCustomers((current) => [customer, ...current]);
    setFilters(DEFAULT_FILTERS);
    setPage(1);
    setSelectedId(customer.id);
    setCheckedIds((current) => [customer.id, ...current.filter((id) => id !== customer.id)]);
    return customer;
  };

  const updateCustomer = (id: string, values: CustomerFormValues) => {
    const base = formValuesToCustomer(values);
    setCustomers((current) =>
      current.map((customer) =>
        customer.id === id
          ? {
              ...customer,
              ...base,
              englishName: customer.company === values.company.trim() ? customer.englishName : `${values.company.trim()} (Demo)`,
              description: customer.description,
            }
          : customer,
      ),
    );
  };

  const deleteCustomer = (id: string) => {
    setCustomers((current) => current.filter((customer) => customer.id !== id));
    setCheckedIds((current) => current.filter((checkedId) => checkedId !== id));
    setSelectedId((current) => (current === id ? null : current));
  };

  const addFollowUp = (id: string, date: string, note: string) => {
    const record: FollowUpRecord = { id: createId("fu"), date, note: note.trim() };
    setCustomers((current) =>
      current.map((customer) =>
        customer.id === id
          ? {
              ...customer,
              lastFollowUp: date,
              note: note.trim(),
              followUps: [record, ...customer.followUps],
            }
          : customer,
      ),
    );
  };

  const addOpportunity = (
    id: string,
    title: string,
    amount: string,
    stage: SalesOpportunity["stage"],
  ) => {
    const opportunity: SalesOpportunity = {
      id: createId("op"),
      title: title.trim(),
      amount: amount.trim(),
      stage,
      createdAt: todayDateString(),
    };
    setCustomers((current) =>
      current.map((customer) =>
        customer.id === id
          ? { ...customer, opportunities: [opportunity, ...customer.opportunities] }
          : customer,
      ),
    );
  };

  const toggleChecked = (id: string) => {
    setCheckedIds((current) =>
      current.includes(id) ? current.filter((checkedId) => checkedId !== id) : [...current, id],
    );
  };

  const togglePageChecked = () => {
    const pageIds = pageCustomers.map((customer) => customer.id);
    const allSelected = pageIds.length > 0 && pageIds.every((id) => checkedIds.includes(id));
    setCheckedIds((current) => {
      if (allSelected) return current.filter((id) => !pageIds.includes(id));
      return Array.from(new Set([...current, ...pageIds]));
    });
  };

  const resetDemo = () => {
    setCustomers(INITIAL_CUSTOMERS);
    setFilters(DEFAULT_FILTERS);
    setPage(1);
    setPageSizeState(10);
    setSelectedId("c-001");
    setCheckedIds(["c-001"]);
  };

  return {
    customers,
    filters,
    stats,
    filteredCustomers,
    pageCustomers,
    page,
    pageCount,
    pageSize,
    selectedCustomer,
    selectedId,
    checkedIds,
    emptyForm: EMPTY_CUSTOMER_FORM,
    setSelectedId,
    setPage,
    setPageSize,
    updateFilters,
    clearFilters,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    addFollowUp,
    addOpportunity,
    toggleChecked,
    togglePageChecked,
    resetDemo,
  };
}

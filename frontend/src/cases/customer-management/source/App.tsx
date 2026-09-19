import { useCallback, useEffect, useState } from "react";
import { DeleteCustomerDialog, FollowUpModal, OpportunityModal } from "./components/ActivityModals";
import { CustomerDrawer } from "./components/CustomerDrawer";
import { CustomerFormModal } from "./components/CustomerFormModal";
import { CustomerTable } from "./components/CustomerTable";
import { FeedbackToast } from "./components/FeedbackToast";
import { FilterBar } from "./components/FilterBar";
import { GlobalHeader } from "./components/GlobalHeader";
import { Icon } from "./components/Icon";
import { Sidebar } from "./components/Sidebar";
import { StatsCards } from "./components/StatsCards";
import { useCustomerManager } from "./hooks/useCustomerManager";
import { useEscapeKey } from "./hooks/useEscapeKey";
import type { Customer, CustomerFormValues } from "./types/customer";
import { hasActiveFilters } from "./utils/customer";

interface FormState {
  mode: "create" | "edit";
  customerId: string | null;
}

type ActivityModal = "followup" | "opportunity" | "delete" | null;

export default function App() {
  const manager = useCustomerManager();
  const [formState, setFormState] = useState<FormState | null>(null);
  const [activityModal, setActivityModal] = useState<ActivityModal>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const selectedCustomer = manager.selectedCustomer;
  const editingCustomer = formState?.customerId
    ? manager.customers.find((customer) => customer.id === formState.customerId) ?? null
    : null;

  const showFeedback = (message: string) => setFeedback(message);

  useEffect(() => {
    if (feedback === null) return;
    const timeout = window.setTimeout(() => setFeedback(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  const closeTopLayer = useCallback(() => {
    if (activityModal !== null) {
      setActivityModal(null);
      return;
    }
    if (formState !== null) {
      setFormState(null);
      return;
    }
    if (manager.selectedId !== null) manager.setSelectedId(null);
  }, [activityModal, formState, manager.selectedId, manager.setSelectedId]);

  useEscapeKey(closeTopLayer);

  const openCreate = () => setFormState({ mode: "create", customerId: null });
  const openEdit = (customer: Customer) => setFormState({ mode: "edit", customerId: customer.id });

  const saveCustomer = (values: CustomerFormValues) => {
    if (formState?.mode === "edit" && formState.customerId !== null) {
      manager.updateCustomer(formState.customerId, values);
      showFeedback("客户资料已更新");
    } else {
      manager.createCustomer(values);
      showFeedback("客户已添加并显示在列表中");
    }
    setFormState(null);
  };

  const deleteSelectedCustomer = () => {
    if (manager.selectedCustomer === null) return;
    const company = manager.selectedCustomer.company;
    manager.deleteCustomer(manager.selectedCustomer.id);
    setActivityModal(null);
    showFeedback(`已删除 ${company}`);
  };

  const notifyUnavailableModule = (label: string) => {
    if (label === "客户管理") {
      showFeedback("当前已在客户管理模块");
      return;
    }
    showFeedback(`${label}属于宿主工作台的其他模块，本案例保持在客户管理页面`);
  };

  return (
    <div className={`crm-app-shell${selectedCustomer !== null ? " drawer-open" : ""}`}>
      <GlobalHeader
        query={manager.filters.query}
        onQueryChange={(query) => manager.updateFilters({ query })}
        onResetDemo={() => { manager.resetDemo(); setFormState(null); setActivityModal(null); showFeedback("演示数据已重置"); }}
      />
      <div className="crm-body">
        <Sidebar onNavigate={notifyUnavailableModule} onUpgrade={() => showFeedback("当前已经是 Pro 演示空间")} />
        <main className="crm-main">
          <div className="crm-content">
            <header className="page-heading">
              <div><h1>客户管理</h1><p>管理和维护客户信息，跟进销售机会，提升客户转化率。</p></div>
              <button className="add-customer-button" type="button" onClick={openCreate}><Icon name="plus" size={17} />新增客户</button>
            </header>

            <StatsCards stats={manager.stats} />

            <section className="customer-list-card">
              <FilterBar
                filters={manager.filters}
                resultCount={manager.filteredCustomers.length}
                onChange={manager.updateFilters}
                onClear={manager.clearFilters}
              />
              <CustomerTable
                customers={manager.pageCustomers}
                datasetSize={manager.customers.length}
                filteredTotal={manager.filteredCustomers.length}
                selectedId={manager.selectedId}
                checkedIds={manager.checkedIds}
                page={manager.page}
                pageCount={manager.pageCount}
                pageSize={manager.pageSize}
                filtersActive={hasActiveFilters(manager.filters)}
                onOpen={manager.setSelectedId}
                onEdit={openEdit}
                onToggleChecked={manager.toggleChecked}
                onTogglePageChecked={manager.togglePageChecked}
                onClearFilters={manager.clearFilters}
                onAdd={openCreate}
                onPageChange={manager.setPage}
                onPageSizeChange={manager.setPageSize}
              />
            </section>
          </div>
        </main>
      </div>

      {selectedCustomer !== null && (
        <CustomerDrawer
          customer={selectedCustomer}
          onClose={() => manager.setSelectedId(null)}
          onEdit={() => openEdit(selectedCustomer)}
          onDelete={() => setActivityModal("delete")}
          onAddFollowUp={() => setActivityModal("followup")}
          onAddOpportunity={() => setActivityModal("opportunity")}
          onFeedback={showFeedback}
        />
      )}

      {formState !== null && (
        <CustomerFormModal
          key={`${formState.mode}-${formState.customerId ?? "new"}`}
          mode={formState.mode}
          customer={editingCustomer}
          onClose={() => setFormState(null)}
          onSave={saveCustomer}
        />
      )}

      {activityModal === "followup" && selectedCustomer !== null && (
        <FollowUpModal
          company={selectedCustomer.company}
          onClose={() => setActivityModal(null)}
          onSave={(date, note) => { manager.addFollowUp(selectedCustomer.id, date, note); setActivityModal(null); showFeedback("跟进记录已创建"); }}
        />
      )}
      {activityModal === "opportunity" && selectedCustomer !== null && (
        <OpportunityModal
          company={selectedCustomer.company}
          onClose={() => setActivityModal(null)}
          onSave={(title, amount, stage) => { manager.addOpportunity(selectedCustomer.id, title, amount, stage); setActivityModal(null); showFeedback("销售机会已创建"); }}
        />
      )}
      {activityModal === "delete" && selectedCustomer !== null && (
        <DeleteCustomerDialog company={selectedCustomer.company} onClose={() => setActivityModal(null)} onConfirm={deleteSelectedCustomer} />
      )}

      {feedback !== null && <FeedbackToast message={feedback} onClose={() => setFeedback(null)} />}
    </div>
  );
}

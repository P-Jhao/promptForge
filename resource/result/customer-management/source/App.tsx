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
import { useWorkspaceModules } from "./hooks/useWorkspaceModules";
import { ContractsPage } from "./pages/ContractsPage";
import { FollowUpsPage } from "./pages/FollowUpsPage";
import { OpportunitiesPage } from "./pages/OpportunitiesPage";
import { ProductsPage } from "./pages/ProductsPage";
import { ReportsPage } from "./pages/ReportsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { TeamPage } from "./pages/TeamPage";
import { WorkbenchPage } from "./pages/WorkbenchPage";
import type { Customer, CustomerFormValues } from "./types/customer";
import type { NavigationKey } from "./types/workspace";
import { hasActiveFilters } from "./utils/customer";

interface FormState {
  mode: "create" | "edit";
  customerId: string | null;
}

type ActivityModal = "followup" | "opportunity" | "delete" | null;

const moduleSearchPlaceholders: Record<NavigationKey, string> = {
  workspace: "工作台概览无需搜索",
  customers: "搜索客户、联系人、公司名称或手机号...",
  opportunities: "搜索商机名称、客户或负责人...",
  followups: "搜索跟进客户、联系人或内容...",
  contracts: "搜索合同编号、客户或负责人...",
  products: "搜索产品名称或分类...",
  reports: "报表页无需搜索，可切换时间范围",
  team: "搜索成员、角色或团队...",
  settings: "设置页无需搜索",
};

export default function App() {
  const manager = useCustomerManager();
  const workspace = useWorkspaceModules();
  const [activeModule, setActiveModule] = useState<NavigationKey>("customers");
  const [moduleQuery, setModuleQuery] = useState("");
  const [formState, setFormState] = useState<FormState | null>(null);
  const [activityModal, setActivityModal] = useState<ActivityModal>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const selectedCustomer = activeModule === "customers" ? manager.selectedCustomer : null;
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
    if (activeModule === "customers" && manager.selectedId !== null) manager.setSelectedId(null);
  }, [activityModal, activeModule, formState, manager.selectedId, manager.setSelectedId]);

  useEscapeKey(closeTopLayer);

  const openCreate = () => setFormState({ mode: "create", customerId: null });
  const openEdit = (customer: Customer) => setFormState({ mode: "edit", customerId: customer.id });

  const navigate = (key: NavigationKey) => {
    if (key === activeModule) return;
    manager.setSelectedId(null);
    setFormState(null);
    setActivityModal(null);
    setModuleQuery("");
    setActiveModule(key);
  };

  const openCustomerCreateFromWorkbench = () => {
    setActiveModule("customers");
    setModuleQuery("");
    openCreate();
  };

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

  const resetDemo = () => {
    manager.resetDemo();
    workspace.resetModules();
    setFormState(null);
    setActivityModal(null);
    manager.setSelectedId(null);
    setModuleQuery("");
    showFeedback("全部演示数据已重置");
  };

  const renderMainContent = () => {
    if (activeModule === "workspace") {
      return (
        <WorkbenchPage
          stats={manager.stats}
          customers={manager.customers}
          opportunities={workspace.opportunities}
          followUps={workspace.followUps}
          contracts={workspace.contracts}
          onCreateCustomer={openCustomerCreateFromWorkbench}
          onNavigateCustomers={() => navigate("customers")}
        />
      );
    }
    if (activeModule === "opportunities") {
      return <OpportunitiesPage items={workspace.opportunities} query={moduleQuery} onAdd={workspace.addOpportunity} onFeedback={showFeedback} />;
    }
    if (activeModule === "followups") {
      return <FollowUpsPage items={workspace.followUps} query={moduleQuery} onAdd={workspace.addFollowUp} onToggle={workspace.toggleFollowUp} onFeedback={showFeedback} />;
    }
    if (activeModule === "contracts") {
      return <ContractsPage items={workspace.contracts} query={moduleQuery} onAdd={workspace.addContract} onFeedback={showFeedback} />;
    }
    if (activeModule === "products") {
      return <ProductsPage items={workspace.products} query={moduleQuery} onAdd={workspace.addProduct} onToggle={workspace.toggleProduct} onFeedback={showFeedback} />;
    }
    if (activeModule === "reports") {
      return <ReportsPage stats={manager.stats} opportunities={workspace.opportunities} contracts={workspace.contracts} onFeedback={showFeedback} />;
    }
    if (activeModule === "team") {
      return <TeamPage items={workspace.teamMembers} query={moduleQuery} onInvite={workspace.inviteMember} onFeedback={showFeedback} />;
    }
    if (activeModule === "settings") {
      return <SettingsPage settings={workspace.settings} onChange={workspace.updateSettings} onReset={workspace.resetSettings} onFeedback={showFeedback} />;
    }

    return (
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
    );
  };

  const headerQuery = activeModule === "customers" ? manager.filters.query : moduleQuery;
  const setHeaderQuery = activeModule === "customers"
    ? (query: string) => manager.updateFilters({ query })
    : (query: string) => setModuleQuery(query);

  return (
    <div className={`crm-app-shell${selectedCustomer !== null ? " drawer-open" : ""}${workspace.settings.compactTable ? " compact-mode" : ""}`}>
      <GlobalHeader
        query={headerQuery}
        onQueryChange={setHeaderQuery}
        searchPlaceholder={moduleSearchPlaceholders[activeModule]}
        searchDisabled={activeModule === "workspace" || activeModule === "reports" || activeModule === "settings"}
        onResetDemo={resetDemo}
      />
      <div className="crm-body">
        <Sidebar activeKey={activeModule} onNavigate={navigate} onUpgrade={() => showFeedback("当前已经是 Pro 演示空间")} />
        <main className="crm-main">{renderMainContent()}</main>
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

      {activityModal === "followup" && manager.selectedCustomer !== null && (
        <FollowUpModal
          company={manager.selectedCustomer.company}
          onClose={() => setActivityModal(null)}
          onSave={(date, note) => { manager.addFollowUp(manager.selectedCustomer!.id, date, note); setActivityModal(null); showFeedback("跟进记录已创建"); }}
        />
      )}
      {activityModal === "opportunity" && manager.selectedCustomer !== null && (
        <OpportunityModal
          company={manager.selectedCustomer.company}
          onClose={() => setActivityModal(null)}
          onSave={(title, amount, stage) => { manager.addOpportunity(manager.selectedCustomer!.id, title, amount, stage); setActivityModal(null); showFeedback("销售机会已创建"); }}
        />
      )}
      {activityModal === "delete" && manager.selectedCustomer !== null && (
        <DeleteCustomerDialog company={manager.selectedCustomer.company} onClose={() => setActivityModal(null)} onConfirm={deleteSelectedCustomer} />
      )}

      {feedback !== null && <FeedbackToast message={feedback} onClose={() => setFeedback(null)} />}
    </div>
  );
}

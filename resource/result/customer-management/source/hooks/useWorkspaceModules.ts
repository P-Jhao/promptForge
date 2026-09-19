import { useState } from "react";
import {
  defaultWorkspaceSettings,
  initialContracts,
  initialFollowUps,
  initialOpportunities,
  initialProducts,
  initialTeamMembers,
} from "../data/workspace";
import type {
  ContractRecord,
  FollowUpTask,
  OpportunityRecord,
  ProductRecord,
  TeamMember,
  WorkspaceSettings,
} from "../types/workspace";
import { createId, todayDateString } from "../utils/customer";

export function useWorkspaceModules() {
  const [opportunities, setOpportunities] = useState<OpportunityRecord[]>(initialOpportunities);
  const [followUps, setFollowUps] = useState<FollowUpTask[]>(initialFollowUps);
  const [contracts, setContracts] = useState<ContractRecord[]>(initialContracts);
  const [products, setProducts] = useState<ProductRecord[]>(initialProducts);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(initialTeamMembers);
  const [settings, setSettings] = useState<WorkspaceSettings>(defaultWorkspaceSettings);

  const addOpportunity = () => {
    const index = opportunities.length + 1;
    const next: OpportunityRecord = {
      id: createId("opp"),
      title: `新销售方案 ${index}`,
      customer: "演示客户有限公司",
      owner: "张三",
      amount: 120000 + index * 10000,
      stage: "需求确认",
      expectedClose: "2026-11-30",
      lastUpdate: todayDateString(),
    };
    setOpportunities((current) => [next, ...current]);
  };

  const addFollowUp = () => {
    const index = followUps.length + 1;
    const next: FollowUpTask = {
      id: createId("followup"),
      customer: "演示客户有限公司",
      contact: `演示联系人${index}`,
      owner: "张三",
      type: "电话",
      date: todayDateString(),
      summary: "确认近期需求并约定下一次沟通时间",
      status: "待处理",
    };
    setFollowUps((current) => [next, ...current]);
  };

  const toggleFollowUp = (id: string) => {
    setFollowUps((current) => current.map((item) => item.id === id ? { ...item, status: item.status === "已完成" ? "待处理" : "已完成" } : item));
  };

  const addContract = () => {
    const index = contracts.length + 1;
    const next: ContractRecord = {
      id: createId("contract"),
      number: `CRM-2026-DEMO${String(index).padStart(2, "0")}`,
      customer: "演示客户有限公司",
      amount: 150000,
      status: "草稿",
      startDate: "2026-10-01",
      endDate: "2027-09-30",
      owner: "张三",
    };
    setContracts((current) => [next, ...current]);
  };

  const addProduct = () => {
    const index = products.length + 1;
    const next: ProductRecord = {
      id: createId("product"),
      name: `演示产品 ${index}`,
      category: "增值服务",
      price: 36000,
      active: false,
      customers: 0,
    };
    setProducts((current) => [next, ...current]);
  };

  const toggleProduct = (id: string) => {
    setProducts((current) => current.map((item) => item.id === id ? { ...item, active: !item.active } : item));
  };

  const inviteMember = () => {
    const index = teamMembers.length + 1;
    const next: TeamMember = {
      id: createId("member"),
      name: `演示成员${index}`,
      role: "客户经理",
      department: "企业销售二组",
      email: `member${index}@example.demo`,
      customerCount: 0,
      status: "待加入",
    };
    setTeamMembers((current) => [next, ...current]);
  };

  const updateSettings = (patch: Partial<WorkspaceSettings>) => setSettings((current) => ({ ...current, ...patch }));
  const resetSettings = () => setSettings(defaultWorkspaceSettings);

  const resetModules = () => {
    setOpportunities(initialOpportunities);
    setFollowUps(initialFollowUps);
    setContracts(initialContracts);
    setProducts(initialProducts);
    setTeamMembers(initialTeamMembers);
    setSettings(defaultWorkspaceSettings);
  };

  return {
    opportunities,
    followUps,
    contracts,
    products,
    teamMembers,
    settings,
    addOpportunity,
    addFollowUp,
    toggleFollowUp,
    addContract,
    addProduct,
    toggleProduct,
    inviteMember,
    updateSettings,
    resetSettings,
    resetModules,
  };
}

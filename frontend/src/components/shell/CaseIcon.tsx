"use client";

import { BarChart3, BookOpen, Users } from "lucide-react";
import type { WorkspaceCaseId } from "@/cases/caseRegistry";

interface CaseIconProps {
  caseId: WorkspaceCaseId;
  size?: number;
}

export function CaseIcon({ caseId, size = 16 }: CaseIconProps) {
  const Icon = caseId === "customer-management-demo"
    ? Users
    : caseId === "analytics-dashboard-demo"
      ? BarChart3
      : BookOpen;

  return <Icon className="case-icon-svg" size={size} strokeWidth={2.2} aria-hidden="true" />;
}

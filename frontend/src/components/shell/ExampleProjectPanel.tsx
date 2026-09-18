"use client";

import { ArrowRight, Check, ChevronRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { getSelectableWorkspaceCaseDescriptors, type WorkspaceCaseDescriptor } from "@/cases/caseRegistry";
import type { WorkspaceCaseContext } from "@/types/workspace";
import { CaseIcon } from "./CaseIcon";

interface ExampleProjectPanelProps {
  caseContext: WorkspaceCaseContext;
  descriptors: readonly WorkspaceCaseDescriptor[];
  isForking: boolean;
  onFork: () => Promise<void>;
}

export function ExampleProjectPanel({ caseContext, descriptors, isForking, onFork }: ExampleProjectPanelProps) {
  const { descriptor } = caseContext;
  const otherCases = getSelectableWorkspaceCaseDescriptors(descriptors)
    .filter((item) => item.id !== descriptor.id);
  const unavailable = caseContext.files === undefined;

  return (
    <div className="example-project-panel">
      <div className="example-project-eyebrow"><span className="example-project-dot" />示例项目</div>
      <div className="example-project-title-row">
        <span className="example-project-mark"><CaseIcon caseId={descriptor.id} size={17} /></span>
        <div className="min-w-0">
          <h2>{descriptor.title}</h2>
          <p>{descriptor.subtitle}</p>
        </div>
        <span className="example-project-badge">示例</span>
      </div>
      <p className="example-project-description">{descriptor.description}</p>

      <div className="example-project-features">
        <h3>本示例包含</h3>
        <ul>
          {descriptor.features.map((feature) => (
            <li key={feature}><span><Check size={12} /></span>{feature}</li>
          ))}
        </ul>
      </div>

      <button type="button" className="example-project-cta" onClick={() => void onFork().catch(() => undefined)} disabled={isForking || unavailable}>
        <span><Sparkles size={16} />{isForking ? "正在创建项目…" : "基于此案例开始"}</span>
        <ArrowRight size={16} />
      </button>
      <p className="example-project-note">将创建一个独立项目，当前示例不会被修改。</p>

      <div className="example-project-divider" />
      <div className="other-cases-head"><h3>更多示例</h3><Link href="/workspace">查看全部 <ArrowRight size={12} /></Link></div>
      <div className="other-cases-list">
        {otherCases.map((item) => (
          <Link key={item.id} href={`/workspace?case=${item.id}`} className="other-case-link">
            <span className="other-case-icon"><CaseIcon caseId={item.id} size={15} /></span>
            <span><strong>{item.navigationTitle}</strong><small>{item.subtitle}</small></span>
            <ChevronRight size={14} />
          </Link>
        ))}
      </div>
    </div>
  );
}

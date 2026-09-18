"use client";

import { ArrowUpRight, ChevronRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { getSelectableWorkspaceCaseDescriptors, type WorkspaceCaseDescriptor } from "@/cases/caseRegistry";
import { CaseIcon } from "./CaseIcon";

interface CaseChooserPanelProps {
  descriptors: readonly WorkspaceCaseDescriptor[];
  onSuggestionSelect: (suggestion: string) => void;
}

const STARTER_PROMPTS = [
  "做一个支持搜索和状态筛选的客户管理后台",
  "做一个可按日期查看指标和趋势的数据分析看板",
  "做一个支持分类搜索和主题切换的个人博客",
];

export function CaseChooserPanel({ descriptors, onSuggestionSelect }: CaseChooserPanelProps) {
  const visibleCases = getSelectableWorkspaceCaseDescriptors(descriptors);

  return (
    <div className="case-chooser-panel">
      <div className="case-chooser-icon"><Sparkles size={17} /></div>
      <span className="case-chooser-eyebrow">PROMPTFORGE WORKSPACE</span>
      <h2>从一个真实案例开始</h2>
      <p>选择一个示例体验 PromptForge 的生成结果，也可以在下方直接描述你想创建的前端项目。</p>
      <div className="case-chooser-list">
        {visibleCases.map((item) => (
          <Link key={item.id} href={`/workspace?case=${item.id}`} className="case-chooser-item">
            <span className="case-chooser-item-mark"><CaseIcon caseId={item.id} size={16} /></span>
            <span className="min-w-0"><strong>{item.navigationTitle}</strong><small>{item.subtitle}</small></span>
            <ChevronRight size={15} />
          </Link>
        ))}
      </div>
      <Link href="/#hero-case" className="case-chooser-all">查看案例介绍 <ArrowUpRight size={13} /></Link>
      <div className="case-chooser-starters">
        <p>还没有修改，试试：</p>
        <div className="chat-suggestions">
          {STARTER_PROMPTS.map((suggestion) => (
            <button type="button" key={suggestion} onClick={() => onSuggestionSelect(suggestion)}>
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Check, GitPullRequest, Trash2 } from "lucide-react";
import type { CandidateState } from "@/types/candidate";
import { shortHash } from "@/lib/changeContract";

interface CandidatePanelProps {
  candidate: CandidateState;
  onApply: () => void;
  onDiscard: () => void;
  disabled: boolean;
}

export function CandidatePanel({ candidate, onApply, onDiscard, disabled }: CandidatePanelProps) {
  const [pathsExpanded, setPathsExpanded] = useState(false);
  const added = candidate.changes.filter((change) => change.operation === "add").length;
  const modified = candidate.changes.filter((change) => change.operation === "modify").length;
  const deleted = candidate.changes.filter((change) => change.operation === "delete").length;
  const knownResources = candidate.resources.filter((resource) => resource.hashStatus === "known").length;
  const conflicted = candidate.status === "conflict";
  const previewVerified = candidate.validation.preview === "pass";
  const canApply = candidate.validation.protocol === "pass" && candidate.validation.files === "pass" && previewVerified;
  return (
    <section className={`candidate-panel ${conflicted ? "candidate-panel-conflict" : ""}`} aria-label="候选修改">
      <div className="candidate-panel-head">
        <div className="candidate-panel-title"><GitPullRequest size={15} /><strong>{candidate.operation === "edit" ? "候选修改" : "候选生成"}</strong><span>{conflicted ? "基线冲突" : canApply ? "待应用" : "待验证"}</span></div>
        <button type="button" onClick={onDiscard} disabled={disabled} title="放弃候选"><Trash2 size={14} /> 放弃</button>
      </div>
      <p className="candidate-summary">{candidate.summary}</p>
      <div className="candidate-meta">
        <span>基线 {shortHash(candidate.baseHash)}</span>
        <span>{candidate.files ? Object.keys(candidate.files).length : 0} 个文件</span>
        <span>{candidate.resources.length} 项资源引用（{knownResources} 项已校验）</span>
        <span className="candidate-diff">+{added} / ~{modified} / -{deleted}</span>
      </div>
      <p className="candidate-validation">
        结构校验：通过 · 预览运行：{candidate.validation.preview === "not-verified" ? "待验证" : candidate.validation.preview === "pass" ? "通过" : "失败"}
      </p>
      <button
        type="button"
        className="candidate-paths-toggle"
        onClick={() => setPathsExpanded((expanded) => !expanded)}
        aria-expanded={pathsExpanded}
      >
        {pathsExpanded ? "收起变更路径" : "查看变更路径"}（{candidate.changes.length}）
      </button>
      {pathsExpanded && (
        <ul className="candidate-paths" aria-label="候选变更路径">
          {candidate.changes.map((change) => (
            <li key={`${change.operation}:${change.path}`}>
              <span>{change.operation === "add" ? "+" : change.operation === "modify" ? "~" : "-"}</span>
              <code>{change.path}</code>
            </li>
          ))}
        </ul>
      )}
      {candidate.conflictReason && <p className="candidate-conflict" role="alert">{candidate.conflictReason}</p>}
      <button type="button" className="candidate-apply" onClick={onApply} disabled={disabled || conflicted || !canApply}>
        <Check size={14} /> 应用修改
      </button>
    </section>
  );
}

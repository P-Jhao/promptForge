"use client";

import { useState } from "react";
import { Check, GitPullRequest, RotateCcw, Trash2 } from "lucide-react";
import type { CandidateState } from "@/types/candidate";
import { shortHash } from "@/lib/changeContract";
import { canApplyValidation, canAttemptRepair, layerStatusLabel } from "@/lib/validationReport";
import { REPAIR_LIMITS } from "@/constants/validation";

interface CandidatePanelProps {
  candidate: CandidateState;
  onApply: () => void;
  onRepair: () => void;
  onDiscard: () => void;
  disabled: boolean;
}

export function CandidatePanel({ candidate, onApply, onRepair, onDiscard, disabled }: CandidatePanelProps) {
  const [pathsExpanded, setPathsExpanded] = useState(false);
  const added = candidate.changes.filter((change) => change.operation === "add").length;
  const modified = candidate.changes.filter((change) => change.operation === "modify").length;
  const deleted = candidate.changes.filter((change) => change.operation === "delete").length;
  const knownResources = candidate.resources.filter((resource) => resource.hashStatus === "known").length;
  const conflicted = candidate.status === "conflict";
  const canApply = canApplyValidation(candidate.validation);
  const repairAvailable = !conflicted && canAttemptRepair(candidate.validation);
  return (
    <section className={`candidate-panel ${conflicted ? "candidate-panel-conflict" : ""}`} aria-label="候选修改">
      <div className="candidate-panel-head">
        <div className="candidate-panel-title"><GitPullRequest size={15} /><strong>{candidate.operation === "edit" ? "候选修改" : "候选生成"}</strong><span>{conflicted ? "基线冲突" : canApply ? "待应用" : "待验证"}</span></div>
        <button type="button" onClick={onDiscard} disabled={disabled} title="放弃候选"><Trash2 size={14} /> 放弃</button>
      </div>
      <p className="candidate-summary">{candidate.summary}</p>
      <div className="candidate-meta">
        <span>接受基线 {shortHash(candidate.baseHash)}</span>
        {candidate.modelBaseHash !== candidate.baseHash && <span>修复模型基线 {shortHash(candidate.modelBaseHash)}</span>}
        {candidate.sourceCandidateId && <span>来源候选 {candidate.sourceCandidateId}</span>}
        <span>{candidate.files ? Object.keys(candidate.files).length : 0} 个文件</span>
        <span>{candidate.resources.length} 项资源引用（{knownResources} 项已校验）</span>
        <span className="candidate-diff">+{added} / ~{modified} / -{deleted}</span>
      </div>
      <ul className="candidate-validation-layers" aria-label="分层校验结果">
        {candidate.validation.report.layers.map((layer) => (
          <li key={layer.id}>
            <span>{layer.id} {layer.label}</span>
            <strong>{layerStatusLabel(layer.status)}</strong>
            <small>{layer.summary}{layer.errorCategory ? `（${layer.errorCategory}）` : ""}</small>
          </li>
        ))}
      </ul>
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
      {repairAvailable && (
        <button type="button" className="candidate-repair" onClick={onRepair} disabled={disabled}>
          <RotateCcw size={14} /> 尝试修复（{candidate.validation.report.repairAttempts}/{REPAIR_LIMITS.maxAttempts}）
        </button>
      )}
      <button type="button" className="candidate-apply" onClick={onApply} disabled={disabled || conflicted || !canApply}>
        <Check size={14} /> 应用修改
      </button>
    </section>
  );
}

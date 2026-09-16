"use client";

import { AlertCircle, CheckCircle2, Clock3, Loader2, PauseCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useChatStore } from "@/store/chatStore";
import { NODE_TO_STEP_MAP, PHASE_INFO, STEP_DEFINITIONS } from "@/constants/chat";
import type { Phase, StepType } from "@/types/flow";

function formatElapsed(milliseconds: number | undefined): string {
  if (milliseconds === undefined) {
    return "计时中";
  }

  return `${(milliseconds / 1000).toFixed(1)} 秒`;
}

export function GenerationStatusPanel() {
  const generation = useChatStore((state) => state.generation);
  const candidate = useChatStore((state) => state.candidate);
  const currentFlow = useChatStore((state) => state.currentFlow);
  const phaseCompletion = useChatStore((state) => state.phaseCompletion);
  const [clock, setClock] = useState(() => Date.now());

  useEffect(() => {
    if (generation.status !== "running") return;
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [generation.status]);

  if (generation.status === "idle") {
    return null;
  }

  const phase = generation.currentPhase;
  const phaseProgress = phase === undefined ? undefined : phaseCompletion[phase];
  const isChatFlow = currentFlow === "chat";
  const statusCopy = {
    running: isChatFlow ? "正在回复" : "正在生成",
    success: candidate === null
      ? isChatFlow ? "回复完成" : "生成完成"
      : candidate.validation.preview === "pass" ? "候选待应用" : "候选待校验",
    error: isChatFlow ? "回复失败" : "生成失败",
    cancelled: "已取消",
  }[generation.status];
  const StatusIcon = generation.status === "running"
    ? Loader2
    : generation.status === "success"
      ? CheckCircle2
      : generation.status === "cancelled"
        ? PauseCircle
        : AlertCircle;
  const stepTitle = generation.currentStep
    ? STEP_DEFINITIONS[generation.currentStep]?.title ?? generation.currentStep
    : undefined;
  const phaseTitle = phase
    ? PHASE_INFO[phase as Phase]?.title ?? phase
    : undefined;
  const nextStepTitle = generation.nextStep
    ? STEP_DEFINITIONS[generation.nextStep as StepType]?.title ?? generation.nextStep
    : undefined;
  const failedStepType = generation.failedNode === undefined
    ? NODE_TO_STEP_MAP[generation.failedStep ?? ""]
    : NODE_TO_STEP_MAP[generation.failedNode];
  const failedStepTitle = failedStepType
    ? STEP_DEFINITIONS[failedStepType]?.title ?? "未知步骤"
    : generation.failedStep;
  const positionTitle = generation.status === "running" || generation.status === "cancelled"
    ? stepTitle
    : undefined;
  const positionLabel = generation.status === "cancelled" ? "停止位置" : "当前";
  const elapsed = generation.elapsedMs ?? (
    generation.startedAt === undefined ? undefined : Math.max(0, clock - generation.startedAt)
  );
  const timingEntries = Object.entries(generation.stageTimings);

  return (
    <div className="generation-status" role="status" aria-live="polite">
      <div className="generation-status-head">
        <div className="generation-status-title">
          <StatusIcon className={generation.status === "running" ? "animate-spin" : ""} size={15} />
          <strong>{statusCopy}</strong>
          {generation.mode && <span>{generation.mode === "mock" ? "示例体验" : "真实模型"}</span>}
          {generation.modeForced && <em>服务端强制</em>}
        </div>
        <span className="generation-time"><Clock3 size={13} />{formatElapsed(elapsed)}</span>
      </div>
      {positionTitle && (
        <p className="generation-current">{positionLabel}：{positionTitle}{phaseTitle ? ` · ${phaseTitle}` : ""}</p>
      )}
      {phaseProgress && (
        <p className="generation-progress">阶段进度：已接收 {phaseProgress.completed}/{phaseProgress.total} 个步骤</p>
      )}
      {generation.completedSteps.length > 0 && (
        <p className="generation-progress">已完成：{generation.completedSteps.length} 个步骤</p>
      )}
      {failedStepTitle && <p className="generation-error">失败位置：{failedStepTitle}</p>}
      {generation.error && <p className="generation-error">{generation.error}</p>}
      {generation.status === "cancelled" && <p className="generation-help">已请求中断，尚在进行的模型调用可能继续运行至结束。</p>}
      {generation.status === "error" && (
        <p className="generation-help">
          {generation.preservedResult ? "已保留收到的文本和最近一次完整结果；" : "本次尚未保存完整结果；"}
          重试会重新执行本次原始请求。
        </p>
      )}
      {generation.status === "running" && nextStepTitle && <p className="generation-next">下一步：{nextStepTitle}</p>}
      {(timingEntries.length > 0 || generation.failedStep) && (
        <details className="generation-diagnostics">
          <summary>运行诊断</summary>
          {generation.failedNode && <p>服务端节点：{generation.failedNode}</p>}
          {timingEntries.length > 0 && (
            <p>客户端接收间隔（含网络）：{timingEntries.map(([key, value]) => `${key} ${(value / 1000).toFixed(1)} 秒`).join(" · ")}</p>
          )}
        </details>
      )}
    </div>
  );
}

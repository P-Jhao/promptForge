import { createHash } from "node:crypto";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { inspectRealRun, isCompleteRealAttempt } from "./realRunReadiness.mjs";

export const SAMPLE_POOLS = Object.freeze([
  "REAL-EVAL",
  "PROTOCOL-FIXTURE",
  "FIXED-INTERACTION",
]);

export const EVAL_PROMPTS = Object.freeze({
  "EVAL-01": "做一个 React/TypeScript 任务看板，展示任务标题、描述、负责人、截止日期和优先级字段；按待办、进行中、已完成三列展示任务；用户可以新增任务、编辑任务、切换任务状态，并用关键词筛选任务。请保留清晰的看板标题、空状态和表单校验。初始版本只需要展示优先级字段，不要求提供按优先级筛选。",
  "EVAL-02": "在当前任务看板上增加按优先级筛选。请以当前编辑文件为基线，保留看板标题、已有任务新增、编辑任务、状态切换、关键词筛选、源码中的固定初始任务数据（不要求通用沙盒内存恢复）和优先级字段；不要删除或重建已有入口和功能。",
});

export const EVAL_SCENARIOS = Object.freeze({
  "EVAL-01": { samplePool: "REAL-EVAL", kind: "real-generation" },
  "EVAL-02": { samplePool: "REAL-EVAL", kind: "real-edit" },
  "EVAL-03": { samplePool: "PROTOCOL-FIXTURE", kind: "failure-fixture" },
});

const ENVIRONMENT_CATEGORIES = new Set([
  "environment", "network", "external-timeout", "timeout", "http", "template", "dependency",
]);

export function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function hashFileMap(files) {
  return sha256(stableStringify(canonicalFiles(files)));
}

export function hashEditBase(files, resources = []) {
  if (!Array.isArray(resources)) throw new Error("资源快照必须是数组");
  const normalizedFiles = canonicalFiles(files);
  const normalizedResources = canonicalResources(resources, normalizedFiles);
  return sha256(stableStringify({ files: normalizedFiles, resources: normalizedResources }));
}

export function promptDescriptor(scenarioId) {
  const prompt = EVAL_PROMPTS[scenarioId];
  if (prompt === undefined) throw new Error(`未知评测场景：${scenarioId}`);
  return { scenarioId, sha256: sha256(prompt), characters: prompt.length };
}

export function classifyAttempt(attempt) {
  const terminalCategory = typeof attempt?.terminal?.category === "string"
    ? attempt.terminal.category
    : undefined;
  const status = attempt?.status;
  if (status === "success" && attempt?.modeEvidence?.mode === "real" && attempt.modeEvidence.forced === false) {
    return isCompleteRealAttempt(attempt) ? "raw-success" : "not-verified";
  }
  if ((attempt?.samplePool === "PROTOCOL-FIXTURE" || attempt?.samplePool === "FIXED-INTERACTION") && status === "success") return "raw-success";
  if (status === "interrupted" || terminalCategory === "interrupted" || terminalCategory === "cancelled") return "cancelled";
  if (terminalCategory !== undefined && ENVIRONMENT_CATEGORIES.has(terminalCategory)) return "environment-blocked";
  if (status === "not-verified" || terminalCategory === undefined) return "not-verified";
  return "failed";
}

export function durationDescriptor(attempt) {
  const startedAt = Date.parse(typeof attempt?.startedAt === "string" ? attempt.startedAt : "");
  const endedAt = Date.parse(typeof attempt?.endedAt === "string" ? attempt.endedAt : "");
  if (!Number.isFinite(startedAt) || !Number.isFinite(endedAt) || endedAt < startedAt) {
    return { durationMs: null, source: "not-verified" };
  }
  return { durationMs: endedAt - startedAt, source: "recorder startedAt→endedAt wall-clock" };
}

export function summarizeAttempts(attempts, samplePool) {
  if (!SAMPLE_POOLS.includes(samplePool)) throw new Error(`未知样本池：${samplePool}`);
  const selected = attempts.filter((attempt) => attempt.samplePool === samplePool);
  const summary = {
    samplePool,
    N_all: selected.length,
    N_cancelled: 0,
    N_env_blocked: 0,
    N_not_verified: 0,
    N_raw_success: 0,
    N_repair_success: 0,
    durations: { count: 0, totalMs: 0, minMs: null, maxMs: null, meanMs: null, source: "recorder startedAt→endedAt wall-clock" },
    failureCategories: {},
  };
  for (const attempt of selected) {
    const classification = classifyAttempt(attempt);
    if (classification === "raw-success") summary.N_raw_success += 1;
    if (attempt.repairSuccess === true) summary.N_repair_success += 1;
    if (classification === "cancelled") summary.N_cancelled += 1;
    if (classification === "environment-blocked") summary.N_env_blocked += 1;
    if (classification === "not-verified") summary.N_not_verified += 1;
    const category = typeof attempt?.terminal?.category === "string" ? attempt.terminal.category : classification;
    if (classification !== "raw-success") summary.failureCategories[category] = (summary.failureCategories[category] ?? 0) + 1;
    const duration = durationDescriptor(attempt);
    if (duration.durationMs !== null) {
      summary.durations.count += 1;
      summary.durations.totalMs += duration.durationMs;
      summary.durations.minMs = summary.durations.minMs === null ? duration.durationMs : Math.min(summary.durations.minMs, duration.durationMs);
      summary.durations.maxMs = summary.durations.maxMs === null ? duration.durationMs : Math.max(summary.durations.maxMs, duration.durationMs);
    }
  }
  if (summary.durations.count > 0) summary.durations.meanMs = summary.durations.totalMs / summary.durations.count;
  summary.rawSuccessRate = summary.N_all === 0 || summary.N_not_verified === summary.N_all
    ? null
    : summary.N_raw_success / summary.N_all;
  summary.rawSuccessRateStatus = summary.rawSuccessRate === null ? "not-verified" : "measured";
  return summary;
}

export async function readRunSummaries(runsRoot) {
  const entries = await safeDirectories(runsRoot);
  const summaries = [];
  for (const entry of entries) {
    const summary = await readJson(path.join(runsRoot, entry, "record.json"));
    if (summary !== undefined) summaries.push(summary);
  }
  return summaries;
}

export async function readManualCorrections(runsRoot) {
  const entries = await safeDirectories(runsRoot);
  const corrections = [];
  for (const entry of entries) {
    const record = await readJson(path.join(runsRoot, entry, "manual-corrections.json"));
    if (Array.isArray(record?.corrections)) corrections.push(...record.corrections.map((item) => ({ ...item, runId: entry })));
  }
  return corrections;
}

export function flattenRunAttempts(summaries) {
  return summaries.flatMap((summary) => {
    if (!Array.isArray(summary.attempts)) return [];
    return summary.attempts.map((attempt) => ({
      ...attempt,
      runId: typeof summary.runId === "string" ? summary.runId : undefined,
      samplePool: attempt.samplePool ?? summary.samplePool ?? "UNCLASSIFIED",
      scenarioId: attempt.scenarioId ?? summary.scenarioId,
    }));
  });
}

export async function evaluateCaseProvenance(caseDir, runsRoot) {
  const result = {
    ready: false,
    status: "NOT_READY",
    reasonCodes: [],
    caseId: null,
    required: ["caseId", "entry", "files", "resources", "manifest", "provenance"],
  };
  if (caseDir === undefined || caseDir.length === 0) {
    result.reasonCodes.push("CASE_DIRECTORY_NOT_PROVIDED");
    return result;
  }
  const absoluteCaseDir = path.resolve(caseDir);
  if (absoluteCaseDir.split(path.sep).some((segment) => ["novel", "generated"].includes(segment.toLowerCase()))) {
    result.reasonCodes.push("CASE_MUST_BE_INDEPENDENT");
    return result;
  }
  const descriptor = await readJson(path.join(absoluteCaseDir, "case.json"));
  if (!isRecord(descriptor)) {
    result.reasonCodes.push("CASE_DESCRIPTOR_MISSING");
    return result;
  }
  result.caseId = typeof descriptor.caseId === "string" ? descriptor.caseId : null;
  if (result.caseId === null || result.caseId.toLowerCase().includes("novel")) result.reasonCodes.push("CASE_ID_INVALID");
  for (const key of result.required.slice(1)) {
    if (typeof descriptor[key] !== "string" || descriptor[key].length === 0) result.reasonCodes.push(`CASE_${key.toUpperCase()}_MISSING`);
  }
  if (result.reasonCodes.length > 0) return result;
  const pathEntries = ["entry", "files", "resources", "manifest", "provenance"].map((key) => [key, descriptor[key]]);
  const resolvedPaths = new Map();
  for (const [key, relativePath] of pathEntries) {
    const resolved = resolveCasePath(absoluteCaseDir, relativePath);
    if (resolved === undefined) result.reasonCodes.push(`CASE_PATH_INVALID:${key}`);
    else {
      resolvedPaths.set(key, resolved);
      if (!(await exists(resolved))) result.reasonCodes.push(`CASE_PATH_MISSING:${relativePath}`);
    }
  }
  if (result.reasonCodes.length > 0) return result;
  const manifest = await readJson(resolvedPaths.get("manifest"));
  const provenance = await readJson(resolvedPaths.get("provenance"));
  if (!isRecord(manifest) || manifest.caseId !== result.caseId || !Array.isArray(manifest.resources)) result.reasonCodes.push("MANIFEST_INVALID");
  if (!isRecord(provenance) || !Array.isArray(provenance.realRunIds) || !Array.isArray(provenance.evidence)) result.reasonCodes.push("PROVENANCE_INVALID");
  if (result.reasonCodes.length > 0) return result;
  const summaries = await readRunSummaries(runsRoot);
  const summariesByRunId = new Map(summaries.map((summary) => [summary.runId, summary]));
  for (const runId of provenance.realRunIds) {
    const summary = summariesByRunId.get(runId);
    const readiness = await inspectRealRun(summary, runsRoot);
    if (!readiness.ready) result.reasonCodes.push(`${readiness.reason}:${runId}`);
  }
  for (const scenarioId of ["EVAL-01", "EVAL-02"]) {
    const promptHash = promptDescriptor(scenarioId).sha256;
    const matched = provenance.realRunIds.some((runId) => {
      const latest = summariesByRunId.get(runId)?.latest;
      return latest?.scenarioId === scenarioId && latest.request?.promptSha256 === promptHash;
    });
    if (!matched) result.reasonCodes.push(`REAL_RUN_SCENARIO_NOT_READY:${scenarioId}`);
  }
  const evidenceByScenario = new Map(provenance.evidence.filter(isRecord).map((item) => [item.scenarioId, item]));
  for (const scenarioId of ["EVAL-01", "EVAL-02", "EVAL-03"]) {
    const evidence = evidenceByScenario.get(scenarioId);
    if (evidence?.status !== "pass") result.reasonCodes.push(`EVIDENCE_NOT_PASS:${scenarioId}`);
    else if (resolveCasePath(absoluteCaseDir, evidence.evidencePath) === undefined || !(await exists(resolveCasePath(absoluteCaseDir, evidence.evidencePath)))) result.reasonCodes.push(`EVIDENCE_SOURCE_MISSING:${scenarioId}`);
  }
  if (result.reasonCodes.length === 0) {
    result.ready = true;
    result.status = "READY";
  }
  return result;
}

export function buildEvaluationReport({ attempts, caseProvenance, interactionReport, manualCorrections = [], generatedAt = new Date().toISOString() }) {
  const fixedInteractionAttempts = interactionAttempts(interactionReport);
  const allAttempts = [...attempts, ...fixedInteractionAttempts];
  const pools = Object.fromEntries(SAMPLE_POOLS.map((samplePool) => [samplePool, summarizeAttempts(allAttempts, samplePool)]));
  return {
    schemaVersion: 1,
    status: caseProvenance.status,
    generatedAt,
    samplePools: pools,
    prompts: [promptDescriptor("EVAL-01"), promptDescriptor("EVAL-02")],
    attempts: allAttempts,
    caseProvenance,
    unexecuted: caseProvenance.ready ? [] : ["independent-case-promotion", "EVAL-01-real-run", "EVAL-02-real-run", "EVAL-03-fixed-interaction"],
    manualCorrections,
  };
}

function interactionAttempts(report) {
  if (!isRecord(report) || !Array.isArray(report.assertions)) return [];
  return report.assertions.map((assertion) => ({
    scenarioId: "EVAL-03",
    samplePool: "FIXED-INTERACTION",
    attempt: assertion.id,
    status: assertion.status === "pass" ? "success" : assertion.status === "not-verified" ? "not-verified" : "failed",
    terminal: assertion.status === "pass" ? undefined : { category: assertion.status },
    startedAt: undefined,
    endedAt: undefined,
  }));
}

async function safeDirectories(directory) {
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

async function exists(filePath) {
  try { await access(filePath); return true; } catch { return false; }
}

async function readJson(filePath) {
  try { return JSON.parse(await readFile(filePath, "utf8")); }
  catch (error) { if (error?.code === "ENOENT") return undefined; throw error; }
}

function isRecord(value) { return typeof value === "object" && value !== null && !Array.isArray(value); }

function canonicalFiles(files) {
  if (!isRecord(files) || Object.keys(files).length === 0) throw new Error("文件快照不能为空");
  return Object.fromEntries(Object.entries(files).map(([filePath, content]) => {
    const parts = filePath.startsWith("/") ? filePath.slice(1).split("/") : [];
    if (!filePath.startsWith("/") || filePath.includes("\\") || filePath.includes("//") || parts.some((part) => part.length === 0 || part === "." || part === "..") || typeof content !== "string" || content.length === 0) throw new Error(`文件快照无效：${filePath}`);
    return [filePath, content];
  }));
}

function canonicalResources(resources, files) {
  return resources.map((resource) => {
    if (!isRecord(resource)) throw new Error("资源引用无效");
    const fields = ["id", "kind", "hostPath", "sandpackPath", "exportPath", "contentType"];
    if (!fields.every((field) => typeof resource[field] === "string" && resource[field].length > 0)) throw new Error("资源引用字段无效");
    const content = files[resource.sandpackPath];
    return {
      id: resource.id, kind: resource.kind, hostPath: resource.hostPath, sandpackPath: resource.sandpackPath,
      exportPath: resource.exportPath, contentType: resource.contentType,
      contentHash: content === undefined ? null : sha256(content), hashStatus: content === undefined ? "unknown" : "known",
    };
  }).sort((left, right) => `${left.id}\u0000${left.sandpackPath}\u0000${left.exportPath}`.localeCompare(`${right.id}\u0000${right.sandpackPath}\u0000${right.exportPath}`));
}

function resolveCasePath(caseDir, relativePath) {
  if (typeof relativePath !== "string" || relativePath.length === 0 || path.isAbsolute(relativePath) || relativePath.includes("\\") || relativePath.split("/").includes("..")) return undefined;
  const resolved = path.resolve(caseDir, relativePath);
  return resolved === caseDir || resolved.startsWith(`${caseDir}${path.sep}`) ? resolved : undefined;
}

function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
}

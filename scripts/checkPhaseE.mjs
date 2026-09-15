#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createAttempt } from "./lib/realRunRecorder.mjs";
import { inspectRealRun } from "./lib/realRunReadiness.mjs";
import { classifyAssertionFailure } from "./lib/taskBoardAssertion.mjs";
import {
  EVAL_PROMPTS,
  buildEvaluationReport,
  evaluateCaseProvenance,
  hashEditBase,
  promptDescriptor,
  sha256,
  summarizeAttempts,
} from "./lib/taskBoardEvaluation.mjs";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tempRoot = await mkdtemp(path.join(os.tmpdir(), "promptforge-phase-e-"));

try {
  const promptHashes = [promptDescriptor("EVAL-01"), promptDescriptor("EVAL-02")];
  assert.equal(promptHashes[0].sha256, sha256(EVAL_PROMPTS["EVAL-01"]));
  assert.match(EVAL_PROMPTS["EVAL-02"], /按优先级筛选/);
  assert.match(EVAL_PROMPTS["EVAL-02"], /保留看板标题/);
  assert.equal(hashEditBase({ "/src/App.tsx": "export default function App() { return null; }" }, []), sha256('{"files":{"/src/App.tsx":"export default function App() { return null; }"},"resources":[]}'));
  assert.throws(() => hashEditBase({ "/src/../App.tsx": "invalid" }, []), /文件快照无效/);
  const functionalFailure = classifyAssertionFailure(new Error("新增任务标题未出现在列表中"));
  assert.equal(functionalFailure.status, "fail");
  assert.match(functionalFailure.evidence, /新增任务标题未出现在列表中/);
  assert.notEqual(functionalFailure.status, "pass");
  const environmentNotVerified = classifyAssertionFailure(new Error("未配置真实页面"), true);
  assert.equal(environmentNotVerified.status, "not-verified");
  assert.notEqual(environmentNotVerified.status, "pass");

  const fixtureAttempts = [
    attempt("REAL-EVAL", "success", "EVAL-01", { real: true }),
    attempt("REAL-EVAL", "interrupted", "EVAL-01", { category: "interrupted" }),
    attempt("REAL-EVAL", "failed", "EVAL-02", { category: "network" }),
    attempt("REAL-EVAL", "not-verified", "EVAL-02"),
    attempt("PROTOCOL-FIXTURE", "success", "EVAL-03", { fixture: true, repairSuccess: true }),
    attempt("FIXED-INTERACTION", "not-verified", "EVAL-03"),
  ];
  const realStats = summarizeAttempts(fixtureAttempts, "REAL-EVAL");
  assert.deepEqual({ N_all: realStats.N_all, N_cancelled: realStats.N_cancelled, N_env_blocked: realStats.N_env_blocked, N_not_verified: realStats.N_not_verified, N_raw_success: realStats.N_raw_success }, { N_all: 4, N_cancelled: 1, N_env_blocked: 1, N_not_verified: 1, N_raw_success: 1 });
  assert.equal(summarizeAttempts(fixtureAttempts, "PROTOCOL-FIXTURE").N_repair_success, 1);
  assert.equal(summarizeAttempts(fixtureAttempts, "FIXED-INTERACTION").N_raw_success, 0);
  assert.equal(summarizeAttempts(fixtureAttempts, "FIXED-INTERACTION").rawSuccessRate, null);

  const reuseRoot = path.join(tempRoot, "reuse-runs");
  const reuseRunId = "reuse-success-fixture";
  await mkdir(path.join(reuseRoot, reuseRunId), { recursive: true });
  await writeFile(path.join(reuseRoot, reuseRunId, "record.json"), JSON.stringify({
    status: "success",
    runId: reuseRunId,
    latest: { scenarioId: "EVAL-01", request: { promptSha256: sha256(EVAL_PROMPTS["EVAL-01"]) } },
  }));
  const reused = await createAttempt({
    outputRoot: reuseRoot,
    runId: reuseRunId,
    request: { prompt: EVAL_PROMPTS["EVAL-01"], baseUrl: "http://fixture", body: { mockConfig: { global: false } } },
    configSummary: {},
    metadata: { scenarioId: "EVAL-01", samplePool: "REAL-EVAL" },
  });
  assert.equal(reused.reused, true);

  const completeRunRoot = path.join(tempRoot, "complete-runs");
  const completeRunId = "complete-real-fixture";
  const completeAttemptDir = path.join(completeRunRoot, completeRunId, "attempt-001");
  await mkdir(completeAttemptDir, { recursive: true });
  const completeFilesPath = path.join(completeAttemptDir, "files.json");
  await writeFile(completeFilesPath, JSON.stringify({ "src/App.tsx": "export default function App() { return null; }" }));
  const completeLatest = {
    attempt: 1, status: "success", samplePool: "REAL-EVAL", scenarioId: "EVAL-01",
    modeEvidence: { mode: "real", forced: false }, eventTypes: [{ type: "mode" }, { type: "files" }, { type: "done" }],
    fileCount: 1, filesPath: path.relative(ROOT_DIR, completeFilesPath),
  };
  const completeSummary = { status: "success", runId: completeRunId, latest: completeLatest };
  assert.equal((await inspectRealRun(completeSummary, completeRunRoot)).ready, true);
  assert.equal((await inspectRealRun({ ...completeSummary, latest: { ...completeLatest, eventTypes: [{ type: "mode" }, { type: "files" }] } }, completeRunRoot)).reason, "REAL_RUN_DONE_MISSING");
  assert.equal((await inspectRealRun({ ...completeSummary, latest: { ...completeLatest, filesPath: "missing-files.json" } }, completeRunRoot)).reason, "REAL_RUN_FILES_MISSING");

  const caseDir = path.join(tempRoot, "task-board-case");
  await mkdir(path.join(caseDir, "src"), { recursive: true });
  await mkdir(path.join(caseDir, "resources"), { recursive: true });
  await writeFile(path.join(caseDir, "src/App.tsx"), "export default function App() { return null; }");
  await writeFile(path.join(caseDir, "manifest.json"), JSON.stringify({ caseId: "task-board-real-v1", resources: [] }));
  await writeFile(path.join(caseDir, "provenance.json"), JSON.stringify({ realRunIds: ["missing-real-run"], evidence: [
    { scenarioId: "EVAL-01", status: "pass" }, { scenarioId: "EVAL-02", status: "pass" }, { scenarioId: "EVAL-03", status: "pass" },
  ] }));
  await writeFile(path.join(caseDir, "case.json"), JSON.stringify({
    caseId: "task-board-real-v1", entry: "src/App.tsx", files: "src", resources: "resources", manifest: "manifest.json", provenance: "provenance.json",
  }));
  const rejectedProvenance = await evaluateCaseProvenance(caseDir, reuseRoot);
  assert.equal(rejectedProvenance.status, "NOT_READY");
  assert.ok(rejectedProvenance.reasonCodes.some((reason) => reason.startsWith("REAL_RUN_NOT_SUCCESS:")));
  const generatedCase = path.join(tempRoot, "generated");
  await mkdir(generatedCase, { recursive: true });
  const generatedRejection = await evaluateCaseProvenance(generatedCase, reuseRoot);
  assert.ok(generatedRejection.reasonCodes.includes("CASE_MUST_BE_INDEPENDENT"));

  const taskBoard = runTaskBoardCheck();
  const report = buildEvaluationReport({
    attempts: [],
    caseProvenance: await evaluateCaseProvenance(path.join(tempRoot, "missing-case"), reuseRoot),
    interactionReport: taskBoard,
  });
  assert.equal(report.status, "NOT_READY");
  assert.equal(report.samplePools["REAL-EVAL"].N_all, 0);
  assert.equal(report.samplePools["REAL-EVAL"].rawSuccessRate, null);
  assert.equal(report.samplePools["FIXED-INTERACTION"].N_not_verified, taskBoard.assertions.length);
  assert.equal(report.samplePools["PROTOCOL-FIXTURE"].N_all, 0);

  console.log(JSON.stringify({
    status: report.status,
    prompts: promptHashes,
    samplePools: report.samplePools,
    checks: {
      eval02KeepsEval01: true,
      successfulRunReused: reused.reused,
      missingProvenanceRejected: true,
      noRealSuccessClaim: report.samplePools["REAL-EVAL"].rawSuccessRate === null,
    },
    taskBoard,
    unexecuted: report.unexecuted,
  }, null, 2));
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}

function attempt(samplePool, status, scenarioId, options = {}) {
  const start = "2026-09-16T00:00:00.000Z";
  const end = "2026-09-16T00:00:00.250Z";
  return {
    samplePool, scenarioId, status, attempt: `${scenarioId}-${status}`, startedAt: start, endedAt: end,
    modeEvidence: options.real ? { mode: "real", forced: false } : undefined,
    eventTypes: options.real ? ["mode", "files", "done"] : undefined,
    fileCount: options.real ? 1 : 0,
    filesPath: options.real ? "fixture-files.json" : undefined,
    fixture: options.fixture === true,
    repairSuccess: options.repairSuccess === true,
    terminal: options.category === undefined ? undefined : { category: options.category },
  };
}

function runTaskBoardCheck() {
  const result = spawnSync(process.execPath, [path.join(ROOT_DIR, "scripts/checkTaskBoard.mjs")], {
    cwd: ROOT_DIR, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
  });
  assert.equal(result.status, 0, `固定任务板检查失败：${result.stderr}`);
  const parsed = JSON.parse(result.stdout);
  assert.ok(Array.isArray(parsed.assertions));
  if (parsed.environment.url === null || parsed.environment.url.length === 0) {
    assert.equal(parsed.assertions.some((item) => item.status === "pass"), false);
  }
  return parsed;
}

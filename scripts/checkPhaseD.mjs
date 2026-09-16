#!/usr/bin/env node

import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { assertPreviewDiagnostics } from "./lib/previewDiagnosticsFixture.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const typescript = require(path.join(root, "frontend/node_modules/typescript"));
const constants = loadTsModule(path.join(root, "frontend/src/constants/validation.ts")).exports;
const validation = loadTsModule(
  path.join(root, "frontend/src/lib/validationReport.ts"),
  { "@/constants/validation": constants },
).exports;
const previewDiagnostics = loadTsModule(
  path.join(root, "frontend/src/components/preview/previewDiagnosticsState.ts"),
).exports;
const serialization = loadTsModule(path.join(root, "frontend/src/lib/projectSerialization.ts")).exports;
const frontendContract = loadTsModule(path.join(root, "frontend/src/lib/changeContract.ts"), {
  "@/constants/validation": constants,
}).exports;

const initial = validation.createCandidateValidation("candidate-fixture", "run-fixture");
assert.equal(initial.report.layers.length, 6);
assert.deepEqual(initial.report.layers.map((layer) => layer.id), ["L0", "L1", "L2", "L3", "L4", "L5"]);
assert.equal(initial.report.overall, "not-verified");
assert.equal(validation.canApplyValidation(initial), false);

assertPreviewDiagnostics(previewDiagnostics);

const ready = validation.updateValidationLayer(
  validation.updateValidationLayer(initial, "L2", "pass", "done + app-mounted", "sandpack:done;bridge:app-mounted"),
  "L3",
  "pass",
  "固定功能已执行",
  "fixture:task-board",
);
assert.equal(ready.report.overall, "pass");
assert.equal(validation.canApplyValidation(ready), true);
assert.equal(ready.report.layers.find((layer) => layer.id === "L3").status, "pass");
const runStartedAt = Date.now();
const persistedDraft = serialization.createProjectDraft({
  projectId: "project-validation-fixture",
  projectName: "校验 fixture",
  createdAt: runStartedAt,
  workspaceId: "workspace-validation-fixture",
  currentVersion: 0,
  versions: [],
  messages: [],
  files: { "/App.tsx": { code: "export default function App() { return null; }" } },
  generation: {
    status: "success",
    runId: ready.report.runId,
    validationReport: ready.report,
    startedAt: runStartedAt,
    elapsedMs: 20,
    completedSteps: [],
    stageTimings: {},
    preservedResult: false,
  },
});
assert.equal(persistedDraft.run?.runId, ready.report.runId);
assert.equal(persistedDraft.run?.validationReport?.candidateId, ready.report.candidateId);
const pendingRepair = validation.createCandidateValidation("candidate-repair-fixture", "run-repair-fixture", "pass", "pass", "not-verified", {
  candidateId: "candidate-fixture",
  attempt: 1,
  runId: "repair-fixture-pass",
  startedAt: runStartedAt,
  errorSignature: "runtime:fixture",
  previousHistory: [],
});
const repaired = validation.updateValidationLayer(pendingRepair, "L2", "pass", "done + app-mounted", "repair:revalidated");
assert.equal(repaired.report.layers.find((layer) => layer.id === "L5").status, "pass");

const repairBaseFiles = {
  "/src/App.tsx": "export default function App() { return <main>Original</main>; }",
  "/src/keep.ts": "export const keep = true;",
};
const repairResources = [{
  id: "fixture-style",
  kind: "stylesheet",
  hostPath: "/style.css",
  sandpackPath: "/src/style.css",
  exportPath: "src/style.css",
  contentType: "text/css",
  contentHash: null,
  hashStatus: "unknown",
}];
const repairAcceptedHash = await frontendContract.hashEditBase(repairBaseFiles, repairResources);
const sourceCandidateFiles = {
  ...repairBaseFiles,
  "/src/App.tsx": "export default function App() { return <main>Candidate</main>; }",
};
const sourceResources = await frontendContract.hashResourceReferences(sourceCandidateFiles, repairResources);
const repairedFiles = {
  ...sourceCandidateFiles,
  "/src/App.tsx": "export default function App() { return <main>Repaired</main>; }",
};
const repairedResources = await frontendContract.hashResourceReferences(repairedFiles, sourceResources);
const repairedModelHash = await frontendContract.hashEditBase(sourceCandidateFiles, sourceResources);
const repairPayload = {
  candidateId: "candidate-repair-base-fixture",
  runId: "run-repair-base-fixture",
  operation: "edit",
  projectId: "project-repair-fixture",
  baseVersionId: null,
  baseHash: repairedModelHash,
  acceptanceBaseHash: repairAcceptedHash,
  files: repairedFiles,
  resources: repairedResources,
  changes: frontendContract.summarizeFileChanges(sourceCandidateFiles, repairedFiles),
  summary: "repair fixture",
  sourceCandidateId: "candidate-source-fixture",
  sourceBaseHash: repairAcceptedHash,
};
const repairRequestBase = {
  projectId: "project-repair-fixture",
  versionId: null,
  hash: repairedModelHash,
  files: sourceCandidateFiles,
  resources: sourceResources,
  sourceCandidateId: "candidate-source-fixture",
  sourceBaseHash: repairAcceptedHash,
};
const repairedCandidate = await frontendContract.candidateEventToState(
  repairPayload,
  "repair fixture",
  "assistant-repair-fixture",
  repairRequestBase,
);
assert.equal(repairedCandidate.baseHash, repairAcceptedHash, "修复候选必须继承原接受基线");
assert.equal(repairedCandidate.modelBaseHash, repairedModelHash, "修复候选必须保留本轮模型基线");
assert.equal(repairedCandidate.sourceCandidateId, "candidate-source-fixture");
assert.equal(repairedCandidate.sourceBaseHash, repairAcceptedHash);
assert.equal(
  await frontendContract.hashEditBase(repairBaseFiles, repairedCandidate.resources),
  repairedCandidate.baseHash,
  "未变化原工作副本应通过应用前 hash 门槛",
);
assert.notEqual(repairedCandidate.baseHash, repairedCandidate.modelBaseHash, "两类基线必须可区分");
await assert.rejects(
  () => frontendContract.validateCandidateEventAgainstBase(
    { ...repairPayload, acceptanceBaseHash: repairedModelHash },
    repairRequestBase,
  ),
  /外部接受基线/,
);
await assert.rejects(
  () => frontendContract.validateCandidateEventAgainstBase(
    { ...repairPayload, sourceBaseHash: undefined },
    repairRequestBase,
  ),
  /来源元数据不完整/,
);

const runtimeFailure = validation.updateValidationLayer(
  initial,
  "L2",
  "fail",
  "应用抛出运行时错误",
  "bridge:runtime-error",
  "runtime",
);
assert.equal(runtimeFailure.report.overall, "fail");
assert.equal(validation.canApplyValidation(runtimeFailure), false);
assert.equal(validation.repairErrorSignature(runtimeFailure), "runtime:应用抛出运行时错误:bridge:runtime-error");
assert.equal(validation.canAttemptRepair(runtimeFailure), true);

const duplicateAttempt = {
  attempt: 1,
  runId: "repair-fixture-1",
  status: "fail",
  durationMs: 15,
  errorSignature: validation.repairErrorSignature(runtimeFailure),
};
const repeated = {
  ...runtimeFailure,
  report: {
    ...runtimeFailure.report,
    repairAttempts: 1,
    repairDurationMs: 15,
    repairHistory: [duplicateAttempt],
  },
};
assert.equal(validation.canAttemptRepair(repeated), false);
assert.equal(validation.canAttemptRepair({
  ...runtimeFailure,
  report: { ...runtimeFailure.report, repairAttempts: constants.REPAIR_LIMITS.maxAttempts },
}), false);
assert.equal(validation.canAttemptRepair({
  ...runtimeFailure,
  report: { ...runtimeFailure.report, repairDurationMs: constants.REPAIR_LIMITS.totalBudgetMs },
}), false);
const networkFailure = validation.updateValidationLayer(
  initial,
  "L2",
  "fail",
  "依赖网络不可用",
  "sandpack:TIME_OUT",
  "network",
);
assert.equal(validation.repairErrorSignature(networkFailure), null);
assert.equal(validation.canAttemptRepair(networkFailure), false);
const resourceFailure = validation.updateValidationLayer(
  initial,
  "L2",
  "fail",
  "候选资源加载失败",
  "bridge:resource-error",
  "resource",
);
assert.equal(validation.canAttemptRepair(resourceFailure), true);
const timeoutFailure = validation.updateValidationLayer(
  initial,
  "L2",
  "fail",
  "外部预览超时",
  "sandpack:TIME_OUT",
  "external-timeout",
);
assert.equal(validation.canAttemptRepair(timeoutFailure), false);

const taskBoard = runTaskBoardCheck();
assert.ok(Array.isArray(taskBoard.assertions), "任务板夹具必须逐条输出断言");
assert.equal(taskBoard.assertions.length, 8);
if (taskBoard.environment.url === null || taskBoard.environment.url.length === 0) {
  assert.equal(taskBoard.assertions.some((item) => item.status === "pass"), false, "没有真实任务板 URL 时不得宣称通过");
}

console.log(JSON.stringify({
  samplePool: "PROTOCOL-FIXTURE",
  layers: initial.report.layers.map((layer) => ({ id: layer.id, status: layer.status })),
  applyGate: { beforePreview: false, afterPreviewAndFunction: validation.canApplyValidation(ready) },
  runRecord: {
    candidateRunId: persistedDraft.run?.runId,
    layerCount: persistedDraft.run?.validationReport?.layers.length,
    repairAttempts: persistedDraft.run?.validationReport?.repairAttempts,
  },
  repair: {
    codeRuntimeAllowed: validation.canAttemptRepair(runtimeFailure),
    resourceAllowed: validation.canAttemptRepair(resourceFailure),
    networkBlocked: validation.canAttemptRepair(networkFailure),
    externalTimeoutBlocked: validation.canAttemptRepair(timeoutFailure),
    duplicateStopped: true,
    revalidationPassRecorded: repaired.report.layers.find((layer) => layer.id === "L5").status === "pass",
    repairBaseInherited: repairedCandidate.baseHash === repairAcceptedHash && repairedCandidate.sourceBaseHash === repairAcceptedHash,
    repairApplyHashGate: await frontendContract.hashEditBase(repairBaseFiles, repairedCandidate.resources) === repairedCandidate.baseHash,
    repairBaseDistinct: repairedCandidate.baseHash !== repairedCandidate.modelBaseHash,
    repairSourcePairRejected: true,
    maxAttempts: constants.REPAIR_LIMITS.maxAttempts,
    totalBudgetMs: constants.REPAIR_LIMITS.totalBudgetMs,
    validationTimeoutMs: constants.REPAIR_LIMITS.validationTimeoutMs,
  },
  taskBoard,
}));

function runTaskBoardCheck() {
  const result = spawnSync(process.execPath, [path.join(root, "scripts/checkTaskBoard.mjs")], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  assert.equal(result.status, 0, `任务板夹具执行失败：${result.stderr}`);
  return JSON.parse(result.stdout);
}

function loadTsModule(filePath, replacements = {}, cache = new Map()) {
  const absolutePath = path.resolve(filePath);
  if (cache.has(absolutePath)) return cache.get(absolutePath);
  const source = readFileSync(absolutePath, "utf8");
  const output = typescript.transpileModule(source, {
    compilerOptions: { module: typescript.ModuleKind.CommonJS, target: typescript.ScriptTarget.ES2020 },
  }).outputText;
  const moduleRecord = { exports: {} };
  cache.set(absolutePath, moduleRecord);
  const localRequire = (specifier) => {
    if (replacements[specifier] !== undefined) return replacements[specifier];
    if (specifier.startsWith(".")) {
      return loadTsModule(path.resolve(path.dirname(absolutePath), `${specifier.replace(/\.js$/, "")}.ts`), replacements, cache).exports;
    }
    return require(specifier);
  };
  new Function("require", "module", "exports", output)(localRequire, moduleRecord, moduleRecord.exports);
  return moduleRecord;
}

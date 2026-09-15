#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const backendRequire = createRequire(path.join(root, "backend/package.json"));
const typescript = require(path.join(root, "frontend/node_modules/typescript"));
const contract = loadTsModule(path.join(root, "backend/routes/editContract.ts")).exports;
const validation = loadTsModule(path.join(root, "backend/routes/chatValidation.ts")).exports;
const validationConstants = loadTsModule(path.join(root, "frontend/src/constants/validation.ts")).exports;
const frontendContract = loadTsModule(path.join(root, "frontend/src/lib/changeContract.ts"), {
  "@/constants/validation": validationConstants,
}).exports;
const projectNameContract = loadTsModule(path.join(root, "frontend/src/lib/candidateProjectName.ts")).exports;

const baseFiles = {
  "/src/App.tsx": "export default function App() { return <main>Keep</main>; }",
  "/src/keep.ts": "export const keep = true;",
  "/public/cover.svg": "<svg />",
};
const coverHash = createHash("sha256").update(baseFiles["/public/cover.svg"], "utf8").digest("hex");
const resources = [
  {
    id: "cover",
    kind: "image",
    hostPath: "/cover.svg",
    sandpackPath: "/public/cover.svg",
    exportPath: "public/cover.svg",
    contentType: "image/svg+xml",
    contentHash: coverHash,
    hashStatus: "known",
  },
  {
    id: "missing-font",
    kind: "font",
    hostPath: "/fonts/missing.woff2",
    sandpackPath: "/public/missing.woff2",
    exportPath: "public/missing.woff2",
    contentType: "font/woff2",
    contentHash: null,
    hashStatus: "unknown",
  },
];
const baseHash = contract.hashEditBase(baseFiles, resources);
assert.equal(await frontendContract.hashEditBase(baseFiles, resources), baseHash);
const base = contract.parseEditBase({
  projectId: "fixture-project",
  versionId: "v3",
  hash: baseHash,
  files: baseFiles,
  resources,
}, "fixture-project");
assert.throws(() => validation.parseChatRequest({
  messages: [{ role: "user", content: "edit" }],
  projectId: "fixture-project",
  operation: "edit",
  base,
  mockConfig: { global: false },
}), /runId/);

const applied = contract.applyFileChanges(base.files, [
  { operation: "modify", path: "/src/App.tsx", content: "export default function App() { return <main>Updated</main>; }" },
  { operation: "add", path: "/src/filter.ts", content: "export const filter = true;" },
]);
assert.equal(applied.files["/src/keep.ts"], baseFiles["/src/keep.ts"]);
assert.equal(applied.files["/src/filter.ts"], "export const filter = true;");
assert.notEqual(contract.hashEditBase(applied.files, base.resources), baseHash);

assert.throws(() => contract.applyFileChanges(base.files, [
  { operation: "add", path: "/src/filter.ts", content: "one" },
  { operation: "modify", path: "/src/filter.ts", content: "two" },
]), /重复变更路径/);
assert.throws(() => contract.applyFileChanges(base.files, [
  { operation: "delete", path: "/src/missing.ts" },
]), /删除文件不存在/);
assert.throws(() => contract.applyFileChanges(base.files, [
  { operation: "modify", path: "/../secret.ts", content: "no" },
]), /invalid/);
assert.throws(() => contract.parseEditBase({
  ...base,
  projectId: "other-project",
}, "fixture-project"), /must match projectId/);
const candidatePayload = {
  candidateId: "candidate-fixture",
  runId: "run-fixture",
  operation: "edit",
  projectId: "fixture-project",
  baseVersionId: "v3",
  baseHash,
  acceptanceBaseHash: baseHash,
  files: applied.files,
  resources: base.resources,
  changes: applied.changes,
  summary: "fixture edit",
};
const candidate = await frontendContract.candidateEventToState(
  candidatePayload,
  "fixture request",
  "assistant-fixture",
  base,
);
const shuffledCandidate = await frontendContract.candidateEventToState(
  { ...candidatePayload, changes: [...candidatePayload.changes].reverse() },
  "fixture request",
  "assistant-shuffled",
  base,
);
assert.equal(shuffledCandidate.status, "staged");
const badResourcePayload = {
  ...candidatePayload,
  resources: base.resources.map((resource, index) => index === 0
    ? { ...resource, contentHash: "0".repeat(64) }
    : resource),
};
await assert.rejects(
  () => frontendContract.validateCandidateEventAgainstBase(badResourcePayload, base),
  /候选资源/,
);
const badChangesPayload = {
  ...candidatePayload,
  changes: applied.changes.map((change, index) => index === 0
    ? { ...change, content: "wrong content" }
    : change),
};
await assert.rejects(
  () => frontendContract.validateCandidateEventAgainstBase(badChangesPayload, base),
  /候选变更列表/,
);
assert.equal(candidate.validation.preview, "not-verified");
assert.equal(candidate.files["/src/keep.ts"], baseFiles["/src/keep.ts"]);

const suggestedName = {
  operation: "create",
  suggestedProjectName: "任务板候选",
  projectNameAtRequest: "新项目",
};
assert.equal(
  projectNameContract.resolveCandidateProjectName(suggestedName, "新项目"),
  "任务板候选",
);
assert.equal(
  projectNameContract.resolveCandidateProjectName(suggestedName, "用户手动命名"),
  undefined,
);
assert.equal(
  projectNameContract.resolveCandidateProjectName({ ...suggestedName, operation: "edit" }, "新项目"),
  undefined,
);
assert.equal(
  projectNameContract.resolveCandidateProjectName({ operation: "create" }, "新项目"),
  undefined,
);
const runnerSource = readFileSync(path.join(root, "frontend/src/hooks/chatRequestRunner.ts"), "utf8");
assert.doesNotMatch(runnerSource, /updateProjectName\(productName\)/);
assert.match(runnerSource, /suggestedProjectName/);

console.log(JSON.stringify({
  baseHash: baseHash.slice(0, 12),
  freeze: base.projectId === "fixture-project" && base.versionId === "v3",
  merge: applied.files["/src/App.tsx"].includes("Updated"),
  untouchedFileRetained: applied.files["/src/keep.ts"] === baseFiles["/src/keep.ts"],
  invalidOperationsRejected: true,
  resourceReferencesParsed: base.resources.length === 2 && base.resources[0].hashStatus === "known" && base.resources[1].hashStatus === "unknown",
  candidateIntegrityRejected: true,
  unorderedChangesAccepted: shuffledCandidate.status === "staged",
  candidateStagedWithoutApplying: candidate.status === "staged" && candidate.validation.preview === "not-verified",
  candidateNameStaysStaged: projectNameContract.resolveCandidateProjectName(suggestedName, "用户手动命名") === undefined,
  candidateNameAppliesOnConfirmation: projectNameContract.resolveCandidateProjectName(suggestedName, "新项目") === "任务板候选",
}));

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
      const localPath = specifier.replace(/\.js$/, "");
      return loadTsModule(path.resolve(path.dirname(absolutePath), `${localPath}.ts`), replacements, cache).exports;
    }
    return backendRequire(specifier);
  };
  new Function("require", "module", "exports", output)(localRequire, moduleRecord, moduleRecord.exports);
  return moduleRecord;
}

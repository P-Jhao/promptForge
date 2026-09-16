#!/usr/bin/env node

import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const typescript = require(path.join(root, "frontend/node_modules/typescript"));

class FakeRequest {
  result = undefined;
  error = null;
  onsuccess = null;
  onerror = null;
}

class FakeTransaction {
  pending = 0;
  aborted = false;
  finished = false;
  oncomplete = null;
  onerror = null;
  onabort = null;

  constructor(database, names) {
    this.database = database;
    this.names = names;
    this.working = new Map(names.map((name) => [name, new Map(database.stores.get(name).values)]));
  }

  objectStore(name) {
    if (!this.names.includes(name)) throw new Error(`store unavailable: ${name}`);
    return new FakeObjectStore(this, name);
  }

  track() { this.pending += 1; }

  finish() {
    this.pending -= 1;
    if (this.pending !== 0 || this.finished) return;
    this.finished = true;
    setTimeout(() => {
      if (this.aborted) return;
      for (const [name, values] of this.working) this.database.stores.get(name).values = new Map(values);
      this.oncomplete?.({ target: this });
    }, 0);
  }

  abort(error = null) {
    if (this.aborted) return;
    this.aborted = true;
    this.error = error;
    setTimeout(() => this.onabort?.({ target: this }), 0);
  }
}

class FakeObjectStore {
  constructor(transaction, name) {
    this.transaction = transaction;
    this.name = name;
  }

  get(key) { return this.schedule(() => this.values.get(key)); }
  getAll() { return this.schedule(() => [...this.values.values()]); }
  put(value) {
    return this.schedule(() => {
      const key = value[this.keyPath];
      if (typeof key !== "string") throw new Error(`invalid key: ${this.keyPath}`);
      this.values.set(key, structuredClone(value));
      return key;
    });
  }
  delete(key) { return this.schedule(() => { this.values.delete(key); return undefined; }); }

  get values() { return this.transaction.working.get(this.name); }
  get keyPath() { return this.transaction.database.stores.get(this.name).keyPath; }

  schedule(operation) {
    const request = new FakeRequest();
    this.transaction.track();
    setTimeout(() => {
      if (this.transaction.aborted) { this.transaction.finish(); return; }
      try {
        request.result = structuredClone(operation());
        request.onsuccess?.({ target: request });
      } catch (error) {
        request.error = error;
        request.onerror?.({ target: request });
        this.transaction.abort(error);
      } finally {
        this.transaction.finish();
      }
    }, 0);
    return request;
  }
}

class FakeDatabase {
  version = 0;
  stores = new Map();
  objectStoreNames = { contains: (name) => this.stores.has(name) };
  onversionchange = null;

  createObjectStore(name, options) {
    const indexes = new Set();
    const store = { keyPath: options.keyPath, values: new Map(), indexNames: { contains: (index) => indexes.has(index) }, createIndex: (index) => { indexes.add(index); } };
    this.stores.set(name, store);
    return store;
  }

  transaction(names) { return new FakeTransaction(this, names); }
  close() { this.onversionchange = null; }
}

class FakeIndexedDb {
  databases = new Map();

  open(name, version) {
    const request = new FakeRequest();
    setTimeout(() => {
      const database = this.databases.get(name) ?? new FakeDatabase();
      const upgrade = database.version < version;
      database.version = version;
      this.databases.set(name, database);
      request.result = database;
      if (upgrade) request.onupgradeneeded?.({ target: request });
      request.onsuccess?.({ target: request });
    }, 0);
    return request;
  }
}

globalThis.indexedDB = new FakeIndexedDb();
const typeModule = loadTsModule(path.join(root, "frontend/src/types/project.ts"));
const validationTypeModule = loadTsModule(path.join(root, "frontend/src/types/validation.ts"));
const validationConstants = loadTsModule(path.join(root, "frontend/src/constants/validation.ts"));
const validationReportModule = loadTsModule(path.join(root, "frontend/src/lib/validationReport.ts"), {
  "@/constants/validation": validationConstants.exports,
}).exports;
const replacements = {
  "@/types/project": typeModule.exports,
  "@/types/validation": validationTypeModule.exports,
};
const serialization = loadTsModule(path.join(root, "frontend/src/lib/projectSerialization.ts"), replacements).exports;
const storage = loadTsModule(path.join(root, "frontend/src/lib/projectStorage.ts"), replacements).exports;
const repositoryModule = loadTsModule(path.join(root, "frontend/src/lib/projectRepository.ts"), replacements).exports;
const baselineCache = loadTsModule(path.join(root, "frontend/src/lib/projectBaselineCache.ts"), replacements).exports;
const repository = new repositoryModule.IndexedDbProjectRepository();

const targetDraft = makeDraft("project-f2-target", "F2 原项目");
const otherDraft = makeDraft("project-f2-other", "F2 其他项目");
const targetSave = await repository.saveProject(targetDraft, null);
const otherSave = await repository.saveProject(otherDraft, null);
assert.equal(targetSave.revision, 1);
assert.equal(otherSave.revision, 1);

baselineCache.clearProjectBaselineCache();
const targetFingerprint = serialization.projectDraftFingerprint(targetDraft);
baselineCache.setProjectBaseline({ projectId: targetDraft.projectId, revision: targetSave.revision, fingerprint: targetFingerprint, draft: targetDraft });
const remountedBaseline = baselineCache.getProjectBaseline(targetDraft.projectId);
assert.ok(remountedBaseline);
assert.equal(remountedBaseline.revision, targetSave.revision);
assert.equal(remountedBaseline.fingerprint, targetFingerprint);
assert.equal(remountedBaseline.draft.files["/App.tsx"], targetDraft.files["/App.tsx"]);
const preservedResourceDraft = serialization.createProjectDraft({
  projectId: targetDraft.projectId,
  projectName: targetDraft.name,
  createdAt: targetDraft.createdAt,
  workspaceId: targetDraft.workspaceId,
  currentVersion: targetDraft.currentVersion,
  versions: targetDraft.versions,
  messages: targetDraft.messages,
  files: targetDraft.files,
  generation: { status: "idle", completedSteps: [], stageTimings: {}, preservedResult: false },
  resourceRecords: targetDraft.resources,
});
assert.deepEqual(preservedResourceDraft.resources, targetDraft.resources);
assert.equal(baselineCache.isCurrentBaselineRead(4, 4, targetDraft.projectId, targetDraft.projectId), true);
assert.equal(baselineCache.isCurrentBaselineRead(4, 5, targetDraft.projectId, targetDraft.projectId), false);
assert.equal(baselineCache.isCurrentBaselineRead(4, 4, targetDraft.projectId, otherDraft.projectId), false);

const renamed = await repository.renameProject(targetDraft.projectId, "F2 重命名", 1);
assert.equal(renamed.projectId, targetDraft.projectId);
assert.equal(renamed.name, "F2 重命名");
assert.equal(renamed.revision, 2);
const renamedSnapshot = await repository.loadProject(targetDraft.projectId);
assert.ok(renamedSnapshot);
assert.equal(renamedSnapshot.project.projectId, targetDraft.projectId);
assert.equal(renamedSnapshot.workspace.workspaceId, targetDraft.workspaceId);
assert.equal(renamedSnapshot.versions[0].versionId, targetDraft.versions[0].versionId);
assert.equal(renamedSnapshot.project.messages[0].content, "F2 message");

const database = globalThis.indexedDB.databases.get(storage.PROJECT_DB_NAME);
assert.equal(database.version, storage.PROJECT_DB_VERSION);
assert.ok(database.stores.has(storage.PROJECT_STORES.deletedProjects));
const legacyRaw = database.stores.get(storage.PROJECT_STORES.projects).values.get(otherDraft.projectId);
assert.equal(legacyRaw.schemaVersion, 1);
assert.equal("deletedAt" in legacyRaw, false);
assert.equal((await repository.loadProject(otherDraft.projectId))?.project.name, otherDraft.name);

await repository.deleteProject(targetDraft.projectId, 2);
const remaining = await repository.listProjects();
assert.deepEqual(remaining.map((project) => project.projectId), [otherDraft.projectId]);
for (const storeName of ["projects", "workspaces", "versions", "runs", "resources"]) {
  const values = database.stores.get(storeName).values;
  assert.equal([...values.values()].some((value) => value.projectId === targetDraft.projectId), false, `${storeName} still has deleted project data`);
}
assert.equal(database.stores.get("deletedProjects").values.has(targetDraft.projectId), true);
await assert.rejects(() => repository.saveProject(targetDraft, null), /已被删除/);
await assert.rejects(() => repository.renameProject(targetDraft.projectId, "迟到重命名", 2), /已被删除|不存在/);
await assert.rejects(() => repository.loadProject(targetDraft.projectId), /已被删除/);

const rollbackDraft = makeDraft("project-f2-rollback", "F2 回滚项目");
await repository.saveProject(rollbackDraft, null);
database.stores.get("workspaces").values.set("broken-workspace", { projectId: rollbackDraft.projectId });
await assert.rejects(() => repository.deleteProject(rollbackDraft.projectId, 1), /删除已回滚/);
assert.equal(database.stores.get("projects").values.has(rollbackDraft.projectId), true);
assert.equal(database.stores.get("deletedProjects").values.has(rollbackDraft.projectId), false);
database.stores.get("workspaces").values.delete("broken-workspace");
await assert.rejects(() => repository.renameProject(rollbackDraft.projectId, "", 1), /项目名称/);

const managerSource = readFileSync(path.join(root, "frontend/src/components/shell/ProjectManager.tsx"), "utf8");
const mutationsSource = readFileSync(path.join(root, "frontend/src/hooks/useProjectManagerMutations.ts"), "utf8");
const browserSource = readFileSync(path.join(root, "frontend/src/components/shell/ProjectBrowserModal.tsx"), "utf8");
const persistenceSource = readFileSync(path.join(root, "frontend/src/hooks/useProjectPersistence.ts"), "utf8");
const baselineHookSource = readFileSync(path.join(root, "frontend/src/hooks/useProjectBaseline.ts"), "utf8");
const runtimeDraftSource = readFileSync(path.join(root, "frontend/src/lib/runtimeProjectDraft.ts"), "utf8");
assert.match(managerSource, /const storageBusy = persistence\.status === "saving" \|\| persistence\.status === "loading"/);
assert.match(managerSource, /disabled=\{busy \|\| storageBusy/);
assert.match(mutationsSource, /storageBusy/);
assert.match(browserSource, /candidatePresent \|\| storageBusy/);
assert.match(baselineHookSource, /getProjectBaseline\(projectId\)/);
assert.match(baselineHookSource, /setProjectBaseline\(\{ projectId: draft\.projectId/);
assert.match(baselineHookSource, /requestId !== entry\.requestId/);
assert.match(persistenceSource, /useProjectBaseline\(projectId, repositoryRef\.current\)/);
assert.match(persistenceSource, /createDraftFromRuntimeState/);
assert.match(runtimeDraftSource, /resourceRecords/);

console.log(JSON.stringify({
  dbVersion: storage.PROJECT_DB_VERSION,
  renameIdentity: true,
  deleteScope: true,
  rollbackGuard: true,
  staleWriteRejection: true,
  legacySchemaLoad: true,
  routeRemountBaseline: true,
  resourceBaselinePreserved: true,
  storageOperationGuard: true,
}));

function makeDraft(projectId, projectName) {
  const startedAt = Date.now();
  const validationReport = validationReportModule.createCandidateValidation(`${projectId}-candidate`, `${projectId}-run`).report;
  const files = { "/App.tsx": { code: "export default function App() { return null; }" }, "/cover.svg": { code: "<svg />" } };
  return serialization.createProjectDraft({
    projectId,
    projectName,
    createdAt: startedAt,
    workspaceId: `${projectId}-workspace`,
    currentVersion: 1,
    versions: [{ versionId: `${projectId}-v1`, versionNumber: 1, threadId: `${projectId}-thread`, assistantMessageId: `${projectId}-assistant`, operation: "create", prompt: "fixture", timestamp: startedAt, files: { "/App.tsx": "export default function App() { return null; }" }, fileCount: 1 }],
    messages: [{ id: `${projectId}-message`, role: "user", content: "F2 message" }],
    files,
    generation: { status: "success", mode: "real", modeForced: false, runId: `${projectId}-run`, validationReport, startedAt, elapsedMs: 10, completedSteps: [], stageTimings: {}, preservedResult: false },
    resourceManifest: { version: 1, caseId: "f2-fixture", resources: [{ id: "cover", kind: "image", required: true, hostPath: "/cover.svg", sandpackPath: "/cover.svg", exportPath: "cover.svg", contentType: "image/svg+xml" }] },
  });
}

function loadTsModule(filePath, replacements = {}, cache = new Map()) {
  const absolutePath = path.resolve(filePath);
  if (cache.has(absolutePath)) return cache.get(absolutePath);
  const source = readFileSync(absolutePath, "utf8");
  const output = typescript.transpileModule(source, { compilerOptions: { module: typescript.ModuleKind.CommonJS, target: typescript.ScriptTarget.ES2020 } }).outputText;
  const moduleRecord = { exports: {} };
  cache.set(absolutePath, moduleRecord);
  const localRequire = (specifier) => {
    if (replacements[specifier] !== undefined) return replacements[specifier];
    if (specifier.startsWith(".")) return loadTsModule(path.resolve(path.dirname(absolutePath), `${specifier}.ts`), replacements, cache).exports;
    return require(specifier);
  };
  new Function("require", "module", "exports", output)(localRequire, moduleRecord, moduleRecord.exports);
  return moduleRecord;
}

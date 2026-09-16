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
  constructor(transaction, name) { this.transaction = transaction; this.name = name; }
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
      try { request.result = structuredClone(operation()); request.onsuccess?.({ target: request }); }
      catch (error) { request.error = error; request.onerror?.({ target: request }); this.transaction.abort(error); }
      finally { this.transaction.finish(); }
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
    const store = { keyPath: options.keyPath, values: new Map(), indexNames: { contains: (index) => indexes.has(index) }, createIndex: (index) => indexes.add(index) };
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
const projectTypes = loadTsModule(path.join(root, "frontend/src/types/project.ts"));
const validationTypes = loadTsModule(path.join(root, "frontend/src/types/validation.ts"));
const validationConstants = loadTsModule(path.join(root, "frontend/src/constants/validation.ts"));
const validationReport = loadTsModule(path.join(root, "frontend/src/lib/validationReport.ts"), {
  "@/constants/validation": validationConstants.exports,
}).exports;
const replacements = { "@/types/project": projectTypes.exports, "@/types/validation": validationTypes.exports };
const serialization = loadTsModule(path.join(root, "frontend/src/lib/projectSerialization.ts"), replacements).exports;
const storage = loadTsModule(path.join(root, "frontend/src/lib/projectStorage.ts"), replacements).exports;
const repositoryModule = loadTsModule(path.join(root, "frontend/src/lib/projectRepository.ts"), replacements).exports;
const repository = new repositoryModule.IndexedDbProjectRepository();

const projectId = "project-f3-version-metadata";
const firstFiles = { "/App.tsx": "export default function App() { return null; }" };
const firstVersion = makeVersion("v1", 1, "create", firstFiles);
const firstDraft = makeDraft(projectId, [firstVersion], 1, firstFiles);
const firstSave = await repository.saveProject(firstDraft, null);
assert.equal(firstSave.revision, 1);

const database = globalThis.indexedDB.databases.get(storage.PROJECT_DB_NAME);
const rawLegacy = database.stores.get(storage.PROJECT_STORES.versions).values.get("v1");
assert.equal(rawLegacy.schemaVersion, 1);
delete rawLegacy.label;
delete rawLegacy.notes;
database.stores.get(storage.PROJECT_STORES.versions).values.set("v1", rawLegacy);
const legacy = await repository.loadProject(projectId);
assert.ok(legacy);
assert.equal(legacy.versions[0].label, undefined);
assert.equal(legacy.versions[0].notes, undefined);
assert.equal("label" in rawLegacy, false);

const beforeMetadata = legacy.versions[0];
const metadataSave = await repository.updateVersionMetadata(projectId, "v1", { label: "首版交付", notes: "元数据不会改变快照" }, 1);
assert.equal(metadataSave.revision, 2);
assert.equal(metadataSave.version.versionId, beforeMetadata.versionId);
assert.equal(metadataSave.version.versionNumber, beforeMetadata.versionNumber);
assert.equal(metadataSave.version.filesHash, beforeMetadata.filesHash);
assert.deepEqual(metadataSave.version.files, beforeMetadata.files);
assert.equal(metadataSave.version.label, "首版交付");
assert.equal(metadataSave.version.notes, "元数据不会改变快照");
await assert.rejects(() => repository.updateVersionMetadata(projectId, "missing-version", { label: "不存在" }, 2), /不存在/);
await assert.rejects(() => repository.updateVersionMetadata(projectId, "v1", { label: "迟到写入" }, 1), /修订号已变化/);

const metadataSnapshot = await repository.loadProject(projectId);
assert.ok(metadataSnapshot);
const hydrated = serialization.snapshotToDraft(metadataSnapshot);
const targetMetadataOnly = { ...hydrated, versions: hydrated.versions.map((version) => ({ ...version, label: version.versionId === "v1" ? "另一个标签" : version.label })) };
assert.equal(
  serialization.projectDraftFingerprintWithoutVersionMetadata(targetMetadataOnly, "v1"),
  serialization.projectDraftFingerprintWithoutVersionMetadata(hydrated, "v1"),
);
assert.notEqual(
  serialization.projectDraftFingerprintWithoutVersionMetadata({ ...targetMetadataOnly, files: { "/App.tsx": "未保存文件" } }, "v1"),
  serialization.projectDraftFingerprintWithoutVersionMetadata(hydrated, "v1"),
);
const secondFiles = { "/App.tsx": "export default function App() { return <main />; }" };
hydrated.currentVersion = 2;
hydrated.files = secondFiles;
hydrated.versions.push({ ...makeVersion("v2", 2, "edit", secondFiles), projectId });
const secondSave = await repository.saveProject(hydrated, 2);
assert.equal(secondSave.revision, 3);

const thirdFiles = { "/App.tsx": "export default function App() { return <p>third</p>; }" };
const fourthFiles = { "/App.tsx": "export default function App() { return <p>fourth</p>; }" };
const fourthDraft = serialization.snapshotToDraft((await repository.loadProject(projectId)));
fourthDraft.currentVersion = 4;
fourthDraft.files = fourthFiles;
fourthDraft.versions.push({ ...makeVersion("v3", 3, "edit", thirdFiles), projectId });
fourthDraft.versions.push({ ...makeVersion("v4", 4, "edit", fourthFiles), projectId });
const fourthSave = await repository.saveProject(fourthDraft, 3);
assert.equal(fourthSave.revision, 4);

const restoredDraft = serialization.snapshotToDraft((await repository.loadProject(projectId)));
restoredDraft.currentVersion = 5;
restoredDraft.files = secondFiles;
restoredDraft.versions.push({ ...makeVersion("v5", 5, "restore", secondFiles, {
  parentVersionId: "v2",
  restoredFromVersionId: "v2",
}), projectId });
const restoredSave = await repository.saveProject(restoredDraft, 4);
assert.equal(restoredSave.revision, 5);
const finalSnapshot = await repository.loadProject(projectId);
assert.ok(finalSnapshot);
assert.deepEqual(finalSnapshot.versions.map((version) => version.versionNumber), [1, 2, 3, 4, 5]);
assert.equal(finalSnapshot.project.currentVersion, 5);
assert.equal(finalSnapshot.versions[0].label, "首版交付");
assert.equal(finalSnapshot.versions[0].notes, "元数据不会改变快照");
assert.equal(finalSnapshot.versions[4].operation, "restore");
assert.equal(finalSnapshot.versions[4].restoredFromVersionId, "v2");
assert.equal(finalSnapshot.versions.some((version) => version.versionNumber === 0), false);

const managerSource = readFileSync(path.join(root, "frontend/src/components/shell/ProjectManager.tsx"), "utf8");
const cardSource = readFileSync(path.join(root, "frontend/src/components/shell/VersionCard.tsx"), "utf8");
const chatStoreSource = readFileSync(path.join(root, "frontend/src/store/chatStore.ts"), "utf8");
const persistenceSource = readFileSync(path.join(root, "frontend/src/hooks/useProjectPersistence.ts"), "utf8");
assert.match(managerSource, /尚无已接受版本/);
assert.match(managerSource, /版本历史/);
assert.match(cardSource, /编辑标签\/备注/);
assert.match(cardSource, /恢复产生/);
assert.match(cardSource, /已暂存于未保存项目/);
assert.match(persistenceSource, /cleanBeforeUpdate/);
assert.match(persistenceSource, /return "memory"/);
assert.match(persistenceSource, /savedDraftRef\.current\?\.versions\.some/);
assert.match(chatStoreSource, /Math\.max\(state\.currentVersion, highestSavedVersion\) \+ 1/);
assert.match(chatStoreSource, /版本号必须从 v1 开始/);

console.log(JSON.stringify({
  legacyDefaults: true,
  metadataOnly: true,
  staleRevisionRejected: true,
  monotonicRestore: true,
  noV0: true,
}));

function makeVersion(versionId, versionNumber, operation, files, source = {}) {
  return {
    versionId,
    versionNumber,
    threadId: `${projectId}-${versionId}-thread`,
    assistantMessageId: `${projectId}-${versionId}-assistant`,
    operation,
    prompt: `${operation} fixture`,
    timestamp: Date.now(),
    files,
    fileCount: Object.keys(files).length,
    ...source,
  };
}

function makeDraft(id, versions, currentVersion, files) {
  const startedAt = Date.now();
  const report = validationReport.createCandidateValidation(`${id}-candidate`, `${id}-run`).report;
  return serialization.createProjectDraft({
    projectId: id,
    projectName: "F3 版本 fixture",
    createdAt: startedAt,
    workspaceId: `${id}-workspace`,
    currentVersion,
    versions,
    messages: [{ id: `${id}-message`, role: "user", content: "版本 fixture" }],
    files: Object.fromEntries(Object.entries(files).map(([path, code]) => [path, { code }])),
    generation: { status: "success", mode: "real", modeForced: false, runId: `${id}-run`, validationReport: report, startedAt, elapsedMs: 10, completedSteps: [], stageTimings: {}, preservedResult: false },
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

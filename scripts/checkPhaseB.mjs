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
  oncomplete = null;
  onerror = null;
  onabort = null;

  constructor(database, names) {
    this.database = database;
    this.names = names;
  }

  objectStore(name) {
    if (!this.names.includes(name)) throw new Error(`store unavailable: ${name}`);
    return new FakeObjectStore(this, this.database.stores.get(name));
  }

  track() { this.pending += 1; }

  finish() {
    this.pending -= 1;
    if (this.pending === 0) setTimeout(() => { if (!this.aborted) this.oncomplete?.(); }, 0);
  }

  abort() {
    if (this.aborted) return;
    this.aborted = true;
    setTimeout(() => this.onabort?.(), 0);
  }
}

class FakeObjectStore {
  constructor(transaction, store) { this.transaction = transaction; this.store = store; }

  get(key) {
    return this.schedule(() => this.store.values.get(key));
  }

  getAll() {
    return this.schedule(() => [...this.store.values.values()]);
  }

  put(value) {
    return this.schedule(() => {
      const key = value[this.store.keyPath];
      if (typeof key !== "string") throw new Error(`invalid key: ${this.store.keyPath}`);
      this.store.values.set(key, structuredClone(value));
      return key;
    });
  }

  schedule(operation) {
    const request = new FakeRequest();
    this.transaction.track();
    setTimeout(() => {
      if (this.transaction.aborted) return;
      try {
        request.result = structuredClone(operation());
        request.onsuccess?.({ target: request });
      } catch (error) {
        request.error = error;
        request.onerror?.({ target: request });
      } finally {
        this.transaction.finish();
      }
    }, 0);
    return request;
  }
}

class FakeDatabase {
  version = 1;
  stores = new Map();
  objectStoreNames = { contains: (name) => this.stores.has(name) };
  onversionchange = null;

  createObjectStore(name, options) {
    const indexes = new Set();
    const store = {
      keyPath: options.keyPath,
      values: new Map(),
      indexNames: { contains: (index) => indexes.has(index) },
      createIndex: (index) => { indexes.add(index); },
    };
    this.stores.set(name, store);
    return store;
  }

  transaction(names, _mode) {
    return new FakeTransaction(this, names);
  }

  close() { this.onversionchange = null; }
}

class FakeIndexedDb {
  databases = new Map();

  open(name, version) {
    const request = new FakeRequest();
    setTimeout(() => {
      const existing = this.databases.get(name);
      if (existing !== undefined && existing.version > version) {
        request.error = Object.assign(new Error("VersionError"), { name: "VersionError" });
        request.onerror?.({ target: request });
        return;
      }
      const database = existing ?? new FakeDatabase();
      database.version = version;
      this.databases.set(name, database);
      request.result = database;
      request.onupgradeneeded?.({ target: request });
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
const repositoryModule = loadTsModule(path.join(root, "frontend/src/lib/projectRepository.ts"), replacements).exports;
const repository = new repositoryModule.IndexedDbProjectRepository();
const validationReport = validationReportModule.createCandidateValidation("candidate-b-fixture", "run-b-fixture").report;
const startedAt = Date.now();
const version = {
  versionId: "v1", versionNumber: 1, threadId: "project-fixture-v1", assistantMessageId: "assistant-1",
  operation: "create", prompt: "fixture", timestamp: startedAt, files: { "/App.tsx": "export default function App() { return null; }" }, fileCount: 1,
};
const draft = serialization.createProjectDraft({
  projectId: "project-fixture", projectName: "阶段 B fixture", createdAt: startedAt, workspaceId: "workspace-fixture",
  currentVersion: 1, versions: [version], messages: [{ id: "m1", role: "user", content: "hello" }],
  files: { "/App.tsx": { code: "export default function App() { return null; }" }, "/cover.svg": { code: "<svg />" } },
  generation: { status: "success", mode: "real", modeForced: false, runId: "run-b-fixture", validationReport, startedAt, elapsedMs: 12, completedSteps: [], stageTimings: {}, preservedResult: false },
  resourceManifest: { version: 1, caseId: "fixture", resources: [{ id: "cover", kind: "image", required: true, hostPath: "/cover.svg", sandpackPath: "/cover.svg", exportPath: "cover.svg", contentType: "image/svg+xml" }] },
});
const firstSave = await repository.saveProject(draft, null);
assert.equal(firstSave.revision, 1);
const loaded = await repository.loadProject("project-fixture");
assert.ok(loaded);
assert.equal(loaded.workspace.files["/App.tsx"], version.files["/App.tsx"]);
assert.equal(loaded.versions.length, 1);
assert.equal(loaded.project.messages[0].content, "hello");
assert.equal(loaded.runs[0].validationReport?.candidateId, "candidate-b-fixture");
assert.equal(loaded.runs[0].validationReport?.layers.length, 6);
assert.equal(JSON.stringify(loaded.project).includes("ReactNode"), false);
assert.equal(serialization.projectDraftFingerprint(draft), serialization.projectDraftFingerprint(serialization.snapshotToDraft(loaded)));

const changed = structuredClone(draft);
changed.files["/App.tsx"] = "changed";
const secondSave = await repository.saveProject(changed, 1);
assert.equal(secondSave.revision, 2);
await assert.rejects(() => repository.saveProject(draft, 1), /修订号已变化/);

const mutatedVersion = structuredClone(changed);
mutatedVersion.versions[0].prompt = "mutated";
await assert.rejects(() => repository.saveProject(mutatedVersion, 2), /不可变版本/);

const database = globalThis.indexedDB.databases.get("promptforge-projects");
database.stores.get("workspaces").values.get("workspace-fixture").filesHash = "broken";
await assert.rejects(() => repository.loadProject("project-fixture"), /工作副本 hash 格式无效/);
console.log(JSON.stringify({ save: true, reload: true, conflict: true, immutableVersion: true, corruptData: true, validationRunRecord: true }));

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

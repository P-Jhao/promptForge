#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const typescript = require(path.join(rootDir, "frontend/node_modules/typescript"));
const intent = loadTsModule(path.join(rootDir, "frontend/src/lib/requestIntent.ts"));
const guard = loadTsModule(path.join(rootDir, "frontend/src/lib/newProjectGuard.ts"));

const intentCases = [
  ["做一个支持搜索的任务看板", false, "generate"],
  ["请新增优先级筛选", true, "edit"],
  ["帮我实现登录", true, "edit"],
  ["在页面新增解释文本", true, "edit"],
  ["请解释这段代码", true, "chat"],
  ["请问如何修改按钮", true, "chat"],
  ["这个页面怎么样", true, "chat"],
  ["请修复页面", false, "clarify"],
  ["帮我处理一下", true, "clarify"],
];
for (const [content, hasFiles, expected] of intentCases) {
  assert.equal(intent.exports.classifyRequestIntent(content, hasFiles).intent, expected, content);
}

const newProjectCases = [
  ["请新建一个项目", true],
  ["我想创建另一个工作区", true],
  ["我要新项目", true],
  ["新项目", true],
  ["create a new project", true],
  ["做一个新页面", false],
  ["我要一个新页面", false],
  ["做一个新的项目详情页", false],
  ["请给当前项目新增一个页面", false],
];
for (const [content, expected] of newProjectCases) {
  assert.equal(intent.exports.isNewProjectRequest(content), expected, content);
}

assert.equal(
  guard.exports.evaluateNewProjectDecision({ dirty: false, isLoading: false, candidatePresent: false }),
  "allow",
);
assert.equal(
  guard.exports.evaluateNewProjectDecision({ dirty: true, isLoading: false, candidatePresent: false }),
  "confirm-dirty",
);
assert.equal(
  guard.exports.evaluateNewProjectDecision({ dirty: true, isLoading: true, candidatePresent: false }),
  "blocked-loading",
);
assert.equal(
  guard.exports.evaluateNewProjectDecision({ dirty: false, isLoading: false, candidatePresent: true }),
  "blocked-candidate",
);

const chatPanel = readFileSync(path.join(rootDir, "frontend/src/components/shell/ChatPanel.tsx"), "utf8");
const chatHook = readFileSync(path.join(rootDir, "frontend/src/hooks/useChat.ts"), "utf8");
const projectManager = readFileSync(path.join(rootDir, "frontend/src/components/shell/ProjectManager.tsx"), "utf8");
const chatRunner = readFileSync(path.join(rootDir, "frontend/src/hooks/chatRequestRunner.ts"), "utf8");
const sandpackView = readFileSync(path.join(rootDir, "frontend/src/components/preview/SandpackView.tsx"), "utf8");
assert.doesNotMatch(chatPanel, /chat-operation-toggle|首次生成|基于当前代码修改/);
assert.match(chatPanel, /sendMessage\(content, undefined, mockConfig\)/);
assert.match(chatPanel, /isNewProjectRequest/);
assert.match(chatPanel, /新建独立项目/);
assert.match(chatPanel, /role="alertdialog"/);
assert.match(chatPanel, /createNewProject\(\)/);
assert.match(chatPanel, /clearGeneratedFiles\(\)/);
assert.match(chatPanel, /router\.replace\("\/workspace"\)/);
assert.match(chatHook, /isNewProjectRequest/);
assert.match(projectManager, /createNewProject\(\)/);
assert.match(projectManager, /clearGeneratedFiles\(\)/);
assert.match(projectManager, /evaluateNewProjectDecision/);
assert.match(projectManager, /router\.replace\("\/workspace"\)/);
assert.match(sandpackView, /previousFiles === null && !hasProjectFiles/);
assert.match(chatRunner, /request\.intent === "chat"/);
assert.match(chatRunner, /activeFlow === "traditional" && latestFiles !== null/);
assert.match(chatRunner, /stageCandidate\(stagedCandidate\)/);

console.log(JSON.stringify({
  requestIntent: true,
  newProjectGuards: true,
  singleChatInput: true,
  candidateOnlyForTraditional: true,
}));

function loadTsModule(filePath) {
  const source = readFileSync(filePath, "utf8");
  const output = typescript.transpileModule(source, {
    compilerOptions: {
      module: typescript.ModuleKind.CommonJS,
      target: typescript.ScriptTarget.ES2020,
    },
  }).outputText;
  const moduleRecord = { exports: {} };
  new Function("module", "exports", output)(moduleRecord, moduleRecord.exports);
  return moduleRecord;
}

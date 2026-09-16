#!/usr/bin/env node

import assert from "node:assert/strict";
import { access, cp, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { evaluateCaseProvenance } from "./lib/taskBoardEvaluation.mjs";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CASE_DIR = path.join(ROOT_DIR, "frontend", "src", "cases", "task-board");
const SOURCE_DIR = path.join(CASE_DIR, "source");
const RUNS_DIR = path.join(ROOT_DIR, "artifacts", "real-runs", "task-board");
const PACKAGE_MANAGER = "pnpm";
const FIXTURE_INDEX = `<!doctype html>
<html lang="zh-CN">
  <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>任务看板验证夹具</title></head>
  <body><div id="root"></div><script type="module" src="/index.tsx"></script></body>
</html>
`;

const descriptor = await readJson(path.join(CASE_DIR, "case.json"));
const manifest = await readJson(path.join(CASE_DIR, "manifest.json"));
const provenance = await readJson(path.join(CASE_DIR, "provenance.json"));

try {
  assert.equal(descriptor.caseId, "task-board-real-eval");
  assert.ok(["READY", "NOT_READY"].includes(descriptor.status), `案例状态无效：${descriptor.status}`);
  assert.equal(manifest.caseId, descriptor.caseId);
  assert.equal(manifest.status, descriptor.status);
  assert.equal(manifest.validationReport, descriptor.validation);
  assert.equal(provenance.caseId, descriptor.caseId);
  assert.equal(provenance.status, descriptor.status);
  assert.equal(provenance.validation.reportPath, descriptor.validation);
  assert.deepEqual(provenance.realRunIds, [
    "task-board-eval-01-003",
    "task-board-case-edit-20260916",
  ]);
  assert.equal(provenance.evidence.find((item) => item.scenarioId === "EVAL-01")?.status, "pass");
  assert.equal(provenance.evidence.find((item) => item.scenarioId === "EVAL-02")?.status, "pass");
  const eval03Status = provenance.evidence.find((item) => item.scenarioId === "EVAL-03")?.status;
  if (descriptor.status === "READY") {
    assert.equal(eval03Status, "pass");
    assert.equal(provenance.validation.browserFunctional, "pass");
    assert.equal(typeof provenance.validation.browserEvidence?.url, "string");
  } else {
    assert.ok(eval03Status === "pass" || eval03Status === "not-verified");
  }

  for (const relativePath of [descriptor.entry, descriptor.files, descriptor.resources, descriptor.manifest, descriptor.provenance, descriptor.validation]) {
    assert.equal(await exists(path.join(CASE_DIR, relativePath)), true, `案例路径缺失：${relativePath}`);
  }

  const sourceFiles = await collectFiles(SOURCE_DIR);
  const sourceTexts = await Promise.all(sourceFiles.filter((filePath) => /\.(ts|tsx)$/.test(filePath)).map(async (filePath) => [
    filePath,
    await readFile(filePath, "utf8"),
  ]));
  for (const [filePath, source] of sourceTexts) {
    assert.doesNotMatch(source, /@ts-nocheck/ , `${filePath} 仍禁用了类型检查`);
    assert.doesNotMatch(source, /\bany\b/, `${filePath} 仍包含 any`);
    assert.doesNotMatch(source, /types[\\/]Task\.ts|types[\\/]Board\.ts/, `${filePath} 包含错误大小写路径`);
  }

  const sourceNames = new Set(sourceFiles.map((filePath) => `/${path.relative(SOURCE_DIR, filePath).replaceAll(path.sep, "/")}`));
  for (const sourceName of manifest.sourceFiles) assert.equal(sourceNames.has(sourceName), true, `manifest 缺少源码：${sourceName}`);
  for (const supportName of manifest.supportFiles) assert.equal(sourceNames.has(supportName), true, `manifest 缺少构建支持文件：${supportName}`);
  for (const buildName of manifest.buildFiles) assert.equal(sourceNames.has(buildName), true, `manifest 缺少构建文件：${buildName}`);
  const taskList = await readFile(path.join(SOURCE_DIR, "components", "TaskList.tsx"), "utf8");
  const filter = await readFile(path.join(SOURCE_DIR, "components", "TaskFilterSearch.tsx"), "utf8");
  const toolbar = await readFile(path.join(SOURCE_DIR, "components", "CreateTaskNav.tsx"), "utf8");
  const taskHook = await readFile(path.join(SOURCE_DIR, "hooks", "useTask.ts"), "utf8");
  const styles = await readFile(path.join(SOURCE_DIR, "styles.css"), "utf8");
  const tailwindConfig = await readFile(path.join(SOURCE_DIR, "tailwind.config.cjs"), "utf8");
  const postcssConfig = await readFile(path.join(SOURCE_DIR, "postcss.config.cjs"), "utf8");
  assert.match(taskList, /lg:grid-cols-3/);
  assert.match(taskList, /todo.*doing.*done/s);
  assert.match(filter, /priorityFilter/);
  assert.match(filter, /按优先级筛选/);
  assert.match(toolbar, /任务看板/);
  assert.match(toolbar, /\/tasks\/new/);
  assert.match(taskHook, /state\.allTasks\.find/);
  assert.doesNotMatch(taskHook, /getTaskById/);
  assert.match(styles, /@tailwind base;/);
  assert.match(styles, /@tailwind components;/);
  assert.match(styles, /@tailwind utilities;/);
  assert.match(tailwindConfig, /content:/);
  assert.match(postcssConfig, /tailwindcss:/);

  const caseProvenance = await evaluateCaseProvenance(CASE_DIR, RUNS_DIR);
  assert.equal(caseProvenance.status, descriptor.status);
  assert.equal(caseProvenance.ready, descriptor.status === "READY");
  if (descriptor.status === "READY") assert.deepEqual(caseProvenance.reasonCodes, []);

  const build = await runBuildCheck();
  const report = {
    schemaVersion: 1,
    status: "PASS",
    caseId: descriptor.caseId,
    caseStatus: descriptor.status,
    provenanceStatus: caseProvenance.status,
    provenanceReasons: caseProvenance.reasonCodes,
    checks: {
      sourceFileCount: sourceFiles.length,
      manifestPaths: manifest.sourceFiles.length,
      supportFiles: manifest.supportFiles.length,
      buildFiles: manifest.buildFiles.length,
      noAnyOrTsNocheck: true,
      requiredBoardFeatures: true,
      toolbarSemantics: true,
      tailwindPipeline: true,
      tailwindCss: build.tailwindCss,
      realSourcesResolved: true,
      typeCheck: build.typeCheck.status === 0 ? "pass" : "fail",
      build: build.build.status === 0 ? "pass" : "fail",
      hostIndexFixture: "temporary-only",
    },
    buildCommands: [
      "pnpm install --frozen-lockfile --ignore-workspace --ignore-scripts",
      "pnpm exec tsc --noEmit --project tsconfig.json",
      "pnpm run build",
    ],
  };
  if (process.argv.includes("--write-report")) {
    await writeFile(path.join(CASE_DIR, "validation-report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  }
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : "任务看板案例检查失败");
  process.exitCode = 1;
}

async function runBuildCheck() {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "promptforge-task-board-case-"));
  const temporarySource = path.join(temporaryRoot, "source");
  try {
    await cp(SOURCE_DIR, temporarySource, {
      recursive: true,
      filter: (source) => !source.split(path.sep).includes("node_modules"),
    });
    await writeFile(path.join(temporarySource, "index.html"), FIXTURE_INDEX, "utf8");
    const install = run(PACKAGE_MANAGER, ["install", "--frozen-lockfile", "--ignore-workspace", "--ignore-scripts"], temporarySource);
    assert.equal(install.status, 0, `案例 pnpm install 失败：${install.output}`);
    const typeCheck = run(PACKAGE_MANAGER, ["exec", "tsc", "--noEmit", "--project", "tsconfig.json"], temporarySource);
    assert.equal(typeCheck.status, 0, `案例 TypeScript 检查失败：${typeCheck.output}`);
    const build = run(PACKAGE_MANAGER, ["run", "build"], temporarySource);
    assert.equal(build.status, 0, `案例 Vite 构建失败：${build.output}`);
    const cssFiles = (await collectFiles(path.join(temporarySource, "dist")))
      .filter((filePath) => filePath.endsWith(".css"));
    assert.ok(cssFiles.length > 0, "案例构建没有生成 CSS 产物");
    const css = (await Promise.all(cssFiles.map((filePath) => readFile(filePath, "utf8")))).join("\n");
    assert.match(css, /\.max-w-6xl/, "Tailwind utility 未进入构建 CSS");
    return { typeCheck, build, tailwindCss: "pass" };
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8", shell: true, timeout: 300_000, windowsHide: true });
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
  return { status: result.status, output: output.slice(-4000) };
}

async function collectFiles(directory) {
  const entries = (await readdir(directory, { withFileTypes: true }))
    .filter((entry) => entry.name !== "node_modules");
  const nested = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? collectFiles(entryPath) : [entryPath];
  }));
  return nested.flat().sort();
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

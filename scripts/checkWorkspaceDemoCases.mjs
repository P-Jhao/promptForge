#!/usr/bin/env node

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cases = [
  { directory: "customer-management", id: "customer-management-demo", runId: "customer-management-demo-20260917" },
  { directory: "analytics-dashboard", id: "analytics-dashboard-demo", runId: "analytics-dashboard-demo-20260917" },
  { directory: "personal-blog", id: "personal-blog-demo", runId: "personal-blog-demo-20260917" },
];

for (const item of cases) {
  const caseRoot = path.join(rootDir, "frontend", "src", "cases", item.directory);
  const descriptor = await readJson(path.join(caseRoot, "case.json"));
  const manifest = await readJson(path.join(caseRoot, "manifest.json"));
  const provenance = await readJson(path.join(caseRoot, "provenance.json"));
  const validation = await readJson(path.join(caseRoot, "validation-report.json"));
  const record = await readJson(path.join(rootDir, "artifacts", "real-runs", "workspace-demos", item.runId, "record.json"));
  if (descriptor.caseId !== item.id || descriptor.status !== "PENDING_BROWSER") throw new Error(`${item.id} descriptor 必须诚实标为待浏览器验证`);
  if (manifest.caseId !== item.id || !Array.isArray(manifest.resources) || !Array.isArray(manifest.externalResources)) throw new Error(`${item.id} manifest 不完整`);
  if (provenance.caseId !== item.id || !String(provenance.sourceRun).includes(item.runId)) throw new Error(`${item.id} provenance 来源不匹配`);
  if (validation.caseId !== item.id || validation.status !== "PENDING_BROWSER" || validation.sourceChecks !== "PASS") throw new Error(`${item.id} 验收记录必须诚实标为待浏览器验证`);
  if (record.status !== "success" || record.latest?.modeEvidence?.mode !== "real" || record.latest?.modeEvidence?.forced !== false || record.latest?.fileCount < 1) throw new Error(`${item.id} 缺少真实 run 证据`);
  const sourceFiles = await collectFiles(path.join(caseRoot, "source"));
  for (const file of sourceFiles) {
    const content = await readFile(file, "utf8");
    if (content.trim().length === 0) throw new Error(`${item.id} 源文件为空：${file}`);
  }
  console.log(`${item.id}: descriptor, manifest, provenance, real run and ${sourceFiles.length} source files are consistent`);
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? collectFiles(entryPath) : [entryPath];
  }));
  return nested.flat();
}

#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import {
  NOVEL_COVER_URLS,
  validateNovelCoverUrls,
} from "./lib/novelCoverUrls.mjs";

const require = createRequire(import.meta.url);
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const typescript = require(path.join(rootDir, "frontend/node_modules/typescript"));
const JSZip = require(path.join(rootDir, "frontend/node_modules/jszip"));

const runtimeManifestModule = loadTsModule(path.join(rootDir, "frontend/src/cases/resourceManifest.ts"));
const bridgeModule = loadTsModule(path.join(rootDir, "frontend/src/components/preview/previewBridge.ts"));
const runtimeManifest = runtimeManifestModule.exports.NOVEL_CASE_RESOURCE_MANIFEST;
const generatedManifest = JSON.parse(await readFile(path.join(rootDir, "frontend/src/cases/generated/manifest.json"), "utf8"));
const generatedNovelData = await readFile(path.join(rootDir, "frontend/src/cases/generated/data/novels.ts"), "utf8");
const generatedFilesSource = await readFile(path.join(rootDir, "frontend/src/cases/generatedFiles.ts"), "utf8");
const generatedCoverUrls = [...generatedNovelData.matchAll(/coverImage\s*:\s*['"]([^'"]+)['"]/g)].map((match) => match[1]);

assert.deepEqual(generatedCoverUrls, NOVEL_COVER_URLS);
assert.deepEqual(generatedManifest.files.includes("/book-cover.svg"), false);
assert.deepEqual(generatedManifest.resources, []);
assert.deepEqual(
  runtimeManifest.externalResources.map((resource) => resource.url),
  NOVEL_COVER_URLS,
);
assert.deepEqual(
  generatedManifest.externalResources.map((resource) => resource.url),
  NOVEL_COVER_URLS,
);
assert.equal(generatedManifest.externalResources.length, NOVEL_COVER_URLS.length);
assert.doesNotMatch(generatedNovelData, /\/book-cover\.svg/);
assert.doesNotMatch(generatedFilesSource, /\/book-cover\.svg/);
validateNovelCoverUrls(generatedCoverUrls);
assert.throws(
  () => validateNovelCoverUrls([
    ...NOVEL_COVER_URLS.slice(0, -1),
    "https://example.invalid/not-an-approved-cover.jpg",
  ]),
  /fixed allowlist/,
);
assert.throws(
  () => validateNovelCoverUrls([NOVEL_COVER_URLS[0], ...NOVEL_COVER_URLS.slice(0, 5)]),
  /duplicated/,
);

const files = {
  "/index.tsx": { code: "import { createRoot } from 'react-dom/client'; const root = createRoot(document.getElementById('root')); root.render(<App />);" },
  "/App.tsx": { code: "export default function App() { return null; }" },
};
runtimeManifestModule.exports.validateResourceManifest(files, runtimeManifest);
const invalidExternalManifest = {
  ...runtimeManifest,
  externalResources: runtimeManifest.externalResources.map((resource, index) => index === 0
    ? { ...resource, url: "https://example.invalid/not-an-approved-cover.jpg" }
    : resource),
};
assert.throws(
  () => runtimeManifestModule.exports.validateResourceManifest(files, invalidExternalManifest),
  /allowlist/,
);
const requiredLocalManifest = {
  version: 1,
  caseId: "fixture",
  resources: [{ id: "cover", kind: "image", required: true, hostPath: "/cover.svg", sandpackPath: "/cover.svg", exportPath: "cover.svg", contentType: "image/svg+xml" }],
};
assert.throws(
  () => runtimeManifestModule.exports.validateResourceManifest(files, requiredLocalManifest),
  /案例资源缺失/,
);

const previewFiles = bridgeModule.exports.createPreviewFiles(files);
assert.ok(previewFiles["/__promptforge_preview_bridge.js"]);
assert.match(previewFiles["/index.tsx"].code, /app-mounted-request/);
const transpiledPreviewEntry = typescript.transpileModule(previewFiles["/index.tsx"].code, {
  compilerOptions: {
    jsx: typescript.JsxEmit.ReactJSX,
    module: typescript.ModuleKind.CommonJS,
    target: typescript.ScriptTarget.ES2020,
  },
});
assert.equal(transpiledPreviewEntry.diagnostics?.length ?? 0, 0);
const exportFiles = bridgeModule.exports.stripPreviewFiles(previewFiles);
assert.equal(exportFiles["/__promptforge_preview_bridge.js"], undefined);
assert.equal(exportFiles["/index.tsx"].code, files["/index.tsx"].code);

const createRootEntry = `// root.render(<Ignored />)\nconst ignored = "createRoot(root).render(";\nimport { createRoot } from "react-dom/client";\nconst rootElement = document.getElementById("root");\ncreateRoot(rootElement).render(\n  <App title={getTitle(")")} />,\n);`;
const createRootFiles = {
  "/index.tsx": { code: createRootEntry },
  "/App.tsx": { code: "export default function App() { return null; }" },
};
const createRootPreview = bridgeModule.exports.createPreviewFiles(createRootFiles);
assert.match(createRootPreview["/index.tsx"].code, /<PromptForgePreviewGuard>/);
assert.match(createRootPreview["/index.tsx"].code, /<\/PromptForgePreviewGuard>,/);
const transpiledCreateRootPreview = typescript.transpileModule(createRootPreview["/index.tsx"].code, {
  compilerOptions: {
    jsx: typescript.JsxEmit.ReactJSX,
    module: typescript.ModuleKind.CommonJS,
    target: typescript.ScriptTarget.ES2020,
  },
});
assert.equal(transpiledCreateRootPreview.diagnostics?.length ?? 0, 0);
const createRootExport = bridgeModule.exports.stripPreviewFiles(createRootPreview);
assert.equal(createRootExport["/index.tsx"].code, createRootEntry);

let capturedBlob;
let capturedFilename;
const previousDocument = globalThis.document;
const previousUrl = globalThis.URL;
globalThis.document = {
  body: { appendChild() {}, removeChild() {} },
};
globalThis.document.createElement = () => ({
  click() {},
  href: "",
  get download() { return capturedFilename; },
  set download(value) { capturedFilename = value; },
});
globalThis.URL = {
  createObjectURL(blob) { capturedBlob = blob; return "blob:phase-a"; },
  revokeObjectURL() {},
};
try {
  const downloadModule = loadTsModule(path.join(rootDir, "frontend/src/lib/downloadCode.ts"), {
    "@/cases/resourceManifest": runtimeManifestModule.exports,
    jszip: { default: JSZip },
  });
  await downloadModule.exports.downloadGeneratedCode(exportFiles, {}, runtimeManifest);
} finally {
  globalThis.document = previousDocument;
  globalThis.URL = previousUrl;
}
assert.ok(capturedBlob instanceof Blob);
assert.match(capturedFilename, /^promptforge-project-.*\.zip$/);
const archive = await JSZip.loadAsync(Buffer.from(await capturedBlob.arrayBuffer()));
assert.equal(archive.files["public/book-cover.svg"], undefined);
assert.equal(archive.files["book-cover.svg"], undefined);
assert.ok(archive.files["promptforge-resource-manifest.json"]);
const exportedManifest = JSON.parse(await archive.files["promptforge-resource-manifest.json"].async("string"));
assert.deepEqual(exportedManifest.externalResources.map((resource) => resource.url), NOVEL_COVER_URLS);
assert.equal(archive.files["/__promptforge_preview_bridge.js"], undefined);
console.log(JSON.stringify({ fixedCoverAllowlist: true, externalManifest: true, maliciousUrlRejected: true, exportOmitsRemoteBytes: true, bridgeExcluded: true, createRootBridge: true }));

function loadTsModule(filePath, replacements = {}) {
  const source = require("node:fs").readFileSync(filePath, "utf8");
  const output = typescript.transpileModule(source, {
    compilerOptions: { module: typescript.ModuleKind.CommonJS, target: typescript.ScriptTarget.ES2020 },
  }).outputText;
  const moduleRecord = { exports: {} };
  const localRequire = (specifier) => replacements[specifier] ?? require(specifier);
  new Function("require", "module", "exports", output)(localRequire, moduleRecord, moduleRecord.exports);
  return moduleRecord;
}

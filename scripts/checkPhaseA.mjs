#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const typescript = require(path.join(rootDir, "frontend/node_modules/typescript"));
const JSZip = require(path.join(rootDir, "frontend/node_modules/jszip"));

const runtimeManifestModule = loadTsModule(path.join(rootDir, "frontend/src/cases/resourceManifest.ts"));
const bridgeModule = loadTsModule(path.join(rootDir, "frontend/src/components/preview/previewBridge.ts"));
const runtimeManifest = runtimeManifestModule.exports.NOVEL_CASE_RESOURCE_MANIFEST;
const coverPath = path.join(rootDir, "frontend/public/book-cover.svg");
const cover = await readFile(coverPath, "utf8");
const generatedManifest = JSON.parse(await readFile(path.join(rootDir, "frontend/src/cases/generated/manifest.json"), "utf8"));
const manifestResource = generatedManifest.resources.find((resource) => resource.id === "book-cover");
assert.ok(manifestResource, "generated manifest lacks book-cover");
assert.equal(manifestResource.sizeBytes, Buffer.byteLength(cover, "utf8"));
assert.equal(manifestResource.sha256, createHash("sha256").update(cover).digest("hex"));
assert.equal(manifestResource.hostPath, "/book-cover.svg");
assert.equal(manifestResource.sandpackPath, "/public/book-cover.svg");
assert.equal(manifestResource.exportPath, "public/book-cover.svg");
assert.ok(generatedManifest.files.includes("/public/book-cover.svg"));
assert.equal(generatedManifest.files.includes("/book-cover.svg"), false);
const generatedNovelData = await readFile(path.join(rootDir, "frontend/src/cases/generated/data/novels.ts"), "utf8");
assert.match(generatedNovelData, /coverImage: '\/book-cover\.svg'/);
const generatedCover = await readFile(path.join(rootDir, "frontend/src/cases/generated/public/book-cover.svg"), "utf8");
assert.equal(generatedCover, cover);

const files = {
  "/index.tsx": { code: "import { createRoot } from 'react-dom/client'; const root = createRoot(document.getElementById('root')); root.render(<App />);" },
  "/App.tsx": { code: "export default function App() { return null; }" },
  "/public/book-cover.svg": { code: cover },
};
runtimeManifestModule.exports.validateResourceManifest(files, runtimeManifest);
assert.throws(
  () => runtimeManifestModule.exports.validateResourceManifest({ "/App.tsx": files["/App.tsx"] }, runtimeManifest),
  /案例资源缺失/,
);

const previewFiles = bridgeModule.exports.createPreviewFiles(files);
assert.ok(previewFiles["/__promptforge_preview_bridge.js"]);
const exportFiles = bridgeModule.exports.stripPreviewFiles(previewFiles);
assert.equal(exportFiles["/__promptforge_preview_bridge.js"], undefined);
assert.equal(exportFiles["/index.tsx"].code, files["/index.tsx"].code);

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
assert.ok(archive.files["public/book-cover.svg"]);
assert.equal(archive.files["book-cover.svg"], undefined);
assert.ok(archive.files["promptforge-resource-manifest.json"]);
assert.equal(archive.files["/__promptforge_preview_bridge.js"], undefined);
console.log(JSON.stringify({ manifest: true, missingResourceRejected: true, export: true, bridgeExcluded: true }));

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

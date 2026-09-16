import assert from "node:assert/strict";

export function assertPreviewDiagnostics(previewDiagnostics) {
  const initial = previewDiagnostics.INITIAL_PREVIEW_DIAGNOSTICS;
  const doneOnly = previewDiagnostics.reducePreviewDiagnostics(
    initial,
    { type: "sandpack-done", compilationError: false },
  );
  assert.equal(doneOnly.buildState, "success");
  assert.equal(doneOnly.mountState, "waiting");
  assert.equal(previewDiagnostics.isPreviewDiagnosticsReady(doneOnly), false);

  const ready = previewDiagnostics.reducePreviewDiagnostics(doneOnly, { type: "app-mounted" });
  assert.equal(previewDiagnostics.isPreviewDiagnosticsReady(ready), true);
  const mountedFirst = previewDiagnostics.reducePreviewDiagnostics(
    previewDiagnostics.reducePreviewDiagnostics(initial, { type: "app-mounted" }),
    { type: "sandpack-done", compilationError: false },
  );
  assert.equal(previewDiagnostics.isPreviewDiagnosticsReady(mountedFirst), true);

  const buildFailure = previewDiagnostics.reducePreviewDiagnostics(
    initial,
    { type: "build-error", message: "编译失败", errorCategory: "build" },
  );
  assert.equal(previewDiagnostics.isPreviewDiagnosticsReady(buildFailure), false);
  const runtimeFailure = previewDiagnostics.reducePreviewDiagnostics(
    ready,
    { type: "runtime-error", message: "运行失败", errorCategory: "runtime" },
  );
  assert.equal(previewDiagnostics.isPreviewDiagnosticsReady(runtimeFailure), false);
  const timeout = previewDiagnostics.reducePreviewDiagnostics(ready, { type: "external-timeout" });
  assert.equal(previewDiagnostics.isPreviewDiagnosticsReady(timeout), false);
}

# 阶段 A 交接：案例资源、预览反馈与真实生成记录器

状态：阶段 A 代码已实现，主代理需要完成浏览器、导出包和真实 Sandpack 的现场验收。2026-09-16 已完成一次任务看板 EVAL-01 真实探测并记录为 `success`；这不是三次评测，也不代表任务看板已作为可用案例固化。

权威范围见[第二阶段执行计划](../phase-two-spec/plan.md)的“阶段 A”。本记录只描述当前实现和证据，不替代计划。

## 已实现

| 需求/计划条目 | 代码证据 | 行为和边界 |
| --- | --- | --- |
| 统一资源清单、封面交付 | [`resourceManifest.ts`](../../frontend/src/cases/resourceManifest.ts)、[`novelCase.ts`](../../frontend/src/cases/novelCase.ts)、[`assembleNovelCase.mjs`](../../scripts/assembleNovelCase.mjs) | 宿主与应用 URL、Sandpack 运行时文件键统一使用 `/book-cover.svg`；导出清单仍使用 `public/book-cover.svg`。Sandpack runtime 按请求路径精确查找文件键，导出时将资源移到 `public/`；缺少或为空时抛出明确错误，生成清单还记录大小和 SHA-256。 |
| R-COVER-01 / R-EXPORT-01 | [`downloadCode.ts`](../../frontend/src/lib/downloadCode.ts)、[`CasePreview.tsx`](../../frontend/src/components/cases/CasePreview.tsx) | 导出前校验必需资源并写入 `promptforge-resource-manifest.json`；首页案例显示资源检查状态。完整导出构建仍待现场验收。 |
| 模板、动态组件、沙盒启动提示 | [`SandpackView.tsx`](../../frontend/src/components/preview/SandpackView.tsx)、[`BuildingLoadingOverlay.tsx`](../../frontend/src/components/preview/BuildingLoadingOverlay.tsx) | 模板加载失败可重试；首次启动使用中央覆盖层；已有画面重新编译时只显示轻量更新提示。等待阈值默认 30 秒/120 秒，可由 `NEXT_PUBLIC_PREVIEW_LONG_WAIT_MS`、`NEXT_PUBLIC_PREVIEW_TIMEOUT_MS`（兼容 `NEXT_PUBLIC_SANDPACK_*`）配置。 |
| R-PREVIEW-01 / R-VALIDATE-01 | [`usePreviewDiagnostics.ts`](../../frontend/src/components/preview/usePreviewDiagnostics.ts) | 监听当前 Sandpack `listen` 原始消息；`done` 且 `compilatonError=false` 只记录构建成功，必须再收到应用入口的 `app-mounted` 才 ready。构建错误、运行时错误和外部超时分开显示。 |
| 桥接只作用于预览副本 | [`previewBridge.ts`](../../frontend/src/components/preview/previewBridge.ts)、[`SandpackView.tsx`](../../frontend/src/components/preview/SandpackView.tsx) | 预览副本才注入 bridge 和入口 ErrorBoundary；写入 `currentFiles`、编辑器和导出前调用 `stripPreviewFiles`。入口注入/剥离的 round-trip fixture 已通过。 |
| 预置案例身份 | [`SandpackView.tsx`](../../frontend/src/components/preview/SandpackView.tsx)、[`PreviewToolbar.tsx`](../../frontend/src/components/preview/PreviewToolbar.tsx) | 只有 store 中的生成文件仍与 `initialFiles` 完全相同才挂载小说 manifest。关闭示例体验并收到真实生成文件后清除 manifest，避免把小说资源清单误用于任意生成结果；通用生成结果仍需自己的资源清单。 |
| R-FAIL-01 / 记录真实运行 | [`recordRealTaskBoard.mjs`](../../scripts/recordRealTaskBoard.mjs)、[`realRunRecorder.mjs`](../../scripts/lib/realRunRecorder.mjs) | 固定 EVAL-01 prompt 发送 `/api/chat`，记录脱敏 raw SSE、files、白名单配置摘要和终态；编辑候选的 `candidate.data.files` 另由 `candidateEvidence` 摘要记录。必须收到 `mode={mode:"real",forced:false}`；缺失、mock 或 forced 均拒绝真实记录。成功 runID 复用，失败/中断下次使用新 attempt。 |

## 检查证据

已执行并通过：

```text
frontend: pnpm exec tsc --noEmit
frontend: pnpm exec eslint [阶段 A 变更的相关文件]
node --check scripts/recordRealTaskBoard.mjs
node --check scripts/lib/realRunRecorder.mjs
node scripts/checkPhaseA.mjs
```

`checkPhaseA.mjs` 是可执行的资源/导出 fixture：核对生成 manifest 的封面大小和 SHA-256、缺资源拒绝、bridge 剥离、导出 ZIP 中的封面和 manifest，并确认 ZIP 不含 bridge、文件名使用 `promptforge-project-*`。另用本地 SSE fixture 检查了 mock 拒绝、real/forced=false 成功和相同 runID 成功记录复用；这些 fixture 都不是 Sandpack 运行通过证据。

主代理已现场确认首页案例的 6 张封面 `src=/book-cover.svg` 且 `naturalWidth=113`，工作台代码视图没有 bridge 文件。此前工作台 Sandpack 使用 `/public/book-cover.svg` 文件键时，6 张封面 `complete=true` 但 `naturalWidth=0`，并报告资源加载失败；本次恢复为 `/book-cover.svg` 运行时键后需重新现场确认。静态 manifest/ZIP fixture 不能替代浏览器资源请求或真实 Sandpack ready 证据。

## 2026-09-16 本地现场 / Mock smoke

- 390px 首页和工作台未见横向溢出；首页书库案例的 6 张封面均为 `/book-cover.svg`、`naturalWidth=113`，搜索“星辰”只剩一行，详情和阅读数据可达。
- 工作台示例体验与真实模式控件可切换，中心预览加载提示可见。导出按钮可见，但 CUA 未捕获原生 `download` 事件，导出下载仍是未验证项。
- 控制台 `MutationObserver.observe` 异常的调用栈指向 `@ant-design/x` 的 `BubbleList/useCompatibleScroll` 依赖路径；项目源码没有对应调用，本轮未修改 `node_modules`。

以上是本地页面 smoke 观察，不是付费模型、真实 Sandpack ready、导出 ZIP 下载或固定任务板通过证据。

## 主代理需继续现场验收

1. 在已有前端开发服务和真实 Sandpack 网络环境中打开小说案例，确认无旧 waiting 残留，能看到 `app-mounted` 后才显示 ready；确认封面请求成功。
2. 切换代码/预览并重试构建错误、运行错误、超时，核对已有画面、当前文件和输入不丢；检查 bridge/guard 不进入 editor/export。
3. 解压导出 ZIP，执行独立的类型检查与 `vite build`，确认 `book-cover.svg` 路径；不能把 ZIP 下载或代码可见当作构建通过。
4. 需要真实任务看板时，在不重启已有 backend 的前提下执行：

   ```text
   node scripts/recordRealTaskBoard.mjs --run-id task-board-eval-v1 --base-url http://localhost:7001/api
   ```

   输出目录默认是 `artifacts/real-runs/task-board/<run-id>/`。本轮未执行该命令；只有记录中同时存在 real/forced=false、完整 files、done 和后续验收证据，才可进入后续固化。

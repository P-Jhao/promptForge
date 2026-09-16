# 阶段 A 交接：案例资源、预览反馈与真实生成记录器

状态：阶段 A 代码已实现，主代理需要完成浏览器、导出包和真实 Sandpack 的现场验收。2026-09-16 已记录一次 EVAL-01 真实成功、EVAL-02 首次协议误判及修复后的 EVAL-02 重跑成功；这些样本不是三次评测，也不代表任务看板已作为可用案例固化。

权威范围见[第二阶段执行计划](../phase-two-spec/plan.md)的“阶段 A”。本记录只描述当前实现和证据，不替代计划。

## 已实现

| 需求/计划条目 | 代码证据 | 行为和边界 |
| --- | --- | --- |
| 统一资源清单、封面交付 | [`resourceManifest.ts`](../../frontend/src/cases/resourceManifest.ts)、[`novelCoverUrls.mjs`](../../scripts/lib/novelCoverUrls.mjs)、[`novelCase.ts`](../../frontend/src/cases/novelCase.ts)、[`assembleNovelCase.mjs`](../../scripts/assembleNovelCase.mjs) | 六个固定 Unsplash URL 由 `externalResources` 登记，运行时直接由小说数据引用；Sandpack 文件 map 不伪造远程文件，导出 manifest 保留 URL、类型和 allowlist 来源，不下载或写入远程图片字节。外链不可用时保留资源错误卡。 |
| R-COVER-01 / R-EXPORT-01 | [`downloadCode.ts`](../../frontend/src/lib/downloadCode.ts)、[`CasePreview.tsx`](../../frontend/src/components/cases/CasePreview.tsx) | 首页检查六个固定外链；导出写入 `promptforge-resource-manifest.json` 的 `externalResources`，不把远程图片当作本地 ZIP 条目。联网运行和完整导出构建仍待现场验收。 |
| 模板、动态组件、沙盒启动提示 | [`SandpackView.tsx`](../../frontend/src/components/preview/SandpackView.tsx)、[`BuildingLoadingOverlay.tsx`](../../frontend/src/components/preview/BuildingLoadingOverlay.tsx) | 模板加载失败可重试；首次启动使用中央覆盖层；已有画面重新编译时只显示轻量更新提示。等待阈值默认 30 秒/120 秒，可由 `NEXT_PUBLIC_PREVIEW_LONG_WAIT_MS`、`NEXT_PUBLIC_PREVIEW_TIMEOUT_MS`（兼容 `NEXT_PUBLIC_SANDPACK_*`）配置。 |
| R-PREVIEW-01 / R-VALIDATE-01 | [`usePreviewDiagnostics.ts`](../../frontend/src/components/preview/usePreviewDiagnostics.ts)、[`previewDiagnosticsState.ts`](../../frontend/src/components/preview/previewDiagnosticsState.ts) | 在 layout effect 中订阅当前 Sandpack `listen` 和对应 iframe 的窗口消息；`done` 且 `compilatonError=false` 只记录构建成功，必须再收到应用入口真实 `app-mounted` 才 ready。若挂载一次性消息早于订阅，使用父子 bridge 握手请求重发；构建错误、运行时错误和外部超时分开显示，iframe load/status 不参与通过判定。 |
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

`checkPhaseA.mjs` 是可执行的 URL/manifest/导出 fixture：核对六个固定外链、生成文件无 `/book-cover.svg` 运行时引用、allowlist 对恶意 URL 的拒绝、缺本地资源拒绝、bridge 剥离和 ZIP 中只保留外链 manifest 元数据；这些 fixture 都不是 Sandpack 运行通过证据。

此前候选 iframe 曾能显示页面但因一次性 `app-mounted` 消息在被动订阅建立前到达而保持 `not-verified`；当前 bridge 提供真实挂载后的握手重发，`checkPhaseD.mjs` 通过纯 reducer fixture 覆盖事件先后和错误/超时，浏览器仍需确认真实 `done`、`app-mounted` 与图片加载。

主代理此前现场确认本地占位封面在首页可显示，但工作台 Sandpack 在 `/public/book-cover.svg` 和 `/book-cover.svg` 两种文件键下都出现 `complete=true`、`naturalWidth=0`，并报告资源加载失败。当前方案改为六个固定 Unsplash URL；主代理已取得六个 URL 的 `200 image/jpeg` HTTP 证据，工作台 iframe 重载后的 `naturalWidth>0` 仍需现场复验。资源错误卡继续保留，静态 manifest/ZIP fixture 不能替代浏览器资源请求或真实 Sandpack ready 证据。

## 2026-09-16 本地现场 / Mock smoke

- 390px 首页和工作台未见横向溢出；旧本地占位封面路径的首页 smoke 可显示，搜索“星辰”只剩一行，详情和阅读数据可达。远程封面切换后的 iframe 图片加载仍待复验。
- 工作台示例体验与真实模式控件可切换，中心预览加载提示可见。导出按钮可见，但 CUA 未捕获原生 `download` 事件，导出下载仍是未验证项。
- 控制台 `MutationObserver.observe` 异常的调用栈指向 `@ant-design/x` 的 `BubbleList/useCompatibleScroll` 依赖路径；项目源码没有对应调用，本轮未修改 `node_modules`。

以上是本地页面 smoke 观察，不是付费模型、真实 Sandpack ready、导出 ZIP 下载或固定任务板通过证据。

## 主代理需继续现场验收

1. 在已有前端开发服务和真实 Sandpack 网络环境中打开小说案例，确认无旧 waiting 残留，能看到 `app-mounted` 后才显示 ready；确认封面请求成功。
2. 切换代码/预览并重试构建错误、运行错误、超时，核对已有画面、当前文件和输入不丢；检查 bridge/guard 不进入 editor/export。
3. 解压导出 ZIP，执行独立的类型检查与 `vite build`，确认包内只记录固定远程封面 URL、没有伪造的本地封面字节；联网和导出构建仍需现场确认。
4. 需要真实任务看板时，在不重启已有 backend 的前提下执行：

   ```text
   node scripts/recordRealTaskBoard.mjs --run-id task-board-eval-v1 --base-url http://localhost:7001/api
   ```

   输出目录默认是 `artifacts/real-runs/task-board/<run-id>/`。EVAL-01 与 EVAL-02 的真实探测记录及首次协议误判说明见 [阶段 E](./phase-e.md)；只有记录中同时存在 real/forced=false、完整 files、done 和后续验收证据，才可进入后续固化。

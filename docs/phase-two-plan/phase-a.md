# 阶段 A 交接：案例资源、预览反馈与真实生成记录器

状态：阶段 A 代码已实现。2026-09-16 主代理在 Edge 目标工作台观察到任务看板入口的一次 Sandpack 页面渲染、`done(compilatonError=false)` 与入口 `app-mounted` 握手，以及关键词/优先级筛选；同日观察到小说书库 6 本书和阅读笔记详情。该次现场只覆盖目标环境中的一条案例路径，完整状态矩阵、移动端/键盘、导出包、原生 ZIP、离线和 IndexedDB 仍未完成。已保留历史 EVAL-01 真实成功、EVAL-02 首次协议误判及修复后的重跑；这些历史样本不是三次评测，固定六次评测见阶段 E。

权威范围见[第二阶段执行计划](../phase-two-spec/plan.md)的“阶段 A”。本记录只描述当前实现和证据，不替代计划。

## 首页展示改造（2026-09-17）

首页展示已从自动挂载小说 `CasePreview` 改为静态产品介绍：首屏使用 `LandingPage.module.css` 的蓝紫背景和任务看板截图，案例区保留小说与任务看板两个独立工作台入口，首页浏览不会启动 iframe、Sandpack、远程封面检查或新的生成请求。原有 `/workspace?case=novel&scene=library|notes` 和 `/workspace?case=task-board-real-eval` 路由继续由工作台加载。

- `frontend/public/landing-hero-bg.webp`（10,050 bytes）和 `landing-cta-bg.webp`（6,818 bytes）是无文字、无 logo 的生成背景素材，由 CSS 装饰性引用，不代表产品运行画面。
- `frontend/public/task-board-workspace.webp`（47,356 bytes）是实际本地任务看板工作台画面的裁剪压缩图，用于产品展示；它来自已固化案例的现场画面，不是未经修改的模型原始输出。
- 首页静态文案保留“示例是固定成果、真实请求会调用模型、本地浏览器手动保存”等边界；静态检查覆盖 logo、小说/任务板路由和首页不包含 `CasePreview`/iframe/资源检查。

本轮已完成代码、类型、定向 lint 和案例静态检查；主代理已用生产构建在浏览器确认桌面首页、标题两行布局、导航/主按钮/案例链接可访问，静态页无 iframe/Sandpack；并打开小说与任务看板工作台，验证小说阅读状态筛选和任务看板优先级筛选。390px/768px 实际视口、完整键盘焦点遍历以及图片离线/网络失败仍待人工确认。

## 已实现

| 需求/计划条目 | 代码证据 | 行为和边界 |
| --- | --- | --- |
| 统一资源清单、封面交付 | [`resourceManifest.ts`](../../frontend/src/cases/resourceManifest.ts)、[`novelCoverUrls.mjs`](../../scripts/lib/novelCoverUrls.mjs)、[`novelCase.ts`](../../frontend/src/cases/novelCase.ts)、[`assembleNovelCase.mjs`](../../scripts/assembleNovelCase.mjs) | 六个固定 Unsplash URL 由 `externalResources` 登记，运行时直接由小说数据引用；Sandpack 文件 map 不伪造远程文件，导出 manifest 保留 URL、类型和 allowlist 来源，不下载或写入远程图片字节。外链不可用时保留资源错误卡。 |
| R-COVER-01 / R-EXPORT-01 | [`downloadCode.ts`](../../frontend/src/lib/downloadCode.ts)、[`CasePreview.tsx`](../../frontend/src/components/cases/CasePreview.tsx) | 小说案例工作台入口检查六个固定外链；首页只展示静态案例信息，不自动检查封面。导出写入 `promptforge-resource-manifest.json` 的 `externalResources`，不把远程图片当作本地 ZIP 条目。联网运行已有单张详情封面现场证据，完整导出构建仍待现场验收。 |
| 模板、动态组件、沙盒启动提示 | [`SandpackView.tsx`](../../frontend/src/components/preview/SandpackView.tsx)、[`BuildingLoadingOverlay.tsx`](../../frontend/src/components/preview/BuildingLoadingOverlay.tsx) | 模板加载失败可重试；首次启动使用中央覆盖层；已有画面重新编译时只显示轻量更新提示。等待阈值默认 30 秒/120 秒，可由 `NEXT_PUBLIC_PREVIEW_LONG_WAIT_MS`、`NEXT_PUBLIC_PREVIEW_TIMEOUT_MS`（兼容 `NEXT_PUBLIC_SANDPACK_*`）配置。 |
| R-PREVIEW-01 / R-VALIDATE-01 | [`usePreviewDiagnostics.ts`](../../frontend/src/components/preview/usePreviewDiagnostics.ts)、[`previewDiagnosticsState.ts`](../../frontend/src/components/preview/previewDiagnosticsState.ts) | 在 layout effect 中订阅当前 Sandpack `listen` 和对应 iframe 的窗口消息；`done` 且 `compilatonError=false` 只记录构建成功，必须再收到应用入口真实 `app-mounted` 才 ready。若挂载一次性消息早于订阅，使用父子 bridge 握手请求重发；构建错误、运行时错误和外部超时分开显示，iframe load/status 不参与通过判定。 |
| 桥接只作用于预览副本 | [`previewBridge.ts`](../../frontend/src/components/preview/previewBridge.ts)、[`SandpackView.tsx`](../../frontend/src/components/preview/SandpackView.tsx) | 预览副本才注入 bridge 和入口 ErrorBoundary；写入 `currentFiles`、编辑器和导出前调用 `stripPreviewFiles`。入口注入/剥离的 round-trip fixture 已通过。 |
| 预置案例身份 | [`SandpackView.tsx`](../../frontend/src/components/preview/SandpackView.tsx)、[`PreviewToolbar.tsx`](../../frontend/src/components/preview/PreviewToolbar.tsx) | 只有选中的预置案例在 store 中仍与 `initialFiles` 完全相同才挂载该案例对应的 `initialManifest`；小说和任务看板各自使用自己的 manifest。关闭示例体验并收到真实生成文件后清除 manifest，避免把预置资源清单误用于任意生成结果；通用生成结果仍需自己的资源清单。 |
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

`checkPhaseA.mjs` 是可执行的 URL/manifest/导出 fixture：核对六个固定外链、生成文件无 `/book-cover.svg` 运行时引用、allowlist 对恶意 URL 的拒绝、缺本地资源拒绝、bridge 剥离和 ZIP 中只保留外链 manifest 元数据；其中还覆盖 `root.render(...)` 与 `createRoot(rootElement).render(...)` 的注入、编译和剥离还原。fixture 不能替代完整 Sandpack 状态矩阵或其他浏览器路径。

此前候选 iframe 曾能显示页面但因一次性 `app-mounted` 消息在被动订阅建立前到达而保持 `not-verified`；当前 bridge 提供真实挂载后的握手重发，并支持任务看板 `createRoot(rootElement).render(...)` 入口，`checkPhaseD.mjs` 通过纯 reducer fixture 覆盖事件先后和错误/超时。2026-09-16 Edge 目标工作台的任务看板现场在修复后消除中央等待覆盖层，观察到一次真实 `done(compilatonError=false)` 与入口 `app-mounted`；控制台仅有扩展注入、React Router 和 Tailwind CDN 警告，没有应用运行时错误。该证据只覆盖一次目标路径。

主代理此前现场确认本地占位封面在首页可显示，但工作台 Sandpack 在 `/public/book-cover.svg` 和 `/book-cover.svg` 两种文件键下都出现 `complete=true`、`naturalWidth=0`，并报告资源加载失败。当前方案改为六个固定 Unsplash URL；2026-09-16 Edge 目标工作台观察到小说详情页 iframe 封面为 `complete=true`、`naturalWidth=400`、`naturalHeight=560`，其 `src` 属于 allowlist 外链；六个固定 URL 均另有 HTTP 200 证据。资源错误卡继续保留，静态 manifest/ZIP fixture 不能替代完整资源矩阵、导出和离线证据。

## 2026-09-16 本地现场 / Mock smoke

- 2026-09-16 Edge 目标工作台打开任务看板入口后，Sandpack iframe 显示三列和 4 条初始任务；关键词“登录”筛选为 1 条并可清除，优先级“高”可选并可恢复。小说 `scene=library` 显示 6 本书，`scene=notes` 显示“星辰之上”详情、阅读进度、笔记和书签。
- 该条是 2026-09-16 的历史观察：当时工作台仍有示例/真实模式控件。2026-09-18 Fork 重构后，案例改为只读示例，顶部/左栏 CTA 或首条 Prompt 单向创建真实项目；当前导出下载仍需单独现场验证。
- 控制台 `MutationObserver.observe` 异常的调用栈指向 `@ant-design/x` 的 `BubbleList/useCompatibleScroll` 依赖路径；项目源码没有对应调用，本轮未修改 `node_modules`。

以上包含一次目标工作台 Edge 现场观察，不等于完整任务板功能通过；导出 ZIP 下载、离线、IndexedDB、移动端/键盘和其他状态仍需单独证据。浏览器控制台中的扩展注入、React Router 和 Tailwind CDN 警告不记录为产品失败。

## 主代理需继续现场验收

1. 重复打开小说与任务看板案例，确认 `done(compilatonError=false)` 与对应 `app-mounted` 后才显示 ready；本次 Edge 已观察到小说书库/笔记和任务看板一条路径，仍需覆盖完整状态矩阵及错误/超时。
2. 切换代码/预览并重试构建错误、运行错误、超时，核对已有画面、当前文件和输入不丢；检查 bridge/guard 不进入 editor/export。
3. 解压导出 ZIP，执行独立的类型检查与 `vite build`，确认包内只记录固定远程封面 URL、没有伪造的本地封面字节；联网和导出构建仍需现场确认。
4. 需要真实任务看板时，在不重启已有 backend 的前提下执行：

   ```text
   node scripts/recordRealTaskBoard.mjs --run-id task-board-eval-v1 --base-url http://localhost:7001/api
   ```

   输出目录默认是 `artifacts/real-runs/task-board/<run-id>/`。EVAL-01 与 EVAL-02 的真实探测记录及首次协议误判说明见 [阶段 E](./phase-e.md)；只有记录中同时存在 real/forced=false、完整 files、done 和后续验收证据，才可进入后续固化。

# Vue 范围评估

状态：阶段 E 的后续评估记录。本文只依据当前仓库和第二阶段规格，不实现 Vue、不添加框架选择器，也不推断性能、成功率或供应商能力。

权威边界见[第二阶段执行计划](../phase-two-spec/plan.md)阶段 E、[`R-VUE-EVAL-01`](../phase-two-spec/03-requirements.md#p2-需求和未来评估)和 [`A-VUE-01`](../phase-two-spec/07-acceptance-and-open-questions.md#需求到验收映射)。本记录对应 [`phase-e.md`](./phase-e.md) 中的未实现范围。

## 结论与建议

当前交付链路是一个 React TypeScript 产品链路。React 模板、生成图、预览桥接、校验和案例回放都有明确代码路径，但仓库没有 Vue 模板、Vue 生成约定、Vue Sandpack 运行证据或 Vue 案例。因此建议暂不进入 Vue 实现阶段，继续把 React 的真实运行、任务看板来源和固定验收证据补齐。

如果后续决定立项，应先做一个隔离的 Vue 技术验证，再决定是否扩大范围。验证结果必须分别记录模板构建、Sandpack 挂载、结构化编辑、保存恢复、资源清单和固定交互；不能用 React 结果或小说案例替代 Vue 证据。

## 仓库现状和成本

| 评估面 | 当前证据和事实 | 进入 Vue 后的新增成本与风险 |
| --- | --- | --- |
| React 模板 | [`backend/templates/react-ts/package.json`](../../backend/templates/react-ts/package.json) 固定 React 18、`react-dom`、Vite 和 React SWC 插件，脚本只有 React 项目的 `vite` 开发/构建路径。 | 需要独立的 Vue 模板、Vue runtime/compiler、Vite Vue 插件、入口文件和依赖版本约束；当前没有可直接复用的模板构建证据。 |
| 生成图 | [`traditional.graph.ts`](../../backend/agents/graphs/traditional.graph.ts) 串联分析、架构、视图、应用和组装节点；组装节点读取 `templates/react-ts/index.tsx`，现有提示和案例产出以 TSX/JSX 为主。 | 需要框架明确的生成契约、文件扩展名、入口、组件语法和依赖规则。若在同一生成图中加入分支，还要分别记录 prompt、文件合并和错误分类，不能仅增加一个选择字段。 |
| Vue 运行时与 Sandpack | [`SandpackView.tsx`](../../frontend/src/components/preview/SandpackView.tsx) 使用动态 `SandpackProvider` 和 `template="react-ts"`。仓库现有模板依赖没有 Vue，当前没有 Vue Provider、Vue 入口或 Vue 运行记录。 | 需要先确认目标 Sandpack/Vite 组合是否能构建并运行 Vue，再实现模板装载、依赖安装、启动超时和错误归类；在这之前不能声称 Vue 预览可用。 |
| 预览桥接 | [`previewBridge.ts`](../../frontend/src/components/preview/previewBridge.ts) 注入 React import、React Error Boundary 和 `root.render` 周边的 `app-mounted`/runtime-error 报告；桥接文件只存在于预览副本。 | Vue 不能直接使用 React guard。需要 Vue 入口对应的挂载报告、运行错误报告、资源错误来源校验，并保持桥接不进入 editor/export 的边界。 |
| 校验层 | [`validationReport.ts`](../../frontend/src/lib/validationReport.ts) 提供 L0-L5 报告；[`usePreviewDiagnostics.ts`](../../frontend/src/components/preview/usePreviewDiagnostics.ts) 监听真实 Sandpack `done` 和桥接 `app-mounted`，把构建和挂载分开。编辑结构校验位于 [`changeContract.ts`](../../frontend/src/lib/changeContract.ts)。 | L0/L1 的可序列化文件和变更契约可以作为候选，但 L2 必须增加 Vue 构建、挂载和运行错误证据；固定功能断言也必须绑定 Vue 案例，不能把 React 的 `data-testid` 结果移植后当作 Vue 通过。 |
| 项目保存格式 | [`projectSerialization.ts`](../../frontend/src/lib/projectSerialization.ts) 保存字符串文件映射、消息、版本、运行摘要和资源；[`types/project.ts`](../../frontend/src/types/project.ts) 的文件字段本身没有 React 节点。 | 文件映射可以容纳 `.vue` 文本，但当前快照没有明确 framework/template 身份。若保存 Vue 项目，应增加可迁移的模板标识并在加载时校验，避免用 React 模板恢复 Vue 文件；IndexedDB schema 和损坏/旧版本路径需要单独验证。 |
| 案例与资源 | [`resourceManifest.ts`](../../frontend/src/cases/resourceManifest.ts) 定义通用资源字段，现有 [`novelCase.ts`](../../frontend/src/cases/novelCase.ts) 和 `frontend/src/cases/generated/` 是小说 React 预置成果。阶段 E 尚未有独立任务看板案例。 | Vue 案例需要独立 case ID、入口、源码、资源、manifest、来源和验收证据；不得复用小说文件、小说 manifest 或 fixture 结果。资源在宿主、Sandpack 和导出路径中的一致性仍需单独检查。 |
| 测试和评测 | `checkPhaseA/B/C/D/E.mjs` 覆盖资源、仓储、候选、校验和来源报告 fixture；`checkTaskBoard.mjs` 是固定任务板 Playwright 检查。当前没有 Vue 页面、Vue fixture 或 Vue 真实运行样本，固定任务板环境也仍需现场条件。 | 至少要增加 Vue 模板构建/挂载 fixture、资源和导出检查、候选隔离检查、保存恢复检查，以及独立固定交互样本池。所有真实模型、真实 Sandpack 和浏览器结果都要按 `pass`、`fail`、`skipped`、`not-verified` 记录，不能用缺环境结果计算成功率。 |

## 后续立项门槛

建议只有在以下证据具备后再决定是否进入 Vue 实现：

1. 选定并审查一个 Vue 模板、依赖和 Vite 构建入口，保存可复现的配置摘要。
2. 在隔离预览副本中证明 Vue 应用能收到构建完成和应用挂载证据，构建错误、运行错误、资源错误和外部环境错误分开记录。
3. 用一个小型 Vue fixture 验证候选文件、结构化变更、资源 hash、应用前基线检查和失败候选隔离。
4. 明确项目快照中的 framework/template 字段及迁移、损坏和未知模板处理，再验证 IndexedDB 保存/打开/恢复。
5. 只有独立 Vue 案例具有真实来源、manifest 和固定交互证据后，才评估是否增加案例入口；没有这些证据时保持不可用状态。

本阶段不执行上述立项验证，不安装 Vue 依赖，不调用模型，不创建 Vue 案例，也不添加框架选择器。现有 React 真实运行、导出、浏览器故障和固定任务板结果继续按各自阶段文档记录，不能转写成 Vue 结论。

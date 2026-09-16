# 02 能力基线

本表根据截至 2026-09-16 的仓库和现场记录更新。它服务于需求讨论和后续验收，不把代码存在等同于产品已交付。状态含义如下：

- 已实现：代码路径支持该行为，且一期记录已有相应检查；
- 部分实现：有局部机制，但无法满足第二阶段完整语义；
- 未实现：当前没有对应产品能力；
- 未验证：实现或机制存在，但目标环境/真实链路尚未得到证据。

## 能力矩阵

| 能力 | 代码证据 | 当前事实 | 状态 | 第二阶段影响 |
| --- | --- | --- | --- | --- |
| 首页和案例入口 | [`LandingPage.tsx`](../../frontend/src/components/landing/LandingPage.tsx)、[`CasePreview.tsx`](../../frontend/src/components/cases/CasePreview.tsx) | 首页直接展示小说阅读管理案例；可进入书库和阅读笔记两个场景；独立任务看板案例保留在 `frontend/src/cases/task-board/`，已有来源标签和 `/workspace?case=task-board-real-eval` 静态入口 | 部分实现，目标环境运行未验证 | 需要继续验收独立案例的 Sandpack 预览、错误边界和来源说明呈现 |
| 小说案例来源 | [`novelCase.ts`](../../frontend/src/cases/novelCase.ts)、[`generatedFiles.ts`](../../frontend/src/cases/generatedFiles.ts)、[`assembleNovelCase.mjs`](../../scripts/assembleNovelCase.mjs) | 由 `backend/mock` 组装；两个路由共用同一份 48 文件成果 | 已实现 | 不能把它当作第二阶段新的真实生成案例 |
| 小说案例会话交互 | [`generated/`](../../frontend/src/cases/generated/) | 搜索、状态筛选、新增书籍/笔记和书签可在当前页面会话写入 | 已实现 | 运行时数据保留要和源码项目保存分开验收 |
| 封面资源存在 | [`resourceManifest.ts`](../../frontend/src/cases/resourceManifest.ts)、[`novelCoverUrls.mjs`](../../scripts/lib/novelCoverUrls.mjs) | 小说案例使用六个固定 Unsplash URL；manifest 的 `externalResources` 保留 URL、类型和 allowlist 来源，宿主检查外链，运行时不伪造本地文件；六个 URL 均有 `200 image/jpeg` HTTP 证据 | 已实现（静态与 URL fixture） | 依赖网络；工作台 Sandpack iframe 的资源交付仍未完成复验，静态检查和 HTTP 结果不等于浏览器通过 |
| 案例文件清单包含封面 | [`generatedFiles.ts`](../../frontend/src/cases/generatedFiles.ts)、[`generated/manifest.json`](../../frontend/src/cases/generated/manifest.json) | 案例文件映射不包含本地封面键；生成 manifest 只在 `externalResources` 中记录六个固定 URL，导出 ZIP 只写 manifest 元数据，不把远程图片写成本地资源 | 已实现（静态与 URL fixture） | 仍需真实 Sandpack 运行和联网导出项目构建确认外链可用 |
| React 模板加载 | [`template.ts`](../../backend/routes/template.ts)、[`api.ts`](../../frontend/src/services/api.ts) | 后端读取 `backend/templates/react-ts`，前端请求 `/api/template/react-ts`，失败时可重试 | 部分实现 | 需与沙盒运行状态分开，不应把模板收到当作应用 ready |
| Sandpack 预览 | [`SandpackView.tsx`](../../frontend/src/components/preview/SandpackView.tsx) | 动态加载 Provider；`initialFiles` 可绕过模板请求；预览错误可重试 | 部分实现、运行未验证 | 外部 Sandpack 运行依赖网络；一期曾遇到 `TIME_OUT`，不能视为预览成功 |
| 预览加载状态 | [`SandpackView.tsx`](../../frontend/src/components/preview/SandpackView.tsx) | `sandpack.status` 为 `initial` 或 `running` 时显示“正在等待预览运行”；没有以真实 ready 事件确认运行就绪 | 部分实现 | 必须定义 ready、超时、空白和错误的可验证状态 |
| 真实生成入口 | [`useChat.ts`](../../frontend/src/hooks/useChat.ts)、[`api.ts`](../../frontend/src/services/api.ts) | 关闭示例体验后发送 `/api/chat` SSE；2026-09-16 已登记 EVAL-01/EVAL-02 各 3 次 `mode=real`、`forced=false`、`success`、`done` 和可读 files/candidate files；完整工作台预览和功能链路仍未由这些 recorder 记录证明 | 部分实现，协议已记录、完整真实链路未验证 | 需要现场核对真实预览、候选验证和固定功能保留 |
| traditional 图 | [`main.graph.ts`](../../backend/agents/graphs/main.graph.ts)、[`traditional.graph.ts`](../../backend/agents/graphs/traditional.graph.ts) | route classifier 分流后按分析、架构、视图和组装节点顺序生成；组装后返回文件映射 | 已实现，完整真实链路未验证 | 任务看板真实固化必须记录实际运行来源 |
| 分析输入 | [`analysisNode.ts`](../../backend/agents/flows/traditional/analysis/nodes/analysisNode.ts) | 非 Mock 分支只取 `state.messages` 的最后一条消息转换给模型 | 已实现（局部） | 当前编辑代码不会自动成为分析输入 |
| 文本历史 | [`chatStore.ts`](../../frontend/src/store/chatStore.ts)、[`useChat.ts`](../../frontend/src/hooks/useChat.ts) | Zustand 中有消息 history；重试只复制原始请求上下文 | 部分实现 | 需持久化并明确对话与文件基线的关联 |
| 当前编辑文件 | [`sandpackStore.ts`](../../frontend/src/store/sandpackStore.ts)、[`changeContract.ts`](../../frontend/src/lib/changeContract.ts)、[`useChat.ts`](../../frontend/src/hooks/useChat.ts) | Sandpack 文件变化写入 `currentFiles`；真实请求冻结当前文件、资源引用、项目/版本身份和包含资源摘要的稳定 hash，资源内容缺失时显式标记未知，编辑 operation 将完整 base 发送后端；EVAL-02 真实候选文件已由 recorder 记录 | 部分实现，工作台功能保留仍未完整验证 | 仍需现场确认手改内容在候选合并、冲突和接受后保留 |
| 候选结果 | [`candidate.ts`](../../frontend/src/types/candidate.ts)、[`CandidatePanel.tsx`](../../frontend/src/components/shell/CandidatePanel.tsx)、[`editContract.ts`](../../backend/routes/editContract.ts)、[`validationReport.ts`](../../frontend/src/lib/validationReport.ts) | 首次生成和明确编辑都先暂存候选；编辑使用结构化 add/modify/delete 合并；候选携带 L0-L5 分层报告，代码/运行失败可由用户触发有界修复；候选预览与编辑器隔离，只有结构与真实预览校验通过并确认后才应用。阶段 C/D 已有一次真实候选的现场门槛和冲突证据，独立任务看板 EVAL-03 则在临时 Vite 页面完成固定交互确认 | 部分实现，独立案例已具备人工证据，完整工作台 Sandpack/修复链路未验证 | 现场仍需补齐独立案例目标 Sandpack、固定功能保留、导出和修复结果证据；fixture 不等同真实通过 |
| 版本快照 | [`types/store.ts`](../../frontend/src/types/store.ts)、[`chatStore.ts`](../../frontend/src/store/chatStore.ts)、[`useChat.ts`](../../frontend/src/hooks/useChat.ts) | `versions` 保存用户确认应用后的文件、prompt 和元数据；普通聊天不创建版本；候选未应用时不改变当前版本 | 部分实现 | 需要现场核对确认应用、手动保存和恢复之间的边界 |
| 回滚 | [`useProjectPersistence.ts`](../../frontend/src/hooks/useProjectPersistence.ts)、[`ProjectManager.tsx`](../../frontend/src/components/shell/ProjectManager.tsx) | 阶段 B 提供历史版本恢复并生成新的 restore 记录，保护 dirty 工作副本；阶段 C 候选冲突不会自动回滚或合并 | 部分实现，真实浏览器故障场景未验证 | 后续仍需完善候选差异查看和现场恢复验收 |
| AST 代码后处理 | [`fixer.ts`](../../backend/agents/utils/ast/fixer.ts)、[`component.graph.ts`](../../backend/agents/graphs/component.graph.ts)、[`page.graph.ts`](../../backend/agents/graphs/page.graph.ts) | 有类型分析和规则修复 API，组件/页面生成路径会调用单文件处理 | 部分实现 | 这不等于面向用户的全项目运行校验、有限修复或修复报告 |
| 取消与断开 | [`chat.ts`](../../backend/routes/chat.ts)、[`useChat.ts`](../../frontend/src/hooks/useChat.ts) | 客户端 abort/断开会触发服务端 AbortController；界面明确提示上游模型调用可能继续 | 部分实现 | 可承诺停止接收和停止图流，不能承诺上游模型已全部终止 |
| 阶段时间 | [`useChat.ts`](../../frontend/src/hooks/useChat.ts)、[`GenerationStatusPanel.tsx`](../../frontend/src/components/shell/GenerationStatusPanel.tsx) | 记录的是客户端收到事件的间隔，包含网络传输；不是服务端节点耗时 | 已实现（诊断层） | 指标必须区分客户端间隔、服务端耗时和总用户等待时间 |
| 失败/重试/EOF 夹具 | [`feedbackFixture.ts`](../../backend/test/feedbackFixture.ts) | 有 success、fail、EOF、delay、chat、429 的本地反馈夹具 | 已实现（夹具） | 可作为协议状态测试；不代表真实模型、真实 Sandpack 或运行时通过 |
| 代码导出 | [`downloadCode.ts`](../../frontend/src/lib/downloadCode.ts)、[`PreviewToolbar.tsx`](../../frontend/src/components/preview/PreviewToolbar.tsx) | 导出当前 Sandpack 文件；小说封面作为固定远程 URL 写入 `promptforge-resource-manifest.json` 的 `externalResources`，远程图片不进入 ZIP | 部分实现，导出构建未验证 | 需联网解压后执行独立构建并确认外链访问；不能声称离线可用或导出构建已通过 |
| React 项目持久化 | [`projectRepository.ts`](../../frontend/src/lib/projectRepository.ts)、[`ProjectManager.tsx`](../../frontend/src/components/shell/ProjectManager.tsx)、[`phase-b.md`](../phase-two-plan/phase-b.md) | IndexedDB 保存项目、工作副本、版本、资源和运行摘要；工作台提供手动保存、打开、另存为、dirty 保护和历史恢复；阶段 D 报告可把保存/恢复结果作为独立 L4 层记录 | 部分实现，真实浏览器故障场景未验证 | 阶段 B 已覆盖首版本地保存语义；L4 当前不由自动任务板代替，配额、损坏数据、双标签冲突和刷新/移动端仍需现场验收 |
| 独立任务看板案例与评测 | [`recordRealTaskBoard.mjs`](../../scripts/recordRealTaskBoard.mjs)、[`reportTaskBoardEvaluation.mjs`](../../scripts/reportTaskBoardEvaluation.mjs)、[`taskBoardEvaluation.mjs`](../../scripts/lib/taskBoardEvaluation.mjs)、[`phase-e.md`](../phase-two-plan/phase-e.md)、[`frontend/src/cases/task-board/`](../../frontend/src/cases/task-board/) | 2026-09-16 固定 run `task-board-eval-01-001`、`task-board-eval-01-002`、`task-board-eval-01-003` 与 `task-board-eval-02-001`、`task-board-eval-02-002`、`task-board-eval-02-003` 均为 `mode=real`、`forced=false`、`success`、`done` 且 files 可读；独立案例 `task-board-real-eval` 使用 EVAL-01 `task-board-eval-01-003` 与 EVAL-02 `task-board-case-edit-20260916`，EVAL-03 由主代理 Edge 临时 Vite 人工确认，metadata/provenance/validation report 已为 `READY`；首页链接和 `/workspace?case=task-board-real-eval` 静态入口已接入。历史 EVAL-02 协议误判和 Mock 拒绝仍保留 | 部分实现，独立案例固化门槛与入口代码已完成；入口目标环境 Sandpack、导出/离线和 IndexedDB 故障仍未验证 | `READY` 只覆盖真实来源、构建和临时 Vite EVAL-03；不能复用小说 48 文件或 fixture 结果，也不能宣称 Sandpack/ZIP 通过 |
| Vue 生成/预览 | [`package.json`](../../backend/templates/react-ts/package.json)、[`SandpackView.tsx`](../../frontend/src/components/preview/SandpackView.tsx) 使用固定 React TypeScript 模板和 `SandpackProvider template="react-ts"` | 当前交付链路固定为 React；没有 Vue 模板、Provider 或 Vue 运行证据 | 未实现（本阶段明确不做） | 仅输出评估结论和后续问题；`frontend/src/types/flow.ts` 的类型保留不作为 Vue 能力证据 |

## 必须保留的事实边界

一期记录的前端 TypeScript、构建、夹具和若干浏览器检查只证明对应检查项。2026-09-16 已有六条 REAL-EVAL recorder 记录和独立任务看板案例来源，但它们只证明真实模式下的 SSE/文件或候选协议门槛；外部 Sandpack 启动、独立案例在目标预览中的运行、导出包解压构建、离线使用和第五类 IndexedDB 故障仍未完成验证，不能改写为通过。

取消的证据是客户端断开和服务端收到断开后停止继续写流，并不等于供应商模型调用已经终止。相同地，`done` 事件表示 SSE 流完整结束，并不自动表示生成的应用已编译、启动和通过固定需求。

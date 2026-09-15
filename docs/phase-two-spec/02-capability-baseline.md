# 02 能力基线

本表记录 2026-09-15 的仓库事实。它服务于需求讨论和后续验收，不把代码存在等同于产品已交付。状态含义如下：

- 已实现：代码路径支持该行为，且一期记录已有相应检查；
- 部分实现：有局部机制，但无法满足第二阶段完整语义；
- 未实现：当前没有对应产品能力；
- 未验证：实现或机制存在，但目标环境/真实链路尚未得到证据。

## 能力矩阵

| 能力 | 代码证据 | 当前事实 | 状态 | 第二阶段影响 |
| --- | --- | --- | --- | --- |
| 首页和案例入口 | [`LandingPage.tsx`](../../frontend/src/components/landing/LandingPage.tsx)、[`CasePreview.tsx`](../../frontend/src/components/cases/CasePreview.tsx) | 首页直接展示小说阅读管理案例；可进入书库和阅读笔记两个场景 | 已实现 | 需要增加独立任务看板身份和来源说明 |
| 小说案例来源 | [`novelCase.ts`](../../frontend/src/cases/novelCase.ts)、[`generatedFiles.ts`](../../frontend/src/cases/generatedFiles.ts)、[`assembleNovelCase.mjs`](../../scripts/assembleNovelCase.mjs) | 由 `backend/mock` 组装；两个路由共用同一份 48 文件成果 | 已实现 | 不能把它当作第二阶段新的真实生成案例 |
| 小说案例会话交互 | [`generated/`](../../frontend/src/cases/generated/) | 搜索、状态筛选、新增书籍/笔记和书签可在当前页面会话写入 | 已实现 | 运行时数据保留要和源码项目保存分开验收 |
| 封面资源存在 | [`book-cover.svg`](../../frontend/public/book-cover.svg) | 仓库有本地占位封面，案例数据引用 `/book-cover.svg` | 已实现（文件层面） | 还要验证案例 iframe、Sandpack 和导出后的实际资源解析 |
| 案例文件清单包含封面 | [`generatedFiles.ts`](../../frontend/src/cases/generatedFiles.ts) | 当前案例文件映射没有 `/book-cover.svg` 这条资源项；`downloadCode.ts` 另有根路径 fetch 逻辑 | 部分实现 | 这是图片异常的高概率代码原因；尚未有网络复现，不能称已证实 HTTP 404 |
| React 模板加载 | [`template.ts`](../../backend/routes/template.ts)、[`api.ts`](../../frontend/src/services/api.ts) | 后端读取 `backend/templates/react-ts`，前端请求 `/api/template/react-ts`，失败时可重试 | 部分实现 | 需与沙盒运行状态分开，不应把模板收到当作应用 ready |
| Sandpack 预览 | [`SandpackView.tsx`](../../frontend/src/components/preview/SandpackView.tsx) | 动态加载 Provider；`initialFiles` 可绕过模板请求；预览错误可重试 | 部分实现、运行未验证 | 外部 Sandpack 运行依赖网络；一期曾遇到 `TIME_OUT`，不能视为预览成功 |
| 预览加载状态 | [`SandpackView.tsx`](../../frontend/src/components/preview/SandpackView.tsx) | `sandpack.status` 为 `initial` 或 `running` 时显示“正在等待预览运行”；没有以真实 ready 事件确认运行就绪 | 部分实现 | 必须定义 ready、超时、空白和错误的可验证状态 |
| 真实生成入口 | [`useChat.ts`](../../frontend/src/hooks/useChat.ts)、[`api.ts`](../../frontend/src/services/api.ts) | 关闭示例体验后发送 `/api/chat` SSE；前端在 `done` 后才写入完整文件和版本 | 已实现，完整真实链路未验证 | 需要把当前编辑文件作为修改基线，并保存候选与验证记录 |
| traditional 图 | [`main.graph.ts`](../../backend/agents/graphs/main.graph.ts)、[`traditional.graph.ts`](../../backend/agents/graphs/traditional.graph.ts) | route classifier 分流后按分析、架构、视图和组装节点顺序生成；组装后返回文件映射 | 已实现，完整真实链路未验证 | 任务看板真实固化必须记录实际运行来源 |
| 分析输入 | [`analysisNode.ts`](../../backend/agents/flows/traditional/analysis/nodes/analysisNode.ts) | 非 Mock 分支只取 `state.messages` 的最后一条消息转换给模型 | 已实现（局部） | 当前编辑代码不会自动成为分析输入 |
| 文本历史 | [`chatStore.ts`](../../frontend/src/store/chatStore.ts)、[`useChat.ts`](../../frontend/src/hooks/useChat.ts) | Zustand 中有消息 history；重试只复制原始请求上下文 | 部分实现 | 需持久化并明确对话与文件基线的关联 |
| 当前编辑文件 | [`sandpackStore.ts`](../../frontend/src/store/sandpackStore.ts)、[`SandpackView.tsx`](../../frontend/src/components/preview/SandpackView.tsx) | store 有 `currentFiles`，Sandpack 文件变化会写入；请求构造没有携带它，界面也提示不会自动带入下一次请求 | 部分实现 | 必须建立当前文件快照、基线 hash 和继续修改语义 |
| 版本快照 | [`types/store.ts`](../../frontend/src/types/store.ts)、[`chatStore.ts`](../../frontend/src/store/chatStore.ts) | `versions` 在内存中保存生成后的文件、prompt 和元数据；只有传统流程收到完整 `files` 后的 `done` 才保存 | 部分实现 | 需要持久化、不可变版本和候选隔离；内存 rollback 尚未接通 |
| 回滚 | [`ChatState`](../../frontend/src/types/store.ts)、[`chatStore.ts`](../../frontend/src/store/chatStore.ts) | 有版本数据结构，没有回滚 action 或界面连接 | 未实现 | 需求先定义恢复语义，不能把数组中的旧快照称为可用回滚 |
| AST 代码后处理 | [`fixer.ts`](../../backend/agents/utils/ast/fixer.ts)、[`component.graph.ts`](../../backend/agents/graphs/component.graph.ts)、[`page.graph.ts`](../../backend/agents/graphs/page.graph.ts) | 有类型分析和规则修复 API，组件/页面生成路径会调用单文件处理 | 部分实现 | 这不等于面向用户的全项目运行校验、有限修复或修复报告 |
| 取消与断开 | [`chat.ts`](../../backend/routes/chat.ts)、[`useChat.ts`](../../frontend/src/hooks/useChat.ts) | 客户端 abort/断开会触发服务端 AbortController；界面明确提示上游模型调用可能继续 | 部分实现 | 可承诺停止接收和停止图流，不能承诺上游模型已全部终止 |
| 阶段时间 | [`useChat.ts`](../../frontend/src/hooks/useChat.ts)、[`GenerationStatusPanel.tsx`](../../frontend/src/components/shell/GenerationStatusPanel.tsx) | 记录的是客户端收到事件的间隔，包含网络传输；不是服务端节点耗时 | 已实现（诊断层） | 指标必须区分客户端间隔、服务端耗时和总用户等待时间 |
| 失败/重试/EOF 夹具 | [`feedbackFixture.ts`](../../backend/test/feedbackFixture.ts) | 有 success、fail、EOF、delay、chat、429 的本地反馈夹具 | 已实现（夹具） | 可作为协议状态测试；不代表真实模型、真实 Sandpack 或运行时通过 |
| 代码导出 | [`downloadCode.ts`](../../frontend/src/lib/downloadCode.ts)、[`PreviewToolbar.tsx`](../../frontend/src/components/preview/PreviewToolbar.tsx) | 导出当前 Sandpack 文件；引用封面且文件映射缺资源时尝试 fetch `/book-cover.svg` 放入 ZIP | 部分实现，导出构建未验证 | 需定义当前工作副本、资源清单和失败保留语义；不能声称部署路径已完全解决 |
| React 项目持久化 | [`projectRepository.ts`](../../frontend/src/lib/projectRepository.ts)、[`ProjectManager.tsx`](../../frontend/src/components/shell/ProjectManager.tsx)、[`phase-b.md`](../phase-two-plan/phase-b.md) | IndexedDB 保存项目、工作副本、版本、资源和运行摘要；工作台提供手动保存、打开、另存为、dirty 保护和历史恢复 | 部分实现，真实浏览器故障场景未验证 | 阶段 B 已覆盖首版本地保存语义；配额、损坏数据、双标签冲突和刷新/移动端仍需现场验收 |
| Vue 生成/预览 | [`package.json`](../../backend/templates/react-ts/package.json)、[`SandpackView.tsx`](../../frontend/src/components/preview/SandpackView.tsx) 使用固定 React TypeScript 模板和 `SandpackProvider template="react-ts"` | 当前交付链路固定为 React；没有 Vue 模板、Provider 或 Vue 运行证据 | 未实现（本阶段明确不做） | 仅输出评估结论和后续问题；`frontend/src/types/flow.ts` 的类型保留不作为 Vue 能力证据 |

## 必须保留的事实边界

一期记录的前端 TypeScript、构建、夹具和若干浏览器检查只证明对应检查项。当时真实 LLM traditional 链路、外部 Sandpack 启动、编辑后重新预览和 ZIP 解压安装构建仍未完成验证；这些结果在第二阶段进入验收前不能改写为通过。

取消的证据是客户端断开和服务端收到断开后停止继续写流，并不等于供应商模型调用已经终止。相同地，`done` 事件表示 SSE 流完整结束，并不自动表示生成的应用已编译、启动和通过固定需求。

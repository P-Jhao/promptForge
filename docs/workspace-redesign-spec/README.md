# 工作台重设计规格

状态：规格与验收口径；实施进度、来源和未验证项见 [`implementation-status.md`](./implementation-status.md)。三个新增案例已有真实来源和静态注册，但目标浏览器验收仍待主代理完成。

更新时间：2026-09-17

这组规格把参考截图转译为 PromptForge 的宿主工作台方向：顶部项目栏、左侧对话与进度、右侧预览或代码。截图只提供视觉参考，不是当前能力、实现完成度或验收证据。当前代码中已经存在若干可复用的局部能力，但目标布局、操作归属和三份新增展示案例仍需后续实现与主代理浏览器验收。

## 文档范围

| 文档 | 内容 |
| --- | --- |
| [README.md](./README.md) | 产品意图、范围边界、代码事实、稳定需求和与既有契约的关系 |
| [workspace-layout.md](./workspace-layout.md) | 桌面布局、区域职责、操作映射、焦点顺序和窄屏降级 |
| [demo-cases.md](./demo-cases.md) | 三份展示案例、案例内部交互、来源与资源边界、注册现状 |
| [acceptance.md](./acceptance.md) | 可操作验收项、状态矩阵、证据分类和必要检查 |
| [implementation-status.md](./implementation-status.md) | 当前实现、真实来源、检查结果和未验证项 |

这不是执行计划。它不规定排期、代理任务顺序或提交方式；实现时仍须服从现有生成、候选、预览、项目仓储和手动保存契约。

## 产品意图

工作台要让用户在同一个项目上下文内完成“描述需求 → 观察阶段与耗时 → 查看预览或代码 → 判断候选 → 手动保存或继续修改”。工作台外壳负责项目、会话、保存和视图切换；客户表格、业务导航、详情抽屉等内容属于案例应用本身，由右侧预览中的案例路由负责。

目标外壳由三个稳定区域组成：

- 顶部项目栏放置 PromptForge 标识、当前项目名与项目切换、已接受版本和保存状态、手动保存、导出以及更多项目操作。
- 左侧对话栏在桌面约 340–380px，保留单一底部输入框、阶段进度、客户端收到事件的间隔、生成/聊天状态和现有候选查看、应用、修复、放弃能力。
- 右侧区域在预览与代码之间切换，提供预览/代码工具栏、刷新和全屏；导出由顶部唯一主导出入口负责，右侧可以复用同一动作和对象标签，但不强制重复放置按钮；桌面预览不增加设备模拟、缩放或移动设备专用改版。

一个项目只有一个主会话，主会话复用现有 `Project.messages`。消息历史与版本历史是两个不同概念：消息用于继续上下文，版本用于不可变文件快照、来源和恢复；二者可以在界面互相链接，不能混成一份伪造的历史。保存仍是用户主动触发的本地 IndexedDB 保存，不增加自动保存、云同步或隐式写入。

普通输入继续由内部判定 `generate`、`edit`、`chat`：空项目的创建需求走生成；已有文件且明确要求修改走编辑；解释或讨论只追加聊天，不创建候选或版本；意图不清先澄清。界面不暴露“首次生成/当前代码修改”的日常模式开关。现有示例体验/真实生成切换可以保留为运行来源提示和固定案例入口，但不能变成 generate/edit/chat 的用户模式选择器。

## 范围与非目标

本规格覆盖：

- 宿主工作台的顶部项目栏、左对话栏、右预览/代码区及三者的操作归属；
- 左栏阶段和耗时表达、候选隔离、失败/取消/重试、保存失败和项目切换状态；
- 预览/代码工具栏的刷新、全屏、当前导出对象表达和遮挡约束；
- 保留现有窄屏降级，保证桌面 1440px 与 1280px 宽度下的可操作布局；
- 首页只同步必要的案例入口，不重构首页信息架构；
- 客户管理后台、数据分析看板、个人博客三份展示案例的功能范围、固定数据、来源和资源说明；
- 旧小说案例、阅读笔记入口、`task-board-real-eval` 入口和已保存项目的兼容边界。

明确不在本规格范围内：

- 分享链接、附件上传、模型选择、账户/套餐、云端项目、自动保存、后台实时同步或新的后端生成能力；
- 设备切换、移动设备模拟、缩放控制和移动端专项视觉重做；
- 把案例内部客户表格、业务导航、详情抽屉、博客导航或分析筛选提升为宿主导航；
- 完整 CRM、完整博客 CMS、真实联系人数据、实时分析后端、真实业务数据接入；
- 重新设计或替换现有生成图、聊天图、候选验证、IndexedDB 数据模型和项目恢复契约；
- 用截图、fixture、预组装文件或一次局部浏览器观察代替目标环境验收；
- 通过 Playwright E2E 增加本轮门槛。必要的自动化只做现有脚本、类型、lint、构建和静态一致性检查，业务交互由主代理浏览器人工验收。

默认样式使用现有 CSS/Tailwind 体系，不新增依赖。新增代码应保持样式作用域清晰，避免案例样式污染宿主外壳；后续实现任务按项目约束使用 Luna max 子代理，主代理审查 diff、检查和浏览器证据。

## 当前代码事实与未知验证

下面的事实只说明代码路径或已有局部记录，不能直接转写为“重设计已完成”。“未知/待验收”是这组规格需要主代理后续核对的内容。

| 主题 | 当前代码证据 | 能说明的事实 | 目标仍未知或待验收 |
| --- | --- | --- | --- |
| 宿主骨架 | [`AppShell.tsx`](../../frontend/src/components/shell/AppShell.tsx) 与 [`AppShell.module.css`](../../frontend/src/components/shell/AppShell.module.css) | 已有顶部项目栏、约 360px 桌面左栏、右侧预览/代码和窄屏对话/预览切换 | 1440/1280 无遮挡和焦点顺序仍待主代理现场验证 |
| 项目栏 | [`ProjectManager.tsx`](../../frontend/src/components/shell/ProjectManager.tsx) | 已显示项目名切换、已接受版本/保存状态、保存、唯一主导出和更多菜单；操作复用现有 persistence/mutation | 1280px 密度、菜单焦点和保存保护仍待验收 |
| 主会话与输入 | [`ChatPanel.tsx`](../../frontend/src/components/shell/ChatPanel.tsx#L143-L229)、[`useChat.ts`](../../frontend/src/hooks/useChat.ts#L51-L107) | 已有单一底部 `Sender`、消息列表、取消/重试入口、示例/真实切换，发送前按当前文件判断内部操作 | 目标单一主会话在重设计布局中的恢复、聊天/编辑/生成边界、焦点保留和完整真实链路仍待验收 |
| 阶段与耗时 | [`GenerationStatusPanel.tsx`](../../frontend/src/components/shell/GenerationStatusPanel.tsx#L17-L113) | 已显示生成/回复状态、阶段、步骤、客户端耗时、失败位置和取消提示；诊断文字明确“客户端接收间隔（含网络）” | 目标左栏的密度、滚动、长耗时、阶段折叠与 1440/1280 可读性尚未验证；不能把客户端间隔称为服务端节点耗时 |
| 候选边界 | [`CandidatePanel.tsx`](../../frontend/src/components/shell/CandidatePanel.tsx#L18-L78)、[`SandpackView.tsx`](../../frontend/src/components/preview/SandpackView.tsx#L91-L108) | 已展示候选摘要、基线 hash、文件变更、L0–L5 校验、修复、应用和放弃；候选预览使用候选文件 | 目标布局中候选与消息、预览的联动、冲突、应用前后二次验证和导出隔离待浏览器验收 |
| 项目保存与切换 | [`useProjectPersistence.ts`](../../frontend/src/hooks/useProjectPersistence.ts#L39-L188)、[`ProjectManager.tsx`](../../frontend/src/components/shell/ProjectManager.tsx#L47-L207) | 已有 IndexedDB 手动保存、打开、另存为、恢复版本、dirty 保护和保存失败保留内存内容；切换/新建有 loading、候选、组装和 dirty 判断 | 完整保存失败、损坏记录、配额、双标签、多状态切换和重设计中的弹窗焦点待人工核对；没有自动保存证据也不应新增承诺 |
| 版本与消息分离 | [`chatStore.ts`](../../frontend/src/store/chatStore.ts#L92-L109)、[`ProjectBrowserModal.tsx`](../../frontend/src/components/shell/ProjectBrowserModal.tsx#L53-L61) | 已恢复 `Project.messages`、文件和版本；聊天卡片可关联 `VersionCard`，项目浏览器另列版本历史 | 目标视觉上清楚区分消息历史、已接受版本、工作副本和候选；完整 v2 恢复成新版本、标签/备注和 dirty 分支待验收 |
| 右侧预览/代码 | [`PreviewPanel.tsx`](../../frontend/src/components/shell/PreviewPanel.tsx)、[`PreviewToolbar.tsx`](../../frontend/src/components/preview/PreviewToolbar.tsx)、[`SandpackView.tsx`](../../frontend/src/components/preview/SandpackView.tsx) | 已有预览/代码视图、独立工具栏、刷新事件、全屏、模板/构建/挂载/运行状态和重试；代码区有文件树和编辑器 | 无遮挡与键盘可达性仍待主代理验证；无设备切换和缩放是明确边界 |
| 导出对象 | [`PreviewToolbar.tsx`](../../frontend/src/components/preview/PreviewToolbar.tsx#L27-L47) | 当前优先取 `previewFiles ?? currentFiles ?? generatedFiles`，并可传 `previewManifest`；预置案例展示文件与项目工作副本已有隔离字段 | 目标必须显示当前导出对象，不能默认宣称是已接受版本；候选不得静默覆盖或混入项目导出，案例远程资源/ZIP/离线仍待人工确认 |
| 现有案例注册 | [`workspace/page.tsx`](../../frontend/src/app/workspace/page.tsx)、[`caseRegistry.ts`](../../frontend/src/cases/caseRegistry.ts)、[`ChatPanel.tsx`](../../frontend/src/components/shell/ChatPanel.tsx) | 工作台按选中 ID 动态加载小说、任务看板和三个新案例；示例空态有五个入口 | 旧入口、保存项目和新案例浏览器交互由主代理现场验收 |
| 既有案例事实 | [`novelCase.ts`](../../frontend/src/cases/novelCase.ts#L19-L47)、[`taskBoardCase.ts`](../../frontend/src/cases/task-board/taskBoardCase.ts#L8-L32)、各新案例 `case.json` | 小说为 backend/mock 组装成果；任务看板和三个新案例均有 descriptor、manifest、来源记录和静态 map；资源、离线和原生 ZIP 仍有边界说明 | 旧入口和保存项目兼容性要在重设计后实测；不能把静态 map 当成 ZIP/离线通过证据 |

## 稳定需求 ID

这些 ID 是本组规格与后续实现/验收的索引。验收文档给出每个 ID 的可操作步骤；没有浏览器或检查证据时保持“待验证”。

| 需求 ID | 稳定要求 | 对应验收 |
| --- | --- | --- |
| `R-WR-01` | 宿主工作台采用顶部项目栏、左对话栏、右预览/代码区的桌面结构；案例内部导航不占用宿主导航位 | `A-WR-01`、`A-WR-02`、`A-CASE-01` |
| `R-WR-02` | 顶部提供 Logo、项目名/切换、已接受版本/保存状态、手动保存、唯一主导出和更多项目操作；右栏可复用主导出动作但不强制重复；保存不是自动触发 | `A-WR-03`、`A-WR-08`、`A-WR-10` |
| `R-WR-03` | 左栏桌面约 340–380px，保留单一底部输入框、消息、阶段和实测客户端耗时；不新增 generate/edit/chat 开关 | `A-WR-04`、`A-WR-05`、`A-WR-06` |
| `R-WR-04` | 右栏工具栏可达预览/代码、刷新、全屏，并可复用顶部主导出的对象标签；不提供设备模拟、缩放和移动专项改版 | `A-WR-07`、`A-WR-08` |
| `R-WR-05` | 一个项目一个主会话，复用 `Project.messages`；消息历史、版本历史、候选和工作副本保持语义分离 | `A-WR-11`、`A-WR-12` |
| `R-WR-06` | 保留现有内部 `generate`/`edit`/`chat` 判定、当前文件/hash 基线和候选确认边界；聊天不创建候选/版本 | `A-WR-06`、`A-WR-09` |
| `R-WR-07` | 明确空白、执行、候选、失败、取消、保存失败、切换项目等状态；状态不伪造上游终止或服务端耗时 | `A-STATE-01`～`A-STATE-07` |
| `R-WR-08` | 保留窄屏降级且无横向溢出；不增加移动设备模拟或移动专项 UI | `A-WR-02`、`A-WR-04` |
| `R-CASE-01` | 旧小说/阅读笔记和 `task-board-real-eval` 入口继续兼容，既有保存项目不删除；旧 URL 不要求继续占首页默认展示位，首页只做必要同步 | `A-CASE-01`、`A-CASE-04` |
| `R-CASE-02` | 新增客户管理后台、数据分析看板、个人博客三份案例；固定演示数据和明确交互，来源与静态注册已落地，各自通过目标环境验收后保持工作台直接可达 | `A-CASE-02`、`A-CASE-03` |
| `R-CASE-03` | 新案例经过现有真实生成链路产出，保存原始输入/输出、来源、人工修正和资源许可；静态打开不重新调用模型 | `A-CASE-05` |
| `R-CASE-04` | 案例内部导航、表格、抽屉、筛选和阅读主题留在案例 iframe/文件内；宿主只负责项目与工作台操作 | `A-CASE-03`、`A-CASE-04` |
| `R-CASE-05` | 明确固定数据、远程资源失败表达、导出对象和离线限制；不得使用真实联系人或宣称 ZIP/离线已通过 | `A-CASE-06`、`A-WR-08` |
| `R-CHECK-01` | 通过必要的 frontend tsc、lint、build、案例一致性和 `git diff --check`；浏览器状态由主代理人工验收，不添加 Playwright E2E | `A-CHECK-01`、`A-CHECK-02` |

## 既有契约的保留规则

1. **主会话和项目身份**：使用现有 `Project.messages`、`currentProjectId`、项目仓储和 hydrate 语义；切换项目时不能将消息、文件、候选或版本串入另一项目。
2. **输入判定**：复用现有 `classifyRequestIntent` 和 `useChat` 的内部 `generate`、`edit`、`chat`、澄清路径。对话框、顶部菜单和案例入口不得让用户通过模式开关绕过判定。
3. **编辑基线**：编辑请求继续冻结发送时的 `currentFiles`/`generatedFiles` 与资源 hash；当前编辑器快照优先于历史消息，历史只按现有有界规则提供辅助上下文。
4. **候选隔离**：候选携带候选 ID、运行 ID、基线 hash、结构化变更和分层校验；应用前不得覆盖当前工作副本，冲突、失败、取消、放弃或过期结果都不能静默写回。
5. **项目保存**：沿用 IndexedDB、显式手动保存、dirty 状态、修订号比较、打开/另存为/恢复/重命名/删除保护。不得以状态更新、查看预览或输入文字为理由自动保存。
6. **版本语义**：已接受版本按现有自动数字序列；手动编辑和手动保存工作副本不创建版本；恢复旧版本创建带 `restoredFrom` 来源的新版本，保留历史快照。
7. **预览状态**：沿用模板加载、Sandpack 构建、应用挂载、运行错误、超时和重试的分层诊断；`done`、iframe load 或 `status=running` 单独不能称为 ready。
8. **导出对象**：导出按钮必须显式说明对象。预置案例默认导出 `previewFiles` 及其 manifest；项目默认导出当前工作副本（优先 `currentFiles`，没有时才用 `generatedFiles`），允许包含未保存编辑，但不能把它标为已接受版本。候选默认保持隔离，不得因候选正在预览而替换项目导出；若未来提供候选导出，必须是带候选 ID 的显式动作。
9. **耗时与取消**：界面可显示 `GenerationStatusPanel` 已有的客户端接收间隔和用户总等待时间，但必须标注口径；取消承诺停止接收/停止图流，不承诺供应商模型调用已完全终止。
10. **资源和案例**：远程资源只在 manifest 中声明 URL、类型、许可和失败边界；不把远程字节伪装成本地文件，不在导出或离线说明中做未验证承诺。

## 待讨论但不阻止本规格成立的细节

- 顶部“更多”菜单把重命名、删除、打开、另存为、版本历史如何分组；这些操作的语义已经由现有项目管理契约限定。
- 右侧刷新是直接复用 `SandpackPreview` 的 refresh，还是由外层工具栏调用同一 `runSandpack` 重试函数；二者都不能改变候选隔离和 ready 判定。
- 预置案例在空态显示为链接、卡片还是下拉入口；只要不删除旧 URL、不让案例浏览触发模型请求即可。
- 三个 case ID 和来源记录见 [`demo-cases.md`](./demo-cases.md) 与 [`implementation-status.md`](./implementation-status.md)；没有目标环境运行和交互证据时，不能宣称 Sandpack ready、ZIP 可用或离线可用。

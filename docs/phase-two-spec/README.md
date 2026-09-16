# PromptForge 第二阶段规格（讨论稿）

状态：阶段 A 代码与资源清单已实现，阶段 B 代码已实现，阶段 C 最小候选隔离切片已实现，阶段 D 分层校验/有限修复切片与固定任务板验收工具已实现，阶段 E 评测/来源门槛工具已实现；阶段 F 的 F1/F2/F3 代码已实现，并有对应 fixture、前端 tsc、lint 和 build 证据。阶段 F 已有局部 Edge 桌面现场；显式 chat 路由也已有一次真实聊天局部证据，完整浏览器矩阵、移动端/键盘、真实聊天完整链路、ZIP 和 IndexedDB 第五类故障仍待人工验收。2026-09-16 已完成串行 EVAL-01 3/3、EVAL-02 3/3 的真实 recorder 记录，并保留 EVAL-02 首次协议误判及修复原因。独立任务看板案例 `task-board-real-eval` 已根据真实来源、构建检查和主代理 Edge 临时 Vite 人工 EVAL-03 证据标为 `READY`，首页链接和 `/workspace?case=task-board-real-eval` 的静态接入也已完成；同日另有一次 Edge 目标工作台 Sandpack 渲染/握手和筛选现场证据。该 `READY` 与单次现场不覆盖完整状态矩阵、移动端/键盘、导出构建、离线使用、原生 ZIP、第五类 IndexedDB 故障或其他入口浏览器路径；固定远程封面保留 URL/HTTP 证据和一次详情 iframe 尺寸证据。
更新时间：2026-09-17

本目录把第二阶段要解决的问题、产品判断、当前能力基线、用户体验状态、项目与变更语义、验证口径和待决问题拆开记录。它是执行计划的输入，不是执行计划本身；执行记录见 [`docs/phase-two-plan/`](../phase-two-plan/)。

章节编号只表示建议阅读顺序，不表示实施顺序、排期或任务拆分。规格中的“已验证”仍要求现场证据，不能由代码存在或 fixture 代替。

## 当前执行状态与已确认决策

- 阶段 A 已建立案例资源 manifest、预览副本桥接、Sandpack 构建/挂载/运行诊断、可配置等待边界和真实运行记录脚本；实现与未验证项见 [`phase-a.md`](../phase-two-plan/phase-a.md)。
- 阶段 B 已建立 IndexedDB 项目仓储、可序列化工作副本/版本/运行摘要和保存/打开/恢复界面；实现与未验证项见 [`phase-b.md`](../phase-two-plan/phase-b.md)。
- 阶段 C 已建立明确的生成/聊天/编辑 operation（当时为显式 operation 契约）、当前文件 base 快照、结构化编辑合并和候选隔离预览/确认应用；阶段 F1 已把普通入口改为内部自动判定，保留阶段 C 的候选隔离与确认应用边界；实现与未验证项见 [`phase-c.md`](../phase-two-plan/phase-c.md)。
- 阶段 D 已建立 L0-L5 可序列化验证报告、真实 Sandpack 构建/挂载诊断、候选有限修复入口和固定任务板交互检查工具；实现与未验证项见 [`phase-d.md`](../phase-two-plan/phase-d.md)。
- 阶段 E 已建立固定 EVAL-01/EVAL-02 prompt 契约、REAL-EVAL/PROTOCOL-FIXTURE/FIXED-INTERACTION 分池报告、真实 run 复用和独立案例来源门槛；实现与未验证项见 [`phase-e.md`](../phase-two-plan/phase-e.md)。2026-09-16 的固定 run `task-board-eval-01-001`、`task-board-eval-01-002`、`task-board-eval-01-003` 和 `task-board-eval-02-001`、`task-board-eval-02-002`、`task-board-eval-02-003` 均记录为真实模式成功，EVAL-02 的候选文件从 `candidate.data.files` 读取；另有历史 EVAL-02 协议误判和 Mock 拒绝证据。混合目录报告不能当作固定三次成功率。独立案例 `task-board-real-eval` 已固化为 `READY`，并完成首页/工作台静态入口接入；2026-09-16 Edge 目标工作台另有一次 Sandpack 渲染、`done(compilatonError=false)` + `app-mounted` 握手和筛选证据。该状态和这次现场仅覆盖对应路径，不覆盖完整状态矩阵、移动端/键盘、导出、离线、ZIP、IndexedDB 或其他浏览器验收。
- 阶段 F1/F2/F3 已落地：一个项目对应一个主会话并复用 `Project.messages`；新建项目为空白，打开项目恢复保存的消息、代码和版本；普通 UI 不提供首次生成/当前代码修改开关，内部判定 `generate`/`edit`/`chat`，编辑上下文默认最多最近 6 条消息；项目列表支持重命名/删除、删除事务保护和旧标签页失效写入；顶部显示项目名/版本/保存状态，版本自动递增并记录恢复来源。F1/F2/F3 fixture、tsc、lint/build 已通过；上述局部 Edge 现场已验证，完整浏览器矩阵和真实聊天链路仍未验证。验收继续使用独立 `UX-SESSION-*`、`UX-PROJECT-*`、`UX-VERSION-*`、`UX-MIGRATION-*` 编号，不改写 A–E 历史 EVAL 证据或分母。交接见 [`phase-f.md`](../phase-two-plan/phase-f.md)。
- `8ef7b44` 修复普通聊天请求的操作类型和路由：前端将内部 `chat` 判定发送为 `operation=chat`，后端校验接受后直接进入既有 chat graph，保留 `generate`/`edit` 兼容；`checkPhaseF1.mjs` 覆盖显式 chat 接受、直达 chat graph 和不创建候选。2026-09-17 Edge 首次因旧后端进程返回 HTTP 400，重启后同一解释请求约 4.2 秒完成并显示“回复完成 真实模型”，只追加 assistant 文本，项目仍 `v4 · 未保存`，无候选/新版本，直接 SSE 为 `flow=chat`、`done`。HTTP 400 是修复前证据，不计为成功；完整 generate/edit/澄清、取消/重试和完整真实聊天链路仍未验证。
- 预览 ready 的判定是 Sandpack `done` 且 `compilatonError=false`，并收到入口内 `app-mounted`；模板收到、代码可见、iframe `load` 或 `status=running` 都不能单独宣称 ready。
- 资源清单同时约束宿主案例、Sandpack 文件和 Vite 导出；小说案例的六个固定 Unsplash 封面放在 `externalResources`，导出只保留 URL 元数据，不把远程字节伪造为本地文件。缺少必需本地资源必须失败，真实生成结果没有对应 manifest 时不沿用小说案例 manifest。
- 真实生成记录必须收到明确的 `mode={mode:"real",forced:false}`，不允许缺失 mode 或强制 Mock 结果被记录为真实；成功 run ID 复用，中断/失败产生新 attempt。
- 阶段 F 的首版存储决策是 IndexedDB + 显式手动保存；不做自动保存、云同步或通用多会话/线程架构。F2/F3 已实现旧记录可选字段和默认主会话兼容，并由 legacy fixture 检查；真实存量损坏记录、第五类 IndexedDB 故障和完整浏览器迁移仍未验证，不伪造消息、文件、运行或版本历史。
- 固定任务板不要求 Playwright E2E，使用单元/集成检查或用户人工确认；独立案例当前以真实来源和 Edge 临时 Vite EVAL-03 人工证据达到 `READY`，并已接入首页链接和 `/workspace?case=task-board-real-eval`。目标工作台已有一次 Sandpack 渲染/握手和关键词/优先级筛选证据，但完整状态矩阵、移动端/键盘、原生 ZIP 下载、导出、离线和第五类 IndexedDB 故障场景由用户手动完成，当前保持未验证。
- `e9bbb1d` 修复任务看板 source 的 5 个 ESLint error 后，`pnpm --dir frontend run lint` 为 0 errors、23 个既有 warnings；主代理独立复跑 tsc、build、案例组装一致性、案例检查和 `git diff --check` 均通过。修复后 Edge 目标工作台刷新任务看板约 25 秒内收到真实 `done(compilatonError=false)` + `app-mounted`，完成三列/4 条任务、空标题校验、新增计数 5、编辑描述、状态移动、关键词“登录”筛选 1 条及优先级筛选清除/重置的单次回归；该证据不覆盖完整状态矩阵。控制台仅见扩展 hydration、Tailwind CDN、React Router 和扩展日志警告，没有应用运行失败。
- `checkPhaseE.mjs` 的临时 fixture 没有真实输入；未安装 Playwright 时固定交互检查按预期保持 `NOT_READY`/`skipped/not-verified`，这不是代码或评测失败。独立案例的 `checkTaskBoardCase.mjs` 才读取真实来源和人工 EVAL-03，并返回 `READY`。
- 2026-09-16 在 Codex In-app Browser 临时 tab 的 viewport `390x844` 下观察到 `document.documentElement.clientWidth=390`、`scrollWidth=390`、`body.scrollWidth=390`；截图显示顶部项目栏、对话/预览切换和预览容器无横向溢出。观察窗口内 Sandpack 未完成启动，界面显示“启动耗时较长，仍在等待真实运行事件…”，因此只记录移动布局/加载提示的部分证据；已完成桌面焦点与表单局部验证，纯键盘完整流程和移动端键盘、移动端表单/筛选完整操作、移动端 ready、其他浏览器和完整状态矩阵仍未验证，外部沙盒未就绪不归为应用失败。
- 工作台 Sandpack 曾因本地 `/book-cover.svg` 文件键交付失败：6 个 iframe 图片 `complete=true` 但 `naturalWidth=0`。现已切换为六个固定 Unsplash URL，主代理已取得六个 URL 的 `200 image/jpeg` HTTP 证据；Edge 目标工作台另观察到小说详情 iframe 封面 `complete=true,naturalWidth=400,naturalHeight=560`。一次资源观察不能替代完整资源矩阵、导出和离线证据；浏览器扩展注入、React Router 和 Tailwind CDN 警告不记录为产品失败。

## 已确认的阶段边界

第二阶段要把当前可演示的生成工作台推进到“结果可以核验、编辑可以保留、项目可以恢复”的产品基础。范围包含：

- 修正预置案例的图片资源交付和预览空白/加载状态表达；
- 已固化一个由真实模型生成、经过构建检查和 Edge 临时 Vite 人工验收的独立任务看板案例；来源和人工修正均可追溯，未使用 Mock 回放制造案例。该案例仍保持独立目录，目标工作台已有一次 Sandpack 渲染/握手和筛选证据；完整状态矩阵、移动端/键盘、导出、ZIP 和离线边界需另行验收；
- React 范围内完成项目保存、重新打开和恢复；让后续 AI 修改以当前编辑器文件为基线，并能保留手改内容；
- 一个项目一个主会话：新建空白、打开恢复 `Project.messages`/代码/版本并继续聊天；现有会话创建另一个项目需确认，背景可按用户选择带入，文件/版本不混用（F1 代码与 fixture 已验证，上述局部 Edge 现场已验证，真实聊天和完整浏览器矩阵仍未验证）；
- 项目列表重命名和显式删除，删除事务覆盖本地文件、消息、版本、候选、run、验证/恢复记录及关联索引；失败保留列表/工作副本，当前项目删除成功进入空白入口，旧标签写入不得静默复活（F2 代码与 fixture 已验证，事务失败和多标签现场仍未验证）；
- 顶部项目名、已接受版本和保存状态，以及自动数字版本、可选标签/备注、历史/当前区分和恢复来源（F3 代码与 fixture 已验证，完整浏览器版本/恢复流程仍未验证）；
- 为生成结果提供运行/源码校验、有限且可追溯的修复，以及固定需求的效果评测；
- 失败、取消、重试、保存失败、预览不可用和多标签页冲突都有可理解的状态。

Vue 只在本阶段做范围评估和问题记录，不实现 Vue 生成、预览、保存或修复链路。

## 文档地图

| 文档 | 负责内容 |
| --- | --- |
| [01-product-intent.md](./01-product-intent.md) | 产品意图、用户价值、原则和阶段决策 |
| [02-capability-baseline.md](./02-capability-baseline.md) | 以当前代码路径为证据的能力矩阵，区分已实现、部分实现、未实现和未验证 |
| [03-requirements.md](./03-requirements.md) | 稳定需求 ID、优先级、范围和非目标 |
| [04-experience-and-states.md](./04-experience-and-states.md) | 入口、案例、生成、预览、保存、失败恢复、键盘和移动端状态 |
| [05-project-and-change-contract.md](./05-project-and-change-contract.md) | 项目、工作副本、版本、候选结果、运行记录、资源、保存恢复、并发和导出语义 |
| [06-validation-and-evaluation.md](./06-validation-and-evaluation.md) | 构建、运行、功能保留、有限修复、指标和固定评测场景 |
| [07-acceptance-and-open-questions.md](./07-acceptance-and-open-questions.md) | 需求到验收的映射、待决问题、建议默认值和手动验收项 |

## 术语和判断规则

“当前生成结果”指最近一次已经被接受的完整文件集合；“当前编辑文件”指用户在编辑器中实际看到和修改的文件；两者可能不同。项目保存和案例固化都必须明确保存的是哪一个。

“候选结果”指一次新生成或修复产生、尚未通过本阶段要求的校验和验收的文件集合。候选结果不能静默覆盖已接受结果。

“运行数据”指生成应用在沙盒中的任务、筛选状态等内存数据；“项目源码”指文件、版本、对话和编辑记录。两者的保存语义分开定义，不能因为项目源码恢复就宣称沙盒内任意运行数据也会恢复。

“主会话”指项目内部唯一的消息上下文，首版复用 `Project.messages`，不是需要独立持久化的通用多会话对象。“当前编辑快照”指发送时编辑器中的完整文件 map（含未保存内容）及 hash；它优先于历史消息，历史只作辅助。edit 默认最多使用最近 6 条消息，不代表完整会话记忆。

“版本号”指系统按项目自动递增的用户可见数字序列；版本名/备注是可选标签，手写 `1.0.0` 不改变 `versionId`、快照、hash 或顺序。没有已接受版本时显示“尚无已接受版本”，不显示 v0；手动编辑或保存工作副本不创建已接受版本。

文档中的“必须”是阶段验收门槛，“应”是默认产品行为，“可”是允许的实现选择。“已实现”只表示代码中存在并已有对应证据；“已验证”还需要在目标环境完成可复现实验；“未验证”不能当作通过。

# 阶段 D 交接：分层校验与有限修复

状态：阶段 D 的 React 候选校验和有限修复最小切片已实现，主代理仍需在真实 Sandpack、真实后端和固定任务看板页面上现场验收。阶段 E 已记录 EVAL-01 真实生成成功、EVAL-02 首次协议误判及修复后的 EVAL-02 重跑成功；固定任务看板不要求 Playwright E2E，采用单元/集成检查或用户人工确认；缺少 Playwright 或外部预览超时都不能写成通过。

权威范围见[第二阶段执行计划](../phase-two-spec/plan.md)的“阶段 D”，本记录只描述实现和证据，不替代计划。

## 已实现

| 需求/计划条目 | 代码证据 | 行为和边界 |
| --- | --- | --- |
| L0-L5 分层报告 | [`validation.ts`](../../frontend/src/types/validation.ts)、[`validationReport.ts`](../../frontend/src/lib/validationReport.ts)、[`CandidatePanel.tsx`](../../frontend/src/components/shell/CandidatePanel.tsx) | 候选携带可序列化 `ValidationReport`，逐层记录协议、源码、预览、固定功能、保存恢复和有限修复；每层只能是 `pass`、`fail`、`skipped` 或 `not-verified`。L0-L2 是当前应用门槛，任何未验证状态都不能启用应用按钮；L3-L5 可按场景绑定并单独展示。 |
| Sandpack 构建与挂载诊断 | [`usePreviewDiagnostics.ts`](../../frontend/src/components/preview/usePreviewDiagnostics.ts)、[`SandpackView.tsx`](../../frontend/src/components/preview/SandpackView.tsx) | 监听已安装 Sandpack 的原始 `start`/`compile`/`state`/`done`/`action` 事件；`done` 且 `compilatonError=false` 仅写入构建通过，入口 bridge 的 `app-mounted` 才写入 ready。运行、资源、网络、模板和外部超时分别归类，iframe load、代码可见和 `status=running` 不会替代 ready。 |
| 候选分层展示和隔离 | [`chatStore.ts`](../../frontend/src/store/chatStore.ts)、[`candidateActions.ts`](../../frontend/src/hooks/candidateActions.ts) | 面板可展开变更路径并显示每层状态、摘要、证据和错误类别；候选预览仍使用独立文件副本，应用前重新检查当前文件 hash。失败、取消、冲突、EOF 和未验证候选保留在候选区，不覆盖工作副本。 |
| 修复候选双基线契约 | [`editGeneration.ts`](../../backend/routes/editGeneration.ts)、[`editContract.ts`](../../backend/routes/editContract.ts)、[`changeContract.ts`](../../frontend/src/lib/changeContract.ts)、[`checkPhaseD.mjs`](../../scripts/checkPhaseD.mjs) | `baseHash` 只表示本轮模型收到的文件/资源快照；`acceptanceBaseHash` 和成对的 `sourceCandidateId/sourceBaseHash` 表示原工作副本接受基线。普通编辑两者相同，修复结果继承原接受基线；应用门槛核对 `CandidateState.baseHash`，不把内部修复基线当作外部冲突基线。缺少成对来源字段或来源不匹配会拒绝候选。 |
| 有限修复入口 | [`useChat.ts`](../../frontend/src/hooks/useChat.ts)、[`chatRequestRunner.ts`](../../frontend/src/hooks/chatRequestRunner.ts)、[`validationReport.ts`](../../frontend/src/lib/validationReport.ts)、[`constants/validation.ts`](../../frontend/src/constants/validation.ts) | “尝试修复”仅对候选的 `build`、`runtime` 或 `resource` 错误显示；请求继续走 `operation=edit`，携带候选文件、资源、本轮模型 `baseHash`、原接受 `sourceBaseHash`、来源 candidateId 和新的 runId，结果重新进入隔离候选。默认最多 2 次、总预算 10 分钟、单轮验证 120 秒；相同错误签名、达到次数/时间边界时提前停止。网络、供应商限流、模板、存储、基线冲突、取消和超时不触发代码修复。 |
| 修复记录 | [`ValidationReport`](../../frontend/src/types/validation.ts)、[`chatStore.ts`](../../frontend/src/store/chatStore.ts) | 报告保存候选 runId、每层结果、错误类别、修复次数、累计耗时和每轮签名/终态；修复成功只有在新候选再次获得 L2 ready 证据后才可能应用。真实 run 和协议 fixture 的样本池分开。 |
| 固定任务板验收工具 | [`checkTaskBoard.mjs`](../../scripts/checkTaskBoard.mjs)、[`checkPhaseD.mjs`](../../scripts/checkPhaseD.mjs) | 固定交互优先由单元/集成检查或用户人工确认覆盖；现有 `data-testid` 页面脚本只是可选辅助，不执行模型生成的 shell 或 package script。当前没有固定页面的人工确认或对应测试证据，相关项保持 `not-verified`。 |

## 检查证据

本阶段使用纯协议 fixture 验证报告门槛、构建+挂载才可应用、可修复错误类别、网络阻断、重复错误停止和次数/时间预算。固定任务板的单元/集成或人工证据尚未补齐；可选页面脚本缺少 Playwright 或 URL 时逐条输出 `not-verified`，不能以空页面或代码存在替代功能通过。

本次收口还用 `checkPhaseD.mjs` 构造了独立修复候选：内部模型基线与原接受基线不同，候选状态保留 `sourceCandidateId/sourceBaseHash`，未变化的原工作副本能通过应用前 hash 门槛；把接受基线篡改为内部 hash 的事件会被拒绝。该证据仍是协议 fixture，不代表真实供应商修复或真实预览成功。

运行命令：

```text
node scripts/checkPhaseA.mjs
node scripts/checkPhaseB.mjs
node scripts/checkPhaseC.mjs
node scripts/checkPhaseD.mjs
frontend: pnpm exec tsc --noEmit
frontend: pnpm run build
backend: pnpm run build
frontend: pnpm exec eslint [阶段 D 相关文件]
git diff --check
```

`checkPhaseD.mjs` 的协议样本池是 `PROTOCOL-FIXTURE`，不能证明真实模型、真实 Sandpack 或固定任务板通过。`checkTaskBoard.mjs` 的固定交互样本池是 `FIXED-INTERACTION`；若需运行可选页面辅助脚本且已有 URL/Playwright，可通过 `TASK_BOARD_URL=... node scripts/checkTaskBoard.mjs` 重跑；没有这些条件时保持 `not-verified`，不影响单元/集成或人工验收口径。真实模型记录仍使用阶段 A 的 recorder，不能用 fixture 结果冒充 `REAL-EVAL`。

本次执行结果：`checkPhaseA.mjs`、`checkPhaseB.mjs`（含验证 run 摘要读回）、`checkPhaseC.mjs`、`checkPhaseD.mjs`、两个新增脚本的 `node --check`、前端定向 ESLint、前端 `tsc --noEmit`、前端生产构建、后端构建和 `git diff --check` 均退出 0。`checkPhaseD.mjs` 报告 `L0/L1` fixture 通过、L2 为 `not-verified`；固定任务板没有单元/集成或人工确认来源，页面脚本的 8 条断言保持 `not-verified`，这些状态不汇总成真实成功率。`checkPhaseB.mjs` 同时确认带候选校验报告的运行摘要可经 IndexedDB fixture 保存并读回。

## 2026-09-16 本地现场 / Mock smoke

- 390px 首页和工作台未见横向溢出；旧本地占位封面路径的首页 smoke 可显示，搜索“星辰”只剩一行，详情和阅读数据可达。固定远程封面切换后的工作台 iframe 图片仍待复验。
- 工作台示例体验与真实模式可切换，中心预览加载提示可见。强制 Mock 首次生成进入候选且项目名保持“新项目”，放弃候选后名称未改变；编辑请求明确失败、保留已有结果并显示“重新执行原始请求”。
- 项目管理 smoke 已保存并重新打开项目，dirty 保护弹窗分支已出现；这是单标签观察。导出按钮可见，但 CUA 未捕获原生 `download` 事件，导出仍未验证。
- 控制台 MutationObserver 错误证据指向 `@ant-design/x` 依赖内部滚动 hook；项目没有对应调用，本轮未修改 `node_modules`。

以上是本地 Mock smoke，不是付费模型、真实 Sandpack ready、固定任务板、导出 ZIP 下载或多标签故障通过证据。

## 未验证和明确限制

- 阶段 E 已记录一次 EVAL-01 真实成功、EVAL-02 首次协议误判及修复后的 EVAL-02 重跑成功，并保留 raw SSE；真实供应商输出、成本和模型耗时仍未完成三次评测与完整功能验收。
- 当前没有固定任务板的单元/集成或人工确认来源，因此八条辅助页面断言均为 `not-verified`。阶段 D 不固化任务看板，也不宣称形成成功率。
- 真实 Sandpack ready 仍需主代理在浏览器确认 `done`、`compilatonError=false` 和入口 `app-mounted`；外部 `TIME_OUT`/模板或依赖网络失败应保留为环境分类。
- L3 固定功能、L4 保存恢复和导出构建没有被协议 fixture 冒充通过；L4 继续由阶段 B 的手动 IndexedDB 语义负责。原生 ZIP 下载和第五类 IndexedDB 故障场景由用户手动确认，当前代理不因其阻塞，证据保持未验证。有限修复预算和验证超时是客户端可读默认值，真实环境仍需现场核对实际等待。
- 不实现 Vue、自动修复循环、云同步、ZIP 导入或通用运行数据恢复；修复结果不会绕过候选应用按钮的验证门槛。

## 主代理现场验收

1. 在不重启已有后端的前提下，使用真实或已审查的候选制造编译、运行、资源、网络和外部超时，确认层级分类和应用按钮状态；不要把 `done` 单独当作 ready。
2. 通过单元/集成检查或用户人工确认逐条检查固定任务板的入口、列表、新增、编辑、状态、筛选、空状态、表单和标题保留；可选页面脚本不可用时保持 `not-verified`。
3. 对候选触发一次代码/运行修复，确认新的 runId、base 文件和资源进入独立候选；验证通过前旧工作副本不变，重复错误、取消、冲突、网络失败和预算耗尽保留诊断并停止。
4. 通过真实 L2 ready 后再点击应用，核对版本仅在用户确认时创建，随后仍需手动保存；修复候选要确认应用前比较的是原工作副本接受基线，生成期间编辑仍进入 conflict；运行阶段 B 的刷新/打开/恢复现场验收。

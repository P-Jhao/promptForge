# 阶段 E 交接：独立任务看板评测与固化门槛

状态：评测契约、真实运行记录复用、统计报告和独立案例来源门槛已实现。2026-09-16 串行评测已完成 EVAL-01 3/3、EVAL-02 3/3；每次均满足 `mode=real`、`forced=false`、终态 `success`、可读 files（EVAL-02 为 `candidate.data.files`）和 `done`。EVAL-02 的首次独立探测仍因旧 recorder 只识别 `files` 事件而误判协议失败，原始 candidate 保留在 raw SSE，修复后重跑 `task-board-real-edit-probe-20260916-r2` 成功。串行三次记录与历史探测、Mock 拒绝样本分开解释，不能用混合报告宣称三次成功率。独立任务看板案例 `task-board-real-eval` 已根据真实来源、构建检查和主代理 Edge 临时 Vite 人工 EVAL-03 证据标为 `READY`；该状态不覆盖 Sandpack、离线、原生 ZIP 或第五类 IndexedDB 故障场景，也没有把小说案例改名复用。

权威范围见[第二阶段执行计划](../phase-two-spec/plan.md)的“阶段 E”。本记录描述实现与证据，不替代计划。

## 已实现

| 需求 | 代码证据 | 行为和边界 |
| --- | --- | --- |
| 固定评测需求 | [`taskBoardEvaluation.mjs`](../../scripts/lib/taskBoardEvaluation.mjs)、[`recordRealTaskBoard.mjs`](../../scripts/recordRealTaskBoard.mjs) | EVAL-01 沿用原 recorder 的完整固定 prompt，输出 SHA-256 和字符数；EVAL-02 固定增量包含“按优先级筛选”，并要求保留标题、新增/编辑、状态切换、关键词筛选、初始数据和优先级字段。记录器支持 `--scenario EVAL-01/EVAL-02`；EVAL-02 必须提供成功的 EVAL-01 `--base-run-id`，不会退化成首次生成。 |
| EVAL-03 故障隔离 | [`taskBoardEvaluation.mjs`](../../scripts/lib/taskBoardEvaluation.mjs)、[`checkPhaseE.mjs`](../../scripts/checkPhaseE.mjs) | EVAL-03 协议故障归入 `PROTOCOL-FIXTURE`；独立案例的固定任务板人工确认归入 `FIXED-INTERACTION`。本次 EVAL-03 使用主代理 Edge 临时 Vite 页面，三类样本池不会合并统计。 |
| 真实 run 与 attempt 复用 | [`realRunRecorder.mjs`](../../scripts/lib/realRunRecorder.mjs)、[`realCandidateEvidence.mjs`](../../scripts/lib/realCandidateEvidence.mjs)、[`realRunReadiness.mjs`](../../scripts/lib/realRunReadiness.mjs) | 成功 run ID 在场景和 prompt hash 一致时复用；不同场景或 prompt 不复用。running 记录在下一次启动前标记为 interrupted；每次新尝试保留独立 `attempt-NNN`。raw SSE、脱敏 files、配置摘要、项目/版本/base hash 摘要、mode evidence、事件类型和终态指针均保留。编辑候选从 `candidate.data.files` 记录文件，并在 `candidateEvidence` 中保留 candidate ID、双基线 hash、资源元数据、变更路径/操作/内容 hash 摘要和 summary；缺字段、空 files 或重复 candidate 会拒绝。来源门槛还要求顶层和 latest 均为 success、明确 `REAL-EVAL`、`mode=real/forced=false`、事件含 `done`，且 files 指针可读、文件数一致；否则只能是 `NOT_READY/not-verified`。 |
| 统计报告 | [`reportTaskBoardEvaluation.mjs`](../../scripts/reportTaskBoardEvaluation.mjs)、[`taskBoardEvaluation.mjs`](../../scripts/lib/taskBoardEvaluation.mjs) | 报告列出每个样本池的 `N_all`、取消、环境阻断、未验证、原始成功、修复后成功、失败分类和 recorder 墙钟耗时口径；零分母或全为未验证时成功率为 `null/not-verified`，不制造比例。可读取既有 run summary/attempt 和人工修正记录。 |
| 固定次数串行编排 | [`runTaskBoardEvaluation.mjs`](../../scripts/runTaskBoardEvaluation.mjs) | 默认先串行执行 3 次 EVAL-01；仅从这 3 个固定 run ID 中找到可复用的 `REAL-EVAL`、`real/forced=false`、`success`、`done`、完整 files 且 `latest.request.promptSha256` 等于固定 EVAL-01 hash 的基线后，才串行执行 3 次 EVAL-02。成功 run 交给 recorder 按 run ID 复用；失败、取消、中断、环境阻断和未验证的 recorder 终态与分类原样保留，缺基线时 EVAL-02 明确列为未执行。编排末尾调用既有 report，不创建或固化案例。 |
| 固定交互报告接入 | [`checkTaskBoard.mjs`](../../scripts/checkTaskBoard.mjs) | 固定任务板当前以单元/集成检查或用户人工确认作为验收来源；现有 `data-testid/task-board-v1` 页面脚本可选，缺 Playwright、URL 或选择器时保留逐条 `not-verified`。不执行模型生成的 shell 或 package script。 |
| 独立案例固化门槛 | [`taskBoardEvaluation.mjs`](../../scripts/lib/taskBoardEvaluation.mjs)、[`checkTaskBoardCase.mjs`](../../scripts/checkTaskBoardCase.mjs) | 案例目录需有 `case.json`、独立 `caseId`、entry/files/resources/manifest/provenance 路径；manifest 的 case ID 必须一致，provenance 必须列 EVAL-01/02/03 证据。EVAL-01/02 必须对应真实 `mode=real, forced=false` 且有 files 的成功 run，三项证据必须为 pass 且有来源文件；当前 `task-board-real-eval` 的人工 EVAL-03 已满足，evaluator 返回 `READY`。缺任一项仍返回 `NOT_READY` 和原因码。路径遍历、novel/generated 目录和 novel case ID 被拒绝。 |
| 人工修正记录 | [`recordTaskBoardCorrection.mjs`](../../scripts/recordTaskBoardCorrection.mjs)、[`realRunRecorder.mjs`](../../scripts/lib/realRunRecorder.mjs) | 修正写入 run 目录的 `manual-corrections.json`，只保存场景、说明和路径并脱敏；不改写 raw SSE 或原始 files。报告会回读这些记录。 |

## 固定 prompt 证据

当前 `checkPhaseE.mjs` 输出：

```text
EVAL-01 sha256 = 2a0d1fa063e5d35a25ec48715d2b47023cdc19f7815685c2f556d7f93f66d7c5
EVAL-02 sha256 = 66504c0c354b7c678030ecbaef2570663ddf71fd946adfbc71e4cf5088600d8b
```

EVAL-01 的 prompt 文本来自既有 `recordRealTaskBoard.mjs` 固定需求；本次只是抽到共享契约供记录器、报告和 fixture 共用。EVAL-02 不会在没有 EVAL-01 成功文件基线时发送请求。

## 真实探测证据（2026-09-16）

- EVAL-01 `task-board-real-probe-20260916` 的 `attempt-001` 已收到 `mode=real`、`forced=false`、`done` 和 21 个文件，终态为 `success`。这是一次真实探测成功，不能代表默认三次评测或稳定成功率。
- EVAL-02 `task-board-real-edit-probe-20260916` 的 `attempt-001` 收到相同的真实模式证据、`candidate` 和 `done`，但旧版 `inspectEvent` 只在 `type=files` 时读取文件，遂以“缺少完整 files”记录为 `failed/protocol`。原始 SSE 的 `candidate.data.files`、`resources`、`changes`、`baseHash` 和 `acceptanceBaseHash` 仍保存在 `attempt-001/raw-sse.txt`。
- recorder 修复后，对上述首次 raw SSE 的只读重放确认 21 个文件和候选摘要可解析；随后实际重跑 `task-board-real-edit-probe-20260916-r2` 的 `attempt-001` 收到 `mode=real`、`forced=false`、`candidate`、`done` 和 21 个文件，终态为 `success`。该记录的 `candidateEvidence` 保留 candidate ID、双 base hash、0 个资源、2 条 modify 变更及变更内容 hash；模型重跑是主代理明确执行的第二次 EVAL-02 探测，没有改写首次失败 attempt 的历史终态。
- 本节前两条记录描述的是历史独立探测：一条 EVAL-01 成功、EVAL-02 一次首次协议误判和一次修复后成功；串行三次评测证据见下一节，不能与历史记录合并计算。
- 历史汇总曾显示 `REAL-EVAL N_all=4、N_raw_success=2`；这四条记录混合了 EVAL-01 成功、EVAL-02 首次协议失败、EVAL-02 修复后成功和历史 Mock 拒绝，不能把 `2/4` 解读为 EVAL-01/EVAL-02 三次成功率。`success` 仅表示 recorder 协议门槛满足。

## 串行真实评测证据（2026-09-16）

以下六条记录来自 `artifacts/real-runs/task-board` 的 `record.json`，均为串行评测的 `latest`：

| 场景 | run IDs | 模式、终态和事件 | files | recorder 墙钟时长 |
| --- | --- | --- | --- | --- |
| EVAL-01 | `task-board-eval-01-001`、`task-board-eval-01-002`、`task-board-eval-01-003` | 三次均为 `mode=real`、`forced=false`、`success`，事件含 `files`、`done` | 15、16、21 | 236s、213s、206s |
| EVAL-02 | `task-board-eval-02-001`、`task-board-eval-02-002`、`task-board-eval-02-003` | 三次均为 `mode=real`、`forced=false`、`success`，事件含 `candidate`、`done`，候选 `data.files` 和 files 指针可读 | 15、15、15 | 23s、55s、65s |

墙钟时长按 recorder 的 `startedAt→endedAt` 计算，只表示客户端接收 SSE 的墙钟跨度，不表示服务端或模型节点耗时。`reportTaskBoardEvaluation.mjs` 会读取目录中历史 probe、修复重跑和 Mock 拒绝记录，因此不能把混合报告的分母、成功数或比例当作上表的三次成功率；上表的 3/3 结论只引用这六个固定 run ID。

## 独立案例与 EVAL-03 人工证据（2026-09-16）

独立案例位于 `frontend/src/cases/task-board/`，`caseId=task-board-real-eval`。案例来源 run ID 为 EVAL-01 `task-board-eval-01-003` 和 EVAL-02 `task-board-case-edit-20260916`，并在 provenance 中保留 `task-board-real-probe-20260916`、`task-board-real-edit-probe-20260916-r2` 作为对照。案例源码中的人工修正包括显式 React 导入、类型路径和优先级规范化、错误边界类型化、三列看板与路由补齐、Tailwind/PostCSS 构建链、看板工具栏标题，以及让编辑页从共用任务 store 读取新增/更新任务；原始 run 目录没有改写。

主代理使用 Edge 在临时 Vite 页 `http://127.0.0.1:4176/#/` 完成 EVAL-03 人工验收：初始页面显示看板三列和 4 条任务；关键词“登录”得到 1 条，优先级“高”得到 2 条，均可清除/重置；空标题保存显示“标题不能为空”；新建“验收任务”返回 `/tasks`；进入新任务编辑页字段正确加载，修改描述保存后显示“已验证新增后编辑流程”；状态改为“进行中”后任务从待办列移入进行中列。截图确认 Tailwind utility 样式正常呈现。

上述三项来源证据和构建检查使 `evaluateCaseProvenance` 返回 `READY`，案例 metadata 与 validation report 已同步为 `READY`。案例现已通过首页链接和 `/workspace?case=task-board-real-eval` 的静态入口接入检查，示例体验直接读取已固化文件，不发送 `/api/chat`。这里的 `READY` 只表示真实来源、固定模板构建和临时 Vite 人工 EVAL-03 已满足独立案例固化门槛；不代表任务板在 Sandpack 中运行、离线可用、原生 ZIP 或第五类 IndexedDB 故障场景已验证。

## 负向 recorder 证据（2026-09-16）

本地强制 Mock 记录保存在 `artifacts/real-runs/task-board/task-board-mock-rejection-20260916/record.json`：`runId=task-board-mock-rejection-20260916`、`attempt=1`、`samplePool=REAL-EVAL`、`status=failed`，终态 `terminal.category=mode`，收到的模式为 `mode=mock`、`forced=true`。该 attempt 虽收到完整的 48 个文件和 `done` 事件，记录器仍拒绝登记为真实成功。

这是一条防止 Mock 冒充真实结果的负向证据，不是 EVAL-01 成功；未记录完整请求或任何密钥。该记录不提供 EVAL-02 基线，仍作为历史拒绝证据保留，不改变独立案例基于真实来源和人工 EVAL-03 得出的 `READY` 状态。

## 串行编排负向现场证据（2026-09-16）

本地强制 Mock 执行了单次串行编排：

```text
node scripts/runTaskBoardEvaluation.mjs --count 1 --base-url http://127.0.0.1:7001/api --output-dir artifacts/mock-orchestration-20260916 --report-output artifacts/mock-orchestration-20260916/evaluation-report.json --output artifacts/mock-orchestration-20260916/orchestration.json
```

实际结果为 EVAL-01 `attempt=1`、`exitCode=1`、`status=failed`、`terminalCategory=mode`，收到 48 个文件，`baselineRunId=null`。由于没有 `real` 成功基线，EVAL-02 数量为 `0`，并以 `notExecuted` 记录门控原因；报告 `status=NOT_READY`。

这是 Mock 防冒充和 EVAL-02 串行门控验证，不是成功率或案例来源证据。编排、报告和 raw SSE/files 产物位于已忽略的 `artifacts/` 下，不进入案例目录。

## 当前环境检查

```text
node --check scripts/lib/taskBoardEvaluation.mjs
node --check scripts/lib/realRunReadiness.mjs
node --check scripts/recordRealTaskBoard.mjs
node --check scripts/recordTaskBoardCorrection.mjs
node --check scripts/runTaskBoardEvaluation.mjs
node --check scripts/reportTaskBoardEvaluation.mjs
node --check scripts/checkPhaseE.mjs
node scripts/checkTaskBoardCase.mjs --write-report
node scripts/checkPhaseE.mjs
node scripts/reportTaskBoardEvaluation.mjs --runs-dir artifacts/real-runs/task-board --case-dir frontend/src/cases/task-board
```

`checkPhaseE.mjs` 通过了 prompt hash、EVAL-02 保留要求、candidate 事件解析和非法/缺 files 拒绝、三个样本池分离、分母/未验证计数、成功 run 复用、缺失真实来源拒绝和无真实成功声明检查。其临时 fixture 报告仍保持 `NOT_READY`，不读取或改写真实探测统计；独立案例的 `checkTaskBoardCase.mjs` 另行读取真实来源和人工 EVAL-03，返回 `READY`。报告脚本会混合目录中的历史记录，不能把混合报告的统计当作上一节固定六个 run 的三次结论。报告脚本同样返回缺失独立 case descriptor 的 `CASE_DESCRIPTOR_MISSING`，不创建案例。

已有真实环境时的可复制流程：

1. 需要固定三次串行评测时运行 `node scripts/runTaskBoardEvaluation.mjs --count 3 --output-dir artifacts/real-runs/task-board --report-output artifacts/real-runs/task-board/evaluation-report.json --output artifacts/real-runs/task-board/orchestration.json`。脚本使用 Node 子进程参数数组调用现有 recorder，不经过 shell，也不会把密钥写入编排结果。
2. 脚本先按 `task-board-eval-01-001..003` 串行记录 EVAL-01。每个成功 run ID 由 recorder 按固定场景和 prompt hash 复用；失败、取消、中断或环境阻断仍留下原始 attempt。没有可复用的 EVAL-01 基线时，EVAL-02 三次都列入 `notExecuted`，不会发送不完整的编辑请求。
3. 找到可复用基线后，脚本才按 `task-board-eval-02-001..003` 串行调用 recorder，并把同一 EVAL-01 文件快照作为 `--base-run-id`；末尾自动调用既有 `reportTaskBoardEvaluation.mjs`，报告按样本池回读所有已有 run。传入 `--count 1` 或 `--count 2` 只用于受控排查，正式评测保持默认三次。
4. 也可单独用 `node scripts/recordRealTaskBoard.mjs --scenario EVAL-01 --run-id <new-id>` 或 `node scripts/recordRealTaskBoard.mjs --scenario EVAL-02 --base-run-id <eval-01-id> --run-id <new-id>` 记录单个样本；EVAL-02 基线缺失时命令明确以 readiness 错误结束。固定任务板应优先提交单元/集成检查结果或用户人工确认；已有页面脚本仍可作为辅助报告，Unix 可用 `TASK_BOARD_URL=... node scripts/checkTaskBoard.mjs > <interaction-report.json>`，Windows PowerShell 等价写法为 `$env:TASK_BOARD_URL = "http://..."; node scripts/checkTaskBoard.mjs | Set-Content -Encoding utf8 -Path artifacts/real-runs/task-board/interaction-report.json`，输出文件可传给 report 的 `--interaction-report`，再人工写入独立案例 provenance。
5. 只有报告 `status=READY` 且来源、文件、资源 manifest 和三场景证据齐全后，才可将独立任务看板 case 目录标为 `READY`。当前 `frontend/src/cases/task-board/` 已满足该来源和证据门槛；真实 run 或人工证据未完成时，仍保持 `NOT_READY`。编排脚本不会创建案例，也不会用 fixture 或小说 mock 代替真实来源。

## 未验证和限制

- 本阶段已完成串行 EVAL-01 3/3、EVAL-02 3/3，以及独立案例 EVAL-03 的 Edge 临时 Vite 人工验收；历史 EVAL-02 协议误判和修复重跑仍保留。混合历史报告不用于替代固定三次统计，也没有将小说 48 文件 mock 作为真实评测样本。
- 独立案例的人工证据只覆盖临时 Vite 页面。真实 Sandpack ready、导出构建、保存/恢复和 EVAL-01/EVAL-02 功能保留仍需单独现场验收；原生 ZIP 下载与第五类 IndexedDB 故障场景由用户手动完成，当前保持未验证。
- recorder 记录的是客户端接收的 SSE 墙钟起止时间；没有服务端节点耗时，也不会把客户端取消写成供应商已终止。
- 配置摘要只读取白名单键，raw SSE、文件和人工修正说明经过脱敏；密钥不写入案例或报告。真实案例仍需人工审查脱敏结果后再固化。
- 本阶段没有实现 Vue、多框架选择器、工作台核心 UI 或自动生成案例；报告工具不会凭 fixture 结果创建可用案例。

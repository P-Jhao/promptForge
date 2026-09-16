# 阶段 E 交接：独立任务看板评测与固化门槛

状态：评测契约、真实运行记录复用、统计报告和独立案例来源门槛已实现；当前没有通过来源门槛的真实任务看板 run、固定交互页面或可审查来源，因此独立任务看板案例保持 `NOT_READY`，没有写入 `frontend/src/cases/`，也没有把小说案例改名复用。

权威范围见[第二阶段执行计划](../phase-two-spec/plan.md)的“阶段 E”。本记录描述实现与证据，不替代计划。

## 已实现

| 需求 | 代码证据 | 行为和边界 |
| --- | --- | --- |
| 固定评测需求 | [`taskBoardEvaluation.mjs`](../../scripts/lib/taskBoardEvaluation.mjs)、[`recordRealTaskBoard.mjs`](../../scripts/recordRealTaskBoard.mjs) | EVAL-01 沿用原 recorder 的完整固定 prompt，输出 SHA-256 和字符数；EVAL-02 固定增量包含“按优先级筛选”，并要求保留标题、新增/编辑、状态切换、关键词筛选、初始数据和优先级字段。记录器支持 `--scenario EVAL-01/EVAL-02`；EVAL-02 必须提供成功的 EVAL-01 `--base-run-id`，不会退化成首次生成。 |
| EVAL-03 故障隔离 | [`taskBoardEvaluation.mjs`](../../scripts/lib/taskBoardEvaluation.mjs)、[`checkPhaseE.mjs`](../../scripts/checkPhaseE.mjs) | EVAL-03 归入 `PROTOCOL-FIXTURE`；固定任务板浏览器断言归入独立的 `FIXED-INTERACTION`。三类样本池不会合并统计。 |
| 真实 run 与 attempt 复用 | [`realRunRecorder.mjs`](../../scripts/lib/realRunRecorder.mjs)、[`realRunReadiness.mjs`](../../scripts/lib/realRunReadiness.mjs) | 成功 run ID 在场景和 prompt hash 一致时复用；不同场景或 prompt 不复用。running 记录在下一次启动前标记为 interrupted；每次新尝试保留独立 `attempt-NNN`。raw SSE、脱敏 files、配置摘要、项目/版本/base hash 摘要、mode evidence、事件类型和终态指针均保留。来源门槛还要求顶层和 latest 均为 success、明确 `REAL-EVAL`、`mode=real/forced=false`、事件含 `done`，且 files 指针可读、文件数一致；否则只能是 `NOT_READY/not-verified`。 |
| 统计报告 | [`reportTaskBoardEvaluation.mjs`](../../scripts/reportTaskBoardEvaluation.mjs)、[`taskBoardEvaluation.mjs`](../../scripts/lib/taskBoardEvaluation.mjs) | 报告列出每个样本池的 `N_all`、取消、环境阻断、未验证、原始成功、修复后成功、失败分类和 recorder 墙钟耗时口径；零分母或全为未验证时成功率为 `null/not-verified`，不制造比例。可读取既有 run summary/attempt 和人工修正记录。 |
| 固定次数串行编排 | [`runTaskBoardEvaluation.mjs`](../../scripts/runTaskBoardEvaluation.mjs) | 默认先串行执行 3 次 EVAL-01；仅从这 3 个固定 run ID 中找到可复用的 `REAL-EVAL`、`real/forced=false`、`success`、`done`、完整 files 且 `latest.request.promptSha256` 等于固定 EVAL-01 hash 的基线后，才串行执行 3 次 EVAL-02。成功 run 交给 recorder 按 run ID 复用；失败、取消、中断、环境阻断和未验证的 recorder 终态与分类原样保留，缺基线时 EVAL-02 明确列为未执行。编排末尾调用既有 report，不创建或固化案例。 |
| 固定交互报告接入 | [`checkTaskBoard.mjs`](../../scripts/checkTaskBoard.mjs) | 通过 `--interaction-report` 将固定 `data-testid/task-board-v1` 断言纳入 `FIXED-INTERACTION`；缺 Playwright、URL 或选择器时保留逐条 `not-verified`。不执行模型生成的 shell 或 package script。 |
| 独立案例固化门槛 | [`taskBoardEvaluation.mjs`](../../scripts/lib/taskBoardEvaluation.mjs) | 预期案例目录需有 `case.json`、独立 `caseId`、entry/files/resources/manifest/provenance 路径；manifest 的 case ID 必须一致，provenance 必须列 EVAL-01/02/03 证据。EVAL-01/02 必须对应真实 `mode=real, forced=false` 且有 files 的成功 run，三项证据必须为 pass 且有来源文件；缺任一项返回 `NOT_READY` 和原因码。路径遍历、novel/generated 目录和 novel case ID 被拒绝。 |
| 人工修正记录 | [`recordTaskBoardCorrection.mjs`](../../scripts/recordTaskBoardCorrection.mjs)、[`realRunRecorder.mjs`](../../scripts/lib/realRunRecorder.mjs) | 修正写入 run 目录的 `manual-corrections.json`，只保存场景、说明和路径并脱敏；不改写 raw SSE 或原始 files。报告会回读这些记录。 |

## 固定 prompt 证据

当前 `checkPhaseE.mjs` 输出：

```text
EVAL-01 sha256 = 2a0d1fa063e5d35a25ec48715d2b47023cdc19f7815685c2f556d7f93f66d7c5
EVAL-02 sha256 = 66504c0c354b7c678030ecbaef2570663ddf71fd946adfbc71e4cf5088600d8b
```

EVAL-01 的 prompt 文本来自既有 `recordRealTaskBoard.mjs` 固定需求；本次只是抽到共享契约供记录器、报告和 fixture 共用。EVAL-02 不会在没有 EVAL-01 成功文件基线时发送请求。

## 负向 recorder 证据（2026-09-16）

本地强制 Mock 记录保存在 `artifacts/real-runs/task-board/task-board-mock-rejection-20260916/record.json`：`runId=task-board-mock-rejection-20260916`、`attempt=1`、`samplePool=REAL-EVAL`、`status=failed`，终态 `terminal.category=mode`，收到的模式为 `mode=mock`、`forced=true`。该 attempt 虽收到完整的 48 个文件和 `done` 事件，记录器仍拒绝登记为真实成功。

这是一条防止 Mock 冒充真实结果的负向证据，不是 EVAL-01 成功；未记录完整请求或任何密钥。该记录不提供 EVAL-02 基线，独立任务板案例继续保持 `NOT_READY`。

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
node scripts/checkPhaseE.mjs
node scripts/reportTaskBoardEvaluation.mjs --runs-dir artifacts/real-runs/task-board --case-dir frontend/src/cases/task-board
```

`checkPhaseE.mjs` 通过了 prompt hash、EVAL-02 保留要求、三个样本池分离、分母/未验证计数、成功 run 复用、缺失真实来源拒绝和无真实成功声明检查。当前报告为 `NOT_READY`：REAL-EVAL 有上述 1 条实际 recorder 记录（`N_all=1`、原始成功 `0`、修复后成功 `0`、`mode` 失败 `1`），没有可复用的 EVAL-01 成功基线，因此 EVAL-02 未执行；固定交互 8 条断言因没有 Playwright/URL 均为 `not-verified`。报告脚本同样返回缺失独立 case descriptor 的 `CASE_DESCRIPTOR_MISSING`，不创建案例。

已有真实环境时的可复制流程：

1. 需要固定三次串行评测时运行 `node scripts/runTaskBoardEvaluation.mjs --count 3 --output-dir artifacts/real-runs/task-board --report-output artifacts/real-runs/task-board/evaluation-report.json --output artifacts/real-runs/task-board/orchestration.json`。脚本使用 Node 子进程参数数组调用现有 recorder，不经过 shell，也不会把密钥写入编排结果。
2. 脚本先按 `task-board-eval-01-001..003` 串行记录 EVAL-01。每个成功 run ID 由 recorder 按固定场景和 prompt hash 复用；失败、取消、中断或环境阻断仍留下原始 attempt。没有可复用的 EVAL-01 基线时，EVAL-02 三次都列入 `notExecuted`，不会发送不完整的编辑请求。
3. 找到可复用基线后，脚本才按 `task-board-eval-02-001..003` 串行调用 recorder，并把同一 EVAL-01 文件快照作为 `--base-run-id`；末尾自动调用既有 `reportTaskBoardEvaluation.mjs`，报告按样本池回读所有已有 run。传入 `--count 1` 或 `--count 2` 只用于受控排查，正式评测保持默认三次。
4. 也可单独用 `node scripts/recordRealTaskBoard.mjs --scenario EVAL-01 --run-id <new-id>` 或 `node scripts/recordRealTaskBoard.mjs --scenario EVAL-02 --base-run-id <eval-01-id> --run-id <new-id>` 记录单个样本；EVAL-02 基线缺失时命令明确以 readiness 错误结束。Unix 可用 `TASK_BOARD_URL=... node scripts/checkTaskBoard.mjs > <interaction-report.json>`；Windows PowerShell 等价写法为 `$env:TASK_BOARD_URL = "http://..."; node scripts/checkTaskBoard.mjs | Set-Content -Encoding utf8 -Path artifacts/real-runs/task-board/interaction-report.json`，输出文件作为固定交互证据并可传给 report 的 `--interaction-report`，再人工写入独立案例 provenance。
5. 只有报告 `status=READY` 且来源、文件、资源 manifest 和三场景证据齐全后，才可新增独立任务看板 case 目录。真实 run 未完成时，保持 `NOT_READY`；编排脚本不会创建案例，也不会用 fixture 或小说 mock 代替真实来源。

## 未验证和限制

- 本阶段没有启动付费模型，没有写入真实任务看板源码或资源，也没有将小说 48 文件 mock 作为评测样本。
- 当前无 Playwright 和固定任务板 URL；固定交互结果不能标成通过。真实 Sandpack ready、导出构建、保存/恢复和 EVAL-01/EVAL-02 功能保留仍需主代理现场验收。
- recorder 记录的是客户端接收的 SSE 墙钟起止时间；没有服务端节点耗时，也不会把客户端取消写成供应商已终止。
- 配置摘要只读取白名单键，raw SSE、文件和人工修正说明经过脱敏；密钥不写入案例或报告。真实案例仍需人工审查脱敏结果后再固化。
- 本阶段没有实现 Vue、多框架选择器、工作台核心 UI 或自动生成案例；报告工具不会凭 fixture 结果创建可用案例。

# 阶段 E 交接：独立任务看板评测与固化门槛

状态：评测契约、真实运行记录复用、统计报告和独立案例来源门槛已实现；当前没有真实任务看板 run、固定交互页面或可审查来源，因此独立任务看板案例保持 `NOT_READY`，没有写入 `frontend/src/cases/`，也没有把小说案例改名复用。

权威范围见[第二阶段执行计划](../phase-two-spec/plan.md)的“阶段 E”。本记录描述实现与证据，不替代计划。

## 已实现

| 需求 | 代码证据 | 行为和边界 |
| --- | --- | --- |
| 固定评测需求 | [`taskBoardEvaluation.mjs`](../../scripts/lib/taskBoardEvaluation.mjs)、[`recordRealTaskBoard.mjs`](../../scripts/recordRealTaskBoard.mjs) | EVAL-01 沿用原 recorder 的完整固定 prompt，输出 SHA-256 和字符数；EVAL-02 固定增量包含“按优先级筛选”，并要求保留标题、新增/编辑、状态切换、关键词筛选、初始数据和优先级字段。记录器支持 `--scenario EVAL-01/EVAL-02`；EVAL-02 必须提供成功的 EVAL-01 `--base-run-id`，不会退化成首次生成。 |
| EVAL-03 故障隔离 | [`taskBoardEvaluation.mjs`](../../scripts/lib/taskBoardEvaluation.mjs)、[`checkPhaseE.mjs`](../../scripts/checkPhaseE.mjs) | EVAL-03 归入 `PROTOCOL-FIXTURE`；固定任务板浏览器断言归入独立的 `FIXED-INTERACTION`。三类样本池不会合并统计。 |
| 真实 run 与 attempt 复用 | [`realRunRecorder.mjs`](../../scripts/lib/realRunRecorder.mjs)、[`realRunReadiness.mjs`](../../scripts/lib/realRunReadiness.mjs) | 成功 run ID 在场景和 prompt hash 一致时复用；不同场景或 prompt 不复用。running 记录在下一次启动前标记为 interrupted；每次新尝试保留独立 `attempt-NNN`。raw SSE、脱敏 files、配置摘要、项目/版本/base hash 摘要、mode evidence、事件类型和终态指针均保留。来源门槛还要求顶层和 latest 均为 success、明确 `REAL-EVAL`、`mode=real/forced=false`、事件含 `done`，且 files 指针可读、文件数一致；否则只能是 `NOT_READY/not-verified`。 |
| 统计报告 | [`reportTaskBoardEvaluation.mjs`](../../scripts/reportTaskBoardEvaluation.mjs)、[`taskBoardEvaluation.mjs`](../../scripts/lib/taskBoardEvaluation.mjs) | 报告列出每个样本池的 `N_all`、取消、环境阻断、未验证、原始成功、修复后成功、失败分类和 recorder 墙钟耗时口径；零分母或全为未验证时成功率为 `null/not-verified`，不制造比例。可读取既有 run summary/attempt 和人工修正记录。 |
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

## 当前环境检查

```text
node --check scripts/lib/taskBoardEvaluation.mjs
node --check scripts/lib/realRunReadiness.mjs
node --check scripts/recordRealTaskBoard.mjs
node --check scripts/recordTaskBoardCorrection.mjs
node --check scripts/reportTaskBoardEvaluation.mjs
node --check scripts/checkPhaseE.mjs
node scripts/checkPhaseE.mjs
node scripts/reportTaskBoardEvaluation.mjs --runs-dir artifacts/real-runs/task-board --case-dir frontend/src/cases/task-board
```

`checkPhaseE.mjs` 通过了 prompt hash、EVAL-02 保留要求、三个样本池分离、分母/未验证计数、成功 run 复用、缺失真实来源拒绝和无真实成功声明检查。当前报告为 `NOT_READY`：REAL-EVAL 和 PROTOCOL-FIXTURE 没有已登记 run；固定交互 8 条断言因没有 Playwright/URL 均为 `not-verified`。报告脚本同样返回缺失独立 case descriptor 的 `CASE_DESCRIPTOR_MISSING`，不创建案例。

已有真实环境时的可复制流程：

1. 用 `node scripts/recordRealTaskBoard.mjs --scenario EVAL-01 --run-id <new-id>` 记录 EVAL-01；必须收到 `mode={mode:real,forced:false}`、files 和 done 才会标为成功。
2. 在 EVAL-01 已接受并保存、且能提供文件基线后，用 `node scripts/recordRealTaskBoard.mjs --scenario EVAL-02 --base-run-id <eval-01-id> --run-id <new-id>` 记录增量编辑；若基线缺失，命令明确以 readiness 错误结束。
3. 将 `TASK_BOARD_URL=... node scripts/checkTaskBoard.mjs > <interaction-report.json>` 的输出作为固定交互证据，并人工写入独立案例 provenance；再运行报告脚本检查固化门槛。
4. 只有报告 `status=READY` 且来源、文件、资源 manifest 和三场景证据齐全后，才可新增独立任务看板 case 目录。真实 run 未完成时，保持 `NOT_READY`。

## 未验证和限制

- 本阶段没有启动付费模型，没有写入真实任务看板源码或资源，也没有将小说 48 文件 mock 作为评测样本。
- 当前无 Playwright 和固定任务板 URL；固定交互结果不能标成通过。真实 Sandpack ready、导出构建、保存/恢复和 EVAL-01/EVAL-02 功能保留仍需主代理现场验收。
- recorder 记录的是客户端接收的 SSE 墙钟起止时间；没有服务端节点耗时，也不会把客户端取消写成供应商已终止。
- 配置摘要只读取白名单键，raw SSE、文件和人工修正说明经过脱敏；密钥不写入案例或报告。真实案例仍需人工审查脱敏结果后再固化。
- 本阶段没有实现 Vue、多框架选择器、工作台核心 UI 或自动生成案例；报告工具不会凭 fixture 结果创建可用案例。

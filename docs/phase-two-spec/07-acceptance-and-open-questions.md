# 07 验收映射与待决问题

本文件把稳定需求映射到可审查的验收条目。阶段 A/B/C/D 已有代码和 fixture 证据；2026-09-16 已完成 EVAL-01、EVAL-02 各 3 次真实 recorder 记录，并保留 EVAL-02 首次协议误判；独立任务看板案例 `task-board-real-eval` 已以真实来源、构建检查和 Edge 临时 Vite EVAL-03 人工证据标为 `READY`，首页链接和 `/workspace?case=task-board-real-eval` 的静态入口代码已接入。该状态不覆盖入口在外部 Sandpack、导出构建、离线、原生 ZIP、第五类 IndexedDB 或目标工作台浏览器中的运行；相关项目仍需现场或用户手动验证。阶段 A-E 的实现与证据边界见 [`phase-a.md`](../phase-two-plan/phase-a.md)、[`phase-b.md`](../phase-two-plan/phase-b.md)、[`phase-c.md`](../phase-two-plan/phase-c.md)、[`phase-d.md`](../phase-two-plan/phase-d.md) 和 [`phase-e.md`](../phase-two-plan/phase-e.md)。

## 需求到验收映射

| 验收 ID | 覆盖需求 | 验收判定 |
| --- | --- | --- |
| A-CASE-01 | R-COVER-01 | 固定 Unsplash allowlist 和 manifest 已检查，六个 URL 均有 `200 image/jpeg` HTTP 证据；Sandpack iframe 重新加载、导出解压后的资源引用和离线行为仍未验证。 |
| A-CASE-02 | R-PREVIEW-01、R-GEN-01 | 人为拉长模板/沙盒启动并制造运行错误；代码可见但未 ready 时保持启动状态；真实 ready 后才显示可用；超时/错误可重试且不清除已有结果。 |
| A-CASE-03 | R-CASE-01、R-CASE-02、R-CASE-03 | **固化门槛已完成：** `frontend/src/cases/task-board/` 的 `caseId=task-board-real-eval`、manifest、provenance、真实来源 `task-board-eval-01-003`/`task-board-case-edit-20260916` 和 EVAL-03 证据均已核对，evaluator 返回 `READY`，且不是小说 48 文件或 Mock 新回放；首页链接和 `/workspace?case=task-board-real-eval` 的静态接入代码已检查。**仍需验证：** 入口在目标 Sandpack/工作台浏览器中的运行、导出、离线和 ZIP 边界未覆盖。 |
| A-PROJECT-01 | R-PROJECT-01、R-PROJECT-02 | **Edge 现场已完成桌面主路径：** 项目名和 `App.tsx` 手改保存、刷新、重开后恢复，列表显示修订号；**仍需用户手动验证：** 保存失败、配额、损坏数据、多标签冲突和刷新/移动端边界。 |
| A-VERSION-01 | R-VERSION-01 | **Edge 现场已完成基本恢复：** 打开列表显示 `Version 1`，恢复后出现 `Version 2·恢复` 并保留 `Version 1`；dirty 状态下四个保护分支和第五类 IndexedDB 故障仍需用户手动验证。 |
| A-EDIT-01 | R-EDIT-01、R-CHANGE-01 | **Edge 现场已完成一次真实候选：** `operation=edit` 候选收到 50 个文件，应用后书架出现优先级筛选并实际筛出 3 行；完整工作台重复评测和 EVAL-02 保留率仍不能由一次候选代替。 |
| A-CHANGE-01 | R-CHANGE-01、R-CHANGE-02 | **Edge 现场已完成冲突保护：** 第二候选 L2 通过期间修改 `App.tsx` 后应用被标为基线冲突，L0 为 `fail`、按钮禁用且工作副本未覆盖；更多错误候选和跨环境场景仍需用户手动验证。 |
| A-VALIDATE-01 | R-VALIDATE-01 | 协议 fixture 和一次真实候选已证明分层门槛可记录，真实候选曾取得 L0/L1/L2 `pass`；完整 Sandpack L2、L3/L4 固定场景和导出仍未验证。SSE done、代码面板可见和 ZIP 下载不被当作运行/功能通过。 |
| A-FIX-01 | R-FIX-01 | 制造可控代码/运行失败，验证修复仅修改候选；每次修复重新校验并记录边界；达到未定但已配置的次数/时间/大小上限后停止且可恢复。 |
| A-EVAL-01 | R-EVAL-01 | **协议/来源证据已完成：** 2026-09-16 的 EVAL-01（`task-board-eval-01-001`、`task-board-eval-01-002`、`task-board-eval-01-003`）和 EVAL-02（`task-board-eval-02-001`、`task-board-eval-02-002`、`task-board-eval-02-003`）均为 `mode=real`、`forced=false`、`success`、`done`、files 可读；独立案例 EVAL-03 为 Edge 临时 Vite `FIXED-INTERACTION` 人工通过。**仍需验证：** recorder 墙钟仅是客户端 SSE 跨度，样本池不可混合；Sandpack、导出、ZIP、IndexedDB 和主工作台完整功能保留不由此结论覆盖。 |
| A-RECOVERY-01 | R-FAIL-01 | 覆盖 fail、EOF、超时、取消、429、预览失败和保存失败；重试上下文正确，旧结果不丢，文案不宣称上游模型已完全终止。 |
| A-DELIVERY-01 | R-EXPORT-01、R-SEC-01 | 手改后导出，解压检查当前文件、模板、依赖、资源 manifest；非法路径、过大资源和密钥不会进入包；资源无法解析时有明确阻断或缺失标记。 |
| A-UX-01 | R-A11Y-01、R-MOBILE-01 | 使用键盘完成三条固定场景的入口、编辑、保存、重试/取消和导出；在约 390px 宽度检查面板、状态、错误、代码和表格可读。 |
| A-RUNTIME-01 | R-RUNTIME-DATA-01 | 用固定 seed 检查任务看板每次启动的初始任务和功能断言；若案例声明跨刷新保存运行数据，单独验证该案例行为；未声明时不把源码恢复当作运行数据恢复。 |
| A-VUE-01 | R-VUE-EVAL-01 | 只提交 Vue 范围评估，列出模板、运行时、校验、保存和案例成本以及是否进入后续阶段；本条不以 Vue 功能实现作为本阶段通过条件。 |

## 待决问题与建议默认

这些问题会影响最终执行设计，当前没有被用户拍板。建议默认只是便于讨论，不是已批准决策。

| 问题 | 建议默认 | 需要明确的影响 |
| --- | --- | --- |
| 本地项目存储用什么 | 以 IndexedDB 保存项目快照、版本、工作副本和运行摘要；接口保持可替换 | 是否需要云端同步、跨设备登录和迁移；本阶段建议暂不扩大范围 |
| 保存触发策略 | 建议默认显式手动保存并显示 dirty；自动保存是否加入留待决，不把它当成本阶段已有能力 | 自动保存的频率、冲突提示、配额和用户对“已保存”的理解 |
| 保存粒度 | 保存整个可恢复快照，并单独记录 dirty 工作副本和不可变版本 | 文件多/资源大时的配额、压缩和旧版本清理策略 |
| 当前文件如何作为修改输入 | 以规范化文件 map + base hash/版本 ID 作为逻辑契约，传输可用完整 map 或 patch | 请求大小、隐私、合并能力和服务端模型上下文 |
| hash 和冲突策略 | 使用稳定内容 hash；接受前再次比较 base，冲突默认停下来让用户选择 | hash 算法、合并 UI、跨标签页通知和离线编辑行为 |
| 预览 ready 的证据 | 使用 Sandpack/iframe/运行时能提供的真实 ready 信号，并保留错误和超时 | 当前 Sandpack 版本是否提供足够事件，外部运行时不可用时的降级文案 |
| 预览空白超时边界 | 由环境配置决定，记录实际耗时；不要在 spec 中先写未经验证的秒数 | 不同网络/浏览器的误报率以及自动重试次数 |
| 自动修复上限 | 实现前以配置固定次数、时间、文件/资源大小和错误类别 | 成本、用户等待、供应商限流和是否允许再次生成 |
| 验证命令和依赖网络 | 为 React 固定类型检查/构建和 Sandpack 运行环境，分别记录外网可用性 | 无网环境是否允许只做源码验收，如何分类“环境阻断” |
| 任务看板的真实生成来源 | 已有 2026-09-16 的 EVAL-01/EVAL-02 各 3 次 `REAL-EVAL` 记录；独立案例使用 `task-board-eval-01-003` 和 `task-board-case-edit-20260916`，经人工修正与 Edge 临时 Vite EVAL-03 后为 `READY` | 真实模型成本、密钥使用、生成内容是否可公开、后续版本的人工修正是否允许；该 READY 不覆盖 Sandpack、ZIP 或离线 |
| 固化案例的存放和入口 | `frontend/src/cases/task-board/` 已使用独立 manifest、provenance 和 `caseId=task-board-real-eval`，并接入首页链接和 `/workspace?case=task-board-real-eval`；入口目标环境仍需验收 | 构建打包、案例资源、版本更新、入口设计和来源追溯；当前 READY 不表示主工作台浏览器或 Sandpack 已通过 |
| 任务运行数据 | 独立案例已确认固定初始任务和会话内新增/编辑/状态切换；不宣称跨刷新保存运行数据，也没有单独 seed 配置 | 是否需要运行时 store、数据迁移和与项目源码的关联 |
| 导出资源 | 导出前解析资源引用和实际条目，缺失时阻断或显式标记 | Vite `public` 路径、Sandpack 资源路径和部署基路径 |
| 本地项目不可见的提示 | 能检测到存储清除时说明已清除；否则显示“未找到本地项目”并列出可能原因，不声称确切原因或关页后仍保留内存 | 首次访问、换浏览器、无痕窗口和清站点数据的区分能力 |
| 多标签页体验 | 默认保存时检查版本/写入者并给出冲突；不做静默最后写入 | 是否需要 BroadcastChannel、合并视图和离线优先策略 |
| Vue 后续评估门槛 | 先完成 React 三场景和成本记录，再以独立评估决定是否立项 | 模板维护、模型 prompt、运行时、校验规则和案例数量 |

## 手动验收项目

以下项目按截至 2026-09-16 的证据标记；“已完成”只覆盖括号中的范围，剩余项仍需在目标环境留下证据：

1. **已完成（真实协议/来源）**：EVAL-01 的 `task-board-eval-01-001`、`task-board-eval-01-002`、`task-board-eval-01-003` 和 EVAL-02 的 `task-board-eval-02-001`、`task-board-eval-02-002`、`task-board-eval-02-003` 均已保存真实 run、可读文件或候选文件和 `done`；完整应用预览与功能通过仍未由 recorder 记录代替。
2. **已完成（独立案例固化与静态入口）**：`task-board-real-eval` 已检查真实来源、人工修正、依赖、manifest 和 provenance，EVAL-03 已在 Edge 临时 Vite 页完成；首页链接和 `/workspace?case=task-board-real-eval` 已接入并可直接选取静态文件，入口在 Sandpack、导出和离线环境中的运行仍未验证。
3. **已完成（Edge 桌面主路径）**：项目名和 `App.tsx` 手改保存、刷新、重新打开后恢复，列表显示修订号；任务看板临时 Vite 页的新增、编辑、描述保存和状态移动也已完成人工确认。
4. **部分完成，仍需用户手动验证**：版本列表的 `Version 1`、`Version 2·恢复` 和旧版本保留已在 Edge 确认；先制造 dirty 编辑后执行保存/另存为/放弃/取消四个保护分支，以及多标签冲突仍需验证。
5. **已完成（一次真实候选现场）**：当前编辑文件请求增加优先级筛选后，标题、已有交互和优先级筛选的候选应用/冲突保护已在 Edge 观察；该一次候选不替代 EVAL-02 三次的功能保留率。
6. **仍需用户手动验证**：预览启动、真实 Sandpack ready、资源失败、运行错误和外部超时的完整状态矩阵；一次候选的 L2 证据和临时 Vite 页面不等于独立案例在 Sandpack 中通过。
7. **仍需用户手动验证**：让生成、验证、预览和保存分别失败，检查旧结果、未保存编辑、重试和候选隔离；fixture 只能证明协议边界。
8. **仍需用户手动验证**：在可用网络中解压原生导出包，执行依赖安装/构建并检查封面和其他资源路径；当前不宣称 ZIP 或离线可用。
9. **部分完成，仍需用户手动验证**：EVAL-03 固定任务板的三列、筛选、新增、编辑、校验和状态切换已在 Edge 临时 Vite 页确认；窄屏、纯键盘以及目标工作台中的同样动作仍需验证。
10. **仍需用户手动验证**：清除站点数据、模拟配额不足、损坏记录和打开两个标签页，记录只能确认的 IndexedDB 状态，不能把可能原因写成确定原因。
11. **范围保留**：Vue 仍未实现；只保留后续范围评估，不把未实现能力写入阶段完成结论。

# 客户管理后台

`customer-management-demo` 是一个 React + TypeScript 的客户管理案例。当前版本按参考图重构为多文件结构，所有客户、联系人、电话、邮箱、跟进记录和商机均为合成演示数据，不对应真实自然人或真实商务关系。

预览不调用后端、数据库、模型接口或远程资源。新增、编辑、删除、跟进记录和销售机会只保存在当前 Sandpack/浏览器运行内存中，刷新或使用右上角“重置演示数据”会恢复固定数据。

核心源码位于 `source/`，并拆分为 `components/`、`data/`、`hooks/`、`types/`、`utils/` 与 `styles/`。`generatedFiles.ts` 由 `source/` 当前内容重新生成，用于宿主工作台装配 Sandpack 文件。

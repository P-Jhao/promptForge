# 客户管理后台

`customer-management-demo` 由真实 `/api/chat` 运行 `customer-management-demo-20260917` 取得初始文件，随后由 Luna 对生成结果做了交互聚焦修正并通过 `assembleWorkspaceDemoCase.mjs` 固化。原始 SSE、文件和模型配置摘要保留在 `artifacts/real-runs/workspace-demos/`；这里的客户信息全部是合成数据。

预览不调用模型或后端接口。新增与编辑只在当前 Sandpack 运行内存中生效，刷新会恢复固定数据。没有远程图片或离线资源承诺。

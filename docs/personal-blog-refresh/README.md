# `personal-blog-demo` 内容更新

## 变更

个人博客案例现在展示参考图二的清川博客首页：精选文章、作者卡片、文章列表、分类/标签搜索、文章详情、明暗主题和订阅提示。

案例使用虚构中文内容与 CSS 图形，不依赖外部图片、CMS 或实时数据服务。`frontend/src/cases/personal-blog/source/` 是源文件，`generatedFiles.ts` 由 `node scripts/assembleWorkspaceDemoCase.mjs --case=personal-blog` 重新生成。

## 验证边界

源码 TypeScript、ESLint、案例一致性和构建检查应在本次改动后重新执行。浏览器端完整桌面布局、Sandpack 案例内交互和导出仍按工作台验收文档单独记录，案例状态继续保持 `PENDING_BROWSER`。

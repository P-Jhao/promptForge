# CHANGES

## 本次改进

在保留客户管理页原有功能和参考图视觉结构的基础上，补齐左侧导航的全部演示页面。现在点击“工作台、销售机会、跟进记录、合同管理、产品管理、数据报表、团队协作、系统设置”都会切换到对应内容，不再仅提示“属于宿主工作台的其他模块”。导航状态、顶部搜索、列表筛选和页面操作均与当前模块联动。

## 新增文件

- `source/components/ModuleCommon.tsx`：其他业务页面复用的标题、指标卡、状态标签和空状态组件。
- `source/data/workspace.ts`：商机、跟进、合同、产品、团队和设置的合成演示数据。
- `source/hooks/useWorkspaceModules.ts`：其他业务模块的本地状态与演示操作。
- `source/types/workspace.ts`：导航与其他业务模块的 TypeScript 类型。
- `source/pages/WorkbenchPage.tsx`
- `source/pages/OpportunitiesPage.tsx`
- `source/pages/FollowUpsPage.tsx`
- `source/pages/ContractsPage.tsx`
- `source/pages/ProductsPage.tsx`
- `source/pages/ReportsPage.tsx`
- `source/pages/TeamPage.tsx`
- `source/pages/SettingsPage.tsx`
- `source/styles/modules.css`

## 修改文件

- `source/App.tsx`：增加内部模块路由状态，按左侧导航渲染不同页面；保留客户新增、编辑、详情抽屉、跟进、商机和删除逻辑；统一演示数据重置。
- `source/components/Sidebar.tsx`：由固定“客户管理”选中状态改为根据当前模块动态高亮，并真实切换页面。
- `source/components/GlobalHeader.tsx`：顶部搜索根据当前模块显示不同提示；列表型模块可直接搜索，工作台/报表/设置页显示禁用搜索状态以避免无效控件。
- `source/styles.css`：加入 `modules.css`。
- `source/styles/layout.css`：补充顶部禁用搜索状态。
- `source/styles/responsive.css`：补充其他业务页面在 1180px、900px、680px、430px 下的自适应布局。
- `generatedFiles.ts`：按 `source/` 当前 37 个文件重新生成。
- `README.md`：补充多模块页面与本地交互说明。
- `provenance.json`：保留原始来源字段，仅补记本次导航和页面扩展事实。
- `validation-report.json`：更新为本次实际执行的静态检查结果；没有把未执行的浏览器验收写成通过。

## 删除文件

- 无。

## 新增的可用交互

- 左侧 9 个导航项均可切换并正确高亮。
- 工作台可查看客户、销售漏斗和今日待办，并可跳转客户管理或直接新增客户。
- 销售机会支持顶部关键词搜索、阶段筛选和新增演示商机。
- 跟进记录支持顶部关键词搜索、状态筛选、添加跟进和完成/恢复状态。
- 合同管理支持顶部关键词搜索、状态筛选和新增合同草稿。
- 产品管理支持顶部关键词搜索、分类筛选、新增产品和启用/停用。
- 数据报表支持时间范围切换并可导出本地 CSV。
- 团队协作支持顶部关键词搜索、团队筛选和邀请演示成员。
- 系统设置支持修改工作空间名称、时区、通知开关、紧凑表格模式，支持保存提示和恢复默认。
- 右上角“重置演示数据”会同时恢复客户数据与新增的其他模块数据。

## 解压覆盖后的检查命令

在 `customer-management/` 目录检查文件结构：

```bash
find source -type f | sort
```

检查没有引入 `any`：

```bash
grep -Rnw --include='*.ts' --include='*.tsx' -E '\bany\b' source
```

可在不依赖 React 类型包的情况下检查客户数据层：

```bash
npx tsc --noEmit --strict --target ES2020 --module ESNext --moduleResolution Bundler \
  source/types/customer.ts source/data/customers.ts source/utils/customer.ts
```

覆盖到宿主工作台后，再使用宿主仓库原有的 TypeScript/构建命令和浏览器预览流程进行最终验收；本案例目录没有新增 `package.json`、npm 依赖、后端或外部资源。

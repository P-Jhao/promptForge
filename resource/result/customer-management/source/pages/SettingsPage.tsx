import type { WorkspaceSettings } from "../types/workspace";
import { ModulePageHeader } from "../components/ModuleCommon";
import { Icon } from "../components/Icon";

export function SettingsPage({ settings, onChange, onReset, onFeedback }: { settings: WorkspaceSettings; onChange: (patch: Partial<WorkspaceSettings>) => void; onReset: () => void; onFeedback: (message: string) => void }) {
  const save = () => onFeedback("系统设置已保存到当前预览会话");
  const reset = () => { onReset(); onFeedback("系统设置已恢复默认值"); };
  return <div className="crm-content">
    <ModulePageHeader title="系统设置" subtitle="配置工作空间名称、时区和通知偏好。" actionLabel="保存设置" actionIcon="check" onAction={save} />
    <section className="settings-layout">
      <article className="module-panel settings-card"><div className="settings-card-heading"><span><Icon name="settings" size={19} /></span><div><strong>基础设置</strong><small>仅影响当前演示预览</small></div></div><div className="settings-form"><label>工作空间名称<input value={settings.companyName} onChange={(event) => onChange({ companyName: event.target.value })} /></label><label>时区<select value={settings.timezone} onChange={(event) => onChange({ timezone: event.target.value })}><option value="Asia/Shanghai">Asia/Shanghai (UTC+8)</option><option value="America/Los_Angeles">America/Los_Angeles</option><option value="Europe/London">Europe/London</option></select></label></div></article>
      <article className="module-panel settings-card"><div className="settings-card-heading"><span><Icon name="bell" size={19} /></span><div><strong>通知偏好</strong><small>选择希望接收的提醒类型</small></div></div><div className="toggle-list"><label><span><strong>邮件通知</strong><small>重要客户和合同变化提醒</small></span><input type="checkbox" checked={settings.emailNotifications} onChange={(event) => onChange({ emailNotifications: event.target.checked })} /></label><label><span><strong>浏览器通知</strong><small>跟进任务到期时在预览内提醒</small></span><input type="checkbox" checked={settings.browserNotifications} onChange={(event) => onChange({ browserNotifications: event.target.checked })} /></label><label><span><strong>每周经营摘要</strong><small>汇总客户、商机和合同数据</small></span><input type="checkbox" checked={settings.weeklyReport} onChange={(event) => onChange({ weeklyReport: event.target.checked })} /></label></div></article>
      <article className="module-panel settings-card"><div className="settings-card-heading"><span><Icon name="chart" size={19} /></span><div><strong>显示偏好</strong><small>控制列表密度等界面选项</small></div></div><div className="toggle-list"><label><span><strong>紧凑表格</strong><small>减少表格行高，在同屏显示更多内容</small></span><input type="checkbox" checked={settings.compactTable} onChange={(event) => onChange({ compactTable: event.target.checked })} /></label></div><button className="settings-reset-button" type="button" onClick={reset}>恢复默认设置</button></article>
    </section>
  </div>;
}

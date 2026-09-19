import { useState, type ChangeEvent } from "react";
import { SuitePageHeading } from "../components/SuitePageHeading";

export function PreferencesPage({ onFeedback }: { onFeedback: (message: string) => void }) {
  const [emailNotice, setEmailNotice] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [density, setDensity] = useState("舒适");
  const toggle = (label: string, value: boolean, setter: (next: boolean) => void) => { setter(!value); onFeedback(`${label}已${!value ? "开启" : "关闭"}。`); };
  return <>
    <SuitePageHeading title="偏好设置" subtitle="调整通知、报表与界面密度。设置仅保存在当前演示会话中。" />
    <section className="preferences-grid">
      <article className="panel preference-card"><div><h2>通知与报表</h2><p>控制日常提醒和周期性数据摘要。</p></div><button className="preference-row" type="button" onClick={() => toggle("邮件通知", emailNotice, setEmailNotice)}><span><strong>邮件通知</strong><small>重要数据变化和协作提醒</small></span><i className={`suite-switch ${emailNotice ? "on" : ""}`}><span /></i></button><button className="preference-row" type="button" onClick={() => toggle("每周经营报告", weeklyReport, setWeeklyReport)}><span><strong>每周经营报告</strong><small>每周一生成一份数据摘要</small></span><i className={`suite-switch ${weeklyReport ? "on" : ""}`}><span /></i></button><button className="preference-row" type="button" onClick={() => toggle("看板自动刷新", autoRefresh, setAutoRefresh)}><span><strong>看板自动刷新</strong><small>进入数据分析页时刷新演示数据状态</small></span><i className={`suite-switch ${autoRefresh ? "on" : ""}`}><span /></i></button></article>
      <article className="panel preference-card"><div><h2>界面偏好</h2><p>调整当前演示工作区的展示密度。</p></div><label className="preference-select"><span><strong>内容密度</strong><small>影响列表和卡片的视觉紧凑程度</small></span><select value={density} onChange={(event: ChangeEvent<HTMLSelectElement>) => { setDensity(event.target.value); onFeedback(`内容密度已切换为${event.target.value}。`); }}><option>舒适</option><option>标准</option><option>紧凑</option></select></label><div className={`density-preview density-${density}`}><span /><span /><span /><span /></div><button className="primary-action" type="button" onClick={() => onFeedback(`偏好设置已保存：${density}密度。`)}>保存偏好</button></article>
    </section>
  </>;
}

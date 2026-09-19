import { useMemo, useState } from "react";
import { Icon } from "../components/Icon";
import { SuitePageHeading } from "../components/SuitePageHeading";

type TaskState = "待处理" | "进行中" | "已完成";
interface TaskItem { id: number; title: string; owner: string; state: TaskState; due: string; }

const initialTasks: TaskItem[] = [
  { id: 1, title: "复盘 4 月客户增长", owner: "张三", state: "进行中", due: "04-24" },
  { id: 2, title: "整理重点客户跟进清单", owner: "陈嘉禾", state: "待处理", due: "04-25" },
  { id: 3, title: "核对 API 用量预算", owner: "周雯", state: "已完成", due: "04-22" },
  { id: 4, title: "准备渠道周报", owner: "林远", state: "进行中", due: "04-26" },
];
const members = ["张三", "陈嘉禾", "周雯", "林远", "方可"];

export function TeamCollaborationPage({ onFeedback }: { onFeedback: (message: string) => void }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [tab, setTab] = useState<"all" | TaskState>("all");
  const [inviteCount, setInviteCount] = useState(0);
  const visible = useMemo(() => tasks.filter((task) => tab === "all" || task.state === tab), [tab, tasks]);
  const advance = (task: TaskItem) => {
    const next: TaskState = task.state === "待处理" ? "进行中" : task.state === "进行中" ? "已完成" : "待处理";
    setTasks((current) => current.map((item) => item.id === task.id ? { ...item, state: next } : item));
    onFeedback(`“${task.title}”已更新为${next}。`);
  };

  return <>
    <SuitePageHeading title="团队协作" subtitle="查看成员协作状态与待办任务，让数据洞察能够被持续跟进和执行。" actions={<button className="primary-action suite-primary" type="button" onClick={() => { setInviteCount((value) => value + 1); onFeedback("已生成一个本地演示邀请名额。") }}><Icon name="users" size={14} />邀请成员</button>} />
    <section className="suite-stat-grid">
      <article className="suite-stat-card"><span>团队成员</span><strong>{members.length + inviteCount}</strong><small>{inviteCount ? `含 ${inviteCount} 个待加入名额` : "企业工作区成员"}</small></article>
      <article className="suite-stat-card"><span>进行中任务</span><strong>{tasks.filter((task) => task.state === "进行中").length}</strong><small>需要持续跟进</small></article>
      <article className="suite-stat-card"><span>待处理任务</span><strong>{tasks.filter((task) => task.state === "待处理").length}</strong><small>尚未开始</small></article>
      <article className="suite-stat-card"><span>已完成任务</span><strong>{tasks.filter((task) => task.state === "已完成").length}</strong><small>本周期完成</small></article>
    </section>
    <section className="suite-collab-grid">
      <article className="panel suite-panel"><div className="suite-panel-head"><div><h2>协作任务</h2><p>点击任务状态可推进工作流</p></div><div className="suite-tabs">{(["all", "待处理", "进行中", "已完成"] as const).map((value) => <button key={value} className={tab === value ? "active" : ""} type="button" onClick={() => setTab(value)}>{value === "all" ? "全部" : value}</button>)}</div></div><div className="task-list">{visible.map((task) => <button className="task-row" type="button" key={task.id} onClick={() => advance(task)}><span className={`task-dot ${task.state === "已完成" ? "done" : task.state === "进行中" ? "doing" : "todo"}`} /><span><strong>{task.title}</strong><small>{task.owner} · 截止 {task.due}</small></span><em>{task.state}</em></button>)}</div></article>
      <aside className="panel suite-panel"><div className="suite-panel-head"><div><h2>团队成员</h2><p>当前工作区活跃成员</p></div></div><div className="member-list">{members.map((member, index) => <button type="button" key={member} onClick={() => onFeedback(`已打开${member}的协作概览。`)}><span className="member-avatar">{member.slice(0, 1)}</span><span><strong>{member}</strong><small>{index === 0 ? "管理员" : "成员"}</small></span><em>{index < 4 ? "在线" : "离线"}</em></button>)}</div></aside>
    </section>
  </>;
}

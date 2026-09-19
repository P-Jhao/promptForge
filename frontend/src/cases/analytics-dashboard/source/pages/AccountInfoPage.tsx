import { useState, type ChangeEvent } from "react";
import { Icon } from "../components/Icon";
import { SuitePageHeading } from "../components/SuitePageHeading";

export function AccountInfoPage({ onFeedback }: { onFeedback: (message: string) => void }) {
  const [name, setName] = useState("张三");
  const [company, setCompany] = useState("PromptForge 企业工作区");
  const [title, setTitle] = useState("数据分析负责人");
  const save = () => onFeedback(`账户信息已在本地保存：${name} · ${title}。`);
  return <>
    <SuitePageHeading title="账户信息" subtitle="查看并维护当前登录账户的基础资料与企业套餐信息。" />
    <section className="account-page-grid">
      <article className="panel account-profile-card"><div className="account-profile-top"><span className="account-large-avatar">Z</span><div><h2>{name || "未命名用户"}</h2><p>企业版 · 管理员</p></div></div><div className="account-form"><label><span>姓名</span><input value={name} onChange={(event: ChangeEvent<HTMLInputElement>) => setName(event.target.value)} /></label><label><span>企业/工作区</span><input value={company} onChange={(event: ChangeEvent<HTMLInputElement>) => setCompany(event.target.value)} /></label><label><span>职位</span><input value={title} onChange={(event: ChangeEvent<HTMLInputElement>) => setTitle(event.target.value)} /></label><button className="primary-action" type="button" onClick={save}><Icon name="check" size={14} />保存资料</button></div></article>
      <aside className="panel account-plan-card"><span className="suite-detail-kicker">当前套餐</span><h2>企业版</h2><p>包含团队协作、企业 API、数据分析和权限管理等演示能力。</p><dl><div><dt>成员席位</dt><dd>5 / 20</dd></div><div><dt>API 月额度</dt><dd>500,000</dd></div><div><dt>数据保留</dt><dd>180 天</dd></div></dl><button className="action" type="button" onClick={() => onFeedback("套餐详情已打开，本案例不连接真实计费系统。")}>查看套餐详情</button></aside>
    </section>
  </>;
}

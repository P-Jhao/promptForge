import { useEffect, useState } from "react";
import { STATUS_LABELS } from "../data/customers";
import type { Customer } from "../types/customer";
import { Icon } from "./Icon";
import { CompanyMark, PersonAvatar } from "./Identity";

type DrawerTab = "basic" | "followups" | "opportunities" | "contracts" | "more";

const tabs: { id: DrawerTab; label: string }[] = [
  { id: "basic", label: "基本信息" },
  { id: "followups", label: "跟进记录" },
  { id: "opportunities", label: "销售机会" },
  { id: "contracts", label: "合同信息" },
  { id: "more", label: "更多" },
];

export function CustomerDrawer({
  customer,
  onClose,
  onEdit,
  onDelete,
  onAddFollowUp,
  onAddOpportunity,
  onFeedback,
}: {
  customer: Customer;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddFollowUp: () => void;
  onAddOpportunity: () => void;
  onFeedback: (message: string) => void;
}) {
  const [tab, setTab] = useState<DrawerTab>("basic");
  const [actionMenu, setActionMenu] = useState<"header" | "footer" | null>(null);

  useEffect(() => {
    setTab("basic");
    setActionMenu(null);
  }, [customer.id]);

  const copySummary = async () => {
    const summary = `${customer.company}｜${customer.name}｜${customer.phone}｜${customer.email}`;
    try {
      if (!navigator.clipboard) {
        onFeedback("当前环境不允许写入剪贴板");
        setActionMenu(null);
        return;
      }
      await navigator.clipboard.writeText(summary);
      onFeedback("客户联系信息已复制");
    } catch {
      onFeedback("当前环境不允许写入剪贴板");
    }
    setActionMenu(null);
  };

  return (
    <>
      <button className="drawer-mask" type="button" onClick={onClose} aria-label="关闭客户详情" />
      <aside className="customer-drawer" role="dialog" aria-modal="true" aria-label={`${customer.company}客户详情`}>
        <div className="drawer-header">
          <div className="drawer-company-heading">
            <CompanyMark company={customer.company} index={0} large />
            <div>
              <h2>{customer.company}</h2>
              <span className={`status-badge status-${customer.status}`}>{STATUS_LABELS[customer.status]}</span>
              <p>{customer.industry} · {customer.companySize}</p>
            </div>
          </div>
          <div className="drawer-header-actions">
            <div className="drawer-action-anchor">
              <button type="button" className="drawer-icon-button" onClick={() => setActionMenu((current) => current === "header" ? null : "header")} aria-label="更多操作"><Icon name="more" size={18} /></button>
              {actionMenu === "header" && (
                <div className="drawer-action-popover">
                  <button type="button" onClick={copySummary}><Icon name="copy" size={14} />复制联系信息</button>
                  <button type="button" className="danger" onClick={() => { setActionMenu(null); onDelete(); }}><Icon name="trash" size={14} />删除客户</button>
                </div>
              )}
            </div>
            <button type="button" className="drawer-icon-button" onClick={onClose} aria-label="关闭详情"><Icon name="close" size={18} /></button>
          </div>
        </div>

        <nav className="drawer-tabs" aria-label="客户详情选项卡">
          {tabs.map((item) => (
            <button key={item.id} type="button" className={tab === item.id ? "active" : ""} onClick={() => setTab(item.id)}>{item.label}</button>
          ))}
        </nav>

        <div className="drawer-body">
          {tab === "basic" && (
            <>
              <section className="drawer-card">
                <div className="drawer-section-heading"><h3>公司信息</h3><button type="button" onClick={onEdit}><Icon name="edit" size={14} />编辑</button></div>
                <dl className="company-info-grid">
                  <div><dt>公司名称</dt><dd>{customer.company}</dd></div>
                  <div><dt>英文名称</dt><dd>{customer.englishName || "待补充"}</dd></div>
                  <div><dt>所属行业</dt><dd>{customer.industry}</dd></div>
                  <div><dt>公司规模</dt><dd>{customer.companySize}</dd></div>
                  <div><dt>客户来源</dt><dd>{customer.source}</dd></div>
                  <div><dt>公司官网</dt><dd className="link-like">{customer.website || "待补充"}{customer.website && <Icon name="external" size={13} />}</dd></div>
                  <div className="full-row"><dt>公司地址</dt><dd>{customer.address || "待补充"}</dd></div>
                  <div className="full-row"><dt>公司简介</dt><dd>{customer.description || "暂无公司简介。"}</dd></div>
                </dl>
              </section>

              <section className="drawer-card contact-card">
                <h3>联系人信息</h3>
                <div className="contact-profile">
                  <PersonAvatar name={customer.name} />
                  <span><strong>{customer.name}</strong><small>{customer.contactRole || "联系人"}</small></span>
                </div>
                <div className="contact-lines">
                  <div><Icon name="phone" size={16} /><span>{customer.phone || "待补充"}</span></div>
                  <div><Icon name="mail" size={16} /><span>{customer.email || "待补充"}</span></div>
                </div>
              </section>

              <section className="drawer-card tag-card">
                <div className="drawer-section-heading"><h3>标签</h3><button type="button" onClick={onEdit}><Icon name="plus" size={14} />添加标签</button></div>
                <div className="customer-tags">
                  {customer.tags.length > 0 ? customer.tags.map((tag) => <span key={tag}>{tag}</span>) : <span className="muted-tag">暂无标签</span>}
                </div>
              </section>
            </>
          )}

          {tab === "followups" && (
            <section className="drawer-card drawer-tab-card">
              <div className="drawer-section-heading"><h3>跟进记录</h3><button type="button" onClick={onAddFollowUp}><Icon name="plus" size={14} />新增记录</button></div>
              {customer.followUps.length === 0 ? (
                <div className="drawer-empty"><Icon name="clock" size={21} /><strong>暂无跟进记录</strong><p>创建记录后会同步更新最近跟进时间。</p></div>
              ) : (
                <div className="timeline-list">
                  {customer.followUps.map((record) => (
                    <article key={record.id}><time>{record.date}</time><p>{record.note}</p></article>
                  ))}
                </div>
              )}
            </section>
          )}

          {tab === "opportunities" && (
            <section className="drawer-card drawer-tab-card">
              <div className="drawer-section-heading"><h3>销售机会</h3><button type="button" onClick={onAddOpportunity}><Icon name="plus" size={14} />创建机会</button></div>
              {customer.opportunities.length === 0 ? (
                <div className="drawer-empty"><Icon name="opportunity" size={21} /><strong>暂无销售机会</strong><p>创建机会后可在这里查看阶段和金额。</p></div>
              ) : (
                <div className="opportunity-list">
                  {customer.opportunities.map((opportunity) => (
                    <article key={opportunity.id}><div><strong>{opportunity.title}</strong><span>{opportunity.stage} · {opportunity.createdAt}</span></div><b>{opportunity.amount}</b></article>
                  ))}
                </div>
              )}
            </section>
          )}

          {tab === "contracts" && (
            <section className="drawer-card drawer-tab-card">
              <h3>合同信息</h3>
              {customer.status === "won" ? (
                <div className="contract-panel"><span className="contract-icon"><Icon name="file" size={21} /></span><div><strong>年度服务合同</strong><p>合同编号 DEMO-{customer.id.toUpperCase()} · 状态：已签署</p></div></div>
              ) : (
                <div className="drawer-empty"><Icon name="file" size={21} /><strong>暂无合同</strong><p>当前客户尚未进入已成交状态。</p></div>
              )}
            </section>
          )}

          {tab === "more" && (
            <section className="drawer-card drawer-tab-card">
              <h3>补充信息</h3>
              <dl className="stacked-info">
                <div><dt>客户来源</dt><dd>{customer.source}</dd></div>
                <div><dt>创建时间</dt><dd>{customer.createdAt}</dd></div>
                <div><dt>最近跟进</dt><dd>{customer.lastFollowUp}</dd></div>
                <div><dt>跟进备注</dt><dd>{customer.note || "暂无备注"}</dd></div>
              </dl>
            </section>
          )}
        </div>

        <footer className="drawer-footer">
          <div className="drawer-footer-more-anchor">
            <button type="button" className="drawer-more-footer" onClick={() => setActionMenu((current) => current === "footer" ? null : "footer")}><Icon name="more" size={17} />更多操作</button>
            {actionMenu === "footer" && (
              <div className="drawer-footer-popover">
                <button type="button" onClick={copySummary}><Icon name="copy" size={14} />复制联系信息</button>
                <button type="button" className="danger" onClick={() => { setActionMenu(null); onDelete(); }}><Icon name="trash" size={14} />删除客户</button>
              </div>
            )}
          </div>
          <button type="button" className="drawer-secondary-action" onClick={onAddFollowUp}><Icon name="clock" size={16} />创建跟进记录</button>
          <button type="button" className="drawer-primary-action" onClick={onAddOpportunity}><Icon name="opportunity" size={16} />创建销售机会</button>
        </footer>
      </aside>
    </>
  );
}

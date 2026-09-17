import { useMemo, useState } from "react";
import type { FormEvent } from "react";

type CustomerStatus = "intent" | "won" | "following" | "pending" | "lost";
type StatusFilter = CustomerStatus | "all";
type IconName = "grid" | "users" | "calendar" | "chart" | "settings" | "search" | "plus" | "arrow" | "more" | "close" | "mail" | "phone" | "check" | "file" | "box";

interface Customer {
  id: string;
  name: string;
  company: string;
  industry: string;
  email: string;
  phone: string;
  status: CustomerStatus;
  tags: string[];
  note: string;
  lastFollowUp: string;
  createdAt: string;
  englishName: string;
  companySize: string;
  website: string;
  address: string;
  description: string;
  contactRole: string;
}

interface CustomerFormValues {
  name: string;
  company: string;
  industry: string;
  email: string;
  phone: string;
  status: CustomerStatus;
  tags: string;
  note: string;
}

const CUSTOMER_TOTAL = 128;
const STATUS_LABELS: Record<CustomerStatus, string> = { intent: "意向客户", won: "已成交", following: "跟进中", pending: "待跟进", lost: "已流失" };
const INITIAL_CUSTOMERS: Customer[] = [
  { id: "c-001", name: "王小明", company: "腾讯科技有限公司", industry: "互联网", email: "xiaoming.wang@tencent.com", phone: "138 0000 0000", status: "intent", tags: ["重要客户", "战略合作", "SaaS", "IT服务"], note: "已发送产品方案，等待客户确认下一次会议时间。", lastFollowUp: "2024-04-22", createdAt: "2024-03-01", englishName: "Tencent Technology Co., Ltd.", companySize: "1000-5000人", website: "https://www.tencent.com", address: "广东省深圳市南山区科技园腾讯大厦", description: "腾讯是一家以互联网为基础的科技与文化公司，致力于通过互联网服务提升人类生活品质。", contactRole: "产品总监" },
  { id: "c-002", name: "李华", company: "阿里巴巴集团", industry: "电子商务", email: "lihua@example.test", phone: "138 0000 0001", status: "won", tags: ["电商", "战略合作"], note: "已完成采购确认，进入客户成功阶段。", lastFollowUp: "2024-04-21", createdAt: "2024-02-18", englishName: "Alibaba Group", companySize: "5000人以上", website: "https://www.alibaba.com", address: "浙江省杭州市", description: "综合性电子商务企业客户。", contactRole: "采购负责人" },
  { id: "c-003", name: "张伟", company: "字节跳动", industry: "内容媒体", email: "zhangwei@example.test", phone: "138 0000 0002", status: "following", tags: ["内容", "重点跟进"], note: "正在确认多团队协作和数据权限需求。", lastFollowUp: "2024-04-20", createdAt: "2024-02-10", englishName: "ByteDance", companySize: "5000人以上", website: "https://www.bytedance.com", address: "北京市海淀区", description: "内容平台和数字产品客户。", contactRole: "业务负责人" },
  { id: "c-004", name: "刘芳", company: "华为技术有限公司", industry: "通信技术", email: "liufang@example.test", phone: "138 0000 0003", status: "intent", tags: ["大型客户", "IT服务"], note: "已完成首次需求沟通，等待技术团队评估。", lastFollowUp: "2024-04-19", createdAt: "2024-01-25", englishName: "Huawei Technologies Co., Ltd.", companySize: "5000人以上", website: "https://www.huawei.com", address: "广东省深圳市", description: "通信与企业数字化服务客户。", contactRole: "解决方案经理" },
  { id: "c-005", name: "陈强", company: "百度在线网络", industry: "人工智能", email: "chenqiang@example.test", phone: "138 0000 0004", status: "pending", tags: ["AI", "待回访"], note: "已发送方案和报价，安排本周再次跟进。", lastFollowUp: "2024-04-18", createdAt: "2024-01-20", englishName: "Baidu Online Network Technology", companySize: "5000人以上", website: "https://www.baidu.com", address: "北京市海淀区", description: "人工智能与搜索服务客户。", contactRole: "技术负责人" },
  { id: "c-006", name: "赵敏", company: "小米科技", industry: "智能硬件", email: "zhaomin@example.test", phone: "138 0000 0005", status: "won", tags: ["硬件", "年度客户"], note: "合同已签署，等待项目启动会议。", lastFollowUp: "2024-04-18", createdAt: "2024-01-15", englishName: "Xiaomi Technology", companySize: "5000人以上", website: "https://www.mi.com", address: "北京市海淀区", description: "智能硬件与互联网服务客户。", contactRole: "产品经理" },
  { id: "c-007", name: "孙磊", company: "美团点评", industry: "本地生活", email: "sunlei@example.test", phone: "138 0000 0006", status: "following", tags: ["本地生活", "重点跟进"], note: "正在对接业务负责人，预计下周确认范围。", lastFollowUp: "2024-04-17", createdAt: "2024-01-12", englishName: "Meituan", companySize: "5000人以上", website: "https://www.meituan.com", address: "北京市朝阳区", description: "本地生活服务平台客户。", contactRole: "运营负责人" },
  { id: "c-008", name: "周杰", company: "京东集团", industry: "电子商务", email: "zhoujie@example.test", phone: "138 0000 0007", status: "intent", tags: ["电商", "渠道"], note: "关注渠道协同与客户服务自动化能力。", lastFollowUp: "2024-04-16", createdAt: "2023-12-28", englishName: "JD.com", companySize: "5000人以上", website: "https://www.jd.com", address: "北京市大兴区", description: "电子商务与物流服务客户。", contactRole: "渠道经理" },
  { id: "c-009", name: "吴倩", company: "网易", industry: "游戏文娱", email: "wuqian@example.test", phone: "138 0000 0008", status: "following", tags: ["游戏", "内容"], note: "产品演示已完成，等待业务团队反馈。", lastFollowUp: "2024-04-15", createdAt: "2023-12-20", englishName: "NetEase", companySize: "5000人以上", website: "https://www.netease.com", address: "浙江省杭州市", description: "游戏和内容服务客户。", contactRole: "业务经理" },
  { id: "c-010", name: "郑宇", company: "快手科技", industry: "短视频", email: "zhengyu@example.test", phone: "138 0000 0009", status: "pending", tags: ["短视频", "待回访"], note: "已建立联系，待确认下一次沟通时间。", lastFollowUp: "2024-04-14", createdAt: "2023-12-18", englishName: "Kuaishou Technology", companySize: "5000人以上", website: "https://www.kuaishou.com", address: "北京市海淀区", description: "短视频和直播服务客户。", contactRole: "客户平台主管" },
];
const EMPTY_FORM: CustomerFormValues = { name: "", company: "", industry: "互联网", email: "", phone: "", status: "pending", tags: "", note: "" };

function Icon({ name, size = 16 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, string> = {
    grid: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
    users: "M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7-6a3 3 0 0 1 0 5.8M20 20v-1.3a3.5 3.5 0 0 0-2.6-3.4",
    calendar: "M5 4v3M19 4v3M4 8h16M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm3 9h2m2 0h2m-6 4h2",
    chart: "M4 19V5m0 14h16M8 16v-4m4 4V8m4 8v-7",
    settings: "M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Zm7-3.2 1.6-1.2-1.8-3.1-1.9.8a7 7 0 0 0-1.7-1l-.3-2h-3.6l-.3 2a7 7 0 0 0-1.7 1l-1.9-.8-1.8 3.1L5 12l-1.6 1.2 1.8 3.1 1.9-.8a7 7 0 0 0 1.7 1l.3 2h3.6l.3-2a7 7 0 0 0 1.7-1l1.9.8 1.8-3.1L19 12Z",
    search: "m20 20-3.8-3.8M10.8 17a6.2 6.2 0 1 1 0-12.4 6.2 6.2 0 0 1 0 12.4Z",
    plus: "M12 5v14M5 12h14",
    arrow: "M5 12h13m-5-5 5 5-5 5",
    more: "M5 12h.01M12 12h.01M19 12h.01",
    close: "M6 6l12 12M18 6 6 18",
    mail: "M4 6h16v12H4zM4 7l8 6 8-6",
    phone: "M7 4h3l1 4-2 1.5a14 14 0 0 0 5.5 5.5L16 13l4 1v3a2 2 0 0 1-2 2C10.3 19 5 13.7 5 6a2 2 0 0 1 2-2Z",
    check: "m5 12 4 4L19 6",
    file: "M6 3h8l4 4v14H6zM14 3v5h5M9 13h6m-6 4h6",
    box: "m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Zm-8 4.5 8 4.5 8-4.5M12 12v9",
  };
  return <svg aria-hidden="true" className="icon" height={size} viewBox="0 0 24 24" width={size} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"><path d={paths[name]} /></svg>;
}

function Avatar({ name, tone = "blue" }: { name: string; tone?: "blue" | "violet" | "orange" | "green" }) {
  return <span className={`avatar avatar-${tone}`} aria-hidden="true">{name.slice(0, 1)}</span>;
}

export default function App() {
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>("c-001");
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<Customer | null>(null);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return customers.filter((customer) => {
      const matchesStatus = status === "all" || customer.status === status;
      const haystack = [customer.name, customer.company, customer.industry, customer.email, customer.phone, ...customer.tags].join(" ").toLowerCase();
      return matchesStatus && (normalized.length === 0 || haystack.includes(normalized));
    });
  }, [customers, query, status]);
  const selected = customers.find((customer) => customer.id === selectedId) ?? null;
  const openCreate = () => { setEditing(null); setFormMode("create"); };
  const openEdit = (customer: Customer) => { setEditing(customer); setSelectedId(null); setFormMode("edit"); };
  const saveCustomer = (values: CustomerFormValues) => {
    const tags = values.tags.split(",").map((tag) => tag.trim()).filter(Boolean);
    if (editing === null) {
      const next: Customer = { ...values, id: `c-${Date.now()}`, tags, lastFollowUp: "待安排", createdAt: new Date().toISOString().slice(0, 10), englishName: `${values.company} (English)`, companySize: "待补充", website: "", address: "", description: values.note, contactRole: "联系人" };
      setCustomers((current) => [next, ...current]);
      setSelectedId(next.id);
    } else {
      setCustomers((current) => current.map((item) => item.id === editing.id ? { ...editing, ...values, tags } : item));
      setSelectedId(editing.id);
    }
    setFormMode(null);
    setEditing(null);
  };

  return <div className="customer-app">
    <aside className="customer-sidebar">
      <div className="brand-lockup"><span className="brand-mark"><span /></span><div><strong>客户管理后台</strong><small>客户关系管理</small></div><span className="brand-beta">Pro</span></div>
      <div className="workspace-switch"><Avatar name="P" tone="violet" /><span><small>当前工作区</small><strong>增长团队</strong></span><span className="switch-chevron">⌄</span></div>
      <nav className="sidebar-nav" aria-label="案例导航">
        <p className="nav-label">工作台</p>
        <button className="nav-item" type="button"><Icon name="grid" />工作台</button>
        <button className="nav-item active" type="button"><Icon name="users" />客户管理<span className="nav-count">{CUSTOMER_TOTAL}</span></button>
        <button className="nav-item" type="button"><Icon name="chart" />销售机会</button>
        <button className="nav-item" type="button"><Icon name="calendar" />跟进记录</button>
        <button className="nav-item" type="button"><Icon name="file" />合同管理</button>
        <button className="nav-item" type="button"><Icon name="box" />产品管理</button>
        <button className="nav-item" type="button"><Icon name="chart" />数据报表</button>
        <button className="nav-item" type="button"><Icon name="users" />团队协作</button>
        <p className="nav-label nav-label-spaced">系统</p>
        <button className="nav-item" type="button"><Icon name="settings" />系统设置</button>
      </nav>
      <div className="sidebar-bottom"><div className="sidebar-tip"><span className="tip-spark">✦</span><div><strong>合成数据演示</strong><small>新增和编辑仅在当前预览保留</small></div></div><div className="sidebar-user"><Avatar name="张" tone="green" /><span><strong>张三</strong><small>管理员</small></span><Icon name="more" size={18} /></div></div>
    </aside>
    <main className="customer-main">
      <header className="topbar"><div className="breadcrumbs"><span>工作台</span><b>/</b><strong>客户管理</strong></div><div className="topbar-actions"><button className="topbar-icon" type="button" aria-label="帮助">?</button><button className="topbar-icon" type="button" aria-label="通知">◌</button><span className="topbar-divider" /><Avatar name="张" tone="green" /></div></header>
      <div className="content-wrap">
        <header className="page-heading"><div><p className="eyebrow">CUSTOMER MANAGEMENT</p><h1>客户管理</h1><p>管理和维护客户信息，跟进销售机会，提升客户转化率。</p></div><button className="primary-button" type="button" onClick={openCreate}><Icon name="plus" size={15} />新增客户</button></header>
        <section className="summary-grid" aria-label="客户摘要">
          <div className="summary-card"><span className="summary-icon purple"><Icon name="users" size={17} /></span><div><span>全部客户</span><strong>{CUSTOMER_TOTAL}</strong><small className="trend up">↗ +12% <em>较上月</em></small></div><span className="card-corner">TOTAL</span></div>
          <div className="summary-card"><span className="summary-icon blue"><Icon name="users" size={17} /></span><div><span>潜在客户</span><strong>48</strong><small className="trend up">↗ +8% <em>较上月</em></small></div><span className="card-corner">LEADS</span></div>
          <div className="summary-card"><span className="summary-icon orange"><Icon name="check" size={17} /></span><div><span>成交客户</span><strong>56</strong><small className="trend up">↗ +24% <em>较上月</em></small></div><span className="card-corner">WON</span></div>
          <div className="summary-card summary-card-highlight"><span className="summary-icon violet"><Icon name="chart" size={17} /></span><div><span>流失客户</span><strong>24</strong><small className="trend down">↘ -6% <em>较上月</em></small></div><span className="mini-bars"><i /><i /><i /><i /><i /></span></div>
        </section>
        <section className="table-card">
          <div className="table-card-heading"><div><h2>客户列表</h2><p>管理和维护客户信息，跟进每一次销售机会。</p></div><button className="outline-button" type="button" onClick={openCreate}><Icon name="plus" size={14} />添加客户</button></div>
          <div className="table-toolbar"><label className="search-box"><Icon name="search" size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索客户名称、联系人或电话..." aria-label="搜索客户名称、联系人或电话" /></label><div className="filter-select"><span>状态</span><select value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)} aria-label="按状态筛选"><option value="all">全部状态</option><option value="intent">意向客户</option><option value="won">已成交</option><option value="following">跟进中</option><option value="pending">待跟进</option><option value="lost">已流失</option></select></div><div className="filter-select"><span>行业</span><select aria-label="按行业筛选"><option>全部行业</option><option>互联网</option><option>电子商务</option><option>内容媒体</option><option>人工智能</option></select></div><div className="filter-select"><span>来源</span><select aria-label="按来源筛选"><option>全部来源</option><option>官网咨询</option><option>转介绍</option><option>活动线索</option></select></div><button className="outline-button filter-button" type="button">⌕ 更多筛选</button></div>
          <div className="table-scroll"><table><thead><tr><th>客户名称</th><th>行业</th><th>联系人</th><th>状态</th><th>最近跟进</th><th>创建时间</th><th aria-label="操作" /></tr></thead><tbody>{filtered.map((customer, index) => <tr key={customer.id} onClick={() => setSelectedId(customer.id)}><td><div className="customer-cell"><Avatar name={customer.company} tone={["blue", "violet", "orange", "green"][index % 4] as "blue" | "violet" | "orange" | "green"} /><span><strong>{customer.company}</strong><small>{customer.email}</small></span></div></td><td>{customer.industry}</td><td><strong className="company-name">{customer.name}</strong><small className="table-subline">{customer.phone}</small></td><td><span className={`status-pill ${customer.status}`}><i />{STATUS_LABELS[customer.status]}</span></td><td><span className="contact-date">{customer.lastFollowUp}</span></td><td>{customer.createdAt}</td><td><button className="row-more" type="button" onClick={(event) => { event.stopPropagation(); openEdit(customer); }} aria-label={`编辑${customer.company}`}><Icon name="more" size={18} /></button></td></tr>)}</tbody></table></div>
          {filtered.length === 0 && <div className="empty-state"><span className="empty-icon"><Icon name="search" size={20} /></span><strong>没有匹配的客户</strong><span>尝试清除搜索词或切换状态筛选。</span><button type="button" onClick={() => { setQuery(""); setStatus("all"); }}>清除筛选</button></div>}
          <div className="table-footer"><span>共 {CUSTOMER_TOTAL} 条记录</span><div><button type="button" disabled>‹</button><b>1</b><button type="button">2</button><button type="button">3</button><span>...</span><button type="button">13</button><button type="button">›</button><select aria-label="每页显示数量" defaultValue="10"><option value="10">10 条/页</option></select></div></div>
        </section>
      </div>
    </main>
    {selected !== null && <CustomerDrawer customer={selected} onClose={() => setSelectedId(null)} onEdit={() => openEdit(selected)} />}
    {formMode !== null && <CustomerForm mode={formMode} initial={editing} onCancel={() => { setFormMode(null); setEditing(null); }} onSave={saveCustomer} />}
  </div>;
}

function CustomerForm({ mode, initial, onCancel, onSave }: { mode: "create" | "edit"; initial: Customer | null; onCancel: () => void; onSave: (values: CustomerFormValues) => void }) {
  const [values, setValues] = useState<CustomerFormValues>(initial === null ? { ...EMPTY_FORM } : { ...initial, tags: initial.tags.join(", ") });
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerFormValues, string>>>({});
  const update = <K extends keyof CustomerFormValues>(key: K, value: CustomerFormValues[K]) => { setValues((current) => ({ ...current, [key]: value })); setErrors((current) => ({ ...current, [key]: undefined })); };
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const next: Partial<Record<keyof CustomerFormValues, string>> = {}; if (!values.name.trim()) next.name = "请输入联系人姓名"; if (!values.company.trim()) next.company = "请输入公司名称"; if (Object.keys(next).length > 0) { setErrors(next); return; } onSave(values); };
  return <div className="modal-backdrop" role="presentation"><form className="customer-modal" onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="customer-form-title"><div className="modal-heading"><div><p className="eyebrow">{mode === "create" ? "NEW CUSTOMER" : "EDIT CUSTOMER"}</p><h2 id="customer-form-title">{mode === "create" ? "新增客户" : "编辑客户"}</h2><p>填写客户基础资料，保存后会立即同步到列表。</p></div><button type="button" className="icon-button" onClick={onCancel} aria-label="关闭"><Icon name="close" size={17} /></button></div><div className="form-grid"><label>联系人<input value={values.name} onChange={(event) => update("name", event.target.value)} aria-invalid={errors.name !== undefined} placeholder="例如：王小明" />{errors.name && <small className="field-error">{errors.name}</small>}</label><label>公司名称<input value={values.company} onChange={(event) => update("company", event.target.value)} aria-invalid={errors.company !== undefined} placeholder="例如：腾讯科技有限公司" />{errors.company && <small className="field-error">{errors.company}</small>}</label><label>所属行业<input value={values.industry} onChange={(event) => update("industry", event.target.value)} placeholder="例如：互联网" /></label><label>邮箱<input type="email" value={values.email} onChange={(event) => update("email", event.target.value)} placeholder="name@company.com" /></label><label>电话<input value={values.phone} onChange={(event) => update("phone", event.target.value)} placeholder="138 0000 0000" /></label><label>状态<select value={values.status} onChange={(event) => update("status", event.target.value as CustomerStatus)}><option value="intent">意向客户</option><option value="won">已成交</option><option value="following">跟进中</option><option value="pending">待跟进</option><option value="lost">已流失</option></select></label><label>标签（用逗号分隔）<input value={values.tags} onChange={(event) => update("tags", event.target.value)} placeholder="重要客户, SaaS" /></label><label className="full-field">联系备注<textarea value={values.note} onChange={(event) => update("note", event.target.value)} rows={3} placeholder="记录下一步跟进事项" /></label></div><div className="modal-actions"><button type="button" className="secondary-button" onClick={onCancel}>取消</button><button type="submit" className="primary-button">{mode === "create" ? "添加客户" : "保存修改"}<Icon name="arrow" size={14} /></button></div></form></div>;
}

function CustomerDrawer({ customer, onClose, onEdit }: { customer: Customer; onClose: () => void; onEdit: () => void }) {
  return <><button className="drawer-backdrop" type="button" onClick={onClose} aria-label="关闭详情" /><aside className="detail-drawer" aria-label="客户详情"><div className="drawer-topline"><span>客户详情</span><div className="drawer-top-actions"><button type="button" className="icon-button" aria-label="更多操作"><Icon name="more" size={17} /></button><button type="button" className="icon-button" onClick={onClose} aria-label="关闭详情"><Icon name="close" size={17} /></button></div></div><div className="drawer-profile"><Avatar name={customer.company} tone="violet" /><div><p className="eyebrow">CUSTOMER PROFILE</p><h2>{customer.company}</h2><span>{customer.industry} · {customer.companySize}</span></div></div><div className="drawer-status"><span className={`status-pill ${customer.status}`}><i />{STATUS_LABELS[customer.status]}</span><button type="button" className="secondary-button" onClick={onEdit}>编辑资料</button></div><nav className="drawer-tabs" aria-label="客户详情页签"><button className="active" type="button">基本信息</button><button type="button">跟进记录</button><button type="button">销售机会</button><button type="button">合同信息</button><button type="button">更多</button></nav><div className="drawer-section"><h3>公司信息</h3><dl className="detail-list"><div><dt>公司名称</dt><dd>{customer.company}</dd></div><div><dt>英文名称</dt><dd>{customer.englishName}</dd></div><div><dt>所属行业</dt><dd>{customer.industry}</dd></div><div><dt>公司规模</dt><dd>{customer.companySize}</dd></div><div><dt>公司官网</dt><dd className="detail-link">{customer.website}</dd></div><div><dt>公司地址</dt><dd>{customer.address}</dd></div><div><dt>公司简介</dt><dd>{customer.description}</dd></div></dl></div><div className="drawer-section"><h3>联系人信息</h3><dl className="detail-list"><div><dt>联系人 / 职位</dt><dd>{customer.name} · {customer.contactRole}</dd></div><div><dt><Icon name="mail" size={14} />邮箱</dt><dd>{customer.email}</dd></div><div><dt><Icon name="phone" size={14} />电话</dt><dd>{customer.phone}</dd></div></dl></div><div className="drawer-section"><h3>标签</h3><div className="tag-list">{customer.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div><div className="drawer-section"><h3>跟进备注</h3><p className="drawer-note">{customer.note}</p></div><button className="drawer-primary" type="button" onClick={onEdit}><Icon name="arrow" size={15} />编辑客户资料</button></aside></>;
}

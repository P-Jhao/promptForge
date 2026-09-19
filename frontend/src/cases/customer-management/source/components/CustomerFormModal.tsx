import { useState } from "react";
import type { FormEvent } from "react";
import { COMPANY_SIZES, EMPTY_CUSTOMER_FORM, INDUSTRIES, SOURCES, STATUS_LABELS } from "../data/customers";
import type { Customer, CustomerFormValues, CustomerStatus } from "../types/customer";
import { Icon } from "./Icon";

function valuesFromCustomer(customer: Customer | null): CustomerFormValues {
  if (customer === null) return { ...EMPTY_CUSTOMER_FORM };
  return {
    name: customer.name,
    company: customer.company,
    industry: customer.industry,
    email: customer.email,
    phone: customer.phone,
    status: customer.status,
    source: customer.source,
    companySize: customer.companySize,
    contactRole: customer.contactRole,
    website: customer.website,
    address: customer.address,
    tags: customer.tags.join(", "),
    note: customer.note,
  };
}

export function CustomerFormModal({
  mode,
  customer,
  onClose,
  onSave,
}: {
  mode: "create" | "edit";
  customer: Customer | null;
  onClose: () => void;
  onSave: (values: CustomerFormValues) => void;
}) {
  const [values, setValues] = useState<CustomerFormValues>(() => valuesFromCustomer(customer));
  const [errors, setErrors] = useState<Partial<Record<"name" | "company" | "phone", string>>>({});

  const update = <K extends keyof CustomerFormValues>(key: K, value: CustomerFormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    if (key === "name" || key === "company" || key === "phone") setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Partial<Record<"name" | "company" | "phone", string>> = {};
    if (values.company.trim().length === 0) nextErrors.company = "请输入公司名称";
    if (values.name.trim().length === 0) nextErrors.name = "请输入联系人姓名";
    if (values.phone.trim().length === 0) nextErrors.phone = "请输入联系电话";
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    onSave(values);
  };

  const statuses: CustomerStatus[] = ["intent", "following", "pending", "won", "lost"];

  return (
    <div className="modal-mask" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <form className="customer-modal" onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="customer-modal-title">
        <header className="modal-header">
          <div><h2 id="customer-modal-title">{mode === "create" ? "新增客户" : "编辑客户"}</h2><p>{mode === "create" ? "补充基础资料，保存后客户会立即出现在列表中。" : "保存后列表和右侧详情会同步更新。"}</p></div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="关闭"><Icon name="close" size={18} /></button>
        </header>
        <div className="modal-form-grid">
          <label className="required-field">公司名称<input autoFocus value={values.company} onChange={(event) => update("company", event.target.value)} placeholder="例如：星云科技有限公司" aria-invalid={errors.company !== undefined} />{errors.company && <small>{errors.company}</small>}</label>
          <label className="required-field">联系人<input value={values.name} onChange={(event) => update("name", event.target.value)} placeholder="例如：联系人001" aria-invalid={errors.name !== undefined} />{errors.name && <small>{errors.name}</small>}</label>
          <label className="required-field">联系电话<input value={values.phone} onChange={(event) => update("phone", event.target.value)} placeholder="例如：139 0000 0011" aria-invalid={errors.phone !== undefined} />{errors.phone && <small>{errors.phone}</small>}</label>
          <label>联系邮箱<input type="email" value={values.email} onChange={(event) => update("email", event.target.value)} placeholder="contact@example.test" /></label>
          <label>所属行业<select value={values.industry} onChange={(event) => update("industry", event.target.value)}>{INDUSTRIES.map((industry) => <option key={industry}>{industry}</option>)}</select></label>
          <label>客户状态<select value={values.status} onChange={(event) => update("status", event.target.value as CustomerStatus)}>{statuses.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}</select></label>
          <label>客户来源<select value={values.source} onChange={(event) => update("source", event.target.value as CustomerFormValues["source"])}>{SOURCES.map((source) => <option key={source}>{source}</option>)}</select></label>
          <label>公司规模<select value={values.companySize} onChange={(event) => update("companySize", event.target.value as CustomerFormValues["companySize"])}>{COMPANY_SIZES.map((size) => <option key={size}>{size}</option>)}</select></label>
          <label>联系人职位<input value={values.contactRole} onChange={(event) => update("contactRole", event.target.value)} placeholder="例如：产品经理" /></label>
          <label>公司官网<input value={values.website} onChange={(event) => update("website", event.target.value)} placeholder="https://example.test" /></label>
          <label className="full-field">公司地址<input value={values.address} onChange={(event) => update("address", event.target.value)} placeholder="请输入演示地址" /></label>
          <label className="full-field">标签<input value={values.tags} onChange={(event) => update("tags", event.target.value)} placeholder="重要客户, SaaS" /><span className="field-hint">使用逗号分隔多个标签</span></label>
          <label className="full-field">跟进备注<textarea rows={3} value={values.note} onChange={(event) => update("note", event.target.value)} placeholder="记录下一步跟进事项" /></label>
        </div>
        <footer className="modal-footer"><button type="button" className="button-secondary" onClick={onClose}>取消</button><button type="submit" className="button-primary"><Icon name="check" size={15} />{mode === "create" ? "添加客户" : "保存修改"}</button></footer>
      </form>
    </div>
  );
}

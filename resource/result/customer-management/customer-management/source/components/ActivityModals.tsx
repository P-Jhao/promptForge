import { useState } from "react";
import type { FormEvent } from "react";
import type { SalesOpportunity } from "../types/customer";
import { todayDateString } from "../utils/customer";
import { Icon } from "./Icon";

export function FollowUpModal({ company, onClose, onSave }: { company: string; onClose: () => void; onSave: (date: string, note: string) => void }) {
  const [date, setDate] = useState(todayDateString());
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (note.trim().length === 0) {
      setError("请输入跟进内容");
      return;
    }
    onSave(date, note);
  };
  return (
    <div className="modal-mask" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <form className="compact-modal" onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="followup-title">
        <header className="modal-header"><div><h2 id="followup-title">创建跟进记录</h2><p>{company}</p></div><button type="button" className="modal-close" onClick={onClose} aria-label="关闭"><Icon name="close" size={18} /></button></header>
        <div className="compact-modal-fields">
          <label>跟进日期<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
          <label>跟进内容<textarea rows={4} value={note} onChange={(event) => { setNote(event.target.value); setError(""); }} placeholder="记录本次沟通结果和下一步计划" aria-invalid={error.length > 0} />{error && <small className="modal-error">{error}</small>}</label>
        </div>
        <footer className="modal-footer"><button type="button" className="button-secondary" onClick={onClose}>取消</button><button type="submit" className="button-primary"><Icon name="check" size={15} />保存记录</button></footer>
      </form>
    </div>
  );
}

export function OpportunityModal({ company, onClose, onSave }: { company: string; onClose: () => void; onSave: (title: string, amount: string, stage: SalesOpportunity["stage"]) => void }) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [stage, setStage] = useState<SalesOpportunity["stage"]>("需求确认");
  const [error, setError] = useState("");
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (title.trim().length === 0) {
      setError("请输入机会名称");
      return;
    }
    onSave(title, amount || "待确认", stage);
  };
  return (
    <div className="modal-mask" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <form className="compact-modal" onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="opportunity-title">
        <header className="modal-header"><div><h2 id="opportunity-title">创建销售机会</h2><p>{company}</p></div><button type="button" className="modal-close" onClick={onClose} aria-label="关闭"><Icon name="close" size={18} /></button></header>
        <div className="compact-modal-fields two-column-fields">
          <label className="full-field">机会名称<input autoFocus value={title} onChange={(event) => { setTitle(event.target.value); setError(""); }} placeholder="例如：企业协作平台年度订阅" aria-invalid={error.length > 0} />{error && <small className="modal-error">{error}</small>}</label>
          <label>预计金额<input value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="例如：¥ 120,000" /></label>
          <label>机会阶段<select value={stage} onChange={(event) => setStage(event.target.value as SalesOpportunity["stage"])}><option>需求确认</option><option>方案沟通</option><option>商务谈判</option><option>已赢单</option></select></label>
        </div>
        <footer className="modal-footer"><button type="button" className="button-secondary" onClick={onClose}>取消</button><button type="submit" className="button-primary"><Icon name="check" size={15} />创建机会</button></footer>
      </form>
    </div>
  );
}

export function DeleteCustomerDialog({ company, onClose, onConfirm }: { company: string; onClose: () => void; onConfirm: () => void }) {
  return (
    <div className="modal-mask" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-description">
        <span className="confirm-icon"><Icon name="trash" size={22} /></span>
        <h2 id="delete-title">删除客户</h2>
        <p id="delete-description">确定删除“{company}”吗？本操作只影响当前预览内存，可通过右上角账户菜单重置演示数据。</p>
        <div className="confirm-actions"><button type="button" className="button-secondary" onClick={onClose}>取消</button><button type="button" className="button-danger" onClick={onConfirm}>确认删除</button></div>
      </section>
    </div>
  );
}

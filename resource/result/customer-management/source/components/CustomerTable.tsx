import { STATUS_LABELS } from "../data/customers";
import type { Customer } from "../types/customer";
import { CompanyMark } from "./Identity";
import { Icon } from "./Icon";
import { Pagination } from "./Pagination";

export function CustomerTable({
  customers,
  datasetSize,
  filteredTotal,
  selectedId,
  checkedIds,
  page,
  pageCount,
  pageSize,
  filtersActive,
  onOpen,
  onEdit,
  onToggleChecked,
  onTogglePageChecked,
  onClearFilters,
  onAdd,
  onPageChange,
  onPageSizeChange,
}: {
  customers: Customer[];
  datasetSize: number;
  filteredTotal: number;
  selectedId: string | null;
  checkedIds: string[];
  page: number;
  pageCount: number;
  pageSize: number;
  filtersActive: boolean;
  onOpen: (id: string) => void;
  onEdit: (customer: Customer) => void;
  onToggleChecked: (id: string) => void;
  onTogglePageChecked: () => void;
  onClearFilters: () => void;
  onAdd: () => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  const allPageChecked = customers.length > 0 && customers.every((customer) => checkedIds.includes(customer.id));
  return (
    <div className="customer-table-block">
      <div className="table-scroll" role="region" aria-label="客户列表" tabIndex={0}>
        <table>
          <thead>
            <tr>
              <th className="checkbox-column"><input type="checkbox" checked={allPageChecked} onChange={onTogglePageChecked} aria-label="选择当前页全部客户" /></th>
              <th>客户名称</th>
              <th>行业</th>
              <th>联系人</th>
              <th>状态</th>
              <th>最近跟进</th>
              <th>创建时间</th>
              <th className="actions-column">操作</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer, index) => (
              <tr key={customer.id} className={selectedId === customer.id ? "selected-row" : ""} onClick={() => onOpen(customer.id)}>
                <td className="checkbox-column" onClick={(event) => event.stopPropagation()}>
                  <input type="checkbox" checked={checkedIds.includes(customer.id)} onChange={() => onToggleChecked(customer.id)} aria-label={`选择${customer.company}`} />
                </td>
                <td>
                  <div className="customer-name-cell">
                    <CompanyMark company={customer.company} index={(page - 1) * pageSize + index} />
                    <strong>{customer.company}</strong>
                  </div>
                </td>
                <td>{customer.industry}</td>
                <td><span className="contact-name">{customer.name}</span></td>
                <td><span className={`status-badge status-${customer.status}`}>{STATUS_LABELS[customer.status]}</span></td>
                <td>{customer.lastFollowUp}</td>
                <td>{customer.createdAt}</td>
                <td className="actions-column" onClick={(event) => event.stopPropagation()}>
                  <details className="row-action-menu">
                    <summary aria-label={`${customer.company}操作`}><Icon name="more" size={17} /></summary>
                    <div className="row-action-popover">
                      <button type="button" onClick={() => onOpen(customer.id)}>查看详情</button>
                      <button type="button" onClick={() => onEdit(customer)}><Icon name="edit" size={14} />编辑客户</button>
                    </div>
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filteredTotal === 0 && (
        <div className="table-empty-state">
          <span className="empty-state-icon"><Icon name={datasetSize === 0 ? "users" : "search"} size={22} /></span>
          <strong>{datasetSize === 0 ? "还没有客户" : "没有匹配的客户"}</strong>
          <p>{datasetSize === 0 ? "添加第一位客户后，这里会显示客户列表。" : "尝试更换关键词或清除当前筛选条件。"}</p>
          <button type="button" onClick={datasetSize === 0 ? onAdd : onClearFilters}>{datasetSize === 0 ? "新增客户" : "清除筛选"}</button>
        </div>
      )}
      {filteredTotal > 0 && (
        <Pagination
          total={filteredTotal}
          page={page}
          pageCount={pageCount}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}
      {filtersActive && filteredTotal > 0 && <div className="filter-active-note">当前列表已应用筛选，共显示 {filteredTotal} 条匹配记录。</div>}
    </div>
  );
}

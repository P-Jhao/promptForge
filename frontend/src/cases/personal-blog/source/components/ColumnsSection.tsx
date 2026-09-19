import { columns } from "../data/site";
import type { ArticleTopic } from "../types/blog";
import { Icon } from "./Icon";

interface ColumnsSectionProps {
  onSelectTopic: (topic: ArticleTopic) => void;
}

export function ColumnsSection({ onSelectTopic }: ColumnsSectionProps) {
  return (
    <section className="columns-section" id="columns" aria-labelledby="columns-title">
      <div className="section-heading simple-heading">
        <div>
          <span className="section-kicker">COLUMNS</span>
          <h2 id="columns-title">专栏精选</h2>
        </div>
        <p>从三个长期主题，快速进入对应文章。</p>
      </div>
      <div className="columns-grid">
        {columns.map((column, index) => (
          <button key={column.title} type="button" className="column-card" onClick={() => onSelectTopic(column.topic)}>
            <span className="column-index">0{index + 1}</span>
            <strong>{column.title}</strong>
            <span>{column.description}</span>
            <em>查看{column.topic}文章 <Icon name="arrow-right" size={15} /></em>
          </button>
        ))}
      </div>
    </section>
  );
}

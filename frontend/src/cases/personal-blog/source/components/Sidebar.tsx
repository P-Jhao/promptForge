import type { PopularTag } from "../types/blog";
import { Artwork } from "./Artwork";
import { Icon } from "./Icon";

interface TagsCardProps {
  tags: readonly PopularTag[];
  activeTag: string | null;
  onClearTag: () => void;
  onSelectTag: (tag: string) => void;
}

export function QuoteCard() {
  return (
    <article className="side-card quote-card">
      <span className="quote-mark" aria-hidden="true">“</span>
      <blockquote>生活不在别处，<br />当下的每一刻，都是最好的开始。</blockquote>
      <cite>—— 清川</cite>
    </article>
  );
}

export function TagsCard({ tags, activeTag, onClearTag, onSelectTag }: TagsCardProps) {
  return (
    <article className="side-card tags-card" id="tags">
      <div className="rail-title">
        <h2><Icon name="tag" size={16} />热门标签</h2>
        <button type="button" onClick={onClearTag}>查看全部 <Icon name="chevron-right" size={14} /></button>
      </div>
      <div className="tag-cloud">
        {tags.map((tag) => (
          <button
            key={tag.label}
            type="button"
            className={activeTag === tag.label ? "selected" : ""}
            aria-pressed={activeTag === tag.label}
            onClick={() => onSelectTag(tag.label)}
          >
            {tag.label} <small>{tag.count}</small>
          </button>
        ))}
      </div>
    </article>
  );
}

interface SubscribeCardProps {
  subscribed: boolean;
  onSubscribe: () => void;
}

export function SubscribeCard({ subscribed, onSubscribe }: SubscribeCardProps) {
  return (
    <article className="subscribe-card">
      <div className="subscribe-art"><Artwork tone="desk" /></div>
      <div className="subscribe-copy">
        <h2>订阅我的博客</h2>
        <p>{subscribed ? "已加入更新列表" : "不错过新的思考与分享"}</p>
      </div>
      <button type="button" onClick={onSubscribe} aria-label={subscribed ? "取消订阅" : "订阅博客"}>
        {subscribed ? <Icon name="check" size={18} /> : <Icon name="chevron-right" size={19} />}
      </button>
    </article>
  );
}

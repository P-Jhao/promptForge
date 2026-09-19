import { author } from "../data/site";
import { AuthorAvatar } from "./Artwork";
import { Icon } from "./Icon";

interface AuthorCardProps {
  followed: boolean;
  onFollowToggle: () => void;
  onSocialAction: (label: string) => void;
}

const socialActions = [
  { label: "GitHub", text: "GH" },
  { label: "知乎", text: "知" },
  { label: "微博", text: "微" },
  { label: "视频号", text: "视" },
  { label: "邮件", text: "邮" },
] as const;

export function AuthorCard({ followed, onFollowToggle, onSocialAction }: AuthorCardProps) {
  return (
    <article className="side-card author-card" id="about">
      <div className="author-head">
        <AuthorAvatar />
        <div>
          <h2>{author.name}</h2>
          <p>{author.role}</p>
        </div>
      </div>
      <p className="author-intro">{author.intro}</p>
      <div className="socials" aria-label="作者联系方式">
        {socialActions.map((item) => (
          <button key={item.label} type="button" onClick={() => onSocialAction(item.label)} aria-label={`查看${item.label}信息`}>
            {item.text}
          </button>
        ))}
      </div>
      <div className="author-stats">
        <span><b>{author.articles}</b>文章</span>
        <span><b>{author.subscribers}</b>订阅者</span>
        <span><b>{author.columns}</b>专栏</span>
      </div>
      <button className={`follow-button ${followed ? "is-followed" : ""}`} type="button" onClick={onFollowToggle}>
        {followed ? <><Icon name="check" size={16} />已关注</> : <><Icon name="user" size={16} />关注我</>}
      </button>
    </article>
  );
}

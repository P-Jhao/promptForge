import type { SVGProps } from "react";

export type IconName =
  | "logo" | "search" | "bell" | "chevronDown" | "calendar" | "home" | "barChart" | "user"
  | "cube" | "link" | "file" | "report" | "download" | "tag" | "settings" | "users" | "money"
  | "document" | "bolt" | "filter" | "more" | "arrowUp" | "arrowLeft" | "arrowRight" | "close"
  | "check" | "copy" | "refresh" | "inbox" | "sliders";

interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 18, ...props }: IconProps) {
  const common = { fill: "none", stroke: "currentColor", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, strokeWidth: 1.8 };
  const path = (() => {
    switch (name) {
      case "logo": return <><path d="M12 2.3 15.2 6l4.7.5-2.7 3.9.9 4.6-4.4-1.7L9.6 16l-.2-4.7-3.7-2.9 4.3-1.3L12 2.3Z" /><path d="m7 15 3.2 1.3 2 4.2 2-4.2 4.5-.7-3-3.4" /></>;
      case "search": return <><circle cx="10.7" cy="10.7" r="6.4" /><path d="m15.4 15.4 4 4" /></>;
      case "bell": return <><path d="M6.5 16.5h11l-1.2-1.8v-4.1a4.3 4.3 0 0 0-8.6 0v4.1l-1.2 1.8Z" /><path d="M10 19a2.2 2.2 0 0 0 4 0" /></>;
      case "chevronDown": return <path d="m7.5 9.5 4.5 4.5 4.5-4.5" />;
      case "calendar": return <><rect x="3.5" y="5.2" width="17" height="15" rx="2.5" /><path d="M7.5 3.5v3.3M16.5 3.5v3.3M3.5 9h17" /></>;
      case "home": return <><path d="m4 10.5 8-6.5 8 6.5" /><path d="M6.5 9.5V20h11V9.5M10 20v-6h4v6" /></>;
      case "barChart": return <><rect x="4" y="12" width="3.5" height="7" rx=".7" /><rect x="10.2" y="7.5" width="3.5" height="11.5" rx=".7" /><rect x="16.5" y="4" width="3.5" height="15" rx=".7" /></>;
      case "user": return <><circle cx="12" cy="8" r="3.5" /><path d="M5.5 20c.7-4 3-6 6.5-6s5.8 2 6.5 6" /></>;
      case "cube": return <><path d="m12 3 7.2 4.1v9.8L12 21l-7.2-4.1V7.1L12 3Z" /><path d="m4.8 7.1 7.2 4.2 7.2-4.2M12 21v-9.7" /></>;
      case "link": return <><path d="M9.2 14.8 7.6 16.4a3.4 3.4 0 0 1-4.8-4.8l3-3a3.4 3.4 0 0 1 4.8 0" /><path d="m14.8 9.2 1.6-1.6a3.4 3.4 0 1 1 4.8 4.8l-3 3a3.4 3.4 0 0 1-4.8 0M8.7 15.3l6.6-6.6" /></>;
      case "file": return <><path d="M6 3.5h8l4 4V20H6V3.5Z" /><path d="M14 3.5v4h4M9 12h6M9 15.5h6" /></>;
      case "report": return <><rect x="4" y="4" width="16" height="16" rx="2.5" /><path d="M8 16v-4M12 16V8M16 16v-6" /></>;
      case "download": return <><path d="M12 3.5v11M8.2 11.2 12 15l3.8-3.8" /><path d="M4.5 18.5h15" /></>;
      case "tag": return <><path d="M3.8 11.2 11 4h7v7l-7.2 7.2a2 2 0 0 1-2.8 0L3.8 14a2 2 0 0 1 0-2.8Z" /><circle cx="15" cy="7.8" r="1.1" /></>;
      case "settings": return <><circle cx="12" cy="12" r="3" /><path d="M19.2 13.7a7.8 7.8 0 0 0 0-3.4l2-1.6-2-3.4-2.5 1a8 8 0 0 0-3-1.7L13.3 2H9.4L9 4.6a8 8 0 0 0-3 1.7l-2.5-1-2 3.4 2 1.6a7.8 7.8 0 0 0 0 3.4l-2 1.6 2 3.4 2.5-1a8 8 0 0 0 3 1.7l.4 2.6h3.9l.4-2.6a8 8 0 0 0 3-1.7l2.5 1 2-3.4-2-1.6Z" /></>;
      case "users": return <><circle cx="9" cy="8" r="3" /><path d="M3.5 19c.6-3.7 2.5-5.6 5.5-5.6s4.9 1.9 5.5 5.6" /><path d="M15.3 5.5a3 3 0 0 1 0 5.3M16.2 14c2.3.5 3.7 2.2 4.2 5" /></>;
      case "money": return <><circle cx="12" cy="12" r="8.5" /><path d="M8 8.2h8M9.2 11.2h5.6M12 8.2v8M9.4 14.2h5.2" /></>;
      case "document": return <><rect x="5" y="3.5" width="14" height="17" rx="2" /><path d="M8.5 8h7M8.5 11.5h7M8.5 15h5" /></>;
      case "bolt": return <path d="m13.5 2.8-7 10H12l-1.5 8.4 7-11h-5.3l1.3-7.4Z" />;
      case "filter": return <path d="M4 5h16l-6.5 7.2v5.3L10.5 19v-6.8L4 5Z" />;
      case "more": return <><circle cx="5" cy="12" r="1.2" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1.2" fill="currentColor" stroke="none" /></>;
      case "arrowUp": return <><path d="M12 19V5M7.5 9.5 12 5l4.5 4.5" /></>;
      case "arrowLeft": return <path d="m14.5 6-6 6 6 6" />;
      case "arrowRight": return <path d="m9.5 6 6 6-6 6" />;
      case "close": return <path d="m7 7 10 10M17 7 7 17" />;
      case "check": return <path d="m5 12.5 4.2 4.2L19 7" />;
      case "copy": return <><rect x="8" y="8" width="11" height="11" rx="2" /><path d="M16 8V5H5v11h3" /></>;
      case "refresh": return <><path d="M19 8.5V4l-2 2a7.7 7.7 0 1 0 2.2 8.6" /></>;
      case "inbox": return <><path d="M4 6h16l1.5 8v5H2.5v-5L4 6Z" /><path d="M3 14h5l1.5 2h5l1.5-2h5" /></>;
      case "sliders": return <><path d="M4 7h9M17 7h3M4 17h3M11 17h9" /><circle cx="15" cy="7" r="2" /><circle cx="9" cy="17" r="2" /></>;
      default: return null;
    }
  })();

  return <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" {...common} {...props}>{path}</svg>;
}

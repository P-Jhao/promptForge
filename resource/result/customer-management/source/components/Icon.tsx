export type IconName =
  | "home"
  | "users"
  | "opportunity"
  | "clock"
  | "file"
  | "box"
  | "chart"
  | "team"
  | "settings"
  | "search"
  | "plus"
  | "more"
  | "close"
  | "mail"
  | "phone"
  | "check"
  | "filter"
  | "edit"
  | "external"
  | "copy"
  | "trash"
  | "calendar"
  | "bell"
  | "help"
  | "chevronDown"
  | "chevronLeft"
  | "chevronRight"
  | "sparkle";

const paths: Record<IconName, string> = {
  home: "M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9.5Z",
  users: "M16 20v-1.4a3.6 3.6 0 0 0-3.6-3.6H7.6A3.6 3.6 0 0 0 4 18.6V20M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7-6a3 3 0 0 1 0 5.8M20 20v-1.3a3.5 3.5 0 0 0-2.6-3.4",
  opportunity: "M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4-3.9-3.8 5.4-.8L12 3Z",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v5l3 2",
  file: "M6 3h8l4 4v14H6zM14 3v5h5M9 13h6m-6 4h6",
  box: "m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Zm-8 4.5 8 4.5 8-4.5M12 12v9",
  chart: "M4 19V5m0 14h16M8 16v-4m4 4V8m4 8V6",
  team: "M8.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7-1a2.5 2.5 0 1 0 0-5M3 20v-1.2A3.8 3.8 0 0 1 6.8 15h3.4a3.8 3.8 0 0 1 3.8 3.8V20m1.2-5h1.2A3.6 3.6 0 0 1 20 18.6V20",
  settings: "M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Zm7-3.2 1.6-1.2-1.8-3.1-1.9.8a7 7 0 0 0-1.7-1l-.3-2h-3.6l-.3 2a7 7 0 0 0-1.7 1l-1.9-.8-1.8 3.1L5 12l-1.6 1.2 1.8 3.1 1.9-.8a7 7 0 0 0 1.7 1l.3 2h3.6l.3-2a7 7 0 0 0 1.7-1l1.9.8 1.8-3.1L19 12Z",
  search: "m20 20-3.8-3.8M10.8 17a6.2 6.2 0 1 1 0-12.4 6.2 6.2 0 0 1 0 12.4Z",
  plus: "M12 5v14M5 12h14",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  close: "M6 6l12 12M18 6 6 18",
  mail: "M4 6h16v12H4zM4 7l8 6 8-6",
  phone: "M7 4h3l1 4-2 1.5a14 14 0 0 0 5.5 5.5L16 13l4 1v3a2 2 0 0 1-2 2C10.3 19 5 13.7 5 6a2 2 0 0 1 2-2Z",
  check: "m5 12 4 4L19 6",
  filter: "M4 5h16l-6 7v6l-4 2v-8L4 5Z",
  edit: "M5 19h4l10-10-4-4L5 15v4Zm8.5-12.5 4 4",
  external: "M14 5h5v5m0-5-8 8M19 13v6H5V5h6",
  copy: "M9 9h10v10H9zM5 15H4V5h10v1",
  trash: "M5 7h14M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v5m4-5v5",
  calendar: "M5 4v3M19 4v3M4 8h16M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z",
  bell: "M18 9a6 6 0 1 0-12 0c0 7-3 7-3 8h18c0-1-3-1-3-8M10 21h4",
  help: "M9.5 9a2.7 2.7 0 1 1 4.5 2c-1.4 1-2 1.4-2 3m0 3h.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z",
  chevronDown: "m7 9 5 5 5-5",
  chevronLeft: "m15 18-6-6 6-6",
  chevronRight: "m9 18 6-6-6-6",
  sparkle: "M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Zm6 11 .8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8L18 14Z",
};

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg
      aria-hidden="true"
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[name]} />
    </svg>
  );
}

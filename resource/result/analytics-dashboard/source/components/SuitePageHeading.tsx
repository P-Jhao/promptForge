import type { ReactNode } from "react";

export function SuitePageHeading({ title, subtitle, actions }: { title: string; subtitle: string; actions?: ReactNode }) {
  return <div className="suite-page-heading">
    <div><h1>{title}</h1><p>{subtitle}</p></div>
    {actions ? <div className="suite-heading-actions">{actions}</div> : null}
  </div>;
}

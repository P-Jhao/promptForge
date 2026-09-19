export function PersonAvatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  return (
    <span className={`person-avatar person-avatar-${size}`} aria-hidden="true">
      <span className="person-avatar-head" />
      <span className="person-avatar-body" />
      <span className="person-avatar-initial">{name.slice(0, 1)}</span>
    </span>
  );
}

const companyTones = ["blue", "violet", "green", "orange", "red", "cyan"] as const;

export function CompanyMark({ company, index = 0, large = false }: { company: string; index?: number; large?: boolean }) {
  const tone = companyTones[index % companyTones.length];
  return (
    <span className={`company-mark company-mark-${tone}${large ? " company-mark-large" : ""}`} aria-hidden="true">
      <span>{company.slice(0, 1)}</span>
    </span>
  );
}

import type { ReactNode } from "react";

/** The eyebrow / heading / supporting-copy block each workspace opens with. */
export default function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 max-w-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand">{eyebrow}</p>
        <h1 className="mt-2 text-[26px] font-semibold leading-tight tracking-tight text-ink sm:text-[28px]">
          {title}
        </h1>
        {description && <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

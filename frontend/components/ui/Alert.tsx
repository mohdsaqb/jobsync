import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";

type Tone = "info" | "success" | "warning" | "error";

const TONES: Record<Tone, { wrap: string; icon: ReactNode }> = {
  info: { wrap: "border-indigo-100 bg-brand-subtle text-ink", icon: <Info className="h-4 w-4 text-brand" /> },
  success: {
    wrap: "border-green-100 bg-green-50 text-ink",
    icon: <CheckCircle2 className="h-4 w-4 text-success" />,
  },
  warning: {
    wrap: "border-amber-100 bg-amber-50 text-ink",
    icon: <AlertTriangle className="h-4 w-4 text-warning" />,
  },
  error: { wrap: "border-red-100 bg-red-50 text-ink", icon: <XCircle className="h-4 w-4 text-danger" /> },
};

/**
 * Status is carried by an icon and the text as well as colour, so it reads
 * without relying on hue alone.
 */
export function Alert({
  tone = "info",
  title,
  children,
  action,
  className,
}: {
  tone?: Tone;
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  const { wrap, icon } = TONES[tone];

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("flex items-start gap-3 rounded-lg border px-4 py-3", wrap, className)}
    >
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0 flex-1 text-[13px] leading-relaxed">
        {title && <p className="font-semibold">{title}</p>}
        {children}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

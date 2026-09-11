import { LOGO_BG, LOGO_JS_PATH } from "@/lib/logoPath";

interface LogoProps {
  className?: string;
}

export default function Logo({ className }: LogoProps) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="10" fill={LOGO_BG} />
      <path d={LOGO_JS_PATH} fill="#ffffff" />
    </svg>
  );
}

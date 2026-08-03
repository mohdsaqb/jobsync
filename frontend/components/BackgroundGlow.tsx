export default function BackgroundGlow() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-indigo-600/20 blur-[120px]" />
      <div className="absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-violet-600/10 blur-[120px]" />
      <div className="absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-emerald-500/10 blur-[120px]" />
    </div>
  );
}

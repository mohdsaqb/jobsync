export interface ScoreTier {
  label: string;
  classes: string;
}

export function scoreTier(score: number): ScoreTier {
  if (score >= 0.65) {
    return { label: "Strong match", classes: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30" };
  }
  if (score >= 0.45) {
    return { label: "Good match", classes: "bg-indigo-500/15 text-indigo-300 ring-indigo-500/30" };
  }
  return { label: "Fair match", classes: "bg-zinc-500/20 text-zinc-300 ring-zinc-500/30" };
}

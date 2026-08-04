export interface ScoreTier {
  label: string;
  classes: string;
}

// Raw cosine similarity between a resume and a job description rarely goes
// much above ~0.6-0.7, even for a genuinely great match — the two texts are
// differently structured (achievements vs. requirements), so the embedding
// model's ceiling is far below 1.0. Remapping raw score -> a friendlier
// percentage for display keeps the underlying ranking/filtering untouched
// (it's a monotonic transform) while showing users a number that reflects
// how good a match actually is in relative terms.
const ANCHORS: [raw: number, displayPercent: number][] = [
  [0.1, 60],
  [0.4, 90],
  [0.65, 99],
];

export function matchPercent(score: number): number {
  if (score <= ANCHORS[0][0]) return ANCHORS[0][1];
  if (score >= ANCHORS[ANCHORS.length - 1][0]) return ANCHORS[ANCHORS.length - 1][1];

  for (let i = 0; i < ANCHORS.length - 1; i++) {
    const [rawLow, pctLow] = ANCHORS[i];
    const [rawHigh, pctHigh] = ANCHORS[i + 1];
    if (score >= rawLow && score <= rawHigh) {
      const t = (score - rawLow) / (rawHigh - rawLow);
      return Math.round(pctLow + t * (pctHigh - pctLow));
    }
  }

  return ANCHORS[ANCHORS.length - 1][1];
}

export function scoreTier(score: number): ScoreTier {
  const percent = matchPercent(score);
  if (percent >= 93) {
    return { label: "Strong match", classes: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30" };
  }
  if (percent >= 78) {
    return { label: "Good match", classes: "bg-indigo-500/15 text-indigo-300 ring-indigo-500/30" };
  }
  return { label: "Fair match", classes: "bg-zinc-500/20 text-zinc-300 ring-zinc-500/30" };
}

export type MatchTone = "brand" | "neutral";

export interface ScoreTier {
  label: string;
  tone: MatchTone;
}

const ANCHORS: [raw: number, displayPercent: number][] = [
  [0.1, 45],
  [0.4, 70],
  [0.65, 85],
  [0.9, 98],
];

export function matchPercent(score: number): number {
  const first = ANCHORS[0];
  const last = ANCHORS[ANCHORS.length - 1];
  if (score <= first[0]) return first[1];
  if (score >= last[0]) return last[1];

  for (let i = 0; i < ANCHORS.length - 1; i++) {
    const [rawLow, pctLow] = ANCHORS[i];
    const [rawHigh, pctHigh] = ANCHORS[i + 1];
    if (score >= rawLow && score <= rawHigh) {
      const t = (score - rawLow) / (rawHigh - rawLow);
      return Math.round(pctLow + t * (pctHigh - pctLow));
    }
  }

  return last[1];
}

export function scoreTier(score: number): ScoreTier {
  const percent = matchPercent(score);
  if (percent >= 90) return { label: "Strong match", tone: "brand" };
  if (percent >= 70) return { label: "Good match", tone: "neutral" };
  return { label: "Potential match", tone: "neutral" };
}

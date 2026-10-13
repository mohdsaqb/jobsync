export type MatchTone = "brand" | "neutral";

export interface ScoreTier {
  label: string;
  tone: MatchTone;
}

/**
 * Raw blended scores (0.6 x cosine + 0.4 x skill overlap) occupy a narrow band:
 * the server discards anything at or below 0.1, and the strongest matches
 * observed against live data sit around 0.85. The anchors below spread that
 * real range across a readable percentage.
 *
 * An earlier version clamped at 0.65, which meant every good match displayed as
 * 99% and the number carried no information at the top of the list.
 *
 * Monotonic, so the display never reorders results — it only changes how the
 * number reads. It is a similarity measure, not a probability of being hired.
 */
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

/**
 * Labels describe how closely the texts align, not a hiring outcome. Tones stay
 * brand/neutral rather than success-green, which would read as an endorsement a
 * similarity score can't support.
 */
export function scoreTier(score: number): ScoreTier {
  const percent = matchPercent(score);
  if (percent >= 90) return { label: "Strong match", tone: "brand" };
  if (percent >= 70) return { label: "Good match", tone: "neutral" };
  return { label: "Potential match", tone: "neutral" };
}

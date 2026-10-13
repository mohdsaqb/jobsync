import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Self-imposed rate limiting for the Adzuna free tier.
 *
 * The published allowances are 25/minute, 250/day, 1000/week and 2500/month,
 * and they do not compose: 250/day sustained would be 7500/month, three times
 * over. The monthly cap is the real constraint, which works out at roughly 83
 * calls per day — so all four windows are enforced together rather than
 * trusting the daily headline.
 *
 * Call history is persisted so a restart can't reset the counters and spend a
 * month's allowance in an afternoon. On a host with an ephemeral filesystem
 * the counters do reset, and the consequence is Adzuna returning 429 — which
 * callers already degrade from by falling back to the indexed corpus.
 */

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

const WINDOWS = {
  minute: { ms: MINUTE, limit: 25 },
  day: { ms: DAY, limit: 250 },
  week: { ms: 7 * DAY, limit: 1000 },
  month: { ms: 30 * DAY, limit: 2500 },
} as const;

export type AdzunaChannel = "sync" | "live";

/**
 * Daily sub-caps per consumer, so the scheduled corpus sync can't starve the
 * on-demand path (or vice versa). The defaults sum to well under the
 * sustainable ~83/day.
 *
 * Raised via env for a one-time corpus bootstrap, where spending a few hundred
 * calls in a day is worth it. The four windows above are the real guard rails
 * and are not configurable — those are Adzuna's own limits.
 */
const CHANNEL_DAILY_LIMITS: Record<AdzunaChannel, number> = {
  sync: Number(process.env.ADZUNA_SYNC_DAILY ?? 50),
  live: Number(process.env.ADZUNA_LIVE_DAILY ?? 30),
};

const STATE_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../data/adzuna-budget.json",
);

interface Call {
  at: number;
  channel: AdzunaChannel;
}

// Anything older than the longest window can never affect a decision again.
const RETENTION_MS = WINDOWS.month.ms + DAY;

let calls: Call[] | null = null;

function load(): Call[] {
  if (calls) return calls;

  try {
    const parsed = JSON.parse(fs.readFileSync(STATE_PATH, "utf-8")) as Call[];
    calls = Array.isArray(parsed) ? parsed.filter((c) => typeof c?.at === "number") : [];
  } catch {
    // Missing or unreadable state simply means no calls recorded yet.
    calls = [];
  }
  return calls;
}

function save(): void {
  try {
    fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
    fs.writeFileSync(STATE_PATH, JSON.stringify(calls ?? []));
  } catch (err) {
    // Losing persistence degrades us to in-memory counting, which is still
    // better than failing the request that triggered the write.
    console.error("Could not persist Adzuna budget state:", err);
  }
}

function countSince(history: Call[], now: number, ms: number, channel?: AdzunaChannel): number {
  const cutoff = now - ms;
  return history.filter((c) => c.at > cutoff && (!channel || c.channel === channel)).length;
}

export interface BudgetSnapshot {
  minute: number;
  day: number;
  week: number;
  month: number;
  channels: Record<AdzunaChannel, number>;
}

/** Calls still available in each window, and in each channel's daily allowance. */
export function remaining(now = Date.now()): BudgetSnapshot {
  const history = load();
  return {
    minute: Math.max(0, WINDOWS.minute.limit - countSince(history, now, WINDOWS.minute.ms)),
    day: Math.max(0, WINDOWS.day.limit - countSince(history, now, WINDOWS.day.ms)),
    week: Math.max(0, WINDOWS.week.limit - countSince(history, now, WINDOWS.week.ms)),
    month: Math.max(0, WINDOWS.month.limit - countSince(history, now, WINDOWS.month.ms)),
    channels: {
      sync: Math.max(0, CHANNEL_DAILY_LIMITS.sync - countSince(history, now, DAY, "sync")),
      live: Math.max(0, CHANNEL_DAILY_LIMITS.live - countSince(history, now, DAY, "live")),
    },
  };
}

/**
 * Reserves `count` calls for `channel`, returning false if any window or the
 * channel's daily allowance would be exceeded. Either the whole request fits
 * or nothing is recorded.
 */
export function tryConsume(count: number, channel: AdzunaChannel, now = Date.now()): boolean {
  if (count <= 0) return true;

  const available = remaining(now);
  const fits =
    count <= available.minute &&
    count <= available.day &&
    count <= available.week &&
    count <= available.month &&
    count <= available.channels[channel];

  if (!fits) return false;

  const history = load();
  for (let i = 0; i < count; i++) {
    history.push({ at: now, channel });
  }
  calls = history.filter((c) => c.at > now - RETENTION_MS);
  save();
  return true;
}

/** Test seam: drops persisted history so a run starts from a known state. */
export function resetBudget(): void {
  calls = [];
  save();
}

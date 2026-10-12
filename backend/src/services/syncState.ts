import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Bookkeeping the scheduled sync leaves behind so the API can tell clients how
 * fresh the corpus is without issuing a count query on every request.
 */

const STATE_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../data/sync-state.json");

export interface SyncState {
  /** Epoch seconds of the last completed sync. */
  lastSyncAt: number;
  inserted: number;
  evicted: number;
  corpusSize: number;
  callsUsed: number;
}

export function readSyncState(): SyncState | null {
  try {
    const parsed = JSON.parse(fs.readFileSync(STATE_PATH, "utf-8")) as SyncState;
    return typeof parsed?.lastSyncAt === "number" ? parsed : null;
  } catch {
    // No sync has run yet, or the file is unreadable.
    return null;
  }
}

export function writeSyncState(state: SyncState): void {
  try {
    fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
    fs.writeFileSync(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`);
  } catch (err) {
    console.error("Could not write sync state:", err);
  }
}

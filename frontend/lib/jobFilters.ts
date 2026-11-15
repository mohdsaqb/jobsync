import type { JobMatch } from "./types";

export type SortKey = "match" | "newest";
export type PostedWithin = "any" | "7" | "30" | "90";

export interface JobFilters {
  query: string;
  location: string;
  postedWithin: PostedWithin;
  salaryOnly: boolean;
  sort: SortKey;
}

export const EMPTY_FILTERS: JobFilters = {
  query: "",
  location: "",
  postedWithin: "any",
  salaryOnly: false,
  sort: "match",
};

export function hasActiveFilters(filters: JobFilters): boolean {
  return (
    filters.query.trim() !== "" ||
    filters.location.trim() !== "" ||
    filters.postedWithin !== "any" ||
    filters.salaryOnly
  );
}

export function applyJobFilters(matches: JobMatch[], filters: JobFilters, now = Date.now()): JobMatch[] {
  const query = filters.query.trim().toLowerCase();
  const location = filters.location.trim().toLowerCase();
  const cutoff =
    filters.postedWithin === "any" ? null : now / 1000 - Number(filters.postedWithin) * 86_400;

  const filtered = matches.filter((job) => {
    if (query && !`${job.title} ${job.company}`.toLowerCase().includes(query)) return false;
    if (location && !(job.location ?? "").toLowerCase().includes(location)) return false;
    if (filters.salaryOnly && !((job.salaryMin ?? 0) > 0 || (job.salaryMax ?? 0) > 0)) return false;

    if (cutoff !== null && (job.createdAt ?? 0) < cutoff) return false;
    return true;
  });

  if (filters.sort === "newest") {
    return filtered.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  }

  return filtered;
}

export function locationOptions(matches: JobMatch[], limit = 40): string[] {
  const counts = new Map<string, number>();
  for (const job of matches) {
    const value = job.location?.trim();
    if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([value]) => value);
}

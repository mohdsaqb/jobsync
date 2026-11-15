import type { JobDescription } from "../types/index.js";

const normalize = (value: string) => value.normalize("NFKC").trim().toLowerCase().replace(/\s+/g, " ");

export function postingUrl(value?: string): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) return undefined;
    return url.href;
  } catch {
    return undefined;
  }
}

function urlIdentity(value?: string): string | undefined {
  const safe = postingUrl(value);
  if (!safe) return undefined;
  const url = new URL(safe);
  url.hash = "";
  for (const key of [...url.searchParams.keys()]) {
    if (key.toLowerCase().startsWith("utm_")) url.searchParams.delete(key);
  }
  url.searchParams.sort();
  return url.href;
}

export function deduplicateJobs<T extends JobDescription>(jobs: readonly T[]): T[] {
  const parents = jobs.map((_, index) => index);
  const seen = new Map<string, number>();
  const root = (index: number): number => {
    while (parents[index] !== index) {
      parents[index] = parents[parents[index]];
      index = parents[index];
    }
    return index;
  };

  jobs.forEach((job, index) => {
    const url = urlIdentity(job.url);

    const content = [job.title, job.company, job.location ?? ""];
    if (!/^jd-\d+$/.test(job.jobId)) content.push(job.description);
    const keys = [
      `id:${job.jobId.trim()}`,
      `content:${JSON.stringify(content.map(normalize))}`,
      ...(url ? [`url:${url}`] : []),
    ];
    for (const key of keys) {
      const previous = seen.get(key);
      if (previous !== undefined) {
        const first = root(previous);
        const current = root(index);

        parents[Math.max(first, current)] = Math.min(first, current);
      }
      seen.set(key, index);
    }
  });

  const unique = new Map<number, T>();
  jobs.forEach((job, index) => {
    const group = root(index);
    const winner = unique.get(group);
    if (!winner) unique.set(group, job);
    else if (!postingUrl(winner.url) && postingUrl(job.url)) {
      unique.set(group, { ...winner, url: postingUrl(job.url) });
    }
  });

  return [...unique.values()];
}

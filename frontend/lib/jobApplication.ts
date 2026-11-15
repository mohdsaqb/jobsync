import type { JobMatch } from "./types";

/** Only navigate to web URLs; untrusted source data must not run scripts. */
export function jobApplication(job: Pick<JobMatch, "jobId" | "title" | "company" | "location" | "url">) {
  if (job.url) {
    try {
      const url = new URL(job.url);
      if (["https:", "http:"].includes(url.protocol) && !url.username && !url.password) {
        return { href: url.href, label: "Apply", note: "Continue to the original posting to submit your application." };
      }
    } catch {
      // Missing or invalid source links fall back to a clearly labeled search.
    }
  }

  const sample = /^jd-\d+$/.test(job.jobId);
  const url = new URL("https://www.linkedin.com/jobs/search/");
  // Sample companies are fictional, so search for the role alone.
  url.searchParams.set("keywords", sample ? job.title : `${job.title} ${job.company}`);
  if (job.location) url.searchParams.set("location", job.location);
  return {
    href: url.href,
    label: "Find openings",
    note: sample
      ? "Sample listing. Find current openings for this role on LinkedIn."
      : "Original application link unavailable. Find this role and company on LinkedIn.",
  };
}

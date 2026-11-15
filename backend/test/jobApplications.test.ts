import assert from "node:assert/strict";
import { test } from "node:test";
import jobs from "../src/data/jobs.json" with { type: "json" };
import { deduplicateJobs, postingUrl } from "../src/services/jobIdentity.js";
import { withCatalogMetadata } from "../src/services/jobCatalog.js";
import type { JobDescription, JobMatch } from "../src/types/index.js";
import { jobApplication } from "../../frontend/lib/jobApplication.ts";

const job: JobMatch = {
  jobId: "adz-1",
  title: "Frontend Developer",
  company: "Acme",
  description: "Build React interfaces.",
  location: "London",
  score: 0.9,
};

test("application actions use the original URL when available", () => {
  const action = jobApplication({ ...job, url: "https://example.com/apply/1?ref=jobsync" });
  assert.equal(action.label, "Apply");
  assert.equal(action.href, "https://example.com/apply/1?ref=jobsync");
});

test("sample listings search the role without the fictional company", () => {
  const action = jobApplication({ ...job, jobId: "jd-0001", title: "C++ & React Developer" });
  const url = new URL(action.href);
  assert.equal(action.label, "Find openings");
  assert.match(action.note, /Sample listing/);
  assert.equal(url.hostname, "www.linkedin.com");
  assert.equal(url.searchParams.get("keywords"), "C++ & React Developer");
  assert.equal(url.searchParams.get("location"), "London");
});

test("missing and unsafe application links fall back to a role and company search", () => {
  for (const url of [undefined, "", "not a URL", "javascript:alert(1)", "data:text/html,test", "//example.com", "https://user:password@example.com"]) {
    const action = jobApplication({ ...job, url });
    assert.equal(action.label, "Find openings");
    assert.equal(new URL(action.href).searchParams.get("keywords"), "Frontend Developer Acme");
    assert.equal(postingUrl(url), undefined);
  }
});

test("duplicate IDs from repeated seeds retain the highest ranked result", () => {
  const results = deduplicateJobs([job, { ...job, score: 0.5 }, { ...job, jobId: "adz-2", title: "Backend Developer" }]);
  assert.deepEqual(results.map((result) => [result.jobId, result.score]), [["adz-1", 0.9], ["adz-2", 0.9]]);
});

test("duplicate sample roles normalize case, whitespace and Unicode, keeping a usable link", () => {
  const first = { ...job, jobId: "jd-1", location: undefined };
  const duplicate = {
    ...job,
    jobId: "jd-2",
    title: " Ｆｒｏｎｔｅｎｄ   Developer ",
    company: " ACME ",
    location: undefined,
    description: "Different randomly generated responsibilities.",
    url: "https://example.com/apply/1",
    score: 0.5,
  };
  const [winner] = deduplicateJobs([first, duplicate]);
  assert.equal(deduplicateJobs([first, duplicate]).length, 1);
  assert.equal(winner.jobId, first.jobId);
  assert.equal(winner.score, first.score);
  assert.equal(winner.url, duplicate.url);
  assert.equal(first.url, undefined);
});

test("the same posting URL with different tracking tags or IDs is only shown once", () => {
  const results = deduplicateJobs([
    { ...job, url: "https://example.com/jobs/1?b=2&a=1&utm_source=first#apply" },
    { ...job, jobId: "other-1", description: "Alternate source text", url: "https://example.com/jobs/1?a=1&b=2&utm_source=second" },
  ]);
  assert.equal(results.length, 1);
});

test("a later record connecting earlier copies by ID and URL merges both groups", () => {
  const results = deduplicateJobs([
    job,
    { ...job, jobId: "adz-2", description: "Alternate source text", url: "https://example.com/jobs/1" },
    { ...job, url: "https://example.com/jobs/1" },
  ]);
  assert.equal(results.length, 1);
  assert.equal(results[0].jobId, job.jobId);
  assert.equal(results[0].url, "https://example.com/jobs/1");
});

test("real openings with different descriptions or locations remain separate", () => {
  const distinct = [
    job,
    { ...job, jobId: "adz-2", description: "Lead the React team." },
    { ...job, jobId: "adz-3", location: "Paris" },
    { ...job, jobId: "adz-4", company: "Another company" },
  ];
  assert.deepEqual(deduplicateJobs(distinct), distinct);
});

test("catalog metadata reaches matches without changing the vector database schema", () => {
  const source: JobDescription = {
    ...job,
    url: "https://example.com/apply/1",
    salaryMin: 50000,
    salaryMax: 60000,
    createdAt: 1700000000,
  };
  const match = withCatalogMetadata(job, source);
  assert.equal(match.url, source.url);
  assert.equal(match.location, source.location);
  assert.equal(match.salaryMin, source.salaryMin);
  assert.equal(match.salaryMax, source.salaryMax);
  assert.equal(match.createdAt, source.createdAt);
  assert.equal(match.score, job.score);
  assert.equal(withCatalogMetadata({ ...job, jobId: "unknown" }).score, job.score);
});

test("the bundled job catalog contains no duplicate roles", () => {
  assert.equal(deduplicateJobs(jobs).length, jobs.length);
});

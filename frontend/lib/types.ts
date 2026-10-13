export interface JobMatch {
  jobId: string;
  title: string;
  company: string;
  description: string;
  score: number;
  /** Link to the original posting. Empty for the synthetic corpus. */
  url?: string;
  location?: string;
  /** Annual figures as the source reports them; 0 when not advertised. */
  salaryMin?: number;
  salaryMax?: number;
  /** Epoch seconds the posting was published. */
  createdAt?: number;
  /** Skills this job asks for that the resume also mentions. */
  matchedSkills?: string[];
  /** Skills this job asks for with no counterpart in the resume. */
  unmatchedSkills?: string[];
}

export interface AnalyzeMeta {
  /** A background fetch of fresh postings for the given role has started. */
  warming: boolean;
  /** Epoch seconds of the last scheduled sync, or null if none has run. */
  lastSyncAt: number | null;
  corpusSize: number | null;
}

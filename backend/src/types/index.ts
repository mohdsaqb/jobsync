export interface JobDescription {
  jobId: string;
  title: string;
  company: string;
  description: string;
  /** Link to the original posting. Empty for the synthetic corpus. */
  url?: string;
  location?: string;
  /** Annual figures as the source reports them; 0 when not advertised. */
  salaryMin?: number;
  salaryMax?: number;
  /** Epoch seconds the posting was published. Drives eviction of stale listings. */
  createdAt?: number;
}

export interface JobMatch extends JobDescription {
  score: number;
}

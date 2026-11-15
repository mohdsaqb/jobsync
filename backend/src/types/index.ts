export interface JobDescription {
  jobId: string;
  title: string;
  company: string;
  description: string;
  /** Original application link, when supplied by the job source. */
  url?: string;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  /** Publication time in epoch seconds. */
  createdAt?: number;
}

export interface JobMatch extends JobDescription {
  score: number;
  /** Skills this job asks for that the resume also mentions. */
  matchedSkills?: string[];
  /** Skills this job asks for with no counterpart in the resume. */
  unmatchedSkills?: string[];
}

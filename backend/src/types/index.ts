export interface JobDescription {
  jobId: string;
  title: string;
  company: string;
  description: string;
}

export interface JobMatch extends JobDescription {
  score: number;
  /** Skills this job asks for that the resume also mentions. */
  matchedSkills?: string[];
  /** Skills this job asks for with no counterpart in the resume. */
  unmatchedSkills?: string[];
}

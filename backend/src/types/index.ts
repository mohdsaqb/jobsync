export interface JobDescription {
  jobId: string;
  title: string;
  company: string;
  description: string;
  url?: string;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  createdAt?: number;
}

export interface JobMatch extends JobDescription {
  score: number;
  matchedSkills?: string[];
  unmatchedSkills?: string[];
}

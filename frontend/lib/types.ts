export interface JobMatch {
  jobId: string;
  title: string;
  company: string;
  description: string;
  score: number;
  url?: string;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  createdAt?: number;
  matchedSkills?: string[];
  unmatchedSkills?: string[];
}

export interface AnalyzeResult {
  matches: JobMatch[];
  resumeText: string;
  resumeSkills: string[] | null;
}

export interface ResumeSuggestions {
  text: string;
  targetRole: string;
}

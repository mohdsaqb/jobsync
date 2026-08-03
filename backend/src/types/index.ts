export interface JobDescription {
  jobId: string;
  title: string;
  company: string;
  description: string;
}

export interface JobMatch extends JobDescription {
  score: number;
}

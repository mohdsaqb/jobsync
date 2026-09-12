// Stray keywords can drag a whole-document embedding toward the wrong job
// category, so this score is blended with the semantic one in resume.controller.ts.
const SKILL_KEYWORDS = [
  // Frontend
  "react", "react native", "angular", "vue", "next.js", "nuxt", "svelte",
  "javascript", "typescript", "html", "html5", "css", "css3", "sass", "tailwind css",
  "redux", "webpack", "vite", "jquery", "responsive design", "web accessibility",
  // Backend
  "node.js", "express", "nestjs", "django", "flask", "fastapi", "spring", "spring boot",
  "java", "python", "php", "laravel", "ruby", "ruby on rails", "go", "golang", "rust",
  "c#", ".net", "graphql", "rest apis", "rest api", "grpc", "microservices",
  "mern", "mean", "full stack", "full-stack",
  // Data / databases
  "mongodb", "postgresql", "mysql", "sqlite", "redis", "dynamodb", "sql", "nosql",
  "elasticsearch", "cassandra", "firebase", "supabase",
  // Data science / ML
  "python", "pandas", "numpy", "tensorflow", "pytorch", "scikit-learn", "machine learning",
  "deep learning", "nlp", "data analysis", "data visualization", "spark", "hadoop", "airflow",
  // DevOps / cloud
  "docker", "kubernetes", "aws", "azure", "gcp", "terraform", "ansible", "ci/cd", "cicd",
  "jenkins", "github actions", "gitlab ci", "prometheus", "grafana", "infrastructure as code",
  "bash scripting", "linux administration", "helm", "istio",
  // Mobile
  "swift", "kotlin", "android", "ios", "flutter", "xamarin",
  // Testing
  "jest", "cypress", "selenium", "playwright", "test automation", "unit testing", "qa",
  // General / process
  "git", "agile", "scrum", "kanban", "jira", "ci pipelines", "api design", "system design",
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const SKILL_PATTERNS: [skill: string, pattern: RegExp][] = SKILL_KEYWORDS.map((skill) => [
  skill,
  new RegExp(`(?<![a-z0-9])${escapeRegExp(skill.toLowerCase())}(?![a-z0-9])`, "i"),
]);

export function extractSkills(text: string): Set<string> {
  const lower = text.toLowerCase();
  const found = new Set<string>();
  for (const [skill, pattern] of SKILL_PATTERNS) {
    if (pattern.test(lower)) found.add(skill);
  }
  return found;
}

/** Fraction of the job's mentioned skills that the resume also mentions. */
export function skillOverlapScore(resumeSkills: Set<string>, jobSkills: Set<string>): number {
  if (jobSkills.size === 0) return 0;
  let hits = 0;
  for (const skill of jobSkills) {
    if (resumeSkills.has(skill)) hits++;
  }
  return hits / jobSkills.size;
}

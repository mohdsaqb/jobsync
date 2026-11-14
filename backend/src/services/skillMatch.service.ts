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
  // Common resume skills outside the original web-development list.
  "c", "c++", "linux", "object oriented programming", "data structures", "algorithms",
  "figma", "power bi", "tableau", "excel", "statistics", "matlab", "r programming",
  "autocad", "solidworks", "cad", "finite element analysis", "six sigma", "quality control",
  "project management", "communication", "team leadership", "problem solving",
  "customer service", "recruitment", "budgeting", "financial modeling", "financial reporting",
  "salesforce", "seo", "google analytics", "patient care", "lesson planning",
];

const SKILL_ALIASES: Record<string, string[]> = {
  react: ["reactjs", "react.js"],
  "react native": ["react-native"],
  angular: ["angularjs", "angular.js"],
  vue: ["vuejs", "vue.js"],
  "next.js": ["nextjs", "next js"],
  "node.js": ["nodejs", "node js"],
  express: ["expressjs", "express.js"],
  nestjs: ["nest.js", "nest js"],
  javascript: ["java script"],
  typescript: ["type script"],
  "tailwind css": ["tailwindcss", "tailwind"],
  "spring boot": ["springboot"],
  "c#": ["csharp", "c sharp"],
  ".net": ["dotnet", "dot net"],
  "c++": ["cpp", "c plus plus"],
  mongodb: ["mongo db", "mongo"],
  postgresql: ["postgres", "postgre sql"],
  mysql: ["my sql"],
  "scikit-learn": ["scikit learn", "sklearn"],
  aws: ["amazon web services"],
  gcp: ["google cloud platform", "google cloud"],
  kubernetes: ["k8s"],
  "ci/cd": ["ci / cd", "ci-cd"],
  "object oriented programming": ["object-oriented programming", "oop", "oops"],
  "data structures": ["data structure", "dsa"],
  algorithms: ["dsa"],
  "power bi": ["powerbi", "microsoft power bi"],
  excel: ["microsoft excel", "ms excel"],
  "r programming": ["r language"],
  "problem solving": ["problem-solving"],
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const SKILL_PATTERNS: [skill: string, pattern: RegExp][] = SKILL_KEYWORDS.map((skill) => {
  const alternatives = [skill, ...(SKILL_ALIASES[skill] ?? [])]
    .map((name) => escapeRegExp(name).replace(/ /g, "\\s+"))
    .join("|");
  // Include + and # in the trailing boundary so C++/C# don't also count as C.
  return [skill, new RegExp(`(?<![a-z0-9])(?:${alternatives})(?![a-z0-9+#])`, "i")];
});

export function extractSkills(text: string): Set<string> {
  const normalized = text.normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF\u00AD]/g, "")
    .replace(/[\u2010-\u2015\u2212]/g, "-");
  const found = new Set<string>();
  for (const [skill, pattern] of SKILL_PATTERNS) {
    if (pattern.test(normalized)) found.add(skill);
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

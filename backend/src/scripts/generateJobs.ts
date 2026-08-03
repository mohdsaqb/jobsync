import fs from "node:fs/promises";
import path from "node:path";
import type { JobDescription } from "../types/index.js";

/**
 * Generates a large, varied set of sample job descriptions by combining
 * role templates (title/skills/responsibilities) with seniority levels and
 * random company names. Run with `npm run generate:jobs` — writes
 * data/jobs.json, which is what `npm run seed` reads.
 */

interface RoleTemplate {
  titleBase: string;
  intro: string; // "{seniority}" is replaced with the seniority phrase
  responsibilities: string[];
  skills: string[];
  niceToHave: string[];
}

const SENIORITIES = ["", "Junior", "Mid-Level", "Senior", "Lead", "Staff"];

const COMPANY_PREFIXES = [
  "Northwind", "Bramble", "Ledger", "Skyline", "Vector", "Cloudframe", "Pocket",
  "Bright Path", "Insight", "Datastore", "Verify", "Aster", "Quantum", "Silverline",
  "Ironwood", "Crestpoint", "Harbor", "Meridian", "Cobalt", "Lumen", "Granite",
  "Willow", "Foxglove", "Anchor", "Nimbus", "Redwood", "Solace", "Larkspur", "Cinder", "Marrow",
];
const COMPANY_SUFFIXES = [
  "Technologies", "Labs", "Systems", "Solutions", "Studio", "Group", "Analytics",
  "Software", "Corp", "Inc.", "Ventures", "Partners", "Networks", "Dynamics", "Works",
];

const ROLES: RoleTemplate[] = [
  {
    titleBase: "Frontend Developer",
    intro: "We are looking for a {seniority}Frontend Developer to build fast, accessible web interfaces.",
    responsibilities: [
      "Build reusable UI components with React and TypeScript.",
      "Translate Figma designs into pixel-perfect, responsive layouts.",
      "Optimize page load performance and Core Web Vitals.",
      "Write unit and integration tests for UI components.",
      "Collaborate with designers and backend engineers on new features.",
      "Maintain and extend a shared component library.",
      "Improve accessibility (a11y) across the product.",
      "Review pull requests and mentor junior developers.",
    ],
    skills: ["React", "TypeScript", "Tailwind CSS", "HTML5", "CSS3", "JavaScript", "Vite", "Webpack", "Redux", "Jest", "responsive design", "REST APIs"],
    niceToHave: ["Next.js", "Storybook", "GraphQL", "Figma", "animation libraries"],
  },
  {
    titleBase: "Backend Developer",
    intro: "We're hiring a {seniority}Backend Developer to design and maintain reliable server-side systems.",
    responsibilities: [
      "Design and build REST APIs using Node.js and Express.",
      "Model and optimize relational and NoSQL database schemas.",
      "Implement authentication and authorization flows.",
      "Write integration tests and monitor API performance.",
      "Collaborate with frontend engineers on API contracts.",
      "Set up caching and background job processing.",
      "Participate in on-call rotation and incident response.",
      "Document endpoints and internal architecture decisions.",
    ],
    skills: ["Node.js", "Express", "TypeScript", "PostgreSQL", "MongoDB", "REST APIs", "Docker", "authentication", "Redis", "GraphQL", "microservices"],
    niceToHave: ["Kafka", "gRPC", "Kubernetes", "AWS", "CI/CD pipelines"],
  },
  {
    titleBase: "Full Stack Engineer",
    intro: "As a {seniority}Full Stack Engineer, you'll ship features end to end across our web application.",
    responsibilities: [
      "Build features spanning React frontend and Node.js backend.",
      "Design database schemas and write efficient SQL queries.",
      "Deploy and monitor services in a cloud environment.",
      "Participate in code reviews and architectural discussions.",
      "Write automated tests across the stack.",
      "Debug production issues across the full request lifecycle.",
      "Work closely with product managers to scope features.",
    ],
    skills: ["React", "Node.js", "TypeScript", "SQL", "NoSQL", "REST APIs", "Docker", "Git", "CI/CD", "agile methodology"],
    niceToHave: ["AWS", "GraphQL", "Terraform", "Next.js", "Kubernetes"],
  },
  {
    titleBase: "Data Scientist",
    intro: "We are seeking a {seniority}Data Scientist to turn data into actionable insight.",
    responsibilities: [
      "Analyze large datasets to identify trends and opportunities.",
      "Build predictive models using Python and scikit-learn.",
      "Design and evaluate A/B tests.",
      "Communicate findings to non-technical stakeholders.",
      "Build dashboards and visualizations for key metrics.",
      "Clean and preprocess messy, real-world data.",
      "Collaborate with engineering to productionize models.",
    ],
    skills: ["Python", "pandas", "NumPy", "scikit-learn", "statistics", "SQL", "data visualization", "A/B testing", "Jupyter", "machine learning"],
    niceToHave: ["TensorFlow", "PyTorch", "R", "Tableau", "experiment design"],
  },
  {
    titleBase: "Machine Learning Engineer",
    intro: "We're looking for a {seniority}Machine Learning Engineer to design, train, and deploy models at scale.",
    responsibilities: [
      "Design and train ML models using PyTorch or TensorFlow.",
      "Build feature pipelines and manage training datasets.",
      "Deploy models into production with monitoring and rollback.",
      "Work with embeddings and vector search for retrieval systems.",
      "Optimize inference latency and model serving infrastructure.",
      "Collaborate with data scientists on experiment design.",
      "Write reproducible training and evaluation pipelines.",
    ],
    skills: ["PyTorch", "TensorFlow", "Python", "MLOps", "embeddings", "vector search", "feature engineering", "Docker", "Kubernetes", "NLP"],
    niceToHave: ["LLMs", "distributed training", "ONNX", "model quantization", "Airflow"],
  },
  {
    titleBase: "DevOps Engineer",
    intro: "We need a {seniority}DevOps Engineer to build and maintain our deployment infrastructure.",
    responsibilities: [
      "Build and maintain CI/CD pipelines.",
      "Manage infrastructure as code with Terraform.",
      "Operate and troubleshoot Kubernetes clusters.",
      "Set up monitoring, logging, and alerting (Prometheus, Grafana).",
      "Automate repetitive operational tasks with scripting.",
      "Harden systems and manage secrets and access control.",
      "Support engineering teams with build and deployment issues.",
    ],
    skills: ["CI/CD", "Terraform", "Docker", "Kubernetes", "AWS", "Prometheus", "Grafana", "Bash scripting", "Linux", "infrastructure as code"],
    niceToHave: ["GCP", "Azure", "Ansible", "GitHub Actions", "service mesh"],
  },
  {
    titleBase: "Site Reliability Engineer",
    intro: "Join us as a {seniority}Site Reliability Engineer keeping critical systems fast and available.",
    responsibilities: [
      "Define and track SLOs and SLIs for critical services.",
      "Participate in on-call rotation and lead incident response.",
      "Improve system observability with metrics, logs, and traces.",
      "Automate manual operational work to reduce toil.",
      "Run capacity planning and load testing exercises.",
      "Write and review postmortems after incidents.",
      "Partner with engineering teams on reliability improvements.",
    ],
    skills: ["incident response", "SLOs", "observability", "Kubernetes", "on-call", "automation", "capacity planning", "Linux", "monitoring"],
    niceToHave: ["Terraform", "Go", "chaos engineering", "distributed systems", "AWS"],
  },
  {
    titleBase: "Cloud Infrastructure Engineer",
    intro: "We're hiring a {seniority}Cloud Infrastructure Engineer to design scalable cloud architecture.",
    responsibilities: [
      "Design and provision cloud infrastructure using Terraform.",
      "Manage networking, VPCs, and security groups.",
      "Optimize cloud spend and resource utilization.",
      "Support containerized workloads running on Kubernetes.",
      "Implement disaster recovery and backup strategies.",
      "Collaborate with security teams on compliance requirements.",
    ],
    skills: ["AWS", "Azure", "GCP", "Terraform", "networking", "Kubernetes", "cost optimization", "security groups", "IAM"],
    niceToHave: ["multi-cloud", "Cloudflare", "VPN", "compliance frameworks"],
  },
  {
    titleBase: "React Native Developer",
    intro: "We are looking for a {seniority}React Native Developer to build cross-platform mobile apps.",
    responsibilities: [
      "Build features for iOS and Android using React Native.",
      "Integrate REST and GraphQL APIs into the mobile app.",
      "Manage app state using Redux or Zustand.",
      "Write native modules when platform APIs are required.",
      "Optimize app performance and startup time.",
      "Publish and maintain releases in the App Store and Play Store.",
    ],
    skills: ["React Native", "TypeScript", "Redux", "iOS", "Android", "REST APIs", "GraphQL", "native modules", "mobile testing"],
    niceToHave: ["Expo", "Fastlane", "push notifications", "offline sync"],
  },
  {
    titleBase: "iOS Developer",
    intro: "We're hiring a {seniority}iOS Developer to craft delightful native Apple experiences.",
    responsibilities: [
      "Build features using Swift and SwiftUI.",
      "Maintain app architecture using MVVM.",
      "Integrate REST APIs and manage local persistence with Core Data.",
      "Write unit and UI tests for app features.",
      "Optimize app performance and memory usage.",
      "Prepare releases and manage App Store submissions.",
    ],
    skills: ["Swift", "SwiftUI", "Xcode", "Core Data", "REST APIs", "MVVM", "unit testing", "iOS SDK"],
    niceToHave: ["Combine", "CoreAnimation", "widgets", "App Clips"],
  },
  {
    titleBase: "Android Developer",
    intro: "We are seeking a {seniority}Android Developer to build modern native Android apps.",
    responsibilities: [
      "Build features using Kotlin and Jetpack Compose.",
      "Maintain app architecture using MVVM.",
      "Integrate REST APIs and local storage with Room.",
      "Write unit and instrumentation tests.",
      "Optimize app performance across a range of devices.",
      "Manage releases through the Google Play Console.",
    ],
    skills: ["Kotlin", "Jetpack Compose", "Android SDK", "MVVM", "REST APIs", "Room", "unit testing"],
    niceToHave: ["Coroutines", "Dagger/Hilt", "Firebase", "Material Design"],
  },
  {
    titleBase: "UI/UX Designer",
    intro: "We're looking for a {seniority}UI/UX Designer to craft intuitive product experiences.",
    responsibilities: [
      "Conduct user research and usability testing.",
      "Create wireframes, prototypes, and high-fidelity mockups in Figma.",
      "Maintain and extend the design system.",
      "Collaborate closely with frontend engineers on implementation.",
      "Present design rationale to stakeholders.",
      "Iterate on designs based on user feedback and analytics.",
    ],
    skills: ["Figma", "wireframing", "prototyping", "user research", "design systems", "usability testing", "accessibility"],
    niceToHave: ["motion design", "design tokens", "Adobe Creative Suite"],
  },
  {
    titleBase: "Graphic Designer",
    intro: "We are hiring a {seniority}Graphic Designer to shape our brand's visual identity.",
    responsibilities: [
      "Design marketing materials, social content, and branded assets.",
      "Maintain brand guidelines across print and digital channels.",
      "Collaborate with marketing on campaign visuals.",
      "Prepare files for print and digital production.",
      "Iterate on designs based on stakeholder feedback.",
    ],
    skills: ["Adobe Photoshop", "Adobe Illustrator", "InDesign", "branding", "typography", "print design", "digital design"],
    niceToHave: ["motion graphics", "After Effects", "packaging design"],
  },
  {
    titleBase: "QA / Test Automation Engineer",
    intro: "We need a {seniority}QA Engineer to help us ship reliable software.",
    responsibilities: [
      "Design and maintain automated test suites using Playwright or Cypress.",
      "Write unit, integration, and end-to-end tests.",
      "Set up and maintain test pipelines in CI.",
      "Track and triage bugs with the engineering team.",
      "Write clear test plans for new features.",
      "Perform manual exploratory testing when needed.",
    ],
    skills: ["Playwright", "Cypress", "Selenium", "test automation", "CI pipelines", "bug tracking", "test planning", "JavaScript"],
    niceToHave: ["performance testing", "accessibility testing", "API testing"],
  },
  {
    titleBase: "Database Administrator",
    intro: "We are hiring a {seniority}Database Administrator to keep our data layer fast and reliable.",
    responsibilities: [
      "Manage and tune PostgreSQL and MySQL databases.",
      "Design backup, replication, and disaster recovery strategies.",
      "Monitor query performance and optimize indexing.",
      "Ensure data security and access control.",
      "Support engineering teams with schema design reviews.",
      "Plan and execute database migrations.",
    ],
    skills: ["PostgreSQL", "MySQL", "MongoDB", "performance tuning", "backup and recovery", "replication", "indexing", "data security"],
    niceToHave: ["Redis", "sharding", "high availability", "database migrations"],
  },
  {
    titleBase: "Data Engineer",
    intro: "We're looking for a {seniority}Data Engineer to build reliable data pipelines.",
    responsibilities: [
      "Build and maintain ETL pipelines using Apache Spark and Airflow.",
      "Design data warehouse schemas for analytics workloads.",
      "Ensure data quality and pipeline observability.",
      "Optimize SQL queries over large datasets.",
      "Collaborate with data scientists on feature pipelines.",
      "Manage streaming data pipelines with Kafka.",
    ],
    skills: ["ETL pipelines", "Apache Spark", "Airflow", "data warehousing", "SQL", "Python", "data modeling", "Kafka"],
    niceToHave: ["dbt", "Snowflake", "BigQuery", "streaming data"],
  },
  {
    titleBase: "Security Analyst",
    intro: "We are hiring a {seniority}Security Analyst to protect our systems and data.",
    responsibilities: [
      "Perform vulnerability assessments and penetration testing.",
      "Monitor security events using SIEM tooling.",
      "Lead incident response for security events.",
      "Review firewall rules and network access policies.",
      "Support compliance audits (SOC 2, ISO 27001).",
      "Educate engineering teams on secure coding practices.",
    ],
    skills: ["vulnerability assessment", "penetration testing", "SIEM", "incident response", "firewalls", "compliance", "threat detection"],
    niceToHave: ["cloud security", "SOC 2", "red teaming", "cryptography"],
  },
  {
    titleBase: "Network Engineer",
    intro: "We need a {seniority}Network Engineer to design and maintain our network infrastructure.",
    responsibilities: [
      "Design and maintain routing and switching infrastructure.",
      "Configure and troubleshoot firewalls and VPNs.",
      "Monitor network performance and resolve outages.",
      "Document network topology and configuration standards.",
      "Support capacity planning for network growth.",
    ],
    skills: ["routing and switching", "Cisco", "firewalls", "VPN", "network monitoring", "TCP/IP", "troubleshooting"],
    niceToHave: ["SD-WAN", "BGP", "network automation", "wireless networking"],
  },
  {
    titleBase: "Systems Administrator",
    intro: "We are looking for a {seniority}Systems Administrator to keep our infrastructure running smoothly.",
    responsibilities: [
      "Administer Linux and Windows servers.",
      "Manage Active Directory and user access.",
      "Apply patches and manage system updates.",
      "Maintain backup systems and disaster recovery plans.",
      "Automate routine tasks with scripting.",
      "Support internal teams with infrastructure requests.",
    ],
    skills: ["Linux administration", "Windows administration", "scripting", "Active Directory", "patch management", "backups", "virtualization"],
    niceToHave: ["VMware", "PowerShell", "monitoring tools", "ITIL"],
  },
  {
    titleBase: "Solutions Architect",
    intro: "We're hiring a {seniority}Solutions Architect to design scalable, resilient systems.",
    responsibilities: [
      "Design system architecture for scalability and reliability.",
      "Evaluate cloud architecture tradeoffs with engineering leadership.",
      "Communicate technical designs to stakeholders.",
      "Guide teams on best practices for system design.",
      "Review proposed architectures for cost and performance.",
    ],
    skills: ["system design", "cloud architecture", "stakeholder communication", "scalability", "cost optimization", "technical leadership"],
    niceToHave: ["AWS certifications", "microservices", "event-driven architecture"],
  },
  {
    titleBase: "Blockchain Developer",
    intro: "We are seeking a {seniority}Blockchain Developer to build decentralized applications.",
    responsibilities: [
      "Write and audit smart contracts in Solidity.",
      "Build decentralized applications on Ethereum.",
      "Integrate Web3.js into frontend applications.",
      "Test contracts for security vulnerabilities.",
      "Collaborate with product on tokenomics design.",
    ],
    skills: ["Solidity", "smart contracts", "Ethereum", "Web3.js", "cryptography", "decentralized applications"],
    niceToHave: ["Layer 2 scaling", "Rust", "zero-knowledge proofs"],
  },
  {
    titleBase: "Game Developer",
    intro: "We're looking for a {seniority}Game Developer to build engaging gameplay experiences.",
    responsibilities: [
      "Implement gameplay systems using Unity and C#.",
      "Build and optimize 3D graphics and animations.",
      "Tune game physics and collision systems.",
      "Design and iterate on level layouts.",
      "Profile and optimize game performance across platforms.",
    ],
    skills: ["Unity", "C#", "3D graphics", "game physics", "level design", "performance optimization"],
    niceToHave: ["Unreal Engine", "shader programming", "multiplayer networking"],
  },
  {
    titleBase: "Embedded Systems Engineer",
    intro: "We are hiring a {seniority}Embedded Systems Engineer to build firmware for our hardware products.",
    responsibilities: [
      "Write firmware in C and C++ for embedded devices.",
      "Work with microcontrollers and real-time operating systems.",
      "Debug hardware issues using oscilloscopes and logic analyzers.",
      "Optimize firmware for power and memory constraints.",
      "Collaborate with hardware engineers on board bring-up.",
    ],
    skills: ["C", "C++", "microcontrollers", "RTOS", "firmware", "hardware debugging", "embedded Linux"],
    niceToHave: ["low-power design", "I2C/SPI", "bootloaders"],
  },
  {
    titleBase: "Product Manager",
    intro: "We're hiring a {seniority}Product Manager to drive our product roadmap.",
    responsibilities: [
      "Define and prioritize the product roadmap.",
      "Write clear user stories and acceptance criteria.",
      "Conduct market and competitive research.",
      "Partner with engineering and design on execution.",
      "Analyze product metrics to inform decisions.",
      "Communicate product strategy to stakeholders.",
    ],
    skills: ["roadmap planning", "user stories", "stakeholder management", "market research", "agile", "prioritization", "product analytics"],
    niceToHave: ["A/B testing", "SQL", "pricing strategy"],
  },
  {
    titleBase: "Business Analyst",
    intro: "We are seeking a {seniority}Business Analyst to bridge business needs and technical solutions.",
    responsibilities: [
      "Gather and document business requirements.",
      "Model business processes and identify improvements.",
      "Write SQL queries to analyze operational data.",
      "Communicate findings to stakeholders and leadership.",
      "Support UAT for new system features.",
    ],
    skills: ["requirements gathering", "process modeling", "SQL", "stakeholder communication", "documentation", "data analysis"],
    niceToHave: ["Power BI", "Tableau", "Six Sigma"],
  },
  {
    titleBase: "Scrum Master",
    intro: "We're looking for a {seniority}Scrum Master to help our teams deliver effectively.",
    responsibilities: [
      "Facilitate sprint planning, standups, and retrospectives.",
      "Maintain and groom the product backlog with the team.",
      "Remove blockers and shield the team from distractions.",
      "Coach the team on agile best practices.",
      "Track sprint metrics and report progress to stakeholders.",
    ],
    skills: ["agile ceremonies", "sprint planning", "backlog grooming", "team facilitation", "Jira", "servant leadership"],
    niceToHave: ["SAFe", "Kanban", "coaching certification"],
  },
  {
    titleBase: "Technical Writer",
    intro: "We are hiring a {seniority}Technical Writer to make our documentation clear and useful.",
    responsibilities: [
      "Write and maintain developer-facing API documentation.",
      "Create style guides and documentation standards.",
      "Collaborate with engineers to keep docs accurate.",
      "Edit and review documentation contributions from others.",
      "Organize documentation for discoverability.",
    ],
    skills: ["technical documentation", "API docs", "style guides", "Markdown", "cross-team collaboration", "editing"],
    niceToHave: ["docs-as-code", "static site generators", "diagramming tools"],
  },
  {
    titleBase: "IT Support Specialist",
    intro: "We need a {seniority}IT Support Specialist to keep our team productive.",
    responsibilities: [
      "Troubleshoot hardware and software issues for employees.",
      "Manage support tickets through to resolution.",
      "Set up and maintain employee laptops and accounts.",
      "Maintain internal IT documentation.",
      "Escalate complex issues to the right team.",
    ],
    skills: ["troubleshooting", "help desk", "hardware support", "software support", "ticketing systems", "customer service"],
    niceToHave: ["Active Directory", "macOS and Windows support", "networking basics"],
  },
  {
    titleBase: "Digital Marketing Analyst",
    intro: "We are hiring a {seniority}Digital Marketing Analyst to optimize our marketing performance.",
    responsibilities: [
      "Analyze campaign performance using Google Analytics.",
      "Run and optimize SEO and SEM initiatives.",
      "Design and evaluate A/B tests for landing pages.",
      "Report on key marketing metrics to stakeholders.",
      "Support content strategy with data-driven insights.",
    ],
    skills: ["SEO", "SEM", "Google Analytics", "campaign optimization", "A/B testing", "content strategy", "social media"],
    niceToHave: ["Google Ads", "marketing automation", "CRM tools"],
  },
  {
    titleBase: "Financial Analyst",
    intro: "We're looking for a {seniority}Financial Analyst to support financial planning and reporting.",
    responsibilities: [
      "Build financial models to support business decisions.",
      "Prepare budgets and forecasts.",
      "Perform variance analysis against budget.",
      "Prepare reports for leadership and stakeholders.",
      "Support month-end and quarter-end close processes.",
    ],
    skills: ["financial modeling", "Excel", "forecasting", "budgeting", "variance analysis", "reporting"],
    niceToHave: ["SQL", "SAP", "financial planning software"],
  },

  // --- Core engineering (non-software) ---
  {
    titleBase: "Mechanical Engineer",
    intro: "We are hiring a {seniority}Mechanical Engineer to design and improve mechanical systems and products.",
    responsibilities: [
      "Design mechanical components and assemblies using CAD software.",
      "Run structural and thermal simulations to validate designs.",
      "Create and review engineering drawings and specifications.",
      "Prototype and test new product designs.",
      "Collaborate with manufacturing on design for manufacturability.",
      "Investigate and resolve field failures and quality issues.",
      "Support cost reduction and design optimization initiatives.",
      "Document design decisions and maintain technical files.",
    ],
    skills: ["SolidWorks", "AutoCAD", "CAD design", "finite element analysis", "GD&T", "prototyping", "mechanical systems", "materials science", "manufacturing processes"],
    niceToHave: ["Six Sigma", "ANSYS", "product lifecycle management", "DFM/DFA"],
  },
  {
    titleBase: "Civil Engineer",
    intro: "We're looking for a {seniority}Civil Engineer to design and oversee infrastructure projects.",
    responsibilities: [
      "Design structural elements for buildings, roads, or infrastructure.",
      "Prepare technical drawings and specifications using AutoCAD/Civil 3D.",
      "Conduct site inspections and monitor construction progress.",
      "Perform structural calculations and load analysis.",
      "Coordinate with contractors, architects, and regulatory agencies.",
      "Ensure projects comply with building codes and safety standards.",
      "Prepare project cost estimates and schedules.",
      "Review and approve construction submittals.",
    ],
    skills: ["AutoCAD", "Civil 3D", "structural analysis", "site inspection", "project scheduling", "building codes", "surveying", "construction management"],
    niceToHave: ["PE license", "Revit", "geotechnical engineering", "stormwater design"],
  },
  {
    titleBase: "Electrical Engineer",
    intro: "We are seeking a {seniority}Electrical Engineer to design and test electrical systems.",
    responsibilities: [
      "Design electrical circuits and power distribution systems.",
      "Develop and test PCB layouts.",
      "Perform circuit simulations and validate designs against specifications.",
      "Troubleshoot electrical systems and resolve design issues.",
      "Ensure designs comply with electrical safety standards.",
      "Collaborate with mechanical and firmware engineers on integrated systems.",
      "Prepare technical documentation and test reports.",
      "Support production with design-for-manufacturing reviews.",
    ],
    skills: ["circuit design", "PCB design", "AutoCAD Electrical", "power systems", "electrical schematics", "SPICE simulation", "electrical safety standards"],
    niceToHave: ["Altium Designer", "control systems", "renewable energy systems"],
  },
  {
    titleBase: "Chemical Engineer",
    intro: "We're hiring a {seniority}Chemical Engineer to optimize industrial processes.",
    responsibilities: [
      "Design and optimize chemical process workflows.",
      "Monitor plant operations to ensure safety and efficiency.",
      "Conduct process simulations and mass/energy balance calculations.",
      "Support scale-up of processes from lab to production.",
      "Ensure compliance with environmental and safety regulations.",
      "Troubleshoot process deviations and equipment issues.",
      "Analyze process data to identify improvement opportunities.",
      "Collaborate with quality and R&D teams on new formulations.",
    ],
    skills: ["process engineering", "process simulation", "mass and energy balances", "chemical safety", "plant operations", "process optimization", "regulatory compliance"],
    niceToHave: ["Aspen Plus", "Six Sigma", "process control systems"],
  },
  {
    titleBase: "Industrial Engineer",
    intro: "We are looking for a {seniority}Industrial Engineer to improve operational efficiency.",
    responsibilities: [
      "Analyze production workflows to identify inefficiencies.",
      "Design and implement process improvements using Lean principles.",
      "Develop time studies and capacity planning models.",
      "Optimize facility layout and material flow.",
      "Collaborate with operations on quality and productivity initiatives.",
      "Build data models to support decision-making.",
      "Lead continuous improvement (Kaizen) projects.",
      "Track and report key operational metrics.",
    ],
    skills: ["Lean manufacturing", "Six Sigma", "process improvement", "time studies", "capacity planning", "facility layout", "data analysis", "Kaizen"],
    niceToHave: ["Minitab", "simulation software", "ergonomics"],
  },
  {
    titleBase: "Aerospace Engineer",
    intro: "We're hiring a {seniority}Aerospace Engineer to design and analyze aircraft and spacecraft systems.",
    responsibilities: [
      "Design and analyze aerospace structures and components.",
      "Perform aerodynamic and structural simulations.",
      "Support flight testing and data analysis.",
      "Ensure designs meet aviation regulatory requirements.",
      "Collaborate with systems engineers on integration.",
      "Prepare technical reports and design documentation.",
      "Investigate and resolve design and performance issues.",
    ],
    skills: ["aerodynamics", "structural analysis", "CATIA", "MATLAB", "flight systems", "aerospace materials", "regulatory compliance"],
    niceToHave: ["propulsion systems", "avionics", "systems engineering"],
  },
  {
    titleBase: "Environmental Engineer",
    intro: "We are seeking a {seniority}Environmental Engineer to design solutions for environmental challenges.",
    responsibilities: [
      "Design systems for water treatment, waste management, or pollution control.",
      "Conduct environmental impact assessments.",
      "Ensure compliance with environmental regulations.",
      "Collect and analyze environmental samples and data.",
      "Prepare permit applications and regulatory reports.",
      "Support remediation projects at contaminated sites.",
      "Collaborate with regulatory agencies and stakeholders.",
    ],
    skills: ["environmental regulations", "water treatment", "waste management", "environmental impact assessment", "GIS", "sampling and data analysis", "permitting"],
    niceToHave: ["AutoCAD Civil 3D", "air quality modeling", "sustainability consulting"],
  },
  {
    titleBase: "Manufacturing Engineer",
    intro: "We're hiring a {seniority}Manufacturing Engineer to optimize production processes.",
    responsibilities: [
      "Design and improve manufacturing processes and tooling.",
      "Develop work instructions and process documentation.",
      "Troubleshoot production issues to minimize downtime.",
      "Collaborate with design engineering on new product introductions.",
      "Implement quality control checks on the production line.",
      "Analyze production data to identify improvement opportunities.",
      "Support automation and equipment upgrade projects.",
    ],
    skills: ["manufacturing processes", "process documentation", "root cause analysis", "quality control", "production line optimization", "tooling design", "lean manufacturing"],
    niceToHave: ["automation", "PLC programming", "Six Sigma"],
  },

  // --- Non-tech roles ---
  {
    titleBase: "HR Generalist",
    intro: "We are hiring a {seniority}HR Generalist to support our people operations.",
    responsibilities: [
      "Manage the full recruitment lifecycle from sourcing to offer.",
      "Support onboarding and employee orientation programs.",
      "Administer employee benefits and HR policies.",
      "Handle employee relations issues and conflict resolution.",
      "Maintain accurate employee records and HR systems.",
      "Support performance review and compensation processes.",
      "Ensure compliance with labor laws and regulations.",
    ],
    skills: ["recruitment", "onboarding", "employee relations", "HRIS", "benefits administration", "labor law compliance", "performance management"],
    niceToHave: ["SHRM certification", "compensation analysis", "diversity and inclusion programs"],
  },
  {
    titleBase: "Sales Executive",
    intro: "We're looking for a {seniority}Sales Executive to grow our customer base and revenue.",
    responsibilities: [
      "Prospect and qualify new sales leads.",
      "Deliver product demos and presentations to prospects.",
      "Negotiate contracts and close new business.",
      "Manage a pipeline of opportunities in the CRM.",
      "Build and maintain relationships with key accounts.",
      "Meet or exceed quarterly sales targets.",
      "Collaborate with marketing on lead generation campaigns.",
    ],
    skills: ["prospecting", "sales negotiation", "CRM software", "pipeline management", "relationship building", "closing deals", "presentation skills"],
    niceToHave: ["Salesforce", "solution selling", "account management"],
  },
  {
    titleBase: "Operations Manager",
    intro: "We are hiring a {seniority}Operations Manager to oversee daily business operations.",
    responsibilities: [
      "Oversee day-to-day operations across teams.",
      "Develop and monitor operational budgets.",
      "Implement process improvements to increase efficiency.",
      "Manage vendor and supplier relationships.",
      "Lead and develop a team of operations staff.",
      "Track key performance indicators and report to leadership.",
      "Ensure compliance with company policies and regulations.",
    ],
    skills: ["operations management", "budgeting", "process improvement", "vendor management", "team leadership", "KPI tracking", "project management"],
    niceToHave: ["Lean Six Sigma", "ERP systems", "supply chain management"],
  },
  {
    titleBase: "Logistics Coordinator",
    intro: "We're seeking a {seniority}Logistics Coordinator to keep our supply chain running smoothly.",
    responsibilities: [
      "Coordinate inbound and outbound shipments.",
      "Track inventory levels and reconcile discrepancies.",
      "Negotiate rates with carriers and freight vendors.",
      "Monitor delivery schedules and resolve delays.",
      "Maintain accurate shipping and logistics documentation.",
      "Collaborate with warehouse and procurement teams.",
      "Analyze logistics data to identify cost-saving opportunities.",
    ],
    skills: ["supply chain coordination", "inventory management", "freight negotiation", "logistics software", "shipping documentation", "vendor coordination", "demand planning"],
    niceToHave: ["SAP", "warehouse management systems", "customs documentation"],
  },
  {
    titleBase: "Customer Support Representative",
    intro: "We are hiring a {seniority}Customer Support Representative to help our customers succeed.",
    responsibilities: [
      "Respond to customer inquiries via phone, email, and chat.",
      "Troubleshoot and resolve product or service issues.",
      "Document customer interactions in the support system.",
      "Escalate complex issues to the appropriate team.",
      "Maintain a high customer satisfaction rating.",
      "Contribute to the knowledge base and help documentation.",
      "Identify recurring issues and report trends to the team.",
    ],
    skills: ["customer service", "problem solving", "help desk software", "communication", "conflict resolution", "product knowledge", "multitasking"],
    niceToHave: ["Zendesk", "live chat support", "CRM software"],
  },
  {
    titleBase: "Retail Store Manager",
    intro: "We're looking for a {seniority}Store Manager to lead our retail location.",
    responsibilities: [
      "Manage daily store operations and staff scheduling.",
      "Drive sales performance and meet revenue targets.",
      "Hire, train, and develop store associates.",
      "Ensure excellent customer service on the sales floor.",
      "Manage inventory levels and loss prevention.",
      "Oversee visual merchandising and store presentation.",
      "Analyze sales reports to inform business decisions.",
    ],
    skills: ["retail operations", "staff management", "sales performance", "inventory control", "customer service", "scheduling", "merchandising"],
    niceToHave: ["POS systems", "loss prevention", "visual merchandising"],
  },
  {
    titleBase: "Registered Nurse",
    intro: "We are hiring a {seniority}Registered Nurse to provide high-quality patient care.",
    responsibilities: [
      "Assess patient conditions and monitor vital signs.",
      "Administer medications and treatments as prescribed.",
      "Maintain accurate patient records and documentation.",
      "Educate patients and families on care plans.",
      "Collaborate with physicians and care teams on treatment plans.",
      "Respond to patient emergencies and escalate care as needed.",
      "Ensure compliance with healthcare regulations and safety standards.",
    ],
    skills: ["patient care", "clinical assessment", "medication administration", "electronic health records", "patient education", "care coordination", "HIPAA compliance"],
    niceToHave: ["BLS/ACLS certification", "critical care experience", "case management"],
  },
  {
    titleBase: "Teacher",
    intro: "We're seeking a {seniority}Teacher to inspire and educate students.",
    responsibilities: [
      "Plan and deliver engaging lesson plans aligned with curriculum standards.",
      "Assess student progress and provide constructive feedback.",
      "Manage classroom behavior and foster a positive learning environment.",
      "Communicate regularly with parents about student progress.",
      "Differentiate instruction to meet diverse learning needs.",
      "Participate in staff meetings and professional development.",
      "Incorporate technology and varied teaching methods into lessons.",
    ],
    skills: ["curriculum planning", "classroom management", "lesson planning", "student assessment", "differentiated instruction", "parent communication", "educational technology"],
    niceToHave: ["teaching certification", "special education experience", "IEP development"],
  },
  {
    titleBase: "Paralegal",
    intro: "We are hiring a {seniority}Paralegal to support our legal team.",
    responsibilities: [
      "Conduct legal research and prepare case summaries.",
      "Draft legal documents, contracts, and correspondence.",
      "Organize and maintain case files and evidence.",
      "Assist attorneys with trial preparation and discovery.",
      "Communicate with clients and coordinate scheduling.",
      "File documents with courts and regulatory agencies.",
      "Track deadlines and manage case calendars.",
    ],
    skills: ["legal research", "document drafting", "case management", "litigation support", "legal writing", "court filing procedures", "confidentiality"],
    niceToHave: ["paralegal certification", "e-discovery tools", "contract review"],
  },
  {
    titleBase: "Hotel Operations Manager",
    intro: "We're looking for a {seniority}Hotel Operations Manager to deliver exceptional guest experiences.",
    responsibilities: [
      "Oversee daily hotel operations across departments.",
      "Ensure high standards of guest service and satisfaction.",
      "Manage staff scheduling, training, and performance.",
      "Monitor occupancy, revenue, and operational budgets.",
      "Resolve guest complaints and service issues.",
      "Coordinate with housekeeping, front desk, and food service teams.",
      "Implement quality and safety standards across the property.",
    ],
    skills: ["hotel operations", "guest services", "staff management", "budget management", "revenue management", "hospitality software", "quality standards"],
    niceToHave: ["PMS systems (Opera)", "event coordination", "food and beverage management"],
  },
  {
    titleBase: "Staff Accountant",
    intro: "We are hiring a {seniority}Staff Accountant to manage financial records and reporting.",
    responsibilities: [
      "Prepare and record journal entries and reconcile accounts.",
      "Assist with month-end and year-end close processes.",
      "Prepare financial statements and reports.",
      "Support accounts payable and accounts receivable processes.",
      "Ensure compliance with accounting standards and internal controls.",
      "Assist with budget preparation and variance analysis.",
      "Support external audits with documentation and reporting.",
    ],
    skills: ["bookkeeping", "financial reporting", "account reconciliation", "GAAP", "accounts payable/receivable", "Excel", "accounting software"],
    niceToHave: ["QuickBooks", "CPA track", "budget forecasting"],
  },
  {
    titleBase: "Restaurant Manager",
    intro: "We're seeking a {seniority}Restaurant Manager to lead front and back of house operations.",
    responsibilities: [
      "Manage daily restaurant operations and staff scheduling.",
      "Ensure food quality, safety, and service standards.",
      "Hire, train, and develop restaurant staff.",
      "Monitor inventory, ordering, and cost control.",
      "Resolve customer complaints and ensure guest satisfaction.",
      "Track sales performance and manage labor costs.",
      "Ensure compliance with health and safety regulations.",
    ],
    skills: ["restaurant operations", "staff management", "food safety", "inventory control", "cost control", "customer service", "scheduling"],
    niceToHave: ["POS systems", "ServSafe certification", "menu planning"],
  },
];

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickRandom<T>(items: T[], count: number): T[] {
  return shuffle(items).slice(0, Math.min(count, items.length));
}

function randomCompany(): string {
  const prefix = COMPANY_PREFIXES[Math.floor(Math.random() * COMPANY_PREFIXES.length)];
  const suffix = COMPANY_SUFFIXES[Math.floor(Math.random() * COMPANY_SUFFIXES.length)];
  return `${prefix} ${suffix}`;
}

function buildDescription(role: RoleTemplate, seniority: string): string {
  const intro = role.intro.replace("{seniority}", seniority ? `${seniority} ` : "");
  const responsibilities = pickRandom(role.responsibilities, 4).join(" ");
  const skills = pickRandom(role.skills, 5).join(", ");
  const niceToHave = pickRandom(role.niceToHave, 2).join(" and ");

  return `${intro} ${responsibilities} Required skills: ${skills}. Nice to have: ${niceToHave}.`;
}

const TARGET_COUNT = 1000;
const POSTINGS_PER_ROLE = Math.ceil(TARGET_COUNT / ROLES.length);

function generateJobs(): JobDescription[] {
  const jobs: JobDescription[] = [];
  let counter = 1;

  for (const role of ROLES) {
    for (let i = 0; i < POSTINGS_PER_ROLE; i++) {
      const seniority = SENIORITIES[Math.floor(Math.random() * SENIORITIES.length)];
      const title = seniority ? `${seniority} ${role.titleBase}` : role.titleBase;

      jobs.push({
        jobId: `jd-${String(counter).padStart(4, "0")}`,
        title,
        company: randomCompany(),
        description: buildDescription(role, seniority),
      });
      counter++;
    }
  }

  return jobs;
}

async function main() {
  const jobs = generateJobs();
  const outputPath = path.join(import.meta.dirname, "..", "data", "jobs.json");
  await fs.writeFile(outputPath, JSON.stringify(jobs, null, 2));
  console.log(`Generated ${jobs.length} job descriptions across ${ROLES.length} roles -> ${outputPath}`);
}

main().catch((err) => {
  console.error("Job generation failed:", err);
  process.exit(1);
});

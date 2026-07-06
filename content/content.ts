/**
 * Single source of truth for all page content.
 * Components render from this data — nothing content-related is hardcoded in JSX.
 *
 * NOTE: several roles intentionally overlap in time (concurrent study / research / TA).
 */

export type LinkKind =
  | "github"
  | "linkedin"
  | "website"
  | "email"
  | "resume";

export interface ProfileLink {
  kind: LinkKind;
  label: string;
  href: string;
}

export interface Profile {
  name: string;
  title: string;
  taglineRole: string;
  studio: string;
  location: string;
  heroSubtitle: string;
  about: string;
  aboutHighlights: string[];
}

/** Small organization logo cards shown on a quest checkpoint. */
export type OrgBadge = "respawn-ea" | "ua";

export interface ExperienceRole {
  id: string;
  role: string;
  org: string;
  period: string;
  current: boolean;
  orgBadges: OrgBadge[];
  summary: string;
  details: string[];
  tags: string[];
}

export interface Publication {
  id: string;
  title: string;
  venue: string;
  authors: string;
  collaboration?: string;
  tags: string[];
}

export interface Project {
  id: string;
  title: string;
  objective: string;
  technologies: string[];
  domain: string;
  status: "Completed";
  description: string;
}

export interface SkillNode {
  id: string;
  name: string;
  blurb: string;
}

export interface SkillBranch {
  id: string;
  name: string;
  blurb: string;
  nodes: SkillNode[];
}

export interface Award {
  id: string;
  title: string;
}

export interface Education {
  id: string;
  degree: string;
  school: string;
  period: string;
  focus: string;
  gpa: string;
  distinction?: string;
}

export interface SceneNav {
  id: string;
  label: string;
}

export const profile: Profile = {
  name: "Wentao Lu",
  title: "Software Development Engineer",
  taglineRole: "AI QA Researcher",
  studio: "Respawn Studios @ Electronic Arts",
  location: "Edmonton, AB, Canada",
  heroSubtitle:
    "Designing AI-assisted systems for gameplay analysis, visual bug detection, and scalable QA automation.",
  about:
    "Wentao Lu is a software engineer and AI researcher focused on building intelligent systems for game quality assurance. With a background in Computer Engineering and an MSc in Software Engineering and Intelligent Systems from the University of Alberta, he works at the intersection of machine learning, software engineering, gameplay analysis, and visual bug detection. His research and industry work explore how AI can help teams understand gameplay footage, detect visual issues, and reduce manual QA effort at scale.",
  aboutHighlights: [
    "MSc in Software Engineering & Intelligent Systems",
    "University of Alberta",
    "Computer Engineering background",
    "ASGAARD Lab",
    "ML System Engineering & Analytics",
    "AI-assisted QA",
    "Gameplay Video nalysis",
    "Visual Bug Detection",
    "Respawn Studios @ EA",
  ],
};

export const links = {
  github: "https://github.com/lwt0000",
  linkedin: "https://www.linkedin.com/in/wentao-lu-5671a21b7/",
  website: "https://wentao.super.site",
  websiteLabel: "wentao.super.site",
  personalEmail: "wlu4@ualberta.ca",
  workEmail: "wenlu@ea.com",
  resume: "/resume.pdf",
} as const;

/** QR on the badge back points here. */
export const qrTarget = links.linkedin;

export const inventoryLinks: ProfileLink[] = [
  { kind: "resume", label: "Resume", href: links.resume },
  { kind: "github", label: "GitHub", href: links.github },
  { kind: "linkedin", label: "LinkedIn", href: links.linkedin },
  { kind: "email", label: links.personalEmail, href: `mailto:${links.personalEmail}` },
  { kind: "email", label: links.workEmail, href: `mailto:${links.workEmail}` },
  { kind: "website", label: links.websiteLabel, href: links.website },
];

export const experience: ExperienceRole[] = [
  {
    id: "respawn-sde",
    role: "Software Development Engineer",
    org: "Respawn Studios / Electronic Arts",
    period: "Apr 2026 – Present",
    current: true,
    orgBadges: ["respawn-ea"],
    summary: "QA and AI research at Respawn — game-related AI workflows and QA innovation.",
    details: [
      "Drives AI research for game QA: gameplay analysis, bug detection, and intelligent QA tooling.",
      "Builds game-related AI workflows powering QA innovation across the studio.",
    ],
    tags: ["AI for Games", "QA Automation", "Gameplay Analysis"],
  },
  {
    id: "ea-researcher",
    role: "Science Researcher",
    org: "Electronic Arts",
    period: "Oct 2024 – Oct 2025",
    current: false,
    orgBadges: ["respawn-ea", "ua"],
    summary: "Applied AI/ML to large-scale game testing.",
    details: [
      "Built automated bug detection & retrieval from gameplay footage using vision-language models.",
      "Partnered with QA and engineering teams to deploy scalable solutions.",
    ],
    tags: ["Vision-Language Models", "Machine Learning", "Game Testing"],
  },
  {
    id: "ualberta-gra",
    role: "Graduate Research Assistant Fellowship",
    org: "University of Alberta",
    period: "Sept 2023 – Jan 2026",
    current: false,
    orgBadges: ["ua"],
    summary: "ASGAARD Lab — Machine Learning System Engineering & Analytics.",
    details: [
      "Research in intelligent systems and AI/ML testing.",
      "Machine Learning System Engineering & Analytics at the ASGAARD Lab.",
    ],
    tags: ["ML Systems", "Intelligent Systems", "Research"],
  },
  {
    id: "ualberta-ta",
    role: "Undergraduate / Graduate Teaching Assistant",
    org: "University of Alberta",
    period: "Sept 2022 – Dec 2025",
    current: false,
    orgBadges: ["ua"],
    summary: "Labs for CMPUT 291 & ECE 325.",
    details: [
      "Taught labs covering SQL, Python, MongoDB, Java, database systems, and programming concepts.",
    ],
    tags: ["SQL", "Python", "Java", "Teaching"],
  },
];

export const publications: Publication[] = [
  {
    id: "fse-2026-vlm",
    title:
      "How Far Can VLMs Go for Visual Bug Detection? Studying 19,738 Keyframes from 41 Hours of Gameplay Videos",
    venue: "FSE 2026",
    authors:
      "Wentao Lu, Alexander Senchenko, Alan Sayle, Abram Hindle, Cor-Paul Bezemer",
    collaboration: "In collaboration with EA",
    tags: ["Vision-Language Models", "Visual Bug Detection", "Gameplay Video Analysis"],
  },
  {
    id: "seip-2026-retrieval",
    title:
      "Automated Bug Frame Retrieval from Gameplay Videos Using Multimodal Large Language Models",
    venue: "SEIP 2026",
    authors: "Wentao Lu, Alexander Senchenko, Abram Hindle, Cor-Paul Bezemer",
    collaboration: "In collaboration with EA",
    tags: ["QA Automation", "AI for Games", "Machine Learning Systems"],
  },
  {
    id: "msr-2024-chatgpt",
    title:
      "Analyzing Developer Use of ChatGPT-Generated Code in Open-Source GitHub Projects",
    venue: "MSR 2024",
    authors: "Balreet Grewal, Wentao Lu, Sarah Nadi, Cor-Paul Bezemer",
    tags: ["Software Engineering Research", "Machine Learning Systems"],
  },
];

export const projects: Project[] = [
  {
    id: "qpp-testbed",
    title: "Quantum Permutation Pad Testbed",
    objective: "Explore post-quantum encryption on embedded hardware",
    technologies: ["FPGA", "C++", "AES-256", "SoC"],
    domain: "Cryptography / Embedded",
    status: "Completed",
    description:
      "Encrypt/decrypt testbed using an open-source classical Quantum Permutation Pad implementation on an SoC platform — FPGA fabric plus C++, with AES-256 comparison and cryptography experimentation.",
  },
  {
    id: "falcon9-landing",
    title: "SpaceX Falcon 9 First-Stage Landing Prediction",
    objective: "Predict first-stage landing success end to end",
    technologies: ["Python", "SQL", "Folium", "Plotly Dash", "KNN", "SVM"],
    domain: "Data Science / ML",
    status: "Completed",
    description:
      "Data-science capstone: web scraping, the SpaceX API, EDA, SQL, visualization with Folium and Plotly Dash, and ML models — KNN, Decision Tree, Logistic Regression, SVM.",
  },
  {
    id: "mongodb-manager",
    title: "MongoDB Database Management Program",
    objective: "Tame unregulated data at scale",
    technologies: ["MongoDB", "Python", "JSON"],
    domain: "Databases",
    status: "Completed",
    description:
      "Parsed unregulated CSV into JSON, loaded it into MongoDB, and built a management system for large-scale data.",
  },
  {
    id: "unix-jobs",
    title: "Unix System Concurrent Jobs Simulation",
    objective: "Model contention over scarce resources",
    technologies: ["C/C++", "Threads", "Unix"],
    domain: "Systems",
    status: "Completed",
    description:
      "C/C++ threads simulating concurrent jobs under Unix with non-shareable, non-preemptable resources.",
  },
  {
    id: "peer-comm",
    title: "Peer Process Communication (FIFO/TCP)",
    objective: "Reliable inter-process packet switching",
    technologies: ["C++", "FIFO", "TCP", "I/O Multiplexing"],
    domain: "Systems / Networking",
    status: "Completed",
    description:
      "C++ master plus packet-switch processes; signals, FIFO/TCP, I/O multiplexing, and client-server communication.",
  },
  {
    id: "sql-streaming",
    title: "Python SQL Streaming Database",
    objective: "Stream-first database with role-based flows",
    technologies: ["Python", "SQL"],
    domain: "Databases",
    status: "Completed",
    description:
      "SQL-in-Python streaming database with login flows for customers and editors.",
  },
  {
    id: "unix-shell",
    title: "Unix Shell Program",
    objective: "A shell from first principles",
    technologies: ["C++", "Unix System Calls"],
    domain: "Systems",
    status: "Completed",
    description: "Bash-like shell in C++ built directly on Unix system calls.",
  },
];

export const skillBranches: SkillBranch[] = [
  {
    id: "ai-ml",
    name: "AI / Machine Learning",
    blurb: "Teaching machines to watch, understand, and test games.",
    nodes: [
      { id: "ml", name: "Machine Learning", blurb: "Model design, training, and evaluation for applied research and production systems." },
      { id: "cv", name: "Computer Vision", blurb: "Frame-level understanding of gameplay footage — detection, retrieval, and analysis." },
      { id: "vlm", name: "Vision-Language Models", blurb: "Multimodal models that connect what a game looks like with what a bug report says." },
      { id: "tf", name: "TensorFlow", blurb: "Production ML pipelines and experimentation." },
      { id: "pytorch", name: "PyTorch", blurb: "Research-grade model building and fine-tuning." },
      { id: "gameplay", name: "Gameplay Analysis", blurb: "Extracting signal from hours of play sessions automatically." },
      { id: "qa-auto", name: "QA Automation", blurb: "Reducing manual QA effort with intelligent tooling at scale." },
    ],
  },
  {
    id: "software",
    name: "Software Engineering",
    blurb: "The craft under everything — from scripts to systems.",
    nodes: [
      { id: "python", name: "Python", blurb: "Primary language for ML, data work, and tooling." },
      { id: "cpp", name: "C/C++", blurb: "Systems programming, concurrency, and embedded work." },
      { id: "java", name: "Java", blurb: "Object-oriented design and teaching (ECE 325)." },
      { id: "go", name: "Go", blurb: "Services and tooling." },
      { id: "sql", name: "SQL", blurb: "Query design and database systems (CMPUT 291)." },
      { id: "git", name: "Git", blurb: "Version control and collaboration workflows." },
      { id: "html", name: "HTML", blurb: "Web fundamentals." },
      { id: "mongodb", name: "MongoDB", blurb: "Document stores for large, messy data." },
    ],
  },
  {
    id: "research",
    name: "Research / Systems",
    blurb: "Rigorous methods for intelligent software.",
    nodes: [
      { id: "mlse", name: "ML System Engineering", blurb: "Engineering the systems around models — data, deployment, evaluation." },
      { id: "intel-sys", name: "Intelligent Systems", blurb: "MSc specialization: systems that learn and adapt." },
      { id: "se-research", name: "Software Engineering Research", blurb: "Peer-reviewed empirical studies (FSE, MSR, SEIP)." },
      { id: "data-analysis", name: "Data Analysis", blurb: "From raw logs to defensible conclusions." },
      { id: "ai-testing", name: "AI Testing", blurb: "Testing AI systems — and using AI to test systems." },
    ],
  },
  {
    id: "hardware",
    name: "Hardware / Embedded",
    blurb: "Where software meets silicon.",
    nodes: [
      { id: "msp430", name: "MSP430", blurb: "Low-power embedded development." },
      { id: "stm32", name: "STM32", blurb: "ARM Cortex-M microcontroller projects." },
      { id: "efr32", name: "EFR32FG12", blurb: "Wireless SoC development." },
      { id: "zynq", name: "Xilinx Zynq Z7", blurb: "FPGA + ARM SoC — home of the QPP testbed." },
      { id: "riscv", name: "RISC-V Assembly", blurb: "Bare-metal instruction-level programming." },
    ],
  },
];

export const awards: Award[] = [
  { id: "ages", title: "Alberta Graduate Excellence Scholarship" },
  { id: "first-class", title: "First Class Standing, University of Alberta" },
  { id: "maple-leaf", title: "University of Alberta Maple Leaf First-Year Excellence Scholarship" },
  { id: "intl", title: "International Student Scholarship, University of Alberta" },
];

export const education: Education[] = [
  {
    id: "msc",
    degree: "MSc, Electrical & Computer Engineering",
    school: "University of Alberta",
    period: "Sept 2023 – Jan 2026",
    focus: "Intelligent Systems & Analytics",
    gpa: "CGPA 4.0 / 4.0",
  },
  {
    id: "bsc",
    degree: "BSc, Computer Engineering",
    school: "University of Alberta",
    period: "Sept 2019 – June 2023",
    focus: "Computer Engineering",
    gpa: "CGPA 3.7 / 4.0",
    distinction: "Graduation with Distinction · First Class Standing",
  },
];

export const scenes: SceneNav[] = [
  { id: "spawn", label: "Spawn" },
  { id: "profile", label: "Profile" },
  { id: "quest-path", label: "Quest Path" },
  { id: "archive", label: "Archive" },
  { id: "missions", label: "Missions" },
  { id: "ability-tree", label: "Ability Tree" },
  { id: "achievements", label: "Achievements" },
  { id: "origin", label: "Origin" },
  { id: "portal", label: "Portal" },
];

/**
 * Asset slots resolved by the discovery protocol (§4).
 * Discovered in `assests/` (existing folder name kept as-is) and copied to public/assets/.
 * heroVideo: no video was found in any known slot (hero-bg.mp4, background.mp4,
 * main-bg.mp4, hero-video.mp4 — .webm ok). If one is added to /public later, set
 * its path here; CinematicBackground will play it and still fall back to the
 * animated canvas if it fails to load.
 */
export const assets = {
  respawnLogo: "/assets/respawn-logo.webp",
  eaLogo: "/assets/ea-logo.svg",
  uaLogo: "/assets/ua-logo.png",
  /** 3D badge model (card + clip + clamp meshes, base/metal materials). */
  cardModel: "/assets/v0-card.glb",
  heroVideo: "/assets/hero-bg.mp4" as string | null,
  qrImage: null as string | null, // none in assets → generated at runtime → LinkedIn
} as const;

/** Accents derived from the discovered art (EA blue, Respawn ember) — not a brand palette. */
export const derivedAccents = {
  signal: "#255AF6",
  ember: "#F26722",
} as const;

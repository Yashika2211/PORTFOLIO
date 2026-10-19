/**
 * Single source of truth for every piece of text on the site.
 * Edit this file to change content — no component changes needed.
 */

export type Link = { label: string; href: string };

export type Stat = {
  id: string;
  value: number;
  /** Decimal places to render while counting up. */
  decimals?: number;
  prefix?: string;
  suffix?: string;
  label: string;
};

export type Experience = {
  role: string;
  org: string;
  period: string;
  points: string[];
};

export type SkillGroup = {
  id: "languages" | "ai" | "backend" | "testing";
  label: string;
  color: string;
  skills: string[];
};

export type Metric = { value: string; label: string };

export type ArchNode = { id: string; label: string; x: number; y: number };
export type ArchEdge = { from: string; to: string; label?: string };

export type Project = {
  slug: string;
  title: string;
  subtitle: string;
  event?: string;
  problem: string;
  built: string[];
  metrics: Metric[];
  stack: string[];
  repo?: string;
  live?: string;
  /** Skills (by exact name) this project exercises — drives constellation highlighting. */
  skills: string[];
  /** Mini architecture diagram on a 100×60 grid. */
  arch: { nodes: ArchNode[]; edges: ArchEdge[] };
  /** Render the animated P10/P50/P90 fan chart in the briefing. */
  fanChart?: boolean;
};

export type LabProject = {
  title: string;
  blurb: string;
  stack: string[];
  repo?: string;
  live?: string;
};

export type Achievement = {
  id: string;
  title: string;
  detail: string;
  icon: "trophy" | "flag" | "target" | "code" | "clock";
};

export const profile = {
  name: "Yashika Bhatia",
  headline: "Software Engineer — ML Systems, AI Agents & Backend",
  tagline: "Shipping projects > talking about them.",
  location: "Bengaluru, India",
  timezone: "Asia/Kolkata",
  email: "yashika.bhatia0522@gmail.com",
  resume: "/Yashika_Bhatia_Resume.pdf",
  githubUser: "Yashika2211",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://yashika-bhatia.vercel.app",
  education: {
    degree: "B.Tech CSE (Data Science)",
    school: "SRM University AP",
    period: "Aug 2023 – May 2027 (expected)",
    cgpa: "8.87/10",
  },
  links: [
    { label: "GitHub", href: "https://github.com/Yashika2211" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/yashika-bhatia-949560289" },
    { label: "Email", href: "mailto:yashika.bhatia0522@gmail.com" },
    { label: "X", href: "https://x.com/sarcasmunlimit2" },
  ] satisfies Link[],
};

export const assistant = {
  name: "Y.A.S.H.U.",
  expansion: "Yashika's Autonomous Systems & Hacks Unit",
  bootLines: [
    "Initializing Y.A.S.H.U. …",
    "loading neural modules …",
    "mounting case files [5] …",
    "7 hackathons indexed …",
    "welcome.",
  ],
};

export const stats: Stat[] = [
  { id: "intern", value: 18, label: "months of internship experience" },
  { id: "dsa", value: 500, suffix: "+", label: "DSA problems solved (LeetCode, Codeforces)" },
  { id: "hack", value: 7, label: "hackathons won / top performer" },
  { id: "sih", value: 2025, label: "Smart India Hackathon qualifier" },
  { id: "f05", value: 0.9807, decimals: 4, label: "macro F0.5 — Amazon ML Challenge" },
];

export const experience: Experience[] = [
  {
    role: "Freelance Software Developer & Financial Analyst",
    org: "Self-employed",
    period: "Mar 2026 – Present",
    points: [
      "Build and test web apps, e-commerce stores and backend APIs for clients.",
      "Validated payment-gateway integrations.",
      "Reconciled 5,000+ financial records and prepared 30+ reports for 10+ clients.",
    ],
  },
  {
    role: "Software Engineering Intern",
    org: "Mind Mauji",
    period: "Jan 2026 – Mar 2026",
    points: [
      "Traced defects and bottlenecks to root cause with SQL, logs and instrumentation, cutting drop-off by 18%.",
      "Shipped fixes to 5+ production features within weeks.",
    ],
  },
  {
    role: "Software Development Engineer Intern",
    org: "Aii Develops",
    period: "Jan 2025 – Dec 2025",
    points: [
      "Built REST APIs on PostgreSQL with idempotency and retries.",
      "Cut p95 latency 35% via indexing, query optimization and caching.",
      "Extended the test automation framework across 10+ releases of a platform serving 1,000+ concurrent users.",
      "Owned production root-cause analysis.",
    ],
  },
  {
    role: "Data Science Intern",
    org: "Prodigy Infotech",
    period: "Oct 2024 – Dec 2024",
    points: [
      "Analyzed 500K+ record datasets with Pandas/NumPy.",
      "20% faster preprocessing; built models at 87% accuracy.",
    ],
  },
];

export const skillGroups: SkillGroup[] = [
  {
    id: "languages",
    label: "Languages",
    color: "#00e5ff",
    skills: ["Python", "TypeScript", "JavaScript", "Java", "C++", "C", "SQL", "Go", "Shell"],
  },
  {
    id: "ai",
    label: "AI / ML",
    color: "#ffb547",
    skills: [
      "LLM agents",
      "MCP",
      "RAG",
      "LangChain",
      "LangGraph",
      "ChromaDB",
      "Strands Agents",
      "Amazon Bedrock",
      "Gemini API",
      "LightGBM",
      "Quantile regression & conformal calibration",
      "Pandas",
      "NumPy",
      "PyTorch",
    ],
  },
  {
    id: "backend",
    label: "Backend & Data",
    color: "#7cf7c4",
    skills: [
      "FastAPI",
      "Node.js",
      "Next.js",
      "React",
      "PostgreSQL",
      "Supabase",
      "MongoDB",
      "DynamoDB",
      "Kafka",
      "Docker",
      "AWS",
    ],
  },
  {
    id: "testing",
    label: "Testing & Quality",
    color: "#c9a7ff",
    skills: ["Pytest", "Vitest", "Playwright", "Cypress", "Postman", "REST Assured", "CI/CD"],
  },
];

/** AWS services, shown as a detail line under the Backend group. */
export const awsServices = ["Lambda", "S3", "EC2", "API Gateway", "EventBridge", "Polly", "SAM"];

export const projects: Project[] = [
  {
    slug: "haggle",
    title: "Haggle",
    subtitle: "Agent-Native Marketplace",
    event: "PayPal AI Hackathon",
    problem:
      "Small merchants can't staff a sales desk, and buyers waste time haggling line by line. Letting AI agents trade money needs hard guarantees, not vibes.",
    built: [
      "Merchants get an AI sales agent; buyers get an AI negotiator that splits a one-sentence need into line items and negotiates with merchants in parallel (up to 4 rounds each), streamed live over SSE as a “Negotiation Theater”.",
      "Mandate Firewall: HMAC-signed mandates (budget cap, categories, auto-approve threshold, expiry) enforced by a deterministic policy engine — the LLM proposes, the policy engine decides.",
      "PayPal escrow: funds are authorized, then captured per merchant only after an AI-verified delivery photo.",
      "Prompt-injection detection quarantines a rogue merchant.",
      "Exposes an MCP server so external agents like Claude can shop under the same rules.",
    ],
    metrics: [
      { value: "100%", label: "policy-engine test coverage" },
      { value: "4", label: "max negotiation rounds per merchant" },
      { value: "SSE", label: "live negotiation stream" },
    ],
    stack: [
      "Next.js",
      "TypeScript",
      "Postgres + Drizzle",
      "Gemini (Vercel AI SDK)",
      "PayPal APIs + Agent Toolkit",
      "MCP SDK",
      "Vitest",
      "Playwright",
      "Docker",
      "Render",
    ],
    repo: "https://github.com/Yashika2211/PAYPALAIHACKATHON",
    live: "https://haggle-6xg1.onrender.com",
    skills: ["TypeScript", "LLM agents", "MCP", "Gemini API", "Next.js", "PostgreSQL", "Docker", "Vitest", "Playwright"],
    arch: {
      nodes: [
        { id: "buyer", label: "Buyer agent", x: 12, y: 14 },
        { id: "fw", label: "Mandate firewall", x: 50, y: 14 },
        { id: "m", label: "Merchant agents", x: 88, y: 14 },
        { id: "sse", label: "SSE theater", x: 12, y: 46 },
        { id: "esc", label: "PayPal escrow", x: 50, y: 46 },
        { id: "mcp", label: "MCP server", x: 88, y: 46 },
      ],
      edges: [
        { from: "buyer", to: "fw", label: "propose" },
        { from: "fw", to: "m", label: "allow" },
        { from: "buyer", to: "sse" },
        { from: "fw", to: "esc", label: "capture" },
        { from: "mcp", to: "fw" },
      ],
    },
  },
  {
    slug: "codenation",
    title: "CodeNation",
    subtitle: "Multiplayer World for Developers",
    problem:
      "Coding practice feels isolated and its rewards are easy to game. Real work — challenges, duels, hackathons, merged PRs — deserves a world where progress is earned and tamper-proof.",
    built: [
      "A persistent world where solved challenges, rated duels, hackathon placements and merged PRs earn resources and reputation that unlock territory and tech; a Forge unlocks past 3,000 reputation.",
      "Append-only resource ledger in Postgres enforced by triggers and row-level security; invariant checks prove a user can't edit their own reputation or read hidden tests.",
      "Pluggable CodeRunner (Judge0 / Piston).",
      "k-gram fingerprinting for code-similarity integrity.",
    ],
    metrics: [
      { value: "106", label: "unit tests" },
      { value: "169", label: "test cases with reference solutions" },
      { value: "6", label: "wrong expected outputs caught" },
      { value: "220", label: "commits" },
    ],
    stack: ["Next.js 15", "TypeScript (strict)", "Tailwind v4", "Supabase", "Judge0"],
    repo: "https://github.com/Yashika2211/codenation",
    skills: ["TypeScript", "Next.js", "Supabase", "PostgreSQL", "SQL", "React"],
    arch: {
      nodes: [
        { id: "ui", label: "Next.js world", x: 12, y: 30 },
        { id: "run", label: "CodeRunner", x: 50, y: 12 },
        { id: "j", label: "Judge0 / Piston", x: 88, y: 12 },
        { id: "led", label: "Append-only ledger", x: 50, y: 48 },
        { id: "rls", label: "Triggers + RLS", x: 88, y: 48 },
      ],
      edges: [
        { from: "ui", to: "run", label: "submit" },
        { from: "run", to: "j" },
        { from: "ui", to: "led", label: "earn" },
        { from: "led", to: "rls", label: "enforce" },
      ],
    },
  },
  {
    slug: "cashforecastor",
    title: "AI Finance Controller",
    subtitle: "cashforecastor",
    problem:
      "Merchants run out of cash without warning, and a single-number forecast hides how wrong it might be. Books and bank feeds also drift apart silently.",
    built: [
      "Forecasts each merchant's cash position 14 days out as P10/P50/P90 bands with LightGBM quantile regression and per-category conformal calibration.",
      "11-fold walk-forward backtest; interval coverage raised from 77.7% raw to 84.1% against an 80% target.",
      "Rule-based books reconciliation against a bank/UTR feed.",
    ],
    metrics: [
      { value: "84.1%", label: "calibrated coverage (77.7% raw, 80% target)" },
      { value: "11", label: "walk-forward backtest folds" },
      { value: "100%", label: "reconciliation precision" },
      { value: "0%", label: "false-match rate" },
      { value: "100%", label: "duplicate detection" },
    ],
    stack: ["Python", "LightGBM", "FastAPI", "SQLAlchemy", "React + Vite", "Recharts"],
    repo: "https://github.com/Yashika2211/cashforecastor",
    live: "https://cashforecastor.vercel.app",
    skills: ["Python", "LightGBM", "Quantile regression & conformal calibration", "FastAPI", "React", "Pandas"],
    fanChart: true,
    arch: {
      nodes: [
        { id: "tx", label: "Transactions", x: 12, y: 14 },
        { id: "lgb", label: "LightGBM quantiles", x: 50, y: 14 },
        { id: "cf", label: "Conformal calib.", x: 88, y: 14 },
        { id: "bank", label: "Bank / UTR feed", x: 12, y: 46 },
        { id: "rec", label: "Reconciler", x: 50, y: 46 },
        { id: "ui", label: "React dashboard", x: 88, y: 46 },
      ],
      edges: [
        { from: "tx", to: "lgb" },
        { from: "lgb", to: "cf", label: "P10/50/90" },
        { from: "bank", to: "rec" },
        { from: "tx", to: "rec" },
        { from: "cf", to: "ui" },
        { from: "rec", to: "ui" },
      ],
    },
  },
  {
    slug: "saans-saathi",
    title: "SaansSaathi",
    subtitle: "Clean-Air School Planner",
    event: "WeMakeDevs × AWS Environmental Hacks",
    problem:
      "Delhi's schools run outdoor activities during the worst air-quality hours because nobody reads the hourly forecast in time.",
    built: [
      "Reads Delhi's hourly air-quality forecast and reschedules outdoor school activities out of the worst hours.",
      "Sends the plan to the principal on Telegram for one-tap approval, then sends parents a Hindi voice note via Amazon Polly.",
      "Claude Sonnet on Bedrock (Strands Agents) writes the messages but cannot change the rule-based plan.",
    ],
    metrics: [
      { value: "940", label: "child-hours moved out of AQI 201+ air (replay of 18 Nov 2024)" },
      { value: "1-tap", label: "principal approval on Telegram" },
    ],
    stack: ["Python", "AWS Lambda", "API Gateway", "EventBridge", "DynamoDB", "S3", "CloudFront", "Polly", "SAM"],
    repo: "https://github.com/Yashika2211/saans-saathi",
    skills: ["Python", "Amazon Bedrock", "Strands Agents", "LLM agents", "AWS", "DynamoDB"],
    arch: {
      nodes: [
        { id: "eb", label: "EventBridge cron", x: 12, y: 14 },
        { id: "aq", label: "AQI forecast", x: 12, y: 46 },
        { id: "plan", label: "Rule planner (λ)", x: 50, y: 30 },
        { id: "llm", label: "Bedrock writer", x: 88, y: 14 },
        { id: "tg", label: "Telegram + Polly", x: 88, y: 46 },
      ],
      edges: [
        { from: "eb", to: "plan" },
        { from: "aq", to: "plan" },
        { from: "plan", to: "llm", label: "text only" },
        { from: "plan", to: "tg", label: "approve" },
      ],
    },
  },
  {
    slug: "amazon-ml-2026",
    title: "Amazon ML Challenge 2026",
    subtitle: "Entity Resolution",
    problem: "Match the same business across three messy record sources where names, addresses and formats disagree.",
    built: [
      "Led team YAAD (4 people) through feature engineering and modelling for cross-source record matching.",
      "GroupKFold cross-validation to keep entities from leaking across folds.",
    ],
    metrics: [
      { value: "0.9807", label: "macro F0.5 (public leaderboard)" },
      { value: "3", label: "record sources matched" },
      { value: "4", label: "person team, led" },
    ],
    stack: ["Python", "LightGBM"],
    repo: "https://github.com/Yashika2211/amazon-ml-challenge-2026",
    skills: ["Python", "LightGBM", "Pandas", "NumPy"],
    arch: {
      nodes: [
        { id: "a", label: "Source A", x: 12, y: 10 },
        { id: "b", label: "Source B", x: 12, y: 30 },
        { id: "c", label: "Source C", x: 12, y: 50 },
        { id: "feat", label: "Pair features", x: 50, y: 30 },
        { id: "lgb", label: "LightGBM + GroupKFold", x: 88, y: 30 },
      ],
      edges: [
        { from: "a", to: "feat" },
        { from: "b", to: "feat" },
        { from: "c", to: "feat" },
        { from: "feat", to: "lgb", label: "match?" },
      ],
    },
  },
];

export const lab: LabProject[] = [
  {
    title: "ReportMaster AI",
    blurb:
      "RAG Q&A, summarization and ratio analysis over long financial annual reports; evaluated with known-answer tests.",
    stack: ["FastAPI", "LangChain", "ChromaDB", "Gemini", "React"],
  },
  {
    title: "GitKafka",
    blurb:
      "Real-time GitHub events pipeline: GitHub API → Kafka (3 partitions) → date-partitioned data lake; 1,700+ events across 1,125+ repos.",
    stack: ["Python", "Kafka", "Docker"],
    repo: "https://github.com/Yashika2211/gitkafka",
  },
  {
    title: "KridAI",
    blurb: "Multi-tenant WhatsApp AI sales/support agents with HMAC webhook verification.",
    stack: ["LangGraph", "FastAPI", "MongoDB"],
    repo: "https://github.com/Yashika2211/kridai",
  },
  {
    title: "OceanAI",
    blurb: "Oceanographic data app.",
    stack: ["Backend live"],
    live: "https://oceanai-backend.vercel.app",
  },
];

export const achievements: Achievement[] = [
  { id: "hack7", title: "7 hackathons", detail: "Winner / top performer in 7 hackathons", icon: "trophy" },
  { id: "sih", title: "SIH 2025", detail: "Smart India Hackathon 2025 qualifier", icon: "flag" },
  { id: "aml", title: "0.9807 F0.5", detail: "Amazon ML Challenge 2026 — led team YAAD", icon: "target" },
  { id: "paypal", title: "PayPal AI Hackathon", detail: "Built Haggle, an agent-native marketplace", icon: "code" },
  { id: "aws", title: "AWS Env. Hacks", detail: "Built SaansSaathi for WeMakeDevs × AWS", icon: "code" },
  { id: "dsa", title: "500+ DSA", detail: "Problems solved on LeetCode & Codeforces", icon: "clock" },
];

/** Static fallback for the live GitHub widget when the API is unavailable. */
export const githubFallback = {
  publicRepos: 27,
  recent: [
    { name: "PAYPALAIHACKATHON", pushedAt: "2026-10-17T23:30:15Z", url: "https://github.com/Yashika2211/PAYPALAIHACKATHON" },
    { name: "saans-saathi", pushedAt: "2026-10-08T12:13:29Z", url: "https://github.com/Yashika2211/saans-saathi" },
    { name: "santhisathi", pushedAt: "2026-10-10T10:07:57Z", url: "https://github.com/Yashika2211/santhisathi" },
  ],
};

export const sections = [
  { id: "hero", label: "Core" },
  { id: "about", label: "About" },
  { id: "skills", label: "Skills" },
  { id: "projects", label: "Projects" },
  { id: "experience", label: "Experience" },
  { id: "achievements", label: "Badges" },
  { id: "contact", label: "Contact" },
] as const;

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, LevelFormat, TableOfContents,
  Bookmark, ExternalHyperlink, PageBreak, ImageRun
} = require('docx');
const fs = require('fs');
const path = require('path');

// ── image helper — 9360 DXA wide, proportional height ────────────────────────
const screenshotImg = (filename) => {
  const imgPath = path.join(__dirname, filename);
  const data = fs.readFileSync(imgPath);
  // source viewport is 1440×860 — scale to 9 inches wide (9360 DXA → 648 pt → ~9 in)
  const W = 648, H = Math.round(W * 860 / 1440);
  return new Paragraph({
    spacing: { before: 160, after: 240 },
    children: [new ImageRun({
      type: "png",
      data,
      transformation: { width: W, height: H },
      altText: { title: filename, description: filename, name: filename },
    })],
  });
};

// ── colours & helpers ─────────────────────────────────────────────────────────
const BRAND   = "5C33F6";   // NovaInvest purple
const LIGHT   = "EEF0FF";   // pale purple bg
const DARK    = "1A1A2E";   // near-black header
const GREY    = "64748B";   // muted text
const GREEN   = "16A34A";   // positive green
const RED     = "DC2626";   // loss red
const BORDER  = "E2E8F0";   // table border
const ORANGE  = "D97706";   // amber/orange
const TEAL    = "0F766E";   // teal

const cell = (text, w, opts = {}) => new TableCell({
  width: { size: w, type: WidthType.DXA },
  borders: {
    top:    { style: BorderStyle.SINGLE, size: 1, color: BORDER },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER },
    left:   { style: BorderStyle.SINGLE, size: 1, color: BORDER },
    right:  { style: BorderStyle.SINGLE, size: 1, color: BORDER },
  },
  margins: { top: 100, bottom: 100, left: 140, right: 140 },
  shading: opts.shade ? { fill: opts.shade, type: ShadingType.CLEAR } : undefined,
  verticalAlign: VerticalAlign.CENTER,
  children: [new Paragraph({
    alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
    children: [new TextRun({
      text,
      bold: !!opts.bold,
      color: opts.color || DARK,
      size: opts.size || 20,
      font: "Arial",
    })],
  })],
});

const hCell = (text, w) => cell(text, w, { shade: BRAND, bold: true, color: "FFFFFF", size: 20, center: true });

const p = (text, opts = {}) => new Paragraph({
  spacing: { before: opts.before ?? 80, after: opts.after ?? 80 },
  alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
  children: [new TextRun({
    text,
    bold: opts.bold,
    italics: opts.italic,
    color: opts.color || DARK,
    size: opts.size || 22,
    font: "Arial",
  })],
});

const gap = (n = 120) => new Paragraph({ spacing: { before: n, after: 0 }, children: [] });

const rule = () => new Paragraph({
  border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BRAND, space: 1 } },
  spacing: { before: 0, after: 200 },
  children: [],
});

const sectionTitle = (text) => [
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 80 },
    children: [new TextRun({ text, bold: true, color: BRAND, size: 36, font: "Arial" })],
  }),
  rule(),
];

const subTitle = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 200, after: 80 },
  children: [new TextRun({ text, bold: true, color: DARK, size: 26, font: "Arial" })],
});

const bullet = (text, ref) => new Paragraph({
  numbering: { reference: ref, level: 0 },
  spacing: { before: 60, after: 60 },
  children: [new TextRun({ text, size: 22, font: "Arial", color: DARK })],
});

// ── Key-Value info box (table) ────────────────────────────────────────────────
const infoBox = (rows) => new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [3200, 6160],
  rows: rows.map(([label, value, valueColor]) => new TableRow({
    children: [
      cell(label, 3200, { shade: LIGHT, bold: true, color: GREY, size: 20 }),
      cell(value, 6160, { color: valueColor || DARK, size: 20 }),
    ],
  })),
});

// ── Callout box (highlighted paragraph) ──────────────────────────────────────
const callout = (text) => new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [9360],
  rows: [new TableRow({
    children: [new TableCell({
      width: { size: 9360, type: WidthType.DXA },
      shading: { fill: LIGHT, type: ShadingType.CLEAR },
      borders: {
        top:    { style: BorderStyle.SINGLE, size: 1, color: BRAND },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: BRAND },
        left:   { style: BorderStyle.THICK,  size: 12, color: BRAND },
        right:  { style: BorderStyle.SINGLE, size: 1, color: BRAND },
      },
      margins: { top: 120, bottom: 120, left: 200, right: 200 },
      children: [new Paragraph({
        children: [new TextRun({ text, size: 22, font: "Arial", italics: true, color: DARK })],
      })],
    })],
  })],
});

// ── Cover page ────────────────────────────────────────────────────────────────
const coverChildren = [
  gap(2000),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 200 },
    children: [new TextRun({ text: "NOVAINVEST", bold: true, color: BRAND, size: 72, font: "Arial" })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 600 },
    children: [new TextRun({ text: "Portfolio Dashboard", bold: false, color: GREY, size: 40, font: "Arial" })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    border: { top: { style: BorderStyle.SINGLE, size: 4, color: BRAND }, bottom: { style: BorderStyle.SINGLE, size: 4, color: BRAND } },
    spacing: { before: 200, after: 200 },
    children: [new TextRun({ text: "Client Application Guide", bold: true, color: DARK, size: 32, font: "Arial" })],
  }),
  gap(600),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 100 },
    children: [new TextRun({ text: "Prepared for:", color: GREY, size: 22, font: "Arial" })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 100 },
    children: [new TextRun({ text: "Valued Client", bold: true, color: DARK, size: 26, font: "Arial" })],
  }),
  gap(400),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 60 },
    children: [new TextRun({ text: "Date: June 18, 2026", color: GREY, size: 20, font: "Arial" })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 60 },
    children: [new TextRun({ text: "Version: 1.0", color: GREY, size: 20, font: "Arial" })],
  }),
  new Paragraph({ children: [new PageBreak()] }),
];

// ── TOC ───────────────────────────────────────────────────────────────────────
const tocChildren = [
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text: "Table of Contents", bold: true, color: BRAND, size: 36, font: "Arial" })],
  }),
  rule(),
  new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-2" }),
  new Paragraph({ children: [new PageBreak()] }),
];

// ── Section 1: How to Run ─────────────────────────────────────────────────────
const howToRunChildren = [
  ...sectionTitle("1. How to Run the Application"),
  gap(),

  subTitle("Prerequisites"),
  infoBox([
    ["Docker Desktop", "Version 24+ — must be running before you start"],
    ["Port 80",        "Must be free on your machine (the app binds to port 80)"],
    ["Port 3000",      "Used by the NestJS API (also exposed for direct API access)"],
    ["Git",            "To clone the repository (or unzip the project folder)"],
  ]),
  gap(200),

  subTitle("Option A — Production Mode (Recommended)"),
  p("Everything runs inside a single Docker container — Nginx, NestJS, MongoDB, and Redis are all managed automatically.", { color: DARK }),
  gap(80),
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [720, 8640],
    rows: [
      new TableRow({ children: [
        cell("1", 720, { shade: BRAND, bold: true, color: "FFFFFF", center: true }),
        cell("Open a terminal and navigate to the project folder", 8640),
      ]}),
      new TableRow({ children: [
        cell("2", 720, { shade: BRAND, bold: true, color: "FFFFFF", center: true }),
        cell("Run:  docker compose up --build", 8640, { bold: true }),
      ]}),
      new TableRow({ children: [
        cell("3", 720, { shade: BRAND, bold: true, color: "FFFFFF", center: true }),
        cell("Wait for all services to start (first build takes ~2-3 minutes; subsequent starts are instant)", 8640),
      ]}),
      new TableRow({ children: [
        cell("4", 720, { shade: BRAND, bold: true, color: "FFFFFF", center: true }),
        cell("Open your browser and go to:  http://localhost", 8640, { bold: true }),
      ]}),
    ],
  }),
  gap(200),

  subTitle("URLs & Ports"),
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [3600, 2880, 2880],
    rows: [
      new TableRow({ children: [ hCell("Service", 3600), hCell("URL", 2880), hCell("Port", 2880) ] }),
      new TableRow({ children: [
        cell("Frontend (Angular SPA)", 3600, { bold: true }),
        cell("http://localhost",       2880, { color: BRAND }),
        cell("80",                    2880, { bold: true }),
      ]}),
      new TableRow({ children: [
        cell("Backend API (NestJS)",   3600, { bold: true }),
        cell("http://localhost/api/",  2880, { color: BRAND }),
        cell("80 → proxied to 3000",  2880),
      ]}),
      new TableRow({ children: [
        cell("API — direct access",   3600),
        cell("http://localhost:3000", 2880, { color: GREY }),
        cell("3000",                  2880, { color: GREY }),
      ]}),
      new TableRow({ children: [
        cell("MongoDB (internal)",    3600, { color: GREY }),
        cell("127.0.0.1:27017",       2880, { color: GREY }),
        cell("27017 (container only)",2880, { color: GREY }),
      ]}),
      new TableRow({ children: [
        cell("Redis (internal)",      3600, { color: GREY }),
        cell("127.0.0.1:6379",        2880, { color: GREY }),
        cell("6379 (container only)", 2880, { color: GREY }),
      ]}),
    ],
  }),
  gap(200),

  subTitle("Background / Detached Mode"),
  callout("To run the app in the background (so the terminal stays free), use:  docker compose up -d --build\n\nTo stop it later:  docker compose down"),
  gap(200),

  subTitle("Option B — Local Development Mode (No Docker for app code)"),
  p("Runs MongoDB and Redis in Docker, but the backend and frontend are started locally with hot-reload. Use this when actively developing.", { color: DARK }),
  gap(80),
  infoBox([
    ["Step 1 — Start databases", "docker compose -f docker-compose.dev.yml up -d"],
    ["Step 2 — Start backend",   "cd backend  →  npm install  →  npm run start:dev  →  http://localhost:3000"],
    ["Step 3 — Start frontend",  "cd frontend  →  npm install  →  npm start  →  http://localhost:4200"],
    ["Step 4 — Run unit tests",  "cd frontend  →  npm run test  (runs all 33 unit tests with Vitest)"],
  ]),
  gap(200),

  subTitle("What's Inside the Single Container"),
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2340, 7020],
    rows: [
      new TableRow({ children: [ hCell("Process", 2340), hCell("Role", 7020) ] }),
      new TableRow({ children: [
        cell("Nginx :80",           2340, { bold: true, color: TEAL }),
        cell("Serves the Angular SPA for / and reverse-proxies /api/ requests to NestJS on port 3000", 7020),
      ]}),
      new TableRow({ children: [
        cell("NestJS :3000",        2340, { bold: true, color: GREEN }),
        cell("REST API — handles authentication, portfolio CRUD, and chart data computation", 7020),
      ]}),
      new TableRow({ children: [
        cell("MongoDB :27017",      2340, { bold: true, color: ORANGE }),
        cell("Persistent database — data survives container restarts via the mongo-data Docker volume", 7020),
      ]}),
      new TableRow({ children: [
        cell("Redis :6379",         2340, { bold: true, color: "DC2626" }),
        cell("Cache layer — stores computed chart data to avoid redundant database queries", 7020),
      ]}),
      new TableRow({ children: [
        cell("Supervisord",         2340, { bold: true, color: GREY }),
        cell("Process manager — starts MongoDB first, then Redis, then NestJS (with auto-retry), then Nginx", 7020),
      ]}),
    ],
  }),
  gap(200),

  subTitle("Environment Variables (Optional)"),
  p("The app ships with safe default values for evaluation. For production deployments, override these before running:", { color: DARK }),
  gap(80),
  infoBox([
    ["JWT_SECRET",         "Secret key used to sign access tokens  (default: change_me_in_production)"],
    ["JWT_REFRESH_SECRET", "Secret key used to sign refresh tokens  (default: change_me_refresh_in_production)"],
  ]),
  gap(80),
  p("Either set them inline:  JWT_SECRET=mysecret JWT_REFRESH_SECRET=myrefresh docker compose up --build", { italic: true, color: GREY, size: 20 }),
  p("Or create a .env file in the project root with the two keys above.", { italic: true, color: GREY, size: 20 }),
  gap(200),

  subTitle("Rate Limiting"),
  callout("The API allows a maximum of 200 requests per minute per client. If the limit is exceeded, the server returns HTTP 429 Too Many Requests and the frontend displays a friendly toast message asking the user to wait."),

  new Paragraph({ children: [new PageBreak()] }),
];

const loginChildren = [
  ...sectionTitle("2. Login Page"),
  p("URL: localhost/login", { italic: true, color: GREY, size: 20 }),
  screenshotImg("screenshot-login.png"),

  subTitle("Overview"),
  p("The Login Page is the secure entry point to the NovaInvest Portfolio Dashboard. It presents a clean, minimal authentication form under the NovaInvest brand identity, giving users a professional and trustworthy first impression."),
  gap(),

  subTitle("Page Components"),
  infoBox([
    ["Brand Logo",       "Purple lightning bolt icon with the NovaInvest wordmark in brand purple"],
    ["Tagline",          "\"Sign in to access your portfolio dashboard\""],
    ["Email Field",      "Text input labelled EMAIL ADDRESS — accepts user email credentials"],
    ["Password Field",   "Masked text input labelled PASSWORD — hides characters for security"],
    ["Sign In Button",   "Full-width purple CTA button that authenticates the user"],
    ["Register Link",    "\"Don't have an account? Register here\" — navigates to registration"],
  ]),
  gap(200),

  subTitle("Security Features"),
  bullet("Password field masks all characters by default", "bullets"),
  bullet("JWT token-based authentication with automatic refresh policy", "bullets"),
  bullet("Session tokens are never exposed in the URL", "bullets"),
  bullet("Redirects unauthenticated users back to this page automatically", "bullets"),
  gap(200),

  subTitle("Test Credentials"),
  callout("Email: a@gmail.com     |     Password: 12341234"),
  gap(200),

  subTitle("User Flow"),
  p("Enter email address → Enter password → Click Sign In → Redirected to Portfolio Overview dashboard.", { italic: true }),

  new Paragraph({ children: [new PageBreak()] }),
];

// ── Page 2: Portfolio Overview ────────────────────────────────────────────────
const overviewChildren = [
  ...sectionTitle("3. Portfolio Overview"),
  p("URL: localhost/dashboard/home-portfolio", { italic: true, color: GREY, size: 20 }),
  screenshotImg("screenshot-overview.png"),

  subTitle("Overview"),
  p("The Portfolio Overview is the main dashboard home screen. It provides a real-time snapshot of the user's entire investment portfolio — total value, cost basis, and returns — alongside visual charts for allocation breakdown and historical performance."),
  gap(),

  subTitle("Key Metric Cards"),
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [3120, 3120, 3120],
    rows: [
      new TableRow({ children: [
        hCell("TOTAL VALUE",  3120),
        hCell("TOTAL COST",   3120),
        hCell("TOTAL RETURN", 3120),
      ]}),
      new TableRow({ children: [
        cell("$3,384,136.00",  3120, { bold: true, color: DARK,   size: 24, center: true }),
        cell("$3,391,112.97",  3120, { bold: true, color: DARK,   size: 24, center: true }),
        cell("-$6,976.97",     3120, { bold: true, color: RED,    size: 24, center: true }),
      ]}),
      new TableRow({ children: [
        cell("Active portfolio value", 3120, { color: GREY, size: 18, center: true }),
        cell("Total invested capital",  3120, { color: GREY, size: 18, center: true }),
        cell("-0.21% return",           3120, { color: RED,  size: 18, center: true }),
      ]}),
    ],
  }),
  gap(200),

  subTitle("Charts & Visualisations"),
  infoBox([
    ["Allocation Chart",      "Donut chart displaying portfolio split by asset class: BOND, STOCK, MUTUAL_FUND"],
    ["Portfolio Value Chart", "Line chart plotting Portfolio Value vs Total Cost over time (Jun 17 date range)"],
  ]),
  gap(200),

  subTitle("Seeding Sample Data — Seed 50 Assets"),
  callout("To populate the dashboard with realistic test data, click the '⚡ Seed 50 Assets' button in the top-right corner of the Portfolio Overview page. This instantly creates 50 diversified assets (stocks, bonds, and mutual funds) with randomised quantities and pricing, so every chart and table fills with live-looking data immediately. Ideal for demonstrations and first-time setup."),
  gap(200),

  subTitle("Sidebar Navigation"),
  bullet("Overview (current — highlighted in purple)", "bullets"),
  bullet("My Assets — manage individual holdings", "bullets"),
  bullet("Transactions — view buy/sell history", "bullets"),
  bullet("Profile — account settings", "bullets"),
  bullet("Test Runner — internal QA tool", "bullets"),
  bullet("Flow Diagram — architecture view", "bullets"),
  bullet("Logout — ends the user session", "bullets"),

  new Paragraph({ children: [new PageBreak()] }),
];

// ── Page 3: Asset Management ──────────────────────────────────────────────────
const assetsChildren = [
  ...sectionTitle("4. Asset Management"),
  p("URL: localhost/dashboard/assets", { italic: true, color: GREY, size: 20 }),
  screenshotImg("screenshot-assets.png"),

  subTitle("Overview"),
  p("The Asset Management page allows users to view, search, add, edit, and delete individual investment holdings. Each asset card displays its symbol, type, quantity, average cost, current price, total value, and percentage return."),
  gap(),

  subTitle("Page Controls"),
  infoBox([
    ["Search Bar",      "Full-width search to filter assets by name or ticker symbol"],
    ["Filter Dropdown", "\"All Assets\" dropdown to filter by asset class (BOND, STOCK, MUTUAL_FUND)"],
    ["+ Add Asset",     "Purple button in the top-right to add a new investment holding"],
    ["Edit Icon",       "Pencil icon on each card — opens an edit form for that asset"],
    ["Delete Icon",     "Trash icon on each card — removes the asset after confirmation"],
  ]),
  gap(200),

  subTitle("Sample Assets Visible"),
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2200, 1600, 1400, 1380, 1380, 1400],
    rows: [
      new TableRow({ children: [
        hCell("Symbol",   2200), hCell("Type",     1600), hCell("Qty",   1400),
        hCell("Avg Cost", 1380), hCell("Current",  1380), hCell("Return",1400),
      ]}),
      new TableRow({ children: [
        cell("US10Y-215", 2200), cell("BOND",   1600, { color: GREEN }),
        cell("16.3282",   1400), cell("$177.10",1380), cell("$188.90",1380),
        cell("+6.66%",    1400, { color: GREEN }),
      ]}),
      new TableRow({ children: [
        cell("META-399",  2200), cell("STOCK",  1600, { color: BRAND }),
        cell("64.4183",   1400), cell("$186.39",1380), cell("$179.17",1380),
        cell("-3.87%",    1400, { color: RED }),
      ]}),
      new TableRow({ children: [
        cell("NVDA-571",  2200), cell("STOCK",  1600, { color: BRAND }),
        cell("37.7672",   1400), cell("$354.82",1380), cell("$324.31",1380),
        cell("-8.60%",    1400, { color: RED }),
      ]}),
      new TableRow({ children: [
        cell("LLY-580",   2200), cell("STOCK",  1600, { color: BRAND }),
        cell("71.7504",   1400), cell("$229.20",1380), cell("$201.33",1380),
        cell("(below)",   1400, { color: GREY }),
      ]}),
    ],
  }),
  gap(200),

  subTitle("Asset Card Layout"),
  p("Each card shows: Symbol + Type badge at top | Quantity, Avg Cost, Current price in the body | Total Value (bold) + colour-coded return % at the bottom."),

  new Paragraph({ children: [new PageBreak()] }),
];

// ── Page 4: Transactions ──────────────────────────────────────────────────────
const txChildren = [
  ...sectionTitle("5. Transaction Activity"),
  p("URL: localhost/dashboard/transactions", { italic: true, color: GREY, size: 20 }),
  screenshotImg("screenshot-transactions.png"),

  subTitle("Overview"),
  p("The Transaction Activity page provides a complete, chronological ledger of every buy, sell, and update event in the portfolio. Users can choose between two view modes and see a detailed breakdown per trade."),
  gap(),

  subTitle("View Modes"),
  infoBox([
    ["Infinite Scroll", "Transactions load continuously as the user scrolls down the page (selected by default)"],
    ["Paginated",        "Transactions are split into pages for easier navigation"],
  ]),
  gap(200),

  subTitle("Transaction Table Columns"),
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2340, 2340, 1560, 1560, 1560],
    rows: [
      new TableRow({ children: [
        hCell("DATE",   2340), hCell("ASSET", 2340), hCell("TYPE", 1560),
        hCell("QTY",    1560), hCell("PRICE", 1560),
      ]}),
      new TableRow({ children: [
        cell("Jun 18, 2026, 1:26 AM", 2340), cell("US10Y-215 / US Treasury 10Y Bond #215", 2340),
        cell("BUY", 1560, { color: GREEN, bold: true }), cell("16.3282", 1560), cell("$177.10", 1560),
      ]}),
      new TableRow({ children: [
        cell("Jun 18, 2026, 1:26 AM", 2340), cell("META-399 / Meta Platforms Inc. #399", 2340),
        cell("BUY", 1560, { color: GREEN, bold: true }), cell("64.4183", 1560), cell("$186.39", 1560),
      ]}),
      new TableRow({ children: [
        cell("Jun 18, 2026, 1:26 AM", 2340), cell("NVDA-571 / NVIDIA Corporation #571", 2340),
        cell("BUY", 1560, { color: GREEN, bold: true }), cell("37.7672", 1560), cell("$354.82", 1560),
      ]}),
      new TableRow({ children: [
        cell("Jun 18, 2026, 1:26 AM", 2340), cell("LLY-580 / Eli Lilly & Co. #580", 2340),
        cell("BUY", 1560, { color: GREEN, bold: true }), cell("71.7504", 1560), cell("$229.20", 1560),
      ]}),
    ],
  }),
  gap(200),

  subTitle("Key Features"),
  bullet("Every portfolio transaction is recorded automatically on asset creation or update", "bullets"),
  bullet("BUY type is shown with a green badge for clear visual identification", "bullets"),
  bullet("TOTAL column shows the gross value of each trade (qty × price)", "bullets"),
  bullet("Timestamp precision to the minute for full audit trail", "bullets"),

  new Paragraph({ children: [new PageBreak()] }),
];

// ── Page 5: User Profile ──────────────────────────────────────────────────────
const profileChildren = [
  ...sectionTitle("6. User Profile"),
  p("URL: localhost/dashboard/profile", { italic: true, color: GREY, size: 20 }),
  screenshotImg("screenshot-profile.png"),

  subTitle("Overview"),
  p("The User Profile page displays the authenticated user's account details, subscription tier, security status, and active security policy. It is a read-only summary of the account configuration."),
  gap(),

  subTitle("Profile Information"),
  infoBox([
    ["Email Address",    "a@gmail.com"],
    ["Account Tier",     "NovaInvest Premium",    BRAND],
    ["User ID",          "6a32f9d09f7bd3404d56dc24 (MongoDB ObjectId)"],
    ["Account Status",   "Active & Secure",        GREEN],
    ["Security Policy",  "Automatic Token Auto-Refresh"],
  ]),
  gap(200),

  subTitle("Account Tier — NovaInvest Premium"),
  callout("The Premium tier unlocks full portfolio features including unlimited asset tracking, real-time pricing, transaction history, and advanced analytics. The badge is displayed prominently under the user avatar."),
  gap(200),

  subTitle("Security Policy — Automatic Token Auto-Refresh"),
  bullet("JWT access tokens are refreshed automatically in the background", "bullets"),
  bullet("Users are never interrupted with forced re-login during an active session", "bullets"),
  bullet("Refresh tokens are rotated on each use to prevent replay attacks", "bullets"),
  bullet("All authentication state is stored server-side with no sensitive data in local storage", "bullets"),
];

// ── Page 6: Test Runner ───────────────────────────────────────────────────────
const testChildren = [
  ...sectionTitle("7. System Test Runner"),
  p("URL: localhost/dashboard/tests", { italic: true, color: GREY, size: 20 }),
  screenshotImg("screenshot-tests.png"),

  subTitle("Overview"),
  p("The System Test Runner is a built-in quality-assurance dashboard that lets you execute and inspect every automated test in the application — directly from the browser. It covers three layers of testing: Frontend Unit, Backend Unit, and Backend E2E, with 73 test cases across 15 spec files."),
  gap(),

  subTitle("Test Suite Summary"),
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [3120, 2080, 2080, 2080],
    rows: [
      new TableRow({ children: [ hCell("Layer", 3120), hCell("Suites", 2080), hCell("Cases", 2080), hCell("Colour", 2080) ] }),
      new TableRow({ children: [
        cell("Frontend Unit", 3120, { bold: true, color: BRAND }),
        cell("8 suites", 2080), cell("18 cases", 2080),
        cell("Purple", 2080, { color: BRAND }),
      ]}),
      new TableRow({ children: [
        cell("Backend Unit",  3120, { bold: true, color: "2563EB" }),
        cell("5 suites", 2080), cell("33 cases", 2080),
        cell("Blue", 2080, { color: "2563EB" }),
      ]}),
      new TableRow({ children: [
        cell("Backend E2E",   3120, { bold: true, color: ORANGE }),
        cell("2 suites", 2080), cell("11 cases", 2080),
        cell("Amber", 2080, { color: ORANGE }),
      ]}),
      new TableRow({ children: [
        cell("TOTAL", 3120, { bold: true }),
        cell("15 spec files", 2080, { bold: true }), cell("73 cases", 2080, { bold: true }),
        cell("", 2080),
      ]}),
    ],
  }),
  gap(200),

  subTitle("Running Tests"),
  infoBox([
    ["Run All Tests",    "Click the '▶ Run All Tests' button (top-right) to execute all 73 cases in one go"],
    ["Run Single Test",  "Expand any test suite card and click the checkbox next to an individual case to run it alone"],
    ["Live Progress",    "A progress bar and PASSED / FAILED counters update in real time as tests execute"],
    ["Overall Progress", "Percentage indicator shows how many of the 73 tests have completed"],
  ]),
  gap(200),

  subTitle("Test Case Tabs — Per Test Detail"),
  p("Each individual test case expands to reveal four tabs:"),
  gap(80),
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2340, 7020],
    rows: [
      new TableRow({ children: [ hCell("Tab", 2340), hCell("What it shows", 7020) ] }),
      new TableRow({ children: [
        cell("Overview",   2340, { bold: true }),
        cell("High-level description of the test — what it checks and the expected outcome", 7020),
      ]}),
      new TableRow({ children: [
        cell("Fixtures",   2340, { bold: true }),
        cell("Test data and mock objects used to set up the test environment before the assertion runs", 7020),
      ]}),
      new TableRow({ children: [
        cell("Test Code",  2340, { bold: true }),
        cell("The actual assertion snippet (Arrange → Act → Assert pattern) shown with syntax highlighting", 7020),
      ]}),
      new TableRow({ children: [
        cell("Live Logs",  2340, { bold: true }),
        cell("Real-time console output streamed while the test is executing — useful for debugging failures", 7020),
      ]}),
    ],
  }),
  gap(200),

  subTitle("Test Result Badges"),
  bullet("POSITIVE — test cases expected to pass (green badge)", "bullets"),
  bullet("NEGATIVE — test cases that validate error/rejection scenarios (red badge)", "bullets"),
  bullet("Each suite card shows a count of positive and negative cases at a glance", "bullets"),
  gap(200),

  subTitle("E2E Test Suites"),
  infoBox([
    ["Auth Endpoints E2E Flow",       "5 cases — register, login, token validation, 409 conflict, 401 unauthorised"],
    ["Portfolios Endpoints E2E Flow",  "6 cases — add asset, fetch portfolio, filter by type, and more"],
    ["In-Memory MongoDB",              "Supertest + NestJS full stack — no external database required for E2E"],
  ]),

  new Paragraph({ children: [new PageBreak()] }),
];

// ── Page 7: Flow Diagram ──────────────────────────────────────────────────────
const flowChildren = [
  ...sectionTitle("8. Flow Diagram"),
  p("URL: localhost/dashboard/flow-diagram", { italic: true, color: GREY, size: 20 }),
  screenshotImg("screenshot-flow-diagram.png"),

  subTitle("Overview"),
  p("The Flow Diagram page is an interactive architecture visualiser. It maps every component in the system across five layers and lets you highlight exactly how data travels during three key user flows: Login, Portfolio Fetch, and Add Asset."),
  gap(),

  subTitle("Architecture Layers"),
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2340, 7020],
    rows: [
      new TableRow({ children: [ hCell("Layer", 2340), hCell("Components & Responsibilities", 7020) ] }),
      new TableRow({ children: [
        cell("Browser",      2340, { bold: true, color: "0F766E" }),
        cell("Angular 18 SPA served by Nginx — the user-facing interface", 7020),
      ]}),
      new TableRow({ children: [
        cell("Angular App",  2340, { bold: true, color: BRAND }),
        cell("Components, Route Guards (AuthGuard / NoAuthGuard), Services, HTTP Interceptors", 7020),
      ]}),
      new TableRow({ children: [
        cell("HTTP / REST",  2340, { bold: true, color: "2563EB" }),
        cell("JSON over HTTPS with JWT Bearer authentication — connects frontend to backend", 7020),
      ]}),
      new TableRow({ children: [
        cell("NestJS API",   2340, { bold: true, color: GREEN }),
        cell("Controllers → Services → Repositories pattern; JwtAuthGuard, JwtStrategy", 7020),
      ]}),
      new TableRow({ children: [
        cell("Data Layer",   2340, { bold: true, color: ORANGE }),
        cell("MongoDB (persistent storage) + Redis (cache layer for chart data)", 7020),
      ]}),
    ],
  }),
  gap(200),

  subTitle("Highlighted Flows"),
  infoBox([
    ["Login Flow",          "Browser → AuthGuard → Login/Register page → AuthService → AuthController → UsersService → MongoDB"],
    ["Portfolio Fetch",     "Browser → AuthGuard → Portfolio Page → PortfolioService (HTTP client + JWT Interceptor) → PortfoliosController → PortfoliosService → MongoDB + Redis cache"],
    ["Add Asset",           "Browser → Assets Page → PortfolioService → PortfoliosController → PortfoliosService → MongoDB"],
  ]),
  gap(200),

  subTitle("How to Use the Flow Diagram"),
  bullet("Click 'Login Flow', 'Portfolio Fetch', or 'Add Asset' at the top to highlight the relevant path", "bullets"),
  bullet("Active components appear in full colour; inactive ones are greyed out", "bullets"),
  bullet("The description bar below the tabs narrates the exact data journey in plain English", "bullets"),
  bullet("Arrows between nodes show direction of calls — dashed arrows indicate async / cache paths", "bullets"),
  gap(200),

  subTitle("Portfolio Fetch — Detailed Flow"),
  callout("Dashboard loads → PortfolioService sends GET /api/portfolios with JWT → JwtAuthGuard validates token → PortfoliosService queries MongoDB for assets and computes summary → Redis cache serves chart data if available."),

  new Paragraph({ children: [new PageBreak()] }),
];

// ── Summary page ──────────────────────────────────────────────────────────────
const summaryChildren = [
  new Paragraph({ children: [new PageBreak()] }),
  ...sectionTitle("9. Summary"),
  gap(),
  p("NovaInvest is a full-stack investment portfolio dashboard built for individuals who want a professional, real-time view of their assets. All seven screens work together to provide a seamless experience:"),
  gap(140),
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2600, 6760],
    rows: [
      new TableRow({ children: [ hCell("Screen", 2600), hCell("Purpose", 6760) ] }),
      new TableRow({ children: [ cell("1. How to Run",          2600, { bold: true }), cell("Docker setup, ports, env vars, dev mode, and rate limiting", 6760) ] }),
      new TableRow({ children: [ cell("2. Login",               2600, { bold: true }), cell("Secure JWT authentication gateway", 6760) ] }),
      new TableRow({ children: [ cell("3. Portfolio Overview",  2600, { bold: true }), cell("Real-time portfolio value, cost, return + charts. Use 'Seed 50 Assets' to populate with sample data.", 6760) ] }),
      new TableRow({ children: [ cell("4. Asset Management",    2600, { bold: true }), cell("CRUD operations on individual investment holdings", 6760) ] }),
      new TableRow({ children: [ cell("5. Transactions",        2600, { bold: true }), cell("Full audit trail of all buy/sell/update events", 6760) ] }),
      new TableRow({ children: [ cell("6. User Profile",        2600, { bold: true }), cell("Account details, Premium tier, and security policy", 6760) ] }),
      new TableRow({ children: [ cell("7. Test Runner",         2600, { bold: true }), cell("73 automated tests across 3 layers — run all or one-by-one with live logs", 6760) ] }),
      new TableRow({ children: [ cell("8. Flow Diagram",        2600, { bold: true }), cell("Interactive architecture map showing Login, Portfolio Fetch, and Add Asset flows", 6760) ] }),
    ],
  }),
  gap(240),
  callout("The application is containerised with Docker and runs entirely on localhost — no cloud dependency required for evaluation. To start the app: docker compose up -d"),
  gap(240),
  p("For further questions or a live demo, please contact the development team.", { color: GREY, italic: true }),
];

// ── Document assembly ─────────────────────────────────────────────────────────
const doc = new Document({
  numbering: {
    config: [{
      reference: "bullets",
      levels: [{
        level: 0, format: LevelFormat.BULLET, text: "•",
        alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } },
      }],
    }],
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run:       { size: 36, bold: true, font: "Arial", color: BRAND },
        paragraph: { spacing: { before: 360, after: 120 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run:       { size: 26, bold: true, font: "Arial", color: DARK },
        paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 1 } },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BRAND, space: 1 } },
          spacing: { before: 0, after: 160 },
          children: [
            new TextRun({ text: "NovaInvest Portfolio Dashboard", bold: true, color: BRAND, size: 18, font: "Arial" }),
            new TextRun({ text: "\t\tClient Application Guide", color: GREY, size: 18, font: "Arial" }),
          ],
          tabStops: [{ type: "right", position: 9360 }],
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: BORDER, space: 1 } },
          spacing: { before: 160, after: 0 },
          children: [
            new TextRun({ text: "Confidential — For Client Use Only", color: GREY, size: 16, font: "Arial" }),
            new TextRun({ text: "\t\tPage ", color: GREY, size: 16, font: "Arial" }),
            new TextRun({ children: [PageNumber.CURRENT], color: GREY, size: 16, font: "Arial" }),
          ],
          tabStops: [{ type: "right", position: 9360 }],
        })],
      }),
    },
    children: [
      ...coverChildren,
      ...tocChildren,
      ...howToRunChildren,
      ...loginChildren,
      ...overviewChildren,
      ...assetsChildren,
      ...txChildren,
      ...profileChildren,
      ...testChildren,
      ...flowChildren,
      ...summaryChildren,
    ],
  }],
});

Packer.toBuffer(doc).then(buf => {
  const out = path.join(__dirname, "NovaInvest_Dashboard_Client_Guide_v4.docx");
  fs.writeFileSync(out, buf);
  console.log("Created:", out);
});

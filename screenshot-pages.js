const puppeteer = require('puppeteer');
const path = require('path');

const BASE = 'http://localhost';
const EMAIL = 'a@gmail.com';
const PASS  = '12341234';

const PAGES = [
  { name: 'login',        url: `${BASE}/login`,                        needsAuth: false },
  { name: 'overview',     url: `${BASE}/dashboard/home-portfolio`,     needsAuth: true  },
  { name: 'assets',       url: `${BASE}/dashboard/assets`,             needsAuth: true  },
  { name: 'transactions', url: `${BASE}/dashboard/transactions`,       needsAuth: true  },
  { name: 'profile',      url: `${BASE}/dashboard/profile`,            needsAuth: true  },
];

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1440, height: 860 },
  });

  const page = await browser.newPage();

  // ── Take login screenshot first ──────────────────────────────────────────
  console.log('Navigating to login...');
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
  await page.waitForSelector('input[type="email"], input[placeholder*="mail"], input[type="text"]', { timeout: 10000 }).catch(() => {});
  const loginPath = path.join(__dirname, 'screenshot-login.png');
  await page.screenshot({ path: loginPath, fullPage: false });
  console.log('Saved:', loginPath);

  // ── Log in ───────────────────────────────────────────────────────────────
  console.log('Logging in...');
  // fill email
  const emailInput = await page.$('input[type="email"]') ||
                     await page.$('input[placeholder*="mail"]') ||
                     await page.$('input[type="text"]');
  await emailInput.click({ clickCount: 3 });
  await emailInput.type(EMAIL);

  // fill password
  const passInput = await page.$('input[type="password"]');
  await passInput.click({ clickCount: 3 });
  await passInput.type(PASS);

  // submit
  const btn = await page.$('button[type="submit"]') || await page.$('button');
  await btn.click();
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 1500));
  console.log('Logged in. Current URL:', page.url());

  // ── Screenshot each authenticated page ───────────────────────────────────
  const EXTRA = [
    { name: 'tests',       url: `${BASE}/dashboard/tests` },
    { name: 'flow-diagram',url: `${BASE}/dashboard/flow-diagram` },
  ];

  for (const pg of [...PAGES.filter(p => p.needsAuth), ...EXTRA]) {
    console.log(`Navigating to ${pg.url}...`);
    await page.goto(pg.url, { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1500)); // let charts render
    const out = path.join(__dirname, `screenshot-${pg.name}.png`);
    await page.screenshot({ path: out, fullPage: false });
    console.log('Saved:', out);
  }

  await browser.close();
  console.log('All screenshots done.');
})();

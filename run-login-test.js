const { chromium } = require('playwright');
async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/admin/login');
  await page.waitForSelector('#login-email');
  await page.fill('#login-email', 'admin@novastore.com');
  await page.fill('#login-password', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/admin', { timeout: 10000 });
  console.log("LOGIN SUCCESS: ", page.url());
  await browser.close();
}
test().catch(e => { console.error(e); process.exit(1); });

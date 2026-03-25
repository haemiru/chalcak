const puppeteer = require('puppeteer');
const path = require('path');

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 393, height: 852, deviceScaleFactor: 2 });

  const htmlPath = path.join(__dirname, 'mock-generate.html');
  await page.goto(`file:///${htmlPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 2000));

  const outPath = path.join(__dirname, '..', 'instagram-posts', 'screenshots', '05-generate.png');
  await page.screenshot({ path: outPath, type: 'png' });
  console.log(`✅ Saved: ${outPath}`);

  await browser.close();
}

main().catch(console.error);

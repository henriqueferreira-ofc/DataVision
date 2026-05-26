const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:8081', { waitUntil: 'networkidle' });
  const html = await page.innerHTML('#root');
  console.log('ROOT HTML:', html);
  await browser.close();
})();

const http = require('http'), fs = require('fs'), path = require('path');
const { chromium, devices } = require('playwright');
const ROOT = path.resolve(process.argv[2] || 'dist'), OUT = path.resolve(process.argv[3] || 'e2e-shots');
fs.mkdirSync(OUT, { recursive: true });
const types = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.ico': 'image/x-icon', '.png': 'image/png', '.ttf': 'font/ttf' };
const server = http.createServer((req, res) => {
  let p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) p = path.join(ROOT, 'index.html');
  res.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
}).listen(8765);

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...devices['Pixel 7'] });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => m.type() === 'error' && errors.push(m.text()));
  page.on('dialog', d => d.accept());
  const shot = n => page.screenshot({ path: `${OUT}/${n}.png` });
  const step = async (name, fn) => { try { await fn(); console.log('ok  ', name); } catch (e) { console.log('FAIL', name, e.message.split('\n')[0]); await shot('fail-' + name.replace(/\W+/g, '_')); throw e; } };

  try {
    await page.goto('http://localhost:8765/');
    await step('welcome', async () => { await page.getByText('Boshlash').waitFor(); await shot('01-welcome'); await page.getByText('Boshlash').click(); });
    await step('login', async () => {
      await page.getByLabel('Telefon raqam').fill('901234567');
      await page.getByText('+998').first().waitFor();
      await shot('02-login');
      await page.getByTestId('login-submit').click();
    });
    await step('otp wrong code', async () => { await page.getByLabel('Kod').fill('9999'); await page.getByText('Kod noto‘g‘ri').waitFor(); });
    await step('otp', async () => { await page.getByLabel('Kod').fill('1234'); });
    await step('shop', async () => { await page.getByLabel('Do‘kon nomi').fill('Baraka savdo'); await page.getByTestId('shop-submit').click(); });
    await step('set pin', async () => {
      await page.getByText('PIN kod o‘rnating').waitFor();
      for (const k of '1357') await page.getByRole('button', { name: k, exact: true }).click();
      await page.getByText('PIN kodni takrorlang').waitFor();
      for (const k of '1357') await page.getByRole('button', { name: k, exact: true }).click();
    });
    await step('empty ledger', async () => { await page.getByText('Hali mijoz yo‘q').waitFor(); await shot('03-empty'); await page.getByText('+ Mijoz qo‘shish').click(); });
    await step('add customer', async () => {
      await page.getByLabel('Ism').fill('Aziz Karimov');
      await page.getByLabel('Telefon (ixtiyoriy)').fill('931112233');
      await shot('04-new-contact');
      await page.getByTestId('contact-submit').click();
      await page.getByText('Hali yozuv yo‘q').waitFor();
    });
    await step('gave 500000 with due', async () => {
      await page.getByTestId('btn-gave').click();
      await page.getByTestId('tx-amount').fill('500000');
      await page.getByText('1 hafta').click();
      await page.getByLabel('Izoh (ixtiyoriy)').fill('2 qop un');
      await shot('05-gave');
      await page.getByTestId('tx-submit').click();
    });
    await step('got 200000', async () => {
      await page.getByTestId('btn-got').click();
      await page.getByTestId('tx-amount').fill('200 000');
      await page.getByTestId('tx-submit').click();
    });
    await step('balance 300 000', async () => {
      await page.getByTestId('contact-balance').filter({ hasText: "300 000 so'm" }).waitFor();
      await shot('06-contact');
    });
    await step('reminder', async () => {
      await page.getByText('Eslatma', { exact: true }).click();
      await page.getByText(/qarzingiz 300 000 so'm/).first().waitFor({ state: 'attached' });
      await shot('07-remind');
      await page.goBack();
    });
    await step('home totals', async () => {
      await page.goto('http://localhost:8765/');
      // cold start -> lock screen
      await page.getByText('PIN kodni kiriting').waitFor();
      for (const k of '0000') await page.getByRole('button', { name: k, exact: true }).click();
      await page.getByText('PIN noto‘g‘ri').waitFor();
      for (const k of '1357') await page.getByRole('button', { name: k, exact: true }).click();
      await page.getByTestId('total-receivable').filter({ hasText: "300 000 so'm" }).waitFor();
      await shot('08-home');
    });
    await step('reports', async () => { await page.getByText('Hisobot', { exact: true }).last().click(); await page.getByText('Sof balans').waitFor(); await shot('09-reports'); });
    await step('due tab', async () => { await page.getByText('Muddatlar', { exact: true }).last().click(); await page.getByText('Shu hafta').click(); await page.getByText('Aziz Karimov').last().waitFor(); await shot('10-due'); });
  } finally {
    console.log('page errors:', errors.length ? errors.slice(0, 5) : 'none');
    await browser.close(); server.close();
  }
})().catch(() => process.exit(1));

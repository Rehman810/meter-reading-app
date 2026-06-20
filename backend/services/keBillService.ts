import { chromium, Page } from 'playwright';
import { CaptchaSolver } from '../utils/captchaSolver';
import { BillsRepository } from '../repositories/billsRepository';
import fs from 'fs';
import path from 'path';

export class KEBillService {
  static MAX_RETRIES = 3;

  static async fetchBill(account: any) {
    let browser;
    try {
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext({
        acceptDownloads: true
      });
      const page = await context.newPage();

      let success = false;
      let attempt = 0;

      while (attempt < this.MAX_RETRIES && !success) {
        attempt++;
        try {
          console.log(`Attempt ${attempt} to fetch bill for account ${account.accountNumber}`);
          await page.goto('https://staging.ke.com.pk:24555/ReBrand/DuplicateBill.aspx', { waitUntil: 'domcontentloaded' });

          const accountInput = page.locator('#txtAccNo');
          await accountInput.waitFor({ state: 'visible' });
          await accountInput.fill(account.accountNumber);

          if (account.consumerNumber) {
            const consumerInput = page.locator('#txtConNo');
            if (await consumerInput.count() > 0) {
              await consumerInput.fill(account.consumerNumber);
            }
          }

          // Handle captcha (it is a text span on KE portal, no OCR needed)
          const captchaSpan = page.locator('#lblCaptcha');
          await captchaSpan.waitFor({ state: 'visible' });
          const captchaTextRaw = await captchaSpan.textContent();
          const captchaText = captchaTextRaw ? captchaTextRaw.trim() : '';

          const captchaInput = page.locator('#txtimgcode');
          await captchaInput.fill(captchaText);

          // Click View Bill
          const viewBillBtn = page.locator('#btnViewBill');
          await viewBillBtn.click();

          // Wait for result
          // Assuming result container or error message
          // If captcha fails, it might show an error. We can wait for either bill details or error
          try {
            await page.waitForSelector('#GridView1', { timeout: 10000 });
          } catch (e) {
            // Check for error
            const errorTxt = await page.locator('.error, .alert-danger, #lblMsg').textContent().catch(() => null);
            if (errorTxt && (errorTxt.toLowerCase().includes('captcha') || errorTxt.toLowerCase().includes('invalid'))) {
              throw new Error(`Captcha or validation failed: ${errorTxt}`);
            }
            throw new Error('Timeout waiting for bill data');
          }

          // Successfully loaded bill
          success = true;

          // Extract Data for all rows
          const rows = page.locator('#GridView1 tr');
          const rowCount = await rows.count();

          console.log(`Found ${rowCount - 1} bills in the table for account ${account.accountNumber}.`);

          // Pre-extract all data safely before clicking any download buttons
          const billsData = [];
          for (let i = 1; i < rowCount; i++) {
            const row = rows.nth(i);
            const rawMonth = await row.locator('td').nth(0).textContent().catch(() => '');
            const billingMonth = rawMonth ? rawMonth.trim() : new Date().toISOString().slice(0, 7);

            const dueDateStr = await row.locator('td').nth(3).textContent().catch(() => '');
            const dueDate = dueDateStr ? dueDateStr.trim() : '';

            const billAmountStr = await row.locator('td').nth(2).textContent().catch(() => '');
            const payableAfterStr = await row.locator('td').nth(4).textContent().catch(() => '');

            const billAmount = parseFloat((billAmountStr || '').replace(/[^0-9.]/g, '')) || 0;
            const payableAfter = parseFloat((payableAfterStr || '').replace(/[^0-9.]/g, '')) || 0;
            const arrears = Math.max(0, payableAfter - billAmount);

            const hasDownload = await row.locator('input[value="Download"]').count() > 0;

            billsData.push({
              index: i,
              billingMonth,
              dueDate,
              billAmount,
              arrears,
              hasDownload
            });
          }

          // Now loop through our gathered data and download PDFs sequentially
          for (const bill of billsData) {
            let pdfUrl = '';

            if (bill.hasDownload) {
              const row = rows.nth(bill.index);
              const pdfBtn = row.locator('input[value="Download"]');

              try {
                console.log(`Downloading PDF for ${bill.billingMonth}...`);
                const [download] = await Promise.all([
                  page.waitForEvent('download', { timeout: 15000 }),
                  pdfBtn.first().click()
                ]);

                const downloadsDir = path.join(__dirname, '../uploads/bills');
                if (!fs.existsSync(downloadsDir)) {
                  fs.mkdirSync(downloadsDir, { recursive: true });
                }

                const filePath = path.join(downloadsDir, `${account.accountNumber}_${bill.billingMonth}.pdf`);
                await download.saveAs(filePath);
                pdfUrl = `/uploads/bills/${account.accountNumber}_${bill.billingMonth}.pdf`;
                console.log(`Successfully downloaded PDF for ${bill.billingMonth}`);
              } catch (downloadErr: any) {
                console.error(`Failed to download PDF for ${bill.billingMonth}:`, downloadErr.message);
              }

              // Wait between downloads to allow the server and browser to reset state
              await page.waitForTimeout(3000);
            }

            // Save to database
            await BillsRepository.saveBill({
              userId: account.userId,
              accountId: account._id,
              billingMonth: bill.billingMonth,
              issueDate: '',
              dueDate: bill.dueDate,
              unitsConsumed: 0,
              previousReading: 0,
              currentReading: 0,
              billAmount: bill.billAmount,
              arrears: bill.arrears,
              taxes: 0,
              pdfUrl,
              imageUrl: '',
              status: 'FETCHED'
            });
          }

          await BillsRepository.logFetch(account._id, 'SUCCESS', 'Bill fetched successfully');

        } catch (error: any) {
          console.error(`Attempt ${attempt} failed:`, error.message);
          if (attempt === this.MAX_RETRIES) {
            await BillsRepository.logFetch(account._id, 'ERROR', error.message);
          }
        }
      }
    } catch (e: any) {
      console.error('Fatal error in KEBillService:', e.message);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}

import cron from 'node-cron';
import { KEBillService } from '../services/keBillService';
import { BillsRepository } from '../repositories/billsRepository';

export const startSyncBillsJob = () => {
  // Run daily at 8 AM
  cron.schedule('0 8 * * *', async () => {
    console.log('Starting daily bill sync job...');
    try {
      const accounts = await BillsRepository.getAccounts();
      
      for (const account of accounts) {
        console.log(`Syncing bill for account ${account._id}`);
        await KEBillService.fetchBill(account);
        
        // Add a small delay between accounts to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      console.log('Finished daily bill sync job');
    } catch (error) {
      console.error('Error in daily bill sync job:', error);
    }
  });

  console.log('Daily bill sync job scheduled for 8 AM');
};

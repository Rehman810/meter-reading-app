import { Request, Response } from 'express';
import { KEBillService } from '../services/keBillService';
import Account from '../models/Account';
import Bill from '../models/Bill';

export class BillsController {
  static async syncBill(req: Request, res: Response): Promise<void> {
    try {
      const { accountId } = req.params;
      const account = await Account.findById(accountId);
      
      if (!account) {
        res.status(404).json({ message: 'Account not found' });
        return;
      }

      // Wait for sync to complete
      await KEBillService.fetchBill(account);
      
      res.status(200).json({ message: 'Bill sync completed successfully' });
    } catch (error: any) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async getBills(req: Request, res: Response): Promise<void> {
    try {
      const { accountId } = req.params;
      const bills = await Bill.find({ accountId });
      
      // Sort bills by parsing billingMonth (e.g., "May-26" -> May 2026)
      const parseMonth = (m: string) => {
        if (!m) return 0;
        const parts = m.split('-');
        if (parts.length !== 2) return 0;
        const date = new Date(`${parts[0]} 1, 20${parts[1]}`);
        return date.getTime();
      };
      
      bills.sort((a, b) => parseMonth(b.billingMonth) - parseMonth(a.billingMonth));
      
      res.status(200).json(bills);
    } catch (error: any) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async deleteBill(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const bill = await Bill.findById(id);

      if (!bill) {
        res.status(404).json({ message: 'Bill not found' });
        return;
      }

      await Bill.findByIdAndDelete(id);
      res.status(200).json({ message: 'Bill deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
}

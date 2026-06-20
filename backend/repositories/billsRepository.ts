import Bill from '../models/Bill';
import Account from '../models/Account';
import BillFetchLog from '../models/BillFetchLog';

export class BillsRepository {
  static async saveBill(billData: any) {
    const existingBill = await Bill.findOne({
      accountId: billData.accountId,
      billingMonth: billData.billingMonth
    });

    if (existingBill) {
      // Update existing
      Object.assign(existingBill, billData);
      await existingBill.save();
      return existingBill;
    }

    const bill = new Bill(billData);
    await bill.save();
    return bill;
  }

  static async logFetch(accountId: string, status: string, message: string) {
    const log = new BillFetchLog({
      accountId,
      status,
      message
    });
    await log.save();
  }

  static async getAccounts() {
    return Account.find();
  }
}

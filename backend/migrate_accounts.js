require('dotenv').config();
const mongoose = require('mongoose');
const Bill = require('./models/Bill');
const MeterReading = require('./models/MeterReading');
const Account = require('./models/Account');

const migrate = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  
  const bills = await Bill.find();
  for (let bill of bills) {
    if (!bill.accountNumber) continue;
    
    let account = await Account.findOne({ accountNumber: bill.accountNumber, userId: bill.userId });
    if (!account) {
      account = await Account.create({
        userId: bill.userId,
        accountNumber: bill.accountNumber,
        consumerName: bill.consumerName || 'Unknown',
      });
    }
    
    // Update bill
    bill.accountId = account._id;
    await bill.save();
    
    // Update readings
    await MeterReading.updateMany({ billId: bill._id }, { accountId: account._id });
  }
  
  console.log('Migration complete');
  process.exit(0);
};
migrate();

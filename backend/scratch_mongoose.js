require('dotenv').config();
const mongoose = require('mongoose');
const Bill = require('./models/Bill');

const test = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const q = { accountNumber: '' };
  const latestBill = await Bill.findOne(q).sort({ billingMonth: -1, createdAt: -1 });
  console.log('Query:', q);
  console.log('Latest Bill:', latestBill);
  process.exit(0);
};
test();

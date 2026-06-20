require('dotenv').config();
const mongoose = require('mongoose');
const Bill = require('./models/Bill');
const usageController = require('./controllers/usageController');

const test = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  
  const user = { _id: new mongoose.Types.ObjectId('6a32b26881c1360189430a42') };
  const req = {
    user,
    query: { accountNumber: '0400026949392' }
  };
  
  const res = {
    json: (data) => console.log('Response:', data),
    status: (code) => console.log('Status:', code)
  };
  
  const next = (err) => console.error('Next Error:', err);
  
  await usageController.getUsageSummary(req, res, next);
  process.exit(0);
};
test();

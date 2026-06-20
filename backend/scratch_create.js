require('dotenv').config();
const mongoose = require('mongoose');
const accountController = require('./controllers/accountController');

const test = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  
  const user = { _id: new mongoose.Types.ObjectId('6a32b26881c1360189430a42') };
  const req = {
    user,
    body: {
      consumerName: 'Test Account',
      accountNumber: '00000000000001',
    }
  };
  
  const res = {
    json: (data) => console.log('Response:', data),
    status: (code) => console.log('Status:', code)
  };
  
  const next = (err) => console.error('Next Error:', err);
  
  await accountController.createAccount(req, res, next);
  process.exit(0);
};
test();

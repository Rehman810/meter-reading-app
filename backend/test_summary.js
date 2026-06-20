const mongoose = require('mongoose');
const Bill = require('./models/Bill');

mongoose.connect('mongodb+srv://abdulrehmanwaseem102_db_user:NEfw6jkmZdgB5K0H@airbnb.ix1z3o7.mongodb.net/airbnb?retryWrites=true&w=majority')
  .then(async () => {
    const bills = await Bill.find({status: 'FETCHED'});
    console.log("Fetched bills:", JSON.stringify(bills.slice(0,2), null, 2));
    process.exit(0);
  });

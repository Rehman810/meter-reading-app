const mongoose = require('mongoose');
const Bill = require('./backend/models/Bill');
const MeterReading = require('./backend/models/MeterReading');

mongoose.connect('mongodb://localhost:27017/meter-reading-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
  const bills = await Bill.find().lean();
  console.log("Bills:", bills.map(b => ({id: b._id, month: b.billingMonth, currentReading: b.currentReading, accountId: b.accountId})));
  const readings = await MeterReading.find().lean();
  console.log("Readings:", readings.map(r => ({id: r._id, billId: r.billId, reading: r.reading, accountId: r.accountId})));
  process.exit(0);
});

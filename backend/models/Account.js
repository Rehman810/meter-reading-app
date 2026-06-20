const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    consumerName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    consumerNumber: { type: String },
    address: { type: String },
    meterNumber: { type: String },
    connectionType: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Account', accountSchema);

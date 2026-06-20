const mongoose = require('mongoose');

const billFetchLogSchema = new mongoose.Schema(
  {
    accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
    status: { type: String, required: true }, // e.g., 'SUCCESS', 'ERROR'
    message: { type: String },
    created_at: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('BillFetchLog', billFetchLogSchema);

const mongoose = require('mongoose');

const billSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
    consumerName: { type: String },
    accountNumber: { type: String },
    billingMonth: { type: String, required: true },
    issueDate: { type: String },
    dueDate: { type: String },
    unitsConsumed: { type: Number },
    previousReading: { type: Number },
    currentReading: { type: Number },
    billAmount: { type: Number },
    totalAmount: { type: Number },
    perUnitRate: { type: Number },
    arrears: { type: Number, default: 0 },
    taxes: { type: Number, default: 0 },
    pdfUrl: { type: String },
    imageUrl: { type: String },
    downloadedAt: { type: Date, default: Date.now },
    status: { type: String },
    rawAiResponse: { type: mongoose.Schema.Types.Mixed },
    aiInsights: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Bill', billSchema);

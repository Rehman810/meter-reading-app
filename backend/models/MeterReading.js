const mongoose = require('mongoose');

const meterReadingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: false,
    },
    billId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bill',
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    reading: {
      type: Number,
      required: true,
    },
    confidence: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'high',
    },
    recordedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MeterReading', meterReadingSchema);

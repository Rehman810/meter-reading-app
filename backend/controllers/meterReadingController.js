const MeterReading = require('../models/MeterReading');
const Bill = require('../models/Bill');
const { uploadImage } = require('../services/cloudinary');
const { extractMeterReading } = require('../services/gemini');

const uploadMeterReading = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error('No image file provided');
    }

    const { accountId } = req.body;
    let query = { userId: req.user._id };
    if (accountId) {
      query.accountId = accountId;
    } else {
      // Fallback for old clients
      const { accountNumber } = req.body;
      if (accountNumber && accountNumber !== 'Unknown Account') {
        query.accountNumber = accountNumber;
      }
    }

    // Find the most recent bill for this specific account
    const bills = await Bill.find(query);
    
    const parseMonth = (m) => {
      if (!m) return 0;
      const normalized = m.replace(' ', '-').replace('-20', '-');
      const parts = normalized.split('-');
      if (parts.length !== 2) return 0;
      const date = new Date(`${parts[0]} 1, 20${parts[1]}`);
      return date.getTime();
    };

    const validBills = bills.sort((a, b) => {
      const aTime = parseMonth(a.billingMonth) || new Date(a.createdAt).getTime();
      const bTime = parseMonth(b.billingMonth) || new Date(b.createdAt).getTime();
      const timeDiff = bTime - aTime;
      if (timeDiff !== 0) return timeDiff;
      const aHasReading = a.currentReading && a.currentReading > 0;
      const bHasReading = b.currentReading && b.currentReading > 0;
      if (aHasReading && !bHasReading) return -1;
      if (!aHasReading && bHasReading) return 1;
      return b.createdAt - a.createdAt;
    });

    const latestBill = validBills[0];

    if (!latestBill) {
      res.status(400);
      throw new Error('You need to upload at least one bill before tracking meter readings');
    }

    // 1. Upload to Cloudinary
    let cloudinaryResult;
    try {
      cloudinaryResult = await uploadImage(req.file.buffer);
    } catch (err) {
      res.status(500);
      throw new Error('Failed to upload image to Cloudinary');
    }

    // 2. Extract data using Gemini
    let aiData;
    try {
      aiData = await extractMeterReading(req.file.buffer, req.file.mimetype);
    } catch (err) {
      res.status(422);
      throw new Error('Failed to parse meter reading. Please retake the photo clearly.');
    }

    if (aiData.reading == null) {
      res.status(422);
      throw new Error('Could not read the meter value. Please retake the photo clearly.');
    }

    // 3. Save to DB
    const meterReading = await MeterReading.create({
      userId: req.user._id,
      accountId: latestBill.accountId || accountId,
      billId: latestBill._id,
      imageUrl: cloudinaryResult.secure_url,
      reading: aiData.reading,
      confidence: aiData.confidence || 'high',
    });

    res.status(201).json(meterReading);
  } catch (error) {
    next(error);
  }
};

const getMeterReadings = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = { userId: req.user._id };
    if (req.query.accountId) {
      query.accountId = req.query.accountId;
    }

    const readings = await MeterReading.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('billId', 'billingMonth currentReading');

    const total = await MeterReading.countDocuments(query);

    res.json({
      readings,
      page,
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    next(error);
  }
};

const updateMeterReading = async (req, res, next) => {
  try {
    const { reading } = req.body;
    const meterReading = await MeterReading.findById(req.params.id);

    if (!meterReading) {
      res.status(404);
      throw new Error('Meter reading not found');
    }

    if (meterReading.userId.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to update this meter reading');
    }

    if (reading !== undefined && !isNaN(Number(reading))) {
      meterReading.reading = Number(reading);
    }

    const updatedReading = await meterReading.save();
    res.json(updatedReading);
  } catch (error) {
    next(error);
  }
};

const deleteMeterReading = async (req, res, next) => {
  try {
    const meterReading = await MeterReading.findById(req.params.id);

    if (!meterReading) {
      res.status(404);
      throw new Error('Meter reading not found');
    }

    if (meterReading.userId.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to delete this meter reading');
    }

    await meterReading.deleteOne();
    res.json({ message: 'Meter reading removed' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadMeterReading,
  getMeterReadings,
  updateMeterReading,
  deleteMeterReading,
};

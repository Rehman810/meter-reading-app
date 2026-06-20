const Bill = require('../models/Bill');
const { uploadImage } = require('../services/cloudinary');
const { extractBillData } = require('../services/gemini');

const uploadBill = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error('No image file provided');
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
      aiData = await extractBillData(req.file.buffer, req.file.mimetype);
    } catch (err) {
      console.error('Gemini API Error Details:', err);
      res.status(422);
      throw new Error('Failed to parse bill data. Please retake the photo clearly.');
    }

    // 3. Compute perUnitRate
    let perUnitRate = null;
    if (aiData.totalAmount != null && aiData.unitsConsumed != null && aiData.unitsConsumed > 0) {
      perUnitRate = aiData.totalAmount / aiData.unitsConsumed;
    }

    // 4. Save to DB
    const bill = await Bill.create({
      userId: req.user._id,
      accountId: req.body.accountId || undefined,
      imageUrl: cloudinaryResult.secure_url,
      billingMonth: aiData.billingMonth,
      consumerName: aiData.consumerName,
      accountNumber: aiData.accountNumber,
      issueDate: aiData.issueDate,
      previousReading: aiData.previousReading,
      currentReading: aiData.currentReading,
      unitsConsumed: aiData.unitsConsumed,
      totalAmount: aiData.totalAmount,
      dueDate: aiData.dueDate,
      perUnitRate,
      rawAiResponse: aiData,
    });

    res.status(201).json(bill);
  } catch (error) {
    next(error);
  }
};

const updateBill = async (req, res, next) => {
  try {
    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      res.status(404);
      throw new Error('Bill not found');
    }

    if (bill.userId.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to access this bill');
    }

    const { billingMonth, consumerName, accountNumber, issueDate, previousReading, currentReading, unitsConsumed, totalAmount, dueDate } = req.body;

    bill.billingMonth = billingMonth !== undefined ? billingMonth : bill.billingMonth;
    bill.consumerName = consumerName !== undefined ? consumerName : bill.consumerName;
    bill.accountNumber = accountNumber !== undefined ? accountNumber : bill.accountNumber;
    bill.issueDate = issueDate !== undefined ? issueDate : bill.issueDate;
    bill.previousReading = previousReading !== undefined ? previousReading : bill.previousReading;
    bill.currentReading = currentReading !== undefined ? currentReading : bill.currentReading;
    bill.unitsConsumed = unitsConsumed !== undefined ? unitsConsumed : bill.unitsConsumed;
    bill.totalAmount = totalAmount !== undefined ? totalAmount : bill.totalAmount;
    bill.dueDate = dueDate !== undefined ? dueDate : bill.dueDate;

    if (bill.totalAmount != null && bill.unitsConsumed != null && bill.unitsConsumed > 0) {
      bill.perUnitRate = bill.totalAmount / bill.unitsConsumed;
    } else {
      bill.perUnitRate = null;
    }

    const updatedBill = await bill.save();
    res.json(updatedBill);
  } catch (error) {
    next(error);
  }
};

const getBills = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = { userId: req.user._id };
    if (req.query.accountId) {
      query.accountId = req.query.accountId;
    }

    const bills = await Bill.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Bill.countDocuments(query);

    res.json({
      bills,
      page,
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    next(error);
  }
};

const getBillById = async (req, res, next) => {
  try {
    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      res.status(404);
      throw new Error('Bill not found');
    }

    if (bill.userId.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to access this bill');
    }

    res.json(bill);
  } catch (error) {
    next(error);
  }
};

const getAccounts = async (req, res, next) => {
  try {
    const bills = await Bill.find({ userId: req.user._id }).sort({ billingMonth: -1, createdAt: -1 });
    
    const accountsMap = new Map();
    bills.forEach(bill => {
      const acc = bill.accountNumber || 'Unknown Account';
      if (!accountsMap.has(acc)) {
        accountsMap.set(acc, {
          accountNumber: acc,
          consumerName: bill.consumerName || 'Unknown Name',
          latestBillId: bill._id,
          billingMonth: bill.billingMonth,
          totalAmount: bill.totalAmount
        });
      }
    });
    
    res.json(Array.from(accountsMap.values()));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadBill,
  updateBill,
  getBills,
  getBillById,
  getAccounts,
};

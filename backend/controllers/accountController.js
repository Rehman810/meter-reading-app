const Account = require('../models/Account');

const createAccount = async (req, res, next) => {
  try {
    const { consumerName, accountNumber, consumerNumber, address, meterNumber, connectionType } = req.body;
    
    const accountExists = await Account.findOne({ accountNumber, userId: req.user._id });
    if (accountExists) {
      res.status(400);
      throw new Error('Account with this number already exists');
    }

    const account = await Account.create({
      userId: req.user._id,
      consumerName,
      accountNumber,
      consumerNumber,
      address,
      meterNumber,
      connectionType,
    });

    const { KEBillService } = require('../services/keBillService');
    KEBillService.fetchBill(account).catch(e => console.error('Failed to auto sync bill:', e));

    res.status(201).json(account);
  } catch (error) {
    next(error);
  }
};

const getAccounts = async (req, res, next) => {
  try {
    const accounts = await Account.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(accounts);
  } catch (error) {
    next(error);
  }
};

const getAccountById = async (req, res, next) => {
  try {
    const account = await Account.findById(req.params.id);
    if (!account || account.userId.toString() !== req.user._id.toString()) {
      res.status(404);
      throw new Error('Account not found');
    }

    const Bill = require('../models/Bill');
    const MeterReading = require('../models/MeterReading');

    const latestBill = await Bill.findOne({ accountId: account._id }).sort({ createdAt: -1 });
    const latestReading = await MeterReading.findOne({ accountId: account._id }).sort({ createdAt: -1 });

    res.json({
      ...account.toObject(),
      latestBill,
      latestReading,
    });
  } catch (error) {
    next(error);
  }
};

const extractAccountFromBill = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error('No image file provided');
    }

    const { extractBillData } = require('../services/gemini');
    let aiData;
    try {
      aiData = await extractBillData(req.file.buffer, req.file.mimetype);
    } catch (err) {
      res.status(422);
      throw new Error('Failed to parse bill data. Please retake the photo clearly.');
    }

    res.json({
      consumerName: aiData.consumerName || '',
      accountNumber: aiData.accountNumber || '',
    });
  } catch (error) {
    next(error);
  }
};

const deleteAccount = async (req, res, next) => {
  try {
    const account = await Account.findById(req.params.id);
    if (!account || account.userId.toString() !== req.user._id.toString()) {
      res.status(404);
      throw new Error('Account not found');
    }

    const Bill = require('../models/Bill');
    const MeterReading = require('../models/MeterReading');
    
    // Delete associated data
    await Bill.deleteMany({ accountId: account._id });
    await MeterReading.deleteMany({ accountId: account._id });
    
    // Delete account
    await account.deleteOne();
    
    res.json({ message: 'Account and associated data deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createAccount, getAccounts, getAccountById, extractAccountFromBill, deleteAccount };

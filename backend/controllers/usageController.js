const Bill = require('../models/Bill');
const MeterReading = require('../models/MeterReading');

const getUsageSummary = async (req, res, next) => {
  try {
    const { accountId } = req.query;
    let query = { userId: req.user._id };
    
    if (accountId) {
      query.accountId = accountId;
    } else {
      const { accountNumber } = req.query;
      if (accountNumber && accountNumber !== 'Unknown Account') {
        query.accountNumber = accountNumber;
      }
    }

    const bills = await Bill.find(query);
    
    // Sort bills by parsing billingMonth (e.g., "May-26" or "May 2026" -> May 2026)
    const parseMonth = (m) => {
      if (!m) return 0;
      const normalized = m.replace(' ', '-').replace('-20', '-');
      const parts = normalized.split('-');
      if (parts.length !== 2) return 0;
      const date = new Date(`${parts[0]} 1, 20${parts[1]}`);
      return date.getTime();
    };

    // Include all bills, prioritize Uploaded over Fetched for the same month
    const validBills = bills.sort((a, b) => {
      const aTime = parseMonth(a.billingMonth) || new Date(a.createdAt).getTime();
      const bTime = parseMonth(b.billingMonth) || new Date(b.createdAt).getTime();
      const timeDiff = bTime - aTime;
      if (timeDiff !== 0) return timeDiff;
      // If same month, prefer bills with a valid reading
      const aHasReading = a.currentReading && a.currentReading > 0;
      const bHasReading = b.currentReading && b.currentReading > 0;
      if (aHasReading && !bHasReading) return -1;
      if (!aHasReading && bHasReading) return 1;
      // Then uploaded bills (status !== 'FETCHED') have priority
      if (a.status !== 'FETCHED' && b.status === 'FETCHED') return -1;
      if (a.status === 'FETCHED' && b.status !== 'FETCHED') return 1;
      // Finally sort by creation date (newest first)
      return b.createdAt - a.createdAt;
    });

    const latestBill = validBills[0];

    if (!latestBill) {
      return res.json({ hasData: false, message: 'No bills found. Please upload or sync a bill.' });
    }

    const readingQuery = { userId: req.user._id };
    if (accountId) {
      readingQuery.accountId = accountId;
    } else if (latestBill.accountId) {
      readingQuery.accountId = latestBill.accountId;
    } else {
      readingQuery.billId = latestBill._id;
    }

    const latestReading = await MeterReading.findOne(readingQuery).sort({ createdAt: -1 });

    const hasValidStartingReading = latestBill.currentReading && latestBill.currentReading > 0;

    if (!latestReading || !hasValidStartingReading) {
      return res.json({
        hasData: true,
        hasReading: false,
        billId: latestBill._id,
        message: !hasValidStartingReading ? 'Upload the bill image to extract the meter reading and unlock tracking.' : 'No meter readings since last bill',
        perUnitRate: latestBill.perUnitRate,
        billAmount: latestBill.totalAmount || latestBill.billAmount,
        billUnits: latestBill.unitsConsumed,
        billMonth: latestBill.billingMonth,
        billIssueDate: latestBill.issueDate,
        billCurrentReading: latestBill.currentReading,
      });
    }

    const unitsUsedSinceBill = Math.max(0, latestReading.reading - (latestBill.currentReading || 0));
    
    let billDate = new Date(latestBill.createdAt);
    if (latestBill.issueDate) {
      const parsedDate = new Date(latestBill.issueDate);
      if (!isNaN(parsedDate.getTime())) {
        billDate = parsedDate;
      }
    }
    const now = latestReading.createdAt ? new Date(latestReading.createdAt) : new Date();
    const diffTime = Math.max(0, now.getTime() - billDate.getTime());
    const daysSinceBill = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24))); // avoid division by 0

    const dailyAverage = unitsUsedSinceBill / daysSinceBill;
    const projectedMonthlyUnits = dailyAverage * 30;
    
    let estimatedCost = null;
    let perUnitRate = latestBill.perUnitRate;
    if (!perUnitRate && (latestBill.billAmount || latestBill.totalAmount) && latestBill.unitsConsumed) {
      const amount = latestBill.billAmount || latestBill.totalAmount;
      perUnitRate = amount / latestBill.unitsConsumed;
    }

    if (perUnitRate !== undefined && perUnitRate !== null && !isNaN(perUnitRate)) {
      estimatedCost = projectedMonthlyUnits * perUnitRate;
      if (isNaN(estimatedCost)) {
        estimatedCost = null;
      }
    }

    res.json({
      hasData: true,
      hasReading: true,
      unitsUsedSinceBill,
      daysSinceBill,
      dailyAverage,
      projectedMonthlyUnits,
      estimatedCost,
      perUnitRate: latestBill.perUnitRate,
      latestReading: latestReading.reading,
      billAmount: latestBill.totalAmount,
      billUnits: latestBill.unitsConsumed,
      billMonth: latestBill.billingMonth,
      billIssueDate: latestBill.issueDate,
      billCurrentReading: latestBill.currentReading,
    });
  } catch (error) {
    next(error);
  }
};

const getUsageHistory = async (req, res, next) => {
  try {
    const bills = await Bill.find({ userId: req.user._id, status: { $ne: 'FETCHED' } });
    
    const parseMonth = (m) => {
      if (!m) return 0;
      const normalized = m.replace(' ', '-').replace('-20', '-');
      const parts = normalized.split('-');
      if (parts.length !== 2) return 0;
      const date = new Date(`${parts[0]} 1, 20${parts[1]}`);
      return date.getTime();
    };

    bills.sort((a, b) => {
      const aTime = parseMonth(a.billingMonth) || new Date(a.createdAt).getTime();
      const bTime = parseMonth(b.billingMonth) || new Date(b.createdAt).getTime();
      return bTime - aTime;
    });
    const recentBills = bills.slice(0, 12);

    const history = recentBills.map((bill) => ({
      id: bill._id,
      month: bill.billingMonth,
      unitsConsumed: bill.unitsConsumed || 0,
      totalAmount: bill.billAmount || bill.totalAmount || 0,
      perUnitRate: bill.perUnitRate,
      createdAt: bill.createdAt,
    })).reverse(); // Oldest to newest for charting

    res.json(history);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsageSummary,
  getUsageHistory,
};

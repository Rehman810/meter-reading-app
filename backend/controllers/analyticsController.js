const Bill = require('../models/Bill');
const MeterReading = require('../models/MeterReading');
const { generateInsights } = require('../services/gemini');

const getAccountAnalytics = async (req, res, next) => {
  try {
    const accountId = req.params.accountId;

    const bills = await Bill.find({ accountId, userId: req.user._id }).sort({ createdAt: 1 });
    const readings = await MeterReading.find({ accountId, userId: req.user._id }).sort({ createdAt: 1 });

    const validBills = bills.filter(b => b.status !== 'FETCHED' && (b.unitsConsumed || 0) > 0);

    if (!validBills.length) {
      return res.json({ hasData: false, message: 'Upload bills to see analytics.' });
    }

    let totalUnits = 0;
    let totalAmount = 0;
    let highestMonth = null;
    let highestUnits = 0;
    let lowestMonth = null;
    let lowestUnits = Infinity;

    const monthlyConsumptionTrend = [];
    const monthlyBillTrend = [];

    validBills.forEach(bill => {
      const units = bill.unitsConsumed || 0;
      const amount = bill.billAmount || bill.totalAmount || 0;
      const month = bill.billingMonth || 'Unknown';

      totalUnits += units;
      totalAmount += amount;

      if (units > highestUnits) {
        highestUnits = units;
        highestMonth = month;
      }
      if (units < lowestUnits) {
        lowestUnits = units;
        lowestMonth = month;
      }

      monthlyConsumptionTrend.push({ month, units });
      monthlyBillTrend.push({ month, amount });
    });

    const averageUnits = totalUnits / validBills.length;
    const averageBill = totalAmount / validBills.length;

    const latestBill = validBills[validBills.length - 1];
    let aiInsights = null; // latestBill.aiInsights;

    /* Temporarily disabled AI Insights
    if (!aiInsights) {
      const recentBills = validBills.slice(-3).map(b => ({
        month: b.billingMonth,
        units: b.unitsConsumed,
        amount: b.totalAmount || b.billAmount
      }));
      aiInsights = await generateInsights(recentBills);
      latestBill.aiInsights = aiInsights;
      await latestBill.save();
    }
    */

    res.json({
      hasData: true,
      averageUnits: Math.round(averageUnits),
      averageBill: Math.round(averageBill),
      highestMonth: { month: highestMonth, units: highestUnits },
      lowestMonth: { month: lowestMonth, units: lowestUnits === Infinity ? 0 : lowestUnits },
      monthlyConsumptionTrend,
      monthlyBillTrend,
      aiInsights
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAccountAnalytics };

const express = require('express');
const { getUsageSummary, getUsageHistory } = require('../controllers/usageController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/summary', protect, getUsageSummary);
router.get('/history', protect, getUsageHistory);

module.exports = router;

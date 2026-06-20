const express = require('express');
const { getAccountAnalytics } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.route('/:accountId').get(protect, getAccountAnalytics);

module.exports = router;

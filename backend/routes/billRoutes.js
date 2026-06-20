const express = require('express');
const { uploadBill, updateBill, getBills, getBillById, getAccounts } = require('../controllers/billController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const rateLimit = require('express-rate-limit');

const router = express.Router();

const aiUploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 upload requests per `window` (here, per 15 minutes)
  message: { error: 'Too many upload requests from this IP, please try again later.' },
});

const { BillsController } = require('../controllers/billsController');

router.route('/accounts').get(protect, getAccounts);
router.route('/upload').post(protect, aiUploadLimiter, upload.single('image'), uploadBill);
router.route('/:accountId/sync').post(protect, BillsController.syncBill);
router.route('/').get(protect, getBills);
router.route('/:id').get(protect, getBillById).patch(protect, updateBill).delete(protect, BillsController.deleteBill);

module.exports = router;

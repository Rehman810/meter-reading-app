const express = require('express');
const { uploadMeterReading, getMeterReadings, updateMeterReading, deleteMeterReading } = require('../controllers/meterReadingController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const rateLimit = require('express-rate-limit');

const router = express.Router();

const aiUploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 meter reading upload requests per window
  message: { error: 'Too many upload requests from this IP, please try again later.' },
});

router.route('/upload').post(protect, aiUploadLimiter, upload.single('image'), uploadMeterReading);
router.route('/').get(protect, getMeterReadings);
router.route('/:id')
  .put(protect, updateMeterReading)
  .delete(protect, deleteMeterReading);

module.exports = router;

const express = require('express');
const { createAccount, getAccounts, getAccountById, extractAccountFromBill, deleteAccount } = require('../controllers/accountController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.post('/extract', protect, upload.single('image'), extractAccountFromBill);
router.route('/').post(protect, createAccount).get(protect, getAccounts);
router.route('/:id').get(protect, getAccountById).delete(protect, deleteAccount);

module.exports = router;

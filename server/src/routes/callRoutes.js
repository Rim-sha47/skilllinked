const express = require('express');
const { getCallHistory, createCall, updateCall } = require('../controllers/callController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', protect, getCallHistory);
router.post('/', protect, createCall);
router.put('/:callId', protect, updateCall);

module.exports = router;

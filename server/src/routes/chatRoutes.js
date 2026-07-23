const express = require('express');
const { accessChat, fetchChats } = require('../controllers/chatController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/', protect, accessChat);
router.get('/', protect, fetchChats);

module.exports = router;

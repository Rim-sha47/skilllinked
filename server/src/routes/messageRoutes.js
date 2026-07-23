const express = require('express');
const { sendMessage, allMessages, deleteMessage, uploadMedia } = require('../controllers/messageController');
const { upload } = require('../config/cloudinary');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/', protect, sendMessage);
router.post('/upload', protect, upload.single('file'), uploadMedia);
router.get('/:chatId', protect, allMessages);
router.delete('/:messageId', protect, deleteMessage);

module.exports = router;

const express = require('express');
const { sendMessage, allMessages, deleteMessage, uploadMedia, reactToMessage, markMessagesSeen, editMessage, deleteForMe, toggleStar, togglePin, starredMessages } = require('../controllers/messageController');
const { upload } = require('../config/cloudinary');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/', protect, sendMessage);
router.post('/upload', protect, upload.single('file'), uploadMedia);
router.get('/starred', protect, starredMessages);
router.get('/:chatId', protect, allMessages);
router.put('/:messageId', protect, editMessage);
router.delete('/:messageId', protect, deleteMessage);
router.put('/:messageId/deleteForMe', protect, deleteForMe);
router.put('/:messageId/react', protect, reactToMessage);
router.put('/:messageId/star', protect, toggleStar);
router.put('/:messageId/pin', protect, togglePin);
router.put('/seen/:chatId', protect, markMessagesSeen);

module.exports = router;

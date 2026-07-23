const express = require('express');
const {
  getNotifications,
  markRead,
  markAllRead,
  deleteNotification,
} = require('../controllers/notificationController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', protect, getNotifications);
router.put('/read-all', protect, markAllRead);
router.put('/:id/read', protect, markRead);
router.delete('/:id', protect, deleteNotification);

module.exports = router;

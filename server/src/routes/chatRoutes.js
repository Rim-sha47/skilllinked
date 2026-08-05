const express = require('express');
const {
  accessChat,
  fetchChats,
  pinChat,
  muteChat,
  archiveChat,
  blockUser,
  getBlockedUsers,
  deleteChat,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
  leaveGroup,
} = require('../controllers/chatController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// 1-on-1 chats
router.post('/', protect, accessChat);
router.get('/', protect, fetchChats);

// Per-chat toggles
router.put('/:chatId/pin', protect, pinChat);
router.put('/:chatId/mute', protect, muteChat);
router.put('/:chatId/archive', protect, archiveChat);
router.delete('/:chatId', protect, deleteChat);

// Block / Unblock a user
router.put('/block/:userId', protect, blockUser);
router.get('/blocked-users', protect, getBlockedUsers);

// Group chat management
router.post('/group', protect, createGroupChat);
router.put('/group/:chatId/rename', protect, renameGroup);
router.put('/group/:chatId/add', protect, addToGroup);
router.put('/group/:chatId/remove', protect, removeFromGroup);
router.put('/group/:chatId/leave', protect, leaveGroup);

module.exports = router;

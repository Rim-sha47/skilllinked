const express = require('express');
const {
  getCallHistory,
  createCall,
  updateCall,
  deleteCall,
  deleteMultipleCalls,
  clearCallHistory,
  togglePinCall,
  toggleArchiveCall,
} = require('../controllers/callController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', protect, getCallHistory);
router.post('/', protect, createCall);
router.put('/:callId', protect, updateCall);
router.delete('/clear/all', protect, clearCallHistory);
router.post('/bulk-delete', protect, deleteMultipleCalls);
router.delete('/:callId', protect, deleteCall);
router.put('/:callId/pin', protect, togglePinCall);
router.put('/:callId/archive', protect, toggleArchiveCall);

module.exports = router;

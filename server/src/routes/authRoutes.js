const express = require('express');
const {
  registerUser,
  registerCompany,
  loginUser,
  loginCompany,
  loginAdmin,
  refreshToken,
  getMe,
  logout
} = require('../controllers/authController');
const { googleAuth } = require('../controllers/googleAuthController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/register/user', registerUser);
router.post('/register/company', registerCompany);
router.post('/login/user', loginUser);
router.post('/login/company', loginCompany);
router.post('/login/admin', loginAdmin);
router.post('/refresh', refreshToken);

router.post('/google', googleAuth);


router.get('/me', protect, getMe);

module.exports = router;

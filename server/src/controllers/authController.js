const User = require('../models/User');
const Company = require('../models/Company');
const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');

// Helper to generate both Access and Refresh Tokens
const generateTokens = (id, role) => {
  const accessToken = jwt.sign({ id, role }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
  const refreshToken = jwt.sign({ id, role }, process.env.JWT_REFRESH_SECRET || 'refresh_secret', { expiresIn: '7d' });
  return { accessToken, refreshToken };
};
exports.generateTokens = generateTokens;

// @desc    Register user
// @route   POST /api/auth/register/user
// @access  Public
exports.registerUser = async (req, res) => {
  try {
    console.log('RegisterUser request body:', req.body);
    const { fullName, username, email, phoneNumber, password } = req.body;
    // existing logic follows
    const userExists = await User.findOne({ $or: [{ email }, { username }, { phoneNumber }] });
    if (userExists) {
      return res.status(400).json({ message: 'User with email, username or phone number already exists' });
    }

    const user = await User.create({ fullName, username, email, phoneNumber, password, role: 'User' });
    const { accessToken, refreshToken } = generateTokens(user._id, 'User');

    // Notify admins of new registration
    if (req.io) {
      req.io.to('admins').emit('admin_notification', {
        type: 'new_user_registration',
        message: `New user "${fullName}" (${email}) just registered!`,
        user: { _id: user._id, fullName, username, email },
        timestamp: new Date(),
      });
    }

    res.status(201).json({
      _id: user._id, fullName: user.fullName, username: user.username, email: user.email, role: user.role, accessToken, refreshToken
    });
  } catch (error) {
    console.error('Error in registerUser:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Register company
// @route   POST /api/auth/register/company
// @access  Public
exports.registerCompany = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const companyExists = await Company.findOne({ $or: [{ email }, { name }] });
    if (companyExists) {
      return res.status(400).json({ message: 'Company with email or name already exists' });
    }

    const company = await Company.create({ name, email, password });
    const { accessToken, refreshToken } = generateTokens(company._id, 'Company');

    res.status(201).json({
      _id: company._id, name: company.name, email: company.email, role: 'Company', accessToken, refreshToken
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login User
// @route   POST /api/auth/login/user
// @access  Public
exports.loginUser = async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be email, username, or phone

    const user = await User.findOne({
    $or: [
      { email: identifier },
      { username: identifier },
      { phoneNumber: identifier },
      { fullName: identifier }
    ]
  }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = generateTokens(user._id, user.role);

    // Notify admins of new login
    if (req.io) {
      req.io.to('admins').emit('admin_notification', {
        type: 'user_login',
        message: `User ${user.fullName || user.username} just logged in.`,
        user: { _id: user._id, name: user.fullName || user.username },
        timestamp: new Date()
      });
    }

    res.json({
      _id: user._id, fullName: user.fullName, username: user.username, email: user.email, role: user.role, profilePicture: user.profilePicture, accessToken, refreshToken
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login Company
// @route   POST /api/auth/login/company
// @access  Public
exports.loginCompany = async (req, res) => {
  try {
    const { email, password } = req.body;

    const company = await Company.findOne({ email }).select('+password');
    if (!company || !(await company.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = generateTokens(company._id, 'Company');

    res.json({
      _id: company._id, name: company.name, email: company.email, role: 'Company', logo: company.logo, accessToken, refreshToken
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login Admin
// @route   POST /api/auth/login/admin
// @access  Public
exports.loginAdmin = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    const admin = await Admin.findOne({
      $or: [{ email: identifier }, { fullName: identifier }]
    }).select('+password');
    if (!admin || !(await admin.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = generateTokens(admin._id, admin.role);

    res.json({
      _id: admin._id,
      fullName: admin.fullName,
      email: admin.email,
      role: admin.role,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Refresh Token
// @route   POST /api/auth/refresh
// @access  Public
exports.refreshToken = async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(401).json({ message: 'No refresh token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'refresh_secret');
    const { accessToken, refreshToken } = generateTokens(decoded.id, decoded.role);
    res.json({ accessToken, refreshToken });
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
};

// @desc    Get current logged in entity
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    let entity = null;
    if (req.user.role === 'User' || req.user.role === 'Admin') {
       entity = await User.findById(req.user.id) || await Admin.findById(req.user.id);
    } else if (req.user.role === 'Company') {
       entity = await Company.findById(req.user.id);
    }
    
    if(!entity) return res.status(404).json({ message: 'User not found' });
    res.json(entity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.logout = (req, res) => {
  res.json({ message: 'Logged out successfully' });
};

// @desc    Upgrade user to Premium
// @route   PUT /api/auth/upgrade
// @access  Private
exports.upgradeToPremium = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.isPremium) {
      return res.status(400).json({ message: 'You are already a Premium member' });
    }

    user.isPremium = true;
    await user.save();

    res.json({ message: 'Upgraded to Premium successfully!', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

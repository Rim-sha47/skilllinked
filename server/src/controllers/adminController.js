const User = require('../models/User');
const Company = require('../models/Company');
const Job = require('../models/Job');

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Private (Admin only)
exports.getDashboardStats = async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const companyCount = await Company.countDocuments();
    const jobCount = await Job.countDocuments();

    res.json({
      users: userCount,
      companies: companyCount,
      jobs: jobCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users for admin
// @route   GET /api/admin/users
// @access  Private (Admin only)
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a user (Admin)
// @route   POST /api/admin/users
// @access  Private (Admin only)
exports.createUser = async (req, res) => {
  try {
    const { fullName, username, email, phoneNumber, password, role } = req.body;

    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email or username already exists' });
    }

    const user = await User.create({
      fullName,
      username: username || email.split('@')[0],
      email,
      phoneNumber: phoneNumber || '0000000000',
      password: password || '123456',
      role: role || 'User',
    });

    res.status(201).json({
      _id: user._id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a user (Admin)
// @route   PUT /api/admin/users/:id
// @access  Private (Admin only)
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.fullName = req.body.fullName || user.fullName;
    user.username = req.body.username || user.username;
    user.email = req.body.email || user.email;
    user.role = req.body.role || user.role;
    user.headline = req.body.headline !== undefined ? req.body.headline : user.headline;
    user.bio = req.body.bio !== undefined ? req.body.bio : user.bio;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      fullName: updatedUser.fullName,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      updatedAt: updatedUser.updatedAt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.deleteOne();
    res.json({ message: 'User removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

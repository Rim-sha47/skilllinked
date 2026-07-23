const Company = require('../models/Company');
const User = require('../models/User');
const Job = require('../models/Job');

// @desc    Get all companies
// @route   GET /api/companies
// @access  Public
exports.getCompanies = async (req, res) => {
  try {
    const companies = await Company.find().select('-password');
    res.json(companies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single company by ID
// @route   GET /api/companies/:id
// @access  Public
exports.getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id)
      .select('-password')
      .populate('followers', 'fullName username profilePicture headline');

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const jobs = await Job.find({ company: company.name }).sort({ createdAt: -1 });

    res.json({
      ...company._doc,
      followersCount: company.followers ? company.followers.length : 0,
      jobs,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new company profile
// @route   POST /api/companies
// @access  Private/Admin
exports.createCompany = async (req, res) => {
  try {
    const { name, email, password, industry, location, about, logo, coverPhoto, website } = req.body;

    const existing = await Company.findOne({ $or: [{ email }, { name }] });
    if (existing) {
      return res.status(400).json({ message: 'Company with this name or email already exists' });
    }

    const company = new Company({
      name,
      email,
      password: password || 'defaultPass123',
      industry,
      location,
      about,
      logo,
      coverPhoto,
      website,
    });

    await company.save();
    res.status(201).json(company);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Follow a company
// @route   POST /api/companies/:id/follow
// @access  Private
exports.followCompany = async (req, res) => {
  try {
    const companyId = req.params.id;
    const userId = req.user.id;

    const company = await Company.findById(companyId);
    const user = await User.findById(userId);

    if (!company || !user) {
      return res.status(404).json({ message: 'Company or User not found' });
    }

    if (!company.followers.includes(userId)) {
      company.followers.push(userId);
      await company.save();
    }

    if (!user.followingCompanies.includes(companyId)) {
      user.followingCompanies.push(companyId);
      await user.save();
    }

    res.json({
      message: `You are now following ${company.name}`,
      followersCount: company.followers.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Unfollow a company
// @route   DELETE /api/companies/:id/follow
// @access  Private
exports.unfollowCompany = async (req, res) => {
  try {
    const companyId = req.params.id;
    const userId = req.user.id;

    const company = await Company.findById(companyId);
    const user = await User.findById(userId);

    if (!company || !user) {
      return res.status(404).json({ message: 'Company or User not found' });
    }

    company.followers = company.followers.filter(
      (id) => id.toString() !== userId
    );
    await company.save();

    user.followingCompanies = user.followingCompanies.filter(
      (id) => id.toString() !== companyId
    );
    await user.save();

    res.json({
      message: `You unfollowed ${company.name}`,
      followersCount: company.followers.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const Profile = require('../models/Profile');
const User = require('../models/User');
const Experience = require('../models/Experience');
const Education = require('../models/Education');
const Skill = require('../models/Skill');
const Certification = require('../models/Certification');

// @desc    Get current user's profile
// @route   GET /api/profiles/me
// @access  Private
exports.getMyProfile = async (req, res) => {
  try {
    let profile = await Profile.findOne({ user: req.user.id }).populate({
      path: 'user',
      select: 'fullName username profilePicture bio headline location followers following followingCompanies',
      populate: [
        { path: 'followers', select: 'fullName username profilePicture headline' },
        { path: 'following', select: 'fullName username profilePicture headline' },
        { path: 'followingCompanies', select: 'name logo industry' }
      ]
    });

    const userObj = await User.findById(req.user.id)
      .select('fullName username profilePicture bio headline location followers following followingCompanies')
      .populate('followers', 'fullName username profilePicture headline')
      .populate('following', 'fullName username profilePicture headline')
      .populate('followingCompanies', 'name logo industry');

    if (!profile) {
      profile = new Profile({ user: req.user.id, headline: userObj.headline || '', bio: userObj.bio || '', location: userObj.location || '' });
      await profile.save();
    }

    const experience = await Experience.find({ user: req.user.id }).sort({ from: -1 });
    const education = await Education.find({ user: req.user.id }).sort({ from: -1 });
    const skills = await Skill.find({ user: req.user.id });
    const certifications = await Certification.find({ user: req.user.id }).sort({ issueDate: -1 });

    res.json({
      ...profile._doc,
      user: userObj,
      followersCount: userObj.followers ? userObj.followers.length : 0,
      followingCount: userObj.following ? userObj.following.length : 0,
      followingCompaniesCount: userObj.followingCompanies ? userObj.followingCompanies.length : 0,
      experience,
      education,
      skills: skills.map(s => s.name),
      certifications
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get dashboard stats
// @route   GET /api/profiles/dashboard
// @access  Private
exports.getDashboardStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('followers profilePicture');
    const profile = await Profile.findOne({ user: req.user.id }).select('profileViews headline bio');
    
    // Calculate profile completion
    let completion = 20; // base
    if (user.profilePicture && !user.profilePicture.includes('anonymous')) completion += 20;
    if (profile?.headline) completion += 20;
    if (profile?.bio) completion += 20;
    
    const Job = require('../models/Job');
    const applications = await Job.countDocuments({ applicants: req.user.id });

    // Try to get unread messages count (requires Message model)
    const Message = require('../models/Message');
    const unreadMessages = await Message.countDocuments({ receiver: req.user.id, status: { $ne: 'seen' } });

    // Get recent activity
    const Activity = require('../models/Activity');
    const recentActivity = await Activity.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(10);

    res.json({
      profileViews: profile?.profileViews || 0,
      connections: user.followers ? user.followers.length : 0,
      applications: applications || 0,
      unreadMessages: unreadMessages || 0,
      profileCompletion: completion,
      recentActivity: recentActivity || []
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create or update user profile
// @route   POST /api/profiles
// @access  Private
exports.createOrUpdateProfile = async (req, res) => {
  try {
    const {
      headline,
      bio,
      location,
      website,
      github,
      linkedin,
      twitter,
    } = req.body;

    // Build profile object
    const profileFields = { user: req.user.id };
    if (bio !== undefined) profileFields.bio = bio;
    if (headline !== undefined) profileFields.headline = headline;
    if (location !== undefined) profileFields.location = location;
    if (website !== undefined) profileFields.website = website;

    profileFields.socialLinks = {};
    if (github !== undefined) profileFields.socialLinks.github = github;
    if (linkedin !== undefined) profileFields.socialLinks.linkedin = linkedin;
    if (twitter !== undefined) profileFields.socialLinks.twitter = twitter;

    let profile = await Profile.findOne({ user: req.user.id });

    if (profile) {
      // Update
      profile = await Profile.findOneAndUpdate(
        { user: req.user.id },
        { $set: profileFields },
        { new: true }
      );
      return res.json(profile);
    }

    // Create
    profile = new Profile(profileFields);
    await profile.save();
    res.status(201).json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all profiles
// @route   GET /api/profiles
// @access  Public
exports.getAllProfiles = async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['fullName', 'username', 'profilePicture', 'headline']);
    res.json(profiles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get profile by user ID
// @route   GET /api/profiles/user/:user_id
// @access  Public
exports.getProfileByUserId = async (req, res) => {
  try {
    const userObj = await User.findById(req.params.user_id)
      .select('fullName username profilePicture bio headline location followers following followingCompanies')
      .populate('followers', 'fullName username profilePicture headline')
      .populate('following', 'fullName username profilePicture headline')
      .populate('followingCompanies', 'name logo industry');

    if (!userObj) {
      return res.status(404).json({ message: 'User not found' });
    }

    let profile = await Profile.findOne({ user: req.params.user_id });
    if (!profile) {
      profile = { headline: userObj.headline || '', bio: userObj.bio || '', location: userObj.location || '' };
    }

    const experience = await Experience.find({ user: req.params.user_id }).sort({ from: -1 });
    const education = await Education.find({ user: req.params.user_id }).sort({ from: -1 });
    const skills = await Skill.find({ user: req.params.user_id });
    const certifications = await Certification.find({ user: req.params.user_id }).sort({ issueDate: -1 });

    res.json({
      ...(profile._doc || profile),
      user: userObj,
      followersCount: userObj.followers ? userObj.followers.length : 0,
      followingCount: userObj.following ? userObj.following.length : 0,
      followingCompaniesCount: userObj.followingCompanies ? userObj.followingCompanies.length : 0,
      experience,
      education,
      skills: skills.map(s => s.name),
      certifications
    });
  } catch (error) {
    if (error.kind == 'ObjectId') {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add profile experience
// @route   POST /api/profiles/experience
// @access  Private
exports.addExperience = async (req, res) => {
  try {
    const newExp = new Experience({
      ...req.body,
      user: req.user.id
    });
    const exp = await newExp.save();
    res.status(201).json(exp);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete profile experience
// @route   DELETE /api/profiles/experience/:exp_id
// @access  Private
exports.deleteExperience = async (req, res) => {
  try {
    const exp = await Experience.findById(req.params.exp_id);
    if (!exp) return res.status(404).json({ message: 'Experience not found' });
    if (exp.user.toString() !== req.user.id) return res.status(401).json({ message: 'User not authorized' });
    await exp.deleteOne();
    res.json({ message: 'Experience removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add profile education
// @route   POST /api/profiles/education
// @access  Private
exports.addEducation = async (req, res) => {
  try {
    const newEdu = new Education({
      ...req.body,
      user: req.user.id
    });
    const edu = await newEdu.save();
    res.status(201).json(edu);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete profile education
// @route   DELETE /api/profiles/education/:edu_id
// @access  Private
exports.deleteEducation = async (req, res) => {
  try {
    const edu = await Education.findById(req.params.edu_id);
    if (!edu) return res.status(404).json({ message: 'Education not found' });
    if (edu.user.toString() !== req.user.id) return res.status(401).json({ message: 'User not authorized' });
    await edu.deleteOne();
    res.json({ message: 'Education removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add profile skill
// @route   POST /api/profiles/skills
// @access  Private
exports.addSkill = async (req, res) => {
  try {
    const newSkill = new Skill({
      name: req.body.name,
      user: req.user.id
    });
    const skill = await newSkill.save();
    res.status(201).json(skill);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete profile skill
// @route   DELETE /api/profiles/skills/:skill_name
// @access  Private
exports.updateAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    user.profilePicture = `${baseUrl}/uploads/${req.file.filename}`;
    
    await user.save();
    res.json({ profilePicture: user.profilePicture });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteSkill = async (req, res) => {
  try {
    const skill = await Skill.findOne({ name: req.params.skill_name, user: req.user.id });
    if (!skill) return res.status(404).json({ message: 'Skill not found' });
    await skill.deleteOne();
    res.json({ message: 'Skill removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add profile certification
// @route   POST /api/profiles/certifications
// @access  Private
exports.addCertification = async (req, res) => {
  try {
    const newCert = new Certification({
      ...req.body,
      user: req.user.id
    });
    const cert = await newCert.save();
    res.status(201).json(cert);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete profile certification
// @route   DELETE /api/profiles/certifications/:cert_id
// @access  Private
exports.deleteCertification = async (req, res) => {
  try {
    const cert = await Certification.findById(req.params.cert_id);
    if (!cert) return res.status(404).json({ message: 'Certification not found' });
    if (cert.user.toString() !== req.user.id) return res.status(401).json({ message: 'User not authorized' });
    await cert.deleteOne();
    res.json({ message: 'Certification removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const Profile = require('../models/Profile');
const User = require('../models/User');
const Experience = require('../models/Experience');
const Education = require('../models/Education');
const Skill = require('../models/Skill');
const Certification = require('../models/Certification');

// @desc    Get current user's profile
// @route   GET /api/profiles/me
// @access  Private
const { scrubUserVisibility } = require('../utils/privacyHelper');

exports.getMyProfile = async (req, res) => {
  try {
    let profile = await Profile.findOne({ user: req.user.id }).populate({
      path: 'user',
      select: 'fullName username profilePicture coverPhoto bio headline location followers following followingCompanies',
      populate: [
        { path: 'followers', select: 'fullName username profilePicture headline' },
        { path: 'following', select: 'fullName username profilePicture headline' },
        { path: 'followingCompanies', select: 'name logo industry' }
      ]
    });

    const rawUser = await User.findById(req.user.id)
      .select('fullName username profilePicture coverPhoto bio headline location followers following followingCompanies privacySettings')
      .populate('followers', 'fullName username profilePicture headline')
      .populate('following', 'fullName username profilePicture headline')
      .populate('followingCompanies', 'name logo industry');
    const userObj = scrubUserVisibility(rawUser, req.user.id);


    if (!profile) {
      profile = new Profile({ user: req.user.id, headline: userObj.headline || '', bio: userObj.bio || '', location: userObj.location || '' });
      await profile.save();
    }

    const experience = await Experience.find({ user: req.user.id }).sort({ from: -1 });
    const education = await Education.find({ user: req.user.id }).sort({ from: -1 });
    const skills = await Skill.find({ user: req.user.id });
    const certifications = await Certification.find({ user: req.user.id }).sort({ issueDate: -1 });
    
    const Connection = require('../models/Connection');
    const connectionsCount = await Connection.countDocuments({
      $or: [{ sender: req.user.id }, { receiver: req.user.id }],
      status: 'accepted'
    });

    const Post = require('../models/Post');
    const postsCount = await Post.countDocuments({ user: req.user.id });

    res.json({
      ...profile._doc,
      user: userObj,
      followersCount: userObj.followers ? userObj.followers.length : 0,
      followingCount: userObj.following ? userObj.following.length : 0,
      followingCompaniesCount: userObj.followingCompanies ? userObj.followingCompanies.length : 0,
      connectionsCount,
      postsCount,
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

    const Connection = require('../models/Connection');
    const connectionsCount = await Connection.countDocuments({
      $or: [{ sender: req.user.id }, { receiver: req.user.id }],
      status: 'accepted'
    });

    // Try to get unread messages count (requires Message model)
    const Message = require('../models/Message');
    const unreadMessages = await Message.countDocuments({ 
      chat: { $exists: true }, // Ensure valid chat
      $or: [
        { receiver: req.user.id, status: { $ne: 'seen' } }, // If receiver field exists
        { readBy: { $ne: req.user.id }, sender: { $ne: req.user.id } } // If using readBy array
      ]
    });

    // Get recent activity
    const Activity = require('../models/Activity');
    const recentActivity = await Activity.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(10);

    res.json({
      profileViews: profile?.profileViews || 0,
      connections: connectionsCount || 0,
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

// @desc    Update user info (name, username, headline)
// @route   PUT /api/profiles/user-info
// @access  Private
exports.updateUserInfo = async (req, res) => {
  try {
    const { fullName, username, headline } = req.body;
    
    // Build update object
    const updates = {};
    if (fullName !== undefined) updates.fullName = fullName;
    if (headline !== undefined) updates.headline = headline;

    if (username !== undefined) {
      // Check if username is taken by another user
      const existingUser = await User.findOne({ username });
      if (existingUser && existingUser._id.toString() !== req.user.id.toString()) {
        return res.status(400).json({ message: 'Username is already taken' });
      }
      updates.username = username;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Also update Profile model's headline if it exists
    if (headline !== undefined) {
      await Profile.findOneAndUpdate({ user: req.user.id }, { $set: { headline } });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all profiles
// @route   GET /api/profiles
// @access  Public
exports.getAllProfiles = async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user');
    const viewerId = req.user ? req.user.id : null;
    const result = profiles.map(p => {
      const user = scrubUserVisibility(p.user, viewerId);
      return { ...(p._doc || p), user };
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get profile by user ID
// @route   GET /api/profiles/user/:user_id
// @access  Public
exports.getProfileByUserId = async (req, res) => {
  try {
    const rawUser = await User.findById(req.params.user_id)
      .select('fullName username profilePicture coverPhoto bio headline location followers following followingCompanies privacySettings')
      .populate('followers', 'fullName username profilePicture headline')
      .populate('following', 'fullName username profilePicture headline')
      .populate('followingCompanies', 'name logo industry');

    if (!rawUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    const userObj = scrubUserVisibility(rawUser, req.user ? req.user.id : null);

    let profile = await Profile.findOne({ user: req.params.user_id });
    if (!profile) {
      profile = { headline: rawUser.headline || '', bio: rawUser.bio || '', location: rawUser.location || '' };
    }

    const experience = await Experience.find({ user: req.params.user_id }).sort({ from: -1 });
    const education = await Education.find({ user: req.params.user_id }).sort({ from: -1 });
    const skills = await Skill.find({ user: req.params.user_id });
    const certifications = await Certification.find({ user: req.params.user_id }).sort({ issueDate: -1 });

    const Connection = require('../models/Connection');
    const connectionsCount = await Connection.countDocuments({
      $or: [{ sender: req.params.user_id }, { receiver: req.params.user_id }],
      status: 'accepted'
    });

    const Post = require('../models/POST');
    const postsCount = await Post.countDocuments({ user: req.params.user_id });

    res.json({
      ...(profile._doc || profile),
      user: userObj,
      followersCount: rawUser.followers ? rawUser.followers.length : 0,
      followingCount: rawUser.following ? rawUser.following.length : 0,
      followingCompaniesCount: rawUser.followingCompanies ? rawUser.followingCompanies.length : 0,
      connectionsCount,
      postsCount,
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

// @desc    Record a profile view
// @route   POST /api/profiles/user/:user_id/view
// @access  Private
exports.recordProfileView = async (req, res) => {
  try {
    const targetUserId = req.params.user_id;
    const currentUserId = req.user.id;

    if (targetUserId === currentUserId) {
      return res.json({ message: 'Own profile, not counted' });
    }

    const profile = await Profile.findOne({ user: targetUserId });
    
    if (profile) {
      if (!profile.viewedBy) {
        profile.viewedBy = [];
      }
      
      const ProfileView = require('../models/ProfileView');
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const recentView = await ProfileView.findOne({
        viewerId: currentUserId,
        profileOwnerId: targetUserId,
        createdAt: { $gte: yesterday }
      });

      if (!recentView) {
        await ProfileView.create({
          viewerId: currentUserId,
          profileOwnerId: targetUserId
        });
        
        if (!profile.viewedBy.includes(currentUserId)) {
          profile.viewedBy.push(currentUserId);
        }
        
        profile.profileViews = (profile.profileViews || 0) + 1;
        await profile.save();

        const Notification = require('../models/Notification');
        const User = require('../models/User');
        const currentUser = await User.findById(currentUserId).select('fullName');
        
        const notification = new Notification({
          user: targetUserId,
          sender: currentUserId,
          type: 'profile_view',
          content: `${currentUser?.fullName || 'Someone'} viewed your profile.`
        });
        await notification.save();

        if (req.io) {
          req.io.to(targetUserId.toString()).emit('notification', notification);

          req.io.to(targetUserId.toString()).emit('profile_viewed');
        }
      }
    }
    
    res.json({ message: 'Profile view recorded' });
  } catch (error) {
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

// @desc    Update user avatar
// @route   PUT /api/profiles/avatar
// @access  Private
exports.updateAvatar = async (req, res) => {
  try {
    const getFileUrl = require('../utils/getFileUrl');
    const imageUrl = getFileUrl(req);
    
    if (!imageUrl) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.profilePicture = imageUrl;
    await user.save();

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove user avatar
// @route   DELETE /api/profiles/avatar
// @access  Private
exports.removeAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.profilePicture = '';
    await user.save();

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update cover photo
// @route   PUT /api/profiles/cover-photo
// @access  Private
exports.updateCoverPhoto = async (req, res) => {
  try {
    const getFileUrl = require('../utils/getFileUrl');
    const imageUrl = getFileUrl(req);
    
    if (!imageUrl) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.coverPhoto = imageUrl;
    await user.save();

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove cover photo
// @route   DELETE /api/profiles/cover-photo
// @access  Private
exports.removeCoverPhoto = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.coverPhoto = '';
    await user.save();

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update chat preferences
// @route   PUT /api/profiles/chat-preferences
// @access  Private
exports.updateChatPreferences = async (req, res) => {
  try {
    const { global, perChat } = req.body;
    
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.chatPreferences) {
      user.chatPreferences = { global: {}, perChat: [] };
    }

    if (global) {
      user.chatPreferences.global = { ...user.chatPreferences.global, ...global };
    }

    if (perChat) {
      // perChat is an object with chatId and settings
      const { chatId, ...settings } = perChat;
      if (chatId) {
        const existingIndex = user.chatPreferences.perChat.findIndex(
          (pc) => pc.chatId && pc.chatId.toString() === chatId.toString()
        );

        if (existingIndex !== -1) {
          user.chatPreferences.perChat[existingIndex] = {
            ...user.chatPreferences.perChat[existingIndex],
            ...settings
          };
        } else {
          user.chatPreferences.perChat.push({ chatId, ...settings });
        }
      }
    }

    await user.save();
    res.json(user.chatPreferences);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload chat wallpaper
// @route   POST /api/profiles/chat-preferences/wallpaper
// @access  Private
exports.uploadChatWallpaper = async (req, res) => {
  try {
    const getFileUrl = require('../utils/getFileUrl');
    const imageUrl = getFileUrl(req);
    
    if (!imageUrl) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    res.json({ wallpaperUrl: imageUrl });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update privacy settings
// @route   PUT /api/profiles/privacy-settings
// @access  Private
exports.updatePrivacySettings = async (req, res) => {
  try {
    const {
      lastSeen,
      onlineStatus,
      profilePhoto,
      status,
      lastSeenExceptions,
      onlineStatusExceptions,
      profilePhotoExceptions,
      statusExceptions,
      lastSeenOnlyShare,
      onlineStatusOnlyShare,
      profilePhotoOnlyShare,
      statusOnlyShare
    } = req.body;

    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.privacySettings) {
      user.privacySettings = {
        lastSeen: 'Everyone',
        onlineStatus: 'Everyone',
        profilePhoto: 'Everyone',
        status: 'Everyone',
        lastSeenExceptions: [],
        onlineStatusExceptions: [],
        profilePhotoExceptions: [],
        statusExceptions: [],
        lastSeenOnlyShare: [],
        onlineStatusOnlyShare: [],
        profilePhotoOnlyShare: [],
        statusOnlyShare: []
      };
    }

    if (lastSeen !== undefined) user.privacySettings.lastSeen = lastSeen;
    if (onlineStatus !== undefined) user.privacySettings.onlineStatus = onlineStatus;
    if (profilePhoto !== undefined) user.privacySettings.profilePhoto = profilePhoto;
    if (status !== undefined) user.privacySettings.status = status;
    if (lastSeenExceptions !== undefined) user.privacySettings.lastSeenExceptions = lastSeenExceptions;
    if (onlineStatusExceptions !== undefined) user.privacySettings.onlineStatusExceptions = onlineStatusExceptions;
    if (profilePhotoExceptions !== undefined) user.privacySettings.profilePhotoExceptions = profilePhotoExceptions;
    if (statusExceptions !== undefined) user.privacySettings.statusExceptions = statusExceptions;
    if (lastSeenOnlyShare !== undefined) user.privacySettings.lastSeenOnlyShare = lastSeenOnlyShare;
    if (onlineStatusOnlyShare !== undefined) user.privacySettings.onlineStatusOnlyShare = onlineStatusOnlyShare;
    if (profilePhotoOnlyShare !== undefined) user.privacySettings.profilePhotoOnlyShare = profilePhotoOnlyShare;
    if (statusOnlyShare !== undefined) user.privacySettings.statusOnlyShare = statusOnlyShare;

    await user.save();
    res.json(user.privacySettings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload resume (PDF) to cloudinary and save URL to profile
// @route   POST /api/profiles/upload-resume
// @access  Private
exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const resumeUrl = req.file.path; // cloudinary URL

    const profile = await Profile.findOneAndUpdate(
      { user: req.user.id },
      { $set: { resume: resumeUrl } },
      { new: true, upsert: true }
    );

    res.json({ message: 'Resume uploaded successfully', resumeUrl, profile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



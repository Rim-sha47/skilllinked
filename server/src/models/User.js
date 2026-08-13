const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
    },
    username: {
      type: String,
      required: [true, 'Please add a username'],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    phoneNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['User', 'Admin'],
      default: 'User',
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    profilePicture: {
      type: String,
      default: 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg',
    },
    coverPhoto: {
      type: String,
      default: '',
    },
    bio: { type: String, default: '' },
    headline: { type: String, default: '' },
    location: { type: String, default: '' },
    website: { type: String, default: '' },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    followingCompanies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
      },
    ],
    savedPosts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
      }
    ],
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      }
    ],
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    otp: String,
    otpExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    chatPreferences: {
      global: {
        theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
        wallpaper: { type: String, default: '' },
        accentColor: { type: String, default: 'blue' },
        bubbleColorSent: { type: String, default: '' },
        bubbleColorReceived: { type: String, default: '' },
        blur: { type: Number, default: 0 },
        opacity: { type: Number, default: 100 },
        fontSize: { type: String, enum: ['small', 'medium', 'large'], default: 'medium' },
        bubbleRadius: { type: String, default: 'lg' }
      },
      perChat: [
        {
          chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' },
          wallpaper: { type: String },
          theme: { type: String },
          accentColor: { type: String },
          blur: { type: Number },
          opacity: { type: Number },
          bubbleColorSent: { type: String },
          bubbleColorReceived: { type: String }
        }
      ]
    },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date },
    isRecording: { type: Boolean, default: false },
    typingTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' },
    activeSockets: [{ type: String }],
    privacySettings: {
      lastSeen: { type: String, enum: ['Everyone', 'My Connections', 'Connections Except...', 'Only Share With...', 'Nobody'], default: 'Everyone' },
      onlineStatus: { type: String, enum: ['Everyone', 'My Connections', 'Connections Except...', 'Only Share With...', 'Nobody'], default: 'Everyone' },
      profilePhoto: { type: String, enum: ['Everyone', 'My Connections', 'Connections Except...', 'Only Share With...', 'Nobody'], default: 'Everyone' },
      status: { type: String, enum: ['Everyone', 'My Connections', 'Connections Except...', 'Only Share With...', 'Nobody'], default: 'Everyone' },
      
      lastSeenExceptions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      onlineStatusExceptions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      profilePhotoExceptions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      statusExceptions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      
      lastSeenOnlyShare: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      onlineStatusOnlyShare: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      profilePhotoOnlyShare: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      statusOnlyShare: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    }
  },
  {
    timestamps: true,
  }
);

// Encrypt password using bcrypt
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);


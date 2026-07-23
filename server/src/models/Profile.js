const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    headline: { type: String },
    bio: { type: String },
    location: { type: String },
    website: { type: String },
    socialLinks: {
      github: { type: String },
      linkedin: { type: String },
      twitter: { type: String }
    },
    resume: {
      type: String, // URL from cloudinary
    },
    portfolio: {
      type: String,
    },
    skills: [{ type: String }],
    languages: [{ type: String }],
    profileViews: { type: Number, default: 0 },
    experience: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Experience',
      }
    ],
    education: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Education',
      }
    ],
    projects: [
      {
        title: { type: String, required: true },
        description: String,
        link: String,
        startDate: Date,
        endDate: Date,
      }
    ],
    certificates: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Certification',
      }
    ]
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Profile', profileSchema);

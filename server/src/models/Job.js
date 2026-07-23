const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    requirements: {
      type: [String],
    },
    skills: {
      type: [String],
    },
    location: { type: String, required: true },
    salaryRange: String,
    type: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'],
      default: 'Full-time',
    },
    workplaceType: {
      type: String,
      enum: ['On-site', 'Hybrid', 'Remote'],
      default: 'On-site',
    },
    experienceLevel: {
      type: String,
      enum: ['Internship', 'Entry level', 'Associate', 'Mid-Senior level', 'Director', 'Executive'],
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Recruiter or Company Admin
    },
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
    },
    applicantsCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Job', jobSchema);

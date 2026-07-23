const mongoose = require('mongoose');

const experienceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please add a job title'],
    },
    company: {
      type: String,
      required: [true, 'Please add a company name'],
    },
    location: {
      type: String,
    },
    from: {
      type: Date,
      required: [true, 'Please add a start date'],
    },
    to: {
      type: Date,
    },
    current: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Experience', experienceSchema);

const mongoose = require('mongoose');

const educationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    school: {
      type: String,
      required: [true, 'Please add a school name'],
    },
    degree: {
      type: String,
      required: [true, 'Please add a degree'],
    },
    fieldOfStudy: {
      type: String,
      required: [true, 'Please add a field of study'],
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

module.exports = mongoose.model('Education', educationSchema);

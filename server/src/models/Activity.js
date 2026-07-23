const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['apply_job', 'like_post', 'comment_post', 'new_connection', 'share_post'],
      required: true,
    },
    text: {
      type: String,
      required: true, // E.g., "You applied for Senior Frontend Engineer at TechCorp."
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId, // ID of the job, post, or connection
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 30 * 24 * 60 * 60 // TTL index: automatically delete after 30 days (in seconds)
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Activity', activitySchema);

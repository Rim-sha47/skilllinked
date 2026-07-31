const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    companySender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
    },
    type: {
      type: String,
      enum: [
        'message', 
        'connection_request', 
        'connection_accepted', 
        'job_alert', 
        'post_like', 
        'post_comment', 
        'post_mention', 
        'post_share',
        'company_update',
        'new_follower',
        'profile_view'
      ],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    relatedData: {
      type: mongoose.Schema.Types.Mixed, // Can store post ID, job ID, etc.
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Notification', notificationSchema);


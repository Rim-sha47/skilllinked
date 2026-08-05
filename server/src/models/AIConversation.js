const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  files: [{
    url: String,
    filename: String,
    mimetype: String,
    size: Number
  }],
}, { timestamps: true });

const aiConversationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  messages: [messageSchema],
  title: {
    type: String,
    default: 'SkillLinked AI Conversation'
  },
  // To distinguish between standard meta AI chat and specific focused chats like Resume analysis
  category: {
    type: String,
    enum: ['general', 'resume', 'code', 'interview'],
    default: 'general'
  },
  isPinned: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('AIConversation', aiConversationSchema);

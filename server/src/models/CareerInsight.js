const mongoose = require('mongoose');

const careerInsightSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    resumeAnalysis: {
      score: { type: Number, default: 0 },
      grammarIssues: [{ type: String }],
      formattingSuggestions: [{ type: String }],
      keywordSuggestions: [{ type: String }],
      missingSkills: [{ type: String }],
      weakSections: [{ type: String }],
      improvementTips: [{ type: String }],
      lastAnalyzed: { type: Date }
    },
    recommendedSkills: [{ type: String }],
    lastSkillsUpdate: { type: Date },
    careerScoreHistory: [
      {
        score: { type: Number },
        date: { type: Date, default: Date.now }
      }
    ]
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('CareerInsight', careerInsightSchema);

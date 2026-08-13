const User = require('../models/User');
const Profile = require('../models/Profile');
const Connection = require('../models/Connection');
const Application = require('../models/Application');
const Job = require('../models/Job');
const ProfileView = require('../models/ProfileView');
const CareerInsight = require('../models/CareerInsight');
const Post = require('../models/Post');
const Skill = require('../models/Skill');
const Experience = require('../models/Experience');
const Education = require('../models/Education');
const { OpenAI } = require('openai');
const pdfParse = require('pdf-parse');
const axios = require('axios');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

exports.getInsights = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Fetch user and profile data
    const user = await User.findById(userId);
    const profile = await Profile.findOne({ user: userId });
    const skills = await Skill.find({ user: userId });
    const experience = await Experience.find({ user: userId });
    const education = await Education.find({ user: userId });
    
    // Fetch activity data
    const connectionsCount = await Connection.countDocuments({
      $or: [{ sender: userId }, { receiver: userId }],
      status: 'accepted'
    });
    
    // Count job applications via Application model
    const applicationsCount = await Application.countDocuments({ applicant: userId });
    
    // Profile Views Analytics
    const totalViews = await ProfileView.countDocuments({ profileOwnerId: userId });
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const viewsToday = await ProfileView.countDocuments({ profileOwnerId: userId, createdAt: { $gte: today } });
    
    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);
    const viewsThisWeek = await ProfileView.countDocuments({ profileOwnerId: userId, createdAt: { $gte: thisWeek } });
    
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 14);
    const viewsLastWeek = await ProfileView.countDocuments({ profileOwnerId: userId, createdAt: { $gte: lastWeek, $lt: thisWeek } });

    const thisMonth = new Date();
    thisMonth.setMonth(thisMonth.getMonth() - 1);
    const viewsThisMonth = await ProfileView.countDocuments({ profileOwnerId: userId, createdAt: { $gte: thisMonth } });

    const postsCount = await Post.countDocuments({ user: userId });
    
    // Calculate Profile Completion
    let completedItems = 0;
    const completionChecklist = {
      photo: !!(user?.profilePicture && !user.profilePicture.includes('anonymous')),
      headline: !!(profile?.headline && profile.headline.trim() !== ''),
      bio: !!(profile?.bio && profile.bio.trim() !== ''),
      skills: skills.length > 0,
      experience: experience.length > 0,
      education: education.length > 0,
      resume: !!(profile?.resume)
    };
    
    for (const key in completionChecklist) {
      if (completionChecklist[key]) completedItems++;
    }
    const profileCompletion = Math.round((completedItems / 7) * 100);

    // Fetch cached insight
    let insight = await CareerInsight.findOne({ user: userId });
    if (!insight) {
      insight = new CareerInsight({ user: userId });
    }

    // Calculate Career Score
    // Completeness (25), Skills (15), Exp (10), Edu (10), Resume (15), Activity(10), Networking(5), Applications(5), Views(5)
    let careerScore = 0;
    careerScore += (profileCompletion / 100) * 25;
    careerScore += Math.min(skills.length * 3, 15);
    careerScore += Math.min(experience.length * 5, 10);
    careerScore += Math.min(education.length * 5, 10);
    if (completionChecklist.resume) careerScore += 5; 
    if (insight?.resumeAnalysis?.score) careerScore += (insight.resumeAnalysis.score / 100) * 10;
    
    careerScore += Math.min(postsCount * 2, 10);
    careerScore += Math.min(connectionsCount * 0.5, 5);
    careerScore += Math.min(applicationsCount * 1, 5);
    careerScore += Math.min(totalViews * 0.2, 5);
    
    careerScore = Math.round(Math.min(careerScore, 100));
    
    let careerScoreLevel = 'Needs Improvement';
    if (careerScore >= 80) careerScoreLevel = 'Excellent';
    else if (careerScore >= 50) careerScoreLevel = 'Good';

    // Update career score history
    const lastHistory = insight.careerScoreHistory[insight.careerScoreHistory.length - 1];
    if (!lastHistory || (new Date() - lastHistory.date) > 86400000) { // older than 1 day
      insight.careerScoreHistory.push({ score: careerScore });
      await insight.save();
    }

    // Dynamic Daily Suggestions
    const dailySuggestions = [];
    if (!completionChecklist.photo) dailySuggestions.push("Add a professional profile photo to improve profile trust.");
    if (!completionChecklist.resume) dailySuggestions.push("Upload your resume to unlock ATS analysis.");
    if (!completionChecklist.bio) dailySuggestions.push("Complete your bio section to tell your professional story.");
    if (applicationsCount === 0) dailySuggestions.push("You haven't applied to any jobs yet. Start exploring roles that match your skills.");
    if (connectionsCount < 5) dailySuggestions.push("Grow your network! Connect with professionals in your target field.");
    if (dailySuggestions.length === 0) dailySuggestions.push("Your profile looks great! Keep networking and applying to target roles.");

    // Trending Technologies (Count from Jobs collection)
    let trendingTechnologies = ['React', 'Node.js', 'Python', 'AI']; // Fallback
    try {
      const popularJobs = await Job.find({}).limit(50).select('skills');
      const skillCounts = {};
      popularJobs.forEach(job => {
        job.skills?.forEach(s => {
          skillCounts[s] = (skillCounts[s] || 0) + 1;
        });
      });
      const sortedSkills = Object.keys(skillCounts).sort((a,b) => skillCounts[b] - skillCounts[a]);
      if (sortedSkills.length >= 4) {
        trendingTechnologies = sortedSkills.slice(0, 8);
      }
    } catch(e) { }

    // Job Recommendations based on user skills
    const userSkillNames = skills.map(s => s.name.toLowerCase());
    let matchedJobs = [];
    if (userSkillNames.length > 0) {
      // Find jobs that have at least one matching skill
      const allJobs = await Job.find({}).populate('company', 'name logo');
      matchedJobs = allJobs.map(job => {
        let matchCount = 0;
        job.skills?.forEach(sk => {
          if (userSkillNames.includes(sk.toLowerCase())) matchCount++;
        });
        const matchPercentage = job.skills?.length ? Math.round((matchCount / job.skills.length) * 100) : 0;
        return { ...job._doc, matchPercentage };
      }).filter(j => j.matchPercentage > 20).sort((a,b) => b.matchPercentage - a.matchPercentage).slice(0, 5);
    } else {
      matchedJobs = await Job.find({}).populate('company', 'name logo').limit(5).lean();
    }

    // Weekly progress
    const profileGrowth = viewsLastWeek > 0 ? Math.round(((viewsThisWeek - viewsLastWeek) / viewsLastWeek) * 100) : (viewsThisWeek > 0 ? 100 : 0);

    res.json({
      careerScore,
      careerScoreLevel,
      profileCompletion,
      completionChecklist,
      activityPulse: {
        connections: connectionsCount,
        applications: applicationsCount,
        profileViews: totalViews,
        posts: postsCount
      },
      viewsAnalytics: {
        total: totalViews,
        today: viewsToday,
        thisWeek: viewsThisWeek,
        thisMonth: viewsThisMonth
      },
      resumeAnalysis: insight?.resumeAnalysis || null,
      recommendedSkills: insight?.recommendedSkills || ['TypeScript', 'AWS', 'Docker', 'GraphQL'],
      trendingTechnologies,
      dailySuggestions,
      weeklyProgress: {
        profileGrowth: `${profileGrowth > 0 ? '+' : ''}${profileGrowth}%`,
      },
      matchedJobs
    });

  } catch (error) {
    console.error('getInsights Error:', error);
    res.status(500).json({ message: 'Server error fetching insights' });
  }
};

exports.analyzeResume = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await Profile.findOne({ user: userId });

    if (!profile || !profile.resume) {
      return res.status(400).json({ message: 'No resume found. Please upload a resume first.' });
    }

    let resumeText = '';
    try {
      const response = await axios.get(profile.resume, { responseType: 'arraybuffer' });
      const data = await pdfParse(response.data);
      resumeText = data.text;
    } catch (err) {
      console.error("PDF parse error, falling back to dummy text:", err.message);
      resumeText = `User Resume. Skills: ${profile.skills.join(', ')}. Bio: ${profile.bio}`;
    }

    if (!resumeText || resumeText.trim().length < 10) {
      resumeText = `User Resume. Skills: ${profile.skills.join(', ')}. Bio: ${profile.bio}`;
    }

    const prompt = `Analyze this resume text and provide a JSON response containing an ATS score out of 100, and lists of grammar issues, formatting suggestions, keyword suggestions, missing skills (based on standard tech roles), weak sections, and improvement tips. Format: {"score": number, "grammarIssues": [string], "formattingSuggestions": [string], "keywordSuggestions": [string], "missingSkills": [string], "weakSections": [string], "improvementTips": [string]}. Resume text: ${resumeText.substring(0, 3000)}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });

    const analysis = JSON.parse(completion.choices[0].message.content);
    analysis.lastAnalyzed = new Date();

    let insight = await CareerInsight.findOne({ user: userId });
    if (!insight) insight = new CareerInsight({ user: userId });
    
    insight.resumeAnalysis = analysis;
    
    const skillsPrompt = `Based on this resume and standard tech roles, recommend 4-6 skills to learn. Output ONLY a JSON array of strings: {"skills": ["skill1", "skill2"]}`;
    const skillsCompletion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: skillsPrompt }],
      response_format: { type: 'json_object' }
    });
    
    const recSkills = JSON.parse(skillsCompletion.choices[0].message.content).skills;
    insight.recommendedSkills = recSkills;
    insight.lastSkillsUpdate = new Date();

    await insight.save();

    res.json({ message: 'Analysis completed successfully', analysis, recommendedSkills: recSkills });

  } catch (error) {
    console.error('analyzeResume Error:', error);
    res.status(500).json({ message: 'Server error analyzing resume' });
  }
};

exports.careerCoach = async (req, res) => {
  try {
    const { message, history } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    const profile = await Profile.findOne({ user: userId });
    const skills = await Skill.find({ user: userId });
    const experience = await Experience.find({ user: userId });
    
    let contextStr = `User Profile Context: Name: ${user.fullName}. Headline: ${profile?.headline || 'None'}. Bio: ${profile?.bio || 'None'}. Skills: ${skills.map(s => s.name).join(', ') || 'None'}. Experience length: ${experience.length} roles.`;

    const messages = [
      {
        role: 'system',
        content: `You are an AI Career Coach. Use this context about the user to provide highly personalized advice: ${contextStr}. Be concise, professional, and empathetic.`,
      },
      ...(history || []),
      { role: 'user', content: message },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
    });

    res.json({ reply: completion.choices[0].message.content });
  } catch (error) {
    console.error('Career Coach Error:', error);
    res.status(500).json({ message: 'Failed to connect to AI service' });
  }
};



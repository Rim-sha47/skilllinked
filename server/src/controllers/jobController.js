const Job = require('../models/Job');
const Application = require('../models/Application');
const SavedJob = require('../models/SavedJob');
const Activity = require('../models/Activity');
const Skill = require('../models/Skill');

// @desc    Create a job
// @route   POST /api/jobs
// @access  Private (Recruiter/Company)
exports.createJob = async (req, res) => {
  try {
    const { company, title, description, requirements, skills, location, salaryRange, type, workplaceType, experienceLevel } = req.body;

    const newJob = new Job({
      company,
      title,
      description,
      requirements,
      skills,
      location,
      salaryRange,
      type,
      workplaceType,
      experienceLevel,
      postedBy: req.user.id,
    });

    const job = await newJob.save();
    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all jobs with search & filters
// @route   GET /api/jobs
// @access  Public
exports.getJobs = async (req, res) => {
  try {
    const { search, location, type, remote } = req.query;

    const query = { status: 'open' };

    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { skills: searchRegex },
        { location: searchRegex },
      ];
    }

    if (location) query.location = { $regex: location, $options: 'i' };

    // Support comma-separated types: "Full-time,Contract"
    if (type) {
      const types = type.split(',').map(t => t.trim()).filter(Boolean);
      if (types.length === 1) {
        query.type = types[0];
      } else if (types.length > 1) {
        query.type = { $in: types };
      }
    }

    if (remote === 'true') query.workplaceType = 'Remote';

    let jobs = await Job.find(query)
      .populate('company', 'name logo industry')
      .populate('postedBy', 'fullName username profilePicture')
      .sort({ createdAt: -1 })
      .limit(100);

    // If searching by company name too, filter post-populate
    if (search) {
      const lowerSearch = search.toLowerCase();
      const directMatches = await Job.find(query)
        .populate('company', 'name logo industry')
        .populate('postedBy', 'fullName username profilePicture')
        .sort({ createdAt: -1 })
        .limit(100);

      // Also find jobs where company name matches
      const companyMatchQuery = { ...query };
      delete companyMatchQuery.$or;
      const allJobs = await Job.find(companyMatchQuery)
        .populate('company', 'name logo industry')
        .populate('postedBy', 'fullName username profilePicture')
        .sort({ createdAt: -1 })
        .limit(200);

      const companyMatches = allJobs.filter(j =>
        j.company?.name?.toLowerCase().includes(lowerSearch)
      );

      // Merge and deduplicate by _id
      const seen = new Set(directMatches.map(j => j._id.toString()));
      for (const j of companyMatches) {
        if (!seen.has(j._id.toString())) {
          directMatches.push(j);
          seen.add(j._id.toString());
        }
      }
      jobs = directMatches;
    }

    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a single job by ID
// @route   GET /api/jobs/:id
// @access  Public
exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('company', 'name logo industry website')
      .populate('postedBy', 'fullName username profilePicture');

    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Apply to a job
// @route   POST /api/jobs/:id/apply
// @access  Private
exports.applyJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const existingApplication = await Application.findOne({
      job: req.params.id,
      applicant: req.user.id,
    });

    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied for this job' });
    }

    const application = new Application({
      job: req.params.id,
      applicant: req.user.id,
      resume: req.body.resume,
      coverLetter: req.body.coverLetter,
    });

    await application.save();

    // Populate job for response
    await application.populate({ path: 'job', populate: { path: 'company', select: 'name logo' } });

    // Emit notification to company admins
    if (req.io) req.io.emit('new_application', application);

    // Log Activity
    try {
      const activity = new Activity({
        user: req.user.id,
        type: 'apply_job',
        text: `You applied for ${job.title}.`,
        relatedId: job._id
      });
      await activity.save();
    } catch (e) { /* non-critical */ }

    res.status(201).json(application);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get my job applications
// @route   GET /api/jobs/applications/me
// @access  Private
exports.getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({ applicant: req.user.id })
      .populate({
        path: 'job',
        populate: { path: 'company', select: 'name logo' },
      })
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Save a job
// @route   POST /api/jobs/:id/save
// @access  Private
exports.saveJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const existing = await SavedJob.findOne({ user: req.user.id, job: req.params.id });
    if (existing) {
      return res.status(400).json({ message: 'Job already saved' });
    }

    const saved = await SavedJob.create({ user: req.user.id, job: req.params.id });
    res.status(201).json({ savedJobId: saved._id, jobId: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Unsave a job
// @route   DELETE /api/jobs/:id/save
// @access  Private
exports.unsaveJob = async (req, res) => {
  try {
    await SavedJob.findOneAndDelete({ user: req.user.id, job: req.params.id });
    res.json({ jobId: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get my saved jobs
// @route   GET /api/jobs/saved
// @access  Private
exports.getSavedJobs = async (req, res) => {
  try {
    const saved = await SavedJob.find({ user: req.user.id })
      .populate({
        path: 'job',
        populate: { path: 'company', select: 'name logo industry' },
      })
      .sort({ createdAt: -1 });

    res.json(saved);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get recommended jobs for logged-in user
// @route   GET /api/jobs/recommended
// @access  Private
exports.getRecommendedJobs = async (req, res) => {
  try {
    const userSkills = await Skill.find({ user: req.user.id });
    const skillNames = userSkills.map(s => s.name.toLowerCase());

    const allJobs = await Job.find({ status: 'open' })
      .populate('company', 'name logo industry')
      .sort({ createdAt: -1 })
      .limit(100);

    if (skillNames.length === 0) {
      // No skills — return latest 10 jobs
      return res.json(allJobs.slice(0, 10));
    }

    // Score each job by skill overlap
    const scored = allJobs.map(job => {
      const jobSkills = (job.skills || []).map(s => s.toLowerCase());
      const matchCount = jobSkills.filter(s => skillNames.includes(s)).length;
      const totalSkills = Math.max(jobSkills.length, 1);
      const score = Math.round((matchCount / totalSkills) * 100);
      return { ...job._doc, matchScore: score };
    });

    // Sort by score desc, take top 10 (include any with score > 0 first, then fill with latest)
    const withScore = scored.filter(j => j.matchScore > 0).sort((a, b) => b.matchScore - a.matchScore);
    const withoutScore = scored.filter(j => j.matchScore === 0);
    const result = [...withScore, ...withoutScore].slice(0, 10);

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

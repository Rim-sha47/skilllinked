const Job = require('../models/Job');
const Application = require('../models/Application');
const Activity = require('../models/Activity');

// @desc    Create a job
// @route   POST /api/jobs
// @access  Private (Recruiter/Company)
exports.createJob = async (req, res) => {
  try {
    const { company, title, description, requirements, location, salaryRange, type, remote } = req.body;

    const newJob = new Job({
      company,
      title,
      description,
      requirements,
      location,
      salaryRange,
      type,
      remote,
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
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { requirements: { $regex: search, $options: 'i' } },
      ];
    }
    if (location) query.location = { $regex: location, $options: 'i' };
    if (type) query.type = type;
    if (remote === 'true') query.remote = true;

    const jobs = await Job.find(query)
      .populate('company', 'name logo')
      .populate('postedBy', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(50);

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
      .populate('company', 'name logo')
      .populate('postedBy', 'name avatar');

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

    // Emit notification to company admins
    if (req.io) req.io.emit('new_application', application);

    // Log Activity
    const activity = new Activity({
      user: req.user.id,
      type: 'apply_job',
      text: `You applied for ${job.title} at ${job.company}.`,
      relatedId: job._id
    });
    await activity.save();

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


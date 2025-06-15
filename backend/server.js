const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/devboard";

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use("/uploads", express.static("uploads"));

// Create uploads directory if it doesn't exist
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, DOC, and DOCX files are allowed"), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1, // Only one file at a time
  },
});

// MongoDB Connection with error handling
mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);

// Job Schema
const jobSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  company: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  requirements: [{ type: String, trim: true }],
  location: { type: String, required: true, trim: true },
  type: {
    type: String,
    required: true,
    enum: ["Full-time", "Part-time", "Contract", "Internship"],
  },
  salary: { type: String, trim: true },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  postedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ["active", "closed"], default: "active" },
});

const Job = mongoose.model("Job", jobSchema);

// Application Schema
const applicationSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  resumeFilePath: { type: String, required: true },
  coverLetter: { type: String, trim: true },
  status: {
    type: String,
    enum: ["pending", "reviewed", "shortlisted", "rejected"],
    default: "pending",
  },
  appliedAt: { type: Date, default: Date.now },
});

// Ensure unique application per user per job
applicationSchema.index({ jobId: 1, userId: 1 }, { unique: true });

const Application = mongoose.model("Application", applicationSchema);

// SavedJob Schema
const savedJobSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  savedAt: { type: Date, default: Date.now },
});

// Ensure unique saved job per user per job
savedJobSchema.index({ jobId: 1, userId: 1 }, { unique: true });

const SavedJob = mongoose.model("SavedJob", savedJobSchema);

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

// Admin Middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

// Input validation helper
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Routes

// POST /register - Register user/admin
app.post("/register", async (req, res) => {
  try {
    const { name, email, password, role = "user" } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Name, email, and password are required" });
    }

    if (name.trim().length < 2) {
      return res
        .status(400)
        .json({ error: "Name must be at least 2 characters long" });
    }

    if (!validateEmail(email)) {
      return res
        .status(400)
        .json({ error: "Please provide a valid email address" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters long" });
    }

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ error: "Invalid role specified" });
    }

    // Check if user exists
    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "User with this email already exists" });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role,
    });
    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ error: "User with this email already exists" });
    }
    res.status(500).json({ error: "Server error during registration" });
  }
});

// POST /login - Login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    if (!validateEmail(email)) {
      return res
        .status(400)
        .json({ error: "Please provide a valid email address" });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error during login" });
  }
});

// GET /jobs - Fetch all job posts
app.get("/jobs", async (req, res) => {
  try {
    const { search, location, type, page = 1, limit = 10 } = req.query;

    const query = { status: "active" };

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { title: searchRegex },
        { company: searchRegex },
        { description: searchRegex },
      ];
    }

    if (location && location.trim()) {
      query.location = new RegExp(location.trim(), "i");
    }

    if (
      type &&
      type !== "all" &&
      ["Full-time", "Part-time", "Contract", "Internship"].includes(type)
    ) {
      query.type = type;
    }

    const pageNum = Math.max(1, Number.parseInt(page));
    const limitNum = Math.min(50, Math.max(1, Number.parseInt(limit))); // Max 50 jobs per page

    const jobs = await Job.find(query)
      .populate("postedBy", "name email")
      .sort({ postedAt: -1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum);

    const total = await Job.countDocuments(query);

    res.json({
      jobs,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      total,
    });
  } catch (error) {
    console.error("Jobs fetch error:", error);
    res.status(500).json({ error: "Server error while fetching jobs" });
  }
});

// POST /jobs - Admin: Create job
app.post("/jobs", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      title,
      company,
      description,
      requirements,
      location,
      type,
      salary,
    } = req.body;

    // Validation
    if (!title || !company || !description || !location || !type) {
      return res
        .status(400)
        .json({
          error: "Title, company, description, location, and type are required",
        });
    }

    if (title.trim().length < 3) {
      return res
        .status(400)
        .json({ error: "Job title must be at least 3 characters long" });
    }

    if (company.trim().length < 2) {
      return res
        .status(400)
        .json({ error: "Company name must be at least 2 characters long" });
    }

    if (description.trim().length < 10) {
      return res
        .status(400)
        .json({ error: "Job description must be at least 10 characters long" });
    }

    if (!["Full-time", "Part-time", "Contract", "Internship"].includes(type)) {
      return res.status(400).json({ error: "Invalid job type" });
    }

    console.log("Creating job for user:", req.user.userId);

    const job = new Job({
      title: title.trim(),
      company: company.trim(),
      description: description.trim(),
      requirements: requirements
        ? requirements
            .split("\n")
            .filter((req) => req.trim())
            .map((req) => req.trim())
        : [],
      location: location.trim(),
      type,
      salary: salary ? salary.trim() : "",
      postedBy: req.user.userId,
    });

    const savedJob = await job.save();
    console.log("Job saved:", savedJob._id);

    await savedJob.populate("postedBy", "name email");

    res.status(201).json(savedJob);
  } catch (error) {
    console.error("Job creation error:", error);
    res.status(500).json({ error: "Server error while creating job" });
  }
});

// DELETE /jobs/:id - Admin: Delete job
app.delete("/jobs/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid job ID" });
    }

    // Find the job and verify it belongs to this admin
    const job = await Job.findOne({
      _id: req.params.id,
      postedBy: req.user.userId,
    });
    if (!job) {
      return res
        .status(404)
        .json({
          error: "Job not found or you don't have permission to delete it",
        });
    }

    // Check if there are any applications for this job
    const applicationCount = await Application.countDocuments({
      jobId: req.params.id,
    });

    if (applicationCount > 0) {
      // Instead of deleting, mark as closed if there are applications
      job.status = "closed";
      await job.save();
      return res.json({
        message: "Job marked as closed due to existing applications",
        job,
      });
    }

    // Delete the job if no applications exist
    await Job.findByIdAndDelete(req.params.id);
    res.json({ message: "Job deleted successfully" });
  } catch (error) {
    console.error("Job deletion error:", error);
    res.status(500).json({ error: "Server error while deleting job" });
  }
});

// GET /jobs/:id - Job details
app.get("/jobs/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid job ID" });
    }

    const job = await Job.findById(req.params.id).populate(
      "postedBy",
      "name email"
    );
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    res.json(job);
  } catch (error) {
    console.error("Job detail fetch error:", error);
    res.status(500).json({ error: "Server error while fetching job details" });
  }
});

// POST /apply - Upload resume + apply
app.post("/apply", authenticateToken, (req, res) => {
  upload.single("resume")(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res
            .status(400)
            .json({ error: "File size too large. Maximum size is 5MB." });
        }
        return res
          .status(400)
          .json({ error: "File upload error: " + err.message });
      }
      return res.status(400).json({ error: err.message });
    }

    try {
      const { jobId, coverLetter } = req.body;

      if (!jobId) {
        return res.status(400).json({ error: "Job ID is required" });
      }

      if (!mongoose.Types.ObjectId.isValid(jobId)) {
        return res.status(400).json({ error: "Invalid job ID" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "Resume file is required" });
      }

      // Check if job exists and is active
      const job = await Job.findById(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      if (job.status !== "active") {
        return res
          .status(400)
          .json({ error: "This job is no longer accepting applications" });
      }

      // Check if user already applied
      const existingApplication = await Application.findOne({
        jobId,
        userId: req.user.userId,
      });

      if (existingApplication) {
        // Clean up uploaded file since application already exists
        fs.unlink(req.file.path, (err) => {
          if (err) console.error("Error deleting file:", err);
        });
        return res
          .status(400)
          .json({ error: "You have already applied for this job" });
      }

      const application = new Application({
        jobId,
        userId: req.user.userId,
        resumeFilePath: req.file.path,
        coverLetter: coverLetter ? coverLetter.trim() : "",
      });

      await application.save();
      await application.populate("userId", "name email");
      await application.populate("jobId", "title company");

      res.status(201).json(application);
    } catch (error) {
      console.error("Application error:", error);
      // Clean up uploaded file on error
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error("Error deleting file:", err);
        });
      }

      if (error.code === 11000) {
        return res
          .status(400)
          .json({ error: "You have already applied for this job" });
      }
      res
        .status(500)
        .json({ error: "Server error while submitting application" });
    }
  });
});

// GET /applications/:jobId - Admin: view applications for a job
app.get(
  "/applications/:jobId",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.jobId)) {
        return res.status(400).json({ error: "Invalid job ID" });
      }

      // Verify the job belongs to this admin
      const job = await Job.findOne({
        _id: req.params.jobId,
        postedBy: req.user.userId,
      });
      if (!job) {
        return res
          .status(404)
          .json({
            error:
              "Job not found or you don't have permission to view its applications",
          });
      }

      const applications = await Application.find({ jobId: req.params.jobId })
        .populate("userId", "name email")
        .populate("jobId", "title company")
        .sort({ appliedAt: -1 });

      res.json(applications);
    } catch (error) {
      console.error("Applications fetch error:", error);
      res
        .status(500)
        .json({ error: "Server error while fetching applications" });
    }
  }
);

// GET /applications - Get user's applications or all applications for admin
app.get("/applications", authenticateToken, async (req, res) => {
  try {
    let query = {};

    if (req.user.role === "admin") {
      // Admin can see applications for their jobs only
      const myJobIds = await Job.find({ postedBy: req.user.userId }).select(
        "_id"
      );
      const jobIds = myJobIds.map((job) => job._id);
      query = { jobId: { $in: jobIds } };
    } else {
      // Users can only see their own applications
      query = { userId: req.user.userId };
    }

    const applications = await Application.find(query)
      .populate("userId", "name email")
      .populate("jobId", "title company")
      .sort({ appliedAt: -1 });

    res.json(applications);
  } catch (error) {
    console.error("Applications fetch error:", error);
    res.status(500).json({ error: "Server error while fetching applications" });
  }
});

// PUT /applications/:id - Admin: update status
app.put(
  "/applications/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { status } = req.body;

      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ error: "Invalid application ID" });
      }

      if (
        !["pending", "reviewed", "shortlisted", "rejected"].includes(status)
      ) {
        return res
          .status(400)
          .json({
            error:
              "Invalid status. Must be: pending, reviewed, shortlisted, or rejected",
          });
      }

      // Find the application and verify it belongs to admin's job
      const application = await Application.findById(req.params.id).populate(
        "jobId"
      );
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }

      if (application.jobId.postedBy.toString() !== req.user.userId) {
        return res
          .status(403)
          .json({
            error: "You don't have permission to update this application",
          });
      }

      application.status = status;
      await application.save();

      await application.populate("userId", "name email");
      await application.populate("jobId", "title company");

      res.json(application);
    } catch (error) {
      console.error("Application update error:", error);
      res
        .status(500)
        .json({ error: "Server error while updating application" });
    }
  }
);

// GET /dashboard-data - Admin: return stats
app.get(
  "/dashboard-data",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      // Get stats for jobs posted by this admin only
      const totalJobs = await Job.countDocuments({ postedBy: req.user.userId });
      const activeJobs = await Job.countDocuments({
        postedBy: req.user.userId,
        status: "active",
      });

      // Get applications for jobs posted by this admin
      const myJobIds = await Job.find({ postedBy: req.user.userId }).select(
        "_id"
      );
      const jobIds = myJobIds.map((job) => job._id);

      const totalApplications = await Application.countDocuments({
        jobId: { $in: jobIds },
      });
      const pendingApplications = await Application.countDocuments({
        jobId: { $in: jobIds },
        status: "pending",
      });

      // Get applications by month for chart (for this admin's jobs only)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const applicationsByMonth = await Application.aggregate([
        {
          $match: {
            jobId: { $in: jobIds },
            appliedAt: { $gte: sixMonthsAgo },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$appliedAt" },
              month: { $month: "$appliedAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]);

      // Get applications by status for pie chart (for this admin's jobs only)
      const applicationsByStatus = await Application.aggregate([
        { $match: { jobId: { $in: jobIds } } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);

      // Get recent jobs with application counts (for this admin only)
      const recentJobs = await Job.aggregate([
        { $match: { postedBy: new mongoose.Types.ObjectId(req.user.userId) } },
        {
          $lookup: {
            from: "applications",
            localField: "_id",
            foreignField: "jobId",
            as: "applications",
          },
        },
        {
          $addFields: {
            applicationCount: { $size: "$applications" },
          },
        },
        { $sort: { postedAt: -1 } },
        { $limit: 10 },
      ]);

      res.json({
        stats: {
          totalJobs,
          activeJobs,
          totalApplications,
          pendingApplications,
        },
        charts: {
          applicationsByMonth,
          applicationsByStatus,
        },
        recentJobs,
      });
    } catch (error) {
      console.error("Dashboard data error:", error);
      res
        .status(500)
        .json({ error: "Server error while fetching dashboard data" });
    }
  }
);

// GET /my-jobs - Admin: get jobs posted by admin
app.get("/my-jobs", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const jobs = await Job.find({ postedBy: req.user.userId })
      .sort({ postedAt: -1 })
      .populate("postedBy", "name email");

    // Add application count to each job
    const jobsWithCounts = await Promise.all(
      jobs.map(async (job) => {
        const applicationCount = await Application.countDocuments({
          jobId: job._id,
        });
        return {
          ...job.toObject(),
          applicationCount,
        };
      })
    );

    console.log(
      `Found ${jobsWithCounts.length} jobs for user ${req.user.userId}`
    );
    res.json(jobsWithCounts);
  } catch (error) {
    console.error("My jobs error:", error);
    res.status(500).json({ error: "Server error while fetching your jobs" });
  }
});

// GET /resume/:filename - Serve resume files (admin only)
app.get(
  "/resume/:filename",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const filename = req.params.filename;
      const filePath = path.join(__dirname, "uploads", filename);

      // Security check: ensure filename doesn't contain path traversal
      if (
        filename.includes("..") ||
        filename.includes("/") ||
        filename.includes("\\")
      ) {
        return res.status(400).json({ error: "Invalid filename" });
      }

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "Resume file not found" });
      }

      // Verify the admin has permission to access this file
      const application = await Application.findOne({
        resumeFilePath: `uploads/${filename}`,
      }).populate("jobId");

      if (
        !application ||
        application.jobId.postedBy.toString() !== req.user.userId
      ) {
        return res
          .status(403)
          .json({ error: "You don't have permission to access this file" });
      }

      // Set appropriate headers
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      res.setHeader("Content-Type", "application/octet-stream");

      // Send file
      res.sendFile(filePath);
    } catch (error) {
      console.error("Resume download error:", error);
      res.status(500).json({ error: "Server error while downloading resume" });
    }
  }
);

// GET /check-application/:jobId - Check if user already applied
app.get("/check-application/:jobId", authenticateToken, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.jobId)) {
      return res.status(400).json({ error: "Invalid job ID" });
    }

    const application = await Application.findOne({
      jobId: req.params.jobId,
      userId: req.user.userId,
    });

    res.json({ hasApplied: !!application, application });
  } catch (error) {
    console.error("Check application error:", error);
    res
      .status(500)
      .json({ error: "Server error while checking application status" });
  }
});

// POST /save-job - Save a job
app.post("/save-job", authenticateToken, async (req, res) => {
  try {
    const { jobId } = req.body;

    if (!jobId) {
      return res.status(400).json({ error: "Job ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({ error: "Invalid job ID" });
    }

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    // Check if already saved
    const existingSave = await SavedJob.findOne({
      jobId,
      userId: req.user.userId,
    });

    if (existingSave) {
      return res.status(400).json({ error: "Job already saved" });
    }

    const savedJob = new SavedJob({
      jobId,
      userId: req.user.userId,
    });

    await savedJob.save();
    res.status(201).json({ message: "Job saved successfully" });
  } catch (error) {
    console.error("Save job error:", error);
    res.status(500).json({ error: "Server error while saving job" });
  }
});

// DELETE /save-job/:jobId - Unsave a job
app.delete("/save-job/:jobId", authenticateToken, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.jobId)) {
      return res.status(400).json({ error: "Invalid job ID" });
    }

    const result = await SavedJob.findOneAndDelete({
      jobId: req.params.jobId,
      userId: req.user.userId,
    });

    if (!result) {
      return res.status(404).json({ error: "Saved job not found" });
    }

    res.json({ message: "Job unsaved successfully" });
  } catch (error) {
    console.error("Unsave job error:", error);
    res.status(500).json({ error: "Server error while unsaving job" });
  }
});

// GET /saved-jobs - Get user's saved jobs
app.get("/saved-jobs", authenticateToken, async (req, res) => {
  try {
    const savedJobs = await SavedJob.find({ userId: req.user.userId })
      .populate("jobId")
      .sort({ savedAt: -1 });

    // Filter out any saved jobs where the job was deleted
    const validSavedJobs = savedJobs.filter((savedJob) => savedJob.jobId);

    res.json(validSavedJobs);
  } catch (error) {
    console.error("Saved jobs fetch error:", error);
    res.status(500).json({ error: "Server error while fetching saved jobs" });
  }
});

// GET /check-saved/:jobId - Check if job is saved
app.get("/check-saved/:jobId", authenticateToken, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.jobId)) {
      return res.status(400).json({ error: "Invalid job ID" });
    }

    const savedJob = await SavedJob.findOne({
      jobId: req.params.jobId,
      userId: req.user.userId,
    });

    res.json({ isSaved: !!savedJob });
  } catch (error) {
    console.error("Check saved job error:", error);
    res.status(500).json({ error: "Server error while checking saved job" });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);
  res.status(500).json({ error: "Internal server error" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`MongoDB URI: ${MONGODB_URI}`);
});

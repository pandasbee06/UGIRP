const express = require("express");
const { MongoMemoryServer } = require("mongodb-memory-server");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("./models/User");
const Complaint = require("./models/Complaint");
const Notification = require("./models/Notification");
const { authMiddleware } = require("./middleware/auth");
const { sendOtpEmail } = require("./utils/mailer");
const complaintRoutes = require("./routes/complaintRoutes");
const adminRoutes = require("./routes/adminRoutes");
const officerRoutes = require("./routes/officerRoutes");
const aiRoutes = require("./routes/aiRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

require("dotenv").config();

const app = express();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (origin.startsWith("http://localhost:")) return callback(null, true);
      if (origin.startsWith("http://127.0.0.1:")) return callback(null, true);
      return callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true, service: "ugirp-server", time: new Date().toISOString() });
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, mobile, password, role = "citizen", aadhaar } = req.body || {};
    if (!name || !email || !mobile || !password) {
      return res.status(400).json({ code: "VALIDATION_ERROR", message: "name, email, mobile, password are required" });
    }

    const emailNorm = String(email).trim().toLowerCase();
    const exists = await User.findOne({ email: emailNorm }).lean();
    if (exists) {
      return res.status(409).json({ code: "EMAIL_EXISTS", message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);

    const user = await User.create({
      name: String(name).trim(),
      email: emailNorm,
      mobile: String(mobile).trim(),
      password: passwordHash,
      role: String(role).toLowerCase() === "citizen" ? "citizen" : "citizen",
      trustScore: 50,
      aadhaar: aadhaar ? String(aadhaar).trim() : undefined,
      isVerified: true, // Auto-verified since OTP is removed
    });

    const token = jwt.sign({ sub: String(user._id), email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
    return res.status(201).json({
      ok: true,
      message: "Registered successfully.",
      token,
      user: { id: String(user._id), name: user.name, email: user.email, role: user.role, trustScore: user.trustScore }
    });
  } catch (e) {
    return res.status(500).json({ code: "INTERNAL_ERROR", message: e instanceof Error ? e.message : "Error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ code: "VALIDATION_ERROR", message: "email and password are required" });
    }
    const emailNorm = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: emailNorm });
    if (!user) {
      return res.status(401).json({ code: "INVALID_CREDENTIALS", message: "Invalid credentials" });
    }
    const ok = await bcrypt.compare(String(password), user.password);
    if (!ok) {
      return res.status(401).json({ code: "INVALID_CREDENTIALS", message: "Invalid credentials" });
    }

    const token = jwt.sign({ sub: String(user._id), email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
    return res.status(200).json({
      token,
      user: { id: String(user._id), name: user.name, email: user.email, role: user.role, trustScore: user.trustScore },
    });
  } catch (e) {
    return res.status(500).json({ code: "INTERNAL_ERROR", message: e instanceof Error ? e.message : "Error" });
  }
});

app.post("/api/auth/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body || {};
    if (!email || !otp) {
      return res.status(400).json({ code: "VALIDATION_ERROR", message: "email and otp are required" });
    }
    const emailNorm = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: emailNorm });
    if (!user || !user.otpCode || !user.otpExpiresAt) {
      return res.status(400).json({ code: "INVALID_OTP", message: "Invalid OTP" });
    }
    if (String(user.otpCode) !== String(otp).trim()) {
      return res.status(400).json({ code: "INVALID_OTP", message: "Invalid OTP" });
    }
    if (new Date(user.otpExpiresAt).getTime() < Date.now()) {
      return res.status(400).json({ code: "OTP_EXPIRED", message: "OTP expired" });
    }

    user.isVerified = true;
    user.otpCode = null;
    user.otpExpiresAt = null;
    await user.save();

    const token = jwt.sign({ sub: String(user._id), email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
    return res.status(200).json({
      token,
      user: { id: String(user._id), name: user.name, email: user.email, role: user.role, trustScore: user.trustScore },
    });
  } catch (e) {
    return res.status(500).json({ code: "INTERNAL_ERROR", message: e instanceof Error ? e.message : "Error" });
  }
});

app.post("/api/auth/resend-otp", async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ code: "VALIDATION_ERROR", message: "email is required" });

    const emailNorm = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: emailNorm });
    if (!user) return res.status(404).json({ code: "USER_NOT_FOUND", message: "User not found" });
    if (user.isVerified) return res.status(400).json({ code: "ALREADY_VERIFIED", message: "User is already verified" });

    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    user.otpCode = otpCode;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    sendOtpEmail(emailNorm, otpCode).catch(err => console.error("Failed to resend OTP", err));
    return res.status(200).json({ ok: true, message: "A new OTP has been sent to your email." });
  } catch (e) {
    return res.status(500).json({ code: "INTERNAL_ERROR", message: e instanceof Error ? e.message : "Error" });
  }
});

app.use("/api/complaints", complaintRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/officer", officerRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/api/dashboard/data", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).lean();
    if (!user) {
      return res.status(404).json({ code: "USER_NOT_FOUND", message: "User not found" });
    }

    // Auto-seed mock data if this is a brand new user so the Dashboard looks nice
    let complaintsCount = await Complaint.countDocuments({ userId: user._id });
    if (complaintsCount === 0) {
      // Seed demo complaints only if they don't already exist (query by ticketId only
      // since ticketId has a unique index — querying by userId too causes duplicate key
      // errors when a second user triggers the seed).
      await Complaint.updateOne(
        { ticketId: "CMP-DEMO1B" },
        { $setOnInsert: { userId: user._id, ticketId: "CMP-DEMO1B", title: "Pothole Repair", category: "Pothole Repair", description: "Large pothole.", location: "Sector 4, Main Road", status: "Resolved", priority: "High" } },
        { upsert: true }
      );
      await Complaint.updateOne(
        { ticketId: "CMP-DEMO2C" },
        { $setOnInsert: { userId: user._id, ticketId: "CMP-DEMO2C", title: "Streetlight Outage", category: "Streetlight Outage", description: "Light is out.", location: "Park Avenue", status: "In Progress", priority: "Medium" } },
        { upsert: true }
      );
      await Notification.insertMany([
        { userId: user._id, title: "Welcome to UGIRP", message: "Your citizen account has been successfully verified without OTP.", isUnread: false },
        { userId: user._id, title: "Status Update", message: "Action initiated for your Streetlight complaint by civic authorities.", isUnread: true }
      ]);
    }

    const complaints = await Complaint.find({ userId: user._id }).sort({ createdAt: -1 }).limit(10).lean();
    const notifications = await Notification.find({ userId: user._id }).sort({ createdAt: -1 }).limit(10).lean();

    return res.status(200).json({
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        trustScore: user.trustScore,
      },
      complaints: complaints.map(c => ({
        id: c.ticketId,
        type: c.category,
        location: c.location,
        date: new Date(c.createdAt).toLocaleDateString(),
        status: c.status,
        priority: c.priority
      })),
      notifications: notifications.map(n => ({
        id: String(n._id),
        title: n.title,
        msg: n.message,
        time: "Recently", // Simplistic mock time layout
        isNew: n.isUnread
      }))
    });
  } catch (e) {
    return res.status(500).json({ code: "INTERNAL_ERROR", message: e instanceof Error ? e.message : "Error" });
  }
});

async function start() {
  const port = Number(process.env.PORT ?? 5000);
  let mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ugirp";
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required (set it in server/.env)");
  }

  try {
    // Attempt local connection with a short timeout
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
    // eslint-disable-next-line no-console
    console.log("Connected to MongoDB (Local)");
  } catch (err) {
    // Fall back to in-memory server
    // eslint-disable-next-line no-console
    console.log("Local MongoDB not reachable. Spinning up In-Memory MongoDB fallback...");
    const mongod = await MongoMemoryServer.create();
    mongoUri = mongod.getUri();
    await mongoose.connect(mongoUri);
    // eslint-disable-next-line no-console
    console.log(`Connected to MongoDB (In-Memory Fallback): ${mongoUri}`);
  }

  // Auto-seed Admin User
  const adminExists = await User.findOne({ email: "admin@ugirp.local" });
  if (!adminExists) {
    const defaultPassword = await bcrypt.hash("admin123", 10);
    await User.create({
      name: "System Administrator",
      email: "admin@ugirp.local",
      mobile: "0000000000",
      password: defaultPassword,
      role: "admin",
      isVerified: true
    });
    console.log("Seeded Admin: admin@ugirp.local / admin123");
  }

  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on http://localhost:${port}`);
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});


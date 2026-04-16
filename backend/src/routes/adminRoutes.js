const express = require("express");
const Complaint = require("../models/Complaint");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

// ADMIN GUARD MIDDLEWARE
const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ code: "FORBIDDEN", message: "Admin access required" });
  }
  next();
};

// GET MASTER METRICS: /api/admin/stats
router.get("/stats", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const citizens = await User.countDocuments({ role: "citizen" });
    const officers = await User.countDocuments({ role: { $in: ["officer", "admin"] } });

    const totalComplaints = await Complaint.countDocuments();
    const resolvedComplaints = await Complaint.countDocuments({ status: "Resolved" });
    const pendingComplaints = await Complaint.countDocuments({ status: "Pending" });
    const inProgressComplaints = await Complaint.countDocuments({ status: "In Progress" });
    const emergencyComplaints = await Complaint.countDocuments({ priority: "Critical" });

    // Aggregate by category
    const categoryAgg = await Complaint.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ]);
    const categories = categoryAgg.map(cat => ({ name: cat._id, count: cat.count }));

    // Monthly trends (Assuming English month short names)
    // For MongoDB, extracting month can be tricky without complex aggregations. A cleaner simple way for our mock data:
    const trendAgg = await Complaint.aggregate([
      { 
        $group: { 
          _id: { $month: "$createdAt" }, 
          complaints: { $sum: 1 } 
        } 
      },
      { $sort: { "_id": 1 } }
    ]);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const trends = trendAgg.map(t => ({
      name: months[t._id - 1] || "Unknown",
      complaints: t.complaints
    }));

    // Recent 5 complaints
    const recent = await Complaint.find().sort({ createdAt: -1 }).limit(5).populate("userId", "name").lean();
    
    // Map recent to simple object
    const recentComplaints = recent.map(r => ({
      id: r._id,
      ticketId: r.ticketId,
      citizen: r.userId?.name || "Unknown",
      category: r.category,
      status: r.status,
      assignedOfficer: r.assignedOfficer,
      date: new Date(r.createdAt).toLocaleDateString()
    }));

    return res.status(200).json({
      ok: true,
      data: {
        users: { total: totalUsers, citizens, officials: officers },
        complaints: {
          total: totalComplaints,
          resolved: resolvedComplaints,
          pending: pendingComplaints,
          inProgress: inProgressComplaints,
          emergency: emergencyComplaints
        },
        categories,
        trends,
        recentComplaints
      }
    });
  } catch (e) {
    return res.status(500).json({ code: "INTERNAL_ERROR", message: e instanceof Error ? e.message : "Error" });
  }
});

// GET EXCEL EXPORT: /api/admin/export-excel
router.get("/export-excel", authMiddleware, requireAdmin, async (req, res) => {
  try {
    // Group records by Department (category) and Location
    const reportData = await Complaint.aggregate([
      {
        $group: {
          _id: { category: "$category", location: "$location" },
          totalComplaints: { $sum: 1 },
          resolvedCount: { 
            $sum: { $cond: [{ $eq: ["$status", "Resolved"] }, 1, 0] } 
          },
          emergencyCount: {
            $sum: { $cond: [{ $eq: ["$priority", "Critical"] }, 1, 0] } 
          }
        }
      },
      {
        $project: {
          _id: 0,
          Department: "$_id.category",
          Location: "$_id.location",
          "Total Complaints": "$totalComplaints",
          "Resolved Fixed": "$resolvedCount",
          "Emergency Active": "$emergencyCount"
        }
      },
      { $sort: { Department: 1, "Total Complaints": -1 } }
    ]);
    
    return res.status(200).json({ ok: true, data: reportData });
  } catch (e) {
    return res.status(500).json({ code: "INTERNAL_ERROR", message: e instanceof Error ? e.message : "Error" });
  }
});

// GET ALL USERS: /api/admin/users
router.get("/users", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    return res.status(200).json({ ok: true, data: users });
  } catch (e) {
    return res.status(500).json({ code: "INTERNAL_ERROR", message: e instanceof Error ? e.message : "Error" });
  }
});

// GET OFFICERS ONLY: /api/admin/officers
router.get("/officers", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const officers = await User.find({ role: "officer" }).select("name email _id");
    return res.status(200).json({ ok: true, data: officers });
  } catch (e) {
    return res.status(500).json({ code: "INTERNAL_ERROR", message: e instanceof Error ? e.message : "Error" });
  }
});

// FORCED ASSIGNMENT: PUT /api/admin/assign/:complaintId
router.put("/assign/:complaintId", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { officerId } = req.body;
    
    if (!officerId) {
      return res.status(400).json({ code: "BAD_REQUEST", message: "officerId is required" });
    }

    const complaint = await Complaint.findById(req.params.complaintId);
    if (!complaint) {
      return res.status(404).json({ code: "NOT_FOUND", message: "Complaint not found" });
    }

    complaint.assignedOfficer = officerId;
    complaint.status = "In Progress"; // Auto-shift to in progress when manually assigned
    await complaint.save();

    // Fire Notifications
    await Notification.create({
      userId: complaint.userId,
      title: "Officer Assigned",
      message: `An official has been assigned to investigate your complaint ${complaint.ticketId}.`,
      isUnread: true
    });
    await Notification.create({
      userId: officerId,
      title: "New Ticket Assignment",
      message: `You have been manually assigned to investigate ticket ${complaint.ticketId}.`,
      isUnread: true
    });

    return res.status(200).json({ ok: true, message: "Manual Assignment Successful", data: complaint });
  } catch (e) {
    return res.status(500).json({ code: "INTERNAL_ERROR", message: e instanceof Error ? e.message : "Error" });
  }
});

// PROMOTE/DEMOTE USER: PUT /api/admin/users/:id/role
router.put("/users/:id/role", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!["citizen", "officer", "admin"].includes(role)) {
      return res.status(400).json({ code: "BAD_REQUEST", message: "Invalid role" });
    }

    // Prevent removing the last admin or self-demotion if designed securely, 
    // but for now, hard override allowed.
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select("-password");
    if (!user) return res.status(404).json({ code: "NOT_FOUND", message: "User missing" });

    return res.status(200).json({ ok: true, message: "User role updated", data: user });
  } catch (e) {
    return res.status(500).json({ code: "INTERNAL_ERROR", message: e instanceof Error ? e.message : "Error" });
  }
});

module.exports = router;

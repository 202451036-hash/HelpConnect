
const express = require("express");
const router = express.Router();

const mongoose = require("mongoose");
const { protect } = require("../middleware/auth");
const authorize = require("../middleware/authorize");

const AssistanceRequest = require("../models/AssistanceRequest");
const DisasterAlert = require("../models/DisasterAlert");
const User = require("../models/User");

router.get("/", protect, authorize("admin"), async (req, res) => {
  try {
    const [
      totalRequests,
      pendingRequests,
      resolvedRequests,
      totalVolunteers,
      activeAlerts,
      activeSosCount
    ] = await Promise.all([
      AssistanceRequest.countDocuments(),

      AssistanceRequest.countDocuments({
        status: { $in: ["Submitted", "Under Review"] }
      }),

      AssistanceRequest.countDocuments({
        status: "Resolved"
      }),

      User.countDocuments({
        role: "volunteer"
      }),

      DisasterAlert.countDocuments({
        isActive: true
      }),

      AssistanceRequest.countDocuments({
        isSos: true,
        status: { $in: ["Submitted", "Under Review", "Assigned", "In Progress"] }
      })
    ]);

    
const requestsByType = await AssistanceRequest.aggregate([
    {
      $group: {
        _id: "$assistanceType",
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
   
const requestsByStatus = await AssistanceRequest.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
res.status(200).json({
    success: true,
    statistics: {
      totalRequests,
      pendingRequests,
      resolvedRequests,
      totalVolunteers,
      activeAlerts,
      activeSosCount,
      requestsByType,
      requestsByStatus
    }
  });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch dashboard statistics",
      error: error.message
    });
  }
});

module.exports = router;
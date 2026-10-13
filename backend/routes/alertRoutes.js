
const express = require("express");
const router = express.Router();

const DisasterAlert = require("../models/DisasterAlert");
const {protect} = require("../middleware/auth");
const authorize = require("../middleware/authorize");


// Admin creates a disaster alert
router.post("/", protect, authorize("admin"), async (req, res) => {
  try {
    const { title, description, disasterType, severity, location } = req.body;

    if (!title || !description || !disasterType || !location) {
      return res.status(400).json({
        message: "Title, description, disaster type and location are required"
      });
    }

    const alert = await DisasterAlert.create({
      title,
      description,
      disasterType,
      severity,
      location,
      createdBy: req.user._id
    });

    res.status(201).json({
      message: "Disaster alert created successfully",
      alert
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create disaster alert",
      error: error.message
    });
  }
});

// All authenticated users can view active alerts
router.get("/", protect, async (req, res) => {
  try {
    const alerts = await DisasterAlert.find({ isActive: true })
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(alerts);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch disaster alerts",
      error: error.message
    });
  }
});

// Admin can deactivate an alert
router.patch("/:id/deactivate", protect, authorize("admin"), async (req, res) => {
  try {
    if (!require("mongoose").Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid alert ID" });
    }

    const alert = await DisasterAlert.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true, runValidators: true }
    );

    if (!alert) {
      return res.status(404).json({ message: "Disaster alert not found" });
    }

    res.status(200).json({
      message: "Disaster alert deactivated",
      alert
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to deactivate alert",
      error: error.message
    });
  }
});

module.exports = router;
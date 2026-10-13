
const mongoose = require("mongoose");

const disasterAlertSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    disasterType: {
      type: String,
      enum: [
        "Flood",
        "Earthquake",
        "Cyclone",
        "Fire",
        "Landslide",
        "Other"
      ],
      required: true
    },
    severity: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium"
    },
    location: {
      type: String,
      required: true,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("DisasterAlert", disasterAlertSchema);

const mongoose = require("mongoose");

const assistanceRequestSchema = new mongoose.Schema(
  {
    requesterName: {
      type: String,
      required: true,
      trim: true
    },

    contactNumber: {
      type: String,
      required: true,
      trim: true
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null
    },

    isSos: {
      type: Boolean,
      default: false
    },

    sosType: {
      type: String,
      enum: ["water", "earth", "fire", null],
      default: null
    },

    sosSymbol: {
      type: String,
      default: null
    },

    source: {
      type: String,
      enum: ["Web", "SOS_Button", "SMS_Beacon"],
      default: "Web"
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    assistanceType: {
      type: String,
      required: true,
      enum: [
        "Food",
        "Water",
        "Medical",
        "Shelter",
        "Rescue",
        "Clothing",
        "Other"
      ]
    },

    description: {
      type: String,
      required: true,
      trim: true
    },

    location: {
      address: {
        type: String,
        required: true
      },
      latitude: {
        type: Number,
        required: true,
        min: -90,
        max: 90
      },
      longitude: {
        type: Number,
        required: true,
        min: -180,
        max: 180
      }
    },

    urgency: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium"
    },

    status: {
      type: String,
      enum: [
        "Submitted",
        "Under Review",
        "Verified",
        "Assigned",
        "In Progress",
        "Resolved",
        "Cancelled"
      ],
      default: "Submitted"
    },

    // Status change history — separate from the status field
    statusHistory: [
      {
        status: {
          type: String,
          enum: [
            "Submitted",
            "Under Review",
            "Verified",
            "Assigned",
            "In Progress",
            "Resolved",
            "Cancelled"
          ],
          required: true
        },

        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: false,
          default: null
        },

        changedAt: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "AssistanceRequest",
  assistanceRequestSchema
);
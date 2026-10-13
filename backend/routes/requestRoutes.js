
const express = require("express");
const AssistanceRequest = require("../models/AssistanceRequest");
const mongoose = require("mongoose");
const { protect } = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const { body, validationResult } = require("express-validator");

const router = express.Router();

// Submit a new assistance request

router.post(
  "/",
  protect,
  [
    body("requesterName")
      .trim()
      .notEmpty()
      .withMessage("Requester name is required"),

    body("contactNumber")
      .trim()
      .notEmpty()
      .withMessage("Contact number is required"),

    body("assistanceType")
      .isIn(["Food", "Water", "Medical", "Shelter", "Rescue", "Clothing", "Other"])
      .withMessage("Invalid assistance type"),

    body("description")
      .trim()
      .notEmpty()
      .withMessage("Description is required"),

    body("location.address")
      .trim()
      .notEmpty()
      .withMessage("Location address is required"),

    body("location.latitude")
      .isFloat({ min: -90, max: 90 })
      .withMessage("Invalid latitude"),

    body("location.longitude")
      .isFloat({ min: -180, max: 180 })
      .withMessage("Invalid longitude"),

    body("urgency")
      .optional()
      .isIn(["Low", "Medium", "High", "Critical"])
      .withMessage("Invalid urgency")
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

  
const request = await AssistanceRequest.create({
  requesterName: req.body.requesterName,
  contactNumber: req.body.contactNumber,
  assistanceType: req.body.assistanceType,
  description: req.body.description,
  location: {
    address: req.body.location.address,
    latitude: Number(req.body.location.latitude),
    longitude: Number(req.body.location.longitude)
  },
  urgency: req.body.urgency || "Medium",
  createdBy: req.user._id,
  status: "Submitted",
  statusHistory: [
    {
      status: "Submitted",
      changedBy: req.user._id,
      changedAt: new Date()
    }
  ]
});

      return res.status(201).json({
        success: true,
        message: "Assistance request created successfully",
        request
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to create assistance request",
        error: error.message
      });
    }
  }
);

router.get("/", protect, async (req, res) => {
  try {
    const { status, assistanceType } = req.query;

    // Pagination
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit, 10) || 10)
    );
    const skip = (page - 1) * limit;

    // Role-based access
    const filter = {};

    if (req.user.role === "affected_person") {
      filter.createdBy = req.user._id;
    } else if (req.user.role === "volunteer") {
      filter.assignedTo = req.user._id;
    } else if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "You are not authorized to view requests"
      });
    }

    // Optional filters
    
const { search } = req.query;

// Optional filters
if (status) {
  filter.status = status;
}

if (assistanceType) {
  filter.assistanceType = assistanceType;
}

// Search requester name, contact number, or description
if (search && search.trim()) {
  const searchRegex = new RegExp(
    search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    "i"
  );

  filter.$or = [
    { requesterName: searchRegex },
    { contactNumber: searchRegex },
    { description: searchRegex }
  ];
}

    // Fetch current page and total matching records
    const [requests, totalRequests] = await Promise.all([
      AssistanceRequest.find(filter)
        .populate("createdBy", "name email")
        .populate("assignedTo", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      AssistanceRequest.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      pagination: {
        totalRequests,
        page,
        limit,
        totalPages: Math.ceil(totalRequests / limit)
      },
      count: requests.length,
      requests
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch assistance requests",
      error: error.message
    });
  }
});

// Get assistance requests

router.get("/", protect, async (req, res) => {
    try {
      const filter = {};
      const { status, assistanceType } = req.query;
  
      // Apply role-based access first
      if (req.user.role === "affected_person") {
        filter.createdBy = req.user._id;
      } else if (req.user.role === "volunteer") {
        filter.assignedTo = req.user._id;
      }
  
      // Optional filters
      if (status) {
        filter.status = status;
      }
  
      if (assistanceType) {
        filter.assistanceType = assistanceType;
      }
  
      const requests = await AssistanceRequest.find(filter)
        .populate("createdBy", "name email")
        .populate("assignedTo", "name email")
        .sort({ createdAt: -1 });
  
      res.status(200).json(requests);
    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch assistance requests",
        error: error.message
      });
    }
  }); 


 // Assign a request to a volunteer (admin only)
 router.patch(
    "/:id/assign",
    protect,
    authorize("admin"),
    async (req, res) => {
        try {
            if (!mongoose.isValidObjectId(req.params.id)) {
                return res.status(400).json({
                    message: "Invalid request ID",
                });
            }

            const { volunteerId } = req.body;

            if (!mongoose.isValidObjectId(volunteerId)) {
                return res.status(400).json({
                    message: "Invalid volunteer ID",
                });
            }

            const volunteer = await mongoose.model("User").findOne({
                _id: volunteerId,
                role: "volunteer",
            });

            if (!volunteer) {
                return res.status(404).json({
                    message: "Volunteer not found",
                });
            }

            const request = await AssistanceRequest.findByIdAndUpdate(
                req.params.id,
                {
                    assignedTo: volunteer._id,
                    status: "Assigned",
                },
                { new: true, runValidators: true }
            );

            if (!request) {
                return res.status(404).json({
                    message: "Assistance request not found",
                });
            }

            return res.status(200).json({
                message: "Volunteer assigned successfully",
                request,
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                message: "Failed to assign volunteer",
            });
        }
    }
);


router.get("/nearby", protect, authorize("volunteer", "admin"), async (req, res) => {
  try {
    const latitude = Number(req.query.latitude);
    const longitude = Number(req.query.longitude);
    const radius = Number(req.query.radius || 10);

    if (
      req.query.latitude === undefined ||
      req.query.longitude === undefined ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180 ||
      !Number.isFinite(radius) ||
      radius <= 0 ||
      radius > 100
    ) {
      return res.status(400).json({
        message: "Provide valid latitude, longitude, and radius (1–100 km)"
      });
    }

    const latRange = radius / 111;
    const lonRange = radius / (111 * Math.max(Math.cos(latitude * Math.PI / 180), 0.01));

    const requests = await AssistanceRequest.find({
      status: { $in: ["Submitted", "Under Review", "Verified"] },
      assignedTo: null,
      "location.latitude": {
        $gte: latitude - latRange,
        $lte: latitude + latRange
      },
      "location.longitude": {
        $gte: longitude - lonRange,
        $lte: longitude + lonRange
      }
    });

    const toRadians = degrees => degrees * Math.PI / 180;

    const nearbyRequests = requests
      .map(request => {
        const latDiff = toRadians(request.location.latitude - latitude);
        const lonDiff = toRadians(request.location.longitude - longitude);

        const a =
          Math.sin(latDiff / 2) ** 2 +
          Math.cos(toRadians(latitude)) *
          Math.cos(toRadians(request.location.latitude)) *
          Math.sin(lonDiff / 2) ** 2;

        const distanceKm =
          6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return {
          ...request.toObject(),
          distanceKm: Number(distanceKm.toFixed(2))
        };
      })
      .filter(request => request.distanceKm <= radius)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    res.status(200).json({
      success: true,
      count: nearbyRequests.length,
      radiusKm: radius,
      requests: nearbyRequests
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch nearby requests",
      error: error.message
    });
  }
});

// Get a single assistance request by ID
router.get("/:id", protect, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid request ID",
            });
        }

        const request = await AssistanceRequest.findById(
            req.params.id
        );

        if (!request) {
            return res.status(404).json({
                message: "Assistance request not found",
            });
        }

        // Affected people can only view their own requests
        if (
            req.user.role === "affected_person" &&
            request.createdBy?.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({
                message: "You cannot access another user's request",
            });
        }

        return res.status(200).json(request);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Failed to fetch request",
        });
    }
});

// Update assistance request status (admin only)


router.patch("/:id/status", protect, async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const { id } = req.params;
    const { status } = req.body;

    // 1. Validate request ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid request ID"
      });
    }

    // 2. Validate status
    const allowedStatuses = [
      "Submitted",
      "Under Review",
      "Verified",
      "Assigned",
      "In Progress",
      "Resolved",
      "Cancelled"
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status"
      });
    }

    // 3. Find the assistance request
    const request = await AssistanceRequest.findById(id);

    if (!request) {
      return res.status(404).json({
        message: "Assistance request not found"
      });
    }

    // 4. Admin can update any request
    if (req.user.role === "admin") {
      request.status = status;

      // Record the status change
      request.statusHistory.push({
        status: status,
        changedBy: req.user._id,
        changedAt: new Date()
      });

      await request.save();

      return res.status(200).json({
        message: "Request status updated successfully",
        request
      });
    }

    // 5. Only assigned volunteers can update their requests
    if (req.user.role === "volunteer") {
      if (
        !request.assignedTo ||
        request.assignedTo.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({
          message: "You can only update requests assigned to you"
        });
      }

      // Volunteers can only move assigned work forward
      const volunteerTransitions = {
        "Assigned": ["In Progress"],
        "In Progress": ["Resolved"]
      };

      const allowedNextStatuses =
        volunteerTransitions[request.status] || [];

      if (!allowedNextStatuses.includes(status)) {
        return res.status(400).json({
          message: `Cannot change status from ${request.status} to ${status}`
        });
      }

      request.status = status;

      // Record the status change
      request.statusHistory.push({
        status: status,
        changedBy: req.user._id,
        changedAt: new Date()
      });

      await request.save();

      return res.status(200).json({
        message: "Request status updated successfully",
        request
      });
    }

    // 6. Affected people cannot update status through this endpoint
    return res.status(403).json({
      message: "You are not authorized to update request status"
    });

  } catch (error) {
    return res.status(500).json({
      message: "Failed to update request status",
      error: error.message
    });
  }
});
module.exports = router;
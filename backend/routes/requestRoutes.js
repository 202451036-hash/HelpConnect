
const express = require("express");
const AssistanceRequest = require("../models/AssistanceRequest");
const User = require("../models/User");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { protect } = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const { body, validationResult } = require("express-validator");

const router = express.Router();

// Emergency SOS Beacon Endpoint (Water, Earth, Fire)
router.post("/sos", async (req, res) => {
  try {
    const { sosType, latitude, longitude, address, requesterName, contactNumber, description } = req.body;

    if (!sosType || !["water", "earth", "fire"].includes(sosType.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing SOS type. Must be 'water', 'earth', or 'fire'."
      });
    }

    const typeKey = sosType.toLowerCase();

    // Map SOS types to symbol & assistance type
    const sosConfig = {
      water: {
        symbol: "💧 Water Crisis",
        assistanceType: "Water",
        defaultDesc: "🚨 EMERGENCY SOS: WATER CRISIS / FLOOD BEACON TRIGGERED. Affected person stranded or in acute danger from flood/water crisis."
      },
      earth: {
        symbol: "🌍 Earthquake",
        assistanceType: "Rescue",
        defaultDesc: "🚨 EMERGENCY SOS: EARTHQUAKE BEACON TRIGGERED. Affected person trapped or endangered by seismic shock / structural collapse."
      },
      fire: {
        symbol: "🔥 Fire Disaster",
        assistanceType: "Rescue",
        defaultDesc: "🚨 EMERGENCY SOS: FIRE DISASTER BEACON TRIGGERED. Immediate fire fighting and emergency rescue evacuation required."
      }
    };

    const config = sosConfig[typeKey];

    // Check optional authentication token
    let currentUser = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        currentUser = await User.findById(decoded.userId).select("-password");
      } catch (err) {
        // Continue even if token error so emergency SOS is never blocked
      }
    }

    const finalLat = Number(latitude) || 23.2156;
    const finalLng = Number(longitude) || 72.6369;
    const finalAddress = address && address.trim() 
      ? address.trim() 
      : `GPS Coordinates: [${finalLat.toFixed(5)}, ${finalLng.toFixed(5)}]`;

    const finalName = currentUser?.name || (requesterName && requesterName.trim()) || "Affected Person (SOS Beacon)";
    const finalContact = (contactNumber && contactNumber.trim()) || currentUser?.email || "Emergency Line / GPS Signal";
    const finalDesc = (description && description.trim()) || config.defaultDesc;

    const request = await AssistanceRequest.create({
      requesterName: finalName,
      contactNumber: finalContact,
      assistanceType: config.assistanceType,
      description: finalDesc,
      location: {
        address: finalAddress,
        latitude: finalLat,
        longitude: finalLng
      },
      urgency: "Critical",
      status: "Submitted",
      isSos: true,
      sosType: typeKey,
      sosSymbol: config.symbol,
      source: "SOS_Button",
      createdBy: currentUser ? currentUser._id : null,
      statusHistory: [
        {
          status: "Submitted",
          changedBy: currentUser ? currentUser._id : null,
          changedAt: new Date()
        }
      ]
    });

    return res.status(201).json({
      success: true,
      message: `SOS Emergency Beacon (${config.symbol}) dispatched to Admin and Responders!`,
      request
    });
  } catch (error) {
    console.error("SOS dispatch error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to dispatch SOS beacon",
      error: error.message
    });
  }
});

// Get Active SOS Beacons
router.get("/sos/active", protect, async (req, res) => {
  try {
    const activeSosRequests = await AssistanceRequest.find({
      isSos: true,
      status: { $in: ["Submitted", "Under Review", "Assigned", "In Progress"] }
    })
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 })
      .limit(20);

    return res.status(200).json({
      success: true,
      count: activeSosRequests.length,
      sosRequests: activeSosRequests
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch active SOS requests",
      error: error.message
    });
  }
});

// Emergency Offline SMS Beacon Ingest Endpoint
router.post("/sms-ingest", protect, authorize("admin", "volunteer"), async (req, res) => {
  try {
    const { 
      rawSmsText, 
      sosType: explicitType, 
      latitude: explicitLat, 
      longitude: explicitLng, 
      requesterName: explicitName, 
      contactNumber: explicitPhone, 
      notes 
    } = req.body;

    let sosType = explicitType || "water";
    let latitude = explicitLat !== undefined && explicitLat !== null ? Number(explicitLat) : null;
    let longitude = explicitLng !== undefined && explicitLng !== null ? Number(explicitLng) : null;
    let requesterName = explicitName && explicitName.trim() ? explicitName.trim() : null;
    let contactNumber = explicitPhone && explicitPhone.trim() ? explicitPhone.trim() : null;
    let extractedNotes = notes || "";

    if (rawSmsText && typeof rawSmsText === "string") {
      const raw = rawSmsText.trim();

      // 1. Check compact format: HC#SOS#[TYPE]#[LAT],[LNG]#[NAME]#[PHONE]#[NOTES]
      const compactMatch = raw.match(/HC#SOS#([A-Za-z]+)#([-+]?[0-9]*\.?[0-9]+)[,\s]+([-+]?[0-9]*\.?[0-9]+)(?:#([^#\n]+))?(?:#([^#\n]+))?(?:#([^#\n]+))?/i);
      if (compactMatch) {
        const rawType = compactMatch[1].toLowerCase();
        if (rawType.includes("water") || rawType.includes("flood")) sosType = "water";
        else if (rawType.includes("earth") || rawType.includes("quake") || rawType.includes("collapse")) sosType = "earth";
        else if (rawType.includes("fire") || rawType.includes("blaze")) sosType = "fire";

        if (latitude === null) latitude = parseFloat(compactMatch[2]);
        if (longitude === null) longitude = parseFloat(compactMatch[3]);
        if (!requesterName && compactMatch[4]) requesterName = compactMatch[4].trim();
        if (!contactNumber && compactMatch[5]) contactNumber = compactMatch[5].trim();
        if (!extractedNotes && compactMatch[6]) extractedNotes = compactMatch[6].trim();
      } else {
        // 2. Unstructured text parser
        const lower = raw.toLowerCase();
        if (lower.includes("fire") || lower.includes("blaze")) sosType = "fire";
        else if (lower.includes("earth") || lower.includes("quake") || lower.includes("collapse")) sosType = "earth";
        else if (lower.includes("water") || lower.includes("flood") || lower.includes("drown")) sosType = "water";

        // Coordinates regex
        if (latitude === null || longitude === null) {
          const coordRegex = /(?:maps\.google\.com\/\?q=|gps[:\s]*|loc[:\s]*|coordinates[:\s]*)?([-+]?\d{1,2}\.\d+)[,\s]+([-+]?\d{1,3}\.\d+)/i;
          const match = raw.match(coordRegex);
          if (match) {
            latitude = parseFloat(match[1]);
            longitude = parseFloat(match[2]);
          }
        }

        if (!requesterName) {
          const nameMatch = raw.match(/(?:name|victim|from)[:\s]+([^\n,]+)/i);
          if (nameMatch) requesterName = nameMatch[1].trim();
        }

        if (!contactNumber) {
          const phoneMatch = raw.match(/(?:phone|contact|tel|mobile)[:\s]+([0-9+\s\-()]{7,20})/i);
          if (phoneMatch) contactNumber = phoneMatch[1].trim();
        }

        if (!extractedNotes) extractedNotes = raw;
      }
    }

    // Fallbacks if not detected
    const finalLat = (latitude !== null && !isNaN(latitude)) ? latitude : 23.2156;
    const finalLng = (longitude !== null && !isNaN(longitude)) ? longitude : 72.6369;
    const finalName = requesterName || "Affected Person (Offline SMS)";
    const finalContact = contactNumber || "Received via Cellular SMS / Radio";

    const typeKey = ["water", "earth", "fire"].includes(String(sosType).toLowerCase()) 
      ? String(sosType).toLowerCase() 
      : "water";

    const sosConfig = {
      water: { symbol: "💧 Water Crisis", assistanceType: "Water" },
      earth: { symbol: "🌍 Earthquake", assistanceType: "Rescue" },
      fire: { symbol: "🔥 Fire Disaster", assistanceType: "Rescue" }
    };

    const config = sosConfig[typeKey];

    const description = `🚨 EMERGENCY OFFLINE SMS BEACON INGESTED:
• Type: ${config.symbol}
• Survivor Name: ${finalName}
• Inbound Phone: ${finalContact}
• Extracted Coordinates: ${finalLat.toFixed(5)}° N, ${finalLng.toFixed(5)}° E
${extractedNotes ? `• SMS Payload/Notes: "${extractedNotes}"` : ""}
[Decoded and dispatched automatically via HelpConnect Offline SMS Ingest System]`;

    const request = await AssistanceRequest.create({
      requesterName: finalName,
      contactNumber: finalContact,
      assistanceType: config.assistanceType,
      description,
      location: {
        address: `SMS Beacon Coordinates: [${finalLat.toFixed(5)}, ${finalLng.toFixed(5)}]`,
        latitude: finalLat,
        longitude: finalLng
      },
      urgency: "Critical",
      status: "Submitted",
      isSos: true,
      sosType: typeKey,
      sosSymbol: config.symbol,
      source: "SMS_Beacon",
      createdBy: req.user ? req.user._id : null,
      statusHistory: [
        {
          status: "Submitted",
          changedBy: req.user ? req.user._id : null,
          changedAt: new Date()
        }
      ]
    });

    return res.status(201).json({
      success: true,
      message: `Offline SMS Beacon (${config.symbol}) successfully decoded and imported as Critical SOS ticket!`,
      request
    });
  } catch (error) {
    console.error("SMS Ingest error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to ingest offline SMS beacon",
      error: error.message
    });
  }
});

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

if (req.query.isSos !== undefined) {
  filter.isSos = req.query.isSos === 'true';
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
        .sort({ isSos: -1, createdAt: -1 })
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
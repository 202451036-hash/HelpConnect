const bcrypt = require("bcryptjs");
const User = require("./models/User");
const DisasterAlert = require("./models/DisasterAlert");
const AssistanceRequest = require("./models/AssistanceRequest");

async function seedInitialData() {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) return;

    console.log("Seeding initial HelpConnect demonstration data...");

    const hashedPassword = await bcrypt.hash("Password123!", 12);

    const admin = await User.create({
      name: "HelpConnect Admin",
      email: "admin@helpconnect.local",
      password: hashedPassword,
      role: "admin"
    });

    const volunteer = await User.create({
      name: "David Clark (Responder)",
      email: "volunteer@helpconnect.local",
      password: hashedPassword,
      role: "volunteer"
    });

    const affected = await User.create({
      name: "Sarah Jenkins (Survivor)",
      email: "affected@helpconnect.local",
      password: hashedPassword,
      role: "affected_person"
    });

    // Seed Disaster Alerts
    const alert1 = await DisasterAlert.create({
      title: "Flash Flood Warning - Low-Lying Sector",
      description: "Water levels rising above safety threshold. Follow evacuation routes to designated relief shelters.",
      disasterType: "Flood",
      severity: "Critical",
      location: "Sector 4, Gandhinagar",
      isActive: true,
      createdBy: admin._id
    });

    await DisasterAlert.create({
      title: "Structural Fire Containment - Industrial Zone",
      description: "Fire emergency teams deployed. Avoid perimeter within 2 km.",
      disasterType: "Fire",
      severity: "High",
      location: "East Industrial Park",
      isActive: true,
      createdBy: admin._id
    });

    // Seed Assistance Requests
    await AssistanceRequest.create({
      requesterName: "Sarah Jenkins",
      contactNumber: "9876543210",
      assistanceType: "Food",
      description: "Urgent need for clean drinking water and food rations for a family of four stranded on 2nd floor.",
      location: {
        address: "Block B, Gandhinagar, Gujarat",
        latitude: 23.2156,
        longitude: 72.6369
      },
      urgency: "High",
      status: "Submitted",
      createdBy: affected._id,
      statusHistory: [
        {
          status: "Submitted",
          changedBy: affected._id,
          changedAt: new Date(Date.now() - 3600000)
        }
      ]
    });

    await AssistanceRequest.create({
      requesterName: "Robert Miller",
      contactNumber: "9123456789",
      assistanceType: "Medical",
      description: "Elderly person requiring insulin supplies and emergency first aid after evacuation.",
      location: {
        address: "Relief Camp 2, Near Civil Hospital",
        latitude: 23.2200,
        longitude: 72.6400
      },
      urgency: "Critical",
      status: "Assigned",
      assignedTo: volunteer._id,
      createdBy: affected._id,
      statusHistory: [
        {
          status: "Submitted",
          changedBy: affected._id,
          changedAt: new Date(Date.now() - 7200000)
        },
        {
          status: "Assigned",
          changedBy: admin._id,
          changedAt: new Date(Date.now() - 1800000)
        }
      ]
    });

    console.log("Demonstration data seeded successfully!");
  } catch (error) {
    console.error("Failed to seed initial data:", error.message);
  }
}

module.exports = seedInitialData;

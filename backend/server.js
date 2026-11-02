
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const requestRoutes = require("./routes/requestRoutes");
const authRoutes = require("./routes/authRoutes");
const alertRoutes = require("./routes/alertRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/requests", requestRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "HelpConnect backend is running!",
        database: mongoose.connection.readyState === 1
            ? "Connected"
            : "Disconnected"
    });
});

const seedInitialData = require("./seed");

const PORT = process.env.PORT || 5000;

async function startServer() {
    let mongoUri = process.env.MONGODB_URI;

    try {
        console.log("Attempting connection to MongoDB...");
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2500 });
        console.log("MongoDB connected successfully to:", mongoUri);
    } catch (primaryError) {
        console.warn("Primary MongoDB connection failed (" + primaryError.message + ").");
        console.log("Starting embedded In-Memory MongoDB Server for development...");

        try {
            const { MongoMemoryServer } = require("mongodb-memory-server");
            const mongod = await MongoMemoryServer.create();
            mongoUri = mongod.getUri();
            await mongoose.connect(mongoUri);
            console.log("Embedded In-Memory MongoDB connected successfully at:", mongoUri);
        } catch (memError) {
            console.error("Failed to start In-Memory MongoDB:", memError.message);
            process.exit(1);
        }
    }

    try {
        await seedInitialData();

        app.listen(PORT, () => {
            console.log(`HelpConnect backend running on port ${PORT}`);
        });
    } catch (err) {
        console.error("Server startup error:", err.message);
        process.exit(1);
    }
}

startServer();
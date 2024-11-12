const express = require("express");
const path = require("path");

const app = express();
const hotelRoutes = require("./routes/hotelRoutes");
const imageRoutes = require("./routes/imageRoutes");

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/hotel", hotelRoutes);
app.use("/images", imageRoutes);

module.exports = app;

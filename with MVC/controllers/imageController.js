const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { readHotelsFile, writeHotelsFile } = require("../models/hotelModel");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const hotelId = req.body.hotel_id;
    const uploadDir = path.join(__dirname, "../uploads", hotelId);

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
}).array("images", 10);

async function uploadImages(req, res) {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ error: "Image upload failed" });
    }

    const hotelId = req.body.hotel_id;
    const imageUrls = req.files.map((file) => `/uploads/${hotelId}/${file.filename}`);
    
    try {
      const hotels = readHotelsFile();
      const hotel = hotels.find((hotel) => hotel.hotel_id == hotelId);
      if (!hotel) return res.status(404).json({ message: "Hotel not found" });

      hotel.images.push(...imageUrls);
      writeHotelsFile(hotels);
      
      res.status(200).json({ message: "Images uploaded successfully", imageUrls });
    } catch (error) {
      res.status(500).json({ error: "Failed to update hotel record" });
    }
  });
}

module.exports = { uploadImages };

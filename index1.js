const express = require("express");
const app = express();
const fs = require("fs");
const slugify = require('slugify')
const multer = require("multer");
const path = require("path");
const port = 8000;


app.use(express.json());

// Set up storage for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const hotelId = req.body.hotelId; // Assuming `hotelId` is passed in the request body
    if (!hotelId) {
      return cb(new Error('hotelId is required'));
    }

    // Define the directory based on `hotelId`
    const uploadDir = path.join(__dirname, 'uploads', hotelId);

    // Ensure the directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname); 
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
}).array("images", 10);

async function updateHotelImages(hotelId, imageUrls) {
  console.log(`Hotel ${hotelId} updated with images:`, imageUrls);
}

// -------------------------------------     All API     -----------------------------------

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// ---------------read and parse JSON file----------------------
function readHotelsFile() {
  const data = fs.readFileSync("hotelinfo.json", "utf8");
  return JSON.parse(data);
}

// ---------------write JSON file----------------------
function writeHotelsFile(data) {
  fs.writeFileSync("hotelinfo.json", JSON.stringify(data, null, 2), "utf8");
}

//-------------------------------          Get All Hotels          -----------------------------
app.get("/hotels", async (req, res) => {
  let hotel = await readHotelsFile();
  return res
    .status(201)
    .json({ message: "Find all Hotels successfully", hotel: hotel });
});

//--------------                           Post A Hotel            -----------------------------
app.post("/hotels", async (req, res) => {
  const newHotelData = await req.body;
  const hotelsData = await readHotelsFile();

  // Check if hotel_id already exists
  if (hotelsData.some((hotel) => hotel.hotel_id === newHotelData.hotel_id)) {
    return res
      .status(400)
      .json({ message: "Hotel with this ID already exists" });
  }

  await hotelsData.push(newHotelData);
  writeHotelsFile(hotelsData);

  return res
    .status(201)
    .json({ message: "Hotel added successfully", hotel: newHotelData });
});

//--------------                        Get specific Hotel        ----------------------------------
app.get("/hotels/:id", async (req, res) => {
  hotels = await readHotelsFile();
  let existHotel = hotels.find((hotel) => hotel.hotel_id == req.params.id);
  if (existHotel) {
    return res
      .status(200)
      .json({ message: "Find this Hotel successfully", hotel: existHotel });
  } else {
    return res.status(404).json({ message: "Cound Not Find This Hotel" });
  }
});

//-----------------------------        Put specific Hotel        ----------------------------------
app.put("/hotels/:id", (req, res) => {
  const hotelUpdateData = req.body;
  let hotels = readHotelsFile();
  const hotelIndex = hotels.findIndex(
    (hotel) => hotel.hotel_id == req.params.id
  );

  if (hotelIndex == -1) {
    return res.send("This Hotel doesn't exists");
  } else {
    for (let x in hotelUpdateData) {
      hotels[hotelIndex][x] = hotelUpdateData[x];
    }

    writeHotelsFile(hotels);
    return res.status(200).json({
      message: "Hotel updated successfully",
      hotel: hotels[hotelIndex],
    });
  }
});

// ----------------------         POST /images endpoint       ---------------------------------
app.post("/images", async (req, res) => {
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(500).json({ error: "Image upload failed" });
    }

    // Assuming hotelId is sent as a parameter in the request body
    const hotelId = req.body.hotel_id;
    // Array of image URLs to save in the hotel record
    const imageUrls = req.files.map(
      (file) => `/uploads/${hotelId}/${file.filename}`
    );

    try {
      let hotels = readHotelsFile();
      const hotelIndex = hotels.findIndex(
        (hotel) => hotel.hotel_id == hotelId
      );
      imageUrls.map((imageUrl)=>hotels[hotelIndex].images.push(imageUrl))
      writeHotelsFile(hotels);
      // Update hotel record with the image URLs
      await updateHotelImages(hotelId, imageUrls);
      res.status(200).json({
        message: "Images uploaded successfully",
        imageUrls: [imageUrls],
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to update hotel record" });
    }
  });
});

// ----------------------  For Image----------------------------------

app.listen(port, () => {
  console.log(`Server Running on  ${port}`);
});

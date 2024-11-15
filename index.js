const express = require("express");
const app = express();
const fs = require("fs");
const multer = require("multer");
const path = require("path");
const slugify = require('slugify')
const port = 8000;

app.use(express.json());

// Set up storage for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const hotelId = req.body.hotel_id;
    if (!hotelId) {
      return cb(new Error("hotel_id is required"));
    }

    const uploadDir = path.join(__dirname, "uploads", hotelId);

    // Create directory if it does not exist
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
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
}).array("images", 10);

async function updateHotelImages(hotelId, imageUrls) {
  console.log(`Hotel ${hotelId} updated with images:`, imageUrls);
}

// ---------------read and parse JSON file----------------------
function readHotelsFile() {
  const data = fs.readFileSync("hotelinfo.json", "utf8");
  return JSON.parse(data);
}

// ---------------write JSON file----------------------
function writeHotelsFile(data) {
  fs.writeFileSync("hotelinfo.json", JSON.stringify(data, null, 2), "utf8");
}

// -------------------------------------     All API     -----------------------------------

app.get("/", (req, res) => {
  res.send("Hello World!");
});

//-------------------------------          Get All Hotels          -----------------------------
app.get("/hotel", async (req, res) => {
  let hotel = await readHotelsFile();
  return res
    .status(201)
    .json({ message: "Find all Hotels successfully", hotel: hotel });
});

//--------------                           Post A Hotel            -----------------------------
app.post("/hotel", async (req, res) => {
  const newHotelData = await req.body;

  const {
    hotel_id,
    title,
    images,
    description,
    guest_count,
    bedroom_count,
    bathroom_count,
    amenities,
    host_information,
    address,
    latitude,
    longitude,
    room_title,
  } = newHotelData;
  if (
    !hotel_id ||
    !title ||
    !images ||
    !description ||
    !guest_count ||
    !bedroom_count ||
    !bathroom_count ||
    !amenities ||
    !host_information ||
    !address ||
    !latitude ||
    !longitude ||
    !room_title
  ) {
    return res
      .status(400)
      .json({
        message:
          "Requere all those fields hotel_id,title,images,description,guest_count,bedroom_count,bathroom_count,amenities,host_information,address,latitude,longitude,room_title",
      });
  }

  const newewHotelDataWithSlag={
    hotel_id,
    slug:slugify(title),
    images,
    description,
    guest_count,
    bedroom_count,
    bathroom_count,
    host_information,
    address,
    latitude,
    longitude,
    rooms:[{
      hotel_slug: slugify(title),
        room_slug: slugify(room_title),
        room_image: "https://example.com/hotel2/room2.jpg",
        room_title:room_title,
        bedroom_count
    }]
  }


  console.log(slugify(newHotelData?.title,{lower: true,strict: true}))
  const hotelsData = await readHotelsFile();

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
app.get("/hotel/:id", async (req, res) => {
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
app.put("/hotel/:id", (req, res) => {
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
    const hotelId = req.body.hotel_id;
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(500).json({ error: "Image upload failed" });
    }

    const imageUrls = req.files.map(
      (file) => `/uploads/${hotelId}/${file.filename}`
    );

    try {
      let hotels = readHotelsFile();
      const hotelIndex = hotels.findIndex((hotel) => hotel.hotel_id == hotelId);
      imageUrls.map((imageUrl) => hotels[hotelIndex].images.push(imageUrl));
      writeHotelsFile(hotels);

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

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ----------------------  For Image----------------------------------

app.listen(port, () => {
  console.log(`Server Running on  ${port}`);
});

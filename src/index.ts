import express, { Request, Response } from "express";
import fs from "fs";
import multer, { MulterError } from "multer";
import path from "path";
import slugify from "slugify";

const app = express();
const port = 8000;

app.use(express.json());

// Types
interface Hotel {
  hotel_id: string;
  slug: string;
  images: string[];
  description: string;
  guest_count: number;
  bedroom_count: number;
  bathroom_count: number;
  amenities: string[];
  host_information: string;
  address: string;
  latitude: number;
  longitude: number;
  rooms: Room[];
}

interface Room {
  hotel_slug: string;
  room_slug: string;
  room_image: string;
  room_title: string;
  bedroom_count: number;
}

// Set up storage for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const hotelId = req.body.hotel_id as string;
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
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
}).array("images", 10);

// Function to update hotel images
async function updateHotelImages(hotelId: string, imageUrls: string[]): Promise<void> {
  console.log(`Hotel ${hotelId} updated with images:`, imageUrls);
}

// ---------------read and parse JSON file----------------------
function readHotelsFile(): Hotel[] {
  const data = fs.readFileSync("hotelinfo.json", "utf8");
  return JSON.parse(data) as Hotel[];
}

// ---------------write JSON file----------------------
function writeHotelsFile(data: Hotel[]): void {
  fs.writeFileSync("hotelinfo.json", JSON.stringify(data, null, 2), "utf8");
}

// -------------------------------------     All API     -----------------------------------

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

//-------------------------------          Get All Hotels          -----------------------------
app.get("/hotel", async (req: Request, res: Response) => {
  const hotels = await readHotelsFile();
  return res.status(200).json({ message: "Find all Hotels successfully", hotels });
});

//--------------                           Post A Hotel            -----------------------------
app.post("/hotel", async (req: Request, res: Response) => {
  const newHotelData: Partial<Hotel> = req.body;

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
    return res.status(400).json({
      message:
        "Require all fields: hotel_id, title, images, description, guest_count, bedroom_count, bathroom_count, amenities, host_information, address, latitude, longitude, room_title",
    });
  }

  const newHotel: Hotel = {
    hotel_id,
    slug: slugify(title, { lower: true, strict: true }),
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
    rooms: [{
      hotel_slug: slugify(title, { lower: true, strict: true }),
      room_slug: slugify(room_title, { lower: true, strict: true }),
      room_image: "https://example.com/hotel2/room2.jpg",
      room_title,
      bedroom_count,
    }],
  };

  const hotelsData = await readHotelsFile();

  if (hotelsData.some((hotel) => hotel.hotel_id === hotel_id)) {
    return res.status(400).json({ message: "Hotel with this ID already exists" });
  }

  hotelsData.push(newHotel);
  writeHotelsFile(hotelsData);

  return res.status(201).json({ message: "Hotel added successfully", hotel: newHotel });
});

//--------------                        Get specific Hotel        ----------------------------------
app.get("/hotel/:id", async (req: Request, res: Response)  => {
  const hotels = await readHotelsFile();
  const hotel = hotels.find((hotel) => hotel.hotel_id === req.params.id);

  if (hotel) {
    return res.status(200).json({ message: "Find this Hotel successfully", hotel });
  } else {
    return res.status(404).json({ message: "Could Not Find This Hotel" });
  }
});

//-----------------------------        Put specific Hotel        ----------------------------------
app.put("/hotel/:id", (req: Request, res: Response) => {
  const hotelUpdateData = req.body;
  const hotels = readHotelsFile();
  const hotelIndex = hotels.findIndex((hotel) => hotel.hotel_id === req.params.id);

  if (hotelIndex === -1) {
    return res.status(404).json({ message: "This Hotel doesn't exist" });
  }

  Object.assign(hotels[hotelIndex], hotelUpdateData);
  writeHotelsFile(hotels);

  return res.status(200).json({
    message: "Hotel updated successfully",
    hotel: hotels[hotelIndex],
  });
});

// ----------------------         POST /images endpoint       ---------------------------------
app.post("/images", async (req: Request, res: Response) => {
  upload(req, res, async (err: any) => {
    const hotelId = req.body.hotel_id;
    if (err instanceof MulterError) {
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(500).json({ error: "Image upload failed" });
    }

    const imageUrls = req.files?.map(
      (file: Express.Multer.File) => `/uploads/${hotelId}/${file.filename}`
    ) as string[];

    try {
      const hotels = readHotelsFile();
      const hotelIndex = hotels.findIndex((hotel) => hotel.hotel_id === hotelId);

      if (hotelIndex !== -1) {
        hotels[hotelIndex].images.push(...imageUrls);
        writeHotelsFile(hotels);
      }

      await updateHotelImages(hotelId, imageUrls);
      res.status(200).json({
        message: "Images uploaded successfully",
        imageUrls,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to update hotel record" });
    }
  });
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Start Server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

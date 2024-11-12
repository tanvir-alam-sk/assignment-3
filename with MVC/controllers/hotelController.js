const { readHotelsFile, writeHotelsFile } = require("../models/hotelModel");
const slugify = require("slugify");

async function getAllHotels(req, res) {
  const hotels = await readHotelsFile();
  return res.status(201).json({ message: "Find all Hotels successfully", hotel: hotels });
}

async function addHotel(req, res) {
  const newHotelData = req.body;

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

  if (!hotel_id || !title || !images || !description || !guest_count || !bedroom_count ||
      !bathroom_count || !amenities || !host_information || !address || !latitude ||
      !longitude || !room_title) {
    return res.status(400).json({
      message: "Required fields: hotel_id, title, images, description, guest_count, " +
               "bedroom_count, bathroom_count, amenities, host_information, address, " +
               "latitude, longitude, room_title"
    });
  }

  const newHotel = {
    hotel_id,
    slug: slugify(title),
    images,
    description,
    guest_count,
    bedroom_count,
    bathroom_count,
    host_information,
    address,
    latitude,
    longitude,
    rooms: [
      {
        hotel_slug: slugify(title),
        room_slug: slugify(room_title),
        room_image: "https://example.com/hotel2/room2.jpg",
        room_title: room_title,
        bedroom_count,
      },
    ],
  };

  const hotelsData = await readHotelsFile();
  if (hotelsData.some((hotel) => hotel.hotel_id === hotel_id)) {
    return res.status(400).json({ message: "Hotel with this ID already exists" });
  }

  hotelsData.push(newHotel);
  writeHotelsFile(hotelsData);

  return res.status(201).json({ message: "Hotel added successfully", hotel: newHotel });
}

async function getHotelById(req, res) {
  const hotels = await readHotelsFile();
  const hotel = hotels.find((hotel) => hotel.hotel_id == req.params.id);
  if (hotel) {
    return res.status(200).json({ message: "Find this Hotel successfully", hotel });
  } else {
    return res.status(404).json({ message: "Could not find this hotel" });
  }
}

function updateHotel(req, res) {
  const hotelUpdateData = req.body;
  let hotels = readHotelsFile();
  const hotelIndex = hotels.findIndex((hotel) => hotel.hotel_id == req.params.id);

  if (hotelIndex === -1) {
    return res.status(404).json({ message: "This Hotel doesn't exist" });
  }

  Object.assign(hotels[hotelIndex], hotelUpdateData);
  writeHotelsFile(hotels);

  return res.status(200).json({ message: "Hotel updated successfully", hotel: hotels[hotelIndex] });
}

module.exports = { getAllHotels, addHotel, getHotelById, updateHotel };

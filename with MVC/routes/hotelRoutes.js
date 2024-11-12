const express = require("express");
const router = express.Router();
const { getAllHotels, addHotel, getHotelById, updateHotel } = require("../controllers/hotelController");

router.get("/", getAllHotels);
router.post("/", addHotel);
router.get("/:id", getHotelById);
router.put("/:id", updateHotel);

module.exports = router;

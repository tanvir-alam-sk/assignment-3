const express = require("express");
const app = express();
const fs = require("fs");
const port = 8000;

app.use(express.json());

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
app.get("/hotels", (req, res) => {
  let hotel = readHotelsFile();
  console.log(hotel.length);
  res.send(hotel);
});

//--------------                           Post A Hotel            -----------------------------
app.post("/hotels", (req, res) => {
  const newHotelData = req.body;
  const hotelsData = readHotelsFile();

  // Check if hotel_id already exists
  if (hotelsData.some((hotel) => hotel.hotel_id === newHotelData.hotel_id)) {
    return res
      .status(400)
      .json({ message: "Hotel with this ID already exists" });
  }

  hotelsData.push(newHotelData);
  writeHotelsFile(hotelsData);

  res
    .status(201)
    .json({ message: "Hotel added successfully", hotel: newHotelData });
});

//-------------- Get specific Hotel----------------------------------
app.get("/hotels/:id", (req, res) => {
  hotels = readHotelsFile();
  let existHotel = hotels.find((hotel) => hotel.hotel_id == req.params.id);
  if (existHotel) {
    res.status(200).send(existHotel);
  } else {
    res.status(404).send("Cound Not Find This Hotel");
  }
});

//-------------- Put specific Hotel----------------------------------
app.put("/hotels/:id", (req, res) => {
  hotels = readHotelsFile();
  let isExistHotel = hotels.find((hotel) => hotel.hotel_id == req.params.id);

  if (isExistHotel) {
    const hotelUpdateData = req.body;

    const hotelIndex = hotels.findIndex((hotel) => hotel.hotel_id == req.params.id);

    for(let x in hotelUpdateData){
      // order will change
      // isExistHotel[x]=hotelUpdateData[x];

         // order is not change 
      hotels[hotelIndex][x]=hotelUpdateData[x];
      console.log(hotels[hotelIndex][x])
    }

    writeHotelsFile(hotels);
    res.status(200).send({ message: 'Hotel updated successfully', hotel: isExistHotel });
  } else {
    res.send("This Hotel doesn't exists");
  }
  // const hotelUpdateData = req.body;
});

app.listen(port, () => {
  console.log(`Server Running on  ${port}`);
});

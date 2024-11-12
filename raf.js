const hotelId = req.body.hotel_id;
if(!hotelId){
  res.status(404).json({ message: "Id is required",})
}

// ------------------
const {hotel_id,title,images,description,guest_count,bedroom_count,bathroom_count,amenities,host_information,address,latitude,longitude,room_title}=newHotelData
if(!hotel_id || !title || !images || !description ||!guest_count || !bedroom_count || !bathroom_count || !amenities || !host_information|| !address || !latitude || !longitude || !room_title){
  return res
  .status(400)
  .json({ message: "Requere all those fields hotel_id,title,images,description,guest_count,bedroom_count,bathroom_count,amenities,host_information,address,latitude,longitude,room_title" });
}



// "scripts": {
//     "test": "echo \"Error: no test specified\" && exit 1",
//     "start": "nodemon index.js",
//     "dev": "nodemon src/index.ts",
//     "build": "tsc"
//   },
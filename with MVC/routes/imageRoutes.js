const express = require("express");
const router = express.Router();
const { uploadImages } = require("../controllers/imageController");

router.post("/", uploadImages);

module.exports = router;

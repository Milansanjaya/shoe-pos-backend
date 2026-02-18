const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { closeDay } = require("../controllers/closingController");

router.post("/close", auth, closeDay);

module.exports = router;

const express = require("express");
const router = express.Router();

const { createSale,getTodaySales} = require("../controllers/saleController");
const auth = require("../middleware/authMiddleware");

router.post("/", auth, createSale);
router.get("/today", auth, getTodaySales);


module.exports = router;

const express = require("express");
const router = express.Router();
const { createPurchase } = require("../controllers/purchaseController");
const auth = require("../middleware/authMiddleware");

router.post("/", auth, createPurchase);

module.exports = router;

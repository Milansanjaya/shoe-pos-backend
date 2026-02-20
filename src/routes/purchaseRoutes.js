const express = require("express");
const router = express.Router();
const { createPurchase, getAllPurchases, getPurchaseById } = require("../controllers/purchaseController");
const auth = require("../middleware/authMiddleware");

router.get("/", auth, getAllPurchases);
router.get("/:id", auth, getPurchaseById);
router.post("/", auth, createPurchase);

module.exports = router;

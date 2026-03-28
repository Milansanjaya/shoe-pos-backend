const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
	adjustStock,
	getStockAdjustments,
	getStockAdjustmentById
} = require("../controllers/stockController");

router.get("/adjustments", auth, getStockAdjustments);
router.get("/adjustments/:id", auth, getStockAdjustmentById);
router.post("/adjust", auth, adjustStock);

module.exports = router;

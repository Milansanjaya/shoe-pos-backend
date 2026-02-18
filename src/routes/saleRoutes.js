const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");

const {
  createSale,
  getSaleById,
  printInvoice,
  createSaleByBarcode
} = require("../controllers/saleController");

/* ===============================
   Sale Routes
=================================*/

// Create sale
router.post("/", auth, createSale);

// Get single sale
router.get("/:id", auth, getSaleById);

// Print invoice
router.get("/:id/print", auth, printInvoice);

router.post("/scan", auth, createSaleByBarcode);

module.exports = router;

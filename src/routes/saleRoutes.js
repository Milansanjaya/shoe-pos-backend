const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");

const {
  createSale,
  getSales,
  getSaleById,
  printInvoice,
  createSaleByBarcode
} = require("../controllers/saleController");

/* ===============================
   Sale Routes
=================================*/

// Create sale
router.post("/", auth, createSale);

// Get all sales
router.get("/", auth, getSales);

// Get single sale
router.get("/:id", auth, getSaleById);

// Print invoice (no auth — opened via window.open, can't send Bearer token)
router.get("/:id/print", printInvoice);


module.exports = router;

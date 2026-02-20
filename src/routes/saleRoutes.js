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

// Print invoice
router.get("/:id/print", auth, printInvoice);


module.exports = router;

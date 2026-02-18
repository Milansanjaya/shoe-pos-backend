const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");

const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  getProductByBarcode
} = require("../controllers/productController");

router.post("/", auth, createProduct);
router.get("/", auth, getProducts);
router.get("/low-stock", auth, getLowStockProducts);
router.get("/barcode/:barcode", auth, getProductByBarcode);
router.get("/:id", auth, getProductById);
router.put("/:id", auth, updateProduct);
router.delete("/:id", auth, deleteProduct);

module.exports = router;

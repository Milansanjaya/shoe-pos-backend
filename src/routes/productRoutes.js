const express = require("express");
const router = express.Router();

const { createProduct, getProducts } = require("../controllers/productController");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

router.post("/", auth, role("admin"), createProduct);
router.get("/", auth, getProducts);

module.exports = router;

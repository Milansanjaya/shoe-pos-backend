const express = require("express");
const router = express.Router();

const {
  createSupplier,
  getSuppliers
} = require("../controllers/supplierController");

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

router.post("/", auth, role("admin"), createSupplier);
router.get("/", auth, getSuppliers);

module.exports = router;

const express = require("express");
const router = express.Router();

const {
  createSupplier,
  getSuppliers,
  deleteSupplier
} = require("../controllers/supplierController");

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

router.post("/", auth, role("admin"), createSupplier);
router.get("/", auth, getSuppliers);
router.delete("/:id", auth, role("admin"), deleteSupplier);

module.exports = router;

const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { adjustStock } = require("../controllers/stockController");

router.post("/adjust", auth, adjustStock);

module.exports = router;

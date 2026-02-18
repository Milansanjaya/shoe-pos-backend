const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { createReturn } = require("../controllers/returnController");

router.post("/", auth, createReturn);

module.exports = router;

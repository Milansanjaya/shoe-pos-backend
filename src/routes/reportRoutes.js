const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");

const { getBusinessReport, getTodayReport, getMonthlyReport, downloadMonthlyReport } = require("../controllers/reportController");

router.get("/today", auth, getTodayReport);
router.get("/monthly", auth, getMonthlyReport);
router.get("/summary", auth, getBusinessReport);
router.get("/download", auth, downloadMonthlyReport);

module.exports = router;

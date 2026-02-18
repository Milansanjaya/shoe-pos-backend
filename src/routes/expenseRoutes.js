const express = require("express");
const router = express.Router();
const { createExpense, getMonthlyExpenses } = require("../controllers/expenseController");
const auth = require("../middleware/authMiddleware");

router.post("/", auth, createExpense);
router.get("/monthly", auth, getMonthlyExpenses);

module.exports = router;

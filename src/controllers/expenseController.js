const Expense = require("../models/Expense");

const createExpense = async (req, res) => {
  try {
    const expense = await Expense.create({
      ...req.body,
      addedBy: req.user.id
    });

    res.status(201).json(expense);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMonthlyExpenses = async (req, res) => {
  try {
    const now = new Date();

    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const expenses = await Expense.find({
      createdAt: { $gte: start, $lte: end }
    });

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    res.json({
      totalExpenses,
      expenses
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createExpense, getMonthlyExpenses };

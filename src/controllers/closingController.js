const Sale = require("../models/Sale");
const Expense = require("../models/Expense");
const Closing = require("../models/Closing");

const closeDay = async (req, res) => {
  try {
    const { openingCash } = req.body;

    const today = new Date().toISOString().split("T")[0];

    const sales = await Sale.find({
      createdAt: {
        $gte: new Date(today),
        $lte: new Date(today + "T23:59:59")
      }
    });

    const expenses = await Expense.find({
      createdAt: {
        $gte: new Date(today),
        $lte: new Date(today + "T23:59:59")
      }
    });

    const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalProfit = sales.reduce((sum, s) => sum + s.totalProfit, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    const closingCash = openingCash + totalRevenue - totalExpenses;

    const closing = await Closing.create({
      date: today,
      openingCash,
      totalSales: sales.length,
      totalRevenue,
      totalProfit,
      totalExpenses,
      closingCash,
      closedBy: req.user.id
    });

    res.json(closing);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { closeDay };

const Sale = require("../models/Sale");
const Product = require("../models/Product");

const getDashboardSummary = async (req, res) => {
  try {
    const now = new Date();

    /* =============================
       Today Date Range
    ============================== */
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    /* =============================
       Month Date Range
    ============================== */
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23, 59, 59
    );

    /* =============================
       Fetch Sales
    ============================== */

    const todaySales = await Sale.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    const monthlySales = await Sale.find({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });

    /* =============================
       Calculations
    ============================== */

    const todayRevenue = todaySales.reduce(
      (sum, sale) => sum + sale.totalAmount,
      0
    );

    const todayProfit = todaySales.reduce(
      (sum, sale) => sum + (sale.totalProfit || 0),
      0
    );

    const monthlyRevenue = monthlySales.reduce(
      (sum, sale) => sum + sale.totalAmount,
      0
    );

    const monthlyProfit = monthlySales.reduce(
      (sum, sale) => sum + (sale.totalProfit || 0),
      0
    );

    const lowStockProducts = await Product.find({
      "variants.stock": { $lt: 5 }
    });

    const totalProducts = await Product.countDocuments();

    res.json({
      todayRevenue,
      todayProfit,
      todaySalesCount: todaySales.length,
      monthlyRevenue,
      monthlyProfit,
      lowStockCount: lowStockProducts.length,
      totalProducts
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboardSummary };

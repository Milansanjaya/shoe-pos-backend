const Sale = require("../models/Sale");
const Purchase = require("../models/Purchase");
const Product = require("../models/Product");


/* ======================================
   Full Business Summary Report
====================================== */
const getBusinessReport = async (req, res) => {
  try {

    const totalSalesRevenue = await Sale.aggregate([
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    const totalProfit = await Sale.aggregate([
      { $group: { _id: null, total: { $sum: "$totalProfit" } } }
    ]);

    const totalPurchases = await Purchase.aggregate([
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    const totalProducts = await Product.countDocuments();

    res.json({
      totalSalesRevenue: totalSalesRevenue[0]?.total || 0,
      totalProfit: totalProfit[0]?.total || 0,
      totalPurchases: totalPurchases[0]?.total || 0,
      totalProducts
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
/* ===============================
   Today Sales Report
=================================*/
const getTodayReport = async (req, res) => {
  try {
    const now = new Date();
    const start = new Date(now.setHours(0, 0, 0, 0));
    const end = new Date(now.setHours(23, 59, 59, 999));

    const sales = await Sale.find({
      createdAt: { $gte: start, $lte: end }
    });

    const totalRevenue = sales.reduce(
      (sum, sale) => sum + sale.totalAmount, 0
    );

    const totalProfit = sales.reduce(
      (sum, sale) => sum + (sale.totalProfit || 0), 0
    );

    res.json({
      date: new Date().toISOString().split("T")[0],
      totalSales: sales.length,
      totalRevenue,
      totalProfit
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===============================
   Monthly Report
=================================*/
const getMonthlyReport = async (req, res) => {
  try {
    const now = new Date();

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const sales = await Sale.find({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalProfit = sales.reduce((sum, s) => sum + (s.totalProfit || 0), 0);

    res.json({
      month: now.toLocaleString("default", { month: "long" }),
      totalSales: sales.length,
      totalRevenue,
      totalProfit
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTodayReport,
  getMonthlyReport
};

module.exports = { getBusinessReport, getTodayReport, getMonthlyReport };

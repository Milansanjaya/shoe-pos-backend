const mongoose = require("mongoose");

const closingSchema = new mongoose.Schema({
  date: String,
  openingCash: Number,
  totalSales: Number,
  totalRevenue: Number,
  totalProfit: Number,
  totalExpenses: Number,
  closingCash: Number,
  closedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, { timestamps: true });

module.exports = mongoose.model("Closing", closingSchema);

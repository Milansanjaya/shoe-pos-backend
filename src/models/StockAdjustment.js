const mongoose = require("mongoose");

const stockAdjustmentSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  size: String,
  color: String,
  type: {
    type: String,
    enum: ["INCREASE", "DECREASE"],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  reason: String,
  adjustedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, { timestamps: true });

module.exports = mongoose.model("StockAdjustment", stockAdjustmentSchema);

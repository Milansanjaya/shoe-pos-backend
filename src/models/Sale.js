const mongoose = require("mongoose");

const saleItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  size: String,
  color: String,
  quantity: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  }
});

const saleSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    unique: true
  },

  items: [saleItemSchema],

  // Subtotal before discount
  totalAmount: {
    type: Number,
    required: true
  },

  // Discount System
  discountType: {
    type: String,
    enum: ["NONE", "PERCENTAGE", "FLAT"],
    default: "NONE"
  },

  discountValue: {
    type: Number,
    default: 0
  },

  discountAmount: {
    type: Number,
    default: 0
  },

  // Final amount after discount
  grandTotal: {
    type: Number,
    required: true
  },

  // Profit tracking
  totalProfit: {
    type: Number,
    default: 0
  },

  // Payment type
  paymentMethod: {
    type: String,
    enum: ["Cash", "Card", "Transfer"],
    default: "Cash"
  },

  soldBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }

}, { timestamps: true });

module.exports = mongoose.model("Sale", saleSchema);
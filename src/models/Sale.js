const mongoose = require("mongoose");

const saleItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  size: String,
  color: String,
  quantity: Number,
  price: Number
});

const saleSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    unique: true
  },

  items: [saleItemSchema],

  totalAmount: {
    type: Number,
    required: true
  },

  soldBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

totalProfit: {
  type: Number,
  default: 0
},
totalAmount: Number,
totalProfit: Number,


}, { timestamps: true });

module.exports = mongoose.model("Sale", saleSchema);

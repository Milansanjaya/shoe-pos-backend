const mongoose = require("mongoose");

const returnItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product"
  },
  size: String,
  color: String,
  quantity: Number,
  refundAmount: Number
});

const returnSchema = new mongoose.Schema({
  sale: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Sale"
  },
  items: [returnItemSchema],
  totalRefund: Number,
  returnedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, { timestamps: true });

module.exports = mongoose.model("Return", returnSchema);

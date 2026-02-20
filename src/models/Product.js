const mongoose = require("mongoose");

const variantSchema = new mongoose.Schema({
  size: String,
  color: String,
  barcode: String,
  stock: {
    type: Number,
    default: 0
  }
});

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  brand: String,
  category: String,

  price: {                 
    type: Number,
    required: true
  },

  costPrice: {           
    type: Number,
    required: true,
    default: 0
  },

 barcode: {
  type: String,
  unique: true,
  required: true
},


  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Supplier"
  },

  variants: [variantSchema]

}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);

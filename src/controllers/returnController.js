
const Return = require("../models/Return");
const Sale = require("../models/Sale");
const Product = require("../models/Product");

const createReturn = async (req, res) => {
  try {
    const { saleId, items } = req.body;

    const sale = await Sale.findById(saleId);

    if (!sale) {
      return res.status(404).json({ message: "Sale not found" });
    }

    let totalRefund = 0;

    for (const item of items) {
      const product = await Product.findById(item.product);

      const variant = product.variants.find(
        v => v.size === item.size && v.color === item.color
      );

      if (!variant) {
        return res.status(404).json({ message: "Variant not found" });
      }

      // Increase stock
      variant.stock += item.quantity;

      await product.save();

      const refundAmount = item.quantity * item.price;
      totalRefund += refundAmount;
    }

    const returnDoc = await Return.create({
      sale: sale._id,
      items,
      totalRefund,
      returnedBy: req.user.id
    });

    res.status(201).json(returnDoc);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createReturn };

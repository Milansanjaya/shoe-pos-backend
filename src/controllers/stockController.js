const Product = require("../models/Product");
const StockAdjustment = require("../models/StockAdjustment");


const adjustStock = async (req, res) => {
  try {
    const { productId, size, color, type, quantity, reason } = req.body;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const variant = product.variants.find(
      v => v.size === size && v.color === color
    );

    if (!variant) {
      return res.status(404).json({ message: "Variant not found" });
    }

    if (type === "DECREASE" && variant.stock < quantity) {
      return res.status(400).json({ message: "Not enough stock" });
    }

    if (type === "INCREASE") {
      variant.stock += quantity;
    } else {
      variant.stock -= quantity;
    }

    await product.save();

    const adjustment = await StockAdjustment.create({
      product: product._id,
      size,
      color,
      type,
      quantity,
      reason,
      adjustedBy: req.user.id
    });

    res.status(201).json(adjustment);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { adjustStock };

const Purchase = require("../models/Purchase");
const Product = require("../models/Product");
const Counter = require("../models/Counter");

const getNextPurchaseNumber = async () => {
  const counter = await Counter.findOneAndUpdate(
    { name: "purchase" },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true }
  );

  return `PUR-${String(counter.sequence).padStart(5, "0")}`;
};

const createPurchase = async (req, res) => {
  try {
    const { supplier, items } = req.body;

    let totalAmount = 0;

    for (const item of items) {
      const product = await Product.findById(item.product);

      if (!product)
        return res.status(404).json({ message: "Product not found" });

      const variant = product.variants.find(
        v => v.size === item.size && v.color === item.color
      );

      if (!variant)
        return res.status(404).json({ message: "Variant not found" });

      // 🔼 Increase stock
      variant.stock += item.quantity;
      product.costPrice = item.costPrice;
      totalAmount += item.costPrice * item.quantity;

      await product.save();
    }

    const purchaseNumber = await getNextPurchaseNumber();

    const purchase = await Purchase.create({
      purchaseNumber,
      supplier,
      items,
      totalAmount,
      purchasedBy: req.user.id
    });

    res.status(201).json(purchase);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createPurchase };

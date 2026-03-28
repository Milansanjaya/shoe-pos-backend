const Purchase = require("../models/Purchase");
const Product = require("../models/Product");
const Counter = require("../models/Counter");

const PURCHASE_POPULATE = [
  { path: "supplier", select: "name phone address" },
  { path: "purchasedBy", select: "name email role" },
  { path: "items.product", select: "name brand category barcode price" }
];

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

    if (!supplier) {
      return res.status(400).json({ message: "Supplier is required" });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Items are required" });
    }

    let totalAmount = 0;

    for (const item of items) {
      const size = String(item.size ?? "").trim();
      const color = String(item.color ?? "").trim();

      if (!size || !color) {
        return res.status(400).json({ message: "Size and color are required for each item" });
      }

      const product = await Product.findById(item.product);

      if (!product)
        return res.status(404).json({ message: "Product not found" });

      const variant = product.variants.find(
        v => v.size === size && v.color === color
      );

      if (!variant)
        return res.status(404).json({ message: "Variant not found" });

      // Persist normalized values (ensures purchase refers to product variant)
      item.size = size;
      item.color = color;

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

    const populatedPurchase = await Purchase.findById(purchase._id).populate(PURCHASE_POPULATE);
    res.status(201).json(populatedPurchase);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find()
      .sort({ createdAt: -1 })
      .populate(PURCHASE_POPULATE);

    res.json(purchases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPurchaseById = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id).populate(PURCHASE_POPULATE);

    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    res.json(purchase);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createPurchase, getAllPurchases, getPurchaseById };

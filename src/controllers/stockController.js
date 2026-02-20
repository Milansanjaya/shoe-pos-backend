const Product = require("../models/Product");
const StockAdjustment = require("../models/StockAdjustment");

const STOCK_ADJUSTMENT_POPULATE = [
  { path: "product", select: "name brand category barcode" },
  { path: "adjustedBy", select: "name email role" }
];


const adjustStock = async (req, res) => {
  try {
    const { productId, size, color, type, quantity, reason } = req.body;

    const normalizedSize = String(size ?? "").trim();
    const normalizedColor = String(color ?? "").trim();
    const normalizedType = String(type ?? "").trim().toUpperCase();
    const normalizedQuantity = Number(quantity);

    if (!productId) {
      return res.status(400).json({ message: "productId is required" });
    }
    if (!normalizedSize || !normalizedColor) {
      return res.status(400).json({ message: "size and color are required" });
    }
    if (!['INCREASE', 'DECREASE'].includes(normalizedType)) {
      return res.status(400).json({ message: "type must be INCREASE or DECREASE" });
    }
    if (!Number.isFinite(normalizedQuantity) || normalizedQuantity <= 0) {
      return res.status(400).json({ message: "quantity must be a number greater than 0" });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const variant = product.variants.find(
      v => v.size === normalizedSize && v.color === normalizedColor
    );

    if (!variant) {
      return res.status(404).json({ message: "Variant not found" });
    }

    if (normalizedType === "DECREASE" && variant.stock < normalizedQuantity) {
      return res.status(400).json({ message: "Not enough stock" });
    }

    if (normalizedType === "INCREASE") {
      variant.stock += normalizedQuantity;
    } else {
      variant.stock -= normalizedQuantity;
    }

    await product.save();

    const adjustment = await StockAdjustment.create({
      product: product._id,
      size: normalizedSize,
      color: normalizedColor,
      type: normalizedType,
      quantity: normalizedQuantity,
      reason,
      adjustedBy: req.user.id
    });

    const populatedAdjustment = await StockAdjustment.findById(adjustment._id)
      .populate(STOCK_ADJUSTMENT_POPULATE);

    res.status(201).json(populatedAdjustment);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getStockAdjustments = async (req, res) => {
  try {
    const { productId, type } = req.query;

    const filter = {};
    if (productId) filter.product = productId;
    if (type) filter.type = String(type).trim().toUpperCase();

    const adjustments = await StockAdjustment.find(filter)
      .sort({ createdAt: -1 })
      .populate(STOCK_ADJUSTMENT_POPULATE);

    res.json(adjustments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getStockAdjustmentById = async (req, res) => {
  try {
    const adjustment = await StockAdjustment.findById(req.params.id)
      .populate(STOCK_ADJUSTMENT_POPULATE);

    if (!adjustment) {
      return res.status(404).json({ message: "Stock adjustment not found" });
    }

    res.json(adjustment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { adjustStock, getStockAdjustments, getStockAdjustmentById };

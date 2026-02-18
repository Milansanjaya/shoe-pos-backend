const Sale = require("../models/Sale");
const Product = require("../models/Product");
const Counter = require("../models/Counter");


/* ===============================
   Generate Invoice Number
=================================*/
const getNextInvoiceNumber = async () => {
  const counter = await Counter.findOneAndUpdate(
    { name: "invoice" },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true }
  );

  return `INV-${String(counter.sequence).padStart(5, "0")}`;
};


/* ===============================
   Create Sale
=================================*/
const createSale = async (req, res) => {

  let totalProfit = 0;

  const itemProfit =
  (product.price - product.costPrice) * item.quantity;

totalProfit += itemProfit;


  try {
    const { items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No sale items provided" });
    }

    let totalAmount = 0;
    let processedItems = [];

    for (const item of items) {

      const product = await Product.findById(item.product);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const variant = product.variants.find(
        v => v.size === item.size && v.color === item.color
      );

      if (!variant) {
        return res.status(404).json({ message: "Variant not found" });
      }

      if (variant.stock < item.quantity) {
        return res.status(400).json({ message: "Not enough stock" });
      }

      // Reduce stock
      variant.stock -= item.quantity;

      // Calculate price
      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      // Save updated product stock
      await product.save();

      // Push item with price included
      processedItems.push({
        product: product._id,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        price: product.price
      });
    }

    // Generate invoice number
    const invoiceNumber = await getNextInvoiceNumber();

    const sale = await Sale.create({
  invoiceNumber,
  items: processedItems,
  totalAmount,
  totalProfit,
  soldBy: req.user.id
});


    res.status(201).json(sale);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
//Sales Summary
const getTodaySales = async (req, res) => {

  const totalProfit = sales.reduce(
  (sum, sale) => sum + sale.totalProfit,
  0
);

  try {
    const now = new Date();

    // Sri Lanka offset (UTC +5:30)
    const sriLankaOffset = 5.5 * 60 * 60 * 1000;

    const sriLankaNow = new Date(now.getTime() + sriLankaOffset);

    const startOfDay = new Date(sriLankaNow);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(sriLankaNow);
    endOfDay.setHours(23, 59, 59, 999);

    // Convert back to UTC for MongoDB query
    const startUTC = new Date(startOfDay.getTime() - sriLankaOffset);
    const endUTC = new Date(endOfDay.getTime() - sriLankaOffset);

    const sales = await Sale.find({
      createdAt: { $gte: startUTC, $lte: endUTC }
    });

    const totalRevenue = sales.reduce(
      (sum, sale) => sum + sale.totalAmount,
      0
    );

    res.json({
      date: sriLankaNow.toISOString().split("T")[0],
      totalSales: sales.length,
      totalRevenue,
      sales
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



module.exports = { createSale, getTodaySales };


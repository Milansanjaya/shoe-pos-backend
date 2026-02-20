const mongoose = require("mongoose");
const Sale = require("../models/Sale");
const Product = require("../models/Product");
const Counter = require("../models/Counter");

/* ======================================
   Generate Invoice Number (WITH SESSION)
====================================== */
const getNextInvoiceNumber = async (session) => {
  const counter = await Counter.findOneAndUpdate(
    { name: "invoice" },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true, session }
  );

  return `INV-${String(counter.sequence).padStart(5, "0")}`;
};

/* ======================================
   Create Sale (Transaction Safe + Discount)
====================================== */
const createSale = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      items,
      paymentMethod = "Cash",
      discountType = "NONE",
      discountValue = 0
    } = req.body;

    if (!items || items.length === 0)
      throw new Error("No sale items provided");

    let totalAmount = 0;
    let totalCost = 0;
    let processedItems = [];

    for (const item of items) {

      const product = await Product.findById(item.product).session(session);
      if (!product) throw new Error("Product not found");

      const variant = product.variants.find(
        v => v.size === item.size && v.color === item.color
      );

      if (!variant) throw new Error("Variant not found");
      if (variant.stock < item.quantity)
        throw new Error("Not enough stock");

      variant.stock -= item.quantity;

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      const cost = product.costPrice || 0;
      totalCost += cost * item.quantity;

      await product.save({ session });

      processedItems.push({
        product: product._id,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        price: product.price
      });
    }

    /* ======================
       DISCOUNT CALCULATION
    ====================== */

    let discountAmount = 0;

    if (discountType === "PERCENTAGE") {
      discountAmount = (totalAmount * discountValue) / 100;
    } else if (discountType === "FLAT") {
      discountAmount = discountValue;
    }

    if (discountAmount > totalAmount)
      discountAmount = totalAmount;

    const grandTotal = totalAmount - discountAmount;

    /* ======================
       PROFIT CALCULATION
    ====================== */

    const totalProfit = grandTotal - totalCost;

    const invoiceNumber = await getNextInvoiceNumber(session);

    const sale = await Sale.create([{
      invoiceNumber,
      items: processedItems,
      totalAmount,
      discountType,
      discountValue,
      discountAmount,
      grandTotal,
      totalProfit,
      paymentMethod,
      soldBy: req.user.id
    }], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json(sale[0]);

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ message: error.message });
  }
};

/* ======================================
   Get Single Sale
====================================== */
const getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate("items.product")
      .populate("soldBy");

    if (!sale)
      return res.status(404).json({ message: "Sale not found" });

    res.json(sale);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ======================================
   Print Invoice (With Discount)
====================================== */
const printInvoice = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate("items.product")
      .populate("soldBy");

    if (!sale) return res.status(404).send("Sale not found");

    const date = new Date(sale.createdAt).toISOString().split("T")[0];

    let itemsHtml = "";

    sale.items.forEach(item => {
      itemsHtml += `
        <tr>
          <td>${item.product.name}</td>
          <td>${item.quantity}</td>
          <td>${item.price}</td>
          <td>${item.quantity * item.price}</td>
        </tr>
      `;
    });

    res.send(`
      <html>
      <head>
        <title>Invoice</title>
        <style>
          body { font-family: Arial; padding: 20px; }
          table { width: 100%; border-collapse: collapse; }
          td, th { border-bottom: 1px solid #ccc; padding: 8px; }
          h2 { text-align: center; }
        </style>
      </head>
      <body>
        <h2>SHOE SHOP</h2>
        <hr/>
        <p><strong>Invoice:</strong> ${sale.invoiceNumber}</p>
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Payment:</strong> ${sale.paymentMethod}</p>

        <table>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
          ${itemsHtml}
        </table>

        <hr/>
        <p>Subtotal: ${sale.totalAmount}</p>
        <p>Discount: ${sale.discountAmount}</p>
        <h3>Grand Total: ${sale.grandTotal}</h3>

        <script>window.print();</script>
      </body>
      </html>
    `);

  } catch (error) {
    res.status(500).send(error.message);
  }
};

/* ======================================
   Get All Sales
====================================== */
const getSales = async (req, res) => {
  try {
    const { from, to, paymentMethod } = req.query;
    const filter = {};

    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(new Date(to).setHours(23, 59, 59, 999));
    }

    const sales = await Sale.find(filter)
      .sort({ createdAt: -1 })
      .populate('items.product', 'name brand')
      .populate('soldBy', 'name email');

    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createSale,
  getSales,
  getSaleById,
  printInvoice
};
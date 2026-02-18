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
   Create Sale (Transaction Safe)
====================================== */
const createSale = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { items, paymentMethod = "Cash" } = req.body;

    if (!items || items.length === 0) {
      throw new Error("No sale items provided");
    }

    let totalAmount = 0;
    let totalProfit = 0;
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

      // Reduce stock
      variant.stock -= item.quantity;

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      const cost = product.costPrice || 0;
      totalProfit += (product.price - cost) * item.quantity;

      await product.save({ session });

      processedItems.push({
        product: product._id,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        price: product.price
      });
    }

    const invoiceNumber = await getNextInvoiceNumber(session);

    const sale = await Sale.create([{
      invoiceNumber,
      items: processedItems,
      totalAmount,
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
   Create Sale By Barcode (Transaction Safe)
====================================== */
const createSaleByBarcode = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let { barcode, quantity = 1, paymentMethod = "Cash" } = req.body;

    quantity = Number(quantity);

    if (!barcode) throw new Error("Barcode required");
    if (quantity <= 0) throw new Error("Invalid quantity");

    const product = await Product.findOne({
      "variants.barcode": barcode
    }).session(session);

    if (!product) throw new Error("Product not found");

    const variant = product.variants.find(v => v.barcode === barcode);

    if (!variant) throw new Error("Variant not found");

    if (variant.stock < quantity)
      throw new Error("Not enough stock");

    variant.stock -= quantity;

    const totalAmount = product.price * quantity;
    const cost = product.costPrice || 0;
    const totalProfit = (product.price - cost) * quantity;

    await product.save({ session });

    const invoiceNumber = await getNextInvoiceNumber(session);

    const sale = await Sale.create([{
      invoiceNumber,
      items: [{
        product: product._id,
        size: variant.size,
        color: variant.color,
        quantity,
        price: product.price
      }],
      totalAmount,
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

    if (!sale) {
      return res.status(404).json({ message: "Sale not found" });
    }

    res.json(sale);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
/* ======================================
   Print Invoice
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
        <h3>Total: ${sale.totalAmount}</h3>

        <script>window.print();</script>
      </body>
      </html>
    `);

  } catch (error) {
    res.status(500).send(error.message);
  }
};

module.exports = {
  createSale,
  createSaleByBarcode,
  getSaleById,
  printInvoice
};

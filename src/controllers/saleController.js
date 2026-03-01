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

    const date = new Date(sale.createdAt).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    // Short format for thermal: Rs. 25,000 (no decimals unless needed)
    const fmt = (n) => 'Rs. ' + Number(n).toLocaleString('en-LK');

    const soldBy = sale.soldBy?.name || sale.soldBy?.email || '—';

    // 4-column layout: Item | QTY | Price | Total
    let itemsHtml = '';
    sale.items.forEach(item => {
      const name = item.product?.name || 'Unknown';
      itemsHtml += `
        <tr>
          <td><strong>${name}</strong><br/>${item.size} / ${item.color}</td>
          <td class="center">${item.quantity}</td>
          <td class="right">${fmt(item.price)}</td>
          <td class="right"><strong>${fmt(item.quantity * item.price)}</strong></td>
        </tr>`;
    });

    const discountRow = sale.discountAmount > 0
      ? `<tr>
          <td colspan="3">Discount ${sale.discountType === 'PERCENTAGE' ? `(${sale.discountValue}%)` : '(Flat)'}</td>
          <td class="right">- ${fmt(sale.discountAmount)}</td>
         </tr>`
      : '';

    res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Invoice ${sale.invoiceNumber}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      font-weight: bold;
      color: #000;
      width: 70mm;
      margin: 0 auto;
      padding: 4px 10px;
    }
    h2 { text-align: center; font-size: 18px; letter-spacing: 3px; }
    .center { text-align: center; }
    .right { text-align: right; }
    p { margin: 2px 0; font-size: 12px; }
    hr { border: none; border-top: 1px dashed #000; margin: 5px 0; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 3px 1px; font-size: 12px; vertical-align: top; }
    .right { text-align: right; white-space: nowrap; }
    thead th {
      border-bottom: 1px solid #000;
      font-size: 11px;
      font-weight: bold;
      padding: 2px 1px;
    }
    .total-row td {
      border-top: 1px dashed #000;
      padding-top: 5px;
      font-size: 14px;
      font-weight: bold;
    }
    .footer { text-align: center; font-size: 11px; margin-top: 6px; }
    @media print {
      body { width: 70mm; }
      @page { size: 80mm auto; margin: 3mm; }
    }
  </style>
</head>
<body>
  <h2>SHOE SHOP</h2>
  <p class="center">Point of Sale Receipt</p>
  <hr/>
  <p><strong>Invoice:</strong> ${sale.invoiceNumber}</p>
  <p><strong>Date:</strong> ${date}</p>
  <p><strong>Payment:</strong> ${sale.paymentMethod}</p>
  <p><strong>Cashier:</strong> ${soldBy}</p>
  <hr/>
  <table>
    <thead>
      <tr>
        <th style="text-align:left">Item</th>
        <th style="text-align:left">QTY</th>
        <th style="text-align:left">Price</th>
        <th style="text-align:right">Total</th>
      </tr>
    </thead>
    <tbody>${itemsHtml}</tbody>
  </table>
  <hr/>
  <table>
    <tr>
      <td colspan="3">Subtotal</td>
      <td class="right">${fmt(sale.totalAmount)}</td>
    </tr>
    ${discountRow}
    <tr class="total-row">
      <td colspan="3">GRAND TOTAL</td>
      <td class="right">${fmt(sale.grandTotal)}</td>
    </tr>
  </table>
  <hr/>
  <p class="footer">Thank you for your purchase!</p>
  <p class="footer">*** SHOE SHOP ***</p>
  <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };</script>
</body>
</html>`);

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
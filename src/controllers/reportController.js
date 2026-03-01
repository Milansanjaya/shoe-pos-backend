const Sale = require("../models/Sale");
const Purchase = require("../models/Purchase");
const Product = require("../models/Product");

/* ======================================
   Full Business Summary Report
====================================== */
const getBusinessReport = async (req, res) => {
  try {
    const totalSalesRevenue = await Sale.aggregate([
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    const totalProfit = await Sale.aggregate([
      { $group: { _id: null, total: { $sum: "$totalProfit" } } }
    ]);
    const totalPurchases = await Purchase.aggregate([
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    const totalProducts = await Product.countDocuments();

    res.json({
      totalSalesRevenue: totalSalesRevenue[0]?.total || 0,
      totalProfit: totalProfit[0]?.total || 0,
      totalPurchases: totalPurchases[0]?.total || 0,
      totalProducts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===============================
   Today Sales Report
=================================*/
const getTodayReport = async (req, res) => {
  try {
    const now = new Date();
    const start = new Date(now.setHours(0, 0, 0, 0));
    const end = new Date(now.setHours(23, 59, 59, 999));

    const sales = await Sale.find({ createdAt: { $gte: start, $lte: end } });

    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalProfit = sales.reduce((sum, sale) => sum + (sale.totalProfit || 0), 0);

    res.json({
      date: new Date().toISOString().split("T")[0],
      totalSales: sales.length,
      totalRevenue,
      totalProfit
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===============================
   Monthly Report (summary)
=================================*/
const getMonthlyReport = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const sales = await Sale.find({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } });

    const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalProfit = sales.reduce((sum, s) => sum + (s.totalProfit || 0), 0);

    res.json({
      month: now.toLocaleString("default", { month: "long" }),
      totalSales: sales.length,
      totalRevenue,
      totalProfit
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===============================
   Monthly Report — PDF-ready HTML
=================================*/
const downloadMonthlyReport = async (req, res) => {
  try {
    const { month } = req.query;
    let year, monthIndex;

    if (month && /^\d{4}-\d{2}$/.test(month)) {
      [year, monthIndex] = month.split('-').map(Number);
      monthIndex -= 1; // JS months are 0-indexed
    } else {
      const now = new Date();
      year = now.getFullYear();
      monthIndex = now.getMonth();
    }

    const start = new Date(year, monthIndex, 1);
    const end = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);

    const sales = await Sale.find({ createdAt: { $gte: start, $lte: end } })
      .sort({ createdAt: 1 })
      .populate('items.product', 'name')
      .populate('soldBy', 'name email');

    const monthLabel = start.toLocaleString('en-GB', { month: 'long', year: 'numeric' });
    const fmt = (n) => 'Rs. ' + Number(n).toLocaleString('en-LK');
    const totalRevenue = sales.reduce((s, x) => s + x.grandTotal, 0);
    const totalProfit = sales.reduce((s, x) => s + (x.totalProfit || 0), 0);
    const totalDiscount = sales.reduce((s, x) => s + (x.discountAmount || 0), 0);

    let rowsHtml = '';
    let rowColor = false;
    for (const sale of sales) {
      const date = new Date(sale.createdAt).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      const cashier = sale.soldBy?.name || sale.soldBy?.email || '—';
      const bg = (rowColor = !rowColor) ? 'background:#f9f9f9' : '';

      sale.items.forEach((item, idx) => {
        const name = item.product?.name || 'Unknown';
        rowsHtml += `<tr style="${bg}">
          <td>${idx === 0 ? sale.invoiceNumber : ''}</td>
          <td>${idx === 0 ? date : ''}</td>
          <td>${name}</td>
          <td>${item.size}</td>
          <td>${item.color}</td>
          <td style="text-align:center">${item.quantity}</td>
          <td style="text-align:right">${fmt(item.price)}</td>
          <td style="text-align:right">${fmt(item.price * item.quantity)}</td>
          <td style="text-align:right">${idx === 0 ? fmt(sale.grandTotal) : ''}</td>
          <td>${idx === 0 ? sale.paymentMethod : ''}</td>
          <td>${idx === 0 ? cashier : ''}</td>
        </tr>`;
      });
    }

    res.setHeader('Content-Type', 'text/html');
    res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Sales Report — ${monthLabel}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #111; padding: 20px; }
    h1 { font-size: 20px; text-align: center; margin-bottom: 2px; }
    .subtitle { text-align: center; color: #555; font-size: 12px; margin-bottom: 16px; }
    .summary-grid { display: flex; gap: 12px; margin-bottom: 20px; }
    .summary-box { flex: 1; border: 1px solid #ddd; border-radius: 6px; padding: 10px 14px; }
    .summary-box .label { font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: .5px; }
    .summary-box .value { font-size: 16px; font-weight: bold; margin-top: 3px; }
    .summary-box.green .value  { color: #16a34a; }
    .summary-box.blue .value   { color: #0284c7; }
    .summary-box.purple .value { color: #7c3aed; }
    table { width: 100%; border-collapse: collapse; }
    thead { background: #1e293b; color: white; }
    th { padding: 7px 6px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: .4px; }
    td { padding: 5px 6px; border-bottom: 1px solid #eee; vertical-align: top; }
    tfoot td { font-weight: bold; background: #f1f5f9; border-top: 2px solid #1e293b; }
    .no-data { text-align: center; color: #888; padding: 40px; }
    .print-btn { display: block; margin: 0 auto 16px; padding: 8px 24px; background:#1e293b; color:white; border:none; border-radius:6px; font-size:13px; cursor:pointer; }
    @media print {
      .print-btn { display: none; }
      body { padding: 8px; }
      @page { size: A4 landscape; margin: 12mm; }
    }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">🖨️ Save as PDF / Print</button>
  <h1>SHOE SHOP — Sales Report</h1>
  <p class="subtitle">${monthLabel} &nbsp;|&nbsp; Generated: ${new Date().toLocaleString('en-GB')}</p>

  <div class="summary-grid">
    <div class="summary-box blue">
      <div class="label">Total Sales</div>
      <div class="value">${sales.length} transactions</div>
    </div>
    <div class="summary-box blue">
      <div class="label">Total Revenue</div>
      <div class="value">${fmt(totalRevenue)}</div>
    </div>
    <div class="summary-box purple">
      <div class="label">Total Discount</div>
      <div class="value">${fmt(totalDiscount)}</div>
    </div>
    <div class="summary-box green">
      <div class="label">Total Profit</div>
      <div class="value">${fmt(totalProfit)}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Invoice</th><th>Date</th><th>Product</th><th>Size</th><th>Color</th>
        <th style="text-align:center">Qty</th>
        <th style="text-align:right">Unit Price</th>
        <th style="text-align:right">Item Total</th>
        <th style="text-align:right">Grand Total</th>
        <th>Payment</th><th>Cashier</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml || '<tr><td colspan="11" class="no-data">No sales found for this month</td></tr>'}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="8">TOTALS</td>
        <td style="text-align:right">${fmt(totalRevenue)}</td>
        <td colspan="2"></td>
      </tr>
    </tfoot>
  </table>
</body>
</html>`);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getBusinessReport, getTodayReport, getMonthlyReport, downloadMonthlyReport };

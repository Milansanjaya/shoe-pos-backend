const Supplier = require("../models/Supplier");
const Purchase = require("../models/Purchase");
const Product = require("../models/Product");

// Create supplier
exports.createSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.create(req.body);
    res.status(201).json(supplier);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all suppliers
exports.getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find();
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete supplier
exports.deleteSupplier = async (req, res) => {
  try {
    const supplierId = req.params.id;

    const hasPurchases = await Purchase.exists({ supplier: supplierId });
    if (hasPurchases) {
      return res.status(400).json({
        message: "Cannot delete supplier because purchases exist for this supplier"
      });
    }

    const hasProducts = await Product.exists({ supplier: supplierId });
    if (hasProducts) {
      return res.status(400).json({
        message: "Cannot delete supplier because products exist for this supplier"
      });
    }

    const supplier = await Supplier.findByIdAndDelete(supplierId);

    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    res.json({ message: "Supplier deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

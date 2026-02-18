const Product = require("../models/Product");
const Counter = require("../models/Counter");

/* ===============================
   Create Product
=================================*/
const createProduct = async (req, res) => {
  try {
    const { variants, ...productData } = req.body;

    if (!variants || variants.length === 0) {
      return res.status(400).json({ message: "Variants required" });
    }

    // Generate barcode for each variant
    const updatedVariants = [];

    for (const variant of variants) {
      const barcode = await getNextBarcode();

      updatedVariants.push({
        ...variant,
        barcode
      });
    }

    const product = await Product.create({
      ...productData,
      variants: updatedVariants
    });

    res.status(201).json(product);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* ===============================
   Get All Products
=================================*/
const getProducts = async (req, res) => {
  try {
    const products = await Product.find().populate("supplier");
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===============================
   Get Single Product
=================================*/
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("supplier");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===============================
   Update Product
=================================*/
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===============================
   Delete Product
=================================*/
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===============================
   Low Stock Products
=================================*/
const getLowStockProducts = async (req, res) => {
  try {
    const threshold = 5;

    const products = await Product.find();

    let lowStockItems = [];

    products.forEach(product => {
      product.variants.forEach(variant => {
        if (variant.stock <= threshold) {
          lowStockItems.push({
            productId: product._id,
            productName: product.name,
            size: variant.size,
            color: variant.color,
            stock: variant.stock
          });
        }
      });
    });

    res.json({
      count: lowStockItems.length,
      items: lowStockItems
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===============================
   Find Product By Barcode
=================================*/
const getProductByBarcode = async (req, res) => {
  try {
    const { barcode } = req.params;

    const product = await Product.findOne({ barcode });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Return only available variants
    const availableVariants = product.variants.filter(v => v.stock > 0);

    res.json({
      _id: product._id,
      name: product.name,
      brand: product.brand,
      price: product.price,
      barcode: product.barcode,
      variants: availableVariants
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getNextBarcode = async () => {
  const counter = await Counter.findOneAndUpdate(
    { name: "barcode" },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true }
  );

  return String(counter.sequence).padStart(7, "0");
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  getProductByBarcode,
  getNextBarcode
};

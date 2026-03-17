const express = require("express");
const router = express.Router();
const productService = require("../services/productService");
const upload = require("../middleware/upload");

router.post("/", upload.array('images', 10), (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('Files:', req.files);
    
    const images = req.files ? req.files.map(file => `/uploads/products/${file.filename}`) : [];
    const newProduct = productService.createProduct(req.body, images);
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/", (req, res) => {
  const products = productService.getAllProducts(); 
  res.json(products);
});

router.get("/:id", (req, res) => {
  const product = productService.getProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }
  res.json(product);
});

router.put("/:id", upload.array('images', 10), (req, res) => {
  try {
    let newImages = null;
    
    if (req.files && req.files.length > 0) {
      newImages = req.files.map(file => `/uploads/products/${file.filename}`);
      
      if (req.body.existingImages) {
        const existingImages = JSON.parse(req.body.existingImages);
        newImages = [...existingImages, ...newImages];
      }
    } else if (req.body.existingImages) {
      newImages = JSON.parse(req.body.existingImages);
    }
    
    const updated = productService.updateProduct(req.params.id, req.body, newImages);
    if (!updated) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id/images", (req, res) => {
  try {
    const { imagePath } = req.body;
    const updated = productService.deleteImage(req.params.id, imagePath);
    if (!updated) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Dodaj ovu rutu IZNAD router.delete("/:id")
router.patch("/:id/mark-sold", (req, res) => {
  try {
    const products = require("../services/productService").loadProducts || 
                     JSON.parse(require("fs").readFileSync(require("path").join(__dirname, "..", "data", "product.json")));
    const product = products.find(p => p.id == req.params.id && !p.deleted);
    
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    
    product.status = 'sold';
    require("fs").writeFileSync(
      require("path").join(__dirname, "..", "data", "product.json"),
      JSON.stringify(products, null, 2)
    );
    
    res.json({ message: "Product marked as sold", product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", (req, res) => {
  const deleted = productService.deleteProduct(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: "Product not found" });
  }
  res.json({ message: "Product marked as deleted" });
});

module.exports = router;
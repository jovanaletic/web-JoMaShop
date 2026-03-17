const fs = require("fs");
const path = require("path");
const Category = require("../model/category");

const productsFile = path.join(__dirname, "..", "data", "product.json");
const uploadsDir = path.join(__dirname, "..", "uploads", "products");

function loadProducts() {
  if (!fs.existsSync(productsFile)) return [];
  return JSON.parse(fs.readFileSync(productsFile));
}

function saveProducts(products) {
  fs.writeFileSync(productsFile, JSON.stringify(products, null, 2));
}

function createProduct(data, images = []) {
  const products = loadProducts();

  const maxId = products.length > 0
    ? Math.max(...products.map(p => Number(p.id)))
    : 0;

  const categoryObj = new Category(data.category);

  let locationData = null;
  if (data.location) {
    try {
      locationData = typeof data.location === 'string' 
        ? JSON.parse(data.location) 
        : data.location;
      
      if (!locationData.latitude || !locationData.longitude) {
        throw new Error('Lokacija mora imati geografske koordinate (latitude i longitude)');
      }
    } catch (e) {
      console.error('Error parsing location:', e);
      throw new Error(e.message || 'Nevažeća lokacija');
    }
  } else {
    throw new Error('Lokacija je obavezna. Molimo odaberite lokaciju proizvoda.');
  }

  const newProduct = {
    id: maxId + 1,
    name: data.name,
    description: data.description,
    category: categoryObj, 
    price: parseFloat(data.price),
    saleType: data.saleType,
    datePublished: new Date().toISOString(),
    sellerId: data.sellerId, 
    status: 'active',
    deleted: false,
    images: images,
    location: locationData
  };

  products.push(newProduct);
  saveProducts(products);

  return newProduct;
}

function getAllProducts() {
  return loadProducts().filter(p => !p.deleted && p.status !== 'sold');
}

function getProductById(id) {
  const products = loadProducts();
  return products.find(p => p.id == id && !p.deleted);
}

function updateProduct(id, data, newImages = null) {
  const products = loadProducts();
  const product = products.find(p => p.id == id && !p.deleted);

  if (!product) return null;

  for (const key in data) {
    if (key !== "id" && key !== "deleted" && key !== "images" && key !== "location") {
      if (key === "category") {
        product.category = new Category(data.category);
      } else {
        product[key] = data[key];
      }
    }
  }

  if (newImages !== null) {
    product.images = newImages;
  }

  saveProducts(products);
  return product;
}

function logicalDeleteProduct(id) {
  const products = loadProducts();
  const product = products.find(p => p.id == id);

  if (!product) return null;

  
  product.deleted = true;
  product.status = 'deleted'; 
  saveProducts(products);
  return product;
}

function deleteProduct(id) {
  const products = loadProducts();
  const product = products.find(p => p.id == id);

  if (!product) return null;

  if (product.images && product.images.length > 0) {
    product.images.forEach(imagePath => {
      const fullPath = path.join(uploadsDir, path.basename(imagePath));
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    });
  }

  product.deleted = true;
  saveProducts(products);
  return product;
}

function deleteImage(productId, imagePath) {
  const products = loadProducts();
  const product = products.find(p => p.id == productId && !p.deleted);

  if (!product) return null;

  product.images = product.images.filter(img => img !== imagePath);

  const fullPath = path.join(uploadsDir, path.basename(imagePath));
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }

  saveProducts(products);
  return product;
}

function isAuctionEnded(product) {
  if (product.saleType !== 'auction') return false;
  return false;
}

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  logicalDeleteProduct,
  deleteProduct,
  deleteImage,
  isAuctionEnded,
};
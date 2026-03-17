const Category = require("./category");

class Product {
    constructor(id, name, description, category, price, saleType, sellerId, images = [], location = null) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.category = new Category(category); 
        this.price = parseFloat(price);
        this.saleType = saleType;
        this.datePublished = new Date().toISOString();
        this.sellerId = sellerId;
        this.status = 'active';
        this.deleted = false;
        this.images = images;
        this.location = location ? {
            latitude: location.latitude || null,
            longitude: location.longitude || null,
            street: location.street || '',
            houseNumber: location.houseNumber || '',
            city: location.city || '',
            postalCode: location.postalCode || '',
            country: location.country || '',
            fullAddress: location.fullAddress || ''
        } : null;
    }
}

module.exports = Product;
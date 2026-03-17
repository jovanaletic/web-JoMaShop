class Order {
  constructor(id, productId, buyerId, sellerId, price, status = 'Obrada', dateCreated, rejectionReason = null) {
    this.id = id;
    this.productId = productId;
    this.buyerId = buyerId;
    this.sellerId = sellerId;
    this.price = price;
    this.status = status; // 'Obrada', 'Odobreno', 'Odbačeno', 'Otkazano'
    this.dateCreated = dateCreated;
    this.rejectionReason = rejectionReason;
  }
}

module.exports = Order;
class Review {
  constructor(id, productId, sellerId, buyerId, orderId, rating, comment, dateCreated, reviewerRole = 'buyer') {
    this.id = id;
    this.productId = productId;
    this.sellerId = sellerId;
    this.buyerId = buyerId;
    this.orderId = orderId;
    this.rating = rating;
    this.comment = comment;
    this.dateCreated = dateCreated;
    this.reviewerRole = reviewerRole; // 'buyer' ili 'seller'
  }
}

module.exports = Review;
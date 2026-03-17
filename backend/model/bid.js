class Bid {
  constructor(id, productId, bidderId, bidAmount, dateBid) {
    this.id = id;
    this.productId = productId;
    this.bidderId = bidderId;
    this.bidAmount = bidAmount;
    this.dateBid = dateBid;
  }
}

module.exports = Bid;
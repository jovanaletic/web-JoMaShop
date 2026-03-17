const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const reviewService = require('../services/reviewService');
const reportService = require('../services/reportService');
const orderService = require('../services/orderService');
const productService = require('../services/productService');
const emailService = require('../services/emailService');

// ============= RECENZIJE =============

// Dobavljanje svih recenzija
router.get('/reviews', (req, res) => {
  try {
    const reviews = reviewService.getAllReviews();
    
    const enrichedReviews = reviews.map(review => {
      const buyer = userService.getUserById(review.buyerId);
      const seller = userService.getUserById(review.sellerId);
      const product = productService.getProductById(review.productId);
      
      return {
        ...review,
        buyerName: buyer ? `${buyer.ime} ${buyer.prezime}` : 'Nepoznat',
        sellerName: seller ? `${seller.ime} ${seller.prezime}` : 'Nepoznat',
        productName: product ? product.name : 'Nepoznat proizvod'
      };
    });
    
    res.json({ success: true, data: enrichedReviews });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Izmena recenzije
router.put('/reviews/:id', (req, res) => {
  try {
    const { rating, comment } = req.body;
    const reviews = reviewService.getAllReviews();
    const review = reviews.find(r => r.id == req.params.id);
    
    if (!review) {
      return res.status(404).json({ success: false, error: 'Recenzija nije pronađena' });
    }
    
    if (rating) review.rating = parseInt(rating);
    if (comment !== undefined) review.comment = comment;
    
    const fs = require('fs');
    const path = require('path');
    const reviewsFile = path.join(__dirname, '..', 'data', 'reviews.json');
    fs.writeFileSync(reviewsFile, JSON.stringify(reviews, null, 2));
    
    res.json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Brisanje recenzije
router.delete('/reviews/:id', (req, res) => {
  try {
    const reviews = reviewService.getAllReviews();
    const index = reviews.findIndex(r => r.id == req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Recenzija nije pronađena' });
    }
    
    reviews.splice(index, 1);
    
    const fs = require('fs');
    const path = require('path');
    const reviewsFile = path.join(__dirname, '..', 'data', 'reviews.json');
    fs.writeFileSync(reviewsFile, JSON.stringify(reviews, null, 2));
    
    res.json({ success: true, message: 'Recenzija obrisana' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============= PRIJAVE =============

// Prihvatanje prijave - blokira korisnika i logički briše proizvode
router.post('/reports/:id/accept', async (req, res) => {
  try {
    const { adminId } = req.body;
    const report = reportService.getReportById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ success: false, error: 'Prijava nije pronađena' });
    }
    
    // Blokiranje korisnika
    const blockedUser = userService.blockUser(report.reportedUserId);
    if (!blockedUser) {
      return res.status(404).json({ success: false, error: 'Korisnik nije pronađen' });
    }
    
    // ✅ LOGIČKO brisanje svih proizvoda korisnika (slike ostaju fizički)
    const products = productService.getAllProducts();
    const userProducts = products.filter(p => p.sellerId == report.reportedUserId && !p.deleted);
    userProducts.forEach(product => {
      productService.logicalDeleteProduct(product.id); // Samo logičko brisanje - slike ostaju
    });
    
    // Ažuriranje statusa prijave
    reportService.updateReportStatus(req.params.id, 'resolved', adminId, 'Prijava prihvaćena - korisnik blokiran');
    
    // Slanje email-a prijavljenom korisniku
    const reportedUser = userService.getUserById(report.reportedUserId);
    if (reportedUser && reportedUser.email) {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff0f5;">
          <div style="background: linear-gradient(135deg, #ff69b4, #c71585); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 32px;">JoMaShop</h1>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #dc3545;">Vaš nalog je blokiran ⛔</h2>
            <p style="font-size: 16px; color: #333;">Poštovani/a ${reportedUser.ime},</p>
            <p style="font-size: 16px; color: #333;">Obaveštavamo vas da je vaš nalog na JoMaShop platformi blokiran zbog prihvaćene prijave.</p>
            <div style="background: #f8d7da; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #dc3545;">
              <p style="font-size: 16px; color: #721c24; margin: 0;"><strong>Razlog:</strong> ${report.reason}</p>
            </div>
            <p style="font-size: 16px; color: #333;">Svi vaši proizvodi su uklonjeni sa platforme.</p>
            <p style="font-size: 14px; color: #666; margin-top: 30px;">Ukoliko smatrate da je došlo do greške, kontaktirajte našu podršku.</p>
          </div>
        </div>
      `;
      
      await emailService.sendEmail(reportedUser.email, 'JoMaShop - Vaš nalog je blokiran', emailHtml);
    }
    
    // Slanje email-a korisniku koji je podneo prijavu
    const reporter = userService.getUserById(report.reporterId);
    if (reporter && reporter.email) {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff0f5;">
          <div style="background: linear-gradient(135deg, #ff69b4, #c71585); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 32px;">JoMaShop</h1>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #4caf50;">Vaša prijava je prihvaćena ✅</h2>
            <p style="font-size: 16px; color: #333;">Poštovani/a ${reporter.ime},</p>
            <p style="font-size: 16px; color: #333;">Obaveštavamo vas da je vaša prijava protiv korisnika ${reportedUser.ime} ${reportedUser.prezime} prihvaćena.</p>
            <div style="background: #d4edda; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #4caf50;">
              <p style="font-size: 16px; color: #155724; margin: 0;">Prijavljeni korisnik je blokiran i njegovi proizvodi su uklonjeni.</p>
            </div>
            <p style="font-size: 14px; color: #666; margin-top: 30px;">Hvala što pomažete u održavanju bezbednosti naše platforme!</p>
          </div>
        </div>
      `;
      
      await emailService.sendEmail(reporter.email, 'JoMaShop - Prijava prihvaćena', emailHtml);
    }
    
    res.json({ 
      success: true, 
      message: 'Prijava prihvaćena, korisnik blokiran',
      deletedProducts: userProducts.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Odbijanje prijave
router.post('/reports/:id/reject', async (req, res) => {
  try {
    const { adminId, rejectionReason } = req.body;
    
    if (!rejectionReason) {
      return res.status(400).json({ success: false, error: 'Razlog odbijanja je obavezan' });
    }
    
    const report = reportService.getReportById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, error: 'Prijava nije pronađena' });
    }
    
    reportService.updateReportStatus(req.params.id, 'rejected', adminId, rejectionReason);
    
    const reporter = userService.getUserById(report.reporterId);
    const reportedUser = userService.getUserById(report.reportedUserId);
    
    // Email korisniku koji je podneo prijavu
    if (reporter && reporter.email) {
      const reporterEmailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff0f5;">
          <div style="background: linear-gradient(135deg, #ff69b4, #c71585); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 32px;">JoMaShop</h1>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #c71585;">Vaša prijava je odbijena</h2>
            <p style="font-size: 16px; color: #333;">Poštovani/a ${reporter.ime},</p>
            <p style="font-size: 16px; color: #333;">Nakon pregleda, vaša prijava je odbijena.</p>
            <div style="background: #fff3cd; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <p style="font-size: 16px; color: #856404; margin: 0;"><strong>Razlog odbijanja:</strong> ${rejectionReason}</p>
            </div>
            <p style="font-size: 14px; color: #666; margin-top: 30px;">Ukoliko imate dodatnih pitanja, kontaktirajte našu podršku.</p>
          </div>
        </div>
      `;
      
      await emailService.sendEmail(reporter.email, 'JoMaShop - Prijava odbijena', reporterEmailHtml);
    }
    
    // Email prijavljenom korisniku
    if (reportedUser && reportedUser.email) {
      const reportedEmailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff0f5;">
          <div style="background: linear-gradient(135deg, #ff69b4, #c71585); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 32px;">JoMaShop</h1>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #4caf50;">Prijava protiv vas je odbijena ✅</h2>
            <p style="font-size: 16px; color: #333;">Poštovani/a ${reportedUser.ime},</p>
            <p style="font-size: 16px; color: #333;">Obaveštavamo vas da je prijava protiv vašeg profila pregledana i odbijena od strane administratora.</p>
            <div style="background: #d4edda; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #4caf50;">
              <p style="font-size: 16px; color: #155724; margin: 0;">Vaš nalog je siguran i možete nastaviti da koristite platformu normalno.</p>
            </div>
            <p style="font-size: 14px; color: #666; margin-top: 30px;">Hvala što koristite JoMaShop!</p>
          </div>
        </div>
      `;
      
      await emailService.sendEmail(reportedUser.email, 'JoMaShop - Prijava odbijena', reportedEmailHtml);
    }
    
    res.json({ success: true, message: 'Prijava odbijena' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============= SUMNJIVI KORISNICI =============

// Dobavljanje sumnjivih korisnika (5+ otkazivanja u poslednjih 30 dana)
router.get('/suspicious-users', (req, res) => {
  try {
    const orders = orderService.getAllOrders();
    const users = userService.getAllUsers();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const suspiciousUsers = [];
    
    users.forEach(user => {
      if (user.uloga === 'administrator') return;
      
      const userCancellations = orders.filter(order => 
        order.buyerId == user.id && 
        order.status === 'Otkazano' &&
        new Date(order.dateCreated) >= thirtyDaysAgo
      );
      
      if (userCancellations.length >= 5) {
        suspiciousUsers.push({
          ...user,
          cancellationCount: userCancellations.length,
          lastCancellation: userCancellations[0]?.dateCreated
        });
      }
    });
    
    res.json({ success: true, data: suspiciousUsers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============= UPRAVLJANJE KORISNICIMA =============

// Dobavljanje svih korisnika (osim admin-a)
router.get('/users', (req, res) => {
  try {
    const users = userService.getAllUsers();
    const filteredUsers = users.map(user => {
      const { lozinka, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    res.json({ success: true, data: filteredUsers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Blokiranje korisnika
router.post('/users/:id/block', async (req, res) => {
  try {
    const user = userService.getUserById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'Korisnik nije pronađen' });
    }
    
    if (user.uloga === 'administrator') {
      return res.status(403).json({ success: false, error: 'Ne možete blokirati administratora' });
    }
    
    const blockedUser = userService.blockUser(req.params.id);
    
    // ✅ LOGIČKO brisanje svih proizvoda blokiranog korisnika (slike ostaju fizički)
    const products = productService.getAllProducts();
    const userProducts = products.filter(p => p.sellerId == req.params.id && !p.deleted);
    userProducts.forEach(product => {
      productService.logicalDeleteProduct(product.id); // Samo logičko brisanje - slike ostaju
    });
    
    // Slanje email obaveštenja
    if (blockedUser.email) {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff0f5;">
          <div style="background: linear-gradient(135deg, #ff69b4, #c71585); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 32px;">JoMaShop</h1>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #dc3545;">Vaš nalog je blokiran ⛔</h2>
            <p style="font-size: 16px; color: #333;">Poštovani/a ${blockedUser.ime},</p>
            <p style="font-size: 16px; color: #333;">Obaveštavamo vas da je vaš nalog na JoMaShop platformi blokiran od strane administratora.</p>
            <p style="font-size: 16px; color: #333;">Više nećete moći da se prijavljujete i koristite platformu.</p>
            <p style="font-size: 14px; color: #666; margin-top: 30px;">Za više informacija, kontaktirajte našu podršku.</p>
          </div>
        </div>
      `;
      
      await emailService.sendEmail(blockedUser.email, 'JoMaShop - Nalog blokiran', emailHtml);
    }
    
    res.json({ 
      success: true, 
      data: blockedUser,
      deletedProducts: userProducts.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Deblokiranje korisnika
router.post('/users/:id/unblock', async (req, res) => {
  try {
    const unblockedUser = userService.unblockUser(req.params.id);
    
    if (!unblockedUser) {
      return res.status(404).json({ success: false, error: 'Korisnik nije pronađen' });
    }
    
    // Pošalji email korisniku da je odblokiran
    await emailService.sendUnblockNotification(req.params.id);
    
    res.json({ success: true, data: unblockedUser });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
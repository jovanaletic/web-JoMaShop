const nodemailer = require('nodemailer');
require('dotenv').config();

// Konfigurisanje transportera
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verifikuj konekciju
transporter.verify((error, success) => {
  if (error) {
    console.error('Email transporter error:', error);
  } else {
    console.log('Email server je spreman za slanje poruka');
  }
});

async function sendEmail(to, subject, html) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: to,
      subject: subject,
      html: html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email poslat:', info.messageId);
    return info;
  } catch (error) {
    console.error('Greška pri slanju emaila:', error);
    throw error;
  }
}

// Email template za kupovinu/prodaju (fiksna cena)
async function sendPurchaseNotification(buyerId, sellerId, productName, price) {
  const userService = require('./userService');
  
  try {
    const buyer = userService.getUserById(buyerId);
    const seller = userService.getUserById(sellerId);

    if (!buyer || !seller) {
      console.error('Buyer or seller not found');
      return;
    }

    // Email za kupca
    const buyerEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff0f5;">
        <div style="background: linear-gradient(135deg, #ff69b4, #c71585); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 32px;">JoMaShop</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #c71585;">Vaša porudžbina je primljena, čeka odobrenje prodavca! 🎉</h2>
          <p style="font-size: 16px; color: #333;">Poštovani/a ${buyer.ime},</p>
          <p style="font-size: 16px; color: #333;">Vaša porudžbina je uspešno napravljena i čeka da je prodavac odobri:</p>
          <div style="background: #ffe4ec; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="color: #c71585; margin-top: 0;">${productName}</h3>
            <p style="font-size: 18px; color: #333;"><strong>Cena:</strong> ${price} RSD</p>
          </div>
          <p style="font-size: 16px; color: #333;">Vaša porudžbina je prosleđena prodavcu na odobravanje. Bićete obavešteni o daljem statusu putem email-a.</p>
          <p style="font-size: 14px; color: #666; margin-top: 30px;">Hvala što koristite JoMaShop!</p>
        </div>
      </div>
    `;

    // Email za prodavca
    const sellerEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff0f5;">
        <div style="background: linear-gradient(135deg, #ff69b4, #c71585); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 32px;">JoMaShop</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #c71585;">Proizvod je prodat! 💰</h2>
          <p style="font-size: 16px; color: #333;">Poštovani/a ${seller.ime},</p>
          <p style="font-size: 16px; color: #333;">Vaš proizvod je kupljen:</p>
          <div style="background: #ffe4ec; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="color: #c71585; margin-top: 0;">${productName}</h3>
            <p style="font-size: 18px; color: #333;"><strong>Cena:</strong> ${price} RSD</p>
            <p style="font-size: 16px; color: #333;"><strong>Kupac:</strong> ${buyer.ime} ${buyer.prezime}</p>
          </div>
          <p style="font-size: 16px; color: #333;">Prijavite se na platformu da biste odobrili ili odbili porudžbinu.</p>
          <p style="font-size: 14px; color: #666; margin-top: 30px;">Hvala što koristite JoMaShop!</p>
        </div>
      </div>
    `;

    if (buyer.email) {
      await sendEmail(buyer.email, `Uspešna kupovina - ${productName}`, buyerEmailHtml);
    }

    if (seller.email) {
      await sendEmail(seller.email, `Proizvod prodat - ${productName}`, sellerEmailHtml);
    }

  } catch (error) {
    console.error('Error sending purchase notification:', error);
  }
}

// Email za novu ponudu na aukciji
async function sendBidNotification(sellerId, bidderId, productName, bidAmount) {
  const userService = require('./userService');
  
  try {
    const seller = userService.getUserById(sellerId);
    const bidder = userService.getUserById(bidderId);

    if (!seller || !bidder) {
      console.error('Seller or bidder not found');
      return;
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff0f5;">
        <div style="background: linear-gradient(135deg, #ff69b4, #c71585); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 32px;">JoMaShop</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #c71585;">Nova ponuda na vašoj aukciji! 🔥</h2>
          <p style="font-size: 16px; color: #333;">Poštovani/a ${seller.ime},</p>
          <p style="font-size: 16px; color: #333;">Dobili ste novu ponudu za vaš proizvod:</p>
          <div style="background: #ffe4ec; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="color: #c71585; margin-top: 0;">${productName}</h3>
            <p style="font-size: 24px; color: #c71585; font-weight: bold; margin: 10px 0;">${bidAmount} RSD</p>
            <p style="font-size: 14px; color: #666;">Ponudu je dao/la: ${bidder.ime} ${bidder.prezime}</p>
          </div>
          <p style="font-size: 16px; color: #333;">Prijavite se na platformu da vidite sve ponude i eventualno završite aukciju.</p>
          <p style="font-size: 14px; color: #666; margin-top: 30px;">Hvala što koristite JoMaShop!</p>
        </div>
      </div>
    `;

    if (seller.email) {
      await sendEmail(seller.email, `Nova ponuda - ${productName}`, emailHtml);
    }

  } catch (error) {
    console.error('Error sending bid notification:', error);
  }
}

// Email za odobrenu porudžbinu
async function sendApprovalNotification(buyerId, sellerId, productName, price) {
  const userService = require('./userService');
  
  try {
    const buyer = userService.getUserById(buyerId);
    const seller = userService.getUserById(sellerId);

    if (!buyer || !seller) return;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff0f5;">
        <div style="background: linear-gradient(135deg, #ff69b4, #c71585); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 32px;">JoMaShop</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #4caf50;">Porudžbina odobrena! ✅</h2>
          <p style="font-size: 16px; color: #333;">Poštovani/a ${buyer.ime},</p>
          <p style="font-size: 16px; color: #333;">Vaša porudžbina je odobrena:</p>
          <div style="background: #d4f4dd; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #4caf50;">
            <h3 style="color: #1b5e20; margin-top: 0;">${productName}</h3>
            <p style="font-size: 18px; color: #333;"><strong>Cena:</strong> ${price} RSD</p>
            <p style="font-size: 16px; color: #333;"><strong>Prodavac:</strong> ${seller.ime} ${seller.prezime}</p>
          </div>
          <p style="font-size: 16px; color: #333;">Kontaktirajte prodavca za dogovor o preuzimanju/dostavi.</p>
          <p style="font-size: 14px; color: #666; margin-top: 30px;">Hvala što koristite JoMaShop!</p>
        </div>
      </div>
    `;

    if (buyer.email) {
      await sendEmail(buyer.email, `Porudžbina odobrena - ${productName}`, emailHtml);
    }

  } catch (error) {
    console.error('Error sending approval notification:', error);
  }
}

// Email za odbijenu porudžbinu
async function sendRejectionNotification(buyerId, sellerId, productName, reason) {
  const userService = require('./userService');
  
  try {
    const buyer = userService.getUserById(buyerId);
    const seller = userService.getUserById(sellerId);

    if (!buyer || !seller) return;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff0f5;">
        <div style="background: linear-gradient(135deg, #ff69b4, #c71585); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 32px;">JoMaShop</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #c71585;">Porudžbina odbijena</h2>
          <p style="font-size: 16px; color: #333;">Poštovani/a ${buyer.ime},</p>
          <p style="font-size: 16px; color: #333;">Nažalost, vaša porudžbina je odbijena:</p>
          <div style="background: #ffe4ec; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="color: #c71585; margin-top: 0;">${productName}</h3>
            <p style="font-size: 16px; color: #333;"><strong>Razlog:</strong> ${reason}</p>
          </div>
          <p style="font-size: 16px; color: #333;">Proizvod je ponovo dostupan za kupovinu.</p>
          <p style="font-size: 14px; color: #666; margin-top: 30px;">Hvala što koristite JoMaShop!</p>
        </div>
      </div>
    `;

    if (buyer.email) {
      await sendEmail(buyer.email, `Porudžbina odbijena - ${productName}`, emailHtml);
    }

  } catch (error) {
    console.error('Error sending rejection notification:', error);
  }
}

// Email za otkazanu porudžbinu
async function sendCancellationNotification(buyerId, sellerId, productName) {
  const userService = require('./userService');
  
  try {
    const buyer = userService.getUserById(buyerId);
    const seller = userService.getUserById(sellerId);

    if (!buyer || !seller) return;

    const sellerEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff0f5;">
        <div style="background: linear-gradient(135deg, #ff69b4, #c71585); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 32px;">JoMaShop</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #c71585;">Porudžbina otkazana</h2>
          <p style="font-size: 16px; color: #333;">Poštovani/a ${seller.ime},</p>
          <p style="font-size: 16px; color: #333;">Kupac je otkazao porudžbinu:</p>
          <div style="background: #ffe4ec; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="color: #c71585; margin-top: 0;">${productName}</h3>
            <p style="font-size: 16px; color: #333;"><strong>Kupac:</strong> ${buyer.ime} ${buyer.prezime}</p>
          </div>
          <p style="font-size: 16px; color: #333;">Proizvod je ponovo aktivan i dostupan za prodaju.</p>
          <p style="font-size: 14px; color: #666; margin-top: 30px;">Hvala što koristite JoMaShop!</p>
        </div>
      </div>
    `;

    if (seller.email) {
      await sendEmail(seller.email, `Porudžbina otkazana - ${productName}`, sellerEmailHtml);
    }

  } catch (error) {
    console.error('Error sending cancellation notification:', error);
  }
}

// Email za pobednika aukcije
async function sendAuctionWinnerNotification(email, userName, productName, finalPrice) {
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff0f5;">
      <div style="background: linear-gradient(135deg, #ff69b4, #c71585); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 32px;">JoMaShop</h1>
      </div>
      <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #4caf50;">Čestitamo! Pobedili ste na aukciji! 🏆</h2>
        <p style="font-size: 16px; color: #333;">Poštovani/a ${userName},</p>
        <p style="font-size: 16px; color: #333;">Vaša ponuda je bila najveća i osvojili ste proizvod:</p>
        <div style="background: #d4f4dd; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #4caf50;">
          <h3 style="color: #1b5e20; margin-top: 0;">${productName}</h3>
          <p style="font-size: 24px; color: #4caf50; font-weight: bold; margin: 10px 0;">Finalna cena: ${finalPrice} RSD</p>
        </div>
        <p style="font-size: 16px; color: #333;">Prodavac će vas kontaktirati uskoro radi dogovora o preuzimanju/dostavi.</p>
        <p style="font-size: 14px; color: #666; margin-top: 30px;">Hvala što koristite JoMaShop!</p>
      </div>
    </div>
  `;

  try {
    await sendEmail(email, `Pobedili ste na aukciji - ${productName}!`, emailHtml);
  } catch (error) {
    console.error('Error sending auction winner notification:', error);
  }
}

// Email za gubitnike aukcije
async function sendAuctionLostNotification(email, userName, productName, winningBid) {
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff0f5;">
      <div style="background: linear-gradient(135deg, #ff69b4, #c71585); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 32px;">JoMaShop</h1>
      </div>
      <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #c71585;">Aukcija je završena</h2>
        <p style="font-size: 16px; color: #333;">Poštovani/a ${userName},</p>
        <p style="font-size: 16px; color: #333;">Aukcija za proizvod je završena:</p>
        <div style="background: #ffe4ec; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3 style="color: #c71585; margin-top: 0;">${productName}</h3>
          <p style="font-size: 18px; color: #333;"><strong>Pobednička ponuda:</strong> ${winningBid} RSD</p>
        </div>
        <p style="font-size: 16px; color: #333;">Nažalost, vaša ponuda nije bila najveća ovaj put.</p>
        <p style="font-size: 16px; color: #333;">Posetite našu platformu da pronađete druge sjajne proizvode!</p>
        <p style="font-size: 14px; color: #666; margin-top: 30px;">Hvala što koristite JoMaShop!</p>
      </div>
    </div>
  `;

  try {
    await sendEmail(email, `Aukcija završena - ${productName}`, emailHtml);
  } catch (error) {
    console.error('Error sending auction lost notification:', error);
  }
}

// Email za prodavca kada se završi aukcija
async function sendAuctionEndedSellerNotification(email, sellerName, productName, finalPrice, winnerName) {
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff0f5;">
      <div style="background: linear-gradient(135deg, #ff69b4, #c71585); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 32px;">JoMaShop</h1>
      </div>
      <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #4caf50;">Aukcija uspešno završena! 💰</h2>
        <p style="font-size: 16px; color: #333;">Poštovani/a ${sellerName},</p>
        <p style="font-size: 16px; color: #333;">Vaša aukcija je završena:</p>
        <div style="background: #d4f4dd; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #4caf50;">
          <h3 style="color: #1b5e20; margin-top: 0;">${productName}</h3>
          <p style="font-size: 24px; color: #4caf50; font-weight: bold; margin: 10px 0;">Finalna cena: ${finalPrice} RSD</p>
          <p style="font-size: 16px; color: #333;"><strong>Pobednik:</strong> ${winnerName}</p>
        </div>
        <p style="font-size: 16px; color: #333;">Kontaktirajte kupca da dogovorite preuzimanje/dostavu proizvoda.</p>
        <p style="font-size: 14px; color: #666; margin-top: 30px;">Hvala što koristite JoMaShop!</p>
      </div>
    </div>
  `;

  try {
    await sendEmail(email, `Aukcija završena - ${productName}`, emailHtml);
  } catch (error) {
    console.error('Error sending auction ended seller notification:', error);
  }
}

// 2FA - Slanje OTP koda
async function send2FACode(email, userName, otpCode) {
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff0f5;">
      <div style="background: linear-gradient(135deg, #ff69b4, #c71585); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 32px;">JoMaShop</h1>
      </div>
      <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #c71585;">Vaš sigurnosni kod 🔒</h2>
        <p style="font-size: 16px; color: #333;">Poštovani/a ${userName},</p>
        <p style="font-size: 16px; color: #333;">Vaš kod za prijavu je:</p>
        <div style="background: #ffe4ec; padding: 30px; border-radius: 10px; margin: 20px 0; text-align: center; border: 3px solid #ff69b4;">
          <p style="font-size: 48px; color: #c71585; font-weight: bold; margin: 0; letter-spacing: 10px; font-family: monospace;">${otpCode}</p>
        </div>
        <p style="font-size: 16px; color: #333;">Ovaj kod je validan 10 minuta.</p>
        <p style="font-size: 14px; color: #999; margin-top: 30px;">Ako niste pokušali da se prijavite, molimo ignorišite ovu poruku.</p>
      </div>
    </div>
  `;

  try {
    await sendEmail(email, 'JoMaShop - Vaš sigurnosni kod', emailHtml);
  } catch (error) {
    console.error('Error sending 2FA code:', error);
    throw error;
  }
}

// Email za novu recenziju
async function sendReviewNotification(reviewedUserId, reviewerUserId, productName, rating, comment, reviewType) {
  const userService = require('./userService');
  
  try {
    const reviewedUser = userService.getUserById(reviewedUserId);
    const reviewer = userService.getUserById(reviewerUserId);

    if (!reviewedUser || !reviewer) return;

    const isBuyerReview = reviewType === 'buyer';
    
    const starsHtml = Array(5).fill(0).map((_, i) => 
      `<span style="font-size: 30px; color: ${i < rating ? '#FFD700' : '#ddd'};">★</span>`
    ).join('');

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff0f5;">
        <div style="background: linear-gradient(135deg, #ff69b4, #c71585); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 32px;">JoMaShop</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #ff69b4;">${isBuyerReview ? 'Dobili ste novu recenziju! ⭐' : 'Kupac vas je ocenio! ⭐'}</h2>
          <p style="font-size: 16px; color: #333;">Poštovani/a ${reviewedUser.ime},</p>
          <p style="font-size: 16px; color: #333;">${isBuyerReview ? 'Kupac' : 'Prodavac'} ${reviewer.ime} ${reviewer.prezime} je ${isBuyerReview ? 'ostavio/la recenziju' : 'vas ocenio/la'}:</p>
          
          <div style="background: #ffe4ec; padding: 25px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #ff69b4;">
            <h3 style="color: #c71585; margin-top: 0;">Proizvod: ${productName}</h3>
            <div style="margin: 15px 0;">
              ${starsHtml}
              <span style="font-size: 24px; color: #c71585; font-weight: bold; margin-left: 10px;">${rating}/5</span>
            </div>
            ${comment ? `
              <div style="background: white; padding: 15px; border-radius: 8px; margin-top: 15px;">
                <p style="color: #666; font-style: italic; margin: 0;">"${comment}"</p>
              </div>
            ` : ''}
            <p style="font-size: 14px; color: #666; margin-top: 15px; margin-bottom: 0;">
              <strong>Od:</strong> ${reviewer.ime} ${reviewer.prezime}
            </p>
          </div>
          
          <p style="font-size: 16px; color: #333;">Prijavite se na platformu da vidite sve vaše recenzije.</p>
          <p style="font-size: 14px; color: #666; margin-top: 30px;">Hvala što koristite JoMaShop!</p>
        </div>
      </div>
    `;

    if (reviewedUser.email) {
      await sendEmail(
        reviewedUser.email, 
        `Nova recenzija - ${productName}`, 
        emailHtml
      );
    }

  } catch (error) {
    console.error('Error sending review notification:', error);
  }
}

// Email za prijavu korisnika
async function sendUserReportNotification(reportedUserId, reporterUserId, reason) {
  const userService = require('./userService');
  
  try {
    const reportedUser = userService.getUserById(reportedUserId);
    const reporter = userService.getUserById(reporterUserId);

    if (!reportedUser || !reporter) return;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff0f5;">
        <div style="background: linear-gradient(135deg, #ff69b4, #c71585); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 32px;">JoMaShop</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #dc3545;">Vaš profil je prijavljen ⚠️</h2>
          <p style="font-size: 16px; color: #333;">Poštovani/a ${reportedUser.ime},</p>
          <p style="font-size: 16px; color: #333;">Obaveštavamo vas da je vaš profil prijavljen administratoru od strane drugog korisnika.</p>
          <div style="background: #fff3cd; padding: 25px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h3 style="color: #856404; margin-top: 0;">Detalji prijave</h3>
            <p style="font-size: 16px; color: #333; margin: 10px 0;">
              <strong>Prijavio/la:</strong> ${reporter.ime} ${reporter.prezime}
            </p>
            <p style="font-size: 16px; color: #333; margin: 10px 0;">
              <strong>Email:</strong> ${reporter.email}
            </p>
            <div style="background: white; padding: 15px; border-radius: 8px; margin-top: 15px;">
              <p style="font-size: 14px; color: #666; margin: 0;"><strong>Razlog prijave:</strong></p>
              <p style="color: #333; font-size: 16px; margin: 10px 0 0 0;">${reason}</p>
            </div>
          </div>
          
          <div style="background: #d1ecf1; padding: 20px; border-radius: 8px; border-left: 4px solid #17a2b8; margin: 20px 0;">
            <p style="color: #0c5460; margin: 0; font-size: 14px;">
              <strong>ℹ️ Napomena:</strong> Prijava je prosleđena administratoru na razmatranje. Administrativni tim će pregledati prijavu i preduzeti odgovarajuće mere ukoliko je to potrebno. Bićete obavešteni o ishodu prijave.
            </p>
          </div>
          
          <p style="font-size: 16px; color: #333;">Ako smatrate da je prijava nepravedna ili imate dodatna pitanja, možete kontaktirati naš tim podrške.</p>
          <p style="font-size: 14px; color: #666; margin-top: 30px;">Hvala što koristite JoMaShop!</p>
        </div>
      </div>
    `;

    if (reportedUser.email) {
      await sendEmail(
        reportedUser.email, 
        'JoMaShop - Vaš profil je prijavljen', 
        emailHtml
      );
    }

  } catch (error) {
    console.error('Error sending report notification:', error);
  }
}

// Email za odblokiranje korisnika
async function sendUnblockNotification(userId) {
  const userService = require('./userService');
  
  try {
    const user = userService.getUserById(userId);

    if (!user || !user.email) return;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff0f5;">
        <div style="background: linear-gradient(135deg, #ff69b4, #c71585); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 32px;">JoMaShop</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #4caf50;">Vaš nalog je odblokiran! ✅</h2>
          <p style="font-size: 16px; color: #333;">Poštovani/a ${user.ime},</p>
          <p style="font-size: 16px; color: #333;">Obaveštavamo vas da je vaš nalog ponovo aktivan.</p>
          
          <div style="background: #d4f4dd; padding: 25px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #4caf50;">
            <p style="color: #1b5e20; margin: 0; font-size: 16px;">
              <strong>✓ Status naloga:</strong> Aktivan
            </p>
            <p style="color: #333; margin: 15px 0 0 0; font-size: 14px;">
              Sada možete ponovo da se prijavite i koristite sve funkcionalnosti platforme.
            </p>
          </div>
          
          <div style="background: #d1ecf1; padding: 20px; border-radius: 8px; border-left: 4px solid #17a2b8; margin: 20px 0;">
            <p style="color: #0c5460; margin: 0; font-size: 14px;">
              <strong>ℹ️ Napomena:</strong> Molimo vas da se pridržavate pravila platforme kako biste nastavili da koristite naše usluge bez prekida.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:3000" style="display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #ff69b4, #c71585); color: white; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px;">
              Prijavite se
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 30px;">Hvala što koristite JoMaShop!</p>
        </div>
      </div>
    `;

    await sendEmail(user.email, 'JoMaShop - Nalog odblokiran', emailHtml);

  } catch (error) {
    console.error('Error sending unblock notification:', error);
  }
}

module.exports = {
  sendEmail,
  sendPurchaseNotification,
  sendBidNotification,
  sendApprovalNotification,
  sendRejectionNotification,
  sendCancellationNotification,
  sendAuctionWinnerNotification,
  sendAuctionLostNotification,
  sendAuctionEndedSellerNotification,
  send2FACode,
  sendReviewNotification,
  sendUserReportNotification,
  sendUnblockNotification
};
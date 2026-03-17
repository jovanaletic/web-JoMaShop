require('dotenv').config();
const express = require("express");
const cors = require("cors"); 
const path = require("path"); 

const app = express();
const PORT = 5000;


app.use(cors());


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


const productRoutes = require("./routes/productRoutes");
app.use("/products", productRoutes);

const userRoutes = require("./routes/userRoutes");
app.use("/users", userRoutes);

const categoryRoutes = require("./routes/categoryRoutes");
app.use("/categories", categoryRoutes);

const orderRoutes = require("./routes/orderRoutes");
app.use("/orders", orderRoutes);

const reviewRoutes = require('./routes/reviewRoutes');
app.use('/reviews', reviewRoutes);

const reportRoutes = require("./routes/reportRoutes");
app.use("/reports", reportRoutes);

const adminRoutes = require('./routes/adminRoutes');
app.use('/admin', adminRoutes);

app.listen(PORT, () => console.log(`Backend running at http://localhost:${PORT}`));
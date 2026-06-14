// server/src/index.ts
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import path from 'path';
import fs from 'fs';
import sequelize from './database';
import { Op } from 'sequelize'; 
import User from './models/User';
import Category from './models/Category';
import Listing from './models/Listing'; 
import Favorite from './models/Favorite'; 
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import { authenticateToken, AuthRequest } from './middleware/authMiddleware';

const app = express();

app.use(cors());
app.use(express.json());

// --- CLOUDINARY CONFIGURATION ---
console.log("🕵️ SERVER STARTUP: Running Cloudinary Polygraph Test...");
console.log("1. Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("2. API Key starts with:", process.env.CLOUDINARY_API_KEY ? process.env.CLOUDINARY_API_KEY.substring(0, 4) + "..." : "UNDEFINED ❌");
console.log("3. API Secret exists?", !!process.env.CLOUDINARY_API_SECRET);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'pccoe-marketplace', 
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'] 
    // Removed 'heic' and transformations temporarily to ensure the Free Tier isn't blocking the image manipulation
  } as any
});

const upload = multer({ storage: storage });
// --------------------------------

const upload = multer({ storage: storage });
// --------------------------------

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/dashboard-data', authenticateToken, (req: AuthRequest, res) => {
  res.json({ message: 'VIP Area', userThatRequestedThis: req.user });
});

app.get('/api/listings', async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice, sortBy } = req.query;
    let whereClause: any = {};

    if (search) whereClause.title = { [Op.iLike]: `%${search}%` }; 
    if (category && category !== 'All') whereClause.category = category;
    if (minPrice || maxPrice) {
      whereClause.price = {};
      if (minPrice) whereClause.price[Op.gte] = Number(minPrice); 
      if (maxPrice) whereClause.price[Op.lte] = Number(maxPrice); 
    }

    let orderClause: any = [['createdAt', 'DESC']]; 
    if (sortBy === 'price_low') orderClause = [['price', 'ASC']];
    if (sortBy === 'price_high') orderClause = [['price', 'DESC']];
    if (sortBy === 'oldest') orderClause = [['createdAt', 'ASC']];

    const allListings = await Listing.findAll({ where: whereClause, order: orderClause });
    res.json(allListings);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching listings' });
  }
});

app.get('/api/profile/listings', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const myListings = await Listing.findAll({
      where: { seller_email: req.user?.email },
      order: [['createdAt', 'DESC']]
    });
    res.json(myListings);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching profile listings' });
  }
});

// --- UPDATED POST ROUTE FOR CLOUDINARY ---
app.post('/api/listings', authenticateToken, upload.single('image'), async (req: AuthRequest, res) => {
  try {
    const { title, price, category } = req.body;
    const seller_email = req.user?.email || 'unknown@university.edu';
    
    const currentUser: any = await User.findOne({ where: { email: seller_email } });
    const seller_phone = currentUser?.phone_number || null;

    // Cloudinary automatically provides the secure, permanent URL in req.file.path
    const imageUrl = req.file ? req.file.path : null;

    const newListing = await Listing.create({
      title, price, category, seller_email, seller_phone, imageUrl
    });

    res.status(201).json(newListing);
} catch (err: any) {
    console.error("🔥 ACTUAL UPLOAD ERROR:", err.message || err);
    console.error("FULL DETAILS:", JSON.stringify(err, null, 2));
    res.status(500).json({ error: 'Server error creating listing' });
  }
});
// ------------------------------------------

app.delete('/api/listings/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const listing: any = await Listing.findByPk(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    if (listing.seller_email !== req.user?.email) return res.status(403).json({ error: 'Security alert' });

    // Ensure we don't try to locally delete a Cloudinary 'http' URL
    if (listing.imageUrl && !listing.imageUrl.startsWith('http')) {
      const imagePath = path.join(__dirname, '..', listing.imageUrl);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }

    await listing.destroy();
    res.json({ message: 'Listing deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error deleting listing' });
  }
});

app.put('/api/listings/:id/status', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const listing: any = await Listing.findByPk(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    if (listing.seller_email !== req.user?.email) return res.status(403).json({ error: 'Unauthorized' });

    listing.status = 'sold';
    await listing.save();
    res.json(listing);
  } catch (err) {
    res.status(500).json({ error: 'Server error updating status' });
  }
});

app.put('/api/listings/:id/price', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const listing: any = await Listing.findByPk(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    if (listing.seller_email !== req.user?.email) return res.status(403).json({ error: 'Unauthorized' });

    listing.price = req.body.newPrice;
    await listing.save();
    res.json(listing);
  } catch (err) {
    res.status(500).json({ error: 'Server error updating price' });
  }
});

app.post('/api/favorites', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const existingFavorite = await Favorite.findOne({ where: { user_email: req.user?.email, listing_id: req.body.listing_id } });
    if (existingFavorite) return res.status(400).json({ message: 'Item is already in your wishlist' });

    const newFavorite = await Favorite.create({ user_email: req.user?.email, listing_id: req.body.listing_id });
    res.status(201).json(newFavorite);
  } catch (err) {
    res.status(500).json({ error: 'Server error adding favorite' });
  }
});

app.delete('/api/favorites/:listingId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    await Favorite.destroy({ where: { user_email: req.user?.email, listing_id: req.params.listingId } });
    res.json({ message: 'Item removed from wishlist' });
  } catch (err) {
    res.status(500).json({ error: 'Server error removing favorite' });
  }
});

app.get('/api/favorites', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userFavorites: any = await Favorite.findAll({ where: { user_email: req.user?.email } });
    const favoriteListingIds = userFavorites.map((fav: any) => fav.listing_id);

    const favoritedItems = await Listing.findAll({
      where: { id: favoriteListingIds },
      order: [['createdAt', 'DESC']]
    });

    res.json({ favoriteIds: favoriteListingIds, items: favoritedItems });
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching favorites' });
  }
});

// --- ULTIMATE ERROR CATCHER ---
app.use((err: any, req: any, res: any, next: any) => {
  console.error("🔥 FATAL MIDDLEWARE ERROR:", err);
  res.status(500).json({ error: "Image upload failed. Check server logs." });
});

sequelize.authenticate()
  .then(async () => {
    console.log('✅ Database connection has been established successfully.');
    await sequelize.sync({ alter: true }); 
    console.log('📦 Database tables synced!');

    const count = await Listing.count();
    if (count === 0) {
      console.log('🌱 Database is empty. Seeding realistic sample items...');
      
      await Listing.bulkCreate([
        { title: "Casio fx-991EX Scientific Calculator", price: 800, category: "Electronics", seller_email: "alumni@pccoe.edu", seller_phone: "919876543210", status: "available" },
        { title: "Data Structures & Algorithms by Karumanchi", price: 450, category: "Textbooks", seller_email: "senior@pccoe.edu", seller_phone: "919876543210", status: "available" },
        { title: "FOUND: Blue PCCOE ID Card near Canteen", price: 0, category: "Lost & Found", seller_email: "helpful_student@pccoe.edu", seller_phone: "919876543210", status: "available" },
        { title: "Will tutor Java & OOP Concepts (Per Hour)", price: 200, category: "Skills & Services", seller_email: "coder@pccoe.edu", seller_phone: "919876543210", status: "available" },
        { title: "Pigeon Electric Kettle 1.5L", price: 400, category: "Dorm Essentials", seller_email: "hostel_guy@pccoe.edu", seller_phone: "919876543210", status: "available" },
        { title: "Logitech B170 Wireless Mouse", price: 300, category: "Electronics", seller_email: "alumni@pccoe.edu", seller_phone: "919876543210", status: "available" },
        { title: "LOST: Black Fastrack Watch in Library", price: 0, category: "Lost & Found", seller_email: "stressed_student@pccoe.edu", seller_phone: "919876543210", status: "available" },
        { title: "Database System Concepts 7th Edition", price: 550, category: "Textbooks", seller_email: "cs_major@pccoe.edu", seller_phone: "919876543210", status: "available" },
        { title: "Foldable Study Table for Bed", price: 250, category: "Dorm Essentials", seller_email: "hostel_guy@pccoe.edu", seller_phone: "919876543210", status: "sold" },
        { title: "Resume Review & Tech Interview Prep", price: 0, category: "Skills & Services", seller_email: "senior@pccoe.edu", seller_phone: "919876543210", status: "available" }
      ]);
      
      console.log('✅ Seed data injected successfully!');
    }

    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((error) => console.error('❌ Unable to connect to the database:', error));
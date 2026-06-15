// server/src/index.ts
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import sequelize from './database';
import { Op } from 'sequelize'; 
import User from './models/User';
import Category from './models/Category';
import Listing from './models/Listing'; 
import Favorite from './models/Favorite'; 
import Message from './models/Message';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import { authenticateToken, AuthRequest } from './middleware/authMiddleware';

const app = express();

app.use(cors());
app.use(express.json());

// --- 🧰 CLOUDINARY STORAGE ---
// Note: We don't need cloudinary.config() at all! 
// The SDK automatically finds the CLOUDINARY_URL variable in your Render dashboard.
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'student-marketplace', 
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'] 
  } as any
});

const upload = multer({ storage: storage });
// -----------------------------------------------------------

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

// --- 🚀 THE POST ROUTE ---
app.post('/api/listings', authenticateToken, upload.single('image'), async (req: AuthRequest, res) => {
  try {
    console.log("📥 PARSED FRONTEND DATA:", JSON.stringify(req.body, null, 2));
    
    const { title, price, category } = req.body;
    const seller_email = req.user?.email || 'unknown@university.edu';
    
    const currentUser: any = await User.findOne({ where: { email: seller_email } });
    const seller_phone = currentUser?.phone_number || null;

    const imageUrl = req.file ? req.file.path : null;
    console.log("📸 CLOUDINARY IMAGE URL:", imageUrl);

    const newListing = await Listing.create({
      title, price, category, seller_email, seller_phone, imageUrl
    });

    console.log("✅ SAVED TO DATABASE SUCCESSFULLY!");
    res.status(201).json(newListing);
} catch (err: any) {
    console.error("🔥 ROUTE ERROR:", err.message);
    res.status(500).json({ error: 'Server error creating listing' });
  }
});
// ------------------------------------------

app.delete('/api/listings/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const listing: any = await Listing.findByPk(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    if (listing.seller_email !== req.user?.email) return res.status(403).json({ error: 'Security alert' });

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
  // We use err.message and err.stack here so it NEVER prints [object Object] again
  console.error("🔥 FATAL MIDDLEWARE ERROR:", err.message || err);
  if (err.stack) console.error(err.stack);
  res.status(500).json({ error: "Server crashed during upload." });
});

// 🚀 1. OPEN THE PORT IMMEDIATELY FOR RENDER
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server instantly running on port ${PORT}`);
});

// 📦 2. CONNECT TO THE DATABASE IN THE BACKGROUND
sequelize.authenticate()
  .then(async () => {
    console.log('✅ Database connection has been established successfully.');
    await sequelize.sync({ alter: true }); 
    console.log('📦 Database tables synced!');
  })
  .catch((error) => console.error('❌ Unable to connect to the database:', error));
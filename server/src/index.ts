// server/src/index.ts
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp'; // <-- NEW: Import Image Compressor
import sequelize from './database';
import { Op } from 'sequelize'; 
import User from './models/User';
import Category from './models/Category';
import Listing from './models/Listing'; 
import Favorite from './models/Favorite'; 
import authRoutes from './routes/auth';
import { authenticateToken, AuthRequest } from './middleware/authMiddleware';

const app = express();

app.use(cors());
app.use(express.json());

// --- UPGRADED IMAGE UPLOAD SETUP ---
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// NEW: Store files in RAM temporarily so Sharp can compress them first
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use('/uploads', express.static(uploadDir));
// ---------------------------

app.use('/api/auth', authRoutes);

app.get('/api/dashboard-data', authenticateToken, (req: AuthRequest, res) => {
  res.json({ message: 'VIP Area', userThatRequestedThis: req.user });
});

app.get('/api/listings', authenticateToken, async (req: AuthRequest, res) => {
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

// --- UPGRADED POST ROUTE (With Sharp Compression) ---
app.post('/api/listings', authenticateToken, upload.single('image'), async (req: AuthRequest, res) => {
  try {
    const { title, price, category } = req.body;
    const seller_email = req.user?.email || 'unknown@university.edu';
    
    const currentUser: any = await User.findOne({ where: { email: seller_email } });
    const seller_phone = currentUser?.phone_number || null;

    let imageUrl = null;

    // NEW: Compression Logic
    if (req.file) {
      const filename = Date.now() + '-' + Math.round(Math.random() * 1E9) + '.webp';
      const outputPath = path.join(uploadDir, filename);

      // Take the massive image, resize it to a max of 800px wide, and compress to WebP
      await sharp(req.file.buffer)
        .resize({ width: 800, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(outputPath);

      imageUrl = `/uploads/${filename}`;
    }

    const newListing = await Listing.create({
      title, price, category, seller_email, seller_phone, imageUrl
    });

    res.status(201).json(newListing);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error creating listing' });
  }
});
// ----------------------------------------------------

app.delete('/api/listings/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const listing: any = await Listing.findByPk(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    if (listing.seller_email !== req.user?.email) return res.status(403).json({ error: 'Security alert' });

    if (listing.imageUrl) {
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

sequelize.authenticate()
  .then(async () => {
    console.log('✅ Database connection has been established successfully.');
    await sequelize.sync({ alter: true }); 
    console.log('📦 Database tables synced!');

    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((error) => console.error('❌ Unable to connect to the database:', error));
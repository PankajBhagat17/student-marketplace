// server/src/index.ts
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sequelize from './database';
import User from './models/User';
import Category from './models/Category';
import Listing from './models/Listing'; 
import authRoutes from './routes/auth';
import { authenticateToken, AuthRequest } from './middleware/authMiddleware';

const app = express();

app.use(cors());
app.use(express.json());

// --- IMAGE UPLOAD SETUP ---
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

app.use('/uploads', express.static(uploadDir));
// ---------------------------

app.use('/api/auth', authRoutes);

app.get('/api/dashboard-data', authenticateToken, (req: AuthRequest, res) => {
  res.json({ message: 'VIP Area', userThatRequestedThis: req.user });
});

// GET: Fetch all listings
app.get('/api/listings', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const allListings = await Listing.findAll({ order: [['createdAt', 'DESC']] });
    res.json(allListings);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching listings' });
  }
});

// --- NEW ROUTE: Fetch ONLY the logged-in user's listings for their Profile ---
app.get('/api/profile/listings', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userEmail = req.user?.email;
    
    // This translates directly to: SELECT * FROM listings WHERE seller_email = 'user@email.com'
    const myListings = await Listing.findAll({
      where: { seller_email: userEmail },
      order: [['createdAt', 'DESC']]
    });
    
    res.json(myListings);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching profile listings' });
  }
});
// -----------------------------------------------------------------------------

// POST: Create a new listing
app.post('/api/listings', authenticateToken, upload.single('image'), async (req: AuthRequest, res) => {
  try {
    const { title, price, category } = req.body;
    const seller_email = req.user?.email || 'unknown@university.edu';
    
    // --- Look up the user in the database to get their phone number ---
    const currentUser: any = await User.findOne({ where: { email: seller_email } });
    const seller_phone = currentUser?.phone_number || null;
    // -----------------------------------------------------------------------

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    // Save the new listing with the phone number attached
    const newListing = await Listing.create({
      title,
      price,
      category,
      seller_email,
      seller_phone, 
      imageUrl
    });

    res.status(201).json(newListing);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error creating listing' });
  }
});

// DELETE: Remove a listing securely
app.delete('/api/listings/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const listingId = req.params.id;
    const userEmail = req.user?.email;

    // 1. Find the listing in the database
    const listing: any = await Listing.findByPk(listingId);

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    // 2. Security Check: Does the logged-in user own this listing?
    if (listing.seller_email !== userEmail) {
      return res.status(403).json({ error: 'Security alert: You can only delete your own listings' });
    }

    // 3. Optional Cleanup: Delete the image file from the hard drive if it exists
    if (listing.imageUrl) {
      const imagePath = path.join(__dirname, '..', listing.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // 4. Destroy the database record!
    await listing.destroy();
    res.json({ message: 'Listing deleted successfully' });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error deleting listing' });
  }
});

// --- PUT ROUTE: Mark a listing as SOLD ---
app.put('/api/listings/:id/status', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const listingId = req.params.id;
    const userEmail = req.user?.email;

    // 1. Find the listing
    const listing: any = await Listing.findByPk(listingId);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    // 2. Security Check: Only the owner can mark it sold
    if (listing.seller_email !== userEmail) {
      return res.status(403).json({ error: 'You can only update your own listings' });
    }

    // 3. Update and save
    listing.status = 'sold';
    await listing.save();
    
    res.json(listing);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error updating status' });
  }
});
// ----------------------------------------------

// --- NEW PUT ROUTE: Update a listing's price ---
app.put('/api/listings/:id/price', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const listingId = req.params.id;
    const userEmail = req.user?.email;
    const { newPrice } = req.body; 

    if (!newPrice || isNaN(newPrice)) {
      return res.status(400).json({ error: 'A valid price is required' });
    }

    // 1. Find the listing
    const listing: any = await Listing.findByPk(listingId);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    // 2. Security Check: Only the owner can change the price
    if (listing.seller_email !== userEmail) {
      return res.status(403).json({ error: 'You can only edit your own listings' });
    }

    // 3. Update the price and save
    listing.price = newPrice;
    await listing.save();
    
    res.json(listing);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error updating price' });
  }
});
// ----------------------------------------------

// Test the database connection AND sync the models
sequelize.authenticate()
  .then(async () => {
    console.log('✅ Database connection has been established successfully.');
    await sequelize.sync({ alter: true }); 
    console.log('📦 Database tables synced!');

    // Use Render's dynamically assigned port, or fall back to 5001 for local development
    const PORT = process.env.PORT || 5001;

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ Unable to connect to the database:', error);
  });
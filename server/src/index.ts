// server/src/index.ts
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
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

// --- 🔌 SOCKET.IO SETUP ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // We will lock this down to your Vercel URL later for security
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log(`🟢 User connected: ${socket.id}`);

  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`🚪 User joined room: ${room}`);
  });

  socket.on('send_message', async (data) => {
    try {
      const savedMessage = await Message.create({
        listing_id: data.listing_id,
        sender_email: data.sender_email,
        receiver_email: data.receiver_email,
        content: data.content
      });
      io.to(data.room).emit('receive_message', savedMessage);
    } catch (err) {
      console.error("🔥 Error saving message:", err);
    }
  });

  // --- NEW: Handle Read Receipts ---
  socket.on('mark_read', async (data) => {
    try {
      await Message.update(
        { is_read: true },
        { where: { room: data.room, receiver_email: data.user_email, is_read: false } }
      );
      // Tell everyone in the room that messages were read
      io.to(data.room).emit('messages_read', { user_email: data.user_email });
    } catch (err) {
      console.error("🔥 Error marking read:", err);
    }
  });

  // --- NEW: Handle Message Editing ---
  socket.on('edit_message', async (data) => {
    try {
      const messageToEdit: any = await Message.findByPk(data.message_id);
      
      // Security Check: Only the sender can edit, and ONLY if it hasn't been read
      if (messageToEdit && messageToEdit.sender_email === data.sender_email && !messageToEdit.is_read) {
        messageToEdit.content = data.new_content;
        messageToEdit.is_edited = true;
        await messageToEdit.save();
        
        io.to(data.room).emit('message_edited', messageToEdit);
      }
    } catch (err) {
      console.error("🔥 Error editing message:", err);
    }
  });

  // --- NEW: Handle Message Deletion ---
  socket.on('delete_message', async (data) => {
    try {
      const messageToDelete: any = await Message.findByPk(data.message_id);
      
      // Security Check: Only the sender can delete
      if (messageToDelete && messageToDelete.sender_email === data.sender_email) {
        await messageToDelete.destroy();
        io.to(data.room).emit('message_deleted', { message_id: data.message_id });
      }
    } catch (err) {
      console.error("🔥 Error deleting message:", err);
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔴 User disconnected: ${socket.id}`);
  });
});
// ----------------------------

// --- 🧰 CLOUDINARY STORAGE ---
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

// --- 📥 THE INBOX ROUTE (WHATSAPP-STYLE) ---
app.get('/api/messages/inbox', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userEmail = req.user?.email;

    // 1. Find EVERY message where the user is either the sender OR the receiver
    const allMessages: any = await Message.findAll({
      where: {
        [Op.or]: [
          { sender_email: userEmail },
          { receiver_email: userEmail }
        ]
      },
      order: [['createdAt', 'ASC']] 
    });

    // 2. Group them into distinct conversations (Inbox Threads)
    const inboxMap = new Map();

    for (const msg of allMessages) {
      const otherPerson = msg.sender_email === userEmail ? msg.receiver_email : msg.sender_email;
      const convoKey = `${msg.listing_id}_${otherPerson}`;

      if (!inboxMap.has(convoKey)) {
        const listing: any = await Listing.findByPk(msg.listing_id);
        inboxMap.set(convoKey, {
          listing_id: msg.listing_id,
          listing_title: listing ? listing.title : 'Deleted Item',
          seller_email: listing ? listing.seller_email : otherPerson, 
          other_person_email: otherPerson,
          past_messages: [] 
        });
      }
      inboxMap.get(convoKey).past_messages.push(msg);
    }

    // 3. Sort by most recent activity
    const inboxArray = Array.from(inboxMap.values()).sort((a, b) => {
      const lastMsgA = a.past_messages[a.past_messages.length - 1];
      const lastMsgB = b.past_messages[b.past_messages.length - 1];
      return new Date(lastMsgB.createdAt).getTime() - new Date(lastMsgA.createdAt).getTime();
    });

    res.json(inboxArray);
  } catch (err: any) {
    console.error('🔥 Inbox Fetch Error:', err.message);
    res.status(500).json({ error: 'Failed to load inbox' });
  }
});
// ------------------------------------------

// --- ULTIMATE ERROR CATCHER ---
app.use((err: any, req: any, res: any, next: any) => {
  console.error("🔥 FATAL MIDDLEWARE ERROR:", err.message || err);
  if (err.stack) console.error(err.stack);
  res.status(500).json({ error: "Server crashed during upload." });
});

// 🚀 1. OPEN THE PORT IMMEDIATELY FOR RENDER
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`🚀 Server instantly running on port ${PORT}`);
});

// 📦 2. CONNECT TO THE DATABASE IN THE BACKGROUND
sequelize.authenticate()
  .then(async () => {
    console.log('✅ Database connection has been established successfully.');
await sequelize.sync({ alter: true }); // WARNING: THIS WILL DELETE ALL EXISTING DATA    console.log('📦 Database tables synced!');
  })
  .catch((error) => console.error('❌ Unable to connect to the database:', error));
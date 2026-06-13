// server/src/routes/auth.ts
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken'; // <-- Add this new import
import User from '../models/User';

const router = Router();

// ... (Keep your existing router.post('/register', ...) code here) ...

// === NEW LOGIN ROUTE ===
router.post('/login', async (req, res): Promise<any> => {
  try {
    const { email, password } = req.body;

    // 1. Check if they provided both email and password
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // 2. Find the user in the database
    const user: any = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' }); // Don't tell them which one was wrong!
    }

    // 3. Compare the typed password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // 4. Create the "wristband" (JWT Token)
    // We embed their ID and college domain in the token so we know who they are later
    const payload = {
      userId: user.id,
      email: user.email,
      college_domain: user.college_domain
    };

    // Sign the token using the secret key from our .env file
    const secret = process.env.JWT_SECRET || 'fallback_secret';
    const token = jwt.sign(payload, secret, { expiresIn: '7d' }); // Token lasts for 7 days

    // 5. Send the token and user data back to the frontend
    return res.status(200).json({
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
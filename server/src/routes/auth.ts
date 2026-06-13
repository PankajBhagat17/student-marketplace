// server/src/routes/auth.ts
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const router = Router();

// === REGISTER ROUTE ===
router.post('/register', async (req, res): Promise<any> => {
  try {
    const { email, password, first_name, last_name } = req.body;

    // 1. Check for required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // 2. Check if user already exists
    const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already registered.' });
    }

    // 3. Hash the password for security
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    
    // Extract the college domain (e.g., pccoe.edu from bhumi@pccoe.edu)
    const college_domain = email.split('@')[1] || 'unknown';

    // 4. Save to the database
    const newUser = await User.create({
      email: email.toLowerCase(),
      password_hash,
      first_name: first_name || 'New',
      last_name: last_name || 'Student',
      college_domain
    });

    return res.status(201).json({ message: 'User registered successfully!' });

  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// === LOGIN ROUTE ===
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
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // 3. Compare the typed password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // 4. Create the JWT Token
    const payload = {
      userId: user.id,
      email: user.email,
      college_domain: user.college_domain
    };

    const secret = process.env.JWT_SECRET || 'fallback_secret';
    const token = jwt.sign(payload, secret, { expiresIn: '7d' });

    // 5. Send the token and user data back
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
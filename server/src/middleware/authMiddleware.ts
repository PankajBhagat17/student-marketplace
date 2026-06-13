// server/src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// We extend the default Express Request so we can safely attach our user data to it
export interface AuthRequest extends Request {
  user?: any;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): any => {
  // 1. Look for the wristband in the headers (It usually looks like "Bearer eyJhbG...")
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.split(' ')[1]; 

  // 2. No wristband? Stop them right here.
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    // 3. Verify the token using your secret key
    const secret = process.env.JWT_SECRET || 'fallback_secret';
    const verified = jwt.verify(token, secret);
    
    // 4. It's valid! Attach the decoded user payload to the request and let them through
    req.user = verified;
    next(); 
  } catch (err) {
    // 5. If the token is fake or expired, kick them out
    res.status(403).json({ error: 'Invalid or expired token.' });
  }
};

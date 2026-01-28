import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../lib/supabase.js';
import { sendEmailCode } from '../lib/email.js';
import { generateToken } from '../lib/auth.js';
import fs from 'fs';
import path from 'path';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'default-dev-secret-key-change-me';

// Store verification codes in memory (In production, use Redis)
const verificationCodes = new Map<string, { code: string, expires: number }>();

import rateLimit from 'express-rate-limit';

// 1. Rate Limiter for sending codes
const sendCodeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1, // Limit each IP to 1 request per minute
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Send Verification Code
 * POST /api/auth/send-code
 */
router.post('/send-code', sendCodeLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    
    // Strict email validation regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email || !emailRegex.test(email)) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Store code
    verificationCodes.set(email, { code, expires });

    // Send email
    console.log(`[Backend] Sending code ${code} to ${email}`);
    await sendEmailCode(email, code);

    res.json({ message: 'Verification code sent' });
  } catch (error) {
    console.error('Error sending code:', error);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
});

/**
 * User Login
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // 1. Find user by email
    console.log(`[Backend] Searching for user: ${email}`);
    
    const { data: userRecord, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    // Debug log
    console.log(`[Backend] Search result:`, userRecord ? `Found ID: ${userRecord.id}` : 'Not Found');

    if (error || !userRecord) {
      console.log('[Backend] Returning 401 - User not found');
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // 2. Check password
    const isValid = await bcrypt.compare(password, userRecord.password_hash);
    
    if (!isValid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // 3. Get profile (Optional)
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userRecord.id)
      .maybeSingle();

    // 4. Generate Token
    const payload = {
      id: userRecord.id,
      email: userRecord.email,
      username: profile?.username || 'User'
    };
    
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    // Define user object
    const user = {
      id: userRecord.id,
      email: userRecord.email,
      role: userRecord.role || 'user',
      user_metadata: {
        full_name: profile?.username || 'User',
        avatar_url: profile?.avatar_url
      }
    };

    res.json({
      message: 'Login successful',
      token,
      user
    });

  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * User Register
 * POST /api/auth/register
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, code } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Strict email validation regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }

    // 1. Check if user exists
    const { data: existing } = await supabase
      .from('accounts')
      .select('id')
      .eq('email', email)
      .maybeSingle();
      
    if (existing) {
      res.status(400).json({ error: 'Email already registered' });
      return;
    }

    // 2. Verify Code
    if (!code) {
       res.status(400).json({ error: 'Verification code is required' });
       return;
    }

    const storedCode = verificationCodes.get(email);
    if (!storedCode || storedCode.code !== code || Date.now() > storedCode.expires) {
      res.status(400).json({ error: 'Invalid or expired verification code' });
      return;
    }

    // Clear code after usage
    verificationCodes.delete(email);

    // 3. Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // 4. Create User (Skip Profile creation as requested)
    const { data: newUser, error: createError } = await supabase
      .from('accounts')
      .insert({ 
        email, 
        password_hash
      })
      .select()
      .single();

    if (createError || !newUser) {
      console.error('Create user error:', createError);
      throw new Error('Failed to create user');
    }

    // 4.5 Create default profile
    const username = email.split('@')[0];
    
    // Get random avatar from local filesystem
    let avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`; // fallback
    try {
      // Robustly select from local avatars if available
      const avatarsDir = path.join(process.cwd(), 'public', 'avatars');
      if (fs.existsSync(avatarsDir)) {
          const files = fs.readdirSync(avatarsDir).filter(f => f.endsWith('.svg'));
          if (files.length > 0) {
              const randomFile = files[Math.floor(Math.random() * files.length)];
              avatarUrl = `/avatars/${randomFile}`;
          }
      }
    } catch (err) {
        console.error('Error selecting local avatar:', err);
    }
    
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: newUser.id,
        username: username,
        full_name: username,
        avatar_url: avatarUrl
      });

    if (profileError) {
      console.error('Create profile error:', profileError);
      // Continue anyway, profile can be created later or is optional for some flows
    }

    // 5. Generate Token
    // const username = email.split('@')[0]; // Already defined above
    const payload = {
      id: newUser.id,
      email: newUser.email,
      username
    };
    
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    // 6. Return success
    const user = {
      id: newUser.id,
      email: newUser.email,
      role: 'user',
      user_metadata: {
        full_name: username,
        avatar_url: avatarUrl
      }
    };

    res.status(201).json({
      message: 'Registration successful',
      token,
      user
    });

  } catch (error: any) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: error.message || 'Registration failed' });
  }
});

/**
 * Verify Token & Get Current User
 * GET /api/auth/me
 */
router.get('/me', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing token' });
      return;
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (!decoded || !decoded.id) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    // Check if user still exists in DB
    const { data: userRecord, error } = await supabase
      .from('accounts')
      .select('id, email, role')
      .eq('id', decoded.id)
      .maybeSingle();

    if (error || !userRecord) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    // Get profile (Optional)
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userRecord.id)
      .maybeSingle();

    const user = {
      id: userRecord.id,
      role: userRecord.role || 'user',
      email: userRecord.email,
      user_metadata: {
        full_name: profile?.username || 'User',
        avatar_url: profile?.avatar_url
      }
    };

    res.json({ user });

  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

export default router;

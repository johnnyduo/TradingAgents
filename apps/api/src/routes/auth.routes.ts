import { Router } from 'express';
import { supabase } from '../db/supabase';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { nanoid } from 'nanoid';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Register
router.post('/register', async (req, res, next) => {
  try {
    const validated = registerSchema.parse(req.body);

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('User')
      .select('id')
      .eq('email', validated.email)
      .single();

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists',
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(validated.password, 10);

    // Create user
    const userId = nanoid();
    const { data: user, error: createError } = await supabase
      .from('User')
      .insert({
        id: userId,
        email: validated.email,
        passwordHash,
        name: validated.name,
      })
      .select()
      .single();

    if (createError || !user) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create user',
      });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }
    next(error);
  }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const validated = loginSchema.parse(req.body);

    // Find user
    const { data: user, error } = await supabase
      .from('User')
      .select('*')
      .eq('email', validated.email)
      .single();

    if (error || !user || !user.passwordHash) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Verify password
    const isValid = await bcrypt.compare(validated.password, user.passwordHash);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }
    next(error);
  }
});

export default router;

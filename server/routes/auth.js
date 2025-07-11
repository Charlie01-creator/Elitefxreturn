const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { jwtSecret, jwtExpiresIn } = require('../config/auth');
const rateLimit = require('express-rate-limit');
const router = express.Router();

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});

router.use(authLimiter);

// @route    POST api/auth/register
// @desc     Register user
// @access   Public
router.post('/register', async (req, res) => {
  const { fullname, email, phone, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or phone already exists'
      });
    }

    // Create new user
    const user = new User({
      fullname,
      email,
      phone,
      password,
      isVerified: true, // Set to false if implementing email verification
      hasPaid: false,
    });

    await user.save();

    // Create JWT token
    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      jwtSecret,
      { expiresIn: jwtExpiresIn },
      (err, token) => {
        if (err) throw err;
        res.status(201).json({
          success: true,
          token,
          user: {
            id: user._id,
            fullname: user.fullname,
            email: user.email,
            phone: user.phone,
            isVerified: user.isVerified,
            hasPaid: user.hasPaid,
            accountBalance: user.accountBalance,
          },
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// @route    POST api/auth/login
// @desc     Login user
// @access   Public
router.post('/login', async (req, res) => {
  const { emailOrPhone, password } = req.body;

  try {
    // Find user by email or phone
    const user = await User.findOne({
      $or: [{ email: emailOrPhone }, { phone: emailOrPhone }],
    }).select('+password +loginAttempts +lockUntil');

    if (!user) {
      return res.status(400).json({
        success: false,
        code: 'USER_NOT_FOUND',
        message: 'Account not found. Please check your credentials or register.',
      });
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const remainingTime = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_LOCKED',
        message: `Account temporarily locked. Try again in ${remainingTime} minutes.`,
      });
    }

    // Check password
    await user.comparePassword(password);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Create JWT token
    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      jwtSecret,
      { expiresIn: jwtExpiresIn },
      (err, token) => {
        if (err) throw err;
        res.json({
          success: true,
          token,
          user: {
            id: user._id,
            fullname: user.fullname,
            email: user.email,
            phone: user.phone,
            isVerified: user.isVerified,
            hasPaid: user.hasPaid,
            accountBalance: user.accountBalance,
            lastLogin: user.lastLogin,
          },
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    let statusCode = 400;
    let errorCode = 'INVALID_CREDENTIALS';
    let errorMessage = 'Invalid email/phone or password';

    if (err.message.includes('Account temporarily locked')) {
      statusCode = 403;
      errorCode = 'ACCOUNT_LOCKED';
      errorMessage = err.message;
    }

    res.status(statusCode).json({
      success: false,
      code: errorCode,
      message: errorMessage,
    });
  }
});

module.exports = router;

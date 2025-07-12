const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const router = express.Router();

// Login endpoint
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        // 1. Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // 2. Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // 3. Check verification status
        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                code: 'UNVERIFIED',
                message: 'Please complete your registration verification'
            });
        }

        // 4. Check payment status
        if (!user.hasPaid) {
            return res.status(403).json({
                success: false,
                code: 'UNPAID',
                message: 'Please complete your payment to access the dashboard'
            });
        }

        // 5. Create JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // 6. Successful response
        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                email: user.email,
                isVerified: user.isVerified,
                hasPaid: user.hasPaid
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error during authentication'
        });
    }
});

module.exports = router;

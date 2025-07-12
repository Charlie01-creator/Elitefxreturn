const express = require('express');
const auth = require('../middlewares/auth');
const router = express.Router();

// Protected dashboard route
router.get('/dashboard', auth, async (req, res) => {
    try {
        res.json({
            success: true,
            user: {
                id: req.user._id,
                email: req.user.email,
                isVerified: req.user.isVerified,
                hasPaid: req.user.hasPaid
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;

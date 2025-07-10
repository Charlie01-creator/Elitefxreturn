const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
    try {
        // 1. Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No authentication token provided'
            });
        }

        // 2. Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 3. Find user
        const user = await User.findOne({
            _id: decoded.userId,
            isVerified: true,
            hasPaid: true
        });
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found or not authorized'
            });
        }

        // 4. Attach user to request
        req.user = user;
        req.token = token;
        next();
        
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid or expired authentication token'
        });
    }
};

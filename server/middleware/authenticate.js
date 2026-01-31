const jwt = require('jsonwebtoken');

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request object
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    console.log('[MIDDLEWARE] Auth header:', authHeader ? 'Present' : 'Missing');
    
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      console.log('[MIDDLEWARE] No token found in Authorization header');
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    console.log('[MIDDLEWARE] Token found, verifying...');
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('[MIDDLEWARE] Token verified for user ID:', decoded.userId);

    // Fetch user details using global User model
    const User = global.User;
    if (!User) {
      console.error('[MIDDLEWARE] Database not initialized');
      return res.status(500).json({
        success: false,
        message: 'Database not initialized'
      });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      console.log('[MIDDLEWARE] User not found for ID:', decoded.userId);
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Attach user to request
    req.userId = decoded.userId;
    console.log('[MIDDLEWARE] User authenticated:', user.email);
    next();
  } catch (error) {
    console.error('[MIDDLEWARE] Auth error:', error.name, error.message);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

module.exports = authenticateToken;

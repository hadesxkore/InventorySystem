const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to authenticate user with JWT
const authenticateUser = async (req, res, next) => {
  let token;

  // DEVELOPMENT BYPASS: Allow all requests with email to proceed without authentication
  // REMOVE THIS IN PRODUCTION
  const bypassAuth = process.env.NODE_ENV === 'development';
  if (bypassAuth && (req.body?.email || req.query?.email)) {
    console.log('DEVELOPMENT BYPASS: Skipping authentication for request with email');
    const email = req.body?.email || req.query?.email;
    
    // Try to find user
    const user = await User.findOne({ email });
    if (user) {
      req.user = user;
    } else {
      // Leave req.user undefined, controller will handle this
      console.log('User not found for email:', email);
    }
    return next();
  }

  // Regular authentication logic (for non-bypass)
  // Check if token exists in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Allow passing through if we're accessing endpoints that support email-based auth
  const allowEmailAuth = 
    req.originalUrl.includes('/products') || 
    req.originalUrl.includes('/reports') ||
    req.originalUrl.includes('/auth/register');

  // Check if this is an email-auth request
  const hasEmail = req.body?.email || req.query?.email;

  if (!token && !hasEmail) {
    return res.status(401).json({ message: 'Authentication required. Please log in.' });
  }

  try {
    if (token) {
      // Try JWT verification
      try {
        // Try to verify with our secret using only HS256 algorithm
        const decoded = jwt.verify(token, process.env.JWT_SECRET, {
          algorithms: ['HS256'] // Only use HS256 for our tokens
        });
        console.log('JWT token verified successfully:', { userId: decoded.userId });
        
        // Find user by id
        const user = await User.findById(decoded.userId);
        
        if (user) {
          req.user = user;
          return next();
        } else {
          console.log('User not found for JWT token with userId:', decoded.userId);
        }
      } catch (jwtError) {
        console.log('JWT verification failed:', jwtError.message);
        
        // For Firebase tokens, try email-based fallback immediately
        if (allowEmailAuth && hasEmail) {
          const email = req.body.email || req.query.email;
          console.log('Attempting Firebase user fallback with email:', email);
          
          const user = await User.findOne({ email });
          
          if (user) {
            console.log('Found user by email (Firebase fallback):', { userId: user._id, email });
            req.user = user;
            return next();
          }
        }
        // Continue to try regular email auth if this fallback fails
      }
    }
    
    // If we got here either token was invalid or not present
    // Check if we should try email-based auth
    if (allowEmailAuth && hasEmail) {
      const email = req.body.email || req.query.email;
      console.log('Attempting email-based authentication:', { email });
      
      const user = await User.findOne({ email });
      
      if (user) {
        console.log('Found user by email:', { userId: user._id, email });
        req.user = user;
        return next();
      } else if (req.originalUrl.includes('/auth/register') || 
                req.method === 'POST' && req.originalUrl.includes('/products')) {
        // Allow creation of user or product with email
        console.log('Allowing request for potential new user or product creation');
        return next();
      }
    }
    
    console.log('Authentication failed for:', { 
      url: req.originalUrl, 
      method: req.method,
      hasToken: !!token,
      hasEmail: !!hasEmail
    });
    
    return res.status(401).json({ message: 'Invalid authentication. Please log in again.' });
  } catch (error) {
    console.error('Authentication error:', error.message);
    return res.status(401).json({ message: 'Invalid token. Please log in again.' });
  }
};

// Middleware to authorize admin role
const authorizeAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
};

// Middleware to authorize staff or admin role
const authorizeStaffOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'staff' || req.user.role === 'admin')) {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied. Staff privileges required.' });
  }
};

module.exports = {
  authenticateUser,
  authorizeAdmin,
  authorizeStaffOrAdmin
}; 
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '30d',
    algorithm: 'HS256'
  });
};

// Register a new user
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    console.log('Registration attempt:', { email, role });

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists, returning existing user data');
      // Generate token
      const token = generateToken(existingUser._id);
      
      // Return existing user data
      return res.status(200).json({
        _id: existingUser._id,
        name: existingUser.name,
        email: existingUser.email,
        role: existingUser.role,
        token,
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'staff', // Default to staff if role not provided
    });

    console.log('New user created:', { id: user._id, email: user.email, role: user.role });

    // Generate token
    const token = generateToken(user._id);

    // Return user data without password
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Login attempt:', { email });

    // Find user by email
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    console.log('User authenticated successfully:', { id: user._id, email: user.email });

    // Generate token
    const token = generateToken(user._id);

    // Return user data without password
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    // Check if email is in the query
    if (req.query.email && !req.user) {
      console.log('Looking up user by email from query params', { email: req.query.email });
      const user = await User.findOne({ email: req.query.email });
      
      if (user) {
        console.log('Found user by email', { id: user._id, email: user.email });
        return res.status(200).json({
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        });
      } else {
        console.log('User not found by email', { email: req.query.email });
        return res.status(404).json({ message: 'User not found' });
      }
    }
    
    // If we have a req.user from the middleware, use that
    if (!req.user) {
      console.error('No user found in request and no email provided');
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Returning user profile from req.user', { id: req.user._id, email: req.user.email });
    res.status(200).json({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    });
  } catch (error) {
    console.error('Error getting user profile:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update fields if provided
    if (name) user.name = name;
    if (email) user.email = email;
    if (password) user.password = password;
    
    await user.save();
    
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all users (admin only)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  getAllUsers,
}; 
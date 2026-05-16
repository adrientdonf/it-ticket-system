const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const { createUser, findUserByEmail } = require('../models/userModel');

// Generate JWT
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// REGISTER
const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { username, email, password, role } = req.body;

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userId = await createUser({
      username,
      email,
      password: hashedPassword,
      role
    });

    const user = {
      id: userId,
      username,
      email,
      role: role || 'employee'
    };

    return res.status(201).json({
      success: true,
      token: generateToken(user),
      user
    });

  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// LOGIN
const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { email, password } = req.body;

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const safeUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    return res.json({
      success: true,
      token: generateToken(safeUser),
      user: safeUser
    });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// GET CURRENT USER
const getMe = (req, res) => {
  return res.json({
    success: true,
    user: req.user
  });
};

module.exports = {
  register,
  login,
  getMe
};
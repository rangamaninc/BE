// src/routes/userRoutes.js
const express = require('express');
const UserController = require('../controllers/UserController');
const AuthController = require('../controllers/AuthController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', UserController.createUser);
router.post('/login', AuthController.loginUser);

// Protected route example
router.get('/profile', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;

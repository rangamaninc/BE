// src/routes/taskRoutes.js
const express = require('express');
const TaskController = require('../controllers/taskController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Get all tasks
router.get('/', authMiddleware,TaskController.getAllTasks);

// Create a new task
router.post('/create', authMiddleware ,TaskController.upload.single('file'),TaskController.createTask);

router.put('/:id/edit', authMiddleware,TaskController.editTask);


module.exports = router;

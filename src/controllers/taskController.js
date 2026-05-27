// src/controllers/taskController.js
const Task = require("../models/Task");
const config = require("../config");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const safeName = file.originalname.replace(/[^\w.\-]/g, "_");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({ storage: storage });

const formatDateForDb = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const year = d.getFullYear();
  return `${month}/${day}/${year}`;
};

const TaskController = {
  upload: upload,

  async getAllTasks(req, res) {
    try {
      const { clientId } = req.query;
      const userId = req.user;
      // console.log(clientId,userId)
      // Check if both userId and clientId are provided
      if (!userId || !clientId) {
        return res.status(400).json({
          suceess: false,
          error: "Both userId and clientId are required query parameters",
        });
      }
      const tasks = await Task.getAllTasks(userId, clientId);
      res.json({ success: true, tasks });
    } catch (error) {
      config.logger.error("Error fetching tasks:", error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  },

  async createTask(req, res) {
    try {
      const assignedBy = req.user;
      const {
        name,
        description,
        assignedTo,
        clientId,
        startDate,
        endDate,
        type,
        subType,
        customFields,
      } = req.body;
      const status = "to-do";
      const fileLocation = req.file ? req.file.path : "";

      const newTask = {
        name: name,
        description: description,
        assigned_by: assignedBy,
        assigned_to: assignedTo,
        clientid: clientId,
        start_date: formatDateForDb(startDate),
        end_date: formatDateForDb(endDate),
        file_location: fileLocation,
        type: type,
        sub_type: subType,
        status: status,
        custom_fields: "",
      };

      const createdTask = await Task.createTask(newTask);
      res.status(201).json({ success: true, createdTask });
    } catch (error) {
      config.logger.error("Error creating task:", error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  },

  async editTask(req, res) {
    try {
      const taskId = req.params.id;
      const updates = req.body;

      // Check if the task exists
      const existingTask = await Task.getTaskById(taskId);
      if (!existingTask) {
        return res
          .status(404)
          .json({ success: false, error: "Task not found" });
      }

      // Update the task fields
      const updatedTask = await Task.updateTask(taskId, updates);
      res.json({ success: true, updatedTask });
    } catch (error) {
      config.logger.error("Error editing task:", error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  },
};

module.exports = TaskController;

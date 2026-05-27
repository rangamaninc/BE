// src/models/Task.js
const mysql = require("mysql2/promise");
const config = require("../config");

const Task = {
  async getAllTasks(userId, clientId) {
    const connection = await mysql.createConnection(config.database);

    try {
      const [rows] = await connection.execute(
        "SELECT * FROM tasks WHERE (assigned_by = ? OR assigned_to = ?) AND clientid = ?",
        [userId, userId, clientId]
      );
      return rows;
    } finally {
      connection.end();
    }
  },

  async createTask(task) {
    const connection = await mysql.createConnection(config.database);

    //WRITE FILE UPLOAD LOGIC IF FILE IS GETTING UPLOADED BY CAPTURING IS FILE UPLOADED FLAG

    try {
      const [result] = await connection.execute(
        'INSERT INTO capinasiadb.tasks(name, description, assigned_by, assigned_to, clientid, start_date, end_date, file_location, `type`, sub_type, custom_fields, status, last_status_updated_by)VALUES(?,?,?,?,?,STR_TO_DATE( ? , "%m/%d/%Y" ),STR_TO_DATE( ? , "%m/%d/%Y" ),?,?,?,?,?,?);',
        [
          task.name,
          task.description,
          task.assigned_by,
          task.assigned_to,
          task.clientid,
          task.start_date,
          task.end_date,
          task.file_location,
          task.type,
          task.sub_type,
          task.custom_fields,
          task.status,
          task.assigned_by,
        ]
      );

      task.id = result.insertId;
      return task.id;
    } finally {
      connection.end();
    }
  },

  async getTaskById(taskId) {
    const connection = await mysql.createConnection(config.database);

    try {
      const [rows] = await connection.execute(
        "SELECT * FROM tasks WHERE id = ?",
        [taskId]
      );
      return rows[0] || null;
    } finally {
      connection.end();
    }
  },

  async updateTask(taskId, updates) {
    const connection = await mysql.createConnection(config.database);

    try {
      const setClause = Object.keys(updates)
        .map((key) => `${key} = ?`)
        .join(", ");

      const values = Object.values(updates);
      values.push(taskId);

      const [result] = await connection.execute(
        `UPDATE tasks SET ${setClause} WHERE id = ?`,
        values
      );

      // Check if the task was updated successfully
      if (result.affectedRows > 0) {
        const updatedTask = await this.getTaskById(taskId);
        config.logger.info(`Task with ID ${taskId} updated successfully.`);
        return updatedTask;
      } else {
        config.logger.warn(
          `Task with ID ${taskId} not found or no changes applied.`
        );
        return null;
      }
    } finally {
      connection.end();
    }
  },
};

module.exports = Task;

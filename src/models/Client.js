const mysql = require('mysql2/promise');
const config = require('../config');

const FULL_ACCESS_ROLES = new Set(['admin', 'manager']);

const Client = {
  async getCaptivesByParentId(connection, parentId) {
    const [rows] = await connection.execute(
      `SELECT id, name, type, parent_id
       FROM clients
       WHERE parent_id = ?
         AND type = 'Captive'
       ORDER BY name`,
      [parentId]
    );
    return rows;
  },

  async getClientById(connection, clientId) {
    const [rows] = await connection.execute(
      `SELECT id, name, type, parent_id
       FROM clients
       WHERE id = ?`,
      [clientId]
    );
    return rows[0] || null;
  },

  toClientDto(row) {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      parent_id: row.parent_id ?? null,
    };
  },

  async getAllVisibleClients() {
    const connection = await mysql.createConnection(config.database);

    try {
      const [rows] = await connection.execute(
        `SELECT id, name, type, parent_id
         FROM clients
         WHERE type IN ('Captive Manager', 'Captive')
         ORDER BY type, name`
      );
      return rows.map(Client.toClientDto);
    } finally {
      connection.end();
    }
  },

  async getVisibleClientsForUser(userId, roleName) {
    if (FULL_ACCESS_ROLES.has(roleName?.toLowerCase())) {
      return Client.getAllVisibleClients();
    }

    const connection = await mysql.createConnection(config.database);

    try {
      const [mappedRows] = await connection.execute(
        `SELECT c.id, c.name, c.type, c.parent_id
         FROM userclients uc
         INNER JOIN clients c ON c.id = uc.client_id
         WHERE uc.user_id = ?`,
        [userId]
      );

      const visible = new Map();
      const addClient = (row) => {
        if (row) {
          visible.set(row.id, Client.toClientDto(row));
        }
      };

      const mappedManagers = mappedRows.filter((row) => row.type === 'Captive Manager');
      const mappedCaptives = mappedRows.filter((row) => row.type === 'Captive');

      for (const manager of mappedManagers) {
        addClient(manager);

        const captivesUnderManager = mappedCaptives.filter(
          (captive) => captive.parent_id === manager.id
        );

        if (captivesUnderManager.length === 0) {
          const allCaptives = await Client.getCaptivesByParentId(connection, manager.id);
          allCaptives.forEach(addClient);
        } else {
          captivesUnderManager.forEach(addClient);
        }
      }

      for (const captive of mappedCaptives) {
        addClient(captive);

        if (captive.parent_id && !visible.has(captive.parent_id)) {
          const parent = await Client.getClientById(connection, captive.parent_id);
          addClient(parent);
        }
      }

      return Array.from(visible.values()).sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'Captive Manager' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
    } finally {
      connection.end();
    }
  },

  async getClientHierarchy() {
    const connection = await mysql.createConnection(config.database);
    try {
      const [managers] = await connection.execute(
        `SELECT id, name, code, type
         FROM clients
         WHERE type = 'Captive Manager'
         ORDER BY name`
      );
      const [captives] = await connection.execute(
        `SELECT id, name, code, type, parent_id
         FROM clients
         WHERE type = 'Captive'
         ORDER BY name`
      );

      return managers.map((manager) => ({
        ...manager,
        captives: captives.filter((captive) => captive.parent_id === manager.id),
      }));
    } finally {
      connection.end();
    }
  },

  async createClient(payload) {
    const connection = await mysql.createConnection(config.database);
    try {
      const [result] = await connection.execute(
        `INSERT INTO clients (parent_id, code, name, type)
         VALUES (?, ?, ?, ?)`,
        [payload.parentId || null, payload.code, payload.name, payload.type]
      );
      return result.insertId;
    } finally {
      connection.end();
    }
  },

  async updateClient(clientId, payload) {
    const connection = await mysql.createConnection(config.database);
    try {
      const allowedFields = [
        ["parent_id", payload.parentId],
        ["code", payload.code],
        ["name", payload.name],
        ["type", payload.type],
      ].filter(([, value]) => value !== undefined);

      if (allowedFields.length === 0) return true;

      const setClause = allowedFields.map(([field]) => `${field} = ?`).join(", ");
      const values = allowedFields.map(([, value]) => value);

      const [result] = await connection.execute(
        `UPDATE clients SET ${setClause} WHERE id = ?`,
        [...values, clientId]
      );
      return result.affectedRows > 0;
    } finally {
      connection.end();
    }
  },

  async deleteClient(clientId) {
    const connection = await mysql.createConnection(config.database);
    try {
      await connection.execute("DELETE FROM clients WHERE parent_id = ?", [clientId]);
      const [result] = await connection.execute("DELETE FROM clients WHERE id = ?", [clientId]);
      return result.affectedRows > 0;
    } finally {
      connection.end();
    }
  },
};

module.exports = Client;

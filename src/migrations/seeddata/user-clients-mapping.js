/**
 * managers: captive manager name -> user gets manager + all captives under it
 * captives: captive name only -> user gets that captive + its parent manager
 */
const userClientMappings = [
  {
    username: 'cc@capinasia.com',
    managers: ['Evate', 'Utiny', 'Sera'],
    captives: [],
  },
  {
    username: 'vv@capinasia.com',
    managers: ['Evate', 'Sera'],
    captives: ['Etest Cap1', 'Stest Cap1', 'Utest Cap4'],
  },
  {
    username: 'eswar@capinasia.com',
    managers: ['Evate','Utiny'],
    captives: ['Etest Cap2','Etest Cap3','Utest Cap1','Utest Cap2'],
  },
  {
    username: 'its@capinasia.com',
    captives: ['Utest Cap3','Utest Cap4','Stest Cap2','Stest Cap3'],
    managers: ['Utiny','Sera'],
  },
];

async function findClientByName(connection, name, type) {
  const [rows] = await connection.execute(
    `SELECT id, name, type, parent_id
     FROM clients
     WHERE name = ?
       AND type = ?`,
    [name, type]
  );
  return rows[0] || null;
}

async function mapUserToClient(connection, userId, clientId, username, clientName) {
  const [existing] = await connection.execute(
    `SELECT id
     FROM userclients
     WHERE user_id = ?
       AND client_id = ?`,
    [userId, clientId]
  );

  if (existing.length > 0) {
    console.log(`${username} already mapped to ${clientName}`);
    return;
  }

  await connection.execute(
    `INSERT INTO userclients
    (user_id, client_id, created_by, created_date)
    VALUES (?, ?, ?, NOW())`,
    [userId, clientId, 'SYSTEM']
  );

  console.log(`Mapped ${username} to ${clientName}`);
}

async function seedUserClients(connection) {
  for (const mapping of userClientMappings) {
    const [users] = await connection.execute(
      'SELECT id FROM users WHERE username = ?',
      [mapping.username]
    );

    if (users.length === 0) {
      console.warn(`User ${mapping.username} not found.`);
      continue;
    }

    const userId = users[0].id;

    for (const managerName of mapping.managers || []) {
      const manager = await findClientByName(connection, managerName, 'Captive Manager');
      if (!manager) {
        console.warn(`Captive manager ${managerName} not found.`);
        continue;
      }
      await mapUserToClient(connection, userId, manager.id, mapping.username, managerName);
    }

    for (const captiveName of mapping.captives || []) {
      const captive = await findClientByName(connection, captiveName, 'Captive');
      if (!captive) {
        console.warn(`Captive ${captiveName} not found.`);
        continue;
      }
      await mapUserToClient(connection, userId, captive.id, mapping.username, captiveName);
    }
  }

}

module.exports = seedUserClients;

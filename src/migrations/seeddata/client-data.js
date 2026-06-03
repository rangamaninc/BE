const data = [
  {
    code: 'EVATE',
    name: 'Evate',
    captives: ['Etest Cap1', 'Etest Cap2', 'Etest Cap3', 'Etest Cap4']
  },
  {
    code: 'UTINY',
    name: 'Utiny',
    captives: ['Utest Cap1', 'Utest Cap2', 'Utest Cap3', 'Utest Cap4']
  },
  {
    code: 'SERA',
    name: 'Sera',
    captives: ['Stest Cap1', 'Stest Cap2', 'Stest Cap3', 'Stest Cap4']
  }
];

async function seedClients(connection) {
  for (const client of data) {
    const [existingManager] = await connection.execute(
      `SELECT id FROM clients WHERE name = ? AND type = 'Captive Manager'`,
      [client.name]
    );

    let parentId;
    if (existingManager.length > 0) {
      parentId = existingManager[0].id;
      console.log(`Client manager ${client.name} already exists. Skipping insert.`);
    } else {
      const [result] = await connection.execute(
        `INSERT INTO clients(parent_id, code, name, type)
         VALUES(NULL, ?, ?, 'Captive Manager')`,
        [client.code, client.name]
      );
      parentId = result.insertId;
      console.log(`Client manager ${client.name} created.`);
    }

    for (const captive of client.captives) {
      const [existingCaptive] = await connection.execute(
        `SELECT id FROM clients WHERE name = ? AND type = 'Captive'`,
        [captive]
      );

      if (existingCaptive.length > 0) {
        console.log(`Captive ${captive} already exists. Skipping insert.`);
        continue;
      }

      await connection.execute(
        `INSERT INTO clients(parent_id, code, name, type)
         VALUES(?, ?, ?, 'Captive')`,
        [
          parentId,
          captive.toUpperCase().replace(/\s+/g, '_'),
          captive
        ]
      );
      console.log(`Captive ${captive} created.`);
    }
  }
}

module.exports = seedClients;
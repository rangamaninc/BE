async function seedRoles(connection) {
    const roles = [
        { roleName: 'Admin', description: 'System Administrator' },
        { roleName: 'Manager', description: 'Manager' },
        { roleName: 'Operator', description: 'Operator' },
        { roleName: 'User', description: 'User' }
    ];

    for (const role of roles) {
        const [existing] = await connection.execute(
            'SELECT id FROM roles WHERE role_name = ?',
            [role.roleName]
        );

        if (existing.length > 0) {
            console.log(`Role ${role.roleName} already exists. Skipping.`);
            continue;
        }

        await connection.execute(
            `INSERT INTO roles
            (
                role_name,
                description
            )
            VALUES (?, ?)`,
            [
                role.roleName,
                role.description
            ]
        );

        console.log(`Role ${role.roleName} created.`);
    }

}

module.exports = seedRoles;

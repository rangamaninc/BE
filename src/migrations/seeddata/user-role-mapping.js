const userRoles = [
    {
        username: 'admin@capinasia.com',
        roles: ['Admin']
    },
    {
        username: 'cc@capinasia.com',
        roles: ['Manager']
    },
    {
        username: 'vv@capinasia.com',
        roles: ['Operator']
    },
    {
        username: 'eswar@capinasia.com',
        roles: ['Operator']
    },
    {
        username: 'its@capinasia.com',
        roles: ['Operator']
    }
];

async function seedUserRoles(connection) {
    for (const userRole of userRoles) {

        const [users] = await connection.execute(
            'SELECT id FROM users WHERE username = ?',
            [userRole.username]
        );

        if (users.length === 0) {
            console.warn(`User ${userRole.username} not found.`);
            continue;
        }

        const userId = users[0].id;

        for (const roleName of userRole.roles) {

            const [roles] = await connection.execute(
                'SELECT id FROM roles WHERE role_name = ?',
                [roleName]
            );

            if (roles.length === 0) {
                console.warn(`Role ${roleName} not found.`);
                continue;
            }

            const roleId = roles[0].id;

            const [existing] = await connection.execute(
                `SELECT id
                 FROM user_roles
                 WHERE user_id = ?
                 AND role_id = ?`,
                [userId, roleId]
            );

            if (existing.length > 0) {
                console.log(
                    `${userRole.username} already has role ${roleName}`
                );
                continue;
            }

            await connection.execute(
                `INSERT INTO user_roles
                (
                    user_id,
                    role_id,
                    assigned_by
                )
                VALUES (?, ?, ?)`,
                [
                    userId,
                    roleId,
                    'SYSTEM'
                ]
            );

            console.log(
                `Assigned ${roleName} role to ${userRole.username}`
            );
        }
    }

}

module.exports = seedUserRoles;
const bcrypt = require('bcrypt');

async function seedUsers(connection) {
    const users = [
        {
           
            username: 'admin@capinasia.com',
            email: 'admin@capinasia.com',
            firstName: 'System',
            lastName: 'Administrator',
            password: 'Admin@123',
            roleName: 'Admin'
        },
        {
           
            username: 'cc@capinasia.com',
            email: 'cc@capinasia.com',
            firstName: 'Chaitanya',
            lastName: 'N.C.',
            password: 'Capin@123',
            roleName: 'Manager'
        },
        {
           
            username: 'vv@capinasia.com',
            email: 'vv@capinasia.com',
            firstName: 'Vishnu',
            lastName: 'V',
            password: 'pass@1234',
            roleName: 'Operator'
        },
        {           
            username: 'eswar@capinasia.com',
            email: 'eswar@capinasia.com',
            firstName: 'Eswar',
            lastName: 'K',
            password: 'pass@1234',
            roleName: 'Operator'
        },
        {           
            username: 'its@capinasia.com',
            email: 'its@capinasia.com',
            firstName: 'IT',
            lastName: 'IT',
            password: 'pass@1234',
            roleName: 'Operator'
        }
    ];

    for (const user of users) {
        const [existing] = await connection.execute(
            'SELECT id FROM users WHERE username = ?',
            [user.username]
        );

        if (existing.length > 0) {
            console.log(`User ${user.username} already exists. Skipping.`);
            continue;
        }

        const passwordHash = await bcrypt.hash(user.password, 10);

        await connection.execute(
            `INSERT INTO users
            (
                username,
                email,
                first_name,
                last_name,
                password_hash,
                role_name,
                is_active,
                password_changed_date,
                password_expiry_date,
                created_by,
                created_date
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 90 DAY), ?, NOW())`,
            [
                user.username,
                user.email,
                user.firstName,
                user.lastName,
                passwordHash,
                user.roleName,
                1,
                'SYSTEM'
            ]
        );

        console.log(`User ${user.username} created.`);
    }

}

module.exports = seedUsers;
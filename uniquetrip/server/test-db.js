// Quick MySQL test
const mysql = require('mysql2/promise');

const DB_CONFIG = {
    host: 'localhost',
    user: 'root',
    password: 'user123',
    database: 'makemytrip',
    port: 3306,
    multipleStatements: true
};

async function test() {
    try {
        console.log('1. Testing MySQL connection...');
        const connection = await mysql.createConnection({
            host: DB_CONFIG.host,
            user: DB_CONFIG.user,
            password: DB_CONFIG.password
        });
        console.log('✅ Connection successful');

        console.log('2. Creating database if not exists...');
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_CONFIG.database}\``);
        console.log('✅ Database created/verified');
        await connection.end();

        console.log('3. Creating pool...');
        const pool = mysql.createPool(DB_CONFIG);
        console.log('✅ Pool created');

        console.log('4. Testing pool query...');
        const [rows] = await pool.query('SELECT 1 AS test');
        console.log('✅ Pool query successful:', rows);

        await pool.end();
        console.log('\n✅ All tests passed! MySQL is ready.');
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('Code:', error.code);
        process.exit(1);
    }
}

test();

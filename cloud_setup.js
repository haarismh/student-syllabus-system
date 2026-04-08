const mysql = require('mysql2/promise');

async function setup() {
    try {
        console.log('Connecting to Aiven MySQL...');
        const connection = await mysql.createConnection({
            host: 'student-syllabus-db-hawkstar518-e375.k.aivencloud.com',
            user: 'avnadmin',
            password: 'AVNS_pHKecHWTI9USt_41Xjp', // IMPORTANT: Put your real password here!
            database: 'defaultdb',
            port: 26565,
            ssl: { rejectUnauthorized: false } // Added the required SSL config here too!
        });

        console.log('Creating syllabuses table in the cloud...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS syllabuses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                year INT NOT NULL,
                semester INT NOT NULL,
                subject_name VARCHAR(255) NOT NULL,
                pdf_path VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('✅ Online Database setup complete! The table has been created.');
        process.exit(0);
    } catch (e) {
        console.error('❌ Error during cloud database setup:', e.message);
        process.exit(1);
    }
}

setup();

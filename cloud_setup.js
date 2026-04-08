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

        console.log('Creating announcements table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS announcements (
                id INT AUTO_INCREMENT PRIMARY KEY,
                message TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );
        `);

        // Check if there's already an announcement, if not insert default
        const [rows] = await connection.query('SELECT id FROM announcements LIMIT 1');
        if (rows.length === 0) {
            await connection.query('INSERT INTO announcements (message) VALUES (?)', ['Mid exams are from 13/4/26']);
        }

        console.log('✅ Online Database setup complete! The table has been created.');
        process.exit(0);
    } catch (e) {
        console.error('❌ Error during cloud database setup:', e.message);
        process.exit(1);
    }
}

setup();

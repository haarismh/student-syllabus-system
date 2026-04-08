const mysql = require('mysql2/promise');

async function setup() {
    try {
        console.log('Connecting to MySQL...');
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'Haarisshaik7' // default for XAMPP
        });

        console.log('Creating database if not exists...');
        await connection.query('CREATE DATABASE IF NOT EXISTS student_syllabus;');

        console.log('Using student_syllabus database...');
        await connection.query('USE student_syllabus;');

        console.log('Creating syllabuses table if not exists...');
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

        console.log('Database setup complete!');
        process.exit(0);
    } catch (e) {
        console.error('Error during database setup:', e.message);
        process.exit(1);
    }
}

setup();

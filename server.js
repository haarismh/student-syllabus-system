const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Make sure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Setup Multer for file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Database Connection
const db = mysql.createConnection({
    host: 'student-syllabus-db-hawkstar518-e375.k.aivencloud.com',
    user: 'avnadmin',
    password: 'AVNS_pHKecHWTI9USt_41Xjp ',
    database: 'defaultdb',
    port: 26565 // (or whatever port they give you)
});
db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL: ', err);
    } else {
        console.log('Connected to MySQL Database');
    }
});

// GET route to fetch syllabus data
app.get('/api/syllabus', (req, res) => {
    const { year, semester } = req.query;
    let query = 'SELECT * FROM syllabuses';
    let queryParams = [];

    if (year && semester) {
        query += ' WHERE year = ? AND semester = ?';
        queryParams.push(year, semester);
    }

    query += ' ORDER BY year ASC, semester ASC, subject_name ASC';

    db.query(query, queryParams, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// POST route to upload PDF and add DB record
app.post('/api/syllabus/upload', upload.single('pdf_file'), (req, res) => {
    const { year, semester, subject_name } = req.body;
    const pdf_path = req.file ? req.file.path : null;

    if (!year || !semester || !subject_name || !pdf_path) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    const query = 'INSERT INTO syllabuses (year, semester, subject_name, pdf_path) VALUES (?, ?, ?, ?)';
    db.query(query, [year, semester, subject_name, `/${pdf_path}`], (err, result) => {
        if (err) {
            // Delete uploaded file if db insertion fails
            fs.unlinkSync(pdf_path);
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Syllabus uploaded successfully!', id: result.insertId });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

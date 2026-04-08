const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

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
    password: 'AVNS_pHKecHWTI9USt_41Xjp',
    database: 'defaultdb',
    port: 26565,
    ssl: { rejectUnauthorized: false }
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
    const { year, semester, subject_name, adminPassword } = req.body;
    const pdf_path = req.file ? req.file.path : null;

    if (adminPassword !== ADMIN_PASSWORD) {
        if (pdf_path) fs.unlinkSync(pdf_path);
        return res.status(401).json({ error: 'Unauthorized: Incorrect Admin Password' });
    }

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

// DELETE route to remove syllabus
app.delete('/api/syllabus/:id', (req, res) => {
    const { adminPassword } = req.body;
    if (adminPassword !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Unauthorized: Incorrect Admin Password' });
    }

    const { id } = req.params;
    db.query('SELECT pdf_path FROM syllabuses WHERE id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'Not found' });

        const pdfPath = results[0].pdf_path;
        db.query('DELETE FROM syllabuses WHERE id = ?', [id], (err, _) => {
            if (err) return res.status(500).json({ error: err.message });
            
            try {
                const relativePath = pdfPath.startsWith('/') ? pdfPath.substring(1) : pdfPath;
                fs.unlinkSync(path.join(__dirname, relativePath));
            } catch (e) {
                console.error("Could not delete file:", e);
            }

            res.json({ message: 'Syllabus deleted successfully' });
        });
    });
});

// GET announcement
app.get('/api/announcement', (req, res) => {
    db.query('SELECT message FROM announcements ORDER BY id DESC LIMIT 1', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.json({ message: '' });
        res.json({ message: results[0].message });
    });
});

// POST announcement
app.post('/api/announcement', (req, res) => {
    const { adminPassword, message } = req.body;
    if (adminPassword !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Unauthorized: Incorrect Admin Password' });
    }
    db.query('UPDATE announcements SET message = ?', [message], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

const { DatabaseSync } = require('node:sqlite');
const crypto = require('node:crypto');
const path = require('node:path');

const DB_PATH = path.join(__dirname, 'students.db');
const db = new DatabaseSync(DB_PATH);

// Helper for secure password hashing (NFR-03)
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

function verifyPassword(password, hash, salt) {
  const check = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(check, 'hex'));
}

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    role TEXT NOT NULL,
    name TEXT NOT NULL,
    student_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    roll TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    dept TEXT NOT NULL,
    year INTEGER NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    subject TEXT NOT NULL,
    status TEXT NOT NULL,
    remarks TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS grades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    subject TEXT NOT NULL,
    semester TEXT NOT NULL,
    marks INTEGER NOT NULL,
    max_marks INTEGER DEFAULT 100,
    grade TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'General',
    author TEXT DEFAULT 'Staff Administration',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    role TEXT NOT NULL,
    last_active INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// Seed data if users table is empty
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;

if (userCount === 0) {
  console.log('Seeding initial database records...');

  // 1. Seed Staff / Admin
  const staffHash = hashPassword('staff123');
  const adminHash = hashPassword('admin123');
  
  const insertUser = db.prepare(`
    INSERT INTO users (username, password_hash, salt, role, name, student_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertUser.run('staff', staffHash.hash, staffHash.salt, 'staff', 'Academic Staff Member', null);
  insertUser.run('admin', adminHash.hash, adminHash.salt, 'admin', 'System Administrator', null);

  // 2. Seed Students
  const initialStudents = [
    { roll: 'CT2021001', name: 'Priya Sharma', dept: 'CT', year: 3, email: 'priya.sharma@example.edu', phone: '9876543210' },
    { roll: 'CT2021002', name: 'Arjun Patel', dept: 'CT', year: 3, email: 'arjun.patel@example.edu', phone: '9876543211' },
    { roll: 'EC2022015', name: 'Sneha Rao', dept: 'EC', year: 2, email: 'sneha.rao@example.edu', phone: '9876543212' },
    { roll: 'ME2020042', name: 'Rohan Verma', dept: 'ME', year: 4, email: 'rohan.verma@example.edu', phone: '9876543213' },
    { roll: 'CS2023005', name: 'Ananya Gupta', dept: 'CS', year: 1, email: 'ananya.gupta@example.edu', phone: '9876543214' },
    { roll: 'IT2022019', name: 'Karthik Nair', dept: 'IT', year: 2, email: 'karthik.nair@example.edu', phone: '9876543215' }
  ];

  const insertStudent = db.prepare(`
    INSERT INTO students (roll, name, dept, year, email, phone)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const studentHash = hashPassword('student123');

  for (const s of initialStudents) {
    const res = insertStudent.run(s.roll, s.name, s.dept, s.year, s.email, s.phone);
    const studentId = Number(res.lastInsertRowid);

    // Create a student login account for each student with roll number as username
    insertUser.run(s.roll.toLowerCase(), studentHash.hash, studentHash.salt, 'student', s.name, studentId);

    // Seed attendance
    const insertAtt = db.prepare(`
      INSERT INTO attendance (student_id, date, subject, status, remarks)
      VALUES (?, ?, ?, ?, ?)
    `);
    const subjects = ['Database Management', 'Data Structures', 'Operating Systems', 'Computer Networks', 'Software Engineering'];
    for (let i = 1; i <= 8; i++) {
      const day = String(i).padStart(2, '0');
      const subj = subjects[i % subjects.length];
      const status = (i === 4 && s.roll === 'CT2021002') ? 'Absent' : 'Present';
      insertAtt.run(studentId, `2026-09-${day}`, subj, status, status === 'Present' ? 'Regular' : 'Medical leave');
    }

    // Seed grades
    const insertGrade = db.prepare(`
      INSERT INTO grades (student_id, subject, semester, marks, max_marks, grade)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertGrade.run(studentId, 'Database Management', 'Sem 5', 88, 100, 'A+');
    insertGrade.run(studentId, 'Data Structures', 'Sem 5', 92, 100, 'O');
    insertGrade.run(studentId, 'Computer Networks', 'Sem 5', 84, 100, 'A');
    insertGrade.run(studentId, 'Operating Systems', 'Sem 5', 79, 100, 'B+');
    insertGrade.run(studentId, 'Software Engineering', 'Sem 5', 90, 100, 'O');
  }

  // 3. Seed Announcements
  const insertAnnouncement = db.prepare(`
    INSERT INTO announcements (title, content, category, author)
    VALUES (?, ?, ?, ?)
  `);
  insertAnnouncement.run(
    'Mid-Semester Examination Schedule 2026',
    'The timetable for Mid-Term examinations has been published on the student notice board. Exams commence next Monday.',
    'Exams',
    'Dean of Academics'
  );
  insertAnnouncement.run(
    'Annual Technical Symposium Registrations Open',
    'Department of Computer Technology welcomes project submissions for Hackathon 2026. Register teams by Friday.',
    'Events',
    'Faculty Coordinator'
  );
  insertAnnouncement.run(
    'Central Library Extended Study Hours',
    'During the exam fortnight, the central digital library will remain open until 10:00 PM on all working days.',
    'Library',
    'Chief Librarian'
  );

  console.log('Database seeded successfully.');
}

module.exports = {
  db,
  hashPassword,
  verifyPassword
};

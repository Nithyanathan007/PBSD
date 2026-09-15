const express = require('express');
const path = require('path');
const crypto = require('node:crypto');
const { db, hashPassword, verifyPassword } = require('./db.js');

const app = express();
const PORT = 3000;

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Inactivity Timeout: 30 minutes (NFR-04)
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

// Authentication Middleware
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : (req.query.token || req.headers['x-session-token']);

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please log in.', code: 'UNAUTHORIZED' });
  }

  const session = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token);
  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session. Please log in again.', code: 'INVALID_SESSION' });
  }

  const now = Date.now();
  if (now - session.last_active > SESSION_TIMEOUT_MS) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    return res.status(401).json({ 
      error: 'Session expired after 30 minutes of inactivity (NFR-04). Please log in again.', 
      code: 'SESSION_EXPIRED',
      expired: true 
    });
  }

  // Update last active time
  db.prepare('UPDATE sessions SET last_active = ? WHERE token = ?').run(now, token);

  const user = db.prepare('SELECT id, username, role, name, student_id FROM users WHERE id = ?').get(session.user_id);
  if (!user) {
    return res.status(401).json({ error: 'User record not found.', code: 'USER_NOT_FOUND' });
  }

  req.user = user;
  req.session = session;
  next();
}

function requireStaff(req, res, next) {
  if (req.user.role !== 'staff' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Staff privileges required.', code: 'FORBIDDEN' });
  }
  next();
}

// -------------------------------------------------------------
// AUTHENTICATION ROUTES (FR-08, NFR-03, NFR-04)
// -------------------------------------------------------------

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !username.trim()) {
    return res.status(400).json({ error: 'Username is required', field: 'username' });
  }
  if (!password) {
    return res.status(400).json({ error: 'Password is required', field: 'password' });
  }

  const cleanUser = username.trim().toLowerCase();
  const user = db.prepare('SELECT * FROM users WHERE LOWER(username) = ?').get(cleanUser);

  if (!user || !verifyPassword(password, user.password_hash, user.salt)) {
    return res.status(401).json({ error: 'Invalid username or password. Please verify credentials.', field: 'password' });
  }

  // Create session
  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  db.prepare(`
    INSERT INTO sessions (token, user_id, role, last_active, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(token, user.id, user.role, now, now);

  let studentProfile = null;
  if (user.student_id) {
    studentProfile = db.prepare('SELECT * FROM students WHERE id = ?').get(user.student_id);
  }

  res.json({
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      student_id: user.student_id,
      studentProfile
    }
  });
});

app.post('/api/auth/logout', authenticate, (req, res) => {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(req.session.token);
  res.json({ message: 'Logged out successfully' });
});

app.get('/api/auth/me', authenticate, (req, res) => {
  let studentProfile = null;
  if (req.user.student_id) {
    studentProfile = db.prepare('SELECT * FROM students WHERE id = ?').get(req.user.student_id);
  }
  res.json({
    user: req.user,
    studentProfile,
    expiresInMs: SESSION_TIMEOUT_MS - (Date.now() - req.session.last_active)
  });
});

// -------------------------------------------------------------
// STUDENT MANAGEMENT ROUTES (FR-01 to FR-06, NFR-07)
// -------------------------------------------------------------

// Input validation helper (NFR-07)
function validateStudentInput(data, isEdit = false) {
  const errors = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[\d\s+\-()]{7,15}$/;

  if (!data.name || !data.name.trim()) {
    errors.push({ field: 'name', message: 'Full name is required' });
  } else if (data.name.trim().length < 2) {
    errors.push({ field: 'name', message: 'Full name must be at least 2 characters' });
  }

  if (!isEdit) {
    if (!data.roll || !data.roll.trim()) {
      errors.push({ field: 'roll', message: 'Roll number is required' });
    } else if (data.roll.trim().length < 3) {
      errors.push({ field: 'roll', message: 'Roll number must be at least 3 characters' });
    }
  }

  if (!data.dept || !data.dept.trim()) {
    errors.push({ field: 'dept', message: 'Department is required (e.g. CT, CS, EC, ME)' });
  }

  const yearNum = Number(data.year);
  if (!data.year || isNaN(yearNum) || yearNum < 1 || yearNum > 4) {
    errors.push({ field: 'year', message: 'Year must be a number between 1 and 4' });
  }

  if (!data.email || !data.email.trim()) {
    errors.push({ field: 'email', message: 'Email address is required' });
  } else if (!emailRegex.test(data.email.trim())) {
    errors.push({ field: 'email', message: 'Valid email address is required (e.g. student@college.edu)' });
  }

  if (!data.phone || !data.phone.trim()) {
    errors.push({ field: 'phone', message: 'Phone number is required' });
  } else if (!phoneRegex.test(data.phone.trim())) {
    errors.push({ field: 'phone', message: 'Phone number must be between 7 and 15 digits' });
  }

  return errors;
}

// FR-03 & FR-04: View Students, Search & Filter (Sorted by Roll Number)
app.get('/api/students', authenticate, (req, res) => {
  const { search, dept, year } = req.query;

  let query = 'SELECT * FROM students WHERE 1=1';
  const params = [];

  if (search && search.trim()) {
    const term = `%${search.trim().toLowerCase()}%`;
    query += ' AND (LOWER(name) LIKE ? OR LOWER(roll) LIKE ? OR LOWER(email) LIKE ?)';
    params.push(term, term, term);
  }

  if (dept && dept.trim()) {
    query += ' AND LOWER(dept) = LOWER(?)';
    params.push(dept.trim());
  }

  if (year && !isNaN(Number(year))) {
    query += ' AND year = ?';
    params.push(Number(year));
  }

  // FR-03 requirement: displayed sorted by roll number
  query += ' ORDER BY roll ASC';

  const students = db.prepare(query).all(...params);
  res.json({ count: students.length, students });
});

// GET single student details
app.get('/api/students/:id', authenticate, (req, res) => {
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
  if (!student) {
    return res.status(404).json({ error: 'Student not found with ID: ' + req.params.id });
  }

  const attendanceRecords = db.prepare('SELECT * FROM attendance WHERE student_id = ? ORDER BY date DESC').all(student.id);
  const gradesRecords = db.prepare('SELECT * FROM grades WHERE student_id = ? ORDER BY id ASC').all(student.id);

  const totalAtt = attendanceRecords.length;
  const presentAtt = attendanceRecords.filter(a => a.status === 'Present').length;
  const attendanceRate = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 100;

  res.json({
    student,
    attendanceRate,
    attendance: attendanceRecords,
    grades: gradesRecords
  });
});

// FR-01 & FR-02: Add Student with Duplicate Roll Check
app.post('/api/students', authenticate, requireStaff, (req, res) => {
  const { name, roll, dept, year, email, phone } = req.body;

  const errors = validateStudentInput(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors[0].message, field: errors[0].field, allErrors: errors });
  }

  const cleanRoll = roll.trim().toUpperCase();

  // FR-02: Duplicate Roll Number Check
  const existing = db.prepare('SELECT id, roll FROM students WHERE UPPER(roll) = ?').get(cleanRoll);
  if (existing) {
    return res.status(409).json({ 
      error: `Duplicate Roll Number: Student with roll number "${cleanRoll}" already exists (FR-02).`, 
      field: 'roll' 
    });
  }

  const insertStmt = db.prepare(`
    INSERT INTO students (roll, name, dept, year, email, phone)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const result = insertStmt.run(
    cleanRoll,
    name.trim(),
    dept.trim().toUpperCase(),
    Number(year),
    email.trim().toLowerCase(),
    phone.trim()
  );

  const newId = Number(result.lastInsertRowid);
  const newStudent = db.prepare('SELECT * FROM students WHERE id = ?').get(newId);

  // Auto-create student login credential (username: roll number, default password: student123)
  const defaultStudentHash = hashPassword('student123');
  try {
    db.prepare(`
      INSERT OR IGNORE INTO users (username, password_hash, salt, role, name, student_id)
      VALUES (?, ?, ?, 'student', ?, ?)
    `).run(cleanRoll.toLowerCase(), defaultStudentHash.hash, defaultStudentHash.salt, newStudent.name, newId);
  } catch (err) {
    console.warn('Student user creation notice:', err.message);
  }

  res.status(201).json({
    message: 'Student record created successfully',
    student: newStudent
  });
});

// FR-05: Edit Student (Roll number is immutable!)
app.put('/api/students/:id', authenticate, requireStaff, (req, res) => {
  const studentId = req.params.id;
  const currentStudent = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);

  if (!currentStudent) {
    return res.status(404).json({ error: 'Student record not found.' });
  }

  // FR-05 requirement: Roll number cannot be modified!
  if (req.body.roll && req.body.roll.trim().toUpperCase() !== currentStudent.roll) {
    return res.status(400).json({ 
      error: 'Modification of Roll Number is strictly forbidden by policy (FR-05).', 
      field: 'roll' 
    });
  }

  const errors = validateStudentInput(req.body, true);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors[0].message, field: errors[0].field, allErrors: errors });
  }

  db.prepare(`
    UPDATE students
    SET name = ?, dept = ?, year = ?, email = ?, phone = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    req.body.name.trim(),
    req.body.dept.trim().toUpperCase(),
    Number(req.body.year),
    req.body.email.trim().toLowerCase(),
    req.body.phone.trim(),
    studentId
  );

  // Also keep student user name synced
  db.prepare('UPDATE users SET name = ? WHERE student_id = ?').run(req.body.name.trim(), studentId);

  const updatedStudent = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
  res.json({
    message: 'Student record updated successfully',
    student: updatedStudent
  });
});

// FR-06: Delete Student Record
app.delete('/api/students/:id', authenticate, requireStaff, (req, res) => {
  const studentId = req.params.id;
  const currentStudent = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);

  if (!currentStudent) {
    return res.status(404).json({ error: 'Student record not found.' });
  }

  // Delete student and dependent records
  db.prepare('DELETE FROM attendance WHERE student_id = ?').run(studentId);
  db.prepare('DELETE FROM grades WHERE student_id = ?').run(studentId);
  db.prepare('DELETE FROM users WHERE student_id = ?').run(studentId);
  db.prepare('DELETE FROM students WHERE id = ?').run(studentId);

  res.json({ 
    message: `Student ${currentStudent.name} (${currentStudent.roll}) has been deleted successfully.` 
  });
});

// -------------------------------------------------------------
// REPORTS & DASHBOARD STATISTICS (FR-07)
// -------------------------------------------------------------

app.get('/api/departments', authenticate, (req, res) => {
  const depts = db.prepare(`
    SELECT dept, COUNT(*) as count 
    FROM students 
    GROUP BY dept 
    ORDER BY dept ASC
  `).all();
  res.json({ departments: depts });
});

// FR-07: Department Report
app.get('/api/reports/department/:dept', authenticate, (req, res) => {
  const dept = req.params.dept.toUpperCase();
  const students = db.prepare(`
    SELECT * FROM students 
    WHERE UPPER(dept) = ? 
    ORDER BY roll ASC
  `).all(dept);

  const total = students.length;
  const yearBreakdown = {
    year1: students.filter(s => s.year === 1).length,
    year2: students.filter(s => s.year === 2).length,
    year3: students.filter(s => s.year === 3).length,
    year4: students.filter(s => s.year === 4).length
  };

  res.json({
    department: dept,
    totalCount: total,
    yearBreakdown,
    students
  });
});

// Dashboard Statistics
app.get('/api/stats', authenticate, (req, res) => {
  const totalStudents = db.prepare('SELECT COUNT(*) as count FROM students').get().count;
  const deptCount = db.prepare('SELECT COUNT(DISTINCT dept) as count FROM students').get().count;
  const year3Count = db.prepare('SELECT COUNT(*) as count FROM students WHERE year = 3').get().count;
  const recentRecords = db.prepare('SELECT * FROM students ORDER BY id DESC LIMIT 5').all();

  const deptDistribution = db.prepare(`
    SELECT dept, COUNT(*) as count 
    FROM students 
    GROUP BY dept 
    ORDER BY count DESC
  `).all();

  const yearDistribution = db.prepare(`
    SELECT year, COUNT(*) as count 
    FROM students 
    GROUP BY year 
    ORDER BY year ASC
  `).all();

  res.json({
    totalStudents,
    deptCount,
    year3Count,
    recentCount: recentRecords.length,
    recentRecords,
    deptDistribution,
    yearDistribution
  });
});

// -------------------------------------------------------------
// ATTENDANCE & GRADES (prompts.md USER 1 & USER 2)
// -------------------------------------------------------------

app.get('/api/attendance', authenticate, (req, res) => {
  const { student_id, date } = req.query;
  let query = `
    SELECT a.*, s.name as student_name, s.roll as student_roll, s.dept 
    FROM attendance a 
    JOIN students s ON a.student_id = s.id 
    WHERE 1=1
  `;
  const params = [];

  if (student_id) {
    query += ' AND a.student_id = ?';
    params.push(student_id);
  }
  if (date) {
    query += ' AND a.date = ?';
    params.push(date);
  }

  query += ' ORDER BY a.date DESC LIMIT 100';
  const records = db.prepare(query).all(...params);
  res.json({ records });
});

app.post('/api/attendance', authenticate, requireStaff, (req, res) => {
  const { student_id, date, subject, status, remarks } = req.body;

  if (!student_id || !date || !subject || !status) {
    return res.status(400).json({ error: 'Missing required attendance fields (student, date, subject, status)' });
  }

  const insert = db.prepare(`
    INSERT INTO attendance (student_id, date, subject, status, remarks)
    VALUES (?, ?, ?, ?, ?)
  `);

  insert.run(student_id, date, subject, status, remarks || '');
  res.status(201).json({ message: 'Attendance marked successfully' });
});

app.get('/api/grades', authenticate, (req, res) => {
  const { student_id } = req.query;
  let query = `
    SELECT g.*, s.name as student_name, s.roll as student_roll 
    FROM grades g 
    JOIN students s ON g.student_id = s.id 
    WHERE 1=1
  `;
  const params = [];
  if (student_id) {
    query += ' AND g.student_id = ?';
    params.push(student_id);
  }
  query += ' ORDER BY g.id DESC';
  const records = db.prepare(query).all(...params);
  res.json({ grades: records });
});

app.post('/api/grades', authenticate, requireStaff, (req, res) => {
  const { student_id, subject, semester, marks, max_marks } = req.body;
  if (!student_id || !subject || !semester || marks === undefined) {
    return res.status(400).json({ error: 'Missing required fields for grading' });
  }

  const markNum = Number(marks);
  const maxNum = Number(max_marks) || 100;
  const pct = (markNum / maxNum) * 100;

  let grade = 'F';
  if (pct >= 90) grade = 'O';
  else if (pct >= 80) grade = 'A+';
  else if (pct >= 70) grade = 'A';
  else if (pct >= 60) grade = 'B+';
  else if (pct >= 50) grade = 'B';
  else if (pct >= 40) grade = 'C';

  db.prepare(`
    INSERT INTO grades (student_id, subject, semester, marks, max_marks, grade)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(student_id, subject, semester, markNum, maxNum, grade);

  res.status(201).json({ message: 'Grade recorded successfully', grade });
});

// Announcements (Staff & Student)
app.get('/api/announcements', authenticate, (req, res) => {
  const announcements = db.prepare('SELECT * FROM announcements ORDER BY id DESC LIMIT 20').all();
  res.json({ announcements });
});

app.post('/api/announcements', authenticate, requireStaff, (req, res) => {
  const { title, content, category } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Announcement title is required', field: 'title' });
  }
  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Announcement content is required', field: 'content' });
  }

  const insert = db.prepare(`
    INSERT INTO announcements (title, content, category, author)
    VALUES (?, ?, ?, ?)
  `);

  insert.run(title.trim(), content.trim(), category || 'General', req.user.name);
  res.status(201).json({ message: 'Announcement posted successfully' });
});

// Student Portal Specific Data (USER 2 in prompts.md)
app.get('/api/student/me', authenticate, (req, res) => {
  if (!req.user.student_id) {
    return res.status(400).json({ error: 'Logged in user is not associated with a student record' });
  }

  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.user.student_id);
  if (!student) {
    return res.status(404).json({ error: 'Student record not found' });
  }

  const attendance = db.prepare('SELECT * FROM attendance WHERE student_id = ? ORDER BY date DESC').all(student.id);
  const grades = db.prepare('SELECT * FROM grades WHERE student_id = ? ORDER BY id ASC').all(student.id);

  const totalAtt = attendance.length;
  const presentAtt = attendance.filter(a => a.status === 'Present').length;
  const attendanceRate = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 100;

  // Mock schedule tailored for department and year
  const schedule = [
    { day: 'Monday', time: '09:00 - 10:30 AM', subject: 'Database Management Systems', room: 'Hall 302', faculty: 'Dr. S. K. Roy' },
    { day: 'Monday', time: '11:00 - 12:30 PM', subject: 'Computer Networks', room: 'Lab 2', faculty: 'Prof. Anjali Mehta' },
    { day: 'Tuesday', time: '09:00 - 10:30 AM', subject: 'Operating Systems', room: 'Hall 204', faculty: 'Dr. Vikram Sen' },
    { day: 'Tuesday', time: '02:00 - 04:00 PM', subject: 'Full Stack Development Lab', room: 'Computing Center', faculty: 'Staff Member' },
    { day: 'Wednesday', time: '10:00 - 11:30 AM', subject: 'Software Engineering & Agile', room: 'Hall 105', faculty: 'Prof. R. Iyer' },
    { day: 'Thursday', time: '09:00 - 10:30 AM', subject: 'Distributed Systems', room: 'Hall 302', faculty: 'Dr. S. K. Roy' },
    { day: 'Friday', time: '11:00 - 01:00 PM', subject: 'Project Seminar & Mentoring', room: 'Seminar Hall B', faculty: 'Faculty Advisor' }
  ];

  res.json({
    student,
    attendanceRate,
    attendanceStats: {
      total: totalAtt,
      present: presentAtt,
      absent: totalAtt - presentAtt
    },
    attendance,
    grades,
    schedule
  });
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'Frontend')));
app.use(express.static(__dirname));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'Frontend', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error occurred. Please try again later.' });
});

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Student Management System running on http://0.0.0.0:${PORT}`);
  });
}

module.exports = app;

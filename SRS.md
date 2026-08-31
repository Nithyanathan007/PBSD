# Software Requirement Specification
## Student Management System

**Course:** Prompt Based Software Development
**Department:** Computer Technology (UG), Kongu Engineering College
**Version:** 1.0
**Built with:** Python, FastAPI, SQLite

---

## 1. Purpose and Scope

### Purpose
The Student Management System stores and manages student records for a single
college department. Staff can add, view, search, edit and remove student details,
and generate a department-wise list. It replaces the spreadsheets and paper
registers currently used to track student information.

### In scope
- Storing basic student details: name, roll number, department, year, email, phone
- Adding, viewing, searching, editing and deleting student records
- A department-wise report of all students
- Single staff login to protect the records

### Out of scope (first version)
- Attendance marking and attendance reports
- Marks entry, grading and result processing
- Fee payment or accounts
- Email or SMS notifications to students or parents
- Multiple departments, multiple campuses, multiple academic years
- A student-facing login — staff use only

---

## 2. Functional Requirements

| ID | Requirement |
|----|-------------|
| FR-01 | The system shall allow staff to add a student record with name, roll number, department, year, email and phone. |
| FR-02 | The system shall reject a new record if the roll number already exists in the database. |
| FR-03 | The system shall display all stored student records in a table, sorted by roll number. |
| FR-04 | The system shall allow staff to search for a student by roll number or by name. |
| FR-05 | The system shall allow staff to edit any field of an existing student record except the roll number. |
| FR-06 | The system shall allow staff to delete a student record after showing a confirmation message. |
| FR-07 | The system shall generate a list of all students belonging to a selected department. |
| FR-08 | The system shall require staff to log in with a username and password before any record can be viewed or changed. |

---

## 3. Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-01 | Any page shall load within 3 seconds on a college laptop over campus wifi. |
| NFR-02 | A search across 500 student records shall return results within 2 seconds. |
| NFR-03 | Passwords shall be stored as hashes, never as plain text. |
| NFR-04 | A staff session shall expire after 30 minutes of inactivity. |
| NFR-05 | A new staff member shall be able to add a student record in 5 clicks or fewer, without training. |
| NFR-06 | The system shall support 10 staff users logged in at the same time. |
| NFR-07 | Every input form shall show a clear error message naming the field that is wrong. |
| NFR-08 | The database file shall be copied to a backup location once per day. |

---

## 4. Assumptions

- Staff have a laptop or desktop with a modern web browser.
- The system runs on one machine or one college server, not in the cloud.
- All students belong to one college and one academic year.
- Roll numbers are unique and are issued by the college office.
- Internet access is available while the system is in use.

---

## 5. Constraints

- Built using Python, FastAPI and SQLite only. No paid services or licences.
- Must be completed within the 15 sessions of this course.
- Developed by a team of two students.
- Must run on a laptop with 4 GB RAM, without special hardware.
- No external hosting — the system runs locally for demonstration.

---

## 6. Acceptance Criteria (sample)

**FR-01 — Add a student**
- GIVEN I am logged in and on the Add Student page
- WHEN I fill all fields with valid data and click Save
- THEN the student appears in the student list

**FR-02 — Duplicate roll number**
- GIVEN a student with roll number 24CT101 already exists
- WHEN I try to add another student with roll number 24CT101
- THEN the system shows the message "Roll number already exists" and saves nothing

**FR-06 — Delete a student**
- GIVEN I am viewing the student list
- WHEN I click Delete on a record and confirm
- THEN the record is removed and no longer appears in the list

---

*AI writes the draft. You verify the result.*

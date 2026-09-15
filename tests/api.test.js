const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../server.js');

let baseUrl = 'http://localhost:3000';
let staffToken = '';
let studentToken = '';

test('Authentication Tests (FR-08, NFR-03)', async (t) => {
  await t.test('Login with valid staff credentials', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'staff', password: 'staff123' })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.token);
    assert.equal(data.user.role, 'staff');
    staffToken = data.token;
  });

  await t.test('Login with invalid credentials should fail', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'staff', password: 'wrongpassword' })
    });
    assert.equal(res.status, 401);
  });

  await t.test('Login with student credentials (prompts.md USER 2)', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'ct2021001', password: 'student123' })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.token);
    assert.equal(data.user.role, 'student');
    studentToken = data.token;
  });
});

test('Student Management Tests (FR-01 to FR-06, NFR-07)', async (t) => {
  const testRoll = `TEST${Date.now().toString().slice(-5)}`;

  await t.test('FR-03: View students sorted by roll number', async () => {
    const res = await fetch(`${baseUrl}/api/students`, {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.students));
    assert.ok(data.students.length >= 2);

    // Verify sorted by roll number
    for (let i = 0; i < data.students.length - 1; i++) {
      assert.ok(data.students[i].roll <= data.students[i + 1].roll, 'List must be sorted by roll number');
    }
  });

  await t.test('FR-01 & NFR-07: Add student with field validation', async () => {
    // Missing name
    const badRes = await fetch(`${baseUrl}/api/students`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${staffToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        roll: testRoll,
        dept: 'CT',
        year: 2,
        email: 'test@example.edu',
        phone: '9876543210'
      })
    });
    assert.equal(badRes.status, 400);
    const badData = await badRes.json();
    assert.equal(badData.field, 'name', 'NFR-07 requires naming the specific invalid field');

    // Valid student
    const res = await fetch(`${baseUrl}/api/students`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${staffToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Unit Test Student',
        roll: testRoll,
        dept: 'CT',
        year: 2,
        email: 'teststudent@example.edu',
        phone: '9876543210'
      })
    });
    assert.equal(res.status, 201);
  });

  await t.test('FR-02: Prevent duplicate roll numbers', async () => {
    const res = await fetch(`${baseUrl}/api/students`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${staffToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Another Student',
        roll: testRoll,
        dept: 'CT',
        year: 3,
        email: 'dup@example.edu',
        phone: '9876543219'
      })
    });
    assert.equal(res.status, 409);
    const data = await res.json();
    assert.equal(data.field, 'roll');
  });

  await t.test('FR-05: Edit student prevents modifying roll number', async () => {
    // Fetch newly created student
    const listRes = await fetch(`${baseUrl}/api/students?search=${testRoll}`, {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    const { students } = await listRes.json();
    assert.ok(students.length > 0);
    const student = students[0];

    // Attempt to alter roll number
    const badEditRes = await fetch(`${baseUrl}/api/students/${student.id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${staffToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Updated Name',
        roll: 'ALTERED_ROLL',
        dept: 'CT',
        year: 2,
        email: student.email,
        phone: student.phone
      })
    });
    assert.equal(badEditRes.status, 400);
    const badEditData = await badEditRes.json();
    assert.equal(badEditData.field, 'roll');

    // Valid edit without changing roll
    const editRes = await fetch(`${baseUrl}/api/students/${student.id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${staffToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Updated Unit Test Student',
        roll: testRoll,
        dept: 'CT',
        year: 3,
        email: 'updated@example.edu',
        phone: '9876543210'
      })
    });
    assert.equal(editRes.status, 200);
  });

  await t.test('FR-06: Delete student record', async () => {
    const listRes = await fetch(`${baseUrl}/api/students?search=${testRoll}`, {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    const { students } = await listRes.json();
    assert.ok(students.length > 0);
    const student = students[0];

    const delRes = await fetch(`${baseUrl}/api/students/${student.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    assert.equal(delRes.status, 200);

    // Verify deleted
    const verifyRes = await fetch(`${baseUrl}/api/students/${student.id}`, {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    assert.equal(verifyRes.status, 404);
  });
});

test('FR-07: Department Reports and Statistics', async (t) => {
  await t.test('Generate department report', async () => {
    const res = await fetch(`${baseUrl}/api/reports/department/CT`, {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    assert.equal(res.status, 200);
    const report = await res.json();
    assert.equal(report.department, 'CT');
    assert.ok(typeof report.totalCount === 'number');
    assert.ok(report.yearBreakdown);
    assert.ok(Array.isArray(report.students));
  });
});

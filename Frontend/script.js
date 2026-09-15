/**
 * Student Management System - Client Application
 * Strictly complies with SRS.md (FR-01 to FR-08, NFR-01 to NFR-07) and prompts.md (USER 1 & USER 2)
 */

(function () {
  'use strict';

  // -------------------------------------------------------------
  // APPLICATION STATE
  // -------------------------------------------------------------
  const state = {
    token: localStorage.getItem('sms_token') || '',
    user: null,
    studentProfile: null,
    currentView: 'dashboard',
    students: [],
    departments: [],
    sortField: 'roll',
    sortAsc: true,
    filterSearch: '',
    filterDept: '',
    filterYear: '',
    sessionTimer: null,
    inactivityCountdownSeconds: 30 * 60, // 30 minutes (NFR-04)
    pendingDeleteStudent: null
  };

  // -------------------------------------------------------------
  // DOM ELEMENT REFERENCES
  // -------------------------------------------------------------
  const elements = {
    loginView: document.getElementById('loginView'),
    appContainer: document.getElementById('appContainer'),
    loginForm: document.getElementById('loginForm'),
    usernameInput: document.getElementById('username'),
    passwordInput: document.getElementById('password'),
    pwToggleBtn: document.getElementById('pwToggleBtn'),
    usernameError: document.getElementById('usernameError'),
    passwordError: document.getElementById('passwordError'),
    demoStaffBtn: document.getElementById('demoStaffBtn'),
    demoStudentBtn: document.getElementById('demoStudentBtn'),

    sidebar: document.getElementById('sidebar'),
    sidebarNav: document.getElementById('sidebarNav'),
    staffNavGroup: document.getElementById('staffNavGroup'),
    studentNavGroup: document.getElementById('studentNavGroup'),
    mobileMenuBtn: document.getElementById('mobileMenuBtn'),
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    themeLabel: document.getElementById('themeLabel'),
    logoutBtn: document.getElementById('logoutBtn'),
    userRoleBadge: document.getElementById('userRoleBadge'),
    sidebarStudentCount: document.getElementById('sidebarStudentCount'),

    pageTitle: document.getElementById('pageTitle'),
    sessionTimerText: document.getElementById('sessionTimerText'),
    sessionDot: document.getElementById('sessionDot'),
    topbarUserName: document.getElementById('topbarUserName'),
    topbarUserRole: document.getElementById('topbarUserRole'),
    userAvatar: document.getElementById('userAvatar'),

    // Dashboard
    totalCount: document.getElementById('totalCount'),
    deptCount: document.getElementById('deptCount'),
    year3Count: document.getElementById('year3Count'),
    recentCount: document.getElementById('recentCount'),
    recentTableBody: document.getElementById('recentTableBody'),
    deptDistributionContainer: document.getElementById('deptDistributionContainer'),

    // Students Directory
    searchInput: document.getElementById('searchInput'),
    deptFilterChips: document.getElementById('deptFilterChips'),
    yearFilterSelect: document.getElementById('yearFilterSelect'),
    studentsTableBody: document.getElementById('studentsTableBody'),
    tableRecordCountText: document.getElementById('tableRecordCountText'),
    exportCsvBtn: document.getElementById('exportCsvBtn'),
    thRoll: document.getElementById('thRoll'),
    thName: document.getElementById('thName'),
    thDept: document.getElementById('thDept'),
    thYear: document.getElementById('thYear'),

    // Add / Edit Form
    studentDataForm: document.getElementById('studentDataForm'),
    studentFormTitle: document.getElementById('studentFormTitle'),
    studentFormSub: document.getElementById('studentFormSub'),
    editingStudentId: document.getElementById('editingStudentId'),
    formName: document.getElementById('formName'),
    formRoll: document.getElementById('formRoll'),
    formDept: document.getElementById('formDept'),
    formYear: document.getElementById('formYear'),
    formEmail: document.getElementById('formEmail'),
    formPhone: document.getElementById('formPhone'),
    lockedRollBadge: document.getElementById('lockedRollBadge'),
    rollHelperText: document.getElementById('rollHelperText'),
    formCancelBtn: document.getElementById('formCancelBtn'),
    formSubmitBtn: document.getElementById('formSubmitBtn'),
    previewAvatar: document.getElementById('previewAvatar'),
    previewName: document.getElementById('previewName'),
    previewRoll: document.getElementById('previewRoll'),
    previewDept: document.getElementById('previewDept'),
    previewYear: document.getElementById('previewYear'),

    // Department Reports
    reportDeptSelect: document.getElementById('reportDeptSelect'),
    reportSummarySection: document.getElementById('reportSummarySection'),
    repDeptName: document.getElementById('repDeptName'),
    repTotalCount: document.getElementById('repTotalCount'),
    repYearPills: document.getElementById('repYearPills'),
    reportTableBody: document.getElementById('reportTableBody'),
    printReportBtn: document.getElementById('printReportBtn'),
    exportReportCsvBtn: document.getElementById('exportReportCsvBtn'),
    printReportDate: document.getElementById('printReportDate'),

    // Academic Tab
    tabAttendanceBtn: document.getElementById('tabAttendanceBtn'),
    tabGradesBtn: document.getElementById('tabGradesBtn'),
    attendanceTabContent: document.getElementById('attendanceTabContent'),
    gradesTabContent: document.getElementById('gradesTabContent'),
    attendanceForm: document.getElementById('attendanceForm'),
    attStudentSelect: document.getElementById('attStudentSelect'),
    attDate: document.getElementById('attDate'),
    attSubject: document.getElementById('attSubject'),
    attStatus: document.getElementById('attStatus'),
    gradeForm: document.getElementById('gradeForm'),
    gradeStudentSelect: document.getElementById('gradeStudentSelect'),
    gradeSubject: document.getElementById('gradeSubject'),
    gradeSemester: document.getElementById('gradeSemester'),
    gradeMarks: document.getElementById('gradeMarks'),

    // Announcements
    announcementsList: document.getElementById('announcementsList'),
    openAddAnnouncementBtn: document.getElementById('openAddAnnouncementBtn'),
    announcementModal: document.getElementById('announcementModal'),
    closeAnnouncementModalBtn: document.getElementById('closeAnnouncementModalBtn'),
    cancelAnnBtn: document.getElementById('cancelAnnBtn'),
    announcementForm: document.getElementById('announcementForm'),
    annTitle: document.getElementById('annTitle'),
    annCategory: document.getElementById('annCategory'),
    annContent: document.getElementById('annContent'),

    // Student Portal (USER 2)
    stHeroName: document.getElementById('stHeroName'),
    stHeroSubtitle: document.getElementById('stHeroSubtitle'),
    stHeroRoll: document.getElementById('stHeroRoll'),
    stHeroDept: document.getElementById('stHeroDept'),
    stHeroYear: document.getElementById('stHeroYear'),
    stHeroAttRate: document.getElementById('stHeroAttRate'),
    stStanding: document.getElementById('stStanding'),
    stPresentCount: document.getElementById('stPresentCount'),
    stCourseCount: document.getElementById('stCourseCount'),
    stTodaySchedulePreview: document.getElementById('stTodaySchedulePreview'),
    studentScheduleList: document.getElementById('studentScheduleList'),
    studentAttendanceBody: document.getElementById('studentAttendanceBody'),
    studentGradesBody: document.getElementById('studentGradesBody'),

    // Modals
    profileModal: document.getElementById('profileModal'),
    closeProfileModalBtn: document.getElementById('closeProfileModalBtn'),
    profileModalBody: document.getElementById('profileModalBody'),
    deleteModal: document.getElementById('deleteModal'),
    closeDeleteModalBtn: document.getElementById('closeDeleteModalBtn'),
    cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
    confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
    deleteModalText: document.getElementById('deleteModalText'),

    toastContainer: document.getElementById('toastContainer')
  };

  // -------------------------------------------------------------
  // API CLIENT HELPER (Fast, Secure, JSON)
  // -------------------------------------------------------------
  async function api(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `/api${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (state.token) {
      headers['Authorization'] = `Bearer ${state.token}`;
    }

    try {
      const response = await fetch(url, { ...options, headers });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401 && (data.expired || data.code === 'SESSION_EXPIRED')) {
          handleSessionExpired();
        }
        const error = new Error(data.error || `HTTP error ${response.status}`);
        error.data = data;
        error.status = response.status;
        throw error;
      }

      // Reset activity countdown on successful API communication
      resetInactivityTimer();
      return data;
    } catch (err) {
      throw err;
    }
  }

  // -------------------------------------------------------------
  // NOTIFICATIONS (TOASTS)
  // -------------------------------------------------------------
  function showToast(message, type = 'info', duration = 3500) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // -------------------------------------------------------------
  // INACTIVITY TIMEOUT ENGINE (NFR-04: 30 minutes)
  // -------------------------------------------------------------
  function resetInactivityTimer() {
    state.inactivityCountdownSeconds = 30 * 60;
    updateSessionTimerDisplay();
  }

  function startInactivityEngine() {
    if (state.sessionTimer) clearInterval(state.sessionTimer);

    // Update countdown every second
    state.sessionTimer = setInterval(() => {
      state.inactivityCountdownSeconds--;
      updateSessionTimerDisplay();

      if (state.inactivityCountdownSeconds <= 0) {
        clearInterval(state.sessionTimer);
        handleSessionExpired();
      }
    }, 1000);

    // Activity triggers reset
    ['click', 'keydown', 'scroll', 'mousemove'].forEach(event => {
      window.addEventListener(event, throttle(resetInactivityTimer, 2000), { passive: true });
    });
  }

  function updateSessionTimerDisplay() {
    const mins = Math.floor(state.inactivityCountdownSeconds / 60);
    const secs = state.inactivityCountdownSeconds % 60;
    if (elements.sessionTimerText) {
      elements.sessionTimerText.textContent = `Session: ${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
    }
    if (elements.sessionDot) {
      elements.sessionDot.style.background = mins < 5 ? 'var(--warning)' : 'var(--success)';
    }
  }

  function handleSessionExpired() {
    state.token = '';
    state.user = null;
    localStorage.removeItem('sms_token');
    elements.appContainer.classList.add('hidden');
    elements.loginView.classList.remove('hidden');
    showToast('Your session has expired after 30 minutes of inactivity (NFR-04). Please sign in again.', 'error', 6000);
  }

  function throttle(func, limit) {
    let inThrottle;
    return function (...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  // -------------------------------------------------------------
  // AUTHENTICATION & LOGIN FLOW (FR-08, NFR-03)
  // -------------------------------------------------------------
  function setupAuth() {
    // Quick Demo Buttons
    elements.demoStaffBtn.addEventListener('click', () => {
      elements.demoStaffBtn.classList.add('active');
      elements.demoStudentBtn.classList.remove('active');
      elements.usernameInput.value = 'staff';
      elements.passwordInput.value = 'staff123';
      clearErrors();
    });

    elements.demoStudentBtn.addEventListener('click', () => {
      elements.demoStudentBtn.classList.add('active');
      elements.demoStaffBtn.classList.remove('active');
      elements.usernameInput.value = 'ct2021001';
      elements.passwordInput.value = 'student123';
      clearErrors();
    });

    // Password show/hide toggle
    elements.pwToggleBtn.addEventListener('click', () => {
      const type = elements.passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      elements.passwordInput.setAttribute('type', type);
      elements.pwToggleBtn.textContent = type === 'password' ? '👁️' : '🔒';
    });

    // Login Form Submit
    elements.loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearErrors();

      const username = elements.usernameInput.value.trim();
      const password = elements.passwordInput.value;

      if (!username) {
        showFieldError('username', 'Username or Roll Number is required');
        return;
      }
      if (!password) {
        showFieldError('password', 'Password is required');
        return;
      }

      try {
        const data = await api('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ username, password })
        });

        state.token = data.token;
        state.user = data.user;
        state.studentProfile = data.user.studentProfile;
        localStorage.setItem('sms_token', state.token);

        showToast(`Welcome back, ${data.user.name}!`, 'success');
        initAuthenticatedPortal();
      } catch (err) {
        if (err.data && err.data.field) {
          showFieldError(err.data.field, err.data.error);
        } else {
          showToast(err.message || 'Login failed', 'error');
        }
      }
    });

    // Logout
    elements.logoutBtn.addEventListener('click', async () => {
      try {
        await api('/auth/logout', { method: 'POST' });
      } catch (e) {
        // Continue logout anyway
      }
      state.token = '';
      state.user = null;
      localStorage.removeItem('sms_token');
      elements.appContainer.classList.add('hidden');
      elements.loginView.classList.remove('hidden');
      showToast('You have been signed out successfully.', 'info');
    });
  }

  function showFieldError(field, msg) {
    const errorEl = document.getElementById(`${field}Error`) || document.getElementById(`err-${field}`);
    if (errorEl) {
      errorEl.textContent = msg;
    }
    const inputEl = document.getElementById(field) || document.getElementById(`form${field.charAt(0).toUpperCase() + field.slice(1)}`);
    if (inputEl) {
      inputEl.classList.add('input-error');
      inputEl.focus();
    }
  }

  function clearErrors() {
    document.querySelectorAll('.input-error-msg').forEach(el => el.textContent = '');
    document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
  }

  // Check existing session on load
  async function checkExistingSession() {
    if (!state.token) {
      elements.loginView.classList.remove('hidden');
      elements.appContainer.classList.add('hidden');
      return;
    }

    try {
      const data = await api('/auth/me');
      state.user = data.user;
      state.studentProfile = data.studentProfile;
      initAuthenticatedPortal();
    } catch (e) {
      state.token = '';
      localStorage.removeItem('sms_token');
      elements.loginView.classList.remove('hidden');
      elements.appContainer.classList.add('hidden');
    }
  }

  function initAuthenticatedPortal() {
    elements.loginView.classList.add('hidden');
    elements.appContainer.classList.remove('hidden');

    const role = state.user.role;
    const isStaff = role === 'staff' || role === 'admin';

    // Update Topbar
    elements.topbarUserName.textContent = state.user.name;
    elements.topbarUserRole.textContent = isStaff ? 'Academic Staff' : `Student (${state.user.username.toUpperCase()})`;
    elements.userAvatar.textContent = state.user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    elements.userRoleBadge.textContent = isStaff ? 'Staff Portal' : 'Student Portal';

    // Toggle Nav Groups
    if (isStaff) {
      elements.staffNavGroup.classList.remove('hidden');
      elements.studentNavGroup.classList.add('hidden');
      switchView('dashboard');
      loadStaffDashboard();
      loadStudents();
      loadDepartments();
      loadAnnouncements();
    } else {
      elements.staffNavGroup.classList.add('hidden');
      elements.studentNavGroup.classList.remove('hidden');
      switchView('studentOverview');
      loadStudentPortal();
      loadAnnouncements();
    }

    startInactivityEngine();
  }

  // -------------------------------------------------------------
  // VIEW NAVIGATION & SWITCHING
  // -------------------------------------------------------------
  function switchView(viewId) {
    state.currentView = viewId;

    document.querySelectorAll('.view').forEach(v => v.classList.remove('active-view'));
    const targetView = document.getElementById(viewId);
    if (targetView) targetView.classList.add('active-view');

    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewId);
    });

    // Update page title
    const titles = {
      dashboard: 'Institutional Overview',
      students: 'Students Directory',
      add: elements.editingStudentId.value ? 'Edit Student Record' : 'Add New Student',
      reports: 'Department Roster Reports',
      academic: 'Attendance & Grades Management',
      announcements: 'Campus Notice Board',
      studentOverview: 'Student Dashboard',
      studentSchedule: 'Class Timetable',
      studentAttendance: 'My Attendance Logs',
      studentGrades: 'Semester Grades'
    };
    elements.pageTitle.textContent = titles[viewId] || 'Portal';

    // Close mobile menu if open
    elements.sidebar.classList.remove('open');
  }

  function setupNavigation() {
    // Navigation Buttons
    document.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', () => switchView(btn.dataset.view));
    });

    // Quick action / "data-go" buttons
    document.querySelectorAll('[data-go]').forEach(btn => {
      btn.addEventListener('click', () => switchView(btn.dataset.go));
    });

    // Mobile Hamburger Toggle
    elements.mobileMenuBtn.addEventListener('click', () => {
      elements.sidebar.classList.toggle('open');
    });

    // Theme Switcher
    const savedTheme = localStorage.getItem('sms_theme');
    if (savedTheme === 'dark') {
      document.body.classList.add('dark');
      elements.themeLabel.textContent = 'Light Theme';
    }

    elements.themeToggleBtn.addEventListener('click', () => {
      const isDark = document.body.classList.toggle('dark');
      elements.themeLabel.textContent = isDark ? 'Light Theme' : 'Dark Theme';
      localStorage.setItem('sms_theme', isDark ? 'dark' : 'light');
    });

    // Keyboard Shortcuts: '/' to search, 'Esc' to close modal
    window.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        switchView('students');
        elements.searchInput.focus();
      }
      if (e.key === 'Escape') {
        closeAllModals();
      }
    });
  }

  // -------------------------------------------------------------
  // STAFF DASHBOARD (Institutional Metrics & Activity)
  // -------------------------------------------------------------
  async function loadStaffDashboard() {
    try {
      const stats = await api('/stats');
      elements.totalCount.textContent = stats.totalStudents;
      elements.deptCount.textContent = stats.deptCount;
      elements.year3Count.textContent = stats.year3Count;
      elements.recentCount.textContent = stats.recentCount;
      elements.sidebarStudentCount.textContent = stats.totalStudents;

      // Render Recent Students
      renderRecentTable(stats.recentRecords);

      // Render Department Breakdown Progress Bars
      renderDeptDistribution(stats.deptDistribution, stats.totalStudents);
    } catch (e) {
      console.error('Failed to load dashboard stats:', e);
    }
  }

  function renderRecentTable(records) {
    if (!records || records.length === 0) {
      elements.recentTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--muted); padding: 20px;">No student records found.</td></tr>`;
      return;
    }

    elements.recentTableBody.innerHTML = records.map(s => `
      <tr>
        <td><span class="roll-badge">${escapeHtml(s.roll)}</span></td>
        <td><b>${escapeHtml(s.name)}</b></td>
        <td><span class="dept-badge">${escapeHtml(s.dept)}</span></td>
        <td><span class="year-pill">Year ${s.year}</span></td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="window.smsApp.viewStudent(${s.id})">Inspect</button>
        </td>
      </tr>
    `).join('');
  }

  function renderDeptDistribution(depts, total) {
    if (!depts || depts.length === 0) {
      elements.deptDistributionContainer.innerHTML = '<small style="color: var(--muted);">No department data.</small>';
      return;
    }

    elements.deptDistributionContainer.innerHTML = depts.map(d => {
      const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
      return `
        <div>
          <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; margin-bottom: 3px;">
            <span>${escapeHtml(d.dept)}</span>
            <span>${d.count} students (${pct}%)</span>
          </div>
          <div class="progress-bar-container">
            <div class="progress-fill" style="width: ${pct}%;"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  // -------------------------------------------------------------
  // STUDENTS DIRECTORY (FR-03, FR-04, FR-06)
  // -------------------------------------------------------------
  async function loadStudents() {
    try {
      const params = new URLSearchParams();
      if (state.filterSearch) params.append('search', state.filterSearch);
      if (state.filterDept) params.append('dept', state.filterDept);
      if (state.filterYear) params.append('year', state.filterYear);

      const data = await api(`/students?${params.toString()}`);
      state.students = data.students || [];

      renderStudentsTable();
      elements.sidebarStudentCount.textContent = state.students.length;
    } catch (err) {
      showToast('Error loading student records: ' + err.message, 'error');
    }
  }

  function renderStudentsTable() {
    // Sort students (FR-03: default sorted by roll number)
    const sorted = [...state.students].sort((a, b) => {
      let valA = a[state.sortField];
      let valB = b[state.sortField];
      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }
      if (valA < valB) return state.sortAsc ? -1 : 1;
      if (valA > valB) return state.sortAsc ? 1 : -1;
      return 0;
    });

    elements.tableRecordCountText.textContent = `Showing ${sorted.length} student record${sorted.length === 1 ? '' : 's'}`;

    if (sorted.length === 0) {
      elements.studentsTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; color: var(--muted); padding: 36px;">
            No students match your search criteria. Click "+ Add Student" to create a new record.
          </td>
        </tr>
      `;
      return;
    }

    elements.studentsTableBody.innerHTML = sorted.map(s => `
      <tr id="student-row-${s.id}">
        <td><span class="roll-badge">${escapeHtml(s.roll)}</span></td>
        <td>
          <div style="font-weight: 700; color: var(--text);">${escapeHtml(s.name)}</div>
        </td>
        <td><span class="dept-badge">${escapeHtml(s.dept)}</span></td>
        <td><span class="year-pill">Year ${s.year}</span></td>
        <td><a href="mailto:${escapeHtml(s.email)}" style="color: var(--primary); text-decoration: none;">${escapeHtml(s.email)}</a></td>
        <td>${escapeHtml(s.phone)}</td>
        <td style="text-align: right;">
          <div class="row-actions" style="justify-content: flex-end;">
            <button class="action-btn" title="View Dossier" onclick="window.smsApp.viewStudent(${s.id})">👁️</button>
            <button class="action-btn edit" title="Edit Student (FR-05)" onclick="window.smsApp.editStudent(${s.id})">✏️</button>
            <button class="action-btn delete" title="Delete Student (FR-06)" onclick="window.smsApp.promptDeleteStudent(${s.id}, '${escapeHtml(s.name).replace(/'/g, "\\'")}', '${escapeHtml(s.roll)}')">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  function setupDirectoryControls() {
    // Live Search with 250ms debounce (FR-04)
    let searchTimeout;
    elements.searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        state.filterSearch = e.target.value.trim();
        loadStudents();
      }, 250);
    });

    // Year Filter Dropdown
    elements.yearFilterSelect.addEventListener('change', (e) => {
      state.filterYear = e.target.value;
      loadStudents();
    });

    // Table Column Sorting (FR-03)
    [
      { el: elements.thRoll, field: 'roll' },
      { el: elements.thName, field: 'name' },
      { el: elements.thDept, field: 'dept' },
      { el: elements.thYear, field: 'year' }
    ].forEach(({ el, field }) => {
      el.addEventListener('click', () => {
        if (state.sortField === field) {
          state.sortAsc = !state.sortAsc;
        } else {
          state.sortField = field;
          state.sortAsc = true;
        }
        updateSortIcons();
        renderStudentsTable();
      });
    });

    // Export Table as CSV
    elements.exportCsvBtn.addEventListener('click', () => {
      if (state.students.length === 0) {
        showToast('No student records available to export', 'error');
        return;
      }
      const headers = ['Roll Number', 'Full Name', 'Department', 'Year', 'Email', 'Phone'];
      const rows = state.students.map(s => [
        `"${s.roll}"`,
        `"${s.name.replace(/"/g, '""')}"`,
        `"${s.dept}"`,
        s.year,
        `"${s.email}"`,
        `"${s.phone}"`
      ]);
      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      downloadFile('students_roster.csv', 'text/csv;charset=utf-8;', csvContent);
      showToast('CSV export downloaded successfully', 'success');
    });
  }

  function updateSortIcons() {
    const fields = [
      { el: elements.thRoll, field: 'roll' },
      { el: elements.thName, field: 'name' },
      { el: elements.thDept, field: 'dept' },
      { el: elements.thYear, field: 'year' }
    ];
    fields.forEach(({ el, field }) => {
      const span = el.querySelector('span');
      if (state.sortField === field) {
        span.textContent = state.sortAsc ? '▲' : '▼';
      } else {
        span.textContent = '↕';
      }
    });
  }

  // -------------------------------------------------------------
  // ADD & EDIT STUDENT (FR-01, FR-02, FR-05, NFR-07)
  // -------------------------------------------------------------
  function setupStudentForm() {
    // Real-time Preview updates
    const updatePreview = () => {
      const name = elements.formName.value.trim() || 'Student Name';
      const roll = elements.formRoll.value.trim() || 'ROLL123';
      const dept = elements.formDept.value.trim() || 'DEPT';
      const year = elements.formYear.value ? `Year ${elements.formYear.value}` : 'Year -';

      elements.previewName.textContent = name;
      elements.previewRoll.textContent = roll.toUpperCase();
      elements.previewDept.textContent = dept.toUpperCase();
      elements.previewYear.textContent = year;
      elements.previewAvatar.textContent = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'ST';
    };

    [elements.formName, elements.formRoll, elements.formDept, elements.formYear].forEach(input => {
      input.addEventListener('input', updatePreview);
    });
    elements.formYear.addEventListener('change', updatePreview);

    // Cancel Button
    elements.formCancelBtn.addEventListener('click', () => {
      resetStudentForm();
      switchView('students');
    });

    // Form Submission
    elements.studentDataForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearErrors();

      const isEdit = Boolean(elements.editingStudentId.value);
      const studentId = elements.editingStudentId.value;

      const payload = {
        name: elements.formName.value.trim(),
        roll: elements.formRoll.value.trim().toUpperCase(),
        dept: elements.formDept.value.trim().toUpperCase(),
        year: Number(elements.formYear.value),
        email: elements.formEmail.value.trim(),
        phone: elements.formPhone.value.trim()
      };

      // Client-side quick check (NFR-07)
      if (!payload.name) {
        showFieldError('name', 'Full name is required (NFR-07)');
        return;
      }
      if (!isEdit && !payload.roll) {
        showFieldError('roll', 'Roll number is required (NFR-07)');
        return;
      }
      if (!payload.dept) {
        showFieldError('dept', 'Department is required (NFR-07)');
        return;
      }
      if (!payload.year) {
        showFieldError('year', 'Please select an academic year (1-4)');
        return;
      }
      if (!payload.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
        showFieldError('email', 'Valid institutional email is required (NFR-07)');
        return;
      }
      if (!payload.phone || payload.phone.length < 7) {
        showFieldError('phone', 'Valid phone number is required (NFR-07)');
        return;
      }

      try {
        if (isEdit) {
          // FR-05: Update student (Roll number is immutable)
          await api(`/students/${studentId}`, {
            method: 'PUT',
            body: JSON.stringify(payload)
          });
          showToast(`Student record for ${payload.name} updated successfully!`, 'success');
        } else {
          // FR-01 & FR-02: Create student with duplicate roll check
          await api('/students', {
            method: 'POST',
            body: JSON.stringify(payload)
          });
          showToast(`Student ${payload.name} (${payload.roll}) registered successfully!`, 'success');
        }

        resetStudentForm();
        loadStudents();
        loadStaffDashboard();
        loadDepartments();
        switchView('students');
      } catch (err) {
        if (err.data && err.data.field) {
          showFieldError(err.data.field, err.data.error);
        } else {
          showToast(err.message || 'Operation failed', 'error');
        }
      }
    });
  }

  function resetStudentForm() {
    elements.studentDataForm.reset();
    elements.editingStudentId.value = '';
    elements.studentFormTitle.textContent = 'Add New Student';
    elements.studentFormSub.textContent = 'Register a new student into the university database.';
    elements.formRoll.readOnly = false;
    elements.lockedRollBadge.classList.add('hidden');
    elements.rollHelperText.textContent = 'Must be unique across the university database (FR-02).';
    clearErrors();

    elements.previewName.textContent = 'Student Name';
    elements.previewRoll.textContent = 'ROLL123';
    elements.previewDept.textContent = 'DEPT';
    elements.previewYear.textContent = 'Year -';
    elements.previewAvatar.textContent = 'ST';
  }

  // Open Edit Mode (FR-05)
  window.smsApp = window.smsApp || {};
  window.smsApp.editStudent = (studentId) => {
    const student = state.students.find(s => s.id === studentId);
    if (!student) return;

    resetStudentForm();
    elements.editingStudentId.value = student.id;
    elements.studentFormTitle.textContent = `Edit Student: ${student.name} (${student.roll})`;
    elements.studentFormSub.textContent = 'Modify student profile information. Roll number cannot be modified (FR-05).';

    elements.formName.value = student.name;
    elements.formRoll.value = student.roll;
    elements.formDept.value = student.dept;
    elements.formYear.value = student.year;
    elements.formEmail.value = student.email;
    elements.formPhone.value = student.phone;

    // Strict FR-05 requirement: Roll number is locked!
    elements.formRoll.readOnly = true;
    elements.lockedRollBadge.classList.remove('hidden');
    elements.rollHelperText.textContent = 'Roll number cannot be modified once created (FR-05).';

    elements.previewName.textContent = student.name;
    elements.previewRoll.textContent = student.roll;
    elements.previewDept.textContent = student.dept;
    elements.previewYear.textContent = `Year ${student.year}`;
    elements.previewAvatar.textContent = student.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    switchView('add');
  };

  // -------------------------------------------------------------
  // DELETE STUDENT CONFIRMATION (FR-06)
  // -------------------------------------------------------------
  window.smsApp.promptDeleteStudent = (studentId, studentName, studentRoll) => {
    state.pendingDeleteStudent = studentId;
    elements.deleteModalText.innerHTML = `Are you sure you want to permanently delete the record for <strong>${escapeHtml(studentName)}</strong> (Roll: <strong>${escapeHtml(studentRoll)}</strong>)? This will also remove their academic attendance and grade records.`;
    elements.deleteModal.classList.add('show');
  };

  function setupDeleteModal() {
    elements.closeDeleteModalBtn.addEventListener('click', () => {
      elements.deleteModal.classList.remove('show');
    });
    elements.cancelDeleteBtn.addEventListener('click', () => {
      elements.deleteModal.classList.remove('show');
    });

    elements.confirmDeleteBtn.addEventListener('click', async () => {
      if (!state.pendingDeleteStudent) return;
      try {
        await api(`/students/${state.pendingDeleteStudent}`, { method: 'DELETE' });
        showToast('Student record deleted successfully (FR-06).', 'success');
        elements.deleteModal.classList.remove('show');
        state.pendingDeleteStudent = null;
        loadStudents();
        loadStaffDashboard();
        loadDepartments();
      } catch (err) {
        showToast('Failed to delete student: ' + err.message, 'error');
      }
    });
  }

  // -------------------------------------------------------------
  // STUDENT DOSSIER / PROFILE MODAL (Inspect details)
  // -------------------------------------------------------------
  window.smsApp.viewStudent = async (studentId) => {
    try {
      const data = await api(`/students/${studentId}`);
      const s = data.student;
      const attRate = data.attendanceRate;

      elements.profileModalBody.innerHTML = `
        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--line);">
          <div class="avatar-circle" style="width: 56px; height: 56px; font-size: 20px;">
            ${s.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h4 style="font-size: 19px; font-weight: 800; color: var(--text);">${escapeHtml(s.name)}</h4>
            <div style="display: flex; gap: 8px; margin-top: 4px;">
              <span class="roll-badge">${escapeHtml(s.roll)}</span>
              <span class="dept-badge">${escapeHtml(s.dept)}</span>
              <span class="year-pill">Year ${s.year}</span>
            </div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 20px;">
          <div style="background: var(--surface2); padding: 12px; border-radius: 8px;">
            <small style="color: var(--muted); font-size: 11px; font-weight: 700; text-transform: uppercase;">Email Contact</small>
            <div style="font-weight: 600; font-size: 13.5px; margin-top: 2px;">${escapeHtml(s.email)}</div>
          </div>
          <div style="background: var(--surface2); padding: 12px; border-radius: 8px;">
            <small style="color: var(--muted); font-size: 11px; font-weight: 700; text-transform: uppercase;">Phone Number</small>
            <div style="font-weight: 600; font-size: 13.5px; margin-top: 2px;">${escapeHtml(s.phone)}</div>
          </div>
        </div>

        <div style="margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; margin-bottom: 4px;">
            <span>Overall Attendance Compliance</span>
            <span style="color: ${attRate >= 75 ? 'var(--success)' : 'var(--danger)'};">${attRate}%</span>
          </div>
          <div class="progress-bar-container">
            <div class="progress-fill" style="width: ${attRate}%; background: ${attRate >= 75 ? 'var(--success)' : 'var(--danger)'};"></div>
          </div>
          <small style="color: var(--muted); font-size: 12px;">Total lectures attended: ${data.attendance.filter(a => a.status === 'Present').length} / ${data.attendance.length}</small>
        </div>

        <div>
          <h5 style="font-size: 14px; font-weight: 700; margin-bottom: 10px; color: var(--text-secondary);">Examination Grades</h5>
          ${data.grades && data.grades.length > 0 ? `
            <div class="table-responsive">
              <table class="data-table" style="font-size: 12px;">
                <thead>
                  <tr><th>Subject</th><th>Marks</th><th>Grade</th></tr>
                </thead>
                <tbody>
                  ${data.grades.map(g => `
                    <tr>
                      <td>${escapeHtml(g.subject)}</td>
                      <td>${g.marks} / ${g.max_marks}</td>
                      <td><span class="badge-grade grade-a">${g.grade}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : '<p style="color: var(--muted); font-size: 13px;">No examination grades published yet.</p>'}
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--line);">
          <button class="btn btn-secondary" onclick="document.getElementById('profileModal').classList.remove('show')">Close</button>
          <button class="btn btn-primary" onclick="document.getElementById('profileModal').classList.remove('show'); window.smsApp.editStudent(${s.id});">Edit Student</button>
        </div>
      `;

      elements.profileModal.classList.add('show');
    } catch (err) {
      showToast('Could not load student profile: ' + err.message, 'error');
    }
  };

  elements.closeProfileModalBtn.addEventListener('click', () => {
    elements.profileModal.classList.remove('show');
  });

  // -------------------------------------------------------------
  // DEPARTMENT REPORTS (FR-07)
  // -------------------------------------------------------------
  async function loadDepartments() {
    try {
      const data = await api('/departments');
      state.departments = data.departments || [];

      // Update Department filter chips in Students Directory
      elements.deptFilterChips.innerHTML = `
        <button class="chip-btn ${state.filterDept === '' ? 'active' : ''}" data-dept="">All</button>
        ${state.departments.map(d => `
          <button class="chip-btn ${state.filterDept === d.dept ? 'active' : ''}" data-dept="${d.dept}">
            ${d.dept} (${d.count})
          </button>
        `).join('')}
      `;

      // Setup chip click handlers
      elements.deptFilterChips.querySelectorAll('.chip-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          elements.deptFilterChips.querySelectorAll('.chip-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          state.filterDept = btn.dataset.dept;
          loadStudents();
        });
      });

      // Update Report dropdown
      elements.reportDeptSelect.innerHTML = `
        <option value="">-- Choose Department --</option>
        ${state.departments.map(d => `<option value="${d.dept}">${d.dept} (${d.count} students)</option>`).join('')}
      `;

      // Update Academic student selectors
      const studentOptions = `<option value="">Select Student...</option>` +
        state.students.map(s => `<option value="${s.id}">${s.roll} - ${s.name} (${s.dept})</option>`).join('');
      if (elements.attStudentSelect) elements.attStudentSelect.innerHTML = studentOptions;
      if (elements.gradeStudentSelect) elements.gradeStudentSelect.innerHTML = studentOptions;

    } catch (err) {
      console.error('Failed to load departments:', err);
    }
  }

  function setupReports() {
    // Current date for print header
    if (elements.printReportDate) {
      elements.printReportDate.textContent = new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
    }

    elements.reportDeptSelect.addEventListener('change', async (e) => {
      const dept = e.target.value;
      if (!dept) {
        elements.reportSummarySection.classList.add('hidden');
        elements.reportTableBody.innerHTML = `
          <tr><td colspan="5" style="text-align: center; color: var(--muted); padding: 32px;">Please select a department from the dropdown above.</td></tr>
        `;
        return;
      }

      try {
        const data = await api(`/reports/department/${dept}`);
        elements.repDeptName.textContent = data.department;
        elements.repTotalCount.textContent = data.totalCount;

        const b = data.yearBreakdown;
        elements.repYearPills.innerHTML = `
          Y1: <b>${b.year1}</b> | Y2: <b>${b.year2}</b> | Y3: <b>${b.year3}</b> | Y4: <b>${b.year4}</b>
        `;
        elements.reportSummarySection.classList.remove('hidden');

        if (data.students.length === 0) {
          elements.reportTableBody.innerHTML = `
            <tr><td colspan="5" style="text-align: center; color: var(--muted); padding: 32px;">No student records found in department ${dept}.</td></tr>
          `;
        } else {
          elements.reportTableBody.innerHTML = data.students.map(s => `
            <tr>
              <td><span class="roll-badge">${escapeHtml(s.roll)}</span></td>
              <td><b>${escapeHtml(s.name)}</b></td>
              <td>Year ${s.year}</td>
              <td>${escapeHtml(s.email)}</td>
              <td>${escapeHtml(s.phone)}</td>
            </tr>
          `).join('');
        }
      } catch (err) {
        showToast('Error generating department report: ' + err.message, 'error');
      }
    });

    // Print Report
    elements.printReportBtn.addEventListener('click', () => {
      if (!elements.reportDeptSelect.value) {
        showToast('Please select a department first before printing', 'error');
        return;
      }
      window.print();
    });

    // Export Report CSV
    elements.exportReportCsvBtn.addEventListener('click', () => {
      const dept = elements.reportDeptSelect.value;
      if (!dept) {
        showToast('Please select a department first', 'error');
        return;
      }
      const deptStudents = state.students.filter(s => s.dept.toUpperCase() === dept.toUpperCase());
      const headers = ['Roll Number', 'Name', 'Year', 'Email', 'Phone'];
      const rows = deptStudents.map(s => [`"${s.roll}"`, `"${s.name.replace(/"/g, '""')}"`, s.year, `"${s.email}"`, `"${s.phone}"`]);
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      downloadFile(`${dept}_department_roster.csv`, 'text/csv;', csv);
      showToast(`Exported ${deptStudents.length} records to CSV`, 'success');
    });
  }

  // -------------------------------------------------------------
  // ACADEMIC (ATTENDANCE & GRADES) - Staff View
  // -------------------------------------------------------------
  function setupAcademic() {
    // Tabs toggle
    elements.tabAttendanceBtn.addEventListener('click', () => {
      elements.tabAttendanceBtn.classList.add('active');
      elements.tabGradesBtn.classList.remove('active');
      elements.attendanceTabContent.classList.remove('hidden');
      elements.gradesTabContent.classList.add('hidden');
    });

    elements.tabGradesBtn.addEventListener('click', () => {
      elements.tabGradesBtn.classList.add('active');
      elements.tabAttendanceBtn.classList.remove('active');
      elements.gradesTabContent.classList.remove('hidden');
      elements.attendanceTabContent.classList.add('hidden');
    });

    // Default today's date
    if (elements.attDate) {
      elements.attDate.value = new Date().toISOString().split('T')[0];
    }

    // Save Attendance
    elements.attendanceForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        student_id: Number(elements.attStudentSelect.value),
        date: elements.attDate.value,
        subject: elements.attSubject.value.trim(),
        status: elements.attStatus.value
      };

      try {
        await api('/attendance', { method: 'POST', body: JSON.stringify(payload) });
        showToast('Attendance recorded successfully!', 'success');
        elements.attSubject.value = '';
      } catch (err) {
        showToast('Failed to record attendance: ' + err.message, 'error');
      }
    });

    // Record Grade
    elements.gradeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        student_id: Number(elements.gradeStudentSelect.value),
        subject: elements.gradeSubject.value.trim(),
        semester: elements.gradeSemester.value.trim(),
        marks: Number(elements.gradeMarks.value),
        max_marks: 100
      };

      try {
        const res = await api('/grades', { method: 'POST', body: JSON.stringify(payload) });
        showToast(`Grade recorded successfully! Assigned Grade: ${res.grade}`, 'success');
        elements.gradeMarks.value = '';
        elements.gradeSubject.value = '';
      } catch (err) {
        showToast('Failed to record grade: ' + err.message, 'error');
      }
    });
  }

  // -------------------------------------------------------------
  // CAMPUS ANNOUNCEMENTS (Staff & Student)
  // -------------------------------------------------------------
  async function loadAnnouncements() {
    try {
      const data = await api('/announcements');
      renderAnnouncements(data.announcements || []);
    } catch (e) {
      console.error('Failed to load announcements:', e);
    }
  }

  function renderAnnouncements(items) {
    if (!items || items.length === 0) {
      elements.announcementsList.innerHTML = '<div style="color: var(--muted); padding: 24px;">No notices posted yet.</div>';
      return;
    }

    elements.announcementsList.innerHTML = items.map(a => `
      <div class="announcement-item">
        <div class="announcement-meta">
          <span class="announcement-tag">${escapeHtml(a.category)}</span>
          <span class="announcement-date">${new Date(a.created_at).toLocaleDateString()}</span>
          <span style="font-size: 12px; color: var(--muted);">By: ${escapeHtml(a.author)}</span>
        </div>
        <div class="announcement-title">${escapeHtml(a.title)}</div>
        <div class="announcement-body">${escapeHtml(a.content)}</div>
      </div>
    `).join('');
  }

  function setupAnnouncements() {
    // Only staff can post
    if (elements.openAddAnnouncementBtn) {
      elements.openAddAnnouncementBtn.addEventListener('click', () => {
        elements.announcementModal.classList.add('show');
      });
    }

    elements.closeAnnouncementModalBtn.addEventListener('click', () => {
      elements.announcementModal.classList.remove('show');
    });
    elements.cancelAnnBtn.addEventListener('click', () => {
      elements.announcementModal.classList.remove('show');
    });

    elements.announcementForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        title: elements.annTitle.value.trim(),
        category: elements.annCategory.value,
        content: elements.annContent.value.trim()
      };

      try {
        await api('/announcements', { method: 'POST', body: JSON.stringify(payload) });
        showToast('Announcement posted successfully!', 'success');
        elements.announcementModal.classList.remove('show');
        elements.announcementForm.reset();
        loadAnnouncements();
      } catch (err) {
        showToast('Failed to post announcement: ' + err.message, 'error');
      }
    });
  }

  // -------------------------------------------------------------
  // STUDENT PORTAL SPECIFIC (prompts.md USER 2)
  // -------------------------------------------------------------
  async function loadStudentPortal() {
    try {
      const data = await api('/student/me');
      const s = data.student;

      // Hero Banner
      elements.stHeroName.textContent = `Welcome, ${s.name}`;
      elements.stHeroRoll.textContent = `Roll: ${s.roll}`;
      elements.stHeroDept.textContent = `Dept: ${s.dept}`;
      elements.stHeroYear.textContent = `Year ${s.year}`;
      elements.stHeroAttRate.textContent = `${data.attendanceRate}%`;

      // Stat Cards
      elements.stPresentCount.textContent = data.attendanceStats.present;
      elements.stCourseCount.textContent = data.grades.length || 5;
      elements.stStanding.textContent = data.attendanceRate >= 75 ? 'Good Standing' : 'Attendance Warning';
      elements.stStanding.style.color = data.attendanceRate >= 75 ? 'var(--success)' : 'var(--danger)';

      // Render Today's Schedule Preview
      if (data.schedule && data.schedule.length > 0) {
        const todayClasses = data.schedule.slice(0, 3);
        elements.stTodaySchedulePreview.innerHTML = todayClasses.map(c => `
          <div class="timetable-card">
            <div>
              <div class="timetable-subject">${escapeHtml(c.subject)}</div>
              <div class="timetable-meta">${escapeHtml(c.room)} • Faculty: ${escapeHtml(c.faculty)}</div>
            </div>
            <div class="timetable-time">${escapeHtml(c.time)}</div>
          </div>
        `).join('');

        // Full Schedule View
        elements.studentScheduleList.innerHTML = data.schedule.map(c => `
          <div class="timetable-card">
            <div>
              <span class="announcement-tag" style="margin-bottom: 4px; display: inline-block;">${escapeHtml(c.day)}</span>
              <div class="timetable-subject">${escapeHtml(c.subject)}</div>
              <div class="timetable-meta">${escapeHtml(c.room)} • Faculty: ${escapeHtml(c.faculty)}</div>
            </div>
            <div class="timetable-time">${escapeHtml(c.time)}</div>
          </div>
        `).join('');
      }

      // Render Attendance History
      if (data.attendance && data.attendance.length > 0) {
        elements.studentAttendanceBody.innerHTML = data.attendance.map(a => `
          <tr>
            <td>${escapeHtml(a.date)}</td>
            <td><b>${escapeHtml(a.subject)}</b></td>
            <td>
              <span class="badge-grade ${a.status === 'Present' ? 'grade-o' : 'badge-danger'}" style="${a.status === 'Absent' ? 'background: var(--danger-light); color: var(--danger);' : ''}">
                ${a.status === 'Present' ? 'Present ✅' : 'Absent ❌'}
              </span>
            </td>
            <td><small style="color: var(--muted);">${escapeHtml(a.remarks || 'Regular class')}</small></td>
          </tr>
        `).join('');
      } else {
        elements.studentAttendanceBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--muted); padding: 24px;">No attendance logged yet.</td></tr>';
      }

      // Render Grades Report Card
      if (data.grades && data.grades.length > 0) {
        elements.studentGradesBody.innerHTML = data.grades.map(g => {
          const gradeClass = g.grade === 'O' ? 'grade-o' : g.grade === 'A+' ? 'grade-a-plus' : 'grade-a';
          return `
            <tr>
              <td><b>${escapeHtml(g.subject)}</b></td>
              <td>${escapeHtml(g.semester)}</td>
              <td><span style="font-weight: 800; font-size: 15px;">${g.marks}</span> / ${g.max_marks}</td>
              <td>${g.max_marks}</td>
              <td><span class="badge-grade ${gradeClass}">${g.grade}</span></td>
              <td><span style="color: var(--success); font-weight: 600;">Completed</span></td>
            </tr>
          `;
        }).join('');
      } else {
        elements.studentGradesBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--muted); padding: 24px;">No semester grades recorded yet.</td></tr>';
      }

    } catch (err) {
      showToast('Could not load student profile: ' + err.message, 'error');
    }
  }

  // -------------------------------------------------------------
  // UTILITIES
  // -------------------------------------------------------------
  function closeAllModals() {
    elements.profileModal.classList.remove('show');
    elements.deleteModal.classList.remove('show');
    elements.announcementModal.classList.remove('show');
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function downloadFile(filename, mimeType, content) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 200);
  }

  // -------------------------------------------------------------
  // INITIALIZATION
  // -------------------------------------------------------------
  function init() {
    setupAuth();
    setupNavigation();
    setupDirectoryControls();
    setupStudentForm();
    setupDeleteModal();
    setupReports();
    setupAcademic();
    setupAnnouncements();

    checkExistingSession();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

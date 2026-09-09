// ============================================
// STUDENT MANAGEMENT SYSTEM
// Frontend JavaScript
// ============================================

// ---------- APPLICATION DATA ----------

const state = {
    students: [
        {
            id: 1,
            name: "Arun Kumar",
            roll: "24CT101",
            department: "CT",
            year: 3,
            email: "arun@example.com",
            phone: "9876543210"
        },
        {
            id: 2,
            name: "Priya S",
            roll: "24CSE112",
            department: "CSE",
            year: 3,
            email: "priya@example.com",
            phone: "9876501234"
        },
        {
            id: 3,
            name: "Kavin R",
            roll: "25CT021",
            department: "CT",
            year: 2,
            email: "kavin@example.com",
            phone: "9876512345"
        },
        {
            id: 4,
            name: "Meena V",
            roll: "23IT118",
            department: "IT",
            year: 4,
            email: "meena@example.com",
            phone: "9876523456"
        }
    ],

    editId: null
};


// ---------- SHORTCUT FUNCTIONS ----------

const $ = (id) => document.getElementById(id);


// ---------- HTML SAFETY ----------

function escapeHTML(value) {

    return String(value).replace(/[&<>"']/g, function (character) {

        const characters = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return characters[character];
    });
}


// ---------- TOAST MESSAGE ----------

function showToast(message) {

    const toast = $("toast");

    toast.textContent = message;

    toast.classList.add("show");

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {

        toast.classList.remove("show");

    }, 1800);
}


// ---------- GET UNIQUE DEPARTMENTS ----------

function getDepartments() {

    return [
        ...new Set(
            state.students.map(student => student.department)
        )
    ].sort();
}


// ============================================
// DASHBOARD
// ============================================

function updateDashboard() {

    // Total students
    $("total").textContent = state.students.length;


    // Number of departments
    $("depts").textContent = getDepartments().length;


    // Year 3 students
    $("year3").textContent =
        state.students.filter(student => student.year === 3).length;


    // Recent records
    $("recent").textContent = state.students.length;


    // Recent students table

    const recentStudents = state.students
        .slice(-5)
        .reverse();


    $("recentBody").innerHTML = recentStudents.length

        ? recentStudents.map(student => `

            <tr>

                <td>${escapeHTML(student.roll)}</td>

                <td>${escapeHTML(student.name)}</td>

                <td>${escapeHTML(student.department)}</td>

                <td>${student.year}</td>

            </tr>

        `).join("")

        : `

            <tr>

                <td colspan="4" class="empty">

                    No student records available.

                </td>

            </tr>

        `;
}


// ============================================
// DEPARTMENT DROPDOWNS
// ============================================

function refreshDepartmentControls() {

    const departments = getDepartments();


    // Student filter

    $("filter").innerHTML = `

        <option value="">All departments</option>

        ${departments.map(department => `

            <option value="${escapeHTML(department)}">

                ${escapeHTML(department)}

            </option>

        `).join("")}

    `;


    // Report department dropdown

    $("reportDept").innerHTML = `

        <option value="">Select a department</option>

        ${departments.map(department => `

            <option value="${escapeHTML(department)}">

                ${escapeHTML(department)}

            </option>

        `).join("")}

    `;
}


// ============================================
// STUDENT TABLE
// ============================================

function renderStudents() {

    const searchText =
        $("search").value.toLowerCase().trim();

    const selectedDepartment =
        $("filter").value;


    const filteredStudents = state.students.filter(student => {

        const matchesSearch =
            !searchText ||

            student.name
                .toLowerCase()
                .includes(searchText) ||

            student.roll
                .toLowerCase()
                .includes(searchText);


        const matchesDepartment =
            !selectedDepartment ||

            student.department === selectedDepartment;


        return matchesSearch && matchesDepartment;

    });


    $("studentBody").innerHTML =

        filteredStudents.length

        ?

        filteredStudents.map(student => `

            <tr>

                <td>
                    ${escapeHTML(student.roll)}
                </td>

                <td>
                    ${escapeHTML(student.name)}
                </td>

                <td>
                    ${escapeHTML(student.department)}
                </td>

                <td>
                    ${student.year}
                </td>

                <td>
                    ${escapeHTML(student.email)}
                </td>

                <td>
                    ${escapeHTML(student.phone)}
                </td>

                <td>

                    <button
                        class="mini"
                        data-edit="${student.id}">
                        Edit
                    </button>

                    <button
                        class="mini"
                        data-del="${student.id}">
                        Delete
                    </button>

                </td>

            </tr>

        `).join("")

        :

        `

        <tr>

            <td colspan="7" class="empty">

                No matching students found.

            </td>

        </tr>

        `;
}


// ============================================
// DEPARTMENT REPORT
// ============================================

function renderReport() {

    const department =
        $("reportDept").value;


    if (!department) {

        $("summary").classList.add("hidden");


        $("reportBody").innerHTML = `

            <tr>

                <td colspan="5" class="empty">

                    Select a department.

                </td>

            </tr>

        `;

        return;
    }


    const students =
        state.students.filter(
            student =>
                student.department === department
        );


    $("summary").classList.remove("hidden");


    $("summary").innerHTML = `

        <b>${students.length}</b>

        student(s) found in

        <b>${escapeHTML(department)}</b>.

    `;


    $("reportBody").innerHTML =

        students.length

        ?

        students.map(student => `

            <tr>

                <td>
                    ${escapeHTML(student.roll)}
                </td>

                <td>
                    ${escapeHTML(student.name)}
                </td>

                <td>
                    ${student.year}
                </td>

                <td>
                    ${escapeHTML(student.email)}
                </td>

                <td>
                    ${escapeHTML(student.phone)}
                </td>

            </tr>

        `).join("")

        :

        `

        <tr>

            <td colspan="5" class="empty">

                No students found.

            </td>

        </tr>

        `;
}


// ============================================
// PAGE NAVIGATION
// ============================================

function goToPage(view) {

    // Hide all pages

    document
        .querySelectorAll(".view")
        .forEach(page => {

            page.classList.remove("active-view");

        });


    // Show selected page

    const selectedPage =
        $(view);


    if (selectedPage) {

        selectedPage.classList.add("active-view");

    }


    // Update active sidebar button

    document
        .querySelectorAll(".nav[data-view]")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.view === view
            );

        });


    // Page title

    const titles = {

        dashboard: "Dashboard",

        students: "Students",

        add: state.editId
            ? "Edit Student"
            : "Add Student",

        reports: "Department Report"

    };


    $("title").textContent =
        titles[view] || "Dashboard";


    // Close mobile sidebar

    $("sidebar").classList.remove("open");


    // Refresh relevant pages

    if (view === "students") {

        renderStudents();

    }


    if (view === "reports") {

        renderReport();

    }
}


// ============================================
// CLEAR FORM
// ============================================

function clearForm() {

    state.editId = null;


    $("studentForm").reset();


    $("formTitle").textContent =
        "Add Student";


    $("save").textContent =
        "Save Student";
}


// ============================================
// LOGIN
// ============================================

$("loginForm").addEventListener(
    "submit",
    function (event) {

        event.preventDefault();


        const username =
            $("username").value.trim();


        const password =
            $("password").value.trim();


        if (!username || !password) {

            showToast(
                "Please enter username and password."
            );

            return;

        }


        $("user").textContent =
            username;


        $("login").classList.add(
            "hidden"
        );


        $("app").classList.remove(
            "hidden"
        );


        // Remember username

        localStorage.setItem(
            "pbsdUser",
            username
        );


        showToast(
            "Signed in successfully."
        );

    }
);


// ============================================
// LOGOUT
// ============================================

$("logout").addEventListener(
    "click",
    function () {

        localStorage.removeItem(
            "pbsdUser"
        );


        $("app").classList.add(
            "hidden"
        );


        $("login").classList.remove(
            "hidden"
        );


        $("loginForm").reset();


        showToast(
            "Logged out."
        );

    }
);


// ============================================
// SIDEBAR NAVIGATION
// ============================================

document
    .querySelectorAll(".nav[data-view]")
    .forEach(button => {

        button.addEventListener(
            "click",
            function () {

                const view =
                    this.dataset.view;


                if (view === "add") {

                    clearForm();

                }


                goToPage(view);

            }
        );

    });


// ============================================
// DASHBOARD QUICK ACTIONS
// ============================================

document
    .querySelectorAll("[data-go]")
    .forEach(button => {

        button.addEventListener(
            "click",
            function () {

                const view =
                    this.dataset.go;


                if (view === "add") {

                    clearForm();

                }


                goToPage(view);

            }
        );

    });


// ============================================
// MOBILE MENU
// ============================================

$("menu").addEventListener(
    "click",
    function () {

        $("sidebar")
            .classList.toggle("open");

    }
);


// ============================================
// DARK / LIGHT MODE
// ============================================

$("theme").addEventListener(
    "click",
    function () {

        document.body
            .classList.toggle("dark");


        const currentTheme =
            document.body.classList.contains("dark")
                ? "dark"
                : "light";


        localStorage.setItem(
            "pbsdTheme",
            currentTheme
        );

    }
);


// Restore saved theme

if (
    localStorage.getItem("pbsdTheme")
    === "dark"
) {

    document.body.classList.add(
        "dark"
    );

}


// ============================================
// ADD / UPDATE STUDENT
// ============================================

$("studentForm").addEventListener(
    "submit",
    function (event) {

        event.preventDefault();


        const student = {

            name:
                $("name").value.trim(),

            roll:
                $("roll").value.trim(),

            department:
                $("dept")
                    .value
                    .trim()
                    .toUpperCase(),

            year:
                Number(
                    $("year").value
                ),

            email:
                $("email").value.trim(),

            phone:
                $("phone").value.trim()

        };


        // Basic validation

        if (
            !student.name ||
            !student.roll ||
            !student.department ||
            !student.year ||
            !student.email ||
            !student.phone
        ) {

            showToast(
                "Please complete all fields."
            );

            return;

        }


        // Check duplicate roll number

        const duplicate =
            state.students.some(
                existingStudent =>

                    existingStudent.roll
                        .toLowerCase()
                    ===
                    student.roll
                        .toLowerCase()

                    &&

                    existingStudent.id
                    !==
                    state.editId
            );


        if (duplicate) {

            showToast(
                "Roll number already exists."
            );

            return;

        }


        // UPDATE existing student

        if (state.editId) {

            const existingStudent =
                state.students.find(
                    student =>
                        student.id ===
                        state.editId
                );


            if (existingStudent) {

                Object.assign(
                    existingStudent,
                    student
                );

            }


            showToast(
                "Student updated successfully."
            );

        }


        // ADD new student

        else {

            state.students.push({

                id:
                    Date.now(),

                ...student

            });


            showToast(
                "Student added successfully."
            );

        }


        // Refresh application

        clearForm();

        refreshDepartmentControls();

        updateDashboard();

        renderStudents();

        renderReport();


        // Go to student page

        goToPage(
            "students"
        );

    }
);


// ============================================
// CANCEL FORM
// ============================================

$("cancel").addEventListener(
    "click",
    function () {

        clearForm();

        goToPage(
            "students"
        );

    }
);


// ============================================
// SEARCH
// ============================================

$("search").addEventListener(
    "input",
    function () {

        renderStudents();

    }
);


// ============================================
// DEPARTMENT FILTER
// ============================================

$("filter").addEventListener(
    "change",
    function () {

        renderStudents();

    }
);


// ============================================
// REPORT FILTER
// ============================================

$("reportDept").addEventListener(
    "change",
    function () {

        renderReport();

    }
);


// ============================================
// EDIT / DELETE STUDENT
// ============================================

$("studentBody").addEventListener(
    "click",
    function (event) {

        const editId =
            event.target.dataset.edit;


        const deleteId =
            event.target.dataset.del;


        // EDIT

        if (editId) {

            const student =
                state.students.find(
                    student =>
                        student.id ===
                        Number(editId)
                );


            if (!student) return;


            state.editId =
                Number(editId);


            $("name").value =
                student.name;


            $("roll").value =
                student.roll;


            $("dept").value =
                student.department;


            $("year").value =
                student.year;


            $("email").value =
                student.email;


            $("phone").value =
                student.phone;


            $("formTitle").textContent =
                "Edit Student";


            $("save").textContent =
                "Update Student";


            goToPage(
                "add"
            );

        }


        // DELETE

        if (deleteId) {

            const student =
                state.students.find(
                    student =>
                        student.id ===
                        Number(deleteId)
                );


            if (!student) return;


            const confirmed =
                confirm(
                    `Delete ${student.name}'s record?`
                );


            if (!confirmed) return;


            state.students =
                state.students.filter(
                    student =>
                        student.id !==
                        Number(deleteId)
                );


            refreshDepartmentControls();

            updateDashboard();

            renderStudents();

            renderReport();


            showToast(
                "Student deleted successfully."
            );

        }

    }
);


// ============================================
// PRINT DEPARTMENT REPORT
// ============================================

$("print").addEventListener(
    "click",
    function () {

        const department =
            $("reportDept").value;


        if (!department) {

            showToast(
                "Please select a department first."
            );

            return;

        }


        window.print();

    }
);


// ============================================
// RESTORE LOGIN SESSION
// ============================================

const savedUser =
    localStorage.getItem(
        "pbsdUser"
    );


if (savedUser) {

    $("user").textContent =
        savedUser;


    $("login").classList.add(
        "hidden"
    );


    $("app").classList.remove(
        "hidden"
    );

}


// ============================================
// INITIAL APPLICATION LOAD
// ============================================

refreshDepartmentControls();

updateDashboard();

renderStudents();

renderReport();


// ============================================
// END OF SCRIPT
// ============================================
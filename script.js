

// --- 1. Login Logic ---
function handleLogin() {
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    if (user === "admin" && pass === "1234") {
        document.getElementById('login-overlay').style.display = 'none';
        document.getElementById('main-app').style.display = 'block';
        showPage('settings');
    } else { alert("Invalid credentials (admin/1234)"); }
}

// --- State Management ---
let students = JSON.parse(localStorage.getItem('gradeData')) || [];
let weights = { cp: 0.7, exam: 0.3 };
let components = JSON.parse(localStorage.getItem('gradeComponents')) || [
    { name: 'Quizzes', max: 100 },
    { name: 'Attendance', max: 50 }
];
let isLocked = true;

// --- 1. Login Logic ---
function handleLogin() {
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    if (user === "admin" && pass === "1234") {
        document.getElementById('login-overlay').style.display = 'none';
        document.getElementById('main-app').style.display = 'block';
        showPage('settings');
    } else { alert("Invalid credentials (admin/1234)"); }
}

// --- 2. Settings & Components ---
function updateWeights() {
    let cpVal = parseFloat(document.getElementById('weight-cp').value) || 0;
    if (cpVal > 100) cpVal = 100;
    weights.cp = cpVal / 100;
    weights.exam = (100 - cpVal) / 100;
    document.getElementById('exam-weight-display').innerText = (100 - cpVal) + "%";
}

function addComponent() {
    const name = document.getElementById('new-cp-name').value.trim();
    const max = parseFloat(document.getElementById('new-cp-max').value);

    if (name && max > 0) {
        components.push({ name, max });
        document.getElementById('new-cp-name').value = '';
        document.getElementById('new-cp-max').value = '';
        saveComponents();
        renderSettingsLists();
    }
}

function removeComponent(index) {
    components.splice(index, 1);
    saveComponents();
    renderSettingsLists();
}

function renderSettingsLists() {
    const list = document.getElementById('cp-list');
    list.innerHTML = components.map((c, i) => `
        <li>
            <span>${c.name} <b>(Max: ${c.max})</b></span>
            <button class="btn-del" onclick="removeComponent(${i})">&times;</button>
        </li>
    `).join('');
}

// --- 3. Grading Calculations ---
function calculateTermGrade(student, term) {
    let cpPctSum = 0;
    components.forEach(c => {
        const score = student[term].scores[c.name] || 0;
        cpPctSum += (score / c.max) * 100;
    });

    const cpAverage = components.length > 0 ? (cpPctSum / components.length) : 0;
    const examScore = student[term].scores['Exam'] || 0;
    const examPct = (examScore / 100) * 100; // Assuming Exam is always /100

    return (cpAverage * weights.cp) + (examPct * weights.exam);
}

function calculateCollegeGrade(score) {
    if (score >= 95) return "1.00";
    if (score >= 90) return "1.25";
    if (score >= 85) return "1.50";
    if (score >= 80) return "2.00";
    if (score >= 75) return "3.00";
    return "5.00";
}

// --- 4. Rendering ---
function renderGrading() {
    const thead = document.querySelector("#grading-table thead");
    const tbody = document.querySelector("#grading-table tbody");
    const lockAttr = isLocked ? "readonly" : "";

    // Generate Headers
    let headers = `<tr><th>ID</th><th>Name</th><th>Term</th>`;
    components.forEach(c => headers += `<th>${c.name}<br><small>Max: ${c.max}</small></th>`);
    headers += `<th style="background:#f0f7ff">CP Average</th><th>Exam (100)</th><th>Term Final %</th><th>Grade</th></tr>`;
    thead.innerHTML = headers;

    tbody.innerHTML = "";
    students.forEach((s, sIdx) => {
        ['midterm', 'final'].forEach(term => {
            let cpPctSum = 0;
            let cpCells = "";

            // Calculate individual component percentages
            components.forEach(c => {
                const score = s[term].scores[c.name] || 0;
                const pct = (score / c.max) * 100;
                cpPctSum += pct;
                cpCells += `<td>
                    <input type="number" value="${score}" ${lockAttr} onchange="updateScore(${sIdx},'${term}','${c.name}',this.value)">
                    <div class="pct-label">${pct.toFixed(1)}%</div>
                </td>`;
            });

            const cpAve = components.length > 0 ? (cpPctSum / components.length) : 0;
            const examScore = s[term].scores['Exam'] || 0;
            
            // Apply weights: (CP Ave * CP Weight) + (Exam Score * Exam Weight)
            const termTotal = (cpAve * weights.cp) + (examScore * weights.exam);

            tbody.innerHTML += `
                <tr class="${isLocked ? 'row-locked' : ''}">
                    <td>${s.id}</td>
                    <td>${s.last}</td>
                    <td><span class="term-label">${term}</span></td>
                    ${cpCells}
                    <td style="background:#f9f9f9; font-weight:bold">${cpAve.toFixed(2)}%</td>
                    <td>
                        <input type="number" value="${examScore}" ${lockAttr} onchange="updateScore(${sIdx},'${term}','Exam',this.value)">
                        <div class="pct-label">Weight: ${(weights.exam * 100)}%</div>
                    </td>
                    <td class="summary-col">${termTotal.toFixed(2)}%</td>
                    <td><span class="grade-badge">${calculateCollegeGrade(termTotal)}</span></td>
                </tr>`;
        });
    });
}

function renderReports() {
    const tbody = document.querySelector("#report-table tbody");
    tbody.innerHTML = "";

    students.forEach(s => {
        const mid = calculateTermGrade(s, 'midterm');
        const fin = calculateTermGrade(s, 'final');
        const avg = (mid + fin) / 2;
        const status = avg >= 75 ? "PASSED" : "FAILED";
        const statusClass = avg >= 75 ? "status-pass" : "status-fail";

        tbody.innerHTML += `
            <tr>
                <td>${s.id}</td>
                <td><b>${s.last}, ${s.first}</b></td>
                <td>${mid.toFixed(2)}%</td>
                <td>${fin.toFixed(2)}%</td>
                <td class="summary-col">${avg.toFixed(2)}%</td>
                <td class="${statusClass}"><strong>${status}</strong></td>
            </tr>`;
    });
}

// --- 5. Data Handling ---
function updateScore(sIdx, term, compName, value) {
    students[sIdx][term].scores[compName] = parseFloat(value) || 0;
    saveData();
    renderGrading();
}

function addStudent() {
    const id = document.getElementById('s-id').value;
    const f = document.getElementById('s-first').value;
    const l = document.getElementById('s-last').value;
    if(id && f && l) {
        students.push({ id, first: f, last: l, midterm: {scores:{}}, final: {scores:{}} });
        saveData();
        renderStudentList();
        document.getElementById('s-id').value = '';
        document.getElementById('s-first').value = '';
        document.getElementById('s-last').value = '';
    }
}

function renderStudentList() {
    const tbody = document.querySelector("#student-table tbody");
    tbody.innerHTML = students.map((s, i) => `
        <tr>
            <td>${s.id}</td><td>${s.first}</td><td>${s.last}</td>
            <td><button class="btn-del" onclick="students.splice(${i},1); saveData(); renderStudentList()">Delete</button></td>
        </tr>
    `).join('');
}

function toggleLock() {
    // If currently locked, ask for password to unlock
    if (isLocked) {
        const pass = prompt("Enter password to unlock grading:");
        if (pass === "1234") {
            isLocked = false;
            alert("Grading unlocked.");
        } else {
            alert("Incorrect password. Access denied.");
            return;
        }
    } else {
        // If already unlocked, clicking the button locks it again
        isLocked = true;
        alert("Grading locked.");
    }

    // Update button appearance and refresh table
    const lockBtn = document.getElementById('lock-btn');
    lockBtn.innerText = isLocked ? "Unlock Editing" : "Lock Grading";
    lockBtn.style.background = isLocked ? "#95a5a6" : "#e67e22"; // Color change for visual cue
    renderGrading();
}

function showPage(id) { 
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    document.getElementById(id).style.display = 'block';
    if(id === 'grading') renderGrading();
    if(id === 'students') renderStudentList();
    if(id === 'reports') renderReports();
}

function exportToExcel() {
    if (students.length === 0) {
        alert("No student data available to export.");
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    
    // 1. Create Dynamic Headers
    let headers = ["Student ID", "Student Name", "Term"];
    components.forEach(c => headers.push(`${c.name} (Score)`));
    headers.push("CP Total %", "Exam Score", "Exam Weight %", "Term Grade %", "Final Average", "Status");
    csvContent += headers.join(",") + "\n";

    // 2. Add Data Rows
    students.forEach(s => {
        const midGrade = calculateTermGrade(s, 'midterm');
        const finGrade = calculateTermGrade(s, 'final');
        const finalAvg = (midGrade + finGrade) / 2;
        const status = finalAvg >= 75 ? "PASSED" : "FAILED";

        ['midterm', 'final'].forEach((term, index) => {
            let row = [
                s.id,
                `"${s.last}, ${s.first}"`,
                term.toUpperCase()
            ];

            // Add Sub-component Scores
            let cpPctSum = 0;
            components.forEach(c => {
                const score = s[term].scores[c.name] || 0;
                cpPctSum += (score / c.max) * 100;
                row.push(score);
            });

            const cpAve = components.length > 0 ? (cpPctSum / components.length) : 0;
            const examScore = s[term].scores['Exam'] || 0;
            const termGrade = (term === 'midterm') ? midGrade : finGrade;

            // Add Calculation Data
            row.push(cpAve.toFixed(2) + "%");
            row.push(examScore);
            row.push((weights.exam * 100) + "%");
            row.push(termGrade.toFixed(2) + "%");

            // Only show Final Average and Status on the second row (Final Term row) for clarity
            if (term === 'final') {
                row.push(finalAvg.toFixed(2) + "%");
                row.push(status);
            } else {
                row.push("", ""); // Empty cells for the midterm row
            }

            csvContent += row.join(",") + "\n";
        });
    });

    // 3. Trigger Download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Grades_Full_Report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}



function saveData() { localStorage.setItem('gradeData', JSON.stringify(students)); }
function saveComponents() { localStorage.setItem('gradeComponents', JSON.stringify(components)); }

// Init
renderSettingsLists();
updateWeights();
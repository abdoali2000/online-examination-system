import { ADMIN_EMAIL, ADMIN_PASSWORD, DEFAULT_EXAM_DURATION_SECONDS } from "./config.js";
import { defaultQuestions } from "./questions.js";

// ── Seed data on first visit ─────────────────────────────────────────────
if (!localStorage.getItem("adminQuestions")) {
  localStorage.setItem("adminQuestions", JSON.stringify(defaultQuestions));
}
if (!localStorage.getItem("examDuration")) {
  localStorage.setItem("examDuration", String(DEFAULT_EXAM_DURATION_SECONDS));
}

// ══════════════════════════════════════════════════════════════════════════
//  ADMIN LOGIN
// ══════════════════════════════════════════════════════════════════════════
const adminLoginWrap = document.getElementById("adminLoginWrap");
const adminDash      = document.getElementById("adminDash");
const adminLoginForm = document.getElementById("adminLoginForm");
const adminEmailEl   = document.getElementById("adminEmail");
const adminPassEl    = document.getElementById("adminPass");
const adminEmailErr  = document.getElementById("adminEmailErr");
const adminPassErr   = document.getElementById("adminPassErr");
const adminLoginErr  = document.getElementById("adminLoginErr");
const adminUserLabel = document.getElementById("adminUserLabel");

// Check if already logged in this session
if (sessionStorage.getItem("adminAuth") === "true") {
  showDashboard();
}

adminLoginForm.addEventListener("submit", e => {
  e.preventDefault();
  adminEmailErr.textContent = "";
  adminPassErr.textContent  = "";
  adminLoginErr.textContent = "";

  const email = adminEmailEl.value.trim();
  const pass  = adminPassEl.value;
  let valid   = true;

  if (!email) { adminEmailErr.textContent = "Email is required."; valid = false; }
  if (!pass)  { adminPassErr.textContent  = "Password is required."; valid = false; }
  if (!valid) return;

  if (email === ADMIN_EMAIL && pass === ADMIN_PASSWORD) {
    sessionStorage.setItem("adminAuth", "true");
    showDashboard();
  } else {
    adminLoginErr.textContent = "Invalid email or password.";
    adminPassEl.value = "";
  }
});

function showDashboard() {
  adminLoginWrap.style.display = "none";
  adminDash.style.display      = "flex";
  adminUserLabel.textContent   = ADMIN_EMAIL;
  initDashboard();
}

document.getElementById("adminLogoutBtn").addEventListener("click", () => {
  sessionStorage.removeItem("adminAuth");
  location.reload();
});

// ══════════════════════════════════════════════════════════════════════════
//  DASHBOARD INIT
// ══════════════════════════════════════════════════════════════════════════
function initDashboard() {
  initTabs();
  renderTable();
  initForm();
  initSettings();
  initExport();
  initResetDefault();
  initResults();
}

// ── Tab Navigation ────────────────────────────────────────────────────────
function initTabs() {
  document.querySelectorAll(".admin-nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.tab;
      document.querySelectorAll(".admin-nav-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".admin-tab").forEach(t => t.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(targetId).classList.add("active");
    });
  });
}

// ══════════════════════════════════════════════════════════════════════════
//  QUESTIONS TABLE
// ══════════════════════════════════════════════════════════════════════════
const PAGE_SIZE = 15;
let currentPage = 1;
let pendingDeleteId = null;

function getQuestions() {
  return JSON.parse(localStorage.getItem("adminQuestions") || "[]");
}

function saveQuestions(qs) {
  localStorage.setItem("adminQuestions", JSON.stringify(qs));
}

function renderTable() {
  const all         = getQuestions();
  const examFilter  = document.getElementById("filterExam").value;
  const typeFilter  = document.getElementById("filterType").value;
  const search      = document.getElementById("filterSearch").value.toLowerCase();

  // Update stats
  const medCount  = all.filter(q => q.examType === "medical").length;
  const softCount = all.filter(q => q.examType === "softskills").length;
  document.getElementById("statTotal").textContent        = `Total: ${all.length}`;
  document.querySelectorAll(".stat-chip.medical")[0].textContent = `Medical: ${medCount}`;
  document.querySelectorAll(".stat-chip.soft")[0].textContent    = `Soft Skills: ${softCount}`;

  // Filter
  let filtered = all;
  if (examFilter !== "all") filtered = filtered.filter(q => q.examType === examFilter);
  if (typeFilter !== "all") filtered = filtered.filter(q => q.type === typeFilter);
  if (search)               filtered = filtered.filter(q => q.text.toLowerCase().includes(search));

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  if (currentPage > totalPages) currentPage = totalPages;
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Render rows
  const tbody = document.getElementById("questionsBody");
  if (pageItems.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="admin-loading">No questions match the current filters.</td></tr>`;
  } else {
    tbody.innerHTML = pageItems.map((q, i) => {
      const rowNum  = (currentPage - 1) * PAGE_SIZE + i + 1;
      const typeBadge = q.type === "tf"
        ? `<span class="q-badge tf-badge">T/F</span>`
        : `<span class="q-badge mcq-badge">MCQ</span>`;
      const examBadge = q.examType === "medical"
        ? `<span class="q-badge exam-badge medical-badge">Medical</span>`
        : `<span class="q-badge exam-badge soft-badge">Soft Skills</span>`;
      const answerPreview = q.type === "tf"
        ? `<span class="${q.correct ? 'ans-true' : 'ans-false'}">${q.correct ? "True" : "False"}</span>`
        : `<span class="ans-mcq">${String.fromCharCode(65 + q.correctIndex)}</span>`;
      const preview = q.text.length > 80 ? q.text.slice(0, 77) + "…" : q.text;

      return `
        <tr data-id="${q.id}">
          <td class="row-num">${rowNum}</td>
          <td>${typeBadge}</td>
          <td>${examBadge}</td>
          <td class="q-text-cell" title="${q.text}">${preview}</td>
          <td>${answerPreview}</td>
          <td class="action-cell">
            <button class="tbl-btn edit-btn" data-id="${q.id}" title="Edit">✏️</button>
            <button class="tbl-btn del-btn"  data-id="${q.id}" title="Delete">🗑️</button>
          </td>
        </tr>`;
    }).join("");
  }

  // Pagination controls
  renderPagination(totalPages);

  // Attach action listeners
  document.querySelectorAll(".edit-btn").forEach(btn =>
    btn.addEventListener("click", () => openEditModal(parseInt(btn.dataset.id)))
  );
  document.querySelectorAll(".del-btn").forEach(btn =>
    btn.addEventListener("click", () => openDeleteModal(parseInt(btn.dataset.id)))
  );
}

// ── Pagination ─────────────────────────────────────────────────────────────
function renderPagination(totalPages) {
  const container = document.getElementById("pagination");
  if (totalPages <= 1) { container.innerHTML = ""; return; }

  let html = "";
  if (currentPage > 1) html += `<button class="page-btn" data-page="${currentPage - 1}">← Prev</button>`;
  for (let p = 1; p <= totalPages; p++) {
    html += `<button class="page-btn ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
  }
  if (currentPage < totalPages) html += `<button class="page-btn" data-page="${currentPage + 1}">Next →</button>`;
  container.innerHTML = html;

  container.querySelectorAll(".page-btn").forEach(btn =>
    btn.addEventListener("click", () => {
      currentPage = parseInt(btn.dataset.page);
      renderTable();
    })
  );
}

// ── Filter / Search listeners ─────────────────────────────────────────────
["filterExam", "filterType"].forEach(id =>
  document.getElementById(id).addEventListener("change", () => { currentPage = 1; renderTable(); })
);
document.getElementById("filterSearch").addEventListener("input", () => { currentPage = 1; renderTable(); });

// ══════════════════════════════════════════════════════════════════════════
//  EDIT MODAL
// ══════════════════════════════════════════════════════════════════════════
const modalOverlay = document.getElementById("modalOverlay");
const modalBody    = document.getElementById("modalBody");
document.getElementById("modalClose").addEventListener("click", closeModal);
modalOverlay.addEventListener("click", e => { if (e.target === modalOverlay) closeModal(); });

function openEditModal(id) {
  const qs = getQuestions();
  const q  = qs.find(q => q.id === id);
  if (!q) return;

  const tfSection  = q.type === "tf";
  const optionsHtml = tfSection ? "" : q.options.map((opt, i) => `
    <div class="mcq-option-row">
      <span class="mcq-label">${String.fromCharCode(65 + i)}</span>
      <input type="text" class="admin-input mcq-opt-input" data-idx="${i}" value="${escHtml(opt)}" />
      <label class="admin-radio correct-radio">
        <input type="radio" name="editCorrect" value="${i}" ${i === q.correctIndex ? "checked" : ""} /> Correct
      </label>
    </div>`).join("");

  modalBody.innerHTML = `
    <div class="admin-field">
      <label>Question Text</label>
      <textarea id="editText" class="admin-textarea" rows="4">${escHtml(q.text)}</textarea>
    </div>
    ${tfSection ? `
      <div class="admin-field">
        <label>Correct Answer</label>
        <div class="admin-radio-row">
          <label class="admin-radio"><input type="radio" name="editTf" value="true"  ${q.correct ? "checked" : ""}> True</label>
          <label class="admin-radio"><input type="radio" name="editTf" value="false" ${!q.correct ? "checked" : ""}> False</label>
        </div>
      </div>` : `
      <div class="admin-field">
        <label>Options &amp; Correct Answer</label>
        <div class="mcq-options-list">${optionsHtml}</div>
      </div>`}
    <div class="admin-form-actions" style="margin-top:1.5rem">
      <button class="admin-save-btn" id="saveEditBtn">💾 Save Changes</button>
      <button class="admin-cancel-btn" id="cancelModalBtn">Cancel</button>
    </div>
  `;

  document.getElementById("cancelModalBtn").addEventListener("click", closeModal);
  document.getElementById("saveEditBtn").addEventListener("click", () => saveEdit(id, q.type));

  modalOverlay.style.display = "flex";
}

function saveEdit(id, type) {
  const qs   = getQuestions();
  const idx  = qs.findIndex(q => q.id === id);
  if (idx === -1) return;

  const newText = document.getElementById("editText").value.trim();
  if (!newText) { showToast("Question text cannot be empty.", "error"); return; }

  if (type === "tf") {
    const tfVal = document.querySelector('input[name="editTf"]:checked')?.value;
    qs[idx].text    = newText;
    qs[idx].correct = tfVal === "true";
  } else {
    const opts = Array.from(document.querySelectorAll(".mcq-opt-input")).map(i => i.value.trim());
    if (opts.some(o => !o)) { showToast("All options must be filled.", "error"); return; }
    const correctIdx = parseInt(document.querySelector('input[name="editCorrect"]:checked')?.value ?? "0");
    qs[idx].text         = newText;
    qs[idx].options      = opts;
    qs[idx].correctIndex = correctIdx;
  }

  saveQuestions(qs);
  renderTable();
  closeModal();
  showToast("Question updated successfully! ✅");
}

function closeModal() {
  modalOverlay.style.display = "none";
}

// ══════════════════════════════════════════════════════════════════════════
//  DELETE MODAL
// ══════════════════════════════════════════════════════════════════════════
const deleteOverlay   = document.getElementById("deleteOverlay");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
const cancelDeleteBtn  = document.getElementById("cancelDeleteBtn");

function openDeleteModal(id) {
  pendingDeleteId = id;
  deleteOverlay.style.display = "flex";
}

cancelDeleteBtn.addEventListener("click", () => {
  deleteOverlay.style.display = "none";
  pendingDeleteId = null;
});

confirmDeleteBtn.addEventListener("click", () => {
  if (pendingDeleteId === null) return;
  const qs     = getQuestions();
  const updated = qs.filter(q => q.id !== pendingDeleteId);
  saveQuestions(updated);
  renderTable();
  deleteOverlay.style.display = "none";
  pendingDeleteId = null;
  showToast("Question deleted. 🗑️");
});

// ══════════════════════════════════════════════════════════════════════════
//  ADD QUESTION FORM
// ══════════════════════════════════════════════════════════════════════════
function initForm() {
  const qTypeSelect = document.getElementById("qType");
  const tfSection   = document.getElementById("tfSection");
  const mcqSection  = document.getElementById("mcqSection");
  const form        = document.getElementById("questionForm");
  const cancelEdit  = document.getElementById("cancelEditBtn");

  qTypeSelect.addEventListener("change", () => {
    const isMcq = qTypeSelect.value === "mcq";
    tfSection.style.display  = isMcq ? "none" : "block";
    mcqSection.style.display = isMcq ? "block" : "none";
  });

  form.addEventListener("submit", e => {
    e.preventDefault();
    const editId = document.getElementById("editId").value;
    editId ? updateQuestion(editId) : addQuestion();
  });

  cancelEdit.addEventListener("click", resetForm);
}

function addQuestion() {
  const examType = document.getElementById("qExamType").value;
  const qType    = document.getElementById("qType").value;
  const text     = document.getElementById("qText").value.trim();

  if (!text) { document.getElementById("qTextErr").textContent = "Question text is required."; return; }
  document.getElementById("qTextErr").textContent = "";

  const qs   = getQuestions();
  const newId = qs.length > 0 ? Math.max(...qs.map(q => q.id)) + 1 : 1;
  const newQ  = { id: newId, examType, type: qType, text };

  if (qType === "tf") {
    const tfVal = document.querySelector('input[name="tfAnswer"]:checked')?.value;
    newQ.correct = tfVal === "true";
  } else {
    const opts = Array.from(document.querySelectorAll(".mcq-opt-input")).map(i => i.value.trim());
    if (opts.some(o => !o)) {
      document.getElementById("qOptsErr").textContent = "All 4 options must be filled.";
      return;
    }
    document.getElementById("qOptsErr").textContent = "";
    newQ.options      = opts;
    newQ.correctIndex = parseInt(document.querySelector('input[name="correctOpt"]:checked')?.value ?? "0");
  }

  qs.push(newQ);
  saveQuestions(qs);
  resetForm();
  renderTable();
  switchTab("questionsTab", "navQuestions");
  showToast("Question added successfully! ✅");
}

function updateQuestion(id) {
  // Update handled via modal; this form is for add only
}

function resetForm() {
  document.getElementById("questionForm").reset();
  document.getElementById("editId").value = "";
  document.getElementById("addTabTitle").textContent = "Add New Question";
  document.getElementById("saveBtn").textContent = "💾 Save Question";
  document.getElementById("cancelEditBtn").style.display = "none";
  document.getElementById("tfSection").style.display  = "block";
  document.getElementById("mcqSection").style.display = "none";
  document.getElementById("qTextErr").textContent  = "";
  document.getElementById("qOptsErr").textContent  = "";
}

function switchTab(tabId, navId) {
  document.querySelectorAll(".admin-nav-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".admin-tab").forEach(t => t.classList.remove("active"));
  document.getElementById(navId).classList.add("active");
  document.getElementById(tabId).classList.add("active");
}

// ══════════════════════════════════════════════════════════════════════════
//  SETTINGS — EXAM DURATION
// ══════════════════════════════════════════════════════════════════════════
function initSettings() {
  const durationInput   = document.getElementById("durationMinutes");
  const saveDurationBtn = document.getElementById("saveDuration");
  const feedback        = document.getElementById("settingFeedback");

  // Load current value
  const currentSecs = parseInt(localStorage.getItem("examDuration") || String(DEFAULT_EXAM_DURATION_SECONDS), 10);
  durationInput.value = Math.round(currentSecs / 60);

  saveDurationBtn.addEventListener("click", () => {
    const minutes = parseInt(durationInput.value, 10);
    if (isNaN(minutes) || minutes < 1 || minutes > 180) {
      feedback.textContent = "⚠️ Please enter a value between 1 and 180 minutes.";
      feedback.className   = "setting-feedback error";
      return;
    }
    localStorage.setItem("examDuration", String(minutes * 60));
    feedback.textContent = `✅ Duration saved: ${minutes} minute${minutes !== 1 ? "s" : ""}.`;
    feedback.className   = "setting-feedback success";
    setTimeout(() => { feedback.textContent = ""; feedback.className = "setting-feedback"; }, 3000);
    showToast(`Exam duration set to ${minutes} minutes ✅`);
  });
}

// ══════════════════════════════════════════════════════════════════════════
//  EXPORT JSON
// ══════════════════════════════════════════════════════════════════════════
function initExport() {
  document.getElementById("exportBtn").addEventListener("click", () => {
    const qs   = getQuestions();
    const blob = new Blob([JSON.stringify(qs, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "bio_nl_questions.json";
    a.click();
    URL.revokeObjectURL(url);
    showToast("Questions exported! 📤");
  });
}

// ══════════════════════════════════════════════════════════════════════════
//  RESET TO DEFAULT
// ══════════════════════════════════════════════════════════════════════════
function initResetDefault() {
  document.getElementById("resetQuestions").addEventListener("click", () => {
    if (!confirm("This will replace ALL questions with the original defaults. Are you sure?")) return;
    localStorage.setItem("adminQuestions", JSON.stringify(defaultQuestions));
    currentPage = 1;
    renderTable();
    showToast("Questions reset to default ↺");
  });
}

// ══════════════════════════════════════════════════════════════════════════
//  TOAST NOTIFICATION
// ══════════════════════════════════════════════════════════════════════════
let toastTimer;
function showToast(msg, type = "success") {
  const toast = document.getElementById("adminToast");
  toast.textContent  = msg;
  toast.className    = `admin-toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.className = "admin-toast"; }, 3000);
}


// ══════════════════════════════════════════════════════════════════════════
//  RESULTS TAB
// ══════════════════════════════════════════════════════════════════════════
function getResults() {
  return JSON.parse(localStorage.getItem("examResults") || "[]");
}

function initResults() {
  renderResults();

  // Filters
  document.getElementById("filterResultExam").addEventListener("change", renderResults);
  document.getElementById("filterResultSearch").addEventListener("input", renderResults);

  // Clear all
  document.getElementById("clearResultsBtn").addEventListener("click", () => {
    if (!confirm("This will permanently delete ALL student results. Are you sure?")) return;
    localStorage.removeItem("examResults");
    renderResults();
    showToast("All results cleared 🗑️");
  });

  // Detail modal close
  document.getElementById("resultDetailClose").addEventListener("click", () => {
    document.getElementById("resultDetailOverlay").style.display = "none";
  });
  document.getElementById("resultDetailOverlay").addEventListener("click", e => {
    if (e.target === document.getElementById("resultDetailOverlay")) {
      document.getElementById("resultDetailOverlay").style.display = "none";
    }
  });
}

function renderResults() {
  const all        = getResults();
  const examFilter = document.getElementById("filterResultExam").value;
  const search     = document.getElementById("filterResultSearch").value.toLowerCase();

  // Stats
  const medCount  = all.filter(r => r.examType === "medical").length;
  const softCount = all.filter(r => r.examType === "softskills").length;
  document.getElementById("statResultsTotal").textContent   = `Total: ${all.length}`;
  document.getElementById("statResultsMedical").textContent = `Medical: ${medCount}`;
  document.getElementById("statResultsSoft").textContent    = `Soft Skills: ${softCount}`;

  // Filter
  let filtered = all;
  if (examFilter !== "all") filtered = filtered.filter(r => r.examType === examFilter);
  if (search) filtered = filtered.filter(r =>
    r.studentName.toLowerCase().includes(search) ||
    r.studentEmail.toLowerCase().includes(search)
  );

  // Sort newest first
  filtered = [...filtered].sort((a, b) => b.id - a.id);

  const tbody = document.getElementById("resultsBody");
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="admin-loading">No results match the current filters.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map((r, i) => {
    const pct        = Math.round((r.score / r.total) * 100);
    const examBadge  = r.examType === "medical"
      ? `<span class="q-badge medical-badge">🏥 Medical</span>`
      : `<span class="q-badge soft-badge">💼 Soft Skills</span>`;
    const statusBadge = r.isTimeout
      ? `<span class="q-badge" style="background:rgba(231,76,60,.15);color:#e74c3c;border:1px solid rgba(231,76,60,.3)">⏰ Timeout</span>`
      : `<span class="q-badge tf-badge">✅ Submitted</span>`;
    const pctColor = pct >= 70 ? "#2ecc71" : pct >= 50 ? "#f5a623" : "#e74c3c";
    const dateStr  = new Date(r.timestamp).toLocaleString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });

    return `
      <tr data-result-id="${r.id}">
        <td class="row-num">${i + 1}</td>
        <td style="font-weight:600;color:rgba(255,255,255,.9)">${escHtml(r.studentName)}</td>
        <td style="color:rgba(255,255,255,.55);font-size:.82rem">${escHtml(r.studentEmail)}</td>
        <td>${examBadge}</td>
        <td><strong style="color:rgba(255,255,255,.9)">${r.score}</strong><span style="color:rgba(255,255,255,.4)"> / ${r.total}</span></td>
        <td><span style="color:${pctColor};font-weight:700">${pct}%</span></td>
        <td>${statusBadge}</td>
        <td style="color:rgba(255,255,255,.45);font-size:.8rem;white-space:nowrap">${dateStr}</td>
        <td><button class="tbl-btn view-result-btn" data-id="${r.id}" title="View Details">👁️ Details</button></td>
      </tr>`;
  }).join("");

  // Attach view listeners
  document.querySelectorAll(".view-result-btn").forEach(btn =>
    btn.addEventListener("click", () => openResultDetail(parseInt(btn.dataset.id)))
  );
}

function openResultDetail(id) {
  const results = getResults();
  const r = results.find(r => r.id === id);
  if (!r) return;

  const pct      = Math.round((r.score / r.total) * 100);
  const dateStr  = new Date(r.timestamp).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
  const pctColor = pct >= 70 ? "#2ecc71" : pct >= 50 ? "#f5a623" : "#e74c3c";

  document.getElementById("resultDetailTitle").textContent =
    `${r.studentName} — ${r.examType === "medical" ? "🏥 Medical" : "💼 Soft Skills"} Exam`;
  document.getElementById("resultDetailMeta").innerHTML =
    `📧 ${escHtml(r.studentEmail)} &nbsp;| ` +
    `📅 ${dateStr} &nbsp;| ` +
    `Score: <strong style="color:${pctColor}">${r.score} / ${r.total} (${pct}%)</strong>` +
    (r.isTimeout ? ` &nbsp;| <span style="color:#e74c3c">⏰ Timeout</span>` : "");

  // Build answers HTML
  const answersHtml = r.answers.map((a, idx) => {
    const typeBadge = a.questionType === "tf"
      ? `<span class="q-badge tf-badge">T/F</span>`
      : `<span class="q-badge mcq-badge">MCQ</span>`;

    if (a.skipped) {
      return `
        <div class="rd-question skipped">
          <div class="rd-q-header">
            ${typeBadge}
            <span class="rd-q-num">Q${idx + 1}</span>
            <span class="rd-skip-badge">⏩ Skipped</span>
          </div>
          <p class="rd-q-text">${escHtml(a.questionText)}</p>
          <div class="rd-correct-note">✔ Correct answer: <strong>${escHtml(a.correctAnswer)}</strong></div>
        </div>`;
    }

    const optionsHtml = a.options.map((opt, i) => {
      const label     = a.questionType === "mcq" ? String.fromCharCode(65 + i) + ". " : "";
      const isSelected = opt === a.selectedAnswer;
      const isCorrect  = opt === a.correctAnswer;

      let cls = "rd-option";
      let icon = "";
      if (isSelected && isCorrect)  { cls += " rd-correct-selected"; icon = " ✔️"; }
      else if (isSelected && !isCorrect) { cls += " rd-wrong-selected";   icon = " ❌"; }
      else if (!isSelected && isCorrect) { cls += " rd-correct-unselected"; icon = " ✔️ correct"; }

      return `<div class="${cls}">${label}${escHtml(opt)}${icon}</div>`;
    }).join("");

    const resultIcon = a.isCorrect ? "✅" : "❌";
    const resultCls  = a.isCorrect ? "rd-question correct" : "rd-question wrong";

    return `
      <div class="${resultCls}">
        <div class="rd-q-header">
          ${typeBadge}
          <span class="rd-q-num">Q${idx + 1}</span>
          <span class="rd-result-icon">${resultIcon}</span>
        </div>
        <p class="rd-q-text">${escHtml(a.questionText)}</p>
        <div class="rd-options">${optionsHtml}</div>
      </div>`;
  }).join("");

  document.getElementById("resultDetailBody").innerHTML = `
    <div class="rd-summary">
      <div class="rd-stat"><span>✅ Correct</span><strong style="color:#2ecc71">${r.score}</strong></div>
      <div class="rd-stat"><span>❌ Wrong</span><strong style="color:#e74c3c">${r.total - r.score - r.answers.filter(a => a.skipped).length}</strong></div>
      <div class="rd-stat"><span>⏩ Skipped</span><strong style="color:#f5a623">${r.answers.filter(a => a.skipped).length}</strong></div>
      <div class="rd-stat"><span>📊 Score</span><strong style="color:${pctColor}">${pct}%</strong></div>
    </div>
    <div class="rd-answers-list">${answersHtml}</div>
  `;

  document.getElementById("resultDetailOverlay").style.display = "flex";
}


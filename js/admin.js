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
//  UTILITY
// ══════════════════════════════════════════════════════════════════════════
function escHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

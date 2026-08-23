import { ADMIN_UID, DEFAULT_EXAM_DURATION_SECONDS, db, auth } from "./config.js";
import { defaultQuestions } from "./questions.js";
import {
  collection, getDocs, deleteDoc, doc, addDoc, getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ── Seed data on first visit ─────────────────────────────────────────────
if (!localStorage.getItem("adminQuestions")) {
  localStorage.setItem("adminQuestions", JSON.stringify(defaultQuestions));
}
if (!localStorage.getItem("examDuration")) {
  localStorage.setItem("examDuration", String(DEFAULT_EXAM_DURATION_SECONDS));
}

// ── Helpers ───────────────────────────────────────────────────────────────
function escHtml(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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

const adminLoginBtn  = document.getElementById("adminLoginBtn");

// ── Auth state observer — single source of truth ──────────────────────────
// Fires immediately on page load and on every auth change.
// Only reveals the dashboard if the signed-in UID matches ADMIN_UID.
let dashboardInitialised = false;
onAuthStateChanged(auth, (user) => {
  if (user && user.uid === ADMIN_UID) {
    showDashboard(user.email);
  } else {
    adminLoginWrap.style.display = "";   // reset to default (visible)
    adminDash.style.display      = "none";
  }
});

// ── Login form submit ─────────────────────────────────────────────────────
adminLoginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  adminEmailErr.textContent = "";
  adminPassErr.textContent  = "";
  adminLoginErr.textContent = "";

  const email = adminEmailEl.value.trim();
  const pass  = adminPassEl.value;
  let valid   = true;

  if (!email) { adminEmailErr.textContent = "Email is required.";    valid = false; }
  if (!pass)  { adminPassErr.textContent  = "Password is required."; valid = false; }
  if (!valid) return;

  adminLoginBtn.disabled    = true;
  adminLoginBtn.textContent = "Logging in…";

  try {
    const credential = await signInWithEmailAndPassword(auth, email, pass);

    // Extra guard: confirm the account is the designated admin
    if (credential.user.uid !== ADMIN_UID) {
      await signOut(auth);
      adminLoginErr.textContent = "Access denied. This account is not authorised as admin.";
      adminLoginBtn.disabled    = false;
      adminLoginBtn.textContent = "Login";
      return;
    }
    // onAuthStateChanged fires → showDashboard() is called automatically

  } catch (err) {
    adminLoginBtn.disabled    = false;
    adminLoginBtn.textContent = "Login";

    if (
      err.code === "auth/user-not-found"     ||
      err.code === "auth/invalid-credential" ||
      err.code === "auth/invalid-email"
    ) {
      adminEmailErr.textContent = "No account found with this email.";
    } else if (err.code === "auth/wrong-password") {
      adminPassErr.textContent = "Incorrect password.";
    } else if (err.code === "auth/too-many-requests") {
      adminLoginErr.textContent = "Too many failed attempts. Please try again later.";
    } else {
      adminLoginErr.textContent = `Login failed: ${err.message}`;
    }
    console.error("[admin] signIn error:", err);
  }
});

function showDashboard(email) {
  adminLoginWrap.style.display = "none";
  adminDash.style.display      = "flex";
  adminUserLabel.textContent   = email || "Admin";
  if (!dashboardInitialised) {
    dashboardInitialised = true;
    initDashboard();
  }
}

// ── Logout ────────────────────────────────────────────────────────────────
document.getElementById("adminLogoutBtn").addEventListener("click", async () => {
  dashboardInitialised = false;
  await signOut(auth);
  // onAuthStateChanged fires → hides dashboard and shows login automatically
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
  initCreateExam();
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

      // Always re-fetch & re-render results when switching to the Results tab
      if (targetId === "resultsTab") {
        loadResultsFromFirestore().then(() => renderResults());
      }
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
// Firestore-backed results cache
let _resultsCache = [];
let _resultsCacheLoaded = false;

async function loadResultsFromFirestore() {
  try {
    const snap = await getDocs(collection(db, "examResults"));
    _resultsCache = snap.docs.map(d => ({ _docId: d.id, ...d.data() }));
    _resultsCacheLoaded = true;
  } catch (err) {
    console.error("[admin] Firestore loadResults error:", err);
    _resultsCache = [];
  }
}

function getResults() {
  return _resultsCache;
}

function initResults() {
  // Load from Firestore on first open
  loadResultsFromFirestore().then(() => renderResults());

  // Filters
  document.getElementById("filterResultExam").addEventListener("change", renderResults);
  document.getElementById("filterResultSearch").addEventListener("input", renderResults);

  // Refresh button — re-fetch from Firestore
  document.getElementById("refreshResultsBtn").addEventListener("click", async () => {
    await loadResultsFromFirestore();
    renderResults();
    showToast("Results refreshed ✅");
  });

  // Clear all — delete every doc from Firestore
  document.getElementById("clearResultsBtn").addEventListener("click", async () => {
    if (!confirm("This will permanently delete ALL student results. Are you sure?")) return;
    try {
      const snap = await getDocs(collection(db, "examResults"));
      const deletes = snap.docs.map(d => deleteDoc(doc(db, "examResults", d.id)));
      await Promise.all(deletes);
      _resultsCache = [];
      renderResults();
      showToast("All results cleared 🗑️");
    } catch (err) {
      console.error("[admin] clearResults error:", err);
      showToast("Failed to clear results ❌", "error");
    }
  });

  // Detail modal close
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
    tbody.innerHTML = `<tr><td colspan="10" class="admin-loading">No results match the current filters.</td></tr>`;
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

    const violationBadge = (r.violations && r.violations > 0)
      ? `<span class="q-badge" style="background:rgba(231,76,60,.15);color:#e74c3c;border:1px solid rgba(231,76,60,.3)">⚠️ ${r.violations}</span>`
      : `<span class="q-badge tf-badge">✅ 0</span>`;

    return `
      <tr data-result-id="${r.id}">
        <td class="row-num">${i + 1}</td>
        <td style="font-weight:600;color:rgba(255,255,255,.9)">${escHtml(r.studentName)}</td>
        <td style="color:rgba(255,255,255,.55);font-size:.82rem">${escHtml(r.studentEmail)}</td>
        <td>${examBadge}</td>
        <td><strong style="color:rgba(255,255,255,.9)">${r.score}</strong><span style="color:rgba(255,255,255,.4)"> / ${r.total}</span></td>
        <td><span style="color:${pctColor};font-weight:700">${pct}%</span></td>
        <td>${statusBadge}</td>
        <td>${violationBadge}</td>
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
    `📧 ${escHtml(r.studentEmail)} &nbsp;| ` +
    `📅 ${dateStr} &nbsp;| ` +
    `Score: <strong style="color:${pctColor}">${r.score} / ${r.total} (${pct}%)</strong>` +
    (r.isTimeout ? ` &nbsp;| <span style="color:#e74c3c">⏰ Timeout</span>` : "") +
    (r.violations > 0 ? ` &nbsp;| <span style="color:#e74c3c">⚠️ ${r.violations} violation(s)</span>` : "");

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
      <div class="rd-stat"><span>⚠️ Violations</span><strong style="color:${(r.violations||0) > 0 ? '#e74c3c' : '#2ecc71'}">${r.violations || 0}</strong></div>
    </div>
    <div class="rd-answers-list">${answersHtml}</div>
  `;

  document.getElementById("resultDetailOverlay").style.display = "flex";
}


// ══════════════════════════════════════════════════════════════════════════
//  CREATE EXAM TAB
// ══════════════════════════════════════════════════════════════════════════
// In-memory list of questions being built for the new exam
let _examDraftQuestions = [];
let _examDraftCounter  = 0;   // monotonic counter for unique question IDs

function initCreateExam() {
  // ── "Add Question" button ────────────────────────────────────────────
  document.getElementById("addExamQuestionBtn").addEventListener("click", () => {
    addDraftQuestion();
  });

  // ── "Save Exam" button ───────────────────────────────────────────────
  document.getElementById("saveExamBtn").addEventListener("click", saveExamToFirestore);

  // ── "Clear Form" button ──────────────────────────────────────────────
  document.getElementById("clearExamFormBtn").addEventListener("click", clearExamForm);

  // ── "Refresh" saved exams ────────────────────────────────────────────
  document.getElementById("refreshExamsBtn").addEventListener("click", () => {
    loadSavedExams();
  });

  // ── Also reload saved exams when the tab is opened ───────────────────
  document.getElementById("navCreateExam").addEventListener("click", () => {
    loadSavedExams();
  });

  // Initial load
  loadSavedExams();
}

// ── Draft question management ─────────────────────────────────────────────
function addDraftQuestion(prefill = null) {
  const qid  = ++_examDraftCounter;
  const type = prefill?.type ?? "mcq";   // default to MCQ

  const entry = { qid, type, text: prefill?.text ?? "", options: prefill?.options ?? ["", "", "", ""], correctIndex: prefill?.correctIndex ?? 0, correct: prefill?.correct ?? true };
  _examDraftQuestions.push(entry);
  renderDraftQuestions();
  // Scroll new card into view
  setTimeout(() => {
    const card = document.querySelector(`[data-qid="${qid}"]`);
    if (card) card.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, 50);
}

function removeDraftQuestion(qid) {
  _examDraftQuestions = _examDraftQuestions.filter(q => q.qid !== qid);
  renderDraftQuestions();
}

function renderDraftQuestions() {
  const container = document.getElementById("examQuestionsList");
  const empty     = document.getElementById("examQsEmpty");

  if (_examDraftQuestions.length === 0) {
    empty.style.display = "block";
    // Remove all cards except the empty placeholder
    container.querySelectorAll(".exam-q-card").forEach(c => c.remove());
    return;
  }

  empty.style.display = "none";

  // Remove cards for deleted questions, keep existing ones (avoid full re-render so inputs stay focused)
  const existingQids = new Set([..._examDraftQuestions.map(q => q.qid)]);
  container.querySelectorAll(".exam-q-card").forEach(card => {
    const qid = parseInt(card.dataset.qid, 10);
    if (!existingQids.has(qid)) card.remove();
  });

  _examDraftQuestions.forEach((entry, idx) => {
    const existing = container.querySelector(`[data-qid="${entry.qid}"]`);
    if (existing) {
      // Just update the question number badge if it exists
      const numEl = existing.querySelector(".eq-num");
      if (numEl) numEl.textContent = `Q${idx + 1}`;
      return;
    }

    // Build a new card
    const card = document.createElement("div");
    card.className   = "exam-q-card";
    card.dataset.qid = entry.qid;

    const isMcq = entry.type === "mcq";

    card.innerHTML = `
      <div class="eq-header">
        <span class="eq-num">Q${idx + 1}</span>
        <select class="admin-select eq-type-select" data-qid="${entry.qid}">
          <option value="mcq" ${!isMcq ? "" : "selected"}>MCQ (4 options)</option>
          <option value="tf"  ${isMcq ? "" : "selected"}>True / False</option>
        </select>
        <button class="tbl-btn del-btn eq-remove-btn" data-qid="${entry.qid}" title="Remove question">🗑️</button>
      </div>

      <div class="admin-field" style="margin-top:.75rem">
        <textarea class="admin-textarea eq-text" rows="2" placeholder="Enter question text…" data-qid="${entry.qid}">${escHtml(entry.text)}</textarea>
      </div>

      ${isMcq ? buildMcqBlock(entry) : buildTfBlock(entry)}
    `;

    container.appendChild(card);

    // ── Listeners ────────────────────────────────────────────────────
    card.querySelector(".eq-remove-btn").addEventListener("click", () => removeDraftQuestion(entry.qid));

    card.querySelector(".eq-type-select").addEventListener("change", function () {
      const newType = this.value;
      const q = _examDraftQuestions.find(q => q.qid === entry.qid);
      if (q) {
        q.type = newType;
        // Flush text before re-rendering
        const ta = card.querySelector(".eq-text");
        if (ta) q.text = ta.value;
        // Replace answer block only
        const answerBlock = card.querySelector(".eq-answer-block");
        if (answerBlock) {
          answerBlock.outerHTML = newType === "mcq" ? buildMcqBlock(q) : buildTfBlock(q);
        }
        attachAnswerListeners(card, q);
      }
    });

    attachAnswerListeners(card, entry);
  });
}

function buildMcqBlock(entry) {
  const opts = entry.options.length === 4 ? entry.options : ["", "", "", ""];
  return `
    <div class="eq-answer-block mcq-options-list" style="margin-top:.75rem">
      ${opts.map((opt, i) => `
        <div class="mcq-option-row">
          <span class="mcq-label">${String.fromCharCode(65 + i)}</span>
          <input type="text" class="admin-input mcq-opt-input eq-opt" data-idx="${i}" data-qid="${entry.qid}" value="${escHtml(opt)}" placeholder="Option ${String.fromCharCode(65 + i)}" />
          <label class="admin-radio correct-radio">
            <input type="radio" name="eq-correct-${entry.qid}" value="${i}" ${i === entry.correctIndex ? "checked" : ""} /> Correct
          </label>
        </div>`).join("")}
    </div>`;
}

function buildTfBlock(entry) {
  return `
    <div class="eq-answer-block admin-radio-row" style="margin-top:.75rem">
      <label class="admin-radio">
        <input type="radio" name="eq-tf-${entry.qid}" value="true"  ${entry.correct !== false ? "checked" : ""} /> True
      </label>
      <label class="admin-radio">
        <input type="radio" name="eq-tf-${entry.qid}" value="false" ${entry.correct === false ? "checked" : ""} /> False
      </label>
    </div>`;
}

function attachAnswerListeners(card, entry) {
  // MCQ option text inputs
  card.querySelectorAll(".eq-opt").forEach(input => {
    input.addEventListener("input", () => {
      const q = _examDraftQuestions.find(q => q.qid === entry.qid);
      if (!q) return;
      const idx = parseInt(input.dataset.idx, 10);
      if (!q.options) q.options = ["", "", "", ""];
      q.options[idx] = input.value;
    });
  });

  // MCQ correct radio
  card.querySelectorAll(`input[name="eq-correct-${entry.qid}"]`).forEach(radio => {
    radio.addEventListener("change", () => {
      const q = _examDraftQuestions.find(q => q.qid === entry.qid);
      if (q) q.correctIndex = parseInt(radio.value, 10);
    });
  });

  // T/F radios
  card.querySelectorAll(`input[name="eq-tf-${entry.qid}"]`).forEach(radio => {
    radio.addEventListener("change", () => {
      const q = _examDraftQuestions.find(q => q.qid === entry.qid);
      if (q) q.correct = radio.value === "true";
    });
  });

  // Question text textarea
  const ta = card.querySelector(".eq-text");
  if (ta) {
    ta.addEventListener("input", () => {
      const q = _examDraftQuestions.find(q => q.qid === entry.qid);
      if (q) q.text = ta.value;
    });
  }
}

// ── Flush all draft question text fields before saving ─────────────────────
function flushDraftTextFields() {
  _examDraftQuestions.forEach(entry => {
    const card = document.querySelector(`[data-qid="${entry.qid}"]`);
    if (!card) return;
    const ta = card.querySelector(".eq-text");
    if (ta) entry.text = ta.value;
    if (entry.type === "mcq") {
      card.querySelectorAll(".eq-opt").forEach(input => {
        const idx = parseInt(input.dataset.idx, 10);
        if (!entry.options) entry.options = ["", "", "", ""];
        entry.options[idx] = input.value;
      });
    }
  });
}

// ── Save exam to Firestore ─────────────────────────────────────────────────
async function saveExamToFirestore() {
  const feedback   = document.getElementById("createExamFeedback");
  const titleEl    = document.getElementById("examTitle");
  const subjectEl  = document.getElementById("examSubject");
  const durationEl = document.getElementById("examDurationMin");
  const titleErr   = document.getElementById("examTitleErr");
  const subjectErr = document.getElementById("examSubjectErr");
  const durationErr= document.getElementById("examDurationErr");

  // Reset errors
  titleErr.textContent = subjectErr.textContent = durationErr.textContent = "";
  feedback.textContent = "";
  feedback.className   = "setting-feedback";

  // Flush live textarea values into _examDraftQuestions
  flushDraftTextFields();

  // ── Validate metadata ────────────────────────────────────────────────
  let valid = true;
  const title    = titleEl.value.trim();
  const subject  = subjectEl.value.trim();
  const duration = parseInt(durationEl.value, 10);

  if (!title)                                  { titleErr.textContent    = "Title is required.";                  valid = false; }
  if (!subject)                                { subjectErr.textContent  = "Subject / Category is required.";    valid = false; }
  if (isNaN(duration) || duration < 1 || duration > 360) { durationErr.textContent = "Duration must be 1–360 minutes."; valid = false; }

  // ── Validate questions ────────────────────────────────────────────────
  if (_examDraftQuestions.length === 0) {
    feedback.textContent = "⚠️ Add at least one question before saving.";
    feedback.className   = "setting-feedback error";
    return;
  }

  for (let i = 0; i < _examDraftQuestions.length; i++) {
    const q = _examDraftQuestions[i];
    if (!q.text.trim()) {
      feedback.textContent = `⚠️ Q${i + 1} has no question text.`;
      feedback.className   = "setting-feedback error";
      valid = false;
      break;
    }
    if (q.type === "mcq") {
      const opts = q.options || [];
      if (opts.length !== 4 || opts.some(o => !o.trim())) {
        feedback.textContent = `⚠️ Q${i + 1}: all 4 MCQ options must be filled.`;
        feedback.className   = "setting-feedback error";
        valid = false;
        break;
      }
    }
  }

  if (!valid) return;

  // ── Build Firestore payload ───────────────────────────────────────────
  const saveBtn = document.getElementById("saveExamBtn");
  saveBtn.disabled    = true;
  saveBtn.textContent = "Saving…";

  const questionsPayload = _examDraftQuestions.map((q, i) => {
    const base = { id: i + 1, type: q.type, text: q.text.trim() };
    if (q.type === "tf") {
      return { ...base, correct: q.correct };
    } else {
      return { ...base, options: q.options.map(o => o.trim()), correctIndex: q.correctIndex };
    }
  });

  const payload = {
    title,
    subject,
    durationSeconds: duration * 60,
    questions: questionsPayload,
    createdAt: Date.now(),
  };

  try {
    await addDoc(collection(db, "exams"), payload);
    feedback.textContent = `✅ Exam "${title}" saved successfully with ${questionsPayload.length} question(s).`;
    feedback.className   = "setting-feedback success";
    showToast(`Exam "${title}" saved! ✅`);
    clearExamForm();
    loadSavedExams();
  } catch (err) {
    console.error("[admin] saveExam error:", err);
    feedback.textContent = `❌ Failed to save exam: ${err.message}`;
    feedback.className   = "setting-feedback error";
  } finally {
    saveBtn.disabled    = false;
    saveBtn.textContent = "💾 Save Exam to Firestore";
  }
}

// ── Clear exam draft form ─────────────────────────────────────────────────
function clearExamForm() {
  document.getElementById("examTitle").value       = "";
  document.getElementById("examSubject").value     = "";
  document.getElementById("examDurationMin").value = "45";
  document.getElementById("examTitleErr").textContent    = "";
  document.getElementById("examSubjectErr").textContent  = "";
  document.getElementById("examDurationErr").textContent = "";
  _examDraftQuestions = [];
  _examDraftCounter   = 0;
  document.getElementById("examQuestionsList").querySelectorAll(".exam-q-card").forEach(c => c.remove());
  document.getElementById("examQsEmpty").style.display = "block";
  const fb = document.getElementById("createExamFeedback");
  fb.textContent = "";
  fb.className   = "setting-feedback";
}

// ── Load & render saved exams from Firestore ──────────────────────────────
async function loadSavedExams() {
  const container = document.getElementById("adminExamsList");
  container.innerHTML = `<p class="admin-loading">Loading saved exams…</p>`;
  try {
    const snap = await getDocs(collection(db, "exams"));
    if (snap.empty) {
      container.innerHTML = `<p class="admin-loading">No exams saved yet.</p>`;
      return;
    }
    const exams = snap.docs.map(d => ({ _docId: d.id, ...d.data() }));
    // Sort newest first
    exams.sort((a, b) => b.createdAt - a.createdAt);

    container.innerHTML = exams.map(exam => {
      const date = new Date(exam.createdAt).toLocaleString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit"
      });
      const duration = Math.round((exam.durationSeconds || 0) / 60);
      return `
        <div class="saved-exam-card" data-doc-id="${escHtml(exam._docId)}">
          <div class="saved-exam-info">
            <span class="saved-exam-title">${escHtml(exam.title)}</span>
            <span class="saved-exam-meta">
              📂 ${escHtml(exam.subject)} &nbsp;·&nbsp;
              ❓ ${(exam.questions || []).length} questions &nbsp;·&nbsp;
              ⏱️ ${duration} min &nbsp;·&nbsp;
              📅 ${date}
            </span>
          </div>
          <div class="saved-exam-actions">
            <button class="tbl-btn del-btn saved-exam-delete-btn" data-doc-id="${escHtml(exam._docId)}" title="Delete exam">🗑️ Delete</button>
          </div>
        </div>`;
    }).join("");

    // Attach delete listeners
    container.querySelectorAll(".saved-exam-delete-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const docId = btn.dataset.docId;
        if (!confirm("Delete this exam? This cannot be undone.")) return;
        try {
          await deleteDoc(doc(db, "exams", docId));
          showToast("Exam deleted 🗑️");
          loadSavedExams();
        } catch (err) {
          console.error("[admin] deleteExam error:", err);
          showToast("Failed to delete exam ❌", "error");
        }
      });
    });
  } catch (err) {
    console.error("[admin] loadSavedExams error:", err);
    container.innerHTML = `<p class="admin-loading" style="color:var(--red)">Failed to load exams: ${escHtml(err.message)}</p>`;
  }
}

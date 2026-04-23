/* ══════════════════════════════════════════════════════
   hrdashboard.js  —  HR Dashboard Logic
   <script type="module" src="hrdashboard.js"> in hrdashboard.html
   ══════════════════════════════════════════════════════ */

import {
  auth,
  db,
  onAuthStateChanged,
  listenAllApplications,
  hrUpdateApplication,
  computeHRStats,
  formatDate,
  toDatetimeLocal,
  statusClass,
  logout as _logout
} from "./applications-backend.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* ══════════════════════════════════════════════════════
   AUTH GUARD
   ══════════════════════════════════════════════════════ */
onAuthStateChanged(auth, user => {
  if (!user) { window.location.href = "login.html"; return; }
  initHR(user);
});

/* ══════════════════════════════════════════════════════
   TOAST
   ══════════════════════════════════════════════════════ */
function showToast(msg, type = "info") {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.className = `toast ${type} show`;
  clearTimeout(t._tmr);
  t._tmr = setTimeout(() => t.classList.remove("show"), 3500);
}

/* ══════════════════════════════════════════════════════
   STATE
   ══════════════════════════════════════════════════════ */
let allApps = [];
let activeFilter = "all";

/* ══════════════════════════════════════════════════════
   AVATAR — reads from Firestore hr_managers/{uid}
   Falls back to email initials
   ══════════════════════════════════════════════════════ */
async function setHRAvatar(user) {
  let initials = "";

  try {
    const snap = await getDoc(doc(db, "hr_managers", user.uid));
    if (snap.exists()) {
      const p = snap.data();
      const firstName = (p.firstName || "").trim();
      const lastName = (p.lastName || "").trim();
      if (firstName && lastName) {
        initials = (firstName[0] + lastName[0]).toUpperCase();   // "ST"
      } else if (firstName) {
        initials = firstName.slice(0, 2).toUpperCase();
      }
    }
  } catch (e) {
    console.warn("HR avatar fetch error:", e.message);
  }

  if (!initials) initials = (user.email || "HR").slice(0, 2).toUpperCase();

  /* Apply to both desktop and mobile avatar elements */
  ["hr-initials", "hr-initials-mob"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = initials;
  });
}

/* ══════════════════════════════════════════════════════
   INIT
   ══════════════════════════════════════════════════════ */
function initHR(user) {
  setHRAvatar(user);

  /* Real-time listener — fires whenever any application changes */
  listenAllApplications(apps => {
    allApps = apps;
    renderStats(apps);
    renderOverview(apps);
    renderCandidates();
    renderFiltered("hr-sel-list", "hr-sel-empty", apps.filter(a => a.status === "Selected"));
    renderFiltered("hr-rej-list", "hr-rej-empty", apps.filter(a => a.status === "Rejected"));
  });
}

/* ══════════════════════════════════════════════════════
   TAB SWITCHER
   ══════════════════════════════════════════════════════ */
function hrTab(tab, btnEl) {
  /* Hide all tab panels */
  document.querySelectorAll(".inner").forEach(el => el.classList.remove("active"));
  const target = document.getElementById(`hr-tab-${tab}`);
  if (target) target.classList.add("active");

  /* Update desktop nav buttons */
  document.querySelectorAll(".navbtn").forEach(b => b.classList.remove("on-green"));
  if (btnEl) btnEl.classList.add("on-green");

  /* Keep desktop button highlighted even when switching from mobile */
  const deskBtn = document.getElementById(`tab-btn-${tab}`);
  if (deskBtn) deskBtn.classList.add("on-green");

  /* Update mobile nav buttons */
  document.querySelectorAll(".mob-navbtn").forEach(b => b.classList.remove("on-green"));
  const mobBtn = document.getElementById(`mob-tab-${tab}`);
  if (mobBtn) mobBtn.classList.add("on-green");
}

/* ══════════════════════════════════════════════════════
   FILTER (All Candidates tab)
   ══════════════════════════════════════════════════════ */
function setFilter(f, btnEl) {
  activeFilter = f;
  document.querySelectorAll(".filt").forEach(b => b.classList.remove("active"));
  if (btnEl) btnEl.classList.add("active");
  renderCandidates();
}

/* ══════════════════════════════════════════════════════
   STATS
   ══════════════════════════════════════════════════════ */
function renderStats(apps) {
  const s = computeHRStats(apps);
  [["hr-stat-total", s.total],
  ["hr-stat-pending", s.pending],
  ["hr-stat-selected", s.selected],
  ["hr-stat-rejected", s.rejected]
  ].forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  });
}

/* ══════════════════════════════════════════════════════
   OVERVIEW (recent 5)
   ══════════════════════════════════════════════════════ */
function renderOverview(apps) {
  const list = document.getElementById("applicants-list");
  const empty = document.getElementById("hr-ov-empty");
  if (!list) return;

  const recent = apps.slice(0, 5);
  if (!recent.length) {
    if (empty) empty.style.display = "block";
    list.innerHTML = ""; return;
  }
  if (empty) empty.style.display = "none";
  list.innerHTML = recent.map(a => candidateCard(a)).join("");
}

/* ══════════════════════════════════════════════════════
   ALL CANDIDATES with filter + search
   ══════════════════════════════════════════════════════ */
function renderCandidates() {
  const search = (document.getElementById("hr-search")?.value || "").toLowerCase();
  let filtered = [...allApps];

  if (activeFilter === "applied") filtered = filtered.filter(a => a.status === "Applied");
  if (activeFilter === "interview") filtered = filtered.filter(a => a.status === "Interview Scheduled");
  if (activeFilter === "selected") filtered = filtered.filter(a => a.status === "Selected");
  if (activeFilter === "rejected") filtered = filtered.filter(a => a.status === "Rejected");

  if (search) {
    filtered = filtered.filter(a =>
      [a.applicantName, a.applicantEmail, a.company, a.jobTitle]
        .some(v => (v || "").toLowerCase().includes(search))
    );
  }

  const list = document.getElementById("hr-cand-list");
  const empty = document.getElementById("hr-cand-empty");
  if (!list) return;

  if (!filtered.length) {
    if (empty) empty.style.display = "block";
    list.innerHTML = ""; return;
  }
  if (empty) empty.style.display = "none";
  list.innerHTML = filtered.map(a => candidateCard(a)).join("");
}

/* ══════════════════════════════════════════════════════
   GENERIC FILTERED LIST (Selected / Rejected tabs)
   ══════════════════════════════════════════════════════ */
function renderFiltered(listId, emptyId, apps) {
  const list = document.getElementById(listId);
  const empty = document.getElementById(emptyId);
  if (!list) return;
  if (!apps.length) {
    if (empty) empty.style.display = "block";
    list.innerHTML = ""; return;
  }
  if (empty) empty.style.display = "none";
  list.innerHTML = apps.map(a => candidateCard(a)).join("");
}

/* ══════════════════════════════════════════════════════
   CANDIDATE CARD HTML
   Includes: name, email, job info, status, dates,
   previous HR message, resume view button, action panel
   ══════════════════════════════════════════════════════ */
function candidateCard(a) {
  /* Resume row — only shown when applicant uploaded a resume name */
  const resumeHtml = a.resumeName
    ? `<div class="cand-resume">
               <span class="resume-icon">${resumeIcon(a.resumeName)}</span>
               <div class="resume-info">
                   <div class="resume-name">${esc(a.resumeName)}</div>
                   <div class="resume-size">${a.resumeSize ? fmtSize(a.resumeSize) : ""}</div>
               </div>
               <span class="btn-view-resume" style="cursor:pointer;"
                     onclick="viewResume('${a.id}')">
                   👁 View Resume
               </span>
           </div>`
    : "";

  /* Previous HR message */
  const prevMsgHtml = a.hrMessage
    ? `<div class="cand-prev-msg">💬 Last message: <em>${esc(a.hrMessage)}</em></div>`
    : "";

  return `
    <div class="cand-card" id="card-${a.id}">

        <!-- Header: avatar + name + status badge -->
        <div class="cand-header">
            <div class="cand-left">
                <div class="cand-avatar">${esc((a.applicantName || "A")[0]).toUpperCase()}</div>
                <div>
                    <div class="cand-name">${esc(a.applicantName || "Unknown Applicant")}</div>
                    <div class="cand-email">${esc(a.applicantEmail || "")}</div>
                </div>
            </div>
            <span class="cand-badge ${statusClass(a.status)}">${esc(a.status || "Applied")}</span>
        </div>

        <!-- Job info -->
        <div class="cand-job">
            <strong>${esc(a.company || "—")}</strong> &mdash; ${esc(a.jobTitle || "")}
            <span class="cand-meta">${esc(a.jobType || "")} &nbsp;·&nbsp; ${esc(a.location || "")}</span>
        </div>

        <!-- Dates -->
        <div class="cand-dates">
            📅 Applied: ${formatDate(a.appliedDate)}
            ${a.deadline ? ` &nbsp;·&nbsp; ⏰ Deadline: ${formatDate(a.deadline)}` : ""}
            ${a.interviewDate ? ` &nbsp;·&nbsp; 🎯 Interview: <strong>${formatDate(a.interviewDate)}</strong>` : ""}
        </div>

        <!-- Extra info from application.html form -->
        ${a.notes ? `<div style="font-size:13px;color:#6b7280;margin-bottom:6px;">📝 Notes: ${esc(a.notes)}</div>` : ""}
        ${a.contactPerson ? `<div style="font-size:13px;color:#6b7280;margin-bottom:6px;">👤 Contact: ${esc(a.contactPerson)} ${a.contactEmail ? "· " + esc(a.contactEmail) : ""}</div>` : ""}
        ${a.jobUrl ? `<div style="font-size:13px;margin-bottom:6px;"><a href="${esc(a.jobUrl)}" target="_blank" style="color:#3b82f6;">🔗 Job Posting</a></div>` : ""}

        <!-- Resume -->
        ${resumeHtml}

        <!-- Previous HR message -->
        ${prevMsgHtml}

        <!-- HR Action Panel -->
        <div class="cand-action">

            <div class="cand-action-row">
                <label>Update Status</label>
                <select id="st-${a.id}" class="cand-select">
                    <option value="Applied"             ${a.status === "Applied" ? "selected" : ""}>Applied</option>
                    <option value="Interview Scheduled" ${a.status === "Interview Scheduled" ? "selected" : ""}>Interview Scheduled</option>
                    <option value="Selected"            ${a.status === "Selected" ? "selected" : ""}>Selected</option>
                    <option value="Rejected"            ${a.status === "Rejected" ? "selected" : ""}>Rejected</option>
                </select>
            </div>

            <div class="cand-action-row">
                <label>Interview Date &amp; Time <span style="font-weight:400;color:#9ca3af;">(optional)</span></label>
                <input type="datetime-local" id="id-${a.id}" class="cand-input"
                       value="${toDatetimeLocal(a.interviewDate)}" />
            </div>

            <div class="cand-action-row">
                <label>Message to Applicant</label>
                <textarea id="mg-${a.id}" class="cand-textarea"
                          placeholder="e.g. Congratulations! Please join us on…">${esc(a.hrMessage || "")}</textarea>
            </div>

            <button class="cand-save-btn" onclick="hrSave('${a.id}')">
                ✅ Save &amp; Notify Applicant
            </button>
        </div>
    </div>`;
}

/* ══════════════════════════════════════════════════════
   HR SAVE — writes status + message + interview to Firestore
   Applicant sees this instantly via their real-time listener
   ══════════════════════════════════════════════════════ */
async function hrSave(appId) {
  const status = document.getElementById(`st-${appId}`)?.value;
  const hrMessage = document.getElementById(`mg-${appId}`)?.value.trim() || "";
  const interviewDate = document.getElementById(`id-${appId}`)?.value || null;

  if (!status) { showToast("⚠️ Please select a status.", "error"); return; }

  try {
    showToast("⏳ Saving...", "info");
    await hrUpdateApplication(appId, { status, hrMessage, interviewDate });
    showToast("✅ Saved! Applicant can see this update instantly.", "success");
  } catch (e) {
    showToast(`❌ ${e.message}`, "error");
  }
}

/* ══════════════════════════════════════════════════════
   VIEW RESUME
   Firestore can't store large base64 files, so resume
   is stored in application.html only as name/size metadata.
   This shows a modal with the metadata and a note.
   If you add Firebase Storage later, the URL goes here.
   ══════════════════════════════════════════════════════ */
function viewResume(appId) {
  const app = allApps.find(a => a.id === appId);
  if (!app || !app.resumeName) {
    showToast("No resume uploaded for this applicant.", "info");
    return;
  }

  /* Remove old modal if any */
  const old = document.getElementById("resume-modal");
  if (old) old.remove();

  const modal = document.createElement("div");
  modal.id = "resume-modal";
  modal.style.cssText = `
        position:fixed;inset:0;z-index:3000;
        background:rgba(0,0,0,0.5);
        display:flex;align-items:center;justify-content:center;
        padding:20px;`;

  modal.innerHTML = `
        <div style="background:#fff;border-radius:16px;padding:32px;
                    width:440px;max-width:95vw;box-shadow:0 20px 60px rgba(0,0,0,0.2);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
                <h3 style="margin:0;font-size:17px;font-weight:700;color:#0f172a;">📄 Resume Details</h3>
                <button onclick="document.getElementById('resume-modal').remove()"
                    style="background:none;border:none;font-size:20px;cursor:pointer;color:#9ca3af;">✕</button>
            </div>

            <div style="background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:10px;padding:16px;margin-bottom:16px;">
                <div style="display:flex;align-items:center;gap:12px;">
                    <span style="font-size:2rem;">${resumeIcon(app.resumeName)}</span>
                    <div>
                        <div style="font-weight:700;font-size:14px;color:#1e293b;">${esc(app.resumeName)}</div>
                        <div style="font-size:12px;color:#94a3b8;margin-top:3px;">
                            ${app.resumeSize ? fmtSize(app.resumeSize) : "Size unknown"}
                            ${app.resumeType ? " · " + app.resumeType : ""}
                        </div>
                    </div>
                </div>
            </div>

            <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;
                        padding:12px 14px;font-size:13px;color:#92400e;margin-bottom:20px;">
                ℹ️ The applicant uploaded this resume from their device.
                To receive downloadable resumes, ask applicants to email them directly or
                share via a link in their application notes.
            </div>

            <div style="font-size:13px;color:#374151;margin-bottom:16px;">
                <strong>Applicant:</strong> ${esc(app.applicantName || "")} <br/>
                <strong>Email:</strong>
                <a href="mailto:${esc(app.applicantEmail || "")}"
                   style="color:#3b82f6;">${esc(app.applicantEmail || "")}</a>
            </div>

            <div style="display:flex;gap:10px;">
                <a href="mailto:${esc(app.applicantEmail || "")}?subject=Resume Request — ${esc(app.jobTitle || "")}"
                   style="flex:1;padding:10px;background:#3b82f6;color:#fff;border:none;
                          border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;
                          text-align:center;text-decoration:none;display:block;">
                   ✉️ Request Resume by Email
                </a>
                <button onclick="document.getElementById('resume-modal').remove()"
                    style="padding:10px 20px;border:1.5px solid #d1d5db;border-radius:8px;
                           background:#fff;font-size:13px;cursor:pointer;font-family:inherit;">
                    Close
                </button>
            </div>
        </div>`;

  /* Close on backdrop click */
  modal.addEventListener("click", e => {
    if (e.target === modal) modal.remove();
  });

  document.body.appendChild(modal);
}

/* ══════════════════════════════════════════════════════
   SEARCH INPUT LIVE HANDLER
   ══════════════════════════════════════════════════════ */
function renderHRCandidates() { renderCandidates(); }

/* ══════════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════════ */
function resumeIcon(name) {
  const ext = (name || "").split(".").pop().toLowerCase();
  if (ext === "pdf") return "📕";
  if (ext === "doc" || ext === "docx") return "📘";
  return "📄";
}

function fmtSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

function esc(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* ══════════════════════════════════════════════════════
   LOGOUT
   ══════════════════════════════════════════════════════ */
function logout() { _logout(); }

/* ══════════════════════════════════════════════════════
   EXPOSE TO HTML onclick HANDLERS
   ══════════════════════════════════════════════════════ */
window.hrTab = hrTab;
window.setFilter = setFilter;
window.renderHRCandidates = renderHRCandidates;
window.hrSave = hrSave;
window.viewResume = viewResume;
window.logout = logout;
window.closeMobileNav = function () {
  document.getElementById("hamburger")?.classList.remove("open");
  document.getElementById("mobileNav")?.classList.remove("open");
};


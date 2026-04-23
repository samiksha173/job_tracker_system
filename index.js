/* ══════════════════════════════════════════════════════
   index.js  —  Applicant Dashboard
   <script type="module" src="index.js"> in index.html
   ══════════════════════════════════════════════════════ */

import {
    auth,
    db,
    onAuthStateChanged,
    submitApplication,
    deleteApplication,
    listenApplicantApplications,
    computeApplicantStats,
    formatDate,
    logout as _logout
} from "./applications-backend.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* ══════════════════════════════════════════════════════
   AUTH GUARD — redirect to login if not signed in
   ══════════════════════════════════════════════════════ */
onAuthStateChanged(auth, user => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }
    startDashboard(user);
});

/* ══════════════════════════════════════════════════════
   TOAST
   ══════════════════════════════════════════════════════ */
function showToast(msg, type = "info") {
    const t = document.getElementById("toast");
    if (!t) return;
    const bg = { success: "#16a34a", error: "#dc2626", info: "#2563eb" };
    t.textContent = msg;
    t.style.background = bg[type] || bg.info;
    t.style.opacity = "1";
    t.style.display = "block";
    clearTimeout(t._tmr);
    t._tmr = setTimeout(() => { t.style.opacity = "0"; t.style.display = "none"; }, 4000);
}

/* ══════════════════════════════════════════════════════
   SEEN TRACKER  — prevents duplicate toasts each visit
   ══════════════════════════════════════════════════════ */
const seen = new Set(JSON.parse(sessionStorage.getItem("_hr_seen") || "[]"));
function saveSeen() { sessionStorage.setItem("_hr_seen", JSON.stringify([...seen])); }

/* ══════════════════════════════════════════════════════
   SET AVATAR FROM FIRESTORE
   Reads firstName + lastName from "applicants" collection
   (saved during signup). Makes initials e.g. "ST" for
   Samiksha Tarte. Falls back to email if not found.
   ══════════════════════════════════════════════════════ */
async function setAvatar(user) {
    let initials = "";

    try {
        const snap = await getDoc(doc(db, "applicants", user.uid));
        if (snap.exists()) {
            const p = snap.data();
            const firstName = (p.firstName || "").trim();
            const lastName = (p.lastName || "").trim();

            if (firstName && lastName) {
                initials = (firstName[0] + lastName[0]).toUpperCase();   // "ST"
            } else if (firstName) {
                initials = firstName.slice(0, 2).toUpperCase();           // "SA"
            }
        }
    } catch (e) {
        console.warn("Avatar fetch error:", e.message);
    }

    /* Fallback to email first 2 chars */
    if (!initials) {
        initials = (user.email || "U").slice(0, 2).toUpperCase();
    }

    /* Apply to both desktop and mobile nav avatar */
    ["app-avatar", "app-avatar-mob"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = initials;
    });
}

/* ══════════════════════════════════════════════════════
   START DASHBOARD
   ══════════════════════════════════════════════════════ */
function startDashboard(user) {

    /* Set avatar from Firestore profile */
    setAvatar(user);

    /*
       Real-time listener — fires EVERY TIME Firestore data changes.
       This includes when HR updates status/message — applicant sees
       the change instantly without refreshing.
    */
    listenApplicantApplications(apps => {
        updateStatCards(apps);
        renderRecentList(apps);
        renderHRUpdates(apps);
    });
}

/* ══════════════════════════════════════════════════════
   STAT CARDS — maps to exact IDs in your index.html
   ══════════════════════════════════════════════════════ */
function updateStatCards(apps) {
    const s = computeApplicantStats(apps);
    const map = {
        totalCount: s.total,
        appliedCount: s.applied,
        interviewCount: s.interview,
        offerCount: s.selected,      /* "Selected" card */
        rejectedCount: s.rejected,
        deadlineCount: s.deadlines,
        upcomingInterviewCount: s.interviews
    };
    Object.entries(map).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    });
}

/* ══════════════════════════════════════════════════════
   RECENT APPLICATIONS — shown in recentBox
   Shows ALL apps (newest first, max 5).
   Status badge is ALWAYS shown and reflects latest HR decision.
   ══════════════════════════════════════════════════════ */
function renderRecentList(apps) {
    const box = document.getElementById("recentBox");
    if (!box) return;

    if (!apps.length) {
        box.innerHTML = `<p style="color:#9ca3af;text-align:center;padding:20px;">
            No applications yet. Click "+ New Application" to add one.
        </p>`;
        return;
    }

    box.innerHTML = apps.slice(0, 5).map(a => {
        const color = statusColor(a.status);
        const statusLabel = a.status || "Applied";

        /* HR message box — shown only when HR has written something */
        const hrMsgHtml = a.hrMessage
            ? `<div style="margin-top:8px;padding:8px 12px;border-radius:6px;
                           background:#eff6ff;border-left:3px solid #3b82f6;font-size:13px;color:#1e40af;">
                 💬 <strong>HR Message:</strong> ${esc(a.hrMessage)}
               </div>`
            : "";

        /* Interview date — shown when scheduled */
        const interviewHtml = a.interviewDate
            ? `<div style="margin-top:6px;font-size:13px;color:#059669;font-weight:500;">
                 📅 Interview: ${formatDate(a.interviewDate)}
               </div>`
            : "";

        return `
        <div style="
            display:flex;justify-content:space-between;align-items:flex-start;
            padding:16px 18px;margin-bottom:12px;background:#fff;
            border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,.08);
            border-left:4px solid ${color};
        ">
          <!-- LEFT: info -->
          <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;">
              <strong style="font-size:15px;color:#111;">${esc(a.company || "—")}</strong>
              <span style="font-size:13px;color:#666;">${esc(a.jobTitle || "")}</span>
            </div>
            <div style="font-size:12px;color:#9ca3af;margin-top:4px;">
              ${formatDate(a.appliedDate)}
              ${a.jobType ? " &nbsp;·&nbsp; " + esc(a.jobType) : ""}
              ${a.location ? " &nbsp;·&nbsp; " + esc(a.location) : ""}
            </div>
            ${hrMsgHtml}
            ${interviewHtml}
          </div>

          <!-- RIGHT: status badge + delete -->
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;margin-left:14px;flex-shrink:0;">
            <span style="
                padding:5px 14px;border-radius:20px;font-size:12px;font-weight:700;
                background:${color}20;color:${color};white-space:nowrap;
                border:1px solid ${color}40;
            ">${esc(statusLabel)}</span>
            <button onclick="doDelete('${a.id}')" style="
                font-size:11px;padding:3px 9px;border:1px solid #fca5a5;
                color:#dc2626;background:#fff5f5;border-radius:6px;cursor:pointer;">
              🗑 Delete
            </button>
          </div>
        </div>`;
    }).join("");
}

/* ══════════════════════════════════════════════════════
   HR UPDATES PANEL
   Shows a notification banner above cards for every
   application that HR has acted on.
   Also fires toast when status changes.
   ══════════════════════════════════════════════════════ */
function renderHRUpdates(apps) {
    /* Find or create the banner container */
    let panel = document.getElementById("hr-banners");
    if (!panel) {
        panel = document.createElement("div");
        panel.id = "hr-banners";
        panel.style.marginBottom = "16px";
        /* Insert right after the subtitle paragraph */
        const subtitle = document.querySelector(".subtitle");
        if (subtitle) subtitle.insertAdjacentElement("afterend", panel);
        else {
            const container = document.querySelector(".container");
            if (container) container.prepend(panel);
        }
    }

    /* Only show apps where HR has done something */
    const acted = apps.filter(a => a.status !== "Applied" || a.hrMessage);

    if (!acted.length) { panel.innerHTML = ""; return; }

    const cfg = {
        "Selected": { icon: "🎉", bg: "#f0fdf4", border: "#16a34a", text: "#166534" },
        "Rejected": { icon: "❌", bg: "#fef2f2", border: "#dc2626", text: "#991b1b" },
        "Interview Scheduled": { icon: "📅", bg: "#eff6ff", border: "#2563eb", text: "#1e40af" }
    };

    panel.innerHTML = acted.map(a => {
        const c = cfg[a.status] || { icon: "💬", bg: "#f8fafc", border: "#94a3b8", text: "#374151" };
        return `
        <div style="
            background:${c.bg};border-left:4px solid ${c.border};
            border-radius:8px;padding:12px 16px;margin-bottom:10px;
        ">
          <div style="font-size:14px;font-weight:700;color:${c.text};">
            ${c.icon} ${esc(a.company)} — ${esc(a.jobTitle)}
            <span style="font-weight:500;"> · ${esc(a.status)}</span>
          </div>
          ${a.hrMessage
                ? `<div style="font-size:13px;color:#374151;margin-top:5px;">
                 ${esc(a.hrMessage)}
               </div>` : ""}
          ${a.interviewDate
                ? `<div style="font-size:13px;color:#1e40af;margin-top:4px;font-weight:500;">
                 🗓 Interview: ${formatDate(a.interviewDate)}
               </div>` : ""}
        </div>`;
    }).join("");

    /* Toast notification for NEW status changes */
    acted.forEach(a => {
        const key = `${a.id}::${a.status}::${a.hrMessage || ""}`;
        if (!seen.has(key)) {
            seen.add(key);
            saveSeen();
            if (a.status === "Selected")
                showToast(`🎉 You were Selected at ${a.company}! ${a.hrMessage}`, "success");
            else if (a.status === "Rejected")
                showToast(`❌ ${a.company}: ${a.hrMessage || "Not selected this time."}`, "error");
            else if (a.status === "Interview Scheduled")
                showToast(`📅 Interview scheduled at ${a.company}! ${a.hrMessage}`, "info");
            else if (a.hrMessage)
                showToast(`💬 HR (${a.company}): ${a.hrMessage}`, "info");
        }
    });
}

/* ══════════════════════════════════════════════════════
   STATUS COLOR
   ══════════════════════════════════════════════════════ */
function statusColor(status) {
    return {
        "Applied": "#3498db",
        "Interview Scheduled": "#f39c12",
        "Selected": "#2ecc71",
        "Rejected": "#e74c3c"
    }[status] || "#3498db";
}

/* ══════════════════════════════════════════════════════
   NEW APPLICATION MODAL
   Opens when "+ New Application" is clicked
   ══════════════════════════════════════════════════════ */
function openModal() {
    let m = document.getElementById("new-app-modal");
    if (!m) {
        m = document.createElement("div");
        m.id = "new-app-modal";
        m.style.cssText = "display:none;position:fixed;inset:0;z-index:2000;";
        m.innerHTML = `
        <div style="position:absolute;inset:0;background:rgba(0,0,0,.5);"
             onclick="closeModal()"></div>
        <div style="
            position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
            background:#fff;border-radius:16px;padding:32px;
            width:480px;max-width:95vw;max-height:90vh;overflow-y:auto;
        ">
          <h2 style="margin:0 0 20px;font-size:20px;color:#111;">➕ New Application</h2>

          <div style="margin-bottom:14px;">
            <label style="display:block;font-size:13px;font-weight:600;color:#374151;margin-bottom:5px;">
              Company Name *
            </label>
            <input id="napp-company" type="text" placeholder="e.g. Google"
              style="width:100%;padding:10px 12px;border:1.5px solid #d1d5db;
                     border-radius:8px;font-size:14px;box-sizing:border-box;outline:none;" />
          </div>

          <div style="margin-bottom:14px;">
            <label style="display:block;font-size:13px;font-weight:600;color:#374151;margin-bottom:5px;">
              Job Title *
            </label>
            <input id="napp-title" type="text" placeholder="e.g. Software Engineer"
              style="width:100%;padding:10px 12px;border:1.5px solid #d1d5db;
                     border-radius:8px;font-size:14px;box-sizing:border-box;outline:none;" />
          </div>

          <div style="margin-bottom:14px;">
            <label style="display:block;font-size:13px;font-weight:600;color:#374151;margin-bottom:5px;">
              Job Type
            </label>
            <select id="napp-type"
              style="width:100%;padding:10px 12px;border:1.5px solid #d1d5db;
                     border-radius:8px;font-size:14px;box-sizing:border-box;background:#fff;">
              <option value="Full-Time">Full-Time</option>
              <option value="Part-Time">Part-Time</option>
              <option value="Internship">Internship</option>
              <option value="Remote">Remote</option>
            </select>
          </div>

          <div style="margin-bottom:14px;">
            <label style="display:block;font-size:13px;font-weight:600;color:#374151;margin-bottom:5px;">
              Location
            </label>
            <input id="napp-location" type="text" placeholder="e.g. Mumbai, IN"
              style="width:100%;padding:10px 12px;border:1.5px solid #d1d5db;
                     border-radius:8px;font-size:14px;box-sizing:border-box;outline:none;" />
          </div>

          <div style="margin-bottom:20px;">
            <label style="display:block;font-size:13px;font-weight:600;color:#374151;margin-bottom:5px;">
              Deadline <span style="font-weight:400;color:#9ca3af;">(optional)</span>
            </label>
            <input id="napp-deadline" type="date"
              style="width:100%;padding:10px 12px;border:1.5px solid #d1d5db;
                     border-radius:8px;font-size:14px;box-sizing:border-box;outline:none;" />
          </div>

          <div style="display:flex;gap:12px;">
            <button id="napp-submit-btn" onclick="doSubmit()"
              style="flex:1;padding:12px;background:#ec4899;color:#fff;border:none;
                     border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;">
              Submit Application
            </button>
            <button onclick="closeModal()"
              style="padding:12px 18px;border:1.5px solid #d1d5db;border-radius:8px;
                     background:#fff;font-size:14px;cursor:pointer;color:#374151;">
              Cancel
            </button>
          </div>
        </div>`;
        document.body.appendChild(m);
    }
    m.style.display = "block";
    document.getElementById("napp-company")?.focus();
}

function closeModal() {
    const m = document.getElementById("new-app-modal");
    if (m) m.style.display = "none";
    ["napp-company", "napp-title", "napp-location", "napp-deadline"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });
    const btn = document.getElementById("napp-submit-btn");
    if (btn) { btn.disabled = false; btn.textContent = "Submit Application"; }
}

async function doSubmit() {
    const company = document.getElementById("napp-company")?.value.trim();
    const jobTitle = document.getElementById("napp-title")?.value.trim();
    const jobType = document.getElementById("napp-type")?.value || "Full-Time";
    const location = document.getElementById("napp-location")?.value.trim() || "";
    const deadline = document.getElementById("napp-deadline")?.value || null;

    if (!company) { showToast("⚠️ Company name is required.", "error"); return; }
    if (!jobTitle) { showToast("⚠️ Job title is required.", "error"); return; }

    const btn = document.getElementById("napp-submit-btn");
    if (btn) { btn.disabled = true; btn.textContent = "Submitting…"; }
    showToast("⏳ Submitting your application...", "info");

    try {
        await submitApplication({ company, jobTitle, jobType, location, deadline });
        showToast("✅ Application submitted! HR will review it.", "success");
        closeModal();
    } catch (e) {
        showToast(`❌ ${e.message}`, "error");
        if (btn) { btn.disabled = false; btn.textContent = "Submit Application"; }
    }
}

/* ══════════════════════════════════════════════════════
   DELETE APPLICATION
   ══════════════════════════════════════════════════════ */
function doDelete(appId) {
    if (!confirm("Delete this application? This cannot be undone.")) return;
    deleteApplication(appId)
        .then(() => showToast("🗑 Application deleted.", "info"))
        .catch(e => showToast(`❌ ${e.message}`, "error"));
}

/* ── Escape ──────────────────────────────────────────── */
function esc(s) {
    return String(s || "")
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* ── Logout ──────────────────────────────────────────── */
function logout() { _logout(); }

/* ══════════════════════════════════════════════════════
   HAMBURGER MENU
   ══════════════════════════════════════════════════════ */
window.addEventListener("DOMContentLoaded", () => {
    const hb = document.getElementById("hamburger");
    const mn = document.getElementById("mobileNav");

    if (hb && mn) {
        hb.addEventListener("click", (e) => {
            e.stopPropagation();
            hb.classList.toggle("open");
            mn.classList.toggle("open");
        });

        document.addEventListener("click", e => {
            if (!hb.contains(e.target) && !mn.contains(e.target)) {
                hb.classList.remove("open");
                mn.classList.remove("open");
            }
        });

        /* Close drawer when any nav link inside it is clicked */
        mn.querySelectorAll("a, button").forEach(el => {
            el.addEventListener("click", () => {
                hb.classList.remove("open");
                mn.classList.remove("open");
            });
        });
    }
});

/* ══════════════════════════════════════════════════════
   EXPOSE TO HTML onclick HANDLERS
   ══════════════════════════════════════════════════════ */
window.openModal = openModal;
window.closeModal = closeModal;
window.doSubmit = doSubmit;
window.doDelete = doDelete;
window.logout = logout;
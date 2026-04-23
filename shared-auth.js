/* ══════════════════════════════════════════════════════
   shared-auth.js
   Add to ALL pages that need:
   - Auth guard (redirect if not logged in)
   - Avatar initials from Firestore
   - Firebase logout (Sign out button)

   Usage in any HTML page:
   <script type="module" src="shared-auth.js"></script>

   Make sure your Sign out button calls: onclick="logout()"
   Make sure your avatar element has:    id="app-avatar"
   Mobile avatar element (optional):     id="mob-avatar"  OR  id="app-avatar-mob"
   ══════════════════════════════════════════════════════ */

import {
    auth,
    db,
    onAuthStateChanged,
    logout as _logout
} from "./applications-backend.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* ── Auth guard + avatar ─────────────────────────────── */
onAuthStateChanged(auth, async user => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    /* Read firstName + lastName from Firestore applicants/{uid} */
    let initials = "";
    try {
        const snap = await getDoc(doc(db, "applicants", user.uid));
        if (snap.exists()) {
            const p = snap.data();
            const firstName = (p.firstName || "").trim();
            const lastName = (p.lastName || "").trim();

            if (firstName && lastName) {
                initials = (firstName[0] + lastName[0]).toUpperCase();  // "ST"
            } else if (firstName) {
                initials = firstName.slice(0, 2).toUpperCase();          // "SA"
            }
        }
    } catch (e) {
        console.warn("shared-auth: avatar fetch failed:", e.message);
    }

    /* Fallback to email */
    if (!initials) {
        initials = (user.email || "U").slice(0, 2).toUpperCase();
    }

    /* Set all avatar elements — covers different id naming across pages */
    ["app-avatar", "app-avatar-mob", "mob-avatar"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = initials;
    });

    /* Also set any element with class nav-avatar that shows "AB" */
    document.querySelectorAll(".nav-avatar").forEach(el => {
        if (el.textContent === "AB" || el.textContent.trim() === "") {
            el.textContent = initials;
        }
    });
});

/* ── Expose logout to HTML onclick handlers ──────────── */
window.logout = function () { _logout(); };
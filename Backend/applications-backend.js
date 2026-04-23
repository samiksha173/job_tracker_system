/* ══════════════════════════════════════════════════════
   applications-backend.js
   Shared Firebase backend
   ══════════════════════════════════════════════════════ */

import { initializeApp }
    from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut }
    from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
    getFirestore,
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
    Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* ── Firebase config ───────────────────────────────── */
const firebaseConfig = {
    apiKey:            "AIzaSyDhSYEW-b20RGIGeHtV95o6lQU3Ve3w-tg",
    authDomain:        "job-tracker-55739.firebaseapp.com",
    projectId:         "job-tracker-55739",
    storageBucket:     "job-tracker-55739.firebasestorage.app",
    messagingSenderId: "72413198513",
    appId:             "1:72413198513:web:a8ccbddbdeae02bb214a90"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

/* ══════════════════════════════════════════════════════
   APPLICANT FUNCTIONS
   ══════════════════════════════════════════════════════ */

/* Submit a new application */
async function submitApplication(data) {
    const user = auth.currentUser;
    if (!user) throw new Error("Not logged in. Please sign in first.");

    let applicantName = user.email;
    try {
        const snap = await getDoc(doc(db, "applicants", user.uid));
        if (snap.exists()) {
            const p = snap.data();
            applicantName = `${p.firstName || ""} ${p.lastName || ""}`.trim() || user.email;
        }
    } catch (_) {}

    const ref = await addDoc(collection(db, "applications"), {
        applicantUid:   user.uid,
        applicantName:  applicantName,
        applicantEmail: user.email,
        company:        data.company        || "",
        jobTitle:       data.jobTitle       || "",
        jobType:        data.jobType        || "Full-Time",
        location:       data.location       || "",
        notes:          data.notes          || "",
        jobDescription: data.jobDescription || "",
        contactPerson:  data.contactPerson  || "",
        contactEmail:   data.contactEmail   || "",
        jobUrl:         data.jobUrl         || "",
        salary:         data.salary         || "",
        resumeName:     data.resumeName     || "",
        appliedDate:    serverTimestamp(),
        deadline:       data.deadline
                          ? Timestamp.fromDate(new Date(data.deadline))
                          : null,
        status:         "Applied",
        interviewDate:  null,
        hrMessage:      "",
        hrUid:          null,
        createdAt:      serverTimestamp()
    });
    return ref.id;
}

/* Delete applicant's own application */
async function deleteApplication(appId) {
    const user = auth.currentUser;
    if (!user) throw new Error("Not logged in");
    const snap = await getDoc(doc(db, "applications", appId));
    if (!snap.exists()) throw new Error("Application not found");
    if (snap.data().applicantUid !== user.uid) throw new Error("Permission denied");
    await deleteDoc(doc(db, "applications", appId));
}

/*
  Real-time listener for applicant's own applications.

  ⚠️ FIX: We use ONLY where("applicantUid") without orderBy
  to avoid the "requires a composite index" error that causes
  the snapshot to silently fail. We sort client-side instead.
*/
function listenApplicantApplications(callback) {
    const user = auth.currentUser;
    if (!user) return () => {};

    const q = query(
        collection(db, "applications"),
        where("applicantUid", "==", user.uid)
        /* NO orderBy here — avoids composite index requirement */
    );

    return onSnapshot(q,
        snap => {
            let apps = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            /* Sort newest first client-side */
            apps.sort((a, b) => {
                const ta = a.createdAt?.toMillis?.() || 0;
                const tb = b.createdAt?.toMillis?.() || 0;
                return tb - ta;
            });
            callback(apps);
        },
        err => {
            console.error("listenApplicantApplications error:", err.code, err.message);
        }
    );
}

/* Compute applicant dashboard stats */
function computeApplicantStats(apps) {
    const now     = new Date();
    const in7days = new Date(now.getTime() + 7 * 864e5);
    const inRange = ts => {
        if (!ts) return false;
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return d >= now && d <= in7days;
    };
    return {
        total:      apps.length,
        applied:    apps.filter(a => a.status === "Applied").length,
        interview:  apps.filter(a => a.status === "Interview Scheduled").length,
        selected:   apps.filter(a => a.status === "Selected").length,
        rejected:   apps.filter(a => a.status === "Rejected").length,
        deadlines:  apps.filter(a => inRange(a.deadline)).length,
        interviews: apps.filter(a => inRange(a.interviewDate)).length
    };
}

/* ══════════════════════════════════════════════════════
   HR FUNCTIONS
   ══════════════════════════════════════════════════════ */

/*
  Real-time listener for ALL applications (HR).
  Uses only orderBy("createdAt") — single-field index,
  auto-created by Firestore, no manual setup needed.
*/
function listenAllApplications(callback) {
    const q = query(
        collection(db, "applications"),
        orderBy("createdAt", "desc")
    );
    return onSnapshot(q,
        snap => {
            callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        },
        err => {
            console.error("listenAllApplications error:", err.code, err.message);
        }
    );
}

/* HR updates status + message + interview date */
async function hrUpdateApplication(appId, update) {
    const user = auth.currentUser;
    if (!user) throw new Error("Not logged in");

    const payload = {
        status:    update.status    || "Applied",
        hrMessage: update.hrMessage || "",
        hrUid:     user.uid,
        updatedAt: serverTimestamp()
    };

    if (update.interviewDate) {
        payload.interviewDate = Timestamp.fromDate(new Date(update.interviewDate));
    } else {
        payload.interviewDate = null;
    }

    await updateDoc(doc(db, "applications", appId), payload);
}

/* Compute HR stats */
function computeHRStats(apps) {
    return {
        total:    apps.length,
        pending:  apps.filter(a => a.status === "Applied").length,
        selected: apps.filter(a => a.status === "Selected").length,
        rejected: apps.filter(a => a.status === "Rejected").length
    };
}

/* ── Shared helpers ──────────────────────────────────── */

function formatDate(ts) {
    if (!ts) return "—";
    try {
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleDateString("en-IN", { year:"numeric", month:"short", day:"numeric" });
    } catch (_) { return "—"; }
}

function toDatetimeLocal(ts) {
    if (!ts) return "";
    try {
        const d   = ts.toDate ? ts.toDate() : new Date(ts);
        const pad = n => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch (_) { return ""; }
}

function statusClass(status) {
    return ({
        "Applied":             "status-applied",
        "Interview Scheduled": "status-interview",
        "Selected":            "status-selected",
        "Rejected":            "status-rejected"
    })[status] || "status-applied";
}

function logout() {
    signOut(auth)
        .then(() => { window.location.href = "login.html"; })
        .catch(e => console.error("logout error:", e));
}

/* ── Exports ─────────────────────────────────────────── */
export {
    auth, db, onAuthStateChanged,
    submitApplication, deleteApplication,
    listenApplicantApplications, computeApplicantStats,
    listenAllApplications, hrUpdateApplication, computeHRStats,
    formatDate, toDatetimeLocal, statusClass, logout
};
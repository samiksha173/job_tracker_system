/* ════════════════════════════════
   SCRIPT.JS — Job Tracker Auth (FIXED)
════════════════════════════════ */

// ─── Firebase Imports ───────────────────────────────────
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
    getFirestore,
    setDoc,
    doc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ─── Firebase Config ────────────────────────────────────
const firebaseConfig = {
    apiKey: "AIzaSyDhSYEW-b20RGIGeHtV95o6lQU3Ve3w-tg",
    authDomain: "job-tracker-55739.firebaseapp.com",
    projectId: "job-tracker-55739",
    storageBucket: "job-tracker-55739.firebasestorage.app",
    messagingSenderId: "72413198513",
    appId: "1:72413198513:web:a8ccbddbdeae02bb214a90"
};

// ─── Initialize Firebase ────────────────────────────────
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// ─── Page Navigation ───────────────────────────────────
function goTo(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(id);
    if (target) target.classList.add('active');
}


// ─── Tab Switching WITH SLIDING BOX EFFECT ─────────────────────
function switchTab(role, tab) {
    const p = role === 'applicant' ? 'a' : 'hr';

    const loginBtn = document.getElementById(`${p}-tab-login`);
    const signupBtn = document.getElementById(`${p}-tab-signup`);
    const loginForm = document.getElementById(`${p}-form-login`);
    const signupForm = document.getElementById(`${p}-form-signup`);
    const indicator = document.getElementById(`${p}-tab-indicator`);

    if (tab === 'login') {
        loginBtn.classList.add('active');
        signupBtn.classList.remove('active');
        loginForm.classList.add('active');
        loginForm.style.display = '';
        signupForm.classList.remove('active');
        signupForm.style.display = 'none';

        // MOVE THE PINK/GREEN BOX TO LOGIN (LEFT POSITION)
        if (indicator) {
            indicator.classList.remove('signup-pos');
            indicator.classList.add('login-pos');
        }
    } else {
        signupBtn.classList.add('active');
        loginBtn.classList.remove('active');
        signupForm.classList.add('active');
        signupForm.style.display = '';
        loginForm.classList.remove('active');
        loginForm.style.display = 'none';

        // MOVE THE PINK/GREEN BOX TO SIGNUP (RIGHT POSITION)
        if (indicator) {
            indicator.classList.remove('login-pos');
            indicator.classList.add('signup-pos');
        }
    }
}


// ─── Toast ─────────────────────────────────────────────
function showToast(msg, type = 'info') {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.className = `toast ${type} show`;
    setTimeout(() => t.classList.remove('show'), 3500);
}


// ─── Helper: get trimmed value ──────────────────────────
function getVal(id) {
    return document.getElementById(id)?.value.trim() || "";
}


// ─── BUG FIX 1: Toggle Password Visibility ─────────────
// Proper toggle with visual indicator on the eye icon SVG
function togglePass(inputId, btnEl) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';

    // Update icon to show open/closed eye
    if (btnEl) {
        if (isHidden) {
            // Eye with slash (password visible)
            btnEl.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>`;
            btnEl.style.opacity = '1';
            btnEl.title = 'Hide password';
        } else {
            // Normal eye (password hidden)
            btnEl.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
            </svg>`;
            btnEl.style.opacity = '0.6';
            btnEl.title = 'Show password';
        }
    }
}


// ─── Password Strength Checker ─────────────────────────
function checkStrength(inputId, indicatorId) {
    const input = typeof inputId === 'string'
        ? document.getElementById(inputId)
        : inputId;
    const pass = input?.value || "";

    const indicator = document.getElementById(indicatorId);
    if (!indicator) return;

    let strength = 0;
    if (pass.length >= 8) strength++;
    if (/[A-Z]/.test(pass)) strength++;
    if (/[0-9]/.test(pass)) strength++;
    if (/[^A-Za-z0-9]/.test(pass)) strength++;

    const pct = ['0%', '25%', '50%', '75%', '100%'];
    const color = ['', '#ef4444', '#f97316', '#eab308', '#22c55e'];

    indicator.style.width = pass.length === 0 ? '0%' : pct[strength];
    indicator.style.background = pass.length === 0 ? '' : color[strength];
}


// ─── BUG FIX 4/5/6: VALIDATION HELPERS ────────────────

// Name: letters, spaces, hyphens only (no numbers)
function validateName(value, fieldLabel) {
    if (!value) return `⚠️ ${fieldLabel} is required.`;
    if (!/^[A-Za-z\s\-']+$/.test(value)) return `⚠️ ${fieldLabel} must contain only letters.`;
    if (value.length < 2) return `⚠️ ${fieldLabel} must be at least 2 characters.`;
    return null;
}

// Email: must match standard email format
function validateEmail(value) {
    if (!value) return "⚠️ Email address is required.";
    const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(value)) return "⚠️ Please enter a valid email address (e.g. you@gmail.com).";
    return null;
}

// Phone: optional but if provided must be Indian format
// Accepts: +91XXXXXXXXXX or 91XXXXXXXXXX or 0XXXXXXXXXX or just 10 digits
function validateIndianPhone(value) {
    if (!value) return null; // optional
    // Strip spaces and dashes
    const cleaned = value.replace(/[\s\-]/g, '');
    // Must be only digits (with optional leading +)
    if (!/^\+?[\d]+$/.test(cleaned)) return "⚠️ Phone number must contain only digits.";
    // Indian number patterns
    const indianRegex = /^(\+91|91|0)?[6-9]\d{9}$/;
    if (!indianRegex.test(cleaned)) {
        return "⚠️ Enter a valid Indian mobile number (e.g. +91 98765 43210).";
    }
    return null;
}

// Show inline field error
function showFieldError(inputId, message) {
    const input = document.getElementById(inputId);
    if (!input) return;
    // Remove existing error
    const existing = input.closest('.input-wrap')?.parentElement?.querySelector('.field-error');
    if (existing) existing.remove();

    if (message) {
        input.style.borderColor = '#ef4444';
        const err = document.createElement('span');
        err.className = 'field-error';
        err.style.cssText = 'color:#ef4444;font-size:12px;margin-top:4px;display:block;font-family:DM Sans,sans-serif;';
        err.textContent = message;
        input.closest('.fgroup')?.appendChild(err);
    } else {
        input.style.borderColor = '';
    }
}

// Clear field error
function clearFieldError(inputId) {
    showFieldError(inputId, null);
}


// ─── BUG FIX 3: Applicant SIGNUP → redirect to Sign In ─
async function signupApplicant() {
    const fname = getVal('a-signup-fname');
    const lname = getVal('a-signup-lname');
    const email = getVal('a-signup-email');
    const phone = getVal('a-signup-phone');
    const pass = getVal('a-signup-pass');
    const cpass = getVal('a-signup-cpass');

    // Clear previous errors
    ['a-signup-fname', 'a-signup-lname', 'a-signup-email', 'a-signup-phone', 'a-signup-pass', 'a-signup-cpass']
        .forEach(id => clearFieldError(id));

    let hasError = false;

    // Validate First Name
    const fnameErr = validateName(fname, 'First Name');
    if (fnameErr) { showFieldError('a-signup-fname', fnameErr); hasError = true; }

    // Validate Last Name
    const lnameErr = validateName(lname, 'Last Name');
    if (lnameErr) { showFieldError('a-signup-lname', lnameErr); hasError = true; }

    // Validate Email
    const emailErr = validateEmail(email);
    if (emailErr) { showFieldError('a-signup-email', emailErr); hasError = true; }

    // Validate Phone (optional)
    const phoneErr = validateIndianPhone(phone);
    if (phoneErr) { showFieldError('a-signup-phone', phoneErr); hasError = true; }

    // Validate Password
    if (!pass) {
        showFieldError('a-signup-pass', '⚠️ Password is required.');
        hasError = true;
    } else if (pass.length < 6) {
        showFieldError('a-signup-pass', '⚠️ Password must be at least 6 characters.');
        hasError = true;
    }

    // Validate Confirm Password
    if (pass && pass !== cpass) {
        showFieldError('a-signup-cpass', '⚠️ Passwords do not match.');
        hasError = true;
    }

    if (hasError) {
        showToast("⚠️ Please fix the errors above.", "error");
        return;
    }

    showToast("⏳ Creating your account, please wait...", "info");

    try {
        const userCred = await createUserWithEmailAndPassword(auth, email, pass);

        await setDoc(doc(db, "applicants", userCred.user.uid), {
            firstName: fname,
            lastName: lname,
            email,
            phone,
            role: "applicant"
        });

        showToast(`🎉 Account created! Please sign in.`, "success");

        // BUG FIX 3: After signup, redirect to Sign In tab
        setTimeout(() => {
            switchTab('applicant', 'login');
            // Pre-fill email for convenience
            const loginEmail = document.getElementById('a-login-email');
            if (loginEmail) loginEmail.value = email;
        }, 1500);

    } catch (e) {
        showToast(`❌ ${e.message}`, "error");
    }
}


// ─── Applicant LOGIN ───────────────────────────────────
async function loginApplicant() {
    const email = getVal('a-login-email');
    const pass = getVal('a-login-pass');

    ['a-login-email', 'a-login-pass'].forEach(id => clearFieldError(id));
    let hasError = false;

    const emailErr = validateEmail(email);
    if (emailErr) { showFieldError('a-login-email', emailErr); hasError = true; }

    if (!pass) { showFieldError('a-login-pass', '⚠️ Password is required.'); hasError = true; }

    if (hasError) return;

    showToast("⏳ Signing you in, please wait...", "info");

    try {
        await signInWithEmailAndPassword(auth, email, pass);
        showToast("✅ Login Successful! Redirecting to your dashboard...", "success");
        setTimeout(() => { window.location.href = "index.html"; }, 1500);
    } catch (e) {
        showToast(`❌ ${e.message}`, "error");
    }
}


// ─── BUG FIX 3: HR SIGNUP → redirect to Sign In ────────
async function signupHR() {
    const fname = getVal('hr-signup-fname');
    const lname = getVal('hr-signup-lname');
    const email = getVal('hr-signup-email');
    const company = getVal('hr-signup-company');
    const empid = getVal('hr-signup-empid');
    const dept = getVal('hr-signup-dept');
    const pass = getVal('hr-signup-pass');
    const cpass = getVal('hr-signup-cpass');

    ['hr-signup-fname', 'hr-signup-lname', 'hr-signup-email', 'hr-signup-company', 'hr-signup-pass', 'hr-signup-cpass']
        .forEach(id => clearFieldError(id));

    let hasError = false;

    const fnameErr = validateName(fname, 'First Name');
    if (fnameErr) { showFieldError('hr-signup-fname', fnameErr); hasError = true; }

    const lnameErr = validateName(lname, 'Last Name');
    if (lnameErr) { showFieldError('hr-signup-lname', lnameErr); hasError = true; }

    const emailErr = validateEmail(email);
    if (emailErr) { showFieldError('hr-signup-email', emailErr); hasError = true; }

    if (!company) { showFieldError('hr-signup-company', '⚠️ Company name is required.'); hasError = true; }

    if (!pass) {
        showFieldError('hr-signup-pass', '⚠️ Password is required.');
        hasError = true;
    } else if (pass.length < 6) {
        showFieldError('hr-signup-pass', '⚠️ Password must be at least 6 characters.');
        hasError = true;
    }

    if (pass && pass !== cpass) {
        showFieldError('hr-signup-cpass', '⚠️ Passwords do not match.');
        hasError = true;
    }

    if (hasError) {
        showToast("⚠️ Please fix the errors above.", "error");
        return;
    }

    showToast("⏳ Registering HR account, please wait...", "info");

    try {
        const userCred = await createUserWithEmailAndPassword(auth, email, pass);

        await setDoc(doc(db, "hr_managers", userCred.user.uid), {
            firstName: fname,
            lastName: lname,
            email,
            company,
            employeeId: empid,
            department: dept,
            role: "hr"
        });

        showToast(`🏢 HR Account created! Please sign in.`, "success");

        // BUG FIX 3: After signup, redirect to Sign In tab
        setTimeout(() => {
            switchTab('hr', 'login');
            const loginEmail = document.getElementById('hr-login-email');
            if (loginEmail) loginEmail.value = email;
        }, 1500);

    } catch (e) {
        showToast(`❌ ${e.message}`, "error");
    }
}


// ─── HR LOGIN ──────────────────────────────────────────
async function loginHR() {
    const email = getVal('hr-login-email');
    const pass = getVal('hr-login-pass');

    ['hr-login-email', 'hr-login-pass'].forEach(id => clearFieldError(id));
    let hasError = false;

    const emailErr = validateEmail(email);
    if (emailErr) { showFieldError('hr-login-email', emailErr); hasError = true; }

    if (!pass) { showFieldError('hr-login-pass', '⚠️ Password is required.'); hasError = true; }

    if (hasError) return;

    showToast("⏳ Signing you in, please wait...", "info");

    try {
        await signInWithEmailAndPassword(auth, email, pass);
        showToast("✅ Login Successful! Redirecting to HR Dashboard...", "success");
        setTimeout(() => { window.location.href = "hrdashboard.html"; }, 1500);
    } catch (e) {
        showToast(`❌ ${e.message}`, "error");
    }
}


// ─── AUTH STATE LISTENER ───────────────────────────────
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User logged in:", user.email);
    } else {
        console.log("No user logged in");
    }
});


// ─── LOGOUT ────────────────────────────────────────────
function logout() {
    showToast("⏳ Signing you out...", "info");
    signOut(auth).then(() => {
        showToast("👋 Logged out successfully! See you soon.", "success");
        setTimeout(() => { window.location.href = "login.html"; }, 1500);
    }).catch((e) => {
        showToast(`❌ ${e.message}`, "error");
    });
}


// ─── BUG FIX 2: Password Reset ─────────────────────────
// Fixed: now uses the same Firebase version as everything else (10.12.0)
// sendPasswordResetEmail is already imported at the top of this file.
window._resetPassword = async function (email) {
    const emailErr = validateEmail(email);
    if (emailErr) throw new Error("Please enter a valid email address.");
    return await sendPasswordResetEmail(auth, email);
};


// ─── EXPOSE FUNCTIONS TO GLOBAL SCOPE ─────────────────
window.goTo = goTo;
window.switchTab = switchTab;
window.loginApplicant = loginApplicant;
window.signupApplicant = signupApplicant;
window.loginHR = loginHR;
window.signupHR = signupHR;
window.togglePass = togglePass;
window.checkStrength = checkStrength;
window.logout = logout; s
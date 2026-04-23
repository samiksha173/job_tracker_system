/**
 * JOB TRACKER - TOOLS & DATA MANAGEMENT
 * Handles: Demo Data, JSON Export/Import, Storage Calculation, and Data Clearing.
 * Custom modal system replaces all browser alert() / confirm() calls.
 */

// ─── 1. DOM Elements ────────────────────────────────────────────────
const appCountDisplay = document.getElementById('appCountDisplay');
const loadDemoBtn = document.getElementById('loadDemoBtn');
const exportBtn = document.getElementById('exportBtn');
const importFile = document.getElementById('importFile');
const clearAllBtn = document.getElementById('clearAllBtn');
const storageSize = document.getElementById('storageSize');

// Modal elements
const modalOverlay = document.getElementById('modalOverlay');
const modalIcon = document.getElementById('modalIcon');
const modalTitle = document.getElementById('modalTitle');
const modalMsg = document.getElementById('modalMsg');
const modalActions = document.getElementById('modalActions');

// ─── 2. Demo Data Set ───────────────────────────────────────────────
const demoApplications = [
    { id: 1, company: "Google", role: "Software Engineer", status: "Interview", date: "2026-03-15", type: "Full-time" },
    { id: 2, company: "Amazon", role: "Frontend Developer", status: "Applied", date: "2026-03-18", type: "Contract" },
    { id: 3, company: "Meta", role: "Product Designer", status: "Rejected", date: "2026-03-05", type: "Full-time" },
    { id: 4, company: "Netflix", role: "Fullstack Engineer", status: "Applied", date: "2026-03-22", type: "Remote" },
    { id: 5, company: "Adobe", role: "UX Researcher", status: "Offer", date: "2026-03-25", type: "Full-time" },
    { id: 6, company: "Microsoft", role: "Azure Architect", status: "Applied", date: "2026-03-10", type: "Full-time" },
    { id: 7, company: "Spotify", role: "Backend Developer", status: "Interview", date: "2026-03-12", type: "Full-time" },
    { id: 8, company: "Apple", role: "iOS Developer", status: "Applied", date: "2026-03-28", type: "Full-time" },
    { id: 9, company: "Tesla", role: "Data Scientist", status: "Applied", date: "2026-04-02", type: "Full-time" },
    { id: 10, company: "Twitter", role: "SRE", status: "Rejected", date: "2026-02-28", type: "Contract" }
];

// ─── 3. Modal System ────────────────────────────────────────────────

/**
 * showAlert — replaces alert()
 * @param {string} icon   - emoji icon
 * @param {string} title  - modal heading
 * @param {string} msg    - body message
 * @param {string} type   - 'success' | 'error' | 'info'
 */
function showAlert(icon, title, msg, type = 'info') {
    modalIcon.textContent = icon;
    modalTitle.textContent = title;
    modalMsg.textContent = msg;
    modalBox.className = `modal-box modal-${type}`;

    modalActions.innerHTML = '';
    const okBtn = document.createElement('button');
    okBtn.textContent = 'OK';
    okBtn.className = 'modal-btn modal-btn-primary';
    okBtn.onclick = closeModal;
    modalActions.appendChild(okBtn);

    openModal();
}

/**
 * showConfirm — replaces confirm()
 * @param {string}   icon      - emoji icon
 * @param {string}   title     - modal heading
 * @param {string}   msg       - body message
 * @param {Function} onConfirm - callback when user confirms
 * @param {string}   type      - 'warning' | 'danger'
 */
function showConfirm(icon, title, msg, onConfirm, type = 'warning') {
    modalIcon.textContent = icon;
    modalTitle.textContent = title;
    modalMsg.textContent = msg;
    modalBox.className = `modal-box modal-${type}`;

    modalActions.innerHTML = '';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.className = 'modal-btn modal-btn-secondary';
    cancelBtn.onclick = closeModal;

    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = type === 'danger' ? 'Yes, Delete' : 'Proceed';
    confirmBtn.className = type === 'danger' ? 'modal-btn modal-btn-danger' : 'modal-btn modal-btn-primary';
    confirmBtn.onclick = () => { closeModal(); onConfirm(); };

    modalActions.appendChild(cancelBtn);
    modalActions.appendChild(confirmBtn);

    openModal();
}

function openModal() {
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

// Close on overlay click
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
});

// Close on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

// ─── 4. Storage UI Update ───────────────────────────────────────────
function updateStorageUI() {
    const rawData = localStorage.getItem('jobApplications');
    const data = rawData ? JSON.parse(rawData) : [];

    if (appCountDisplay) {
        appCountDisplay.innerText = `${data.length} application${data.length !== 1 ? 's' : ''}`;
    }

    if (storageSize) {
        const bytes = rawData ? new TextEncoder().encode(rawData).length : 0;
        const kb = (bytes / 1024).toFixed(2);
        storageSize.innerText = `${kb} KB`;
    }
}


// ═══════════════════════════════════════════════════════════════
//  demo-data.js  —  Loads sample applications WITHOUT replacing
//  existing data. Merges into jobApplications.
// ═══════════════════════════════════════════════════════════════

const DEMO_APPS = [
    {
        id: 'demo_' + Date.now() + '_1',
        companyName: 'Google',
        position: 'Software Engineer Intern',
        status: 'Interview',
        jobType: 'Internship',
        location: 'Mountain View, CA',
        salary: '$8,000/month',
        appDate: '2025-03-01',
        deadline: '2025-04-01',
        interviewDate: '2025-03-20',
        jobDescription: 'Work on core search infrastructure with the Platforms team.',
        notes: 'Referred by alumni. Prepare system design questions.',
        contactPerson: 'Jane Smith',
        contactEmail: 'jsmith@google.com',
        jobUrl: 'https://careers.google.com',
        selectedByCompany: null,
        resume: null,
        createdAt: new Date().toISOString(),
    },
    {
        id: 'demo_' + Date.now() + '_2',
        companyName: 'Microsoft',
        position: 'Full-Stack Developer',
        status: 'Applied',
        jobType: 'Full-Time',
        location: 'Redmond, WA',
        salary: '$120,000/year',
        appDate: '2025-03-05',
        deadline: '2025-04-15',
        interviewDate: '',
        jobDescription: 'Build scalable web services for Microsoft 365 suite.',
        notes: 'Applied via LinkedIn. Follow up after 2 weeks.',
        contactPerson: 'HR Team',
        contactEmail: 'careers@microsoft.com',
        jobUrl: 'https://careers.microsoft.com',
        selectedByCompany: null,
        resume: null,
        createdAt: new Date().toISOString(),
    },
    {
        id: 'demo_' + Date.now() + '_3',
        companyName: 'Amazon',
        position: 'Backend Engineer',
        status: 'Rejected',
        jobType: 'Full-Time',
        location: 'Seattle, WA',
        salary: '$130,000/year',
        appDate: '2025-02-20',
        deadline: '',
        interviewDate: '2025-03-10',
        jobDescription: 'Design and own microservices for AWS payment systems.',
        notes: 'Failed final round. Revisit in 6 months.',
        contactPerson: 'Recruiter - Alex',
        contactEmail: 'alex@amazon.com',
        jobUrl: 'https://amazon.jobs',
        selectedByCompany: false,
        resume: null,
        createdAt: new Date().toISOString(),
    },
    {
        id: 'demo_' + Date.now() + '_4',
        companyName: 'Stripe',
        position: 'Frontend Engineer',
        status: 'Offer',
        jobType: 'Full-Time',
        location: 'Remote',
        salary: '$145,000/year',
        appDate: '2025-02-10',
        deadline: '',
        interviewDate: '2025-02-28',
        jobDescription: 'Own the developer dashboard UI used by millions of merchants.',
        notes: 'Offer received! Decide by April 5.',
        contactPerson: 'Sarah K.',
        contactEmail: 'sarah@stripe.com',
        jobUrl: 'https://stripe.com/jobs',
        selectedByCompany: true,
        resume: null,
        createdAt: new Date().toISOString(),
    },

];

// ── Load Demo Data (MERGE — never replaces existing) ─────────────

document.getElementById('loadDemoBtn')
    ?.addEventListener('click', function () {

        const KEY = 'jobApplications';
        const existing = JSON.parse(localStorage.getItem(KEY) || '[]');

        // Build a set of existing company+position combos to avoid duplicates
        const existingKeys = new Set(
            existing.map(a =>
                (a.companyName || '').toLowerCase().trim() + '|' +
                (a.position || '').toLowerCase().trim()
            )
        );

        // Only add demo apps that don't already exist
        const toAdd = DEMO_APPS.filter(d => {
            const key =
                d.companyName.toLowerCase().trim() + '|' +
                d.position.toLowerCase().trim();
            return !existingKeys.has(key);
        });

        if (toAdd.length === 0) {
            showDemoToast(
                '⚠️ Demo data already loaded — no duplicates added.',
                'warn'
            );
            return;
        }

        // Fix unique IDs (avoid collisions when called multiple times)
        toAdd.forEach((a, i) => {
            a.id = 'demo_' + Date.now() + '_' + i;
        });

        // Merge: existing apps first, demo apps appended
        const merged = [...existing, ...toAdd];
        localStorage.setItem(KEY, JSON.stringify(merged));

        // Notify dashboard.js (same tab)
        window.dispatchEvent(new Event('applicationsUpdated'));

        // Refresh dashboard counts if on index.html
        if (typeof updateDashboard === 'function') updateDashboard();

        // Refresh bin stats if on tools.html
        if (typeof RecycleBin !== 'undefined') RecycleBin.refreshStats();

        showDemoToast(
            `✅ ${toAdd.length} demo application(s) added! Your ${existing.length} existing app(s) are untouched.`,
            'success'
        );

        // Update warning box text to confirm merge
        const warn = document.querySelector('.warning-box');
        if (warn) {
            warn.style.background = '#dcfce7';
            warn.style.borderColor = '#86efac';
            warn.style.color = '#166534';
            warn.textContent = `✅ ${toAdd.length} demo app(s) merged. Your data is safe.`;
            setTimeout(() => {
                warn.style.background = '';
                warn.style.borderColor = '';
                warn.style.color = '';
                warn.textContent = '⚠️ Warning: This will replace all your current data!';
            }, 5000);
        }
    });

// ── Toast helper (self-contained, works on any page) ─────────────

function showDemoToast(msg, type) {
    const old = document.getElementById('demoToast');
    if (old) old.remove();

    const colors = {
        success: '#2d7d46',
        warn: '#b45309',
        error: '#c0392b',
    };

    const toast = document.createElement('div');
    toast.id = 'demoToast';
    toast.textContent = msg;
    toast.style.cssText = `
    position: fixed;
    bottom: 28px;
    right: 28px;
    z-index: 99999;
    padding: 13px 22px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    color: #fff;
    max-width: 380px;
    line-height: 1.4;
    background: ${colors[type] || colors.success};
    box-shadow: 0 6px 24px rgba(0,0,0,.2);
    opacity: 1;
    transition: opacity .35s ease;
  `;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}






// ─── 6. Export Data ─────────────────────────────────────────────────
if (exportBtn) {
    exportBtn.addEventListener('click', () => {
        const data = localStorage.getItem('jobApplications');
        if (!data || data === '[]') {
            showAlert('📭', 'Nothing to Export', 'You have no saved applications to export. Add some first!', 'info');
            return;
        }

        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `job_tracker_backup_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);

        showAlert('📥', 'Export Successful', 'Your data has been downloaded as a JSON backup file.', 'success');
    });
}

// ─── 7. Import Data ─────────────────────────────────────────────────
if (importFile) {
    importFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedData = JSON.parse(event.target.result);
                if (Array.isArray(importedData)) {
                    localStorage.setItem('jobApplications', JSON.stringify(importedData));
                    updateStorageUI();
                    showAlert(
                        '✅',
                        'Import Successful',
                        `${importedData.length} application${importedData.length !== 1 ? 's' : ''} imported. Your dashboard has been updated.`,
                        'success'
                    );
                } else {
                    showAlert('❌', 'Format Error', 'The JSON file must contain an array of applications. Please check the file and try again.', 'error');
                }
            } catch {
                showAlert('❌', 'Invalid File', 'The file uploaded is not a valid JSON file. Please upload a proper backup file.', 'error');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    });
}



// ═══════════════════════════════════════════════════════════════
//  recycle-bin.js  —  Job Tracker
//  Keys must match what application.html uses
// ═══════════════════════════════════════════════════════════════

const APPS_KEY = 'jobApplications';   // ← same key used in application.html
const BIN_KEY = 'recycleBin';

// ── Low-level helpers ────────────────────────────────────────────

function getApps() {
    return JSON.parse(localStorage.getItem(APPS_KEY) || '[]');
}

function saveApps(apps) {
    localStorage.setItem(APPS_KEY, JSON.stringify(apps));
    // notify dashboard.js (same tab)
    window.dispatchEvent(new Event('applicationsUpdated'));
}

function getBin() {
    return JSON.parse(localStorage.getItem(BIN_KEY) || '[]');
}

function saveBin(bin) {
    localStorage.setItem(BIN_KEY, JSON.stringify(bin));
}

// ═══════════════════════════════════════════════════════════════
//  RecycleBin — core operations
// ═══════════════════════════════════════════════════════════════

const RecycleBin = {

    // ── Move ONE app from dashboard → bin ─────────────────────────
    deleteApp(appId) {
        const apps = getApps();
        const index = apps.findIndex(a => String(a.id) === String(appId));
        if (index === -1) return false;

        const [app] = apps.splice(index, 1);
        app._deletedAt = new Date().toISOString();

        const bin = getBin();
        bin.unshift(app);
        saveBin(bin);
        saveApps(apps);

        this.refreshStats();
        return true;
    },

    // ── Move ALL apps from dashboard → bin (Clear All) ────────────
    deleteAllApps() {
        const apps = getApps();
        if (apps.length === 0) return;

        const now = new Date().toISOString();
        const bin = getBin();

        apps.forEach(a => {
            a._deletedAt = now;
            bin.unshift(a);
        });

        saveBin(bin);
        saveApps([]);          // dashboard is now empty
        this.refreshStats();
    },

    // ── Restore ONE app from bin → dashboard ──────────────────────
    restoreApp(appId) {
        const bin = getBin();
        const index = bin.findIndex(a => String(a.id) === String(appId));
        if (index === -1) return false;

        const [app] = bin.splice(index, 1);
        delete app._deletedAt;

        const apps = getApps();
        apps.unshift(app);
        saveApps(apps);
        saveBin(bin);

        this.refreshStats();
        return true;
    },

    // ── Restore ALL apps from bin → dashboard ─────────────────────
    restoreAllApps() {
        const bin = getBin();
        if (bin.length === 0) return;

        const apps = getApps();

        bin.forEach(a => {
            delete a._deletedAt;
            apps.unshift(a);
        });

        saveApps(apps);
        saveBin([]);           // bin is now empty
        this.refreshStats();
    },

    // ── Permanently delete ONE item from bin ──────────────────────
    destroyApp(appId) {
        const bin = getBin().filter(a => String(a.id) !== String(appId));
        saveBin(bin);
        this.refreshStats();
    },

    // ── Permanently delete ALL items from bin ─────────────────────
    emptyBin() {
        saveBin([]);
        this.refreshStats();
    },

    // ── Refresh the stat counters on the Tools card ───────────────
    refreshStats() {
        const bin = getBin();
        const bytes = new TextEncoder().encode(JSON.stringify(bin)).length;

        const countEl = document.getElementById('binCount');
        const sizeEl = document.getElementById('binSizeDisplay');

        if (countEl) countEl.textContent = bin.length;
        if (sizeEl) sizeEl.textContent = bytes < 1024
            ? `${bytes} B`
            : `${(bytes / 1024).toFixed(1)} KB`;
    }
};

// ═══════════════════════════════════════════════════════════════
//  Bin Modal — open / render / close
// ═══════════════════════════════════════════════════════════════

function openBinModal() {
    // Remove any existing modal
    const existing = document.getElementById('binModal');
    if (existing) existing.remove();

    // ── Overlay ──
    const overlay = document.createElement('div');
    overlay.id = 'binModal';
    overlay.style.cssText = `
    position:fixed; inset:0; z-index:9999;
    background:rgba(0,0,0,.48);
    display:flex; align-items:center; justify-content:center;
    padding:1rem;
  `;

    // ── Modal box ──
    const modal = document.createElement('div');
    modal.style.cssText = `
    background:#fff; border-radius:14px;
    width:100%; max-width:580px; max-height:82vh;
    display:flex; flex-direction:column;
    box-shadow:0 12px 40px rgba(0,0,0,.2);
    overflow:hidden;
  `;

    // ── Header ──
    const header = document.createElement('div');
    header.style.cssText = `
    display:flex; align-items:center; justify-content:space-between;
    padding:1rem 1.25rem;
    border-bottom:1px solid #f0e6ef;
    background:linear-gradient(to right,#fff8f0,#fff);
    flex-shrink:0;
  `;
    header.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;">
      <span style="font-size:1.4rem;line-height:1;">♻️</span>
      <div>
        <h3 style="margin:0;font-size:15px;font-weight:700;color:#1a1a2e;">Recycle Bin</h3>
        <p id="binModalCount" style="margin:0;font-size:12px;color:#8888a0;margin-top:1px;">0 items</p>
      </div>
    </div>
    <div style="display:flex;gap:8px;align-items:center;">
      <button id="restoreAllBinBtn" style="
        background:#fff3e0;color:#e65100;border:1.5px solid #ffcc80;
        padding:6px 13px;border-radius:8px;cursor:pointer;
        font-size:12px;font-weight:600;font-family:inherit;
        transition:background .15s;">
        ↩ Restore All
      </button>
      <button id="emptyBinBtn" style="
        background:#ffebee;color:#c62828;border:1.5px solid #f5c6cb;
        padding:6px 13px;border-radius:8px;cursor:pointer;
        font-size:12px;font-weight:600;font-family:inherit;
        transition:background .15s;">
        🗑 Empty Bin
      </button>
      <button id="closeBinBtn" style="
        width:32px;height:32px;border-radius:50%;
        background:#fff0f6;border:1.5px solid #f8c8dc;
        font-size:16px;cursor:pointer;color:#888;line-height:1;
        display:flex;align-items:center;justify-content:center;">✕</button>
    </div>
  `;

    // ── Scrollable list ──
    const body = document.createElement('div');
    body.id = 'binList';
    body.style.cssText = `overflow-y:auto; flex:1; padding:1rem 1.25rem;`;

    modal.appendChild(header);
    modal.appendChild(body);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    renderBinList();

    // ── Wire header buttons ──
    document.getElementById('closeBinBtn').onclick = () => overlay.remove();
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };

    document.getElementById('emptyBinBtn').onclick = () => {
        const bin = getBin();
        if (bin.length === 0) return alert('The bin is already empty.');
        if (confirm(`Permanently delete all ${bin.length} item(s)? This cannot be undone.`)) {
            RecycleBin.emptyBin();
            renderBinList();
        }
    };

    document.getElementById('restoreAllBinBtn').onclick = () => {
        const bin = getBin();
        if (bin.length === 0) return alert('Nothing to restore.');
        if (confirm(`Restore all ${bin.length} item(s) back to your dashboard?`)) {
            RecycleBin.restoreAllApps();
            renderBinList();
            showToast(`✅ ${bin.length} application(s) restored to dashboard!`, 'success');
        }
    };
}

// ── Render the list of bin items ──────────────────────────────────

function renderBinList() {
    const body = document.getElementById('binList');
    if (!body) return;

    const bin = getBin();

    // Update subtitle count
    const countEl = document.getElementById('binModalCount');
    if (countEl) countEl.textContent = bin.length === 0
        ? 'Empty'
        : `${bin.length} item${bin.length > 1 ? 's' : ''}`;

    if (bin.length === 0) {
        body.innerHTML = `
      <div style="
        text-align:center;padding:3rem 1rem;
        color:#8888a0;display:flex;flex-direction:column;
        align-items:center;gap:0.5rem;">
        <div style="font-size:2.8rem;opacity:.3;">♻️</div>
        <p style="font-size:1rem;font-weight:600;color:#4a4a6a;margin:0;">Bin is empty</p>
        <span style="font-size:13px;">Deleted applications will appear here</span>
      </div>`;
        return;
    }

    body.innerHTML = bin.map(app => {
        const company = esc(app.companyName || app.company || '—');
        const position = esc(app.position || app.jobTitle || '');
        const status = esc(app.status || 'Applied');
        const deleted = app._deletedAt
            ? new Date(app._deletedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
            : 'Unknown';

        const statusColor = statusBadgeStyle(app.status);

        return `
      <div style="
        display:flex;align-items:center;justify-content:space-between;
        padding:12px 14px;margin-bottom:10px;
        background:#fafafa;border:1.5px solid #f0f0f0;
        border-radius:12px;gap:12px;
        transition:background .15s,border-color .15s;"
        onmouseover="this.style.background='#fff0f6';this.style.borderColor='#f8c8dc';"
        onmouseout="this.style.background='#fafafa';this.style.borderColor='#f0f0f0';">

        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <strong style="font-size:14px;color:#1a1a2e;
              white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
              ${company}
            </strong>
            <span style="font-size:11px;font-weight:600;padding:2px 8px;
              border-radius:20px;white-space:nowrap;${statusColor}">
              ${status}
            </span>
          </div>
          ${position
                ? `<div style="font-size:12px;color:#8888a0;margin-top:3px;">${position}</div>`
                : ''}
          <div style="font-size:11px;color:#b0b0c0;margin-top:4px;">
            🗑 Deleted: ${deleted}
          </div>
        </div>

        <div style="display:flex;gap:6px;flex-shrink:0;">
          <button
            onclick="handleRestore('${app.id}')"
            style="padding:5px 12px;border-radius:7px;font-size:12px;font-weight:600;
              cursor:pointer;font-family:inherit;
              background:#fff3e0;border:1.5px solid #ffcc80;color:#e65100;
              transition:background .15s;">
            ↩ Restore
          </button>
          <button
            onclick="handleDestroy('${app.id}')"
            style="padding:5px 12px;border-radius:7px;font-size:12px;font-weight:600;
              cursor:pointer;font-family:inherit;
              background:#ffebee;border:1.5px solid #f5c6cb;color:#c62828;
              transition:background .15s;">
            ✕ Delete
          </button>
        </div>
      </div>`;
    }).join('');
}

// ── Per-item actions ──────────────────────────────────────────────

function handleRestore(id) {
    RecycleBin.restoreApp(id);
    renderBinList();
    showToast('✅ Application restored to dashboard!', 'success');
}

function handleDestroy(id) {
    if (confirm('Permanently delete this application? This cannot be undone.')) {
        RecycleBin.destroyApp(id);
        renderBinList();
    }
}

// ── Status badge inline style ─────────────────────────────────────

function statusBadgeStyle(status) {
    const s = (status || '').toLowerCase();
    if (s.includes('interview')) return 'background:#fef3c7;color:#92400e;';
    if (s.includes('select') || s.includes('offer')) return 'background:#dcfce7;color:#166534;';
    if (s.includes('reject')) return 'background:#fee2e2;color:#991b1b;';
    return 'background:#dbeafe;color:#1e40af;';
}

// ── XSS escape ────────────────────────────────────────────────────

function esc(str) {
    return String(str || '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Toast notification ────────────────────────────────────────────

function showToast(msg, type) {
    const existing = document.getElementById('rbToast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'rbToast';
    toast.textContent = msg;
    toast.style.cssText = `
    position:fixed; bottom:28px; right:28px; z-index:99999;
    padding:12px 22px; border-radius:10px;
    font-size:14px; font-weight:600; color:#fff;
    background:${type === 'success' ? '#2d7d46' : '#c0392b'};
    box-shadow:0 6px 24px rgba(0,0,0,.2);
    opacity:1; transition:opacity .35s ease;
  `;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// ═══════════════════════════════════════════════════════════════
//  Boot — wire all buttons on DOMContentLoaded
// ═══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {

    // Refresh bin stats on load
    RecycleBin.refreshStats();

    // ── Open Recycle Bin modal ──
    document.getElementById('openBinBtn')
        ?.addEventListener('click', openBinModal);

    // ── Clear All → moves ALL dashboard apps to bin ──
    document.getElementById('clearAllBtn')
        ?.addEventListener('click', () => {
            const apps = getApps();

            if (apps.length === 0) {
                alert('No applications to clear.');
                return;
            }

            if (confirm(
                `Move all ${apps.length} application(s) to the Recycle Bin?\n\n` +
                `You can restore them from the Recycle Bin anytime.`
            )) {
                RecycleBin.deleteAllApps();

                showToast(
                    `🗑 ${apps.length} application(s) moved to Recycle Bin.`,
                    'error'
                );

                // Refresh dashboard counts if dashboard.js is loaded
                if (typeof updateDashboard === 'function') updateDashboard();
            }
        });

});




























// ─── Initial Run ─────────────────────────────────────────────────────
updateStorageUI();

// ─── 9. Developer Info ───────────────────────────────────────────────
const developerInfo = {
    name: "Tarte Samiksha",           // 👈 Replace with your name
    email: "tartesamiksha@gmail.com",   // 👈 Replace with your email
    phone: "+91 89563 23013",    // 👈 Replace with your mobile number
    version: "v1.0.0"              // 👈 Update version as needed
};

function loadDeveloperInfo() {
    const nameEl = document.getElementById('devName');
    const emailEl = document.getElementById('devEmail');
    const phoneEl = document.getElementById('devPhone');
    const versionEl = document.getElementById('devVersion');
    const avatarEl = document.getElementById('devAvatar');

    if (nameEl) nameEl.textContent = developerInfo.name;
    if (versionEl) versionEl.textContent = developerInfo.version;

    if (emailEl) {
        emailEl.textContent = developerInfo.email;
        emailEl.href = `mailto:${developerInfo.email}`;
    }

    if (phoneEl) {
        phoneEl.textContent = developerInfo.phone;
        phoneEl.href = `tel:${developerInfo.phone.replace(/\s+/g, '')}`;
    }

    // Auto-generate initials avatar from name
    if (avatarEl) {
        const parts = developerInfo.name.trim().split(' ');
        const initials = parts.length >= 2
            ? parts[0][0] + parts[parts.length - 1][0]
            : parts[0].substring(0, 2);
        avatarEl.textContent = initials.toUpperCase();
    }
}

loadDeveloperInfo();

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
    hb?.addEventListener("click", () => {
        hb.classList.toggle("open");
        mn?.classList.toggle("open");
    });
    document.addEventListener("click", e => {
        if (hb && mn && !hb.contains(e.target) && !mn.contains(e.target)) {
            hb.classList.remove("open");
            mn?.classList.remove("open");
        }
    });
});

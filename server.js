// ═══════════════════════════════════════════════════════════════
//  server.js  —  Job Search Backend  |  Node.js + Express
//  API: JSearch (RapidAPI) only
//
//  Install: npm install express cors node-fetch dotenv
//  Run:     node server.js
// ═══════════════════════════════════════════════════════════════

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const fetch = (...args) =>
    import('node-fetch').then(({ default: f }) => f(...args));

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const JSEARCH_KEY = process.env.JSEARCH_API_KEY || '';

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', jsearch: !!JSEARCH_KEY });
});

// ── GET /api/jobs ─────────────────────────────────────────────
// Params: q, location, source, type, page
// ─────────────────────────────────────────────────────────────
app.get('/api/jobs', async (req, res) => {
    const {
        q = '',
        location = 'India',
        source = 'all',
        type = '',
        page = '1',
    } = req.query;

    if (!q.trim()) {
        return res.status(400).json({ error: 'Search query is required.' });
    }

    if (!JSEARCH_KEY) {
        return res.status(500).json({
            error: 'JSEARCH_API_KEY not set in .env file.',
        });
    }

    // Build query — append source site filter if not "all"
    const sourceMap = {
        linkedin: 'site:linkedin.com',
        indeed: 'site:indeed.com',
        unstop: 'site:unstop.com',
        naukri: 'site:naukri.com',
        internshala: 'site:internshala.com',
    };

    let searchQuery = `${q.trim()} jobs in ${location}`;
    if (source !== 'all' && sourceMap[source]) {
        searchQuery = `${q.trim()} ${sourceMap[source]}`;
    }

    try {
        const params = new URLSearchParams({
            query: searchQuery,
            page: String(page),
            num_pages: '1',
            date_posted: 'week',
            ...(type && { employment_types: type }),
        });

        const apiRes = await fetch(
            `https://jsearch.p.rapidapi.com/search?${params}`,
            {
                headers: {
                    'X-RapidAPI-Key': JSEARCH_KEY,
                    'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
                },
            }
        );

        if (!apiRes.ok) {
            const txt = await apiRes.text();
            console.error('JSearch error:', apiRes.status, txt);
            return res.status(apiRes.status).json({
                error: `JSearch API error ${apiRes.status} — check your API key.`,
            });
        }

        const data = await apiRes.json();

        const jobs = (data.data || []).map(job => ({
            id: job.job_id || String(Math.random()),
            title: job.job_title || 'N/A',
            company: job.employer_name || 'N/A',
            location: buildLocation(job),
            jobType: formatType(job.job_employment_type),
            salary: formatSalary(job),
            applyLink: job.job_apply_link || job.job_google_link || '#',
            source: job.job_publisher || 'JSearch',
            logo: job.employer_logo || null,
            posted: job.job_posted_at_datetime_utc
                ? timeAgo(new Date(job.job_posted_at_datetime_utc))
                : 'Recent',
            description: ((job.job_description || '')
                .replace(/[\r\n]+/g, ' ')
                .trim()
                .slice(0, 220)) + '...',
            isRemote: job.job_is_remote || false,
        }));

        return res.json({
            total: jobs.length,
            page: parseInt(page),
            source: source === 'all' ? 'All Sources' : cap(source),
            jobs,
        });

    } catch (err) {
        console.error('Server error:', err.message);
        return res.status(500).json({ error: 'Internal server error.' });
    }
});

// ── Helpers ───────────────────────────────────────────────────

function buildLocation(job) {
    const parts = [job.job_city, job.job_state, job.job_country].filter(Boolean);
    return parts.length ? parts.join(', ') : 'N/A';
}

function formatType(t) {
    return { FULLTIME: 'Full-Time', PARTTIME: 'Part-Time', INTERN: 'Internship', CONTRACTOR: 'Contract' }[
        (t || '').toUpperCase()
    ] || t || 'N/A';
}

function formatSalary(job) {
    if (job.job_min_salary && job.job_max_salary) {
        const cur = job.job_salary_currency || 'USD';
        const per = (job.job_salary_period || 'YEAR').toLowerCase();
        return `${cur} ${Math.round(job.job_min_salary).toLocaleString()}–${Math.round(job.job_max_salary).toLocaleString()} / ${per}`;
    }
    return 'Not disclosed';
}

function timeAgo(date) {
    const s = Math.floor((Date.now() - date) / 1000);
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
    return date.toLocaleDateString('en-IN');
}

function cap(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n✅  Server running → http://localhost:${PORT}`);
    console.log(`    JSearch API  : ${JSEARCH_KEY ? '✓ configured' : '✗ missing JSEARCH_API_KEY in .env'}\n`);
});
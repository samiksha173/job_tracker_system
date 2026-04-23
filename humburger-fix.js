/* ══════════════════════════════════════════════════════
   hamburger-fix.js
   ──────────────────────────────────────────────────────
   OPTION A: Include as a separate file
   <script src="hamburger-fix.js" defer></script>

   OPTION B: Paste the contents of initHamburger()
   into the DOMContentLoaded block of each page's
   existing plain <script>.

   This replaces the broken hamburger pattern
   (hb?.addEventListener without stopPropagation)
   across ALL your pages.
   ══════════════════════════════════════════════════════ */

function initHamburger() {
    const hb = document.getElementById("hamburger");
    const mn = document.getElementById("mobileNav");

    if (!hb || !mn) return;

    /* Toggle on hamburger click */
    hb.addEventListener("click", function (e) {
        e.stopPropagation();                   /* prevent document click firing */
        hb.classList.toggle("open");
        mn.classList.toggle("open");
    });

    /* Close when clicking outside both hamburger and nav */
    document.addEventListener("click", function (e) {
        if (!hb.contains(e.target) && !mn.contains(e.target)) {
            hb.classList.remove("open");
            mn.classList.remove("open");
        }
    });

    /* Close when any link or button inside mobile nav is tapped */
    mn.querySelectorAll("a, button").forEach(function (el) {
        el.addEventListener("click", function () {
            hb.classList.remove("open");
            mn.classList.remove("open");
        });
    });
}

/* Run after DOM is ready */
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initHamburger);
} else {
    initHamburger();
}



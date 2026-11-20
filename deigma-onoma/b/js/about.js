/* «Σχετικά με την εφαρμογή»: όνομα, έκδοση, δημιουργός, πνευματικά δικαιώματα (απόφαση Πασχάλη 15/11/2026).
   Ανοίγει από το μικρό λογότυπο πάνω αριστερά στην Αρχική (js/pages/home.js). Το λογότυπο το δίνει μόνο αυτό το αρχείο (PL.about.logo).
   ΕΚΔΟΣΗ: σε κάθε δημοσίευση του Sales 2.0 ο αριθμός γίνεται ίδιος με την έκδοση του artifact.
   Στο δοκιμαστικό demo (δημόσιο) το ίδιο αρχείο έχει όνομα χωρίς επώνυμο και «Δοκιμαστική έκδοση». */
(function () {
  const PL = window.PL, esc = PL.u.esc;
  const APP = {
    name: 'Sales',
    sub: '2.0',
    version: 'Δοκιμαστική έκδοση',
    build: '',   // πότε ενημερώθηκε η έκδοση που τρέχει· τη συμπληρώνει όποιος την ξέρει (στο demo το lab/offline, από το sw.js)
    owner: 'Πασχάλης Π.',
    year: 2026,
  };
  /* το εικονίδιο της εφαρμογής (ίδιο με την οθόνη εισόδου και το εικονίδιο στο κινητό) */
  const logo = () => '<svg viewBox="0 0 34 34" aria-hidden="true"><rect width="34" height="34" rx="9" fill="#2f6f5e"/><rect x="8" y="19" width="5" height="8" rx="1.5" fill="#fff"/><rect x="14.5" y="14" width="5" height="13" rx="1.5" fill="#fff"/><rect x="21" y="8" width="5" height="19" rx="1.5" fill="#8fe3c6"/></svg>';

  function open() {
    if (document.getElementById('about')) return;
    const o = document.createElement('div'); o.id = 'about'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true'); o.setAttribute('aria-labelledby', 'abt');
    o.innerHTML = `<div class="abb">${logo()}<h2 id="abt">${esc(APP.name)}<small>${esc(APP.sub)}</small></h2><p class="abv">${esc(APP.version)}</p>` + (APP.build ? `<p class="abv abd">${esc(APP.build)}</p>` : '') +
      `<div class="abl"></div><p class="abk">ΙΔΕΑ, ΣΧΕΔΙΑΣΜΟΣ ΚΑΙ ΑΝΑΠΤΥΞΗ</p><p class="abo">${esc(APP.owner)}</p><div class="abl"></div>` +
      `<p class="abc">© ${APP.year} · Με την επιφύλαξη παντός δικαιώματος</p><button type="button" class="abx">Κλείσιμο</button></div>`;
    const close = () => { o.classList.remove('on'); document.removeEventListener('keydown', key); setTimeout(() => o.remove(), 200); };
    const key = (e) => { if (e.key === 'Escape') close(); };
    o.addEventListener('click', (e) => { if (e.target === o || e.target.closest('.abx')) close(); });
    document.addEventListener('keydown', key);
    document.body.appendChild(o);
    requestAnimationFrame(() => requestAnimationFrame(() => o.classList.add('on')));
    o.querySelector('.abx').focus();
  }

  PL.about = { APP, logo, open };
})();

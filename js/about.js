/* «Σχετικά με την εφαρμογή»: όνομα, έκδοση, δημιουργός, πνευματικά δικαιώματα (απόφαση Πασχάλη 15/11/2026).
   Ανοίγει από το μικρό λογότυπο πάνω αριστερά στην Αρχική (js/pages/home.js). Το λογότυπο το δίνει μόνο αυτό το αρχείο (PL.about.logo).
   ΕΚΔΟΣΗ: σε κάθε δημοσίευση του Sales 2.0 ο αριθμός γίνεται ίδιος με την έκδοση του artifact.
   Στο δοκιμαστικό demo (δημόσιο) το ίδιο αρχείο έχει «Δοκιμαστική έκδοση». Το πλήρες όνομα του δημιουργού και το κείμενο
   πνευματικής ιδιοκτησίας (RIGHTS) φαίνονται σε όλες τις εφαρμογές (απόφαση Πασχάλη 28/11/2026)· σύντομη γραμμή (PL.about.line)
   και στην οθόνη εισόδου (lab/team/team.js). */
(function () {
  const PL = window.PL, esc = PL.u.esc;
  const APP = {
    name: 'Sales',
    sub: '2.0',
    version: 'Δοκιμαστική έκδοση',
    build: '',   // πότε ενημερώθηκε η έκδοση που τρέχει· τη συμπληρώνει όποιος την ξέρει (στο demo το lab/offline, από το sw.js)
    owner: 'Πασχάλης Περλής',
    year: 2026,
  };
  /* κείμενο πνευματικής ιδιοκτησίας (ενημερωτικό· για επίσημη χρήση να το δει δικηγόρος) */
  const RIGHTS = ['Ιδέα, σχεδιασμός, ανάπτυξη και πνευματική ιδιοκτησία: ' + APP.owner + '.',
    'Η εφαρμογή, ο κώδικας, ο σχεδιασμός και το περιεχόμενό της προστατεύονται από τον Ν. 2121/1993 περί πνευματικής ιδιοκτησίας και τις διεθνείς συμβάσεις.',
    'Απαγορεύεται η αντιγραφή, αναπαραγωγή, τροποποίηση, διανομή ή εμπορική εκμετάλλευση, εν όλω ή εν μέρει, χωρίς την προηγούμενη έγγραφη άδεια του δημιουργού.'];
  const line = () => '© ' + APP.year + ' ' + APP.owner + '. Με την επιφύλαξη παντός δικαιώματος.';
  /* το εικονίδιο της εφαρμογής (ίδιο με την οθόνη εισόδου και το εικονίδιο στο κινητό) */
  const logo = () => '<svg viewBox="0 0 34 34" aria-hidden="true"><rect width="34" height="34" rx="9" fill="#2f6f5e"/><rect x="8" y="19" width="5" height="8" rx="1.5" fill="#fff"/><rect x="14.5" y="14" width="5" height="13" rx="1.5" fill="#fff"/><rect x="21" y="8" width="5" height="19" rx="1.5" fill="#8fe3c6"/></svg>';

  function open() {
    if (document.getElementById('about')) return;
    const o = document.createElement('div'); o.id = 'about'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true'); o.setAttribute('aria-labelledby', 'abt');
    o.innerHTML = `<div class="abb">${logo()}<h2 id="abt">${esc(APP.name)}<small>${esc(APP.sub)}</small></h2><p class="abv">${esc(APP.version)}</p>` + (APP.build ? `<p class="abv abd">${esc(APP.build)}</p>` : '') +
      `<div class="abl"></div><p class="abk">ΙΔΕΑ, ΣΧΕΔΙΑΣΜΟΣ ΚΑΙ ΑΝΑΠΤΥΞΗ</p><p class="abo">${esc(APP.owner)}</p><div class="abl"></div>` +
      `<p class="abc"><b>${esc(line())}</b></p>${RIGHTS.slice(1).map((t) => `<p class="abr">${esc(t)}</p>`).join('')}<button type="button" class="abx">Κλείσιμο</button></div>`;
    const close = () => { o.classList.remove('on'); document.removeEventListener('keydown', key); setTimeout(() => o.remove(), 200); };
    const key = (e) => { if (e.key === 'Escape') close(); };
    o.addEventListener('click', (e) => { if (e.target === o || e.target.closest('.abx')) close(); });
    document.addEventListener('keydown', key);
    document.body.appendChild(o);
    requestAnimationFrame(() => requestAnimationFrame(() => o.classList.add('on')));
    o.querySelector('.abx').focus();
  }

  PL.about = { APP, RIGHTS, line, logo, open };
})();

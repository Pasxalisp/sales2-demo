/* Η ΕΦΑΡΜΟΓΗ ΧΩΡΙΣ ΙΝΤΕΡΝΕΤ (απόφαση 18/11/2026): γράφει τη σελίδα στο sw.js (service worker, το φτιάχνει το demo/build_site.mjs),
   που κρατά τα αρχεία της εφαρμογής στη συσκευή. Μόνο στη δοκιμαστική σελίδα (GitHub Pages), όχι στο Sales 2.0 του claude.ai.
   Νέα έκδοση: κατεβαίνει ολόκληρη στο παρασκήνιο και μπαίνει
   - τη στιγμή που ανοίγει η εφαρμογή, πριν γράψεις οτιδήποτε (μία γρήγορη επαναφόρτωση), ή
   - όσο δουλεύεις, ΜΟΝΟ όταν πατήσεις «Ανανέωση» στη μπάρα «Νέα έκδοση» (απόφαση 18/11, Β8). Ποτέ μόνη της στη μέση της δουλειάς.
   Η εφαρμογή ελέγχει για νέα έκδοση όταν ανοίγει, όταν ξαναφαίνεται (π.χ. ξεκλείδωμα κινητού) και κάθε ώρα.
   Εμφάνιση: lab/offline/offline.css. */
(function () {
  const SW = navigator.serviceWorker;
  if (!SW || !(location.protocol === 'https:' || location.hostname === 'localhost')) return;
  const HOUR = 3600000;
  let shown = null;
  /* ενεργοποίηση της έκδοσης που περιμένει και επαναφόρτωση (τα μισογραμμένα τα κρατά το js/drafts.js στο κλείσιμο της σελίδας) */
  const activate = (w) => { SW.addEventListener('controllerchange', () => location.reload(), { once: true }); w.postMessage('pl-skip'); };
  function offer(w) {
    if (shown) return;
    const bar = document.createElement('div'); bar.id = 'plupd'; bar.setAttribute('role', 'status');
    bar.innerHTML = '<span>Νέα έκδοση της εφαρμογής</span><button type="button" class="pri" id="plupdgo">Ανανέωση</button><button type="button" id="plupdx" aria-label="Αργότερα">✕</button>';
    bar.addEventListener('click', (ev) => {
      if (ev.target.closest('#plupdgo')) { ev.target.closest('#plupdgo').disabled = true; activate(w); }
      else if (ev.target.closest('#plupdx')) { bar.remove(); }   // μπαίνει την επόμενη φορά που ανοίγει η εφαρμογή
    });
    document.body.appendChild(bar); shown = bar;
  }
  addEventListener('load', () => {
    SW.register('sw.js').then((reg) => {
      if (reg.waiting && SW.controller) { activate(reg.waiting); return; }   // περίμενε από την προηγούμενη φορά: μπαίνει τώρα, στο άνοιγμα
      /* νέα έκδοση που κατέβηκε όσο δουλεύεις: η μπάρα (μόνο αν υπάρχει ήδη έκδοση στη συσκευή, όχι στην πρώτη εγκατάσταση) */
      reg.addEventListener('updatefound', () => {
        const w = reg.installing; if (!w) return;
        w.addEventListener('statechange', () => { if (w.state === 'installed' && SW.controller) offer(w); });
      });
      const check = () => { reg.update().catch(() => {}); };   // χωρίς ίντερνετ απλώς δεν βρίσκει
      check();
      document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
      setInterval(check, HOUR);
    }, () => { /* χωρίς service worker η εφαρμογή δουλεύει κανονικά, μόνο με ίντερνετ */ });
  });
})();

/* Η ΕΦΑΡΜΟΓΗ ΧΩΡΙΣ ΙΝΤΕΡΝΕΤ (απόφαση 18/11/2026): γράφει τη σελίδα στο sw.js (service worker, το φτιάχνει το demo/build_site.mjs),
   που κρατά τα αρχεία της εφαρμογής στη συσκευή. Μόνο στη δοκιμαστική σελίδα (GitHub Pages), όχι στο Sales 2.0 του claude.ai.
   Νέα έκδοση: κατεβαίνει ολόκληρη στο παρασκήνιο και μπαίνει
   - τη στιγμή που ανοίγει η σελίδα, πριν γράψεις οτιδήποτε (μία γρήγορη επαναφόρτωση), ή
   - όσο δουλεύεις, ΜΟΝΟ όταν πατήσεις «Ανανέωση» στη μπάρα «Νέα έκδοση» (απόφαση 18/11, Β8). Ποτέ μόνη της στη μέση της δουλειάς.
   Η μπάρα βγαίνει όποια στιγμή κι αν κατέβει η νέα έκδοση (και την ώρα που φορτώνει η σελίδα), και ξαναβγαίνει κάθε φορά που
   η εφαρμογή ξαναφαίνεται ενώ περιμένει νέα έκδοση (και αν είχες πατήσει ✕): στο iPhone η εφαρμογή από την οθόνη Αφετηρίας
   σχεδόν ποτέ δεν ξεκινά από την αρχή, απλώς ξαναφαίνεται (διόρθωση 19/11).
   Έλεγχος για νέα έκδοση: όταν ανοίγει, όταν ξαναφαίνεται (π.χ. ξεκλείδωμα κινητού) και κάθε ώρα (κοινός χρονομετρητής PL.tick).
   «Σχετικά»: η ημερομηνία της έκδοσης που τρέχει (από το sw.js) στο PL.about.APP.build.
   Εμφάνιση: lab/offline/offline.css. */
(function () {
  const SW = navigator.serviceWorker, PL = window.PL;
  if (!SW || !(location.protocol === 'https:' || location.hostname === 'localhost')) return;
  let bar = null;
  /* ενεργοποίηση της έκδοσης που περιμένει και επαναφόρτωση (τα μισογραμμένα τα κρατά το js/drafts.js στο κλείσιμο της σελίδας) */
  const activate = (w) => { SW.addEventListener('controllerchange', () => location.reload(), { once: true }); w.postMessage('pl-skip'); };
  function offer(w) {
    if (bar || !SW.controller) return;   // όχι στην πρώτη εγκατάσταση (δεν υπάρχει παλιά έκδοση)
    bar = document.createElement('div'); bar.id = 'plupd'; bar.setAttribute('role', 'status');
    bar.innerHTML = '<span>Νέα έκδοση της εφαρμογής</span><button type="button" class="pri" id="plupdgo">Ανανέωση</button><button type="button" id="plupdx" aria-label="Αργότερα">✕</button>';
    bar.addEventListener('click', (ev) => {
      if (ev.target.closest('#plupdgo')) { ev.target.closest('#plupdgo').disabled = true; activate(w); }
      else if (ev.target.closest('#plupdx')) { bar.remove(); bar = null; }   // ξαναβγαίνει όταν η εφαρμογή ξαναφανεί
    });
    document.body.appendChild(bar);
  }
  /* μια έκδοση που κατεβαίνει: η μπάρα μόλις ολοκληρωθεί */
  function track(w) {
    if (!w) return;
    if (w.state === 'installed') { offer(w); return; }
    w.addEventListener('statechange', () => { if (w.state === 'installed') offer(w); });
  }
  /* η έκδοση που τρέχει: ημερομηνία στα «Σχετικά» */
  function stamp() {
    const c = SW.controller; if (!c || !PL || !PL.about) return;
    const ch = new MessageChannel();
    ch.port1.onmessage = (ev) => { const b = ev.data && ev.data.built; if (b) PL.about.APP.build = 'Ενημέρωση ' + b; };
    c.postMessage('pl-version', [ch.port2]);
  }
  SW.addEventListener('controllerchange', stamp);

  addEventListener('load', () => {
    SW.register('sw.js').then((reg) => {
      if (reg.waiting && SW.controller) { activate(reg.waiting); return; }   // περίμενε από πριν: μπαίνει τώρα, στο άνοιγμα
      stamp();
      track(reg.installing);   // κατεβαίνει ήδη (ξεκίνησε μαζί με τη σελίδα)
      reg.addEventListener('updatefound', () => track(reg.installing));
      const check = () => { reg.update().catch(() => {}); };   // χωρίς ίντερνετ απλώς δεν βρίσκει
      check();
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) return;
        if (reg.waiting) offer(reg.waiting);
        check();
      });
      if (PL && PL.tick) PL.tick.add(check, 3600);
    }, () => { /* χωρίς service worker η εφαρμογή δουλεύει κανονικά, μόνο με ίντερνετ */ });
  });
})();

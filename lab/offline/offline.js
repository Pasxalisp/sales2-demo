/* Η ΕΦΑΡΜΟΓΗ ΧΩΡΙΣ ΙΝΤΕΡΝΕΤ (απόφαση 18/11/2026): γράφει τη σελίδα στο sw.js (service worker, το φτιάχνει το demo/build_site.mjs),
   που κρατά τα αρχεία της εφαρμογής στη συσκευή. Μόνο στη δοκιμαστική σελίδα (GitHub Pages), όχι στο Sales 2.0 του claude.ai.
   Νέα έκδοση: κατεβαίνει στο παρασκήνιο όσο δουλεύεις και μπαίνει την επόμενη φορά που ανοίγει η εφαρμογή — τη στιγμή που
   ανοίγει, πριν γράψεις οτιδήποτε (μία γρήγορη επαναφόρτωση). Ποτέ στη μέση της δουλειάς. */
(function () {
  const SW = navigator.serviceWorker;
  if (!SW || !(location.protocol === 'https:' || location.hostname === 'localhost')) return;
  addEventListener('load', () => {
    SW.register('sw.js').then((reg) => {
      if (reg.waiting && SW.controller) {   // νέα έκδοση περιμένει από την προηγούμενη φορά: μπαίνει τώρα
        SW.addEventListener('controllerchange', () => location.reload(), { once: true });
        reg.waiting.postMessage('pl-skip');
        return;
      }
      reg.update().catch(() => {});   // έλεγχος για νέα έκδοση (χωρίς ίντερνετ απλώς δεν βρίσκει)
    }, () => { /* χωρίς service worker η εφαρμογή δουλεύει κανονικά, μόνο με ίντερνετ */ });
  });
})();

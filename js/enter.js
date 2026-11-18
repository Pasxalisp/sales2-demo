/* ΕΜΦΑΝΙΣΗ ΝΕΑΣ ΣΕΛΙΔΑΣ (από το δείγμα «Κίνηση» της 17/11· εγκρίθηκε 18/11, σε όλες τις εφαρμογές):
   - τάμπλετ/υπολογιστής: τα κουτιά της σελίδας ανεβαίνουν λίγο και φανερώνονται ένα ένα (έως 14, όλα σε ≈0,8″)·
   - παντού: οι μπάρες των γραφημάτων μεγαλώνουν (μόνο CSS, με την κλάση .pgnew της σελίδας: css/charts.css).
   Μόνο όταν η σελίδα ανοίγει «προς τα μέσα» ή από την κάτω μπάρα / Αρχική — όχι στο «Πίσω», στο σύρσιμο ή στη στροφή οθόνης.
   Το core.js (show) καλεί PL.enter.play(σελίδα, τρόπος) για κάθε σελίδα που μπαίνει (στο τάμπλετ: λίστα ή λεπτομέρεια).
   Μόνο transform/opacity (τα κάνει η κάρτα γραφικών). Με «Μείωση κίνησης» τίποτα. Εμφάνιση: css/base.css («Εμφάνιση κουτιών»). */
(function () {
  const PL = window.PL;
  const REDUCE = matchMedia('(prefers-reduced-motion: reduce)');
  const NEW_MS = 1500;    // όσο η σελίδα θεωρείται «μόλις άνοιξε» (κουτιά και μπάρες που γράφονται λίγο μετά)
  const MAX = 14, LATE_MS = 700, SKIP = '.pnav, br, script, style, template';   // η καθυστέρηση ανάμεσα στα κουτιά (35ms): css/base.css
  const OPEN = new Set(['push', 'tab']);

  /* Ποια κουτιά κινούνται: τα παιδιά της σελίδας που φαίνονται στην οθόνη. Όσα είναι απλά «περιτυλίγματα» (χωρίς δικό τους
     φόντο, πλαίσιο, σκιά ή κείμενο, π.χ. το πλέγμα με τα πλακίδια της Αρχικής) ανοίγουν και κινούνται τα παιδιά τους (έως 3 επίπεδα).
     Κάρτες, κουτιά και κουμπιά κινούνται ολόκληρα. Η πάνω γραμμή της σελίδας («‹ Πίσω», •••) μένει ακίνητη. */
  const visible = (x) => { const r = x.getBoundingClientRect(); return r.height > 4 && r.top < innerHeight && r.bottom > 0; };
  const plain = (c) => {
    const s = getComputedStyle(c), bg = s.backgroundColor;
    return (bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)') && s.backgroundImage === 'none' && !parseFloat(s.borderTopWidth) && !parseFloat(s.borderLeftWidth) && s.boxShadow === 'none';
  };
  const ownText = (c) => [...c.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
  const tall = (c) => c.getBoundingClientRect().height > innerHeight * 0.6;   // πιάνει σχεδόν όλη την οθόνη: είναι η σελίδα, όχι κουτί (π.χ. #home)
  const wrapper = (c) => c.childElementCount >= 2 && /^(DIV|SECTION|HEADER|FORM|UL)$/.test(c.tagName) && !ownText(c) && (tall(c) || plain(c));
  function boxes(node, out, depth) {
    for (const c of node.children) {
      if (out.length >= MAX) return;
      if (c.matches(SKIP) || !visible(c)) continue;
      if (depth < 3 && wrapper(c)) boxes(c, out, depth + 1); else out.push(c);
    }
  }

  function play(page, how) {
    if (!page || !OPEN.has(how) || REDUCE.matches) return;
    page.classList.add('pgnew');
    let moved = [], late = null;
    if (PL.WIDE.matches) {
      const t0 = performance.now();
      const mark = (list) => list.forEach((b) => { b.style.setProperty('--pgi', moved.length); b.classList.add('pgbox'); moved.push(b); });
      const room = () => { moved = moved.filter((b) => b.isConnected); return MAX - moved.length; };   // όσα ξαναγράφτηκαν δεν μετράνε
      const first = []; boxes(page, first, 0); mark(first);
      /* σελίδες που γράφουν το περιεχόμενό τους λίγο μετά το άνοιγμα (π.χ. «Πρόγραμμα»): κινούνται κι αυτά, αν προλάβουν */
      late = new MutationObserver((ms) => {
        if (performance.now() - t0 > LATE_MS) { late.disconnect(); return; }
        ms.forEach((m) => m.addedNodes.forEach((n) => {
          if (n.nodeType !== 1 || !n.isConnected || n.closest('.pgbox') || n.matches(SKIP) || !visible(n)) return;
          const free = room(); if (free <= 0) return;
          const add = []; if (wrapper(n)) boxes(n, add, 1); else add.push(n);
          mark(add.slice(0, free));
        }));
      });
      late.observe(page, { childList: true, subtree: true });
    }
    setTimeout(() => {
      if (late) late.disconnect();
      page.classList.remove('pgnew');
      moved.forEach((b) => { b.classList.remove('pgbox'); b.style.removeProperty('--pgi'); });
    }, NEW_MS);
  }
  PL.enter = { play };
})();

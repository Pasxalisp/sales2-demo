/* ΔΕΙΓΜΑ «Κίνηση» (πρόταση 17/11/2026, μόνο στη σελίδα kinisi.html του demo — ό,τι εγκριθεί περνά στις εφαρμογές, τα άλλα σβήνονται).
   Μικρές κινήσεις, χωρίς βιβλιοθήκη, μόνο με transform/opacity (τις κάνει η κάρτα γραφικών, δεν βαραίνουν):
   1. (Η σελίδα από δεξιά στο κινητό εγκρίθηκε 17/11 και είναι πια στο κανονικό: js/slide.js.)
   2. Τάμπλετ/υπολογιστής: τα κουτιά της νέας σελίδας ανεβαίνουν λίγο και φανερώνονται ένα ένα (έως 14, όλα σε ≈0,8″).
   3. Μπάρες γραφημάτων που μεγαλώνουν (μόνο CSS, css/motion.css).
   (Οι αριθμοί που μετρούσαν από το 0 αφαιρέθηκαν 17/11: «κουραστικό».)
   (Το πλαίσιο που γλιστράει στην κάτω μπάρα εγκρίθηκε 17/11 και είναι πια στο κανονικό: js/core.js, css/base.css.)
   Με «Μείωση κίνησης» στο κινητό δεν παίζει τίποτα. Οι εμφανίσεις: css/motion.css. */
(function () {
  const PL = window.PL; if (!PL || !PL.bus || !PL.nav) return;
  const REDUCE = matchMedia('(prefers-reduced-motion: reduce)'), still = () => REDUCE.matches;
  const ENTER_MS = 1500;   // όσο η σελίδα θεωρείται «μόλις άνοιξε» (κουτιά και μπάρες που φτάνουν λίγο μετά)

  /* ---------- 1–2. Εμφάνιση νέας σελίδας ---------- */
  /* Ποια κουτιά κινούνται: τα παιδιά της σελίδας που φαίνονται στην οθόνη· όσα είναι απλά «περιτυλίγματα» (χωρίς δικό τους
     φόντο, πλαίσιο, σκιά ή δικό τους κείμενο, π.χ. το πλέγμα με τα πλακίδια της Αρχικής) ανοίγουν και κινούνται τα παιδιά τους
     (έως 3 επίπεδα).
     Κάρτες, κουτιά και κουμπιά κινούνται ολόκληρα. Η πάνω γραμμή της σελίδας («‹ Πίσω», •••) μένει ακίνητη. */
  const MAX = 14, LATE_MS = 700, SKIP = '.pnav, br, script, style, template';   // η καθυστέρηση ανάμεσα στα κουτιά (35ms): css/motion.css
  const visible = (x) => { const r = x.getBoundingClientRect(); return r.height > 4 && r.top < innerHeight && r.bottom > 0; };
  const plain = (c) => {
    const s = getComputedStyle(c), bg = s.backgroundColor;
    return (bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)') && s.backgroundImage === 'none' && !parseFloat(s.borderTopWidth) && !parseFloat(s.borderLeftWidth) && s.boxShadow === 'none';
  };
  const ownText = (c) => [...c.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());   // κείμενο κατευθείαν μέσα του: κινείται ολόκληρο
  const tall = (c) => c.getBoundingClientRect().height > innerHeight * 0.6;   // πιάνει σχεδόν όλη την οθόνη: είναι η σελίδα, όχι κουτί (π.χ. #home)
  const wrapper = (c) => c.childElementCount >= 2 && /^(DIV|SECTION|HEADER|FORM|UL)$/.test(c.tagName) && !ownText(c) && (tall(c) || plain(c));
  function boxes(node, out, depth) {
    for (const c of node.children) {
      if (out.length >= MAX) return;
      if (c.matches(SKIP) || !visible(c)) continue;
      if (depth < 3 && wrapper(c)) boxes(c, out, depth + 1); else out.push(c);
    }
  }
  /* «Πίσω»: τα κουτιά δεν ξαναπαίζουν */
  let goingBack = false;
  const back0 = PL.nav.back;
  PL.nav.back = function () { goingBack = true; try { return back0.apply(this, arguments); } finally { goingBack = false; } };
  const phone = () => !PL.WIDE.matches;

  function enter(page) {
    page.dataset.mv = '1';
    if (still()) return;
    if (phone()) {   // κινητό: η σελίδα έρχεται ολόκληρη από δεξιά (κανονικό πια, js/slide.js)· εδώ μόνο οι μπάρες
      page.classList.add('mv-in');
      setTimeout(() => page.classList.remove('mv-in'), ENTER_MS);
      return;
    }
    if (goingBack) return;
    page.classList.add('mv-in');
    let moved = []; const t0 = performance.now();
    const play = (list) => list.forEach((b) => { b.style.setProperty('--mv-i', moved.length); b.classList.add('mv-b'); moved.push(b); });
    const room = () => { moved = moved.filter((b) => b.isConnected); return MAX - moved.length; };   // όσα ξαναγράφτηκαν δεν μετράνε
    const first = []; boxes(page, first, 0); play(first);
    /* σελίδες που γράφουν το περιεχόμενό τους λίγο μετά το άνοιγμα (π.χ. «Πρόγραμμα»): κινούνται κι αυτά, αν προλάβουν */
    const late = new MutationObserver((ms) => {
      if (performance.now() - t0 > LATE_MS) { late.disconnect(); return; }
      ms.forEach((m) => m.addedNodes.forEach((n) => {
        if (n.nodeType !== 1 || !n.isConnected || n.closest('.mv-b') || n.matches(SKIP) || !visible(n)) return;
        const free = room(); if (free <= 0) return;
        const add = []; if (wrapper(n)) boxes(n, add, 1); else add.push(n);
        play(add.slice(0, free));
      }));
    });
    late.observe(page, { childList: true, subtree: true });
    setTimeout(() => {
      late.disconnect(); page.classList.remove('mv-in');
      moved.forEach((b) => { b.classList.remove('mv-b'); b.style.removeProperty('--mv-i'); });
    }, ENTER_MS);
  }
  PL.bus.on('page', () => document.querySelectorAll('#app > .page:not([data-mv])').forEach(enter));

})();

/* ΔΕΙΓΜΑ «Κίνηση» (πρόταση 17/11/2026, μόνο στη σελίδα kinisi.html του demo — αν εγκριθεί περνά στις εφαρμογές, αλλιώς σβήνεται).
   Τέσσερις μικρές κινήσεις, χωρίς βιβλιοθήκη, μόνο με transform/opacity (τις κάνει η κάρτα γραφικών, δεν βαραίνουν):
   1. Νέα σελίδα: τα κουτιά της ανεβαίνουν λίγο και φανερώνονται ένα ένα (μόνο όσα φαίνονται στην οθόνη, έως 14, όλα σε ≈0,8″).
      Όχι όταν γυρνάς «Πίσω»· τίποτα όσο κυλάς ή όταν ανανεώνονται τα δεδομένα.
   2. Αριθμοί που μετράνε από το 0 (πλακίδια Αρχικής, FLASH, Τζίρος, Πωλήσεις), μία φορά όταν ανοίγει η σελίδα.
   3. Μπάρες γραφημάτων που μεγαλώνουν (μόνο CSS, css/motion.css).
   4. Το πλαίσιο της κάτω μπάρας γλιστράει στη νέα ενότητα αντί να πηδάει.
   Με «Μείωση κίνησης» στο κινητό δεν παίζει τίποτα. Οι εμφανίσεις: css/motion.css. */
(function () {
  const PL = window.PL; if (!PL || !PL.bus || !PL.nav) return;
  const REDUCE = matchMedia('(prefers-reduced-motion: reduce)'), still = () => REDUCE.matches;
  const ENTER_MS = 1500;   // όσο η σελίδα θεωρείται «μόλις άνοιξε» (κουτιά, μπάρες, αριθμοί που φτάνουν λίγο μετά)

  /* ---------- 1. Εμφάνιση νέας σελίδας ---------- */
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
  let goingBack = false;
  const back = PL.nav.back;
  PL.nav.back = function () { goingBack = true; try { return back.apply(this, arguments); } finally { goingBack = false; } };

  function enter(page) {
    page.dataset.mv = '1';
    if (still() || goingBack) return;
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
    const stop = watchNumbers(page);
    setTimeout(() => {
      late.disconnect(); stop(); page.classList.remove('mv-in');
      moved.forEach((b) => { b.classList.remove('mv-b'); b.style.removeProperty('--mv-i'); });
    }, ENTER_MS);
  }
  PL.bus.on('page', () => document.querySelectorAll('#app > .page:not([data-mv])').forEach(enter));

  /* ---------- 2. Αριθμοί που μετράνε ---------- */
  const NUMBERS = '.tl .ts, .hero, .flhero, .flgrid b, .slk .v, .uskpi b, .hubn';
  const TOKEN = /\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:,\d+)?/g;   // ελληνική γραφή: 12.345,67
  const done = new WeakSet(), mine = new WeakMap();
  const parse = (t) => +t.replace(/\./g, '').replace(',', '.');
  const fmt = (v, t) => { const dec = (t.split(',')[1] || '').length; return v.toLocaleString('el-GR', { minimumFractionDigits: dec, maximumFractionDigits: dec, useGrouping: t.includes('.') || v >= 10000 }); };
  function count(el) {
    if (done.has(el) || !el.isConnected) return;
    const text = el.textContent, parts = text.split(TOKEN), nums = text.match(TOKEN);
    if (!nums || nums.every((n) => parse(n) === 0)) return;
    done.add(el);
    const t0 = performance.now(), D = 650;
    const step = (now) => {
      if (!el.isConnected || (mine.has(el) && el.textContent !== mine.get(el))) { mine.delete(el); return; }   // την άλλαξε ήδη η σελίδα
      const k = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - k, 3);
      const out = k < 1 ? parts.map((p, i) => p + (i < nums.length ? fmt(parse(nums[i]) * e, nums[i]) : '')).join('') : text;
      el.textContent = out; mine.set(el, out);
      if (k < 1) requestAnimationFrame(step); else mine.delete(el);
    };
    requestAnimationFrame(step);
  }
  /* οι αριθμοί που υπάρχουν ήδη, και όσοι γράφονται λίγο μετά (π.χ. η Αρχική όταν φορτώσουν οι πελάτες) */
  function watchNumbers(page) {
    page.querySelectorAll(NUMBERS).forEach(count);
    const obs = new MutationObserver((ms) => ms.forEach((m) => {
      const el = (m.target.nodeType === 1 ? m.target : m.target.parentElement); if (!el || mine.has(el)) return;
      const n = el.closest(NUMBERS); if (n) count(n);
      if (m.type === 'childList') m.addedNodes.forEach((x) => { if (x.nodeType === 1) x.querySelectorAll(NUMBERS).forEach(count); });
    }));
    obs.observe(page, { childList: true, characterData: true, subtree: true });
    return () => obs.disconnect();
  }

  /* ---------- 4. Το πλαίσιο της κάτω μπάρας γλιστράει ---------- */
  let last = null;
  const rel = (b, nav) => { const a = b.getBoundingClientRect(), n = nav.getBoundingClientRect(); return { x: a.left - n.left - nav.clientLeft, y: a.top - n.top - nav.clientTop, w: a.width, h: a.height }; };
  const place = (p, r) => { p.style.width = r.w + 'px'; p.style.height = r.h + 'px'; p.style.transform = `translate(${r.x}px,${r.y}px)`; };
  function slide(nav, from, to) {
    nav.querySelectorAll('.mvpill').forEach((x) => x.remove());
    const p = document.createElement('i'); p.className = 'mvpill'; p.setAttribute('aria-hidden', 'true');
    place(p, from); nav.appendChild(p); nav.classList.add('mv-sliding');
    p.getBoundingClientRect();   // να πάρει πρώτα την παλιά θέση
    p.classList.add('go'); place(p, to);
    setTimeout(() => { p.remove(); if (!nav.querySelector('.mvpill')) nav.classList.remove('mv-sliding'); }, 320);
  }
  PL.bus.on('bar', () => {
    const nav = document.getElementById('nav'), b = nav && nav.querySelector('.nb.on:not(.nmic)'), r = b ? rel(b, nav) : null;
    if (r && last && !still() && !nav.classList.contains('off') && (Math.abs(r.x - last.x) > 1 || Math.abs(r.y - last.y) > 1)) slide(nav, last, r);
    last = r;
  });
})();

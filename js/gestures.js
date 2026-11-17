/* Καθολικές κινήσεις της παλιάς σελίδας: σύρσιμο από την αριστερή άκρη = Πίσω, ✕ καθαρισμού στα πεδία,
   γρήγορη μπάρα κύλισης δεξιά. Δεν αγγίζουν τα δεδομένα.
   Ό,τι ανοίγει με ▸/▾ ΔΕΝ κυλάει τη σελίδα: μένει σταθερή εκεί που ήταν (απόφαση Πασχάλη 11/11). */
(function () {
  const PL = window.PL, SE = () => document.scrollingElement || document.documentElement;
  const modal = () => ['cfm', 'chm', 'callm', 'cel'].some((id) => { const m = document.getElementById(id); return m && m.style.display === 'flex'; });
  const pageEl = () => document.querySelector('#app > .page');

  /* Παρατεταμένο πάτημα (όπως στο Google Calendar): fn(στοιχείο) μετά από ~½″ χωρίς μετακίνηση. Το «κλικ» που ακολουθεί
     δεν μετρά (δεν ανοίγει και η μέρα). Κύλιση ή σύρσιμο ακυρώνει. Χρήση: PL.longPress(ρίζα, 'επιλογέας', fn). */
  PL.longPress = function (root, sel, fn, ms) {
    let tm = 0, x0 = 0, y0 = 0, fired = false;
    const cancel = () => { clearTimeout(tm); tm = 0; };
    root.addEventListener('pointerdown', (e) => {
      const t = e.target.closest(sel); if (!t || (e.pointerType === 'mouse' && e.button !== 0)) return;
      fired = false; x0 = e.clientX; y0 = e.clientY; cancel();
      tm = setTimeout(() => { tm = 0; fired = true; if (navigator.vibrate) navigator.vibrate(15); fn(t); }, ms || 500);
    });
    root.addEventListener('pointermove', (e) => { if (tm && Math.hypot(e.clientX - x0, e.clientY - y0) > 10) cancel(); });
    ['pointerup', 'pointercancel'].forEach((n) => root.addEventListener(n, cancel));
    root.addEventListener('click', (e) => { if (fired && e.target.closest(sel)) { fired = false; e.preventDefault(); e.stopImmediatePropagation(); } }, true);
    root.addEventListener('contextmenu', (e) => { if (e.target.closest(sel)) e.preventDefault(); });   // όχι μενού του κινητού
  };

  /* ✕ μέσα σε κάθε πεδίο κειμένου */
  function clearButton() {
    const x = document.createElement('button'); x.id = 'clrx'; x.type = 'button'; x.setAttribute('aria-label', 'Καθαρισμός'); x.textContent = '✕'; document.body.appendChild(x);
    let el = null;
    const ok = (t) => t && (t.tagName === 'TEXTAREA' || (t.tagName === 'INPUT' && ['text', 'search', ''].includes((t.getAttribute('type') || '').toLowerCase()))) && !t.disabled && !t.readOnly;
    const place = () => {
      if (!el || !el.isConnected || document.activeElement !== el || !el.value) { x.style.display = 'none'; return; }
      const r = el.getBoundingClientRect(); if (!r.width) { x.style.display = 'none'; return; }
      x.style.display = 'flex'; x.style.left = (r.right - 34) + 'px'; x.style.top = (el.tagName === 'TEXTAREA' ? r.top + 6 : r.top + (r.height - 30) / 2) + 'px';
    };
    document.addEventListener('focusin', (e) => { if (ok(e.target)) { el = e.target; place(); } });
    document.addEventListener('focusout', () => setTimeout(place, 0));
    document.addEventListener('input', (e) => { if (e.target === el) place(); }, true);
    document.addEventListener('scroll', place, true); addEventListener('resize', place);
    x.addEventListener('pointerdown', (e) => e.preventDefault()); x.addEventListener('mousedown', (e) => e.preventDefault());
    x.addEventListener('click', () => { if (!el) return; el.value = ''; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); el.focus(); place(); });
  }

  /* σύρσιμο από την αριστερή άκρη = Πίσω */
  function swipeBack() {
    let sx = null, sy = 0, el = null, mv = false;
    document.addEventListener('touchstart', (e) => {
      const t = e.touches[0]; sx = null;
      if (e.touches.length !== 1 || t.clientX > 40 || modal() || PL.nav.depth() < 2) return;
      /* πάτημα σε κουμπί ή πεδίο δεν είναι σύρσιμο: στο τάμπλετ η κάθετη μπάρα (Πίσω, Αρχική…) είναι μέσα στην αριστερή άκρη */
      if (e.target.closest && e.target.closest('#nav,#nvo,button,a,input,textarea,select,label')) return;
      el = pageEl(); if (!el) return; sx = t.clientX; sy = t.clientY; mv = false;
    }, { passive: true });
    document.addEventListener('touchmove', (e) => {
      if (sx == null) return; const t = e.touches[0], dx = t.clientX - sx, dy = Math.abs(t.clientY - sy);
      if (!mv && dy > 12 && dy > dx) { sx = null; el.style.transform = ''; return; }
      if (dx > 8) { mv = true; el.style.transition = 'none'; el.style.transform = 'translateX(' + Math.min(dx, innerWidth) + 'px)'; el.style.boxShadow = '-8px 0 24px rgba(0,0,0,.18)'; }
    }, { passive: true });
    const end = (e) => {
      if (sx == null) return;
      if (!mv) { sx = null; el = null; return; }   /* απλό πάτημα: καμία αλλαγή στη σελίδα, για να μη χάνεται το πάτημα */
      const dx = (e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientX : sx) - sx, x = el, go = mv && dx > 80; sx = null; el = null;
      x.style.transition = 'transform .18s'; x.style.transform = go ? 'translateX(100%)' : '';
      setTimeout(() => { x.style.transition = ''; x.style.transform = ''; x.style.boxShadow = ''; if (go) PL.nav.up({ swiped: true }); }, go ? 170 : 190);
    };
    document.addEventListener('touchend', end); document.addEventListener('touchcancel', end);
  }

  /* γρήγορη μπάρα κύλισης δεξιά, όταν η σελίδα είναι μακριά */
  function fastScroll() {
    const fs = document.createElement('div'); fs.id = 'fs'; fs.setAttribute('aria-hidden', 'true'); fs.innerHTML = '<i></i>'; document.body.appendChild(fs);
    const th = fs.firstChild; let drag = false, off = 0, hideT = null;
    const max = () => SE().scrollHeight - window.innerHeight;
    const place = () => { const m = max(), H = fs.clientHeight, h = th.offsetHeight; th.style.top = (m > 0 ? window.scrollY / m * (H - h) : 0) + 'px'; };
    const check = () => {
      const navOff = document.getElementById('nav') && document.getElementById('nav').classList.contains('off');
      const on = !!(!navOff && PL.nav.current() && PL.nav.current().id !== 'dictate' && SE().scrollHeight > window.innerHeight * 2.5);
      fs.style.display = on ? 'block' : 'none'; if (on) place();
    };
    const act = () => { fs.classList.add('act'); clearTimeout(hideT); hideT = setTimeout(() => fs.classList.remove('act'), 1400); };
    document.addEventListener('scroll', () => { if (drag) return; place(); act(); }, true);
    const go = (y) => { const H = fs.clientHeight, h = th.offsetHeight, p = Math.min(1, Math.max(0, (y - off) / (H - h))); window.scrollTo(0, p * max()); th.style.top = p * (H - h) + 'px'; };
    fs.addEventListener('pointerdown', (e) => {
      check(); e.preventDefault(); drag = true; fs.classList.add('drag', 'act');
      const r = fs.getBoundingClientRect(), tr = th.getBoundingClientRect();
      off = (e.clientY >= tr.top && e.clientY <= tr.bottom) ? e.clientY - tr.top : th.offsetHeight / 2; go(e.clientY - r.top);
      try { fs.setPointerCapture(e.pointerId); } catch (x) { /* τίποτα */ }
    });
    fs.addEventListener('pointermove', (e) => { if (!drag) return; e.preventDefault(); go(e.clientY - fs.getBoundingClientRect().top); });
    const up = () => { if (!drag) return; drag = false; fs.classList.remove('drag'); act(); };
    fs.addEventListener('pointerup', up); fs.addEventListener('pointercancel', up);
    /* ελέγχεται μόνο όταν αλλάζει σελίδα/μπάρα ή το ύψος του περιεχομένου (όχι με χρονόμετρο) */
    PL.bus.on('bar', () => requestAnimationFrame(check));
    new ResizeObserver(() => requestAnimationFrame(check)).observe(document.getElementById('app'));
    window.addEventListener('resize', check); check();
  }

  clearButton(); swipeBack(); fastScroll();
})();

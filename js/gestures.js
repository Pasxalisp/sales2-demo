/* Καθολικές κινήσεις της παλιάς σελίδας: σύρσιμο από την αριστερή άκρη = Πίσω, ✕ καθαρισμού στα πεδία,
   γρήγορη μπάρα κύλισης δεξιά, και κύλιση ώστε να φαίνεται ό,τι ανοίγει με ▸. Δεν αγγίζουν τα δεδομένα. */
(function () {
  const PL = window.PL, SE = () => document.scrollingElement || document.documentElement;
  const modal = () => ['cfm', 'chm', 'callm', 'cel'].some((id) => { const m = document.getElementById(id); return m && m.style.display === 'flex'; });
  const pageEl = () => document.querySelector('#app > .page');

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
      setTimeout(() => { x.style.transition = ''; x.style.transform = ''; x.style.boxShadow = ''; if (go) PL.nav.up(); }, go ? 170 : 190);
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

  /* όταν ανοίγει κάτι συμπτυγμένο (▸), κύλισε ώστε να φαίνεται */
  function revealOnOpen() {
    const AR = /[▸▾▴]/, arrow = (el) => { const m = (el.textContent || '').match(AR); return m ? m[0] : ''; };
    const label = (el) => (el.textContent || '').replace(/[▸▾▴]/g, '').replace(/\s+/g, ' ').trim();
    const key = (el) => {
      if (el.id) return '#' + CSS.escape(el.id);
      const ds = [...el.attributes].filter((x) => x.name.startsWith('data-'));
      return ds.length ? el.tagName.toLowerCase() + ds.map((x) => '[' + x.name + '="' + CSS.escape(x.value) + '"]').join('') : null;
    };
    const reveal = (el) => { const r = el.getBoundingClientRect(); if (r.top > window.innerHeight * 0.3 || r.top < 0) { el.style.scrollMarginTop = '10px'; el.scrollIntoView({ block: 'start', behavior: 'smooth' }); } };
    document.addEventListener('click', (ev) => {
      const el = ev.target.closest('button,[data-mo],[role=button],.card,summary'); if (!el || el.tagName === 'SUMMARY') return;
      const b = arrow(el); if (b !== '▸' && b !== '▾') return;
      const k = key(el), lb = label(el), root = el.closest('.page') || document.body;
      setTimeout(() => {
        let n = el.isConnected ? el : null;
        if (!n && k) { try { n = root.querySelector(k) || document.querySelector(k); } catch (e) { /* τίποτα */ } }
        if (!n) n = [...root.querySelectorAll('button,.card,[role=button]')].find((x) => label(x) === lb && arrow(x));
        if (!n) return; const a = arrow(n);
        if ((b === '▸' && a === '▾') || (b === '▾' && a === '▴')) reveal(n);
      }, 90);
    });
    document.addEventListener('toggle', (ev) => { const d = ev.target; if (d.tagName === 'DETAILS' && d.open) { const sm = d.querySelector('summary') || d; setTimeout(() => reveal(sm), 30); } }, true);
  }

  clearButton(); swipeBack(); fastScroll(); revealOnOpen();
})();

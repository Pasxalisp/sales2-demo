/* Αλλαγή σειράς με σύρσιμο (κουτιά του προγράμματος): κράτα πατημένο ένα κουτί ή σύρε το ≡.
   E.drag({root, list, card, onDrop(από, προς)}) → {busy(), off()}.
   root: η σελίδα · list(): το στοιχείο με τα κουτιά · card: επιλογέας κουτιού · onDrop(στοιχείο που σύρθηκε, στοιχείο-στόχος, μετά;)
   Όσο σέρνεις, η σελίδα δεν ξαναζωγραφίζεται (busy) και ένα «κλικ» στο τέλος του συρσίματος αγνοείται. */
(function () {
  const PL = window.PL, E = PL.plans;
  E.drag = ({ root, list, card, onDrop, onCancel }) => {
    let d = null, lp = null, noClick = false;
    const start = (el, y) => {
      const cards = [...list().querySelectorAll(card)], p = cards.indexOf(el); if (p < 0) return;
      const top0 = PL.scroller(root).scrollTop, mids = cards.map((c) => { const r = c.getBoundingClientRect(); return r.top + r.height / 2 + top0; });
      const cs = getComputedStyle(el), h = el.offsetHeight + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom);
      d = { el, cards, p, t: p, mids, h, y0: y + top0 }; el.classList.add('drag'); cards.forEach((c) => { if (c !== el) c.classList.add('shift'); });
      try { navigator.vibrate && navigator.vibrate(25); } catch (e) { /* τίποτα */ }
    };
    const move = (y) => {
      const scr = PL.scroller(root); if (y < 90) scr.scrollBy(0, -14); else if (y > innerHeight - 130) scr.scrollBy(0, 14);
      const dy = y + scr.scrollTop - d.y0; d.el.style.transform = 'translateY(' + dy + 'px)';
      const c = d.mids[d.p] + dy; let t = 0; d.mids.forEach((m, i) => { if (i !== d.p && m < c) t++; }); d.t = t;
      d.cards.forEach((e2, i) => { if (i === d.p) return; let o = 0; if (d.p < t && i > d.p && i <= t) o = -d.h; else if (d.p > t && i >= t && i < d.p) o = d.h; e2.style.transform = o ? 'translateY(' + o + 'px)' : ''; });
    };
    const end = () => {
      const x = d; d = null; noClick = true; setTimeout(() => { noClick = false; }, 350);
      if (x.t !== x.p) onDrop(x.cards[x.p], x.cards[x.t], x.t > x.p); else onCancel();
    };
    const onDown = (ev) => {
      const el = ev.target.closest(card); if (!el || d || !list().contains(el)) return;
      if (ev.target.closest('[data-grip]')) { ev.preventDefault(); start(el, ev.clientY); return; }
      if (ev.target.closest('button,input,a')) return;
      clearTimeout(lp && lp.t);
      lp = { x0: ev.clientX, y0: ev.clientY, y: ev.clientY, t: setTimeout(() => { if (lp) { start(el, lp.y); lp = null; } }, 450) };
    };
    const onMove = (ev) => {
      if (lp) { lp.y = ev.clientY; if (Math.abs(ev.clientX - lp.x0) > 8 || Math.abs(ev.clientY - lp.y0) > 8) { clearTimeout(lp.t); lp = null; } }
      if (d) { ev.preventDefault(); move(ev.clientY); }
    };
    const onTouch = (ev) => { if (d) ev.preventDefault(); };
    const onUp = () => { if (lp) { clearTimeout(lp.t); lp = null; } if (d) end(); };
    const onClickCap = (ev) => { if (noClick) { ev.stopPropagation(); ev.preventDefault(); } };
    const onMenu = (ev) => { if (ev.target.closest(card)) ev.preventDefault(); };
    list().addEventListener('pointerdown', onDown);
    document.addEventListener('pointermove', onMove); document.addEventListener('touchmove', onTouch, { passive: false });
    document.addEventListener('pointerup', onUp); document.addEventListener('pointercancel', onUp);
    root.addEventListener('click', onClickCap, true); root.addEventListener('contextmenu', onMenu);
    return {
      busy: () => !!d,
      off() {
        document.removeEventListener('pointermove', onMove); document.removeEventListener('touchmove', onTouch);
        document.removeEventListener('pointerup', onUp); document.removeEventListener('pointercancel', onUp);
        clearTimeout(lp && lp.t);
      },
    };
  };
})();

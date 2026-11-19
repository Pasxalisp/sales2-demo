/* Στρογγυλό πράσινο κουμπί «Ανοιχτό πρόγραμμα» με μετρητή (π.χ. 0/3) — όπως στην παλιά σελίδα. */
(function () {
  const PL = window.PL, S = PL.store;
  const b = document.createElement('button');
  b.id = 'nvo'; b.setAttribute('aria-label', 'Ανοιχτό πρόγραμμα');
  b.innerHTML = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M16 3v4M8 3v4M4 11h16"/><path d="M9 15.5l2 2 4-4"/></svg><span class="oc" id="nvoc"></span><span class="ol">Ανοιχτό πρόγραμμα</span>';
  document.body.appendChild(b);
  let shown = false;
  const act = () => { try { return S.loaded('plans') ? PL.plans.activeList() : []; } catch (e) { return []; } };
  function sync() {
    const L = act(), cur = PL.nav.current();
    const inPlan = cur && (cur.id === 'planview' || cur.id === 'dictate') && (cur.id !== 'planview' || L.some(([id]) => id === (cur.params || {}).id));
    const on = L.length > 0 && !inPlan && !document.querySelector('#nav.off');
    b.style.display = on ? 'flex' : 'none';
    if (L.length) { const st = L[0][1].stops || []; b.querySelector('#nvoc').textContent = L.length > 1 ? L.length + ' ανοιχτά' : st.filter((x) => x.done).length + '/' + st.length; }
    if (on && !shown) { shown = true; b.classList.add('hint'); setTimeout(() => b.classList.remove('hint'), 2600); }
    if (!on) shown = false;
  }
  b.onclick = () => {
    const L = act(); if (!L.length) return;
    if (L.length === 1) PL.nav.push('planview', { id: L[0][0] }); else PL.nav.push('plan');
  };
  /* ενημερώνεται μόνο όταν αλλάζει σελίδα/μπάρα ή τα προγράμματα (όχι με χρονόμετρο) */
  PL.bus.on('bar', sync);
  S.use('plans'); S.on('plans', sync);
})();

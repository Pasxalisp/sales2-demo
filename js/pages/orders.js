/* «Παραγγελίες»: λίστα πρόχειρων + νέα παραγγελία για πελάτη. Δεν υπάρχει αποστολή. */
(function () {
  const PL = window.PL, u = PL.u, M = PL.model, S = PL.store, esc = u.esc, O = () => PL.orders;
  PL.register('orders', {
    title: 'Παραγγελίες',
    render(el) {
      el.innerHTML = '<div class="page-head"><h1>🛒 Παραγγελίες</h1></div><label class="mu">Νέα παραγγελία για πελάτη</label><div id="opk"></div><div id="obody"></div><p class="mu f">Εδώ φτιάχνεις μόνο πρόχειρες παραγγελίες, για να μην τις γράφεις από την αρχή. Δεν στέλνονται πουθενά και δεν έχουν εκπτώσεις· το «Αντιγραφή» σου δίνει το κείμενο για να το περάσεις στο σύστημα.</p>';
      ['orders', 'clients', 'prospects', 'ocat', 'items'].forEach((c) => S.use(c));
      const paint = () => {
        const E = Object.entries(S.all('orders')).sort((a, b) => String(b[1].ts || 0).localeCompare(String(a[1].ts || 0)));
        el.querySelector('#obody').innerHTML = E.length ? `<h3>Πρόχειρες (${E.length})</h3>` + E.map(([k, o]) => { const s = O().split(o), c = M.byId(o.cid);
          return `<div class="card oc" data-oo="${esc(k)}"><div class="row"><span class="nm">${PL.prospects.tag(c)}${esc(c ? c.name : o.name || '—')}</span><b>${u.money(s.sp.n)}</b></div><div class="mu f">${esc(u.fd(o.date))} · ${s.P.length} είδη / ${s.sp.q} τεμ.${s.G.length ? ' · 🎁 ' + s.G.length + ' δώρα/εξοπλ.' : ''}</div></div>`; }).join('') : '<p class="mu">Δεν υπάρχουν παραγγελίες ακόμα.</p>';
      };
      PL.picker(el.querySelector('#opk'), { placeholder: 'Γράψε όνομα ή κωδικό πελάτη…', onPick: async (c) => { const id = await O().create(c.i); PL.nav.push('order', { id }); } });
      paint(); const off = S.on('orders', paint);
      el.addEventListener('click', (e) => { const o = e.target.closest('[data-oo]'); if (o) PL.nav.push('order', { id: o.dataset.oo }); });
      return off;
    },
  });
})();

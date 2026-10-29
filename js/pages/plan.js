/* Σελίδα «Πρόγραμμα»: τέσσερα πλακίδια (στο ύφος της Αρχικής). Μεγάλο το «Πρόγραμμα ημέρας» (το πιο συχνό),
   από κάτω «Πρόγραμμα μήνα» και «Εκτός προγράμματος», τέλος «Τα προγράμματά μου».
   Κάθε πλακίδιο κρατά το χρώμα της σελίδας του (ημέρας πράσινο, μήνα μπλε, εκτός προγράμματος πορτοκαλί)
   και δείχνει ζωντανά πού βρίσκεσαι (ανοιχτό πρόγραμμα, σημερινές επισκέψεις/ραντεβού, ανοιχτά/πρόχειρα). */
(function () {
  const PL = window.PL, S = PL.store, E = PL.plans, esc = PL.u.esc;
  const OPT = [
    { id: 'dayplan', k: 'day', i: 'cal', t: 'Πρόγραμμα ημέρας', s: 'Πελάτες, σειρά διαδρομής και τι να πεις' },
    { id: 'month', k: 'mon', i: 'cal', t: 'Πρόγραμμα μήνα', s: 'Ταξίδια και εβδομάδες' },
    { id: 'free', k: 'free', i: 'route', t: 'Εκτός προγράμματος', s: 'Μέρες στη βάση, χωρίς πρόγραμμα' },
    { id: 'myplans', k: 'my', i: 'folder', t: 'Τα προγράμματά μου', s: 'Ανοιχτά και παλαιότερα προγράμματα' },
  ];
  const n = (v, one, many) => v + ' ' + (v === 1 ? one : many);
  /* ζωντανή γραμμή κάθε πλακιδίου ('' = δείχνει μόνο την περιγραφή) */
  const live = {
    day: () => { const A = E.activeList(); if (!A.length) return ''; const [, p] = A[0], d = (p.stops || []).filter((s) => s.done).length;
      return '▶ Ανοιχτό: ' + esc((p.cities || []).join(' + ')) + ' ' + d + '/' + (p.stops || []).length + (A.length > 1 ? ' · +' + (A.length - 1) : ''); },
    free: () => { const v = ((S.get('plans', E.freeId()) || {}).stops || []).filter((s) => s.done).length, a = E.freeAppts().length;
      return [v ? 'Σήμερα ' + n(v, 'επίσκεψη', 'επισκέψεις') : '', a ? n(a, 'ραντεβού', 'ραντεβού') : ''].filter(Boolean).join(' · '); },
    my: () => { const a = E.activeList().length, d = Object.keys(S.all('pdrafts')).length;
      return [a ? n(a, 'ανοιχτό', 'ανοιχτά') : '', d ? n(d, 'πρόχειρο', 'πρόχειρα') : ''].filter(Boolean).join(' · '); },
    mon: () => '',
  };
  PL.register('plan', {
    title: 'Πρόγραμμα',
    render(el) {
      el.innerHTML = '<h2 style="margin-bottom:0">Πρόγραμμα</h2><p class="mu" style="margin:2px 0 14px">Οργάνωσε τις επισκέψεις σου</p><div class="pgo"></div>';
      E.use(); S.use('pdrafts');
      const paint = () => {
        const ok = S.loaded('plans');
        /* + δοκιμαστικά πλακίδια (lab/, μόνο στη δοκιμαστική έκδοση): PL.labActs = [{page: 'plan', tile: {id, k, i, t, s}}] */
        const opts = OPT.concat((PL.labActs || []).filter((x) => x.page === 'plan').map((x) => x.tile));
        el.querySelector('.pgo').innerHTML = opts.map((o) => { const l = ok && live[o.k] ? live[o.k]() : '';
          return `<button class="pgt ${o.k}" data-go="${o.id}"><span class="pgi">${PL.icon[o.i]}</span><span class="pgx"><span class="pgn">${o.t}</span><span class="pgs">${o.s}</span>${l ? `<span class="pgl">${l}</span>` : ''}</span><span class="pgc" aria-hidden="true">›</span></button>`; }).join('');
      };
      paint();
      const offs = ['plans', 'pdrafts', 'clients'].map((c) => S.on(c, paint));
      el.addEventListener('click', (e) => { const b = e.target.closest('[data-go]'); if (b) PL.nav.push(b.dataset.go); });
      return () => offs.forEach((f) => f());
    },
  });
})();

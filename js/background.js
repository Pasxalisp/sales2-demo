/* Δουλειές παρασκηνίου (όπως στην παλιά σελίδα), ξεκινούν μόλις φορτώσουν τα προγράμματα:
   1. εφέ «Ολοκληρώθηκε» όταν ένα πρόγραμμα τελειώνει από άλλη συσκευή·
   2. «χειροκίνητοι» πελάτες (manual): θυμόμαστε όσους μπήκαν με το χέρι σε πρόγραμμα, ακόμα κι αν το πρόγραμμα σβηστεί·
   3. συμπλήρωση του visits από τις στάσεις που έχουν τικ σε παλιά προγράμματα. */
(function () {
  const PL = window.PL, S = PL.store, M = PL.model, db = () => PL.adapter.db;
  const done = (p) => { const s = p.stops || []; return s.length > 0 && s.every((x) => x.done); };

  function celebrateWatcher() {
    const st = {}; let first = true;
    const watch = () => {
      const E = PL.plans, P = S.all('plans');
      for (const id in P) {
        const p = P[id], d = done(p);
        if (!first && d && st[id] === false && p.mode !== 'free' && !PL.dlg.celebrated.has(id) && !(E.PLDONE && E.PLDONE.p && E.PLDONE.p.id === id)) {
          const c = PL.nav.current(), open = c && c.id === 'planview' && c.params && c.params.id === id;
          PL.dlg.celebrate(Object.assign({ id }, p), open ? () => PL.nav.home() : null);
        }
        st[id] = d;
      }
      first = false;
    };
    S.on('plans', () => setTimeout(watch, 400)); watch();
  }

  function manualSync() {
    const run = () => {
      if (PL.dataio && PL.dataio.busy) return;
      const E = PL.plans;
      Object.values(S.all('plans')).forEach((p) => (p.stops || []).forEach((x) => {
        if ((x.added || (p.mode === 'free' && M.byId(x.id) && !(M.tz(M.byId(x.id)) > 0))) && !S.get('manual', x.id)) E.setManual(x.id).catch(() => {});
      }));
    };
    S.on('plans', run); S.on('manual', run); PL.tick.add(run, 60); run();
  }

  async function backfillVisits() {
    if (PL.dataio && PL.dataio.busy) return;
    const add = {};
    Object.values(S.all('plans')).forEach((p) => (p.stops || []).forEach((x) => { if (x.done) { const d = x.doneDate || p.created; if (d) (add[x.id] = add[x.id] || new Set()).add(d); } }));
    for (const id in add) {
      const cur0 = (S.get('visits', id) && S.get('visits', id).dates) || [], all = [...new Set(cur0.concat([...add[id]]))].sort();
      if (all.length !== cur0.length) { const nv = { dates: all.slice(-60), name: (M.byId(id) || {}).name || '' }; await db().set('visits/' + id, nv); S.put('visits', id, nv); }
    }
  }

  Promise.all(['plans', 'visits', 'manual', 'clients', 'prospects'].map((c) => S.use(c))).then(() => {
    celebrateWatcher(); manualSync();
    setTimeout(() => { backfillVisits().catch(() => {}); }, 3000);
  }).catch(() => {});
})();

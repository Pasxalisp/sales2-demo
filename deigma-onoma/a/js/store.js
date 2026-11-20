/* ΚΟΙΝΑ ΔΕΔΟΜΕΝΑ: μία συνδρομή ανά συλλογή, φορτώνεται μόνο όταν χρειαστεί (lazy).
   PL.store.use('notes') → υπόσχεση που ολοκληρώνεται με το πρώτο στιγμιότυπο.
   PL.store.all('notes') → {id: έγγραφο}.   PL.store.on('notes', fn) → συνάρτηση διακοπής.
   PL.store.loaded('notes') → true μόνο αφού ήρθε το πρώτο στιγμιότυπο από τη βάση (ή απέτυχε η σύνδεση). */
(function () {
  const PL = window.PL;
  const data = {}, started = {}, ready = {}, cbs = {};
  const emit = (col) => (cbs[col] || []).slice().forEach((f) => { try { f(data[col] || {}); } catch (e) { console.error(e); } });
  PL.store = {
    use(col) {
      if (started[col]) return started[col];
      data[col] = data[col] || {};
      started[col] = (async () => {
        await PL.adapter.ready;
        return new Promise((resolve) => {
          let first = true;
          PL.adapter.db.watch(col, (docs) => {
            const m = {}; docs.forEach((d) => { const x = Object.assign({}, d); delete x.id; m[d.id] = x; });
            data[col] = m; ready[col] = true;
            emit(col);
            if (first) { first = false; resolve(m); }
          }, () => { ready[col] = true; emit(col); if (first) { first = false; resolve(data[col]); } });
        });
      })();
      return started[col];
    },
    all: (col) => data[col] || {},
    get: (col, id) => (data[col] || {})[id],
    on(col, f) { (cbs[col] = cbs[col] || []).push(f); return () => { cbs[col] = (cbs[col] || []).filter((x) => x !== f); }; },
    loaded: (col) => !!ready[col],
    /* Άμεση ενημέρωση της τοπικής εικόνας μετά από δική μας εγγραφή (πριν έρθει το στιγμιότυπο της βάσης). */
    drop(col, id) { if (data[col]) delete data[col][id]; emit(col); },
    put(col, id, doc) { (data[col] = data[col] || {})[id] = doc; emit(col); },
  };
})();

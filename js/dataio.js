/* ΜΕΤΡΗΣΗ / ΕΞΑΓΩΓΗ (λήψη αντιγράφου) / ΕΙΣΑΓΩΓΗ δεδομένων — ένα αρχείο JSON όπως το dedomena.json.
   Η σελίδα «Ρυθμίσεις» χρησιμοποιεί μόνο τη μέτρηση και την εξαγωγή. Η εισαγωγή δεν έχει κουμπί: μένει για τα τεστ
   και για επαναφορά από αντίγραφο σε ανάγκη (μόνο από το Claude). Τα δεδομένα του orders τα γράφει το Claude απευθείας.
   Μιλάει μόνο με PL.adapter (δεν ξέρει πού ζει η βάση). */
(function () {
  const PL = window.PL;
  const COLS = ['balances','balnotes','brands','cats','deals','dealmsg','extra','flash','items','manual','month','notes','ocat','orders','pdrafts','plans','prospects','route','seminars','settings','sos','tasks','tech','visits','wish','xout','zskip'];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  let baseDelay = 600;
  async function retry(fn) {
    for (let a = 0; ; a++) {
      try { return await fn(); }
      catch (e) {
        const c = e && e.code;
        if (a < 8 && (c === 'resource_exhausted' || c === 'unavailable')) { await sleep(baseDelay * Math.min(2 ** a, 16) + Math.random() * baseDelay); continue; }
        throw e;
      }
    }
  }
  async function pool(jobs, n, onDone) {
    let i = 0, done = 0;
    await Promise.all(Array.from({ length: n }, async () => {
      while (i < jobs.length) { const j = jobs[i++]; await j(); onDone && onDone(++done, jobs.length); }
    }));
  }

  PL.dataio = {
    COLS,

    /* όσο τρέχει εισαγωγή, οι δουλειές παρασκηνίου δεν γράφουν (busy > 0) */
    busy: 0,

    /* data = {_meta, συλλογή:{id:{...}}}, clients = [{i,...}]. Οι πελάτες παίρνουν πεδίο owner (ο πωλητής).
       Γράφει ΜΟΝΟ ό,τι λείπει (ίδιο id = ήδη γραμμένο) και δεν σταματά σε σφάλμα: τα αποτυχημένα επιστρέφονται.
       Έτσι μπορεί να ξανατρέξει με ασφάλεια μέχρι να ολοκληρωθεί.  opts.delay = βάση αναμονής σε ms. */
    async importData(data, clients, onProgress, opts) {
      PL.dataio.busy++;
      try {
        if (opts && opts.delay != null) baseDelay = opts.delay;
        const db = PL.adapter.db, owner = PL.adapter.userId();
        const want = []; // {path, doc}
        (clients || []).forEach((c) => want.push({ col: 'clients', id: c.i, doc: Object.assign({}, c, { owner }) }));
        COLS.forEach((col) => Object.entries(data[col] || {}).forEach(([id, doc]) => want.push({ col, id, doc })));
        const have = {};
        for (const col of ['clients'].concat(COLS)) have[col] = new Set((await retry(() => db.list(col))).map((d) => d.id));
        const todo = want.filter((w) => !have[w.col].has(w.id));
        const failed = []; let written = 0;
        const jobs = todo.map((w) => async () => {
          try { await retry(() => db.set(w.col + '/' + w.id, w.doc)); written++; }
          catch (e) { failed.push({ path: w.col + '/' + w.id, code: (e && e.code) || '', message: (e && e.message) || String(e) }); }
        });
        await pool(jobs, 3, onProgress && ((d, t) => onProgress(d, t)));
        if (!failed.length) await retry(() => db.set('sys/import', { at: new Date().toISOString(), source: (data._meta && data._meta.source) || '', backupDate: (data._meta && data._meta.date) || '', owner, docs: want.length }));
        return { total: want.length, already: want.length - todo.length, written, failed };
      } finally { PL.dataio.busy--; }
    },

    /* Μέτρηση ζωντανά από τη βάση. */
    async count() {
      const db = PL.adapter.db, out = { cols: {}, docs: 0, collections: 0, clients: 0 };
      out.clients = (await db.list('clients')).length;
      for (const col of COLS) {
        const n = (await db.list(col)).length;
        out.cols[col] = n; out.docs += n; if (n) out.collections++;
      }
      return out;
    },

    async exportAll() {
      const db = PL.adapter.db, out = { _meta: { date: new Date().toISOString().slice(0, 10), counts: {} }, clients: [] };
      out.clients = (await db.list('clients')).map((d) => d);
      for (const col of COLS) {
        const rows = await db.list(col); out[col] = {};
        rows.forEach((r) => { const id = r.id; const x = Object.assign({}, r); delete x.id; out[col][id] = x; });
        out._meta.counts[col] = rows.length;
      }
      return out;
    },

    /* Πλήρες αντίγραφο ασφαλείας σε αρχείο. Η ημερομηνία του φυλάγεται στη βάση (settings/backup) μόνο αν η λήψη έγινε,
       ώστε η Αρχική να θυμίζει όταν περάσουν BACKUP_DAYS μέρες. */
    BACKUP_DAYS: 7,
    async backup() {
      const all = await PL.dataio.exportAll();
      await PL.adapter.files.save('pelatologio-' + all._meta.date + '.json', JSON.stringify(all));
      const doc = { d: all._meta.date };
      PL.store.put('settings', 'backup', doc);
      try { await PL.adapter.db.set('settings/backup', doc); } catch (e) { /* το αρχείο κατέβηκε· η ημερομηνία ξαναγράφεται την επόμενη φορά */ }
      return all._meta.date;
    },
    /* Μέρες από το τελευταίο αντίγραφο (null = ποτέ). */
    backupAge() {
      const b = PL.store.get('settings', 'backup'); if (!b || !b.d) return null;
      return Math.max(0, Math.round((Date.parse(PL.u.today()) - Date.parse(b.d)) / 864e5));
    },
  };
})();

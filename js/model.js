/* ΜΟΝΤΕΛΟ: υπολογισμοί πάνω στα δεδομένα (πελάτες, τζίρος, Goldwell, κατηγορίες, είδη, επισκέψεις, εκκρεμότητες,
   συμφωνίες, υπόλοιπα). Καθαρές συναρτήσεις· δεν γράφουν στη βάση.
   ΕΝΑ σημείο υπολογισμών: οι σελίδες του πωλητή δουλεύουν πάνω στα δικά του δεδομένα (PL.model = make(PL.store)),
   και οι οθόνες ομάδας πάνω στα δεδομένα ενός άλλου πωλητή (PL.model.over(πηγή)), με τις ΙΔΙΕΣ συναρτήσεις.
   Πηγή = οτιδήποτε έχει all(συλλογή) και get(συλλογή, id), όπως το PL.store. */
(function () {
  const PL = window.PL, u = PL.u;
  const K = {
    EXB: ['KERASILK', 'MOROCCANOIL'],                 // δεν μετράνε στον γενικό τζίρο
    PR: ['Topchic', 'Colorance', 'Gloss tones', 'Elumen', 'Silklift', 'Subbrand', 'Dualsenses', 'Styling'],
    /* Μια κατηγορία/μάρκα «τη δούλευε» αν έκανε τουλάχιστον τόσα σε μια χρονιά· αλλιώς απλώς έτυχε να την πάρει και δεν γράφουμε «σταμάτησε». */
    WORKED: 150,
    CATN: ['Topchic', 'Colorance', 'Silklift', 'Elumen', 'Subbrand', 'DS', 'SS', 'Kerasilk'],
    CATL: { DS: 'Dualsenses', SS: 'Styling' },
    BRL: { GOLDWELL: 'Goldwell', KERASILK: 'Kerasilk', MOROCCANOIL: 'Moroccanoil', REUZEL: 'Reuzel', UPD: 'UPD', DUNKER: 'Dunker', BRAZILIANBONDBUILD3R: 'Brazilian Bond Builder', QIQI: 'QIQI', 'ΑΝΑΛΩΣΙΜΑ': 'Αναλώσιμα', KENZAI: 'Kenzai' },
  };
  const EXB = K.EXB;

  function make(src) {
    const S = () => src;
    const M = Object.assign({}, K);

    /* Όλοι οι πελάτες: κανονικοί + προσωρινοί (prospects). */
    M.clients = () => {
      const out = Object.entries(S().all('clients')).map(([i, c]) => Object.assign({ i }, c, { i }));
      Object.entries(S().all('prospects')).forEach(([i, p]) => out.push({ i, prospect: true, name: p.name || '', city: p.city || '', addr: p.addr || '', zip: '', code: '', t1: p.phone || '', t2: '', tz: 0 }));
      return out;
    };
    M.byId = (id) => { const c = S().get('clients', id); return c ? Object.assign({}, c, { i: id }) : (M.clients().find((x) => x.i === id) || null); };

    /* Γενικός τζίρος φέτος: όλες οι μάρκες εκτός Kerasilk & Moroccanoil (από brands/all). Αλλιώς ο αρχικός τζίρος της λίστας. */
    M.tz = (c) => {
      const BR = S().get('brands', 'all');
      if (BR) {
        const d = BR[c.i]; let t = 0;
        if (d) for (const k in d) if (Array.isArray(d[k]) && !EXB.includes(k)) t += +d[k][1] || 0;
        return Math.round(t * 100) / 100;
      }
      return c.tz || 0;
    };
    /* Goldwell [πέρσι ίδια περίοδο, φέτος, πέρσι όλο]: προτιμάται το cats/all. */
    M.gold = (c) => { const k = (S().get('cats', 'all') || {})[c.i]; return (k && Array.isArray(k.Goldwell) && k.Goldwell.map((x) => +x || 0)) || (c.yoy && c.yoy.Goldwell) || null; };
    M.yoy = (c) => {
      const y = M.gold(c); if (!y) return null; const ly = y[0], ty = y[1];
      if (ly <= 0 && ty <= 0) return null;
      if (ly <= 0) return { cls: 'up', txt: '▲ νέος', ly, ty };
      if (ty <= 0) return { cls: 'dn', txt: '▼ −100%', ly, ty };
      const p = (ty - ly) / ly * 100;
      return { cls: p >= 0 ? 'up' : 'dn', txt: (p >= 0 ? '▲ +' : '▼ −') + Math.abs(p).toFixed(0) + '%', ly, ty };
    };
    M.dd = (y) => { const d = y.ty - y.ly; return (d >= 0 ? '+' : '−') + u.money(Math.abs(d)); };

    M.entries = (id) => (S().get('notes', id) || {}).entries || [];
    M.works = (id) => [...new Set(((S().get('notes', id) || {}).works || []).map((w) => (w === 'Bond pro' ? 'Subbrand' : w)))];
    M.nextOf = (id) => { const e = M.entries(id).find((x) => x.next); return e ? e.next : ''; };

    /* Συμφωνία: πρόοδος και ρυθμός. */
    const yearFrac = () => { const d = new Date(), y = d.getFullYear(), a = new Date(y, 0, 1), b = new Date(y + 1, 0, 1); return Math.min(1, (d - a) / (b - a)); };
    const monthsLeft = () => { const d = new Date(); return Math.max(0.5, 12 - d.getMonth() - d.getDate() / 31); };
    M.yearFrac = yearFrac;
    M.deal = (x) => {
      const left = Math.max(0, (x.goal || 0) - (x.ty || 0)), pct = x.goal ? x.ty / x.goal * 100 : 0, exp = (x.goal || 0) * yearFrac(), ahead = (x.ty || 0) - exp;
      return { left, pct, exp, ahead, perM: left / monthsLeft(), done: left <= 0 };
    };

    /* Εκκρεμότητες: επόμενες επαφές, ρητές εκκρεμότητες, πληρωμές, ραντεβού. */
    M.openTasks = (t) => {
      t = t || u.today(); const L = [];
      M.clients().forEach((c) => M.entries(c.i).forEach((e, k) => { if (e && e.next && !e.done) L.push({ c, e, k }); }));
      Object.entries(S().all('tasks')).forEach(([tid, x]) => {
        if (!x || x.done) return; const nx = x.next || x.d || t;
        L.push({ c: (x.cid && M.byId(x.cid)) || null, e: { next: nx, nt: x.nt || '', todo: x.t || '', d: x.d || '' }, tid });
      });
      Object.entries(S().all('balnotes')).forEach(([id, n]) => {
        if (!n || !n.pay || n.pdone === n.pay || !M.byId(id)) return;
        const a = (S().get('balances', id) || {}).amount;
        L.push({ c: M.byId(id), e: { next: n.pay, nt: '', todo: 'Είπε ότι θα πληρώσει ' + (n.pay === t ? 'σήμερα' : 'στις ' + u.fd(n.pay)) + (a ? ' (υπόλοιπο ' + u.money(+a) + ')' : '') + (n.t ? ' · ' + n.t : ''), d: n.d || '' }, pay: id });
      });
      Object.entries(S().all('plans')).forEach(([pid, p]) => {
        if (!p || (p.closed && p.mode !== 'free')) return;   // τα «εκτός προγράμματος» είναι πάντα κλειστά, αλλά τα ραντεβού τους μετράνε
        (p.stops || []).forEach((s) => {
          if (!s || !s.appt || s.done || !M.byId(s.id)) return; const d = s.apptD || p.created || t; if (d < t) return;
          L.push({ c: M.byId(s.id), e: { next: d, nt: s.appt, todo: 'στις ' + s.appt + (p.mode === 'free' ? ' · εκτός προγράμματος' : ' · πρόγραμμα ' + (p.cities || []).join(' + ')), d: p.created || '' }, appt: pid + '|' + s.id });
        });
      });
      return L.sort((a, b) => ((a.e.next + (a.e.nt || '99')) < (b.e.next + (b.e.nt || '99')) ? -1 : 1));
    };
    M.dueList = (t) => { t = t || u.today(); return M.openTasks(t).filter((x) => x.e.next <= t); };


    /* Τελευταία επαφή με τον πελάτη: επίσκεψη (visits) ή καταγραφή στην καρτέλα, ό,τι είναι πιο πρόσφατο. */
    M.lastVisit = (id) => { let m = ''; ((S().get('visits', id) || {}).dates || []).forEach((d) => { if (d > m) m = d; }); M.entries(id).forEach((e) => { if (e && e.d && e.d > m) m = e.d; }); return m; };
    /* Όλες οι επισκέψεις: [[πελάτης, ημερομηνία]] (για μετρήσεις ανά εβδομάδα/μήνα). */
    M.visitDates = () => { const L = []; Object.entries(S().all('visits')).forEach(([id, v]) => { if (M.byId(id)) (v.dates || []).forEach((d) => L.push([id, d])); }); return L; };

    /* Υπόλοιπα: ποσό ενός πεδίου, «έχει υπόλοιπο», «αξίζει να φαίνεται» (≥ 1 € ή υπέρβαση ή διαμαρτυρημένα). */
    const bv = (id, k) => +((S().get('balances', id) || {})[k] || 0);
    M.bal = {
      v: bv,
      has: (id) => !!M.byId(id) && (bv(id, 'amount') !== 0 || bv(id, 'over') !== 0 || bv(id, 'bounced') !== 0),
      big: (id) => Math.abs(bv(id, 'amount')) >= 1 || bv(id, 'over') >= 1 || bv(id, 'bounced') !== 0,
      /* πελάτες με υπόλοιπο */
      ids: () => Object.keys(S().all('balances')).filter(M.bal.has),
    };
    /* Συμφωνίες: ΕΝΑ έγγραφο deals/all = {πελάτης: {goal, ty, ly, cats…}, _d} */
    M.dealsAll = () => S().get('deals', 'all') || {};
    /* Καμπάνιες: campaigns/{id} = {title, until, products, notes, cust: {πελάτης: 'int'|'won'|'no'}}. Ενεργή = χωρίς λήξη ή until ≥ σήμερα.
       campsInt: τίτλοι ενεργών καμπανιών όπου ο πελάτης «ενδιαφέρεται» (υπενθύμιση στο πρόγραμμα και στα φύλλα). */
    M.campOn = (x) => !!x && (!x.until || x.until >= u.today());
    M.campsInt = (id) => Object.values(S().all('campaigns')).filter((x) => M.campOn(x) && x.cust && x.cust[id] === 'int').map((x) => x.title || 'Καμπάνια');

    /* Τζίρος (σελίδα «Τζίρος» και οθόνες ομάδας). Κλειδιά: 'ALL' = γενικός (όλες οι μάρκες εκτός EXB), 'Goldwell',
       κατηγορίες Goldwell (CATN), 'B:ΜΑΡΚΑ'. Τα cats/all και brands/all είναι ΕΝΑ έγγραφο το καθένα: {πελάτης: {κλειδί: [πέρσι ίδια περ., φέτος, πέρσι όλο]}}. */
    M.catAll = () => S().get('cats', 'all') || {};
    M.brAll = () => S().get('brands', 'all') || {};
    /* ημερομηνία στοιχείων: η πιο πρόσφατη ημερομηνία πελάτη μέσα στο cats/all */
    M.turnDate = () => Object.values(M.catAll()).map((x) => (x && x.d) || '').sort().pop() || '';
    M.turnYear = () => { const d = M.turnDate(); return /^\d{4}/.test(d) ? +d.slice(0, 4) : new Date().getFullYear(); };
    M.hasBrands = () => Object.keys(M.brAll()).some((k) => k[0] !== '_');
    M.brandKeys = () => { const s = new Set(), B = M.brAll(); for (const id in B) { if (id[0] === '_') continue; for (const k in B[id]) if (Array.isArray(B[id][k])) s.add(k); } return [...s]; };
    M.turnKeys = () => { const CAT = M.catAll(), cn = M.CATN.filter((k) => Object.values(CAT).some((d) => d && Array.isArray(d[k])));
      return [...(M.hasBrands() ? ['ALL'] : []), 'Goldwell', ...cn, ...M.brandKeys().filter((b) => b !== 'GOLDWELL').sort((a, b) => EXB.includes(a) - EXB.includes(b) || a.localeCompare(b)).map((b) => 'B:' + b)]; };
    M.turnLabel = (k) => (k === 'ALL' ? 'Γενικός τζίρος' : k === 'Goldwell' ? 'Goldwell (σύνολο)' : k.startsWith('B:') ? (M.BRL[k.slice(2)] || k.slice(2)) + (EXB.includes(k.slice(2)) ? ' (εκτός γενικού)' : '') : (M.CATL[k] || k));
    /* γραμμές ανά πελάτη για ένα κλειδί: [{id, name, city, a: πέρσι ίδια περ., b: φέτος, f: πέρσι όλο}] (city: προαιρετικό φίλτρο) */
    M.turnover = (k, city) => {
      const out = [], cityOk = (c) => !city || (c && c.city === city);
      if (k === 'ALL' || k.startsWith('B:')) {
        const B = M.brAll(), bk = k.slice(2);
        for (const id in B) { if (id[0] === '_') continue; const d = B[id] || {}, c = M.byId(id); if (!cityOk(c)) continue; let a = 0, b = 0, any = false;
          for (const x in d) { if (!Array.isArray(d[x])) continue; if (k === 'ALL' ? EXB.includes(x) : x !== bk) continue; any = true; a += +d[x][0] || 0; b += +d[x][1] || 0; }
          if (any) out.push({ id, name: c ? c.name : id, city: c ? c.city : '', a, b, f: 0 }); }
        return out;
      }
      const CAT = M.catAll();
      for (const id in CAT) { if (id[0] === '_') continue; const d = CAT[id], c = M.byId(id); if (!d || !Array.isArray(d[k]) || !cityOk(c)) continue; const [a, b, f] = d[k].map((x) => +x || 0); out.push({ id, name: c ? c.name : id, city: c ? c.city : '', a, b, f }); }
      return out;
    };

    /* FLASH της εταιρείας (αναφορά 07): το έγγραφο της πιο πρόσφατης χρονιάς, ή null. Υπολογισμοί πάνω του: PL.flash (flash.js). */
    M.flash = () => { const A = S().all('flash'), ys = Object.keys(A).sort(); return ys.length ? A[ys[ys.length - 1]] : null; };

    /* Είδη (από το orders, items/{πελάτης}): όλες οι γραμμές [[πελάτης, είδος]] και η πιο πρόσφατη ημερομηνία· city προαιρετικό. */
    M.itemRows = (city) => { const out = []; let dd = ''; const IT = S().all('items');
      for (const id in IT) { const c = M.byId(id); if (!c) continue; if (city && c.city !== city) continue; const d = IT[id]; if (!d || !Array.isArray(d.it)) continue; if (d.d && d.d > dd) dd = d.d; d.it.forEach((x) => out.push([id, x])); }
      return [out, dd]; };
    /* σύνολα ανά είδος: {n, g, qc, qp, qf, tc, tp, tf, cc: πελάτες φέτος, cp: πελάτες πέρσι, who} */
    M.itemAgg = (list) => { const m = {};
      list.forEach(([id, x]) => { const o = m[x.n] || (m[x.n] = { n: x.n, g: x.g || 'Άλλα', qc: 0, qp: 0, qf: 0, tc: 0, tp: 0, tf: 0, cc: new Set(), cp: new Set(), who: [] });
        o.qc += +x.qc || 0; o.qp += +x.qp || 0; o.qf += +x.qf || 0; o.tc += +x.tc || 0; o.tp += +x.tp || 0; o.tf += +x.tf || 0; if ((+x.qc || 0) > 0) o.cc.add(id); if ((+x.qp || 0) > 0) o.cp.add(id); o.who.push([id, x]); });
      return Object.values(m); };
    return M;
  }

  const M = (PL.model = make(PL.store));
  /* οι ίδιοι υπολογισμοί πάνω σε άλλη πηγή (π.χ. τα δεδομένα ενός πωλητή της ομάδας, μόνο για ανάγνωση) */
  M.over = make;

  /* Εκκίνηση: φορτώνει ό,τι χρειάζεται η αρχική και η μπάρα (λίστα πελατών και εκκρεμότητες). */
  M.boot = async function () {
    const cols = ['clients', 'prospects', 'notes', 'tasks', 'balnotes', 'balances', 'plans'];
    /* ο γενικός τζίρος (M.tz) και το Goldwell (M.gold) χρειάζονται brands/cats σε ΚΑΘΕ σελίδα, όπως στην παλιά */
    ['brands', 'cats'].forEach((c) => PL.store.use(c));
    const upd = () => { const n = M.dueList().length; PL.bar.setBadge(n); PL.bus.emit('due', n); };
    cols.forEach((c) => PL.store.on(c, upd));
    await Promise.all(cols.map((c) => PL.store.use(c)));
    upd();
  };
})();

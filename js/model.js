/* ΜΟΝΤΕΛΟ: υπολογισμοί πάνω στα δεδομένα (πελάτες, τζίρος, Goldwell, εκκρεμότητες, συμφωνίες).
   Καθαρές συναρτήσεις· δεν γράφουν στη βάση. */
(function () {
  const PL = window.PL, S = () => PL.store, u = PL.u;
  const EXB = ['KERASILK', 'MOROCCANOIL'];                 // δεν μετράνε στον γενικό τζίρο
  const M = (PL.model = {});
  M.EXB = EXB;
  M.PR = ['Topchic', 'Colorance', 'Gloss tones', 'Elumen', 'Silklift', 'Subbrand', 'Dualsenses', 'Styling'];
  /* Μια κατηγορία/μάρκα «τη δούλευε» αν έκανε τουλάχιστον τόσα σε μια χρονιά· αλλιώς απλώς έτυχε να την πάρει και δεν γράφουμε «σταμάτησε». */
  M.WORKED = 150;
  M.CATN = ['Topchic', 'Colorance', 'Silklift', 'Elumen', 'Subbrand', 'DS', 'SS', 'Kerasilk'];
  M.CATL = { DS: 'Dualsenses', SS: 'Styling' };
  M.BRL = { GOLDWELL: 'Goldwell', KERASILK: 'Kerasilk', MOROCCANOIL: 'Moroccanoil', REUZEL: 'Reuzel', UPD: 'UPD', DUNKER: 'Dunker', BRAZILIANBONDBUILD3R: 'Brazilian Bond Builder', QIQI: 'QIQI', 'ΑΝΑΛΩΣΙΜΑ': 'Αναλώσιμα', KENZAI: 'Kenzai' };

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

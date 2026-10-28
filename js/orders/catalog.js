/* ΠΑΡΑΓΓΕΛΙΕΣ — κοινά: κατάλογος ειδών (ocat/*, χωρισμένος ανά μάρκα), αναζήτηση, γραμμές, σύνολα, νέο πρόχειρο.
   ΜΟΝΟ πρόχειρα: δεν στέλνονται πουθενά και δεν έχουν εκπτώσεις (κανόνας του πωλητή). */
(function () {
  const PL = window.PL, u = PL.u, M = PL.model, S = PL.store, nn = u.nn, db = () => PL.adapter.db;
  const VAT = 0.24, r2 = (x) => Math.round(x * 100) / 100;
  const ALIAS = { βαφη: ['topchic', 'tc'], βαφες: ['topchic', 'tc'], βαφειο: ['δοχειο', 'topchic'], ρεφλε: ['colorance', 'col'], ντεκαπαζ: ['silklift', 'ld'], ξανοιγμα: ['silklift', 'ld'], πλεξ: ['bond'], οξυζενε: ['developer', 'lotion', 'dev', 'οξυζενε'], οξυζεναι: ['developer', 'lotion', 'dev'], σαμπουαν: ['sh', 'shampoo'], μασκα: ['mask', 'trt'], λακ: ['lacquer', 'spray'], ζελε: ['gel'], κερι: ['wax', 'pomade'], ποδια: ['ποδια', 'apron', 'cape'], σωληναριο: ['60ml', 'tb'], δοχειο: ['δοχειο', 'can', '250ml'], λιτρο: ['1l', '1000ml', '1lt'], zero: ['zero'], glosstones: ['gloss'] };
  const tok = (s) => nn(s).replace(/[()/,+&]/g, ' ').split(/\s+/).filter(Boolean);
  const hayC = new WeakMap();
  const hay = (x) => { let h = hayC.get(x); if (!h) { h = tok(x[1] + ' ' + x[0] + ' ' + x[3] + ' ' + x[2]); hayC.set(x, h); } return h; };
  /* Είδος: [κωδικός, περιγραφή, κατηγορία, υποομάδα, τιμή, δώρο(1/0)] */
  /* Ο κατάλογος είναι χωρισμένος σε εγγραφές ανά μάρκα (ocat/goldwell, ocat/moroccanoil, ocat/kenzai, ocat/rest), ώστε καμία
     να μη φτάνει το όριο μεγέθους της βάσης. Ενώνεται εδώ μία φορά και ξανά μόνο όταν αλλάξει. */
  let cat = null; S.on('ocat', () => { cat = null; });
  const items = () => cat || (cat = Object.keys(S.all('ocat')).sort().flatMap((k) => S.all('ocat')[k].it || []));
  const byCode = (code) => items().find((x) => x[0] === code);

  function search(q, K, Y, lim) {
    const qs = tok(q); let L = items(); if (K) L = L.filter((x) => x[2] === K); if (Y) L = L.filter((x) => x[3] === Y);
    if (!qs.length) return (K || Y) ? L.slice(0, lim || 200) : [];
    const out = [];
    for (const x of L) { const H = hay(x); let ok = true, sc = 0;
      for (const t of qs) { const alts = ALIAS[t] || [t]; let m = false;
        for (const a of alts) { if (H.some((w) => w === a)) { m = true; sc += 2; break; } if (!ALIAS[t] && H.some((w) => w.startsWith(a))) { m = true; sc += 1; break; } }
        if (!m) { ok = false; break; } }
      if (ok) { if (/ΣΩΛΗΝΑΡΙΟ|ΔΟΧΕΙΟ|COLORANCE BOTTLE/.test(x[3])) sc += 0.5; if (x[5]) sc -= 0.6; out.push([sc, x]); } }
    out.sort((a, b) => b[0] - a[0] || a[1][1].localeCompare(b[1][1])); return out.slice(0, lim || 40).map((a) => a[1]);
  }
  const lineFrom = (x, q, gf) => ({ c: x[0], n: x[1], g: x[3], p: x[4], q: q == null ? 1 : q, gf: gf || 0, np: x[5] ? 1 : 0 });
  const sums = (L) => { let q = 0, g = 0, n = 0; (L || []).forEach((l) => { q += +l.q || 0; g += +l.gf || 0; n += (+l.q || 0) * (+l.p || 0); }); n = r2(n); return { q, g, n, v: r2(n * VAT), t: r2(n * (1 + VAT)) }; };
  const split = (o) => { const P = (o.lines || []).filter((l) => !l.np), G = (o.lines || []).filter((l) => l.np); return { P, G, sp: sums(P), sg: sums(G) }; };
  /* «Παίρνει συνήθως»: είδη από τα items του πελάτη που υπάρχουν στον κατάλογο. */
  function usual(cid) {
    const it = (S.get('items', cid) || {}).it || [], by = {}; items().forEach((x) => { by[nn(x[1]).replace(/\s+/g, ' ')] = x; });
    return it.filter((x) => (+x.qc || 0) > 0 || (+x.qp || 0) > 0).sort((a, b) => (+b.qc || 0) + (+b.qp || 0) / 2 - ((+a.qc || 0) + (+a.qp || 0) / 2)).map((x) => by[nn(x.n).replace(/\s+/g, ' ')]).filter(Boolean).slice(0, 24);
  }
  async function create(cid) {
    const c = M.byId(cid); if (!c) throw new Error('Δεν βρέθηκε ο πελάτης');
    const id = 'o' + Date.now() + Math.floor(Math.random() * 100);
    const o = { cid, code: c.code || '', name: c.name, date: u.today(), sal: 'ΕΛΕΥΘΕΡΑ', pay: 'ΠΙΣΤΩΣΗ 5 ΗΜΕΡΩΝ', camp: 'ΓΕΝΙΚΟΙ ΟΡΟΙ', note: '', lines: [], st: 'draft', ts: new Date().toISOString() };
    await db().set('orders/' + id, o); S.put('orders', id, o); return id;
  }
  /* Κείμενο για αντιγραφή (ο πωλητής το περνάει μόνος του στο σύστημα). */
  function toText(o) {
    const s = split(o), ln = (l) => `${l.c} | ${l.n} | ${+l.q || 0}${+l.gf ? ' (+' + l.gf + ' δώρα)' : ''}`;
    return `Παραγγελία ${o.name}${o.code ? ' (' + o.code + ')' : ''} · ${u.fd(o.date)}\nΕίδος: ${o.sal} · Πληρωμή: ${o.pay} · Καμπάνια: ${o.camp}` + (o.note ? '\nΠαρατηρήσεις: ' + o.note : '') +
      '\n\nΠΡΟΪΟΝΤΑ\n' + (s.P.map(ln).join('\n') || '—') + (s.G.length ? '\n\nΔΩΡΑ / ΕΞΟΠΛΙΣΜΟΣ (ξεχωριστή παραγγελία)\n' + s.G.map(ln).join('\n') : '') + `\n\nΚαθαρή αξία ${u.money(s.sp.n)} · ΦΠΑ ${u.money(s.sp.v)} · Σύνολο ${u.money(s.sp.t)}`;
  }
  PL.orders = { items, byCode, search, lineFrom, sums, split, usual, create, toText };
})();

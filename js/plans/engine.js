/* ΜΗΧΑΝΗ ΠΡΟΓΡΑΜΜΑΤΩΝ: κανόνες επιλογής πελατών, σειρά διαδρομής ανά πόλη, χωρίς τζίρο, επισκέψεις.
   Χωρίς οθόνη. Οι σελίδες (dayplan, planview, free, month) το χρησιμοποιούν. Γράφει μόνο μέσω του adapter. */
(function () {
  const PL = window.PL, u = PL.u, M = PL.model, S = PL.store, db = () => PL.adapter.db;
  const E = (PL.plans = {});
  E.COLS = ['clients', 'prospects', 'notes', 'plans', 'visits', 'manual', 'xout', 'zskip', 'route', 'sos', 'tech', 'balances', 'tasks', 'brands', 'cats', 'items', 'deals'];
  E.use = () => Promise.all(E.COLS.map((c) => S.use(c)));
  const dateAgo = (months, days) => { const d = new Date(); if (months) d.setMonth(d.getMonth() - months); if (days) d.setDate(d.getDate() - days); return d.toISOString().slice(0, 10); };

  /* ---- διεύθυνση / περιοχή / σειρά ---- */
  const areaOf = (c) => String(c.area || '').trim();
  const STOPW = new Set(['αγ', 'αγια', 'αγιασ', 'αγιου', 'αγιων', 'οδ', 'λεωφ', 'λεωφοροσ', 'πλ', 'πλατεια', 'παροδοσ', 'βασ', 'βασιλεωσ', 'βασιλισσησ', 'μεγαλου', 'μεγ', 'ελ', 'ελευθ', 'ελευθεριου', 'προξ', 'πρ', 'καθ', 'μιχ', 'αλ', 'δημ', 'νικηφ', 'στρατ', 'πατρ', 'ιωαννου', 'τερμα']);
  const addrParts = (c) => u.nn(String(c.addr || '')).replace(/\([^)]*\)/g, ' ').split(/&| και |,/)[0].replace(/[^a-zα-ω0-9 ]/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  const streetOf = (c) => { const w = addrParts(c).filter((x) => !/^\d/.test(x) && x.length > 1 && !STOPW.has(x)); return w.length ? w[w.length - 1] : ''; };
  const numOf = (c) => { const t = addrParts(c); for (let k = t.length - 1; k > 0; k--) { const m = t[k].match(/^(\d+)/); if (m) return +m[1]; } return 0; };
  const TZO = ['54627', '54626', '54625', '54624', '54622', '54623', '54621', '54645', '551', '54636', '54635', '54631', '54630', '54629', '54634', '54633', '54632', '565', '56429', '56430', '56431', '561', '562', '563', '570', '571', '572', '573', '574'];
  const zoneRank = (c) => { const z = String(c.zip || ''); if (c.city === 'ΘΕΣΣΑΛΟΝΙΚΗ') { let b = -1, l = 0; TZO.forEach((x, k) => { if (z.startsWith(x) && x.length > l) { b = k; l = x.length; } }); if (b >= 0) return b; } return 100 + (+z || 99999) / 1e5; };
  const fbCmp = (A, B) => zoneRank(A) - zoneRank(B) || areaOf(A).localeCompare(areaOf(B), 'el') || streetOf(A).localeCompare(streetOf(B), 'el') || numOf(A) - numOf(B) || String(A.name).localeCompare(String(B.name), 'el');
  E.areaOf = areaOf;
  E.rkey = (cy) => 'r' + [...String(cy)].reduce((h, ch) => (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0, 7).toString(36);

  /* Σειρά πελατών μιας πόλης: η μαθημένη διαδρομή (route) και οι υπόλοιποι κατά διεύθυνση ανάμεσά της. */
  E.cityOrder = (cy) => {
    const all = M.clients().filter((c) => c.city === cy).sort(fbCmp).map((c) => c.i);
    const rd = S.get('route', E.rkey(cy)), L = ((rd && rd.order) || []).filter((id) => M.byId(id) && M.byId(id).city === cy);
    if (!L.length) return all;
    const inL = new Set(L), head = [], after = {}; let last = null;
    all.forEach((id) => { if (inL.has(id)) { last = id; return; } (last ? (after[last] = after[last] || []) : head).push(id); });
    const out = head.slice(); L.forEach((id) => { out.push(id); (after[id] || []).forEach((x) => out.push(x)); }); return out;
  };
  const cityList = (stops) => { const co = []; stops.forEach((x) => { const cy = (M.byId(x.id) || {}).city; if (!co.includes(cy)) co.push(cy); }); return co; };
  E.routeSort = (stops) => {
    const co = cityList(stops), rk = {}; co.forEach((cy) => E.cityOrder(cy).forEach((id, k) => (rk[id] = k)));
    return stops.slice().sort((a, b) => { const A = M.byId(a.id) || {}, B = M.byId(b.id) || {}; return co.indexOf(A.city) - co.indexOf(B.city) || (b.sos ? 1 : 0) - (a.sos ? 1 : 0) || (rk[a.id] ?? 1e6) - (rk[b.id] ?? 1e6); });
  };
  E.tzSort = (stops) => { const co = cityList(stops); return stops.slice().sort((a, b) => { const A = M.byId(a.id) || {}, B = M.byId(b.id) || {}; return co.indexOf(A.city) - co.indexOf(B.city) || (b.sos ? 1 : 0) - (a.sos ? 1 : 0) || M.tz(B) - M.tz(A); }); };
  /* Μαθαίνει τη σειρά που έβαλε ο πωλητής (όταν μετακινεί πελάτες), ανά πόλη. */
  E.learnRoute = async (stops) => {
    for (const cy of cityList(stops)) {
      if (!cy) continue;
      const full = E.cityOrder(cy), ids = stops.map((x) => x.id).filter((id) => (M.byId(id) || {}).city === cy && full.includes(id));
      if (ids.length < 2) continue;
      const slots = ids.map((id) => full.indexOf(id)).sort((x, y) => x - y); slots.forEach((sl, k) => (full[sl] = ids[k]));
      const doc = { city: cy, order: full }; await db().set('route/' + E.rkey(cy), doc); S.put('route', E.rkey(cy), doc);
    }
  };

  /* ---- κανόνες ---- */
  E.owB = (id) => { const b = S.get('balances', id) || {}; return { a: +b.amount || 0, o: +b.over || 0, x: +b.bounced || 0 }; };
  E.owes = (id) => { const b = E.owB(id); return b.a >= 1 || b.o >= 1 || b.x > 0; };
  E.blocked = (id) => { const x = S.get('xout', id); return !!(x && (x.r === 'closed' || x.r === 'no')); };
  E.manual = (id) => {
    if (S.get('manual', id)) return true;
    return Object.values(S.all('plans')).some((p) => (p.stops || []).some((x) => x.id === id && (x.added || (p.mode === 'free' && x.done && !(M.tz(M.byId(id) || {}) > 0)))));
  };
  E.setManual = async (id) => { if (S.get('manual', id)) return; const c = M.byId(id), doc = { d: u.today(), name: c ? c.name : '' }; await db().set('manual/' + id, doc); S.put('manual', id, doc); };

  E.zeroQueue = (cities, excl) => {
    const last = {};
    Object.values(S.all('plans')).forEach((pl) => (pl.stops || []).forEach((s) => { if (s.zero && (!last[s.id] || pl.created > last[s.id])) last[s.id] = pl.created; }));
    Object.entries(S.all('zskip')).forEach(([id, z]) => { if (z.d && (!last[id] || z.d > last[id])) last[id] = z.d; });
    const m6 = dateAgo(6);
    return M.clients().filter((c) => cities.has(c.city) && !c.prospect && !S.get('sos', c.i) && M.tz(c) <= 0 && !excl.has(c.i) && !E.blocked(c.i) &&
      !(((S.get('zskip', c.i) || {}).n >= 2) && String((S.get('zskip', c.i) || {}).d || '') >= m6))
      .sort((a, b) => { const x = last[a.i] || '', y = last[b.i] || ''; return x < y ? -1 : x > y ? 1 : a.name.localeCompare(b.name, 'el'); });
  };

  /* Ποιοι μπαίνουν αυτόματα σε πρόγραμμα για τις πόλεις sel (Set). */
  E.candidates = (sel) => {
    const plans = S.all('plans'), lim = u.today().slice(0, 8) + '01', m6 = dateAgo(6);
    const inArea = M.clients().filter((c) => sel.has(c.city));
    const recent = Object.values(plans).filter((p) => (p.created || '') >= lim && (p.cities || []).some((x) => sel.has(x)));
    const visited = new Set();
    Object.values(plans).forEach((p) => (p.stops || []).forEach((x) => { if (x.done && (x.doneDate || p.created || '') >= lim && M.byId(x.id) && sel.has(M.byId(x.id).city)) visited.add(x.id); }));
    Object.entries(S.all('visits')).forEach(([id, v]) => { if (M.byId(id) && sel.has(M.byId(id).city) && (v.dates || []).some((d) => d >= lim)) visited.add(id); });
    const touch = {}, tch = (id, d) => { if (id && d && (!touch[id] || d > touch[id])) touch[id] = d; };
    inArea.forEach((c) => M.entries(c.i).forEach((e) => tch(c.i, e.d)));
    Object.entries(S.all('visits')).forEach(([id, v]) => (v.dates || []).forEach((d) => tch(id, d)));
    Object.values(S.all('tasks')).forEach((x) => tch(x.cid, x.d));
    Object.values(plans).forEach((p) => (p.stops || []).forEach((x) => { if (x.done) tch(x.id, x.doneDate || p.created); }));
    const recentTouch = new Set(inArea.filter((c) => !(M.tz(c) > 0) && touch[c.i] && touch[c.i] >= m6).map((c) => c.i));
    const sos = (id) => !!S.get('sos', id);
    const act = inArea.filter((c) => c.prospect || M.tz(c) > 0 || sos(c.i) || recentTouch.has(c.i) || E.owes(c.i) || E.manual(c.i)).filter((c) => sos(c.i) || E.owes(c.i) || !E.blocked(c.i));
    const actPl = Object.entries(plans).filter(([, p]) => !p.closed && (p.cities || []).some((x) => sel.has(x)));
    const inPlan = new Set(); actPl.forEach(([, p]) => (p.stops || []).forEach((x) => inPlan.add(x.id)));
    return { act, visited, recent, actPl, inPlan, touch, recentTouch };
  };

  /* ---- προγράμματα ---- */
  E.allDone = (p) => (p.stops || []).length > 0 && p.stops.every((x) => x.done);
  E.activeList = () => Object.entries(S.all('plans')).filter(([, p]) => !p.closed && !E.allDone(p)).sort((a, b) => (b[1].created < a[1].created ? -1 : 1));
  E.doneList = () => Object.entries(S.all('plans')).filter(([, p]) => (p.closed || E.allDone(p)) && !(p.mode === 'free' && !(p.stops || []).some((x) => x.done))).sort((a, b) => (b[1].created < a[1].created ? -1 : 1));
  E.modeLbl = (m) => (m === 'new' ? ' · μη επισκεφθέντες' : m === 'rest' ? ' · υπόλοιποι' : m === 'free' ? ' · εκτός προγράμματος' : '');
  E.savePlan = async (id, p) => { const doc = JSON.parse(JSON.stringify(p)); delete doc.id; delete doc.saved; await db().set('plans/' + id, doc); S.put('plans', id, doc); return doc; };
  E.deletePlan = async (id) => { await db().remove('plans/' + id); S.drop('plans', id); };

  /* Τικ επίσκεψης: γράφει/σβήνει τη σημερινή ημερομηνία στο visits (μένει κι αν σβηστεί το πρόγραμμα). */
  E.setVisit = async (id, on) => {
    const v = S.get('visits', id) || { dates: [] }, d = u.today(); let ds = (v.dates || []).slice();
    if (on) { if (!ds.includes(d)) ds.push(d); } else ds = ds.filter((x) => x !== d);
    ds.sort(); const nv = { dates: ds.slice(-60), name: (M.byId(id) || {}).name || '' };
    if (ds.length) { await db().set('visits/' + id, nv); S.put('visits', id, nv); } else { await db().remove('visits/' + id); S.drop('visits', id); }
  };
  E.clearSos = async (id) => { if (S.get('sos', id)) { await db().remove('sos/' + id); S.drop('sos', id); } };
  E.setExit = async (id, r) => { const c = M.byId(id), doc = { r, d: u.today(), name: c ? c.name : '' }; await db().set('xout/' + id, doc); S.put('xout', id, doc); };
  E.clearExit = async (id) => { await db().remove('xout/' + id); S.drop('xout', id); };
  E.bumpSkip = async (id) => { const z = S.get('zskip', id) || { n: 0 }, doc = { n: (z.n || 0) + 1, d: u.today() }; await db().set('zskip/' + id, doc); S.put('zskip', id, doc); };
  /* Προσωρινός πελάτης (νέο κομμωτήριο). */
  /* Πόλη όπως γράφεται στο πελατολόγιο (ίδια με την παλιά: χωρίς τόνους, κεφαλαία, ή η υπάρχουσα γραφή). */
  const flat = (x) => String(x || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
  E.canonCity = (s) => { const t = flat(s), hit = M.clients().map((c) => c.city).find((c) => flat(c) === t); return hit || t; };
  E.newProspect = async (x) => { const id = 'p' + Date.now(), doc = { name: x.name, city: x.city, addr: x.addr || '', phone: x.phone || '', created: u.today() }; await db().set('prospects/' + id, doc); S.put('prospects', id, doc); return id; };
  /* Επισκέψεις εκτός προγράμματος: το πρόγραμμα της ημέρας 'free-ΗΜΕΡΟΜΗΝΙΑ' (ένα ανά μέρα). */
  E.freeId = () => 'free-' + u.today();
  E.lastVisit = (id) => { let m = ''; ((S.get('visits', id) || {}).dates || []).forEach((d) => { if (d > m) m = d; }); M.entries(id).forEach((e) => { if (e && e.d && e.d > m) m = e.d; }); return m; };
  E.openStop = (id) => { for (const [pid, p] of Object.entries(S.all('plans'))) { if (p.closed || p.mode === 'free') continue; const k = (p.stops || []).findIndex((s) => s.id === id); if (k >= 0) return [pid, p, k]; } return null; };
  E.visitedToday = (id) => {
    const t = u.today(), p = S.get('plans', E.freeId());
    if (p && (p.stops || []).some((s) => s.id === id && s.done)) return true;
    const os = E.openStop(id); if (os && os[1].stops[os[2]].done && os[1].stops[os[2]].doneDate === t) return true;
    return ((S.get('visits', id) || {}).dates || []).includes(t);
  };
  /* Τικ επίσκεψης από οπουδήποτε: αν είναι σε ανοιχτό πρόγραμμα τικάρεται εκεί, αλλιώς μπαίνει στα «εκτός προγράμματος». Οι τρεις εγγραφές (πρόγραμμα, επίσκεψη, SOS) γίνονται ταυτόχρονα. Επιστρέφει πού. */
  E.visit = async (id, on, base) => {
    const c = M.byId(id); if (!c) throw new Error('no client'); const t = u.today(), os = E.openStop(id);
    if (os) {
      const [pid, p, k] = os, np = JSON.parse(JSON.stringify(p)); np.stops[k].done = !!on; np.stops[k].doneDate = on ? t : '';
      await Promise.all([E.savePlan(pid, np), E.setVisit(id, on), on ? E.clearSos(id) : null]); return 'στο πρόγραμμα ' + (p.cities || []).join(' + ');
    }
    const fid = E.freeId(), p = JSON.parse(JSON.stringify(S.get('plans', fid) || { mode: 'free', cities: [], created: t, stops: [], note: 'Εκτός προγράμματος', sort: '', closed: true }));
    p.stops = p.stops || []; const k = p.stops.findIndex((s) => s.id === id);
    if (on) { if (k >= 0) Object.assign(p.stops[k], { done: true, doneDate: t }); else p.stops.push({ id, why: 'Εκτός προγράμματος', say: [], done: true, doneDate: t }); }
    else if (k >= 0) { if (p.stops[k].appt) Object.assign(p.stops[k], { done: false, doneDate: '' }); else p.stops.splice(k, 1); }
    freeCities(p, base || c.city);
    await Promise.all([E.savePlan(fid, p), E.setVisit(id, on), on ? E.clearSos(id) : null]); return 'εκτός προγράμματος';
  };

  const freeCities = (p, dflt) => { p.cities = [...new Set(p.stops.map((s) => (M.byId(s.id) || {}).city).filter(Boolean))]; if (!p.cities.length) p.cities = [dflt]; };
  /* Ραντεβού εκτός προγράμματος που δεν έγινε ακόμα (σήμερα ή αργότερα): [pid, p, k] ή null. Ένα ανά πελάτη. */
  E.freeAppt = (id) => { const t = u.today(); for (const [pid, p] of Object.entries(S.all('plans'))) { if (p.mode !== 'free' || String(p.created || '') < t) continue; const k = (p.stops || []).findIndex((s) => s.id === id && s.appt && !s.done); if (k >= 0) return [pid, p, k]; } return null; };
  E.freeAppts = () => { const t = u.today(), L = []; Object.entries(S.all('plans')).forEach(([pid, p]) => { if (p.mode !== 'free' || String(p.created || '') < t) return; (p.stops || []).forEach((s) => { if (s.appt && !s.done && M.byId(s.id)) L.push({ id: s.id, d: s.apptD || p.created, appt: s.appt, pid }); }); }); return L.sort((a, b) => (a.d + a.appt).localeCompare(b.d + b.appt)); };
  /* Το ραντεβού του πελάτη που δεν έγινε ακόμα, όπου κι αν είναι (ανοιχτό πρόγραμμα ή εκτός προγράμματος): { d, appt } ή null. */
  E.apptOf = (id) => {
    const os = E.openStop(id); if (os) { const s = os[1].stops[os[2]]; return s.appt && !s.done ? { d: s.apptD || os[1].created, appt: s.appt } : null; }
    const f = E.freeAppt(id); if (!f) return null; const s = f[1].stops[f[2]]; return { d: s.apptD || f[1].created, appt: s.appt };
  };
  /* Ραντεβού από οπουδήποτε: αν ο πελάτης είναι σε ανοιχτό πρόγραμμα μπαίνει εκεί, αλλιώς στα «εκτός προγράμματος» της μέρας d.
     time κενό = αφαίρεση ραντεβού. Επιστρέφει πού. */
  E.setAppt = async (id, d, time, base) => {
    const c = M.byId(id); if (!c) throw new Error('no client'); const t = u.today(), os = E.openStop(id);
    if (os) {
      const [pid, p, k] = os, np = JSON.parse(JSON.stringify(p)), s = np.stops[k];
      if (time) Object.assign(s, { appt: time, apptD: d || p.created || t }); else { delete s.appt; delete s.apptD; }
      await E.savePlan(pid, np); return 'στο πρόγραμμα ' + (p.cities || []).join(' + ');
    }
    const W = [], old = E.freeAppt(id);
    if (old && (!time || old[1].created !== d)) {   // βγαίνει από την παλιά μέρα
      const [opid, op] = old, np = JSON.parse(JSON.stringify(op)); np.stops = np.stops.filter((s) => !(s.id === id && !s.done));
      if (np.stops.length) { freeCities(np, base || c.city); W.push(E.savePlan(opid, np)); } else W.push(E.deletePlan(opid));
    }
    if (time) {
      const day = d || t, fid = 'free-' + day, p = JSON.parse(JSON.stringify(S.get('plans', fid) || { mode: 'free', cities: [], created: day, stops: [], note: 'Εκτός προγράμματος', sort: '', closed: true }));
      p.stops = p.stops || []; const s = p.stops.find((x) => x.id === id && !x.done);
      if (s) Object.assign(s, { appt: time, apptD: day }); else p.stops.push({ id, why: 'Ραντεβού', say: [], done: false, appt: time, apptD: day });
      freeCities(p, base || c.city); W.push(E.savePlan(fid, p));
    }
    await Promise.all(W); return 'εκτός προγράμματος';
  };
  /* ✓ σε συγκεκριμένη στάση (π.χ. ραντεβού από τις Εκκρεμότητες). Τα «εκτός προγράμματος» μένουν πάντα κλειστά.
     Επιστρέφει το πρόγραμμα αν μόλις ολοκληρώθηκε (για το τικ ολοκλήρωσης), αλλιώς null. */
  E.doneStop = async (pid, id) => {
    const p = S.get('plans', pid); if (!p) return null; const t = u.today(), free = p.mode === 'free';
    const stops = (p.stops || []).map((s) => (s.id === id ? Object.assign({}, s, { done: true, doneDate: t }) : s));
    const np = Object.assign({}, p, { stops, closed: free || E.allDone({ stops }) });
    await Promise.all([E.savePlan(pid, np), E.setVisit(id, true), E.clearSos(id)]);
    return !free && !E.allDone(p) && E.allDone(np) ? np : null;
  };

  /* Θέση εισαγωγής νέου πελάτη σε πρόγραμμα: δίπλα στους ίδιας πόλης. */
  E.insertStop = (p, st) => {
    const c = M.byId(st.id); let at = -1;
    p.stops.forEach((s, k) => { if (c && M.byId(s.id) && M.byId(s.id).city === c.city) at = k; });
    if (at >= 0) p.stops.splice(at + 1, 0, st); else p.stops.push(st);
  };
})();

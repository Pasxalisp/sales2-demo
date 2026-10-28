/* Αλγόριθμος «Πρόγραμμα μήνα»: ταξίδια, αποστάσεις (ευθεία × 1,3 από τη βάση), πρόταση μήνα. Χωρίς οθόνη. */
(function () {
  const PL = window.PL, M = PL.model, S = PL.store;
  const MP = (PL.monthplan = {});
  MP.GEO = { 'ΘΕΣΣΑΛΟΝΙΚΗ': [40.640, 22.944], 'ΚΑΛΟΧΩΡΙ': [40.646, 22.857], 'ΣΙΝΔΟΣ': [40.672, 22.807], 'ΧΑΛΑΣΤΡΑ': [40.627, 22.733], 'ΚΟΥΦΑΛΙΑ': [40.780, 22.576], 'ΧΑΛΚΗΔΟΝΑ': [40.731, 22.607], 'ΜΕΣΗΜΒΡΙΑ': [40.745, 22.850], 'ΛΑΓΚΑΔΑ': [40.750, 23.069], 'ΝΕΑ ΜΑΔΥΤΟΣ': [40.666, 23.537], 'ΣΤΑΥΡΟΣ': [40.665, 23.700], 'ΑΣΠΡΟΒΑΛΤΑ': [40.723, 23.707],
    'ΚΙΛΚΙΣ': [40.993, 22.875], 'ΠΟΛΥΚΑΣΤΡΟ': [40.998, 22.573], 'ΣΕΡΡΕΣ': [41.085, 23.548], 'ΣΙΔΗΡΟΚΑΣΤΡΟ': [41.236, 23.391], 'ΠΟΝΤΙΣΜΕΝΟ': [41.270, 23.300],
    'ΔΡΑΜΑ': [41.152, 24.147], 'ΠΡΟΣΟΤΣΑΝΗ': [41.178, 23.977], 'ΞΗΡΟΠΟΤΑΜΟΣ': [41.130, 24.130], 'ΚΑΛΑΜΠΑΚΙ': [41.050, 24.170], 'ΦΙΛΙΠΠΟΙ': [41.012, 24.296], 'ΚΑΒΑΛΑ': [40.937, 24.413], 'ΞΑΝΘΗ': [41.135, 24.888], 'ΕΧΙΝΟΣ': [41.277, 24.968], 'ΣΜΙΝΘΗ': [41.243, 24.930], 'ΚΟΜΟΤΗΝΗ': [41.119, 25.405], 'ΣΑΠΕΣ': [41.026, 25.703], 'ΑΛΕΞ/ΠΟΛΗ': [40.846, 25.874], 'ΦΕΡΡΕΣ': [40.896, 26.172], 'ΠΕΠΛΟΣ': [40.958, 26.243], 'ΤΥΧΕΡΟ': [41.028, 26.290], 'ΣΟΥΦΛΙ': [41.199, 26.297], 'ΔΙΔΥΜΟΤΕΙΧΟ': [41.348, 26.495], 'ΟΡΕΣΤΙΑΔΑ': [41.503, 26.531], 'ΘΑΣΟΣ': [40.778, 24.709], 'ΣΑΜΟΘΡΑΚΗ': [40.480, 25.530],
    'ΧΙΟΣ': [38.371, 26.136], 'ΜΥΤΙΛΗΝΗ': [39.107, 26.555], 'ΗΡΑΚΛΕΙΟ': [35.339, 25.144], 'ΚΑΤΕΡΙΝΗ': [40.270, 22.502], 'ΕΛΛΑΣΟΝΑ': [39.894, 22.188] };
  MP.DEF = { base: 'ΘΕΣΣΑΛΟΝΙΚΗ', vpd: 8, trips: [
    { id: 'the', name: 'Θεσσαλονίκη & γύρω', color: '#2a78d6', freq: 1, cities: ['ΘΕΣΣΑΛΟΝΙΚΗ', 'ΚΑΛΟΧΩΡΙ', 'ΣΙΝΔΟΣ', 'ΧΑΛΑΣΤΡΑ', 'ΜΕΣΗΜΒΡΙΑ', 'ΧΑΛΚΗΔΟΝΑ', 'ΚΟΥΦΑΛΙΑ', 'ΛΑΓΚΑΔΑ', 'ΝΕΑ ΜΑΔΥΤΟΣ', 'ΣΤΑΥΡΟΣ', 'ΑΣΠΡΟΒΑΛΤΑ'] },
    { id: 'north', name: 'Βόρεια', color: '#1baf7a', freq: 2, cities: ['ΚΙΛΚΙΣ', 'ΠΟΛΥΚΑΣΤΡΟ', 'ΣΙΔΗΡΟΚΑΣΤΡΟ', 'ΠΟΝΤΙΣΜΕΝΟ', 'ΣΕΡΡΕΣ'] },
    { id: 'east', name: 'Ανατολή – Θράκη', color: '#eb6834', freq: 4, cities: ['ΠΡΟΣΟΤΣΑΝΗ', 'ΔΡΑΜΑ', 'ΞΗΡΟΠΟΤΑΜΟΣ', 'ΚΑΛΑΜΠΑΚΙ', 'ΦΙΛΙΠΠΟΙ', 'ΚΑΒΑΛΑ', 'ΞΑΝΘΗ', 'ΕΧΙΝΟΣ', 'ΣΜΙΝΘΗ', 'ΚΟΜΟΤΗΝΗ', 'ΣΑΠΕΣ', 'ΑΛΕΞ/ΠΟΛΗ', 'ΦΕΡΡΕΣ', 'ΠΕΠΛΟΣ', 'ΤΥΧΕΡΟ', 'ΣΟΥΦΛΙ', 'ΔΙΔΥΜΟΤΕΙΧΟ', 'ΟΡΕΣΤΙΑΔΑ'] },
    { id: 'isl', name: 'Νησιά (Χίος, Μυτιλήνη)', color: '#6250d6', freq: 8, cities: ['ΜΥΤΙΛΗΝΗ', 'ΧΙΟΣ'], island: true },
    { id: 'thas', name: 'Θάσος / Σαμοθράκη', color: '#008300', freq: 8, cities: ['ΘΑΣΟΣ', 'ΣΑΜΟΘΡΑΚΗ'], island: true },
    { id: 'crete', name: 'Κρήτη', color: '#e87ba4', freq: 8, cities: ['ΗΡΑΚΛΕΙΟ'], island: true },
    { id: 'south', name: 'Νότια', color: '#eda100', freq: 8, cities: ['ΚΑΤΕΡΙΝΗ', 'ΕΛΛΑΣΟΝΑ'] }] };
  MP.settings = () => { const d = S.get('settings', 'trips'); return Object.assign(JSON.parse(JSON.stringify(MP.DEF)), d && d.trips ? d : d && d.base ? { base: d.base } : {}); };
  MP.iso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  MP.km = (a, b) => { const A = MP.GEO[a], B = MP.GEO[b]; if (!A || !B || a === b) return 0; const r = Math.PI / 180, dl = (B[0] - A[0]) * r, dg = (B[1] - A[1]) * r, x = Math.sin(dl / 2) ** 2 + Math.cos(A[0] * r) * Math.cos(B[0] * r) * Math.sin(dg / 2) ** 2; return 6371 * 2 * Math.asin(Math.sqrt(x)) * 1.3; };
  MP.fmtT = (k) => { const m = Math.round(k / 75 * 60); return m < 60 ? m + "'" : Math.floor(m / 60) + 'ω ' + String(m % 60).padStart(2, '0') + "'"; };
  MP.tripOf = (SET, city) => SET.trips.find((t) => t.cities.includes(city));
  MP.targets = (city) => M.clients().filter((c) => c.city === city && (M.tz(c) > 0 || S.get('sos', c.i) || c.prospect));
  MP.workdays = (y, m) => { const out = [], d = new Date(y, m, 1); while (d.getMonth() === m) { if (d.getDay() > 0 && d.getDay() < 6) out.push(MP.iso(d)); d.setDate(d.getDate() + 1); } return out; };
  MP.weeksOf = (days) => { const W = []; let cw = null; days.forEach((k) => { const d = new Date(k + 'T12:00:00'); if (!cw || d.getDay() === 1 || (cw.length && new Date(cw[cw.length - 1] + 'T12:00:00').getDay() >= d.getDay())) { cw = []; W.push(cw); } cw.push(k); }); return W; };
  MP.lastVisit = (city) => {
    let m = ''; M.clients().forEach((c) => { if (c.city !== city) return; const e = M.entries(c.i)[0]; if (e && e.d && e.d > m) m = e.d; });
    Object.values(S.all('plans')).forEach((p) => (p.stops || []).forEach((s) => { const c = M.byId(s.id); if (s.done && c && c.city === city) { const d = s.doneDate || p.created || ''; if (d > m) m = d; } }));
    return m;
  };
  /* Χιλιόμετρα μιας μέρας (για νησιά 0). Αν η προηγούμενη μέρα είναι στο ίδιο ταξίδι με διανυκτέρευση, ξεκινά από εκεί. */
  MP.dayKm = (SET, days, keys, i) => {
    const d = days[keys[i]]; if (!d || !d.cities || !d.cities.length) return 0;
    const t = MP.tripOf(SET, d.cities[0]); if (t && t.island) return 0;
    let start = SET.base; if (d.ov && i > 0) { const pv = days[keys[i - 1]]; if (pv && pv.cities && pv.cities.length && pv.trip === d.trip) start = pv.cities[pv.cities.length - 1]; }
    let s = 0, cur = start; d.cities.forEach((c) => { s += MP.km(cur, c); cur = c; }); if (!d.ovNext) s += MP.km(cur, SET.base); return s;
  };
  MP.planTrip = (SET, t, nd) => {
    const items = t.cities.filter((c) => MP.targets(c).length > 0).map((c) => ({ c, n: MP.targets(c).length })); if (!items.length) return [];
    const out = [];
    if (t.island) { items.forEach((x) => { const k = Math.max(1, Math.ceil(x.n / SET.vpd)); for (let i = 0; i < k; i++) out.push([x.c]); }); return nd ? out.slice(0, nd) : out; }
    let curD = [], load = 0, first = null; const cap = SET.vpd;
    items.forEach((x) => { let left = x.n; while (left > 0) { const far = first && MP.km(first, x.c) > 110; if (load >= cap || (far && curD.length && !curD.includes(x.c))) { out.push(curD); curD = []; load = 0; first = null; } if (!first) first = x.c; const take = Math.min(cap - load, left); if (!curD.includes(x.c)) curD.push(x.c); load += take; left -= take; } });
    if (curD.length) out.push(curD);
    for (let i = out.length - 2; i >= 0; i--) { const a = out[i], b = out[i + 1]; const la = a.reduce((s, c) => s + MP.targets(c).length, 0), lb = b.reduce((s, c) => s + MP.targets(c).length, 0); if (la + lb <= cap && MP.km(a[0], b[b.length - 1]) <= 110 && !a.some((c) => b.includes(c))) out.splice(i, 2, a.concat(b)); }
    return nd ? out.slice(0, nd) : out;
  };
  /* Πρόταση μήνα: ταξίδια που «χρωστάνε» επίσκεψη μπαίνουν πρώτα, τα υπόλοιπα γεμίζουν με Θεσσαλονίκη. */
  MP.propose = (SET, y, m) => {
    const days = MP.workdays(y, m), td = MP.iso(new Date()), W = MP.weeksOf(days), res = {};
    const due = (t) => { let mn = ''; t.cities.forEach((c) => { if (!MP.targets(c).length) return; const v = MP.lastVisit(c); if (!mn || (v || '0') < mn) mn = v || '0'; }); if (!mn || mn === '0') return 9; return (Date.now() - new Date(mn + 'T12:00:00')) / 6048e5 / (t.freq || 4); };
    const used = {}; let theI = 0;
    const thePl = (() => { const q = SET.trips.find((t) => t.id === 'the'); return q ? MP.planTrip(SET, q, 0) : []; })();
    const squeeze = (d, n) => { d = d.map((x) => x.slice()); while (d.length > n) { let bi = 0, bl = 1e9; for (let i = 0; i < d.length - 1; i++) { const l = d[i].concat(d[i + 1]).reduce((s, c) => s + MP.targets(c).length, 0); if (l < bl) { bl = l; bi = i; } } d.splice(bi, 2, [...new Set(d[bi].concat(d[bi + 1]))]); } return d; };
    const multi = SET.trips.filter((t) => t.id !== 'the' && t.cities.some((c) => MP.targets(c).length));
    W.forEach((wk, wi) => {
      const free = wk.filter((k) => k >= td); if (!free.length) return;
      const cand = multi.filter((t) => !(t.id in used) || (wi - used[t.id]) >= (t.freq || 4)).map((t) => ({ t, s: due(t), need: MP.planTrip(SET, t, 0) })).filter((x) => x.s >= 0.75 && x.need.length).sort((a, b) => (b.need.length >= 4) - (a.need.length >= 4) || b.s - a.s);
      for (const x of cand) {
        if (!free.length) break;
        if (x.need.length > free.length) { if (x.need.length >= 4 && free.length >= 4 && !x.t.island) x.need = squeeze(x.need, free.length); else continue; }
        const ks = free.splice(0, x.need.length);
        ks.forEach((k, i) => { res[k] = { trip: x.t.id, cities: x.need[i], ov: i > 0 && !x.t.island, ovNext: i < x.need.length - 1 && !x.t.island }; });
        used[x.t.id] = wi;
      }
      if (free.length) free.forEach((k) => { res[k] = { trip: 'the', cities: thePl.length ? thePl[theI++ % thePl.length] : [SET.base] }; });
    });
    return res;
  };
  /* Κάλυψη: πόσοι ενεργοί πελάτες (με τζίρο) τσεκαρίστηκαν μέσα στον μήνα — σημείωση ή τικ σε πρόγραμμα, όπως στην παλιά. */
  MP.coverage = (y, m) => {
    const pre = y + '-' + String(m + 1).padStart(2, '0'), act = M.clients().filter((c) => M.tz(c) > 0);
    const seen = act.filter((c) => M.entries(c.i).some((e) => String(e.d || '').startsWith(pre)) || Object.values(S.all('plans')).some((p) => (p.stops || []).some((s) => s.id === c.i && s.done && String(s.doneDate || p.created || '').startsWith(pre))));
    return [seen.length, act.length];
  };
})();

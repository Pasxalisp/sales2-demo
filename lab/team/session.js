/* ΔΟΚΙΜΑΣΤΙΚΟ «Χρήστες και ρόλοι» (φάκελος lab/, μόνο στη δοκιμαστική έκδοση — όχι στο Sales 2.0).
   Τρέχει ΠΡΙΝ από τον adapter: βρίσκει ποιος είναι συνδεδεμένος και του δίνει μόνο τα δικά του δεδομένα,
   όπως θα έκανε ένας server με κανόνες πρόσβασης. Ο πωλητής βλέπει τους πελάτες των περιοχών του·
   ο υπεύθυνος ομάδας και ο διευθυντής βλέπουν τους άλλους μόνο από τις οθόνες «Ομάδα» (team.js), μόνο για ανάγνωση.
   Όλα μένουν στη συσκευή: οι αλλαγές κάθε χρήστη στο localStorage 'sales2-demo:<id>', οι χρήστες στο 'sales2-demo:users'.
   Για πραγματική χρήση αλλάζει μόνο η αποθήκευση (Supabase ή server της εταιρείας)· οι κανόνες μένουν ίδιοι. */
(function () {
  const BASE = window.PL_LOCAL; if (!BASE || !BASE.seed) return;
  const SEED = BASE.seed, NS = BASE.key || 'sales2-demo';
  const ls = { get: (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* χωρίς αποθήκευση: μένει για αυτή τη συνεδρία */ } },
    del: (k) => { try { localStorage.removeItem(k); } catch (e) { /* τίποτα */ } } };

  const TEAMS = [{ id: 'north', name: 'Ομάδα Βορρά' }, { id: 'east', name: 'Ομάδα Θράκης και Νησιών' }];
  /* Περιοχές: «ΠΟΛΗ» ή «ΠΟΛΗ|ΠΕΡΙΟΧΗ» (η πιο συγκεκριμένη κερδίζει· όχι «/», γιατί υπάρχει η «ΑΛΕΞ/ΠΟΛΗ»).
     Ό,τι δεν ανήκει πουθενά πάει στον διαχειριστή. */
  const USERS0 = [
    { id: 'u1', name: 'Αλέξης Τσακίρης', email: 'alexis@sales2.demo', role: 'director', team: '', code: '', cities: [] },
    { id: 'u2', name: 'Γιώργος Παπαδάκης', email: 'giorgos@sales2.demo', role: 'lead', team: 'north', code: '001',
      cities: ['ΘΕΣΣΑΛΟΝΙΚΗ', 'ΘΕΣΣΑΛΟΝΙΚΗ|ΚΕΝΤΡΟ', 'ΘΕΣΣΑΛΟΝΙΚΗ|ΚΑΛΑΜΑΡΙΑ', 'ΘΕΣΣΑΛΟΝΙΚΗ|ΦΑΛΗΡΟ', 'ΘΕΣΣΑΛΟΝΙΚΗ|ΠΥΛΑΙΑ', 'ΘΕΣΣΑΛΟΝΙΚΗ|ΕΥΑΓΓΕΛΙΣΤΡΙΑ'] },
    { id: 'u3', name: 'Μαρία Κωνσταντίνου', email: 'maria@sales2.demo', role: 'sales', team: 'north', code: '002',
      cities: ['ΘΕΣΣΑΛΟΝΙΚΗ|ΕΥΟΣΜΟΣ', 'ΘΕΣΣΑΛΟΝΙΚΗ|ΣΤΑΥΡΟΥΠΟΛΗ', 'ΘΕΣΣΑΛΟΝΙΚΗ|ΑΜΠΕΛΟΚΗΠΟΙ', 'ΘΕΣΣΑΛΟΝΙΚΗ|ΗΛΙΟΥΠΟΛΗ', 'ΘΕΣΣΑΛΟΝΙΚΗ|ΠΟΛΙΧΝΗ', 'ΘΕΣΣΑΛΟΝΙΚΗ|ΚΟΡΔΕΛΙΟ', 'ΘΕΣΣΑΛΟΝΙΚΗ|ΝΕΑΠΟΛΗ', 'ΘΕΣΣΑΛΟΝΙΚΗ|ΚΟΥΦΑΛΙΑ', 'ΘΕΣΣΑΛΟΝΙΚΗ|ΝΕΑ ΕΥΚΑΡΠΙΑ',
        'ΚΑΛΟΧΩΡΙ', 'ΣΙΝΔΟΣ', 'ΧΑΛΑΣΤΡΑ', 'ΜΕΣΗΜΒΡΙΑ', 'ΧΑΛΚΗΔΟΝΑ', 'ΚΟΥΦΑΛΙΑ', 'ΛΑΓΚΑΔΑ', 'ΝΕΑ ΜΑΔΥΤΟΣ', 'ΣΤΑΥΡΟΣ', 'ΑΣΠΡΟΒΑΛΤΑ', 'ΚΑΤΕΡΙΝΗ', 'ΕΛΛΑΣΟΝΑ'] },
    { id: 'u4', name: 'Νίκος Δημητρίου', email: 'nikos@sales2.demo', role: 'sales', team: 'north', code: '004',
      cities: ['ΚΙΛΚΙΣ', 'ΠΟΛΥΚΑΣΤΡΟ', 'ΣΙΔΗΡΟΚΑΣΤΡΟ', 'ΠΟΝΤΙΣΜΕΝΟ', 'ΣΕΡΡΕΣ'] },
    { id: 'u5', name: 'Ελένη Σταυρίδου', email: 'eleni@sales2.demo', role: 'lead', team: 'east', code: '005',
      cities: ['ΞΑΝΘΗ', 'ΕΧΙΝΟΣ', 'ΣΜΙΝΘΗ', 'ΚΟΜΟΤΗΝΗ', 'ΣΑΠΕΣ'] },
    { id: 'u6', name: 'Κώστας Μιχαηλίδης', email: 'kostas@sales2.demo', role: 'sales', team: 'east', code: '008',
      cities: ['ΑΛΕΞ/ΠΟΛΗ', 'ΦΕΡΡΕΣ', 'ΠΕΠΛΟΣ', 'ΤΥΧΕΡΟ', 'ΣΟΥΦΛΙ', 'ΔΙΔΥΜΟΤΕΙΧΟ', 'ΟΡΕΣΤΙΑΔΑ', 'ΜΥΤΙΛΗΝΗ', 'ΧΙΟΣ', 'ΗΡΑΚΛΕΙΟ'] },
    { id: 'u7', name: 'Πασχάλης Περλής', email: 'pasxalis@sales2.demo', role: 'sales', team: 'east', code: '003', admin: true,
      cities: ['ΚΑΒΑΛΑ', 'ΔΡΑΜΑ', 'ΠΡΟΣΟΤΣΑΝΗ', 'ΞΗΡΟΠΟΤΑΜΟΣ', 'ΚΑΛΑΜΠΑΚΙ', 'ΦΙΛΙΠΠΟΙ', 'ΘΑΣΟΣ', 'ΣΑΜΟΘΡΑΚΗ'] },
  ];
  const ADMIN = 'u7', PASS = 'demo';
  const ROLES = { director: 'Διευθυντής', lead: 'Υπεύθυνος ομάδας', sales: 'Πωλητής' };

  const users = () => (ls.get(NS + ':users') || USERS0).map((u) => Object.assign({ active: true }, u));
  const user = (id) => users().find((u) => u.id === id) || null;
  const saveUsers = (L) => ls.set(NS + ':users', L);

  /* Ποιος έχει έναν πελάτη: η πιο συγκεκριμένη περιοχή κερδίζει (ΠΟΛΗ|ΠΕΡΙΟΧΗ πριν από ΠΟΛΗ). */
  /* strict: χωρίς ιδιοκτήτη → null (για τις «ελεύθερες περιοχές» της οθόνης χρηστών) */
  function ownerMap(strict) {
    const exact = {}, city = {};
    users().forEach((u) => (u.cities || []).forEach((k) => { if (k.includes('|')) exact[k] = u.id; else city[k] = u.id; }));
    return (c) => {
      const no = strict ? null : ADMIN;
      if (!c) return no;
      if (c.i === 'c999') return ADMIN;   /* ο δοκιμαστικός πελάτης με το κινητό του διαχειριστή */
      const a = String(c.area || '').trim();
      return exact[c.city + '|' + a] || city[c.city] || no;
    };
  }

  const col = (p) => p.slice(0, p.lastIndexOf('/')), idOf = (p) => p.slice(p.lastIndexOf('/') + 1);
  const KEYED = new Set(['clients', 'prospects', 'notes', 'balances', 'balnotes', 'items', 'manual', 'visits', 'xout', 'zskip', 'tech', 'sos', 'dealmsg', 'geo']);
  const MAPS = new Set(['deals/all', 'cats/all', 'brands/all']);

  /* Τα δεδομένα ενός χρήστη, όπως θα του τα έδινε ο server: path -> doc (χωρίς τις δικές του αλλαγές). */
  function seedFor(uid) {
    const u = user(uid), own = ownerMap(), mine = new Set(), out = {};
    if (!u) return out;
    Object.entries(SEED).forEach(([p, d]) => { const c = col(p); if ((c === 'clients' || c === 'prospects') && own(Object.assign({ i: idOf(p) }, d)) === uid) mine.add(idOf(p)); });
    Object.entries(SEED).forEach(([p, d]) => {
      const c = col(p), id = idOf(p);
      if (KEYED.has(c)) { if (mine.has(id)) out[p] = d; return; }
      if (MAPS.has(p)) { const m = {}; Object.entries(d).forEach(([k, v]) => { if (k[0] === '_' || mine.has(k)) m[k] = v; }); out[p] = m; return; }
      if (c === 'tasks' || c === 'orders') { if (mine.has(d.cid)) out[p] = d; return; }
      if (c === 'plans') { const stops = (d.stops || []).filter((s) => mine.has(s.id)); if (stops.length) out[p] = Object.assign({}, d, { stops }); return; }
      if (c === 'seminars') { out[p] = Object.assign({}, d, { cust: (d.cust || []).filter((x) => mine.has(x)), conf: (d.conf || []).filter((x) => mine.has(x)) }); return; }
      if (c === 'month' || c === 'extra') { if (uid === ADMIN) out[p] = d; return; }   /* το πρόγραμμα μήνα και οι έξτρα εισπράξεις του διαχειριστή */
      if (p === 'settings/card') { out[p] = Object.assign({}, d, { name: u.name, email: u.email, org: 'Δοκιμαστική έκδοση' }); return; }
      if (p === 'settings/trips') { const first = (u.cities || [])[0]; out[p] = Object.assign({}, d, { base: first ? first.split('|')[0] : d.base }); return; }
      if (c === 'flash') {   /* οι γραμμές του FLASH με τα ονόματα των δοκιμαστικών χρηστών */
        const byCode = {}; users().forEach((x) => { if (x.code) byCode[x.code] = x.name.toUpperCase(); });
        const m = {}; Object.entries(d.m || {}).forEach(([k, rows]) => { m[k] = rows.map((r) => (byCode[r[0]] ? [r[0], byCode[r[0]]].concat(r.slice(2)) : r)); });
        out[p] = Object.assign({}, d, { me: u.code || d.me, m }); return;
      }
      out[p] = d;   /* κοινά: κατάλογος, ρυθμίσεις, διαδρομές */
    });
    if (ACT[uid]) activity(uid, out, mine);
    return out;
  }

  /* Ψεύτικη δραστηριότητα για τους άλλους δοκιμαστικούς πωλητές (επισκέψεις, σημειώσεις, επόμενες επαφές), ώστε οι
     οθόνες «Ομάδα» να έχουν τι να δείξουν. Ίδια κάθε φορά (σταθερός σπόρος ανά χρήστη), με ημερομηνίες γύρω από σήμερα.
     Ό,τι υπάρχει ήδη στα ψεύτικα δεδομένα μένει· η δραστηριότητα προστίθεται από πάνω. */
  const ACT = { u2: 0.45, u3: 0.6, u4: 0.16, u5: 0.5, u6: 0.3, u7: 0.4 };
  const TXT = [
    ['Πήρε Topchic και Colorance. Θέλει τις νέες αποχρώσεις.', 'Topchic, Colorance', 'Να φέρω χρωματολόγιο'],
    ['Επίσκεψη. Ενδιαφέρον για Elumen.', 'Elumen', 'Δείγμα Elumen'],
    ['Παρήγγειλε Dualsenses για λουτήρα και μεταπώληση.', 'Dualsenses', ''],
    ['Θέλει σεμινάριο για ντεκαπάζ.', 'Silklift', 'Να κλείσω ημερομηνία σεμιναρίου'],
    ['Δεν ήταν ο ιδιοκτήτης. Να ξαναπεράσω.', '', ''],
    ['Πήρε Styling για τη βιτρίνα.', 'Styling', ''],
    ['Συζητήσαμε τη συμφωνία της χρονιάς.', '', 'Να του πω πόσα λείπουν για τον στόχο'],
    ['Παράπονο για καθυστέρηση στην παράδοση.', '', 'Να ελέγξω την παραγγελία'],
    ['Πήρε Gloss tones. Ευχαριστημένη από το αποτέλεσμα.', 'Gloss tones', ''],
    ['Δοκίμασε πλεξ σε δύο πελάτισσες, θέλει κι άλλο.', 'Subbrand', 'Να φέρω Bond pro'],
  ];
  const pad = (n) => (n < 10 ? '0' : '') + n;
  const iso = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const dayAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); if (d.getDay() === 0) d.setDate(d.getDate() - 2); if (d.getDay() === 6) d.setDate(d.getDate() - 1); return iso(d); };
  const dayIn = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); };
  function activity(uid, out, mine) {
    let h = 0; for (const ch of uid) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const rnd = () => { h = (h + 0x6D2B79F5) >>> 0; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    [...mine].sort().forEach((id) => {
      if (rnd() >= ACT[uid]) return;
      const c = out['clients/' + id] || out['prospects/' + id] || {};
      const v = out['visits/' + id] || { dates: [], name: c.name || '' }, n = 1 + Math.floor(rnd() * 3), add = [];
      for (let k = 0; k < n; k++) add.push(dayAgo(1 + Math.floor(rnd() * 55)));
      const dates = [...new Set((v.dates || []).concat(add))].sort();
      out['visits/' + id] = { name: v.name || c.name || '', dates };
      if (rnd() < 0.75) {
        const t = TXT[Math.floor(rnd() * TXT.length)], nb = out['notes/' + id] || { code: c.code || '', name: c.name || '', works: [], entries: [] };
        const next = rnd() < 0.35 ? dayIn(Math.floor(rnd() * 21) - 12) : '';
        const e = { d: dates[dates.length - 1], text: t[0], products: t[1], todo: t[2], next };
        out['notes/' + id] = Object.assign({}, nb, { entries: [e].concat(nb.entries || []) });
      }
      if (rnd() < 0.04 && !out['tech/' + id]) out['tech/' + id] = { d: dayAgo(Math.floor(rnd() * 20)), note: 'Επίδειξη Elumen' };
    });
  }
  /* Όλα τα δεδομένα ενός χρήστη, μαζί με τις αλλαγές του σε αυτή τη συσκευή (για τις οθόνες «Ομάδα»). */
  function dataFor(uid) {
    const m = new Map(Object.entries(seedFor(uid))), over = ls.get(NS + ':' + uid) || {};
    Object.entries(over).forEach(([p, v]) => { if (v === null) m.delete(p); else m.set(p, v); });
    return m;
  }

  const sid = ls.get(NS + ':session'), me = sid && user(sid) && user(sid).active ? user(sid) : null;
  window.PL_DEMO = {
    TEAMS, ROLES, ADMIN, users, user, saveUsers, ownerMap, dataFor, me,
    needLogin: !me,
    /* είσοδος: email + κωδικός (όλοι οι δοκιμαστικοί: «demo») */
    check: (email, pass) => { const u = users().find((x) => x.email.toLowerCase() === String(email).trim().toLowerCase()); return u && u.active && pass === PASS ? u : null; },
    login: (uid) => { ls.set(NS + ':session', uid); location.reload(); },
    logout: () => { ls.del(NS + ':session'); location.reload(); },
    /* «Επαναφορά αρχικών χρηστών» (διαχειριστής): μόνο χρήστες, ρόλοι και περιοχές· τα δεδομένα των πωλητών μένουν */
    resetUsers: () => { ls.del(NS + ':users'); location.reload(); },
    /* όλοι οι πελάτες του δοκιμαστικού πελατολογίου (για το μοίρασμα περιοχών) */
    seedAll: () => Object.entries(SEED).filter(([p]) => { const c = col(p); return c === 'clients' || c === 'prospects'; }).map(([p, d]) => Object.assign({ i: idOf(p) }, d)),
  };
  /* ο adapter θα φορτώσει μόνο τα δεδομένα του συνδεδεμένου (χωρίς σύνδεση: τίποτα) */
  window.PL_LOCAL = me ? { key: NS + ':' + me.id, seed: seedFor(me.id) } : { key: NS + ':none', seed: {} };
})();

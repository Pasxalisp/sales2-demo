/* Εργαλεία του Claude για την Υπαγόρευση: ίδια 14 με την παλιά (τα εργαλεία παραγγελίας μένουν εκτός μέχρι να αποφασιστούν οι παραγγελίες).
   Οι περιγραφές είναι αυτούσιες της παλιάς. Γράφουν μόνο μέσω του adapter και ενημερώνουν το store. */
(function () {
  const PL = window.PL, u = PL.u, M = PL.model, S = PL.store, db = () => PL.adapter.db;
  const D = (PL.dictation = PL.dictation || {});
  const act = (t) => D.onAct && D.onAct(t);
  const list = (v) => (Array.isArray(v) ? v : String(v || '').split(',')).map((x) => String(x).trim()).filter(Boolean);
  const cust = (id) => { const c = M.byId(String(id)); if (!c) throw new Error('Δεν υπάρχει πελάτης με id ' + id + '. Κάνε πρώτα find_customers.'); return c; };
  const okProduct = (v) => M.PR.find((p) => u.nn(p) === u.nn(v)) || v;
  const isDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v || ''));
  const isTime = (v) => /^\d{1,2}:\d{2}$/.test(String(v || ''));
  const str = { type: 'string' };
  const put = async (col, id, doc) => { await db().set(col + '/' + id, doc); S.put(col, id, doc); };

  /* σεμινάριο: βρίσκει με τίτλο (ακριβές ή που περιέχεται), αλλιώς δημιουργεί */
  const semFind = (title) => { const t = u.nn(title).trim(); if (!t) return null; const L = Object.entries(S.all('seminars'));
    return (L.find(([, x]) => u.nn(x.title) === t) || L.find(([, x]) => u.nn(x.title).includes(t) || t.includes(u.nn(x.title))) || [null])[0]; };
  async function semAdd(title, cid, date) {
    let id = semFind(title), created = false;
    if (!id) { id = 's' + Date.now() + Math.floor(Math.random() * 1000); await put('seminars', id, { title: String(title).trim(), date: date || '', cust: [], created: u.today() }); created = true; }
    const x = Object.assign({}, S.get('seminars', id)); x.cust = [...new Set((x.cust || []).concat(cid ? [cid] : []))]; if (date && !x.date) x.date = date;
    await put('seminars', id, x); return { id, created };
  }
  /* ανοιχτά προγράμματα, το πιο πρόσφατο πρώτο */
  const openPlans = () => PL.plans.activeList();

  D.TOOLS = [
    { name: 'find_customers', description: "Ψάχνει πελάτες στη λίστα με όνομα, κομμάτι ονόματος, κωδικό ή και πόλη. Επιστρέφει έως 8 υποψήφιους {id,name,city,addr,code,temporary}. Τα ονόματα στη λίστα είναι κεφαλαία και κομμένα στο τέλος.",
      inputSchema: { type: 'object', properties: { query: str }, required: ['query'] },
      execute: ({ query }) => PL.findCustomers(String(query || '')) },

    { name: 'get_customer', description: "Επιστρέφει την καρτέλα ενός πελάτη: όνομα, πόλη, διεύθυνση, τηλέφωνο, τι δουλεύει ήδη, τις τελευταίες σημειώσεις, αν έχει SOS και αν είναι στη λίστα τεχνικού.",
      inputSchema: { type: 'object', properties: { customer_id: str }, required: ['customer_id'] },
      execute: ({ customer_id }) => { const c = cust(customer_id), n = S.get('notes', c.i) || {};
        return { id: c.i, name: c.name, city: c.city, addr: c.addr, phone: c.t1 || c.t2 || '', temporary: !!c.prospect, works: n.works || [], sos: !!S.get('sos', c.i), tech: !!S.get('tech', c.i), recent: (n.entries || []).slice(0, 5) }; } },

    { name: 'add_note', description: "Γράφει μια νέα καταχώρηση στην καρτέλα του πελάτη. discussed = Τι συζητήσαμε, products = Προϊόντα (λίστα), todo = Να πω την επόμενη φορά, next = Εκκρεμότητα ημερομηνία (YYYY-MM-DD ή κενό), next_time = ώρα εκκρεμότητας (HH:MM ή κενό), works = Δουλεύει ήδη (προστίθενται σε όσα υπάρχουν). Γράψε μόνο ό,τι ειπώθηκε.",
      inputSchema: { type: 'object', properties: { customer_id: str, discussed: str, products: { type: 'array', items: str }, todo: str, next: str, next_time: str, works: { type: 'array', items: str } }, required: ['customer_id'] },
      execute: async (x) => {
        const c = cust(x.customer_id), worksBefore = M.works(c.i).length;
        const nx = isDate(x.next) ? String(x.next) : '';
        const e = { d: u.today(), products: list(x.products).map(okProduct).join(', '), text: String(x.discussed || '').trim(), todo: String(x.todo || '').trim(), next: nx };
        if (nx && isTime(x.next_time)) e.nt = String(x.next_time).padStart(5, '0');
        await PL.notes.add(c.i, e, list(x.works).map(okProduct));
        const what = []; if (e.text) what.push('Τι συζητήσαμε'); if (e.products) what.push('Προϊόντα'); if (e.todo) what.push('Να πω'); if (e.next) what.push('Εκκρεμότητα ' + e.next + (e.nt ? ' ' + e.nt : '')); if (M.works(c.i).length > worksBefore) what.push('Δουλεύει ήδη');
        act('✍️ ' + c.name + ': ' + (what.join(', ') || 'σημείωση')); return 'ok'; } },

    { name: 'add_to_seminar', description: "Βάζει πελάτη σε σεμινάριο της Ακαδημίας. Αν το σεμινάριο δεν υπάρχει, το δημιουργεί με αυτόν τον τίτλο. Χρησιμοποίησέ το όταν ο πωλητής λέει ότι ένας πελάτης ενδιαφέρεται/θα έρθει σε σεμινάριο. title = ο τίτλος (χρησιμοποίησε ακριβώς τον υπάρχοντα αν ταιριάζει), customer_id, date = YYYY-MM-DD αν ειπώθηκε.",
      inputSchema: { type: 'object', properties: { title: str, customer_id: str, date: str }, required: ['title'] },
      execute: async (x) => {
        const tl = String(x.title || '').trim(); if (!tl) throw new Error('Χρειάζεται τίτλος');
        const cid = x.customer_id ? cust(x.customer_id).i : '', dt = isDate(x.date) ? String(x.date) : '';
        const r = await semAdd(tl, cid, dt); act('🎓 ' + (r.created ? 'Νέο σεμινάριο: ' : 'Σεμινάριο: ') + S.get('seminars', r.id).title + (cid ? ' ← ' + M.byId(cid).name : ''));
        return r.created ? 'Δημιουργήθηκε νέο σεμινάριο' : 'ok'; } },

    { name: 'add_task', description: "Βάζει μια εκκρεμότητα στη λίστα «Εκκρεμότητες» της αρχικής. Χρησιμοποίησέ το ΜΟΝΟ όταν ο πωλητής το ζητά ρητά με λέξεις όπως «εκκρεμότητα/εκκρεμότητες», «να μου θυμίσεις», «υπενθύμιση», «βάλε να πάρω τηλέφωνο …». ΠΟΤΕ από μόνο σου για παραγγελίες, συζητήσεις ή «να πω» — αυτά πάνε μόνο στο add_note. text = τι πρέπει να γίνει, customer_id = αν αφορά πελάτη (αλλιώς κενό), date = YYYY-MM-DD (αν δεν ειπώθηκε, σήμερα), time = HH:MM ή κενό. Μένει μέχρι να πατήσει «Έγινε».",
      inputSchema: { type: 'object', properties: { text: str, customer_id: str, date: str, time: str }, required: ['text'] },
      execute: async (x) => {
        const tx = String(x.text || '').trim(); if (!tx) throw new Error('Χρειάζεται κείμενο');
        const cid = x.customer_id ? cust(x.customer_id).i : '', dt = isDate(x.date) ? String(x.date) : u.today(), tm = isTime(x.time) ? String(x.time).padStart(5, '0') : '';
        const id = 't' + Date.now() + Math.floor(Math.random() * 1000);
        await put('tasks', id, { t: tx, cid, next: dt, nt: tm, d: u.today(), done: false });
        act('📌 Εκκρεμότητα: ' + tx + (cid ? ' (' + M.byId(cid).name + ')' : '') + ' · ' + (dt === u.today() ? 'σήμερα' : dt) + (tm ? ' ' + tm : '')); return 'ok'; } },

    { name: 'complete_tasks', description: "Κλείνει (τικ «Έγινε») τις ανοιχτές εκκρεμότητες ενός πελάτη, ΜΟΝΟ όταν ο πωλητής λέει ότι έκανε αυτό που εκκρεμούσε (π.χ. «τον πήρα τηλέφωνο τον Χ»). Επιστρέφει πόσες έκλεισαν.",
      inputSchema: { type: 'object', properties: { customer_id: str }, required: ['customer_id'] },
      execute: async ({ customer_id }) => {
        const c = cust(customer_id), tk = Object.entries(S.all('tasks')).filter(([, x]) => x && !x.done && x.cid === c.i);
        for (const [id, x] of tk) await put('tasks', id, Object.assign({}, x, { done: true, doneD: u.today() }));
        const open = M.entries(c.i).filter((e) => e && e.next && !e.done);
        if (!open.length) { if (tk.length) { act('✓ Εκκρεμότητα έκλεισε: ' + c.name); return 'Έκλεισαν ' + tk.length; } return 'Δεν έχει ανοιχτές εκκρεμότητες.'; }
        await PL.notes.mark(c.i, open, { done: true, doneD: u.today() });
        act('✓ Εκκρεμότητα έκλεισε: ' + c.name); return 'Έκλεισαν ' + open.length; } },

    { name: 'set_sos', description: "Βάζει αστέρι SOS στον πελάτη για το επόμενο πρόγραμμα. Χρησιμοποίησέ το όταν ο πωλητής λέει «βάλε SOS».",
      inputSchema: { type: 'object', properties: { customer_id: str }, required: ['customer_id'] },
      execute: async ({ customer_id }) => { const c = cust(customer_id); if (!S.get('sos', c.i)) await put('sos', c.i, { on: true, d: u.today() }); act('🆘 SOS: ' + c.name); return 'ok'; } },

    { name: 'add_tech', description: "Βάζει τον πελάτη στη λίστα Τεχνικής υποστήριξης, με σύντομη σημείωση τι χρειάζεται. Όταν ο πωλητής λέει «χρειάζεται τεχνικό».",
      inputSchema: { type: 'object', properties: { customer_id: str, note: str }, required: ['customer_id'] },
      execute: async ({ customer_id, note }) => { const c = cust(customer_id); await put('tech', c.i, { d: u.today(), note: String(note || '').trim() }); act('🔧 Τεχνικός: ' + c.name); return 'ok'; } },

    { name: 'add_temporary_customer', description: "Δημιουργεί προσωρινό πελάτη για κάποιον που ΔΕΝ υπάρχει στη λίστα (έλεγξε πρώτα με find_customers). Επιστρέφει το νέο customer_id για να γράψεις μετά add_note.",
      inputSchema: { type: 'object', properties: { name: str, city: str, phone: str, address: str }, required: ['name'] },
      execute: async (x) => {
        const name = String(x.name || '').trim(); if (!name) throw new Error('Χρειάζεται όνομα');
        const id = await PL.plans.newProspect({ name, city: PL.plans.canonCity(x.city || ''), addr: String(x.address || '').trim(), phone: String(x.phone || '').trim() });
        act('🆕 Προσωρινός πελάτης: ' + name); return { customer_id: id }; } },

    { name: 'make_reminder', description: "Ετοιμάζει υπενθύμιση για το ημερολόγιο του iPhone, ΜΟΝΟ όταν ο πωλητής ζητά υπενθύμιση. Εμφανίζεται κουμπί που πατάει ο πωλητής για να μπει στο ημερολόγιο. date YYYY-MM-DD, time HH:MM ή κενό.",
      inputSchema: { type: 'object', properties: { title: str, date: str, time: str, details: str }, required: ['title', 'date'] },
      execute: ({ title, date, time, details }) => {
        if (!isDate(date)) throw new Error('Η ημερομηνία θέλει μορφή YYYY-MM-DD');
        const tm = isTime(time) ? String(time).padStart(5, '0') : '', t = String(title || 'Υπενθύμιση');
        const req = 'Βάλε υπενθύμιση στο ημερολόγιό μου: ' + t + ', ' + date + (tm ? ' στις ' + tm : '') + (details ? ' (' + details + ')' : '');
        D.onReminder && D.onReminder({ title: t, date: String(date), time: tm, req });
        return 'Η σελίδα ΔΕΝ μπορεί να βάλει υπενθύμιση. Πες στον πωλητή να πατήσει «Αντιγραφή για το chat» και να το επικολλήσει στη συνομιλία του project, όπου μπαίνει κατευθείαν στο ημερολόγιο του iPhone.'; } },

    { name: 'who_bought', description: "Ποιοι πελάτες αγόρασαν ένα προϊόν (από τα είδη πελατών του συστήματος, φέτος και ίδια περίοδο πέρσι, σε τεμάχια). product = λέξεις του προϊόντος (π.χ. «colorance 5na», «βαφή 7n», «silklift strong»· τα παρατσούκλια βαφή/ρεφλέ/ντεκαπάζ/οξυζενέ/πλεξ/λουτήρα γίνονται δεκτά). cities = πόλεις όπως γράφονται στο πελατολόγιο (π.χ. ΑΛΕΞ/ΠΟΛΗ, ΞΑΝΘΗ, ΚΟΜΟΤΗΝΗ, ΘΕΣΣΑΛΟΝΙΚΗ)· κενό = όλες. Δεν υπάρχει ημερομηνία κάθε αγοράς.",
      inputSchema: { type: 'object', properties: { product: str, cities: { type: 'array', items: str } }, required: ['product'] },
      execute: async (x) => {
        await S.use('items'); const flat = (v) => String(v).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().trim(), all = new Set(M.clients().map((c) => c.city)), cs = new Set(), miss = [];
        (x.cities || []).forEach((s) => { const k = [...all].find((c) => flat(c) === flat(s)) || [...all].find((c) => flat(c).startsWith(flat(s).slice(0, 4))); if (k) cs.add(k); else miss.push(s); });
        const r = PL.wb.query(String(x.product || ''), cs, 'c'); if (!r) return 'κενό προϊόν';
        return JSON.stringify({ period: '1/1 έως ' + u.fd(r.d) + ' φέτος και ίδια περίοδος πέρσι', cities: [...cs], unknown_cities: miss, matched_items: Object.keys(r.names).slice(0, 15),
          customers: r.rows.slice(0, 40).map((y) => ({ id: y.c.i, name: y.c.name, city: y.c.city, this_year_qty: y.qc, last_year_qty: y.qp, items: y.its.map((i) => i.n + ' ' + (+i.qc || 0) + '/' + (+i.qp || 0)) })), total_customers: r.rows.length }); } },

    { name: 'add_to_plan', description: "Προσθέτει πελάτη (και προσωρινό) σε ανοιχτό ημερήσιο πρόγραμμα. Χρησιμοποίησέ το όταν πει «βάλε τον στο πρόγραμμα». Αν δεν υπάρχει στη λίστα, πρώτα add_temporary_customer και μετά αυτό. city = πόλη του προγράμματος (κενό = το πιο πρόσφατο ανοιχτό που περιέχει την πόλη του πελάτη).",
      inputSchema: { type: 'object', properties: { customer_id: str, city: str }, required: ['customer_id'] },
      execute: async (x) => {
        const c = cust(x.customer_id), want = x.city ? PL.plans.canonCity(x.city) : c.city;
        const L = openPlans(), hit = L.find(([, p]) => (p.cities || []).includes(want)) || L.find(([, p]) => (p.cities || []).includes(c.city));
        if (!hit) throw new Error('Δεν υπάρχει ανοιχτό πρόγραμμα για ' + want + '. Πες στον πωλητή να το φτιάξει πρώτα.');
        const [pid, p] = hit, np = JSON.parse(JSON.stringify(p)); np.stops = np.stops || [];
        if (np.stops.some((s) => s.id === c.i)) return 'ήδη στο πρόγραμμα';
        PL.plans.insertStop(np, { id: c.i, why: 'Προστέθηκε από εσένα', say: [], done: false, added: true });
        await PL.plans.savePlan(pid, np); act('📋 Στο πρόγραμμα ' + (p.cities || []).join(' + ') + ': ' + c.name); return 'ok'; } },

    { name: 'set_appointment', description: "Βάζει ώρα ραντεβού σε πελάτη (π.χ. «με τη Χ έχω ραντεβού στις 11:30»). Αν υπάρχει ανοιχτό πρόγραμμα για την πόλη του, μπαίνει εκεί (και τον προσθέτει αν λείπει)· αλλιώς στα ραντεβού των «Επισκέψεων εκτός προγράμματος». time = HH:MM (κενό = αφαίρεση ραντεβού), date = YYYY-MM-DD (αν δεν ειπώθηκε: η μέρα του προγράμματος ή σήμερα).",
      inputSchema: { type: 'object', properties: { customer_id: str, time: str, date: str }, required: ['customer_id', 'time'] },
      execute: async (x) => {
        const c = cust(x.customer_id), tm = isTime(x.time) ? String(x.time).padStart(5, '0') : '';
        const L = openPlans(), hit = L.find(([, p]) => (p.stops || []).some((s) => s.id === c.i)) || L.find(([, p]) => (p.cities || []).includes(c.city));
        if (!hit) { const w = await PL.plans.setAppt(c.i, isDate(x.date) ? String(x.date) : u.today(), tm, (S.get('settings', 'trips') || {}).base); act('🕐 Ραντεβού ' + (tm || 'αφαιρέθηκε') + ': ' + c.name + ' (' + w + ')'); return 'ok — ' + w; }
        const [pid, p] = hit, np = JSON.parse(JSON.stringify(p)); np.stops = np.stops || [];
        let s = np.stops.find((z) => z.id === c.i);
        if (!s) { s = { id: c.i, why: 'Ραντεβού', say: [], done: false, added: true }; PL.plans.insertStop(np, s); }
        if (tm) { s.appt = tm; s.apptD = isDate(x.date) ? String(x.date) : (p.created || u.today()); } else { delete s.appt; delete s.apptD; }
        await PL.plans.savePlan(pid, np); act('🕐 Ραντεβού ' + (tm || 'αφαιρέθηκε') + ': ' + c.name); return 'ok'; } },

    { name: 'mark_visit', description: "Καταγράφει ότι ο πωλητής ΕΠΙΣΚΕΦΘΗΚΕ σήμερα έναν πελάτη. Αν ο πελάτης είναι σε ανοιχτό πρόγραμμα, τον τικάρει εκεί· αλλιώς τον γράφει στις «Επισκέψεις εκτός προγράμματος» της ημέρας. Κάλεσέ το κάθε φορά που λέει «πήγα / πέρασα / είδα / επισκέφθηκα τον τάδε» (μαζί με add_note για το τι συζήτησαν).",
      inputSchema: { type: 'object', properties: { customer_id: str }, required: ['customer_id'] },
      execute: async ({ customer_id }) => {
        const c = cust(customer_id); await PL.plans.use();
        if (PL.plans.visitedToday(c.i)) return 'ήδη καταγεγραμμένη επίσκεψη σήμερα';
        const w = await PL.plans.visit(c.i, true, (S.get('settings', 'trips') || {}).base); act('✓ Επίσκεψη: ' + c.name + ' (' + w + ')'); return 'ok — ' + w; } },
  ];
})();

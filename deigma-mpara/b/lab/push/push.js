/* Ειδοποιήσεις με κλειστή εφαρμογή (απόφαση 19/11/2026, Β5). Μόνο στην έκδοση με βάση (db.html): χρειάζεται τη βάση (PL.adapter.org.push).
   1. Κάρτα «🔔 Ειδοποιήσεις» στις Ρυθμίσεις: ενεργοποίηση σε αυτή τη συσκευή (άδεια του κινητού + εγγραφή), δοκιμή, απενεργοποίηση.
   2. Συγχρονισμός: κάθε φορά που αλλάζουν οι εκκρεμότητες (σημειώσεις, εκκρεμότητες, ραντεβού προγραμμάτων) η εφαρμογή στέλνει
      στη βάση όσες έχουν ώρα, για τις επόμενες 30 μέρες. Τις στέλνει η ίδια η βάση την ώρα τους, σε όλες τις συσκευές του χρήστη
      που έχουν ενεργές ειδοποιήσεις (εργασία push-send) — ακόμη κι αν η εφαρμογή είναι κλειστή. Γίνεται από κάθε συσκευή του,
      ώστε μια εκκρεμότητα που γράφτηκε στο τάμπλετ να χτυπήσει στο κινητό.
   Στο iPhone θέλει iOS 16.4+ και η εφαρμογή να έχει προστεθεί στην οθόνη Αφετηρίας (από εκεί ανοίγει).
   Η ειδοποίηση φαίνεται από το sw.js (push / notificationclick). Το πλαίσιο μέσα στην ανοιχτή εφαρμογή (js/alarm.js) μένει όπως ήταν. */
(function () {
  const PL = window.PL, O = PL.adapter.org;
  if (!O || !O.push || !O.me) return;
  const P = O.push, u = PL.u, esc = u.esc;
  const DAYS = 30, WAIT = 3000;
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

  /* ---------- τι να ειδοποιηθεί: εκκρεμότητες με ώρα, από τώρα έως +30 μέρες ---------- */
  function items() {
    const now = Date.now(), end = now + DAYS * 864e5, L = [];
    PL.model.openTasks().forEach(({ c, e, tid }) => {
      if (!e.next || !/^\d{1,2}:\d{2}$/.test(e.nt || '')) return;
      const at = new Date(e.next + 'T' + e.nt.padStart(5, '0') + ':00');
      if (isNaN(at) || at < now - 60000 || at > end) return;
      const name = c ? c.name : e.todo || 'Εκκρεμότητα';
      L.push({ key: (tid || (c && c.i)) + '|' + e.next + '|' + e.nt, at: at.toISOString(), title: ('⏰ ' + e.nt + ' · ' + name).slice(0, 120),
        body: String((c ? e.todo || e.text : '') || 'Εκκρεμότητα').slice(0, 300), url: 'db.html' });
    });
    return L.slice(0, 200);
  }
  let last = '', timer = 0;
  async function sync() {
    timer = 0;
    const L = items(), sig = JSON.stringify(L);
    if (sig === last || !navigator.onLine) return;
    try { await P.setReminders(L); last = sig; } catch (e) { /* χωρίς ίντερνετ: ξαναδοκιμάζει στην επόμενη αλλαγή ή όταν επανέλθει */ }
  }
  const soon = () => { clearTimeout(timer); timer = setTimeout(sync, WAIT); };
  PL.bus.on('due', soon);            // μετά την εκκίνηση και σε κάθε αλλαγή εκκρεμοτήτων (js/model.js)
  addEventListener('online', soon);

  /* ---------- η συσκευή ---------- */
  const reg = () => navigator.serviceWorker.ready;
  const current = async () => (await reg()).pushManager.getSubscription();
  const keyBytes = (s) => { const b = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)); return Uint8Array.from(b, (ch) => ch.charCodeAt(0)); };
  async function subscribe(key) {
    const pm = (await reg()).pushManager, opts = { userVisibleOnly: true, applicationServerKey: keyBytes(key) };
    try { return await pm.subscribe(opts); } catch (e) {
      const old = await pm.getSubscription(); if (!old) throw e;   // παλιά εγγραφή με άλλο κλειδί: καινούργια
      await old.unsubscribe(); return pm.subscribe(opts);
    }
  }
  /* ενεργοποίηση: άδεια → εγγραφή → στη βάση. Αν η συσκευή ήταν γραμμένη σε άλλον χρήστη, παίρνει νέα διεύθυνση. */
  async function enable() {
    const key = await P.publicKey();
    if (!key) throw new Error('Ο server ετοιμάζει τις ειδοποιήσεις. Ξαναδοκίμασε σε ένα λεπτό.');
    if (await Notification.requestPermission() !== 'granted') throw new Error('Δεν δόθηκε άδεια για ειδοποιήσεις.');
    let sub = await subscribe(key);
    if (!(await P.save(sub))) {
      await sub.unsubscribe(); sub = await subscribe(key);
      if (!(await P.save(sub))) throw new Error('Δεν γράφτηκε η συσκευή. Ξαναδοκίμασε.');
    }
    last = ''; sync();
  }
  async function disable() {
    const sub = await current(); if (!sub) return;
    await P.remove(sub.endpoint);
    await sub.unsubscribe();
  }
  /* στο άνοιγμα: αν η συσκευή έχει ήδη ενεργές, βεβαιώνεται ότι η βάση την ξέρει (π.χ. αν σβήστηκε) */
  if (supported && Notification.permission === 'granted') current().then((s) => s && P.save(s)).catch(() => {});

  /* ---------- κάρτα στις Ρυθμίσεις ---------- */
  (PL.labActs = PL.labActs || []).push({ page: 'data', mount(box) {
    const card = document.createElement('div');
    card.className = 'card'; card.id = 'pushc'; card.style.cssText = 'cursor:default;margin-bottom:10px';
    box.appendChild(card);
    let busy = false, note = '';
    async function paint() {
      if (!card.isConnected) return;
      const head = '<b>🔔 Ειδοποιήσεις με κλειστή εφαρμογή</b>', foot = note ? `<p class="mu" id="pushm">${esc(note)}</p>` : '';
      if (!supported) {
        card.innerHTML = head + (ios && !standalone
          ? '<p class="mu">Στο iPhone δουλεύουν μόνο όταν η εφαρμογή είναι στην οθόνη Αφετηρίας: πάτα <b>Κοινοποίηση</b> → <b>Προσθήκη στην οθόνη Αφετηρίας</b>, άνοιξέ την από εκεί και έλα ξανά εδώ.</p>'
          : '<p class="mu">Αυτή η συσκευή ή ο browser δεν υποστηρίζει ειδοποιήσεις.</p>');
        return;
      }
      if (Notification.permission === 'denied') {
        card.innerHTML = head + '<p class="mu">Οι ειδοποιήσεις είναι απαγορευμένες για την εφαρμογή. Άνοιξε τις <b>Ρυθμίσεις του κινητού → Ειδοποιήσεις</b> και επίτρεψέ τες.</p>';
        return;
      }
      const on = Notification.permission === 'granted' && !!(await current().catch(() => null));
      if (!card.isConnected) return;
      card.innerHTML = head + (on
        ? '<p class="mu">✅ Ενεργές σε αυτή τη συσκευή. Χτυπάνε την ώρα κάθε εκκρεμότητας και ραντεβού, ακόμη κι αν η εφαρμογή είναι κλειστή.</p><button id="pusht" class="pri">Δοκιμή</button> <button id="pushx">Απενεργοποίηση</button>'
        : '<p class="mu">Για να χτυπάει η ώρα κάθε εκκρεμότητας και ραντεβού, ακόμη κι αν η εφαρμογή είναι κλειστή. Για αυτή τη συσκευή.</p><button id="pushon" class="pri">Ενεργοποίηση</button>') + foot;
      card.querySelectorAll('button').forEach((b) => { b.disabled = busy; });
    }
    const run = (fn, done) => async () => {
      if (busy) return; busy = true; note = ''; paint();
      try { const r = await fn(); note = done(r); } catch (e) { note = (e && e.message) || String(e); }
      busy = false; paint();
    };
    card.onclick = (ev) => {
      const id = ev.target.id;
      if (id === 'pushon') run(enable, () => 'Έτοιμο. Πάτα «Δοκιμή» για να δεις μία.')();
      else if (id === 'pushx') run(disable, () => 'Απενεργοποιήθηκαν σε αυτή τη συσκευή.')();
      else if (id === 'pusht') run(P.test, (r) => (r.error ? r.error : r.sent ? 'Στάλθηκε. Θα έρθει σε λίγα δευτερόλεπτα.' : 'Δεν έφτασε σε καμία συσκευή. Απενεργοποίησε και ενεργοποίησε ξανά.'))();
    };
    paint();
    return () => card.remove();
  } });

  PL.push = { items, sync };   // για τους ελέγχους
})();

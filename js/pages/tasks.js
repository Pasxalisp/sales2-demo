/* Σελίδα «Εκκρεμότητες · Ημερολόγιο» (απόφαση 05/11): πάνω το ημερολόγιο του μήνα με σημάδια ανά μέρα, από κάτω ό,τι έχει
   η μέρα που πάτησες (σήμερα: και οι καθυστερημένες). Κάρτες και «✓ Έγινε» από την παλιά σελίδα (renderDue, dueCard, ddone).
   Τάμπλετ (απόφαση 11/11): αριστερά ο μήνας και η μπάρα γιορτών, δεξιά η μέρα που πάτησες (χωρίς πάτημα: σήμερα) μαζί με
   τα ονόματα της γιορτής όταν ανοίξει η μπάρα. Πελάτης / εκκρεμότητα από τη μέρα ανοίγει δεξιά· «Πίσω» → ξανά η μέρα.
   Νέα εκκρεμότητα (απόφαση 15/11, όπως στο Google Calendar): παρατεταμένο πάτημα σε μέρα ή ➕ → φόρμα (js/pages/taskedit.js). */
(function () {
  const PL = window.PL, u = PL.u, M = PL.model, S = PL.store, E = PL.plans, D = PL.dlg, esc = u.esc, db = () => PL.adapter.db;
  const COLS = ['clients', 'prospects', 'notes', 'tasks', 'balnotes', 'balances', 'plans', 'sos', 'seminars', 'visits', 'wish', 'ndfix', 'treq'];
  const MN = ['Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος', 'Μάιος', 'Ιούνιος', 'Ιούλιος', 'Αύγουστος', 'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος'];
  const nowHM = () => { const d = new Date(); return u.pad(d.getHours()) + ':' + u.pad(d.getMinutes()); };
  const ymd = (d) => d.getFullYear() + '-' + u.pad(d.getMonth() + 1) + '-' + u.pad(d.getDate());
  const st = { calM: null, calSel: null, ndOpen: false, wk: true };   // μένει όταν γυρνάς πίσω (π.χ. από την καρτέλα)· ξαναπάει στο σήμερα όταν βγεις από τη σελίδα· wk = εβδομάδα (όχι μήνας)
  PL.bus.on('page', () => { if (!PL.nav.trail().includes('tasks')) { st.calM = null; st.calSel = null; st.ndOpen = false; } });
  const ensure = () => { const t = u.today(); if (!st.calSel) st.calSel = t; if (!st.calM) st.calM = new Date(+st.calSel.slice(0, 4), +st.calSel.slice(5, 7) - 1, 1); };
  const WDL = ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'];
  const dayTitle = (k) => { const x = new Date(+k.slice(0, 4), +k.slice(5, 7) - 1, +k.slice(8, 10)); return (k === u.today() ? 'Σήμερα, ' : '') + WDL[x.getDay()] + ' ' + x.getDate() + '/' + (x.getMonth() + 1); };
  /* μπάρα γιορτών (μία γραμμή, κάτω από το ημερολόγιο) για τη μέρα k: «🎉 Ταξιαρχών · Αγγελική, Μιχάλης +2», ή «… · κανένας
     πελάτης», ή χωρίς γιορτή «Επόμενη: Κυρ 8/11 · Ταξιαρχών · 4 πελάτες». Πάτημα (και με «κανένας πελάτης») → πάνω όλα
     τα ονόματα που γιορτάζουν, μόνο τα επίσημα (απόφαση 16/11: όλα τα ονόματα της μέρας, όχι παραλλαγές)· από κάτω οι
     «Προτάσεις»: οι πελάτες που βρήκε το πρόγραμμα, με πόλη (σήμερα και WhatsApp / αντιγραφή ευχής / κλήση).
     Όποιος λείπει ή μπήκε λάθος διορθώνεται από την καρτέλα του («✎ Αλλαγή γιορτής»).
     Επιστρέφει { bar, list }: στο κινητό η λίστα μπαίνει κάτω από τη μπάρα, στο τάμπλετ δεξιά, πάνω από τη μέρα. */
  const shortDay = (k) => { const x = new Date(+k.slice(0, 4), +k.slice(5, 7) - 1, +k.slice(8, 10)); return WDL[x.getDay()].slice(0, 3) + ' ' + x.getDate() + '/' + (x.getMonth() + 1); };
  function feast(k) {
    if (!S.loaded('clients')) return { bar: '', list: '' };
    const N = PL.names, G = N.celebrants(k), fts = (g) => esc(g.feasts.map(N.label).join(', '));
    let txt, g = null;
    if (G.list.length) { const nm = G.list.map((c) => N.given(c)); txt = `<b>${fts(G)}</b> · ${esc(nm.slice(0, 2).join(', '))}${nm.length > 2 ? ' +' + (nm.length - 2) : ''}`; g = G; }
    else if (G.feasts.length) { txt = `<b>${fts(G)}</b> · κανένας πελάτης`; g = G; }
    else { const nx = N.next(k); if (nx) { txt = `Επόμενη: <b>${esc(shortDay(nx.day))} · ${fts(nx)}</b> · ${nx.list.length} ${nx.list.length === 1 ? 'πελάτης' : 'πελάτες'}`; g = nx; } else txt = 'Καμία γιορτή πελάτη τον επόμενο χρόνο'; }
    const open = !!g && st.ndOpen, wish = g === G && k === N.today() && G.list.length > 0;
    const names = (f) => `<div class="ndnm"><b>${esc(f.s.join(', '))}</b></div>`;
    const row = (c) => { if (!wish) return `<div class="ndr"><div class="ndn"><span class="nm" data-open="${esc(c.i)}">${PL.prospects.tag(c)}${esc(c.name)}</span><span class="mu">${esc(c.city)}</span></div></div>`;
      const w = N.wished(k, c.i), wa = N.wa(c);
      return `<div class="ndr${w ? ' done' : ''}"><div class="ndn"><span class="nm" data-open="${esc(c.i)}">${PL.prospects.tag(c)}${esc(c.name)}</span><span class="mu">${esc(c.city)}${w ? ' · ✓ ευχήθηκες' : ''}</span></div>` +
        `${wa ? `<a class="btn ndw" href="${esc(wa)}" target="_blank" rel="noopener" data-wish="${esc(c.i)}">WhatsApp</a>` : ''}<button data-wcopy="${esc(c.i)}" aria-label="Αντιγραφή ευχής">📋</button>${PL.call.tels(c).length ? `<button data-callc="${esc(c.i)}" aria-label="Κλήση">📞</button>` : ''}</div>`; };
    return { bar: `<div class="ndbar${open ? ' on' : ''}"${g ? ` data-ndbar="1" role="button" aria-expanded="${open}"` : ''}><span aria-hidden="true">🎉</span><span class="tx">${txt}</span>${g ? `<span class="ndc" aria-hidden="true">${open ? '▴' : '▾'}</span>` : ''}</div>`,
      list: open ? `<div class="ndlist"><div class="ndh">Γιορτάζουν${g === G ? '' : ' την ' + esc(shortDay(g.day))}</div>${g.feasts.map((f) => (g.feasts.length > 1 && f.t ? `<div class="mu ndft">${esc(f.t)}</div>` : '') + names(f)).join('')}` +
        `<div class="ndh">Προτάσεις${g.list.length ? ' (' + g.list.length + ')' : ''}</div>${g.list.length ? (wish ? `<div class="mu" style="margin:2px 0 4px">Ευχή: «${esc(N.TEXT)}» · WhatsApp με έτοιμο κείμενο, 📋 αντιγραφή για Viber / SMS</div>` : '') + g.list.map(row).join('') : '<div class="mu ndr">Δεν βρήκα πελάτη με αυτά τα ονόματα.</div>'}` +
        `<div class="mu ndfx">Λείπει κάποιος ή μπήκε λάθος; Άνοιξε την καρτέλα του και πάτα «✎ Αλλαγή γιορτής».</div></div>` : '' };
  }

  /* κλειδί μιας εκκρεμότητας (ίδιο με το «✓ Έγινε»): ραντεβού A|πρόγραμμα|πελάτης, πληρωμή P|πελάτης, εκκρεμότητα T|id, επόμενη επαφή πελάτης|θέση */
  const keyOf = (x) => (x.treq ? 'R|' + x.treq : x.appt ? 'A|' + x.appt : x.pay ? 'P|' + x.pay : x.tid ? 'T|' + x.tid : x.c.i + '|' + x.k);
  const find = (key) => M.openTasks().find((x) => keyOf(x) === key) || null;

  function dueCard(x, showDate) {
    const { c, e, tid, pay, appt, treq } = x, t = u.today(), SOS = S.all('sos'), tel = c ? PL.call.first(c) : '', dd = e.next.split('-').reverse().slice(0, 2).join('/');
    const when = `<span class="${e.next < t ? 'dn duel' : e.next === t && e.nt && e.nt <= nowHM() ? 'dn' : 'up'}" style="white-space:nowrap">${e.next < t ? 'από ' + dd : e.next === t ? 'σήμερα' : (showDate ? dd : '')}${e.nt ? ' ' + esc(e.nt) : ''}</span>`;
    return `<div class="card" data-tk="${esc(keyOf(x))}"><div class="row"><span class="nm">${c ? (SOS[c.i] ? '⭐ ' : '') + PL.prospects.tag(c) + esc(c.name) : '📝 ' + esc(e.todo)}</span>${when}</div>` +
      (c ? `<div class="mu">${esc(c.city)}${tel ? ' · ' + PL.call.btn(tel, c.name, true) : ''}</div>${e.todo ? `<div style="margin-top:4px"><b>${pay ? '💶 Πληρωμή' : appt ? '🕐 Ραντεβού' : treq ? '🧰 Τεχνικός' : tid ? 'Εκκρεμότητα' : 'Να πω'}:</b> ${esc(e.todo)}</div>` : ''}${!tid && e.text ? `<div class="mu">Τελευταία (${esc(e.d)}): ${esc(e.text)}</div>` : ''}` : '') +
      (e.w ? `<div class="mu">📍 ${esc(e.w)}</div>` : '') +
      /* ραντεβού τεχνικού: ολοκληρώνεται μόνο από το αίτημα (με την αναφορά) */
      `<div style="margin-top:6px;display:flex;gap:6px">${treq ? `<button class="pri" data-treq="${esc(treq)}">Αίτημα</button>` : `<button class="pri" data-ddone="${esc(keyOf(x))}">✓ Έγινε</button>`}${tid ? `<button data-tedit="${esc(tid)}">Αλλαγή</button>` : ''}</div></div>`;
  }
  const semOn = (d) => Object.entries(S.all('seminars')).filter(([, x]) => x && x.date === d);

  async function done(dd) {
    const [id, k, k2] = dd.split('|'), t = u.today();
    if (id === 'R') throw new Error('Το ραντεβού τεχνικού ολοκληρώνεται από το αίτημα');
    if (id === 'A') {   // ραντεβού (πρόγραμμα ή εκτός προγράμματος): η στάση γίνεται ✓ και μπαίνει η επίσκεψη
      const np = await E.doneStop(k, k2); if (np) D.celebrate(Object.assign({ id: k }, np));
    } else if (id === 'P') { const n = Object.assign({}, S.get('balnotes', k), { pdone: (S.get('balnotes', k) || {}).pay }); await db().set('balnotes/' + k, n); S.put('balnotes', k, n); }
    else if (id === 'T') { const n = Object.assign({}, S.get('tasks', k), { done: true, doneD: t }); await db().set('tasks/' + k, n); S.put('tasks', k, n); }
    else { const e = M.entries(id)[+k]; if (e) await PL.notes.mark(id, [e], { done: true, doneD: t }); }
  }
  /* Μετάθεση σε άλλη μέρα (όχι για ραντεβού: αυτά αλλάζουν από το πρόγραμμα). */
  async function move(dd, d) {
    const [id, k] = dd.split('|');
    if (id === 'A') throw new Error('Το ραντεβού αλλάζει από το πρόγραμμα');
    if (id === 'R') throw new Error('Το ραντεβού τεχνικού αλλάζει από το αίτημα');
    if (id === 'P') { const n = Object.assign({}, S.get('balnotes', k), { pay: d }); await db().set('balnotes/' + k, n); S.put('balnotes', k, n); }
    else if (id === 'T') { const n = Object.assign({}, S.get('tasks', k), { next: d }); await db().set('tasks/' + k, n); S.put('tasks', k, n); }
    else { const e = M.entries(id)[+k]; if (e) await PL.notes.mark(id, [e], { next: d }); }
  }
  /* Νέα (id κενό) ή αλλαγμένη εκκρεμότητα από τη φόρμα (taskedit): { t, cid, next, nt, w }. Επιστρέφει το id. */
  async function save(id, x) {
    const k = id || 't' + Date.now() + Math.floor(Math.random() * 1000);
    const n = Object.assign({ d: u.today(), done: false }, id ? S.get('tasks', k) : {}, x);
    await db().set('tasks/' + k, n); S.put('tasks', k, n);
    return k;
  }
  /* δείξε αυτή τη μέρα στο ημερολόγιο (π.χ. μετά την αποθήκευση από τη φόρμα) */
  const select = (d) => { st.calSel = d; st.calM = null; st.ndOpen = false; };
  PL.tasks = { keyOf, find, done, move, save, select };

  /* Ημερολόγιο: εβδομάδα (η εβδομάδα της μέρας που πάτησες) που ανοίγει σε μήνα με «▾ Μήνας» (όπως στο Google Calendar, 28/11/2026).
     Κάθε μέρα με σημάδια · κόκκινο = καθυστέρηση, μπλε = εκκρεμότητα / να πω / πληρωμή, πράσινο = ραντεβού (και τεχνικού),
     κίτρινο = γιορτή με πελάτες, μωβ = σεμινάριο (εξήγηση στις «Οδηγίες», js/help.js). Πλαίσιο = σήμερα, γέμισμα = η μέρα που πάτησες. */
  const MK = ['r', 'b', 'g', 'y', 'p'];
  function calendar() {
    ensure();
    const t = u.today(), all = M.openTasks(t), N = PL.names, mk = {}, add = (k, c) => { (mk[k] = mk[k] || new Set()).add(c); };
    all.forEach((x) => add(x.e.next, x.appt || x.treq ? 'g' : x.e.next < t ? 'r' : 'b'));
    const y = st.calM.getFullYear(), m = st.calM.getMonth();
    const cell = (dt) => {
      const k = ymd(dt);
      if (semOn(k).length) add(k, 'p');
      if (S.loaded('clients') && N.celebrants(k).list.length) add(k, 'y');
      const on = mk[k] || new Set();
      return `<button class="cday${k === t ? ' t' : ''}${k === st.calSel ? ' s' : ''}${dt.getMonth() !== m ? ' o' : ''}" data-cday="${k}" aria-label="${esc(dayTitle(k))}"><span>${dt.getDate()}</span><span class="cmk">${MK.filter((c) => on.has(c)).map((c) => `<i class="${c}"></i>`).join('')}</span></button>`;
    };
    let g = '';
    if (st.wk) {   /* η εβδομάδα (Δευτέρα–Κυριακή) της μέρας που πάτησες */
      const s0 = new Date(+st.calSel.slice(0, 4), +st.calSel.slice(5, 7) - 1, +st.calSel.slice(8, 10)); s0.setDate(s0.getDate() - (s0.getDay() + 6) % 7);
      for (let i = 0; i < 7; i++) g += cell(new Date(s0.getFullYear(), s0.getMonth(), s0.getDate() + i));
    } else {
      const first = (new Date(y, m, 1).getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate();
      for (let i = 0; i < first; i++) g += '<div></div>';
      for (let d = 1; d <= days; d++) g += cell(new Date(y, m, d));
    }
    const away = st.calSel !== t || y !== +t.slice(0, 4) || m !== +t.slice(5, 7) - 1, w = st.wk ? 'Προηγούμενη εβδομάδα' : 'Προηγούμενος μήνας';
    /* εμφάνιση 28/11/2026 (εικόνα Πασχάλη): «Μήνας | Εβδομάδα» σαν διακόπτης πάνω, ο μήνας σε κάρτα */
    const SG = (wk, ic, t) => `<button data-cwk="${wk ? 'w' : 'm'}" class="${!!st.wk === wk ? 'on' : ''}" aria-pressed="${!!st.wk === wk}">${ic}${t}</button>`;
    const ICM = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M16 3v4M8 3v4M4 11h16"/></svg>';
    const ICW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/></svg>';
    return `<div class="calseg">${SG(false, ICM, 'Μήνας')}${SG(true, ICW, 'Εβδομάδα')}</div><div class="calcd"><div class="calh"><button data-cnav="-1" aria-label="${w}">‹</button><b>${MN[m]} ${y}</b>${away ? '<button class="chip" data-ctoday="1">Σήμερα</button>' : ''}<button data-cnav="1" aria-label="${st.wk ? 'Επόμενη εβδομάδα' : 'Επόμενος μήνας'}">›</button></div>
 <div class="calg calw">${['Δε', 'Τρ', 'Τε', 'Πε', 'Πα', 'Σα', 'Κυ'].map((x) => `<div>${x}</div>`).join('')}</div>
 <div class="calg">${g}</div></div>`;
  }
  const semCard = ([id, x]) => `<div class="card" data-semopen="${esc(id)}"><div class="row"><span class="nm">🎓 ${esc(x.title)}</span><span class="up">${esc(x.time || '')}</span></div><div class="mu">${(x.cust || []).length} πελάτες${x.notes ? ' · ' + esc(x.notes) : ''}</div></div>`;
  /* ό,τι έχει η μέρα k: (σήμερα: καθυστερημένες) → ραντεβού, εκκρεμότητες, «να πω», πληρωμές (με τη σειρά της ώρας) → σεμινάρια */
  function dayView(k, extra) {
    const t = u.today(), all = M.openTasks(t), late = k === t ? all.filter((x) => x.e.next < t) : [], dl = all.filter((x) => x.e.next === k), sms = semOn(k);
    let h = `<h3 class="cdh">${esc(dayTitle(k))}</h3>` + (extra || '');
    if (late.length) h += `<div class="cdlate"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>Καθυστερημένες (${late.length})</div>${late.map((x) => dueCard(x, true)).join('')}` + (dl.length || sms.length ? '<div class="cdsub">Σήμερα</div>' : '');
    h += dl.map((x) => dueCard(x, false)).join('') + sms.map(semCard).join('');
    if (!late.length && !dl.length && !sms.length) h += `<p class="mu">${k === t ? 'Δεν υπάρχουν εκκρεμότητες για σήμερα. 👌' : 'Τίποτα αυτή τη μέρα.'}</p>`;
    return h;
  }
  /* Ό,τι φαίνεται τώρα (στο τάμπλετ: ημερολόγιο αριστερά και μέρα δεξιά) ξαναζωγραφίζεται μαζί. */
  const panes = new Set(), repaint = () => panes.forEach((f) => f());
  /* τάμπλετ: άλλη μέρα / μπάρα γιορτών ενώ δεξιά είναι ανοιχτός πελάτης ή εκκρεμότητα → δεξιά ξανά η μέρα */
  const toDay = () => { if (PL.WIDE.matches && PL.nav.current().id !== 'tasks') PL.nav.back(); repaint(); };
  /* Πατήματα, κοινά για ημερολόγιο και μέρα. */
  async function act(ev) {
    const g = ev.target.closest('[data-wish],[data-wcopy]');
    if (g && g.dataset.wish) { PL.names.markWished(PL.names.today(), g.dataset.wish); return; }   /* ο σύνδεσμος ανοίγει το WhatsApp */
    if (g) { let ok = false; try { await navigator.clipboard.writeText(PL.names.TEXT); ok = true; } catch (x) { /* τίποτα */ }
      D.toast(ok ? '📋 Αντιγράφηκε η ευχή: άνοιξε Viber ή Μηνύματα και κάνε Επικόλληση' : 'Δεν αντιγράφηκε. Γράψε την ευχή με το χέρι.'); if (ok) PL.names.markWished(PL.names.today(), g.dataset.wcopy); return; }
    const t = ev.target.closest('[data-ndbar],[data-cnav],[data-ctoday],[data-cwk],[data-cday],[data-semopen],[data-ddone],[data-tedit],[data-treq],[data-open],[data-callc],a,button,[data-tk]'); if (!t) return;
    if (t.dataset.ndbar) { st.ndOpen = !st.ndOpen; toDay(); }
    else if (t.dataset.ctoday) { st.calSel = null; st.calM = null; st.ndOpen = false; toDay(); }
    else if (t.dataset.cwk) { const w = t.dataset.cwk === 'w'; if (w !== !!st.wk) { st.wk = w; st.calM = null; repaint(); } }
    /* ‹ ›: εβδομάδα → η ίδια μέρα της άλλης εβδομάδας· μήνας → άλλος μήνας */
    else if (t.dataset.cnav && st.wk) { const d = new Date(+st.calSel.slice(0, 4), +st.calSel.slice(5, 7) - 1, +st.calSel.slice(8, 10) + 7 * (+t.dataset.cnav)); st.calSel = ymd(d); st.calM = null; st.ndOpen = false; toDay(); }
    else if (t.dataset.cnav) { st.calM = new Date(st.calM.getFullYear(), st.calM.getMonth() + (+t.dataset.cnav), 1); repaint(); }
    else if (t.dataset.cday) { st.calSel = t.dataset.cday; if (st.wk) st.calM = null; st.ndOpen = false; toDay(); }
    else if (t.dataset.semopen) PL.nav.push('seminar', { id: t.dataset.semopen });
    else if (t.dataset.open) PL.nav.push('client', { id: t.dataset.open });
    else if (t.dataset.tedit) PL.nav.push('taskedit', { id: t.dataset.tedit });
    else if (t.dataset.treq) PL.nav.push('treq', { id: t.dataset.treq });
    else if (t.dataset.ddone) { t.disabled = true; try { await done(t.dataset.ddone); } catch (e) { D.toast('Δεν αποθηκεύτηκε'); t.disabled = false; } }
    else if (t.dataset.tk && t.dataset.tk.startsWith('R|')) PL.nav.push('treq', { id: t.dataset.tk.slice(2) });
    /* πάτημα στο κουτί (όχι σε κουμπί): τάμπλετ → φύλλο εκκρεμότητας δεξιά, κινητό → καρτέλα του πελάτη (28/11/2026) */
    else if (t.dataset.tk && PL.WIDE.matches) PL.nav.push('task', { key: t.dataset.tk });
    else if (t.dataset.tk) { const x = find(t.dataset.tk); if (x && x.c && M.byId(x.c.i)) PL.nav.push('client', { id: x.c.i }); }   /* τάμπλετ: το φύλλο της εκκρεμότητας δεξιά */
  }

  /* ζωγραφίζει τώρα και όταν αλλάζουν τα δεδομένα· τα πατήματα πάνε στο act */
  function mountPane(el, paint) {
    paint(); panes.add(paint);
    const offs = COLS.map((c) => S.on(c, paint));
    el.addEventListener('click', act);
    return () => { panes.delete(paint); offs.forEach((f) => f()); };
  }
  PL.register('tasks', {
    title: 'Εκκρεμότητες · Ημερολόγιο',
    topTitle: true,   /* ο τίτλος στη γραμμή του «‹ Αρχική» για να μένει χώρος στο ημερολόγιο (αίτημα Πασχάλη 28/11/2026) */
    split: ['client', 'seminar', 'task', 'taskedit', 'treq'],
    /* τάμπλετ, δεξιά όταν δεν είναι ανοιχτός πελάτης / εκκρεμότητα: η μέρα που πάτησες, με τα ονόματα της γιορτής από πάνω */
    aside(el) {
      COLS.forEach((c) => S.use(c));
      const paint = () => { ensure(); el.innerHTML = '<div id="duday">' + dayView(st.calSel, feast(st.calSel).list.replace('class="ndlist"', 'class="ndlist ndsolo"')) + '</div>'; };
      return mountPane(el, paint);
    },
    nova: () => PL.menu('Εκκρεμότητες', [
      { e: '➕', label: 'Νέα εκκρεμότητα', d: 'τι, πελάτης, μέρα, ώρα, πού (ή κράτα πατημένη μια μέρα)', fn: () => { ensure(); PL.nav.push('taskedit', { day: st.calSel }); } },
      { e: '⏰', label: 'Υπενθύμιση', d: 'στο ημερολόγιο του iPhone', fn: () => PL.dictation.open('Θύμισέ μου ') },
    ]),
    /* κινητό: ημερολόγιο, μπάρα γιορτών (ανοίγει από κάτω) και η μέρα · τάμπλετ: ημερολόγιο και μπάρα (η μέρα είναι δεξιά, aside) */
    render(el) {
      const wide = PL.WIDE.matches;
      /* κουμπί + (νέα εκκρεμότητα) στη θέση του «Ανοιχτό πρόγραμμα», που εδώ δεν φαίνεται (js/nvo.js) — όπως στο Google Calendar */
      el.innerHTML = `<h2>Εκκρεμότητες · Ημερολόγιο</h2><div id="ducal" class="cal"></div><div id="dund"></div>${wide ? '' : '<div id="dul"></div>'}` +
        '<button id="tfab" aria-label="Νέα εκκρεμότητα"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button>';
      const $ = (s) => el.querySelector(s);
      $('#tfab').onclick = () => { ensure(); PL.nav.push('taskedit', { day: st.calSel }); };
      COLS.forEach((c) => S.use(c));
      const paint = () => { $('#ducal').innerHTML = calendar(); const f = feast(st.calSel); $('#dund').innerHTML = wide ? f.bar : f.bar + f.list; if (!wide) $('#dul').innerHTML = dayView(st.calSel); };
      /* κράτα πατημένη μια μέρα → νέα εκκρεμότητα εκείνη τη μέρα (όπως στο Google Calendar) */
      PL.longPress($('#ducal'), '[data-cday]', (d) => { st.calSel = d.dataset.cday; repaint(); PL.nav.push('taskedit', { day: d.dataset.cday }); });
      return mountPane(el, paint);
    },
  });
})();

/* Σελίδα «Εκκρεμότητες · Ημερολόγιο» (απόφαση 05/11): πάνω το ημερολόγιο του μήνα με σημάδια ανά μέρα, από κάτω ό,τι έχει
   η μέρα που πάτησες (σήμερα: και οι καθυστερημένες). Κάρτες και «✓ Έγινε» από την παλιά σελίδα (renderDue, dueCard, ddone). */
(function () {
  const PL = window.PL, u = PL.u, M = PL.model, S = PL.store, E = PL.plans, D = PL.dlg, esc = u.esc, db = () => PL.adapter.db;
  const COLS = ['clients', 'prospects', 'notes', 'tasks', 'balnotes', 'balances', 'plans', 'sos', 'seminars', 'visits', 'wish', 'ndfix'];
  const MN = ['Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος', 'Μάιος', 'Ιούνιος', 'Ιούλιος', 'Αύγουστος', 'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος'];
  const nowHM = () => { const d = new Date(); return u.pad(d.getHours()) + ':' + u.pad(d.getMinutes()); };
  const ymd = (d) => d.getFullYear() + '-' + u.pad(d.getMonth() + 1) + '-' + u.pad(d.getDate());
  const st = { calM: null, calSel: null };   // μένει όταν γυρνάς πίσω (π.χ. από την καρτέλα)· ξαναπάει στο σήμερα όταν βγεις από τη σελίδα
  PL.bus.on('page', () => { if (!PL.nav.trail().includes('tasks')) { st.calM = null; st.calSel = null; } });
  const ensure = () => { const t = u.today(); if (!st.calSel) st.calSel = t; if (!st.calM) st.calM = new Date(+st.calSel.slice(0, 4), +st.calSel.slice(5, 7) - 1, 1); };
  const WDL = ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'];
  const dayTitle = (k) => { const x = new Date(+k.slice(0, 4), +k.slice(5, 7) - 1, +k.slice(8, 10)); return (k === u.today() ? 'Σήμερα, ' : '') + WDL[x.getDay()] + ' ' + x.getDate() + '/' + (x.getMonth() + 1); };
  const noClients = () => ({ feasts: [], list: [] });
  /* γιορτές της μέρας k: ποιοι πελάτες γιορτάζουν (σήμερα με WhatsApp / αντιγραφή ευχής / κλήση) ή «κανένας πελάτης».
     Όποιος λείπει ή μπήκε λάθος διορθώνεται από την καρτέλα του («✎ Αλλαγή γιορτής»). */
  function feastBox(k, G) {
    if (!G.feasts.length) return '';
    const N = PL.names, today = k === N.today();
    const row = (c) => { const w = N.wished(k, c.i), wa = N.wa(c);
      return `<div class="ndr${w ? ' done' : ''}"><div class="ndn"><span class="nm" data-open="${esc(c.i)}">${PL.prospects.tag(c)}${esc(c.name)}</span><span class="mu">${esc(c.city)}${w ? ' · ✓ ευχήθηκες' : ''}</span></div>` +
        `${wa ? `<a class="btn ndw" href="${esc(wa)}" target="_blank" rel="noopener" data-wish="${esc(c.i)}">WhatsApp</a>` : ''}<button data-wcopy="${esc(c.i)}" aria-label="Αντιγραφή ευχής">📋</button>${PL.call.tels(c).length ? `<button data-callc="${esc(c.i)}" aria-label="Κλήση">📞</button>` : ''}</div>`; };
    const head = `🎉 <b>${esc(G.feasts.map((f) => f.t).join(', '))}</b> <span class="mu">(${esc(G.feasts.map((f) => f.s).join(', '))})</span>`;
    const body = !G.list.length ? '<div class="mu ndd">κανένας πελάτης</div>'
      : today ? `<div class="mu" style="margin:6px 0">Γιορτάζουν ${G.list.length} · Ευχή: «${esc(N.TEXT)}» · WhatsApp με έτοιμο κείμενο, 📋 αντιγραφή για Viber / SMS</div>${G.list.map(row).join('')}`
      : `<div class="ndd">${G.list.map((c) => `<span class="nm" data-open="${esc(c.i)}">${PL.prospects.tag(c)}${esc(c.name)} <span class="mu">· ${esc(c.city)}</span></span>`).join('')}</div>`;
    return `<div class="ndg">${head}${body}<div class="mu ndfx">Λείπει κάποιος ή μπήκε λάθος; Άνοιξε την καρτέλα του και πάτα «✎ Αλλαγή γιορτής».</div></div>`;
  }

  /* κλειδί μιας εκκρεμότητας (ίδιο με το «✓ Έγινε»): ραντεβού A|πρόγραμμα|πελάτης, πληρωμή P|πελάτης, εκκρεμότητα T|id, επόμενη επαφή πελάτης|θέση */
  const keyOf = (x) => (x.appt ? 'A|' + x.appt : x.pay ? 'P|' + x.pay : x.tid ? 'T|' + x.tid : x.c.i + '|' + x.k);
  const find = (key) => M.openTasks().find((x) => keyOf(x) === key) || null;

  function dueCard(x, showDate) {
    const { c, e, tid, pay, appt } = x, t = u.today(), SOS = S.all('sos'), tel = c ? PL.call.first(c) : '', dd = e.next.split('-').reverse().slice(0, 2).join('/');
    const when = `<span class="${e.next < t || (e.next === t && e.nt && e.nt <= nowHM()) ? 'dn' : 'up'}" style="white-space:nowrap">${e.next < t ? 'από ' + dd : e.next === t ? 'σήμερα' : (showDate ? dd : '')}${e.nt ? ' ' + esc(e.nt) : ''}</span>`;
    return `<div class="card" data-tk="${esc(keyOf(x))}" style="cursor:${PL.WIDE.matches ? 'pointer' : 'default'}"><div class="row"><span class="nm">${c ? (SOS[c.i] ? '⭐ ' : '') + PL.prospects.tag(c) + esc(c.name) : '📝 ' + esc(e.todo)}</span>${when}</div>` +
      (c ? `<div class="mu">${esc(c.city)}${tel ? ' · ' + PL.call.btn(tel, c.name, true) : ''}</div>${e.todo ? `<div style="margin-top:4px"><b>${pay ? '💶 Πληρωμή' : appt ? '🕐 Ραντεβού' : tid ? 'Εκκρεμότητα' : 'Να πω'}:</b> ${esc(e.todo)}</div>` : ''}${!tid && e.text ? `<div class="mu">Τελευταία (${esc(e.d)}): ${esc(e.text)}</div>` : ''}` : '') +
      `<div style="margin-top:6px;display:flex;gap:6px"><button class="pri" data-ddone="${esc(keyOf(x))}">✓ Έγινε</button>${c ? `<button data-open="${c.i}">Καρτέλα</button>` : ''}</div></div>`;
  }
  const semOn = (d) => Object.entries(S.all('seminars')).filter(([, x]) => x && x.date === d);

  async function done(dd) {
    const [id, k, k2] = dd.split('|'), t = u.today();
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
    if (id === 'P') { const n = Object.assign({}, S.get('balnotes', k), { pay: d }); await db().set('balnotes/' + k, n); S.put('balnotes', k, n); }
    else if (id === 'T') { const n = Object.assign({}, S.get('tasks', k), { next: d }); await db().set('tasks/' + k, n); S.put('tasks', k, n); }
    else { const e = M.entries(id)[+k]; if (e) await PL.notes.mark(id, [e], { next: d }); }
  }
  PL.tasks = { keyOf, find, done, move };

  /* Ημερολόγιο μήνα: κάθε μέρα με σημάδια · κόκκινο = καθυστέρηση, μπλε = εκκρεμότητα / να πω / πληρωμή, πράσινο = ραντεβού,
     κίτρινο = γιορτή με πελάτες, μωβ = σεμινάριο. Πλαίσιο = σήμερα, γέμισμα = η μέρα που πάτησες. */
  const MK = ['r', 'b', 'g', 'y', 'p'];
  function calendar() {
    ensure();
    const t = u.today(), all = M.openTasks(t), N = PL.names, mk = {}, add = (k, c) => { (mk[k] = mk[k] || new Set()).add(c); };
    all.forEach((x) => add(x.e.next, x.appt ? 'g' : x.e.next < t ? 'r' : 'b'));
    const y = st.calM.getFullYear(), m = st.calM.getMonth(), first = (new Date(y, m, 1).getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate();
    let g = ''; for (let i = 0; i < first; i++) g += '<div></div>';
    for (let d = 1; d <= days; d++) {
      const k = ymd(new Date(y, m, d));
      if (semOn(k).length) add(k, 'p');
      if (S.loaded('clients') && N.celebrants(k).list.length) add(k, 'y');
      const on = mk[k] || new Set();
      g += `<button class="cday${k === t ? ' t' : ''}${k === st.calSel ? ' s' : ''}" data-cday="${k}" aria-label="${esc(dayTitle(k))}"><span>${d}</span><span class="cmk">${MK.filter((c) => on.has(c)).map((c) => `<i class="${c}"></i>`).join('')}</span></button>`;
    }
    const away = st.calSel !== t || y !== +t.slice(0, 4) || m !== +t.slice(5, 7) - 1;
    return `<div class="calh"><button data-cnav="-1" aria-label="Προηγούμενος μήνας">‹</button><b>${MN[m]} ${y}</b>${away ? '<button class="chip" data-ctoday="1">Σήμερα</button>' : ''}<button data-cnav="1" aria-label="Επόμενος μήνας">›</button></div>
 <div class="calg calw">${['Δε', 'Τρ', 'Τε', 'Πε', 'Πα', 'Σα', 'Κυ'].map((x) => `<div>${x}</div>`).join('')}</div>
 <div class="calg">${g}</div>
 <div class="call"><span><i class="r"></i>καθυστέρηση</span><span><i class="b"></i>εκκρεμότητα</span><span><i class="g"></i>ραντεβού</span><span><i class="y"></i>γιορτή</span><span><i class="p"></i>σεμινάριο</span></div>`;
  }
  const semCard = ([id, x]) => `<div class="card" data-semopen="${esc(id)}"><div class="row"><span class="nm">🎓 ${esc(x.title)}</span><span class="up">${esc(x.time || '')}</span></div><div class="mu">${(x.cust || []).length} πελάτες${x.notes ? ' · ' + esc(x.notes) : ''}</div></div>`;
  /* ό,τι έχει η μέρα k: (σήμερα: καθυστερημένες) → ραντεβού, εκκρεμότητες, «να πω», πληρωμές (με τη σειρά της ώρας) → σεμινάρια → γιορτές */
  function dayView(k) {
    const t = u.today(), all = M.openTasks(t), late = k === t ? all.filter((x) => x.e.next < t) : [], dl = all.filter((x) => x.e.next === k), sms = semOn(k);
    const G = S.loaded('clients') ? PL.names.celebrants(k) : noClients();
    let h = `<h3 class="cdh">${esc(dayTitle(k))}</h3>`;
    if (late.length) h += `<div class="cdsub dn">Καθυστερημένες (${late.length})</div>${late.map((x) => dueCard(x, true)).join('')}` + (dl.length || sms.length || G.feasts.length ? '<div class="cdsub">Σήμερα</div>' : '');
    h += dl.map((x) => dueCard(x, false)).join('') + sms.map(semCard).join('') + feastBox(k, G);
    if (!late.length && !dl.length && !sms.length && !G.feasts.length) h += `<p class="mu">${k === t ? 'Δεν υπάρχουν εκκρεμότητες για σήμερα. 👌' : 'Τίποτα αυτή τη μέρα.'}</p>`;
    return h;
  }
  /* τάμπλετ, δεξιά όταν δεν έχεις πατήσει κάτι: οι επόμενες n μέρες */
  function upcoming(n) {
    const t = u.today(), lim = ymd(new Date(Date.parse(t) + n * 864e5)), up = M.openTasks(t).filter((x) => x.e.next > t && x.e.next <= lim);
    return `<h3>Επόμενες ${n} μέρες</h3>` + (up.length ? up.map((x) => dueCard(x, true)).join('') : '<p class="mu">Καμία.</p>');
  }
  /* Πατήματα, κοινά για λίστα και ημερολόγιο. */
  async function act(ev, repaint) {
    const g = ev.target.closest('[data-wish],[data-wcopy]');
    if (g && g.dataset.wish) { PL.names.markWished(PL.names.today(), g.dataset.wish); return; }   /* ο σύνδεσμος ανοίγει το WhatsApp */
    if (g) { let ok = false; try { await navigator.clipboard.writeText(PL.names.TEXT); ok = true; } catch (x) { /* τίποτα */ }
      D.toast(ok ? '📋 Αντιγράφηκε η ευχή: άνοιξε Viber ή Μηνύματα και κάνε Επικόλληση' : 'Δεν αντιγράφηκε. Γράψε την ευχή με το χέρι.'); if (ok) PL.names.markWished(PL.names.today(), g.dataset.wcopy); return; }
    const t = ev.target.closest('[data-cnav],[data-ctoday],[data-cday],[data-semopen],[data-ddone],[data-open],[data-callc],a,button,[data-tk]'); if (!t) return;
    if (t.dataset.ctoday) { st.calSel = null; st.calM = null; repaint(); }
    else if (t.dataset.cnav) { st.calM = new Date(st.calM.getFullYear(), st.calM.getMonth() + (+t.dataset.cnav), 1); repaint(); }
    else if (t.dataset.cday) { st.calSel = t.dataset.cday; repaint(); }
    else if (t.dataset.semopen) PL.nav.push('seminar', { id: t.dataset.semopen });
    else if (t.dataset.open) PL.nav.push('client', { id: t.dataset.open });
    else if (t.dataset.ddone) { t.disabled = true; try { await done(t.dataset.ddone); } catch (e) { D.toast('Δεν αποθηκεύτηκε'); t.disabled = false; } }
    else if (t.dataset.tk && PL.WIDE.matches) PL.nav.push('task', { key: t.dataset.tk });   /* τάμπλετ: το φύλλο της εκκρεμότητας δεξιά */
  }

  PL.register('tasks', {
    title: 'Εκκρεμότητες · Ημερολόγιο',
    split: ['client', 'seminar', 'task'],
    /* τάμπλετ, τίποτα πατημένο: δεξιά οι επόμενες 7 μέρες (το ημερολόγιο είναι αριστερά) */
    aside(el) {
      COLS.forEach((c) => S.use(c));
      const paint = () => { el.innerHTML = '<div id="duaside">' + upcoming(7) + '</div>'; };
      paint();
      const offs = COLS.map((c) => S.on(c, paint));
      el.addEventListener('click', (ev) => act(ev, paint));
      return () => offs.forEach((f) => f());
    },
    nova: () => PL.menu('Εκκρεμότητες', [
      { e: '➕', label: 'Νέα εκκρεμότητα', d: 'για κάποιον πελάτη, με υπαγόρευση', fn: () => PL.dictation.open('Εκκρεμότητα: ') },
      { e: '⏰', label: 'Υπενθύμιση', d: 'στο ημερολόγιο του iPhone', fn: () => PL.dictation.open('Θύμισέ μου ') },
    ]),
    render(el) {
      el.innerHTML = `<h2>Εκκρεμότητες · Ημερολόγιο</h2><div id="ducal" class="cal"></div><div id="dul"></div>`;
      const $ = (s) => el.querySelector(s);
      COLS.forEach((c) => S.use(c));
      const paint = () => { $('#ducal').innerHTML = calendar(); $('#dul').innerHTML = dayView(st.calSel); };
      paint();
      const offs = COLS.map((c) => S.on(c, paint));
      el.addEventListener('click', (ev) => act(ev, paint));
      return () => offs.forEach((f) => f());
    },
  });
})();

/* Σελίδα «Εκκρεμότητες»: σήμερα & καθυστερημένες, ημερολόγιο. Μεταφορά από την παλιά σελίδα (renderDue, dueCard, ddone). */
(function () {
  const PL = window.PL, u = PL.u, M = PL.model, S = PL.store, E = PL.plans, D = PL.dlg, esc = u.esc, db = () => PL.adapter.db;
  const COLS = ['clients', 'prospects', 'notes', 'tasks', 'balnotes', 'balances', 'plans', 'sos', 'seminars', 'visits', 'wish'];
  const MN = ['Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος', 'Μάιος', 'Ιούνιος', 'Ιούλιος', 'Αύγουστος', 'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος'];
  const nowHM = () => { const d = new Date(); return u.pad(d.getHours()) + ':' + u.pad(d.getMinutes()); };
  const ymd = (d) => d.getFullYear() + '-' + u.pad(d.getMonth() + 1) + '-' + u.pad(d.getDate());
  const st = { tab: 't', calM: null, calSel: null, gOpen: false };   // μένει όταν γυρνάς πίσω
  /* εορτολόγιο: «🎉 Γιορτάζουν σήμερα» (κλειστό, ανοίγει με πάτημα) με WhatsApp / αντιγραφή ευχής / κλήση, και το αύριο */
  function namedays() {
    const N = PL.names, day = N.today(), G = N.celebrants(day), T = N.celebrants(N.tomorrow(day));
    const tom = T.list.length ? `<div class="mu ndt">Αύριο: ${esc(T.feasts.map((f) => f.t).join(', '))} · ${T.list.length} ${T.list.length === 1 ? 'πελάτης' : 'πελάτες'}</div>` : '';
    if (!G.list.length) return tom ? `<div class="ndg">🎉 ${tom}</div>` : '';
    const row = (c) => { const w = N.wished(day, c.i), wa = N.wa(c);
      return `<div class="ndr${w ? ' done' : ''}"><div class="ndn"><span class="nm" data-open="${esc(c.i)}">${PL.prospects.tag(c)}${esc(c.name)}</span><span class="mu">${esc(c.city)}${w ? ' · ✓ ευχήθηκες' : ''}</span></div>` +
        `${wa ? `<a class="btn ndw" href="${esc(wa)}" target="_blank" rel="noopener" data-wish="${esc(c.i)}">WhatsApp</a>` : ''}<button data-wcopy="${esc(c.i)}" aria-label="Αντιγραφή ευχής">📋</button>${PL.call.tels(c).length ? `<button data-callc="${esc(c.i)}" aria-label="Κλήση">📞</button>` : ''}</div>`; };
    return `<details class="ndg"${st.gOpen ? ' open' : ''}><summary>🎉 <b>Γιορτάζουν σήμερα: ${G.list.length}</b> <span class="mu">· ${esc(G.feasts.map((f) => f.t).join(', '))}</span></summary>` +
      `<div class="mu" style="margin:6px 0">Ευχή: «${esc(N.TEXT)}» · WhatsApp με έτοιμο κείμενο, 📋 αντιγραφή για Viber / SMS</div>${G.list.map(row).join('')}${tom}</details>`;
  }

  function dueCard({ c, e, k, tid, pay, appt }, showDate) {
    const t = u.today(), SOS = S.all('sos'), tel = c ? PL.call.first(c) : '', dd = e.next.split('-').reverse().slice(0, 2).join('/');
    const when = `<span class="${e.next < t || (e.next === t && e.nt && e.nt <= nowHM()) ? 'dn' : 'up'}" style="white-space:nowrap">${e.next < t ? 'από ' + dd : e.next === t ? 'σήμερα' : (showDate ? dd : '')}${e.nt ? ' ' + esc(e.nt) : ''}</span>`;
    return `<div class="card" style="cursor:default"><div class="row"><span class="nm">${c ? (SOS[c.i] ? '⭐ ' : '') + PL.prospects.tag(c) + esc(c.name) : '📝 ' + esc(e.todo)}</span>${when}</div>` +
      (c ? `<div class="mu">${esc(c.city)}${tel ? ' · ' + PL.call.btn(tel, c.name, true) : ''}</div>${e.todo ? `<div style="margin-top:4px"><b>${pay ? '💶 Πληρωμή' : appt ? '🕐 Ραντεβού' : tid ? 'Εκκρεμότητα' : 'Να πω'}:</b> ${esc(e.todo)}</div>` : ''}${!tid && e.text ? `<div class="mu">Τελευταία (${esc(e.d)}): ${esc(e.text)}</div>` : ''}` : '') +
      `<div style="margin-top:6px;display:flex;gap:6px"><button class="pri" data-ddone="${appt ? 'A|' + appt : pay ? 'P|' + pay : tid ? 'T|' + tid : c.i + '|' + k}">✓ Έγινε</button>${c ? `<button data-open="${c.i}">Καρτέλα</button>` : ''}</div></div>`;
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

  PL.register('tasks', {
    title: 'Εκκρεμότητες',
    split: ['client', 'seminar'],
    nova: () => PL.menu('Εκκρεμότητες', [
      { e: '➕', label: 'Νέα εκκρεμότητα', d: 'για κάποιον πελάτη, με υπαγόρευση', fn: () => PL.dictation.open('Εκκρεμότητα: ') },
      { e: '⏰', label: 'Υπενθύμιση', d: 'στο ημερολόγιο του iPhone', fn: () => PL.dictation.open('Θύμισέ μου ') },
    ]),
    render(el) {
      el.innerHTML = `<h2>Εκκρεμότητες</h2>
<div style="display:flex;gap:6px;margin-bottom:10px"><button class="chip on" data-dtab="t">Σήμερα & καθυστερημένες</button><button class="chip" data-dtab="c">📅 Ημερολόγιο</button></div>
<div id="dut"><p class="mu">Μένουν εδώ μέχρι να πατήσεις «✓ Έγινε».</p><div id="dug"></div></div><div id="ducal" hidden></div><div id="dul"></div>`;
      const $ = (s) => el.querySelector(s);
      COLS.forEach((c) => S.use(c));
      const paint = () => {
        el.querySelectorAll('[data-dtab]').forEach((b) => b.classList.toggle('on', b.dataset.dtab === st.tab));
        $('#dut').hidden = st.tab !== 't'; $('#ducal').hidden = st.tab !== 'c';
        if (st.tab === 't') { const L = M.dueList(); if (S.loaded('clients')) $('#dug').innerHTML = namedays(); $('#dul').innerHTML = L.length ? L.map((x) => dueCard(x, true)).join('') : '<p class="mu">Δεν υπάρχουν εκκρεμότητες για σήμερα. 👌</p>'; return; }
        const t = u.today(), all = M.openTasks();
        if (!st.calM) { const d = new Date(); st.calM = new Date(d.getFullYear(), d.getMonth(), 1); } if (!st.calSel) st.calSel = t;
        const cnt = {}; all.forEach((x) => { cnt[x.e.next] = (cnt[x.e.next] || 0) + 1; });
        const y = st.calM.getFullYear(), m = st.calM.getMonth(), first = (new Date(y, m, 1).getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate();
        let g = ''; for (let i = 0; i < first; i++) g += '<div></div>';
        for (let d = 1; d <= days; d++) {
          const k = ymd(new Date(y, m, d)), n = cnt[k] || 0, sm = semOn(k).length, isT = k === t, sel = k === st.calSel, late = k < t && n;
          g += `<button data-cday="${k}" style="padding:6px 0;min-height:48px;border-radius:10px;display:flex;flex-direction:column;align-items:center;gap:2px;${sel ? 'background:var(--ac);color:#fff;border-color:var(--ac)' : isT ? 'border:2px solid var(--ac)' : ''}"><span style="font-weight:${isT ? 700 : 500}">${d}</span><span style="font-size:11px;line-height:1;${sel ? '' : late ? 'color:var(--rd)' : 'color:var(--ac)'}">${n ? '●'.repeat(Math.min(n, 3)) : ''}${sm ? '🎓' : ''}</span></button>`;
        }
        const overdue = all.filter((x) => x.e.next < t).length, upc = all.filter((x) => x.e.next > t).length;
        $('#ducal').innerHTML = `<div class="row" style="margin-bottom:8px"><button data-cnav="-1" style="padding:6px 14px">‹</button><b style="font-size:17px">${MN[m]} ${y}</b><button data-cnav="1" style="padding:6px 14px">›</button></div>
 <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center;font-size:12px;color:var(--mu);margin-bottom:4px">${['Δε', 'Τρ', 'Τε', 'Πε', 'Πα', 'Σα', 'Κυ'].map((x) => `<div>${x}</div>`).join('')}</div>
 <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px">${g}</div>
 <div class="mu" style="margin-top:8px">${upc} επερχόμενες${overdue ? ` · <span class="dn">${overdue} καθυστερημένες</span>` : ''} · ● εκκρεμότητα · 🎓 σεμινάριο</div><h3>${u.fd(st.calSel)}</h3>`;
        const dl = all.filter((x) => x.e.next === st.calSel), sms = semOn(st.calSel);
        $('#dul').innerHTML = sms.map(([id, x]) => `<div class="card" data-semopen="${esc(id)}"><div class="row"><span class="nm">🎓 ${esc(x.title)}</span><span class="up">${esc(x.time || '')}</span></div><div class="mu">${(x.cust || []).length} πελάτες${x.notes ? ' · ' + esc(x.notes) : ''}</div></div>`).join('') +
          (dl.length ? dl.map((x) => dueCard(x, false)).join('') : (sms.length ? '' : '<p class="mu">Τίποτα αυτή τη μέρα.</p>')) +
          '<h3>Όλες οι επερχόμενες</h3>' + (upc ? all.filter((x) => x.e.next > t).map((x) => dueCard(x, true)).join('') : '<p class="mu">Καμία.</p>');
      };
      paint();
      const offs = COLS.map((c) => S.on(c, paint));
      el.addEventListener('toggle', (ev) => { if (ev.target.matches('.ndg')) st.gOpen = ev.target.open; }, true);
      el.addEventListener('click', async (ev) => {
        const g = ev.target.closest('[data-wish],[data-wcopy]');
        if (g && g.dataset.wish) { PL.names.markWished(PL.names.today(), g.dataset.wish); return; }   /* ο σύνδεσμος ανοίγει το WhatsApp */
        if (g) { let ok = false; try { await navigator.clipboard.writeText(PL.names.TEXT); ok = true; } catch (x) { /* τίποτα */ }
          D.toast(ok ? '📋 Αντιγράφηκε η ευχή: άνοιξε Viber ή Μηνύματα και κάνε Επικόλληση' : 'Δεν αντιγράφηκε. Γράψε την ευχή με το χέρι.'); if (ok) PL.names.markWished(PL.names.today(), g.dataset.wcopy); return; }
        const t = ev.target.closest('[data-dtab],[data-cnav],[data-cday],[data-semopen],[data-ddone],[data-open]'); if (!t) return;
        if (t.dataset.dtab) { st.tab = t.dataset.dtab; paint(); }
        else if (t.dataset.cnav) { st.calM = new Date(st.calM.getFullYear(), st.calM.getMonth() + (+t.dataset.cnav), 1); paint(); }
        else if (t.dataset.cday) { st.calSel = t.dataset.cday; paint(); }
        else if (t.dataset.semopen) PL.nav.push('seminar', { id: t.dataset.semopen });
        else if (t.dataset.open) PL.nav.push('client', { id: t.dataset.open });
        else if (t.dataset.ddone) { t.disabled = true; try { await done(t.dataset.ddone); } catch (e) { D.toast('Δεν αποθηκεύτηκε'); t.disabled = false; } }
      });
      return () => offs.forEach((f) => f());
    },
  });
})();

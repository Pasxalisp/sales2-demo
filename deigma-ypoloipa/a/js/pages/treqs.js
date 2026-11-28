/* Σελίδες αιτημάτων τεχνικού (27/11/2026, js/treq.js):
   «Αιτήματα» (treqs) = η λίστα του τεχνικού (κάτω μπάρα): Νέα · Ραντεβού ανά πόλη · Σε αναμονή · Ολοκληρωμένα.
   «Αίτημα» (treq) = ένα αίτημα, για τεχνικό και πωλητή: πελάτης (Κλήση, Οδηγίες), σημείωμα, κατηγορίες ✓ φέτος/πέρσι, πρόοδος.
   Τεχνικός: Αποδοχή · Ραντεβού · Αναβολή · Ολοκληρώθηκε (με υποχρεωτική αναφορά). Πωλητής: βλέπει τα βήματα και την αναφορά, ακυρώνει.
   Υπεύθυνος τεχνικών (28/11): η ίδια λίστα για ΟΛΟΥΣ τους τεχνικούς, ανά τεχνικό (με μετρητές), μόνο ανάγνωση. */
(function () {
  const PL = window.PL, u = PL.u, S = PL.store, D = PL.dlg, esc = u.esc, T = () => PL.treq;
  const COLS = ['treq', 'clients'];
  const TI = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>';
  const pill = (r) => `<span class="trp ${T().cls(r)}">${esc(T().label(r))}</span>`;
  const short = (s, n) => { s = String(s || ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; };

  const first = (n) => String(n || '').split(' ')[0];
  function card(id, r) {
    const c = r.c || {}, from = T().isLead() ? first(r.sname) + ' → ' + first(r.tname) : 'από ' + first(r.sname);
    return `<div class="card" data-tr="${esc(id)}"><div class="row"><span class="nm">${esc(c.name)}</span>${pill(r)}</div>` +
      `<div class="mu">${esc(c.city)}${c.area ? ' · ' + esc(c.area) : ''} · ${esc(from)} · ${esc(u.fd(r.sent).slice(0, 5))}</div>` +
      (r.note ? `<div class="trnote"><b>Σημείωμα</b>${esc(short(r.note, 140))}</div>` : '') + '</div>';
  }

  PL.register('treqs', {
    title: 'Αιτήματα',
    split: ['treq', 'client'],
    aside: (el) => { el.innerHTML = '<p class="mu" style="margin-top:20px">Διάλεξε αίτημα από τη λίστα.</p>'; },
    render(el) {
      el.innerHTML = `<h2 class="trh">${TI} Αιτήματα</h2><div class="trstripe"></div><div id="trl"></div>`;
      const $ = (s) => el.querySelector(s);
      COLS.forEach((c) => S.use(c));
      const lead = T().isLead(), sel = { t: '' };   /* υπεύθυνος: φίλτρο τεχνικού ('' = όλοι) */
      const paint = () => {
        const A = T().list(), L = sel.t ? A.filter(([, r]) => r.tid === sel.t) : A, by = (st) => L.filter(([, r]) => st.includes(r.st)), lim = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
        const nw = by(['new']), ap = by(['appt']).sort((a, b) => (a[1].appt < b[1].appt ? -1 : 1)), wt = by(['acc', 'post']);
        const dn = by(['done', 'cancel']).filter(([, r]) => (r.upd || '').slice(0, 10) >= lim);
        /* ραντεβού ανά πόλη (κανόνας Πασχάλη: ομαδοποίηση ανά πόλη), πόλεις με τη σειρά του πρώτου ραντεβού */
        const cities = []; ap.forEach(([, r]) => { const k = (r.c && r.c.city) || ''; if (!cities.includes(k)) cities.push(k); });
        const grp = (t, rows) => (rows.length ? `<p class="trg">${t} (${rows.length})</p>` + rows.map(([id, r]) => card(id, r)).join('') : '');
        /* υπεύθυνος: ένα κουτί ανά τεχνικό (ανοιχτά · ραντεβού · νέα), πάτημα = μόνο αυτού */
        const techs = []; A.forEach(([, r]) => { if (!techs.some((t) => t.id === r.tid)) techs.push({ id: r.tid, name: r.tname || '' }); });
        techs.sort((a, b) => a.name.localeCompare(b.name, 'el'));
        const cnt = (tid, st) => A.filter(([, r]) => r.tid === tid && st.includes(r.st)).length;
        const head = !lead ? '' : `<div class="trtechs">${techs.map((t) => `<button class="trtk${sel.t === t.id ? ' on' : ''}" data-tk="${esc(t.id)}"><b>${esc(t.name)}</b>` +
          `<span>${cnt(t.id, ['new', 'acc', 'appt', 'post'])} ανοιχτά · ${cnt(t.id, ['appt'])} ραντεβού${cnt(t.id, ['new']) ? ' · <em>' + cnt(t.id, ['new']) + ' νέα</em>' : ''}</span></button>`).join('')}</div>` +
          (sel.t ? '<p><button class="shlink" data-tk="">‹ Όλοι οι τεχνικοί</button></p>' : '');
        $('#trl').innerHTML = head + (L.length ? '' : `<p class="mu">${lead ? 'Δεν υπάρχουν αιτήματα ακόμα.' : 'Δεν σου έχουν στείλει ακόμα αίτημα. Μόλις σου στείλει ένας πωλητής, θα έρθει εδώ.'}</p>`) +
          grp('Νέα', nw) +
          (ap.length ? `<p class="trg">Ραντεβού (${ap.length})</p>` + cities.map((k) => `<div class="trcity">${esc(k)}</div>` + ap.filter(([, r]) => ((r.c && r.c.city) || '') === k).map(([id, r]) => card(id, r)).join('')).join('') : '') +
          grp('Σε αναμονή', wt) +
          (dn.length ? `<details class="trdone"><summary class="trg">Ολοκληρωμένα · 30 μέρες (${dn.length})</summary>${dn.map(([id, r]) => card(id, r)).join('')}</details>` : '');
        T().markSeen();
      };
      paint();
      const offs = COLS.map((c) => S.on(c, paint));
      el.addEventListener('click', (ev) => {
        const k = ev.target.closest('[data-tk]'); if (k) { sel.t = sel.t === k.dataset.tk ? '' : k.dataset.tk; paint(); return; }
        const c = ev.target.closest('[data-tr]'); if (c) PL.nav.push('treq', { id: c.dataset.tr });
      });
      return () => offs.forEach((f) => f());
    },
  });

  PL.register('treq', {
    title: 'Αίτημα',
    render(el, params) {
      const id = params.id;
      const ui = { form: '' };   /* ανοιχτή φόρμα: '' | 'appt' | 'rep' */
      COLS.forEach((c) => S.use(c));
      const paint = () => {
        const r = T().get(id);
        if (!r) { el.innerHTML = '<div class="warn"><b>Δεν βρέθηκε το αίτημα</b>Ίσως δεν έχουν φορτώσει ακόμα τα δεδομένα.</div>'; return; }
        const tech = T().isTech(), lead = T().isLead(), c0 = r.c || {}, c = PL.model.byId(r.cid) || Object.assign({ i: r.cid }, c0), open = T().open(r);
        const who = lead ? `Από <b>${esc(r.sname)}</b> στον τεχνικό <b>${esc(r.tname)}</b> · ${esc(u.fd(r.sent))}`
          : tech ? `Από <b>${esc(r.sname)}</b> · ${esc(u.fd(r.sent))}` : `Στον τεχνικό <b>${esc(r.tname)}</b> · στάλθηκε ${esc(u.fd(r.sent))}`;
        const log = (r.log || []).slice().reverse().map((x) => `<div class="mu">${esc(u.fd(x.at.slice(0, 10)).slice(0, 5))} ${esc(x.at.slice(11, 16))} · ${esc(x.st === 'new' ? 'Στάλθηκε' : T().ST[x.st] || x.st)}</div>`).join('');
        let acts = '';
        if (tech && open) {
          acts = '<div class="tracts">' + (r.st === 'new' ? '<button class="trb" id="tracc">✓ Το είδα</button>' : '') +
            `<button id="trappt">📅 ${r.st === 'appt' ? 'Αλλαγή ραντεβού' : 'Ραντεβού'}</button>` +
            (r.st !== 'new' && r.st !== 'post' ? '<button id="trpost">Αναβολή</button>' : '') +
            (r.st !== 'new' ? '<button class="pri" id="trfin">✓ Ολοκληρώθηκε</button>' : '') + '</div>';
          if (ui.form === 'appt') { const [d, t] = (r.appt || '').split('T');
            acts += `<div class="trform"><label for="trd">Μέρα και ώρα</label><div style="display:flex;gap:6px"><input type="date" id="trd" value="${esc(d || '')}" style="flex:1"><input type="time" id="trt" value="${esc(t || '10:00')}" style="flex:none;width:120px" aria-label="Ώρα"></div>` +
              '<p><button class="pri" id="trapptok">Αποθήκευση</button> <button id="trx">Άκυρο</button></p></div>'; }
          if (ui.form === 'rep') acts += '<div class="trform"><label for="trrep">Τι έγινε στην επίσκεψη</label><textarea id="trrep" rows="6" placeholder="Τι είπατε, τι δείξατε, τι χρειάζεται ο πελάτης…"></textarea>' +
            '<p class="mu" style="margin:4px 0 0">Υποχρεωτικό. Το βλέπει ο πωλητής και μένει στο ιστορικό του πελάτη.</p><p><button class="pri" id="trrepok">Αποθήκευση και ολοκλήρωση</button> <button id="trx">Άκυρο</button></p></div>';
        }
        if (!tech && !lead && open) acts = '<div class="tracts"><button id="trcancel">Ακύρωση αιτήματος</button></div>';
        const keep = el.querySelector('#trrep') && el.querySelector('#trrep').value;
        el.innerHTML = PL.sheet.head(c0, esc(c0.addr) + (c0.addr && c0.city ? ', ' : '') + esc(c0.city), pill(r)) +
          PL.sheet.acts(PL.sheet.call(c), PL.sheet.map(c)) +
          `<div class="trwho">${who}</div>` + T().steps(r) +
          (r.st === 'appt' ? `<p class="trappt">📅 Ραντεβού: <b>${esc(T().when(r.appt))}</b></p>` : '') +
          (r.note ? `<div class="trnote"><b>Σημείωμα πωλητή</b>${esc(r.note)}</div>` : '') +
          (r.rep ? `<div class="trrep"><b>Αναφορά τεχνικού · ${esc(r.tname || '')} · ${esc(u.fd(r.rep.at.slice(0, 10)))}</b>${esc(r.rep.t)}</div>` : '') +
          acts + `<h3>Τι δουλεύει</h3>${T().catsTable(c0)}` +
          (PL.model.byId(r.cid) ? `<p><button id="trcard">Καρτέλα πελάτη</button></p>` : '') +
          `<details class="trlog"><summary>Ιστορικό αιτήματος</summary>${log}</details>`;
        if (keep && el.querySelector('#trrep')) el.querySelector('#trrep').value = keep;
      };
      paint();
      const offs = COLS.map((c) => S.on(c, () => { if (!el.querySelector('.trform')) paint(); }));
      el.addEventListener('click', async (ev) => {
        const b = ev.target.closest('button'); if (!b || !b.id) return;
        const $ = (s) => el.querySelector(s);
        try {
          if (b.id === 'trcard') { PL.nav.push('client', { id: T().get(id).cid }); return; }
          if (b.id === 'trx') { ui.form = ''; paint(); return; }
          if (b.id === 'trappt') { ui.form = 'appt'; paint(); return; }
          if (b.id === 'trfin') { ui.form = 'rep'; paint(); const t = $('#trrep'); if (t) t.focus(); return; }
          b.disabled = true;
          if (b.id === 'tracc') { await T().accept(id); D.toast('✓ Ο πωλητής βλέπει ότι το είδες'); }
          else if (b.id === 'trpost') { await T().postpone(id); D.toast('Αναβλήθηκε. Ο πωλητής το βλέπει.'); }
          else if (b.id === 'trapptok') { await T().appoint(id, $('#trd').value, $('#trt').value); ui.form = ''; D.toast('📅 Ραντεβού ' + T().when(T().get(id).appt) + '. Ο πωλητής το βλέπει.'); }
          else if (b.id === 'trrepok') { await T().finish(id, $('#trrep').value); ui.form = ''; D.toast('✓ Ολοκληρώθηκε. Η αναφορά πήγε στον πωλητή.'); }
          else if (b.id === 'trcancel') {
            if (!await D.confirm('Να ακυρωθεί το αίτημα για τον «' + ((T().get(id).c || {}).name || '') + '»; Ο τεχνικός θα το δει ως ακυρωμένο.', 'Ναι, ακύρωση')) { b.disabled = false; return; }
            await T().cancel(id); D.toast('Το αίτημα ακυρώθηκε');
          }
          paint();
        } catch (e) { D.toast((e && e.message) || 'Δεν αποθηκεύτηκε'); b.disabled = false; }
      });
      return () => offs.forEach((f) => f());
    },
  });
})();

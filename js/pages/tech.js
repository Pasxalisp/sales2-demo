/* «Ενέργειες»: αρχική με τρεις κάρτες (Επίσκεψη τεχνικού, Σεμινάρια, Καμπάνιες), και η λίστα «Τεχνική υποστήριξη» (πελάτες που χρειάζονται τεχνικό).
   Με λογαριασμούς (27/11/2026, js/treq.js): ο πωλητής γράφει σημείωμα και πατά «Ολοκληρώθηκε – Στείλε στον τεχνικό» → αίτημα στον
   συνεργαζόμενο τεχνικό· στη λίστα φαίνονται τα βήματα και η αναφορά. Ο τεχνικός έχει εδώ μόνο «Αιτήματα» και «Σεμινάρια».
   Τάμπλετ: στη λίστα, δεξιά το φύλλο τεχνικού (techreq.js) ή, χωρίς πάτημα, οι πελάτες ανά πόλη. */
(function () {
  const PL = window.PL, u = PL.u, M = PL.model, S = PL.store, D = PL.dlg, esc = u.esc, db = () => PL.adapter.db;
  const COLS = ['clients', 'prospects', 'tech', 'seminars', 'campaigns', 'treq', 'settings'];
  const TI = (n) => `<svg viewBox="0 0 24 24" width="${n}" height="${n}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="5" cy="18" r="2.6"/><circle cx="11.5" cy="18" r="2.6"/><path d="M6.8 16 13.5 3.5"/><path d="M9.7 16 3 3.5"/><rect x="15.5" y="3.5" width="6.5" height="3" rx="1"/><path d="M16.6 6.5v8M18.2 6.5v8M19.8 6.5v8M21.4 6.5v8"/></svg>`;

  PL.register('tech', {
    title: 'Ενέργειες',
    render(el) {
      const chev = '<svg class="hubc" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>';
      el.innerHTML = `<h2>Ενέργειες</h2>
<button class="hubk" id="hubt"><span class="hubi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg></span><span class="hubx"><b>Επίσκεψη τεχνικού</b><span class="mu">Πελάτες που χρειάζονται τεχνικό</span></span><span class="hubn" id="hubtc"></span>${chev}</button>
<button class="hubk" id="hubs"><span class="hubi"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3 1 8.5 12 14l9-4.5V16h2V8.5z"/><path d="M5.5 12.2V16c0 1.8 3 3.5 6.5 3.5s6.5-1.7 6.5-3.5v-3.8L12 15.5z"/></svg></span><span class="hubx"><b>Σεμινάρια</b><span class="mu">Σεμινάρια Ακαδημίας και ποιοι πελάτες ενδιαφέρονται</span></span><span class="hubn" id="hubsc"></span>${chev}</button>
<button class="hubk" id="hubc"><span class="hubi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 5 5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/></svg></span><span class="hubx"><b>Καμπάνιες</b><span class="mu">Προσφορές της εταιρείας και ποιοι πελάτες ενδιαφέρονται</span></span><span class="hubn" id="hubcc"></span>${chev}</button>`;
      const $ = (s) => el.querySelector(s);
      COLS.forEach((c) => S.use(c));
      const TR = PL.treq, tech = !PL.can('techlist');
      /* τεχνικός: «Αιτήματα» στη θέση της λίστας, χωρίς καμπάνιες */
      if (tech) { $('#hubt b').textContent = 'Αιτήματα'; $('#hubt .mu').textContent = 'Οι επισκέψεις που σου έστειλαν οι πωλητές'; $('#hubc').remove(); }
      const paint = () => {
        if (tech) { $('#hubtc').textContent = TR.list().filter(([, r]) => TR.open(r)).length; $('#hubsc').textContent = PL.actions.seminar.active(); return; }
        $('#hubtc').textContent = Object.keys(S.all('tech')).filter((id) => M.byId(id)).length;
        $('#hubsc').textContent = PL.actions.seminar.active();
        $('#hubcc').textContent = PL.actions.campaign.active();
      };
      paint();
      $('#hubt').onclick = () => PL.nav.push(tech ? 'treqs' : 'techlist');
      $('#hubs').onclick = () => PL.nav.push('semlist');
      if (!tech) $('#hubc').onclick = () => PL.nav.push('camplist');
      const offs = COLS.map((c) => S.on(c, paint));
      return () => offs.forEach((f) => f());
    },
  });

  PL.register('techlist', {
    title: 'Τεχνική υποστήριξη',
    split: ['client', 'techreq', 'treq'],
    aside: (el) => PL.techSheet.aside(el),   /* techreq.js: ανά πόλη */
    render(el) {
      el.innerHTML = `<h2 style="display:flex;align-items:center;gap:8px">${TI(28)} Τεχνική υποστήριξη</h2>
<div style="height:8px;border-radius:4px;background:repeating-linear-gradient(-45deg,#f2c94c 0 11px,#2b2b2b 11px 22px);margin:-4px 0 12px"></div>
<div id="tmate"></div><div id="tl"></div><h3>Πρόσθεσε πελάτη</h3><input id="tadd" list="dcl" placeholder="Όνομα πελάτη…"><input id="tnote0" placeholder="Τι χρειάζεται (προαιρετικό)" style="margin-top:6px"><p><button class="pri" id="taddb">Προσθήκη</button></p><span id="dclh"></span>`;
      const $ = (s) => el.querySelector(s);
      COLS.forEach((c) => S.use(c));
      const TR = PL.treq, on = TR.on();
      /* ένας πελάτης της λίστας. Με λογαριασμούς: πρόχειρο (σημείωμα + «Στείλε») ή αίτημα με βήματα/αναφορά. */
      const row = ([id, t]) => {
        const c = M.byId(id), tel = PL.call.first(c), r = on && t.rid ? TR.get(t.rid) : null;
        const head = `<div class="row"><span class="nm">${PL.prospects.tag(c)}${esc(c.name)}</span>${r ? `<span class="trp ${TR.cls(r)}">${esc(TR.label(r))}</span>` : on ? '<span class="trp dr">Πρόχειρο</span>' : `<span class="mu" style="white-space:nowrap">από ${esc(t.d || '')}</span>`}</div><div class="mu">${esc(c.city)}${c.addr ? ' · ' + esc(c.addr) : ''}</div>`;
        const btns = (x) => `<div style="margin-top:6px">${tel ? PL.call.btn(tel, c.name) : ''}<button data-open="${esc(id)}" style="margin:0 6px 6px 0">Καρτέλα</button>${x}</div>`;
        if (!on) return `<div class="card" data-tro="${esc(id)}" style="cursor:${PL.WIDE.matches ? 'pointer' : 'default'}">${head}${t.note ? `<div style="margin-top:4px"><b>Χρειάζεται:</b> ${esc(t.note)}</div>` : ''}${btns(`<button data-tdone="${esc(id)}" style="margin:0 0 6px 0">✓ Έγινε</button>`)}</div>`;
        if (!r) return `<div class="card" style="cursor:default">${head}<label for="tn${esc(id)}">Σημείωμα για τον τεχνικό</label><textarea id="tn${esc(id)}" rows="3" placeholder="Τι χρειάζεται ο πελάτης…">${esc(t.note || '')}</textarea>` +
          '<p class="mu" style="margin:4px 0 0">Ο τεχνικός δεν το βλέπει ακόμα.</p>' + `<div class="tracts"><button class="pri" data-tsend="${esc(id)}">✓ Ολοκληρώθηκε – Στείλε στον τεχνικό</button></div>` + btns(`<button data-tdone="${esc(id)}" style="margin:0 0 6px 0">Αφαίρεση</button>`) + '</div>';
        return `<div class="card" style="cursor:default">${head}${r.note ? `<div class="trnote"><b>Σημείωμα</b>${esc(r.note)}</div>` : ''}${TR.steps(r)}` +
          (r.rep ? `<div class="trrep"><b>Αναφορά τεχνικού · ${esc(r.tname || '')}</b>${esc(r.rep.t)}</div>` : '') +
          btns(`<button data-treq="${esc(t.rid)}" style="margin:0 6px 6px 0">Αίτημα</button>` + (TR.open(r) ? '' : `<button data-tdone="${esc(id)}" style="margin:0 0 6px 0">✓ Έγινε</button>`)) + '</div>';
      };
      const paint = () => {
        const L = Object.entries(S.all('tech')).filter(([id]) => M.byId(id)).sort((a, b) => ((a[1].d || '') < (b[1].d || '') ? -1 : 1));
        const keep = {}; el.querySelectorAll('#tl textarea').forEach((x) => { keep[x.id] = x.value; });
        /* χωρίς συνεργαζόμενο τεχνικό δεν στέλνεται τίποτα: πρώτα οι Ρυθμίσεις */
        $('#tmate').innerHTML = on && !TR.mate() ? '<div class="warn" style="margin:0 0 10px"><b>Διάλεξε συνεργαζόμενο τεχνικό</b>Για να στέλνεις πελάτες στον τεχνικό, διάλεξέ τον μία φορά στις Ρυθμίσεις.<p style="margin:8px 0 0"><button class="pri" data-go="data">Ρυθμίσεις</button></p></div>' : '';
        $('#tl').innerHTML = L.length ? L.map(row).join('') : '<p class="mu">Κανένας πελάτης δεν χρειάζεται τεχνικό αυτή τη στιγμή.</p>';
        Object.entries(keep).forEach(([k, v]) => { const x = el.querySelector('#' + k); if (x) x.value = v; });
        $('#dclh').innerHTML = PL.dcl();
        if (on) TR.markSeen();
      };
      paint();
      const offs = COLS.map((c) => S.on(c, paint));
      el.addEventListener('click', async (ev) => {
        const t = ev.target;
        try {
          if (t.dataset.open) PL.nav.push('client', { id: t.dataset.open });
          else if (t.dataset.go) PL.nav.push(t.dataset.go);
          else if (t.dataset.treq) PL.nav.push('treq', { id: t.dataset.treq });
          else if (t.dataset.tsend) {
            const id = t.dataset.tsend, n = (el.querySelector('#tn' + id) || {}).value || '';
            if (!n.trim()) { D.toast('Γράψε πρώτα τι χρειάζεται ο πελάτης'); return; }
            t.disabled = true;
            try { await PL.treq.send(id, n.trim()); D.toast('✓ Στάλθηκε στον τεχνικό ' + (PL.treq.mate() || {}).name + '. Θα βλέπεις κάθε βήμα.'); }
            catch (e) { t.disabled = false; D.toast((e && e.message) || 'Δεν στάλθηκε'); }
          }
          /* τάμπλετ: πάτημα στο κουτί → φύλλο τεχνικού δεξιά */
          else if (PL.WIDE.matches && t.closest('.card[data-tro]') && !t.closest('button,input,a')) PL.nav.push('techreq', { id: t.closest('.card[data-tro]').dataset.tro });
          else if (t.dataset.tdone) {
            const id = t.dataset.tdone, c = M.byId(id);
            const tt = S.get('tech', id) || {}, msg = tt.rid ? 'Ολοκληρώθηκε η τεχνική επίσκεψη στον «' + (c ? c.name : '') + '»; Θα φύγει από τη λίστα (η αναφορά μένει στην καρτέλα).'
              : PL.treq.on() ? 'Να φύγει ο «' + (c ? c.name : '') + '» από τη λίστα; Δεν έχει σταλεί στον τεχνικό.' : 'Ολοκληρώθηκε η τεχνική επίσκεψη στον «' + (c ? c.name : '') + '»; Θα φύγει από τη λίστα.';
            if (!(await D.confirm(msg, tt.rid || !PL.treq.on() ? 'Ναι, ολοκληρώθηκε' : 'Ναι, αφαίρεση'))) return;
            await db().remove('tech/' + id); S.drop('tech', id); paint();
          } else if (t.id === 'taddb') {
            const id = PL.dclId($('#tadd').value);
            if (!M.byId(id)) { D.toast('Διάλεξε πελάτη από τη λίστα'); return; }
            const doc = { d: u.today(), note: $('#tnote0').value.trim() };
            await db().set('tech/' + id, doc); S.put('tech', id, doc); $('#tadd').value = ''; $('#tnote0').value = ''; paint();
          }
        } catch (e) { D.toast('Δεν αποθηκεύτηκε'); }
      });
      return () => offs.forEach((f) => f());
    },
  });
})();

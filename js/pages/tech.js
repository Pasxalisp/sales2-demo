/* «Τεχνικός – Σεμινάρια»: αρχική με δύο κάρτες, και η λίστα «Τεχνική υποστήριξη» (πελάτες που χρειάζονται τεχνικό).
   Τάμπλετ: στη λίστα, δεξιά το φύλλο τεχνικού (techreq.js) ή, χωρίς πάτημα, οι πελάτες ανά πόλη. */
(function () {
  const PL = window.PL, u = PL.u, M = PL.model, S = PL.store, D = PL.dlg, esc = u.esc, db = () => PL.adapter.db;
  const COLS = ['clients', 'prospects', 'tech', 'seminars'];
  const TI = (n) => `<svg viewBox="0 0 24 24" width="${n}" height="${n}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="5" cy="18" r="2.6"/><circle cx="11.5" cy="18" r="2.6"/><path d="M6.8 16 13.5 3.5"/><path d="M9.7 16 3 3.5"/><rect x="15.5" y="3.5" width="6.5" height="3" rx="1"/><path d="M16.6 6.5v8M18.2 6.5v8M19.8 6.5v8M21.4 6.5v8"/></svg>`;

  PL.register('tech', {
    title: 'Τεχνικός – Σεμινάρια',
    render(el) {
      const chev = '<svg class="hubc" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>';
      el.innerHTML = `<h2>Τεχνικός – Σεμινάρια</h2>
<button class="hubk" id="hubt"><span class="hubi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg></span><span class="hubx"><b>Επίσκεψη τεχνικού</b><span class="mu">Πελάτες που χρειάζονται τεχνικό</span></span><span class="hubn" id="hubtc"></span>${chev}</button>
<button class="hubk" id="hubs"><span class="hubi"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3 1 8.5 12 14l9-4.5V16h2V8.5z"/><path d="M5.5 12.2V16c0 1.8 3 3.5 6.5 3.5s6.5-1.7 6.5-3.5v-3.8L12 15.5z"/></svg></span><span class="hubx"><b>Σεμινάρια</b><span class="mu">Σεμινάρια Ακαδημίας και ποιοι πελάτες ενδιαφέρονται</span></span><span class="hubn" id="hubsc"></span>${chev}</button>`;
      const $ = (s) => el.querySelector(s);
      COLS.forEach((c) => S.use(c));
      const paint = () => {
        $('#hubtc').textContent = Object.keys(S.all('tech')).filter((id) => M.byId(id)).length;
        $('#hubsc').textContent = Object.keys(S.all('seminars')).length;
      };
      paint();
      $('#hubt').onclick = () => PL.nav.push('techlist');
      $('#hubs').onclick = () => PL.nav.push('semlist');
      const offs = COLS.map((c) => S.on(c, paint));
      return () => offs.forEach((f) => f());
    },
  });

  PL.register('techlist', {
    title: 'Τεχνική υποστήριξη',
    split: ['client', 'techreq'],
    aside: (el) => PL.techSheet.aside(el),   /* techreq.js: ανά πόλη */
    render(el) {
      el.innerHTML = `<h2 style="display:flex;align-items:center;gap:8px">${TI(28)} Τεχνική υποστήριξη</h2>
<div style="height:8px;border-radius:4px;background:repeating-linear-gradient(-45deg,#f2c94c 0 11px,#2b2b2b 11px 22px);margin:-4px 0 12px"></div>
<div id="tl"></div><h3>Πρόσθεσε πελάτη</h3><input id="tadd" list="dcl" placeholder="Όνομα πελάτη…"><input id="tnote0" placeholder="Τι χρειάζεται (προαιρετικό)" style="margin-top:6px"><p><button class="pri" id="taddb">Προσθήκη</button></p><span id="dclh"></span>`;
      const $ = (s) => el.querySelector(s);
      COLS.forEach((c) => S.use(c));
      const paint = () => {
        const L = Object.entries(S.all('tech')).filter(([id]) => M.byId(id)).sort((a, b) => ((a[1].d || '') < (b[1].d || '') ? -1 : 1));
        $('#tl').innerHTML = L.length ? L.map(([id, t]) => {
          const c = M.byId(id), tel = PL.call.first(c);
          return `<div class="card" data-tro="${esc(id)}" style="cursor:${PL.WIDE.matches ? 'pointer' : 'default'}"><div class="row"><span class="nm">${PL.prospects.tag(c)}${esc(c.name)}</span><span class="mu" style="white-space:nowrap">από ${esc(t.d || '')}</span></div><div class="mu">${esc(c.city)}${c.addr ? ' · ' + esc(c.addr) : ''}</div>${t.note ? `<div style="margin-top:4px"><b>Χρειάζεται:</b> ${esc(t.note)}</div>` : ''}<div style="margin-top:6px">${tel ? PL.call.btn(tel, c.name) : ''}<button data-open="${esc(id)}" style="margin:0 6px 6px 0">Καρτέλα</button><button data-tdone="${esc(id)}" style="margin:0 0 6px 0">✓ Έγινε</button></div></div>`;
        }).join('') : '<p class="mu">Κανένας πελάτης δεν χρειάζεται τεχνικό αυτή τη στιγμή.</p>';
        $('#dclh').innerHTML = PL.dcl();
      };
      paint();
      const offs = COLS.map((c) => S.on(c, paint));
      el.addEventListener('click', async (ev) => {
        const t = ev.target;
        try {
          if (t.dataset.open) PL.nav.push('client', { id: t.dataset.open });
          /* τάμπλετ: πάτημα στο κουτί → φύλλο τεχνικού δεξιά */
          else if (PL.WIDE.matches && t.closest('.card[data-tro]') && !t.closest('button,input,a')) PL.nav.push('techreq', { id: t.closest('.card[data-tro]').dataset.tro });
          else if (t.dataset.tdone) {
            const id = t.dataset.tdone, c = M.byId(id);
            if (!(await D.confirm('Ολοκληρώθηκε η τεχνική επίσκεψη στον «' + (c ? c.name : '') + '»; Θα φύγει από τη λίστα.', 'Ναι, ολοκληρώθηκε'))) return;
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

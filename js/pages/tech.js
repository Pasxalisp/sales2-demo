/* «Τεχνικός – Σεμινάρια»: αρχική με δύο κάρτες, και η λίστα «Τεχνική υποστήριξη» (πελάτες που χρειάζονται τεχνικό). */
(function () {
  const PL = window.PL, u = PL.u, M = PL.model, S = PL.store, D = PL.dlg, esc = u.esc, db = () => PL.adapter.db;
  const COLS = ['clients', 'prospects', 'tech', 'seminars'];
  const TI = (n) => `<svg viewBox="0 0 24 24" width="${n}" height="${n}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="5" cy="18" r="2.6"/><circle cx="11.5" cy="18" r="2.6"/><path d="M6.8 16 13.5 3.5"/><path d="M9.7 16 3 3.5"/><rect x="15.5" y="3.5" width="6.5" height="3" rx="1"/><path d="M16.6 6.5v8M18.2 6.5v8M19.8 6.5v8M21.4 6.5v8"/></svg>`;

  PL.register('tech', {
    title: 'Τεχνικός – Σεμινάρια',
    render(el) {
      el.innerHTML = `<h2>Τεχνικός – Σεμινάρια</h2>
<div class="card" id="hubt" style="padding:18px"><div class="row"><span class="nm" style="font-size:18px">🔧 Επίσκεψη τεχνικού</span><span class="tz" id="hubtc"></span></div><div class="mu">Πελάτες που χρειάζονται τεχνικό</div></div>
<div class="card" id="hubs" style="padding:18px"><div class="row"><span class="nm" style="font-size:18px">🎓 Σεμινάρια</span><span class="tz" id="hubsc"></span></div><div class="mu">Σεμινάρια Ακαδημίας και ποιοι πελάτες ενδιαφέρονται</div></div>`;
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
          return `<div class="card" style="cursor:default"><div class="row"><span class="nm">${PL.prospects.tag(c)}${esc(c.name)}</span><span class="mu" style="white-space:nowrap">από ${esc(t.d || '')}</span></div><div class="mu">${esc(c.city)}${c.addr ? ' · ' + esc(c.addr) : ''}</div>${t.note ? `<div style="margin-top:4px"><b>Χρειάζεται:</b> ${esc(t.note)}</div>` : ''}<div style="margin-top:6px">${tel ? PL.call.btn(tel, c.name) : ''}<button data-open="${esc(id)}" style="margin:0 6px 6px 0">Καρτέλα</button><button data-tdone="${esc(id)}" style="margin:0 0 6px 0">✓ Έγινε</button></div></div>`;
        }).join('') : '<p class="mu">Κανένας πελάτης δεν χρειάζεται τεχνικό αυτή τη στιγμή.</p>';
        $('#dclh').innerHTML = PL.dcl();
      };
      paint();
      const offs = COLS.map((c) => S.on(c, paint));
      el.addEventListener('click', async (ev) => {
        const t = ev.target;
        try {
          if (t.dataset.open) PL.nav.push('client', { id: t.dataset.open });
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

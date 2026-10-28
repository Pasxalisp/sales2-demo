/* «Φύλλο τεχνικού» (τάμπλετ, δεξιά από την Τεχνική υποστήριξη): τι χρειάζεται ο πελάτης (αλλάζει επί τόπου), από πότε,
   Κλήση / Οδηγίες / ✓ Έγινε, και κείμενο έτοιμο για αντιγραφή προς τον τεχνικό (το στέλνεις εσύ). params: {id}.
   Και το δεξί μέρος της λίστας χωρίς επιλογή: PL.techSheet.aside(el) — οι πελάτες ανά πόλη, για να στήσει διαδρομή. */
(function () {
  const PL = window.PL, u = PL.u, M = PL.model, S = PL.store, D = PL.dlg, H = PL.sheet, esc = u.esc, db = () => PL.adapter.db;
  const COLS = ['clients', 'prospects', 'tech', 'notes', 'balances', 'deals'];
  const brief = (c, t) => [c.name, [c.addr, c.zip, c.city].filter(Boolean).join(', '), PL.call.tels(c).join(' / '), t.note ? 'Χρειάζεται: ' + t.note : '', M.works(c.i).length ? 'Δουλεύει: ' + M.works(c.i).join(', ') : ''].filter(Boolean).join('\n');
  const copy = async (txt) => { let ok = false; try { await navigator.clipboard.writeText(txt); ok = true; } catch (x) { /* τίποτα */ } D.toast(ok ? '📋 Αντιγράφηκε: επικόλλησέ το στο Viber ή στα Μηνύματα του τεχνικού' : 'Δεν αντιγράφηκε. Επίλεξε το κείμενο και αντέγραψέ το.'); };

  PL.register('techreq', {
    title: 'Τεχνικός',
    render(el, params) {
      const id = params.id;
      COLS.forEach((c) => S.use(c));
      el.innerHTML = '<div id="trtop"></div><div class="shbox hi" id="trnb"><h3>Τι χρειάζεται</h3><textarea id="trn" placeholder="π.χ. Εκπαίδευση στο Elumen, ρύθμιση χρωμάτων"></textarea><div class="shrow" style="margin:0"><button class="pri" id="trsave">Αποθήκευση</button><span class="mu" id="trmsg" style="align-self:center"></span></div></div><div id="trbot"></div>';
      const $ = (s) => el.querySelector(s);
      let filled = false;
      const paint = () => {
        const c = M.byId(id), t = S.get('tech', id);
        if (!c || !t) { $('#trtop').innerHTML = S.loaded('tech') && c ? '<p class="mu">Δεν είναι πια στη λίστα τεχνικού.</p>' : '<p class="mu">Φορτώνω…</p>'; $('#trnb').hidden = !!(S.loaded('tech') && c); $('#trbot').innerHTML = c ? H.nav(id) : ''; return; }
        $('#trnb').hidden = false;
        if (!filled) { filled = true; $('#trn').value = t.note || ''; }
        $('#trtop').innerHTML = H.head(c, esc([c.addr, c.city].filter(Boolean).join(', ')), t.d ? 'στη λίστα από ' + esc(u.fd(t.d)) : '') +
          H.acts(H.call(c), H.map(c), '<button class="shdone" id="trdone">✓ Έγινε</button>') + H.facts(c);
        $('#trbot').innerHTML = H.box('Για τον τεχνικό', `<pre class="shpre">${esc(brief(c, t))}</pre><div class="shrow" style="margin:0"><button id="trcp">📋 Αντιγραφή</button></div>`) + H.last(id) + H.nav(id);
      };
      paint();
      const offs = COLS.map((c) => S.on(c, paint));
      el.addEventListener('click', async (ev) => {
        const b = ev.target.closest('#trsave,#trdone,#trcp'); if (!b) return;
        const c = M.byId(id), t = S.get('tech', id);
        try {
          if (b.id === 'trcp' && c && t) await copy(brief(c, t));
          else if (b.id === 'trsave' && t) { const doc = Object.assign({}, t, { note: $('#trn').value.trim() }); await db().set('tech/' + id, doc); S.put('tech', id, doc); $('#trmsg').textContent = '✓ Αποθηκεύτηκε'; }
          else if (b.id === 'trdone') {
            if (!(await D.confirm('Ολοκληρώθηκε η τεχνική επίσκεψη στον «' + (c ? c.name : '') + '»; Θα φύγει από τη λίστα.', 'Ναι, ολοκληρώθηκε'))) return;
            await db().remove('tech/' + id); S.drop('tech', id); PL.nav.back();
          }
        } catch (x) { D.toast('Δεν αποθηκεύτηκε'); }
      });
      return () => offs.forEach((f) => f());
    },
  });

  /* Δεξί μέρος χωρίς επιλογή: ανά πόλη (μεγαλύτερη ομάδα πρώτη), με αντιγραφή όλης της λίστας για τον τεχνικό. */
  PL.techSheet = {
    aside(el) {
      COLS.forEach((c) => S.use(c));
      const all = () => Object.entries(S.all('tech')).filter(([id]) => M.byId(id));
      const groups = () => { const g = {}; all().forEach(([id, t]) => { const cy = M.byId(id).city || '—'; (g[cy] = g[cy] || []).push([id, t]); }); return Object.entries(g).sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], 'el')); };
      const paint = () => {
        const G = groups();
        el.innerHTML = '<h2 style="margin-top:0">Ανά πόλη</h2><p class="mu" style="margin-top:-6px">Για να στηθεί η διαδρομή του τεχνικού. Πάτα έναν πελάτη για το φύλλο του.</p>' +
          (G.length ? G.map(([cy, L]) => H.box(`${esc(cy)} (${L.length})`, H.list(L.map(([id, t]) => ({ attr: `data-tro="${esc(id)}"`, name: esc(M.byId(id).name), sub: esc(t.note || M.byId(id).addr || ''), right: t.d ? 'από ' + esc(u.fd(t.d)).slice(0, 5) : '', cls: 'mu' }))))).join('') +
            '<button id="trall" style="width:100%">📋 Αντιγραφή όλης της λίστας για τον τεχνικό</button>' : '<p class="mu">Κανένας πελάτης δεν χρειάζεται τεχνικό.</p>');
      };
      paint();
      const offs = COLS.map((c) => S.on(c, paint));
      el.addEventListener('click', (ev) => {
        const r = ev.target.closest('[data-tro]'); if (r) { PL.nav.push('techreq', { id: r.dataset.tro }); return; }
        if (ev.target.id === 'trall') copy(groups().map(([cy, L]) => '== ' + cy + ' ==\n' + L.map(([id, t]) => brief(M.byId(id), t)).join('\n\n')).join('\n\n'));
      });
      return () => offs.forEach((f) => f());
    },
  };
})();

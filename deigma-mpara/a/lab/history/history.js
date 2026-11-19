/* «Ιστορικό αλλαγών» (απόφαση 18/11/2026, Β9): ποιος άλλαξε τι και πότε, για τον διαχειριστή.
   Κάθε νέο / αλλαγμένο / σβησμένο έγγραφο το γράφει η ίδια η βάση (trigger στον πίνακα docs → doc_history) και το δίνει το
   PL.adapter.org.history. Μόνο στην έκδοση με βάση (db.html). Φίλτρα: χρήστης, αναζήτηση (π.χ. όνομα πελάτη).
   Ονόματα συλλογών: PL.usage.ACT (ένα σημείο). Εμφάνιση: lab/history/history.css (+ team.css, usage.css). */
(function () {
  const PL = window.PL, O = PL.adapter.org, me = O && O.me;
  if (!me) return;
  const u = PL.u, esc = u.esc;
  const OP = { new: ['νέο', 'up'], edit: ['αλλαγή', ''], del: ['διαγραφή', 'dn'] };
  const fold = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const when = (t) => { const d = new Date(t); return d.toLocaleDateString('el-GR', { day: 'numeric', month: 'numeric' }) + ' ' + u.pad(d.getHours()) + ':' + u.pad(d.getMinutes()); };
  /* «Σημειώσεις · ΧΡΙΣΤΟΔΟΥΛΟΥ ΜΑΡΙΑ»: η συλλογή με λόγια, και ο πελάτης αν το έγγραφο είναι πελάτη */
  function what(r) {
    const i = r.path.lastIndexOf('/'), col = i > 0 ? r.path.slice(0, i) : r.path, id = i > 0 ? r.path.slice(i + 1) : '';
    const L = (PL.usage && PL.usage.ACT) || {}, src = r.user && O.data(r.user), c = src && id ? src.get('clients', id) : null;
    return (L[col] || (col === 'clients' ? 'Πελάτης' : col)) + (c ? ' · ' + c.name : id && col !== 'clients' ? ' · ' + id : '');
  }

  PL.register('history', {
    title: 'Ιστορικό αλλαγών',
    render(el) {
      el.classList.add('tmpage');
      if (!me.admin) { el.innerHTML = '<h2>Χωρίς πρόσβαση</h2><p class="mu">Το ιστορικό αλλαγών το βλέπει μόνο ο διαχειριστής.</p>'; return; }
      const head = '<div class="tmhead"><h2>Ιστορικό αλλαγών</h2><p class="mu">Ποιος άλλαξε τι και πότε · τελευταίες 60 μέρες</p></div>';
      if (!O.history) { el.innerHTML = head + '<p class="mu">Το ιστορικό καταγράφεται στην έκδοση με βάση (db.html).</p>'; return; }
      let L = null, err = '';
      const st = { user: '', q: '' };
      el.innerHTML = head + '<div class="hisf"><select id="hisu" aria-label="Χρήστης"><option value="">Όλοι οι χρήστες</option></select><input id="hisq" type="search" placeholder="Αναζήτηση (π.χ. πελάτης)" aria-label="Αναζήτηση"></div><div id="hisl"></div>';
      const box = el.querySelector('#hisl');
      const paint = () => {
        if (err) { box.innerHTML = `<p class="warn">${esc(err)}</p><button id="hisretry">Ξαναδοκίμασε</button>`; return; }
        if (!L) { box.innerHTML = '<p class="mu">Φορτώνω…</p>'; return; }
        const q = fold(st.q), R = L.filter((r) => (!st.user || r.user === st.user) && (!q || fold(r.what + ' ' + r.who + ' ' + r.byName).includes(q)));
        if (!R.length) { box.innerHTML = `<p class="mu">${L.length ? 'Καμία αλλαγή με αυτά τα φίλτρα.' : 'Καμία αλλαγή ακόμα.'}</p>`; return; }
        let day = '';
        box.innerHTML = '<section class="tmcard">' + R.slice(0, 200).map((r) => {
          const d = new Date(r.at).toLocaleDateString('el-GR', { weekday: 'long', day: 'numeric', month: 'long' }), h = d !== day ? `<h4 class="hisd">${esc(d)}</h4>` : ''; day = d;
          return h + `<div class="hisr"><span class="hist">${esc(when(r.at).split(' ')[1])}</span><span class="hism"><b>${esc(r.what)}</b><small>${esc(r.who)}${r.byName !== r.who ? ' · από ' + esc(r.byName) : ''}</small></span>` +
            `<span class="hiso ${OP[r.op][1]}">${OP[r.op][0]}</span></div>`;
        }).join('') + (R.length > 200 ? `<p class="mu">…και ${R.length - 200} ακόμα. Στένεψε με τα φίλτρα.</p>` : '') + '</section>';
      };
      const load = () => { err = ''; L = null; paint();
        O.history.list().then((x) => {
          L = x.map((r) => Object.assign(r, { what: what(r) }));
          const us = [...new Map(L.map((r) => [r.user, r.who])).entries()].filter(([k]) => k).sort((a, b) => a[1].localeCompare(b[1], 'el'));
          el.querySelector('#hisu').innerHTML = '<option value="">Όλοι οι χρήστες</option>' + us.map(([k, n]) => `<option value="${esc(k)}">${esc(n)}</option>`).join('');
          el.querySelector('#hisu').value = st.user; paint();
        }, (e) => { err = e.message || 'Δεν φόρτωσε το ιστορικό.'; paint(); }); };
      el.addEventListener('change', (ev) => { if (ev.target.id === 'hisu') { st.user = ev.target.value; paint(); } });
      el.addEventListener('input', (ev) => { if (ev.target.id === 'hisq') { st.q = ev.target.value; paint(); } });
      el.addEventListener('click', (ev) => { if (ev.target.closest('#hisretry')) load(); });
      load();
    },
  });
})();

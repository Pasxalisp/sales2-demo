/* «Σφάλματα» (απόφαση 18/11/2026, Β11): ό,τι «έσκασε» στις συσκευές των χρηστών, για τον διαχειριστή.
   Τα γράφει η ίδια η εφαρμογή στη βάση (lab/supa/session.js, πίνακας app_errors) και τα δίνει το PL.adapter.org.errors.
   Μόνο στην έκδοση με βάση (db.html): στο απλό demo δεν υπάρχει πού να γραφτούν, και η σελίδα το λέει.
   Ίδιο σφάλμα (μήνυμα + αρχείο + γραμμή) σε μία γραμμή: πόσες φορές, σε πόσους χρήστες, πότε τελευταία· πάτημα → αναλυτικά.
   Εμφάνιση: lab/errors/errors.css, πάνω στα κουτιά της ομάδας (team.css: .tmcard, .tmhead). */
(function () {
  const PL = window.PL, O = PL.adapter.org, me = O && O.me;
  if (!me) return;
  const u = PL.u, esc = u.esc, DAY = 864e5;
  const when = (t) => { const d = new Date(t); return d.toLocaleDateString('el-GR', { day: 'numeric', month: 'numeric' }) + ' ' + u.pad(d.getHours()) + ':' + u.pad(d.getMinutes()); };
  const ago = (t) => { const m = Math.round((Date.now() - new Date(t)) / 60000); return m < 1 ? 'μόλις τώρα' : m < 60 ? 'πριν ' + m + '′' : m < 1440 ? 'πριν ' + Math.round(m / 60) + ' ώ.' : 'πριν ' + Math.round(m / 1440) + ' μ.'; };
  /* συσκευή με λίγες λέξεις, από το userAgent */
  const dev = (ua) => (/iPhone/.test(ua) ? 'iPhone' : /iPad|Macintosh.*Mobile/.test(ua) ? 'iPad' : /Android/.test(ua) ? 'Android' : /Mac/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : 'άλλη συσκευή');
  const pageName = (id) => (PL.pages[id] && PL.pages[id].title) || id || '—';
  /* ίδιο σφάλμα = ίδιο μήνυμα, αρχείο, γραμμή */
  function groups(L) {
    const m = new Map();
    L.forEach((r) => { const k = r.msg + '|' + r.src + '|' + (r.line || ''); const g = m.get(k) || { k, msg: r.msg, src: r.src, line: r.line, list: [] }; g.list.push(r); m.set(k, g); });
    return [...m.values()].sort((a, b) => (a.list[0].at < b.list[0].at ? 1 : -1));
  }

  PL.register('errors', {
    title: 'Σφάλματα',
    render(el) {
      el.classList.add('tmpage');
      if (!me.admin) { el.innerHTML = '<h2>Χωρίς πρόσβαση</h2><p class="mu">Τα σφάλματα τα βλέπει μόνο ο διαχειριστής.</p>'; return; }
      if (!O.errors) { el.innerHTML = '<div class="tmhead"><h2>Σφάλματα</h2></div><p class="mu">Τα σφάλματα των συσκευών καταγράφονται στην έκδοση με βάση (db.html).</p>'; return; }
      let L = null, err = '', open = '';
      const paint = () => {
        if (!el.isConnected) return;
        const head = '<div class="tmhead"><h2>Σφάλματα</h2><p class="mu">Ό,τι «έσκασε» στις συσκευές των χρηστών · τελευταίες 90 μέρες</p></div>';
        if (err) { el.innerHTML = head + `<p class="warn">${esc(err)}</p><button id="erretry">Ξαναδοκίμασε</button>`; return; }
        if (!L) { el.innerHTML = head + '<p class="mu">Φορτώνω…</p>'; return; }
        const w7 = L.filter((r) => Date.now() - new Date(r.at) < 7 * DAY), G = groups(L);
        const kpi = `<div class="uskpi"><div><span>Τελευταίες 7 μέρες</span><b>${w7.length}</b><small>σε ${new Set(w7.map((r) => r.uid)).size} χρήστες</small></div>` +
          `<div><span>Διαφορετικά σφάλματα</span><b>${G.length}</b><small>συνολικά ${L.length}</small></div>` +
          `<div><span>Τελευταίο</span><b>${L.length ? esc(ago(L[0].at)) : '—'}</b><small>${L.length ? esc(L[0].who) : ''}</small></div></div>`;
        if (!L.length) { el.innerHTML = head + '<p class="errok">👍 Κανένα σφάλμα. Η εφαρμογή δουλεύει χωρίς προβλήματα σε όλες τις συσκευές.</p>'; return; }
        el.innerHTML = head + kpi + '<section class="tmcard"><h3>Ανά σφάλμα · το πιο πρόσφατο πρώτο</h3>' + G.map((g) => {
          const users = new Set(g.list.map((r) => r.who)), last = g.list[0];
          return `<button class="errg${open === g.k ? ' on' : ''}" data-err="${esc(g.k)}"><span class="errm"><b>${esc(g.msg)}</b>` +
            `<small>${esc(pageName(last.page))}${g.src ? ' · ' + esc(g.src.split('/').pop()) + (g.line ? ':' + g.line : '') : ''}</small></span>` +
            `<span class="errn"><b>${g.list.length}×</b><small>${users.size === 1 ? esc([...users][0]) : users.size + ' χρήστες'} · ${esc(ago(last.at))}</small></span></button>` +
            (open === g.k ? '<div class="errd">' + g.list.slice(0, 30).map((r) => `<div class="shr"><span>${esc(when(r.at))} · <b>${esc(r.who)}</b><div class="mu">${esc(pageName(r.page))} · ${esc(dev(r.ua))}${r.ver ? ' · έκδοση ' + esc(r.ver) : ''}</div></span></div>`).join('') +
              (g.src ? `<p class="mu errsrc">${esc(g.src)}${g.line ? ', γραμμή ' + g.line : ''}</p>` : '') + '</div>' : '');
        }).join('') + '</section>';
      };
      const load = () => { err = ''; L = null; paint(); O.errors.list().then((x) => { L = x; paint(); }, (e) => { err = e.message || 'Δεν φόρτωσαν τα σφάλματα.'; paint(); }); };
      el.addEventListener('click', (ev) => {
        if (ev.target.closest('#erretry')) { load(); return; }
        const g = ev.target.closest('[data-err]'); if (g) { open = open === g.dataset.err ? '' : g.dataset.err; paint(); }
      });
      load();
    },
  });
})();

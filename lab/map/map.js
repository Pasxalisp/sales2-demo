/* ΔΟΚΙΜΑΣΤΙΚΟ: «Χάρτης» (φάκελος lab/ — μπαίνει ΜΟΝΟ στη δοκιμαστική έκδοση από το demo/build_site.mjs, όχι στο Sales 2.0).
   Χωριστό από τον υπόλοιπο κώδικα: διαβάζει μόνο (πελάτες, υπόλοιπα, SOS, συμφωνίες, προγράμματα, επισκέψεις) και δεν γράφει τίποτα.
   Χάρτης Leaflet (lab/map/leaflet/, μαζί με τη σελίδα) + δρόμοι από OpenStreetMap (εναλλακτικά Esri), χωρίς κλειδί· φορτώνει μόνο όταν ανοίξει η σελίδα.
   Θέσεις πελατών: από τη συλλογή geo/{id} = {lat, lng, cat} (εκεί θα μπουν οι πινέζες του Google My Maps από KML)·
   όσοι δεν έχουν, μπαίνουν κατά προσέγγιση στο κέντρο της περιοχής/πόλης τους (πίνακας CENTRES), με μικρή διασπορά. */
(function () {
  const PL = window.PL, u = PL.u, M = PL.model, S = PL.store, E = PL.plans, esc = u.esc, money = u.money;
  const COLS = ['clients', 'prospects', 'balances', 'sos', 'deals', 'plans', 'visits', 'notes', 'geo'];
  const LEAFLET = 'lab/map/leaflet/';   /* Leaflet 1.9.4 μαζί με τη σελίδα (όχι από CDN) */

  /* κέντρα πόλεων / περιοχών (κατά προσέγγιση) */
  const CENTRES = {
    'ΘΕΣΣΑΛΟΝΙΚΗ': [40.6403, 22.9439], 'ΘΕΣΣΑΛΟΝΙΚΗ/ΚΕΝΤΡΟ': [40.6335, 22.9450], 'ΘΕΣΣΑΛΟΝΙΚΗ/ΕΥΟΣΜΟΣ': [40.6690, 22.9080], 'ΘΕΣΣΑΛΟΝΙΚΗ/ΣΤΑΥΡΟΥΠΟΛΗ': [40.6690, 22.9340],
    'ΘΕΣΣΑΛΟΝΙΚΗ/ΑΜΠΕΛΟΚΗΠΟΙ': [40.6510, 22.9220], 'ΘΕΣΣΑΛΟΝΙΚΗ/ΗΛΙΟΥΠΟΛΗ': [40.6720, 22.9200], 'ΘΕΣΣΑΛΟΝΙΚΗ/ΠΟΛΙΧΝΗ': [40.6640, 22.9500], 'ΘΕΣΣΑΛΟΝΙΚΗ/ΚΟΡΔΕΛΙΟ': [40.6720, 22.8890],
    'ΘΕΣΣΑΛΟΝΙΚΗ/ΝΕΑΠΟΛΗ': [40.6540, 22.9420], 'ΘΕΣΣΑΛΟΝΙΚΗ/ΦΑΛΗΡΟ': [40.6000, 22.9570], 'ΘΕΣΣΑΛΟΝΙΚΗ/ΚΟΥΦΑΛΙΑ': [40.7800, 22.5760], 'ΘΕΣΣΑΛΟΝΙΚΗ/ΝΕΑ ΕΥΚΑΡΠΙΑ': [40.6860, 22.9300],
    'ΘΕΣΣΑΛΟΝΙΚΗ/ΕΥΑΓΓΕΛΙΣΤΡΙΑ': [40.6370, 22.9580], 'ΘΕΣΣΑΛΟΝΙΚΗ/ΚΑΛΑΜΑΡΙΑ': [40.5820, 22.9500], 'ΘΕΣΣΑΛΟΝΙΚΗ/ΠΥΛΑΙΑ': [40.6000, 22.9850],
    'ΞΑΝΘΗ': [41.1349, 24.8880], 'ΣΕΡΡΕΣ': [41.0856, 23.5476], 'ΚΟΜΟΤΗΝΗ': [41.1224, 25.4066], 'ΑΛΕΞ/ΠΟΛΗ': [40.8500, 25.8744], 'ΔΡΑΜΑ': [41.1500, 24.1467],
    'ΧΙΟΣ': [38.3700, 26.1340], 'ΚΑΒΑΛΑ': [40.9396, 24.4069], 'ΟΡΕΣΤΙΑΔΑ': [41.5030, 26.5310], 'ΜΥΤΙΛΗΝΗ': [39.1077, 26.5530], 'ΔΙΔΥΜΟΤΕΙΧΟ': [41.3490, 26.4960],
    'ΚΙΛΚΙΣ': [40.9930, 22.8750], 'ΗΡΑΚΛΕΙΟ': [35.3387, 25.1442], 'ΠΡΟΣΟΤΣΑΝΗ': [41.1760, 24.0110], 'ΣΙΔΗΡΟΚΑΣΤΡΟ': [41.2360, 23.3910], 'ΘΑΣΟΣ': [40.7790, 24.7090],
    'ΣΟΥΦΛΙ': [41.2010, 26.2980], 'ΣΑΠΕΣ': [41.0270, 25.6990], 'ΕΧΙΝΟΣ': [41.2780, 24.9690], 'ΦΕΡΡΕΣ': [40.8950, 26.1720], 'ΠΟΛΥΚΑΣΤΡΟ': [40.9990, 22.5730],
    'ΧΑΛΑΣΤΡΑ': [40.6270, 22.7320], 'ΣΙΝΔΟΣ': [40.6700, 22.8030], 'ΤΥΧΕΡΟ': [41.0280, 26.2930], 'ΠΕΠΛΟΣ': [40.9580, 26.2430], 'ΧΑΛΚΗΔΟΝΑ': [40.7330, 22.6070],
    'ΦΙΛΙΠΠΟΙ': [41.0130, 24.2860], 'ΕΛΑΣΣΟΝΑ': [39.8940, 22.1880], 'ΚΑΤΕΡΙΝΗ': [40.2690, 22.5020], 'ΞΗΡΟΠΟΤΑΜΟΣ': [41.1300, 24.1700], 'ΚΑΛΟΧΩΡΙ': [40.6420, 22.8500],
    'ΣΤΑΥΡΟΣ': [40.6640, 23.6950], 'ΚΑΒΑΛΑ/ΧΡΥΣΟΥΠΟΛΗ': [40.9830, 24.7010], 'ΝΕΑ ΜΑΔΥΤΟΣ': [40.6430, 23.6140], 'ΚΑΛΑΜΠΑΚΙ': [41.0550, 24.1890], 'ΣΜΙΝΘΗ': [41.2240, 24.8500],
    'ΛΑΓΚΑΔΑ': [40.7500, 23.0700], 'ΑΣΠΡΟΒΑΛΤΑ': [40.7240, 23.7100], 'ΣΑΜΟΘΡΑΚΗ': [40.4760, 25.5200], 'ΚΟΥΦΑΛΙΑ': [40.7800, 22.5760], 'ΜΕΣΗΜΒΡΙΑ': [40.7700, 22.4000],
    'ΚΙΛΚΙΣ/ΠΟΛΥΚΑΣΤΡΟ': [40.9990, 22.5730], 'ΔΡΑΜΑ/ΑΓ.ΑΘΑΝΑΣΙΟΣ': [41.0700, 24.2400],
  };
  const hash = (s) => [...String(s)].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7);
  /* θέση πελάτη: [lat, lng, ακριβής;] ή null */
  function pos(c) {
    const g = S.get('geo', c.i); if (g && g.lat) return [+g.lat, +g.lng, true];
    const a = (c.area || '').trim(), k = a && a !== c.city ? c.city + '/' + a : c.city, b = CENTRES[k] || CENTRES[c.city] || CENTRES[a];
    if (!b) return null;
    const h = hash(c.i), r = c.city === 'ΘΕΣΣΑΛΟΝΙΚΗ' ? 0.006 : 0.008, an = (h % 360) * Math.PI / 180, d = r * Math.sqrt(((h >>> 9) % 1000) / 1000);
    return [b[0] + d * Math.sin(an), b[1] + d * Math.cos(an) * 1.3, false];
  }

  /* κατάσταση πελάτη → χρώμα (η σειρά είναι και προτεραιότητα) */
  const m60 = () => new Date(Date.parse(u.today()) - 60 * 864e5).toISOString().slice(0, 10);
  const owes = (id) => +((S.get('balances', id) || {}).amount || 0) >= 1;
  const behind = (id) => { const d = (S.get('deals', 'all') || {})[id]; if (!d) return false; const i = M.deal(d); return !i.done && i.ahead < 0; };
  const KINDS = [
    ['sos', '⭐ SOS', '#e0a100', (c) => !!S.get('sos', c.i)],
    ['owe', 'Χρωστάνε', '#c8463c', (c) => owes(c.i)],
    ['deal', 'Συμφωνία πίσω', '#7a3fb8', (c) => behind(c.i)],
    ['tz', 'Με τζίρο', '#2f8a63', (c) => M.tz(c) > 0],
    ['zero', 'Χωρίς τζίρο', '#8c968f', () => true],
  ];
  const kindOf = (c) => KINDS.find((k) => k[3](c));
  const FILTERS = { all: ['Όλοι', () => true], tz: ['Με τζίρο', (c) => M.tz(c) > 0], owe: ['Χρωστάνε', (c) => owes(c.i)], sos: ['SOS', (c) => !!S.get('sos', c.i)],
    old: ['60+ μέρες χωρίς επίσκεψη', (c) => { const v = E.lastVisit(c.i); return M.tz(c) > 0 && (!v || v < m60()); }], deal: ['Συμφωνία πίσω', (c) => behind(c.i)] };
  const st = { f: 'all', mode: 'all', city: '' };   // mode: all | plan | near

  let lib = null;
  const loadLeaflet = () => lib || (lib = new Promise((ok, no) => {
    if (window.L) { ok(window.L); return; }
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = LEAFLET + 'leaflet.css'; document.head.appendChild(l);
    const s = document.createElement('script'); s.src = LEAFLET + 'leaflet.js'; s.onload = () => ok(window.L); s.onerror = () => { lib = null; no(new Error('Δεν φόρτωσε ο χάρτης (σύνδεση;)')); }; document.head.appendChild(s);
  }));
  const gmapsDir = (pts) => 'https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=' + pts[pts.length - 1].join(',') + (pts.length > 1 ? '&waypoints=' + encodeURIComponent(pts.slice(0, -1).map((p) => p.join(',')).join('|')) : '');
  const km = (a, b) => { const R = 6371, t = Math.PI / 180, dl = (b[0] - a[0]) * t, dn = (b[1] - a[1]) * t, x = Math.sin(dl / 2) ** 2 + Math.cos(a[0] * t) * Math.cos(b[0] * t) * Math.sin(dn / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); };

  PL.register('labmap', {
    title: 'Χάρτης (δοκιμαστικό)',
    render(el) {
      el.classList.add('lmap');
      el.innerHTML = '<div class="lmh"><h2>🗺 Χάρτης <span class="lmb">δοκιμαστικό</span></h2><select id="lmcity" aria-label="Πόλη"></select></div>' +
        '<div class="chips lmm" id="lmmode"><button class="chip" data-lmm="all">Όλοι οι πελάτες</button><button class="chip" data-lmm="plan">📋 Το πρόγραμμά μου</button><button class="chip" data-lmm="near">📍 Κοντά μου</button></div>' +
        '<div class="chips lmf" id="lmf"></div><div class="lmw"><div id="lmap"><p class="mu" style="padding:16px">Φορτώνω τον χάρτη…</p></div><div class="lmside" id="lmside"></div></div><div class="lmleg" id="lmleg"></div>';
      const $ = (s) => el.querySelector(s);
      COLS.forEach((c) => S.use(c));
      let map = null, layer = null, here = null, alive = true;
      $('#lmleg').innerHTML = KINDS.map((k) => `<span><i style="background:${k[2]}"></i>${k[1]}</span>`).join('') + '<span><i class="lmx"></i>θέση κατά προσέγγιση</span>';

      const items = () => M.clients().map((c) => ({ c, p: pos(c) })).filter((x) => x.p);
      const popup = (c, p, n) => { const g = M.gold(c), v = E.lastVisit(c.i), b = +((S.get('balances', c.i) || {}).amount || 0), h = PL.call.mapUrl(c);
        return `<div class="lmpop"><b>${n ? n + '. ' : ''}${esc(c.name)}</b><div class="mu">${esc(c.addr || '')}${c.addr ? ', ' : ''}${esc(c.city)}</div>` +
          `<div>${g ? 'Goldwell φέτος ' + money(g[1]) : 'Χωρίς τζίρο'}${b >= 1 ? ` · <span class="dn">χρωστάει ${money(b)}</span>` : ''}</div><div class="mu">${v ? 'Τελευταία επίσκεψη ' + esc(u.fd(v)) : 'Καμία επίσκεψη'}${p[2] ? '' : ' · θέση κατά προσέγγιση'}</div>` +
          `<div class="lmpb"><button data-lmo="${esc(c.i)}">Καρτέλα</button>${h ? `<a class="btn" href="${esc(h)}" target="_blank" rel="noopener">Οδηγίες</a>` : ''}</div></div>`; };
      const dot = (L, x, n) => { const k = kindOf(x.c);
        if (n) return L.marker([x.p[0], x.p[1]], { icon: L.divIcon({ className: 'lmn', html: `<span style="background:${k[2]}">${n}</span>`, iconSize: [28, 28], iconAnchor: [14, 14] }) });
        return L.circleMarker([x.p[0], x.p[1]], { radius: x.c.i && S.get('sos', x.c.i) ? 9 : 7, color: x.p[2] ? '#fff' : k[2], weight: x.p[2] ? 2 : 1.5, dashArray: x.p[2] ? null : '2 2', fillColor: k[2], fillOpacity: 0.9 }); };

      function paint() {
        if (!alive) return;
        /* επιλογές: φαίνονται και πριν φορτώσει ο χάρτης */
        el.querySelectorAll('[data-lmm]').forEach((b) => b.classList.toggle('on', b.dataset.lmm === st.mode));
        $('#lmf').style.display = st.mode === 'all' ? '' : 'none';
        $('#lmf').innerHTML = Object.entries(FILTERS).map(([k, [l]]) => `<button class="chip${st.f === k ? ' on' : ''}" data-lmf="${k}">${l}</button>`).join('');
        const all = items(), cities = [...new Set(all.map((x) => x.c.city))].sort((a, b) => a.localeCompare(b, 'el'));
        $('#lmcity').innerHTML = '<option value="">Όλες οι περιοχές</option>' + cities.map((c) => `<option${c === st.city ? ' selected' : ''}>${esc(c)}</option>`).join('');
        if (!map) return;
        const L = window.L;
        if (layer) layer.remove(); layer = L.layerGroup().addTo(map);
        let pts = [], side = '';
        if (st.mode === 'plan') {
          const act = E.activeList().find(([, p]) => p.mode !== 'free');
          if (!act) side = '<p class="mu">Δεν υπάρχει ανοιχτό πρόγραμμα.</p>';
          else {
            const [pid, p] = act, stops = (p.stops || []).map((s) => ({ s, c: M.byId(s.id) })).filter((x) => x.c).map((x) => Object.assign(x, { p: pos(x.c) })).filter((x) => x.p);
            const open = stops.filter((x) => !x.s.done);
            stops.forEach((x, k) => { const m = dot(L, x, k + 1).bindPopup(popup(x.c, x.p, k + 1)).addTo(layer); if (x.s.done) m.setOpacity(0.45); });
            if (stops.length > 1) L.polyline(stops.map((x) => [x.p[0], x.p[1]]), { color: '#2f6f5e', weight: 3, opacity: 0.7, dashArray: '6 6' }).addTo(layer);
            pts = stops.map((x) => [x.p[0], x.p[1]]);
            const route = open.map((x) => [x.p[0], x.p[1]]), parts = []; for (let i = 0; i < route.length; i += 10) parts.push(route.slice(i, i + 10));
            side = `<h3>${esc((p.cities || []).join(' + '))}</h3><div class="mu">${stops.filter((x) => x.s.done).length}/${stops.length} έγιναν</div>` +
              parts.map((r, i) => `<a class="btn lmgo" href="${esc(gmapsDir(r))}" target="_blank" rel="noopener">🚗 Διαδρομή στο Google Maps${parts.length > 1 ? ' (' + (i + 1) + '/' + parts.length + ')' : ''}</a>`).join('') +
              '<ol class="lmol">' + stops.map((x, k) => `<li class="${x.s.done ? 'dn0' : ''}" data-lmz="${k}">${x.s.done ? '✓ ' : ''}${esc(x.c.name)}<span class="mu"> · ${esc(x.c.area || x.c.city)}</span></li>`).join('') + '</ol>';
            layer._stops = stops;
          }
        } else if (st.mode === 'near') {
          if (!here) side = '<p class="mu">Ψάχνω πού είσαι… (η συσκευή θα ζητήσει άδεια για την τοποθεσία)</p>';
          else {
            const near = all.map((x) => Object.assign(x, { d: km(here, x.p) })).sort((a, b) => a.d - b.d).slice(0, 12);
            near.forEach((x) => dot(L, x).bindPopup(popup(x.c, x.p)).addTo(layer));
            L.circleMarker(here, { radius: 9, color: '#fff', weight: 3, fillColor: '#2a7be4', fillOpacity: 1 }).addTo(layer).bindPopup('Εδώ είσαι');
            pts = near.map((x) => [x.p[0], x.p[1]]).concat([here]);
            side = '<h3>Οι 12 πιο κοντινοί</h3><ol class="lmol">' + near.map((x, k) => `<li data-lmn="${k}">${esc(x.c.name)}<span class="mu"> · ${x.d < 1 ? Math.round(x.d * 1000) + ' μ.' : x.d.toFixed(1) + ' χλμ.'}</span></li>`).join('') + '</ol>';
            layer._near = near;
          }
        } else {
          const F = FILTERS[st.f][1], L2 = all.filter((x) => F(x.c) && (!st.city || x.c.city === st.city));
          L2.forEach((x) => dot(L, x).bindPopup(popup(x.c, x.p)).addTo(layer));
          pts = L2.map((x) => [x.p[0], x.p[1]]);
          const by = {}; L2.forEach((x) => { const k = kindOf(x.c)[1]; by[k] = (by[k] || 0) + 1; });
          side = `<h3>${L2.length} πελάτες</h3>` + KINDS.filter((k) => by[k[1]]).map((k) => `<div class="shr"><span><i class="lmdot" style="background:${k[2]}"></i>${k[1]}</span><b>${by[k[1]]}</b></div>`).join('') +
            `<p class="mu" style="font-size:12.5px">${all.filter((x) => x.p[2]).length} με ακριβή θέση · οι υπόλοιποι κατά προσέγγιση από την περιοχή τους. Με τις πινέζες σου από το Google γίνονται όλοι ακριβείς.</p>`;
        }
        $('#lmside').innerHTML = side;
        if (pts.length) map.fitBounds(pts, { padding: [30, 30], maxZoom: 15 });
      }

      loadLeaflet().then((L) => {
        if (!alive) return;
        $('#lmap').innerHTML = '';
        map = L.map($('#lmap'), { zoomControl: true, attributionControl: true }).setView([40.9, 24.3], 7);
        /* δρόμοι: OpenStreetMap (χωρίς κλειδί)· αν δεν φορτώνουν, Esri (επίσης χωρίς κλειδί) */
        let bad = 0;
        const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
        osm.on('tileerror', () => { if (++bad === 4) { osm.remove(); L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: '© Esri · © OpenStreetMap' }).addTo(map); } });
        paint(); setTimeout(() => map && map.invalidateSize(), 200);
      }).catch((e) => { $('#lmap').innerHTML = '<p class="mu" style="padding:16px">' + esc(e.message) + '</p>'; });

      paint();
      const offs = COLS.map((c) => S.on(c, paint));
      const ro = new ResizeObserver(() => map && map.invalidateSize()); ro.observe(el);
      el.addEventListener('change', (ev) => { if (ev.target.id === 'lmcity') { st.city = ev.target.value; st.mode = 'all'; paint(); } });
      el.addEventListener('click', (ev) => {
        const t = ev.target, b = t.closest('[data-lmm],[data-lmf],[data-lmo],[data-lmz],[data-lmn]'); if (!b) return;
        if (b.dataset.lmo) PL.nav.push('client', { id: b.dataset.lmo });
        else if (b.dataset.lmf) { st.f = b.dataset.lmf; paint(); }
        else if (b.dataset.lmz != null && layer && layer._stops) { const x = layer._stops[+b.dataset.lmz]; map.setView([x.p[0], x.p[1]], 16); }
        else if (b.dataset.lmn != null && layer && layer._near) { const x = layer._near[+b.dataset.lmn]; map.setView([x.p[0], x.p[1]], 16); }
        else if (b.dataset.lmm) {
          st.mode = b.dataset.lmm; paint();
          if (st.mode === 'near' && !here) navigator.geolocation.getCurrentPosition((g) => { here = [g.coords.latitude, g.coords.longitude]; paint(); },
            () => { $('#lmside').innerHTML = '<p class="mu">Δεν δόθηκε η τοποθεσία. Επίτρεψέ την στις ρυθμίσεις του browser για αυτή τη σελίδα.</p>'; }, { enableHighAccuracy: true, timeout: 15000 });
        }
      });
      return () => { alive = false; offs.forEach((f) => f()); ro.disconnect(); if (map) map.remove(); };
    },
  });

  (PL.labs = PL.labs || []).push({ page: 'labmap', label: 'Χάρτης', sub: 'δοκιμαστικό',
    icon: '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="var(--ac)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/></svg>' });
})();

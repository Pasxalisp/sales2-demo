/* Μία πρόχειρη παραγγελία: στοιχεία, είδη (αναζήτηση / «πες τα»), δώρα σε ξεχωριστή παραγγελία, σύνολα, αντιγραφή, διαγραφή.
   Αυτόματη αποθήκευση. Ποτέ αποστολή, ποτέ εκπτώσεις. */
(function () {
  const PL = window.PL, u = PL.u, M = PL.model, S = PL.store, esc = u.esc, money = u.money, db = () => PL.adapter.db, O = () => PL.orders;
  const SAL = ['ΕΛΕΥΘΕΡΑ', 'ΓΕΝΙΚΟΙ ΟΡΟΙ', 'ΣΥΜΦΩΝΙΑ'], PAY = ['ΠΙΣΤΩΣΗ 5 ΗΜΕΡΩΝ', 'ΠΙΣΤΩΣΗ 45 ΗΜΕΡΩΝ', 'ΠΙΣΤΩΣΗ (ΠΛΗΡΩΜΗ ΜΕ ΤΗΝ ΠΑΡΑΛΑΒΗ)', 'ΠΙΣΤΩΣΗ (ΠΡΟΕΙΣΠΡΑΞΗ ΜΕΤΡΗΤΩΝ)', 'ΜΕΤΡΗΤΟΙΣ', 'ΑΝΤΙΚΑΤΑΒΟΛΗ'];
  const opts = (L, v) => L.map((x) => `<option ${x === v ? 'selected' : ''}>${esc(x)}</option>`).join('');

  PL.register('order', {
    title: 'Παραγγελία',
    render(el, params) {
      const id = params.id; let cur = null, tab = 'S', delArm = false, svT = null, dirty = false, gone = false;
      ['orders', 'clients', 'prospects', 'ocat', 'items'].forEach((c) => S.use(c));
      el.innerHTML = `<div class="page-head"><h1>Παραγγελία</h1><span class="sub" id="osv"></span></div><div id="ohd"></div>
        <h3>Προσθήκη ειδών</h3><div class="chips"><button class="chip on" data-t="S">🔎 Αναζήτηση</button><button class="chip" data-t="T">🎙 Πες τα / γράψ' τα</button></div>
        <div id="opS"><div class="two"><select id="ogrp"></select><select id="osub"></select></div><input id="oq" placeholder="π.χ. βαφή 7n, ρεφλέ 9v, οξυζενέ 6%, κωδικός" autocomplete="off"><div id="och" class="chips"></div><div id="orr"></div></div>
        <div id="opT" hidden><textarea id="ot" rows="4" placeholder="π.χ. βαφή 7N 3, 6N 2, ντεκαπάζ strong 1, οξυζενέ 6% λίτρο 2, και δώρο μια ποδιά"></textarea><button class="btn" id="ogo">✨ Πρόσθεσε στην παραγγελία</button><div class="mu f pre" id="ogs"></div></div>
        <div id="oln"></div><div class="info" id="otot"></div>
        <div class="btnrow"><button class="btn" id="ocopy">📋 Αντιγραφή παραγγελίας</button><button class="small dn" id="odel">🗑 Διαγραφή</button></div>`;
      const $ = (s) => el.querySelector(s);
      const save = (now) => { if (!cur) return; clearTimeout(svT); const go = async () => { dirty = false; try { await db().set('orders/' + id, cur); S.put('orders', id, JSON.parse(JSON.stringify(cur))); $('#osv').textContent = '✓ Αποθηκεύτηκε'; } catch (e) { $('#osv').textContent = '⚠️ Δεν αποθηκεύτηκε'; } }; dirty = true; $('#osv').textContent = '…'; if (now) return go(); svT = setTimeout(go, 600); };
      const paintHead = () => { const c = M.byId(cur.cid);
        $('#ohd').innerHTML = `<div class="card"><b>${PL.prospects.tag(c)}${c ? esc(c.code || '') + ' | ' + esc(c.name) : esc(cur.name || '—')}</b><div class="mu f">${esc(c ? c.city || '' : '')}</div>${c && !c.code ? '<div class="warn">⚠️ Ο πελάτης δεν έχει κωδικό συστήματος (προσωρινός).</div>' : ''}
          <div class="two"><label class="mu">Ημερ/νία<input type="date" id="od" value="${esc(cur.date || u.today())}"></label><label class="mu">Είδος<select id="os">${opts(SAL, cur.sal)}</select></label></div>
          <label class="mu">Τρ. πληρωμής<select id="op">${opts(PAY, cur.pay)}</select></label><label class="mu">Καμπάνια<input id="ocamp" value="${esc(cur.camp || '')}"></label><label class="mu">Παρατηρήσεις<textarea id="on" rows="2">${esc(cur.note || '')}</textarea></label></div>`; };
      const fillK = () => { const L = O().items(), ks = [...new Set(L.map((x) => x[2]))]; $('#ogrp').innerHTML = '<option value="">Όλες οι κατηγορίες</option>' + ks.map((k) => `<option>${esc(k)}</option>`).join(''); fillY(); };
      const fillY = () => { const K = $('#ogrp').value, ys = [...new Set(O().items().filter((x) => !K || x[2] === K).map((x) => x[3]))]; $('#osub').innerHTML = '<option value="">Όλες οι υποομάδες</option>' + ys.map((k) => `<option>${esc(k)}</option>`).join(''); };
      const row = ([l, i]) => `<div class="card ln${l.np ? ' np' : ''}" data-i="${i}"><div class="row"><div><div class="nm">${esc(l.n)}</div><div class="mu f">${esc(l.c)} · ${esc(l.g || '')} · ${money(+l.p || 0)}</div></div><button class="small dn" data-ox="${i}" aria-label="Αφαίρεση">✕</button></div>
        <div class="two"><div class="stp"><button class="small" data-om="${i}">−</button><input inputmode="numeric" data-oq="${i}" value="${+l.q || 0}" aria-label="Ποσότητα"><button class="small" data-op="${i}">+</button></div><label class="mu">Δώρα<input class="sm" inputmode="numeric" data-og="${i}" value="${+l.gf || 0}"></label></div>
        <div class="mu f">Αξία: <b>${money(Math.round((+l.q || 0) * (+l.p || 0) * 100) / 100)}</b></div><button class="small" data-ov="${i}">${l.np ? '↑ Μετακίνηση στα προϊόντα' : '↓ Μετακίνηση στα δώρα / εξοπλισμό'}</button></div>`;
      const paintLines = () => { const P = cur.lines.map((l, i) => [l, i]).filter((a) => !a[0].np), G = cur.lines.map((l, i) => [l, i]).filter((a) => a[0].np), sp = O().sums(P.map((a) => a[0])), sg = O().sums(G.map((a) => a[0]));
        $('#oln').innerHTML = `<h3>📦 Παραγγελία προϊόντων <span class="mu f">${P.length} είδη</span></h3>` + (P.length ? P.map(row).join('') : '<p class="mu">Δεν υπάρχουν είδη ακόμα.</p>') + (G.length ? `<h3>🎁 Δώρα / εξοπλισμός</h3><p class="mu f">Πάει σε ξεχωριστή παραγγελία</p>` + G.map(row).join('') : '');
        $('#otot').innerHTML = `<div class="row"><span>Ποσότητα / Δώρα</span><b>${sp.q} / ${sp.g}</b></div><div class="row"><span>Καθαρή αξία</span><b>${money(sp.n)}</b></div><div class="row"><span>ΦΠΑ 24%</span><span>${money(sp.v)}</span></div><div class="row"><span>Σύνολο (τιμές καταλόγου)</span><b>${money(sp.t)}</b></div>` + (G.length ? `<div class="row"><span>🎁 2η παραγγελία: ${G.length} είδη, ${sg.q} τεμ.</span><span>${money(sg.n)}</span></div>` : '');
        $('#odel').textContent = delArm ? 'Σίγουρα; Πάτα ξανά' : '🗑 Διαγραφή'; };
      const paintRes = () => { const q = $('#oq').value, K = $('#ogrp').value, Y = $('#osub').value, inS = new Set(cur.lines.map((l) => l.c));
        if (!q && !K && !Y) { const U = O().usual(cur.cid); $('#och').innerHTML = U.length ? '<span class="mu f">Παίρνει συνήθως:</span>' + U.map((x) => `<button class="chip${inS.has(x[0]) ? ' on' : ''}" data-oa="${esc(x[0])}">${inS.has(x[0]) ? '✓ ' : '+ '}${esc(x[1])}</button>`).join('') : ''; $('#orr').innerHTML = ''; return; }
        const L = O().search(q, K, Y, q ? 40 : 150); $('#och').innerHTML = '';
        $('#orr').innerHTML = L.length ? L.map((x) => `<div class="card r${inS.has(x[0]) ? ' in' : ''}"><div class="row"><div><div class="nm">${esc(x[1])}${x[5] ? ' 🎁' : ''}</div><div class="mu f">${esc(x[0])} · ${esc(x[3])} · ${money(x[4])}</div></div><button class="small" data-oa="${esc(x[0])}">${inS.has(x[0]) ? '+1' : '+'}</button></div></div>`).join('') : '<p class="mu">Δεν βρέθηκε είδος.</p>'; };
      const add = (code, q, gf) => { const x = O().byCode(code); if (!x) return false; const l = cur.lines.find((z) => z.c === code); if (l) { l.q = (+l.q || 0) + (q == null ? 1 : +q); if (gf) l.gf = (+l.gf || 0) + +gf; } else cur.lines.push(O().lineFrom(x, q, gf)); return true; };
      const after = () => { paintLines(); paintRes(); save(); };

      const boot = () => { const o = S.get('orders', id); if (!o) { $('#ohd').innerHTML = '<div class="stub"><b>Δεν βρέθηκε η παραγγελία</b></div>'; return; } if (cur) return; cur = JSON.parse(JSON.stringify(o)); cur.lines = cur.lines || []; paintHead(); fillK(); paintLines(); paintRes(); };
      Promise.all([S.use('orders'), S.use('ocat')]).then(boot); boot();
      const offs = [S.on('ocat', () => { if (cur) { fillK(); paintRes(); } }), S.on('orders', boot)];

      el.addEventListener('input', (e) => { const t = e.target;
        if (t.id === 'oq') paintRes();
        else if (t.id === 'od') { cur.date = t.value; save(); } else if (t.id === 'ocamp') { cur.camp = t.value; save(); } else if (t.id === 'on') { cur.note = t.value; save(); }
        else if (t.dataset.oq != null) { cur.lines[+t.dataset.oq].q = Math.max(0, parseInt(t.value, 10) || 0); paintLinesKeep(); } else if (t.dataset.og != null) { cur.lines[+t.dataset.og].gf = Math.max(0, parseInt(t.value, 10) || 0); paintLinesKeep(); } });
      const paintLinesKeep = () => { const a = document.activeElement, k = a && (a.dataset.oq != null ? 'oq' : a.dataset.og != null ? 'og' : ''); const i = a && a.dataset[k]; const p = a && a.selectionStart; paintLines(); if (k) { const n = el.querySelector(`[data-${k}="${i}"]`); if (n) { n.focus(); try { n.setSelectionRange(p, p); } catch (x) { /* τίποτα */ } } } save(); };
      el.addEventListener('change', (e) => { const t = e.target; if (t.id === 'os') { cur.sal = t.value; save(); } else if (t.id === 'op') { cur.pay = t.value; save(); } else if (t.id === 'ogrp') { fillY(); paintRes(); } else if (t.id === 'osub') paintRes(); });
      el.addEventListener('click', async (e) => {
        const t = e.target.closest('button'); if (!t || !cur) return;
        try {
          if (t.dataset.t) { tab = t.dataset.t; el.querySelectorAll('[data-t]').forEach((b) => b.classList.toggle('on', b.dataset.t === tab)); $('#opS').hidden = tab !== 'S'; $('#opT').hidden = tab !== 'T'; }
          else if (t.dataset.oa) { add(t.dataset.oa); after(); }
          else if (t.dataset.ox != null) { cur.lines.splice(+t.dataset.ox, 1); after(); }
          else if (t.dataset.om != null) { const l = cur.lines[+t.dataset.om]; l.q = Math.max(0, (+l.q || 0) - 1); after(); }
          else if (t.dataset.op != null) { const l = cur.lines[+t.dataset.op]; l.q = (+l.q || 0) + 1; after(); }
          else if (t.dataset.ov != null) { const l = cur.lines[+t.dataset.ov]; l.np = l.np ? 0 : 1; after(); }
          else if (t.id === 'ocopy') { const tx = O().toText(cur); let ok = false; try { await navigator.clipboard.writeText(tx); ok = true; } catch (x) { /* τίποτα */ } t.textContent = ok ? '✓ Αντιγράφηκε' : 'Δεν αντιγράφηκε'; setTimeout(() => { t.textContent = '📋 Αντιγραφή παραγγελίας'; }, 2000); }
          else if (t.id === 'odel') { if (!delArm) { delArm = true; paintLines(); return; } gone = true; clearTimeout(svT); await db().remove('orders/' + id); S.drop('orders', id); PL.nav.back(); }
          else if (t.id === 'ogo') {
            const txt = $('#ot').value.trim(); if (!txt) return; $('#ogs').textContent = 'Το Claude ψάχνει τα είδη…'; t.disabled = true;
            const r = await PL.adapter.ai.json(`Είσαι βοηθός πωλητή προϊόντων κομμωτηρίου. Ο πωλητής υπαγορεύει είδη για παραγγελία. Για ΚΑΘΕ είδος κάλεσε το εργαλείο search_items (μόνο λέξεις του είδους, π.χ. «βαφή 7n», «silklift strong», «οξυζενέ 6% λίτρο») και διάλεξε το σωστό από τα αποτελέσματα. Μην επινοείς κωδικούς. Αν κάτι δεν βρίσκεται ή είναι αβέβαιο, βάλ' το στο unclear. Δώρο/εξοπλισμός = gift:true. Απάντησε ΜΟΝΟ με JSON: {"lines":[{"code":"","q":1,"gift":false}],"unclear":[""]}\n\nΚείμενο: ${txt}`, { modelTier: 'default', cache: false, tools: [{ name: 'search_items', description: 'Ψάχνει στον κατάλογο ειδών. Επιστρέφει έως 8 είδη [κωδικός, περιγραφή, υποομάδα, τιμή].', inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] }, execute: ({ query }) => O().search(query, '', '', 8).map((x) => [x[0], x[1], x[3], x[4]]) }] });
            let n = 0; ((r && r.lines) || []).forEach((l) => { if (O().byCode(String(l.code))) { add(String(l.code), Math.max(1, +l.q || 1)); const z = cur.lines.find((q) => q.c === String(l.code)); if (l.gift && z) z.np = 1; n++; } });
            $('#ogs').textContent = (n ? '✓ Προστέθηκαν ' + n + ' είδη.' : 'Δεν πρόσθεσα τίποτα.') + (r && r.unclear && r.unclear.length ? '\nΔεν κατάλαβα: ' + r.unclear.join(', ') + ' (ψάξε τα με την αναζήτηση)' : ''); $('#ot').value = ''; t.disabled = false; after();
          }
        } catch (err) { $('#ogs').textContent = 'Δεν έγινε: ' + ((err && err.message) || 'σφάλμα'); const g = $('#ogo'); if (g) g.disabled = false; }
      });
      return () => { clearTimeout(svT); if (cur && dirty && !gone) save(true); offs.forEach((f) => f()); };
    },
  });
})();

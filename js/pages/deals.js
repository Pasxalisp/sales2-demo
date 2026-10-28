/* «Συμφωνίες»: λίστα πελατών με στόχο, ρυθμός, πρόταση παραγγελιών και μήνυμα στον πελάτη (SMS / αντιγραφή).
   Δίπλα στο «Μήνυμα» το «✓ Ενημερώθηκε» κρατά την τελευταία ημερομηνία που ενημερώθηκε ο πελάτης (συλλογή dealmsg,
   χωριστά από το deals/all ώστε να μη σβήνεται στον συγχρονισμό με το orders).
   Εκθέτει PL.deals.line / PL.deals.click ώστε να δουλεύουν και μέσα στην καρτέλα πελάτη. */
(function () {
  const PL = window.PL, u = PL.u, M = PL.model, S = PL.store, esc = u.esc, eur = u.eur;
  const r10 = (v) => Math.ceil(v / 10) * 10;
  const DL = () => S.get('deals', 'all') || {};
  const list = () => Object.entries(DL()).filter(([k]) => k[0] !== '_' && M.byId(k));
  /* Δικές μου σημειώσεις ανά συμφωνία (συλλογή dealmsg/{cid}): d = τελευταία «✓ Ενημερώθηκε», ign = «Αγνόηση».
     Χωριστά από το deals/all, για να μη σβήνονται στον συγχρονισμό με το orders. */
  const mine = (id) => S.get('dealmsg', id) || {};
  const sent = (id) => mine(id).d || '';
  const ignored = (id) => !!mine(id).ign;
  const dmy = (d) => { const [y, m, dd] = d.split('-'); return dd + '/' + m + '/' + y.slice(2); };
  /* Μήνυμα | ✓ Ενημερώθηκε (με την τελευταία ημερομηνία από κάτω) και από κάτω μικρό «🚫 Αγνόηση» / «↩ Επαναφορά». */
  const btns = (id, label) => { const d = sent(id), ig = ignored(id);
    return `<div class="dlbtns"><button data-dlm="${esc(id)}">💬 ${label}</button><button class="dlsb${d ? ' on' : ''}" data-dlsent="${esc(id)}">✓ Ενημερώθηκε<span>${d ? dmy(d) : 'όχι ακόμα'}</span></button></div>` +
      `<div class="dlig"><button data-dlign="${esc(id)}">${ig ? '↩ Επαναφορά' : '🚫 Αγνόηση'}</button></div>`; };
  async function save(id, patch, msg) {
    const doc = Object.assign({}, mine(id), patch); if (!doc.ign) delete doc.ign; S.put('dealmsg', id, doc);
    try { await PL.adapter.db.set('dealmsg/' + id, doc); PL.dlg.toast(msg); } catch (e) { PL.dlg.toast('Δεν αποθηκεύτηκε'); }
  }
  const markSent = (id) => save(id, { d: u.today() }, '✓ Ενημερώθηκε σήμερα (' + dmy(u.today()) + ')');
  const toggleIgnore = (id) => (ignored(id) ? save(id, { ign: false }, '↩ Η συμφωνία γύρισε στη θέση της') : save(id, { ign: true }, '🚫 Σε αγνόηση: πήγε στο τέλος της λίστας'));
  /* Πάτημα σε «Μήνυμα», «Ενημερώθηκε», «Αγνόηση» (λίστα ή καρτέλα) ή στο κουτί της καρτέλας (άνοιγμα/κλείσιμο). Γυρνά true αν το χειρίστηκε. */
  const click = (t) => { const m = t.closest('[data-dlm]'), s = t.closest('[data-dlsent]'), g = t.closest('[data-dlign]'), o = t.closest('[data-dlt]');
    if (m) { open(m.dataset.dlm); return true; } if (s) { markSent(s.dataset.dlsent); return true; } if (g) { toggleIgnore(g.dataset.dlign); return true; }
    if (o) { toggle(o.closest('.dlk')); return true; } return false; };

  /* Πρόταση: ό,τι απομένει, μοιρασμένο στους μήνες που μένουν μετά τον τρέχοντα (π.χ. Οκτώβριο → 2: Νοέμβριος, Δεκέμβριος).
     Υπολογίζεται κάθε φορά από τη σημερινή ημερομηνία, άρα αλλάζει μόνη της κάθε μήνα. Τον Δεκέμβριο: μία παραγγελία. */
  function plan(id) {
    const x = DL()[id]; if (!x) return null; const i = M.deal(x); if (i.done) return null; const d = new Date();
    const el = Math.max(1, (d - new Date(d.getFullYear(), 0, 1)) / (30.44 * 864e5)), avg = (x.ty || 0) / el;
    const Mn = 11 - d.getMonth(), N = Math.max(1, Mn), per = r10(i.left / N);
    const when = Mn >= 2 ? 'Για τους ' + Mn + ' μήνες που απομένουν, είναι ' + Mn + ' παραγγελίες των ~' + eur(per)
      : Mn === 1 ? 'Για τον μήνα που απομένει, είναι 1 παραγγελία των ~' + eur(per)
      : 'Μέχρι το τέλος του έτους, είναι μία παραγγελία των ~' + eur(per);
    return { N, per, avg, when };
  }
  const bar = (x) => { const i = M.deal(x), p = Math.min(100, i.pct), e = Math.min(100, M.yearFrac() * 100);
    const col = i.done ? '#23875a' : i.pct >= 70 ? '#d9a91f' : '#d9382f';  /* κόκκινη κάτω από 70%, κίτρινη 70–99%, πράσινη στο 100% */
    return `<div class="dlbar"><i style="width:${p}%;background:${col}"></i><s style="left:${e}%" title="Πού θα έπρεπε να είναι σήμερα"></s></div>`; };
  /* Το κουτί συμφωνίας μέσα στην καρτέλα πελάτη: κλειστό σε δύο γραμμές (ποσό, %, μπάρα, μένουν, ρυθμός) με κουμπί 💬 Μήνυμα·
     με πάτημα ανοίγει (φέτος/πέρσι, ανά μήνα, πρόταση, «Ενημερώθηκε», «Αγνόηση»). Το ανοιχτό/κλειστό το θυμάται η συσκευή. */
  const OPEN_K = 'pl.dlopen';
  const isOpen = () => { try { return localStorage.getItem(OPEN_K) === '1'; } catch (e) { return false; } };
  const toggle = (box) => { const on = box.classList.toggle('open'); try { localStorage.setItem(OPEN_K, on ? '1' : '0'); } catch (e) { /* τίποτα */ } };
  const line = (id) => { const x = DL()[id]; if (!x) return ''; const i = M.deal(x), ig = ignored(id), d = sent(id), P = i.done ? null : plan(id);
    const sub = i.done ? `Φέτος ${eur(x.ty)} · <b style="color:#23875a">✓ Την έπιασε</b>`
      : `Μένουν <b style="color:var(--tx)">${eur(i.left)}</b> · ${i.ahead >= 0 ? '<span class="up">▲ μπροστά ' + eur(i.ahead) + '</span>' : '<span class="dn">▼ πίσω ' + eur(-i.ahead) + '</span>'}`;
    const row = (l, v) => `<div class="dlr"><span>${l}</span><span style="color:var(--tx)">${v}</span></div>`;
    return `<div class="dlbox dlk${ig ? ' dlx' : ''}${isOpen() ? ' open' : ''}"><div class="dlkh"><div class="dlkm" data-dlt="1" role="button" aria-label="Λεπτομέρειες συμφωνίας">` +
      `<div class="row"><b style="color:#7a3fb8">🤝 Συμφωνία ${eur(x.goal)}${ig ? ' <span class="mu" style="font-weight:400">· σε αγνόηση</span>' : ''}</b><b style="white-space:nowrap">${Math.round(i.pct)}%</b></div>${bar(x)}` +
      `<div class="dlr"><span>${sub}</span><span class="dlkc" aria-hidden="true">▾</span></div></div>` +
      `<button class="dlkmsg" data-dlm="${esc(id)}" aria-label="Μήνυμα στον πελάτη">${PL.icon.msg}</button></div>` +
      `<div class="dlkd">${row('Φέτος / πέρσι', eur(x.ty) + ' / ' + eur(x.ly))}${i.done ? '' : row('Χρειάζεται', '~' + eur(i.perM) + '/μήνα')}${P ? row('💡 Πρόταση', P.N + ' × ~' + eur(P.per)) + row('Συνήθως παίρνει', '~' + eur(P.avg) + '/μήνα') : ''}` +
      `<div class="dlr dlka"><span>Ενημερώθηκε: <b style="color:var(--tx)">${d ? dmy(d) : 'όχι ακόμα'}</b></span><span class="dlkb"><button class="dlsb${d ? ' on' : ''}" data-dlsent="${esc(id)}">✓ Ενημερώθηκε</button><button data-dlign="${esc(id)}">${ig ? '↩ Επαναφορά' : 'Αγνόηση'}</button></span></div></div></div>`; };

  /* Κείμενο μηνύματος (ένα): χαιρετισμός ανάλογα με την ώρα, συμφωνία / μέχρι σήμερα / απομένουν, πρόταση. Χωρίς υπογραφή. */
  const greet = () => (new Date().getHours() < 13 ? 'Καλημέρα!' : 'Καλησπέρα!');
  function text(id) {
    const x = DL()[id], i = M.deal(x), P = plan(id);
    return greet() + '\nΜια σύντομη ενημέρωση για τη συμφωνία μας Goldwell για το ' + new Date().getFullYear() + '.' +
      '\n\nΣυμφωνία: ' + eur(x.goal) + '\nΜέχρι σήμερα: ' + eur(x.ty) + ' (' + Math.round(i.pct) + '%)' +
      (i.done ? '\n✓ Η συμφωνία πιάστηκε!' : '\nΑπομένουν: ' + eur(i.left) + ' (μέχρι τέλος του έτους)') +
      (P ? '\n\n' + P.when + '.' : '');
  }
  const mob = (c) => [c.t2, c.t1].map((x) => String(x || '').replace(/[^\d+]/g, '')).find((x) => /^(\+?30)?69\d{8}$/.test(x)) || '';

  /* Παράθυρο μηνύματος (φύλλο στο κάτω μέρος). */
  let md = null, MID = null;
  function ensureModal() {
    if (md && document.body.contains(md)) return md;
    md = document.createElement('div'); md.id = 'dlm'; md.style.display = 'none';
    md.style.cssText = 'display:none;position:fixed;inset:0;z-index:55;background:rgba(0,0,0,.45);align-items:flex-end;justify-content:center;padding:12px';
    md.innerHTML = '<div style="background:var(--card,#fff);color:var(--tx);border-radius:20px;padding:16px;max-width:440px;width:100%;margin-bottom:env(safe-area-inset-bottom,0px)"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><b id="dlmt" style="color:#7a3fb8"></b><button id="dlmx" aria-label="Κλείσιμο" style="padding:4px 12px">✕</button></div><textarea id="dlmb" rows="9" style="width:100%;margin-top:8px;box-sizing:border-box;font-size:15px;line-height:1.4"></textarea><div class="mu" id="dlmn" style="font-size:12px;margin:4px 0 8px"></div><div style="display:flex;gap:8px"><a class="btn" id="dlms" href="#" target="_blank" rel="noopener" style="flex:1;text-align:center;background:#23875a;border-color:#23875a;color:#fff;margin:0;font-weight:700">📱 Άνοιγμα SMS</a><button id="dlmc" style="flex:1;font-weight:700">📋 Αντιγραφή</button></div></div>';
    document.body.appendChild(md);
    md.addEventListener('click', async (e) => {
      const t = e.target;
      if (t === md || t.id === 'dlmx') { md.style.display = 'none'; return; }
      if (t.id === 'dlms') { fill(); setTimeout(() => { md.style.display = 'none'; }, 300); return; }
      if (t.id === 'dlmc') {
        const ta = md.querySelector('#dlmb'); let ok = false;
        try { await navigator.clipboard.writeText(ta.value); ok = true; } catch (x) { ta.focus(); ta.select(); try { ok = document.execCommand('copy'); } catch (y) { /* τίποτα */ } }
        t.textContent = ok ? '✓ Αντιγράφηκε' : 'Επίλεξε & αντέγραψε'; setTimeout(() => { t.textContent = '📋 Αντιγραφή'; }, 2000);
      }
    });
    md.querySelector('#dlmb').addEventListener('input', () => fill());
    return md;
  }
  function fill() {
    const c = M.byId(MID), num = c ? mob(c) : '', body = encodeURIComponent(md.querySelector('#dlmb').value), ios = /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent);
    md.querySelector('#dlms').href = 'sms:' + num + (ios ? '&' : '?') + 'body=' + body;
    md.querySelector('#dlmn').textContent = num ? 'Θα ανοίξει το SMS προς ' + num + ' με το κείμενο έτοιμο. Το στέλνεις εσύ.' : 'Δεν βρήκα κινητό για τον πελάτη. Το SMS θα ανοίξει χωρίς παραλήπτη.';
  }
  function open(id) {
    const x = DL()[id]; if (!x) return; ensureModal(); MID = id;
    md.querySelector('#dlmt').textContent = '💬 ' + (M.byId(id) || {}).name;
    md.querySelector('#dlmb').value = text(id); fill(); md.style.display = 'flex';
  }
  PL.deals = { plan, text, msg: open, click, sent, ignored, bar, line };

  const SORTS = { left: ['Μένουν περισσότερα', (a, b) => M.deal(b[1]).left - M.deal(a[1]).left], behind: ['Πιο πίσω', (a, b) => M.deal(a[1]).ahead - M.deal(b[1]).ahead], pct: ['Μικρότερο %', (a, b) => M.deal(a[1]).pct - M.deal(b[1]).pct], city: ['Πόλη', (a, b) => (M.byId(a[0]).city || '').localeCompare(M.byId(b[0]).city || '', 'el')] };
  let sortK = 'left';

  PL.register('deals', {
    title: 'Συμφωνίες',
    split: ['client'],
    render(el) {
      el.innerHTML = '<h2 style="color:#7a3fb8">🤝 Συμφωνίες Goldwell</h2><div id="dlsum"></div><div id="dlsort" class="chips" style="margin:6px 0"></div><div id="dll"></div><p class="mu" id="dlsrc" style="font-size:12px"></p>';
      ['deals', 'cats', 'clients', 'prospects', 'dealmsg'].forEach((c) => S.use(c));
      const paint = () => {
        if (!S.loaded('deals')) return;
        const L = list(), tg = L.reduce((a, [, x]) => a + (x.goal || 0), 0), tt = L.reduce((a, [, x]) => a + (x.ty || 0), 0);
        const nd = L.filter(([, x]) => M.deal(x).done).length, nb = L.filter(([, x]) => !M.deal(x).done && M.deal(x).ahead < 0).length;
        el.querySelector('#dlsum').innerHTML = `<div class="dlbox" style="margin-top:0"><div class="row"><b>${L.length} συμφωνίες · ${eur(tg)}</b><b>${tg ? Math.round(tt / tg * 100) : 0}%</b></div>${bar({ goal: tg, ty: tt })}<div class="dlr"><span>Φέτος ${eur(tt)}</span><span>Μένουν ${eur(Math.max(0, tg - tt))}</span></div><div class="dlr"><span class="up">✓ ${nd} την έπιασαν</span><span class="dn">▼ ${nb} πίσω από τον ρυθμό</span></div></div>`;
        el.querySelector('#dlsort').innerHTML = Object.entries(SORTS).map(([k, [l]]) => `<button class="chip${k === sortK ? ' on' : ''}" data-dls="${k}">${l}</button>`).join('');
        /* οι συμφωνίες σε αγνόηση πάνε τέρμα κάτω, αχνά (μετράνε κανονικά στα σύνολα) */
        const on = L.filter(([id]) => !ignored(id)).sort(SORTS[sortK][1]), off = L.filter(([id]) => ignored(id)).sort(SORTS[sortK][1]);
        const card = ([id, x]) => { const c = M.byId(id), i = M.deal(x), P = plan(id);
          return `<div class="card dlc${ignored(id) ? ' dlx' : ''}" data-dlo="${esc(id)}"><div class="row"><span class="nm">${esc(c.name)}</span><b style="white-space:nowrap">${Math.round(i.pct)}%</b></div><div class="mu">${esc(c.city)} · συμφωνία ${eur(x.goal)}</div>${bar(x)}<div class="dlr"><span>Φέτος ${eur(x.ty)}</span><span>${i.done ? '<b style="color:#23875a">✓ Την έπιασε</b>' : 'Μένουν <b style="color:var(--tx)">' + eur(i.left) + '</b> · ~' + eur(i.perM) + '/μήνα'}</span></div>${P ? `<div class="dlr" style="color:var(--tx)"><span>💡 ${P.N} × ~${eur(P.per)}</span><span class="mu">συνήθως ~${eur(P.avg)}/μήνα</span></div>` : ''}${btns(id, 'Μήνυμα')}</div>`; };
        el.querySelector('#dll').innerHTML = (on.map(card).join('') + (off.length ? `<h3 class="mu" id="dlxh" style="margin-top:22px">🚫 Σε αγνόηση (${off.length})</h3>` + off.map(card).join('') : '')) || '<p class="mu">Δεν υπάρχουν συμφωνίες.</p>';
        el.querySelector('#dlsrc').textContent = 'Πηγή: orders, «GOLDWELL – Πελάτες με συμφωνίες» (' + ((DL()._d) || '—') + '). Η κάθετη γραμμή δείχνει πού θα έπρεπε να είναι σήμερα με σταθερό ρυθμό.';
      };
      paint();
      const offs = ['deals', 'cats', 'clients', 'dealmsg'].map((c) => S.on(c, paint));
      el.addEventListener('click', (ev) => {
        const t = ev.target, s = t.closest('[data-dls]'), o = t.closest('[data-dlo]');
        if (s) { sortK = s.dataset.dls; paint(); } else if (click(t)) { /* μήνυμα / ενημερώθηκε / αγνόηση */ } else if (o) PL.nav.push('client', { id: o.dataset.dlo });
      });
      return () => offs.forEach((f) => f());
    },
  });
})();

/* Καρτέλα πελάτη. Μεταφορά από την παλιά σελίδα (detail, prospPanel, goldDetail, brandDetail, catDetail, itemsDetail).
   Τρία κομμάτια: πάνω (στοιχεία και νούμερα), φόρμα νέας επαφής (χτίζεται μία φορά, για να μη χάνεται
   ό,τι γράφεις όταν ανανεώνονται τα δεδομένα) και ιστορικό. */
(function () {
  const PL = window.PL, u = PL.u, M = PL.model, S = PL.store, D = PL.dlg, esc = u.esc, money = u.money, db = () => PL.adapter.db;
  const COLS = ['clients', 'prospects', 'notes', 'sos', 'tech', 'balances', 'seminars', 'xout', 'deals', 'dealmsg', 'brands', 'cats', 'items', 'orders', 'plans'];
  const SM = 'font-weight:400;font-size:13px';

  /* ---- τμήματα με νούμερα ---- */
  function goldDetail(c) {
    const g = M.gold(c); if (!g) return '';
    const y = M.yoy(c); let s = '<h3>Goldwell</h3>';
    if (y) s += `<div class="${y.cls}">${y.txt} (${M.dd(y)}) σε σχέση με πέρσι (ίδια περίοδο)</div>`;
    s += `<div class="mu">Φέτος ${money(g[1])} · πέρσι ίδια περίοδο ${money(g[0])} · διαφορά ${money(g[1] - g[0])}</div>`;
    if (g[2] != null) s += `<div class="mu">Πέρσι όλη η χρονιά: ${money(g[2])}${g[2] > 0 ? ' · φέτος έχει φτάσει το ' + Math.round(g[1] / g[2] * 100) + '%' : ''}</div>`;
    return s;
  }
  function brandDetail(id) {
    const B = S.get('brands', 'all'), d = B && B[id]; if (!d) return '';
    const r = Object.keys(d).filter((k) => Array.isArray(d[k]) && d[k].some((x) => Math.abs(+x || 0) >= 1)); if (!r.length) return '';
    r.sort((a, b) => (M.EXB.includes(a) - M.EXB.includes(b)) || (d[b][1] - d[a][1]));
    let A = 0, Bt = 0; r.forEach((k) => { if (!M.EXB.includes(k)) { A += +d[k][0] || 0; Bt += +d[k][1] || 0; } });
    return `<h3>Ανά μάρκα <span class="mu" style="${SM}">(${esc(B._d || '')})</span></h3><div style="overflow-x:auto"><table class="ctab"><tr><th></th><th>Πέρσι ίδια περ.</th><th>Φέτος</th></tr>` +
      r.map((k) => { const [a, b] = d[k].map((x) => +x || 0); return `<tr><td>${esc(M.BRL[k] || k)}${M.EXB.includes(k) ? ' <span class="mu">✕</span>' : ''}${a >= M.WORKED && b < 1 ? ' <span class="dn">σταμάτησε</span>' : a < 1 && b >= 1 ? ' <span class="up">νέο</span>' : ''}</td><td>${money(a)}</td><td class="${b >= a ? 'up' : 'dn'}">${money(b)}</td></tr>`; }).join('') +
      `<tr><td><b>Γενικός τζίρος</b></td><td><b>${money(A)}</b></td><td class="${Bt >= A ? 'up' : 'dn'}"><b>${money(Bt)}</b></td></tr></table></div><div class="mu" style="font-size:12px">✕ = δεν μετράει στον γενικό τζίρο</div>`;
  }
  function catDetail(id) {
    const all = S.get('cats', 'all') || {}, d = all[id]; if (!d) return '';
    const r = M.CATN.filter((k) => Array.isArray(d[k]) && d[k].some((x) => x)); if (!r.length) return '';
    return `<h3>Ανά κατηγορία <span class="mu" style="${SM}">(${esc(d.d || all._d || '')})</span></h3><div style="overflow-x:auto"><table class="ctab"><tr><th></th><th>Πέρσι ίδια περ.</th><th>Φέτος</th><th>Όλο πέρσι</th></tr>` +
      r.map((k) => { const [a, b, f] = d[k].map((x) => +x || 0), lost = a > 0 && f >= M.WORKED && b <= 0, nw = a <= 0 && b > 0; return `<tr><td>${esc(M.CATL[k] || k)}${lost ? ' <span class="dn">σταμάτησε</span>' : nw ? ' <span class="up">νέο</span>' : ''}</td><td>${money(a)}</td><td class="${b >= a ? 'up' : 'dn'}">${money(b)}</td><td>${money(f)}</td></tr>`; }).join('') + '</table></div>';
  }
  function itemsDetail(id) {
    const d = S.get('items', id); if (!d || !Array.isArray(d.it) || !d.it.length) return '';
    const all = d.it.filter((x) => (+x.qc || 0) > 0 || (+x.qp || 0) > 0 || (+x.tc || 0) > 0 || (+x.tp || 0) > 0 || (+x.qf || 0) > 0); if (!all.length) return '';
    const hasF = all.some((x) => x.qf != null), m = {};
    all.forEach((x) => { const g = x.g || 'Άλλα'; (m[g] = m[g] || { g, qc: 0, qp: 0, qf: 0, it: [] }); m[g].qc += +x.qc || 0; m[g].qp += +x.qp || 0; m[g].qf += +x.qf || 0; m[g].it.push(x); });
    const G = Object.values(m).sort((a, b) => (b.qc + b.qp) - (a.qc + a.qp)), nNow = all.filter((x) => (+x.qc || 0) > 0).length;
    const cell = (c, p, f) => { const st = c === 0 && (p > 0 || f > 0) ? 'color:var(--rd);font-weight:600' : c > 0 && p === 0 && !f ? 'color:var(--ac);font-weight:600' : '';
      return `<td style="text-align:right;color:var(--mu)">${p || '—'}</td>${hasF ? `<td style="text-align:right;color:var(--mu)">${f || '—'}</td>` : ''}<td style="text-align:right;${st}">${c || '—'}</td>`; };
    const rows = G.map((g) => `<tr style="background:var(--ac2)"><td style="white-space:normal"><b>${esc(g.g)}</b></td><td style="text-align:right"><b>${g.qp}</b></td>${hasF ? `<td style="text-align:right"><b>${g.qf}</b></td>` : ''}<td style="text-align:right"><b>${g.qc}</b></td></tr>` +
      g.it.sort((a, b) => ((+b.qc || 0) - (+a.qc || 0)) || ((+b.qp || 0) - (+a.qp || 0))).map((x) => `<tr><td style="white-space:normal;padding-left:14px">${esc(x.n)}</td>${cell(+x.qc || 0, +x.qp || 0, +x.qf || 0)}</tr>`).join('')).join('');
    return `<details style="margin:10px 0"><summary style="cursor:pointer;font-weight:600">🧴 Τι παίρνει: πέρσι / φέτος (${nNow} είδη φέτος σε ${G.filter((g) => g.qc > 0).length} κατηγορίες)<span class="mu" style="${SM}"> · σύστημα ${esc(d.d || '')}</span></summary>` +
      `<div style="overflow-x:auto"><table class="ctab"><thead><tr><th style="text-align:left">Κατηγορία / είδος</th><th style="text-align:right">Πέρσι<br><span style="font-weight:400">ίδια περίοδος</span></th>${hasF ? '<th style="text-align:right">Πέρσι<br><span style="font-weight:400">όλο το έτος</span></th>' : ''}<th style="text-align:right">Φέτος<br><span style="font-weight:400">τεμ.</span></th></tr></thead><tbody>${rows}</tbody></table></div>` +
      `<p class="mu" style="font-size:12px;margin:6px 0 0"><span style="color:var(--rd);font-weight:600">Κόκκινο</span>: το έπαιρνε πέρσι, φέτος όχι · <span style="color:var(--ac);font-weight:600">Πράσινο</span>: νέο φέτος${hasF ? ' · Τεμάχια' : ''}</p></details>`;
  }

  /* ---- μικρές γραμμές πληροφορίας ---- */
  function debtLine(id) {
    const b = S.get('balances', id); if (!b) return '';
    const a = +b.amount || 0, o = +b.over || 0, d = +b.bounced || 0; if (Math.abs(a) < 1 && o < 1 && !d) return '';
    return `<div class="debt">💶 Χρέος ${money(a)}${o > 0 ? ` · <span class="dn">υπέρβαση ${money(o)}</span>` : ''}${d ? ` · <span class="dn">διαμαρτυρημένα ${money(d)}</span>` : ''}${b.d ? ` <span class="mu">(${esc(b.d)})</span>` : ''}</div>`;
  }
  function semLine(id) {
    const L = Object.values(S.all('seminars')).filter((x) => (x.cust || []).includes(id)).map((x) => x.title + ((x.conf || []).includes(id) ? ' (✅ επιβεβαιωμένο)' : ' (⏳ σε εκκρεμότητα)'));
    return L.length ? `<div class="debt">🎓 Σεμινάρια: ${esc(L.join(', '))}</div>` : '';
  }
  const XOL = { closed: 'Έκλεισε', no: 'Δεν ενδιαφέρεται', later: 'Άλλη φορά' };
  const xoBlocked = (x) => x && (x.r === 'closed' || x.r === 'no');
  function xoLine(id) {
    const x = S.get('xout', id); if (!x) return ''; const bl = xoBlocked(x);
    return `<div class="warn" style="margin-top:6px">${bl ? '⛔' : '↩️'} Βγήκε από πρόγραμμα: <b>${esc(XOL[x.r] || x.r)}</b> (${u.fd(x.d)})${bl ? '. Δεν προτείνεται σε νέα προγράμματα.' : ''} <button data-xorest="${id}" style="margin-top:6px;padding:4px 10px">${bl ? 'Να ξαναμπαίνει' : 'Απόκρυψη σημείωσης'}</button></div>`;
  }
  function ordLine(id) {
    const L = Object.entries(S.all('orders')).filter(([, o]) => o.cid === id).sort((a, b) => String(b[1].ts || 0).localeCompare(String(a[1].ts || 0))).slice(0, 6); if (!L.length) return '';
    return '<div class="ordl"><b>🛒 Παραγγελίες</b>' + L.map(([k, o]) => { const s = PL.orders.split(o);
      return `<div class="oi" data-oo="${esc(k)}"><span>${esc(u.fd(o.date))} · 📝 Πρόχειρη</span><span>${s.P.length} είδη${s.G.length ? ' + ' + s.G.length + ' δώρα' : ''} · ${money(s.sp.n)}</span></div>`; }).join('') + '</div>';
  }
  /* προσωρινός: αν μοιάζει με κανονικό πελάτη (π.χ. πέρασε στο orders), πρόταση ένωσης· αλλιώς ένωση με το χέρι */
  const prospPanel = (id) => { const m = PL.prospects.matches().find((x) => x.pid === id), mc = m && M.byId(m.cid);
    return `<div class="warn">${mc ? `Μάλλον πέρασε στο orders ως <b>${esc(mc.name)}</b>${mc.code ? ' (κωδ. ' + esc(mc.code) + ')' : ''} · ${esc(m.why)}.<p style="margin:8px 0"><button class="pri" data-pmy="${esc(mc.i)}">Ένωση</button> <button data-pmn="${esc(mc.i)}">Όχι, άλλος</button></p>` : ''}🆕 Προσωρινός πελάτης (δεν έχει περάσει στο orders). Όταν περάσει, θα σου προταθεί η ένωση στην Αρχική. Ή ένωσέ τον τώρα με τον κανονικό:<input id="pmc" list="dcl" placeholder="γράψε το όνομα του κανονικού πελάτη…" style="margin-top:6px"><datalist id="dcl">${M.clients().map((c) => `<option value="${esc(c.name)} · ${esc(c.city)} · ${c.i}">`).join('')}</datalist><p style="margin:8px 0 0"><button id="pmg">Ένωση</button> <button id="pdel">Διαγραφή</button></p></div>`; };

  /* ---- πάνω μέρος ---- */
  /* σεμινάρια του πελάτη: '' (κανένα) · 'p' (κάποιο περιμένει επιβεβαίωση) · 'c' (όλα επιβεβαιωμένα) */
  const semState = (id) => { const L = Object.values(S.all('seminars')).filter((x) => (x.cust || []).includes(id)); return !L.length ? '' : L.some((x) => !(x.conf || []).includes(id)) ? 'p' : 'c'; };
  function topHtml(id, c) {
    const SOS = !!S.get('sos', id), T = S.get('tech', id), sem = semState(id), I = PL.icon, map = PL.call.mapUrl(c);
    const tz = M.tz(c);
    const nd = PL.names.feastOf(c), ndD = nd ? PL.names.dateOf(nd, +PL.names.today().slice(0, 4)) : '';
    return `<h2 style="margin:4px 0 2px">${SOS ? '⭐ ' : ''}${PL.names.badge(c)}${PL.prospects.tag(c)}${esc(c.name)}</h2>` +
      `<div class="mu">${esc(c.addr)}${c.addr && c.city ? ', ' : ''}${esc(c.city)} ${esc(c.zip)}${' · κωδ. ' + esc(c.prospect ? 'ΝΕΟΣ' : (c.codes || [c.code]).join(', '))}</div>` +
      `<div class="cact"><button class="cat" data-callc="${esc(id)}"${PL.call.tels(c).length ? '' : ' disabled'}>${I.phone}<span>Κλήση</span></button>` +
      (map ? `<a class="cat" href="${esc(map)}" target="_blank" rel="noopener">${I.pin}<span>Οδηγίες</span></a>` : `<button class="cat" disabled>${I.pin}<span>Οδηγίες</span></button>`) +
      `<button class="cat" id="ordb">${I.cart}<span>Παραγγελία</span></button></div>` +
      `<div class="cchips"><button class="cchip${SOS ? ' sos' : ''}" id="sosb" aria-pressed="${SOS}">${I.star}SOS</button>` +
      `<button class="cchip${T ? ' tech' : ''}" id="techb" aria-pressed="${!!T}">${I.tech16}Τεχνικός</button>` +
      `<button class="cchip${sem ? ' sem' : ''}" id="semb" aria-pressed="${!!sem}">${I.cap}Σεμινάριο${sem === 'p' ? ' ⏳' : sem === 'c' ? ' ✅' : ''}</button></div>` +
      `${T && T.note ? `<div class="mu">Τεχνικός: ${esc(T.note)}</div>` : ''}` +
      `${nd ? `<div class="mu">🎉 Γιορτάζει: ${esc(nd.t)} (${esc(u.fd(ndD))})${ndD === PL.names.today() ? ' · <b class="up">σήμερα!</b>' : ''}</div>` : ''}` +
      `${c.alt ? `<div class="mu">Επίσης: ${esc(c.alt.join(' · '))}</div>` : ''}${tz !== 0 ? `<p class="tz">Τζίρος: ${money(tz)}</p>` : ''}` +
      `${c.ex ? `<div class="mu">Έχουν αφαιρεθεί: ${esc(c.exn)} (αρχικός τζίρος ${money(c.tz0)})</div>` : ''}` +
      `${c.tzold != null ? `<div class="mu">Ο τζίρος ενημερώθηκε στο μεγαλύτερο ποσό (Goldwell φέτος· πριν ${money(c.tzold)})</div>` : ''}` +
      `${debtLine(id)}${semLine(id)}${xoLine(id)}${ordLine(id)}${PL.deals.line(id)}${goldDetail(c)}${brandDetail(id)}${catDetail(id)}${itemsDetail(id)}` +
      `${c.prospect ? prospPanel(id) : ''}<h3>Δουλεύει ήδη</h3><div class="chips" style="flex-wrap:wrap">${M.PR.map((p) => `<button class="chip ${M.works(id).includes(p) ? 'on' : ''}" data-w="${p}">${p}</button>`).join('')}</div>`;
  }

  const formHtml = () => `<h3>Νέα επαφή</h3>
 <label>Προϊόντα που συζητήθηκαν</label><div class="chips" style="flex-wrap:wrap">${M.PR.map((p) => `<button class="chip" data-p="${p}">${p}</button>`).join('')}</div><input id="fp">
 <label>Τι συζητήσαμε</label><textarea id="ft" rows="3"></textarea>
 <label>Να πω την επόμενη φορά</label><textarea id="fo" rows="2"></textarea>
 <label>Εκκρεμότητα για</label><div style="display:flex;gap:6px"><input id="fn" type="date" style="flex:1"><input id="fnt" type="time" style="flex:none;width:120px" aria-label="Ώρα"></div>
 <p><button class="pri" id="sv">Αποθήκευση</button> <span class="mu" id="svmsg"></span></p>`;

  const histHtml = (id) => { const e = M.entries(id);
    return '<h3>Ιστορικό</h3>' + (e.length ? e.map((x, k) => `<div class="ent"><b>${esc(x.d)}</b> ${x.products ? `<span class="pr">${esc(x.products)}</span>` : ''}<div>${esc(x.text)}</div>${x.todo ? `<div><b>Να πω:</b> ${esc(x.todo)}</div>` : ''}${x.next ? `<div class="mu">Επόμενη: ${esc(x.next)}</div>` : ''}<button data-del="${k}" style="padding:2px 8px;font-size:12px">διαγραφή</button></div>`).join('') : '<p class="mu">Καμία καταγραφή ακόμα.</p>'); };

  /* Βάζει τον πελάτη στο ανοιχτό πρόγραμμα της πόλης του, μετά την τελευταία στάση της ίδιας πόλης. */
  async function addToPlan(cid) {
    const c = M.byId(cid); if (!c) { D.toast('Δεν έγινε.'); return; }
    const L = Object.entries(S.all('plans')).filter(([, p]) => !p.closed && !(p.stops || []).every((s) => s.done)).sort((a, b) => String(b[1].created).localeCompare(String(a[1].created)));
    const hit = L.find(([, p]) => (p.cities || []).includes(c.city));
    if (!hit) { D.toast('Δεν υπάρχει ανοιχτό πρόγραμμα για ' + c.city + '. Φτιάξε πρώτα πρόγραμμα με «+».'); return; }
    const [pid, p] = hit, stops = (p.stops || []).slice();
    if (stops.some((s) => s.id === cid)) { D.toast('Ο «' + c.name + '» είναι ήδη στο πρόγραμμα ' + p.cities.join(' + ') + '.'); return; }
    let at = -1; stops.forEach((s, k) => { if (M.byId(s.id) && M.byId(s.id).city === c.city) at = k; });
    const st = { id: cid, why: 'Προστέθηκε από εσένα', say: [], done: false, added: true };
    if (at >= 0) stops.splice(at + 1, 0, st); else stops.push(st);
    try { const doc = Object.assign({}, p, { stops }); await db().set('plans/' + pid, doc); S.put('plans', pid, doc); D.toast('✓ Ο «' + c.name + '» μπήκε στο πρόγραμμα ' + p.cities.join(' + ') + '.'); }
    catch (e) { D.toast('Δεν αποθηκεύτηκε. Δοκίμασε ξανά.'); }
  }
  const focusEl = (el) => { if (!el) return; el.scrollIntoView({ block: 'center', behavior: 'smooth' }); setTimeout(() => { try { el.focus(); } catch (x) { /* τίποτα */ } }, 350); };

  PL.register('client', {
    title: 'Καρτέλα πελάτη',
    nova: (params) => PL.menu((M.byId(params.id) || {}).name || 'Πελάτης', [
      { e: '📝', label: 'Σημείωση', d: 'τι συζητήσατε, τι να πεις την επόμενη φορά', fn: () => focusEl(document.getElementById('ft')) },
      { e: '📋', label: 'Στο πρόγραμμα', d: 'μπαίνει στο ανοιχτό πρόγραμμα της πόλης του', fn: () => addToPlan(params.id) },
      { e: '⏰', label: 'Υπενθύμιση', d: 'ημερομηνία και ώρα για εκκρεμότητα', fn: () => focusEl(document.getElementById('fn')) },
    ]),
    render(el, params) {
      const id = params.id;
      el.innerHTML = `<div id="top"></div><div id="form">${formHtml()}</div><div id="hist"></div>`;
      const $ = (s) => el.querySelector(s);
      const paintTop = () => { const c = M.byId(id); const keep = $('#pmc') && $('#pmc').value;
        $('#top').innerHTML = c ? topHtml(id, c) : '<div class="warn"><b>Δεν βρέθηκε ο πελάτης</b>Ίσως δεν έχουν φορτώσει ακόμα τα δεδομένα.</div>'; if (keep && $('#pmc')) $('#pmc').value = keep; };
      const paintHist = () => { $('#hist').innerHTML = histHtml(id); };
      COLS.forEach((c) => S.use(c));
      paintTop(); paintHist();
      const offs = COLS.map((c) => S.on(c, () => { if (c === 'notes') paintHist(); paintTop(); }));
      const closeAfter = () => { PL.nav.back(); };

      el.addEventListener('click', async (ev) => {
        const t = ev.target, c = M.byId(id);
        try {
          if (t.closest('#sosb')) {
            if (S.get('sos', id)) { await db().remove('sos/' + id); D.toast('Αφαιρέθηκε το SOS'); }
            else { await db().set('sos/' + id, { on: true, d: u.today() }); D.toast('⭐ SOS: θα μπει πρώτος στο επόμενο πρόγραμμα της πόλης του'); }
          }
          else if (t.closest('#techb')) {
            if (S.get('tech', id)) { if (!await D.confirm('Να αφαιρεθεί ο «' + (c ? c.name : '') + '» από τη λίστα τεχνικής υποστήριξης;', 'Ναι, αφαίρεση')) return; await db().remove('tech/' + id); D.toast('Αφαιρέθηκε από τη λίστα τεχνικού'); }
            else { await db().set('tech/' + id, { d: u.today(), note: '' }); D.toast('Μπήκε στη λίστα τεχνικής υποστήριξης'); }
          }
          else if (t.closest('#semb')) {
            const L = Object.entries(S.all('seminars')).sort((a, b) => String(a[1].date || '9999').localeCompare(String(b[1].date || '9999')));
            if (!L.length) { D.toast('Δεν έχεις φτιάξει σεμινάρια ακόμα. Φτιάξε ένα από την αρχική: Τεχνικός – Σεμινάρια → Σεμινάρια.'); return; }
            const opts = L.map(([, x]) => ((x.cust || []).includes(id) ? '✓ ' : '') + (x.title || 'Σεμινάριο') + ' · ' + (x.date ? u.fd(x.date) : 'χωρίς ημερομηνία') + (x.time ? ' ' + x.time : '')); opts.push('Άκυρο');
            const k = await D.choice('Σε ποιο σεμινάριο να μπει ο «' + (c ? c.name : '') + '»;' + (L.some(([, x]) => (x.cust || []).includes(id)) ? ' (✓ = είναι ήδη μέσα, πάτα για αφαίρεση)' : ''), opts);
            if (k == null || k >= L.length) return;
            const [sid, x0] = L[k], x = Object.assign({}, x0), cu = x.cust || [];
            const rm = cu.includes(id);
            if (rm) { if (!await D.confirm('Να αφαιρεθεί ο «' + (c ? c.name : '') + '» από το σεμινάριο «' + (x.title || '') + '»;', 'Ναι, αφαίρεση')) return; x.cust = cu.filter((v) => v !== id); x.conf = (x.conf || []).filter((v) => v !== id); }
            else x.cust = cu.concat([id]);
            await db().set('seminars/' + sid, x); S.put('seminars', sid, x);
            D.toast((rm ? 'Αφαιρέθηκε από το σεμινάριο «' : '🎓 Μπήκε στο σεμινάριο «') + (x.title || 'Σεμινάριο') + '»');
          }
          else if (t.closest('#ordb')) {
            const ex = Object.entries(S.all('orders')).find(([, o]) => o.cid === id && o.st === 'draft');
            if (ex && await D.confirm('Υπάρχει ήδη πρόχειρη παραγγελία για «' + c.name + '». Να ανοίξει αυτή;', 'Ναι, άνοιξέ τη', 'Όχι, νέα παραγγελία')) { PL.nav.push('order', { id: ex[0] }); return; }
            PL.nav.push('order', { id: await PL.orders.create(id) });
          }
          else if (t.closest('[data-oo]')) PL.nav.push('order', { id: t.closest('[data-oo]').dataset.oo });
          else if (PL.deals.click(t)) { /* Συμφωνία: μήνυμα / ενημερώθηκε */ }
          else if (t.dataset.xorest) {
            if (xoBlocked(S.get('xout', id)) && !await D.confirm('Να ξαναμπαίνει ο «' + (c ? c.name : '') + '» στα προγράμματα;', 'Ναι', 'Άκυρο')) return;
            await PL.plans.clearExit(id);
          }
          else if (t.id === 'pmg' || t.dataset.pmy) {
            const tid = t.dataset.pmy || $('#pmc').value.split(' · ').pop(), tc = M.byId(tid);
            if (!tc || tc.prospect) { D.toast('Διάλεξε κανονικό πελάτη από τη λίστα'); return; }
            if (!await D.confirm('Να ενωθεί ο προσωρινός πελάτης με τον «' + tc.name + '»; Ό,τι έχει (σημειώσεις, επισκέψεις, προγράμματα, ραντεβού, SOS, εκκρεμότητες…) θα περάσει σε αυτόν και ο προσωρινός θα διαγραφεί.', 'Ναι, ένωση')) return;
            await PL.prospects.merge(id, tid); D.toast('Ενώθηκε με «' + tc.name + '»'); closeAfter();
          }
          else if (t.dataset.pmn) { await PL.prospects.dismiss(id, t.dataset.pmn); }
          else if (t.id === 'pdel') {
            if (!await D.confirm('Να διαγραφεί ο προσωρινός πελάτης «' + (c ? c.name : '') + '» μαζί με τις σημειώσεις του;')) return;
            try { await db().remove('notes/' + id); } catch (e) { /* δεν υπήρχε */ }
            await db().remove('prospects/' + id); closeAfter();
          }
          else if (t.dataset.w) { const w = t.dataset.w; await PL.notes.update(id, (d) => { const k = d.works.indexOf(w); k >= 0 ? d.works.splice(k, 1) : d.works.push(w); }); }
          else if (t.dataset.p) {
            const f = $('#fp'), a = f.value.split(',').map((s) => s.trim()).filter(Boolean);
            if (!a.includes(t.dataset.p)) a.push(t.dataset.p); f.value = a.join(', ');
            f.dispatchEvent(new Event('input', { bubbles: true }));   /* μετράει ως γραμμένο: κρατιέται αν φύγεις χωρίς αποθήκευση (drafts.js) */
          }
          else if (t.id === 'sv') {
            const p = $('#fp').value.trim(), x = $('#ft').value.trim(), o = $('#fo').value.trim(), n = $('#fn').value, ntm = $('#fnt').value || '';
            if (!p && !x && !o) { $('#svmsg').textContent = 'Γράψε κάτι πρώτα.'; return; }
            t.disabled = true;
            const entry = Object.assign({ d: u.today(), products: p, text: x, todo: o, next: n }, n && ntm ? { nt: ntm } : {});
            await PL.notes.add(id, entry);
            ['#fp', '#ft', '#fo', '#fn', '#fnt'].forEach((s) => { $(s).value = ''; });
            $('#svmsg').textContent = 'Αποθηκεύτηκε.'; t.disabled = false;
          }
          else if (t.dataset.del !== undefined) {
            if (!await D.confirm('Να διαγραφεί αυτή η καταγραφή από το ιστορικό;')) return;
            await PL.notes.remove(id, M.entries(id)[+t.dataset.del]);
          }
        } catch (e) { const m = $('#svmsg'); if (m) m.textContent = 'Δεν αποθηκεύτηκε: ' + ((e && e.message) || e); const b = $('#sv'); if (b) b.disabled = false; }
      });
      return () => { offs.forEach((f) => f()); };
    },
  });
})();

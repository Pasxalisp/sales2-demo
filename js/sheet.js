/* ΦΥΛΛΑ ΔΕΞΙΑ (τάμπλετ): κοινά κομμάτια για τα φύλλα των σελίδων (επίσκεψη, εκκρεμότητα, είσπραξη, συμφωνία,
   τεχνικός, αγορά). Μόνο HTML, χωρίς εγγραφές. Τα πατήματα [data-callc] τα χειρίζεται το call.js. */
(function () {
  const PL = window.PL, u = PL.u, M = PL.model, S = PL.store, esc = u.esc, money = u.money;
  const off = (icon, label) => `<button disabled>${icon}${label}</button>`;
  const chip = (t, cls) => `<span class="shchip ${cls || ''}">${t}</span>`;

  PL.sheet = {
    chip,
    greet: () => (new Date().getHours() < 13 ? 'Καλημέρα!' : 'Καλησπέρα!'),
    /* όνομα (⭐ αν star, σήμα προσωρινού), γραμμή από κάτω (HTML), δεξιά μικρό κείμενο (HTML) */
    head: (c, sub, right, star) => `<div class="shh"><div><h2>${star ? '⭐ ' : ''}${c ? PL.prospects.tag(c) + esc(c.name) : ''}</h2><div class="mu">${sub || ''}</div></div>${right ? `<div class="shstep">${right}</div>` : ''}</div>`,
    /* μεγάλα κουμπιά ενεργειών (2–4)· το τελευταίο φαρδύτερο */
    acts: (...b) => { const L = b.filter(Boolean); return `<div class="sha n${L.length}">${L.join('')}</div>`; },
    call: (c) => (c && PL.call.tels(c).length ? `<button data-callc="${esc(c.i)}">${PL.icon.phone}Κλήση</button>` : off(PL.icon.phone, 'Κλήση')),
    map: (c) => { const h = PL.call.mapUrl(c); return h ? `<a class="btn" href="${esc(h)}" target="_blank" rel="noopener">${PL.icon.pin}Οδηγίες</a>` : off(PL.icon.pin, 'Οδηγίες'); },
    sms: (c, body, label) => { const h = c && PL.call.sms(c, body); return h ? `<a class="btn" href="${esc(h)}" target="_blank" rel="noopener">${PL.icon.msg}${label || 'Μήνυμα'}</a>` : off(PL.icon.msg, label || 'Μήνυμα'); },
    /* με μια ματιά: Goldwell φέτος, χρέος, συμφωνία, δουλεύει (skip: {debt, deal, works} για όσα δείχνει ήδη το φύλλο) */
    facts: (c, skip) => {
      skip = skip || {}; const id = c.i, g = M.gold(c), y = M.yoy(c), bal = +((S.get('balances', id) || {}).amount || 0), dl = (S.get('deals', 'all') || {})[id], w = M.works(id);
      return `<div class="shfacts">${g ? chip('Goldwell φέτος ' + money(g[1]) + (y ? ' · ' + y.txt : ''), y && y.cls === 'dn' ? 'dn' : 'up') : ''}${!skip.debt && bal >= 1 ? chip('💶 Χρωστάει ' + money(bal), 'dn') : ''}` +
        `${!skip.deal && dl ? chip('🤝 Συμφωνία ' + Math.round(M.deal(dl).pct) + '%', 'dl') : ''}${!skip.works && w.length ? chip('Δουλεύει: ' + esc(w.join(', '))) : ''}</div>`;
    },
    box: (title, body, cls) => `<div class="shbox${cls ? ' ' + cls : ''}"><h3>${title}</h3>${body}</div>`,
    /* τελευταία καταγραφή στην καρτέλα (κείμενο, προϊόντα, «να πω») */
    last: (id) => { const e = M.entries(id).find((z) => z.text || z.todo || z.products);
      return PL.sheet.box('Τελευταία επαφή', e ? `<b>${esc(u.fd(e.d))}</b> ${esc(e.text || '')}${e.products ? ' <span class="mu">(' + esc(e.products) + ')</span>' : ''}${e.todo ? `<div><b>Να πω:</b> ${esc(e.todo)}</div>` : ''}` : '<span class="mu">Καμία σημείωση ακόμα</span>'); },
    /* κάτω: «‹ Λίστα» (πίσω) και «Όλη η καρτέλα ›» */
    nav: (id, back, mid) => `<div class="shnav"><button class="shlink" data-shback="1">‹ ${back || 'Λίστα'}</button>${mid || ''}${id ? `<button class="shlink" data-shcard="${esc(id)}">Όλη η καρτέλα ›</button>` : '<span></span>'}</div>`,
    /* λίστα γραμμών που ανοίγουν κάτι (δεξί μέρος χωρίς επιλογή): rows = [{attr, name, sub, right, cls}] */
    list: (rows, empty) => (rows.length ? `<div class="shl">${rows.map((r) => `<div class="shli" ${r.attr}><div><b>${r.name}</b>${r.sub ? `<div class="mu">${r.sub}</div>` : ''}</div><span class="${r.cls || ''}">${r.right || ''}</span></div>`).join('')}</div>` : `<p class="mu">${empty || 'Κανένας.'}</p>`),
  };
  /* «‹ Λίστα» και «Όλη η καρτέλα ›» για όλα τα φύλλα */
  document.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-shback],[data-shcard]'); if (!b) return;
    if (b.dataset.shback) PL.nav.back(); else PL.nav.push('client', { id: b.dataset.shcard });
  });
})();

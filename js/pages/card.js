/* «Η κάρτα μου» (κουμπί QR δίπλα στο ⚙️ στην Αρχική): QR με τα στοιχεία του πωλητή σε μορφή επαφής (vCard).
   Ο πελάτης το σκανάρει με την κάμερα και του ανοίγει «Αποθήκευση επαφής». Δουλεύει και χωρίς σήμα.
   Η οθόνη μένει σταθερή (όλα χωράνε, χωρίς κύλιση)· κουνιέται μόνο όταν ανοίξει η «Αλλαγή στοιχείων».
   Τα στοιχεία φυλάγονται στο settings/card και αλλάζουν από το «✏️ Αλλαγή στοιχείων». */
(function () {
  const PL = window.PL, u = PL.u, S = PL.store, D = PL.dlg, esc = u.esc, db = () => PL.adapter.db;
  const F = [['name', 'Όνομα'], ['title', 'Τίτλος'], ['org', 'Εταιρεία'], ['mobile', 'Κινητό'], ['phone', 'Σταθερό'], ['email', 'Email'],
    ['street', 'Διεύθυνση'], ['area', 'Περιοχή'], ['zip', 'Τ.Κ.'], ['city', 'Πόλη'], ['web1', 'Ιστοσελίδα'], ['web2', 'Ιστοσελίδα 2']];
  const vesc = (s) => String(s || '').trim().replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');
  const tel = (t) => String(t || '').replace(/[^\d+]/g, '');
  const url = (w) => (!w ? '' : /^https?:\/\//i.test(w) ? w : 'https://' + w);

  PL.card = {
    /* η επαφή όπως τη διαβάζει το κινητό του πελάτη (vCard 3.0, UTF-8) */
    vcard(c) {
      const p = String(c.name || '').trim().split(/\s+/), last = p.length > 1 ? p[p.length - 1] : '', first = p.length > 1 ? p.slice(0, -1).join(' ') : p[0] || '';
      const L = ['BEGIN:VCARD', 'VERSION:3.0', 'N:' + vesc(last) + ';' + vesc(first) + ';;;', 'FN:' + vesc(c.name)];
      if (c.org) L.push('ORG:' + vesc(c.org));
      if (c.title) L.push('TITLE:' + vesc(c.title));
      if (c.mobile) L.push('TEL;TYPE=CELL:' + tel(c.mobile));
      if (c.phone) L.push('TEL;TYPE=WORK,VOICE:' + tel(c.phone));
      if (c.email) L.push('EMAIL;TYPE=WORK:' + String(c.email).trim());
      if (c.street || c.city) L.push('ADR;TYPE=WORK:;;' + [c.street, c.city, c.area, c.zip, 'Ελλάδα'].map(vesc).join(';'));
      [c.web1, c.web2].filter(Boolean).forEach((w) => L.push('URL:' + url(String(w).trim())));
      L.push('END:VCARD');
      return L.join('\r\n');
    },
  };

  PL.register('card', {
    title: 'Η κάρτα μου',
    render(el) {
      el.innerHTML = `<h2>Η κάρτα μου</h2><div id="cdq"></div><div id="cdi" class="cdinfo"></div>
<p class="mu" style="text-align:center">Ο πελάτης σκανάρει το QR με την κάμερα του κινητού και αποθηκεύει την επαφή σου.</p>
<details id="cded" class="card" style="cursor:default"><summary style="cursor:pointer;color:var(--ac);font-weight:600">✏️ Αλλαγή στοιχείων</summary>
${F.map(([k, l]) => `<label>${l}</label><input id="cd_${k}" autocomplete="off">`).join('')}<p><button class="pri" id="cdsave">Αποθήκευση</button></p></details>`;
      const $ = (s) => el.querySelector(s);
      S.use('settings');
      /* σταθερή οθόνη (χωρίς κύλιση) όσο είναι κλειστή η «Αλλαγή στοιχείων» */
      const lock = () => el.classList.toggle('cdlock', !$('#cded').open);
      $('#cded').addEventListener('toggle', () => { lock(); if (!$('#cded').open) window.scrollTo(0, 0); });
      const paint = () => {
        if (!S.loaded('settings')) { $('#cdi').innerHTML = '<p class="mu" style="text-align:center">Φορτώνω…</p>'; return; }
        const c = S.get('settings', 'card') || {};
        if (!$('#cded').open) F.forEach(([k]) => { $('#cd_' + k).value = c[k] || ''; });
        if (!c.name) { $('#cdq').innerHTML = ''; $('#cdi').innerHTML = '<p class="mu" style="text-align:center">Συμπλήρωσε τα στοιχεία σου για να φτιαχτεί το QR.</p>'; $('#cded').open = true; return; }
        $('#cdq').innerHTML = `<div class="cdqr">${PL.qr.svg(PL.card.vcard(c))}</div>`;
        const ln = (x) => (x ? `<div>${esc(x)}</div>` : '');
        $('#cdi').innerHTML = `<div class="cdn">${esc(c.name)}</div>${c.title ? `<div class="cdt">${esc(c.title)}</div>` : ''}${ln(c.org)}${ln([c.mobile, c.phone].filter(Boolean).join(' · '))}${ln(c.email)}${ln([c.street, [c.area, c.zip, c.city].filter(Boolean).join(' ')].filter(Boolean).join(', '))}${ln([c.web1, c.web2].filter(Boolean).join(' · '))}`;
      };
      lock(); paint();
      const off = S.on('settings', paint);
      $('#cdsave').onclick = async () => {
        const doc = {}; F.forEach(([k]) => { doc[k] = $('#cd_' + k).value.trim(); });
        if (!doc.name) { D.toast('Γράψε τουλάχιστον το όνομα'); return; }
        try { await db().set('settings/card', doc); S.put('settings', 'card', doc); $('#cded').open = false; paint(); D.toast('Αποθηκεύτηκε'); }
        catch (e) { D.toast('Δεν αποθηκεύτηκε. Δοκίμασε ξανά.'); }
      };
      return off;
    },
  });
})();

/* Κλήση και Οδηγίες για έναν πελάτη — ένα σημείο για όλη την εφαρμογή.
   btn(tel, who, small): κουμπί με τον αριθμό (λίστες που δείχνουν ένα τηλέφωνο).
   cbtn(c, small): «📞 Κλήση» — με ένα τηλέφωνο ρωτά «σίγουρα;», με περισσότερα βγάζει επιλογή (Σταθερό / Κινητό).
   map(c, small) / mapUrl(c): «📍 Οδηγίες» — ανοίγει το Google Maps στη διεύθυνση του πελάτη.
   sms(c, body): σύνδεσμος Μηνυμάτων με έτοιμο κείμενο.
   Το παράθυρο (#callm) φτιάχνεται στο dialogs.js· τα πατήματα [data-call] / [data-callc] τα χειρίζεται αυτό το αρχείο.
   Οι σύνδεσμοι tel: / sms: ανοίγουν με target=_blank (όπως οι Οδηγίες): η σελίδα τρέχει μέσα σε πλαίσιο του claude.ai
   και ο σύνδεσμος πρέπει να «βγει» από το πλαίσιο για να ανοίξει η Κλήση / τα Μηνύματα του κινητού. */
(function () {
  const PL = window.PL, esc = PL.u.esc, $ = (id) => document.getElementById(id);
  const tels = (c) => [c && c.t1, c && c.t2].concat((c && c.more) || []).filter(Boolean);
  const kind = (t) => { const d = String(t).replace(/\D/g, '').replace(/^(00)?30(?=\d{10}$)/, ''); return /^69/.test(d) ? 'Κινητό' : /^2/.test(d) ? 'Σταθερό' : 'Τηλέφωνο'; };
  const href = (t) => 'tel:' + String(t).replace(/[^\d+]/g, '');
  const sm = (small) => (small ? ' style="padding:2px 8px"' : '');
  const mapUrl = (c) => {
    if (!c || !(c.addr || c.city)) return '';
    const q = [c.addr || c.name, [c.zip, c.city].filter(Boolean).join(' '), 'Ελλάδα'].filter(Boolean).join(', ');
    return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);
  };
  /* ένα τηλέφωνο: «Να γίνει κλήση…;» με κουμπί Κλήση· περισσότερα: ένα κουμπί ανά αριθμό (το πάτημα καλεί) */
  function open(who, list) {
    if (!list.length) return;
    const one = list.length === 1;
    $('callt').textContent = one ? 'Να γίνει κλήση στον «' + who + '» στο ' + list[0] + ';' : 'Κλήση στον «' + who + '»';
    $('calll').innerHTML = one ? '' : list.map((t) => `<a class="btn callo" href="${href(t)}" target="_blank" rel="noopener"><span>📞 ${kind(t)}</span><b>${esc(t)}</b></a>`).join('');
    $('cally').style.display = one ? '' : 'none';
    if (one) $('cally').href = href(list[0]);
    $('callm').style.display = 'flex';
  }
  PL.call = {
    tels, kind, mapUrl, open,
    first: (c) => tels(c)[0] || '',
    btn: (tel, who, small) => `<button class="callb" data-call="${esc(tel)}" data-who="${esc(who || '')}"${sm(small)}>📞 ${esc(tel)}</button>`,
    cbtn: (c, small) => (tels(c).length ? `<button class="callb" data-callc="${esc(c.i)}"${sm(small)}>📞 Κλήση</button>` : ''),
    map: (c, small) => { const h = mapUrl(c); return h ? `<a class="btn callb" href="${esc(h)}" target="_blank" rel="noopener"${sm(small)}>📍 Οδηγίες</a>` : ''; },
    /* SMS με έτοιμο κείμενο προς το κινητό του πελάτη (χωρίς κινητό: ανοίγει χωρίς παραλήπτη). Το στέλνει ο πωλητής. */
    sms: (c, body) => 'sms:' + (c ? PL.names.mobile(c) : '') + (body ? (/iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent) ? '&' : '?') + 'body=' + encodeURIComponent(body) : ''),
  };
  document.addEventListener('click', (ev) => {
    const k = ev.target.closest('[data-call],[data-callc]'); if (!k || k.disabled) return;
    if (k.dataset.call) open(k.dataset.who || '', [k.dataset.call]);
    else { const c = PL.model.byId(k.dataset.callc); if (c) open(c.name, tels(c)); }
  });
})();

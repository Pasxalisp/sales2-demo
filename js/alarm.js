/* Ειδοποίηση την ώρα μιας εκκρεμότητας (κόκκινο πλαίσιο πάνω, δόνηση, κουμπί Κλήση, ΟΚ).
   Όπως στην παλιά σελίδα: έλεγχος κάθε 30″ όσο η σελίδα είναι ανοιχτή· κάθε ειδοποίηση χτυπά μία φορά (το θυμάται και μετά από ανανέωση). */
(function () {
  const PL = window.PL, u = PL.u, esc = u.esc, K = 'alarmed';
  let A = {}; try { A = JSON.parse(localStorage.getItem(K) || '{}'); } catch (e) { /* χωρίς αποθήκευση */ }
  const hhmm = () => { const d = new Date(); return u.pad(d.getHours()) + ':' + u.pad(d.getMinutes()); };

  function show(c, e) {
    try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch (x) { /* τίποτα */ }
    const tel = PL.call.first(c), b = document.createElement('div'); b.className = 'alarm';
    b.style.cssText = 'position:fixed;left:12px;right:12px;top:calc(12px + env(safe-area-inset-top,0px));z-index:80;background:#d9382f;color:#fff;border-radius:14px;padding:14px;box-shadow:0 8px 24px rgba(0,0,0,.3);font-size:16px';
    b.innerHTML = '⏰ <b>' + esc(e.nt) + ' · ' + esc(c.name) + '</b><br>' + esc(e.todo || e.text || 'Εκκρεμότητα') + '<div style="display:flex;gap:8px;margin-top:10px">' +
      (tel ? '<a href="tel:' + esc(String(tel).replace(/[^\d+]/g, '')) + '" style="background:#fff;color:#d9382f;border-radius:10px;padding:8px 12px;font-weight:600;text-decoration:none">📞 Κλήση</a>' : '') +
      '<button style="background:transparent;color:#fff;border:1px solid #fff">ΟΚ</button></div>';
    b.querySelector('button').onclick = () => b.remove();
    document.body.appendChild(b);
  }
  function check() {
    if (!PL.store.loaded('notes')) return;
    const t = u.today(), h = hhmm();
    PL.model.dueList().forEach(({ c, e, tid }) => {
      if (!e.nt || e.next !== t || e.nt > h) return;
      const k = (tid || (c && c.i)) + '|' + e.next + '|' + e.nt;
      if (A[k]) return; A[k] = 1;
      try { localStorage.setItem(K, JSON.stringify(A)); } catch (x) { /* τίποτα */ }
      show(c || { name: e.todo, t1: '', t2: '' }, e);
    });
  }
  PL.alarm = { check };
  PL.tick.add(check, 30);
  setTimeout(check, 4000);
})();

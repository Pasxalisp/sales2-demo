/* ΕΙΔΟΠΟΙΗΣΗ ΚΑΤΑΘΕΣΗΣ ΠΕΛΑΤΗ (απόφαση Πασχάλη 28/11/2026).
   Τα υπόλοιπα (balances) τα ενημερώνει το λογιστήριο· κανείς άλλος δεν τα αλλάζει (μόνο ο διαχειριστής για διόρθωση λάθους).
   Όταν το υπόλοιπο ενός πελάτη ΜΕΙΩΘΕΙ σε σχέση με την τελευταία φορά που το είδε αυτή η συσκευή, ήρθε κατάθεση:
   μήνυμα «💶 ΠΕΛΑΤΗΣ: κατάθεση 2.000,00 €» (αν είναι πολλές: η μεγαλύτερη + πόσες ακόμα).
   Τι είδε η συσκευή: localStorage 'pl.balSeen.<χρήστης>' = {πελάτης: ποσό}. Πρώτη φορά σε μια συσκευή: κρατά μόνο τα ποσά (χωρίς μήνυμα).
   Ρύθμιση: Ρυθμίσεις → Ειδοποιήσεις → «Κατάθεση πελάτη» (PL.notify 'dep', js/notify.js· ανοιχτή αν δεν την άλλαξες).
   Ο τεχνικός δεν βλέπει ποσά (PL.can('money')): δεν τρέχει. */
(function () {
  const PL = window.PL, u = PL.u, S = PL.store;
  const org = () => PL.adapter.org, key = () => 'pl.balSeen.' + ((org() && org().me && org().me.id) || PL.adapter.userId() || 'me');
  const read = () => { try { return JSON.parse(localStorage.getItem(key()) || 'null'); } catch (e) { return null; } };
  const write = (m) => { try { localStorage.setItem(key(), JSON.stringify(m)); } catch (e) { /* χωρίς μνήμη: ξαναμετρά την επόμενη φορά */ } };
  const amounts = () => { const m = {}; Object.entries(S.all('balances')).forEach(([id, b]) => { if (b) m[id] = Math.round((+b.amount || 0) * 100) / 100; }); return m; };

  PL.deposit = {
    /* καταθέσεις από την τελευταία φορά: [{id, name, v}] (η μεγαλύτερη πρώτη)· ενημερώνει τι είδε η συσκευή */
    check() {
      if (!S.loaded('balances')) return [];   /* πριν φτάσουν τα υπόλοιπα δεν συγκρίνει (ούτε σβήνει όσα είχε δει) */
      const now = amounts(), seen = read(), L = [];
      if (seen) Object.entries(now).forEach(([id, a]) => { const v = Math.round(((seen[id] || 0) - a) * 100) / 100; if (id in seen && v >= 1) { const c = PL.model.byId(id); if (c) L.push({ id, name: c.name, v }); } });
      write(Object.assign({}, seen || {}, now));
      return L.sort((a, b) => b.v - a.v);
    },
    say: (L) => '💶 ' + L[0].name + ': κατάθεση ' + u.money(L[0].v) + (L.length > 1 ? ' (+' + (L.length - 1) + (L.length === 2 ? ' ακόμα)' : ' ακόμα)') : ''),
  };

  function watch() {
    if (!PL.can('money')) return;
    Promise.all([S.use('balances'), S.use('settings'), S.use('clients'), S.use('prospects')]).then(() => {
      const tell = () => { const L = PL.deposit.check(); if (L.length && PL.notify.on('dep')) PL.dlg.toast(PL.deposit.say(L)); };
      tell(); S.on('balances', tell);
    });
  }
  PL.bus.on('started', watch);
})();

/* ΕΙΔΟΠΟΙΗΣΕΙΣ: ποιες είναι ανοιχτές (απόφαση Πασχάλη 28/11/2026, «όλες στις Ρυθμίσεις με κουμπί on/off»).
   Ένα έγγραφο settings/notify = {κλειδί: false} για όσες έκλεισε ο χρήστης· όσες δεν έχουν τιμή είναι ανοιχτές.
   Κλειδιά: dep (κατάθεση πελάτη, js/deposit.js) · alarm (κόκκινο πλαίσιο την ώρα της εκκρεμότητας, js/alarm.js) ·
   badge (αριθμός στο «Ημερολόγιο» της κάτω μπάρας, js/model.js). Τα αιτήματα τεχνικού έχουν τα δικά τους (settings/tnotify, js/treq.js).
   Η μπάρα «Νέα έκδοση» δεν κλείνει ποτέ (απόφαση 28/11). Κάθε αλλαγή: PL.bus 'notify' (κλειδί). */
(function () {
  const PL = window.PL, S = PL.store;
  PL.notify = {
    on: (k) => { const s = S.get('settings', 'notify') || {}; return s[k] !== false; },
    async set(k, on) {
      const d = Object.assign({}, S.get('settings', 'notify') || {}, { [k]: !!on });
      await PL.adapter.db.set('settings/notify', d); S.put('settings', 'notify', d);
      PL.bus.emit('notify', k);
    },
  };
})();

/* ΜΝΗΜΗ ΤΗΣ ΣΥΣΚΕΥΗΣ για το db.html (απόφαση Πασχάλη 18/11/2026: «ανοίγει με τη μνήμη της συσκευής και μετά,
   όταν συνδεθώ στο ίντερνετ, ενημερώνεται με τη βάση»). Απλή αποθήκη κλειδί → τιμή πάνω στο IndexedDB του browser
   (χωράει πολλά MB, όχι όπως το localStorage). Τι φυλάμε και πότε το αποφασίζει το lab/supa/session.js.
   Αν ο browser δεν δίνει IndexedDB (π.χ. ιδιωτική περιήγηση), όλα δουλεύουν κανονικά: απλώς δεν θυμάται τίποτα
   (get → null, set/del → τίποτα) και η εφαρμογή ανοίγει από τη βάση όπως πριν. */
window.PL_SUPA_STORE = (function () {
  const DB = 'sales2-db', STORE = 'kv';
  let opening = null;
  function open() {
    if (!opening) {
      opening = new Promise((res) => {
        try {
          const r = indexedDB.open(DB, 1);
          r.onupgradeneeded = () => r.result.createObjectStore(STORE);
          r.onsuccess = () => res(r.result);
          r.onerror = () => res(null);
          r.onblocked = () => res(null);
        } catch (e) { res(null); }
      });
    }
    return opening;
  }
  /* μία κίνηση στην αποθήκη· οποιοδήποτε πρόβλημα → fallback (η μνήμη είναι βοήθεια, όχι απαραίτητη) */
  async function run(mode, act, fallback) {
    const db = await open(); if (!db) return fallback;
    return new Promise((res) => {
      try {
        const tx = db.transaction(STORE, mode), req = act(tx.objectStore(STORE));
        tx.oncomplete = () => res(req && mode === 'readonly' ? (req.result === undefined ? null : req.result) : true);
        tx.onerror = tx.onabort = () => res(fallback);
      } catch (e) { res(fallback); }
    });
  }
  return {
    get: (k) => run('readonly', (s) => s.get(k), null),
    set: (k, v) => run('readwrite', (s) => { s.put(v, k); }, false),
    del: (k) => run('readwrite', (s) => { s.delete(k); }, false),
  };
})();

/* ΚΑΔΟΣ (απόφαση Πασχάλη 18/11/2026, Β10): ό,τι διαγράφεις μένει 30 μέρες στον κάδο και επαναφέρεται με ένα πάτημα.
   Μετά τη διαγραφή βγαίνει μήνυμα «… στον κάδο · Αναίρεση» (6″)· αργότερα: Ρυθμίσεις → Κάδος (js/pages/trash.js).
   Συλλογή trash/{id} = { k, label, at, … }:
     k 'doc'  : ολόκληρο έγγραφο (παραγγελία, πρόγραμμα, πρόχειρο προγράμματος, σεμινάριο, καμπάνια, λιανική, σημείωση υπολοίπου)
                → { path, data }· επαναφορά = γράφεται ξανά στη θέση του, μόνο αν δεν υπάρχει ήδη εκεί κάτι άλλο.
     k 'note' : μία καταγραφή από τις σημειώσεις πελάτη → { cid, entry }· επαναφορά = μπαίνει ξανά στη θέση της (κατά ημερομηνία),
                χωρίς να αγγίξει όσες γράφτηκαν στο μεταξύ (PL.notes, το μόνο σημείο που γράφει σημειώσεις).
   Πρώτα φυλάγεται στον κάδο και μετά σβήνεται· αν το σβήσιμο αποτύχει (π.χ. χωρίς σύνδεση), φεύγει και από τον κάδο.
   Οι εσωτερικές διαγραφές του προγράμματος (π.χ. άδειο πρόγραμμα μετά από μεταφορά πελάτη, πρόχειρο που αποθηκεύτηκε) δεν
   περνούν από εδώ: δεν είναι διαγραφές του χρήστη. */
(function () {
  const PL = window.PL, S = PL.store, db = () => PL.adapter.db;
  const COL = 'trash', DAYS = 30, DAY = 864e5;
  const colOf = (p) => p.slice(0, p.lastIndexOf('/')), idOf = (p) => p.slice(p.lastIndexOf('/') + 1);
  const newId = () => 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const left = (t) => Math.max(0, DAYS - Math.floor((Date.now() - Date.parse(t.at)) / DAY));   // μέρες που μένουν στον κάδο
  /* ό,τι είναι στον κάδο, το πιο πρόσφατο πρώτο (χωρίς όσα έληξαν) */
  const list = () => Object.entries(S.all(COL)).filter(([, t]) => t && t.at && left(t) > 0).map(([id, t]) => Object.assign({ id, left: left(t) }, t))
    .sort((a, b) => (a.at < b.at ? 1 : -1));
  /* όσα πέρασαν τις 30 μέρες σβήνονται οριστικά (στο φύλαγμα και όταν ανοίγει ο κάδος) */
  async function purge() {
    await S.use(COL);
    for (const [id, t] of Object.entries(S.all(COL))) if (!t || !t.at || left(t) <= 0) { try { await db().remove(COL + '/' + id); S.drop(COL, id); } catch (e) { return; } }
  }
  async function keep(x) {
    await S.use(COL);
    const id = newId(), doc = Object.assign({ at: new Date().toISOString() }, x);
    await db().set(COL + '/' + id, doc); S.put(COL, id, doc);
    purge().catch(() => {});
    return id;
  }
  const forget = async (id) => { try { await db().remove(COL + '/' + id); } catch (e) { /* μένει και λήγει μόνο του */ } S.drop(COL, id); };
  const undo = (id, label) => PL.dlg.toast('🗑 ' + label + ' · στον κάδο', { label: 'Αναίρεση', fn: () => { restore(id).catch(() => PL.dlg.toast('Δεν έγινε επαναφορά. Δοκίμασε ξανά από τον Κάδο.')); } });

  /* διαγραφή ολόκληρου εγγράφου (path: «συλλογή/id»), με θέση στον κάδο */
  async function doc(path, label) {
    const c = colOf(path), i = idOf(path);
    let data = S.get(c, i); if (data == null) data = await db().get(path);
    if (data == null) return;
    const id = await keep({ k: 'doc', path, data, label });
    try { await db().remove(path); } catch (e) { await forget(id); throw e; }
    S.drop(c, i); undo(id, label);
  }
  /* διαγραφή μίας καταγραφής από τις σημειώσεις ενός πελάτη */
  async function note(cid, entry, label) {
    const id = await keep({ k: 'note', cid, entry, label });
    try { await PL.notes.remove(cid, entry); } catch (e) { await forget(id); throw e; }
    undo(id, label);
  }
  /* επαναφορά· true αν έγινε */
  async function restore(id) {
    await S.use(COL);
    const t = S.get(COL, id) || await db().get(COL + '/' + id); if (!t) return false;
    if (t.k === 'doc') {
      const c = colOf(t.path), i = idOf(t.path);
      if (await db().get(t.path)) { PL.dlg.toast('Υπάρχει ήδη κάτι στη θέση του «' + t.label + '» — δεν έγινε επαναφορά.'); return false; }
      await db().set(t.path, t.data); S.put(c, i, t.data);
    } else if (t.k === 'note') {
      await PL.notes.update(t.cid, (d) => {
        if (d.entries.some((e) => PL.notes.same(e, t.entry))) return;
        const k = d.entries.findIndex((e) => (e.d || '') < (t.entry.d || ''));
        d.entries.splice(k < 0 ? d.entries.length : k, 0, t.entry);
      });
    } else return false;
    await forget(id);
    PL.dlg.toast('↩ Επαναφέρθηκε: ' + t.label);
    return true;
  }
  PL.trash = { DAYS, doc, note, restore, list, purge };
})();

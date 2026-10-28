/* ΣΗΜΕΙΩΣΕΙΣ ΠΕΛΑΤΗ (notes/{id}): το ΜΟΝΟ σημείο που τις γράφει (καρτέλα, Υπαγόρευση, Εκκρεμότητες, Πρόγραμμα, ένωση προσωρινού).
   Κάθε αλλαγή διαβάζει πρώτα την πιο φρέσκια εγγραφή από τη βάση, όχι την εικόνα της συσκευής, ώστε όταν γράφεις
   από κινητό και τάμπλετ να μη σβήνει η μία συσκευή τις καταγραφές της άλλης.
   Καταγραφές βρίσκονται με το περιεχόμενό τους (ημερομηνία, κείμενο, να πω, προϊόντα, επόμενη), όχι με τη θέση τους. */
(function () {
  const PL = window.PL, S = PL.store, db = () => PL.adapter.db;
  const same = (a, b) => !!a && !!b && a.d === b.d && (a.text || '') === (b.text || '') && (a.todo || '') === (b.todo || '') &&
    (a.products || '') === (b.products || '') && (a.next || '') === (b.next || '');

  /* fn(doc) αλλάζει το έγγραφο (έχει πάντα code, name, works[], entries[]). */
  async function update(id, fn) {
    const c = PL.model.byId(id) || {};
    let fresh = null;
    try { fresh = await db().get('notes/' + id); } catch (e) { fresh = null; /* χωρίς σύνδεση: η εγγραφή παρακάτω θα αποτύχει με μήνυμα */ }
    const cur = fresh || S.get('notes', id) || {};
    const doc = Object.assign({ code: c.code || '', name: c.name || '' }, cur, { works: (cur.works || []).slice(), entries: (cur.entries || []).slice() });
    fn(doc);
    await db().set('notes/' + id, doc); S.put('notes', id, doc);
    return doc;
  }

  PL.notes = {
    same,
    update,
    /* νέα καταγραφή πρώτη· works: όσα «Δουλεύει ήδη» προστίθενται */
    add: (id, entry, works) => update(id, (d) => { d.entries.unshift(entry); if (works && works.length) d.works = [...new Set(d.works.concat(works))]; }),
    remove: (id, entry) => update(id, (d) => { const k = d.entries.findIndex((e) => same(e, entry)); if (k >= 0) d.entries.splice(k, 1); }),
    /* αλλάζει πεδία σε συγκεκριμένες καταγραφές (π.χ. ✓ Έγινε) */
    mark: (id, entries, patch) => update(id, (d) => { d.entries = d.entries.map((e) => (entries.some((x) => same(e, x)) ? Object.assign({}, e, patch) : e)); }),
    setWorks: (id, works) => update(id, (d) => { d.works = works.slice(); }),
  };
})();

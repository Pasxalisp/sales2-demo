/* Σημειώσεις προγράμματος από το Claude: χτίζει τις γραμμές πελατών και το αίτημα, και διαβάζει την απάντηση.
   Δεν αποφασίζει το Claude ποιοι μπαίνουν (το κάνει η μηχανή)· γράφει μόνο why (γιατί) και say (τι να πεις). */
(function () {
  const PL = window.PL, u = PL.u, M = PL.model, S = PL.store, E = PL.plans;
  const r0 = (x) => Math.round(+x || 0);

  const brandLine = (id) => { const d = (S.get('brands', 'all') || {})[id]; if (!d) return ''; return Object.keys(d).filter((k) => Array.isArray(d[k]) && d[k].some((x) => Math.abs(+x || 0) >= 1)).map((k) => (M.BRL[k] || k) + ' ' + r0(d[k][0]) + '→' + r0(d[k][1])).join('; '); };
  const catLine = (id) => { const d = (S.get('cats', 'all') || {})[id]; if (!d) return ''; return M.CATN.filter((k) => Array.isArray(d[k]) && d[k].some((x) => x)).map((k) => { const [a, b, f] = d[k].map(r0); return (M.CATL[k] || k) + ' ' + a + '→' + b + (f !== a ? ' (όλο πέρσι ' + f + ')' : '') + (a > 0 && b <= 0 ? ' ΣΤΑΜΑΤΗΣΕ' : ''); }).join('; '); };
  const itemsLine = (id) => {
    const d = S.get('items', id); if (!d || !Array.isArray(d.it)) return '';
    const gs = {}; d.it.forEach((x) => { if ((+x.tc || 0) > 0) { const g = x.g || 'Άλλα'; gs[g] = (gs[g] || 0) + (+x.tc || 0); } });
    const gtx = Object.entries(gs).sort((a, b) => b[1] - a[1]).map(([g, v]) => g + ' ' + r0(v) + '€').join(', ');
    const now = d.it.filter((x) => (+x.tc || 0) > 0).sort((a, b) => b.tc - a.tc).slice(0, 10).map((x) => x.n + ' (' + (x.qc || 0) + ')');
    const lost = d.it.filter((x) => (+x.tc || 0) <= 0 && (+x.tp || 0) > 0).sort((a, b) => b.tp - a.tp).slice(0, 6).map((x) => x.n);
    return (gtx ? 'φέτος ανά κατηγορία: ' + gtx + ' | ' : '') + (now.length ? 'είδη φέτος: ' + now.join(', ') : '') + (lost.length ? ' | πέρσι ναι, φέτος όχι: ' + lost.join(', ') : '');
  };
  const dealTag = (id) => { const x = (S.get('deals', 'all') || {})[id]; if (!x || !x.goal) return ''; const i = M.deal(x); return 'ΣΥΜΦΩΝΙΑ ' + r0(x.goal) + '€: έχει κάνει ' + r0(i.pct) + '%' + (i.done ? ' (ΤΗΝ ΠΙΑΣΕ)' : ', μένουν ' + r0(i.left) + '€' + (i.ahead < 0 ? ' — ΠΙΣΩ από τον ρυθμό κατά ' + r0(-i.ahead) + '€' : '')); };

  /* Μία γραμμή πελάτη. tag = ετικέτες ειδικών περιπτώσεων. */
  const row = (c, t, tag) => {
    const g = M.gold(c), nt = S.get('notes', c.i) || {}, es = (nt.entries || []).slice(0, 3);
    const last = es.map((x) => (`[${x.d}] ${x.text || ''}${x.products ? ' (προϊόντα: ' + x.products + ')' : ''}${x.todo ? ' — ΝΑ ΠΩ: ' + x.todo : ''}${x.next ? ' — επόμενη επαφή: ' + x.next + (x.next <= t ? ' (ΕΧΕΙ ΛΗΞΕΙ)' : '') : ''}`).slice(0, 300)).join(' ; ');
    return [c.i, (tag ? '[' + tag + '] ' : '') + c.name + ((c.alt || []).length ? ' / ' + c.alt.join(' / ') : ''), c.city, (c.addr || '') + (E.areaOf(c) ? ' (' + E.areaOf(c) + ')' : ''), 'τζίρος ' + r0(M.tz(c)) + '€',
      g ? 'Goldwell φέτος ' + r0(g[1]) + ' / πέρσι ίδια περίοδο ' + r0(g[0]) + ' / πέρσι όλο ' + r0(g[2]) : 'Goldwell: —', 'δουλεύει: ' + (M.works(c.i).join(', ') || '—'),
      'κατηγορίες πέρσι→φέτος: ' + (catLine(c.i) || '—'), 'μάρκες πέρσι→φέτος: ' + (brandLine(c.i) || '—'), itemsLine(c.i) || 'είδη: —', last || 'καμία σημείωση'].join(' | ');
  };
  E.row = row;

  const tagOf = (c, ctx) => {
    const id = c.i, t = [];
    if (S.get('sos', id)) t.push('SOS — ΕΠΕΙΓΩΝ');
    const dt = dealTag(id); if (dt) t.push(dt);
    if (E.manual(id) && !(M.tz(c) > 0)) t.push('ΤΟΝ ΕΧΕΙ ΒΑΛΕΙ Ο ΠΩΛΗΤΗΣ ΧΕΙΡΟΚΙΝΗΤΑ ΣΕ ΠΡΟΓΡΑΜΜΑ — να μπαίνει πάντα');
    if (E.owes(id)) { const b = E.owB(id); t.push('ΧΡΩΣΤΑΕΙ ' + r0(b.a) + '€' + (b.o >= 1 ? ', ληξιπρόθεσμα ' + r0(b.o) + '€' : '') + (b.x > 0 ? ', ακάλυπτες' : '') + ' — να μπει οπωσδήποτε για είσπραξη'); }
    const tc = S.get('tech', id); if (tc) t.push('ΧΡΕΙΑΖΕΤΑΙ ΤΕΧΝΙΚΟ' + (tc.note ? ': ' + tc.note : ''));
    if (c.prospect) t.push('ΝΕΟΣ ΠΡΟΣΩΠΙΝΟΣ ΠΕΛΑΤΗΣ, τηλ ' + (c.t1 || '—'));
    else if (ctx.zset.has(id)) t.push('ΧΩΡΙΣ ΤΖΙΡΟ');
    else if (ctx.recentTouch.has(id)) t.push('ΠΡΟΣΦΑΤΗ ΕΠΑΦΗ ΧΩΡΙΣ ΤΖΙΡΟ (' + ctx.touch[id] + ')');
    return t.join(', ');
  };

  /* Παράγει τις στάσεις. all = πελάτες που μπαίνουν. onProgress(k, N). */
  E.generate = async function (cities, all, ctx, onProgress) {
    const t = u.today(), d = new Date(), days = ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'];
    const rows = all.map((c) => row(c, t, tagOf(c, ctx))).join('\n');
    const prompt = `Είσαι βοηθός πωλητή προϊόντων κομμωτηρίου με κατηγορίες: Topchic, Colorance, Gloss tones, Silklift, Subbrand, Dualsenses, Styling, Elumen. Ετοίμασε σημειώσεις για πρόγραμμα επισκέψεων στις περιοχές: ${cities.join(', ')}. Σήμερα είναι ${t} (${days[d.getDay()]}).
Η λίστα έχει ΗΔΗ τους πελάτες που θα επισκεφθεί.${ctx.mode === 'new' ? ' Είναι πρόγραμμα ΜΟΝΟ για όσους δεν επισκέφθηκε αυτόν τον μήνα.' : ctx.mode === 'rest' ? ' Είναι δεύτερο πρόγραμμα για την ίδια περιοχή, με όσους ΔΕΝ μπήκαν στο ενεργό πρόγραμμα.' : ''} ΔΕΝ επιλέγεις εσύ· πρέπει να εμφανίζονται ΟΛΟΙ, ακριβώς μία φορά ο καθένας.
Μορφή γραμμής: id | όνομα | πόλη | διεύθυνση | τζίρος φέτος | Goldwell φέτος / πέρσι | δουλεύει ήδη | κατηγορίες πέρσι ίδια περίοδο→φέτος | τελευταίες σημειώσεις. Χρησιμοποίησε τις κατηγορίες: αν κάποια «ΣΤΑΜΑΤΗΣΕ» ή πέφτει πολύ, πες στον πωλητή να ρωτήσει γιατί και να την ξαναπροτείνει· αν αγοράζει κάτι νέο, πρότεινε συμπληρωματική κατηγορία (νεότερη πρώτη).
Για κάθε πελάτη γράψε why (μία πρόταση με πραγματικά στοιχεία) και say (2-4 σύντομα σημεία τι να πει, μόνο με βάση τα δεδομένα). Μην επινοείς γεγονότα ή ποσά. Ο τζίρος δεν περιλαμβάνει Kerasilk και Moroccanoil, και η σύγκριση με πέρσι αφορά μόνο Goldwell.
Ειδικές περιπτώσεις: οι [SOS — ΕΠΕΙΓΩΝ] τους σημείωσε ο πωλητής ως επείγοντες· βάλ' τους πρώτους στην πόλη τους. Οι [ΝΕΟΣ ΠΡΟΣΩΠΙΝΟΣ ΠΕΛΑΤΗΣ] είναι νέοι (τηλεφώνησε ή επισκέψου για ραντεβού). Οι [ΧΩΡΙΣ ΤΖΙΡΟ] δεν αγοράζουν· πρότεινε 1-2 προϊόντα να δοκιμάσουν. Οι [ΠΡΟΣΦΑΤΗ ΕΠΑΦΗ ΧΩΡΙΣ ΤΖΙΡΟ] δεν έχουν τζίρο αλλά ο πωλητής τους είδε ή μίλησε μαζί τους τους τελευταίους 6 μήνες· στηρίξου στις σημειώσεις του για το why/say και βοήθησέ τον να κλείσει πρώτη παραγγελία.
Η σειρά της διαδρομής γίνεται αυτόματα κατά διεύθυνση, οπότε μην ασχοληθείς με αυτήν· στο why τόνισε όσους έχουν εκκρεμότητα που έχει λήξει ή «ΝΑ ΠΩ» και όσους με μεγάλο τζίρο πέφτουν σε σχέση με πέρσι.
Απάντησε ΜΟΝΟ με JSON: {"stops":[{"customer_id":"","why":"","say":[""]}],"note":""}. Στο note γράψε μία σύντομη σημείωση μόνο αν κάτι είναι σημαντικό.

ΠΕΛΑΤΕΣ:
${rows}`;
    const N = all.length;
    const r = await PL.adapter.ai.json(prompt, { modelTier: 'default', cache: false, onText: ({ text }) => { onProgress && onProgress(Math.min(N, (String(text).match(/"customer_id"/g) || []).length), N); } });
    const ids = new Set(all.map((c) => c.i)), seen = new Set(), stops = [];
    ((r && r.stops) || []).forEach((s) => { if (ids.has(s.customer_id) && !seen.has(s.customer_id)) { seen.add(s.customer_id); stops.push({ id: s.customer_id, why: s.why || '', say: Array.isArray(s.say) ? s.say : [], done: false, zero: ctx.zset.has(s.customer_id), sos: !!S.get('sos', s.customer_id) }); } });
    all.forEach((c) => { if (!seen.has(c.i)) stops.push({ id: c.i, why: '', say: [], done: false, zero: ctx.zset.has(c.i), sos: !!S.get('sos', c.i) }); });
    return { stops: E.routeSort(stops), note: (r && r.note) || '' };
  };

  /* Νέα πρόταση για πελάτη χωρίς τζίρο που αντικαθιστά άλλον (🔄). */
  E.suggestOne = async (c) => {
    const r = await PL.adapter.ai.json(`Είσαι βοηθός πωλητή προϊόντων κομμωτηρίου (κατηγορίες: Topchic, Colorance, Gloss tones, Silklift, Subbrand, Dualsenses, Styling, Elumen). Ο πελάτης παρακάτω δεν αγοράζει (χωρίς τζίρο) και ο πωλητής θα τον επισκεφθεί για να τον ξανανοίξει. Γράψε why (μία πρόταση με τα πραγματικά στοιχεία) και say (2-3 σύντομα σημεία, π.χ. 1-2 προϊόντα να δοκιμάσει). Μην επινοείς γεγονότα ή ποσά. Απάντησε ΜΟΝΟ με JSON: {"why":"","say":[""]}\n\n${row(c, u.today(), 'ΧΩΡΙΣ ΤΖΙΡΟ')}`, { modelTier: 'quick', cache: false });
    return { why: (r && r.why) || '', say: Array.isArray(r && r.say) ? r.say : [] };
  };
})();

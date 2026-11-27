/* ΕΜΦΑΝΙΣΗ ΝΕΑΣ ΣΕΛΙΔΑΣ: μόνο στο κινητό οι μπάρες των γραφημάτων μεγαλώνουν όταν ανοίγει η σελίδα (μόνο CSS, με την κλάση
   .pgnew της σελίδας: css/charts.css). Στο τάμπλετ/υπολογιστή καμία κίνηση (απόφαση Πασχάλη 28/11/2026· πριν τα κουτιά ανέβαιναν
   ένα ένα, από 18/11). Μόνο όταν η σελίδα ανοίγει «προς τα μέσα» ή από την κάτω μπάρα / Αρχική — όχι στο «Πίσω», στο σύρσιμο ή
   στη στροφή οθόνης. Το core.js (show) καλεί PL.enter.play(σελίδα, τρόπος). Με «Μείωση κίνησης» τίποτα. */
(function () {
  const PL = window.PL;
  const REDUCE = matchMedia('(prefers-reduced-motion: reduce)');
  const NEW_MS = 1500;    // όσο η σελίδα θεωρείται «μόλις άνοιξε» (μπάρες που γράφονται λίγο μετά)
  const OPEN = new Set(['push', 'tab']);
  function play(page, how) {
    if (!page || !OPEN.has(how) || REDUCE.matches || PL.WIDE.matches) return;
    page.classList.add('pgnew');
    setTimeout(() => page.classList.remove('pgnew'), NEW_MS);
  }
  PL.enter = { play };
})();

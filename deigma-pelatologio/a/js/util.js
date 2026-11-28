/* Μικρά κοινά εργαλεία: κείμενο, χρήματα, ημερομηνίες. */
(function () {
  const PL = (window.PL = window.PL || {});
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  const money = (n) => (n == null ? '' : Number(n).toLocaleString('el-GR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €');
  const eur = (n) => Math.round(n).toLocaleString('el-GR') + ' €';
  const pad = (n) => String(n).padStart(2, '0');
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  const fd = (d) => (d ? String(d).split('-').reverse().join('/') : '');
  /* Αναζήτηση: χωρίς τόνους, πεζά, ς=σ. */
  const nn = (s) => String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ς/g, 'σ').trim();
  PL.u = { esc, money, eur, today, fd, nn, pad };
})();
